import type {
  AppLockConfig,
  AutoLockMinutes,
  BackgroundLockPolicy,
} from '../types/domain';

export type AutoLockReason =
  | 'MANUAL'
  | 'IDLE_TIMEOUT'
  | 'BACKGROUND'
  | 'BACKGROUND_IDLE_ELAPSED';

export const AUTO_LOCK_MINUTE_OPTIONS: ReadonlyArray<{
  value: AutoLockMinutes;
  label: string;
}> = [
  { value: 0, label: 'Wyłączona (tylko ręczna i przy starcie)' },
  { value: 1, label: 'Po 1 minucie bezczynności' },
  { value: 5, label: 'Po 5 minutach bezczynności (zalecane)' },
  { value: 10, label: 'Po 10 minutach bezczynności' },
  { value: 15, label: 'Po 15 minutach bezczynności' },
];

export const BACKGROUND_LOCK_POLICY_OPTIONS: ReadonlyArray<{
  value: BackgroundLockPolicy;
  label: string;
  description: string;
}> = [
  {
    value: 'RESPECT_IDLE',
    label: 'Sprawdzaj bezczynność w tle i przy powrocie (zalecane)',
    description:
      'Szybkie przełączenie na inną kartę (np. po numer orzeczenia) nie zablokuje ekranu od razu, ale po upływie wybranego czasu w tle lub po uśpieniu urządzenia blokada włączy się natychmiast po powrocie.',
  },
  {
    value: 'IMMEDIATE',
    label: 'Blokuj natychmiast po ukryciu karty lub minimalizacji',
    description:
      'Każde przejście do innej karty, innej aplikacji lub zminimalizowanie okna od razu blokuje ekran (zalecane na komputerach współdzielonych w pokoju nauczycielskim).',
  },
  {
    value: 'OFF',
    label: 'Nie blokuj automatycznie na zdarzenie przełączenia karty',
    description:
      'Licznik bezczynności działa wyłącznie w oparciu o aktywność w otwartym oknie, bez dodatkowej reakcji na zdarzenie visibilitychange.',
  },
];

const VALID_MINUTE_VALUES = new Set<AutoLockMinutes>([0, 1, 5, 10, 15]);
const VALID_BACKGROUND_POLICIES = new Set<BackgroundLockPolicy>([
  'OFF',
  'RESPECT_IDLE',
  'IMMEDIATE',
]);

export function normalizeAutoLockMinutes(
  value: unknown,
  fallback: AutoLockMinutes = 0,
): AutoLockMinutes {
  if (
    typeof value === 'number' &&
    VALID_MINUTE_VALUES.has(value as AutoLockMinutes)
  ) {
    return value as AutoLockMinutes;
  }
  return fallback;
}

export function normalizeBackgroundLockPolicy(
  value: unknown,
  fallback: BackgroundLockPolicy = 'RESPECT_IDLE',
): BackgroundLockPolicy {
  if (
    typeof value === 'string' &&
    VALID_BACKGROUND_POLICIES.has(value as BackgroundLockPolicy)
  ) {
    return value as BackgroundLockPolicy;
  }
  return fallback;
}

export function resolveEffectiveAutoLockConfig(
  lockConfig: AppLockConfig | undefined,
): {
  enabled: boolean;
  autoLockMinutes: AutoLockMinutes;
  backgroundLockPolicy: BackgroundLockPolicy;
} {
  if (!lockConfig?.enabled) {
    return {
      enabled: false,
      autoLockMinutes: 0,
      backgroundLockPolicy: 'OFF',
    };
  }
  return {
    enabled: true,
    // Dla starszych rekordów bez nowego pola zachowujemy dotychczasowe zachowanie (0 = brak wymuszonej auto-blokady)
    autoLockMinutes: normalizeAutoLockMinutes(lockConfig.autoLockMinutes, 0),
    backgroundLockPolicy: normalizeBackgroundLockPolicy(
      lockConfig.backgroundLockPolicy,
      lockConfig.autoLockMinutes === undefined ? 'OFF' : 'RESPECT_IDLE',
    ),
  };
}

export interface EventTargetLike {
  addEventListener: (
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
  ) => void;
  removeEventListener: (
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions,
  ) => void;
}

export interface DocumentLike extends EventTargetLike {
  visibilityState?: DocumentVisibilityState;
}

export interface AutoLockControllerOptions {
  enabled: boolean;
  autoLockMinutes: AutoLockMinutes;
  backgroundLockPolicy: BackgroundLockPolicy;
  onLock: (reason: AutoLockReason) => void;
  now?: () => number;
  targetWindow?: EventTargetLike | null;
  targetDocument?: DocumentLike | null;
}

export interface AutoLockController {
  destroy: () => void;
  notifyActivity: () => void;
  getLastActivityAtMs: () => number;
  isDestroyed: () => boolean;
}

const IMMEDIATE_ACTIVITY_EVENTS = [
  'keydown',
  'input',
  'compositionupdate',
  'pointerdown',
  'touchstart',
  'wheel',
] as const;

const MOUSE_THROTTLE_MS = 2_000;

export function createAutoLockController(
  options: AutoLockControllerOptions,
): AutoLockController {
  const now = options.now ?? (() => Date.now());
  const targetWindow: EventTargetLike | null =
    options.targetWindow !== undefined
      ? options.targetWindow
      : typeof window !== 'undefined'
        ? window
        : null;
  const targetDocument: DocumentLike | null =
    options.targetDocument !== undefined
      ? options.targetDocument
      : typeof document !== 'undefined'
        ? document
        : null;

  const autoLockMinutes = normalizeAutoLockMinutes(options.autoLockMinutes, 0);
  const backgroundLockPolicy = normalizeBackgroundLockPolicy(
    options.backgroundLockPolicy,
    'RESPECT_IDLE',
  );
  const idleTimeoutMs = autoLockMinutes > 0 ? autoLockMinutes * 60_000 : 0;
  const shouldActivate =
    options.enabled &&
    (idleTimeoutMs > 0 || backgroundLockPolicy === 'IMMEDIATE');

  let destroyed = false;
  let lockTriggered = false;
  let lastActivityAtMs = now();
  let lastMouseMoveAtMs = 0;
  let idleTimerId: ReturnType<typeof globalThis.setTimeout> | null = null;
  let heartbeatTimerId: ReturnType<typeof globalThis.setInterval> | null = null;

  const clearTimers = () => {
    if (idleTimerId !== null) {
      globalThis.clearTimeout(idleTimerId);
      idleTimerId = null;
    }
    if (heartbeatTimerId !== null) {
      globalThis.clearInterval(heartbeatTimerId);
      heartbeatTimerId = null;
    }
  };

  const triggerLock = (reason: AutoLockReason) => {
    if (destroyed || lockTriggered) return;
    lockTriggered = true;
    cleanupListenersAndTimers();
    options.onLock(reason);
  };

  const scheduleIdleTimer = () => {
    if (idleTimerId !== null) {
      globalThis.clearTimeout(idleTimerId);
      idleTimerId = null;
    }
    if (destroyed || lockTriggered || !shouldActivate || idleTimeoutMs <= 0) {
      return;
    }
    const elapsed = Math.max(0, now() - lastActivityAtMs);
    const remaining = Math.max(50, idleTimeoutMs - elapsed);
    idleTimerId = globalThis.setTimeout(() => {
      evaluateIdle('IDLE_TIMEOUT');
    }, remaining);
  };

  const evaluateIdle = (
    reason: 'IDLE_TIMEOUT' | 'BACKGROUND_IDLE_ELAPSED',
  ) => {
    if (destroyed || lockTriggered || !shouldActivate || idleTimeoutMs <= 0) {
      return;
    }
    const elapsed = now() - lastActivityAtMs;
    if (elapsed >= idleTimeoutMs) {
      triggerLock(reason);
      return;
    }
    scheduleIdleTimer();
  };

  const handleActivity = () => {
    if (destroyed || lockTriggered || !shouldActivate) return;
    lastActivityAtMs = now();
    if (idleTimeoutMs > 0) {
      scheduleIdleTimer();
    }
  };

  const handleMouseMove = () => {
    if (destroyed || lockTriggered || !shouldActivate) return;
    const current = now();
    if (current - lastMouseMoveAtMs < MOUSE_THROTTLE_MS) {
      return;
    }
    lastMouseMoveAtMs = current;
    handleActivity();
  };

  const handleScroll = () => {
    handleActivity();
  };

  const handleVisibilityChange = () => {
    if (destroyed || lockTriggered || !shouldActivate) return;
    const visibilityState = targetDocument?.visibilityState;

    if (visibilityState === 'hidden') {
      if (backgroundLockPolicy === 'IMMEDIATE') {
        triggerLock('BACKGROUND');
      }
      return;
    }

    if (visibilityState === 'visible') {
      if (backgroundLockPolicy === 'RESPECT_IDLE' && idleTimeoutMs > 0) {
        evaluateIdle('BACKGROUND_IDLE_ELAPSED');
      }
    }
  };

  const handleWindowFocus = () => {
    if (destroyed || lockTriggered || !shouldActivate) return;
    if (backgroundLockPolicy === 'RESPECT_IDLE' && idleTimeoutMs > 0) {
      evaluateIdle('BACKGROUND_IDLE_ELAPSED');
    }
  };

  const cleanupListenersAndTimers = () => {
    clearTimers();
    if (targetWindow) {
      for (const evt of IMMEDIATE_ACTIVITY_EVENTS) {
        targetWindow.removeEventListener(evt, handleActivity, true);
      }
      targetWindow.removeEventListener('mousemove', handleMouseMove, true);
      targetWindow.removeEventListener('scroll', handleScroll, true);
      targetWindow.removeEventListener('focus', handleWindowFocus);
    }
    if (targetDocument) {
      targetDocument.removeEventListener(
        'visibilitychange',
        handleVisibilityChange,
      );
    }
  };

  if (shouldActivate) {
    if (targetWindow) {
      for (const evt of IMMEDIATE_ACTIVITY_EVENTS) {
        targetWindow.addEventListener(evt, handleActivity, {
          passive: true,
          capture: true,
        });
      }
      targetWindow.addEventListener('mousemove', handleMouseMove, {
        passive: true,
        capture: true,
      });
      targetWindow.addEventListener('scroll', handleScroll, {
        passive: true,
        capture: true,
      });
      targetWindow.addEventListener('focus', handleWindowFocus);
    }
    if (targetDocument) {
      targetDocument.addEventListener(
        'visibilitychange',
        handleVisibilityChange,
      );
    }

    if (idleTimeoutMs > 0) {
      scheduleIdleTimer();
      const heartbeatMs = Math.min(
        15_000,
        Math.max(1_000, Math.floor(idleTimeoutMs / 4)),
      );
      heartbeatTimerId = globalThis.setInterval(() => {
        evaluateIdle('IDLE_TIMEOUT');
      }, heartbeatMs);
    }
  }

  return {
    destroy: () => {
      if (destroyed) return;
      destroyed = true;
      cleanupListenersAndTimers();
    },
    notifyActivity: handleActivity,
    getLastActivityAtMs: () => lastActivityAtMs,
    isDestroyed: () => destroyed,
  };
}
