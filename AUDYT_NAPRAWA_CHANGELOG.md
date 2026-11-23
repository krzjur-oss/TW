# AUDYT NAPRAWA — CHANGELOG (`Teczka Wsparcia` v1.6.0)

Data wdrożenia poprawek: `2026-11-23`  
Stan prawny wzorców dokumentacji: `23 listopada 2026 r.` (`2026-11-23`)  
Nazwa bazy `IndexedDB`: `TeczkaWsparciaLocalDB` (zachowana bez zmian, schemat `v1 → v2`)  
Format zaszyfrowanych archiwów `.ipet`: `TECZKA_WSPARCIA_ENCRYPTED` (wersja `1`, `AES-GCM 256-bit` + `PBKDF2-SHA256` / `210 000` iteracji)

---

## 1. Naprawione problemy z audytu (P1 i P2)

### Priorytet P1 — Bezpieczeństwo danych, integralność bazy i import/eksport

1. **P1 / Sekcja 2 — Kolizje identyfikatorów przy imporcie pojedynczego ucznia (`importStudentBundle`)**
   - Naprawiono nadpisywanie wpisów dziennika, ocen okresowych i aneksów innych uczniów w razie kolizji klucza głównego `id` podczas importu (zarówno w trybie `MERGE_EXISTING`, jak i `CREATE_NEW`).
   - Wprowadzono oddzielne mapy `oldId -> newId` dla dziennika (`journalIdMap`), ocen (`evalIdMap`) i aneksów (`annexIdMap`) z zachowaniem i przepięciem relacji `linkedAnnexId` oraz `evaluationId`.
   - Dodano pre-analizę `analyzeSingleStudentImport()` z wykrywaniem identycznych, zmodyfikowanych, nowych i kolidujących między uczniami rekordów oraz trzema jawnymi politykami duplikatów dla użytkownika (`UPDATE_MATCHING`, `KEEP_EXISTING`, `ADD_AS_NEW`).
   - Cały zapis wykonywany jest w pojedynczej atomowej transakcji Dexie wraz z weryfikacją własności `studentId` przed zapisem (pełny rollback w razie błędu).

2. **P1 / Sekcja 3 — Bezpieczne scalanie pełnej kopii zapasowej (`importFullDatabaseBundle`)**
   - Wyeliminowano bezwarunkowe nadpisywanie danych przez `bulkPut` w trybie `MERGE`.
   - Dodano przedzapisową analizę konfliktów `analyzeFullDatabaseImport()` rozróżniającą rekordy nowe, identyczne, konfliktowe (ten sam ID lub dopasowanie tożsamości) oraz kolizje rekordów podrzędnych między uczniami.
   - Dodano jawną strategię rozstrzygania konfliktów w trybie `MERGE` (`KEEP_LOCAL` lub `OVERWRITE_WITH_BACKUP`), podsumowanie zakresu zmian przed zapisem, możliwość bezpiecznego anulowania oraz obowiązkowe jawne potwierdzenie (`confirmReplace: true`) przed destrukcyjnym odtworzeniem `REPLACE`.
   - Utrzymano i przetestowano regułę izolacji blokady UI: `exportFullDatabaseBundle()` nie eksportuje `appLock`, a `importFullDatabaseBundle()` (`MERGE` i `REPLACE`) zachowuje lokalną konfigurację blokady urządzenia docelowego.

3. **P1 / Sekcja 4 — Centralna walidacja runtime pakietów `.ipet`**
   - Utworzono moduł `src/validation/bundleValidation.ts` walidujący w runtime odszyfrowane dane z zewnątrz jeszcze przed rozpoczęciem transakcji bazodanowej (`SingleStudentBundle`, `FullDatabaseBundle`, `StudentProfile`, `JournalEntry`, `PeriodicEvaluation`, `ProgramModificationAnnex`, `FacilitySettings`, struktury WOPFU, IPET i Opinii PPP).
   - Egzekwowane są: typy i wymagane pola, ścisła poprawność dat kalendarzowych `YYYY-MM-DD`, dozwolone wartości enumów, sensowny zakres godzin tygodniowo (`0.25–60`), unikalność ID w obrębie pakietu, spójność `studentId`, integralność odwołań `linkedAnnexId` / `evaluationId` (także wykluczenie powiązań między różnymi uczniami), limity długości tekstów i tablic oraz limity rozmiaru wejścia (`MAX_ARCHIVE_BYTES = 25 MB`) i danych po odszyfrowaniu (`MAX_DECRYPTED_BYTES = 20 MB`).
   - Zachowano pełną zgodność z formatem `.ipet` v1 (`AES-GCM` + `PBKDF2-SHA256`, `210 000` iteracji).

4. **P1 / Sekcja 5 — Uczciwe komunikaty o zakresie ochrony danych i trwały limiter blokady UI**
   - Poprawiono komunikaty w ustawieniach, na ekranie blokady oraz w zakładce „O programie / RODO”, jednoznacznie wskazując, że blokada PIN/hasłem chroni wyłącznie interfejs UI (nie szyfruje rekordów w `IndexedDB` w spoczynku) i że przy danych rzeczywistych wymagane jest szyfrowanie dysku urządzenia, chronione konto systemowe oraz mocne hasło zamiast krótkiego PIN-u.
   - Dodano trwały limiter błędnych prób odblokowania (`src/utils/appLockThrottle.ts`, pamiętany w `localStorage`) z narastającym opóźnieniem czasowym (5s → 15s → 30s → 60s → 300s), odporny na zwykłe odświeżenie strony (F5), bez trwałej blokady legalnego dostępu i bez logowania sekretów.

---

### Priorytet P2 — PWA, fonty offline, podstawy prawne, zależności i testy/CI

5. **P2 / Sekcja 6 — Kontrolowane aktualizacje PWA i self-hosted fonty offline**
   - Zmieniono tryb rejestracji Service Workera z `autoUpdate` / `immediate: true` na `registerType: 'prompt'` + `registerSW({ immediate: false })`.
   - Dodano centralny rejestr niezapisanych zmian (`src/utils/unsavedChangesRegistry.ts`) z ochroną `beforeunload` oraz kontroler aktualizacji PWA (`src/pwa/pwaUpdateManager.ts` + `src/components/PWAUpdateBanner.tsx`).
   - Aktualizacja nie przeładowuje aplikacji samoczynnie w trakcie pracy; gdy wykryto niezapisane formularze (kreator WOPFU/IPET/Opinii, formularz ucznia, dziennik obserwacji, oceny i aneksy, ustawienia), przycisk „Aktualizuj teraz” jest zablokowany, a użytkownik może odłożyć aktualizację i zastosować ją dopiero po zapisaniu zmian.
   - Zastąpiono zewnętrzne odwołania do Google Fonts (`fonts.googleapis.com` / `fonts.gstatic.com`) lokalnie pakowanymi fontami `@fontsource/public-sans`, `@fontsource/plus-jakarta-sans` oraz `@fontsource/jetbrains-mono` (z zestawem `latin-ext` dla polskich znaków diakrytycznych).

6. **P2 / Sekcja 7 — Automatyczne testy (Vitest) i bramki jakości w CI**
   - Skonfigurowano `vitest` + `fake-indexeddb` i utworzono 7 zestawów testów pokrywających wszystkie 11 wymaganych obszarów audytu (24 testy).
   - Dodano kroki `bun run lint` (`tsc --noEmit`) oraz `bun run test` przed budowaniem i publikacją w `.github/workflows/deploy-gh-pages.yml`.

7. **P2 / Sekcja 8 — Aktualizacja i weryfikacja podstaw prawnych ze stanem prawnym**
   - Dodano jawne pole `Stan prawny na dzień 23 listopada 2026 r.` (`2026-11-23`) w `src/config/appInfo.ts`, widoku „O programie i prawo”, na arkuszu wydruku A4 oraz w generatorze PDF (zarówno w podstawie prawnej, jak i stopce każdej strony).
   - Zweryfikowano i zaktualizowano akty prawne w oparciu o oficjalny ELI:
     - Prawo oświatowe: `t.j. Dz.U. z 2026 r. poz. 820` (zastąpił `t.j. Dz.U. z 2025 r. poz. 1043`), `ELI: DU/2026/820`;
     - Kształcenie specjalne: `t.j. Dz.U. z 2020 r. poz. 1309, z późn. zm.`, `ELI: DU/2020/1309`;
     - Pomoc psychologiczno-pedagogiczna: `t.j. Dz.U. z 2023 r. poz. 1798`, `ELI: DU/2023/1798`;
     - Dokumentacja przebiegu nauczania: `t.j. Dz.U. z 2024 r. poz. 50`, `ELI: DU/2024/50`;
     - Ocenianie, klasyfikowanie i promowanie: `t.j. Dz.U. z 2023 r. poz. 2572` (ze wskazaniem zmian `Dz.U. z 2025 r. poz. 778`), `ELI: DU/2023/2572`;
     - RODO: Rozporządzenie (UE) 2016/679 oraz ustawa o ochronie danych osobowych (`t.j. Dz.U. z 2019 r. poz. 1781`, `ELI: DU/2019/1781`).
   - Zachowano czytelne zastrzeżenie, że aplikacja ma charakter wyłącznie pomocniczy i nie zastępuje decyzji zespołu, dyrektora szkoły ani analizy obowiązujących przepisów.

8. **P2 / Sekcja 9 — Porządkowanie zależności i `.env.example`**
   - Usunięto nieużywane zależności szablonu (`@google/genai`, `dotenv`, `express`, `motion`, `@types/express`, `autoprefixer`, `tsx`) i zsynchronizowano `bun.lock`.
   - Oczyszczono `.env.example` z mylących zmiennych serwerowych (`GEMINI_API_KEY`, `APP_URL`), dokumentując wyłącznie architekturę 100% Local-First oraz opcjonalną zmienną deweloperską `DISABLE_HMR`.

---

## 2. Lista dodanych i zmodyfikowanych plików

### Nowe pliki
- `src/validation/bundleValidation.ts` — centralna walidacja runtime archiwów `.ipet` i wszystkich encji domenowych;
- `src/utils/appLockThrottle.ts` — trwały w `localStorage` limiter błędnych prób odblokowania UI;
- `src/utils/unsavedChangesRegistry.ts` — globalny rejestr niezapisanych formularzy oraz guard `beforeunload`;
- `src/pwa/pwaUpdateManager.ts` — kontroler aktualizacji Service Workera z blokadą przy niezapisanych zmianach i odroczeniem;
- `src/components/PWAUpdateBanner.tsx` — interfejs monitu aktualizacji PWA i statusu offline;
- `vitest.config.ts` — konfiguracja środowiska testowego Vitest;
- `tests/setup.ts` — konfiguracja `fake-indexeddb/auto` oraz Web Crypto API w testach;
- `tests/fixtures.ts` — syntetyczne, w pełni zanonimizowane dane testowe (zero danych rzeczywistych);
- `tests/validation.test.ts` — testy walidatorów i normalizatorów rekordów;
- `tests/cryptoAndLock.test.ts` — testy kryptografii `.ipet`, błędnych haseł/tamperingu i limitera blokady UI;
- `tests/studentImport.test.ts` — testy regresyjne kolizji ID przy imporcie pojedynczego ucznia, relacji ocena–aneks, polityk duplikatów i rollbacku;
- `tests/fullBackup.test.ts` — testy pełnego backupu `MERGE` / `REPLACE`, zachowania `appLock` i rollbacku;
- `tests/migration.test.ts` — test migracji bazy `TeczkaWsparciaLocalDB` ze schematu `v1` do `v2`;
- `tests/pdfGenerator.test.ts` — testy 3 wariantów PDF (polskie znaki, długie treści, tabele, stopki, podpisy, potwierdzenie rodzica);
- `tests/pwaAndSafety.test.ts` — testy kontrolowanej aktualizacji PWA, ochrony niezapisanych zmian i konfiguracji GitHub Pages / fontów offline;
- `AUDYT_NAPRAWA_CHANGELOG.md` — niniejszy raport naprawczy.

### Zmodyfikowane pliki
- `src/db/database.ts` — bezpieczna obsługa kolizji ID i mapowanie referencji w `importStudentBundle`, pre-analiza i konfliktowe scalanie w `importFullDatabaseBundle`, parametryzacja klasy bazy dla testów migracji, atomowe transakcje i normalizatory wsteczne;
- `src/crypto/cryptoService.ts` — egzekwowanie limitów rozmiaru przed/po odszyfrowaniu oraz wywołanie walidacji runtime `validateSingleStudentBundle` / `validateFullDatabaseBundle` natychmiast po odszyfrowaniu;
- `src/components/security/StudentImportModal.tsx` — podsumowanie analizy kolizji/duplikatów i wybór polityki scalania przed zapisem;
- `src/components/security/FullBackupRestoreModal.tsx` — analiza konfliktów w `MERGE`, wybór strategii, opcja ustawień szkoły, jawne potwierdzenie w `REPLACE` i możliwość anulowania bez zmian w bazie;
- `src/components/security/AppLockScreen.tsx` — integracja z trwałym limiterem błędnych prób i zaktualizowane komunikaty zakresu blokady UI;
- `src/components/SettingsView.tsx` — aktualizacja opisów RODO/bezpieczeństwa UI vs szyfrowanie `.ipet`, podpięcie ostrzeżenia o niezapisanych zmianach;
- `src/components/wizard/DocumentationWizard.tsx` — rejestracja niezapisanych zmian podczas edycji WOPFU/IPET/Opinii;
- `src/components/StudentFormModal.tsx` — rejestracja niezapisanych zmian podczas edycji metryczki ucznia;
- `src/components/journal/ObservationJournalView.tsx` — rejestracja niezapisanych zmian w dzienniku obserwacji;
- `src/components/evaluations/PeriodicEvaluationAndAnnexesView.tsx` — rejestracja niezapisanych zmian przy ocenach i aneksach;
- `src/config/appInfo.ts` — zweryfikowane cytowania ELI, `Stan prawny na dzień 23 listopada 2026 r.`, opis fontów offline i blokady UI, podbicie wersji do `1.6.0`;
- `src/components/AboutAndLegalView.tsx` — wyświetlanie stanu prawnego, linków ELI, notatek weryfikacyjnych oraz zastrzeżenia pomocniczego;
- `src/pdf/pdfGenerator.ts` — zweryfikowane podstawy prawne ze stanem prawnym, stopka z informacją o charakterze pomocniczym i stanie prawnym, eksport helperów do testów;
- `src/components/print/PrintExportView.tsx` — stopka stanu prawnego i zastrzeżenia na wydruku A4;
- `src/main.tsx` — import lokalnych fontów `@fontsource/*` i kontrolowana inicjalizacja `initPwaUpdates()`;
- `src/App.tsx` — zamontowanie `UnsavedChangesWindowGuard` oraz `PWAUpdateBanner`;
- `index.html` — usunięcie linków do Google Fonts CDN;
- `vite.config.ts` — `registerType: 'prompt'`, usunięcie `runtimeCaching` Google Fonts, zachowanie `base: './'` i ścieżek PWA/GitHub Pages;
- `.github/workflows/deploy-gh-pages.yml` — dodanie kroków `bun run lint` i `bun run test` przed `bun run build`;
- `.env.example` — usunięcie mylących kluczy serwerowych;
- `package.json` & `bun.lock` — usunięcie nieużywanych pakietów szablonu, dodanie `@fontsource/*` oraz pakietów testowych (`vitest`, `fake-indexeddb`, `jsdom`), dodanie skryptu `test`, podbicie wersji do `1.6.0` po pozytywnym przejściu testów.

---

## 3. Migracja i kompatybilność wsteczna

- **Baza `IndexedDB` (`TeczkaWsparciaLocalDB`):**
  - Zachowano nazwę bazy i wszystkie istniejące tabele (`students`, `journalEntries`, `periodicEvaluations`, `facilitySettings`) wraz z nowszą tabelą `programAnnexes` wprowadzoną w `version(2)`.
  - Hook `upgrade` w `version(2)` bezpiecznie uzupełnia brakujące pola z rekordów `v1` (m.in. `wopfuDraft.functioningAreas`, `pppDocument.submissionDate`, `periodType`, `periodLabel`, `modificationDecision`) przy użyciu czystych funkcji normalizujących — bez utraty ani nadpisywania istniejących wpisów użytkownika.
  - Zachowanie zostało potwierdzone testem automatycznym `tests/migration.test.ts`.
- **Pliki zaszyfrowane `.ipet` (format `v1`):**
  - Nadal używana jest koperta `TECZKA_WSPARCIA_ENCRYPTED` v1 (`AES-GCM`, `PBKDF2-SHA256`, `210 000` iteracji). Pliki wygenerowane przez wcześniejsze wersje programu (`1.0.x–1.5.x`) są w pełni odczytywalne przez walidator i procedurę importu w wersji `1.6.0`.
- **Obsługa blokady UI (`appLock`) przy imporcie pełnego backupu:**
  - `exportFullDatabaseBundle()` usuwa `appLock` przed szyfrowaniem.
  - `importFullDatabaseBundle()` w obu trybach (`MERGE` i `REPLACE`) zachowuje `appLock` urządzenia docelowego, aby nie przenosić obcego PIN-u/hasła na inne stanowisko ani nie odcinać użytkownika od bazy.

---

## 4. Wyniki weryfikacji końcowej (po zmianie wersji na `1.6.0`)

### 4.1. `bun run lint` (`tsc --noEmit`)
```text
$ tsc --noEmit
=== LINT_OK ===
```
*(Kod wyjścia `0`, 0 błędów typowania TypeScript.)*

### 4.2. `bun run test --reporter=verbose`
```text
$ vitest run "--reporter=verbose"
 RUN  v5.1.1 /app/applet
 ✓ tests/cryptoAndLock.test.ts > Kryptografia .ipet, walidacja po odszyfrowaniu i trwały limiter blokady UI > szyfruje i odszyfrowuje pakiet SingleStudentBundle w formacie v1 (AES-GCM 256 + PBKDF2) 226ms
 ✓ tests/fullBackup.test.ts > Pełny backup i odtwarzanie bazy (MERGE, REPLACE, appLock i rollback) > exportFullDatabaseBundle nie zawiera appLock, a REPLACE zachowuje lokalną blokadę docelową i odtwarza wszystkie tabele 315ms
 ✓ tests/fullBackup.test.ts > Pełny backup i odtwarzanie bazy (MERGE, REPLACE, appLock i rollback) > odrzuca uszkodzony/nieprawidłowy pakiet przed czyszczeniem bazy i cofa REPLACE w razie błędu transakcji 9ms
 ✓ tests/fullBackup.test.ts > Pełny backup i odtwarzanie bazy (MERGE, REPLACE, appLock i rollback) > MERGE analizuje konflikty i kolizje między uczniami, wspiera KEEP_LOCAL oraz OVERWRITE_WITH_BACKUP 172ms
 ✓ tests/cryptoAndLock.test.ts > Kryptografia .ipet, walidacja po odszyfrowaniu i trwały limiter blokady UI > odrzuca błędne hasło, uszkodzony JSON, zmieniony ciphertext, zły typ archiwum oraz przekroczony rozmiar wejścia 370ms
 ✓ tests/cryptoAndLock.test.ts > Kryptografia .ipet, walidacja po odszyfrowaniu i trwały limiter blokady UI > odrzuca zaszyfrowany pakiet zawierający zniekształcone dane wewnętrzne (walidacja po odszyfrowaniu) 200ms
 ✓ tests/cryptoAndLock.test.ts > Kryptografia .ipet, walidacja po odszyfrowaniu i trwały limiter blokady UI > haszuje i weryfikuje PIN/hasło lokalnie oraz wymusza trwały limiter prób niezależny od odświeżenia strony 243ms
 ✓ tests/studentImport.test.ts > Import pojedynczego ucznia — kolizje ID, relacje ocena–aneks, duplikaty i rollback > chroni rekordy ucznia A przed kolizją ID rekordów podrzędnych podczas importu ucznia B 204ms
 ✓ tests/studentImport.test.ts > Import pojedynczego ucznia — kolizje ID, relacje ocena–aneks, duplikaty i rollback > chroni także w trybie MERGE_EXISTING gdy ten sam ID podrzędny należy w bazie do innego ucznia 10ms
 ✓ tests/studentImport.test.ts > Import pojedynczego ucznia — kolizje ID, relacje ocena–aneks, duplikaty i rollback > obsługuje ponowny import bez mnożenia duplikatów (UPDATE_MATCHING / KEEP_EXISTING / ADD_AS_NEW) 93ms
 ✓ tests/studentImport.test.ts > Import pojedynczego ucznia — kolizje ID, relacje ocena–aneks, duplikaty i rollback > wykonuje pełny rollback transakcji przy błędzie zapisu bez pozostawienia częściowych danych 79ms
 ✓ tests/migration.test.ts > Migracja starszej bazy IndexedDB (v1 → v2) > przenosi istniejące rekordy ze schematu v1 do v2 bez utraty danych i dodaje tabelę programAnnexes 108ms
 ✓ tests/validation.test.ts > Walidacja i normalizacja danych (bundleValidation + normalizers) > waliduje poprawny pakiet SingleStudentBundle i FullDatabaseBundle 69ms
 ✓ tests/validation.test.ts > Walidacja i normalizacja danych (bundleValidation + normalizers) > sprawdza ścisłą poprawność dat kalendarzowych YYYY-MM-DD 1ms
 ✓ tests/validation.test.ts > Walidacja i normalizacja danych (bundleValidation + normalizers) > odrzuca nieprawidłowe enumy, daty, wartości godzin i puste wymagane pola 1ms
 ✓ tests/validation.test.ts > Walidacja i normalizacja danych (bundleValidation + normalizers) > odrzuca przekroczenie limitów długości tekstu i tablic oraz duplikaty ID 1ms
 ✓ tests/validation.test.ts > Walidacja i normalizacja danych (bundleValidation + normalizers) > odrzuca niezgodny studentId i zerwane relacje linkedAnnexId / evaluationId (także między uczniami) 2ms
 ✓ tests/validation.test.ts > Walidacja i normalizacja danych (bundleValidation + normalizers) > zachowuje zdefiniowane limity rozmiaru wejścia i odszyfrowania 0ms
 ✓ tests/validation.test.ts > Walidacja i normalizacja danych (bundleValidation + normalizers) > normalizuje rekordy ze starszej wersji bazy bez utraty danych 2ms
 ✓ tests/pwaAndSafety.test.ts > PWA — kontrolowana aktualizacja, ochrona niezapisanych zmian, konfiguracja offline i GitHub Pages > blokuje przeładowanie przy niezapisanych zmianach i pozwala odroczyć oraz bezpiecznie dokończyć aktualizację 7ms
 ✓ tests/pwaAndSafety.test.ts > PWA — kontrolowana aktualizacja, ochrona niezapisanych zmian, konfiguracja offline i GitHub Pages > zachowuje relatywne ścieżki GitHub Pages, prompt PWA update i brak zależności od Google Fonts 1ms
 ✓ tests/pdfGenerator.test.ts > Generator PDF (polskie znaki, długie treści, wielostronicowe tabele, stopki i podpisy) > generuje poprawne nazwy plików PDF i zweryfikowane podstawy prawne ze stanem prawnym 4ms
 ✓ tests/pdfGenerator.test.ts > Generator PDF (polskie znaki, długie treści, wielostronicowe tabele, stopki i podpisy) > buduje wszystkie 3 warianty PDF z polskimi znakami, nagłówkiem, podpisami, potwierdzeniem rodzica i stopką 2245ms
 ✓ tests/pdfGenerator.test.ts > Generator PDF (polskie znaki, długie treści, wielostronicowe tabele, stopki i podpisy) > generuje poprawny wariant dla Opinii PPP bez wymuszania zatwierdzenia dyrektora właściwego dla IPET 117ms

 Test Files  7 passed (7)
      Tests  24 passed (24)
```

### 4.3. `bun run build` (`vite build` + PWA Workbox)
```text
$ vite build
vite v8.3.8 building client environment for production...
transforming...
✓ 1728 modules transformed.
rendering chunks...
computing gzip size...
dist/manifest.webmanifest                                              0.62 kB
dist/index.html                                                        1.65 kB │ gzip:     0.66 kB
... (fonty .woff2/.woff: jetbrains-mono, public-sans, plus-jakarta-sans — latin i latin-ext w dist/assets/) ...
dist/assets/index-Dcf3lxid.css                                        54.92 kB │ gzip:     9.40 kB
dist/assets/virtual_pwa-register-t-1nHEyt.js                           1.14 kB │ gzip:     0.60 kB
dist/assets/workbox-window.prod.es5-Bd17z0YL.js                        5.65 kB │ gzip:     2.20 kB
dist/assets/index-D3PL0ycH.js                                      2,798.65 kB │ gzip: 1,052.67 kB
✓ built in 2.00s
PWA v2.0.0
mode      generateSW
precache  53 entries (3339.55 KiB)
files generated
  dist/sw.js
  dist/workbox-f0c192c2.js
```
Sprawdzenie zawartości `dist/`:
- obecne `dist/.nojekyll`, `dist/sw.js`, `dist/workbox-f0c192c2.js`, `dist/manifest.webmanifest`, `dist/index.html`, `dist/pwa-*.png`, `dist/apple-touch-icon.png`, `dist/icon.svg`;
- w `dist/manifest.webmanifest`: `"start_url":"./"`, `"scope":"./"`, `"id":"./"`;
- w `dist/index.html`: relatywne ścieżki `./assets/...`, `./manifest.webmanifest`, `./icon.svg`, `0` odwołań do `fonts.googleapis.com`.

---

## 5. Znane ograniczenia i zakres nieuruchomiony w sandboxie

1. **Brak szyfrowania `IndexedDB` w spoczynku (świadome zadanie przyszłe):**
   - Rekordy przechowywane lokalnie w `IndexedDB` przeglądarki nie są zaszyfrowane at-rest; ochrona PIN/hasłem jest blokadą interfejsu UI. Prawdziwe szyfrowanie kryptograficzne obejmuje wyłącznie eksportowane pliki `.ipet`. W razie przetwarzania danych rzeczywistych na urządzeniu szkolnym obowiązkowe jest szyfrowanie całego dysku (np. BitLocker, FileVault, szyfrowany Android) oraz indywidualne, blokowane konto systemowe.
2. **Testy niemożliwe do wykonania na żywym sprzęcie w środowisku CLI sandboxa:**
   - Rzeczywiste uruchomienie trybu offline po instalacji PWA w przeglądarce desktopowej oraz Android Chrome (tryb samolotowy, zapis wygenerowanego PDF do pamięci urządzenia, wydruk A4 z okna dialogowego przeglądarki, zachowanie `HashRouter` na serwerze GitHub Pages po odświeżeniu F5).
   - Scenariusze te należy wykonać ręcznie przed dopuszczeniem do użycia z danymi uczniów (sekcja 7 poniżej).

---

## 6. Instrukcja wdrożenia (GitHub Pages + PWA)

1. Instalacja i pełna weryfikacja lokalna przed wypchnięciem zmian:
   ```bash
   bun install --frozen-lockfile
   bun run lint
   bun run test
   bun run build
   ```
2. Publikacja automatyczna:
   - Workflow `.github/workflows/deploy-gh-pages.yml` przy wypchnięciu na gałąź `main` uruchamia kolejno `bun install`, `bun run lint`, `bun run test`, `bun run build`, a następnie publikuje katalog `./dist` na GitHub Pages.
   - Zadbaj o to, aby w ustawieniach repozytorium GitHub (`Settings → Pages`) źródłem publikacji było **GitHub Actions**.

---

## 7. Lista ręcznych testów akceptacyjnych (Desktop + Android)

### A. Import pojedynczego ucznia (Desktop + Android)
1. Utwórz lub wczytaj ucznia A z co najmniej 1 wpisem dziennika, 1 oceną okresową oraz powiązanym 1 aneksem.
2. Wyeksportuj ucznia A do `.ipet`, zmień lokalnie lub przygotuj na drugim profilu ucznia B o kolidujących ID rekordów podrzędnych i zaimportuj do bazy z uczniem A (zarówno w trybie „Utwórz nowy profil”, jak i „Scal z istniejącym”).
3. Potwierdź w karcie ucznia A, że jego dziennik, oceny i aneksy pozostały w 100% nienaruszone, a w karcie ucznia B powiązanie ocena ↔ aneks nadal otwiera właściwy dokument.
4. Ponów import tego samego pliku i sprawdź wybór polityki duplikatów (`Aktualizuj pasujące` / `Zachowaj lokalne` / `Dodaj jako nowe`).

### B. Pełny backup (Desktop + Android)
1. Wykonaj pełną kopię bazy w `Ustawienia placówki → Kopia zapasowa`.
2. Zmodyfikuj dane lokalne i włącz lokalny PIN/hasło blokady UI.
3. Odtwórz kopię w trybie `REPLACE` (potwierdzając ostrzeżenie) i sprawdź odtworzenie wszystkich uczniów, dziennika, ocen, aneksów i ustawień szkoły oraz zachowanie lokalnej blokady UI.
4. Przetestuj tryb `MERGE` (podgląd raportu konfliktów przed zapisem oraz anulowanie bez wprowadzania zmian) oraz próbę wgrania pliku uszkodzonego (baza musi pozostać nietknięta).

### C. Ochrona i blokada UI (Desktop + Android)
1. Włącz blokadę ekranu (zalecane hasło tekstowe), wpisz 3-krotnie błędne hasło i sprawdź narastające opóźnienie (5s, 15s itd.).
2. Odśwież stronę (F5 / przeładowanie na Androidzie) i potwierdź, że licznik karnego opóźnienia nie zresetował się.
3. Sprawdź widoczność komunikatu o braku szyfrowania `IndexedDB` w spoczynku.
4. Odblokuj poprawnym hasłem i potwierdź zachowanie wszystkich danych.

### D. Offline / PWA i kontrolowana aktualizacja (Desktop Chrome/Edge + Android Chrome)
1. Otwórz aplikację online pod docelowym adresem URL (np. GitHub Pages), zainstaluj PWA („Dodaj do ekranu głównego” / „Zainstaluj aplikację”) i poczekaj na komunikat gotowości offline.
2. Włącz tryb samolotowy / odłącz sieć, zamknij aplikację i uruchom ją ponownie (także po odświeżeniu z podstronami `#/students/...`). Sprawdź poprawne renderowanie fontów bez internetu.
3. Otwórz formularz (np. kreator WOPFU/IPET) i wprowadź niezatwierdzoną zmianę; w DevTools → Application → Service Workers (desktop) lub po wypchnięciu nowej wersji na Pages sprawdź, że aplikacja NIE przeładowuje karty samoczynnie w trakcie edycji, a przycisk aktualizacji jest chroniony do czasu zapisu lub odłożenia.

### E. Dokumenty PDF i wydruk A4 (Desktop + Android)
1. Wygeneruj wszystkie 3 warianty PDF (`IPET / WOPFU`, `Ocena okresowa / sprawozdanie`, `Karta obserwacji`) dla ucznia z orzeczeniem oraz dla ucznia z opinią PPP (z polskimi znakami `ą ć ę ł ń ó ś ź ż`, długimi opisami, ponad 20 wpisami dziennika i kilkoma aneksami).
2. Zweryfikuj poprawność polskich znaków w wygenerowanym pliku PDF, brak ucinania wierszy tabel w połowie, obecność nagłówka szkoły, stopki ze stanem prawnym, podpisów zespołu oraz rubryki potwierdzenia rodzica/opiekuna.
3. Na Androidzie sprawdź pobranie pliku `.pdf` do folderu `Pobrane` oraz podgląd wydruku A4 z menu przeglądarki.
