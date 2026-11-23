# PROMPT NAPRAWCZY — TECZKA WSPARCIA

Pracujesz bezpośrednio na istniejącym projekcie Teczka Wsparcia (React + TypeScript + Vite + Dexie/IndexedDB + PWA). Twoim zadaniem jest przeprowadzenie kontrolowanej naprawy wskazanych problemów audytu i przygotowanie stabilnego wydania. Nie twórz nowej aplikacji i nie zastępuj istniejącego projektu uproszczonym przykładem.

## 1. Zasady nadrzędne — obowiązkowe

1. Najpierw przeanalizuj całe repozytorium i zależności między modułami. Nie edytuj plików, zanim nie zrozumiesz obecnych przepływów.
2. Pracuj na istniejącym kodzie. Zachowaj obecny interfejs, układ, nazwy modułów, polską terminologię, wszystkie funkcje, formaty eksportu oraz PWA.
3. Nie usuwaj, nie resetuj i nie nadpisuj istniejących danych użytkownika. Nie zmieniaj nazwy bazy IndexedDB ani istniejących kluczy bez migracji.
4. Nie usuwaj istniejących funkcji, formularzy, ścieżek, widoków ani elementów UI tylko po to, aby uprościć naprawę.
5. Każda zmiana struktury danych musi mieć migrację wsteczną/zgodność odczytu i test na bazie zawierającej dane ze starszej wersji.
6. Zachowaj kompatybilność z istniejącymi zaszyfrowanymi plikami `.ipet`. Jeśli zmieniasz format, dodaj wersjonowanie i obsługę starszego formatu.
7. Nie umieszczaj prawdziwych danych uczniów, haseł ani sekretów w logach, testach, kodzie lub komunikatach.
8. Nie wysyłaj danych uczniów do API, chmury ani usług AI. Projekt ma pozostać Local-First. Nie dodawaj zdalnej analityki ani telemetrii.
9. Nie zmieniaj wyglądu aplikacji poza niezbędnymi komunikatami bezpieczeństwa i obsługą konfliktów importu.
10. Nie deklaruj, że test przeszedł, jeśli faktycznie go nie uruchomiłeś. Nie maskuj błędów typowania ani nie wyłączaj TypeScript/ESLint w celu uzyskania zielonego wyniku.

## 2. Priorytet P1 — naprawa kolizji identyfikatorów przy imporcie teczki ucznia

Przeanalizuj `src/db/database.ts`, w szczególności `importStudentBundle()`.

Obecny problem: w trybie `MERGE_EXISTING` rekordy dziennika, ocen i aneksów otrzymują nowy `studentId`, ale zachowują stare `id`. Ponieważ `id` jest globalnym kluczem głównym tabel Dexie, kolizja może nadpisać wpis należący do innego ucznia.

Wprowadź bezpieczny mechanizm:
- nigdy nie nadpisuj rekordu innego ucznia z powodu kolizji ID;
- dla importowanych rekordów podrzędnych generuj nowe UUID, chyba że masz wiarygodną i jednoznaczną regułę wykrywania tego samego rekordu;
- twórz mapy `oldId -> newId` osobno dla dziennika, ocen i aneksów;
- aktualizuj referencje `linkedAnnexId` oraz `evaluationId` zgodnie z mapami;
- zweryfikuj, że wszystkie rekordy po imporcie wskazują na właściwego ucznia;
- cały zapis wykonuj w jednej transakcji Dexie;
- obsłuż ponowny import tego samego pliku tak, aby nie powodował niekontrolowanego mnożenia duplikatów. Jeżeli nie da się bezpiecznie rozpoznać duplikatu, pokaż użytkownikowi jasny wybór, zamiast zgadywać.

Dodaj test regresyjny, w którym:
- uczeń A ma wpis dziennika, ocenę i aneks;
- import ucznia B zawiera te same identyfikatory rekordów podrzędnych;
- import B nie może zmienić ani usunąć żadnego rekordu A;
- referencje między ocenami i aneksami B pozostają poprawne.

## 3. Priorytet P1 — bezpieczne scalanie pełnej kopii

Przeanalizuj `importFullDatabaseBundle()`.

Tryb `MERGE` nie może po cichu nadpisywać danych przez `bulkPut` przy kolizjach ID. Wprowadź:
- analizę konfliktów przed zapisem;
- jawne rozróżnienie rekordów nowych, identycznych, konfliktowych i niepoprawnych;
- bezpieczną strategię ID i mapowanie referencji;
- podsumowanie operacji dla użytkownika przed zatwierdzeniem;
- atomowy zapis;
- możliwość anulowania bez jakiejkolwiek zmiany bazy.

Tryb `REPLACE` ma wymagać wyraźnego potwierdzenia, wyświetlać ostrzeżenie o zastąpieniu całej lokalnej bazy i być wykonywany dopiero po kompletnej walidacji pakietu. Błąd podczas walidacji lub zapisu nie może pozostawić częściowo odtworzonej bazy.

Zachowaj istniejącą, zamierzoną regułę obsługi `appLock` z urządzenia docelowego, ale udokumentuj ją i przetestuj. Nie przenoś przypadkowo blokady z obcego urządzenia.

## 4. Priorytet P1 — pełna walidacja importowanych pakietów

Przeanalizuj `src/crypto/cryptoService.ts` i funkcje importu w `src/db/database.ts`.

Obecna walidacja odszyfrowanego pakietu jest zbyt płytka. Dodaj centralną walidację runtime dla:
- `SingleStudentBundle`;
- `FullDatabaseBundle`;
- `StudentProfile`;
- `JournalEntry`;
- `PeriodicEvaluation`;
- `ProgramModificationAnnex`;
- `FacilitySettings`;
- struktur WOPFU, IPET i Opinii PPP.

Waliduj:
- wymagane pola i ich typy;
- długości tekstów i limity tablic;
- daty i format `YYYY-MM-DD`;
- wartości enum;
- dodatnie i sensowne wartości godzin;
- unikalność identyfikatorów;
- spójność `studentId`;
- relacje `linkedAnnexId` i `evaluationId`;
- zakres i poprawność ustawień;
- maksymalny rozmiar wejścia i rozmiar po odszyfrowaniu.

Nie ufaj typom TypeScript — plik importu jest danymi zewnętrznymi. Nie używaj niezweryfikowanych danych bezpośrednio w `bulkPut`.

Walidacja musi nastąpić przed transakcją. Nieprawidłowy pakiet ma zostać odrzucony z czytelnym komunikatem, a baza musi pozostać niezmieniona. Nie poprawiaj po cichu błędnych danych w sposób, który zmienia ich znaczenie.

Zachowaj obsługę obecnego formatu szyfrowania: AES-GCM 256, PBKDF2-SHA256, obecny format archiwum i jego wersję. Jeżeli dodajesz nową wersję, stary format nadal musi dać się odczytać.

## 5. Priorytet P1 — realny zakres ochrony danych i blokada PIN

Przeanalizuj:
- `src/crypto/cryptoService.ts`;
- `src/components/security/AppLockScreen.tsx`;
- `src/components/SettingsView.tsx`;
- `src/App.tsx`;
- `src/config/appInfo.ts`;
- teksty informacyjne i komunikaty o RODO.

Ważne: obecna blokada jest blokadą interfejsu. Nie szyfruje rekordów w IndexedDB. Nie opisuj jej jako szyfrowania bazy ani pełnej ochrony danych. Hash PIN-u lokalnie nie zabezpiecza bazy przed odczytem poza interfejsem.

W tej iteracji:
- popraw teksty, aby jasno odróżniały blokadę interfejsu od szyfrowania eksportu;
- dodaj ograniczanie liczby błędnych prób, rosnące opóźnienie i czasową blokadę;
- mechanizm nie może resetować się po zwykłym odświeżeniu strony;
- nie blokuj legalnego dostępu na stałe i nie twórz mechanizmu utraty danych;
- nie zapisuj wpisywanego PIN-u/hasła w logach;
- nie osłabiaj PBKDF2;
- zalecaj mocne hasło zamiast krótkiego PIN-u przy danych rzeczywistych;
- pokaż użytkownikowi jasną informację, że baza lokalna nie jest obecnie szyfrowana w spoczynku i że urządzenie powinno mieć szyfrowany dysk oraz chronione konto systemowe.

Nie wdrażaj szyfrowania całej bazy w sposób pozorny. Jeżeli decydujesz się je wdrożyć, najpierw zaprojektuj bezpieczny model kluczy, obsługę zmiany hasła, migrację istniejących danych, odzyskiwanie/backup oraz odporność na przerwanie migracji. Migracja musi być odwracalna lub mieć sprawdzony backup przed rozpoczęciem. Nie wolno ryzykować utraty istniejących danych. Jeśli zakres jest zbyt duży na bezpieczną realizację w tej iteracji, pozostaw szyfrowanie bazy jako jawnie oznaczone zadanie przyszłe i nie udawaj, że zostało wykonane.

## 6. Priorytet P2 — kontrolowane aktualizacje PWA

Przeanalizuj `src/main.tsx` i `vite.config.ts`.

Obecna konfiguracja używa `registerSW({ immediate: true })` i `registerType: 'autoUpdate'`. Zapewnij bezpieczne zachowanie podczas edycji:
- wykrywaj nową wersję;
- pokaż komunikat, że aktualizacja jest dostępna;
- pozwól odroczyć aktualizację;
- aktywuj ją po świadomej decyzji lub bezpiecznym zakończeniu pracy;
- nie przeładowuj strony w trakcie edycji formularza z niezapisanymi zmianami;
- zachowaj poprawną obsługę offline i cache;
- nie zmieniaj `base`, ścieżek GitHub Pages ani istniejących zasobów bez testu wdrożenia.

Rozważ lokalne przechowywanie fontów, aby pierwsze uruchomienie offline nie zależało od Google Fonts. Jeżeli to zbyt duża zmiana, opisz ograniczenie w UI/dokumentacji.

## 7. Priorytet P2 — testy i CI

Dodaj testy automatyczne dopasowane do istniejącego stosu. Najpierw sprawdź kompatybilność wersji zależności, a następnie wybierz minimalny, stabilny zestaw narzędzi testowych.

Wymagane testy:
1. normalizatory i walidatory danych;
2. import/eksport pojedynczego ucznia;
3. pełny backup `MERGE` i `REPLACE`;
4. kolizje ID między uczniami;
5. referencje ocena–aneks;
6. rollback transakcji po błędzie;
7. uszkodzony plik, błędne hasło i zmieniony ciphertext;
8. limity rozmiaru i niepoprawne struktury;
9. migracja starszej bazy IndexedDB;
10. generator PDF — polskie znaki, długie treści, wielostronicowe tabele, stopki i podpisy;
11. PWA — cache, offline i aktualizacja.

Dodaj skrypt `test` do `package.json` i uruchamiaj testy w GitHub Actions przed publikacją. Nie usuwaj istniejącego kroku wdrażania GitHub Pages.

## 8. Priorytet P2 — aktualizacja podstaw prawnych

Przeanalizuj `src/config/appInfo.ts` i wszystkie miejsca, które generują podstawy prawne w PDF.

- Dodaj jawne pole „Stan prawny na dzień …”.
- Zweryfikuj każdy akt w oficjalnym ELI/Dzienniku Ustaw, nie tylko w wynikach wyszukiwarki.
- Prawo oświatowe wymaga uwzględnienia tekstu jednolitego Dz.U. 2025 poz. 1043, po sprawdzeniu oficjalnego tekstu i zmian.
- Sprawdź aktualne brzmienie rozporządzenia o kształceniu specjalnym, pomocy psychologiczno-pedagogicznej, dokumentacji przebiegu nauczania oraz ocenianiu.
- Nie wymyślaj paragrafów, terminów ani obowiązków.
- Nie zmieniaj treści merytorycznej dokumentów na podstawie domysłu.
- Zachowaj ostrzeżenie, że aplikacja wspiera dokumentowanie, ale nie zastępuje decyzji zespołu, dyrektora ani analizy obowiązujących przepisów.

Jeżeli nie możesz zweryfikować danego przepisu w oficjalnym źródle, nie zmieniaj go na podstawie przypuszczenia — oznacz do ręcznej weryfikacji.

## 9. Porządkowanie zależności i konfiguracji

Sprawdź użycie zależności:
- `@google/genai`;
- `dotenv`;
- `express`;
- `motion`;
- pozostałych zależności z `package.json`.

Nie usuwaj pakietu tylko dlatego, że nie ma oczywistego importu — sprawdź skrypty, konfigurację i wymagania środowiska Google AI Studio. Jeśli pakiet jest nieużywany, usuń go świadomie i zaktualizuj lockfile. Sprawdź `.env.example`: `GEMINI_API_KEY` i `APP_URL` nie są używane w widocznym kodzie. Usuń mylące wpisy albo opisz ich faktyczne przeznaczenie. Nie dodawaj żadnego backendu ani wywołań AI z danymi uczniów.

## 10. Wymagania końcowe i kryteria akceptacji

Po wykonaniu zmian:
1. Uruchom instalację zależności zgodnie z lockfile i środowiskiem projektu.
2. Uruchom `lint`/TypeScript.
3. Uruchom testy.
4. Uruchom `build`.
5. Sprawdź, czy artefakt `dist` powstaje poprawnie.
6. Sprawdź konfigurację GitHub Pages i PWA.
7. Przedstaw listę zmienionych plików oraz uzasadnienie każdej istotnej zmiany.
8. Przedstaw wyniki poleceń: kompilacja, lint, testy i build. Wklej rzeczywiste wyniki, nie deklaracje.
9. Wypisz wszystkie testy, których nie udało się uruchomić, z przyczyną.
10. Przygotuj instrukcję ręcznych testów akceptacyjnych na desktopie i Androidzie.
11. Nie oznaczaj wydania jako produkcyjne, jeśli choć jeden test krytyczny nie przeszedł.
12. Zwiększ wersję aplikacji dopiero po zakończeniu testów i zachowaj spójność `package.json` oraz `src/config/appInfo.ts`.

### Testy akceptacyjne — scenariusze krytyczne

**A. Import pojedynczego ucznia**
- Utwórz ucznia A z wpisem dziennika, oceną i aneksem.
- Przygotuj plik ucznia B z kolidującymi identyfikatorami rekordów.
- Zaimportuj B do bazy zawierającej A.
- Potwierdź, że A ma nadal dokładnie te same dane i relacje.
- Potwierdź, że rekordy B mają poprawne nowe ID i relacje.
- Ponów import i sprawdź zachowanie przy duplikatach.

**B. Pełny backup**
- Utwórz kopię bazy.
- Zmień dane lokalne.
- Odtwórz kopię w trybie `REPLACE`.
- Sprawdź wszystkie tabele i ustawienia.
- W trybie `MERGE` sprawdź kolizje i raport konfliktów.
- Wprowadź uszkodzony pakiet i potwierdź, że baza nie uległa zmianie.

**C. Ochrona**
- Włącz blokadę, wykonaj kilka błędnych prób i sprawdź opóźnienie.
- Odśwież stronę i sprawdź, czy licznik ograniczeń nie resetuje się.
- Zweryfikuj, że komunikaty nie twierdzą, iż IndexedDB jest szyfrowana, jeżeli nie jest.
- Sprawdź poprawne odblokowanie i brak utraty danych.

**D. Offline/PWA**
- Uruchom aplikację online i poczekaj na cache.
- Odłącz internet i uruchom aplikację ponownie.
- Otwórz kartotekę, edytuj formularz i zasymuluj dostępność aktualizacji.
- Potwierdź, że aktualizacja nie usuwa niezapisanych zmian.
- Sprawdź ponowne połączenie i aktualizację.

**E. Dokumenty**
- Wygeneruj wszystkie warianty PDF.
- Użyj polskich znaków, długich tekstów, wielu wpisów dziennika i wielu aneksów.
- Sprawdź łamanie stron, tabele, stopki, podpisy i wydruk A4.

## 11. Raport końcowy

Na końcu utwórz plik `AUDYT_NAPRAWA_CHANGELOG.md`, który zawiera:
- listę naprawionych problemów z ID audytu;
- listę zmienionych plików;
- opis migracji i kompatybilności;
- wyniki lint/test/build;
- znane ograniczenia;
- instrukcję wdrożenia;
- listę ręcznych testów do wykonania.

**Najważniejsza zasada:** integralność istniejących danych jest ważniejsza niż szybkość naprawy. Jeśli bezpieczne rozwiązanie wymaga dodatkowej migracji lub testu, wykonaj go przed wdrożeniem. Nie upraszczaj funkcji i nie usuwaj istniejących możliwości aplikacji.
