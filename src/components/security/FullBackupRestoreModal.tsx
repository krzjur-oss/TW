import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  DatabaseBackup,
  Eye,
  EyeOff,
  Info,
  KeyRound,
  LockOpen,
  X,
} from 'lucide-react';
import {
  decryptIpetArchive,
  type FullDatabaseBundle,
} from '../../crypto/cryptoService';
import {
  analyzeFullDatabaseImport,
  importFullDatabaseBundle,
  type FullBackupConflictResolution,
  type FullBackupRestoreMode,
  type FullDatabaseImportAnalysis,
} from '../../db/database';
import { MAX_ARCHIVE_BYTES } from '../../validation/bundleValidation';

interface FullBackupRestoreModalProps {
  open: boolean;
  onClose: () => void;
  onRestored: () => Promise<void>;
}

export const FullBackupRestoreModal: React.FC<FullBackupRestoreModalProps> = ({
  open,
  onClose,
  onRestored,
}) => {
  const [fileName, setFileName] = useState('');
  const [rawContent, setRawContent] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [decrypting, setDecrypting] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bundle, setBundle] = useState<FullDatabaseBundle | null>(null);
  const [analysis, setAnalysis] =
    useState<FullDatabaseImportAnalysis | null>(null);
  const [restoreMode, setRestoreMode] =
    useState<FullBackupRestoreMode>('MERGE');
  const [conflictResolution, setConflictResolution] =
    useState<FullBackupConflictResolution>('KEEP_LOCAL');
  const [applyFacilitySettings, setApplyFacilitySettings] = useState(false);
  const [replaceConfirmed, setReplaceConfirmed] = useState(false);

  useEffect(() => {
    if (open) {
      setFileName('');
      setRawContent('');
      setPassword('');
      setShowPassword(false);
      setDecrypting(false);
      setRestoring(false);
      setError(null);
      setBundle(null);
      setAnalysis(null);
      setRestoreMode('MERGE');
      setConflictResolution('KEEP_LOCAL');
      setApplyFacilitySettings(false);
      setReplaceConfirmed(false);
    }
  }, [open]);

  if (!open) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setError(null);
    setBundle(null);
    setAnalysis(null);
    setReplaceConfirmed(false);

    if (!file) {
      setFileName('');
      setRawContent('');
      return;
    }

    if (file.size > MAX_ARCHIVE_BYTES) {
      setError('Plik kopii przekracza maksymalny bezpieczny rozmiar (25 MB).');
      return;
    }

    try {
      const text = await file.text();
      setFileName(file.name);
      setRawContent(text);
    } catch {
      setError('Nie udało się odczytać wybranego pliku backupu.');
    }
  };

  const handleDecrypt = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!rawContent) {
      setError('Wybierz zaszyfrowany plik backupu .ipet.');
      return;
    }

    setDecrypting(true);
    try {
      const { payload } = await decryptIpetArchive<FullDatabaseBundle>(
        rawContent,
        password,
        'FULL_DATABASE',
      );
      const importAnalysis = await analyzeFullDatabaseImport(payload);
      setBundle(payload);
      setAnalysis(importAnalysis);
      setRestoreMode('MERGE');
      setConflictResolution('KEEP_LOCAL');
      setApplyFacilitySettings(
        importAnalysis.existingDbCounts.studentsCount === 0,
      );
      setReplaceConfirmed(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Nie udało się odszyfrować lub zweryfikować pliku kopii zapasowej.',
      );
    } finally {
      setDecrypting(false);
    }
  };

  const handleConfirmRestore = async () => {
    if (!bundle) return;
    if (restoreMode === 'REPLACE' && !replaceConfirmed) {
      setError(
        'Zaznacz potwierdzenie, aby zastąpić całą lokalną bazę danych.',
      );
      return;
    }
    setRestoring(true);
    setError(null);
    try {
      await importFullDatabaseBundle(bundle, restoreMode, {
        conflictResolution,
        applyFacilitySettings,
        confirmReplace: replaceConfirmed,
      });
      await onRestored();
      onClose();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Błąd podczas odtwarzania danych w IndexedDB.',
      );
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 overflow-y-auto print:hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="full-restore-title"
    >
      <div className="my-auto w-full max-w-xl rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-800 dark:bg-blue-950 dark:text-blue-200">
              <DatabaseBackup className="h-4 w-4" />
            </div>
            <div>
              <h2
                id="full-restore-title"
                className="text-base font-semibold text-slate-900 dark:text-slate-100"
              >
                Odtwórz pełną bazę z zaszyfrowanego backupu
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Przywraca profile uczniów, dzienniki, oceny, aneksy oraz
                ustawienia placówki po weryfikacji spójności
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Zamknij okno odtwarzania"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[82vh] overflow-y-auto p-6 space-y-5">
          {!bundle ? (
            <form onSubmit={handleDecrypt} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  1. Wybierz zaszyfrowany plik pełnego backupu (.ipet)
                </label>
                <input
                  type="file"
                  accept=".ipet,application/octet-stream,application/json"
                  onChange={handleFileChange}
                  className="block w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-slate-900 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-slate-800 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:file:bg-slate-100 dark:file:text-slate-900"
                />
                {fileName && (
                  <div className="mt-1.5 font-mono text-xs text-slate-500 dark:text-slate-400">
                    Wybrano: {fileName}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  2. Hasło szyfrowania backupu
                </label>
                <div className="relative">
                  <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError(null);
                    }}
                    placeholder="Hasło użyte podczas tworzenia kopii"
                    autoComplete="off"
                    className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-10 font-mono text-sm text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Ukryj hasło' : 'Pokaż hasło'}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-900 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 pt-4 dark:border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  disabled={decrypting || !rawContent}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-800 disabled:opacity-50 dark:bg-blue-600 dark:hover:bg-blue-500"
                >
                  <LockOpen className="h-3.5 w-3.5" />
                  <span>
                    {decrypting
                      ? 'Odszyfrowywanie i analiza...'
                      : 'Odszyfruj i sprawdź kopię'}
                  </span>
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="rounded-lg border border-teal-200 bg-teal-50/70 p-4 dark:border-teal-800 dark:bg-teal-950/30 space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-teal-900 dark:text-teal-200">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>Kopia bazy odszyfrowana i zweryfikowana</span>
                </div>
                <div className="text-xs text-slate-700 dark:text-slate-300">
                  Placówka w kopii:{' '}
                  <strong>{bundle.facilitySettings.schoolName}</strong>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs tabular-nums">
                  <div className="rounded border border-teal-200/80 bg-white/80 px-2.5 py-1.5 dark:border-teal-900 dark:bg-slate-950/60">
                    <div className="text-[11px] text-slate-500">Uczniowie</div>
                    <div className="font-mono font-bold text-slate-900 dark:text-slate-100">
                      {bundle.students.length}
                    </div>
                  </div>
                  <div className="rounded border border-teal-200/80 bg-white/80 px-2.5 py-1.5 dark:border-teal-900 dark:bg-slate-950/60">
                    <div className="text-[11px] text-slate-500">Dziennik</div>
                    <div className="font-mono font-bold text-slate-900 dark:text-slate-100">
                      {bundle.journalEntries.length}
                    </div>
                  </div>
                  <div className="rounded border border-teal-200/80 bg-white/80 px-2.5 py-1.5 dark:border-teal-900 dark:bg-slate-950/60">
                    <div className="text-[11px] text-slate-500">Oceny</div>
                    <div className="font-mono font-bold text-slate-900 dark:text-slate-100">
                      {bundle.evaluations.length}
                    </div>
                  </div>
                  <div className="rounded border border-teal-200/80 bg-white/80 px-2.5 py-1.5 dark:border-teal-900 dark:bg-slate-950/60">
                    <div className="text-[11px] text-slate-500">Aneksy</div>
                    <div className="font-mono font-bold text-slate-900 dark:text-slate-100">
                      {bundle.annexes.length}
                    </div>
                  </div>
                </div>
              </div>

              {analysis && (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5 text-xs space-y-2 dark:border-slate-700 dark:bg-slate-950/70">
                  <div className="font-semibold text-slate-900 dark:text-slate-100">
                    Analiza porównawcza przed zapisem (tryb scalania):
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] tabular-nums">
                    <div className="rounded border border-slate-200 bg-white px-2.5 py-1.5 dark:border-slate-800 dark:bg-slate-900">
                      <div className="text-slate-500">Nowe rekordy</div>
                      <div className="font-mono font-bold text-teal-700 dark:text-teal-300">
                        {analysis.totalNew}
                      </div>
                    </div>
                    <div className="rounded border border-slate-200 bg-white px-2.5 py-1.5 dark:border-slate-800 dark:bg-slate-900">
                      <div className="text-slate-500">Identyczne</div>
                      <div className="font-mono font-bold text-slate-700 dark:text-slate-300">
                        {analysis.totalIdentical}
                      </div>
                    </div>
                    <div className="rounded border border-slate-200 bg-white px-2.5 py-1.5 dark:border-slate-800 dark:bg-slate-900">
                      <div className="text-slate-500">Konflikty treści</div>
                      <div className="font-mono font-bold text-amber-700 dark:text-amber-300">
                        {analysis.totalConflicts}
                      </div>
                    </div>
                    <div className="rounded border border-slate-200 bg-white px-2.5 py-1.5 dark:border-slate-800 dark:bg-slate-900">
                      <div className="text-slate-500">Kolizje ID</div>
                      <div className="font-mono font-bold text-blue-700 dark:text-blue-300">
                        {analysis.totalCrossCollisions}
                      </div>
                    </div>
                  </div>

                  {analysis.conflictSummaries.length > 0 && (
                    <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-amber-900 dark:text-amber-200">
                      {analysis.conflictSummaries.map((msg) => (
                        <li key={msg}>{msg}</li>
                      ))}
                    </ul>
                  )}

                  {analysis.localHasAppLock && (
                    <div className="flex items-start gap-1.5 text-[11px] text-slate-600 dark:text-slate-400">
                      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-500" />
                      <span>
                        Lokalna blokada interfejsu (PIN/hasło) na tym urządzeniu
                        zostanie zachowana i nie zostanie przejęta z innego
                        urządzenia.
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2.5">
                <label className="flex items-start gap-2.5 rounded-lg border border-slate-200 bg-slate-50/70 p-3 text-xs cursor-pointer dark:border-slate-700 dark:bg-slate-950">
                  <input
                    type="radio"
                    name="restore-mode"
                    checked={restoreMode === 'MERGE'}
                    onChange={() => {
                      setRestoreMode('MERGE');
                      setReplaceConfirmed(false);
                      setError(null);
                    }}
                    className="mt-0.5"
                  />
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-slate-100">
                      Scal z obecną bazą (bezpieczne łączenie danych)
                    </div>
                    <p className="mt-0.5 text-slate-600 dark:text-slate-400">
                      Dopisuje brakujących uczniów i rekordy z ochroną przed
                      kolizjami identyfikatorów między uczniami.
                    </p>
                  </div>
                </label>

                {restoreMode === 'MERGE' && analysis && (
                  <div className="ml-4 space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs dark:border-slate-700 dark:bg-slate-900/80">
                    {analysis.totalConflicts > 0 && (
                      <div className="space-y-1.5">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          Rozstrzyganie wykrytych konfliktów ({analysis.totalConflicts}):
                        </div>
                        <label className="flex items-start gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="merge-conflict-resolution"
                            checked={conflictResolution === 'KEEP_LOCAL'}
                            onChange={() => setConflictResolution('KEEP_LOCAL')}
                            className="mt-0.5"
                          />
                          <span className="text-slate-700 dark:text-slate-300">
                            <strong>Zachowaj lokalne rekordy przy konflikcie</strong>{' '}
                            (najbezpieczniejsze — dopisuje tylko nowe dane z kopii)
                          </span>
                        </label>
                        <label className="flex items-start gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="merge-conflict-resolution"
                            checked={
                              conflictResolution === 'OVERWRITE_WITH_BACKUP'
                            }
                            onChange={() =>
                              setConflictResolution('OVERWRITE_WITH_BACKUP')
                            }
                            className="mt-0.5"
                          />
                          <span className="text-slate-700 dark:text-slate-300">
                            <strong>Nadpisz zmienione rekordy wersją z kopii</strong>{' '}
                            (zawsze zachowuje ochronę przed kolizjami innych uczniów)
                          </span>
                        </label>
                      </div>
                    )}

                    {analysis.facilitySettingsChanged && (
                      <label className="flex items-start gap-2 cursor-pointer pt-1">
                        <input
                          type="checkbox"
                          checked={applyFacilitySettings}
                          onChange={(e) =>
                            setApplyFacilitySettings(e.target.checked)
                          }
                          className="mt-0.5"
                        />
                        <span className="text-slate-700 dark:text-slate-300">
                          Zastosuj także ustawienia placówki z kopii (nazwa
                          szkoły, adres, dyrektor — bez zmiany lokalnej blokady
                          ekranu)
                        </span>
                      </label>
                    )}
                  </div>
                )}

                <label className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50/50 p-3 text-xs cursor-pointer dark:border-red-900/60 dark:bg-red-950/20">
                  <input
                    type="radio"
                    name="restore-mode"
                    checked={restoreMode === 'REPLACE'}
                    onChange={() => {
                      setRestoreMode('REPLACE');
                      setError(null);
                    }}
                    className="mt-0.5"
                  />
                  <div>
                    <div className="font-semibold text-red-900 dark:text-red-200">
                      Zastąp całą obecną bazę (pełne odtworzenie stanu z kopii)
                    </div>
                    <p className="mt-0.5 text-red-800/90 dark:text-red-300/90">
                      Trwale usuwa obecnych uczniów (
                      {analysis?.existingDbCounts.studentsCount ?? 0}),
                      dzienniki, oceny i aneksy na tym urządzeniu, a następnie
                      atomowo wczytuje zawartość kopii (z zachowaniem lokalnej
                      blokady ekranu).
                    </p>
                  </div>
                </label>

                {restoreMode === 'REPLACE' && (
                  <label className="ml-4 flex items-start gap-2 rounded-lg border border-red-300 bg-red-50 p-3 text-xs font-medium text-red-950 cursor-pointer dark:border-red-800 dark:bg-red-950/40 dark:text-red-100">
                    <input
                      type="checkbox"
                      checked={replaceConfirmed}
                      onChange={(e) => {
                        setReplaceConfirmed(e.target.checked);
                        setError(null);
                      }}
                      className="mt-0.5"
                    />
                    <span>
                      Rozumiem, że wszystkie obecne dane uczniów na tym
                      urządzeniu zostaną całkowicie zastąpione zawartością tego
                      pliku kopii zapasowej.
                    </span>
                  </label>
                )}
              </div>

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-900 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
                  {error}
                </div>
              )}

              <div className="flex items-center justify-between gap-2.5 border-t border-slate-100 pt-4 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setBundle(null);
                    setAnalysis(null);
                    setReplaceConfirmed(false);
                    setError(null);
                  }}
                  className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Wróć
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    Anuluj bez zmian
                  </button>
                  <button
                    type="button"
                    disabled={
                      restoring ||
                      (restoreMode === 'REPLACE' && !replaceConfirmed)
                    }
                    onClick={handleConfirmRestore}
                    className={`rounded-lg px-4 py-2 text-xs font-semibold text-white transition-colors disabled:opacity-60 ${
                      restoreMode === 'REPLACE'
                        ? 'bg-red-700 hover:bg-red-800 dark:bg-red-600 dark:hover:bg-red-500'
                        : 'bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500'
                    }`}
                  >
                    {restoring
                      ? 'Odtwarzanie...'
                      : restoreMode === 'REPLACE'
                        ? 'Zastąp bazę i przywróć kopię'
                        : 'Scal dane z kopią'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
