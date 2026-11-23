import Dexie from 'dexie';
import { describe, expect, it } from 'vitest';
import {
  normalizeJournalEntry,
  normalizePeriodicEvaluation,
  normalizeStudentProfile,
  TeczkaWsparciaDatabase,
} from '../src/db/database';
import {
  makeSyntheticJournalEntry,
  makeSyntheticSettings,
  makeSyntheticStudent,
} from './fixtures';

describe('Migracja starszej bazy IndexedDB (v1 → v2)', () => {
  it('przenosi istniejące rekordy ze schematu v1 do v2 bez utraty danych i dodaje tabelę programAnnexes', async () => {
    const legacyDbName = `TeczkaWsparciaMigrationTest_${crypto.randomUUID()}`;

    // 1. Utwórz bazę dokładnie w schemacie v1 i zapisz historyczne rekordy
    const legacyDb = new Dexie(legacyDbName);
    legacyDb.version(1).stores({
      students:
        'id, lastName, className, schoolYear, documentType, status, isTestData, updatedAt',
      journalEntries: 'id, studentId, date, category, isTestData, createdAt',
      periodicEvaluations:
        'id, studentId, schoolYear, semester, type, status, isTestData, evaluationDate',
      facilitySettings: 'id',
    });

    const v1Student = makeSyntheticStudent('v1-stu-1', {
      firstName: 'Krzysztof',
      lastName: 'Archiwalny',
    });
    delete (v1Student as { wopfuDraft?: unknown }).wopfuDraft;
    delete (v1Student as { opinionSupportDraft?: unknown }).opinionSupportDraft;

    const v1Journal = makeSyntheticJournalEntry('v1-jour-1', 'v1-stu-1');
    delete (v1Journal as { relatedArea?: unknown }).relatedArea;

    const v1EvalRaw = {
      id: 'v1-eval-1',
      studentId: 'v1-stu-1',
      schoolYear: '2025/2026',
      semester: 'I',
      evaluationDate: '2026-01-15',
      type: 'OCENA_OKRESOWA_IPET',
      teamMembers: 'mgr Janina Koordynator',
      goalsReferenceNotes: 'Cele roczne',
      effectivenessRating: 'WYSOKA',
      progressSummary: 'Dobre postępy w I półroczu.',
      modificationsNeeded: '',
      status: 'ZATWIERDZONA',
      isTestData: true,
      createdAt: '2026-01-15T10:00:00.000Z',
      updatedAt: '2026-01-15T10:00:00.000Z',
    };

    const v1Settings = makeSyntheticSettings({
      schoolName: 'Szkoła z Wersji 1',
    });

    await legacyDb.open();
    await legacyDb.table('students').put(v1Student);
    await legacyDb.table('journalEntries').put(v1Journal);
    await legacyDb.table('periodicEvaluations').put(v1EvalRaw);
    await legacyDb.table('facilitySettings').put(v1Settings);
    legacyDb.close();

    // 2. Otwórz tę samą bazę przez docelową klasę v2 (TeczkaWsparciaDatabase)
    const upgradedDb = new TeczkaWsparciaDatabase(legacyDbName);
    try {
      await upgradedDb.open();
      expect(upgradedDb.verno).toBe(2);

      const loadedStudent = await upgradedDb.students.get('v1-stu-1');
      expect(loadedStudent).toBeDefined();
      expect(loadedStudent?.lastName).toBe('Archiwalny');
      const normStudent = normalizeStudentProfile(loadedStudent!);
      expect(normStudent.wopfuDraft.strengths).toEqual([]);
      expect(normStudent.opinionSupportDraft.subjectAdaptations).toEqual([]);

      const loadedJournal = await upgradedDb.journalEntries.get('v1-jour-1');
      expect(loadedJournal).toBeDefined();
      expect(normalizeJournalEntry(loadedJournal!).relatedArea).toBe('');

      const loadedEval = await upgradedDb.periodicEvaluations.get('v1-eval-1');
      expect(loadedEval).toBeDefined();
      const normEval = normalizePeriodicEvaluation(loadedEval!);
      expect(normEval.periodType).toBe('I_POLROCZE');
      expect(normEval.modificationDecision).toBe('BRAK_ZMIAN');

      const loadedSettings = await upgradedDb.facilitySettings.get('default');
      expect(loadedSettings?.schoolName).toBe('Szkoła z Wersji 1');

      // Nowa tabela v2 (programAnnexes) powinna działać od razu po migracji
      await upgradedDb.programAnnexes.put({
        id: 'v2-new-annex',
        studentId: 'v1-stu-1',
        versionNumber: 1,
        annexDate: '2026-09-10',
        schoolYear: '2026/2027',
        decisionType: 'MODYFIKACJA_IPET',
        title: 'Aneks po migracji',
        changedSections: ['1. Cele edukacyjne i terapeutyczne'],
        changeDescription: 'Aktualizacja celów na nowy rok.',
        authorAndTeam: 'mgr Janina Koordynator',
        isTestData: true,
        createdAt: '2026-09-10T10:00:00.000Z',
        updatedAt: '2026-09-10T10:00:00.000Z',
      });
      expect(await upgradedDb.programAnnexes.count()).toBe(1);
    } finally {
      upgradedDb.close();
      await Dexie.delete(legacyDbName);
    }
  });
});
