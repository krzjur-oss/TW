export const APP_LOCK_THROTTLE_STORAGE_KEY =
  'teczka_wsparcia_app_lock_throttle_v1';

export interface AppLockThrottleState {
  failedAttempts: number;
  lockedUntilMs: number;
  lastFailedAtMs: number;
}

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const MAX_COOLDOWN_MS = 120_000;

/**
 * Wylicza opóźnienie (w ms) po N-tej błędnej próbie wpisania PIN-u lub hasła.
 * Czasowa blokada nigdy nie kasuje danych i ma górny limit 120 s.
 */
export function computeLockCooldownMs(failedAttempts: number): number {
  if (failedAttempts <= 2) return 0;
  if (failedAttempts === 3) return 5_000;
  if (failedAttempts === 4) return 15_000;
  if (failedAttempts === 5) return 30_000;
  if (failedAttempts === 6) return 60_000;
  return MAX_COOLDOWN_MS;
}

function getSafeStorage(storage?: StorageLike): StorageLike | null {
  if (storage) return storage;
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  return null;
}

export function readLockThrottleState(
  nowMs: number = Date.now(),
  storage?: StorageLike,
): AppLockThrottleState {
  const store = getSafeStorage(storage);
  if (!store) {
    return { failedAttempts: 0, lockedUntilMs: 0, lastFailedAtMs: 0 };
  }

  try {
    const raw = store.getItem(APP_LOCK_THROTTLE_STORAGE_KEY);
    if (!raw) {
      return { failedAttempts: 0, lockedUntilMs: 0, lastFailedAtMs: 0 };
    }
    const parsed = JSON.parse(raw) as Partial<AppLockThrottleState>;
    const failedAttempts =
      typeof parsed.failedAttempts === 'number' &&
      Number.isInteger(parsed.failedAttempts) &&
      parsed.failedAttempts >= 0
        ? parsed.failedAttempts
        : 0;
    const lastFailedAtMs =
      typeof parsed.lastFailedAtMs === 'number' &&
      Number.isFinite(parsed.lastFailedAtMs) &&
      parsed.lastFailedAtMs >= 0
        ? parsed.lastFailedAtMs
        : 0;
    let lockedUntilMs =
      typeof parsed.lockedUntilMs === 'number' &&
      Number.isFinite(parsed.lockedUntilMs) &&
      parsed.lockedUntilMs >= 0
        ? parsed.lockedUntilMs
        : 0;

    // Zabezpieczenie przed nieprawidłowym lub zbyt dalekim zegarem (nigdy > MAX_COOLDOWN_MS od teraz)
    if (lockedUntilMs > nowMs + MAX_COOLDOWN_MS) {
      lockedUntilMs = nowMs + MAX_COOLDOWN_MS;
    }

    return { failedAttempts, lockedUntilMs, lastFailedAtMs };
  } catch {
    return { failedAttempts: 0, lockedUntilMs: 0, lastFailedAtMs: 0 };
  }
}

export function getRemainingLockSeconds(
  state: AppLockThrottleState,
  nowMs: number = Date.now(),
): number {
  const diff = state.lockedUntilMs - nowMs;
  if (diff <= 0) return 0;
  return Math.ceil(diff / 1000);
}

export function recordFailedLockAttempt(
  nowMs: number = Date.now(),
  storage?: StorageLike,
): AppLockThrottleState {
  const current = readLockThrottleState(nowMs, storage);
  const failedAttempts = current.failedAttempts + 1;
  const cooldownMs = computeLockCooldownMs(failedAttempts);
  const next: AppLockThrottleState = {
    failedAttempts,
    lockedUntilMs: cooldownMs > 0 ? nowMs + cooldownMs : 0,
    lastFailedAtMs: nowMs,
  };

  const store = getSafeStorage(storage);
  if (store) {
    try {
      store.setItem(APP_LOCK_THROTTLE_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Ignoruj błędy zapisu localStorage (np. tryb prywatny z pełnym limitem)
    }
  }
  return next;
}

export function resetLockThrottleState(storage?: StorageLike): void {
  const store = getSafeStorage(storage);
  if (!store) return;
  try {
    store.removeItem(APP_LOCK_THROTTLE_STORAGE_KEY);
  } catch {
    // Ignoruj błędy localStorage
  }
}
