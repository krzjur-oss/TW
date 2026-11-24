export interface LegalDocumentSection {
  id: string;
  heading: string;
  paragraphs: string[];
  bullets?: string[];
  note?: string;
}

export const LICENSE_META = {
  title: 'Licencja użytkowania oprogramowania',
  subtitle: 'Wolna Licencja Domowo-Edukacyjna (Zastrzeżona) — WLDE',
  projectLabel: 'Teczka Wsparcia (wersja 1.6.2 i wyższe)',
  author: 'mgr Krzysztof Jureczek',
  copyright: 'Copyright © 2026 Krzysztof Jureczek. Wszelkie prawa zastrzeżone.',
  contactEmail: 'kjureczek@proton.me',
  githubUrl: 'https://github.com/krzjur-oss',
  githubLabel: 'github.com/krzjur-oss',
  preparedDateLabel: 'listopad 2026 r.',
  preamble:
    'Niniejsza licencja ma na celu zabezpieczenie niekomercyjnego charakteru projektu „Teczka Wsparcia”. Intencją Autora jest bezpłatne udostępnienie aplikacji do użytku edukacyjnego w placówkach oświatowych, dla nauczycieli, pedagogów i specjalistów szkolnych oraz do użytku domowego (prywatnego), przy jednoczesnym pełnym zachowaniu praw autorskich, integralności kodu źródłowego oraz zakazie jakiejkolwiek komercjalizacji, kopiowania, modyfikacji i rozpowszechniania Oprogramowania bez pisemnej zgody Autora.',
} as const;

export const LICENSE_SECTIONS: LegalDocumentSection[] = [
  {
    id: 'lic-1',
    heading: '§ 1. Definicje',
    paragraphs: [],
    bullets: [
      'Oprogramowanie – aplikacja „Teczka Wsparcia” (PWA) wraz z całym kodem źródłowym, plikami wykonywalnymi i statycznymi, grafiką, lokalnymi fontami, szablonami wydruków PDF oraz dokumentacją.',
      'Autor / Licencjodawca – mgr Krzysztof Jureczek, jedyny twórca i wyłączny dysponent autorskich praw majątkowych i osobistych do Oprogramowania.',
      'Użytkownik / Licencjobiorca – nauczyciel, wychowawca, pedagog, pedagog specjalny, psycholog, logopeda, terapeuta lub inny pracownik oświaty, każda szkoła, przedszkole, poradnia, uczelnia lub inna placówka oświatowo-wychowawcza korzystająca z Oprogramowania w celach edukacyjnych i wsparcia ucznia, a także osoba fizyczna korzystająca z Oprogramowania w celach domowych/prywatnych.',
    ],
  },
  {
    id: 'lic-2',
    heading: '§ 2. Dozwolony użytek (bezpłatny)',
    paragraphs: [
      'Autor udziela Użytkownikowi bezpłatnej, niewyłącznej, nieprzenoszalnej i ograniczonej licencji na korzystanie z Oprogramowania wyłącznie w następujących celach:',
    ],
    bullets: [
      'Użytek edukacyjny i praca nauczycieli oraz pedagogów – bezpłatne wykorzystanie Oprogramowania w placówkach oświatowych (przedszkola, szkoły podstawowe i ponadpodstawowe, szkoły i ośrodki specjalne, uczelnie wyższe, poradnie, świetlice, placówki opiekuńczo-wychowawcze i terapeutyczne) oraz przez nauczycieli, pedagogów i specjalistów szkolnych w pracy dydaktycznej, wychowawczej, terapeutycznej i przy dokumentowaniu pomocy psychologiczno-pedagogicznej oraz kształcenia specjalnego.',
      'Użytek domowy / prywatny – instalowanie i uruchamianie Oprogramowania przez osoby fizyczne na własny, niekomercyjny użytek, w tym w celach samokształceniowych i testowych.',
      'Instalacja lokalna i tryb offline (PWA) – uruchamianie i przechowywanie Oprogramowania (w tym offline/PWA) na urządzeniach własnych Użytkownika lub placówki edukacyjnej.',
      'Prezentacje niekomercyjne – publiczne demonstrowanie działania Oprogramowania w celach szkoleniowych, metodycznych oraz popularyzacji nauki i technologii, pod warunkiem wskazania autorstwa.',
      'Własność dokumentacji użytkownika – zakazy z § 3 dotyczą samego Oprogramowania; wygenerowane dokumenty PDF oraz archiwa .ipet z danymi wpisanymi przez Użytkownika pozostają w pełnej dyspozycji Użytkownika i placówki.',
    ],
  },
  {
    id: 'lic-3',
    heading: '§ 3. Zakazy i ograniczenia',
    paragraphs: [
      'Wszelkie działania wykraczające poza § 2 wymagają uprzedniej, pisemnej zgody Autora. W szczególności surowo zabrania się:',
    ],
    bullets: [
      'Kopiowania kodu – kopiowania, powielania, pobierania w celu redystrybucji, dekompilacji lub inżynierii wstecznej kodu źródłowego lub skompilowanych plików Oprogramowania.',
      'Modyfikacji – wprowadzania jakichkolwiek zmian w kodzie źródłowym, interfejsie, grafice, logotypach, treściach lub innych zasobach Oprogramowania.',
      'Rozpowszechniania – dystrybuowania, udostępniania, sublicencjonowania, wynajmu, publikowania kopii lub „forków” Oprogramowania osobom trzecim (m.in. przez GitHub, GitLab, sklepy z aplikacjami lub inne serwery).',
      'Sprzedaży i komercjalizacji – sprzedaży, pobierania jakichkolwiek opłat za dostęp, instalację lub użytkowanie Oprogramowania, umieszczania go w płatnych pakietach, za bramkami płatniczymi, w serwisach z reklamami czerpiącymi zysk z ruchu użytkowników ani świadczenia za jego pomocą odpłatnych usług komercyjnych.',
      'Usuwania oznaczeń autorskich – usuwania, ukrywania lub modyfikowania informacji o Autorze, prawach autorskich, logotypach oraz odnośników do niniejszej licencji i regulaminu.',
    ],
  },
  {
    id: 'lic-4',
    heading: '§ 4. Własność intelektualna i integralność',
    paragraphs: [],
    bullets: [
      'Oprogramowanie oraz wszelkie związane z nim prawa autorskie i prawa własności intelektualnej stanowią wyłączną własność Autora.',
      'Niniejsza licencja nie przenosi na Użytkownika żadnych praw własności do Oprogramowania — udziela wyłącznie prawa do bezpłatnego korzystania zgodnie z § 2.',
      'Użytkownik zobowiązuje się zachować w niezmienionym stanie wszystkie oznaczenia praw autorskich i informacje o Autorze zawarte w Oprogramowaniu.',
    ],
  },
  {
    id: 'lic-5',
    heading: '§ 5. Wyłączenie odpowiedzialności (AS IS)',
    paragraphs: [],
    bullets: [
      'Oprogramowanie dostarczane jest w stanie, w jakim się znajduje („AS IS”), bez jakichkolwiek gwarancji, wyraźnych lub dorozumianych, w tym gwarancji przydatności do określonego celu czy nieprzerwanego, bezbłędnego działania.',
      'Aplikacja ma charakter pomocniczego narzędzia wspierającego i nie zastępuje decyzji zespołu nauczycieli i specjalistów, dyrektora szkoły ani analizy obowiązujących przepisów prawa.',
      'Autor nie ponosi odpowiedzialności za jakiekolwiek szkody bezpośrednie, pośrednie lub następcze wynikłe z użytkowania lub niemożności użytkowania Oprogramowania, w tym utratę danych.',
    ],
  },
  {
    id: 'lic-6',
    heading: '§ 6. Rozwiązanie licencji',
    paragraphs: [
      'Naruszenie któregokolwiek z warunków niniejszej licencji skutkuje jej natychmiastowym i automatycznym wygaśnięciem. Użytkownik zobowiązany jest wówczas do trwałego usunięcia wszystkich kopii Oprogramowania ze swoich nośników i systemów.',
    ],
  },
  {
    id: 'lic-7',
    heading: '§ 7. Postanowienia końcowe',
    paragraphs: [
      'W sprawach nieuregulowanych niniejszą licencją zastosowanie mają przepisy ustawy z dnia 4 lutego 1994 r. o prawie autorskim i prawach pokrewnych oraz Kodeksu cywilnego RP. Wszelkie spory rozstrzyga sąd właściwy dla siedziby Licencjodawcy.',
    ],
  },
];

export const TERMS_META = {
  title: 'Regulamin i Polityka Prywatności aplikacji „Teczka Wsparcia”',
  versionLabel: 'Wersja 1.6.2 · obowiązuje od 24 listopada 2026 r.',
  appUrlLabel: 'https://krzjur-oss.github.io/TW/ (oraz lokalna aplikacja PWA)',
  author: 'mgr Krzysztof Jureczek',
  contactEmail: 'kjureczek@proton.me',
  githubLabel: 'github.com/krzjur-oss',
  copyright: '© 2026 Krzysztof Jureczek · Wszelkie prawa zastrzeżone',
} as const;

export const TERMS_SECTIONS: LegalDocumentSection[] = [
  {
    id: 'reg-1',
    heading: '§ 1. Postanowienia ogólne',
    paragraphs: [],
    bullets: [
      'Niniejszy Regulamin określa zasady korzystania z aplikacji webowej PWA „Teczka Wsparcia” (dalej: „Aplikacja”), dostępnej pod adresem https://krzjur-oss.github.io/TW/ lub uruchamianej lokalnie jako aplikacja PWA.',
      'Właścicielem, twórcą i jedynym autorem Aplikacji jest mgr Krzysztof Jureczek (dalej: „Autor”).',
      'Aplikacja dystrybuowana jest na warunkach Wolnej Licencji Domowo-Edukacyjnej (Zastrzeżonej) — WLDE. Regulamin i Licencja stanowią całość i obowiązują łącznie.',
      'Korzystanie z Aplikacji wymaga uprzedniego przeczytania oraz wyraźnej akceptacji niniejszego Regulaminu i Licencji WLDE przed pierwszym uruchomieniem.',
    ],
  },
  {
    id: 'reg-2',
    heading: '§ 2. Przeznaczenie Aplikacji (użytek edukacyjny i domowy)',
    paragraphs: ['Aplikacja przeznaczona jest wyłącznie do:'],
    bullets: [
      'Użytku edukacyjnego i specjalistycznego w oświacie — bezpłatne wykorzystanie w placówkach oświatowych (przedszkola, szkoły podstawowe i ponadpodstawowe, szkoły specjalne, uczelnie, świetlice, placówki opiekuńczo-wychowawcze i terapeutyczne) oraz przez nauczycieli, wychowawców, pedagogów, psychologów i specjalistów szkolnych w ramach pracy dydaktycznej, terapeutycznej i wsparcia ucznia.',
      'Użytku domowego / prywatnego — korzystanie przez osoby fizyczne w celach własnych, samokształceniowych i testowych.',
    ],
    note: 'Wszelkie inne zastosowania, w tym komercyjne lub odpłatne świadczenie usług z użyciem Aplikacji, wymagają uprzedniej pisemnej zgody Autora.',
  },
  {
    id: 'reg-3',
    heading: '§ 3. Zasady korzystania',
    paragraphs: [],
    bullets: [
      'Aplikacja jest całkowicie bezpłatna dla zakresu wskazanego w § 2.',
      'Aplikacja nie zawiera reklam, mikropłatności ani płatnych subskrypcji.',
      'Użytkownik zobowiązuje się korzystać z Aplikacji zgodnie z jej przeznaczeniem, przepisami prawa oświatowego oraz przepisami o ochronie danych osobowych (RODO).',
      'Zabronione jest podejmowanie działań mogących zakłócić działanie Aplikacji, obchodzić jej zabezpieczenia lub narazić innych użytkowników na szkodę.',
    ],
  },
  {
    id: 'reg-4',
    heading: '§ 4. Prawa autorskie i licencja',
    paragraphs: [
      'Wszelkie prawa do Aplikacji — kod źródłowy, interfejs graficzny, projekt wizualny, treści wzorcowe i dokumentacja — należą wyłącznie do Autora i są chronione prawem autorskim.',
    ],
    bullets: [
      'Zabronione: kopiowanie, modyfikowanie, dekompilowanie, rozpowszechnianie, sprzedaż lub komercjalizacja Aplikacji bądź jej części bez pisemnej zgody Autora.',
      'Dozwolone: bezpłatne korzystanie w placówkach edukacyjnych, przez nauczycieli i pedagogów oraz w użytku domowym (§ 2), eksport własnych dokumentów PDF / .ipet oraz udostępnianie linku do oryginalnej Aplikacji.',
    ],
  },
  {
    id: 'reg-5',
    heading: '§ 5. Dane i prywatność (RODO/GDPR)',
    paragraphs: [],
    bullets: [
      'Aplikacja działa w trybie 100% Local-First: nie wymaga rejestracji ani logowania i nie wysyła ani nie zbiera danych osobowych na zewnętrznych serwerach Autora.',
      'Dane wprowadzane do Aplikacji (profile uczniów, dokumentacja PPP, WOPFU, IPET, dostosowania wymagań, wpisy dziennika obserwacji, oceny okresowe, aneksy i ustawienia placówki) przechowywane są wyłącznie lokalnie w przeglądarce użytkownika (baza IndexedDB „TeczkaWsparciaLocalDB” oraz pomocnicze ustawienia UI i potwierdzenia regulaminu w localStorage) i nigdy nie opuszczają urządzenia bez wyraźnego eksportu przez użytkownika.',
      'Administratorem danych osobowych wprowadzanych do programu jest wyłącznie Użytkownik końcowy lub placówka oświatowa (szkoła, nauczyciel, pedagog, specjalista) — Autor nie ma technicznego dostępu do tych danych.',
      'Aplikacja nie używa śledzących plików cookie, narzędzi analitycznych, systemów reklamowych ani zewnętrznych serwerów fontów.',
      'Zakres ochrony technicznej: sama baza IndexedDB nie jest szyfrowana w spoczynku, a opcjonalna blokada PIN-em/hasłem zabezpiecza wyłącznie interfejs aplikacji (UI). Pełne szyfrowanie kryptograficzne (AES-GCM 256-bit + PBKDF2-SHA256) chroni eksportowane pliki i kopie zapasowe .ipet. Przy pracy na danych rzeczywistych wymagane jest szyfrowanie dysku urządzenia oraz chronione konto systemowe.',
      'Użytkownik może w każdej chwili wyeksportować zaszyfrowaną kopię zapasową .ipet albo trwale usunąć wszystkie dane lokalne.',
    ],
  },
  {
    id: 'reg-6',
    heading: '§ 6. Odpowiedzialność',
    paragraphs: [],
    bullets: [
      'Aplikacja udostępniana jest w stanie „takim, jakim jest” (as is), bez jakichkolwiek gwarancji.',
      'Aplikacja stanowi pomocnicze narzędzie dokumentowania wsparcia i nie zastępuje decyzji zespołu nauczycieli i specjalistów, dyrektora szkoły ani analizy obowiązujących przepisów prawa.',
      'Autor nie ponosi odpowiedzialności za utratę danych, błędy działania, awarie sprzętu lub szkody wynikające z korzystania bądź niemożności korzystania z Aplikacji.',
      'Zaleca się regularne tworzenie zaszyfrowanych kopii zapasowych .ipet oraz ich bezpieczne przechowywanie.',
    ],
  },
  {
    id: 'reg-7',
    heading: '§ 7. Zmiany Regulaminu',
    paragraphs: [
      'Autor zastrzega sobie prawo do zmiany Regulaminu oraz aktualizacji Aplikacji bez uprzedzenia. W przypadku istotnych zmian Regulaminu Aplikacja może wymagać ponownego zapoznania się z nową treścią i jej akceptacji przed dalszym uruchomieniem.',
    ],
  },
  {
    id: 'reg-8',
    heading: '§ 8. Postanowienia końcowe',
    paragraphs: [
      'W sprawach nieuregulowanych niniejszym Regulaminem zastosowanie mają przepisy prawa polskiego, w szczególności Kodeksu cywilnego, ustawy o prawie autorskim i prawach pokrewnych oraz RODO.',
    ],
  },
];
