import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  RefreshCw,
  X,
} from 'lucide-react';
import {
  pwaUpdateController,
  usePwaUpdateState,
} from '../pwa/pwaUpdateManager';
import { useUnsavedChanges } from '../utils/unsavedChangesRegistry';

export const PWAUpdateBanner: React.FC = () => {
  const state = usePwaUpdateState();
  const { hasUnsavedChanges, unsavedEntries } = useUnsavedChanges();

  if (state.needRefresh && !state.deferred) {
    const activeUnsavedLabels =
      unsavedEntries.length > 0
        ? unsavedEntries.map((e) => e.label)
        : state.unsavedLabels;
    const isBlocked = hasUnsavedChanges || state.blockedByUnsavedChanges;

    return (
      <div
        role="status"
        aria-live="polite"
        className="print:hidden fixed bottom-4 right-4 z-50 w-[calc(100vw-2rem)] max-w-md rounded-xl border border-blue-300 bg-white p-4 shadow-xl dark:border-blue-700 dark:bg-slate-900"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 shrink-0">
              <RefreshCw
                className={`h-4 w-4 ${state.updating ? 'animate-spin' : ''}`}
              />
            </div>
            <div className="space-y-1">
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Dostępna nowa wersja aplikacji
              </div>
              <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                Pobrano aktualizację programu Teczka Wsparcia. Zastosuj ją po
                zakończeniu bieżącej edycji lub odłóż na później.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => pwaUpdateController.deferUpdate()}
            aria-label="Odłóż powiadomienie o aktualizacji"
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {isBlocked && (
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-2.5 text-xs leading-relaxed text-amber-950 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700 dark:text-amber-300" />
            <span>
              <strong>Ochrona edycji:</strong> strona nie zostanie przeładowana
              automatycznie, ponieważ masz niezapisane zmiany (
              {activeUnsavedLabels.join(', ') || 'aktywny formularz'}). Zapisz
              lub zamknij formularz przed aktualizacją.
            </span>
          </div>
        )}

        {state.error && (
          <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-900 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
            {state.error}
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            disabled={state.updating}
            onClick={() => pwaUpdateController.deferUpdate()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <Clock className="h-3.5 w-3.5" />
            <span>Odłóż na później</span>
          </button>
          <button
            type="button"
            disabled={state.updating || hasUnsavedChanges}
            onClick={() => void pwaUpdateController.applyUpdate()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-600 dark:hover:bg-blue-500"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${state.updating ? 'animate-spin' : ''}`}
            />
            <span>
              {state.updating ? 'Aktualizowanie...' : 'Aktualizuj teraz'}
            </span>
          </button>
        </div>
      </div>
    );
  }

  if (state.needRefresh && state.deferred) {
    return (
      <button
        type="button"
        onClick={() => pwaUpdateController.reopenDeferredPrompt()}
        className="print:hidden fixed bottom-4 right-4 z-40 inline-flex items-center gap-2 rounded-lg border border-blue-300 bg-white px-3.5 py-2 text-xs font-semibold text-blue-900 shadow-lg hover:bg-blue-50 dark:border-blue-700 dark:bg-slate-900 dark:text-blue-200 dark:hover:bg-slate-800"
      >
        <RefreshCw className="h-3.5 w-3.5 text-blue-700 dark:text-blue-400" />
        <span>Dostępna aktualizacja PWA</span>
      </button>
    );
  }

  if (state.offlineReady) {
    return (
      <div
        role="status"
        className="print:hidden fixed bottom-4 right-4 z-40 flex max-w-sm items-center gap-2.5 rounded-xl border border-teal-300 bg-white px-4 py-3 text-xs text-slate-800 shadow-lg dark:border-teal-800 dark:bg-slate-900 dark:text-slate-100"
      >
        <CheckCircle2 className="h-4 w-4 shrink-0 text-teal-700 dark:text-teal-400" />
        <span>Aplikacja i lokalne fonty są gotowe do pracy offline.</span>
        <button
          type="button"
          onClick={() => pwaUpdateController.dismissOfflineReady()}
          aria-label="Zamknij komunikat offline"
          className="ml-auto rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return null;
};
