import {
  createEmptyIpetDraft,
  createEmptyOpinionSupportDraft,
  createEmptyWopfuDraft,
  DEFAULT_FACILITY_SETTINGS,
} from '../src/db/database';
import type {
  FacilitySettings,
  JournalEntry,
  PeriodicEvaluation,
  ProgramModificationAnnex,
  StudentProfile,
} from '../src/types/domain';

export function makeSyntheticSettings(
  overrides: Partial<FacilitySettings> = {},
): FacilitySettings {
  return {
    ...DEFAULT_FACILITY_SETTINGS,
    schoolName: 'Szkoła Podstawowa Testowa nr 99',
    schoolType: 'Szkoła Podstawowa',
    address: 'ul. Fikcyjna 10, 00-999 Miasteczko',
    city: 'Miasteczko',
    directorName: 'mgr Anna Przykładowa',
    defaultSchoolYear: '2026/2027',
    defaultTeamRole: 'Pedagog specjalny',
    updatedAt: '2026-09-01T08:00:00.000Z',
    ...overrides,
  };
}

export function makeSyntheticStudent(
  id: string,
  overrides: Partial<StudentProfile> = {},
): StudentProfile {
  const wopfu = createEmptyWopfuDraft();
  wopfu.assessmentDate = '2026-09-15';
  wopfu.conditionsAndContext =
    'Uczeń syntetyczny — opis uwarunkowań w środowisku klasowym z polskimi znakami: ą ć ę ł ń ó ś ź ż.';
  wopfu.functioningAreas = {
    cognitive: 'Koncentracja uwagi wspierana zadaniami w krótkich blokach.',
    communication: 'Rozumie polecenia jednoetapowe z podporą wizualną.',
    emotionalSocial: 'Współpracuje w parze w przewidywalnej strukturze.',
    motorSensory: 'Wymaga przerw ruchowych i ograniczenia nadmiaru bodźców.',
  };
  wopfu.strengths = ['Wysoka motywacja przy zadaniach wizualnych'];
  wopfu.barriersAndNeeds = ['Hałas w klasie powyżej 60 dB utrudnia skupienie'];
  wopfu.developmentalNeedsSummary = 'Potrzeba jasnych kryteriów i instrukcji krok po kroku.';
  wopfu.isCompleted = true;
  wopfu.lastUpdatedAt = '2026-09-16T10:00:00.000Z';

  const ipet = createEmptyIpetDraft();
  ipet.approvedDate = '2026-09-25';
  ipet.educationalAndTherapeuticGoals =
    'Samodzielne planowanie pracy w 3 krokach z użyciem checklisty.';
  ipet.methodsAndFormsOfWork = 'Instruktaż wizualny, praca w małych grupach.';
  ipet.subjectAdaptations = [
    {
      id: `${id}-adapt-1`,
      subject: 'Język polski',
      methodsAndForms: 'Podział dłuższych tekstów na akapity, wydłużony czas.',
      assessmentCriteria: 'Ocena treści merytorycznej bez obniżania za tempo pisma.',
    },
  ];
  ipet.integratedTeamActions = 'Cotygodniowa wymiana notatek między wychowawcą a pedagogiem.';
  ipet.specialistSupportHours = [
    {
      id: `${id}-sup-1`,
      type: 'Zajęcia korekcyjno-kompensacyjne',
      period: 'cały rok szkolny',
      hoursPerWeek: 2,
      specialistName: 'mgr Piotr Specjalista',
      functionalGoal: 'Utrwalenie czytania ze zrozumieniem.',
    },
  ];
  ipet.rehabAndSpecialClasses = [
    {
      id: `${id}-reh-1`,
      category: 'REWALIDACYJNE',
      name: 'Zajęcia rewalidacyjne',
      period: 'IX 2026 – VI 2027',
      hoursPerWeek: 2,
      specialistName: 'mgr Marta Terapeutka',
      functionalGoal: 'Rozwijanie funkcji wykonawczych.',
    },
  ];
  ipet.parentCollaborationNotes = 'Comiesięczne konsultacje stacjonarne z opiekunem.';
  ipet.isCompleted = true;
  ipet.lastUpdatedAt = '2026-09-25T12:00:00.000Z';

  const opinion = createEmptyOpinionSupportDraft();
  opinion.implementedDate = '2026-09-20';
  opinion.functionalProfileSummary = 'Specyficzne trudności w czytaniu i pisaniu.';
  opinion.subjectAdaptations = [
    {
      id: `${id}-op-adapt-1`,
      subject: 'Matematyka',
      methodsAndForms: 'Czytanie treści zadań na głos przed pracą własną.',
      assessmentCriteria: 'Ocenianie toku rozumowania niezależnie od błędów zapisu.',
    },
  ];
  opinion.psychologicalPedagogicalSupport = [
    {
      id: `${id}-op-sup-1`,
      type: 'Zajęcia korekcyjno-kompensacyjne',
      period: 'I–II półrocze',
      hoursPerWeek: 1,
      specialistName: 'mgr Piotr Specjalista',
      functionalGoal: 'Poprawa poprawności ortograficznej.',
    },
  ];
  opinion.parentCollaborationNotes = 'Przekazanie zaleceń do pracy domowej.';
  opinion.isCompleted = true;

  return {
    id,
    firstName: 'Fikcyjny',
    lastName: 'Testowy',
    birthDate: '2014-05-12',
    className: '6A',
    schoolYear: '2026/2027',
    educationStage: 'KLASY_4_8',
    documentType: 'ORZECZENIE',
    pppDocument: {
      documentNumber: 'TST/PPP/2026/001',
      issueDate: '2026-08-20',
      submissionDate: '2026-09-02',
      validUntil: 'do ukończenia szkoły podstawowej',
      issuingAuthority: 'Poradnia Testowa w Miasteczku',
      reasonCategory: 'Zespół syntetyczny testowy',
      recommendationsSummary: 'Wsparcie wizualne i wydłużony czas pracy.',
    },
    teamCoordinator: 'mgr Janina Koordynator',
    teamMembers: [
      {
        id: `${id}-tm-1`,
        name: 'mgr Janina Koordynator',
        role: 'Pedagog specjalny',
        isCoordinator: true,
      },
      {
        id: `${id}-tm-2`,
        name: 'mgr Tomasz Wychowawca',
        role: 'Wychowawca klasy',
        isCoordinator: false,
      },
    ],
    status: 'AKTYWNY',
    isTestData: true,
    wopfuDraft: wopfu,
    ipetDraft: ipet,
    opinionSupportDraft: opinion,
    createdAt: '2026-09-02T09:00:00.000Z',
    updatedAt: '2026-09-25T12:00:00.000Z',
    ...overrides,
  };
}

export function makeSyntheticJournalEntry(
  id: string,
  studentId: string,
  overrides: Partial<JournalEntry> = {},
): JournalEntry {
  return {
    id,
    studentId,
    date: '2026-10-14',
    category: 'OBSERWACJA',
    authorName: 'mgr Janina Koordynator',
    authorRole: 'Pedagog specjalny',
    title: 'Praca z kartą instrukcji na lekcji',
    content: 'Uczeń wykonał wszystkie 3 etapy zadania po pokazie modelu.',
    relatedArea: 'Funkcjonowanie poznawcze i edukacyjne',
    whatWorked: 'Podział polecenia na krótkie punkty wizualne.',
    barriersObserved: 'Rozproszenie przy głośnej dyskusji w ławce obok.',
    conclusions: 'Utrzymać miejsce w pierwszym rzędzie przy oknie.',
    isTestData: true,
    createdAt: '2026-10-14T11:00:00.000Z',
    updatedAt: '2026-10-14T11:00:00.000Z',
    ...overrides,
  };
}

export function makeSyntheticAnnex(
  id: string,
  studentId: string,
  overrides: Partial<ProgramModificationAnnex> = {},
): ProgramModificationAnnex {
  return {
    id,
    studentId,
    versionNumber: 1,
    annexDate: '2027-01-20',
    schoolYear: '2026/2027',
    decisionType: 'MODYFIKACJA_IPET',
    title: 'Aneks nr 1 — dostosowanie tempa pracy',
    changedSections: ['3. Zakres dostosowania wymagań edukacyjnych'],
    changeDescription: 'Dodano możliwość udzielania odpowiedzi ustnych po sprawdzianie.',
    authorAndTeam: 'mgr Janina Koordynator, mgr Tomasz Wychowawca',
    parentNotifiedDate: '2027-01-22',
    isTestData: true,
    createdAt: '2027-01-20T10:00:00.000Z',
    updatedAt: '2027-01-20T10:00:00.000Z',
    ...overrides,
  };
}

export function makeSyntheticEvaluation(
  id: string,
  studentId: string,
  overrides: Partial<PeriodicEvaluation> = {},
): PeriodicEvaluation {
  return {
    id,
    studentId,
    schoolYear: '2026/2027',
    semester: 'I',
    periodType: 'I_POLROCZE',
    periodLabel: 'Ocena za I półrocze 2026/2027',
    evaluationDate: '2027-01-20',
    type: 'OCENA_OKRESOWA_IPET',
    teamMembers: 'mgr Janina Koordynator, mgr Tomasz Wychowawca',
    goalsReferenceNotes: 'Realizacja celów z zakresu organizacji pracy.',
    effectivenessRating: 'WYSOKA',
    progressSummary: 'Widoczna poprawa samodzielności przy pracy z checklistą.',
    modificationDecision: 'WPROWADZONO_ANEKS',
    modificationsNeeded: 'Rozszerzenie dostosowania o odpowiedzi ustne.',
    noChangeJustification: '',
    status: 'ZATWIERDZONA',
    isTestData: true,
    createdAt: '2027-01-20T10:05:00.000Z',
    updatedAt: '2027-01-20T10:05:00.000Z',
    ...overrides,
  };
}
