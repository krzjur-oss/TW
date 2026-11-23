import React, { useEffect, useState } from 'react';
import {
  Check,
  Copy,
  Download,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  RefreshCw,
  ShieldCheck,
  X,
} from 'lucide-react';
import {
  buildFullBackupFilename,
  buildStudentExportFilename,
  downloadEncryptedIpetFile,
  encryptBundleToIpetString,
  generateStrongPassword,
} from '../../crypto/cryptoService';
import {
  exportFullDatabaseBundle,
  exportStudentBundle,
} from '../../db/database';
import type { StudentProfile } from '../../types/domain';

interface EncryptedExportModalProps {
  open: boolean;
  mode: 'SINGLE_STUDENT' | 'FULL_DATABASE';
  student?: StudentProfile | null;
  onClose: () => void;
}

export const EncryptedExportModal: React.FC<EncryptedExportModalProps> = ({
  open,
  mode,
  student,
  onClose,
}) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exportedFile, setExportedFile] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setPassword('');
      setConfirmPassword('');
      setShowPassword(false);
      setCopied(false);
      setBusy(false);
      setError(null);
      setExportedFile(null);
    }
  }, [open, mode, student?.id]);

  if (!open) return null;

  const handleGeneratePassword = () => {
    const generated = generateStrongPassword();
    setPassword(generated);
    setConfirmPassword(generated);
    setShowPassword(true);
    setCopied(false);
    setError(null);
  };

  const handleCopyPassword = async () => {
    if (!password) return;
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setError(
        'Nie udało się skopiować do schowka — zaznacz i skopiuj hasło ręcznie.',
      );
    }
  };

  const handleExport = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('Hasło szyfrowania powinno mieć co najmniej 6 znaków.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Wpisane hasła nie są identyczne.');
      return;
    }

    setBusy(true);
    try {
      if (mode === 'SINGLE_STUDENT') {
        if (!student) {
          throw new Error('Nie wskazano ucznia do eksportu.');
        }
        const bundle = await exportStudentBundle(student.id);
        const encrypted = await encryptBundleToIpetString(
          'SINGLE_STUDENT',
          bundle,
          password,
        );
        const filename = buildStudentExportFilename(student);
        downloadEncryptedIpetFile(encrypted, filename);
        setExportedFile(filename);
      } else {
        const bundle = await exportFullDatabaseBundle();
        const encrypted = await encryptBundleToIpetString(
          'FULL_DATABASE',
          bundle,
          password,
        );
        const filename = buildFullBackupFilename();
        downloadEncryptedIpetFile(encrypted, filename);
        setExportedFile(filename);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Nie udało się zaszyfrować danych.',
      );
    } finally {
      setBusy(false);
    }
  };

  const title =
    mode === 'SINGLE_STUDENT'
      ? `Szyfrowany eksport ucznia (.ipet)`
      : 'Szyfrowany backup całej bazy (.ipet)';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 print:hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="encrypted-export-title"
    >
      <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-800 dark:bg-blue-950 dark:text-blue-200">
              <Lock className="h-4 w-4" />
            </div>
            <div>
              <h2
                id="encrypted-export-title"
                className="text-base font-semibold text-slate-900 dark:text-slate-100"
              >
                {title}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {mode === 'SINGLE_STUDENT' && student
                  ? `Teczka: ${student.firstName} ${student.lastName} (kl. ${student.className})`
                  : 'Wszyscy uczniowie, dzienniki, oceny, aneksy i ustawienia placówki'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Zamknij okno eksportu"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleExport} className="p-6 space-y-4">
          <div className="flex items-start gap-2.5 rounded-lg border border-teal-200 bg-teal-50/70 p-3 text-xs leading-relaxed text-teal-950 dark:border-teal-800/70 dark:bg-teal-950/30 dark:text-teal-100">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-teal-700 dark:text-teal-300" />
            <span>
              Plik zostanie zaszyfrowany lokalnie algorytmem{' '}
              <strong>AES-GCM 256-bit</strong> z kluczem wyprowadzonym przez{' '}
              <strong>PBKDF2-SHA256</strong>. Hasło nie jest nigdzie zapisywane
              — bez niego odszyfrowanie pliku nie będzie możliwe.
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Hasło szyfrujące plik .ipet
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleGeneratePassword}
                className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                <RefreshCw className="h-3 w-3" />
                <span>Generuj silne hasło</span>
              </button>
              <button
                type="button"
                disabled={!password}
                onClick={handleCopyPassword}
                className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3 text-teal-600" />
                    <span>Skopiowano</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    <span>Kopiuj hasło</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <div className="relative">
              <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                placeholder="Wpisz hasło (min. 6 znaków) lub wygeneruj"
                autoComplete="new-password"
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

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Powtórz hasło
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setError(null);
                }}
                placeholder="Wpisz ponownie hasło"
                autoComplete="new-password"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-900 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
              {error}
            </div>
          )}

          {exportedFile && (
            <div className="rounded-lg border border-teal-200 bg-teal-50 px-3.5 py-2.5 text-xs text-teal-900 dark:border-teal-800 dark:bg-teal-950/40 dark:text-teal-200">
              Pobrano zaszyfrowany plik:{' '}
              <strong className="font-mono">{exportedFile}</strong>. Przekaż
              hasło odbiorcy innym, bezpiecznym kanałem (np. telefonicznie /
              SMS).
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 pt-4 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Zamknij
            </button>
            <button
              type="submit"
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-800 disabled:opacity-60 dark:bg-blue-600 dark:hover:bg-blue-500"
            >
              <Download className="h-3.5 w-3.5" />
              <span>
                {busy ? 'Szyfrowanie...' : 'Zaszyfruj i pobierz .ipet'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
