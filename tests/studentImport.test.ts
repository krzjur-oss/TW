import { beforeEach, describe, expect, it } from 'vitest';
import type { SingleStudentBundle } from '../src/crypto/cryptoService';
import {
  addJournalEntry,
  addPeriodicEvaluation,
  addProgramAnnex,
  analyzeSingleStudentImport,
  db,
  exportStudentBundle,
  importStudentBundle,
  saveStudent,
} from '../src/db/database';
import {
  makeSyntheticAnnex,
  makeSyntheticEvaluation,
  makeSyntheticJournalEntry,
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

describe('Import pojedynczego ucznia — kolizje ID, relacje ocena–aneks, duplikaty i rollback', () => {
  beforeEach(async () => {
    await clearAllTables();
  });

  it('chroni rekordy ucznia A przed kolizją ID rekordów podrzędnych podczas importu ucznia B', async () => {
    const studentA = makeSyntheticStudent('student-A', {
      firstName: 'Alicja',
      lastName: 'Alfa',
      pppDocument: {
        ...makeSyntheticStudent('student-A').pppDocument,
        documentNumber: 'ORZ/A/2026/001',
      },
    });
    const jA = makeSyntheticJournalEntry('shared-journal-id', 'student-A', {
      title: 'Oryginalna obserwacja Alicji',
    });
    const aA = makeSyntheticAnnex('shared-annex-id', 'student-A', {
      title: 'Oryginalny aneks Alicji',
      evaluationId: 'shared-eval-id',
    });
    const eA = makeSyntheticEvaluation('shared-eval-id', 'student-A', {
      progressSummary: 'Oryginalna ocena Alicji',
      linkedAnnexId: 'shared-annex-id',
    });

    await saveStudent(studentA);
    await addJournalEntry(jA);
    await addProgramAnnex(aA);
    await addPeriodicEvaluation(eA);

    // Uczeń B posiada DOKŁADNIE TE SAME identyfikatory rekordów podrzędnych co uczeń A!
    const studentB = makeSyntheticStudent('student-B', {
      firstName: 'Bartosz',
      lastName: 'Beta',
      pppDocument: {
        ...makeSyntheticStudent('student-B').pppDocument,
        documentNumber: 'ORZ/B/2026/002',
      },
    });
    const bundleB: SingleStudentBundle = {
      kind: 'SINGLE_STUDENT_BUNDLE',
      student: studentB,
      journalEntries: [
        makeSyntheticJournalEntry('shared-journal-id', 'student-B', {
          title: 'Obserwacja Bartosza (kolizyjny ID)',
        }),
      ],
      annexes: [
        makeSyntheticAnnex('shared-annex-id', 'student-B', {
          title: 'Aneks Bartosza (kolizyjny ID)',
          evaluationId: 'shared-eval-id',
        }),
      ],
      evaluations: [
        makeSyntheticEvaluation('shared-eval-id', 'student-B', {
          progressSummary: 'Ocena Bartosza (kolizyjny ID)',
          linkedAnnexId: 'shared-annex-id',
        }),
      ],
    };

    const preview = await analyzeSingleStudentImport(bundleB);
    expect(preview.totalCrossStudentCollisions).toBe(3);

    const importedStudentB = await importStudentBundle(bundleB, 'CREATE_NEW');
    expect(importedStudentB.id).toBeTruthy();
    expect(importedStudentB.id).not.toBe('student-A');
    expect(importedStudentB.id).not.toBe('student-B');

    // Weryfikacja: dane ucznia A pozostały w 100% nienaruszone
    const storedAJournal = await db.journalEntries.get('shared-journal-id');
    const storedAEval = await db.periodicEvaluations.get('shared-eval-id');
    const storedAAnnex = await db.programAnnexes.get('shared-annex-id');
    expect(storedAJournal?.studentId).toBe('student-A');
    expect(storedAJournal?.title).toBe('Oryginalna obserwacja Alicji');
    expect(storedAEval?.studentId).toBe('student-A');
    expect(storedAEval?.linkedAnnexId).toBe('shared-annex-id');
    expect(storedAAnnex?.studentId).toBe('student-A');
    expect(storedAAnnex?.evaluationId).toBe('shared-eval-id');

    // Weryfikacja: uczeń B dostał nowe UUID dla rekordów podrzędnych i spójne referencje
    const bJournals = await db.journalEntries
      .where('studentId')
      .equals(importedStudentB.id)
      .toArray();
    const bEvals = await db.periodicEvaluations
      .where('studentId')
      .equals(importedStudentB.id)
      .toArray();
    const bAnnexes = await db.programAnnexes
      .where('studentId')
      .equals(importedStudentB.id)
      .toArray();

    expect(bJournals).toHaveLength(1);
    expect(bEvals).toHaveLength(1);
    expect(bAnnexes).toHaveLength(1);
    expect(bJournals[0].id).not.toBe('shared-journal-id');
    expect(bEvals[0].id).not.toBe('shared-eval-id');
    expect(bAnnexes[0].id).not.toBe('shared-annex-id');
    expect(bEvals[0].linkedAnnexId).toBe(bAnnexes[0].id);
    expect(bAnnexes[0].evaluationId).toBe(bEvals[0].id);
  });

  it('chroni także w trybie MERGE_EXISTING gdy ten sam ID podrzędny należy w bazie do innego ucznia', async () => {
    const studentA = makeSyntheticStudent('student-A');
    const studentB = makeSyntheticStudent('student-B', {
      firstName: 'Celina',
      lastName: 'Gamma',
      pppDocument: {
        ...makeSyntheticStudent('student-B').pppDocument,
        documentNumber: 'ORZ/C/2026/003',
      },
    });
    await saveStudent(studentA);
    await saveStudent(studentB);
    await addJournalEntry(
      makeSyntheticJournalEntry('colliding-j', 'student-A', {
        title: 'Nienaruszalny wpis A',
      }),
    );

    const bundleForB: SingleStudentBundle = {
      kind: 'SINGLE_STUDENT_BUNDLE',
      student: studentB,
      journalEntries: [
        makeSyntheticJournalEntry('colliding-j', 'student-B', {
          title: 'Wpis B próbujący kolizji z A',
        }),
      ],
      evaluations: [],
      annexes: [],
    };

    const preview = await analyzeSingleStudentImport(bundleForB, 'student-B');
    expect(preview.totalCrossStudentCollisions).toBe(1);

    await importStudentBundle(
      bundleForB,
      'MERGE_EXISTING',
      'student-B',
      'UPDATE_MATCHING',
    );

    const checkA = await db.journalEntries.get('colliding-j');
    expect(checkA?.studentId).toBe('student-A');
    expect(checkA?.title).toBe('Nienaruszalny wpis A');

    const bEntries = await db.journalEntries
      .where('studentId')
      .equals('student-B')
      .toArray();
    expect(bEntries).toHaveLength(1);
    expect(bEntries[0].id).not.toBe('colliding-j');
  });

  it('obsługuje ponowny import bez mnożenia duplikatów (UPDATE_MATCHING / KEEP_EXISTING / ADD_AS_NEW)', async () => {
    const student = makeSyntheticStudent('stu-reimport');
    await saveStudent(student);
    await addJournalEntry(
      makeSyntheticJournalEntry('j-1', 'stu-reimport', { title: 'Wpis pierwotny' }),
    );
    await addProgramAnnex(
      makeSyntheticAnnex('a-1', 'stu-reimport', { evaluationId: 'e-1' }),
    );
    await addPeriodicEvaluation(
      makeSyntheticEvaluation('e-1', 'stu-reimport', { linkedAnnexId: 'a-1' }),
    );

    const exported = await exportStudentBundle('stu-reimport');
    expect(exported.journalEntries).toHaveLength(1);

    // Ponowny identyczny import -> 3 identyczne, 0 nowych
    const identicalAnalysis = await analyzeSingleStudentImport(exported, 'stu-reimport');
    expect(identicalAnalysis.totalIdentical).toBe(3);
    expect(identicalAnalysis.totalConflicts).toBe(0);
    expect(identicalAnalysis.totalNew).toBe(0);

    await importStudentBundle(
      exported,
      'MERGE_EXISTING',
      'stu-reimport',
      'UPDATE_MATCHING',
    );
    expect(await db.journalEntries.where('studentId').equals('stu-reimport').count()).toBe(1);

    // Zmodyfikowany wpis w imporcie
    const modifiedBundle: SingleStudentBundle = {
      ...exported,
      journalEntries: [
        {
          ...exported.journalEntries[0],
          title: 'Wpis zaktualizowany z pliku',
        },
      ],
    };

    const modAnalysis = await analyzeSingleStudentImport(modifiedBundle, 'stu-reimport');
    expect(modAnalysis.totalConflicts).toBe(1);

    // 1) KEEP_EXISTING nie nadpisuje lokalnej wersji
    await importStudentBundle(
      modifiedBundle,
      'MERGE_EXISTING',
      'stu-reimport',
      'KEEP_EXISTING',
    );
    expect((await db.journalEntries.get('j-1'))?.title).toBe('Wpis pierwotny');

    // 2) UPDATE_MATCHING aktualizuje bez dublowania
    await importStudentBundle(
      modifiedBundle,
      'MERGE_EXISTING',
      'stu-reimport',
      'UPDATE_MATCHING',
    );
    expect((await db.journalEntries.get('j-1'))?.title).toBe('Wpis zaktualizowany z pliku');
    expect(await db.journalEntries.where('studentId').equals('stu-reimport').count()).toBe(1);

    // 3) ADD_AS_NEW świadomie dopisuje nowy wpis z nowym UUID
    await importStudentBundle(
      exported,
      'MERGE_EXISTING',
      'stu-reimport',
      'ADD_AS_NEW',
    );
    expect(await db.journalEntries.where('studentId').equals('stu-reimport').count()).toBe(2);
  });

  it('wykonuje pełny rollback transakcji przy błędzie zapisu bez pozostawienia częściowych danych', async () => {
    const existing = makeSyntheticStudent('stu-safe', { firstName: 'Bezpieczny' });
    await saveStudent(existing);

    const incoming: SingleStudentBundle = {
      kind: 'SINGLE_STUDENT_BUNDLE',
      student: makeSyntheticStudent('stu-fail', {
        firstName: 'TestRollback',
      }),
      journalEntries: [makeSyntheticJournalEntry('j-fail', 'stu-fail')],
      evaluations: [],
      annexes: [],
    };

    // Symulacja awarii w trakcie zapisu tabeli journalEntries wewnątrz transakcji
    const errorHook = () => {
      throw new Error('Symulowany błąd zapisu IndexedDB');
    };
    db.journalEntries.hook('creating', errorHook);

    try {
      await expect(
        importStudentBundle(incoming, 'CREATE_NEW'),
      ).rejects.toThrow(/Symulowany błąd zapisu/);
    } finally {
      db.journalEntries.hook('creating').unsubscribe(errorHook);
    }

    // Nowy uczeń nie może zostać częściowo zapisany po przerwaniu transakcji
    const remainingStudents = await db.students.toArray();
    expect(remainingStudents).toHaveLength(1);
    expect(remainingStudents[0].id).toBe('stu-safe');
    expect(await db.journalEntries.count()).toBe(0);
  });
});
