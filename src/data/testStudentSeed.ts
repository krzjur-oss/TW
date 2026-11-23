import type {
  JournalEntry,
  PeriodicEvaluation,
  ProgramModificationAnnex,
  StudentProfile,
} from '../types/domain';

export const TEST_STUDENT_ID = 'test-student-jan-kowalski';
export const TEST_OPINION_STUDENT_ID = 'test-student-zuzanna-wisniewska';

export function createTestStudentBundle(): {
  student: StudentProfile;
  journalEntries: JournalEntry[];
  evaluations: PeriodicEvaluation[];
  annexes: ProgramModificationAnnex[];
} {
  const now = new Date().toISOString();

  const student: StudentProfile = {
    id: TEST_STUDENT_ID,
    firstName: 'Jan',
    lastName: 'Kowalski',
    birthDate: '2015-04-12',
    className: '5B',
    schoolYear: '2026/2027',
    educationStage: 'KLASY_4_8',
    documentType: 'ORZECZENIE',
    pppDocument: {
      documentNumber: 'ORZ/PPP2/2025/148',
      issueDate: '2025-09-18',
      submissionDate: '2026-09-02',
      validUntil: '2030-08-31 (do ukończenia szkoły podstawowej)',
      issuingAuthority: 'Poradnia Psychologiczno-Pedagogiczna nr 2 w Krakowie',
      reasonCategory: 'Zespół Aspergera (spektrum autyzmu)',
      recommendationsSummary:
        'Zajęcia rewalidacyjne rozwijające kompetencje emocjonalno-społeczne (2 godz./tyg.), wydłużony czas pracy na sprawdzianach, jasne i krótkie polecenia na piśmie, uprzedzanie o zmianach w planie dnia oraz stałe miejsce w ławce z ograniczoną liczbą bodźców wzrokowych i słuchowych.',
    },
    teamCoordinator: 'mgr Anna Nowak (pedagog specjalny)',
    teamMembers: [
      {
        id: 'tm-1',
        name: 'mgr Anna Nowak',
        role: 'Pedagog specjalny',
        isCoordinator: true,
      },
      {
        id: 'tm-2',
        name: 'mgr Ewa Zielińska',
        role: 'Wychowawca klasy 5B',
      },
      {
        id: 'tm-3',
        name: 'mgr Marek Wiśniewski',
        role: 'Nauczyciel matematyki',
      },
      {
        id: 'tm-4',
        name: 'mgr Karolina Mazur',
        role: 'Psycholog szkolny',
      },
    ],
    status: 'AKTYWNY',
    isTestData: true,
    wopfuDraft: {
      lastUpdatedAt: now,
      assessmentDate: '2026-09-18',
      conditionsAndContext:
        'Uczeń mieszka z rodzicami, korzysta ze stałego wsparcia domowego przy organizacji planu tygodnia. W środowisku szkolnym funkcjonuje stabilnie w stałej sali i przy stałym miejscu w ławce w drugim rzędzie od ściany (z dala od okna). Nagłe zastępstwa i hałas powyżej 65 dB na korytarzu obniżają gotowość do podjęcia zadań.',
      functioningAreas: {
        cognitive:
          'Bardzo dobra pamięć wzrokowa i logiczno-matematyczna; utrzymuje uwagę przez 15 minut na zadaniach jednoetapowych. Przy złożonych poleceniach tekstowych wymaga podziału instrukcji na 3 krótkie kroki na karcie pracy.',
        communication:
          'Zasób słownictwa bogaty w zakresie przyrody i matematyki; metafory i komunikaty ironiczne rozumie dosłownie. Na lekcjach odpowiada merytorycznie w kontakcie indywidualnym lub po otrzymaniu 30 s czasu na sformułowanie myśli.',
        emotionalSocial:
          'W sytuacjach nieprzewidzianych pojawia się napięcie i zamykanie się w sobie; potrafi samodzielnie zapobiec eskalacji, gdy używa umówionej karty sygnałowej przerwy. Dobrze współpracuje w stałej parze z wyznaczonym zadaniem.',
        motorSensory:
          'Nadwrażliwość słuchowa na dzwonki i gwar w klasie podczas pracy własnej (wyraźna poprawa w słuchawkach wygłuszających). Tempo pisania ręcznego obniżone; dłuższe notatki przepisuje z trudem i traci wątek lekcji.',
      },
      strengths: [
        'Wysoka wiedza przyrodnicza i matematyczna oraz szybkie zapamiętywanie schematów',
        'Rzetelność i punktualność przy pracy według jasnego planu krok po kroku',
        'Dobra pamięć do faktów, dat i zależności logicznych',
      ],
      barriersAndNeeds: [
        'Przeciążenie sensoryczne podczas przerw oraz hałas przy pracy grupowej',
        'Obniżone tempo pisania ręcznego ograniczające nadążanie za notatką z tablicy',
        'Trudność w inicjowaniu współpracy rówieśniczej bez jasno przypisanej roli',
      ],
      developmentalNeedsSummary:
        '1) Wizualne porządkowanie przebiegu lekcji i uprzedzanie zmian planu. 2) Zastąpienie długiego przepisywania kartami z lukami lub wklejkami. 3) Systematyczny trening umiejętności społecznych i samoregulacji w sytuacjach trudnych.',
      isCompleted: true,
    },
    ipetDraft: {
      lastUpdatedAt: now,
      approvedDate: '2026-09-25',
      educationalAndTherapeuticGoals:
        'Cele edukacyjne: samodzielne ukończenie min. 80% zadań lekcyjnych przy instrukcji w 3 punktach; utrzymanie kompletności notatek przedmiotowych z użyciem szablonów.\nCele terapeutyczne: konsekwentne sygnalizowanie przeciążenia sensorycznego kartą przerwy przed wystąpieniem wycofania; inicjowanie i podtrzymywanie współpracy w parze zadaniowej podczas 2 wybranych lekcji w tygodniu.',
      methodsAndFormsOfWork:
        'Praca w oparciu o krótkie polecenia pisemne, wizualizacje kroków rozwiązania i karty pracy z większymi odstępami; stałe miejsce w ławce; możliwość korzystania ze słuchawek wygłuszających w trakcie pracy samodzielnej; sprawdzanie zrozumienia polecenia przed startem zadania.',
      subjectAdaptations: [
        {
          id: 'adapt-1',
          subject: 'Język polski',
          methodsAndForms:
            'Podział dłuższych wypowiedzi pisemnych na etapy z użyciem planu ramowego; wyjaśnianie związków frazeologicznych; wklejki zamiast przepisywania definicji z tablicy.',
          assessmentCriteria:
            'Ocena merytorycznej poprawności odpowiedzi bez obniżania oceny za tempo pisania i estetykę pisma; wydłużenie czasu na pracach pisemnych o 50%.',
        },
        {
          id: 'adapt-2',
          subject: 'Matematyka',
          methodsAndForms:
            'Praca z wykorzystaniem wizualizacji kroków rozwiązania; możliwość korzystania ze słuchawek wygłuszających podczas pracy samodzielnej i sprawdzianów.',
          assessmentCriteria:
            'Wydłużenie czasu pracy o 50% na pracach klasowych; punktowanie poprawnych etapów rozumowania niezależnie od drobnych błędów rachunkowych.',
        },
      ],
      integratedTeamActions:
        'Wszyscy nauczyciele uczący w klasie 5B honorują umówioną kartę przerwy (3 minuty wyciszenia przy stoliku lub wyjście z asystą) oraz przekazują informację o zapowiadanych sprawdzianach na 7 dni przed terminem. Pedagog specjalny co 2 tygodnie aktualizuje dla zespołu krótką notatkę z postępów na rewalidacji.',
      specialistSupportHours: [
        {
          id: 'sup-1',
          type: 'Zajęcia z psychologiem (wsparcie emocjonalne)',
          period: 'IX 2026 – VI 2027',
          hoursPerWeek: 1,
          specialistName: 'mgr Karolina Mazur',
          functionalGoal:
            'Utrwalenie strategii radzenia sobie ze zmianą planu lekcji i sytuacją niepowodzenia.',
        },
      ],
      rehabAndSpecialClasses: [
        {
          id: 'rehab-1',
          category: 'REWALIDACYJNE',
          name: 'Zajęcia rewalidacyjne (TUS i komunikacja społeczna)',
          hoursPerWeek: 2,
          period: 'IX 2026 – VI 2027',
          specialistName: 'mgr Anna Nowak',
          functionalGoal:
            'Rozwijanie umiejętności odczytywania intencji rozmówcy, proszenia o pomoc oraz pracy w parze.',
        },
      ],
      parentCollaborationNotes:
        'Stały kontakt co 2 tygodnie przez dziennik elektroniczny oraz indywidualne konsultacje podsumowujące w listopadzie i maju; rodzice stosują w domu analogiczny wizualny plan tygodnia.',
      isCompleted: true,
    },
    opinionSupportDraft: {
      lastUpdatedAt: null,
      implementedDate: null,
      functionalProfileSummary: '',
      subjectAdaptations: [],
      psychologicalPedagogicalSupport: [],
      parentCollaborationNotes: '',
      isCompleted: false,
    },
    createdAt: now,
    updatedAt: now,
  };

  const journalEntries: JournalEntry[] = [
    {
      id: 'test-journal-1',
      studentId: TEST_STUDENT_ID,
      date: '2026-10-14',
      category: 'OBSERWACJA',
      authorName: 'mgr Marek Wiśniewski',
      authorRole: 'Nauczyciel matematyki',
      title: 'Samodzielna praca z użyciem słuchawek wygłuszających',
      content:
        'Podczas lekcji powtórzeniowej z ułamków zwykłych uczeń pracował samodzielnie nad zestawem 6 zadań tekstowych.',
      relatedArea: 'Motoryka i sfera sensoryczna',
      whatWorked:
        'Słuchawki wygłuszające oraz instrukcja rozpisana w 3 punktach na karcie pracy pozwoliły na ukończenie wszystkich zadań bez napięcia.',
      barriersObserved:
        'Chwilowy spadek koncentracji po dzwonku na przerwę sąsiedniej klasy.',
      conclusions:
        'Utrzymać dostępność słuchawek wygłuszających na wszystkich pracach kontrolnych z matematyki.',
      isTestData: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'test-journal-2',
      studentId: TEST_STUDENT_ID,
      date: '2026-11-05',
      category: 'REWALIDACJA',
      authorName: 'mgr Anna Nowak',
      authorRole: 'Pedagog specjalny',
      title: 'Trening rozpoznawania emocji i proszenia o przerwę',
      content:
        'Przećwiczono scenki komunikacyjne dotyczące zgłaszania przeciążenia hałasem i przejścia w parze do zadania projektowego.',
      relatedArea: 'Kompetencje emocjonalno-społeczne',
      whatWorked:
        'Karta sygnałowa „Potrzebuję 3 minut wyciszenia” – Janek poprawnie zastosował umówiony gest również na kolejnej lekcji języka polskiego.',
      barriersObserved:
        'Niechęć do samodzielnego wybierania partnera w pracy grupowej bez wsparcia nauczyciela.',
      conclusions:
        'Nauczyciele przydzielają stałą parę zadaniową przed startem ćwiczeń grupowych.',
      isTestData: true,
      createdAt: now,
      updatedAt: now,
    },
  ];

  const annexId = 'test-annex-1';

  const evaluations: PeriodicEvaluation[] = [
    {
      id: 'test-eval-1',
      studentId: TEST_STUDENT_ID,
      schoolYear: '2026/2027',
      semester: 'I',
      periodType: 'I_POLROCZE',
      periodLabel: 'Ocena za I półrocze 2026/2027',
      evaluationDate: '2026-11-18',
      type: 'OCENA_OKRESOWA_IPET',
      teamMembers: 'mgr Anna Nowak, mgr Ewa Zielińska, mgr Marek Wiśniewski, mgr Karolina Mazur',
      goalsReferenceNotes:
        'Odniesiono do celów IPET: 80% ukończonych zadań z instrukcją w 3 krokach oraz stosowanie karty przerwy.',
      effectivenessRating: 'CZESCIOWA',
      progressSummary:
        'Wdrożone dostosowania (wklejki zamiast długiego przepisywania z tablicy, karta sygnałowa przerwy, słuchawki wygłuszające) wyraźnie zmniejszyły liczbę epizodów przeciążenia w trakcie lekcji. Uczeń osiąga bardzo dobre wyniki z matematyki i przyrody.',
      modificationDecision: 'WPROWADZONO_ANEKS',
      modificationsNeeded:
        'Wprowadzono wizualny harmonogram projektów grupowych z 7-dniowym wyprzedzeniem oraz stałe pary zadaniowe na języku polskim i historii.',
      noChangeJustification: '',
      linkedAnnexId: annexId,
      status: 'ZATWIERDZONA',
      isTestData: true,
      createdAt: now,
      updatedAt: now,
    },
  ];

  const annexes: ProgramModificationAnnex[] = [
    {
      id: annexId,
      studentId: TEST_STUDENT_ID,
      versionNumber: 1,
      annexDate: '2026-11-18',
      schoolYear: '2026/2027',
      evaluationId: 'test-eval-1',
      decisionType: 'MODYFIKACJA_IPET',
      title: 'Aneks nr 1 do IPET — organizacja pracy w parach i zapowiadanie projektów',
      changedSections: [
        'Metody i formy pracy',
        'Zintegrowane działania zespołu',
      ],
      changeDescription:
        'Dodano zasadę przydzielania stałej pary zadaniowej z jasno określoną rolą na języku polskim i historii oraz przekazywania planu projektów grupowych z 7-dniowym wyprzedzeniem.',
      authorAndTeam: 'Zespół klasy 5B (koordynator: mgr Anna Nowak)',
      parentNotifiedDate: '2026-11-20',
      isTestData: true,
      createdAt: now,
      updatedAt: now,
    },
  ];

  return { student, journalEntries, evaluations, annexes };
}

export function createTestOpinionStudentBundle(): {
  student: StudentProfile;
  journalEntries: JournalEntry[];
} {
  const now = new Date().toISOString();

  const student: StudentProfile = {
    id: TEST_OPINION_STUDENT_ID,
    firstName: 'Zuzanna',
    lastName: 'Wiśniewska',
    birthDate: '2013-08-21',
    className: '7A',
    schoolYear: '2026/2027',
    educationStage: 'KLASY_4_8',
    documentType: 'OPINIA',
    pppDocument: {
      documentNumber: 'OP/PPP1/2026/312',
      issueDate: '2026-09-10',
      submissionDate: '2026-09-14',
      validUntil: 'Do ukończenia szkoły podstawowej',
      issuingAuthority: 'Poradnia Psychologiczno-Pedagogiczna nr 1 w Krakowie',
      reasonCategory:
        'Specyficzne trudności w uczeniu się: dysleksja i dysortografia',
      recommendationsSummary:
        'Dostosowanie wymagań edukacyjnych z przedmiotów wymagających szybkiego czytania i poprawnego zapisu ortograficznego; wydłużenie czasu pracy na sprawdzianach; objęcie zajęciami korekcyjno-kompensacyjnymi.',
    },
    teamCoordinator: 'mgr Tomasz Kamiński (wychowawca kl. 7A)',
    teamMembers: [
      {
        id: 'otm-1',
        name: 'mgr Tomasz Kamiński',
        role: 'Wychowawca klasy 7A',
        isCoordinator: true,
      },
      {
        id: 'otm-2',
        name: 'mgr Agnieszka Dąbrowska',
        role: 'Terapeuta pedagogiczny',
      },
      {
        id: 'otm-3',
        name: 'mgr Beata Szymańska',
        role: 'Nauczyciel języka polskiego',
      },
    ],
    status: 'AKTYWNY',
    isTestData: true,
    wopfuDraft: {
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
    },
    ipetDraft: {
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
    },
    opinionSupportDraft: {
      lastUpdatedAt: now,
      implementedDate: '2026-09-21',
      functionalProfileSummary:
        'Uczennica wykazuje wysokie rozumienie zagadnień przyrodniczych i humanistycznych w wypowiedziach ustnych, przy wolnym tempie samodzielnego czytania dłuższych poleceń i licznych błędach ortograficznych pod presją czasu. Potrzebuje głośnego odczytania poleceń na początku pracy pisemnej oraz sprawdzania wiedzy w formie ustnej lub testów jednokrotnego wyboru.',
      subjectAdaptations: [
        {
          id: 'oa-1',
          subject: 'Język polski',
          methodsAndForms:
            'Udostępnianie dłuższych lektur w wersji audio; głośne przeczytanie polecenia sprawdzianu przez nauczyciela; nienarzucanie głośnego czytania nowych tekstów na forum klasy.',
          assessmentCriteria:
            'Oddzielne ocenianie warstwy merytorycznej i kompozycyjnej wypracowań od błędów ortograficznych; wydłużenie czasu pracy na sprawdzianach o 30–50%.',
        },
        {
          id: 'oa-2',
          subject: 'Język angielski',
          methodsAndForms:
            'Wprowadzanie nowego słownictwa z wykorzystaniem skojarzeń wizualnych i nagrań audio; karty pracy z wyraźną, bezszeryfową czcionką.',
          assessmentCriteria:
            'Złagodzenie kryteriów poprawności zapisu literowego słówek na korzyść poprawnego użycia komunikacyjnego i rozumienia ze słuchu.',
        },
      ],
      psychologicalPedagogicalSupport: [
        {
          id: 'os-1',
          type: 'Zajęcia korekcyjno-kompensacyjne',
          period: 'IX 2026 – VI 2027',
          hoursPerWeek: 1,
          specialistName: 'mgr Agnieszka Dąbrowska',
          functionalGoal:
            'Usprawnienie techniki czytania ze zrozumieniem oraz utrwalenie strategii autokorekty tekstu przed oddaniem sprawdzianu.',
        },
      ],
      parentCollaborationNotes:
        'Rodzice otrzymali wykaz dostosowań na platformie dziennika elektronicznego; uzgodniono wspólne korzystanie z audiobooków do lektur szkolnych oraz konsultację śródroczną w styczniu.',
      isCompleted: true,
    },
    createdAt: now,
    updatedAt: now,
  };

  const journalEntries: JournalEntry[] = [
    {
      id: 'test-opinion-journal-1',
      studentId: TEST_OPINION_STUDENT_ID,
      date: '2026-10-22',
      category: 'DOSTOSOWANIE',
      authorName: 'mgr Beata Szymańska',
      authorRole: 'Nauczyciel języka polskiego',
      title: 'Praca kontrolna z wykorzystaniem arkusza z powiększonym drukiem',
      content:
        'Sprawdzian wiadomości z lektury przeprowadzony z głośnym odczytaniem poleceń na początku lekcji.',
      relatedArea: 'Praca na lekcji / sprawdzian',
      whatWorked:
        'Arkusz z większymi odstępami i wysłuchanie lektury w wersji audio przełożyły się na bardzo dobrą ocenę merytoryczną.',
      barriersObserved:
        'W końcowej części pracy brakowało czasu na samodzielne sprawdzenie zapisu ortograficznego.',
      conclusions:
        'Przypominać o pozostawieniu ostatnich 5 minut na autokorektę według checklisty wypracowanej na terapii.',
      isTestData: true,
      createdAt: now,
      updatedAt: now,
    },
  ];

  return { student, journalEntries };
}
