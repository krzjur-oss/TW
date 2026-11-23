import { useEffect, useSyncExternalStore, type FC } from 'react';

export interface UnsavedEntry {
  key: string;
  label: string;
}

class UnsavedChangesRegistry {
  private entries = new Map<string, string>();
  private listeners = new Set<() => void>();
  private snapshot: UnsavedEntry[] = [];

  private rebuildSnapshot(): void {
    this.snapshot = Array.from(this.entries.entries()).map(([key, label]) => ({
      key,
      label,
    }));
  }

  private emit(): void {
    this.rebuildSnapshot();
    for (const listener of this.listeners) {
      listener();
    }
  }

  setDirty(key: string, dirty: boolean, label = 'Formularz'): void {
    if (dirty) {
      if (this.entries.get(key) === label) return;
      this.entries.set(key, label);
      this.emit();
      return;
    }
    if (!this.entries.has(key)) return;
    this.entries.delete(key);
    this.emit();
  }

  clearAll(): void {
    if (this.entries.size === 0) return;
    this.entries.clear();
    this.emit();
  }

  hasUnsavedChanges(): boolean {
    return this.entries.size > 0;
  }

  getSnapshot = (): UnsavedEntry[] => {
    return this.snapshot;
  };

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
}

export const unsavedChangesRegistry = new UnsavedChangesRegistry();

export function createUnsavedChangesRegistry(): UnsavedChangesRegistry {
  return new UnsavedChangesRegistry();
}

export function useUnsavedChanges(): {
  hasUnsavedChanges: boolean;
  unsavedEntries: UnsavedEntry[];
} {
  const unsavedEntries = useSyncExternalStore(
    unsavedChangesRegistry.subscribe,
    unsavedChangesRegistry.getSnapshot,
    unsavedChangesRegistry.getSnapshot,
  );
  return {
    hasUnsavedChanges: unsavedEntries.length > 0,
    unsavedEntries,
  };
}

export function useRegisterUnsavedChanges(
  key: string,
  dirty: boolean,
  label: string,
): void {
  useEffect(() => {
    unsavedChangesRegistry.setDirty(key, dirty, label);
    return () => {
      unsavedChangesRegistry.setDirty(key, false, label);
    };
  }, [key, dirty, label]);
}

export const UnsavedChangesWindowGuard: FC = () => {
  const { hasUnsavedChanges } = useUnsavedChanges();

  useEffect(() => {
    if (!hasUnsavedChanges) return;
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  return null;
};
