import { useSyncExternalStore } from 'react';
import {
  unsavedChangesRegistry,
  type UnsavedEntry,
} from '../utils/unsavedChangesRegistry';

export interface PwaUpdateState {
  needRefresh: boolean;
  offlineReady: boolean;
  updating: boolean;
  deferred: boolean;
  blockedByUnsavedChanges: boolean;
  unsavedLabels: string[];
  error: string | null;
}

export type UpdateServiceWorkerFn = (reloadPage?: boolean) => Promise<void>;

export interface PwaUpdateControllerDeps {
  hasUnsavedChanges: () => boolean;
  getUnsavedEntries: () => UnsavedEntry[];
}

export class PwaUpdateController {
  private state: PwaUpdateState = {
    needRefresh: false,
    offlineReady: false,
    updating: false,
    deferred: false,
    blockedByUnsavedChanges: false,
    unsavedLabels: [],
    error: null,
  };

  private listeners = new Set<() => void>();
  private updateFn: UpdateServiceWorkerFn | null = null;
  private deps: PwaUpdateControllerDeps;

  constructor(deps?: PwaUpdateControllerDeps) {
    this.deps = deps ?? {
      hasUnsavedChanges: () => unsavedChangesRegistry.hasUnsavedChanges(),
      getUnsavedEntries: () => unsavedChangesRegistry.getSnapshot(),
    };
  }

  private setState(patch: Partial<PwaUpdateState>): void {
    this.state = { ...this.state, ...patch };
    for (const listener of this.listeners) {
      listener();
    }
  }

  getSnapshot = (): PwaUpdateState => {
    return this.state;
  };

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  attachUpdater(updateFn: UpdateServiceWorkerFn): void {
    this.updateFn = updateFn;
  }

  notifyNeedRefresh(): void {
    this.setState({
      needRefresh: true,
      error: null,
    });
  }

  notifyOfflineReady(): void {
    this.setState({
      offlineReady: true,
    });
  }

  notifyRegisterError(err: unknown): void {
    this.setState({
      error:
        err instanceof Error
          ? err.message
          : 'Nie udało się sprawdzić aktualizacji Service Workera.',
    });
  }

  deferUpdate(): void {
    this.setState({
      deferred: true,
      blockedByUnsavedChanges: false,
    });
  }

  reopenDeferredPrompt(): void {
    this.setState({
      deferred: false,
      blockedByUnsavedChanges: false,
    });
  }

  dismissOfflineReady(): void {
    this.setState({
      offlineReady: false,
    });
  }

  async applyUpdate(): Promise<boolean> {
    if (this.deps.hasUnsavedChanges()) {
      const labels = this.deps.getUnsavedEntries().map((e) => e.label);
      this.setState({
        blockedByUnsavedChanges: true,
        unsavedLabels: labels,
      });
      return false;
    }

    if (!this.updateFn) {
      this.setState({
        error: 'Mechanizm aktualizacji PWA nie jest jeszcze gotowy.',
      });
      return false;
    }

    this.setState({
      updating: true,
      blockedByUnsavedChanges: false,
      unsavedLabels: [],
      error: null,
    });

    try {
      await this.updateFn(true);
      return true;
    } catch (err) {
      this.setState({
        updating: false,
        error:
          err instanceof Error
            ? `Błąd podczas aktualizacji aplikacji: ${err.message}`
            : 'Nie udało się zastosować aktualizacji.',
      });
      return false;
    }
  }
}

export const pwaUpdateController = new PwaUpdateController();

export function createPwaUpdateController(
  deps?: PwaUpdateControllerDeps,
): PwaUpdateController {
  return new PwaUpdateController(deps);
}

export function usePwaUpdateState(): PwaUpdateState {
  return useSyncExternalStore(
    pwaUpdateController.subscribe,
    pwaUpdateController.getSnapshot,
    pwaUpdateController.getSnapshot,
  );
}

let swInitialized = false;

export async function initPwaUpdates(): Promise<void> {
  if (swInitialized || typeof window === 'undefined') return;
  swInitialized = true;

  try {
    const { registerSW } = await import('virtual:pwa-register');
    const updateSW = registerSW({
      immediate: false,
      onNeedRefresh() {
        pwaUpdateController.notifyNeedRefresh();
      },
      onOfflineReady() {
        pwaUpdateController.notifyOfflineReady();
      },
      onRegisterError(err) {
        pwaUpdateController.notifyRegisterError(err);
      },
    });
    pwaUpdateController.attachUpdater(updateSW);
  } catch (err) {
    pwaUpdateController.notifyRegisterError(err);
  }
}
