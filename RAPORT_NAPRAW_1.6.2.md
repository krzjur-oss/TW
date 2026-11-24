# RAPORT NAPRAW — `Teczka Wsparcia` v1.6.2

**Wersja końcowa wydania:** `1.6.2`  
**Data wydania:** `24 listopada 2026 r.` (`2026-11-24`)  
**Baza lokalna `IndexedDB`:** `TeczkaWsparciaLocalDB` (schemat `v1 → v2`, zachowana pełna zgodność wsteczna)  
**Format zaszyfrowanych archiwów `.ipet`:** `TECZKA_WSPARCIA_ENCRYPTED` (wersja `1`, `AES-GCM 256-bit` + `PBKDF2-SHA256`, `210 000` iteracji)

---

## 1. Lista dodanych i zmodyfikowanych plików

### Nowe pliki
- `src/utils/autoLockController.ts` — kontroler opcjonalnej automatycznej blokady interfejsu po bezczynności i przy zdarzeniu `visibilitychange` / `focus`, odporny na dławienie timerów w tle, dbający o pojedynczą rejestrację listenerów i pełne sprzątanie zasobów;
- `RAPORT_NAPRAW_1.6.2.md` — niniejszy raport końcowy.

### Zmodyfikowane pliki
- `src/validation/bundleValidation.ts` — zdefiniowano spójne limity rozmiaru w bajtach UTF-8 (`AES_GCM_TAG_BYTES`, `MAX_DECRYPTED_BYTES`, `MAX_CIPHERTEXT_BYTES`, `MAX_ARCHIVE_BASE64_BYTES`, `MAX_ARCHIVE_BYTES`, `MAX_DECRYPTED_MB`, `MAX_ARCHIVE_MB`) oraz funkcję dokładnego zliczania bajtów UTF-8 `measureUtf8Bytes()`;
- `src/crypto/cryptoService.ts` — egzekwowanie spójnych limitów bajtów UTF-8 dla danych jawnych, szyfrogramu i pełnej koperty JSON przed eksportem (zanim nastąpi pobranie pliku) oraz podczas parsowania i odszyfrowywania w `decryptIpetArchive`; rozszerzenie `createAppLockConfig` o opcje `autoLockMinutes` i `backgroundLockPolicy`;
- `src/components/security/StudentImportModal.tsx` — spójne komunikaty limitu rozmiaru odwołujące się do `MAX_ARCHIVE_MB` i `MAX_DECRYPTED_MB` (`28 MB` archiwum / `20 MB` danych jawnych);
- `src/components/security/FullBackupRestoreModal.tsx` — spójne komunikaty limitu rozmiaru (`28 MB` archiwum / `20 MB` danych jawnych);
- `src/types/domain.ts` — dodano typy `AutoLockMinutes` (`0 | 1 | 5 | 10 | 15`), `BackgroundLockPolicy` (`'OFF' | 'RESPECT_IDLE' | 'IMMEDIATE'`) i opcjonalne pola w `AppLockConfig`;
- `src/db/database.ts` — dodano `normalizeFacilitySettings()` i podpięto go w `getFacilitySettings()` dla bezstratnej migracji istniejących ustawień placówki i starszych konfiguracji `appLock`;
- `src/App.tsx` — podpięto pojedynczy kontroler automatycznej blokady UI (`createAutoLockController`) o stabilnych zależnościach prymitywnych oraz zachowano zamontowane drzewo obszaru roboczego pod ekranem blokady (`hidden print:hidden`), dzięki czemu blokada nie powoduje utraty niezapisanych formularzy;
- `src/components/security/AppLockScreen.tsx` — dodano czytelne wyświetlanie powodu blokady (`MANUAL`, `IDLE_TIMEOUT`, `BACKGROUND`, `BACKGROUND_IDLE_ELAPSED`);
- `src/components/SettingsView.tsx` — dodano przejrzystą konfigurację czasu bezczynności (`Wyłączona`, `1`, `5`, `10`, `15 min`) i zachowania przy przejściu w tło (`visibilitychange`) wraz z możliwością zapisania zmian czasu bez ponownego wpisywania PIN-u/hasła;
- `src/config/appInfo.ts` — podniesiono wersję do `1.6.2`, zaktualizowano opis funkcji bezpieczeństwa RODO i dodano wpis wydania `1.6.2` w `APP_CHANGELOG`;
- `src/config/legalDocuments.ts`, `src/utils/termsAcceptance.ts`, `LICENSE.md`, `REGULAMIN.md` — ujednolicono numer wersji `1.6.2` i datę `24 listopada 2026 r.`;
- `package.json` — ujednolicono `"version": "1.6.2"` (bez jakichkolwiek zmian wersji zależności);
- `AUDYT_NAPRAWA_CHANGELOG.md` — dopisano czytelną adnotację o etapach wydań `v1.6.0 → v1.6.1 → v1.6.2`;
- `tests/cryptoAndLock.test.ts` — dodano testy graniczne `.ipet` (tuż poniżej limitu, na limicie `20 MiB`, archiwum blisko `28 MiB`, powyżej limitów UTF-8 i ciphertext, wielobajtowe znaki UTF-8), test pełnego round-trip `eksport → szyfrowanie → odszyfrowanie → import` oraz 6 scenariuszy testowych automatycznej blokady UI;
- `tests/validation.test.ts` — dodano weryfikację matematycznej spójności limitów UTF-8, zgodności `measureUtf8Bytes()` z `TextEncoder` oraz test migracji starszej konfiguracji `FacilitySettings` (`normalizeFacilitySettings`).

---

## 2. Opis wykonanych poprawek

### Zadanie 1 (P1) — Spójne limity eksportu i importu `.ipet`
- **Przyczyna problemu w `1.6.1`:** limit danych jawnych wynosił `20 MiB` (`20 971 520 B`), natomiast po zaszyfrowaniu AES-GCM (+16 B tagu) i zakodowaniu do Base64 (`ceil(n/3) * 4 = 27 962 048 B`) plus nagłówek JSON koperty (~330 B) plik `.ipet` osiągał ok. `27,96 MB` i przekraczał dotychczasowy limit `MAX_ARCHIVE_BYTES = 25 MiB` (`26 214 400 B`). Ponadto `parseEnvelope` używał `rawText.length` (jednostki UTF-16) zamiast faktycznych bajtów UTF-8.
- **Rozwiązanie w `1.6.2`:**
  - Zachowano pełny limit danych jawnych użytkownika: **`MAX_DECRYPTED_BYTES = 20 MiB` (`20 971 520 B UTF-8`)** (nie zmniejszono limitu po cichu).
  - Wyznaczono spójny limit szyfrogramu **`MAX_CIPHERTEXT_BYTES = 20 MiB + 16 B` (`20 971 536 B`)**, narzut Base64 (`27 962 048 B`) oraz podniesiono limit całego zserializowanego archiwum JSON `.ipet` do **`MAX_ARCHIVE_BYTES = 28 MiB` (`29 360 128 B UTF-8`)**, co daje ponad `1,33 MiB` zapasu na kopertę JSON ponad maksymalny możliwy szyfrogram Base64.
  - Wprowadzono jednolity pomiar w **bajtach UTF-8**: `TextEncoder.encode()` przy szyfrowaniu/odszyfrowywaniu oraz `measureUtf8Bytes()` (bez zbędnej alokacji dużych buforów) przy walidacji tekstu archiwum przed i po serializacji.
  - W `encryptBundleToIpetString()` zwalidowano rozmiar danych jawnych przed szyfrowaniem, szyfrogramu po AES-GCM oraz zserializowanej koperty `.ipet` przed zwróceniem pliku do pobrania — z czytelnym komunikatem w MB UTF-8.
  - Zaktualizowano komunikaty walidacji w `StudentImportModal.tsx` i `FullBackupRestoreModal.tsx` tak, aby jawnie podawały aktualny limit (`28 MB` dla archiwum `.ipet` / `20 MB` danych jawnych).

### Zadanie 2 (P1) — Opcjonalna automatyczna blokada interfejsu (UI)
- **Ustawienia i kontrola:** w panelu `Ustawienia placówki → Blokada ekranu interfejsu (PIN / hasło)` dodano wybór czasu bezczynności (`Wyłączona`, `1`, `5`, `10`, `15 min`) oraz polityki przejścia do tła (`visibilitychange`):
  - **`Sprawdzaj bezczynność w tle i przy powrocie (RESPECT_IDLE — zalecane)`**: szybkie przełączenie karty (np. po numer orzeczenia PPP czy dokument PDF) nie przerywa pracy natychmiast, ale jeśli w trakcie przebywania w tle lub uśpienia urządzenia upłynie ustawiony czas bezczynności, przy powrocie (`visibilitychange === 'visible'` lub `focus`) aplikacja zablokuje się natychmiast w oparciu o znacznik czasu `Date.now()` — niezależnie od dławienia timerów `setTimeout` przez przeglądarkę.
  - **`Blokuj natychmiast po ukryciu karty lub minimalizacji (IMMEDIATE)`**: blokuje ekran natychmiast na zdarzenie `visibilitychange === 'hidden'` (opcja dla stanowisk współdzielonych).
  - **`Nie blokuj automatycznie na zdarzenie przełączenia karty (OFF)`**: korzysta wyłącznie z zegara bezczynności w otwartym oknie.
- **Ochrona przed utratą danych i aktywnym pisaniem:**
  - Zdarzenia aktywności (`keydown`, `input`, `compositionupdate`, `pointerdown`, `touchstart`, `wheel`, `scroll` oraz dławiony `mousemove`) na bieżąco aktualizują `lastActivityAtMs` i przesuwają pojedynczy timer — aplikacja nie zablokuje się podczas wpisywania treści.
  - Gdy blokada zostanie wyzwolona (ręcznie lub automatycznie), `AppShell` nie odmontowuje już `<main>` ani otwartych okien formularzy: obszar roboczy pozostaje bezpiecznie ukryty przez `hidden print:hidden`, a nad nim montuje się `AppLockScreen`. Po podaniu PIN-u/hasła użytkownik wraca dokładnie do niedokończonego formularza bez utraty danych.
- **Brak wycieku sekretów i stabilność timerów:**
  - Kontroler w `App.tsx` wiąże się ze stabilnymi prymitywami (`termsAccepted`, `enabled`, `autoLockMinutes`, `backgroundLockPolicy`, `isUnlocked`), nie duplikuje timerów przy rerenderach i zdejmuje wszystkie listenery oraz timery przy blokadzie lub odmontowaniu (`destroy()`).
  - PIN/hasło nigdy nie są zapisywane w `localStorage`, `sessionStorage` ani w czystej postaci w `IndexedDB` — w `IndexedDB` przechowywany jest wyłącznie lokalny skrót `PBKDF2-SHA256` z losową solą, a `localStorage` zawiera tylko licznik prób `appLockThrottle`.

### Zadanie 3 (P2) — Dokumentacja wydania i spójność wersji
- Ujednolicono wersję `1.6.2` w `package.json` (bez modyfikacji zależności), `src/config/appInfo.ts`, `src/config/legalDocuments.ts`, `src/utils/termsAcceptance.ts`, `LICENSE.md`, `REGULAMIN.md` oraz zaktualizowano `AUDYT_NAPRAWA_CHANGELOG.md`, aby nie sugerował, że `1.6.0` jest najnowszym wydaniem.

---

## 3. Migracja i zgodność wsteczna

- **Baza `IndexedDB` (`TeczkaWsparciaLocalDB`):** nazwa bazy, schematy `v1 → v2` i istniejące tabele pozostały bez zmian. Funkcja `normalizeFacilitySettings()` uzupełnia brakujące pola w rekordach `FacilitySettings` z wersji `1.0–1.6.1`: jeśli użytkownik miał już włączony `appLock` bez nowych pól auto-blokady, otrzymuje domyślnie `{ autoLockMinutes: 0, backgroundLockPolicy: 'OFF' }`, zachowując w 100% dotychczasowe zachowanie bez nagłego zamykania sesji; przy pierwszym włączeniu blokady w UI domyślnie podpowiadane są wartości `5 minut` i `RESPECT_IDLE`.
- **Archiwa `.ipet` v1:** zachowano niezmieniony format koperty `TECZKA_WSPARCIA_ENCRYPTED` (`version: 1`, `AES-GCM 256-bit`, `PBKDF2-SHA256`, `210 000` iteracji). Wszystkie pliki z poprzednich wersji są odczytywane przez `1.6.2`, a podniesienie `MAX_ARCHIVE_BYTES` do `28 MiB` zachowuje pełną kompatybilność z plikami o rozmiarze do `25 MiB` i naprawia obsługę dużych eksportów z zakresu `18,75–20 MiB` danych jawnych.
- **Regulamin i Licencja WLDE:** podniesienie `TERMS_ACCEPTANCE_VERSION` do `'1.6.2'` powoduje jednorazowe wyświetlenie ekranu akceptacji zaktualizowanych dokumentów z datą `24 listopada 2026 r.` przy pierwszym uruchomieniu wydania `1.6.2` bez naruszenia danych w `IndexedDB`.

---

## 4. Rzeczywiście uzyskane wyniki `lint`, `test` i `build` (po zmianie wersji na `1.6.2`)

### 4.1. `bun run lint` (`tsc --noEmit`)
```text
$ tsc --noEmit
```
Kod wyjścia `0` (zero błędów typowania TypeScript).

### 4.2. `bun run test --reporter=verbose`
```text
$ vitest run "--reporter=verbose"
 ✓ tests/studentImport.test.ts > Import pojedynczego ucznia — kolizje ID, relacje ocena–aneks, duplikaty i rollback > chroni rekordy ucznia A przed kolizją ID rekordów podrzędnych podczas importu ucznia B
 ✓ tests/studentImport.test.ts > Import pojedynczego ucznia — kolizje ID, relacje ocena–aneks, duplikaty i rollback > chroni także w trybie MERGE_EXISTING gdy ten sam ID podrzędny należy w bazie do innego ucznia
 ✓ tests/studentImport.test.ts > Import pojedynczego ucznia — kolizje ID, relacje ocena–aneks, duplikaty i rollback > obsługuje ponowny import bez mnożenia duplikatów (UPDATE_MATCHING / KEEP_EXISTING / ADD_AS_NEW)
 ✓ tests/studentImport.test.ts > Import pojedynczego ucznia — kolizje ID, relacje ocena–aneks, duplikaty i rollback > wykonuje pełny rollback transakcji przy błędzie zapisu bez pozostawienia częściowych danych
 ✓ tests/fullBackup.test.ts > Pełny backup i odtwarzanie bazy (MERGE, REPLACE, appLock i rollback) > exportFullDatabaseBundle nie zawiera appLock, a REPLACE zachowuje lokalną blokadę docelową i odtwarza wszystkie tabele
 ✓ tests/fullBackup.test.ts > Pełny backup i odtwarzanie bazy (MERGE, REPLACE, appLock i rollback) > odrzuca uszkodzony/nieprawidłowy pakiet przed czyszczeniem bazy i cofa REPLACE w razie błędu transakcji
 ✓ tests/fullBackup.test.ts > Pełny backup i odtwarzanie bazy (MERGE, REPLACE, appLock i rollback) > MERGE analizuje konflikty i kolizje między uczniami, wspiera KEEP_LOCAL oraz OVERWRITE_WITH_BACKUP
 ✓ tests/validation.test.ts > Walidacja i normalizacja danych (bundleValidation + normalizers) > waliduje poprawny pakiet SingleStudentBundle i FullDatabaseBundle
 ✓ tests/validation.test.ts > Walidacja i normalizacja danych (bundleValidation + normalizers) > sprawdza ścisłą poprawność dat kalendarzowych YYYY-MM-DD
 ✓ tests/validation.test.ts > Walidacja i normalizacja danych (bundleValidation + normalizers) > odrzuca nieprawidłowe enumy, daty, wartości godzin i puste wymagane pola
 ✓ tests/validation.test.ts > Walidacja i normalizacja danych (bundleValidation + normalizers) > odrzuca przekroczenie limitów długości tekstu i tablic oraz duplikaty ID
 ✓ tests/validation.test.ts > Walidacja i normalizacja danych (bundleValidation + normalizers) > odrzuca niezgodny studentId i zerwane relacje linkedAnnexId / evaluationId (także między uczniami)
 ✓ tests/validation.test.ts > Walidacja i normalizacja danych (bundleValidation + normalizers) > zachowuje spójne limity bajtów UTF-8 (20 MiB jawne + tag + Base64 <= 28 MiB archiwum) 1ms
 ✓ tests/validation.test.ts > Walidacja i normalizacja danych (bundleValidation + normalizers) > normalizuje rekordy ze starszej wersji bazy oraz ustawienia FacilitySettings bez utraty danych 3ms
 ✓ tests/pwaAndSafety.test.ts > PWA — kontrolowana aktualizacja, ochrona niezapisanych zmian, konfiguracja offline i GitHub Pages > blokuje przeładowanie przy niezapisanych zmianach i pozwala odroczyć oraz bezpiecznie dokończyć aktualizację 78ms
 ✓ tests/pwaAndSafety.test.ts > PWA — kontrolowana aktualizacja, ochrona niezapisanych zmian, konfiguracja offline i GitHub Pages > zachowuje relatywne ścieżki GitHub Pages, prompt PWA update i brak zależności od Google Fonts 1ms
 ✓ tests/legalAndTerms.test.ts > Licencja WLDE, Regulamin i wymóg akceptacji przed pierwszym uruchomieniem > dostosowuje LICENSE.md i REGULAMIN.md bez pozostawionych placeholderów wzorcowych 4ms
 ✓ tests/legalAndTerms.test.ts > Licencja WLDE, Regulamin i wymóg akceptacji przed pierwszym uruchomieniem > udostępnia spójną strukturę licencji i regulaminu w aplikacji 1ms
 ✓ tests/legalAndTerms.test.ts > Licencja WLDE, Regulamin i wymóg akceptacji przed pierwszym uruchomieniem > wymaga akceptacji przed pierwszym uruchomieniem i zapisuje zgodę lokalnie dla bieżącej wersji 1ms
 ✓ tests/pdfGenerator.test.ts > Generator PDF (polskie znaki, długie treści, wielostronicowe tabele, stopki i podpisy) > generuje poprawne nazwy plików PDF i zweryfikowane podstawy prawne ze stanem prawnym
 ✓ tests/pdfGenerator.test.ts > Generator PDF (polskie znaki, długie treści, wielostronicowe tabele, stopki i podpisy) > buduje wszystkie 3 warianty PDF z polskimi znakami, nagłówkiem, podpisami, potwierdzeniem rodzica i stopką
 ✓ tests/pdfGenerator.test.ts > Generator PDF (polskie znaki, długie treści, wielostronicowe tabele, stopki i podpisy) > generuje poprawny wariant dla Opinii PPP bez wymuszania zatwierdzenia dyrektora właściwego dla IPET
 ✓ tests/migration.test.ts > Migracja starszej bazy IndexedDB (v1 → v2) > przenosi istniejące rekordy ze schematu v1 do v2 bez utraty danych i dodaje tabelę programAnnexes
 ✓ tests/cryptoAndLock.test.ts > Kryptografia .ipet, walidacja po odszyfrowaniu i trwały limiter blokady UI > szyfruje i odszyfrowuje pakiet SingleStudentBundle w formacie v1 (AES-GCM 256 + PBKDF2)
 ✓ tests/cryptoAndLock.test.ts > Kryptografia .ipet, walidacja po odszyfrowaniu i trwały limiter blokady UI > zachowuje spójne limity UTF-8 na granicach 20 MiB jawnych / 28 MiB archiwum: każdy poprawny eksport przechodzi własny import 18643ms
 ✓ tests/cryptoAndLock.test.ts > Kryptografia .ipet, walidacja po odszyfrowaniu i trwały limiter blokady UI > przeprowadza pełny round-trip eksport -> szyfrowanie .ipet -> odszyfrowanie -> import i porównuje kompletność danych 220ms
 ✓ tests/cryptoAndLock.test.ts > Kryptografia .ipet, walidacja po odszyfrowaniu i trwały limiter blokady UI > odrzuca błędne hasło, uszkodzony JSON, zmieniony ciphertext, zły typ archiwum oraz przekroczony rozmiar wejścia 475ms
 ✓ tests/cryptoAndLock.test.ts > Kryptografia .ipet, walidacja po odszyfrowaniu i trwały limiter blokady UI > odrzuca zaszyfrowany pakiet zawierający zniekształcone dane wewnętrzne (walidacja po odszyfrowaniu) 115ms
 ✓ tests/cryptoAndLock.test.ts > Kryptografia .ipet, walidacja po odszyfrowaniu i trwały limiter blokady UI > haszuje i weryfikuje PIN/hasło lokalnie oraz wymusza trwały limiter prób niezależny od odświeżenia strony 210ms
 ✓ tests/cryptoAndLock.test.ts > Kryptografia .ipet, walidacja po odszyfrowaniu i trwały limiter blokady UI > automatyczna blokada UI: bezczynność, aktywne pisanie, przejście w tło (visibilitychange), dławienie timerów, wyłączenie i czyszczenie listenerów 6ms

 Test Files  8 passed (8)
      Tests  30 passed (30)
   Duration  21.31s
```

### 4.3. `bun run build` (`vite build` + PWA Workbox)
```text
$ vite build
✓ 1733 modules transformed.
dist/manifest.webmanifest                                              0.62 kB
dist/index.html                                                        1.65 kB │ gzip:     0.66 kB
... (lokalne fonty .woff2/.woff: jetbrains-mono, public-sans, plus-jakarta-sans, latin + latin-ext w dist/assets/) ...
dist/assets/index-D896-9Sf.css                                        61.69 kB │ gzip:    10.20 kB
dist/assets/virtual_pwa-register-5-_XVhOA.js                           1.14 kB │ gzip:     0.60 kB
dist/assets/workbox-window.prod.es5-Bd17z0YL.js                        5.65 kB │ gzip:     2.20 kB
dist/assets/index-D06K4KO4.js                                      2,859.62 kB │ gzip: 1,069.80 kB
✓ built in 2.56s
PWA v2.0.0
mode      generateSW
precache  53 entries (3405.70 KiB)
files generated
  dist/sw.js
  dist/workbox-f0c192c2.js
```

### 4.4. Kontrola artefaktów `dist/` (PWA, GitHub Pages, fonty offline)
- Obecne pliki `dist/sw.js`, `dist/workbox-f0c192c2.js`, `dist/manifest.webmanifest`, `dist/.nojekyll`, `dist/index.html`, `dist/icon.svg`, `dist/apple-touch-icon.png`, `dist/pwa-192x192.png`, `dist/pwa-512x512.png`, `dist/pwa-maskable-512x512.png`.
- W `dist/manifest.webmanifest`: `"start_url":"./"`, `"scope":"./"`, `"id":"./"`.
- W `dist/index.html`: wyłącznie ścieżki relatywne `./assets/...`, `./apple-touch-icon.png`, `./icon.svg`, `./manifest.webmanifest`.
- Liczba wystąpień `fonts.googleapis.com` / `fonts.gstatic.com` w całym `dist/`: `0`.

---

## 5. Kontrola regresji oraz lista testów manualnych niewykonanych w sandboxie

### 5.1. Zakres zweryfikowany automatycznie (Vitest + `fake-indexeddb` + JSDOM)
- Import pojedynczego ucznia z kolizjami ID, zachowaniem relacji ocena–aneks i wyborem polityki duplikatów (`tests/studentImport.test.ts`);
- Pełny backup bazy `MERGE` i `REPLACE`, potwierdzenie destrukcyjnego odtwarzania, zachowanie lokalnej blokady UI urządzenia docelowego oraz rollback (`tests/fullBackup.test.ts`);
- Szyfrowanie i deszyfrowanie `.ipet` v1, spójne granice UTF-8 (`20 MiB` / `28 MiB`), pełny round-trip eksport → import, błędy hasła/tamperingu (`tests/cryptoAndLock.test.ts`);
- Automatyczna blokada UI: bezczynność, reset podczas wpisywania, `visibilitychange`, zdławione timery w tle, wyłączenie i czyszczenie listenerów (`tests/cryptoAndLock.test.ts`);
- Walidatory runtime, normalizatory rekordów oraz migracja `FacilitySettings` (`tests/validation.test.ts`);
- Migracja `IndexedDB` `v1 → v2` (`tests/migration.test.ts`);
- Generowanie 3 wariantów PDF z polskimi znakami, tabelami, stopkami i stanem prawnym (`tests/pdfGenerator.test.ts`);
- Kontrola aktualizacji PWA z blokadą przy niezapisanych zmianach oraz konfiguracja GitHub Pages/fontów (`tests/pwaAndSafety.test.ts`);
- Licencja WLDE, Regulamin i lokalny zapis akceptacji przed pierwszym uruchomieniem (`tests/legalAndTerms.test.ts`).

### 5.2. Testy manualne niewykonane w środowisku CLI sandboxa (wymagają przeglądarki desktopowej i Android Chrome)
Następujące czynności interakcyjne UI nie zostały uruchomione w żywej przeglądarce w ramach sandboxa CLI i wymagają ręcznego sprawdzenia po wdrożeniu na GitHub Pages:
1. Dodawanie, ręczna edycja w modalach i usuwanie ucznia w UI (`StudentFormModal`, `StudentListView`).
2. Ręczne tworzenie i edycja wpisów w module `ObservationJournalView`, kreatorze `WOPFU`, `IPET`, ścieżce `Opinia PPP` oraz `PeriodicEvaluationAndAnnexesView` (w tym sprawdzenie zachowania niezapisanej zawartości formularza w DOM po wyzwoleniu automatycznej blokady ekranu i ponownym odblokowaniu).
3. Pobranie dużego pliku `.ipet` w przeglądarce oraz otwarcie go przez `<input type="file">` na Android Chrome i desktop Chrome/Edge.
4. Instalacja PWA („Dodaj do ekranu głównego”), praca w trybie samolotowym offline, monit aktualizacji `PWAUpdateBanner` na żywym Service Workerze oraz weryfikacja tras `#/...` na GitHub Pages po odświeżeniu `F5`.
5. Podgląd wydruku A4 z menu przeglądarki oraz zapis wygenerowanego pliku `.pdf` do folderu `Pobrane` na Androidzie.

---

## 6. Znane ograniczenia

1. **Brak szyfrowania `IndexedDB` w spoczynku:** baza `TeczkaWsparciaLocalDB` przechowuje rekordy w `IndexedDB` w formie jawnej; blokada PIN-em/hasłem (ręczna i automatyczna) chroni wyłącznie interfejs UI, a prawdziwe szyfrowanie kryptograficzne dotyczy eksportowanych plików i kopii zapasowych `.ipet`. W środowisku produkcyjnym z danymi rzeczywistymi konieczne jest szyfrowanie całego dysku urządzenia i chronione konto systemowe.
2. **Ograniczenia przeglądarek w tle:** w polityce `RESPECT_IDLE` część przeglądarek mobilnych agresywnie usypia karty w tle — wówczas blokada po przekroczonym czasie bezczynności następuje natychmiast przy powrocie do aplikacji (`visibilitychange === 'visible'` lub `focus`). Na komputerach współdzielonych najbezpieczniejszym wariantem pozostaje polityka `IMMEDIATE` lub ręczne użycie przycisku „Zablokuj”.
3. **Brak chmurowego odzyskiwania PIN-u/hasła:** skrót dostępowy przechowywany jest wyłącznie lokalnie; po zapomnieniu hasła odblokowującego nie ma możliwości jego zresetowania zdalnie.

---

**Wersja końcowa projektu:** `1.6.2`
