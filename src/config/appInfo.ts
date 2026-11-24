export const LEGAL_FRAMEWORK_AS_OF_ISO = '2026-11-23';
export const LEGAL_FRAMEWORK_AS_OF_PL = '23 listopada 2026 r.';

export const APP_INFO = {
  name: 'Teczka Wsparcia',
  shortName: 'TeczkaIPET',
  version: '1.6.1',
  editionLabel: 'Local-First PWA · Offline-First',
  legalStateDateIso: LEGAL_FRAMEWORK_AS_OF_ISO,
  legalStateDateLabel: LEGAL_FRAMEWORK_AS_OF_PL,
  summary:
    'Narzędzie dla polskich nauczycieli, wychowawców, pedagogów specjalnych i specjalistów szkolnych wspierające tworzenie, aktualizowanie i bezpieczne archiwizowanie dokumentacji pomocy psychologiczno-pedagogicznej oraz kształcenia specjalnego.',
  architectureNote:
    'Program działa w 100% lokalnie w przeglądarce użytkownika (baza IndexedDB) bez zewnętrznego serwera, chmury i wywołań zewnętrznych CDN. Fonty interfejsu oraz PDF są wbudowane lokalnie (offline), dzięki czemu aplikacja działa bez internetu już od pierwszego uruchomienia po instalacji PWA.',
} as const;

export interface ProgramFeatureSummary {
  title: string;
  description: string;
}

export const PROGRAM_FEATURES: ProgramFeatureSummary[] = [
  {
    title: 'Rozdzielenie ścieżek Orzeczenie i Opinia PPP',
    description:
      'Ścieżka A (orzeczenie o potrzebie kształcenia specjalnego) prowadzi od składu zespołu i terminów ustawowych przez WOPFU do 7-sekcyjnego IPET. Ścieżka B (opinia PPP) skupia się na profilu funkcjonalnym, dostosowaniu wymagań przedmiotowych i formach pomocy PPP bez wymuszania pełnego IPET.',
  },
  {
    title: 'Język funkcjonalny i ciągłość pracy',
    description:
      'Wbudowane podpowiedzi sformułowań funkcjonalnych pomagają opisywać konkretne warunki pracy, bodźce i kryteria zamiast ogólników. Dziennik obserwacji, oceny okresowe (min. 2 razy w roku) oraz wersjonowane aneksy dokumentują ciągłość wsparcia.',
  },
  {
    title: 'Wydruk A4 i generowanie dokumentów PDF',
    description:
      'Lokalny generator PDF (z wbudowanym zestawem fontów obsługujących polskie znaki i kontrolą łamania tabel) oraz podgląd wydruku A4 obejmują trzy warianty: dokument IPET / dostosowań, arkusz oceny okresowej oraz kartę obserwacji z miejscem na podpisy zespołu i rodzica.',
  },
  {
    title: 'Ochrona danych wrażliwych (RODO)',
    description:
      'Szyfrowany eksport i pełny backup w formacie .ipet (Web Crypto API: PBKDF2-SHA256 + AES-GCM 256-bit) oraz opcjonalna blokada ekranu interfejsu (UI) z czasowym limitem prób. Baza IndexedDB nie jest obecnie szyfrowana w spoczynku — przy danych rzeczywistych wymagane jest szyfrowanie dysku urządzenia i chronione konto systemowe.',
  },
];

export interface ChangelogEntry {
  version: string;
  dateLabel: string;
  title: string;
  summary: string;
  highlights: string[];
}

export const APP_CHANGELOG: ChangelogEntry[] = [
  {
    version: '1.6.1',
    dateLabel: '23 listopada 2026 r.',
    title: 'Licencja edukacyjna (WLDE) oraz obowiązkowa akceptacja regulaminu przed uruchomieniem',
    summary:
      'Dostosowanie Wolnej Licencji Domowo-Edukacyjnej (WLDE) i Regulaminu z Polityką Prywatności do programu oraz wdrożenie ekranu obowiązkowego zapoznania się i akceptacji przed pierwszym uruchomieniem.',
    highlights: [
      'Dodano dostosowane dokumenty LICENSE.md i REGULAMIN.md dla darmowego użytku edukacyjnego w placówkach oświatowych oraz dla nauczycieli, pedagogów i specjalistów szkolnych.',
      'Wdrożono obowiązkowy ekran przeczytania i akceptacji Regulaminu oraz Licencji WLDE przed pierwszym uruchomieniem aplikacji (z zapisem wyłącznie lokalnie).',
      'Udostępniono pełny podgląd Licencji WLDE, Regulaminu oraz statusu akceptacji w zakładce „O programie i prawo”, a także interaktywną historię zmian (2 najnowsze wpisy rozwinięte domyślnie).',
    ],
  },
  {
    version: '1.6.0',
    dateLabel: '23 listopada 2026 r.',
    title: 'Bezpieczeństwo importu, kontrolowane aktualizacje PWA, fonty offline i stan prawny',
    summary:
      'Wydanie stabilizujące obejmujące ochronę integralności bazy przy imporcie, lokalne fonty offline oraz aktualizację podstaw prawnych.',
    highlights: [
      'Naprawiono ryzyko kolizji identyfikatorów przy imporcie pojedynczego ucznia (.ipet) z przepinaniem relacji ocena–aneks i wyborem polityki duplikatów.',
      'Dodano analizę konfliktów i wyraźne potwierdzenie przed pełnym odtworzeniem kopii zapasowej (MERGE / REPLACE) przy zachowaniu lokalnej blokady urządzenia docelowego.',
      'Wprowadzono pełną walidację danych importowanych przed zapisem do IndexedDB, trwały limiter błędnych prób odblokowania UI oraz jasne komunikaty o zakresie ochrony RODO.',
      'Zmieniono aktualizacje PWA na kontrolowany komunikat użytkownika z ochroną niezapisanych formularzy oraz osadzono lokalne fonty (działanie offline bez Google Fonts).',
      'Zaktualizowano zestawienie aktów prawnych na podstawie ELI z jawnym oznaczeniem stanu prawnego i dodano pakiet testów automatycznych.',
    ],
  },
  {
    version: '1.5.0',
    dateLabel: 'Etap 6',
    title: 'Metryka programu, przepisy prawa polskiego oraz wsparcie GitHub Pages',
    summary:
      'Dodanie informacji o wersji i podstawie prawnej oraz dostosowanie routingu i ścieżek PWA do hostingu statycznego.',
    highlights: [
      'Utworzono zakładkę „O programie i prawo” z opisem modułów oraz odwołaniami do polskich ustaw i rozporządzeń oświatowych.',
      'Skonfigurowano HashRouter, względne ścieżki zasobów (base: "./") oraz automatyczne wdrażanie na GitHub Pages bez błędów 404 przy odświeżaniu.',
    ],
  },
  {
    version: '1.4.0',
    dateLabel: 'Etap 5',
    title: 'Szyfrowany eksport/import (.ipet), pełny backup i blokada ekranu',
    summary:
      'Narzędzia lokalnej ochrony danych wrażliwych i bezpiecznego przenoszenia dokumentacji między urządzeniami.',
    highlights: [
      'Dodano szyfrowany eksport i import pojedynczego ucznia do pliku .ipet (Web Crypto API: PBKDF2-SHA256 + AES-GCM 256-bit) z generatorem haseł.',
      'Dodano szyfrowany eksport i odtwarzanie całej bazy IndexedDB w ustawieniach placówki.',
      'Wprowadzono opcjonalną blokadę interfejsu PIN-em lub hasłem haszowanym lokalnie z przyciskiem szybkiego zablokowania.',
    ],
  },
  {
    version: '1.3.0',
    dateLabel: 'Etap 4',
    title: 'Eksport dokumentów do PDF i podgląd wydruku A4',
    summary:
      'Generowanie sformalizowanej dokumentacji gotowej do akt szkolnych i przekazania rodzicom.',
    highlights: [
      'Dodano eksport do PDF z pełną obsługą polskich znaków diakrytycznych i kontrolą łamania tabel między stronami.',
      'Udostępniono trzy warianty wydruku: dokument IPET / dostosowań, arkusz oceny okresowej oraz kartę obserwacji.',
      'Dodano nagłówek placówki, miejsce na podpisy członków zespołu oraz rubrykę potwierdzenia odbioru kopii przez rodzica lub opiekuna.',
    ],
  },
  {
    version: '1.2.0',
    dateLabel: 'Etap 3',
    title: 'Dziennik obserwacji, okresowe oceny efektywności i aneksy',
    summary:
      'Moduły dokumentujące ciągłość pracy zespołu w trakcie roku szkolnego.',
    highlights: [
      'Dodano datowany dziennik obserwacji i postępów z filtrowaniem po obszarze funkcjonowania i wyszukiwaniem w notatkach.',
      'Wdrożono moduł okresowych ocen efektywności (cykl co najmniej 2 razy w roku) wraz z rejestrem modyfikacji IPET i aneksów.',
    ],
  },
  {
    version: '1.1.0',
    dateLabel: 'Etap 2',
    title: 'Kreator dokumentacji: rozdzielenie Orzeczenia i Opinii PPP',
    summary:
      'Dedykowane ścieżki dokumentacji wsparcia z podpowiedziami w języku funkcjonalnym.',
    highlights: [
      'Ścieżka A (Orzeczenie): pełny przepływ od składu zespołu i terminów ustawowych przez WOPFU do 7-sekcyjnego IPET.',
      'Ścieżka B (Opinia PPP): karta profilu funkcjonalnego, dostosowań wymagań i form pomocy PPP bez wymuszania pełnego IPET.',
      'Wbudowane przykłady sformułowań funkcjonalnych oraz wskaźnik terminów (30 września / 30 dni).',
    ],
  },
  {
    version: '1.0.0',
    dateLabel: 'Etap 1',
    title: 'Fundament Local-First PWA i kartoteka uczniów w IndexedDB',
    summary:
      'Pierwsza wersja robocza działająca w całości lokalnie w przeglądarce bez zewnętrznego serwera.',
    highlights: [
      'Konfiguracja PWA (manifest i tryb offline) oraz lokalna warstwa danych oparta na IndexedDB (Dexie).',
      'Lista uczniów z wyszukiwaniem, filtrowaniem (klasa, rok szkolny, Orzeczenie/Opinia), formularzem danych PPP, motywem jasnym/ciemnym i przełącznikiem DANE TESTOWE.',
    ],
  },
];

export interface LegalActReference {
  id: string;
  category: string;
  shortTitle: string;
  fullTitle: string;
  publicationRef: string;
  eliIdentifier: string;
  eliUrl: string;
  verificationNote: string;
  keyProvisions: string[];
  applicationMapping: string;
}

export const POLISH_LEGAL_FRAMEWORK: LegalActReference[] = [
  {
    id: 'prawo-oswiatowe',
    category: 'Ustawa ustrojowa',
    shortTitle: 'Ustawa – Prawo oświatowe',
    fullTitle: 'Ustawa z dnia 14 grudnia 2016 r. – Prawo oświatowe',
    publicationRef:
      't.j. Dz.U. z 2026 r. poz. 820 (zastąpił t.j. Dz.U. z 2025 r. poz. 1043), z późn. zm.',
    eliIdentifier: 'DU/2026/820',
    eliUrl: 'https://eli.gov.pl/eli/DU/2026/820/ogl',
    verificationNote:
      'Zweryfikowano w ELI: Obwieszczenie Marszałka Sejmu RP z dnia 12 czerwca 2026 r. (tekst jednolity Dz.U. z 2026 r. poz. 820, który zastąpił wcześniejszy tekst jednolity Dz.U. z 2025 r. poz. 1043).',
    keyProvisions: [
      'Art. 1 pkt 5–7: zapewnienie dostosowania treści, metod i organizacji nauczania do możliwości psychofizycznych uczniów oraz możliwości korzystania z pomocy psychologiczno-pedagogicznej i specjalnych form pracy dydaktycznej.',
      'Art. 127 ust. 1–3: organizacja kształcenia specjalnego dla dzieci i młodzieży niepełnosprawnych, niedostosowanych społecznie i zagrożonych niedostosowaniem społecznym na podstawie orzeczenia PPP.',
    ],
    applicationMapping:
      'Stanowi ogólną podstawę rozdziału na kształcenie specjalne (orzeczenie) oraz wsparcie w ramach pomocy psychologiczno-pedagogicznej.',
  },
  {
    id: 'rozp-ksztalcenie-specjalne',
    category: 'Kształcenie specjalne (WOPFU i IPET)',
    shortTitle:
      'Rozporządzenie MEN w sprawie warunków organizowania kształcenia specjalnego',
    fullTitle:
      'Rozporządzenie Ministra Edukacji Narodowej z dnia 9 sierpnia 2017 r. w sprawie warunków organizowania kształcenia, wychowania i opieki dla dzieci i młodzieży niepełnosprawnych, niedostosowanych społecznie i zagrożonych niedostosowaniem społecznym',
    publicationRef: 't.j. Dz.U. z 2020 r. poz. 1309, z późn. zm.',
    eliIdentifier: 'DU/2020/1309',
    eliUrl: 'https://eli.gov.pl/eli/DU/2020/1309/ogl',
    verificationNote:
      'Zweryfikowano w ELI: tekst jednolity Dz.U. z 2020 r. poz. 1309 pozostaje aktualnym tekstem jednolitym rozporządzenia.',
    keyProvisions: [
      '§ 5 i § 6 ust. 1–4: powołanie zespołu nauczycieli i specjalistów, przeprowadzenie Wielospecjalistycznej Oceny Poziomu Funkcjonowania Ucznia (WOPFU) oraz opracowanie Indywidualnego Programu Edukacyjno-Terapeutycznego (IPET) zawierającego cele, metody, dostosowania, zintegrowane działania, formy pomocy PPP, zajęcia rewalidacyjne/socjoterapeutyczne i współpracę z rodzicami.',
      '§ 6 ust. 5: terminy opracowania IPET – do dnia 30 września roku szkolnego (lub do 30 września roku, w którym dziecko rozpoczyna wychowanie przedszkolne/szkołę) albo w terminie 30 dni od dnia złożenia orzeczenia w placówce.',
      '§ 6 ust. 9–12: dokonywanie wielospecjalistycznej oceny poziomu funkcjonowania ucznia co najmniej dwa razy w roku szkolnym, modyfikacja programu w miarę potrzeb oraz obowiązek przekazania rodzicom kopii IPET i oceny okresowej.',
    ],
    applicationMapping:
      'Odwzorowane bezpośrednio w Ścieżce A: wskaźnik terminów (30 września / 30 dni), formularz WOPFU, 7 obowiązkowych sekcji IPET, moduł co najmniej 2 ocen okresowych z historią aneksów oraz rubryka potwierdzenia odbioru kopii przez rodzica na wydrukach PDF/A4.',
  },
  {
    id: 'rozp-pomoc-ppp',
    category: 'Pomoc psychologiczno-pedagogiczna (Opinie PPP)',
    shortTitle:
      'Rozporządzenie MEN w sprawie zasad organizacji i udzielania pomocy psychologiczno-pedagogicznej',
    fullTitle:
      'Rozporządzenie Ministra Edukacji Narodowej z dnia 9 sierpnia 2017 r. w sprawie zasad organizacji i udzielania pomocy psychologiczno-pedagogicznej w publicznych przedszkolach, szkołach i placówkach',
    publicationRef: 't.j. Dz.U. z 2023 r. poz. 1798',
    eliIdentifier: 'DU/2023/1798',
    eliUrl: 'https://eli.gov.pl/eli/DU/2023/1798/ogl',
    verificationNote:
      'Zweryfikowano w ELI: tekst jednolity Dz.U. z 2023 r. poz. 1798.',
    keyProvisions: [
      '§ 2 i § 4–6: rozpoznawanie indywidualnych potrzeb rozwojowych i edukacyjnych oraz możliwości psychofizycznych uczniów, w tym na podstawie opinii poradni psychologiczno-pedagogicznej.',
      '§ 6–19: planowanie i prowadzenie form pomocy PPP w szkole (m.in. zajęcia korekcyjno-kompensacyjne, dydaktyczno-wyrównawcze, logopedyczne, rozwijające kompetencje emocjonalno-społeczne) oraz określanie ich okresu i wymiaru godzinowego.',
      '§ 20–24: ocena efektywności udzielanej pomocy psychologiczno-pedagogicznej, formułowanie wniosków dotyczących dalszych działań oraz bieżąca współpraca z rodzicami ucznia.',
    ],
    applicationMapping:
      'Odwzorowane w Ścieżce B (karta dostosowań i form pomocy PPP bez wymuszania pełnego IPET), w tabeli form i godzin pomocy PPP, w dzienniku obserwacji oraz w okresowych ocenach efektywności wsparcia.',
  },
  {
    id: 'ocenianie-dostosowanie',
    category: 'Ocenianie i dostosowanie wymagań',
    shortTitle:
      'Rozporządzenie MEN w sprawie oceniania, klasyfikowania i promowania uczniów',
    fullTitle:
      'Rozporządzenie Ministra Edukacji Narodowej z dnia 22 lutego 2019 r. w sprawie oceniania, klasyfikowania i promowania uczniów i słuchaczy w szkołach publicznych (oraz art. 44c–44d ustawy z dnia 7 września 1991 r. o systemie oświaty)',
    publicationRef:
      't.j. Dz.U. z 2023 r. poz. 2572, z późn. zm. (m.in. Dz.U. z 2025 r. poz. 778)',
    eliIdentifier: 'DU/2023/2572',
    eliUrl: 'https://eli.gov.pl/eli/DU/2023/2572/ogl',
    verificationNote:
      'Zweryfikowano w ELI: tekst jednolity Dz.U. z 2023 r. poz. 2572 z uwzględnieniem późniejszych nowelizacji (m.in. Dz.U. z 2025 r. poz. 778).',
    keyProvisions: [
      '§ 2 i § 3: obowiązek indywidualizowania pracy z uczniem oraz dostosowania wymagań edukacyjnych wynikających z programu nauczania do indywidualnych potrzeb rozwojowych i edukacyjnych oraz możliwości psychofizycznych ucznia, m.in. posiadającego orzeczenie o potrzebie kształcenia specjalnego albo opinię poradni psychologiczno-pedagogicznej (w tym opinię o specyficznych trudnościach w uczeniu się).',
    ],
    applicationMapping:
      'Stanowi podstawę tabel przedmiotowych dostosowań wymagań edukacyjnych oraz kryteriów oceniania zarówno w ścieżce IPET, jak i w ścieżce Opinii PPP.',
  },
  {
    id: 'dokumentacja-przebiegu-nauczania',
    category: 'Dokumentacja szkolna',
    shortTitle: 'Rozporządzenie MEN w sprawie sposobu prowadzenia dokumentacji',
    fullTitle:
      'Rozporządzenie Ministra Edukacji Narodowej z dnia 25 sierpnia 2017 r. w sprawie sposobu prowadzenia przez publiczne przedszkola, szkoły i placówki dokumentacji przebiegu nauczania, działalności wychowawczej i opiekuńczej oraz rodzajów tej dokumentacji',
    publicationRef: 't.j. Dz.U. z 2024 r. poz. 50',
    eliIdentifier: 'DU/2024/50',
    eliUrl: 'https://eli.gov.pl/eli/DU/2024/50/ogl',
    verificationNote:
      'Zweryfikowano w ELI: tekst jednolity Dz.U. z 2024 r. poz. 50.',
    keyProvisions: [
      '§ 19 ust. 1–2: obowiązek gromadzenia przez szkołę dokumentacji indywidualnych programów edukacyjno-terapeutycznych, orzeczeń i opinii poradni oraz protokołów/notatek z działań zespołu wspierającego.',
      '§ 11 i § 18: dokumentowanie zajęć specjalistycznych, rewalidacyjnych oraz indywidualnych obserwacji wspierających proces edukacyjny.',
    ],
    applicationMapping:
      'Wspiera uporządkowane gromadzenie teczki ucznia, datowanych wpisów w dzienniku obserwacji, aneksów oraz generowanie sformalizowanych wydruków do akt szkolnych.',
  },
  {
    id: 'rodo-ochrona-danych',
    category: 'Ochrona danych osobowych (RODO)',
    shortTitle: 'RODO oraz Ustawa o ochronie danych osobowych',
    fullTitle:
      'Rozporządzenie Parlamentu Europejskiego i Rady (UE) 2016/679 z dnia 27 kwietnia 2016 r. (RODO) oraz Ustawa z dnia 10 maja 2018 r. o ochronie danych osobowych',
    publicationRef: 'Dz.Urz. UE L 119 z 04.05.2016; t.j. Dz.U. z 2019 r. poz. 1781',
    eliIdentifier: 'DU/2019/1781',
    eliUrl: 'https://eli.gov.pl/eli/DU/2019/1781/ogl',
    verificationNote:
      'Zweryfikowano w ELI i EUR-Lex: RODO (UE) 2016/679 oraz ustawa krajowa t.j. Dz.U. z 2019 r. poz. 1781.',
    keyProvisions: [
      'Art. 9 RODO: dane zawarte w orzeczeniach i opiniach PPP oraz dokumentacji WOPFU/IPET mogą stanowić szczególne kategorie danych osobowych (dane dotyczące zdrowia) wymagające podwyższonej ochrony.',
      'Art. 25 i art. 32 RODO: ochrona danych w fazie projektowania (privacy by design) oraz stosowanie odpowiednich środków technicznych i organizacyjnych, w tym szyfrowania danych i kontroli dostępu.',
    ],
    applicationMapping:
      'Realizowane przez architekturę 100% Local-First (brak serwerów zewnętrznych), kryptograficzne szyfrowanie eksportowanych plików .ipet i backupów (AES-GCM 256-bit, PBKDF2), wyraźny tryb DANE TESTOWE oraz opcjonalną blokadę interfejsu (UI) z limitem prób. Ponieważ sama baza IndexedDB przeglądarki nie jest obecnie szyfrowana w spoczynku, bezpieczeństwo na stanowisku wymaga także szyfrowania dysku i ochrony konta w systemie operacyjnym.',
  },
];
