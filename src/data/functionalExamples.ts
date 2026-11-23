export interface FunctionalHintItem {
  label: string;
  avoid: string;
  functionalText: string;
}

export const WOPFU_HINTS: Record<
  'conditions' | 'cognitive' | 'communication' | 'emotionalSocial' | 'motorSensory' | 'needs',
  FunctionalHintItem[]
> = {
  conditions: [
    {
      label: 'Nadwrażliwość na bodźce + stały rytm dnia',
      avoid: 'Uczeń źle reaguje na hałas i zmiany.',
      functionalText:
        'W środowisku klasy o wysokim natężeniu hałasu (przerwy, praca grupowa) pojawia się napięcie i wycofanie. Uczeń funkcjonuje stabilnie przy stałym miejscu w ławce z dala od okna/korytarza oraz po uprzedzeniu o zmianach w planie lekcji z co najmniej 1-dniowym wyprzedzeniem.',
    },
    {
      label: 'Zmęczenie poznawcze i tempo pracy',
      avoid: 'Uczeń szybko się męczy na lekcjach.',
      functionalText:
        'Po około 20 minutach ciągłego pisania lub czytania spada precyzja zapisu i rozumienie poleceń; zastosowanie krótkich przerw zadaniowych (2 min) oraz dzielenie zadań na 2–3 etapy pozwala utrzymać efektywną pracę do końca lekcji.',
    },
  ],
  cognitive: [
    {
      label: 'Podział instrukcji i schematy wzrokowe',
      avoid: 'Ma problemy z koncentracją i rozumieniem poleceń.',
      functionalText:
        'Utrzymuje uwagę przez 10–15 minut podczas zadań jednoetapowych. Przy poleceniach wieloetapowych potrzebuje zapisu instrukcji w punktach (maks. 3 kroki) lub wzrokowego schematu rozwiązania na karcie pracy.',
    },
    {
      label: 'Pamięć wzrokowa i logiczna',
      avoid: 'Dobry z matematyki, słabszy z polskiego.',
      functionalText:
        'Zapamiętuje fakty, daty i algorytmy matematyczne prezentowane graficznie. Trudność sprawia samodzielne wnioskowanie o intencjach postaci w tekstach literackich bez pytań naprowadzających.',
    },
  ],
  communication: [
    {
      label: 'Dosłowne rozumienie komunikatów',
      avoid: 'Ma trudności w komunikacji.',
      functionalText:
        'Posługuje się rozbudowanym słownictwem w tematach zainteresowań, jednak komunikaty ironiczne, metafory i polecenia podawane w formie pytań pośrednich rozumie dosłownie; wymaga jasnych, konkretnych sformułowań w trybie oznajmującym.',
    },
    {
      label: 'Wsparcie w wypowiedzi ustnej',
      avoid: 'Wstydzi się mówić przy klasie.',
      functionalText:
        'Podczas odpowiedzi przed całą klasą blokuje się i skraca wypowiedź do pojedynczych wyrazów; w rozmowie indywidualnej lub w parze udziela pełnych, merytorycznych odpowiedzi po otrzymaniu 30 sekund na przygotowanie.',
    },
  ],
  emotionalSocial: [
    {
      label: 'Regulacja napięcia i karta przerwy',
      avoid: 'Bywa impulsywny lub wycofany.',
      functionalText:
        'W sytuacjach niepowodzenia lub nagłej zmiany planu dnia reaguje napięciem i odmową wykonania zadania. Samodzielnie reguluje emocje, gdy ma możliwość skorzystania z umówionej karty sygnałowej przerwy (3 min wyciszenia w kąciku/przy stoliku).',
    },
    {
      label: 'Praca w małej grupie',
      avoid: 'Nie potrafi współpracować w grupie.',
      functionalText:
        'W zespołach 4–5-osobowych wycofuje się na margines; w stałej parze z jasno przydzieloną rolą (np. zapisujący wyniki lub odpowiedzialny za materiały) aktywnie uczestniczy w wykonaniu zadania.',
    },
  ],
  motorSensory: [
    {
      label: 'Tempo pisania i alternatywne notatki',
      avoid: 'Brzydko i wolno pisze.',
      functionalText:
        'Tempo przepisywania z tablicy jest znacznie niższe niż tempo klasy, co prowadzi do niepełnych notatek. Wykorzystanie gotowych wklejek/szkieletów notatek lub uzupełnianie luk pozwala skupić się na treści lekcji.',
    },
    {
      label: 'Ochrona przed hałasem',
      avoid: 'Przeszkadza mu hałas.',
      functionalText:
        'Dzwonki szkolne i gwar podczas pracy własnej klasy rozpraszają uwagę; zgoda na korzystanie ze słuchawek wygłuszających podczas samodzielnych ćwiczeń i sprawdzianów wyraźnie zwiększa liczbę ukończonych zadań.',
    },
  ],
  needs: [
    {
      label: 'Zestaw potrzeb funkcjonalnych (orzeczenie)',
      avoid: 'Uczeń potrzebuje pomocy i rewalidacji.',
      functionalText:
        '1) Wizualne porządkowanie czasu i przestrzeni (plan lekcji, instrukcje krok po kroku). 2) Redukcja zbędnego przepisywania na rzecz kart pracy z lukami. 3) Systematyczny trening umiejętności społecznych (rozpoznawanie sygnałów w rozmowie, proszenie o pomoc).',
    },
  ],
};

export const WOPFU_STRENGTH_SUGGESTIONS = [
  'Wysoka dokładność przy zadaniach opartych na jasnym algorytmie lub schemacie',
  'Dobra pamięć wzrokowa i szybkie zapamiętywanie materiału prezentowanego graficznie',
  'Zainteresowanie wybranym obszarem wiedzy i chęć dzielenia się faktami',
  'Punktualność, przywiązanie do ustalonych zasad i przewidywalnego porządku',
  'Dobra współpraca w kontakcie indywidualnym lub w stałej parze zadaniowej',
];

export const WOPFU_BARRIER_SUGGESTIONS = [
  'Przeciążenie sensoryczne w czasie przerw oraz przy równoczesnych rozmowach w klasie',
  'Trudność w samodzielnym rozplanowaniu wieloetapowych zadań długoterminowych',
  'Obniżone tempo pisania ręcznego powodujące zaległości przy przepisywaniu z tablicy',
  'Nasilony lęk przed ekspozycją społeczną i oceną podczas odpowiedzi ustnych na forum',
  'Trudność w elastycznym reagowaniu na nagłe zmiany zastępstw lub sali lekcyjnej',
];

export const IPET_HINTS = {
  goals: [
    {
      label: 'Cele edukacyjne i terapeutyczne (funkcjonalne)',
      avoid: 'Poprawa funkcjonowania ucznia i wyrównanie braków.',
      functionalText:
        'Cele edukacyjne: samodzielne wykonanie min. 80% zadań na karcie pracy po podziale polecenia na 3 kroki; utrzymanie kompletności notatek dzięki szablonom/wklejkom.\nCele terapeutyczne: opanowanie 2 strategii sygnalizowania przeciążenia (karta przerwy / prośba o wyjaśnienie); inicjowanie współpracy w parze przy użyciu gotowych zwrotów.',
    },
  ],
  methods: [
    {
      label: 'Metody i formy pracy na lekcji',
      avoid: 'Indywidualizacja i metody aktywizujące.',
      functionalText:
        'Praca w oparciu o krótkie instrukcje pisemne i wizualizacje (mapy myśli, tabele kroków), ograniczanie jednoczesnych bodźców słuchowych i wzrokowych, sprawdzanie zrozumienia polecenia przed rozpoczęciem pracy samodzielnej, możliwość pracy w parze o stałym składzie.',
    },
  ],
  integratedActions: [
    {
      label: 'Spójne działania nauczycieli i specjalistów',
      avoid: 'Współpraca całego zespołu.',
      functionalText:
        'Wszyscy nauczyciele przedmiotowi stosują jednolity sygnał rozpoczęcia i zakończenia etapu pracy oraz honorują kartę przerwy wypracowaną podczas rewalidacji. Pedagog specjalny co 2 tygodnie przekazuje zespołowi krótką informację o nowych strategiach komunikacyjnych ćwiczonych na zajęciach indywidualnych.',
    },
  ],
  parentCollaboration: [
    {
      label: 'Współpraca z rodzicami / opiekunami',
      avoid: 'Stały kontakt z rodzicami w razie potrzeby.',
      functionalText:
        'Bieżąca wymiana informacji przez dziennik elektroniczny (raz na 2 tygodnie), dwie zaplanowane konsultacje zespołowe w roku szkolnym (po I semestrze i przed końcem roku) z omówieniem postępów oraz przekazanie rodzicom ujednoliconego sposobu dzielenia zadań domowych na krótsze odcinki czasowe.',
    },
  ],
};

export const ADAPTATION_SUGGESTIONS: Array<{
  subject: string;
  methodsAndForms: string;
  assessmentCriteria: string;
}> = [
  {
    subject: 'Język polski',
    methodsAndForms:
      'Dzielenie dłuższych wypowiedzi pisemnych na etapy z wykorzystaniem planu ramowego; udostępnianie lektur w formie audiobooka oraz streszczeń strukturalnych; ograniczenie przepisywania z tablicy (wklejki).',
    assessmentCriteria:
      'Ocena przede wszystkim za treść merytoryczną i poprawność logiczną; błędy wynikające z dysgrafii/dysortografii lub wolnego tempa pisania nie obniżają oceny z prac merytorycznych; wydłużony czas na sprawdzianach o 50%.',
  },
  {
    subject: 'Matematyka',
    methodsAndForms:
      'Rozpisywanie zadań tekstowych na etapy na karcie pracy; stosowanie czytelnej czcionki bez zbędnych ozdobników i większych odstępów między zadaniami; możliwość użycia tabliczki mnożenia lub kalkulatora przy zadaniach problemowych (zgodnie z zaleceniem PPP).',
    assessmentCriteria:
      'Ocenianie kolejnych poprawnych kroków rozumowania nawet przy błędzie rachunkowym na końcu; wydłużony czas pracy na pracach klasowych; unikanie odpytywania pod presją czasu na forum klasy.',
  },
  {
    subject: 'Język obcy nowożytny',
    methodsAndForms:
      'Wprowadzanie nowego słownictwa w powiązaniu z obrazem i nagraniem audio; odtwarzanie nagrań ze zrozumienia ze słuchu w mniejszej grupie lub ze słuchawkami; ograniczenie liczby nowych wyrazów do opanowania w jednej partii.',
    assessmentCriteria:
      'Złagodzenie wymagań wobec poprawności zapisu ortograficznego w języku obcym na rzecz komunikatywności wypowiedzi ustnej i rozumienia tekstu; sprawdzanie wypowiedzi ustnych indywidualnie przy biurku lub w mniejszej grupie.',
  },
];

export const OPINION_HINTS = {
  profileSummary: [
    {
      label: 'Specyficzne trudności w uczeniu się (np. dysleksja / dysortografia)',
      avoid: 'Uczeń ma opinię z poradni o dysleksji.',
      functionalText:
        'Uczeń prezentuje prawidłowy poziom rozumowania i wysoką wiedzę ogólną przy wyraźnie obniżonym tempie dekodowania dłuższych tekstów oraz utrwalania zapisu ortograficznego. Najlepsze efekty osiąga przy poleceniach czytanych na głos przez nauczyciela, wydłużonym czasie pisania oraz sprawdzaniu wiedzy również w formie ustnej.',
    },
    {
      label: 'Trudności z koncentracją i organizacją pracy',
      avoid: 'Uczeń nie uważa i gubi rzeczy.',
      functionalText:
        'Uwaga ulega rozproszeniu po 10 minutach zadań monotonnych lub przy bodźcach z korytarza/okna. Stałe miejsce w pierwszej lub drugiej ławce w rzędzie środkowym, checklista kroków na rogu ławki oraz krótkie sygnały zwrotne nauczyciela pozwalają utrzymać ciągłość pracy.',
    },
  ],
  parentCollaboration: [
    {
      label: 'Ustalenia z rodzicami dla ścieżki Opinii PPP',
      avoid: 'Kontakt z rodzicami przez dziennik.',
      functionalText:
        'Przekazanie rodzicom pisemnego wykazu dostosowań stosowanych na lekcjach w ciągu 14 dni od posiedzenia zespołu; comiesięczna informacja zwrotna od wychowawcy o efektywności wdrożonych modyfikacji oraz wspólne monitorowanie czasu odrabiania prac domowych.',
    },
  ],
};

export interface DeadlineCalculation {
  targetDateLabel: string;
  ruleDescription: string;
  statusText: string;
  isUrgentOrOverdue: boolean;
}

export function calculateDocumentDeadlines(
  documentType: 'ORZECZENIE' | 'OPINIA',
  schoolYear: string,
  submissionDate?: string,
): DeadlineCalculation {
  if (documentType === 'OPINIA') {
    if (submissionDate) {
      const sub = new Date(`${submissionDate}T00:00:00`);
      if (!Number.isNaN(sub.getTime())) {
        const target = new Date(sub);
        target.setDate(target.getDate() + 14);
        const iso = target.toISOString().slice(0, 10);
        const today = new Date().toISOString().slice(0, 10);
        const overdue = today > iso;
        return {
          targetDateLabel: iso,
          ruleDescription:
            'Dostosowanie wymagań edukacyjnych wdraża się niezwłocznie po złożeniu opinii PPP (orientacyjnie do 14 dni od wpływu dokumentu).',
          statusText: overdue
            ? `Termin orientacyjny upłynął (${iso}) — sprawdź wdrożenie dostosowań.`
            : `Orientacyjny termin wdrożenia dostosowań: do ${iso}.`,
          isUrgentOrOverdue: overdue,
        };
      }
    }
    return {
      targetDateLabel: 'Niezwłocznie po złożeniu',
      ruleDescription:
        'Po złożeniu opinii PPP nauczyciele dostosowują wymagania edukacyjne niezwłocznie oraz ustalają formy pomocy psychologiczno-pedagogicznej.',
      statusText: 'Uzupełnij datę złożenia opinii w placówce, aby wyliczyć datę orientacyjną.',
      isUrgentOrOverdue: false,
    };
  }

  // Ścieżka A: ORZECZENIE
  // Przepisy MEN: do 30 września roku szkolnego lub w terminie 30 dni od dnia złożenia orzeczenia w przedszkolu/szkole.
  const startYearMatch = schoolYear.match(/^(\d{4})/);
  const startYear = startYearMatch ? Number(startYearMatch[1]) : new Date().getFullYear();
  const sept30 = `${startYear}-09-30`;

  if (submissionDate) {
    const sub = new Date(`${submissionDate}T00:00:00`);
    if (!Number.isNaN(sub.getTime())) {
      const plus30 = new Date(sub);
      plus30.setDate(plus30.getDate() + 30);
      const plus30Iso = plus30.toISOString().slice(0, 10);
      const effectiveTarget = plus30Iso > sept30 ? plus30Iso : sept30;
      const today = new Date().toISOString().slice(0, 10);
      const overdue = today > effectiveTarget;
      return {
        targetDateLabel: effectiveTarget,
        ruleDescription:
          'Zgodnie z rozporządzeniem MEN: WOPFU oraz IPET opracowuje się do 30 września danego roku szkolnego albo w ciągu 30 dni od dnia złożenia orzeczenia w placówce.',
        statusText: overdue
          ? `Termin opracowania IPET (${effectiveTarget}) już minął — zweryfikuj datę zatwierdzenia.`
          : `Orientacyjny termin opracowania WOPFU i IPET: do ${effectiveTarget}.`,
        isUrgentOrOverdue: overdue,
      };
    }
  }

  return {
    targetDateLabel: sept30,
    ruleDescription:
      'Zgodnie z rozporządzeniem MEN: opracowanie WOPFU i IPET do 30 września roku szkolnego lub w ciągu 30 dni od złożenia orzeczenia.',
    statusText: `Standardowy termin dla roku ${schoolYear}: do ${sept30} (lub +30 dni od daty złożenia orzeczenia).`,
    isUrgentOrOverdue: false,
  };
}
