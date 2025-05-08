# Discord Bot Moderacyjny

Wielofunkcyjny bot Discord napisany w Discord.js z systemem moderacji, weryfikacji użytkowników, reakcji na role, oraz unikalnym systemem "gulagu".

## Funkcjonalności

- **System Moderacji**:
  - Ostrzeżenia użytkowników z bazą danych SQLite
  - Zarządzanie ostrzeżeniami (wyświetlanie, usuwanie, czyszczenie)
  - Komendy wyrzucania (kick) i banowania użytkowników
  - Usuwanie wiadomości (czyszczenie czatu)
  
- **System Gulagu**:
  - Tymczasowe kary z automatycznym zakończeniem
  - Przechowywanie oryginalnych ról użytkownika i przywracanie ich po karze
  - Konfigurowalny czas trwania kar (sekundy, minuty, godziny, dni, tygodnie)
  - Persystencja kar po restartach bota

- **System Weryfikacji**:
  - Przydzielanie/usuwanie ról weryfikacyjnych
  - Konfigurowalny proces weryfikacji

- **Reakcje na Role**:
  - Przypisywanie ról na podstawie reakcji pod wiadomościami
  - Konfigurowalne emoji i przypisane do nich role

- **Predefiniowane Wiadomości**:
  - Wysyłanie zapisanych wcześniej wiadomości za pomocą komend

- **Panel Konfiguracyjny**:
  - Interfejs komend do konfiguracji bota bez edycji plików JSON

## Wymagania

- Node.js (wersja 16.x lub nowsza)
- Discord.js (v14.x)
- SQLite3
- Dostęp do API Discord

## Instalacja

1. Sklonuj repozytorium
   ```
   git clone <repozytorium>
   cd discord_bot
   ```

2. Zainstaluj zależności
   ```
   npm install
   ```

3. Utwórz plik `.env` w głównym katalogu i dodaj wymagane dane
   ```
   TOKEN=twoj_token_discord_bota
   APPLICATION_ID=twoj_application_id
   GUILD_ID=opcjonalne_id_serwera_do_testow
   ```

4. Zarejestruj komendy
   ```
   npm run deploy
   ```

5. Uruchom bota
   ```
   npm start
   ```

## Uruchamianie

Bot może być uruchomiony na dwa sposoby:

- **Windows**: Uruchom plik `start.bat`
- **Linux/macOS**: Uruchom plik `start.sh`

Dla deweloperów dostępny jest tryb z automatycznym odświeżaniem po zmianach:
```
npm run dev
```

## Komendy

### Moderacja

| Komenda | Parametry | Opis |
|---------|-----------|------|
| `/warn` | `user`, `reason` | Ostrzega użytkownika i zapisuje ostrzeżenie w bazie danych |
| `/warnings` | `user` | Wyświetla listę ostrzeżeń użytkownika |
| `/delwarn` | `id` | Usuwa konkretne ostrzeżenie |
| `/clearwarns` | `user` | Usuwa wszystkie ostrzeżenia użytkownika |
| `/kick` | `user`, `reason` | Wyrzuca użytkownika z serwera |
| `/ban` | `user`, `reason`, `delete_days` | Banuje użytkownika i opcjonalnie usuwa jego wiadomości |
| `/clear` | `count` | Usuwa określoną liczbę wiadomości (1-100) |

### Gulag

| Komenda | Parametry | Opis |
|---------|-----------|------|
| `/gulag` | `user`, `reason`, `duration` | Wysyła użytkownika do gulagu na określony czas |
| `/ungulag` | `user` | Wypuszcza użytkownika z gulagu |

**Formaty czasu dla `duration`**:
- `s` - sekundy (np. 30s)
- `m` - minuty (np. 15m)
- `h` - godziny (np. 2h)
- `d` - dni (np. 3d)
- `w` - tygodnie (np. 1w)

### Weryfikacja i Role

| Komenda | Parametry | Opis |
|---------|-----------|------|
| `/verify` | `user` | Weryfikuje użytkownika (usuwa rolę niezweryfikowanego, dodaje rolę zweryfikowanego) |
| `/reactionroles` | `channel` | Tworzy wiadomość z reakcjami przypisanymi do ról |
| `/message` | `type` | Wysyła predefiniowaną wiadomość |

### Konfiguracja

| Komenda | Parametry | Opis |
|---------|-----------|------|
| `/config` | | Otwiera panel konfiguracyjny bota |

## Konfiguracja

Wszystkie ustawienia są przechowywane w plikach JSON w katalogu `/config`:

| Plik | Opis |
|------|------|
| `gulag.json` | Konfiguracja systemu gulagu (kanały, role, wiadomości, limity czasowe) |
| `gulag_users.json` | Dane aktualnie uwięzionych użytkowników (automatycznie zarządzane) |
| `moderacja.json` | Konfiguracja narzędzi moderacyjnych (kanały logów, wiadomości) |
| `reakcje_role.json` | Konfiguracja systemu ról przyznawanych za reakcje |
| `weryfikacja.json` | Konfiguracja systemu weryfikacji użytkowników |
| `wiadomosci.json` | Predefiniowane wiadomości do wysyłania komendą `/message` |

## Struktura Projektu

```
discord_bot/
├── config/             # Pliki konfiguracyjne
├── data/               # Dane bazy danych SQLite
├── src/
│   ├── commands/       # Komendy dostępne dla użytkowników
│   ├── config-ui/      # System konfiguracji w postaci komend
│   │   ├── commands/   # Komendy konfiguracyjne
│   │   ├── handlers/   # Obsługa interakcji konfiguracyjnych
│   │   ├── utils/      # Narzędzia pomocnicze dla konfiguracji
│   │   └── views/      # Widoki interfejsu konfiguracyjnego
│   ├── events/         # Obsługa zdarzeń Discord (reakcje, wiadomości)
│   ├── utils/          # Narzędzia pomocnicze
│   ├── deploy-commands.js  # Skrypt do rejestracji komend slash
│   └── index.js        # Główny plik bota
├── .env                # Zmienne środowiskowe (token, ID)
├── package.json        # Zależności i skrypty npm
└── README.md           # Dokumentacja (ten plik)
```

## System Gulagu - Szczegóły

System gulagu pozwala na tymczasowe kary dla użytkowników:

1. **Działanie**: Bot zabiera wszystkie role użytkownika, przydziela rolę więźnia i automatycznie przywraca oryginalne role po zakończeniu kary
2. **Funkcje**:
   - Automatyczne wypuszczanie po określonym czasie
   - Dzienniki aktywności (logi)
   - Powiadomienia na kanale gulagu
   - Powiadomienia DM dla ukaranych użytkowników
   - Persystencja kar po restarcie bota
3. **Przykład użycia**:
   ```
   /gulag user:@użytkownik reason:spam duration:2h
   ```

## System Ostrzeżeń - Szczegóły

Bot posiada zaawansowany system ostrzeżeń:

1. **Cechy**:
   - Zapisywanie ostrzeżeń w bazie SQLite
   - Unikalny identyfikator dla każdego ostrzeżenia
   - Śledzenie ilości aktywnych ostrzeżeń
   - Opcje zarządzania ostrzeżeniami (delwarn, clearwarns)
2. **Przykład użycia**:
   ```
   /warn user:@użytkownik reason:Naruszenie zasad
   ```

## Wkład i Rozwój

Jeśli chcesz wprowadzić zmiany w bocie:
1. Sformatuj kod zgodnie z przyjętymi standardami
2. Testuj zmiany przed przesłaniem
3. Aktualizuj dokumentację w razie potrzeby

## Licencja

ISC
