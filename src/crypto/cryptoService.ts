import type {
  AppLockConfig,
  AppLockMode,
  FacilitySettings,
  JournalEntry,
  PeriodicEvaluation,
  ProgramModificationAnnex,
  StudentProfile,
} from '../types/domain';
import {
  MAX_ARCHIVE_BYTES,
  MAX_DECRYPTED_BYTES,
  validateFullDatabaseBundle,
  validateSingleStudentBundle,
} from '../validation/bundleValidation';

export type ArchiveScope = 'SINGLE_STUDENT' | 'FULL_DATABASE';

export interface EncryptedArchiveEnvelope {
  format: 'TECZKA_WSPARCIA_ENCRYPTED';
  version: 1;
  scope: ArchiveScope;
  algorithm: 'AES-GCM';
  kdf: 'PBKDF2-SHA256';
  iterations: number;
  salt: string;
  iv: string;
  ciphertext: string;
  exportedAt: string;
}

export interface SingleStudentBundle {
  kind: 'SINGLE_STUDENT_BUNDLE';
  student: StudentProfile;
  journalEntries: JournalEntry[];
  evaluations: PeriodicEvaluation[];
  annexes: ProgramModificationAnnex[];
}

export interface FullDatabaseBundle {
  kind: 'FULL_DATABASE_BUNDLE';
  facilitySettings: Omit<FacilitySettings, 'appLock'>;
  students: StudentProfile[];
  journalEntries: JournalEntry[];
  evaluations: PeriodicEvaluation[];
  annexes: ProgramModificationAnnex[];
}

const PBKDF2_ITERATIONS = 210_000;

function getCryptoRoot(): Crypto {
  if (
    typeof globalThis === 'undefined' ||
    !globalThis.crypto ||
    !globalThis.crypto.subtle
  ) {
    throw new Error(
      'Przeglądarka nie udostępnia natywnego Web Crypto API (wymagane bezpieczne środowisko HTTPS/localhost).',
    );
  }
  return globalThis.crypto;
}

function ensureWebCrypto(): SubtleCrypto {
  return getCryptoRoot().subtle;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

function base64ToBytes(base64: string): Uint8Array<ArrayBuffer> {
  const binary = atob(base64);
  const buffer = new ArrayBuffer(binary.length);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function toArrayBuffer(view: Uint8Array): ArrayBuffer {
  const copy = new ArrayBuffer(view.byteLength);
  new Uint8Array(copy).set(view);
  return copy;
}

/**
 * Generuje kryptograficznie losowe, czytelne silne hasło tymczasowe (np. K7mP-9xRq-4vBn-2wZc).
 */
export function generateStrongPassword(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
  const randomBytes = new Uint8Array(16);
  getCryptoRoot().getRandomValues(randomBytes);

  const chars: string[] = [];
  for (let i = 0; i < 16; i += 1) {
    const idx = randomBytes[i] % alphabet.length;
    chars.push(alphabet[idx]);
  }
  return `${chars.slice(0, 4).join('')}-${chars.slice(4, 8).join('')}-${chars.slice(8, 12).join('')}-${chars.slice(12, 16).join('')}`;
}

async function deriveAesKey(
  password: string,
  salt: Uint8Array,
  iterations: number,
  usages: KeyUsage[],
): Promise<CryptoKey> {
  const subtle = ensureWebCrypto();
  const encoder = new TextEncoder();
  const keyMaterial = await subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey'],
  );

  return subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: toArrayBuffer(salt),
      iterations,
      hash: 'SHA-256',
    },
    keyMaterial,
    {
      name: 'AES-GCM',
      length: 256,
    },
    false,
    usages,
  );
}

async function deriveLockHashBytes(
  secret: string,
  salt: Uint8Array,
  iterations: number,
): Promise<Uint8Array> {
  const subtle = ensureWebCrypto();
  const encoder = new TextEncoder();
  const keyMaterial = await subtle.importKey(
    'raw',
    encoder.encode(secret),
    'PBKDF2',
    false,
    ['deriveBits'],
  );

  const bits = await subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: toArrayBuffer(salt),
      iterations,
      hash: 'SHA-256',
    },
    keyMaterial,
    256,
  );

  return new Uint8Array(bits);
}

function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a[i] ^ b[i];
  }
  return diff === 0;
}

export async function createAppLockConfig(
  mode: AppLockMode,
  secret: string,
): Promise<AppLockConfig> {
  const cryptoRoot = getCryptoRoot();
  const salt = new Uint8Array(16);
  cryptoRoot.getRandomValues(salt);
  const hashBytes = await deriveLockHashBytes(secret, salt, PBKDF2_ITERATIONS);

  return {
    enabled: true,
    mode,
    salt: bytesToBase64(salt),
    hash: bytesToBase64(hashBytes),
    iterations: PBKDF2_ITERATIONS,
    updatedAt: new Date().toISOString(),
  };
}

export async function verifyAppLockSecret(
  secret: string,
  config: AppLockConfig,
): Promise<boolean> {
  if (!config.enabled || !config.salt || !config.hash) return false;
  try {
    const salt = base64ToBytes(config.salt);
    const expected = base64ToBytes(config.hash);
    const iterations =
      typeof config.iterations === 'number' &&
      config.iterations >= 50_000 &&
      config.iterations <= 2_000_000
        ? config.iterations
        : PBKDF2_ITERATIONS;

    const actual = await deriveLockHashBytes(secret, salt, iterations);
    return constantTimeEqual(actual, expected);
  } catch {
    return false;
  }
}

export async function encryptBundleToIpetString(
  scope: ArchiveScope,
  payload: SingleStudentBundle | FullDatabaseBundle,
  password: string,
): Promise<string> {
  if (!password || password.length < 4) {
    throw new Error('Hasło szyfrowania musi mieć co najmniej 4 znaki.');
  }
  const cryptoRoot = getCryptoRoot();
  const subtle = cryptoRoot.subtle;
  const salt = new Uint8Array(16);
  const iv = new Uint8Array(12);
  cryptoRoot.getRandomValues(salt);
  cryptoRoot.getRandomValues(iv);

  const key = await deriveAesKey(password, salt, PBKDF2_ITERATIONS, ['encrypt']);
  const encodedPayload = new TextEncoder().encode(JSON.stringify(payload));
  if (encodedPayload.byteLength > MAX_DECRYPTED_BYTES) {
    throw new Error(
      'Rozmiar danych do zaszyfrowania przekracza bezpieczny limit 20 MB.',
    );
  }
  const encryptedBuffer = await subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: toArrayBuffer(iv),
    },
    key,
    toArrayBuffer(encodedPayload),
  );

  const envelope: EncryptedArchiveEnvelope = {
    format: 'TECZKA_WSPARCIA_ENCRYPTED',
    version: 1,
    scope,
    algorithm: 'AES-GCM',
    kdf: 'PBKDF2-SHA256',
    iterations: PBKDF2_ITERATIONS,
    salt: bytesToBase64(salt),
    iv: bytesToBase64(iv),
    ciphertext: bytesToBase64(new Uint8Array(encryptedBuffer)),
    exportedAt: new Date().toISOString(),
  };

  return JSON.stringify(envelope);
}

function parseEnvelope(rawText: string): EncryptedArchiveEnvelope {
  if (rawText.length > MAX_ARCHIVE_BYTES) {
    throw new Error('Plik przekracza maksymalny bezpieczny rozmiar (25 MB).');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    throw new Error(
      'Wybrany plik nie jest poprawnym zaszyfrowanym archiwum .ipet (uszkodzona struktura pliku).',
    );
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Nieprawidłowy format pliku .ipet.');
  }

  const env = parsed as Partial<EncryptedArchiveEnvelope>;
  if (
    env.format !== 'TECZKA_WSPARCIA_ENCRYPTED' ||
    env.version !== 1 ||
    env.algorithm !== 'AES-GCM' ||
    env.kdf !== 'PBKDF2-SHA256' ||
    (env.scope !== 'SINGLE_STUDENT' && env.scope !== 'FULL_DATABASE') ||
    typeof env.iterations !== 'number' ||
    !Number.isInteger(env.iterations) ||
    env.iterations < 50_000 ||
    env.iterations > 2_000_000 ||
    typeof env.salt !== 'string' ||
    !env.salt ||
    typeof env.iv !== 'string' ||
    !env.iv ||
    typeof env.ciphertext !== 'string' ||
    !env.ciphertext
  ) {
    throw new Error(
      'Plik ma nieobsługiwany format lub uszkodzony nagłówek kryptograficzny.',
    );
  }

  return env as EncryptedArchiveEnvelope;
}

export async function decryptIpetArchive<
  T extends SingleStudentBundle | FullDatabaseBundle,
>(
  rawText: string,
  password: string,
  expectedScope: ArchiveScope,
): Promise<{ envelope: EncryptedArchiveEnvelope; payload: T }> {
  if (!password) {
    throw new Error('Podaj hasło użyte podczas szyfrowania pliku.');
  }

  const envelope = parseEnvelope(rawText);
  if (envelope.scope !== expectedScope) {
    if (expectedScope === 'SINGLE_STUDENT') {
      throw new Error(
        'Ten plik zawiera pełny backup całej bazy danych. Aby go odtworzyć, przejdź do „Ustawienia placówki → Kopia zapasowa”.',
      );
    }
    throw new Error(
      'Ten plik zawiera eksport pojedynczego ucznia. Aby go wczytać, użyj przycisku „Importuj .ipet” na liście uczniów.',
    );
  }

  const subtle = ensureWebCrypto();
  let salt: Uint8Array;
  let iv: Uint8Array;
  let ciphertext: Uint8Array;

  try {
    salt = base64ToBytes(envelope.salt);
    iv = base64ToBytes(envelope.iv);
    ciphertext = base64ToBytes(envelope.ciphertext);
  } catch {
    throw new Error('Dane kryptograficzne w pliku są uszkodzone.');
  }

  const key = await deriveAesKey(password, salt, envelope.iterations, [
    'decrypt',
  ]);

  let decryptedBuffer: ArrayBuffer;
  try {
    decryptedBuffer = await subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: toArrayBuffer(iv),
      },
      key,
      toArrayBuffer(ciphertext),
    );
  } catch {
    throw new Error(
      'Nieprawidłowe hasło lub plik został uszkodzony (nieudana weryfikacja integralności AES-GCM).',
    );
  }

  if (decryptedBuffer.byteLength > MAX_DECRYPTED_BYTES) {
    throw new Error(
      'Odszyfrowana zawartość pliku przekracza maksymalny bezpieczny rozmiar (20 MB).',
    );
  }

  let payload: unknown;
  try {
    const decoded = new TextDecoder().decode(decryptedBuffer);
    payload = JSON.parse(decoded);
  } catch {
    throw new Error('Odszyfrowana zawartość pliku jest uszkodzona.');
  }

  const validatedPayload =
    expectedScope === 'SINGLE_STUDENT'
      ? validateSingleStudentBundle(payload)
      : validateFullDatabaseBundle(payload);

  return {
    envelope,
    payload: validatedPayload as T,
  };
}

export function sanitizeFilenameSegment(input: string): string {
  return input
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ł/g, 'l')
    .replace(/Ł/g, 'L')
    .replace(/[^a-zA-Z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export function buildStudentExportFilename(student: StudentProfile): string {
  const last = sanitizeFilenameSegment(student.lastName) || 'Uczen';
  const first = sanitizeFilenameSegment(student.firstName) || 'Profil';
  return `backup_${last}_${first}.ipet`;
}

export function buildFullBackupFilename(): string {
  const date = new Date().toISOString().slice(0, 10);
  return `teczka_wsparcia_backup_${date}.ipet`;
}

export function downloadEncryptedIpetFile(
  serializedEnvelope: string,
  filename: string,
): void {
  const blob = new Blob([serializedEnvelope], {
    type: 'application/octet-stream',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}
