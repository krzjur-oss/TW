import { afterEach, describe, expect, it, vi } from 'vitest';
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
  addJournalEntry,
  addPeriodicEvaluation,
  addProgramAnnex,
  db,
  exportStudentBundle,
  importStudentBundle,
  listAnnexesByStudent,
  listEvaluationsByStudent,
  listJournalEntriesByStudent,
  saveStudent,
} from '../src/db/database';
import {
  APP_LOCK_THROTTLE_STORAGE_KEY,
  getRemainingLockSeconds,
  readLockThrottleState,
  recordFailedLockAttempt,
  resetLockThrottleState,
  type StorageLike,
} from '../src/utils/appLockThrottle';
import {
  createAutoLockController,
  resolveEffectiveAutoLockConfig,
  type AutoLockReason,
  type DocumentLike,
  type EventTargetLike,
} from '../src/utils/autoLockController';
import {
  BundleValidationError,
  MAX_ARCHIVE_BYTES,
  MAX_CIPHERTEXT_BYTES,
  MAX_DECRYPTED_BYTES,
  measureUtf8Bytes,
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

class FakeEventTarget implements EventTargetLike {
  private listeners = new Map<
    string,
    Set<EventListenerOrEventListenerObject>
  >();

  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
  ): void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(listener);
  }

  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
  ): void {
    this.listeners.get(type)?.delete(listener);
  }

  dispatch(type: string): void {
    const set = this.listeners.get(type);
    if (!set) return;
    for (const listener of [...set]) {
      if (typeof listener === 'function') {
        listener({ type } as Event);
      } else {
        listener.handleEvent({ type } as Event);
      }
    }
  }

  totalListenersCount(): number {
    let total = 0;
    for (const set of this.listeners.values()) {
      total += set.size;
    }
    return total;
  }
}

class FakeDocument extends FakeEventTarget implements DocumentLike {
  visibilityState: DocumentVisibilityState = 'visible';
}

function buildSizedStudentBundle(targetBytes: number): SingleStudentBundle {
  const student = makeSyntheticStudent('stu-sized');
  const bundle: SingleStudentBundle = {
    kind: 'SINGLE_STUDENT_BUNDLE',
    student,
    journalEntries: [],
    evaluations: [],
    annexes: [],
  };
  const chunkLen = 20_000;
  const chunkText = 'A'.repeat(chunkLen);
  const sampleEntry = makeSyntheticJournalEntry('j-size-0000', student.id, {
    content: chunkText,
  });
  const baseOverhead = measureUtf8Bytes(JSON.stringify(bundle));
  const perEntryApprox = measureUtf8Bytes(JSON.stringify(sampleEntry)) + 1;
  const fullChunks = Math.max(
    0,
    Math.floor((targetBytes - baseOverhead - 1_000) / perEntryApprox),
  );

  for (let idx = 1; idx <= fullChunks; idx += 1) {
    bundle.journalEntries.push(
      makeSyntheticJournalEntry(`j-size-${idx}`, student.id, {
        content: chunkText,
      }),
    );
  }
  const probeEntry = makeSyntheticJournalEntry(
    `j-size-${fullChunks + 1}`,
    student.id,
    { content: '' },
  );
  bundle.journalEntries.push(probeEntry);
  const baseBytes = measureUtf8Bytes(JSON.stringify(bundle));
  const missing = targetBytes - baseBytes;
  if (missing > 0) {
    probeEntry.content = 'B'.repeat(missing);
  }
  return bundle;
}

describe('Kryptografia .ipet, walidacja po odszyfrowaniu i trwały limiter blokady UI', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

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

  it('zachowuje spójne limity UTF-8 na granicach 20 MiB jawnych / 28 MiB archiwum: każdy poprawny eksport przechodzi własny import', async () => {
    // 0. Tuż poniżej limitu 20 MiB (-1024 B) -> eksport i import przechodzą bez błędu
    const belowLimitBundle = buildSizedStudentBundle(
      MAX_DECRYPTED_BYTES - 1024,
    );
    expect(measureUtf8Bytes(JSON.stringify(belowLimitBundle))).toBe(
      MAX_DECRYPTED_BYTES - 1024,
    );
    const archiveBelowLimit = await encryptBundleToIpetString(
      'SINGLE_STUDENT',
      belowLimitBundle,
      'LimitTest!2026',
    );
    expect(measureUtf8Bytes(archiveBelowLimit)).toBeLessThanOrEqual(
      MAX_ARCHIVE_BYTES,
    );
    const decryptedBelowLimit = await decryptIpetArchive<SingleStudentBundle>(
      archiveBelowLimit,
      'LimitTest!2026',
      'SINGLE_STUDENT',
    );
    expect(decryptedBelowLimit.payload.journalEntries).toHaveLength(
      belowLimitBundle.journalEntries.length,
    );

    // 1. Dokładnie na limicie 20 MiB (20 * 1024 * 1024 bajtów UTF-8)
    const exactLimitBundle = buildSizedStudentBundle(MAX_DECRYPTED_BYTES);
    expect(measureUtf8Bytes(JSON.stringify(exactLimitBundle))).toBe(
      MAX_DECRYPTED_BYTES,
    );

    const archiveAtLimit = await encryptBundleToIpetString(
      'SINGLE_STUDENT',
      exactLimitBundle,
      'LimitTest!2026',
    );
    const archiveBytes = measureUtf8Bytes(archiveAtLimit);
    // Wcześniej przy 25 MB archiwum ten przypadek przekraczał limit (~27.96 MB) i zawodził na imporcie!
    expect(archiveBytes).toBeGreaterThan(25 * 1024 * 1024);
    expect(archiveBytes).toBeLessThanOrEqual(MAX_ARCHIVE_BYTES);

    const decryptedAtLimit = await decryptIpetArchive<SingleStudentBundle>(
      archiveAtLimit,
      'LimitTest!2026',
      'SINGLE_STUDENT',
    );
    expect(decryptedAtLimit.payload.journalEntries).toHaveLength(
      exactLimitBundle.journalEntries.length,
    );

    // 2. Archiwum tuż poniżej MAX_ARCHIVE_BYTES (28 MiB - 16 B, z dopełnieniem białymi znakami JSON) -> musi zostać przyjęte
    const smallBundle = buildSizedStudentBundle(16_384);
    const smallArchive = await encryptBundleToIpetString(
      'SINGLE_STUDENT',
      smallBundle,
      'LimitTest!2026',
    );
    const padLength = MAX_ARCHIVE_BYTES - measureUtf8Bytes(smallArchive) - 16;
    const nearArchiveLimit = `${smallArchive}${' '.repeat(padLength)}`;
    expect(measureUtf8Bytes(nearArchiveLimit)).toBe(MAX_ARCHIVE_BYTES - 16);
    const decryptedNearArchive = await decryptIpetArchive<SingleStudentBundle>(
      nearArchiveLimit,
      'LimitTest!2026',
      'SINGLE_STUDENT',
    );
    expect(decryptedNearArchive.payload.student.id).toBe('stu-sized');

    // 3. Tuż powyżej limitu 20 MiB (+1 bajt UTF-8) -> eksport musi odrzucić przed pobraniem
    const overLimitBundle = buildSizedStudentBundle(MAX_DECRYPTED_BYTES + 1);
    expect(measureUtf8Bytes(JSON.stringify(overLimitBundle))).toBe(
      MAX_DECRYPTED_BYTES + 1,
    );
    await expect(
      encryptBundleToIpetString('SINGLE_STUDENT', overLimitBundle, 'LimitTest!2026'),
    ).rejects.toThrow(/przekracza bezpieczny limit 20 MB/i);

    // 4. Wielobajtowe znaki UTF-8 w archiwum (mniejsza liczba znaków JS, ale > MAX_ARCHIVE_BYTES w UTF-8)
    const multibyteOversized = 'ł'.repeat(Math.floor(MAX_ARCHIVE_BYTES / 2) + 10);
    expect(multibyteOversized.length).toBeLessThan(MAX_ARCHIVE_BYTES);
    expect(measureUtf8Bytes(multibyteOversized)).toBeGreaterThan(MAX_ARCHIVE_BYTES);
    await expect(
      decryptIpetArchive(multibyteOversized, 'LimitTest!2026', 'SINGLE_STUDENT'),
    ).rejects.toThrow(/maksymalny bezpieczny rozmiar archiwum/i);

    // 5. Nadmierny ciphertext powyżej MAX_CIPHERTEXT_BYTES w kopercie
    const fakeEnv = JSON.parse(archiveAtLimit) as {
      ciphertext: string;
    };
    expect(MAX_CIPHERTEXT_BYTES).toBe(MAX_DECRYPTED_BYTES + 16);
    // Doklejamy 4 bajty w Base64 -> przekracza MAX_CIPHERTEXT_BYTES po dekodowaniu Base64
    fakeEnv.ciphertext = `${fakeEnv.ciphertext}AAAA`;
    await expect(
      decryptIpetArchive(
        JSON.stringify(fakeEnv),
        'LimitTest!2026',
        'SINGLE_STUDENT',
      ),
    ).rejects.toThrow(/przekracza bezpieczny limit/i);
  }, 45_000);

  it('przeprowadza pełny round-trip eksport -> szyfrowanie .ipet -> odszyfrowanie -> import i porównuje kompletność danych', async () => {
    await db.transaction(
      'rw',
      [
        db.students,
        db.journalEntries,
        db.periodicEvaluations,
        db.programAnnexes,
      ],
      async () => {
        await Promise.all([
          db.students.clear(),
          db.journalEntries.clear(),
          db.periodicEvaluations.clear(),
          db.programAnnexes.clear(),
        ]);
      },
    );

    const originalStudent = makeSyntheticStudent('stu-rt-1', {
      firstName: 'Łukasz',
      lastName: 'Źródłowski',
    });
    const originalJournal = makeSyntheticJournalEntry('j-rt-1', 'stu-rt-1', {
      content: 'Uczeń aktywnie uczestniczył w zajęciach z użyciem lupy optycznej.',
    });
    const originalAnnex = makeSyntheticAnnex('a-rt-1', 'stu-rt-1', {
      evaluationId: 'e-rt-1',
      title: 'Aneks nr 1 — dostosowanie czasu pracy',
    });
    const originalEval = makeSyntheticEvaluation('e-rt-1', 'stu-rt-1', {
      linkedAnnexId: 'a-rt-1',
      progressSummary: 'Poprawa samodzielności w zadaniach matematycznych.',
    });

    await saveStudent(originalStudent);
    await addJournalEntry(originalJournal);
    await addProgramAnnex(originalAnnex);
    await addPeriodicEvaluation(originalEval);

    const exportedBundle = await exportStudentBundle('stu-rt-1');
    const password = generateStrongPassword();
    const encryptedIpet = await encryptBundleToIpetString(
      'SINGLE_STUDENT',
      exportedBundle,
      password,
    );

    // Wyczyść bazę (symulacja importu na drugim urządzeniu)
    await db.transaction(
      'rw',
      [
        db.students,
        db.journalEntries,
        db.periodicEvaluations,
        db.programAnnexes,
      ],
      async () => {
        await Promise.all([
          db.students.clear(),
          db.journalEntries.clear(),
          db.periodicEvaluations.clear(),
          db.programAnnexes.clear(),
        ]);
      },
    );

    const { payload } = await decryptIpetArchive<SingleStudentBundle>(
      encryptedIpet,
      password,
      'SINGLE_STUDENT',
    );
    const importedStudent = await importStudentBundle(payload, 'CREATE_NEW');

    const restoredStudent = await db.students.get(importedStudent.id);
    const restoredJournals = await listJournalEntriesByStudent(
      importedStudent.id,
    );
    const restoredEvals = await listEvaluationsByStudent(importedStudent.id);
    const restoredAnnexes = await listAnnexesByStudent(importedStudent.id);

    expect(restoredStudent?.firstName).toBe('Łukasz');
    expect(restoredStudent?.lastName).toBe('Źródłowski');
    expect(restoredStudent?.wopfuDraft.strengths).toEqual(
      originalStudent.wopfuDraft.strengths,
    );
    expect(restoredStudent?.ipetDraft.specialistSupportHours).toEqual(
      originalStudent.ipetDraft.specialistSupportHours,
    );
    expect(restoredJournals).toHaveLength(1);
    expect(restoredJournals[0].content).toBe(originalJournal.content);
    expect(restoredEvals).toHaveLength(1);
    expect(restoredEvals[0].progressSummary).toBe(originalEval.progressSummary);
    expect(restoredAnnexes).toHaveLength(1);
    expect(restoredAnnexes[0].title).toBe(originalAnnex.title);
    expect(restoredEvals[0].linkedAnnexId).toBe(restoredAnnexes[0].id);
    expect(restoredAnnexes[0].evaluationId).toBe(restoredEvals[0].id);
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
    const lockConfig = await createAppLockConfig('PASSWORD', 'TajneHaslo2026!', {
      autoLockMinutes: 5,
      backgroundLockPolicy: 'RESPECT_IDLE',
    });
    expect(lockConfig.autoLockMinutes).toBe(5);
    expect(lockConfig.backgroundLockPolicy).toBe('RESPECT_IDLE');
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
    // Upewniamy się, że w storage nie ma żadnego sekretu
    expect(rawStored).not.toContain('TajneHaslo2026!');

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

  it('automatyczna blokada UI: bezczynność, aktywne pisanie, przejście w tło (visibilitychange), dławienie timerów, wyłączenie i czyszczenie listenerów', () => {
    vi.useFakeTimers();

    // 1. Zgodność wsteczna resolveEffectiveAutoLockConfig dla starej konfiguracji bez nowych pól
    expect(
      resolveEffectiveAutoLockConfig({
        enabled: true,
        mode: 'PIN',
        salt: 's',
        hash: 'h',
        iterations: 210_000,
        updatedAt: '2026-11-23T00:00:00.000Z',
      }),
    ).toEqual({
      enabled: true,
      autoLockMinutes: 0,
      backgroundLockPolicy: 'OFF',
    });

    // 2. Bezczynność 1 minuta + reset licznika przy aktywnym wpisywaniu danych
    const win1 = new FakeEventTarget();
    const doc1 = new FakeDocument();
    let now1 = 100_000;
    const reasons1: AutoLockReason[] = [];

    const ctrl1 = createAutoLockController({
      enabled: true,
      autoLockMinutes: 1,
      backgroundLockPolicy: 'RESPECT_IDLE',
      now: () => now1,
      targetWindow: win1,
      targetDocument: doc1,
      onLock: (reason) => reasons1.push(reason),
    });

    expect(win1.totalListenersCount()).toBeGreaterThan(0);
    expect(doc1.totalListenersCount()).toBe(1);

    // Po 45 s użytkownik aktywnie wpisuje tekst -> licznik musi się zresetować i NIE wolno zablokować na 60 s
    now1 += 45_000;
    vi.advanceTimersByTime(45_000);
    win1.dispatch('keydown');
    win1.dispatch('input');
    expect(reasons1).toHaveLength(0);

    // Kolejne 45 s bezczynności (razem 90 s od startu, ale tylko 45 s od ostatniego znaku) -> nadal odblokowane!
    now1 += 45_000;
    vi.advanceTimersByTime(45_000);
    expect(reasons1).toHaveLength(0);

    // Jeszcze 20 s bezczynności (razem 65 s od ostatniego wpisywania) -> blokada IDLE_TIMEOUT
    now1 += 20_000;
    vi.advanceTimersByTime(20_000);
    expect(reasons1).toEqual(['IDLE_TIMEOUT']);
    // Po wyzwoleniu blokady listenery są posprzątane
    expect(win1.totalListenersCount()).toBe(0);
    expect(doc1.totalListenersCount()).toBe(0);
    ctrl1.destroy();

    // 3. Zachowanie w tle (RESPECT_IDLE) przy zdławionych timerach przeglądarki + powrót
    const win2 = new FakeEventTarget();
    const doc2 = new FakeDocument();
    let now2 = 500_000;
    const reasons2: AutoLockReason[] = [];

    const ctrl2 = createAutoLockController({
      enabled: true,
      autoLockMinutes: 5,
      backgroundLockPolicy: 'RESPECT_IDLE',
      now: () => now2,
      targetWindow: win2,
      targetDocument: doc2,
      onLock: (reason) => reasons2.push(reason),
    });

    // Krótkie przejście w tło na 30 s i powrót -> NIE blokuje
    doc2.visibilityState = 'hidden';
    doc2.dispatch('visibilitychange');
    now2 += 30_000;
    doc2.visibilityState = 'visible';
    doc2.dispatch('visibilitychange');
    expect(reasons2).toHaveLength(0);

    // Długa nieobecność (6 minut) z całkowicie zdławionymi timerami (bez advanceTimersByTime!)
    doc2.visibilityState = 'hidden';
    doc2.dispatch('visibilitychange');
    now2 += 6 * 60_000;
    doc2.visibilityState = 'visible';
    doc2.dispatch('visibilitychange');
    expect(reasons2).toEqual(['BACKGROUND_IDLE_ELAPSED']);
    ctrl2.destroy();

    // 4. Polityka IMMEDIATE przy przejściu karty w tło
    const win3 = new FakeEventTarget();
    const doc3 = new FakeDocument();
    const reasons3: AutoLockReason[] = [];
    const ctrl3 = createAutoLockController({
      enabled: true,
      autoLockMinutes: 15,
      backgroundLockPolicy: 'IMMEDIATE',
      targetWindow: win3,
      targetDocument: doc3,
      onLock: (reason) => reasons3.push(reason),
    });

    doc3.visibilityState = 'hidden';
    doc3.dispatch('visibilitychange');
    expect(reasons3).toEqual(['BACKGROUND']);
    ctrl3.destroy();

    // 5. Wyłączona funkcja (autoLockMinutes = 0, backgroundLockPolicy = 'OFF') nie rejestruje listenerów i nie blokuje
    const win4 = new FakeEventTarget();
    const doc4 = new FakeDocument();
    let now4 = 1_000_000;
    const reasons4: AutoLockReason[] = [];
    const ctrl4 = createAutoLockController({
      enabled: true,
      autoLockMinutes: 0,
      backgroundLockPolicy: 'OFF',
      now: () => now4,
      targetWindow: win4,
      targetDocument: doc4,
      onLock: (reason) => reasons4.push(reason),
    });
    expect(win4.totalListenersCount()).toBe(0);
    expect(doc4.totalListenersCount()).toBe(0);
    doc4.visibilityState = 'hidden';
    doc4.dispatch('visibilitychange');
    now4 += 60 * 60_000;
    vi.advanceTimersByTime(60 * 60_000);
    expect(reasons4).toHaveLength(0);
    ctrl4.destroy();

    // 6. Sprzątanie timerów i listenerów na destroy() (odmontowanie komponentu)
    const win5 = new FakeEventTarget();
    const doc5 = new FakeDocument();
    let now5 = 2_000_000;
    const reasons5: AutoLockReason[] = [];
    const ctrl5 = createAutoLockController({
      enabled: true,
      autoLockMinutes: 1,
      backgroundLockPolicy: 'RESPECT_IDLE',
      now: () => now5,
      targetWindow: win5,
      targetDocument: doc5,
      onLock: (reason) => reasons5.push(reason),
    });
    expect(win5.totalListenersCount()).toBeGreaterThan(0);
    expect(doc5.totalListenersCount()).toBe(1);

    ctrl5.destroy();
    expect(ctrl5.isDestroyed()).toBe(true);
    expect(win5.totalListenersCount()).toBe(0);
    expect(doc5.totalListenersCount()).toBe(0);

    now5 += 10 * 60_000;
    vi.advanceTimersByTime(10 * 60_000);
    expect(reasons5).toHaveLength(0);
  });
});

