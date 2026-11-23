import Dexie, { type Table } from 'dexie';
import type {
  FullDatabaseBundle,
  SingleStudentBundle,
} from '../crypto/cryptoService';
import {
  createTestOpinionStudentBundle,
  createTestStudentBundle,
  TEST_OPINION_STUDENT_ID,
  TEST_STUDENT_ID,
} from '../data/testStudentSeed';
import type {
  FacilitySettings,
  IpetStructureDraft,
  JournalEntry,
  OpinionSupportDraft,
  PeriodicEvaluation,
  ProgramModificationAnnex,
  StudentProfile,
  WopfuStructureDraft,
} from '../types/domain';

class TeczkaWsparciaDatabase extends Dexie {
  students!: Table<StudentProfile, string>;
  journalEntries!: Table<JournalEntry, string>;
  periodicEvaluations!: Table<PeriodicEvaluation, string>;
  programAnnexes!: Table<ProgramModificationAnnex, string>;
  facilitySettings!: Table<FacilitySettings, string>;

  constructor() {
    super('TeczkaWsparciaLocalDB');
    this.version(1).stores({
      students:
        'id, lastName, className, schoolYear, documentType, status, isTestData, updatedAt',
      journalEntries: 'id, studentId, date, category, isTestData, createdAt',
      periodicEvaluations:
        'id, studentId, schoolYear, semester, type, status, isTestData, evaluationDate',
      facilitySettings: 'id',
    });
    this.version(2).stores({
      students:
        'id, lastName, className, schoolYear, documentType, status, isTestData, updatedAt',
      journalEntries:
        'id, studentId, date, category, relatedArea, isTestData, createdAt',
      periodicEvaluations:
        'id, studentId, schoolYear, semester, periodType, type, status, isTestData, evaluationDate',
      programAnnexes:
        'id, studentId, schoolYear, annexDate, versionNumber, decisionType, isTestData, createdAt',
      facilitySettings: 'id',
    });
  }
}

export const db = new TeczkaWsparciaDatabase();

export const DEFAULT_FACILITY_SETTINGS: FacilitySettings = {
  id: 'default',
  schoolName: 'Szkoła Podstawowa nr 1',
  schoolType: 'Szkoła Podstawowa',
  address: '',
  city: '',
  directorName: '',
  defaultSchoolYear: '2026/2027',
  defaultTeamRole: 'Pedagog specjalny / Koordynator zespołu',
  theme: 'light',
  updatedAt: new Date().toISOString(),
};

export function createEmptyWopfuDraft(): WopfuStructureDraft {
  return {
    lastUpdatedAt: null,
    assessmentDate: null,
    conditionsAndContext: '',
    functioningAreas: {
      cognitive: '',
      communication: '',
      emotionalSocial: '',
      motorSensory: '',
    },
    strengths: [],
    barriersAndNeeds: [],
    developmentalNeedsSummary: '',
    isCompleted: false,
  };
}

export function createEmptyIpetDraft(): IpetStructureDraft {
  return {
    lastUpdatedAt: null,
    approvedDate: null,
    educationalAndTherapeuticGoals: '',
    methodsAndFormsOfWork: '',
    subjectAdaptations: [],
    integratedTeamActions: '',
    specialistSupportHours: [],
    rehabAndSpecialClasses: [],
    parentCollaborationNotes: '',
    isCompleted: false,
  };
}

export function createEmptyOpinionSupportDraft(): OpinionSupportDraft {
  return {
    lastUpdatedAt: null,
    implementedDate: null,
    functionalProfileSummary: '',
    subjectAdaptations: [],
    psychologicalPedagogicalSupport: [],
    parentCollaborationNotes: '',
    isCompleted: false,
  };
}

export function normalizeStudentProfile(raw: StudentProfile): StudentProfile {
  const emptyWopfu = createEmptyWopfuDraft();
  const emptyIpet = createEmptyIpetDraft();
  const emptyOpinion = createEmptyOpinionSupportDraft();

  return {
    ...raw,
    teamMembers: Array.isArray(raw.teamMembers) ? raw.teamMembers : [],
    pppDocument: {
      ...raw.pppDocument,
      submissionDate: raw.pppDocument?.submissionDate ?? '',
    },
    wopfuDraft: {
      ...emptyWopfu,
      ...(raw.wopfuDraft ?? {}),
      functioningAreas: {
        ...emptyWopfu.functioningAreas,
        ...(raw.wopfuDraft?.functioningAreas ?? {}),
      },
      strengths: Array.isArray(raw.wopfuDraft?.strengths)
        ? raw.wopfuDraft.strengths
        : [],
      barriersAndNeeds: Array.isArray(raw.wopfuDraft?.barriersAndNeeds)
        ? raw.wopfuDraft.barriersAndNeeds
        : [],
    },
    ipetDraft: {
      ...emptyIpet,
      ...(raw.ipetDraft ?? {}),
      subjectAdaptations: Array.isArray(raw.ipetDraft?.subjectAdaptations)
        ? raw.ipetDraft.subjectAdaptations.map((a, idx) => ({
            id: (a as { id?: string }).id ?? `adapt-${idx}`,
            subject: a.subject ?? '',
            methodsAndForms: a.methodsAndForms ?? '',
            assessmentCriteria: a.assessmentCriteria ?? '',
          }))
        : [],
      specialistSupportHours: Array.isArray(
        raw.ipetDraft?.specialistSupportHours,
      )
        ? raw.ipetDraft.specialistSupportHours.map((s, idx) => ({
            id: (s as { id?: string }).id ?? `sup-${idx}`,
            type: s.type ?? '',
            period: (s as { period?: string }).period ?? '',
            hoursPerWeek: Number(s.hoursPerWeek ?? 1),
            specialistName: s.specialistName ?? '',
            functionalGoal: (s as { functionalGoal?: string }).functionalGoal ?? '',
          }))
        : [],
      rehabAndSpecialClasses: Array.isArray(
        raw.ipetDraft?.rehabAndSpecialClasses,
      )
        ? raw.ipetDraft.rehabAndSpecialClasses
        : [],
    },
    opinionSupportDraft: {
      ...emptyOpinion,
      ...(raw.opinionSupportDraft ?? {}),
      subjectAdaptations: Array.isArray(
        raw.opinionSupportDraft?.subjectAdaptations,
      )
        ? raw.opinionSupportDraft.subjectAdaptations
        : [],
      psychologicalPedagogicalSupport: Array.isArray(
        raw.opinionSupportDraft?.psychologicalPedagogicalSupport,
      )
        ? raw.opinionSupportDraft.psychologicalPedagogicalSupport
        : [],
    },
  };
}

export function normalizeJournalEntry(raw: JournalEntry): JournalEntry {
  return {
    ...raw,
    whatWorked: raw.whatWorked ?? '',
    barriersObserved: raw.barriersObserved ?? '',
    conclusions: raw.conclusions ?? '',
  };
}

export function normalizePeriodicEvaluation(
  raw: PeriodicEvaluation,
): PeriodicEvaluation {
  const fallbackPeriodType =
    raw.semester === 'I' ? 'I_POLROCZE' : 'KONIEC_ROKU';
  return {
    ...raw,
    periodType: raw.periodType ?? fallbackPeriodType,
    periodLabel:
      raw.periodLabel ??
      (raw.semester === 'I'
        ? `I półrocze ${raw.schoolYear}`
        : `Koniec roku szkolnego ${raw.schoolYear}`),
    goalsReferenceNotes: raw.goalsReferenceNotes ?? '',
    effectivenessRating: raw.effectivenessRating ?? 'CZESCIOWA',
    modificationDecision:
      raw.modificationDecision ??
      (raw.modificationsNeeded ? 'WPROWADZONO_ANEKS' : 'BRAK_ZMIAN'),
    noChangeJustification: raw.noChangeJustification ?? '',
  };
}

export async function getFacilitySettings(): Promise<FacilitySettings> {
  const existing = await db.facilitySettings.get('default');
  if (existing) return existing;
  const fresh: FacilitySettings = {
    ...DEFAULT_FACILITY_SETTINGS,
    updatedAt: new Date().toISOString(),
  };
  await db.facilitySettings.put(fresh);
  return fresh;
}

export async function saveFacilitySettings(
  patch: Partial<Omit<FacilitySettings, 'id'>>,
): Promise<FacilitySettings> {
  const current = await getFacilitySettings();
  const updated: FacilitySettings = {
    ...current,
    ...patch,
    id: 'default',
    updatedAt: new Date().toISOString(),
  };
  await db.facilitySettings.put(updated);
  return updated;
}

export async function listStudents(): Promise<StudentProfile[]> {
  const all = await db.students.toArray();
  return all
    .map(normalizeStudentProfile)
    .sort((a, b) => a.lastName.localeCompare(b.lastName, 'pl'));
}

export async function getStudentById(
  id: string,
): Promise<StudentProfile | undefined> {
  const found = await db.students.get(id);
  return found ? normalizeStudentProfile(found) : undefined;
}

export async function saveStudent(student: StudentProfile): Promise<void> {
  await db.students.put({
    ...student,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteStudentAndRelated(studentId: string): Promise<void> {
  await db.transaction(
    'rw',
    [db.students, db.journalEntries, db.periodicEvaluations, db.programAnnexes],
    async () => {
      await db.students.delete(studentId);
      await db.journalEntries.where('studentId').equals(studentId).delete();
      await db.periodicEvaluations.where('studentId').equals(studentId).delete();
      await db.programAnnexes.where('studentId').equals(studentId).delete();
    },
  );
}

export async function listJournalEntriesByStudent(
  studentId: string,
): Promise<JournalEntry[]> {
  const entries = await db.journalEntries
    .where('studentId')
    .equals(studentId)
    .toArray();
  return entries
    .map(normalizeJournalEntry)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export async function addJournalEntry(entry: JournalEntry): Promise<void> {
  await db.journalEntries.put(entry);
}

export async function deleteJournalEntry(entryId: string): Promise<void> {
  await db.journalEntries.delete(entryId);
}

export async function listEvaluationsByStudent(
  studentId: string,
): Promise<PeriodicEvaluation[]> {
  const evals = await db.periodicEvaluations
    .where('studentId')
    .equals(studentId)
    .toArray();
  return evals
    .map(normalizePeriodicEvaluation)
    .sort((a, b) => b.evaluationDate.localeCompare(a.evaluationDate));
}

export async function addPeriodicEvaluation(
  evaluation: PeriodicEvaluation,
): Promise<void> {
  await db.periodicEvaluations.put(evaluation);
}

export async function deletePeriodicEvaluation(id: string): Promise<void> {
  await db.periodicEvaluations.delete(id);
}

export async function listAnnexesByStudent(
  studentId: string,
): Promise<ProgramModificationAnnex[]> {
  const annexes = await db.programAnnexes
    .where('studentId')
    .equals(studentId)
    .toArray();
  return annexes.sort((a, b) => b.versionNumber - a.versionNumber);
}

export async function addProgramAnnex(
  annex: ProgramModificationAnnex,
): Promise<void> {
  await db.programAnnexes.put(annex);
}

export async function deleteProgramAnnex(annexId: string): Promise<void> {
  await db.programAnnexes.delete(annexId);
}

export async function hasTestStudent(): Promise<boolean> {
  const testStudent = await db.students.get(TEST_STUDENT_ID);
  const opinionTestStudent = await db.students.get(TEST_OPINION_STUDENT_ID);
  return Boolean(testStudent || opinionTestStudent);
}

export async function hasTestOpinionStudent(): Promise<boolean> {
  const opinionTestStudent = await db.students.get(TEST_OPINION_STUDENT_ID);
  return Boolean(opinionTestStudent);
}

export async function loadTestStudentBundle(): Promise<void> {
  const bundle = createTestStudentBundle();
  await db.transaction(
    'rw',
    [db.students, db.journalEntries, db.periodicEvaluations, db.programAnnexes],
    async () => {
      await db.students.put(bundle.student);
      await db.journalEntries.bulkPut(bundle.journalEntries);
      await db.periodicEvaluations.bulkPut(bundle.evaluations);
      await db.programAnnexes.bulkPut(bundle.annexes);
    },
  );
}

export async function loadTestOpinionStudentBundle(): Promise<void> {
  const bundle = createTestOpinionStudentBundle();
  await db.transaction('rw', db.students, db.journalEntries, async () => {
    await db.students.put(bundle.student);
    await db.journalEntries.bulkPut(bundle.journalEntries);
  });
}

export async function removeTestStudentBundle(): Promise<void> {
  await db.transaction(
    'rw',
    [db.students, db.journalEntries, db.periodicEvaluations, db.programAnnexes],
    async () => {
      await db.students.where('id').equals(TEST_STUDENT_ID).delete();
      await db.students.where('id').equals(TEST_OPINION_STUDENT_ID).delete();
      await db.students.filter((s) => s.isTestData).delete();
      await db.journalEntries.filter((e) => e.isTestData).delete();
      await db.periodicEvaluations.filter((e) => e.isTestData).delete();
      await db.programAnnexes.filter((a) => a.isTestData).delete();
    },
  );
}

export interface DatabaseStats {
  studentsCount: number;
  testStudentsCount: number;
  journalEntriesCount: number;
  evaluationsCount: number;
  annexesCount: number;
}

export async function getDatabaseStats(): Promise<DatabaseStats> {
  const [students, journalEntriesCount, evaluationsCount, annexesCount] =
    await Promise.all([
      db.students.toArray(),
      db.journalEntries.count(),
      db.periodicEvaluations.count(),
      db.programAnnexes.count(),
    ]);

  return {
    studentsCount: students.length,
    testStudentsCount: students.filter((s) => s.isTestData).length,
    journalEntriesCount,
    evaluationsCount,
    annexesCount,
  };
}

export function normalizeProgramAnnex(
  raw: ProgramModificationAnnex,
): ProgramModificationAnnex {
  return {
    ...raw,
    changedSections: Array.isArray(raw.changedSections)
      ? raw.changedSections
      : [],
    changeDescription: raw.changeDescription ?? '',
    authorAndTeam: raw.authorAndTeam ?? '',
    isTestData: Boolean(raw.isTestData),
  };
}

export async function exportStudentBundle(
  studentId: string,
): Promise<SingleStudentBundle> {
  const student = await getStudentById(studentId);
  if (!student) {
    throw new Error('Nie znaleziono wybranego ucznia w bazie lokalnej.');
  }

  const [journalEntries, evaluations, annexes] = await Promise.all([
    listJournalEntriesByStudent(studentId),
    listEvaluationsByStudent(studentId),
    listAnnexesByStudent(studentId),
  ]);

  return {
    kind: 'SINGLE_STUDENT_BUNDLE',
    student,
    journalEntries,
    evaluations,
    annexes,
  };
}

export async function findMatchingStudentForImport(
  imported: StudentProfile,
): Promise<StudentProfile | null> {
  const byId = await db.students.get(imported.id);
  if (byId) return normalizeStudentProfile(byId);

  const all = await db.students.toArray();
  const targetFirst = imported.firstName.trim().toLowerCase();
  const targetLast = imported.lastName.trim().toLowerCase();
  const targetBirth = imported.birthDate?.trim();
  const targetDocNum = imported.pppDocument?.documentNumber
    ?.trim()
    .toLowerCase();

  const matched = all.find((s) => {
    const sameName =
      s.firstName.trim().toLowerCase() === targetFirst &&
      s.lastName.trim().toLowerCase() === targetLast;
    if (!sameName) return false;
    if (targetBirth && s.birthDate?.trim() === targetBirth) return true;
    if (
      targetDocNum &&
      s.pppDocument?.documentNumber?.trim().toLowerCase() === targetDocNum
    ) {
      return true;
    }
    return !targetBirth && !s.birthDate?.trim();
  });

  return matched ? normalizeStudentProfile(matched) : null;
}

export type StudentImportStrategy = 'MERGE_EXISTING' | 'CREATE_NEW';

export async function importStudentBundle(
  bundle: SingleStudentBundle,
  strategy: StudentImportStrategy,
  targetExistingId?: string,
): Promise<StudentProfile> {
  const now = new Date().toISOString();
  const normalizedStudent = normalizeStudentProfile(bundle.student);
  const rawJournals = Array.isArray(bundle.journalEntries)
    ? bundle.journalEntries.map(normalizeJournalEntry)
    : [];
  const rawEvals = Array.isArray(bundle.evaluations)
    ? bundle.evaluations.map(normalizePeriodicEvaluation)
    : [];
  const rawAnnexes = Array.isArray(bundle.annexes)
    ? bundle.annexes.map(normalizeProgramAnnex)
    : [];

  if (strategy === 'MERGE_EXISTING' && targetExistingId) {
    const studentToSave: StudentProfile = {
      ...normalizedStudent,
      id: targetExistingId,
      updatedAt: now,
    };

    const journalsToSave = rawJournals.map((j) => ({
      ...j,
      studentId: targetExistingId,
    }));
    const evalsToSave = rawEvals.map((e) => ({
      ...e,
      studentId: targetExistingId,
    }));
    const annexesToSave = rawAnnexes.map((a) => ({
      ...a,
      studentId: targetExistingId,
    }));

    await db.transaction(
      'rw',
      [db.students, db.journalEntries, db.periodicEvaluations, db.programAnnexes],
      async () => {
        await db.students.put(studentToSave);
        if (journalsToSave.length > 0) {
          await db.journalEntries.bulkPut(journalsToSave);
        }
        if (evalsToSave.length > 0) {
          await db.periodicEvaluations.bulkPut(evalsToSave);
        }
        if (annexesToSave.length > 0) {
          await db.programAnnexes.bulkPut(annexesToSave);
        }
      },
    );

    return studentToSave;
  }

  const newStudentId = crypto.randomUUID();
  const evalIdMap = new Map<string, string>();
  const annexIdMap = new Map<string, string>();

  rawEvals.forEach((ev) => {
    evalIdMap.set(ev.id, crypto.randomUUID());
  });
  rawAnnexes.forEach((an) => {
    annexIdMap.set(an.id, crypto.randomUUID());
  });

  const newStudent: StudentProfile = {
    ...normalizedStudent,
    id: newStudentId,
    createdAt: now,
    updatedAt: now,
  };

  const newJournals: JournalEntry[] = rawJournals.map((j) => ({
    ...j,
    id: crypto.randomUUID(),
    studentId: newStudentId,
  }));

  const newEvals: PeriodicEvaluation[] = rawEvals.map((e) => ({
    ...e,
    id: evalIdMap.get(e.id) ?? crypto.randomUUID(),
    studentId: newStudentId,
    linkedAnnexId: e.linkedAnnexId
      ? (annexIdMap.get(e.linkedAnnexId) ?? e.linkedAnnexId)
      : undefined,
  }));

  const newAnnexes: ProgramModificationAnnex[] = rawAnnexes.map((a) => ({
    ...a,
    id: annexIdMap.get(a.id) ?? crypto.randomUUID(),
    studentId: newStudentId,
    evaluationId: a.evaluationId
      ? (evalIdMap.get(a.evaluationId) ?? a.evaluationId)
      : undefined,
  }));

  await db.transaction(
    'rw',
    [db.students, db.journalEntries, db.periodicEvaluations, db.programAnnexes],
    async () => {
      await db.students.put(newStudent);
      if (newJournals.length > 0) {
        await db.journalEntries.bulkPut(newJournals);
      }
      if (newEvals.length > 0) {
        await db.periodicEvaluations.bulkPut(newEvals);
      }
      if (newAnnexes.length > 0) {
        await db.programAnnexes.bulkPut(newAnnexes);
      }
    },
  );

  return newStudent;
}

export async function exportFullDatabaseBundle(): Promise<FullDatabaseBundle> {
  const [
    settings,
    students,
    journalEntries,
    evaluations,
    annexes,
  ] = await Promise.all([
    getFacilitySettings(),
    listStudents(),
    db.journalEntries.toArray(),
    db.periodicEvaluations.toArray(),
    db.programAnnexes.toArray(),
  ]);

  const { appLock: _omitLock, ...settingsWithoutLock } = settings;

  return {
    kind: 'FULL_DATABASE_BUNDLE',
    facilitySettings: settingsWithoutLock,
    students,
    journalEntries: journalEntries.map(normalizeJournalEntry),
    evaluations: evaluations.map(normalizePeriodicEvaluation),
    annexes: annexes.map(normalizeProgramAnnex),
  };
}

export type FullBackupRestoreMode = 'MERGE' | 'REPLACE';

export async function importFullDatabaseBundle(
  bundle: FullDatabaseBundle,
  mode: FullBackupRestoreMode,
): Promise<{
  studentsCount: number;
  journalEntriesCount: number;
  evaluationsCount: number;
  annexesCount: number;
}> {
  const currentSettings = await getFacilitySettings();
  const normalizedStudents = (bundle.students ?? []).map(normalizeStudentProfile);
  const normalizedJournals = (bundle.journalEntries ?? []).map(
    normalizeJournalEntry,
  );
  const normalizedEvals = (bundle.evaluations ?? []).map(
    normalizePeriodicEvaluation,
  );
  const normalizedAnnexes = (bundle.annexes ?? []).map(normalizeProgramAnnex);

  const restoredSettings: FacilitySettings = {
    ...DEFAULT_FACILITY_SETTINGS,
    ...bundle.facilitySettings,
    id: 'default',
    appLock: currentSettings.appLock,
    updatedAt: new Date().toISOString(),
  };

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
      if (mode === 'REPLACE') {
        await db.students.clear();
        await db.journalEntries.clear();
        await db.periodicEvaluations.clear();
        await db.programAnnexes.clear();
      }

      if (normalizedStudents.length > 0) {
        await db.students.bulkPut(normalizedStudents);
      }
      if (normalizedJournals.length > 0) {
        await db.journalEntries.bulkPut(normalizedJournals);
      }
      if (normalizedEvals.length > 0) {
        await db.periodicEvaluations.bulkPut(normalizedEvals);
      }
      if (normalizedAnnexes.length > 0) {
        await db.programAnnexes.bulkPut(normalizedAnnexes);
      }

      await db.facilitySettings.put(restoredSettings);
    },
  );

  return {
    studentsCount: normalizedStudents.length,
    journalEntriesCount: normalizedJournals.length,
    evaluationsCount: normalizedEvals.length,
    annexesCount: normalizedAnnexes.length,
  };
}
