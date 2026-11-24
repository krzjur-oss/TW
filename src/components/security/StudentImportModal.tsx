import React, { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  EyeOff,
  FileUp,
  Info,
  KeyRound,
  LockOpen,
  UserCheck,
  UserPlus,
  X,
} from 'lucide-react';
import {
  decryptIpetArchive,
  type SingleStudentBundle,
} from '../../crypto/cryptoService';
import {
  analyzeSingleStudentImport,
  findMatchingStudentForImport,
  importStudentBundle,
  type SingleStudentImportAnalysis,
  type StudentImportStrategy,
  type StudentMergeDuplicatePolicy,
} from '../../db/database';
import { DOCUMENT_TYPE_LABELS, type StudentProfile } from '../../types/domain';
import {
  MAX_ARCHIVE_BYTES,
  MAX_ARCHIVE_MB,
  MAX_DECRYPTED_MB,
} from '../../validation/bundleValidation';

interface StudentImportModalProps {
  open: boolean;
  onClose: () => void;
  onImported: (studentId: string) => Promise<void>;
}

export const StudentImportModal: React.FC<StudentImportModalProps> = ({
  open,
  onClose,
  onImported,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [rawContent, setRawContent] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);

  const [decrypting, setDecrypting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [decryptedBundle, setDecryptedBundle] =
    useState<SingleStudentBundle | null>(null);
  const [existingMatch, setExistingMatch] = useState<StudentProfile | null>(
    null,
  );
  const [analysis, setAnalysis] =
    useState<SingleStudentImportAnalysis | null>(null);
  const [strategy, setStrategy] =
    useState<StudentImportStrategy>('CREATE_NEW');
  const [duplicatePolicy, setDuplicatePolicy] =
    useState<StudentMergeDuplicatePolicy>('UPDATE_MATCHING');

  useEffect(() => {
    if (open) {
      setFileName('');
      setRawContent('');
      setPassword('');
      setShowPassword(false);
      setDecrypting(false);
      setImporting(false);
      setError(null);
      setDecryptedBundle(null);
      setExistingMatch(null);
      setAnalysis(null);
      setStrategy('CREATE_NEW');
      setDuplicatePolicy('UPDATE_MATCHING');
    }
  }, [open]);

  if (!open) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setError(null);
    setDecryptedBundle(null);
    setExistingMatch(null);
    setAnalysis(null);

    if (!file) {
      setFileName('');
      setRawContent('');
      return;
    }

    if (file.size > MAX_ARCHIVE_BYTES) {
      setError(
        `Plik przekracza maksymalny bezpieczny rozmiar archiwum (${MAX_ARCHIVE_MB} MB; dane jawne do ${MAX_DECRYPTED_MB} MB).`,
      );
      return;
    }

    try {
      const text = await file.text();
      setFileName(file.name);
      setRawContent(text);
    } catch {
      setError('Nie udało się odczytać wybranego pliku.');
    }
  };

  const handleDecrypt = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!rawContent) {
      setError('Wybierz plik .ipet z dysku.');
      return;
    }

    setDecrypting(true);
    try {
      const { payload } = await decryptIpetArchive<SingleStudentBundle>(
        rawContent,
        password,
        'SINGLE_STUDENT',
      );
      const match = await findMatchingStudentForImport(payload.student);
      const importAnalysis = await analyzeSingleStudentImport(
        payload,
        match?.id,
      );
      setDecryptedBundle(payload);
      setExistingMatch(match);
      setAnalysis(importAnalysis);
      setStrategy(match ? 'MERGE_EXISTING' : 'CREATE_NEW');
      setDuplicatePolicy('UPDATE_MATCHING');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Nie udało się odszyfrować lub zweryfikować pliku .ipet.',
      );
    } finally {
      setDecrypting(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!decryptedBundle) return;
    setImporting(true);
    setError(null);
    try {
      const saved = await importStudentBundle(
        decryptedBundle,
        existingMatch ? strategy : 'CREATE_NEW',
        existingMatch?.id,
        duplicatePolicy,
      );
      await onImported(saved.id);
      onClose();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Nie udało się zapisać zaimportowanych danych w bazie IndexedDB.',
      );
    } finally {
      setImporting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 overflow-y-auto print:hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="student-import-title"
    >
      <div className="my-auto w-full max-w-xl rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-800 dark:bg-blue-950 dark:text-blue-200">
              <FileUp className="h-4 w-4" />
            </div>
            <div>
              <h2
                id="student-import-title"
                className="text-base font-semibold text-slate-900 dark:text-slate-100"
              >
                Import zaszyfrowanej teczki ucznia (.ipet)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Odszyfrowanie i walidacja spójności odbywają się w 100% lokalnie
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Zamknij okno importu"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[82vh] overflow-y-auto p-6 space-y-5">
          {!decryptedBundle ? (
            <form onSubmit={handleDecrypt} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  1. Wybierz plik z rozszerzeniem .ipet
                </label>
                <input
                  ref={fileInputRef}
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
                  2. Podaj hasło do odszyfrowania pliku
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
                    placeholder="Hasło użyte przy eksporcie pliku .ipet"
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
                    {decrypting ? 'Odszyfrowywanie...' : 'Odszyfruj i sprawdź'}
                  </span>
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="rounded-lg border border-teal-200 bg-teal-50/70 p-4 dark:border-teal-800 dark:bg-teal-950/30 space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-teal-900 dark:text-teal-200">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>Plik odszyfrowany i zweryfikowany poprawnie</span>
                </div>
                <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {decryptedBundle.student.firstName}{' '}
                  {decryptedBundle.student.lastName} · klasa{' '}
                  {decryptedBundle.student.className}
                </div>
                <div className="text-xs text-slate-700 dark:text-slate-300">
                  {DOCUMENT_TYPE_LABELS[decryptedBundle.student.documentType]} (
                  <span className="font-mono">
                    {decryptedBundle.student.pppDocument.documentNumber}
                  </span>
                  )
                </div>
                <div className="grid grid-cols-3 gap-2 pt-2 text-xs tabular-nums">
                  <div className="rounded border border-teal-200/80 bg-white/80 px-2.5 py-1.5 dark:border-teal-900 dark:bg-slate-950/60">
                    <div className="text-[11px] text-slate-500">Wpisy dziennika</div>
                    <div className="font-mono font-bold text-slate-900 dark:text-slate-100">
                      {decryptedBundle.journalEntries.length}
                    </div>
                  </div>
                  <div className="rounded border border-teal-200/80 bg-white/80 px-2.5 py-1.5 dark:border-teal-900 dark:bg-slate-950/60">
                    <div className="text-[11px] text-slate-500">Oceny okresowe</div>
                    <div className="font-mono font-bold text-slate-900 dark:text-slate-100">
                      {decryptedBundle.evaluations.length}
                    </div>
                  </div>
                  <div className="rounded border border-teal-200/80 bg-white/80 px-2.5 py-1.5 dark:border-teal-900 dark:bg-slate-950/60">
                    <div className="text-[11px] text-slate-500">Aneksy</div>
                    <div className="font-mono font-bold text-slate-900 dark:text-slate-100">
                      {decryptedBundle.annexes.length}
                    </div>
                  </div>
                </div>
              </div>

              {analysis && analysis.totalCrossStudentCollisions > 0 && (
                <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50/70 px-3.5 py-2.5 text-xs text-blue-950 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-100">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-700 dark:text-blue-300" />
                  <span>
                    Wykryto <strong>{analysis.totalCrossStudentCollisions}</strong>{' '}
                    rekordów podrzędnych o identyfikatorach występujących już w bazie
                    u innych uczniów. Podczas importu otrzymają one automatycznie
                    nowe bezpieczne identyfikatory UUID, bez naruszania danych
                    innych uczniów.
                  </span>
                </div>
              )}

              {existingMatch && (
                <div className="rounded-lg border border-amber-300 bg-amber-50/70 p-4 dark:border-amber-800 dark:bg-amber-950/30 space-y-3">
                  <div className="flex items-start gap-2 text-xs text-amber-950 dark:text-amber-100">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700 dark:text-amber-300" />
                    <div>
                      <strong>Wykryto istniejącą teczkę tego ucznia:</strong>{' '}
                      {existingMatch.firstName} {existingMatch.lastName} (kl.{' '}
                      {existingMatch.className}, rok {existingMatch.schoolYear}).
                      Wybierz sposób zapisu:
                    </div>
                  </div>

                  {analysis && (
                    <div className="grid grid-cols-3 gap-2 rounded-md border border-amber-200 bg-white/70 p-2.5 text-[11px] text-slate-700 dark:border-amber-900/60 dark:bg-slate-950/60 dark:text-slate-300 tabular-nums">
                      <div>
                        Nowe rekordy:{' '}
                        <strong className="font-mono text-slate-900 dark:text-slate-100">
                          {analysis.totalNew}
                        </strong>
                      </div>
                      <div>
                        Identyczne:{' '}
                        <strong className="font-mono text-slate-900 dark:text-slate-100">
                          {analysis.totalIdentical}
                        </strong>
                      </div>
                      <div>
                        Zmodyfikowane:{' '}
                        <strong className="font-mono text-slate-900 dark:text-slate-100">
                          {analysis.totalConflicts}
                        </strong>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="flex items-start gap-2.5 rounded-lg border border-slate-200 bg-white p-3 text-xs cursor-pointer dark:border-slate-700 dark:bg-slate-950">
                      <input
                        type="radio"
                        name="import-strategy"
                        checked={strategy === 'MERGE_EXISTING'}
                        onChange={() => setStrategy('MERGE_EXISTING')}
                        className="mt-0.5"
                      />
                      <div>
                        <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-slate-100">
                          <UserCheck className="h-3.5 w-3.5 text-blue-700 dark:text-blue-400" />
                          <span>Zaktualizuj / scal dane z istniejącym rekordem</span>
                        </div>
                        <p className="mt-0.5 text-slate-600 dark:text-slate-400">
                          Zaktualizuje kartę ucznia i doda nowe wpisy pod
                          obecnym identyfikatorem ucznia, z ochroną przed
                          powielaniem identycznych wpisów.
                        </p>
                      </div>
                    </label>

                    {strategy === 'MERGE_EXISTING' &&
                      analysis &&
                      (analysis.totalIdentical > 0 ||
                        analysis.totalConflicts > 0) && (
                        <div className="ml-4 space-y-1.5 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs dark:border-slate-700 dark:bg-slate-900/80">
                          <div className="font-semibold text-slate-800 dark:text-slate-200">
                            Zachowanie dla powtarzających się lub zmienionych wpisów:
                          </div>
                          <label className="flex items-start gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="duplicate-policy"
                              checked={duplicatePolicy === 'UPDATE_MATCHING'}
                              onChange={() =>
                                setDuplicatePolicy('UPDATE_MATCHING')
                              }
                              className="mt-0.5"
                            />
                            <span className="text-slate-700 dark:text-slate-300">
                              <strong>Aktualizuj zmienione i pomiń identyczne</strong>{' '}
                              (zalecane przy ponownym imporcie tego samego ucznia)
                            </span>
                          </label>
                          <label className="flex items-start gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="duplicate-policy"
                              checked={duplicatePolicy === 'KEEP_EXISTING'}
                              onChange={() =>
                                setDuplicatePolicy('KEEP_EXISTING')
                              }
                              className="mt-0.5"
                            />
                            <span className="text-slate-700 dark:text-slate-300">
                              <strong>Zachowaj istniejące lokalne</strong> i dopisz
                              tylko brakujące nowe wpisy
                            </span>
                          </label>
                          <label className="flex items-start gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="duplicate-policy"
                              checked={duplicatePolicy === 'ADD_AS_NEW'}
                              onChange={() => setDuplicatePolicy('ADD_AS_NEW')}
                              className="mt-0.5"
                            />
                            <span className="text-slate-700 dark:text-slate-300">
                              <strong>Dodaj wszystkie z pliku jako nowe kopie</strong>{' '}
                              (z nowymi identyfikatorami UUID)
                            </span>
                          </label>
                        </div>
                      )}

                    <label className="flex items-start gap-2.5 rounded-lg border border-slate-200 bg-white p-3 text-xs cursor-pointer dark:border-slate-700 dark:bg-slate-950">
                      <input
                        type="radio"
                        name="import-strategy"
                        checked={strategy === 'CREATE_NEW'}
                        onChange={() => setStrategy('CREATE_NEW')}
                        className="mt-0.5"
                      />
                      <div>
                        <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-slate-100">
                          <UserPlus className="h-3.5 w-3.5 text-teal-700 dark:text-teal-400" />
                          <span>Utwórz osobny rekord (nowa teczka)</span>
                        </div>
                        <p className="mt-0.5 text-slate-600 dark:text-slate-400">
                          Zapisze zaimportowanego ucznia oraz wszystkie jego wpisy
                          pod całkowicie nowymi identyfikatorami UUID, bez
                          modyfikowania istniejącej teczki.
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-900 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
                  {error}
                </div>
              )}

              <div className="flex items-center justify-between gap-2.5 border-t border-slate-100 pt-4 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setDecryptedBundle(null);
                    setExistingMatch(null);
                    setAnalysis(null);
                    setError(null);
                  }}
                  className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Wróć do wyboru pliku
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    Anuluj
                  </button>
                  <button
                    type="button"
                    disabled={importing}
                    onClick={handleConfirmImport}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-800 disabled:opacity-60 dark:bg-blue-600 dark:hover:bg-blue-500"
                  >
                    <span>
                      {importing
                        ? 'Zapisywanie w bazie...'
                        : existingMatch
                          ? strategy === 'MERGE_EXISTING'
                            ? 'Scal i zapisz w bazie'
                            : 'Utwórz osobną teczkę'
                          : 'Zapisz ucznia w bazie'}
                    </span>
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
