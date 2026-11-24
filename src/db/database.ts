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
import {
  validateFullDatabaseBundle,
  validateSingleStudentBundle,
} from '../validation/bundleValidation';
import {
  normalizeAutoLockMinutes,
  normalizeBackgroundLockPolicy,
} from '../utils/autoLockController';

export class TeczkaWsparciaDatabase extends Dexie {
  students!: Table<StudentProfile, string>;
  journalEntries!: Table<JournalEntry, string>;
  periodicEvaluations!: Table<PeriodicEvaluation, string>;
  programAnnexes!: Table<ProgramModificationAnnex, string>;
  facilitySettings!: Table<FacilitySettings, string>;

  constructor(databaseName = 'TeczkaWsparciaLocalDB') {
    super(databaseName);
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
    birthDate: raw.birthDate ?? '',
    teamCoordinator: raw.teamCoordinator ?? '',
    teamMembers: Array.isArray(raw.teamMembers) ? raw.teamMembers : [],
    pppDocument: {
      documentNumber: raw.pppDocument?.documentNumber ?? '',
      issueDate: raw.pppDocument?.issueDate ?? '',
      submissionDate: raw.pppDocument?.submissionDate ?? '',
      validUntil: raw.pppDocument?.validUntil ?? '',
      issuingAuthority: raw.pppDocument?.issuingAuthority ?? '',
      reasonCategory: raw.pppDocument?.reasonCategory ?? '',
      recommendationsSummary: raw.pppDocument?.recommendationsSummary ?? '',
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
    authorName: raw.authorName ?? '',
    authorRole: raw.authorRole ?? '',
    content: raw.content ?? '',
    relatedArea: raw.relatedArea ?? '',
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
    teamMembers: raw.teamMembers ?? '',
    goalsReferenceNotes: raw.goalsReferenceNotes ?? '',
    effectivenessRating: raw.effectivenessRating ?? 'CZESCIOWA',
    modificationDecision:
      raw.modificationDecision ??
      (raw.modificationsNeeded ? 'WPROWADZONO_ANEKS' : 'BRAK_ZMIAN'),
    modificationsNeeded: raw.modificationsNeeded ?? '',
    noChangeJustification: raw.noChangeJustification ?? '',
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

export function normalizeFacilitySettings(
  raw: FacilitySettings,
): FacilitySettings {
  const normalizedAppLock = raw.appLock
    ? {
        ...raw.appLock,
        autoLockMinutes: normalizeAutoLockMinutes(
          raw.appLock.autoLockMinutes,
          0,
        ),
        backgroundLockPolicy: normalizeBackgroundLockPolicy(
          raw.appLock.backgroundLockPolicy,
          raw.appLock.autoLockMinutes === undefined ? 'OFF' : 'RESPECT_IDLE',
        ),
      }
    : undefined;

  return {
    ...DEFAULT_FACILITY_SETTINGS,
    ...raw,
    id: 'default',
    address: raw.address ?? '',
    city: raw.city ?? '',
    directorName: raw.directorName ?? '',
    defaultTeamRole:
      raw.defaultTeamRole ?? DEFAULT_FACILITY_SETTINGS.defaultTeamRole,
    theme: raw.theme === 'dark' ? 'dark' : 'light',
    appLock: normalizedAppLock,
  };
}

export async function getFacilitySettings(): Promise<FacilitySettings> {
  const existing = await db.facilitySettings.get('default');
  if (existing) return normalizeFacilitySettings(existing);
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

function stableJson(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableJson).join(',')}]`;
  }
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj).sort();
    return `{${keys
      .filter((k) => obj[k] !== undefined)
      .map((k) => `${JSON.stringify(k)}:${stableJson(obj[k])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

function isSameStudentBusinessData(
  a: StudentProfile,
  b: StudentProfile,
): boolean {
  const normA = normalizeStudentProfile(a);
  const normB = normalizeStudentProfile(b);
  const stripMeta = (s: StudentProfile) => ({
    firstName: s.firstName,
    lastName: s.lastName,
    birthDate: s.birthDate,
    className: s.className,
    schoolYear: s.schoolYear,
    educationStage: s.educationStage,
    documentType: s.documentType,
    pppDocument: s.pppDocument,
    teamCoordinator: s.teamCoordinator,
    teamMembers: s.teamMembers,
    status: s.status,
    isTestData: s.isTestData,
    wopfuDraft: s.wopfuDraft,
    ipetDraft: s.ipetDraft,
    opinionSupportDraft: s.opinionSupportDraft,
  });
  return stableJson(stripMeta(normA)) === stableJson(stripMeta(normB));
}

function journalFingerprint(raw: JournalEntry): string {
  const j = normalizeJournalEntry(raw);
  return stableJson({
    date: j.date,
    category: j.category,
    authorName: j.authorName,
    authorRole: j.authorRole,
    title: j.title,
    content: j.content,
    relatedArea: j.relatedArea,
    whatWorked: j.whatWorked,
    barriersObserved: j.barriersObserved,
    conclusions: j.conclusions,
    isTestData: j.isTestData,
  });
}

function evaluationFingerprint(raw: PeriodicEvaluation): string {
  const e = normalizePeriodicEvaluation(raw);
  return stableJson({
    schoolYear: e.schoolYear,
    semester: e.semester,
    periodType: e.periodType,
    periodLabel: e.periodLabel,
    evaluationDate: e.evaluationDate,
    type: e.type,
    teamMembers: e.teamMembers,
    goalsReferenceNotes: e.goalsReferenceNotes,
    effectivenessRating: e.effectivenessRating,
    progressSummary: e.progressSummary,
    modificationDecision: e.modificationDecision,
    modificationsNeeded: e.modificationsNeeded,
    noChangeJustification: e.noChangeJustification,
    hasLinkedAnnex: Boolean(e.linkedAnnexId),
    status: e.status,
    isTestData: e.isTestData,
  });
}

function annexFingerprint(raw: ProgramModificationAnnex): string {
  const a = normalizeProgramAnnex(raw);
  return stableJson({
    versionNumber: a.versionNumber,
    annexDate: a.annexDate,
    schoolYear: a.schoolYear,
    hasEvaluationLink: Boolean(a.evaluationId),
    decisionType: a.decisionType,
    title: a.title,
    changedSections: a.changedSections,
    changeDescription: a.changeDescription,
    authorAndTeam: a.authorAndTeam,
    parentNotifiedDate: a.parentNotifiedDate ?? '',
    isTestData: a.isTestData,
  });
}

function createUniqueUuid(usedIds: Set<string>): string {
  let candidate = crypto.randomUUID();
  while (usedIds.has(candidate)) {
    candidate = crypto.randomUUID();
  }
  usedIds.add(candidate);
  return candidate;
}

function matchesStudentIdentity(
  imported: StudentProfile,
  candidates: StudentProfile[],
): StudentProfile | null {
  const byId = candidates.find((s) => s.id === imported.id);
  if (byId) return normalizeStudentProfile(byId);

  const targetFirst = imported.firstName.trim().toLowerCase();
  const targetLast = imported.lastName.trim().toLowerCase();
  const targetBirth = imported.birthDate?.trim();
  const targetDocNum = imported.pppDocument?.documentNumber
    ?.trim()
    .toLowerCase();

  const matched = candidates.find((s) => {
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

export async function findMatchingStudentForImport(
  imported: StudentProfile,
): Promise<StudentProfile | null> {
  const all = await db.students.toArray();
  return matchesStudentIdentity(imported, all);
}

export type StudentImportStrategy = 'MERGE_EXISTING' | 'CREATE_NEW';

export type StudentMergeDuplicatePolicy =
  | 'UPDATE_MATCHING'
  | 'KEEP_EXISTING'
  | 'ADD_AS_NEW';

export interface ChildImportBucketsSummary {
  total: number;
  newCount: number;
  identicalCount: number;
  conflictingCount: number;
  crossStudentCollisionCount: number;
}

export interface SingleStudentImportAnalysis {
  targetStudentId: string | null;
  studentProfileChanged: boolean;
  journals: ChildImportBucketsSummary;
  evaluations: ChildImportBucketsSummary;
  annexes: ChildImportBucketsSummary;
  totalNew: number;
  totalIdentical: number;
  totalConflicts: number;
  totalCrossStudentCollisions: number;
}

export async function analyzeSingleStudentImport(
  bundle: SingleStudentBundle,
  targetExistingId?: string,
): Promise<SingleStudentImportAnalysis> {
  const validated = validateSingleStudentBundle(bundle);
  const normalizedStudent = normalizeStudentProfile(validated.student);
  const rawJournals = validated.journalEntries.map(normalizeJournalEntry);
  const rawEvals = validated.evaluations.map(normalizePeriodicEvaluation);
  const rawAnnexes = validated.annexes.map(normalizeProgramAnnex);

  const [existingTarget, allJournals, allEvals, allAnnexes] = await Promise.all([
    targetExistingId ? db.students.get(targetExistingId) : Promise.resolve(undefined),
    db.journalEntries.toArray(),
    db.periodicEvaluations.toArray(),
    db.programAnnexes.toArray(),
  ]);

  const journalById = new Map(
    allJournals.map((j) => [j.id, normalizeJournalEntry(j)]),
  );
  const evalById = new Map(
    allEvals.map((e) => [e.id, normalizePeriodicEvaluation(e)]),
  );
  const annexById = new Map(
    allAnnexes.map((a) => [a.id, normalizeProgramAnnex(a)]),
  );

  const analyzeGroup = <T extends { id: string; studentId: string }>(
    items: T[],
    dbById: Map<string, T>,
    targetRecords: T[],
    fpFn: (item: T) => string,
  ): ChildImportBucketsSummary => {
    const targetFpSet = new Set(targetRecords.map(fpFn));
    let newCount = 0;
    let identicalCount = 0;
    let conflictingCount = 0;
    let crossStudentCollisionCount = 0;

    for (const item of items) {
      const dbHit = dbById.get(item.id);
      if (targetExistingId) {
        if (dbHit && dbHit.studentId === targetExistingId) {
          if (fpFn(dbHit) === fpFn(item)) {
            identicalCount += 1;
          } else {
            conflictingCount += 1;
          }
          continue;
        }
        if (dbHit && dbHit.studentId !== targetExistingId) {
          crossStudentCollisionCount += 1;
        }
        if (targetFpSet.has(fpFn(item))) {
          identicalCount += 1;
        } else {
          newCount += 1;
        }
      } else {
        if (dbHit) {
          crossStudentCollisionCount += 1;
        }
        newCount += 1;
      }
    }

    return {
      total: items.length,
      newCount,
      identicalCount,
      conflictingCount,
      crossStudentCollisionCount,
    };
  };

  const targetJournals = targetExistingId
    ? allJournals
        .filter((j) => j.studentId === targetExistingId)
        .map(normalizeJournalEntry)
    : [];
  const targetEvals = targetExistingId
    ? allEvals
        .filter((e) => e.studentId === targetExistingId)
        .map(normalizePeriodicEvaluation)
    : [];
  const targetAnnexes = targetExistingId
    ? allAnnexes
        .filter((a) => a.studentId === targetExistingId)
        .map(normalizeProgramAnnex)
    : [];

  const journals = analyzeGroup(
    rawJournals,
    journalById,
    targetJournals,
    journalFingerprint,
  );
  const evaluations = analyzeGroup(
    rawEvals,
    evalById,
    targetEvals,
    evaluationFingerprint,
  );
  const annexes = analyzeGroup(
    rawAnnexes,
    annexById,
    targetAnnexes,
    annexFingerprint,
  );

  const studentProfileChanged = existingTarget
    ? !isSameStudentBusinessData(existingTarget, normalizedStudent)
    : true;

  return {
    targetStudentId: existingTarget ? existingTarget.id : null,
    studentProfileChanged,
    journals,
    evaluations,
    annexes,
    totalNew: journals.newCount + evaluations.newCount + annexes.newCount,
    totalIdentical:
      journals.identicalCount +
      evaluations.identicalCount +
      annexes.identicalCount,
    totalConflicts:
      journals.conflictingCount +
      evaluations.conflictingCount +
      annexes.conflictingCount,
    totalCrossStudentCollisions:
      journals.crossStudentCollisionCount +
      evaluations.crossStudentCollisionCount +
      annexes.crossStudentCollisionCount,
  };
}

export async function importStudentBundle(
  bundle: SingleStudentBundle,
  strategy: StudentImportStrategy,
  targetExistingId?: string,
  duplicatePolicy: StudentMergeDuplicatePolicy = 'UPDATE_MATCHING',
): Promise<StudentProfile> {
  // 1. Walidacja runtime pakietu przed jakąkolwiek operacją na bazie
  const validated = validateSingleStudentBundle(bundle);
  const now = new Date().toISOString();
  const normalizedStudent = normalizeStudentProfile(validated.student);
  const rawJournals = validated.journalEntries.map(normalizeJournalEntry);
  const rawEvals = validated.evaluations.map(normalizePeriodicEvaluation);
  const rawAnnexes = validated.annexes.map(normalizeProgramAnnex);

  if (strategy === 'MERGE_EXISTING') {
    if (!targetExistingId) {
      throw new Error(
        'Brak identyfikatora docelowego ucznia dla trybu scalania.',
      );
    }

    return db.transaction(
      'rw',
      [db.students, db.journalEntries, db.periodicEvaluations, db.programAnnexes],
      async () => {
        const existingTarget = await db.students.get(targetExistingId);
        if (!existingTarget) {
          throw new Error(
            'Docelowy profil ucznia nie istnieje już w lokalnej bazie.',
          );
        }

        const [allStudents, allJournals, allEvals, allAnnexes] =
          await Promise.all([
            db.students.toArray(),
            db.journalEntries.toArray(),
            db.periodicEvaluations.toArray(),
            db.programAnnexes.toArray(),
          ]);

        void allStudents;
        const journalById = new Map(
          allJournals.map((j) => [j.id, normalizeJournalEntry(j)]),
        );
        const evalById = new Map(
          allEvals.map((e) => [e.id, normalizePeriodicEvaluation(e)]),
        );
        const annexById = new Map(
          allAnnexes.map((a) => [a.id, normalizeProgramAnnex(a)]),
        );

        const usedJournalIds = new Set(journalById.keys());
        const usedEvalIds = new Set(evalById.keys());
        const usedAnnexIds = new Set(annexById.keys());

        const targetJournalsByFp = new Map<string, JournalEntry>();
        for (const j of allJournals) {
          if (j.studentId === targetExistingId) {
            targetJournalsByFp.set(journalFingerprint(j), normalizeJournalEntry(j));
          }
        }

        const targetEvalsByFp = new Map<string, PeriodicEvaluation>();
        for (const ev of allEvals) {
          if (ev.studentId === targetExistingId) {
            targetEvalsByFp.set(
              evaluationFingerprint(ev),
              normalizePeriodicEvaluation(ev),
            );
          }
        }

        const targetAnnexesByFp = new Map<string, ProgramModificationAnnex>();
        for (const an of allAnnexes) {
          if (an.studentId === targetExistingId) {
            targetAnnexesByFp.set(annexFingerprint(an), normalizeProgramAnnex(an));
          }
        }

        const journalIdMap = new Map<string, string>();
        const evalIdMap = new Map<string, string>();
        const annexIdMap = new Map<string, string>();

        const journalsToSave: JournalEntry[] = [];
        for (const j of rawJournals) {
          const existingSameId = journalById.get(j.id);
          const sameFpTarget = targetJournalsByFp.get(journalFingerprint(j));

          if (existingSameId && existingSameId.studentId === targetExistingId) {
            const isIdentical =
              journalFingerprint(existingSameId) === journalFingerprint(j);
            if (isIdentical) {
              if (duplicatePolicy === 'ADD_AS_NEW') {
                const newId = createUniqueUuid(usedJournalIds);
                journalIdMap.set(j.id, newId);
                journalsToSave.push({
                  ...j,
                  id: newId,
                  studentId: targetExistingId,
                });
              } else {
                journalIdMap.set(j.id, existingSameId.id);
              }
            } else if (duplicatePolicy === 'UPDATE_MATCHING') {
              journalIdMap.set(j.id, existingSameId.id);
              journalsToSave.push({
                ...j,
                id: existingSameId.id,
                studentId: targetExistingId,
                updatedAt: now,
              });
            } else if (duplicatePolicy === 'ADD_AS_NEW') {
              const newId = createUniqueUuid(usedJournalIds);
              journalIdMap.set(j.id, newId);
              journalsToSave.push({
                ...j,
                id: newId,
                studentId: targetExistingId,
              });
            } else {
              // KEEP_EXISTING
              journalIdMap.set(j.id, existingSameId.id);
            }
          } else if (sameFpTarget && duplicatePolicy !== 'ADD_AS_NEW') {
            // Ten sam wpis istniał już pod nowym UUID u tego ucznia
            journalIdMap.set(j.id, sameFpTarget.id);
          } else {
            // Nowy wpis LUB kolizja ID z innym uczniem -> zawsze bezpieczne nowe UUID
            const newId = createUniqueUuid(usedJournalIds);
            journalIdMap.set(j.id, newId);
            journalsToSave.push({
              ...j,
              id: newId,
              studentId: targetExistingId,
            });
          }
        }

        // Najpierw wyznaczamy mapy ID ocen i aneksów (z ochroną rekordów innych uczniów)
        const pendingEvals: Array<{
          source: PeriodicEvaluation;
          resolvedId: string;
          write: boolean;
        }> = [];

        for (const ev of rawEvals) {
          const existingSameId = evalById.get(ev.id);
          const sameFpTarget = targetEvalsByFp.get(evaluationFingerprint(ev));

          if (existingSameId && existingSameId.studentId === targetExistingId) {
            const isIdentical =
              evaluationFingerprint(existingSameId) ===
              evaluationFingerprint(ev);
            if (isIdentical) {
              if (duplicatePolicy === 'ADD_AS_NEW') {
                const newId = createUniqueUuid(usedEvalIds);
                evalIdMap.set(ev.id, newId);
                pendingEvals.push({ source: ev, resolvedId: newId, write: true });
              } else {
                evalIdMap.set(ev.id, existingSameId.id);
                pendingEvals.push({
                  source: ev,
                  resolvedId: existingSameId.id,
                  write: false,
                });
              }
            } else if (duplicatePolicy === 'UPDATE_MATCHING') {
              evalIdMap.set(ev.id, existingSameId.id);
              pendingEvals.push({
                source: ev,
                resolvedId: existingSameId.id,
                write: true,
              });
            } else if (duplicatePolicy === 'ADD_AS_NEW') {
              const newId = createUniqueUuid(usedEvalIds);
              evalIdMap.set(ev.id, newId);
              pendingEvals.push({ source: ev, resolvedId: newId, write: true });
            } else {
              evalIdMap.set(ev.id, existingSameId.id);
              pendingEvals.push({
                source: ev,
                resolvedId: existingSameId.id,
                write: false,
              });
            }
          } else if (sameFpTarget && duplicatePolicy !== 'ADD_AS_NEW') {
            evalIdMap.set(ev.id, sameFpTarget.id);
            pendingEvals.push({
              source: ev,
              resolvedId: sameFpTarget.id,
              write: false,
            });
          } else {
            const newId = createUniqueUuid(usedEvalIds);
            evalIdMap.set(ev.id, newId);
            pendingEvals.push({ source: ev, resolvedId: newId, write: true });
          }
        }

        const pendingAnnexes: Array<{
          source: ProgramModificationAnnex;
          resolvedId: string;
          write: boolean;
        }> = [];

        for (const an of rawAnnexes) {
          const existingSameId = annexById.get(an.id);
          const sameFpTarget = targetAnnexesByFp.get(annexFingerprint(an));

          if (existingSameId && existingSameId.studentId === targetExistingId) {
            const isIdentical =
              annexFingerprint(existingSameId) === annexFingerprint(an);
            if (isIdentical) {
              if (duplicatePolicy === 'ADD_AS_NEW') {
                const newId = createUniqueUuid(usedAnnexIds);
                annexIdMap.set(an.id, newId);
                pendingAnnexes.push({
                  source: an,
                  resolvedId: newId,
                  write: true,
                });
              } else {
                annexIdMap.set(an.id, existingSameId.id);
                pendingAnnexes.push({
                  source: an,
                  resolvedId: existingSameId.id,
                  write: false,
                });
              }
            } else if (duplicatePolicy === 'UPDATE_MATCHING') {
              annexIdMap.set(an.id, existingSameId.id);
              pendingAnnexes.push({
                source: an,
                resolvedId: existingSameId.id,
                write: true,
              });
            } else if (duplicatePolicy === 'ADD_AS_NEW') {
              const newId = createUniqueUuid(usedAnnexIds);
              annexIdMap.set(an.id, newId);
              pendingAnnexes.push({
                source: an,
                resolvedId: newId,
                write: true,
              });
            } else {
              annexIdMap.set(an.id, existingSameId.id);
              pendingAnnexes.push({
                source: an,
                resolvedId: existingSameId.id,
                write: false,
              });
            }
          } else if (sameFpTarget && duplicatePolicy !== 'ADD_AS_NEW') {
            annexIdMap.set(an.id, sameFpTarget.id);
            pendingAnnexes.push({
              source: an,
              resolvedId: sameFpTarget.id,
              write: false,
            });
          } else {
            const newId = createUniqueUuid(usedAnnexIds);
            annexIdMap.set(an.id, newId);
            pendingAnnexes.push({
              source: an,
              resolvedId: newId,
              write: true,
            });
          }
        }

        const evalsToSave: PeriodicEvaluation[] = pendingEvals
          .filter((item) => item.write)
          .map(({ source, resolvedId }) => ({
            ...source,
            id: resolvedId,
            studentId: targetExistingId,
            linkedAnnexId: source.linkedAnnexId
              ? annexIdMap.get(source.linkedAnnexId)
              : undefined,
          }));

        const annexesToSave: ProgramModificationAnnex[] = pendingAnnexes
          .filter((item) => item.write)
          .map(({ source, resolvedId }) => ({
            ...source,
            id: resolvedId,
            studentId: targetExistingId,
            evaluationId: source.evaluationId
              ? evalIdMap.get(source.evaluationId)
              : undefined,
          }));

        // Końcowa weryfikacja integralności zapisywanych rekordów i obcych właścicieli
        for (const j of journalsToSave) {
          if (j.studentId !== targetExistingId) {
            throw new Error('Błąd spójności studentId podczas scalania dziennika.');
          }
          const collision = journalById.get(j.id);
          if (collision && collision.studentId !== targetExistingId) {
            throw new Error('Wykryto niedozwoloną kolizję ID wpisu dziennika.');
          }
        }

        const savedOrExistingAnnexIdsForTarget = new Set([
          ...allAnnexes
            .filter((a) => a.studentId === targetExistingId)
            .map((a) => a.id),
          ...annexesToSave.map((a) => a.id),
        ]);
        const savedOrExistingEvalIdsForTarget = new Set([
          ...allEvals
            .filter((e) => e.studentId === targetExistingId)
            .map((e) => e.id),
          ...evalsToSave.map((e) => e.id),
        ]);

        for (const ev of evalsToSave) {
          if (ev.studentId !== targetExistingId) {
            throw new Error('Błąd spójności studentId podczas scalania ocen.');
          }
          const collision = evalById.get(ev.id);
          if (collision && collision.studentId !== targetExistingId) {
            throw new Error('Wykryto niedozwoloną kolizję ID oceny.');
          }
          if (ev.linkedAnnexId && !savedOrExistingAnnexIdsForTarget.has(ev.linkedAnnexId)) {
            throw new Error('Błąd mapowania referencji linkedAnnexId podczas scalania.');
          }
        }

        for (const an of annexesToSave) {
          if (an.studentId !== targetExistingId) {
            throw new Error('Błąd spójności studentId podczas scalania aneksów.');
          }
          const collision = annexById.get(an.id);
          if (collision && collision.studentId !== targetExistingId) {
            throw new Error('Wykryto niedozwoloną kolizję ID aneksu.');
          }
          if (an.evaluationId && !savedOrExistingEvalIdsForTarget.has(an.evaluationId)) {
            throw new Error('Błąd mapowania referencji evaluationId podczas scalania.');
          }
        }

        const studentToSave: StudentProfile = {
          ...normalizedStudent,
          id: targetExistingId,
          createdAt: existingTarget.createdAt || normalizedStudent.createdAt,
          updatedAt: now,
        };

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

        return studentToSave;
      },
    );
  }

  // Tryb CREATE_NEW — zawsze nowe UUID dla ucznia i wszystkich rekordów podrzędnych
  return db.transaction(
    'rw',
    [db.students, db.journalEntries, db.periodicEvaluations, db.programAnnexes],
    async () => {
      const [allStudents, allJournals, allEvals, allAnnexes] = await Promise.all([
        db.students.toArray(),
        db.journalEntries.toArray(),
        db.periodicEvaluations.toArray(),
        db.programAnnexes.toArray(),
      ]);

      const usedStudentIds = new Set(allStudents.map((s) => s.id));
      const usedJournalIds = new Set(allJournals.map((j) => j.id));
      const usedEvalIds = new Set(allEvals.map((e) => e.id));
      const usedAnnexIds = new Set(allAnnexes.map((a) => a.id));

      const newStudentId = createUniqueUuid(usedStudentIds);
      const journalIdMap = new Map<string, string>();
      const evalIdMap = new Map<string, string>();
      const annexIdMap = new Map<string, string>();

      rawJournals.forEach((j) => {
        journalIdMap.set(j.id, createUniqueUuid(usedJournalIds));
      });
      rawEvals.forEach((ev) => {
        evalIdMap.set(ev.id, createUniqueUuid(usedEvalIds));
      });
      rawAnnexes.forEach((an) => {
        annexIdMap.set(an.id, createUniqueUuid(usedAnnexIds));
      });

      const newStudent: StudentProfile = {
        ...normalizedStudent,
        id: newStudentId,
        createdAt: now,
        updatedAt: now,
      };

      const newJournals: JournalEntry[] = rawJournals.map((j) => ({
        ...j,
        id: journalIdMap.get(j.id)!,
        studentId: newStudentId,
      }));

      const newEvals: PeriodicEvaluation[] = rawEvals.map((e) => {
        const mappedLinked = e.linkedAnnexId
          ? annexIdMap.get(e.linkedAnnexId)
          : undefined;
        if (e.linkedAnnexId && !mappedLinked) {
          throw new Error('Błąd mapowania referencji linkedAnnexId.');
        }
        return {
          ...e,
          id: evalIdMap.get(e.id)!,
          studentId: newStudentId,
          linkedAnnexId: mappedLinked,
        };
      });

      const newAnnexes: ProgramModificationAnnex[] = rawAnnexes.map((a) => {
        const mappedEval = a.evaluationId
          ? evalIdMap.get(a.evaluationId)
          : undefined;
        if (a.evaluationId && !mappedEval) {
          throw new Error('Błąd mapowania referencji evaluationId.');
        }
        return {
          ...a,
          id: annexIdMap.get(a.id)!,
          studentId: newStudentId,
          evaluationId: mappedEval,
        };
      });

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

      return newStudent;
    },
  );
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

  // Reguła bezpieczeństwa: blokada UI (appLock) jest przypisana do konkretnego urządzenia
  // i celowo nie jest eksportowana ani nadpisywana przy przywracaniu kopii na innym urządzeniu.
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

export type FullBackupConflictResolution =
  | 'KEEP_LOCAL'
  | 'OVERWRITE_WITH_BACKUP';

export interface FullBackupRestoreOptions {
  conflictResolution?: FullBackupConflictResolution;
  applyFacilitySettings?: boolean;
  confirmReplace?: boolean;
}

export interface FullDatabaseEntityBreakdown {
  totalInBackup: number;
  newCount: number;
  identicalCount: number;
  conflictingSameIdCount: number;
  crossCollisionCount: number;
}

export interface FullDatabaseImportAnalysis {
  students: FullDatabaseEntityBreakdown;
  journalEntries: FullDatabaseEntityBreakdown;
  evaluations: FullDatabaseEntityBreakdown;
  annexes: FullDatabaseEntityBreakdown;
  facilitySettingsChanged: boolean;
  localHasAppLock: boolean;
  conflictSummaries: string[];
  totalNew: number;
  totalIdentical: number;
  totalConflicts: number;
  totalCrossCollisions: number;
  existingDbCounts: DatabaseStats;
}

function isSameFacilitySettingsContent(
  a: Omit<FacilitySettings, 'appLock'>,
  b: Omit<FacilitySettings, 'appLock'>,
): boolean {
  return (
    a.schoolName === b.schoolName &&
    a.schoolType === b.schoolType &&
    (a.address ?? '') === (b.address ?? '') &&
    a.city === b.city &&
    a.directorName === b.directorName &&
    a.defaultSchoolYear === b.defaultSchoolYear &&
    a.defaultTeamRole === b.defaultTeamRole &&
    a.theme === b.theme
  );
}

export async function analyzeFullDatabaseImport(
  bundle: FullDatabaseBundle,
): Promise<FullDatabaseImportAnalysis> {
  const validated = validateFullDatabaseBundle(bundle);
  const [
    currentSettings,
    localStudents,
    localJournals,
    localEvals,
    localAnnexes,
  ] = await Promise.all([
    getFacilitySettings(),
    db.students.toArray(),
    db.journalEntries.toArray(),
    db.periodicEvaluations.toArray(),
    db.programAnnexes.toArray(),
  ]);

  const localStudentById = new Map(
    localStudents.map((s) => [s.id, normalizeStudentProfile(s)]),
  );
  const localJournalById = new Map(
    localJournals.map((j) => [j.id, normalizeJournalEntry(j)]),
  );
  const localEvalById = new Map(
    localEvals.map((e) => [e.id, normalizePeriodicEvaluation(e)]),
  );
  const localAnnexById = new Map(
    localAnnexes.map((a) => [a.id, normalizeProgramAnnex(a)]),
  );

  const studentIdMap = new Map<string, string>();
  const studentsBreakdown: FullDatabaseEntityBreakdown = {
    totalInBackup: validated.students.length,
    newCount: 0,
    identicalCount: 0,
    conflictingSameIdCount: 0,
    crossCollisionCount: 0,
  };

  for (const s of validated.students) {
    const normS = normalizeStudentProfile(s);
    const sameId = localStudentById.get(normS.id);
    if (sameId) {
      studentIdMap.set(normS.id, sameId.id);
      if (isSameStudentBusinessData(sameId, normS)) {
        studentsBreakdown.identicalCount += 1;
      } else {
        studentsBreakdown.conflictingSameIdCount += 1;
      }
      continue;
    }

    const identityMatch = matchesStudentIdentity(normS, localStudents);
    if (identityMatch) {
      studentIdMap.set(normS.id, identityMatch.id);
      studentsBreakdown.crossCollisionCount += 1;
    } else {
      studentIdMap.set(normS.id, normS.id);
      studentsBreakdown.newCount += 1;
    }
  }

  const analyzeChildren = <T extends { id: string; studentId: string }>(
    items: T[],
    localById: Map<string, T>,
    localAll: T[],
    fpFn: (item: T) => string,
  ): FullDatabaseEntityBreakdown => {
    const fpsByStudent = new Map<string, Set<string>>();
    for (const loc of localAll) {
      let set = fpsByStudent.get(loc.studentId);
      if (!set) {
        set = new Set();
        fpsByStudent.set(loc.studentId, set);
      }
      set.add(fpFn(loc));
    }

    const breakdown: FullDatabaseEntityBreakdown = {
      totalInBackup: items.length,
      newCount: 0,
      identicalCount: 0,
      conflictingSameIdCount: 0,
      crossCollisionCount: 0,
    };

    for (const item of items) {
      const targetStudentId = studentIdMap.get(item.studentId) ?? item.studentId;
      const localSameId = localById.get(item.id);

      if (localSameId && localSameId.studentId === targetStudentId) {
        if (fpFn(localSameId) === fpFn(item)) {
          breakdown.identicalCount += 1;
        } else {
          breakdown.conflictingSameIdCount += 1;
        }
        continue;
      }

      if (localSameId && localSameId.studentId !== targetStudentId) {
        breakdown.crossCollisionCount += 1;
      }

      const targetFps = fpsByStudent.get(targetStudentId);
      if (targetFps && targetFps.has(fpFn(item))) {
        breakdown.identicalCount += 1;
      } else {
        breakdown.newCount += 1;
      }
    }

    return breakdown;
  };

  const journalEntries = analyzeChildren(
    validated.journalEntries.map(normalizeJournalEntry),
    localJournalById,
    localJournals.map(normalizeJournalEntry),
    journalFingerprint,
  );
  const evaluations = analyzeChildren(
    validated.evaluations.map(normalizePeriodicEvaluation),
    localEvalById,
    localEvals.map(normalizePeriodicEvaluation),
    evaluationFingerprint,
  );
  const annexes = analyzeChildren(
    validated.annexes.map(normalizeProgramAnnex),
    localAnnexById,
    localAnnexes.map(normalizeProgramAnnex),
    annexFingerprint,
  );

  const conflictSummaries: string[] = [];
  if (studentsBreakdown.conflictingSameIdCount > 0) {
    conflictSummaries.push(
      `Zmienione profile uczniów o tym samym ID: ${studentsBreakdown.conflictingSameIdCount}.`,
    );
  }
  if (studentsBreakdown.crossCollisionCount > 0) {
    conflictSummaries.push(
      `Uczniowie o zgodnych danych pod innym ID lokalnym: ${studentsBreakdown.crossCollisionCount} (zostaną połączeni z lokalnym identyfikatorem bez duplikowania kartoteki).`,
    );
  }
  const childConflicts =
    journalEntries.conflictingSameIdCount +
    evaluations.conflictingSameIdCount +
    annexes.conflictingSameIdCount;
  if (childConflicts > 0) {
    conflictSummaries.push(
      `Rekordy podrzędne o tym samym ID i różnej treści (dziennik/oceny/aneksy): ${childConflicts}.`,
    );
  }
  const childCrossCollisions =
    journalEntries.crossCollisionCount +
    evaluations.crossCollisionCount +
    annexes.crossCollisionCount;
  if (childCrossCollisions > 0) {
    conflictSummaries.push(
      `Kolizje ID między różnymi uczniami: ${childCrossCollisions} (rekordy otrzymają nowe bezpieczne UUID, bez nadpisywania cudzych danych).`,
    );
  }

  const facilitySettingsChanged = !isSameFacilitySettingsContent(
    currentSettings,
    validated.facilitySettings,
  );

  const totalNew =
    studentsBreakdown.newCount +
    journalEntries.newCount +
    evaluations.newCount +
    annexes.newCount;
  const totalIdentical =
    studentsBreakdown.identicalCount +
    journalEntries.identicalCount +
    evaluations.identicalCount +
    annexes.identicalCount;
  const totalConflicts =
    studentsBreakdown.conflictingSameIdCount + childConflicts;
  const totalCrossCollisions =
    studentsBreakdown.crossCollisionCount + childCrossCollisions;

  return {
    students: studentsBreakdown,
    journalEntries,
    evaluations,
    annexes,
    facilitySettingsChanged,
    localHasAppLock: Boolean(currentSettings.appLock?.enabled),
    conflictSummaries,
    totalNew,
    totalIdentical,
    totalConflicts,
    totalCrossCollisions,
    existingDbCounts: {
      studentsCount: localStudents.length,
      testStudentsCount: localStudents.filter((s) => s.isTestData).length,
      journalEntriesCount: localJournals.length,
      evaluationsCount: localEvals.length,
      annexesCount: localAnnexes.length,
    },
  };
}

export async function importFullDatabaseBundle(
  bundle: FullDatabaseBundle,
  mode: FullBackupRestoreMode,
  options: FullBackupRestoreOptions = {},
): Promise<{
  studentsCount: number;
  journalEntriesCount: number;
  evaluationsCount: number;
  annexesCount: number;
  skippedIdenticalCount: number;
  remappedCrossCollisionsCount: number;
}> {
  // 1. Walidacja runtime pakietu przed jakąkolwiek transakcją na bazie
  const validated = validateFullDatabaseBundle(bundle);
  if (mode === 'REPLACE' && options.confirmReplace === false) {
    throw new Error(
      'Tryb REPLACE wymaga jawnego potwierdzenia zastąpienia całej lokalnej bazy.',
    );
  }

  const now = new Date().toISOString();
  const conflictResolution: FullBackupConflictResolution =
    options.conflictResolution ?? 'KEEP_LOCAL';

  const normalizedStudents = validated.students.map(normalizeStudentProfile);
  const normalizedJournals = validated.journalEntries.map(normalizeJournalEntry);
  const normalizedEvals = validated.evaluations.map(
    normalizePeriodicEvaluation,
  );
  const normalizedAnnexes = validated.annexes.map(normalizeProgramAnnex);

  return db.transaction(
    'rw',
    [
      db.students,
      db.journalEntries,
      db.periodicEvaluations,
      db.programAnnexes,
      db.facilitySettings,
    ],
    async () => {
      const currentSettings = await getFacilitySettings();
      const { appLock: _ignoredIncomingLock, ...cleanBackupSettings } =
        validated.facilitySettings as FacilitySettings;

      // Celowa reguła bezpieczeństwa: appLock zawsze pochodzi wyłącznie z urządzenia docelowego
      const preservedLocalLock = currentSettings.appLock;

      if (mode === 'REPLACE') {
        const restoredSettings: FacilitySettings = {
          ...DEFAULT_FACILITY_SETTINGS,
          ...cleanBackupSettings,
          id: 'default',
          appLock: preservedLocalLock,
          updatedAt: now,
        };

        await db.students.clear();
        await db.journalEntries.clear();
        await db.periodicEvaluations.clear();
        await db.programAnnexes.clear();

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

        return {
          studentsCount: normalizedStudents.length,
          journalEntriesCount: normalizedJournals.length,
          evaluationsCount: normalizedEvals.length,
          annexesCount: normalizedAnnexes.length,
          skippedIdenticalCount: 0,
          remappedCrossCollisionsCount: 0,
        };
      }

      // Tryb MERGE: bezpieczne scalanie z analizą kolizji ID i ochroną danych
      const [localStudents, localJournals, localEvals, localAnnexes] =
        await Promise.all([
          db.students.toArray(),
          db.journalEntries.toArray(),
          db.periodicEvaluations.toArray(),
          db.programAnnexes.toArray(),
        ]);

      const localStudentById = new Map(
        localStudents.map((s) => [s.id, normalizeStudentProfile(s)]),
      );
      const localJournalById = new Map(
        localJournals.map((j) => [j.id, normalizeJournalEntry(j)]),
      );
      const localEvalById = new Map(
        localEvals.map((e) => [e.id, normalizePeriodicEvaluation(e)]),
      );
      const localAnnexById = new Map(
        localAnnexes.map((a) => [a.id, normalizeProgramAnnex(a)]),
      );

      const usedJournalIds = new Set(localJournalById.keys());
      const usedEvalIds = new Set(localEvalById.keys());
      const usedAnnexIds = new Set(localAnnexById.keys());

      const studentIdMap = new Map<string, string>();
      const studentsToSave: StudentProfile[] = [];
      let skippedIdenticalCount = 0;
      let remappedCrossCollisionsCount = 0;

      for (const s of normalizedStudents) {
        const localSameId = localStudentById.get(s.id);
        if (localSameId) {
          studentIdMap.set(s.id, localSameId.id);
          if (isSameStudentBusinessData(localSameId, s)) {
            skippedIdenticalCount += 1;
          } else if (conflictResolution === 'OVERWRITE_WITH_BACKUP') {
            studentsToSave.push({
              ...s,
              id: localSameId.id,
              updatedAt: now,
            });
          } else {
            skippedIdenticalCount += 1;
          }
          continue;
        }

        const identityMatch = matchesStudentIdentity(s, localStudents);
        if (identityMatch) {
          studentIdMap.set(s.id, identityMatch.id);
          if (conflictResolution === 'OVERWRITE_WITH_BACKUP') {
            studentsToSave.push({
              ...s,
              id: identityMatch.id,
              createdAt: identityMatch.createdAt || s.createdAt,
              updatedAt: now,
            });
          } else {
            skippedIdenticalCount += 1;
          }
        } else {
          studentIdMap.set(s.id, s.id);
          studentsToSave.push(s);
        }
      }

      const localJournalFpMap = new Map<string, Map<string, JournalEntry>>();
      for (const j of localJournals) {
        const norm = normalizeJournalEntry(j);
        let map = localJournalFpMap.get(norm.studentId);
        if (!map) {
          map = new Map();
          localJournalFpMap.set(norm.studentId, map);
        }
        map.set(journalFingerprint(norm), norm);
      }

      const localEvalFpMap = new Map<string, Map<string, PeriodicEvaluation>>();
      for (const ev of localEvals) {
        const norm = normalizePeriodicEvaluation(ev);
        let map = localEvalFpMap.get(norm.studentId);
        if (!map) {
          map = new Map();
          localEvalFpMap.set(norm.studentId, map);
        }
        map.set(evaluationFingerprint(norm), norm);
      }

      const localAnnexFpMap = new Map<
        string,
        Map<string, ProgramModificationAnnex>
      >();
      for (const an of localAnnexes) {
        const norm = normalizeProgramAnnex(an);
        let map = localAnnexFpMap.get(norm.studentId);
        if (!map) {
          map = new Map();
          localAnnexFpMap.set(norm.studentId, map);
        }
        map.set(annexFingerprint(norm), norm);
      }

      const journalsToSave: JournalEntry[] = [];
      for (const j of normalizedJournals) {
        const targetStudentId = studentIdMap.get(j.studentId);
        if (!targetStudentId) {
          throw new Error('Brak zmapowanego ucznia dla wpisu dziennika.');
        }
        const localSameId = localJournalById.get(j.id);
        const sameFpLocal = localJournalFpMap
          .get(targetStudentId)
          ?.get(journalFingerprint(j));

        if (localSameId && localSameId.studentId === targetStudentId) {
          if (journalFingerprint(localSameId) === journalFingerprint(j)) {
            skippedIdenticalCount += 1;
          } else if (conflictResolution === 'OVERWRITE_WITH_BACKUP') {
            journalsToSave.push({
              ...j,
              id: localSameId.id,
              studentId: targetStudentId,
              updatedAt: now,
            });
          } else {
            skippedIdenticalCount += 1;
          }
        } else if (sameFpLocal) {
          skippedIdenticalCount += 1;
        } else if (localSameId && localSameId.studentId !== targetStudentId) {
          // Kolizja ID z innym uczniem -> bezpieczne nowe UUID
          remappedCrossCollisionsCount += 1;
          const newId = createUniqueUuid(usedJournalIds);
          journalsToSave.push({
            ...j,
            id: newId,
            studentId: targetStudentId,
          });
        } else {
          // Nowy wpis i brak kolizji ID
          usedJournalIds.add(j.id);
          journalsToSave.push({
            ...j,
            studentId: targetStudentId,
          });
        }
      }

      const evalIdMap = new Map<string, string>();
      const pendingEvals: Array<{
        source: PeriodicEvaluation;
        resolvedId: string;
        targetStudentId: string;
        write: boolean;
      }> = [];

      for (const ev of normalizedEvals) {
        const targetStudentId = studentIdMap.get(ev.studentId);
        if (!targetStudentId) {
          throw new Error('Brak zmapowanego ucznia dla oceny okresowej.');
        }
        const localSameId = localEvalById.get(ev.id);
        const sameFpLocal = localEvalFpMap
          .get(targetStudentId)
          ?.get(evaluationFingerprint(ev));

        if (localSameId && localSameId.studentId === targetStudentId) {
          evalIdMap.set(ev.id, localSameId.id);
          if (evaluationFingerprint(localSameId) === evaluationFingerprint(ev)) {
            skippedIdenticalCount += 1;
            pendingEvals.push({
              source: ev,
              resolvedId: localSameId.id,
              targetStudentId,
              write: false,
            });
          } else if (conflictResolution === 'OVERWRITE_WITH_BACKUP') {
            pendingEvals.push({
              source: ev,
              resolvedId: localSameId.id,
              targetStudentId,
              write: true,
            });
          } else {
            skippedIdenticalCount += 1;
            pendingEvals.push({
              source: ev,
              resolvedId: localSameId.id,
              targetStudentId,
              write: false,
            });
          }
        } else if (sameFpLocal) {
          evalIdMap.set(ev.id, sameFpLocal.id);
          skippedIdenticalCount += 1;
          pendingEvals.push({
            source: ev,
            resolvedId: sameFpLocal.id,
            targetStudentId,
            write: false,
          });
        } else if (localSameId && localSameId.studentId !== targetStudentId) {
          remappedCrossCollisionsCount += 1;
          const newId = createUniqueUuid(usedEvalIds);
          evalIdMap.set(ev.id, newId);
          pendingEvals.push({
            source: ev,
            resolvedId: newId,
            targetStudentId,
            write: true,
          });
        } else {
          usedEvalIds.add(ev.id);
          evalIdMap.set(ev.id, ev.id);
          pendingEvals.push({
            source: ev,
            resolvedId: ev.id,
            targetStudentId,
            write: true,
          });
        }
      }

      const annexIdMap = new Map<string, string>();
      const pendingAnnexes: Array<{
        source: ProgramModificationAnnex;
        resolvedId: string;
        targetStudentId: string;
        write: boolean;
      }> = [];

      for (const an of normalizedAnnexes) {
        const targetStudentId = studentIdMap.get(an.studentId);
        if (!targetStudentId) {
          throw new Error('Brak zmapowanego ucznia dla aneksu.');
        }
        const localSameId = localAnnexById.get(an.id);
        const sameFpLocal = localAnnexFpMap
          .get(targetStudentId)
          ?.get(annexFingerprint(an));

        if (localSameId && localSameId.studentId === targetStudentId) {
          annexIdMap.set(an.id, localSameId.id);
          if (annexFingerprint(localSameId) === annexFingerprint(an)) {
            skippedIdenticalCount += 1;
            pendingAnnexes.push({
              source: an,
              resolvedId: localSameId.id,
              targetStudentId,
              write: false,
            });
          } else if (conflictResolution === 'OVERWRITE_WITH_BACKUP') {
            pendingAnnexes.push({
              source: an,
              resolvedId: localSameId.id,
              targetStudentId,
              write: true,
            });
          } else {
            skippedIdenticalCount += 1;
            pendingAnnexes.push({
              source: an,
              resolvedId: localSameId.id,
              targetStudentId,
              write: false,
            });
          }
        } else if (sameFpLocal) {
          annexIdMap.set(an.id, sameFpLocal.id);
          skippedIdenticalCount += 1;
          pendingAnnexes.push({
            source: an,
            resolvedId: sameFpLocal.id,
            targetStudentId,
            write: false,
          });
        } else if (localSameId && localSameId.studentId !== targetStudentId) {
          remappedCrossCollisionsCount += 1;
          const newId = createUniqueUuid(usedAnnexIds);
          annexIdMap.set(an.id, newId);
          pendingAnnexes.push({
            source: an,
            resolvedId: newId,
            targetStudentId,
            write: true,
          });
        } else {
          usedAnnexIds.add(an.id);
          annexIdMap.set(an.id, an.id);
          pendingAnnexes.push({
            source: an,
            resolvedId: an.id,
            targetStudentId,
            write: true,
          });
        }
      }

      const evalsToSave: PeriodicEvaluation[] = pendingEvals
        .filter((item) => item.write)
        .map(({ source, resolvedId, targetStudentId }) => ({
          ...source,
          id: resolvedId,
          studentId: targetStudentId,
          linkedAnnexId: source.linkedAnnexId
            ? annexIdMap.get(source.linkedAnnexId)
            : undefined,
        }));

      const annexesToSave: ProgramModificationAnnex[] = pendingAnnexes
        .filter((item) => item.write)
        .map(({ source, resolvedId, targetStudentId }) => ({
          ...source,
          id: resolvedId,
          studentId: targetStudentId,
          evaluationId: source.evaluationId
            ? evalIdMap.get(source.evaluationId)
            : undefined,
        }));

      // Weryfikacja braku kolizji właścicieli przed zapisem
      for (const j of journalsToSave) {
        const collision = localJournalById.get(j.id);
        if (collision && collision.studentId !== j.studentId) {
          throw new Error('Wykryto niedozwoloną kolizję ID wpisu dziennika w MERGE.');
        }
      }
      for (const ev of evalsToSave) {
        const collision = localEvalById.get(ev.id);
        if (collision && collision.studentId !== ev.studentId) {
          throw new Error('Wykryto niedozwoloną kolizję ID oceny w MERGE.');
        }
      }
      for (const an of annexesToSave) {
        const collision = localAnnexById.get(an.id);
        if (collision && collision.studentId !== an.studentId) {
          throw new Error('Wykryto niedozwoloną kolizję ID aneksu w MERGE.');
        }
      }

      if (studentsToSave.length > 0) {
        await db.students.bulkPut(studentsToSave);
      }
      if (journalsToSave.length > 0) {
        await db.journalEntries.bulkPut(journalsToSave);
      }
      if (evalsToSave.length > 0) {
        await db.periodicEvaluations.bulkPut(evalsToSave);
      }
      if (annexesToSave.length > 0) {
        await db.programAnnexes.bulkPut(annexesToSave);
      }

      const shouldUpdateSettings =
        options.applyFacilitySettings !== undefined
          ? options.applyFacilitySettings
          : conflictResolution === 'OVERWRITE_WITH_BACKUP';

      if (shouldUpdateSettings) {
        await db.facilitySettings.put({
          ...DEFAULT_FACILITY_SETTINGS,
          ...cleanBackupSettings,
          id: 'default',
          appLock: preservedLocalLock,
          updatedAt: now,
        });
      }

      return {
        studentsCount: studentsToSave.length,
        journalEntriesCount: journalsToSave.length,
        evaluationsCount: evalsToSave.length,
        annexesCount: annexesToSave.length,
        skippedIdenticalCount,
        remappedCrossCollisionsCount,
      };
    },
  );
}
