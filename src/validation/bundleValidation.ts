import type {
  FullDatabaseBundle,
  SingleStudentBundle,
} from '../crypto/cryptoService';
import {
  DOCUMENT_TYPE_LABELS,
  EDUCATION_STAGE_LABELS,
  EFFECTIVENESS_RATING_LABELS,
  EVALUATION_PERIOD_LABELS,
  JOURNAL_CATEGORY_LABELS,
  REHAB_CATEGORY_LABELS,
  type AnnexDecisionType,
  type DocumentType,
  type EducationStage,
  type EffectivenessRating,
  type EvaluationPeriodType,
  type EvaluationStatus,
  type EvaluationType,
  type FacilitySettings,
  type IpetStructureDraft,
  type JournalCategory,
  type JournalEntry,
  type ModificationDecision,
  type OpinionSupportDraft,
  type PeriodicEvaluation,
  type ProgramModificationAnnex,
  type SpecialRehabClassItem,
  type SpecialistSupportItem,
  type StudentProfile,
  type StudentStatus,
  type SubjectAdaptationItem,
  type TeamMember,
  type ThemeMode,
  type WopfuStructureDraft,
} from '../types/domain';

/**
 * Spójne limity rozmiaru (w bajtach UTF-8) dla eksportu i importu archiwów .ipet:
 * - Dane jawne JSON: 20 MiB (20 * 1024 * 1024 = 20 971 520 B)
 * - Tag uwierzytelniający AES-GCM (128-bit): 16 B -> maks. szyfrogram 20 971 536 B
 * - Narzut Base64 dla maks. szyfrogramu: ceil(20 971 536 / 3) * 4 = 27 962 048 B (~26,67 MiB)
 * - Całe zserializowane archiwum JSON .ipet (Base64 + nagłówek koperty): 28 MiB (29 360 128 B)
 */
export const AES_GCM_TAG_BYTES = 16;
export const MAX_DECRYPTED_BYTES = 20 * 1024 * 1024;
export const MAX_CIPHERTEXT_BYTES = MAX_DECRYPTED_BYTES + AES_GCM_TAG_BYTES;
export const MAX_ARCHIVE_BASE64_BYTES =
  Math.ceil(MAX_CIPHERTEXT_BYTES / 3) * 4;
export const MAX_ARCHIVE_BYTES = 28 * 1024 * 1024;
export const MAX_DECRYPTED_MB = Math.round(MAX_DECRYPTED_BYTES / (1024 * 1024));
export const MAX_ARCHIVE_MB = Math.round(MAX_ARCHIVE_BYTES / (1024 * 1024));

/**
 * Oblicza dokładny rozmiar tekstu w bajtach UTF-8 (zgodnie z TextEncoder) bez alokacji bufora.
 */
export function measureUtf8Bytes(text: string): number {
  let bytes = 0;
  for (let i = 0; i < text.length; i += 1) {
    const code = text.charCodeAt(i);
    if (code < 0x80) {
      bytes += 1;
    } else if (code < 0x800) {
      bytes += 2;
    } else if (code >= 0xd800 && code <= 0xdbff) {
      if (i + 1 < text.length) {
        const next = text.charCodeAt(i + 1);
        if (next >= 0xdc00 && next <= 0xdfff) {
          bytes += 4;
          i += 1;
          continue;
        }
      }
      // Niesparowany surogat kodowany przez TextEncoder jako U+FFFD (3 bajty)
      bytes += 3;
    } else {
      bytes += 3;
    }
  }
  return bytes;
}

export const VALIDATION_LIMITS = {
  maxIdLength: 160,
  maxShortTextLength: 500,
  maxLongTextLength: 25_000,
  maxSubItems: 250,
  maxStudentsPerBackup: 1_500,
  maxJournalEntriesPerBackup: 25_000,
  maxEvaluationsPerBackup: 15_000,
  maxAnnexesPerBackup: 15_000,
  minHoursPerWeek: 0.25,
  maxHoursPerWeek: 60,
  maxVersionNumber: 10_000,
} as const;

export class BundleValidationError extends Error {
  public readonly reasons: string[];

  constructor(message: string, reasons: string[] = []) {
    super(message);
    this.name = 'BundleValidationError';
    this.reasons = reasons;
  }
}

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const VALID_DOCUMENT_TYPES = new Set<DocumentType>(
  Object.keys(DOCUMENT_TYPE_LABELS) as DocumentType[],
);
const VALID_EDUCATION_STAGES = new Set<EducationStage>(
  Object.keys(EDUCATION_STAGE_LABELS) as EducationStage[],
);
const VALID_STUDENT_STATUSES = new Set<StudentStatus>(['AKTYWNY', 'ARCHIWUM']);
const VALID_JOURNAL_CATEGORIES = new Set<JournalCategory>(
  Object.keys(JOURNAL_CATEGORY_LABELS) as JournalCategory[],
);
const VALID_EVAL_TYPES = new Set<EvaluationType>([
  'WOPFU_AKTUALIZACJA',
  'OCENA_OKRESOWA_IPET',
]);
const VALID_EVAL_PERIOD_TYPES = new Set<EvaluationPeriodType>(
  Object.keys(EVALUATION_PERIOD_LABELS) as EvaluationPeriodType[],
);
const VALID_EFFECTIVENESS_RATINGS = new Set<EffectivenessRating>(
  Object.keys(EFFECTIVENESS_RATING_LABELS) as EffectivenessRating[],
);
const VALID_MODIFICATION_DECISIONS = new Set<ModificationDecision>([
  'WPROWADZONO_ANEKS',
  'BRAK_ZMIAN',
]);
const VALID_EVAL_STATUSES = new Set<EvaluationStatus>(['SZKIC', 'ZATWIERDZONA']);
const VALID_ANNEX_DECISIONS = new Set<AnnexDecisionType>([
  'MODYFIKACJA_IPET',
  'AKTUALIZACJA_DOSTOSOWAN',
  'BRAK_ZMIAN',
]);
const VALID_REHAB_CATEGORIES = new Set<SpecialRehabClassItem['category']>(
  Object.keys(REHAB_CATEGORY_LABELS) as SpecialRehabClassItem['category'][],
);
const VALID_THEMES = new Set<ThemeMode>(['light', 'dark']);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isValidIsoDateStrict(value: string): boolean {
  if (!ISO_DATE_RE.test(value)) return false;
  const [yearStr, monthStr, dayStr] = value.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day)
  ) {
    return false;
  }
  if (year < 1900 || year > 2150 || month < 1 || month > 12 || day < 1 || day > 31) {
    return false;
  }

  const probe = new Date(Date.UTC(year, month - 1, day));
  return (
    probe.getUTCFullYear() === year &&
    probe.getUTCMonth() === month - 1 &&
    probe.getUTCDate() === day
  );
}

export function isValidIsoTimestampOrDate(value: string): boolean {
  if (isValidIsoDateStrict(value)) return true;
  if (value.length > 64) return false;
  const ms = Date.parse(value);
  return !Number.isNaN(ms) && /^\d{4}-\d{2}-\d{2}T/.test(value);
}

function assertString(
  obj: Record<string, unknown>,
  field: string,
  path: string,
  options: {
    requiredNonEmpty?: boolean;
    maxLength?: number;
    optional?: boolean;
  } = {},
): string {
  const val = obj[field];
  if (val === undefined) {
    if (options.optional) return '';
    throw new BundleValidationError(
      `Nieprawidłowa struktura danych: brak wymaganego pola (${path}.${field}).`,
    );
  }
  if (typeof val !== 'string') {
    throw new BundleValidationError(
      `Nieprawidłowy typ pola (${path}.${field}): oczekiwano tekstu.`,
    );
  }
  const maxLen = options.maxLength ?? VALIDATION_LIMITS.maxLongTextLength;
  if (val.length > maxLen) {
    throw new BundleValidationError(
      `Pole (${path}.${field}) przekracza maksymalną dozwoloną długość (${maxLen} znaków).`,
    );
  }
  if (options.requiredNonEmpty && val.trim().length === 0) {
    throw new BundleValidationError(
      `Wymagane pole (${path}.${field}) nie może być puste.`,
    );
  }
  return val;
}

function assertOptionalDateString(
  obj: Record<string, unknown>,
  field: string,
  path: string,
  allowNull = false,
): void {
  const val = obj[field];
  if (val === undefined) return;
  if (val === null) {
    if (allowNull) return;
    throw new BundleValidationError(
      `Pole daty (${path}.${field}) nie może mieć wartości null.`,
    );
  }
  if (typeof val !== 'string') {
    throw new BundleValidationError(
      `Nieprawidłowy typ daty (${path}.${field}): oczekiwano tekstu YYYY-MM-DD.`,
    );
  }
  if (val.length === 0) return;
  if (!isValidIsoDateStrict(val)) {
    throw new BundleValidationError(
      `Nieprawidłowa data w polu (${path}.${field}): oczekiwano poprawnego formatu YYYY-MM-DD.`,
    );
  }
}

function assertRequiredDateString(
  obj: Record<string, unknown>,
  field: string,
  path: string,
): string {
  const val = assertString(obj, field, path, {
    requiredNonEmpty: true,
    maxLength: 10,
  });
  if (!isValidIsoDateStrict(val)) {
    throw new BundleValidationError(
      `Nieprawidłowa data w polu (${path}.${field}): oczekiwano poprawnego formatu YYYY-MM-DD.`,
    );
  }
  return val;
}

function assertOptionalTimestampOrDate(
  obj: Record<string, unknown>,
  field: string,
  path: string,
  allowNull = false,
): void {
  const val = obj[field];
  if (val === undefined) return;
  if (val === null) {
    if (allowNull) return;
    throw new BundleValidationError(
      `Pole znacznika czasu (${path}.${field}) nie może mieć wartości null.`,
    );
  }
  if (typeof val !== 'string') {
    throw new BundleValidationError(
      `Nieprawidłowy typ znacznika czasu (${path}.${field}).`,
    );
  }
  if (val.length === 0) return;
  if (!isValidIsoTimestampOrDate(val)) {
    throw new BundleValidationError(
      `Nieprawidłowy format daty lub czasu w polu (${path}.${field}).`,
    );
  }
}

function assertBoolean(
  obj: Record<string, unknown>,
  field: string,
  path: string,
  optional = false,
): boolean {
  const val = obj[field];
  if (val === undefined && optional) return false;
  if (typeof val !== 'boolean') {
    throw new BundleValidationError(
      `Nieprawidłowy typ pola (${path}.${field}): oczekiwano wartości logicznej.`,
    );
  }
  return val;
}

function assertEnum<T extends string>(
  obj: Record<string, unknown>,
  field: string,
  path: string,
  allowed: Set<T>,
  optional = false,
): T | undefined {
  const val = obj[field];
  if (val === undefined && optional) return undefined;
  if (typeof val !== 'string' || !allowed.has(val as T)) {
    throw new BundleValidationError(
      `Nieprawidłowa wartość słownikowa w polu (${path}.${field}).`,
    );
  }
  return val as T;
}

function assertStringArray(
  obj: Record<string, unknown>,
  field: string,
  path: string,
  maxItems = VALIDATION_LIMITS.maxSubItems,
  optional = false,
): string[] {
  const val = obj[field];
  if (val === undefined && optional) return [];
  if (!Array.isArray(val)) {
    throw new BundleValidationError(
      `Nieprawidłowy typ pola (${path}.${field}): oczekiwano listy.`,
    );
  }
  if (val.length > maxItems) {
    throw new BundleValidationError(
      `Lista (${path}.${field}) przekracza maksymalny limit ${maxItems} elementów.`,
    );
  }
  val.forEach((item, idx) => {
    if (typeof item !== 'string') {
      throw new BundleValidationError(
        `Element listy (${path}.${field}[${idx}]) musi być tekstem.`,
      );
    }
    if (item.length > VALIDATION_LIMITS.maxLongTextLength) {
      throw new BundleValidationError(
        `Element listy (${path}.${field}[${idx}]) przekracza maksymalną długość tekstu.`,
      );
    }
  });
  return val as string[];
}

function assertPositiveHours(value: unknown, path: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new BundleValidationError(
      `Pole wymiaru godzin (${path}) musi być poprawną liczbą.`,
    );
  }
  if (
    value <= 0 ||
    value < VALIDATION_LIMITS.minHoursPerWeek ||
    value > VALIDATION_LIMITS.maxHoursPerWeek
  ) {
    throw new BundleValidationError(
      `Nieprawidłowy wymiar godzin (${path}): dopuszczalny zakres to ${VALIDATION_LIMITS.minHoursPerWeek}–${VALIDATION_LIMITS.maxHoursPerWeek} godz./tyg.`,
    );
  }
  return value;
}

function validateTeamMembers(raw: unknown, path: string): TeamMember[] {
  if (raw === undefined) return [];
  if (!Array.isArray(raw)) {
    throw new BundleValidationError(
      `Pole (${path}) musi być listą członków zespołu.`,
    );
  }
  if (raw.length > VALIDATION_LIMITS.maxSubItems) {
    throw new BundleValidationError(
      `Lista zespołu (${path}) przekracza limit ${VALIDATION_LIMITS.maxSubItems} pozycji.`,
    );
  }
  const seenIds = new Set<string>();
  return raw.map((item, idx) => {
    const itemPath = `${path}[${idx}]`;
    if (!isPlainObject(item)) {
      throw new BundleValidationError(
        `Pozycja zespołu (${itemPath}) ma nieprawidłowy format.`,
      );
    }
    const id = assertString(item, 'id', itemPath, {
      requiredNonEmpty: true,
      maxLength: VALIDATION_LIMITS.maxIdLength,
    });
    if (seenIds.has(id)) {
      throw new BundleValidationError(
        `Duplikat identyfikatora w liście zespołu (${itemPath}).`,
      );
    }
    seenIds.add(id);
    assertString(item, 'name', itemPath, {
      maxLength: VALIDATION_LIMITS.maxShortTextLength,
    });
    assertString(item, 'role', itemPath, {
      maxLength: VALIDATION_LIMITS.maxShortTextLength,
    });
    assertBoolean(item, 'isCoordinator', itemPath, true);
    return item as unknown as TeamMember;
  });
}

function validateSubjectAdaptations(
  raw: unknown,
  path: string,
): SubjectAdaptationItem[] {
  if (raw === undefined) return [];
  if (!Array.isArray(raw)) {
    throw new BundleValidationError(
      `Pole (${path}) musi być listą dostosowań przedmiotowych.`,
    );
  }
  if (raw.length > VALIDATION_LIMITS.maxSubItems) {
    throw new BundleValidationError(
      `Lista dostosowań (${path}) przekracza limit ${VALIDATION_LIMITS.maxSubItems} pozycji.`,
    );
  }
  const seenIds = new Set<string>();
  return raw.map((item, idx) => {
    const itemPath = `${path}[${idx}]`;
    if (!isPlainObject(item)) {
      throw new BundleValidationError(
        `Pozycja dostosowania (${itemPath}) ma nieprawidłowy format.`,
      );
    }
    const id = assertString(item, 'id', itemPath, {
      optional: true,
      maxLength: VALIDATION_LIMITS.maxIdLength,
    });
    if (id) {
      if (seenIds.has(id)) {
        throw new BundleValidationError(
          `Duplikat identyfikatora dostosowania (${itemPath}).`,
        );
      }
      seenIds.add(id);
    }
    assertString(item, 'subject', itemPath, {
      maxLength: VALIDATION_LIMITS.maxShortTextLength,
    });
    assertString(item, 'methodsAndForms', itemPath, {
      maxLength: VALIDATION_LIMITS.maxLongTextLength,
    });
    assertString(item, 'assessmentCriteria', itemPath, {
      maxLength: VALIDATION_LIMITS.maxLongTextLength,
    });
    return item as unknown as SubjectAdaptationItem;
  });
}

function validateSpecialistSupport(
  raw: unknown,
  path: string,
): SpecialistSupportItem[] {
  if (raw === undefined) return [];
  if (!Array.isArray(raw)) {
    throw new BundleValidationError(
      `Pole (${path}) musi być listą form pomocy specjalistycznej.`,
    );
  }
  if (raw.length > VALIDATION_LIMITS.maxSubItems) {
    throw new BundleValidationError(
      `Lista pomocy PPP (${path}) przekracza limit ${VALIDATION_LIMITS.maxSubItems} pozycji.`,
    );
  }
  const seenIds = new Set<string>();
  return raw.map((item, idx) => {
    const itemPath = `${path}[${idx}]`;
    if (!isPlainObject(item)) {
      throw new BundleValidationError(
        `Pozycja pomocy PPP (${itemPath}) ma nieprawidłowy format.`,
      );
    }
    const id = assertString(item, 'id', itemPath, {
      optional: true,
      maxLength: VALIDATION_LIMITS.maxIdLength,
    });
    if (id) {
      if (seenIds.has(id)) {
        throw new BundleValidationError(
          `Duplikat identyfikatora pomocy PPP (${itemPath}).`,
        );
      }
      seenIds.add(id);
    }
    assertString(item, 'type', itemPath, {
      maxLength: VALIDATION_LIMITS.maxShortTextLength,
    });
    assertString(item, 'period', itemPath, {
      optional: true,
      maxLength: VALIDATION_LIMITS.maxShortTextLength,
    });
    assertPositiveHours(item.hoursPerWeek, `${itemPath}.hoursPerWeek`);
    assertString(item, 'specialistName', itemPath, {
      optional: true,
      maxLength: VALIDATION_LIMITS.maxShortTextLength,
    });
    assertString(item, 'functionalGoal', itemPath, {
      optional: true,
      maxLength: VALIDATION_LIMITS.maxLongTextLength,
    });
    return item as unknown as SpecialistSupportItem;
  });
}

function validateRehabClasses(
  raw: unknown,
  path: string,
): SpecialRehabClassItem[] {
  if (raw === undefined) return [];
  if (!Array.isArray(raw)) {
    throw new BundleValidationError(
      `Pole (${path}) musi być listą zajęć rewalidacyjnych/specjalistycznych.`,
    );
  }
  if (raw.length > VALIDATION_LIMITS.maxSubItems) {
    throw new BundleValidationError(
      `Lista zajęć (${path}) przekracza limit ${VALIDATION_LIMITS.maxSubItems} pozycji.`,
    );
  }
  const seenIds = new Set<string>();
  return raw.map((item, idx) => {
    const itemPath = `${path}[${idx}]`;
    if (!isPlainObject(item)) {
      throw new BundleValidationError(
        `Pozycja zajęć (${itemPath}) ma nieprawidłowy format.`,
      );
    }
    const id = assertString(item, 'id', itemPath, {
      requiredNonEmpty: true,
      maxLength: VALIDATION_LIMITS.maxIdLength,
    });
    if (seenIds.has(id)) {
      throw new BundleValidationError(
        `Duplikat identyfikatora zajęć (${itemPath}).`,
      );
    }
    seenIds.add(id);
    assertEnum(
      item,
      'category',
      itemPath,
      VALID_REHAB_CATEGORIES,
    );
    assertString(item, 'name', itemPath, {
      maxLength: VALIDATION_LIMITS.maxShortTextLength,
    });
    assertPositiveHours(item.hoursPerWeek, `${itemPath}.hoursPerWeek`);
    assertString(item, 'period', itemPath, {
      optional: true,
      maxLength: VALIDATION_LIMITS.maxShortTextLength,
    });
    assertString(item, 'specialistName', itemPath, {
      optional: true,
      maxLength: VALIDATION_LIMITS.maxShortTextLength,
    });
    assertString(item, 'functionalGoal', itemPath, {
      optional: true,
      maxLength: VALIDATION_LIMITS.maxLongTextLength,
    });
    return item as unknown as SpecialRehabClassItem;
  });
}

function validateWopfuDraft(raw: unknown, path: string): WopfuStructureDraft {
  if (!isPlainObject(raw)) {
    throw new BundleValidationError(
      `Sekcja WOPFU (${path}) ma nieprawidłowy format obiektu.`,
    );
  }
  assertOptionalTimestampOrDate(raw, 'lastUpdatedAt', path, true);
  assertOptionalDateString(raw, 'assessmentDate', path, true);
  assertString(raw, 'conditionsAndContext', path, {
    optional: true,
    maxLength: VALIDATION_LIMITS.maxLongTextLength,
  });

  if (raw.functioningAreas !== undefined) {
    if (!isPlainObject(raw.functioningAreas)) {
      throw new BundleValidationError(
        `Obszary funkcjonowania WOPFU (${path}.functioningAreas) mają nieprawidłowy format.`,
      );
    }
    const fa = raw.functioningAreas;
    assertString(fa, 'cognitive', `${path}.functioningAreas`, { optional: true });
    assertString(fa, 'communication', `${path}.functioningAreas`, {
      optional: true,
    });
    assertString(fa, 'emotionalSocial', `${path}.functioningAreas`, {
      optional: true,
    });
    assertString(fa, 'motorSensory', `${path}.functioningAreas`, {
      optional: true,
    });
  }

  assertStringArray(raw, 'strengths', path, VALIDATION_LIMITS.maxSubItems, true);
  assertStringArray(
    raw,
    'barriersAndNeeds',
    path,
    VALIDATION_LIMITS.maxSubItems,
    true,
  );
  assertString(raw, 'developmentalNeedsSummary', path, { optional: true });
  assertBoolean(raw, 'isCompleted', path, true);

  return raw as unknown as WopfuStructureDraft;
}

function validateIpetDraft(raw: unknown, path: string): IpetStructureDraft {
  if (!isPlainObject(raw)) {
    throw new BundleValidationError(
      `Sekcja IPET (${path}) ma nieprawidłowy format obiektu.`,
    );
  }
  assertOptionalTimestampOrDate(raw, 'lastUpdatedAt', path, true);
  assertOptionalDateString(raw, 'approvedDate', path, true);
  assertString(raw, 'educationalAndTherapeuticGoals', path, { optional: true });
  assertString(raw, 'methodsAndFormsOfWork', path, { optional: true });
  validateSubjectAdaptations(
    raw.subjectAdaptations,
    `${path}.subjectAdaptations`,
  );
  assertString(raw, 'integratedTeamActions', path, { optional: true });
  validateSpecialistSupport(
    raw.specialistSupportHours,
    `${path}.specialistSupportHours`,
  );
  validateRehabClasses(
    raw.rehabAndSpecialClasses,
    `${path}.rehabAndSpecialClasses`,
  );
  assertString(raw, 'parentCollaborationNotes', path, { optional: true });
  assertBoolean(raw, 'isCompleted', path, true);

  return raw as unknown as IpetStructureDraft;
}

function validateOpinionSupportDraft(
  raw: unknown,
  path: string,
): OpinionSupportDraft {
  if (!isPlainObject(raw)) {
    throw new BundleValidationError(
      `Sekcja wsparcia dla Opinii PPP (${path}) ma nieprawidłowy format obiektu.`,
    );
  }
  assertOptionalTimestampOrDate(raw, 'lastUpdatedAt', path, true);
  assertOptionalDateString(raw, 'implementedDate', path, true);
  assertString(raw, 'functionalProfileSummary', path, { optional: true });
  validateSubjectAdaptations(
    raw.subjectAdaptations,
    `${path}.subjectAdaptations`,
  );
  validateSpecialistSupport(
    raw.psychologicalPedagogicalSupport,
    `${path}.psychologicalPedagogicalSupport`,
  );
  assertString(raw, 'parentCollaborationNotes', path, { optional: true });
  assertBoolean(raw, 'isCompleted', path, true);

  return raw as unknown as OpinionSupportDraft;
}

export function validateStudentProfile(
  raw: unknown,
  path = 'student',
): StudentProfile {
  if (!isPlainObject(raw)) {
    throw new BundleValidationError(
      `Profil ucznia (${path}) ma nieprawidłowy format obiektu.`,
    );
  }

  assertString(raw, 'id', path, {
    requiredNonEmpty: true,
    maxLength: VALIDATION_LIMITS.maxIdLength,
  });
  assertString(raw, 'firstName', path, {
    requiredNonEmpty: true,
    maxLength: VALIDATION_LIMITS.maxShortTextLength,
  });
  assertString(raw, 'lastName', path, {
    requiredNonEmpty: true,
    maxLength: VALIDATION_LIMITS.maxShortTextLength,
  });
  assertOptionalDateString(raw, 'birthDate', path, false);
  assertString(raw, 'className', path, {
    requiredNonEmpty: true,
    maxLength: 80,
  });
  assertString(raw, 'schoolYear', path, {
    requiredNonEmpty: true,
    maxLength: 40,
  });
  assertEnum(raw, 'educationStage', path, VALID_EDUCATION_STAGES);
  assertEnum(raw, 'documentType', path, VALID_DOCUMENT_TYPES);

  if (!isPlainObject(raw.pppDocument)) {
    throw new BundleValidationError(
      `Dane dokumentu PPP (${path}.pppDocument) mają nieprawidłowy format.`,
    );
  }
  const ppp = raw.pppDocument;
  assertString(ppp, 'documentNumber', `${path}.pppDocument`, {
    requiredNonEmpty: true,
    maxLength: VALIDATION_LIMITS.maxShortTextLength,
  });
  assertOptionalDateString(ppp, 'issueDate', `${path}.pppDocument`, false);
  assertOptionalDateString(ppp, 'submissionDate', `${path}.pppDocument`, false);
  assertString(ppp, 'validUntil', `${path}.pppDocument`, {
    optional: true,
    maxLength: VALIDATION_LIMITS.maxShortTextLength,
  });
  assertString(ppp, 'issuingAuthority', `${path}.pppDocument`, {
    optional: true,
    maxLength: VALIDATION_LIMITS.maxShortTextLength,
  });
  assertString(ppp, 'reasonCategory', `${path}.pppDocument`, {
    optional: true,
    maxLength: VALIDATION_LIMITS.maxShortTextLength,
  });
  assertString(ppp, 'recommendationsSummary', `${path}.pppDocument`, {
    optional: true,
    maxLength: VALIDATION_LIMITS.maxLongTextLength,
  });

  assertString(raw, 'teamCoordinator', path, {
    optional: true,
    maxLength: VALIDATION_LIMITS.maxShortTextLength,
  });
  validateTeamMembers(raw.teamMembers, `${path}.teamMembers`);
  assertEnum(raw, 'status', path, VALID_STUDENT_STATUSES);
  assertBoolean(raw, 'isTestData', path, true);

  if (raw.wopfuDraft !== undefined) {
    validateWopfuDraft(raw.wopfuDraft, `${path}.wopfuDraft`);
  }
  if (raw.ipetDraft !== undefined) {
    validateIpetDraft(raw.ipetDraft, `${path}.ipetDraft`);
  }
  if (raw.opinionSupportDraft !== undefined) {
    validateOpinionSupportDraft(
      raw.opinionSupportDraft,
      `${path}.opinionSupportDraft`,
    );
  }

  assertOptionalTimestampOrDate(raw, 'createdAt', path, false);
  assertOptionalTimestampOrDate(raw, 'updatedAt', path, false);

  return raw as unknown as StudentProfile;
}

export function validateJournalEntry(
  raw: unknown,
  path = 'journalEntry',
): JournalEntry {
  if (!isPlainObject(raw)) {
    throw new BundleValidationError(
      `Wpis dziennika (${path}) ma nieprawidłowy format obiektu.`,
    );
  }

  assertString(raw, 'id', path, {
    requiredNonEmpty: true,
    maxLength: VALIDATION_LIMITS.maxIdLength,
  });
  assertString(raw, 'studentId', path, {
    requiredNonEmpty: true,
    maxLength: VALIDATION_LIMITS.maxIdLength,
  });
  assertRequiredDateString(raw, 'date', path);
  assertEnum(raw, 'category', path, VALID_JOURNAL_CATEGORIES);
  assertString(raw, 'authorName', path, {
    optional: true,
    maxLength: VALIDATION_LIMITS.maxShortTextLength,
  });
  assertString(raw, 'authorRole', path, {
    optional: true,
    maxLength: VALIDATION_LIMITS.maxShortTextLength,
  });
  assertString(raw, 'title', path, {
    requiredNonEmpty: true,
    maxLength: VALIDATION_LIMITS.maxShortTextLength,
  });
  assertString(raw, 'content', path, {
    optional: true,
    maxLength: VALIDATION_LIMITS.maxLongTextLength,
  });
  assertString(raw, 'relatedArea', path, {
    optional: true,
    maxLength: VALIDATION_LIMITS.maxShortTextLength,
  });
  assertString(raw, 'whatWorked', path, {
    optional: true,
    maxLength: VALIDATION_LIMITS.maxLongTextLength,
  });
  assertString(raw, 'barriersObserved', path, {
    optional: true,
    maxLength: VALIDATION_LIMITS.maxLongTextLength,
  });
  assertString(raw, 'conclusions', path, {
    optional: true,
    maxLength: VALIDATION_LIMITS.maxLongTextLength,
  });
  assertBoolean(raw, 'isTestData', path, true);
  assertOptionalTimestampOrDate(raw, 'createdAt', path, false);
  assertOptionalTimestampOrDate(raw, 'updatedAt', path, false);

  return raw as unknown as JournalEntry;
}

export function validatePeriodicEvaluation(
  raw: unknown,
  path = 'evaluation',
): PeriodicEvaluation {
  if (!isPlainObject(raw)) {
    throw new BundleValidationError(
      `Ocena okresowa (${path}) ma nieprawidłowy format obiektu.`,
    );
  }

  assertString(raw, 'id', path, {
    requiredNonEmpty: true,
    maxLength: VALIDATION_LIMITS.maxIdLength,
  });
  assertString(raw, 'studentId', path, {
    requiredNonEmpty: true,
    maxLength: VALIDATION_LIMITS.maxIdLength,
  });
  assertString(raw, 'schoolYear', path, {
    requiredNonEmpty: true,
    maxLength: 40,
  });

  if (raw.semester !== 'I' && raw.semester !== 'II') {
    throw new BundleValidationError(
      `Nieprawidłowa wartość półrocza (${path}.semester): oczekiwano I lub II.`,
    );
  }

  assertEnum(raw, 'periodType', path, VALID_EVAL_PERIOD_TYPES, true);
  assertString(raw, 'periodLabel', path, {
    optional: true,
    maxLength: VALIDATION_LIMITS.maxShortTextLength,
  });
  assertRequiredDateString(raw, 'evaluationDate', path);
  assertEnum(raw, 'type', path, VALID_EVAL_TYPES);
  assertString(raw, 'teamMembers', path, {
    optional: true,
    maxLength: VALIDATION_LIMITS.maxLongTextLength,
  });
  assertString(raw, 'goalsReferenceNotes', path, {
    optional: true,
    maxLength: VALIDATION_LIMITS.maxLongTextLength,
  });
  assertEnum(
    raw,
    'effectivenessRating',
    path,
    VALID_EFFECTIVENESS_RATINGS,
    true,
  );
  assertString(raw, 'progressSummary', path, {
    requiredNonEmpty: true,
    maxLength: VALIDATION_LIMITS.maxLongTextLength,
  });
  assertEnum(
    raw,
    'modificationDecision',
    path,
    VALID_MODIFICATION_DECISIONS,
    true,
  );
  assertString(raw, 'modificationsNeeded', path, {
    optional: true,
    maxLength: VALIDATION_LIMITS.maxLongTextLength,
  });
  assertString(raw, 'noChangeJustification', path, {
    optional: true,
    maxLength: VALIDATION_LIMITS.maxLongTextLength,
  });
  if (raw.linkedAnnexId !== undefined) {
    assertString(raw, 'linkedAnnexId', path, {
      requiredNonEmpty: true,
      maxLength: VALIDATION_LIMITS.maxIdLength,
    });
  }
  assertEnum(raw, 'status', path, VALID_EVAL_STATUSES);
  assertBoolean(raw, 'isTestData', path, true);
  assertOptionalTimestampOrDate(raw, 'createdAt', path, false);
  assertOptionalTimestampOrDate(raw, 'updatedAt', path, false);

  return raw as unknown as PeriodicEvaluation;
}

export function validateProgramModificationAnnex(
  raw: unknown,
  path = 'annex',
): ProgramModificationAnnex {
  if (!isPlainObject(raw)) {
    throw new BundleValidationError(
      `Aneks/modyfikacja programu (${path}) ma nieprawidłowy format obiektu.`,
    );
  }

  assertString(raw, 'id', path, {
    requiredNonEmpty: true,
    maxLength: VALIDATION_LIMITS.maxIdLength,
  });
  assertString(raw, 'studentId', path, {
    requiredNonEmpty: true,
    maxLength: VALIDATION_LIMITS.maxIdLength,
  });

  if (
    typeof raw.versionNumber !== 'number' ||
    !Number.isInteger(raw.versionNumber) ||
    raw.versionNumber < 1 ||
    raw.versionNumber > VALIDATION_LIMITS.maxVersionNumber
  ) {
    throw new BundleValidationError(
      `Nieprawidłowy numer wersji aneksu (${path}.versionNumber): wymagana liczba całkowita dodatnia.`,
    );
  }

  assertRequiredDateString(raw, 'annexDate', path);
  assertString(raw, 'schoolYear', path, {
    requiredNonEmpty: true,
    maxLength: 40,
  });
  if (raw.evaluationId !== undefined) {
    assertString(raw, 'evaluationId', path, {
      requiredNonEmpty: true,
      maxLength: VALIDATION_LIMITS.maxIdLength,
    });
  }
  assertEnum(raw, 'decisionType', path, VALID_ANNEX_DECISIONS);
  assertString(raw, 'title', path, {
    requiredNonEmpty: true,
    maxLength: VALIDATION_LIMITS.maxShortTextLength,
  });
  assertStringArray(
    raw,
    'changedSections',
    path,
    VALIDATION_LIMITS.maxSubItems,
    true,
  );
  assertString(raw, 'changeDescription', path, {
    optional: true,
    maxLength: VALIDATION_LIMITS.maxLongTextLength,
  });
  assertString(raw, 'authorAndTeam', path, {
    optional: true,
    maxLength: VALIDATION_LIMITS.maxLongTextLength,
  });
  assertOptionalDateString(raw, 'parentNotifiedDate', path, false);
  assertBoolean(raw, 'isTestData', path, true);
  assertOptionalTimestampOrDate(raw, 'createdAt', path, false);
  assertOptionalTimestampOrDate(raw, 'updatedAt', path, false);

  return raw as unknown as ProgramModificationAnnex;
}

export function validateFacilitySettings(
  raw: unknown,
  path = 'facilitySettings',
): Omit<FacilitySettings, 'appLock'> {
  if (!isPlainObject(raw)) {
    throw new BundleValidationError(
      `Ustawienia placówki (${path}) mają nieprawidłowy format obiektu.`,
    );
  }

  if (raw.id !== undefined && raw.id !== 'default') {
    throw new BundleValidationError(
      `Nieprawidłowy identyfikator ustawień placówki (${path}.id): oczekiwano 'default'.`,
    );
  }
  assertString(raw, 'schoolName', path, {
    requiredNonEmpty: true,
    maxLength: VALIDATION_LIMITS.maxShortTextLength,
  });
  assertString(raw, 'schoolType', path, {
    requiredNonEmpty: true,
    maxLength: VALIDATION_LIMITS.maxShortTextLength,
  });
  assertString(raw, 'address', path, {
    optional: true,
    maxLength: VALIDATION_LIMITS.maxShortTextLength,
  });
  assertString(raw, 'city', path, {
    optional: true,
    maxLength: VALIDATION_LIMITS.maxShortTextLength,
  });
  assertString(raw, 'directorName', path, {
    optional: true,
    maxLength: VALIDATION_LIMITS.maxShortTextLength,
  });
  assertString(raw, 'defaultSchoolYear', path, {
    requiredNonEmpty: true,
    maxLength: 40,
  });
  assertString(raw, 'defaultTeamRole', path, {
    optional: true,
    maxLength: VALIDATION_LIMITS.maxShortTextLength,
  });
  assertEnum(raw, 'theme', path, VALID_THEMES);
  assertOptionalTimestampOrDate(raw, 'updatedAt', path, false);

  const { appLock: _ignoredLock, ...safeSettings } = raw;
  return {
    ...(safeSettings as Omit<FacilitySettings, 'appLock'>),
    id: 'default',
  };
}

export function validateSingleStudentBundle(raw: unknown): SingleStudentBundle {
  if (!isPlainObject(raw) || raw.kind !== 'SINGLE_STUDENT_BUNDLE') {
    throw new BundleValidationError(
      'Pakiet nie jest poprawnym eksportem pojedynczego ucznia (SINGLE_STUDENT_BUNDLE).',
    );
  }

  const student = validateStudentProfile(raw.student, 'student');

  if (!Array.isArray(raw.journalEntries)) {
    throw new BundleValidationError(
      'Pakiet ucznia ma nieprawidłowe pole journalEntries (oczekiwano tablicy).',
    );
  }
  if (!Array.isArray(raw.evaluations)) {
    throw new BundleValidationError(
      'Pakiet ucznia ma nieprawidłowe pole evaluations (oczekiwano tablicy).',
    );
  }
  if (!Array.isArray(raw.annexes)) {
    throw new BundleValidationError(
      'Pakiet ucznia ma nieprawidłowe pole annexes (oczekiwano tablicy).',
    );
  }

  if (
    raw.journalEntries.length > VALIDATION_LIMITS.maxJournalEntriesPerBackup ||
    raw.evaluations.length > VALIDATION_LIMITS.maxEvaluationsPerBackup ||
    raw.annexes.length > VALIDATION_LIMITS.maxAnnexesPerBackup
  ) {
    throw new BundleValidationError(
      'Liczba rekordów podrzędnych w pakiecie ucznia przekracza bezpieczny limit.',
    );
  }

  const journalIds = new Set<string>();
  const journalEntries = raw.journalEntries.map((item, idx) => {
    const entry = validateJournalEntry(item, `journalEntries[${idx}]`);
    if (entry.studentId !== student.id) {
      throw new BundleValidationError(
        `Niespójność studentId we wpisie dziennika (journalEntries[${idx}]): wpis nie należy do eksportowanego ucznia.`,
      );
    }
    if (journalIds.has(entry.id)) {
      throw new BundleValidationError(
        `Duplikat identyfikatora wpisu dziennika (journalEntries[${idx}]).`,
      );
    }
    journalIds.add(entry.id);
    return entry;
  });

  const evalIds = new Set<string>();
  const evaluations = raw.evaluations.map((item, idx) => {
    const ev = validatePeriodicEvaluation(item, `evaluations[${idx}]`);
    if (ev.studentId !== student.id) {
      throw new BundleValidationError(
        `Niespójność studentId w ocenie okresowej (evaluations[${idx}]): ocena nie należy do eksportowanego ucznia.`,
      );
    }
    if (evalIds.has(ev.id)) {
      throw new BundleValidationError(
        `Duplikat identyfikatora oceny okresowej (evaluations[${idx}]).`,
      );
    }
    evalIds.add(ev.id);
    return ev;
  });

  const annexIds = new Set<string>();
  const annexes = raw.annexes.map((item, idx) => {
    const annex = validateProgramModificationAnnex(item, `annexes[${idx}]`);
    if (annex.studentId !== student.id) {
      throw new BundleValidationError(
        `Niespójność studentId w aneksie (annexes[${idx}]): aneks nie należy do eksportowanego ucznia.`,
      );
    }
    if (annexIds.has(annex.id)) {
      throw new BundleValidationError(
        `Duplikat identyfikatora aneksu (annexes[${idx}]).`,
      );
    }
    annexIds.add(annex.id);
    return annex;
  });

  // Spójność relacji ocena <-> aneks wewnątrz pakietu
  evaluations.forEach((ev, idx) => {
    if (ev.linkedAnnexId && !annexIds.has(ev.linkedAnnexId)) {
      throw new BundleValidationError(
        `Niespójna referencja w ocenie okresowej (evaluations[${idx}].linkedAnnexId): wskazany aneks nie istnieje w pakiecie.`,
      );
    }
  });
  annexes.forEach((annex, idx) => {
    if (annex.evaluationId && !evalIds.has(annex.evaluationId)) {
      throw new BundleValidationError(
        `Niespójna referencja w aneksie (annexes[${idx}].evaluationId): wskazana ocena nie istnieje w pakiecie.`,
      );
    }
  });

  return {
    kind: 'SINGLE_STUDENT_BUNDLE',
    student,
    journalEntries,
    evaluations,
    annexes,
  };
}

export function validateFullDatabaseBundle(raw: unknown): FullDatabaseBundle {
  if (!isPlainObject(raw) || raw.kind !== 'FULL_DATABASE_BUNDLE') {
    throw new BundleValidationError(
      'Pakiet nie jest poprawną pełną kopią zapasową bazy danych (FULL_DATABASE_BUNDLE).',
    );
  }

  const facilitySettings = validateFacilitySettings(
    raw.facilitySettings,
    'facilitySettings',
  );

  if (
    !Array.isArray(raw.students) ||
    !Array.isArray(raw.journalEntries) ||
    !Array.isArray(raw.evaluations) ||
    !Array.isArray(raw.annexes)
  ) {
    throw new BundleValidationError(
      'Pełna kopia zapasowa ma nieprawidłową strukturę tabel (wymagane tablice students, journalEntries, evaluations, annexes).',
    );
  }

  if (raw.students.length > VALIDATION_LIMITS.maxStudentsPerBackup) {
    throw new BundleValidationError(
      `Liczba uczniów w kopii przekracza maksymalny bezpieczny limit (${VALIDATION_LIMITS.maxStudentsPerBackup}).`,
    );
  }
  if (
    raw.journalEntries.length > VALIDATION_LIMITS.maxJournalEntriesPerBackup ||
    raw.evaluations.length > VALIDATION_LIMITS.maxEvaluationsPerBackup ||
    raw.annexes.length > VALIDATION_LIMITS.maxAnnexesPerBackup
  ) {
    throw new BundleValidationError(
      'Liczba rekordów w pełnej kopii zapasowej przekracza maksymalny bezpieczny limit.',
    );
  }

  const studentIds = new Set<string>();
  const students = raw.students.map((item, idx) => {
    const student = validateStudentProfile(item, `students[${idx}]`);
    if (studentIds.has(student.id)) {
      throw new BundleValidationError(
        `Duplikat identyfikatora ucznia w kopii zapasowej (students[${idx}]).`,
      );
    }
    studentIds.add(student.id);
    return student;
  });

  const journalIds = new Set<string>();
  const journalEntries = raw.journalEntries.map((item, idx) => {
    const entry = validateJournalEntry(item, `journalEntries[${idx}]`);
    if (!studentIds.has(entry.studentId)) {
      throw new BundleValidationError(
        `Niespójność referencyjna we wpisie dziennika (journalEntries[${idx}]): brak powiązanego ucznia w kopii.`,
      );
    }
    if (journalIds.has(entry.id)) {
      throw new BundleValidationError(
        `Duplikat identyfikatora wpisu dziennika (journalEntries[${idx}]).`,
      );
    }
    journalIds.add(entry.id);
    return entry;
  });

  const evalById = new Map<string, PeriodicEvaluation>();
  const evaluations = raw.evaluations.map((item, idx) => {
    const ev = validatePeriodicEvaluation(item, `evaluations[${idx}]`);
    if (!studentIds.has(ev.studentId)) {
      throw new BundleValidationError(
        `Niespójność referencyjna w ocenie okresowej (evaluations[${idx}]): brak powiązanego ucznia w kopii.`,
      );
    }
    if (evalById.has(ev.id)) {
      throw new BundleValidationError(
        `Duplikat identyfikatora oceny okresowej (evaluations[${idx}]).`,
      );
    }
    evalById.set(ev.id, ev);
    return ev;
  });

  const annexById = new Map<string, ProgramModificationAnnex>();
  const annexes = raw.annexes.map((item, idx) => {
    const annex = validateProgramModificationAnnex(item, `annexes[${idx}]`);
    if (!studentIds.has(annex.studentId)) {
      throw new BundleValidationError(
        `Niespójność referencyjna w aneksie (annexes[${idx}]): brak powiązanego ucznia w kopii.`,
      );
    }
    if (annexById.has(annex.id)) {
      throw new BundleValidationError(
        `Duplikat identyfikatora aneksu (annexes[${idx}]).`,
      );
    }
    annexById.set(annex.id, annex);
    return annex;
  });

  evaluations.forEach((ev, idx) => {
    if (ev.linkedAnnexId) {
      const targetAnnex = annexById.get(ev.linkedAnnexId);
      if (!targetAnnex) {
        throw new BundleValidationError(
          `Niespójna referencja (evaluations[${idx}].linkedAnnexId): wskazany aneks nie istnieje w kopii.`,
        );
      }
      if (targetAnnex.studentId !== ev.studentId) {
        throw new BundleValidationError(
          `Niespójna relacja między uczniami (evaluations[${idx}].linkedAnnexId): wskazany aneks należy do innego ucznia.`,
        );
      }
    }
  });

  annexes.forEach((annex, idx) => {
    if (annex.evaluationId) {
      const targetEval = evalById.get(annex.evaluationId);
      if (!targetEval) {
        throw new BundleValidationError(
          `Niespójna referencja (annexes[${idx}].evaluationId): wskazana ocena nie istnieje w kopii.`,
        );
      }
      if (targetEval.studentId !== annex.studentId) {
        throw new BundleValidationError(
          `Niespójna relacja między uczniami (annexes[${idx}].evaluationId): wskazana ocena należy do innego ucznia.`,
        );
      }
    }
  });

  return {
    kind: 'FULL_DATABASE_BUNDLE',
    facilitySettings,
    students,
    journalEntries,
    evaluations,
    annexes,
  };
}
