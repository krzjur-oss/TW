# PROMPT NAPRAWCZY — TECZKA WSPARCIA 1.6.1

Pracujesz nad istniejącym projektem Teczka Wsparcia w Google AI Studio. Wykonaj kontrolowany pakiet poprawek po audycie wersji 1.6.1.

## Bezwzględne warunki

1. Pracuj bezpośrednio na istniejącym projekcie.
2. Zachowaj obecny interfejs, układ nawigacji, nazewnictwo, styl wizualny i dotychczasowe funkcjonalności.
3. Nie usuwaj żadnej funkcji, obsługiwanego formatu, pola danych ani ścieżki dokumentacyjnej.
4. Zachowaj zgodność wsteczną bazy IndexedDB i istniejących plików `.ipet` w formacie v1.
5. Nie zmieniaj bez potrzeby algorytmów kryptograficznych, formatu archiwum, identyfikatorów rekordów ani semantyki MERGE/REPLACE.
6. Nie zastępuj istniejących modułów uproszczonymi implementacjami.
7. Każdą zmianę obejmij testami. Nie deklaruj testu jako zaliczonego, jeśli nie został faktycznie uruchomiony.
8. Nie umieszczaj prawdziwych danych uczniów w testach, logach ani danych demonstracyjnych.
9. Zanim zmienisz plik, przeanalizuj jego aktualną zawartość i zależności. Po zmianie sprawdź wszystkie miejsca wywołania zmienionych funkcji.

## Zadanie 1 — naprawa limitów eksportu i importu `.ipet` (P1)

Pliki do analizy:
- `src/crypto/cryptoService.ts`
- `src/validation/bundleValidation.ts`
- `tests/cryptoAndLock.test.ts`
- `tests/studentImport.test.ts`
- `tests/fullBackup.test.ts`

Problem:
Payload może mieć do 20 MB, ale po zaszyfrowaniu i kodowaniu Base64 całe archiwum może przekroczyć limit 25 MB. Wówczas program może utworzyć plik, którego własny importer nie zaakceptuje.

Wymagania:
1. Zaprojektuj spójne limity dla danych jawnych, szyfrogramu i całego pliku.
2. Uwzględnij narzut Base64, nagłówek JSON, IV, salt i tag uwierzytelniający AES-GCM.
3. Ustal jednoznacznie, czy limit odnosi się do bajtów UTF-8, czy znaków tekstu. Waliduj rzeczywisty rozmiar wejściowy.
4. Eksport ma odrzucać zbyt duże dane przed pobraniem pliku, z czytelnym komunikatem.
5. Każdy plik poprawnie wyeksportowany przez aplikację musi być akceptowany przez jej importer.
6. Zachowaj możliwość odczytu dotychczasowych archiwów `.ipet` v1.
7. Nie zmniejszaj po cichu limitów danych użytkownika. Jeśli konieczna jest zmiana limitu, pokaż ją w komunikacie i dokumentacji.
8. Dodaj testy graniczne: payload tuż poniżej limitu, na limicie i powyżej limitu; archiwum blisko limitu; uszkodzone i nadmiernie duże wejście.
9. Dodaj test round-trip: eksport → import → porównanie kompletności danych.

## Zadanie 2 — automatyczna blokada interfejsu (P1)

Pliki do analizy:
- `src/App.tsx`
- `src/components/security/AppLockScreen.tsx`
- `src/components/SettingsView.tsx`
- `src/types/domain.ts`
- `src/utils/appLockThrottle.ts`
- `tests/cryptoAndLock.test.ts`

Cel:
Dodać opcjonalną automatyczną blokadę interfejsu po bezczynności i po przejściu aplikacji do tła.

Wymagania:
1. Zachowaj istniejącą ręczną blokadę.
2. Dodaj ustawienie czasu bezczynności, np. 1, 5, 10, 15 minut oraz możliwość wyłączenia tej funkcji.
3. Ustal bezpieczne zachowanie przy `visibilitychange` i powrocie do aplikacji.
4. Po blokadzie powrót do danych wymaga ponownego podania PIN-u/hasła.
5. Aktywność użytkownika resetuje licznik bezczynności.
6. Nie dopuszczaj do tworzenia wielu timerów ani listenerów po rerenderach.
7. Poprawnie czyść timery i listenery przy odmontowaniu.
8. Obsłuż sytuacje, w których przeglądarka ogranicza timery w tle.
9. Nie zapisuj PIN-u ani hasła w localStorage, sessionStorage ani IndexedDB.
10. Zachowaj działanie istniejącego trwałego limitera błędnych prób.
11. Nie blokuj aplikacji podczas aktywnego wpisywania danych.
12. Ustawienie czasu blokady ma być czytelne i dostępne w istniejącym panelu ustawień.
13. Migracja ustawień istniejących użytkowników ma zachować dotychczasowe wartości i nie może powodować błędów.
14. Dodaj testy: ręczna blokada, bezczynność, przejście w tło, powrót, reset licznika, wyłączenie funkcji i sprzątanie listenerów.

Jeżeli blokada po `visibilitychange` ma powodować nadmierne utrudnienia w codziennej pracy, zastosuj rozsądny, jawnie opisany wariant ustawienia. Nie rezygnuj z ochrony bez wyjaśnienia.

## Zadanie 3 — dokumentacja wydania (P2)

Pliki:
- `package.json`
- `src/config/appInfo.ts`
- `AUDYT_NAPRAWA_CHANGELOG.md`

Wymagania:
1. Ujednolić numer wersji w całym projekcie.
2. Dodać wpis dla wersji 1.6.1 lub poprawić changelog tak, aby nie sugerował, że opisuje bieżące wydanie, jeśli dotyczy 1.6.0.
3. Nie zmieniać wersji zależności bez uzasadnienia.
4. Nie zmieniać formatu istniejących danych.

## Zadanie 4 — testy i kontrola jakości

Po wykonaniu poprawek:
1. Uruchom `bun run lint`.
2. Uruchom `bun run test --reporter=verbose`.
3. Uruchom `bun run build`.
4. Napraw wszystkie błędy wynikające z wprowadzonych zmian.
5. Sprawdź, czy service worker i manifest PWA nadal generują się poprawnie.
6. Sprawdź, czy względne ścieżki GitHub Pages pozostają poprawne.
7. Sprawdź, czy fonty pozostają lokalne i nie wymagają Google Fonts.
8. Sprawdź, czy generator PDF nie został naruszony.
9. Jeżeli nie można uruchomić któregokolwiek polecenia, podaj dokładną przyczynę i nie deklaruj sukcesu.

## Zadanie 5 — testy regresji i kompatybilności

Zweryfikuj:
- dodawanie, edycję i usuwanie ucznia;
- dziennik obserwacji;
- WOPFU;
- IPET;
- ścieżkę opinii PPP;
- oceny okresowe i aneksy;
- import pojedynczego ucznia;
- MERGE z zachowaniem lokalnych danych;
- REPLACE z potwierdzeniem;
- zachowanie lokalnej blokady urządzenia podczas odtwarzania;
- eksport i import zaszyfrowanych plików `.ipet` v1;
- migrację bazy v1 → v2;
- PDF i wydruk;
- pracę offline i aktualizację PWA;
- ochronę niezapisanych zmian.

## Zadanie 6 — raport końcowy

Utwórz plik `RAPORT_NAPRAW_1.6.2.md`, który zawiera:
1. listę zmienionych plików;
2. opis każdej poprawki;
3. opis migracji i zgodności wstecznej;
4. wyniki lint, testów i buildu — wyłącznie rzeczywiście uzyskane;
5. listę testów manualnych, których nie udało się wykonać;
6. znane ograniczenia;
7. numer końcowej wersji.

Jeśli zmiany zostaną wykonane poprawnie, przygotuj wydanie jako 1.6.2. Nie podnoś wersji, jeżeli nie wykonano i nie zweryfikowano wszystkich wymaganych zmian.

## Kryterium odbioru

Projekt ma zachować dotychczasowe funkcje i interfejs, a eksportowane archiwa muszą przechodzić własny import. Blokada automatyczna ma działać przewidywalnie i nie może powodować utraty niezapisanych danych. Wszystkie testy muszą być rzeczywiście uruchomione albo jawnie oznaczone jako niewykonane.

Najpierw przeanalizuj projekt, następnie wykonaj poprawki, a na końcu przeprowadź pełną kontrolę regresji. Nie ograniczaj się do wygenerowania planu — wprowadź zmiany w kodzie.
