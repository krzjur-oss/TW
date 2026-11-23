import { describe, expect, it } from 'vitest';
import {
  createAppLockConfig,
  decryptIpetArchive,
  encryptBundleToIpetString,
  generateStrongPassword,
  type FullDatabaseBundle,
  type SingleStudentBundle,
  verifyAppLockSecret,
} from '../src/crypto/cryptoService';
import {
  APP_LOCK_THROTTLE_STORAGE_KEY,
  getRemainingLockSeconds,
  readLockThrottleState,
  recordFailedLockAttempt,
  resetLockThrottleState,
  type StorageLike,
} from '../src/utils/appLockThrottle';
import {
  BundleValidationError,
  MAX_ARCHIVE_BYTES,
} from '../src/validation/bundleValidation';
import {
  makeSyntheticAnnex,
  makeSyntheticEvaluation,
  makeSyntheticJournalEntry,
  makeSyntheticSettings,
  makeSyntheticStudent,
} from './fixtures';

class MemoryStorage implements StorageLike {
  private map = new Map<string, string>();
  getItem(key: string): string | null {
    return this.map.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.map.set(key, value);
  }
  removeItem(key: string): void {
    this.map.delete(key);
  }
}

describe('Kryptografia .ipet, walidacja po odszyfrowaniu i trwały limiter blokady UI', () => {
  it('szyfruje i odszyfrowuje pakiet SingleStudentBundle w formacie v1 (AES-GCM 256 + PBKDF2)', async () => {
    const bundle: SingleStudentBundle = {
      kind: 'SINGLE_STUDENT_BUNDLE',
      student: makeSyntheticStudent('stu-enc-1'),
      journalEntries: [makeSyntheticJournalEntry('j-enc-1', 'stu-enc-1')],
      evaluations: [
        makeSyntheticEvaluation('e-enc-1', 'stu-enc-1', {
          linkedAnnexId: 'a-enc-1',
        }),
      ],
      annexes: [
        makeSyntheticAnnex('a-enc-1', 'stu-enc-1', {
          evaluationId: 'e-enc-1',
        }),
      ],
    };

    const password = generateStrongPassword();
    expect(password.length).toBeGreaterThanOrEqual(16);

    const archiveJson = await encryptBundleToIpetString(
      'SINGLE_STUDENT',
      bundle,
      password,
    );
    const parsedEnvelope = JSON.parse(archiveJson) as Record<string, unknown>;
    expect(parsedEnvelope.format).toBe('TECZKA_WSPARCIA_ENCRYPTED');
    expect(parsedEnvelope.version).toBe(1);
    expect(parsedEnvelope.algorithm).toBe('AES-GCM');
    expect(parsedEnvelope.kdf).toBe('PBKDF2-SHA256');
    expect(parsedEnvelope.iterations).toBe(210_000);

    const decrypted = await decryptIpetArchive<SingleStudentBundle>(
      archiveJson,
      password,
      'SINGLE_STUDENT',
    );
    expect(decrypted.envelope.scope).toBe('SINGLE_STUDENT');
    expect(decrypted.payload.kind).toBe('SINGLE_STUDENT_BUNDLE');
    expect(decrypted.payload.student.id).toBe('stu-enc-1');
    expect(decrypted.payload.journalEntries).toHaveLength(1);
  });

  it('odrzuca błędne hasło, uszkodzony JSON, zmieniony ciphertext, zły typ archiwum oraz przekroczony rozmiar wejścia', async () => {
    const bundle: FullDatabaseBundle = {
      kind: 'FULL_DATABASE_BUNDLE',
      facilitySettings: makeSyntheticSettings(),
      students: [makeSyntheticStudent('stu-1')],
      journalEntries: [],
      evaluations: [],
      annexes: [],
    };
    const archiveJson = await encryptBundleToIpetString(
      'FULL_DATABASE',
      bundle,
      'HasloTestowe!123',
    );

    // 1. Błędne hasło
    await expect(
      decryptIpetArchive(archiveJson, 'ZleHaslo!999', 'FULL_DATABASE'),
    ).rejects.toThrow(/Nieprawidłowe hasło/);

    // 2. Zły expectedScope (np. próba wczytania pełnego backupu jako pojedynczego ucznia)
    await expect(
      decryptIpetArchive(archiveJson, 'HasloTestowe!123', 'SINGLE_STUDENT'),
    ).rejects.toThrow(/pełny backup całej bazy/i);

    // 3. Uszkodzony plik JSON
    await expect(
      decryptIpetArchive('{niepoprawny json', 'HasloTestowe!123', 'FULL_DATABASE'),
    ).rejects.toThrow(/uszkodzona struktura|nie jest poprawnym/i);

    // 4. Zmodyfikowany ciphertext (bit-flip w AES-GCM powinien zostać odrzucony przez tag uwierzytelnienia)
    const env = JSON.parse(archiveJson) as { ciphertext: string };
    const chars = env.ciphertext.split('');
    const mid = Math.floor(chars.length / 2);
    chars[mid] = chars[mid] === 'A' ? 'B' : 'A';
    env.ciphertext = chars.join('');
    await expect(
      decryptIpetArchive(
        JSON.stringify(env),
        'HasloTestowe!123',
        'FULL_DATABASE',
      ),
    ).rejects.toThrow(/Nieprawidłowe hasło|uszkodzony/);

    // 5. Przekroczony maksymalny rozmiar pliku wejściowego
    const oversized = 'x'.repeat(MAX_ARCHIVE_BYTES + 16);
    await expect(
      decryptIpetArchive(oversized, 'HasloTestowe!123', 'FULL_DATABASE'),
    ).rejects.toThrow(/rozmiar/);
  });

  it('odrzuca zaszyfrowany pakiet zawierający zniekształcone dane wewnętrzne (walidacja po odszyfrowaniu)', async () => {
    const invalidInnerBundle = {
      kind: 'SINGLE_STUDENT_BUNDLE',
      student: makeSyntheticStudent('stu-bad', { birthDate: '2026-02-31' }),
      journalEntries: [],
      evaluations: [],
      annexes: [],
    } as unknown as SingleStudentBundle;

    const archiveJson = await encryptBundleToIpetString(
      'SINGLE_STUDENT',
      invalidInnerBundle,
      'BezpieczneHaslo!123',
    );

    await expect(
      decryptIpetArchive(archiveJson, 'BezpieczneHaslo!123', 'SINGLE_STUDENT'),
    ).rejects.toThrow(BundleValidationError);
  });

  it('haszuje i weryfikuje PIN/hasło lokalnie oraz wymusza trwały limiter prób niezależny od odświeżenia strony', async () => {
    const lockConfig = await createAppLockConfig('PASSWORD', 'TajneHaslo2026!');
    expect(await verifyAppLockSecret('TajneHaslo2026!', lockConfig)).toBe(true);
    expect(await verifyAppLockSecret('ZleHaslo', lockConfig)).toBe(false);

    const storage = new MemoryStorage();
    const t0 = 1_700_000_000_000;

    // 1. i 2. próba bez opóźnienia
    let state = recordFailedLockAttempt(t0, storage);
    expect(state.failedAttempts).toBe(1);
    expect(getRemainingLockSeconds(state, t0)).toBe(0);

    state = recordFailedLockAttempt(t0 + 1000, storage);
    expect(state.failedAttempts).toBe(2);
    expect(getRemainingLockSeconds(state, t0 + 1000)).toBe(0);

    // 3. błędna próba -> 5s blokady, trwałe w storage (symulacja F5 / ponownego odczytu)
    state = recordFailedLockAttempt(t0 + 2000, storage);
    expect(state.failedAttempts).toBe(3);
    expect(getRemainingLockSeconds(state, t0 + 2000)).toBe(5);

    const rawStored = storage.getItem(APP_LOCK_THROTTLE_STORAGE_KEY);
    expect(rawStored).toBeTruthy();

    // Symulacja odświeżenia strony: świeży odczyt ze storage po 2 sekundach
    const afterRefresh = readLockThrottleState(t0 + 4000, storage);
    expect(afterRefresh.failedAttempts).toBe(3);
    expect(getRemainingLockSeconds(afterRefresh, t0 + 4000)).toBe(3);

    // 4. próba -> 15s blokady
    const attempt4 = recordFailedLockAttempt(t0 + 10_000, storage);
    expect(getRemainingLockSeconds(attempt4, t0 + 10_000)).toBe(15);

    // Po poprawnym odblokowaniu licznik jest czyszczony bez utraty danych
    resetLockThrottleState(storage);
    const afterReset = readLockThrottleState(t0 + 11_000, storage);
    expect(afterReset.failedAttempts).toBe(0);
    expect(getRemainingLockSeconds(afterReset, t0 + 11_000)).toBe(0);
  });
});
