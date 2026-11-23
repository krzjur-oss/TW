import { beforeEach, describe, expect, it } from 'vitest';
import {
  createAppLockConfig,
  type FullDatabaseBundle,
} from '../src/crypto/cryptoService';
import {
  addJournalEntry,
  addPeriodicEvaluation,
  addProgramAnnex,
  analyzeFullDatabaseImport,
  db,
  exportFullDatabaseBundle,
  importFullDatabaseBundle,
  saveFacilitySettings,
  saveStudent,
} from '../src/db/database';
import { BundleValidationError } from '../src/validation/bundleValidation';
import {
  makeSyntheticAnnex,
  makeSyntheticEvaluation,
  makeSyntheticJournalEntry,
  makeSyntheticSettings,
  makeSyntheticStudent,
} from './fixtures';

async function clearAllTables() {
  await db.transaction(
    'rw',
    [
      db.students,
      db.journalEntries,
      db.periodicEvaluations,
      db.programAnnexes,
      db.facilitySettings,
    ],
    async () => {
      await Promise.all([
        db.students.clear(),
        db.journalEntries.clear(),
        db.periodicEvaluations.clear(),
        db.programAnnexes.clear(),
        db.facilitySettings.clear(),
      ]);
    },
  );
}

describe('Pełny backup i odtwarzanie bazy (MERGE, REPLACE, appLock i rollback)', () => {
  beforeEach(async () => {
    await clearAllTables();
  });

  it('exportFullDatabaseBundle nie zawiera appLock, a REPLACE zachowuje lokalną blokadę docelową i odtwarza wszystkie tabele', async () => {
    const localLock = await createAppLockConfig('PIN', '1234');
    await saveFacilitySettings({
      ...makeSyntheticSettings({ schoolName: 'Szkoła Pierwotna' }),
      appLock: localLock,
    });

    const s1 = makeSyntheticStudent('s-1', { firstName: 'Janina' });
    await saveStudent(s1);
    await addJournalEntry(makeSyntheticJournalEntry('j-1', 's-1'));
    await addProgramAnnex(
      makeSyntheticAnnex('a-1', 's-1', { evaluationId: 'e-1' }),
    );
    await addPeriodicEvaluation(
      makeSyntheticEvaluation('e-1', 's-1', { linkedAnnexId: 'a-1' }),
    );

    const backup = await exportFullDatabaseBundle();
    expect(
      (backup.facilitySettings as { appLock?: unknown }).appLock,
    ).toBeUndefined();

    // Zmień dane lokalne oraz ustaw nową blokadę docelową (inny PIN)
    const deviceLock = await createAppLockConfig('PIN', '9876');
    await clearAllTables();
    await saveFacilitySettings({
      ...makeSyntheticSettings({ schoolName: 'Szkoła Tymczasowa' }),
      appLock: deviceLock,
    });
    await saveStudent(makeSyntheticStudent('s-temp', { firstName: 'Tymczasowy' }));

    // REPLACE bez jawnego confirmReplace musi zostać zablokowane
    await expect(
      importFullDatabaseBundle(backup, 'REPLACE', { confirmReplace: false }),
    ).rejects.toThrow(/potwierdzenia/);

    // Baza tymczasowa nadal nienaruszona
    expect(await db.students.get('s-temp')).toBeDefined();

    // REPLACE z confirmReplace = true
    await importFullDatabaseBundle(backup, 'REPLACE', { confirmReplace: true });

    expect(await db.students.get('s-temp')).toBeUndefined();
    expect((await db.students.get('s-1'))?.firstName).toBe('Janina');
    expect(await db.journalEntries.count()).toBe(1);
    expect(await db.periodicEvaluations.count()).toBe(1);
    expect(await db.programAnnexes.count()).toBe(1);

    const restoredSettings = await db.facilitySettings.get('default');
    expect(restoredSettings?.schoolName).toBe('Szkoła Pierwotna');
    expect(restoredSettings?.appLock?.hash).toBe(deviceLock.hash);
  });

  it('odrzuca uszkodzony/nieprawidłowy pakiet przed czyszczeniem bazy i cofa REPLACE w razie błędu transakcji', async () => {
    await saveStudent(makeSyntheticStudent('s-stay', { firstName: 'Zostaje' }));

    const invalidBackup = {
      kind: 'FULL_DATABASE_BUNDLE',
      facilitySettings: makeSyntheticSettings(),
      students: [makeSyntheticStudent('s-invalid', { birthDate: '2026-02-31' })],
      journalEntries: [],
      evaluations: [],
      annexes: [],
    } as unknown as FullDatabaseBundle;

    await expect(
      importFullDatabaseBundle(invalidBackup, 'REPLACE', { confirmReplace: true }),
    ).rejects.toThrow(BundleValidationError);
    expect((await db.students.get('s-stay'))?.firstName).toBe('Zostaje');

    // Teraz poprawny pakiet, ale wymuszony błąd po clear() wewnątrz transakcji
    const validBackup: FullDatabaseBundle = {
      kind: 'FULL_DATABASE_BUNDLE',
      facilitySettings: makeSyntheticSettings(),
      students: [makeSyntheticStudent('s-new')],
      journalEntries: [makeSyntheticJournalEntry('j-new', 's-new')],
      evaluations: [],
      annexes: [],
    };
    const failHook = () => {
      throw new Error('Przerwanie transakcji REPLACE');
    };
    db.journalEntries.hook('creating', failHook);

    try {
      await expect(
        importFullDatabaseBundle(validBackup, 'REPLACE', { confirmReplace: true }),
      ).rejects.toThrow(/Przerwanie transakcji REPLACE/);
    } finally {
      db.journalEntries.hook('creating').unsubscribe(failHook);
    }

    // Dzięki atomowej transakcji Dexie dane przed REPLACE zostały przywrócone!
    expect((await db.students.get('s-stay'))?.firstName).toBe('Zostaje');
    expect(await db.students.get('s-new')).toBeUndefined();
  });

  it('MERGE analizuje konflikty i kolizje między uczniami, wspiera KEEP_LOCAL oraz OVERWRITE_WITH_BACKUP', async () => {
    const localLock = await createAppLockConfig('PASSWORD', 'LokalneHaslo!2026');
    await saveFacilitySettings({
      ...makeSyntheticSettings({ schoolName: 'Szkoła Docelowa' }),
      appLock: localLock,
    });

    // Lokalnie: uczeń S1 (zmodyfikowany), uczeń S_IDENTICAL (identyczny), uczeń S_OWNER (właściciel 'col-j-id')
    const localS1 = makeSyntheticStudent('s-1', { firstName: 'LokalnaNazwa' });
    const identicalS = makeSyntheticStudent('s-same', {
      firstName: 'Identyczny',
      pppDocument: {
        ...makeSyntheticStudent('s-same').pppDocument,
        documentNumber: 'ORZ/SAME/1',
      },
    });
    const localOwner = makeSyntheticStudent('s-owner', {
      firstName: 'Właściciel',
      pppDocument: {
        ...makeSyntheticStudent('s-owner').pppDocument,
        documentNumber: 'ORZ/OWN/1',
      },
    });
    await saveStudent(localS1);
    await saveStudent(identicalS);
    await saveStudent(localOwner);
    await addJournalEntry(
      makeSyntheticJournalEntry('col-j-id', 's-owner', {
        title: 'Nienaruszony wpis właściciela',
      }),
    );

    // W backupie: zmieniony S1, identyczny s-same, nowy s-2, oraz wpis z 'col-j-id' przypisany do s-2 (kolizja ID między uczniami!)
    const backup: FullDatabaseBundle = {
      kind: 'FULL_DATABASE_BUNDLE',
      facilitySettings: makeSyntheticSettings({ schoolName: 'Szkoła z Backupu' }),
      students: [
        makeSyntheticStudent('s-1', { firstName: 'NazwaZBackupu' }),
        identicalS,
        makeSyntheticStudent('s-2', {
          firstName: 'NowyUczeń',
          pppDocument: {
            ...makeSyntheticStudent('s-2').pppDocument,
            documentNumber: 'ORZ/NEW/2',
          },
        }),
      ],
      journalEntries: [
        makeSyntheticJournalEntry('col-j-id', 's-2', {
          title: 'Wpis Nowego Ucznia z kolizyjnym ID',
        }),
      ],
      evaluations: [
        makeSyntheticEvaluation('col-e-id', 's-2', {
          linkedAnnexId: 'col-a-id',
        }),
      ],
      annexes: [
        makeSyntheticAnnex('col-a-id', 's-2', {
          evaluationId: 'col-e-id',
        }),
      ],
    };

    const preview = await analyzeFullDatabaseImport(backup);
    expect(preview.students.newCount).toBe(1);
    expect(preview.students.identicalCount).toBe(1);
    expect(preview.students.conflictingSameIdCount).toBe(1);
    expect(preview.totalCrossCollisions).toBe(1);

    // 1. MERGE w trybie KEEP_LOCAL (i bez nadpisywania ustawień szkoły)
    const summaryKeep = await importFullDatabaseBundle(backup, 'MERGE', {
      conflictResolution: 'KEEP_LOCAL',
      applyFacilitySettings: false,
    });
    expect(summaryKeep.remappedCrossCollisionsCount).toBe(1);
    expect((await db.students.get('s-1'))?.firstName).toBe('LokalnaNazwa');
    expect((await db.students.get('s-2'))?.firstName).toBe('NowyUczeń');
    expect((await db.facilitySettings.get('default'))?.schoolName).toBe(
      'Szkoła Docelowa',
    );
    expect((await db.facilitySettings.get('default'))?.appLock?.hash).toBe(
      localLock.hash,
    );

    // Wpis właściciela nienaruszony, a s-2 dostał przemapowane UUID
    const ownerJournal = await db.journalEntries.get('col-j-id');
    expect(ownerJournal?.studentId).toBe('s-owner');
    expect(ownerJournal?.title).toBe('Nienaruszony wpis właściciela');

    const s2Journals = await db.journalEntries
      .where('studentId')
      .equals('s-2')
      .toArray();
    expect(s2Journals).toHaveLength(1);
    expect(s2Journals[0].id).not.toBe('col-j-id');

    // 2. MERGE w trybie OVERWRITE_WITH_BACKUP i applyFacilitySettings = true
    await importFullDatabaseBundle(backup, 'MERGE', {
      conflictResolution: 'OVERWRITE_WITH_BACKUP',
      applyFacilitySettings: true,
    });
    expect((await db.students.get('s-1'))?.firstName).toBe('NazwaZBackupu');
    const updatedSettings = await db.facilitySettings.get('default');
    expect(updatedSettings?.schoolName).toBe('Szkoła z Backupu');
    // Lokalne appLock nadal zachowane!
    expect(updatedSettings?.appLock?.hash).toBe(localLock.hash);
  });
});
