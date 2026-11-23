export const APP_INFO = {
  name: 'Teczka Wsparcia',
  shortName: 'TeczkaIPET',
  version: '1.5.0',
  editionLabel: 'Local-First PWA · Offline-First',
  summary:
    'Narzędzie dla polskich nauczycieli, wychowawców, pedagogów specjalnych i specjalistów szkolnych wspierające tworzenie, aktualizowanie i bezpieczne archiwizowanie dokumentacji pomocy psychologiczno-pedagogicznej oraz kształcenia specjalnego.',
  architectureNote:
    'Program działa w 100% lokalnie w przeglądarce użytkownika (baza IndexedDB) bez zewnętrznego serwera i chmury. Może zostać zainstalowany jako aplikacja PWA na komputerze lub tablecie i pracować bez dostępu do internetu.',
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
      'Lokalny generator PDF (z pełną obsługą polskich znaków i kontrolą łamania tabel) oraz podgląd wydruku A4 obejmują trzy warianty: dokument IPET / dostosowań, arkusz oceny okresowej oraz kartę obserwacji z miejscem na podpisy zespołu i rodzica.',
  },
  {
    title: 'Ochrona danych wrażliwych (RODO)',
    description:
      'Eksport i import zaszyfrowanych teczek .ipet oraz pełnej bazy danych (Web Crypto API: PBKDF2-SHA256 + AES-GCM 256-bit), a także opcjonalna lokalna blokada ekranu kodem PIN lub hasłem chronią dokumentację przed nieuprawnionym dostępem.',
  },
];

export interface LegalActReference {
  id: string;
  category: string;
  shortTitle: string;
  fullTitle: string;
  publicationRef: string;
  keyProvisions: string[];
  applicationMapping: string;
}

export const POLISH_LEGAL_FRAMEWORK: LegalActReference[] = [
  {
    id: 'prawo-oswiatowe',
    category: 'Ustawa ustrojowa',
    shortTitle: 'Ustawa – Prawo oświatowe',
    fullTitle: 'Ustawa z dnia 14 grudnia 2016 r. – Prawo oświatowe',
    publicationRef: 't.j. Dz.U. z 2024 r. poz. 737, z późn. zm.',
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
    publicationRef: 't.j. Dz.U. z 2023 r. poz. 2572, z późn. zm.',
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
    keyProvisions: [
      'Art. 9 RODO: dane zawarte w orzeczeniach i opiniach PPP oraz dokumentacji WOPFU/IPET mogą stanowić szczególne kategorie danych osobowych (dane dotyczące zdrowia) wymagające podwyższonej ochrony.',
      'Art. 25 i art. 32 RODO: ochrona danych w fazie projektowania (privacy by design) oraz stosowanie odpowiednich środków technicznych i organizacyjnych, w tym szyfrowania danych i kontroli dostępu.',
    ],
    applicationMapping:
      'Realizowane przez architekturę 100% Local-First (brak przesyłania danych na zewnętrzne serwery), szyfrowanie plików .ipet i kopii zapasowych algorytmem AES-GCM 256-bit (PBKDF2), opcjonalną lokalną blokadę PIN/hasłem oraz wyraźny tryb DANE TESTOWE.',
  },
];
