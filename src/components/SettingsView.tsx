import React, { useEffect, useState } from 'react';
import {
  Check,
  Database,
  DatabaseBackup,
  Download,
  FlaskConical,
  KeyRound,
  Lock,
  Moon,
  ShieldCheck,
  Sun,
  Trash2,
  Unlock,
} from 'lucide-react';
import { APP_INFO } from '../config/appInfo';
import {
  createAppLockConfig,
  verifyAppLockSecret,
} from '../crypto/cryptoService';
import type { DatabaseStats } from '../db/database';
import {
  SCHOOL_TYPE_OPTIONS,
  type AppLockMode,
  type FacilitySettings,
  type ThemeMode,
} from '../types/domain';
import { PWAInstallButton } from './PWAInstallButton';
import { TestDataStamp } from './TestDataStamp';
import { EncryptedExportModal } from './security/EncryptedExportModal';
import { FullBackupRestoreModal } from './security/FullBackupRestoreModal';

interface SettingsViewProps {
  settings: FacilitySettings;
  stats: DatabaseStats;
  hasTestStudentLoaded: boolean;
  hasTestOpinionLoaded: boolean;
  onSaveSettings: (
    patch: Partial<Omit<FacilitySettings, 'id'>>,
  ) => Promise<void>;
  onToggleTestStudent: () => Promise<void>;
  onLoadTestOpinionStudent: () => Promise<void>;
  onDatabaseRestored: () => Promise<void>;
  onLockNow: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  stats,
  hasTestStudentLoaded,
  hasTestOpinionLoaded,
  onSaveSettings,
  onToggleTestStudent,
  onLoadTestOpinionStudent,
  onDatabaseRestored,
  onLockNow,
}) => {
  const [schoolName, setSchoolName] = useState(settings.schoolName);
  const [schoolType, setSchoolType] = useState(settings.schoolType);
  const [address, setAddress] = useState(settings.address ?? '');
  const [city, setCity] = useState(settings.city);
  const [directorName, setDirectorName] = useState(settings.directorName);
  const [defaultSchoolYear, setDefaultSchoolYear] = useState(
    settings.defaultSchoolYear,
  );
  const [defaultTeamRole, setDefaultTeamRole] = useState(
    settings.defaultTeamRole,
  );
  const [savedNotice, setSavedNotice] = useState(false);
  const [testActionBusy, setTestActionBusy] = useState(false);

  const [fullExportOpen, setFullExportOpen] = useState(false);
  const [fullRestoreOpen, setFullRestoreOpen] = useState(false);
  const [restoreNotice, setRestoreNotice] = useState<string | null>(null);

  const [lockMode, setLockMode] = useState<AppLockMode>(
    settings.appLock?.mode ?? 'PIN',
  );
  const [currentSecret, setCurrentSecret] = useState('');
  const [newSecret, setNewSecret] = useState('');
  const [confirmSecret, setConfirmSecret] = useState('');
  const [lockBusy, setLockBusy] = useState(false);
  const [lockError, setLockError] = useState<string | null>(null);
  const [lockSuccess, setLockSuccess] = useState<string | null>(null);

  useEffect(() => {
    setSchoolName(settings.schoolName);
    setSchoolType(settings.schoolType);
    setAddress(settings.address ?? '');
    setCity(settings.city);
    setDirectorName(settings.directorName);
    setDefaultSchoolYear(settings.defaultSchoolYear);
    setDefaultTeamRole(settings.defaultTeamRole);
    if (settings.appLock?.mode) {
      setLockMode(settings.appLock.mode);
    }
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSaveSettings({
      schoolName: schoolName.trim() || 'Szkoła Podstawowa nr 1',
      schoolType,
      address: address.trim(),
      city: city.trim(),
      directorName: directorName.trim(),
      defaultSchoolYear: defaultSchoolYear.trim() || '2026/2027',
      defaultTeamRole: defaultTeamRole.trim(),
    });
    setSavedNotice(true);
    window.setTimeout(() => setSavedNotice(false), 3000);
  };

  const handleThemeChange = async (theme: ThemeMode) => {
    await onSaveSettings({ theme });
  };

  const handleTestToggle = async () => {
    setTestActionBusy(true);
    try {
      await onToggleTestStudent();
    } finally {
      setTestActionBusy(false);
    }
  };

  const lockEnabled = Boolean(settings.appLock?.enabled);

  const validateNewSecret = (mode: AppLockMode, value: string): string | null => {
    if (mode === 'PIN') {
      if (!/^\d{4,8}$/.test(value)) {
        return 'Kod PIN powinien składać się z od 4 do 8 cyfr.';
      }
      return null;
    }
    if (value.length < 6) {
      return 'Hasło aplikacji powinno mieć co najmniej 6 znaków.';
    }
    return null;
  };

  const handleSaveLock = async (e: React.FormEvent) => {
    e.preventDefault();
    setLockError(null);
    setLockSuccess(null);

    if (lockEnabled && settings.appLock) {
      const validCurrent = await verifyAppLockSecret(
        currentSecret,
        settings.appLock,
      );
      if (!validCurrent) {
        setLockError('Obecny kod PIN lub hasło jest nieprawidłowe.');
        return;
      }
    }

    const validationErr = validateNewSecret(lockMode, newSecret);
    if (validationErr) {
      setLockError(validationErr);
      return;
    }
    if (newSecret !== confirmSecret) {
      setLockError('Wpisane wartości w obu polach nie są identyczne.');
      return;
    }

    setLockBusy(true);
    try {
      const nextLock = await createAppLockConfig(lockMode, newSecret);
      await onSaveSettings({ appLock: nextLock });
      setCurrentSecret('');
      setNewSecret('');
      setConfirmSecret('');
      setLockSuccess(
        lockEnabled
          ? 'Zaktualizowano lokalną blokadę aplikacji.'
          : 'Włączono lokalną blokadę ekranu aplikacji.',
      );
    } catch (err) {
      setLockError(
        err instanceof Error ? err.message : 'Nie udało się zapisać blokady.',
      );
    } finally {
      setLockBusy(false);
    }
  };

  const handleDisableLock = async () => {
    if (!settings.appLock) return;
    setLockError(null);
    setLockSuccess(null);

    if (!currentSecret) {
      setLockError(
        'Podaj obecny PIN lub hasło, aby wyłączyć blokadę aplikacji.',
      );
      return;
    }

    setLockBusy(true);
    try {
      const valid = await verifyAppLockSecret(currentSecret, settings.appLock);
      if (!valid) {
        setLockError('Obecny kod PIN lub hasło jest nieprawidłowe.');
        return;
      }
      await onSaveSettings({ appLock: undefined });
      setCurrentSecret('');
      setNewSecret('');
      setConfirmSecret('');
      setLockSuccess('Wyłączono lokalną blokadę ekranu aplikacji.');
    } finally {
      setLockBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Lewa kolumna: formularz placówki + blokada PIN/hasło */}
        <div className="lg:col-span-2 space-y-6">
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 space-y-5"
        >
          <div className="border-b border-slate-100 pb-4 dark:border-slate-800">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Ustawienia placówki i środowiska pracy
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Dane placówki zapisywane są lokalnie i automatycznie umieszczane w nagłówkach wydruków oraz dokumentów PDF (IPET, WOPFU, oceny okresowe i karty obserwacji).
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Nazwa szkoły lub placówki
              </label>
              <input
                type="text"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                placeholder="np. Szkoła Podstawowa nr 12 im. Jana Pawła II"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Typ placówki
              </label>
              <select
                value={schoolType}
                onChange={(e) => setSchoolType(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              >
                {SCHOOL_TYPE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Miejscowość
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="np. Kraków"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Adres placówki (ulica, kod pocztowy)
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="np. ul. Szkolna 14, 30-001 Kraków"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Dyrektor placówki
              </label>
              <input
                type="text"
                value={directorName}
                onChange={(e) => setDirectorName(e.target.value)}
                placeholder="np. mgr Janina Malinowska"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Domyślny rok szkolny
              </label>
              <input
                type="text"
                value={defaultSchoolYear}
                onChange={(e) => setDefaultSchoolYear(e.target.value)}
                placeholder="2026/2027"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Domyślna rola osoby tworzącej wpisy
              </label>
              <input
                type="text"
                value={defaultTeamRole}
                onChange={(e) => setDefaultTeamRole(e.target.value)}
                placeholder="np. Pedagog specjalny / Wychowawca klasy"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4 dark:border-slate-800">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
              Motyw wyświetlania
            </label>
            <div className="inline-flex rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
              <button
                type="button"
                onClick={() => handleThemeChange('light')}
                className={`inline-flex items-center gap-2 rounded-md px-3.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  settings.theme === 'light'
                    ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-950 dark:text-slate-100'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                }`}
              >
                <Sun className="h-3.5 w-3.5" />
                <span>Jasny dzienny</span>
              </button>
              <button
                type="button"
                onClick={() => handleThemeChange('dark')}
                className={`inline-flex items-center gap-2 rounded-md px-3.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  settings.theme === 'dark'
                    ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-950 dark:text-slate-100'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                }`}
              >
                <Moon className="h-3.5 w-3.5" />
                <span>Ciemny</span>
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
            <div className="text-xs text-teal-700 dark:text-teal-300">
              {savedNotice && (
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <Check className="h-4 w-4" />
                  Zapisano ustawienia placówki w pamięci urządzenia.
                </span>
              )}
            </div>
            <button
              type="submit"
              className="rounded-lg bg-blue-700 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 whitespace-nowrap shrink-0"
            >
              Zapisz ustawienia placówki
            </button>
          </div>
        </form>

        {/* Blokada ekranu PIN-em / hasłem */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 space-y-5">
          <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
            <div className="flex items-start gap-2.5">
              <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200 shrink-0">
                <Lock className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  Blokada ekranu aplikacji (PIN / hasło)
                </h3>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  Stan:{' '}
                  <strong className="text-slate-800 dark:text-slate-200">
                    {lockEnabled
                      ? settings.appLock?.mode === 'PIN'
                        ? 'Aktywna (kod PIN)'
                        : 'Aktywna (hasło)'
                      : 'Wyłączona'}
                  </strong>
                </p>
              </div>
            </div>

            {lockEnabled && (
              <button
                type="button"
                onClick={onLockNow}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800 whitespace-nowrap shrink-0"
              >
                <Lock className="h-3.5 w-3.5" />
                <span>Zablokuj aplikację teraz</span>
              </button>
            )}
          </div>

          <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-3 text-xs leading-relaxed text-amber-950 dark:border-amber-800/70 dark:bg-amber-950/30 dark:text-amber-100">
            PIN i hasło są haszowane lokalnie (<strong>Web Crypto PBKDF2 z solą</strong>)
            i przechowywane wyłącznie w tym urządzeniu. Nie istnieje żaden
            system odzyskiwania hasła w chmurze ani reset e-mailem.
          </div>

          <form onSubmit={handleSaveLock} className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300 mr-1">
                Typ blokady:
              </span>
              <div className="inline-flex rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setLockMode('PIN');
                    setNewSecret('');
                    setConfirmSecret('');
                    setLockError(null);
                  }}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                    lockMode === 'PIN'
                      ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-950 dark:text-slate-100'
                      : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  Kod PIN (4–8 cyfr)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLockMode('PASSWORD');
                    setNewSecret('');
                    setConfirmSecret('');
                    setLockError(null);
                  }}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                    lockMode === 'PASSWORD'
                      ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-950 dark:text-slate-100'
                      : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  Hasło tekstowe (min. 6 znaków)
                </button>
              </div>
            </div>

            {lockEnabled && (
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Obecny PIN / hasło (wymagane do zmiany lub wyłączenia)
                </label>
                <input
                  type="password"
                  value={currentSecret}
                  onChange={(e) => {
                    setCurrentSecret(e.target.value);
                    setLockError(null);
                  }}
                  placeholder="Wpisz obecny PIN lub hasło"
                  autoComplete="current-password"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {lockEnabled
                    ? lockMode === 'PIN'
                      ? 'Nowy kod PIN'
                      : 'Nowe hasło'
                    : lockMode === 'PIN'
                      ? 'Ustaw kod PIN (4–8 cyfr)'
                      : 'Ustaw hasło (min. 6 znaków)'}
                </label>
                <input
                  type="password"
                  inputMode={lockMode === 'PIN' ? 'numeric' : 'text'}
                  value={newSecret}
                  onChange={(e) => {
                    setNewSecret(e.target.value);
                    setLockError(null);
                  }}
                  placeholder={lockMode === 'PIN' ? 'np. 2580' : 'Min. 6 znaków'}
                  autoComplete="new-password"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Powtórz {lockMode === 'PIN' ? 'PIN' : 'hasło'}
                </label>
                <input
                  type="password"
                  inputMode={lockMode === 'PIN' ? 'numeric' : 'text'}
                  value={confirmSecret}
                  onChange={(e) => {
                    setConfirmSecret(e.target.value);
                    setLockError(null);
                  }}
                  placeholder="Powtórz wartość"
                  autoComplete="new-password"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>
            </div>

            {lockError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2 text-xs text-red-900 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
                {lockError}
              </div>
            )}

            {lockSuccess && (
              <div className="rounded-lg border border-teal-200 bg-teal-50 px-3.5 py-2 text-xs text-teal-900 dark:border-teal-800 dark:bg-teal-950/40 dark:text-teal-200">
                {lockSuccess}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-end gap-2.5 pt-1">
              {lockEnabled && (
                <button
                  type="button"
                  disabled={lockBusy}
                  onClick={handleDisableLock}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-xs font-semibold text-red-900 transition-colors hover:bg-red-100 disabled:opacity-60 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200 dark:hover:bg-red-900/50"
                >
                  <Unlock className="h-3.5 w-3.5" />
                  <span>Wyłącz blokadę</span>
                </button>
              )}
              <button
                type="submit"
                disabled={lockBusy}
                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-slate-800 disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
              >
                <KeyRound className="h-3.5 w-3.5" />
                <span>
                  {lockEnabled ? 'Zmień PIN / hasło' : 'Włącz blokadę aplikacji'}
                </span>
              </button>
            </div>
          </form>
        </div>
        </div>

        {/* Prawa kolumna: Kopia zapasowa całej bazy, Dane testowe i Local-First */}
        <div className="space-y-6">
          {/* Pełny zaszyfrowany backup bazy */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <div className="flex items-center gap-2">
              <DatabaseBackup className="h-4 w-4 text-blue-700 dark:text-blue-400" />
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Pełny backup bazy (RODO)
              </h3>
            </div>

            <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              Eksportuje i odtwarza całą bazę <code className="font-mono">IndexedDB</code>{' '}
              (wszystkich uczniów, dzienniki, oceny, aneksy i ustawienia szkoły)
              w jednym pliku <code className="font-mono">.ipet</code> szyfrowanym{' '}
              <strong>AES-GCM 256-bit</strong>.
            </p>

            {restoreNotice && (
              <div className="rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-xs text-teal-900 dark:border-teal-800 dark:bg-teal-950/40 dark:text-teal-200">
                {restoreNotice}
              </div>
            )}

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => setFullExportOpen(true)}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500"
              >
                <Download className="h-4 w-4 shrink-0" />
                <span>Eksportuj całą bazę (.ipet)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setRestoreNotice(null);
                  setFullRestoreOpen(true);
                }}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <DatabaseBackup className="h-4 w-4 shrink-0" />
                <span>Odtwórz bazę z pliku backupu</span>
              </button>
            </div>
          </div>
          {/* Sekcja danych testowych */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <FlaskConical className="h-4 w-4 text-amber-700 dark:text-amber-300" />
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  Dane testowe
                </h3>
              </div>
              <TestDataStamp />
            </div>

            <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              Pozwala szybko przetestować listę uczniów, filtrowanie, dziennik obserwacji oraz strukturę WOPFU/IPET bez wprowadzania danych prawdziwego ucznia. Profil testowy jest oznaczony etykietą <strong>DANE TESTOWE</strong>.
            </p>

            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-300">
              Stan w bazie:{' '}
              <strong>
                {hasTestStudentLoaded
                  ? 'Wczytano przykładowego ucznia testowego (Jan Kowalski, kl. 5B)'
                  : 'Brak ucznia testowego w bazie'}
              </strong>
            </div>

            <button
              type="button"
              disabled={testActionBusy}
              onClick={handleTestToggle}
              className={`inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-xs font-semibold transition-colors disabled:opacity-60 ${
                hasTestStudentLoaded
                  ? 'border border-red-300 bg-red-50 text-red-900 hover:bg-red-100 dark:border-red-800 dark:bg-red-950/60 dark:text-red-200 dark:hover:bg-red-900/60'
                  : 'bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200'
              }`}
            >
              {hasTestStudentLoaded ? (
                <>
                  <Trash2 className="h-4 w-4 shrink-0" />
                  <span>Usuń przykładowych uczniów testowych (DANE TESTOWE)</span>
                </>
              ) : (
                <>
                  <FlaskConical className="h-4 w-4 shrink-0" />
                  <span>Wczytaj przykładowego ucznia testowego (DANE TESTOWE)</span>
                </>
              )}
            </button>

            {!hasTestOpinionLoaded && (
              <button
                type="button"
                disabled={testActionBusy}
                onClick={async () => {
                  setTestActionBusy(true);
                  try {
                    await onLoadTestOpinionStudent();
                  } finally {
                    setTestActionBusy(false);
                  }
                }}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <FlaskConical className="h-3.5 w-3.5 shrink-0" />
                <span>Wczytaj też przykład dla Opinii PPP (Ścieżka B)</span>
              </button>
            )}
          </div>

          {/* Sekcja prywatności i pamięci lokalnej */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-slate-600 dark:text-slate-300" />
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Pamięć lokalna i PWA
              </h3>
            </div>

            <dl className="divide-y divide-slate-100 text-xs dark:divide-slate-800">
              <div className="flex justify-between py-2">
                <dt className="text-slate-500 dark:text-slate-400">Teczki uczniów</dt>
                <dd className="font-mono font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                  {stats.studentsCount}
                </dd>
              </div>
              <div className="flex justify-between py-2">
                <dt className="text-slate-500 dark:text-slate-400">Wpisy dziennika</dt>
                <dd className="font-mono font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                  {stats.journalEntriesCount}
                </dd>
              </div>
              <div className="flex justify-between py-2">
                <dt className="text-slate-500 dark:text-slate-400">Oceny okresowe</dt>
                <dd className="font-mono font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                  {stats.evaluationsCount}
                </dd>
              </div>
              <div className="flex justify-between py-2">
                <dt className="text-slate-500 dark:text-slate-400">Aneksy i wersje</dt>
                <dd className="font-mono font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                  {stats.annexesCount}
                </dd>
              </div>
              <div className="flex justify-between py-2">
                <dt className="text-slate-500 dark:text-slate-400">Wersja programu</dt>
                <dd className="font-mono font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                  v{APP_INFO.version}
                </dd>
              </div>
            </dl>

            <div className="flex items-start gap-2.5 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs leading-relaxed text-slate-600 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-300">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-teal-700 dark:text-teal-400" />
              <span>
                Architektura Local-First: dane nie opuszczają przeglądarki. Brak zewnętrznych serwerów i kont chmurowych.
              </span>
            </div>

            <div className="pt-1">
              <PWAInstallButton variant="settings" />
            </div>
          </div>
        </div>
      </div>

      <EncryptedExportModal
        open={fullExportOpen}
        mode="FULL_DATABASE"
        onClose={() => setFullExportOpen(false)}
      />

      <FullBackupRestoreModal
        open={fullRestoreOpen}
        onClose={() => setFullRestoreOpen(false)}
        onRestored={async () => {
          await onDatabaseRestored();
          setRestoreNotice(
            'Odtworzono bazę danych z zaszyfrowanej kopii zapasowej.',
          );
        }}
      />
    </div>
  );
};
