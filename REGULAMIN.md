# Regulamin i Polityka Prywatności aplikacji „Teczka Wsparcia”

**Wersja 1.6.2 · obowiązuje od 24 listopada 2026 r.**

---

## § 1. Postanowienia ogólne

1. Niniejszy Regulamin określa zasady korzystania z aplikacji webowej PWA **„Teczka Wsparcia”** (dalej: „Aplikacja”), dostępnej pod adresem `https://krzjur-oss.github.io/TW/` lub uruchamianej lokalnie jako zainstalowana aplikacja PWA.
2. Właścicielem, twórcą i jedynym autorem Aplikacji jest **mgr Krzysztof Jureczek** (dalej: „Autor”).
3. Aplikacja dystrybuowana jest na warunkach **Wolnej Licencji Domowo-Edukacyjnej (Zastrzeżonej) — WLDE** (pełna treść w pliku `LICENSE.md` oraz wewnątrz Aplikacji). Regulamin i Licencja stanowią całość i obowiązują łącznie.
4. Rozpoczęcie korzystania z Aplikacji wymaga uprzedniego zapoznania się z treścią niniejszego Regulaminu i Licencji WLDE oraz ich wyraźnej akceptacji przy pierwszym uruchomieniu.

---

## § 2. Przeznaczenie Aplikacji

Aplikacja przeznaczona jest wyłącznie do:
1. **Użytku edukacyjnego i specjalistycznego w oświacie** — nieodpłatne wykorzystanie przez nauczycieli, wychowawców, pedagogów, pedagogów specjalnych, psychologów, logopedów i terapeutów oraz przez placówki oświatowe (przedszkola, szkoły podstawowe i ponadpodstawowe, szkoły specjalne, uczelnie, świetlice, placówki opiekuńczo-wychowawcze i terapeutyczne) w ramach pracy dydaktycznej, wychowawczej, opiekuńczej, terapeutycznej i wsparcia ucznia (WOPFU, IPET, dostosowania wymagań, obserwacje i oceny okresowe).
2. **Użytku domowego / prywatnego** — korzystanie przez osoby fizyczne w celach własnych, samokształceniowych i testowych.

Wszelkie inne zastosowania, w szczególności komercyjne lub odpłatne świadczenie usług z użyciem Aplikacji, wymagają uprzedniej pisemnej zgody Autora.

---

## § 3. Zasady korzystania

1. Aplikacja jest całkowicie bezpłatna dla zakresu wskazanego w § 2.
2. Aplikacja nie zawiera reklam, mikropłatności ani płatnych subskrypcji.
3. Użytkownik zobowiązuje się korzystać z Aplikacji zgodnie z jej przeznaczeniem, przepisami prawa oświatowego oraz przepisami o ochronie danych osobowych (RODO).
4. Zabronione jest podejmowanie działań mogących zakłócić działanie Aplikacji, obchodzić jej zabezpieczenia lub narazić innych użytkowników na szkodę.

---

## § 4. Prawa autorskie i licencja

Wszelkie prawa do Aplikacji — kod źródłowy, interfejs graficzny, projekt wizualny, treści wzorcowe i dokumentacja — należą wyłącznie do Autora i są chronione prawem autorskim.

| | |
|---|---|
| ❌ **Zabronione** | Kopiowanie, modyfikowanie, dekompilowanie, rozpowszechnianie, sprzedaż lub komercjalizacja Aplikacji bądź jej części bez pisemnej zgody Autora |
| ✅ **Dozwolone** | Bezpłatne korzystanie w placówkach edukacyjnych, przez nauczycieli i pedagogów oraz w użytku domowym (§ 2), eksport własnych dokumentów PDF / `.ipet` oraz udostępnianie linku do oryginalnej Aplikacji |

Szczegółowe warunki licencyjne określa plik `LICENSE.md`. W sprawach zgody na inne wykorzystanie prosimy o kontakt z Autorem.

---

## § 5. Dane i prywatność (RODO/GDPR)

1. Aplikacja działa w architekturze **100% Local-First**: **nie wymaga rejestracji ani logowania** i nie wysyła ani nie zbiera danych osobowych na zewnętrznych serwerach Autora.
2. Dane wprowadzane do Aplikacji (profile uczniów, dane z orzeczeń i opinii PPP, WOPFU, IPET, dostosowania wymagań, wpisy dziennika obserwacji, oceny okresowe, aneksy oraz ustawienia placówki) przechowywane są **wyłącznie lokalnie w pamięci przeglądarki użytkownika** (`IndexedDB` w bazie `TeczkaWsparciaLocalDB` oraz pomocnicze ustawienia stanu interfejsu i potwierdzenia regulaminu w `localStorage`) i nigdy nie opuszczają urządzenia użytkownika bez jego wyraźnej akcji eksportu.
3. Administratorem danych osobowych wprowadzanych do programu jest wyłącznie Użytkownik końcowy lub placówka oświatowa (szkoła, nauczyciel, pedagog, specjalista) — Autor nie ma technicznego dostępu do tych danych.
4. Aplikacja nie używa śledzących plików cookie, zewnętrznych narzędzi analitycznych, reklamowych systemów śledzenia ani zewnętrznych serwerów fontów (fonty są osadzone lokalnie).
5. **Zakres zabezpieczeń technicznych:** baza `IndexedDB` przeglądarki nie jest obecnie szyfrowana w spoczynku, a opcjonalna blokada PIN-em/hasłem zabezpiecza wyłącznie interfejs aplikacji (UI). Pełne szyfrowanie kryptograficzne (`AES-GCM 256-bit` + `PBKDF2-SHA256`) stosowane jest do eksportowanych plików i kopii zapasowych `.ipet`. W razie przetwarzania danych rzeczywistych uczniów na urządzeniu wymagane jest szyfrowanie dysku urządzenia, chronione konto systemowe oraz stosowanie mocnych haseł.
6. Użytkownik może w każdej chwili wyeksportować zaszyfrowaną kopię danych (`.ipet`) lub trwale usunąć swoje dane z przeglądarki.

---

## § 6. Odpowiedzialność

1. Aplikacja udostępniana jest w stanie „takim, jakim jest” (*as is*), bez jakichkolwiek gwarancji.
2. Aplikacja pełni rolę pomocniczego narzędzia organizacyjnego i nie zastępuje merytorycznych decyzji zespołu nauczycieli i specjalistów, dyrektora szkoły ani analizy obowiązujących przepisów prawa.
3. Autor nie ponosi odpowiedzialności za utratę danych, błędy działania, awarie sprzętu lub szkody wynikające z korzystania bądź niemożności korzystania z Aplikacji.
4. Zaleca się regularne tworzenie zaszyfrowanych kopii zapasowych `.ipet` oraz ich bezpieczne przechowywanie.

---

## § 7. Zmiany Regulaminu

Autor zastrzega sobie prawo do zmiany Regulaminu oraz aktualizacji Aplikacji bez uprzedzenia. W przypadku istotnych zmian Regulaminu Aplikacja może wymagać ponownego zapoznania się z nową treścią i jej akceptacji przed dalszym korzystaniem.

---

## § 8. Postanowienia końcowe

W sprawach nieuregulowanych niniejszym Regulaminem zastosowanie mają przepisy prawa polskiego, w szczególności Kodeksu cywilnego, ustawy o prawie autorskim i prawach pokrewnych oraz RODO.

Kontakt: kjureczek@proton.me · github.com/krzjur-oss

---

*© 2026 Krzysztof Jureczek · Wszelkie prawa zastrzeżone*
