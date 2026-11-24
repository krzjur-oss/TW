import React, { useEffect, useState } from 'react';
import { Clock, Eye, EyeOff, Lock, ShieldAlert, Unlock } from 'lucide-react';
import { APP_INFO } from '../../config/appInfo';
import { verifyAppLockSecret } from '../../crypto/cryptoService';
import type { AppLockConfig } from '../../types/domain';
import {
  getRemainingLockSeconds,
  readLockThrottleState,
  recordFailedLockAttempt,
  resetLockThrottleState,
  type AppLockThrottleState,
} from '../../utils/appLockThrottle';
import type { AutoLockReason } from '../../utils/autoLockController';

interface AppLockScreenProps {
  schoolName: string;
  lockConfig: AppLockConfig;
  lockReason?: AutoLockReason | null;
  onUnlock: () => void;
}

function formatLockReasonBanner(
  reason: AutoLockReason | null | undefined,
  autoLockMinutes?: number,
): string | null {
  switch (reason) {
    case 'IDLE_TIMEOUT':
      return autoLockMinutes && autoLockMinutes > 0
        ? `Automatyczna blokada po ${autoLockMinutes} min bezczynności. Niezapisane dane formularza zostały zachowane do czasu odblokowania.`
        : 'Automatyczna blokada po czasie bezczynności.';
    case 'BACKGROUND':
      return 'Automatyczna blokada po przejściu karty lub aplikacji w tło.';
    case 'BACKGROUND_IDLE_ELAPSED':
      return 'Upłynął ustawiony czas bezczynności podczas nieobecności lub uśpienia urządzenia — aplikacja została zablokowana.';
    case 'MANUAL':
      return 'Aplikacja została zablokowana ręcznie przez użytkownika.';
    default:
      return null;
  }
}

export const AppLockScreen: React.FC<AppLockScreenProps> = ({
  schoolName,
  lockConfig,
  lockReason,
  onUnlock,
}) => {
  const [secret, setSecret] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [throttleState, setThrottleState] = useState<AppLockThrottleState>(() =>
    readLockThrottleState(),
  );
  const [nowMs, setNowMs] = useState(() => Date.now());

  const remainingSeconds = getRemainingLockSeconds(throttleState, nowMs);

  useEffect(() => {
    setThrottleState(readLockThrottleState());
    setNowMs(Date.now());
  }, []);

  useEffect(() => {
    if (remainingSeconds <= 0) return;
    const timer = window.setInterval(() => {
      setNowMs(Date.now());
    }, 500);
    return () => window.clearInterval(timer);
  }, [remainingSeconds]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentNow = Date.now();
    const latestThrottle = readLockThrottleState(currentNow);
    setThrottleState(latestThrottle);
    setNowMs(currentNow);

    const waitSeconds = getRemainingLockSeconds(latestThrottle, currentNow);
    if (waitSeconds > 0) {
      setError(
        `Zbyt wiele błędnych prób. Odczekaj ${waitSeconds} s przed kolejną próbą.`,
      );
      return;
    }

    if (!secret.trim()) {
      setError(
        lockConfig.mode === 'PIN'
          ? 'Wpisz kod PIN, aby odblokować interfejs aplikacji.'
          : 'Wpisz hasło, aby odblokować interfejs aplikacji.',
      );
      return;
    }

    setChecking(true);
    setError(null);
    try {
      const ok = await verifyAppLockSecret(secret, lockConfig);
      if (ok) {
        resetLockThrottleState();
        setThrottleState({
          failedAttempts: 0,
          lockedUntilMs: 0,
          lastFailedAtMs: 0,
        });
        setSecret('');
        onUnlock();
      } else {
        const failNow = Date.now();
        const nextThrottle = recordFailedLockAttempt(failNow);
        setThrottleState(nextThrottle);
        setNowMs(failNow);
        const cooldownSec = getRemainingLockSeconds(nextThrottle, failNow);

        if (cooldownSec > 0) {
          setError(
            `Nieprawidłowe dane dostępu (próba nr ${nextThrottle.failedAttempts}). Aktywowano czasowe opóźnienie na ${cooldownSec} s.`,
          );
        } else {
          setError(
            lockConfig.mode === 'PIN'
              ? `Nieprawidłowy kod PIN (nieudana próba nr ${nextThrottle.failedAttempts}).`
              : `Nieprawidłowe hasło (nieudana próba nr ${nextThrottle.failedAttempts}).`,
          );
        }
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
            Interfejs Teczki Wsparcia jest zablokowany
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {schoolName} · Blokada ekranu UI ·{' '}
            <span className="font-mono tabular-nums">v{APP_INFO.version}</span>
          </p>
        </div>

        {formatLockReasonBanner(lockReason, lockConfig.autoLockMinutes) && (
          <div className="rounded-lg border border-blue-200 bg-blue-50/80 px-3.5 py-2.5 text-xs leading-relaxed text-blue-950 dark:border-blue-800/70 dark:bg-blue-950/30 dark:text-blue-100">
            {formatLockReasonBanner(lockReason, lockConfig.autoLockMinutes)}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              {lockConfig.mode === 'PIN'
                ? 'Podaj lokalny kod PIN'
                : 'Podaj lokalne hasło interfejsu'}
            </label>
            <div className="relative">
              <input
                type={showSecret ? 'text' : 'password'}
                inputMode={lockConfig.mode === 'PIN' ? 'numeric' : 'text'}
                autoFocus
                disabled={remainingSeconds > 0 || checking}
                value={secret}
                onChange={(e) => {
                  setSecret(e.target.value);
                  setError(null);
                }}
                placeholder={
                  lockConfig.mode === 'PIN' ? '••••' : 'Wpisz hasło dostępu'
                }
                autoComplete="current-password"
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 pr-10 font-mono text-base tracking-wider text-slate-900 focus:border-blue-600 focus:outline-none disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
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

          {remainingSeconds > 0 && (
            <div
              role="status"
              className="flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3.5 py-2.5 text-xs font-medium text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100 tabular-nums"
            >
              <Clock className="h-4 w-4 shrink-0 text-amber-700 dark:text-amber-300" />
              <span>
                Czasowe ograniczenie prób po błędnym wpisie. Kolejna próba możliwa
                za <strong className="font-mono">{remainingSeconds} s</strong>{' '}
                (odświeżenie strony nie resetuje licznika).
              </span>
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-900 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={checking || remainingSeconds > 0}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-800 disabled:opacity-60 dark:bg-blue-600 dark:hover:bg-blue-500"
          >
            <Unlock className="h-4 w-4" />
            <span>
              {checking
                ? 'Weryfikacja...'
                : remainingSeconds > 0
                  ? `Zablokowano (${remainingSeconds} s)`
                  : 'Odblokuj dostęp'}
            </span>
          </button>
        </form>

        <div className="flex items-start gap-2.5 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs leading-relaxed text-slate-600 dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-400">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
          <div className="space-y-1">
            <p>
              <strong>Zakres ochrony:</strong> blokada PIN/hasłem chroni wyłącznie
              dostęp do interfejsu aplikacji (UI). Skrót hasła (PBKDF2 z solą)
              zapisywany jest lokalnie bez chmury i bez resetu e-mailem.
            </p>
            <p>
              <strong>Ważne (RODO):</strong> rekordy w bazie{' '}
              <code className="font-mono">IndexedDB</code> nie są obecnie
              szyfrowane w spoczynku — w odróżnieniu od eksportowanych plików{' '}
              <code className="font-mono">.ipet</code> (szyfrowanych{' '}
              <strong>AES-GCM 256-bit</strong>). Przy danych rzeczywistych stosuj
              szyfrowanie całego dysku urządzenia i chronione konto systemowe.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
