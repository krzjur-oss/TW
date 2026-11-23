import { describe, expect, it } from 'vitest';
import {
  normalizeJournalEntry,
  normalizePeriodicEvaluation,
  normalizeProgramAnnex,
  normalizeStudentProfile,
} from '../src/db/database';
import {
  BundleValidationError,
  isValidIsoDateStrict,
  MAX_ARCHIVE_BYTES,
  MAX_DECRYPTED_BYTES,
  VALIDATION_LIMITS,
  validateFacilitySettings,
  validateFullDatabaseBundle,
  validateSingleStudentBundle,
  validateStudentProfile,
} from '../src/validation/bundleValidation';
import {
  makeSyntheticAnnex,
  makeSyntheticEvaluation,
  makeSyntheticJournalEntry,
  makeSyntheticSettings,
  makeSyntheticStudent,
} from './fixtures';

describe('Walidacja i normalizacja danych (bundleValidation + normalizers)', () => {
  it('waliduje poprawny pakiet SingleStudentBundle i FullDatabaseBundle', () => {
    const student = makeSyntheticStudent('stu-1');
    const annex = makeSyntheticAnnex('ann-1', 'stu-1', {
      evaluationId: 'eval-1',
    });
    const evaluation = makeSyntheticEvaluation('eval-1', 'stu-1', {
      linkedAnnexId: 'ann-1',
    });
    const journal = makeSyntheticJournalEntry('jour-1', 'stu-1');
    const settings = makeSyntheticSettings();

    expect(() =>
      validateSingleStudentBundle({
        kind: 'SINGLE_STUDENT_BUNDLE',
        student,
        journalEntries: [journal],
        evaluations: [evaluation],
        annexes: [annex],
      }),
    ).not.toThrow();

    expect(() =>
      validateFullDatabaseBundle({
        kind: 'FULL_DATABASE_BUNDLE',
        facilitySettings: settings,
        students: [student],
        journalEntries: [journal],
        evaluations: [evaluation],
        annexes: [annex],
      }),
    ).not.toThrow();
  });

  it('sprawdza ścisłą poprawność dat kalendarzowych YYYY-MM-DD', () => {
    expect(isValidIsoDateStrict('2026-09-30')).toBe(true);
    expect(isValidIsoDateStrict('2024-02-29')).toBe(true); // rok przestępny
    expect(isValidIsoDateStrict('2025-02-29')).toBe(false); // rok nieprzestępny
    expect(isValidIsoDateStrict('2026-02-31')).toBe(false);
    expect(isValidIsoDateStrict('2026-13-01')).toBe(false);
    expect(isValidIsoDateStrict('30-09-2026')).toBe(false);
  });

  it('odrzuca nieprawidłowe enumy, daty, wartości godzin i puste wymagane pola', () => {
    const invalidEnum = makeSyntheticStudent('stu-bad-enum', {
      documentType: 'INNY' as unknown as 'ORZECZENIE',
    });
    expect(() => validateStudentProfile(invalidEnum)).toThrow(
      BundleValidationError,
    );

    const invalidDate = makeSyntheticStudent('stu-bad-date', {
      birthDate: '2025-02-29',
    });
    expect(() => validateStudentProfile(invalidDate)).toThrow(
      BundleValidationError,
    );

    const badHours = makeSyntheticStudent('stu-bad-hours');
    badHours.ipetDraft.specialistSupportHours[0].hoursPerWeek = 0;
    expect(() => validateStudentProfile(badHours)).toThrow(
      BundleValidationError,
    );

    badHours.ipetDraft.specialistSupportHours[0].hoursPerWeek = 65;
    expect(() => validateStudentProfile(badHours)).toThrow(
      BundleValidationError,
    );

    const badSettings = makeSyntheticSettings({
      theme: 'neon' as unknown as 'light',
    });
    expect(() => validateFacilitySettings(badSettings)).toThrow(
      BundleValidationError,
    );
  });

  it('odrzuca przekroczenie limitów długości tekstu i tablic oraz duplikaty ID', () => {
    const tooLongName = makeSyntheticStudent('stu-long', {
      firstName: 'A'.repeat(VALIDATION_LIMITS.maxShortTextLength + 1),
    });
    expect(() => validateStudentProfile(tooLongName)).toThrow(
      BundleValidationError,
    );

    const student = makeSyntheticStudent('stu-1');
    const j1 = makeSyntheticJournalEntry('dup-id', 'stu-1');
    const j2 = makeSyntheticJournalEntry('dup-id', 'stu-1');

    expect(() =>
      validateSingleStudentBundle({
        kind: 'SINGLE_STUDENT_BUNDLE',
        student,
        journalEntries: [j1, j2],
        evaluations: [],
        annexes: [],
      }),
    ).toThrow(/Duplikat identyfikatora/);
  });

  it('odrzuca niezgodny studentId i zerwane relacje linkedAnnexId / evaluationId (także między uczniami)', () => {
    const s1 = makeSyntheticStudent('stu-1');
    const s2 = makeSyntheticStudent('stu-2');

    const foreignJournal = makeSyntheticJournalEntry('j-foreign', 'stu-2');
    expect(() =>
      validateSingleStudentBundle({
        kind: 'SINGLE_STUDENT_BUNDLE',
        student: s1,
        journalEntries: [foreignJournal],
        evaluations: [],
        annexes: [],
      }),
    ).toThrow(/studentId/);

    const evalWithBrokenAnnex = makeSyntheticEvaluation('e-1', 'stu-1', {
      linkedAnnexId: 'non-existent-annex',
    });
    expect(() =>
      validateSingleStudentBundle({
        kind: 'SINGLE_STUDENT_BUNDLE',
        student: s1,
        journalEntries: [],
        evaluations: [evalWithBrokenAnnex],
        annexes: [],
      }),
    ).toThrow(/linkedAnnexId/);

    // W pełnym backupie ocena ucznia 1 wskazuje na aneks należący do ucznia 2
    const annexStu2 = makeSyntheticAnnex('a-stu2', 'stu-2');
    const evalStu1CrossRef = makeSyntheticEvaluation('e-stu1', 'stu-1', {
      linkedAnnexId: 'a-stu2',
    });
    expect(() =>
      validateFullDatabaseBundle({
        kind: 'FULL_DATABASE_BUNDLE',
        facilitySettings: makeSyntheticSettings(),
        students: [s1, s2],
        journalEntries: [],
        evaluations: [evalStu1CrossRef],
        annexes: [annexStu2],
      }),
    ).toThrow(/innego ucznia/);
  });

  it('zachowuje zdefiniowane limity rozmiaru wejścia i odszyfrowania', () => {
    expect(MAX_ARCHIVE_BYTES).toBeGreaterThanOrEqual(20 * 1024 * 1024);
    expect(MAX_DECRYPTED_BYTES).toBeGreaterThanOrEqual(10 * 1024 * 1024);
  });

  it('normalizuje rekordy ze starszej wersji bazy bez utraty danych', () => {
    const legacyStudent = makeSyntheticStudent('stu-legacy');
    delete (legacyStudent as { wopfuDraft?: unknown }).wopfuDraft;
    delete (legacyStudent.pppDocument as { submissionDate?: unknown })
      .submissionDate;

    const normalizedStudent = normalizeStudentProfile(legacyStudent);
    expect(normalizedStudent.wopfuDraft.functioningAreas.cognitive).toBe('');
    expect(normalizedStudent.pppDocument.submissionDate).toBe('');

    const legacyEval = makeSyntheticEvaluation('ev-legacy', 'stu-legacy');
    delete (legacyEval as { periodType?: unknown }).periodType;
    delete (legacyEval as { periodLabel?: unknown }).periodLabel;
    delete (legacyEval as { modificationDecision?: unknown })
      .modificationDecision;
    legacyEval.modificationsNeeded = 'Zmiana godzin';

    const normalizedEval = normalizePeriodicEvaluation(legacyEval);
    expect(normalizedEval.periodType).toBe('I_POLROCZE');
    expect(normalizedEval.periodLabel).toContain('2026/2027');
    expect(normalizedEval.modificationDecision).toBe('WPROWADZONO_ANEKS');

    const legacyJournal = makeSyntheticJournalEntry('j-legacy', 'stu-legacy');
    delete (legacyJournal as { whatWorked?: unknown }).whatWorked;
    expect(normalizeJournalEntry(legacyJournal).whatWorked).toBe('');

    const legacyAnnex = makeSyntheticAnnex('a-legacy', 'stu-legacy');
    delete (legacyAnnex as { changedSections?: unknown }).changedSections;
    expect(normalizeProgramAnnex(legacyAnnex).changedSections).toEqual([]);
  });
});
