import React, { useState } from 'react';
import { Eye, EyeOff, Lock, ShieldAlert, Unlock } from 'lucide-react';
import { APP_INFO } from '../../config/appInfo';
import { verifyAppLockSecret } from '../../crypto/cryptoService';
import type { AppLockConfig } from '../../types/domain';

interface AppLockScreenProps {
  schoolName: string;
  lockConfig: AppLockConfig;
  onUnlock: () => void;
}

export const AppLockScreen: React.FC<AppLockScreenProps> = ({
  schoolName,
  lockConfig,
  onUnlock,
}) => {
  const [secret, setSecret] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!secret.trim()) {
      setError(
        lockConfig.mode === 'PIN'
          ? 'Wpisz kod PIN, aby odblokować aplikację.'
          : 'Wpisz hasło, aby odblokować aplikację.',
      );
      return;
    }

    setChecking(true);
    setError(null);
    try {
      const ok = await verifyAppLockSecret(secret, lockConfig);
      if (ok) {
        setSecret('');
        onUnlock();
      } else {
        setError(
          lockConfig.mode === 'PIN'
            ? 'Nieprawidłowy kod PIN. Spróbuj ponownie.'
            : 'Nieprawidłowe hasło. Spróbuj ponownie.',
        );
      }
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4 py-8 dark:bg-slate-950">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-7 shadow-lg dark:border-slate-800 dark:bg-slate-900 space-y-6">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-800 text-white">
            <Lock className="h-5 w-5" />
          </div>
          <h1 className="mt-4 font-display text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Teczka Wsparcia jest zablokowana
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {schoolName} · Ochrona dostępu lokalnego (RODO) ·{' '}
            <span className="font-mono tabular-nums">v{APP_INFO.version}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              {lockConfig.mode === 'PIN'
                ? 'Podaj lokalny kod PIN'
                : 'Podaj lokalne hasło aplikacji'}
            </label>
            <div className="relative">
              <input
                type={showSecret ? 'text' : 'password'}
                inputMode={lockConfig.mode === 'PIN' ? 'numeric' : 'text'}
                autoFocus
                value={secret}
                onChange={(e) => {
                  setSecret(e.target.value);
                  setError(null);
                }}
                placeholder={
                  lockConfig.mode === 'PIN' ? '••••' : 'Wpisz hasło dostępu'
                }
                autoComplete="current-password"
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 pr-10 font-mono text-base tracking-wider text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
              <button
                type="button"
                onClick={() => setShowSecret((prev) => !prev)}
                aria-label={showSecret ? 'Ukryj wpis' : 'Pokaż wpis'}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                {showSecret ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-900 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={checking}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-800 disabled:opacity-60 dark:bg-blue-600 dark:hover:bg-blue-500"
          >
            <Unlock className="h-4 w-4" />
            <span>{checking ? 'Weryfikacja...' : 'Odblokuj dostęp'}</span>
          </button>
        </form>

        <div className="flex items-start gap-2.5 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs leading-relaxed text-slate-600 dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-400">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
          <span>
            PIN i hasło są haszowane lokalnie (Web Crypto PBKDF2 z solą) i
            przechowywane wyłącznie w pamięci tego urządzenia. Nie istnieje
            odzyskiwanie hasła w chmurze ani reset e-mailem.
          </span>
        </div>
      </div>
    </div>
  );
};
