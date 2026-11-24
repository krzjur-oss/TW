export type DocumentType = 'ORZECZENIE' | 'OPINIA';

export type EducationStage =
  | 'PRZEDSZKOLE'
  | 'KLASY_1_3'
  | 'KLASY_4_8'
  | 'PONADPODSTAWOWA';

export type StudentStatus = 'AKTYWNY' | 'ARCHIWUM';

export type JournalCategory =
  | 'OBSERWACJA'
  | 'REWALIDACJA'
  | 'KONSULTACJA'
  | 'DOSTOSOWANIE'
  | 'SUKCES';

export type EvaluationType = 'WOPFU_AKTUALIZACJA' | 'OCENA_OKRESOWA_IPET';

export type EvaluationPeriodType =
  | 'I_POLROCZE'
  | 'KONIEC_ROKU'
  | 'OKRES_NIESTANDARDOWY';

export type EffectivenessRating = 'WYSOKA' | 'CZESCIOWA' | 'WYMAGA_ZMIAN';

export type ModificationDecision = 'WPROWADZONO_ANEKS' | 'BRAK_ZMIAN';

export type EvaluationStatus = 'SZKIC' | 'ZATWIERDZONA';

export type ThemeMode = 'light' | 'dark';

export interface PppDocumentMetadata {
  documentNumber: string;
  issueDate: string; // YYYY-MM-DD
  submissionDate?: string; // YYYY-MM-DD (data złożenia dokumentu w placówce)
  validUntil: string;
  issuingAuthority: string;
  reasonCategory: string;
  recommendationsSummary: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  isCoordinator?: boolean;
}

/**
 * Struktura WOPFU (Ścieżka A: Orzeczenie o potrzebie kształcenia specjalnego)
 */
export interface WopfuStructureDraft {
  lastUpdatedAt: string | null;
  assessmentDate?: string | null;
  conditionsAndContext: string;
  functioningAreas: {
    cognitive: string;
    communication: string;
    emotionalSocial: string;
    motorSensory: string;
  };
  strengths: string[];
  barriersAndNeeds: string[];
  developmentalNeedsSummary: string;
  isCompleted: boolean;
}

export interface SubjectAdaptationItem {
  id: string;
  subject: string;
  methodsAndForms: string;
  assessmentCriteria: string;
}

export interface SpecialistSupportItem {
  id: string;
  type: string;
  period: string;
  hoursPerWeek: number;
  specialistName: string;
  functionalGoal: string;
}

export interface SpecialRehabClassItem {
  id: string;
  category:
    | 'REWALIDACYJNE'
    | 'SOCJOTERAPEUTYCZNE'
    | 'RESOCJALIZACYJNE'
    | 'INNE';
  name: string;
  hoursPerWeek: number;
  period: string;
  specialistName: string;
  functionalGoal: string;
}

/**
 * Struktura IPET (Ścieżka A: Orzeczenie o potrzebie kształcenia specjalnego)
 */
export interface IpetStructureDraft {
  lastUpdatedAt: string | null;
  approvedDate: string | null;
  educationalAndTherapeuticGoals: string;
  methodsAndFormsOfWork: string;
  subjectAdaptations: SubjectAdaptationItem[];
  integratedTeamActions: string;
  specialistSupportHours: SpecialistSupportItem[];
  rehabAndSpecialClasses: SpecialRehabClassItem[];
  parentCollaborationNotes: string;
  isCompleted: boolean;
}

/**
 * Struktura wsparcia dla Opinii PPP (Ścieżka B: bez pełnego IPET)
 */
export interface OpinionSupportDraft {
  lastUpdatedAt: string | null;
  implementedDate: string | null;
  functionalProfileSummary: string;
  subjectAdaptations: SubjectAdaptationItem[];
  psychologicalPedagogicalSupport: SpecialistSupportItem[];
  parentCollaborationNotes: string;
  isCompleted: boolean;
}

export interface StudentProfile {
  id: string;
  firstName: string;
  lastName: string;
  birthDate: string; // YYYY-MM-DD
  className: string;
  schoolYear: string;
  educationStage: EducationStage;
  documentType: DocumentType;
  pppDocument: PppDocumentMetadata;
  teamCoordinator: string;
  teamMembers: TeamMember[];
  status: StudentStatus;
  isTestData: boolean;
  wopfuDraft: WopfuStructureDraft;
  ipetDraft: IpetStructureDraft;
  opinionSupportDraft: OpinionSupportDraft;
  createdAt: string;
  updatedAt: string;
}

export interface JournalEntry {
  id: string;
  studentId: string;
  date: string;
  category: JournalCategory;
  authorName: string;
  authorRole: string;
  title: string;
  content: string;
  relatedArea: string;
  whatWorked: string;
  barriersObserved: string;
  conclusions: string;
  isTestData: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PeriodicEvaluation {
  id: string;
  studentId: string;
  schoolYear: string;
  semester: 'I' | 'II';
  periodType: EvaluationPeriodType;
  periodLabel: string;
  evaluationDate: string;
  type: EvaluationType;
  teamMembers: string;
  goalsReferenceNotes: string;
  effectivenessRating: EffectivenessRating;
  progressSummary: string;
  modificationDecision: ModificationDecision;
  modificationsNeeded: string;
  noChangeJustification: string;
  linkedAnnexId?: string;
  status: EvaluationStatus;
  isTestData: boolean;
  createdAt: string;
  updatedAt: string;
}

export type AnnexDecisionType =
  | 'MODYFIKACJA_IPET'
  | 'AKTUALIZACJA_DOSTOSOWAN'
  | 'BRAK_ZMIAN';

export interface ProgramModificationAnnex {
  id: string;
  studentId: string;
  versionNumber: number;
  annexDate: string; // YYYY-MM-DD
  schoolYear: string;
  evaluationId?: string;
  decisionType: AnnexDecisionType;
  title: string;
  changedSections: string[];
  changeDescription: string;
  authorAndTeam: string;
  parentNotifiedDate?: string;
  isTestData: boolean;
  createdAt: string;
  updatedAt: string;
}

export type AppLockMode = 'PIN' | 'PASSWORD';

export type AutoLockMinutes = 0 | 1 | 5 | 10 | 15;

export type BackgroundLockPolicy = 'OFF' | 'RESPECT_IDLE' | 'IMMEDIATE';

export interface AppLockConfig {
  enabled: boolean;
  mode: AppLockMode;
  salt: string;
  hash: string;
  iterations: number;
  autoLockMinutes?: AutoLockMinutes;
  backgroundLockPolicy?: BackgroundLockPolicy;
  updatedAt: string;
}

export interface FacilitySettings {
  id: 'default';
  schoolName: string;
  schoolType: string;
  address?: string;
  city: string;
  directorName: string;
  defaultSchoolYear: string;
  defaultTeamRole: string;
  theme: ThemeMode;
  appLock?: AppLockConfig;
  updatedAt: string;
}

export const EDUCATION_STAGE_LABELS: Record<EducationStage, string> = {
  PRZEDSZKOLE: 'Wychowanie przedszkolne',
  KLASY_1_3: 'Edukacja wczesnoszkolna (kl. I–III)',
  KLASY_4_8: 'Szkoła podstawowa (kl. IV–VIII)',
  PONADPODSTAWOWA: 'Szkoła ponadpodstawowa',
};

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  ORZECZENIE: 'Orzeczenie o potrzebie kształcenia specjalnego',
  OPINIA: 'Opinia PPP / dostosowanie wymagań',
};

export const JOURNAL_CATEGORY_LABELS: Record<JournalCategory, string> = {
  OBSERWACJA: 'Obserwacja pedagogiczna',
  REWALIDACJA: 'Zajęcia rewalidacyjne / specjalistyczne',
  KONSULTACJA: 'Konsultacja z rodzicami / zespołem',
  DOSTOSOWANIE: 'Dostosowanie wymagań',
  SUKCES: 'Postęp / mocna strona',
};

export const FUNCTIONING_AREA_OPTIONS = [
  'Funkcjonowanie poznawczo-edukacyjne',
  'Komunikacja i język',
  'Kompetencje emocjonalno-społeczne',
  'Motoryka i sfera sensoryczna',
  'Zajęcia rewalidacyjne / specjalistyczne',
  'Praca na lekcji / sprawdzian',
  'Współpraca z rodzicami',
];

export const EVALUATION_PERIOD_LABELS: Record<EvaluationPeriodType, string> = {
  I_POLROCZE: 'Ocena za I półrocze',
  KONIEC_ROKU: 'Ocena na koniec roku szkolnego',
  OKRES_NIESTANDARDOWY: 'Ocena doraźna / okres niestandardowy',
};

export const EFFECTIVENESS_RATING_LABELS: Record<EffectivenessRating, string> = {
  WYSOKA: 'Wysoka skuteczność wsparcia',
  CZESCIOWA: 'Częściowa skuteczność (wymaga korekt)',
  WYMAGA_ZMIAN: 'Niska skuteczność (konieczna modyfikacja)',
};

export const IPET_ANNEX_SECTIONS = [
  'Cele edukacyjne i terapeutyczne',
  'Metody i formy pracy',
  'Dostosowanie wymagań edukacyjnych',
  'Zintegrowane działania zespołu',
  'Formy i okresy pomocy PPP',
  'Zajęcia rewalidacyjne / socjoterapeutyczne',
  'Współpraca z rodzicami / opiekunami',
];

export const REHAB_CATEGORY_LABELS: Record<
  SpecialRehabClassItem['category'],
  string
> = {
  REWALIDACYJNE: 'Zajęcia rewalidacyjne',
  SOCJOTERAPEUTYCZNE: 'Zajęcia socjoterapeutyczne',
  RESOCJALIZACYJNE: 'Zajęcia resocjalizacyjne',
  INNE: 'Inne specjalistyczne',
};

export const SCHOOL_TYPE_OPTIONS = [
  'Szkoła Podstawowa',
  'Przedszkole',
  'Liceum Ogólnokształcące',
  'Technikum',
  'Szkoła Branżowa I Stopnia',
  'Zespół Szkół',
];
