import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowDown,
  BookMarked,
  CheckCircle2,
  FileText,
  GraduationCap,
  Scale,
  ShieldCheck,
} from 'lucide-react';
import { APP_INFO } from '../../config/appInfo';
import {
  saveTermsAcceptance,
  type TermsAcceptanceRecord,
} from '../../utils/termsAcceptance';
import {
  LicenseAndTermsContent,
  type LegalDocTab,
} from './LicenseAndTermsReader';

interface TermsAcceptanceGateProps {
  onAccepted: (record: TermsAcceptanceRecord) => void;
}

export const TermsAcceptanceGate: React.FC<TermsAcceptanceGateProps> = ({
  onAccepted,
}) => {
  const [activeTab, setActiveTab] = useState<LegalDocTab>('TERMS');
  const [hasScrolledTermsToEnd, setHasScrolledTermsToEnd] = useState(false);
  const [hasOpenedLicense, setHasOpenedLicense] = useState(false);
  const [acceptedCheckbox, setAcceptedCheckbox] = useState(false);

  const scrollBoxRef = useRef<HTMLDivElement | null>(null);

  const checkScrollPosition = useCallback(() => {
    const el = scrollBoxRef.current;
    if (!el) return;
    const isAtBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 24;
    if (isAtBottom && activeTab === 'TERMS') {
      setHasScrolledTermsToEnd(true);
    }
  }, [activeTab]);

  useEffect(() => {
    const el = scrollBoxRef.current;
    if (!el) return;
    el.scrollTop = 0;
    const raf = window.requestAnimationFrame(() => {
      checkScrollPosition();
    });
    return () => window.cancelAnimationFrame(raf);
  }, [activeTab, checkScrollPosition]);

  useEffect(() => {
    window.addEventListener('resize', checkScrollPosition);
    return () => window.removeEventListener('resize', checkScrollPosition);
  }, [checkScrollPosition]);

  const handleScrollToBottom = () => {
    const el = scrollBoxRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    if (activeTab === 'TERMS') {
      setHasScrolledTermsToEnd(true);
    }
  };

  const handleSelectTab = (tab: LegalDocTab) => {
    setActiveTab(tab);
    if (tab === 'LICENSE') {
      setHasOpenedLicense(true);
    }
  };

  const handleConfirmAndStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasScrolledTermsToEnd || !acceptedCheckbox) return;
    const record = saveTermsAcceptance();
    onAccepted(record);
  };

  const canAccept = hasScrolledTermsToEnd && acceptedCheckbox;

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-6 sm:py-10 flex items-center justify-center dark:bg-slate-950">
      <div className="w-full max-w-3xl rounded-2xl border border-slate-200 bg-white shadow-lg overflow-hidden dark:border-slate-800 dark:bg-slate-900">
        {/* Nagłówek bramki pierwszego uruchomienia */}
        <header className="border-b border-slate-200 bg-slate-50 px-5 py-4 sm:px-6 sm:py-5 dark:border-slate-800 dark:bg-slate-900/90">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-800 text-white shrink-0">
                <BookMarked className="h-5 w-5" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-display text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
                    {APP_INFO.name}
                  </h1>
                  <span className="font-mono text-xs font-semibold rounded bg-slate-200 px-2 py-0.5 text-slate-700 dark:bg-slate-800 dark:text-slate-300 tabular-nums">
                    v{APP_INFO.version}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
                  Przed pierwszym uruchomieniem przeczytaj i zaakceptuj Regulamin oraz Wolną Licencję Domowo-Edukacyjną (WLDE).
                </p>
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-semibold text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200 shrink-0 self-start sm:self-center">
              <GraduationCap className="h-3.5 w-3.5 shrink-0" />
              <span>Darmowa dla edukacji i pedagogów</span>
            </div>
          </div>
        </header>

        {/* Przełącznik dokumentów */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-white px-5 py-2.5 sm:px-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2" role="tablist" aria-label="Dokumenty licencyjne">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'TERMS'}
              onClick={() => handleSelectTab('TERMS')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'TERMS'
                  ? 'bg-blue-800 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              <span>1. Regulamin i Prywatność</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'LICENSE'}
              onClick={() => handleSelectTab('LICENSE')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'LICENSE'
                  ? 'bg-blue-800 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              <Scale className="h-3.5 w-3.5" />
              <span>2. Licencja WLDE</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleScrollToBottom}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-700 hover:underline dark:text-blue-400 cursor-pointer"
          >
            <ArrowDown className="h-3 w-3" />
            <span>Przewiń do końca</span>
          </button>
        </div>

        {/* Przewijana treść regulaminu / licencji */}
        <div
          ref={scrollBoxRef}
          onScroll={checkScrollPosition}
          className="h-[46vh] min-h-[260px] max-h-[440px] overflow-y-auto px-5 py-4 sm:px-6 bg-white dark:bg-slate-950/60"
        >
          <LicenseAndTermsContent activeTab={activeTab} />
        </div>

        {/* Status przeczytania i formularz akceptacji */}
        <form
          onSubmit={handleConfirmAndStart}
          className="border-t border-slate-200 bg-slate-50 px-5 py-4 sm:px-6 space-y-3.5 dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            {hasScrolledTermsToEnd ? (
              <span className="inline-flex items-center gap-1.5 font-medium text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>Treść Regulaminu została przewinięta do końca.</span>
              </span>
            ) : (
              <span className="font-medium text-amber-800 dark:text-amber-300">
                {activeTab === 'TERMS'
                  ? 'Przewiń treść Regulaminu do końca, aby odblokować pole akceptacji.'
                  : 'Przejdź do zakładki „1. Regulamin i Prywatność” i przewiń ją do końca, aby zaakceptować.'}
              </span>
            )}

            {hasOpenedLicense && (
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Zapoznano się także z Licencją WLDE
              </span>
            )}
          </div>

          <label
            className={`flex items-start gap-3 rounded-xl border p-3.5 text-xs leading-relaxed transition-colors ${
              hasScrolledTermsToEnd
                ? 'border-slate-300 bg-white text-slate-800 cursor-pointer dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200'
                : 'border-slate-200 bg-slate-100/70 text-slate-400 cursor-not-allowed dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-500'
            }`}
          >
            <input
              type="checkbox"
              checked={acceptedCheckbox}
              disabled={!hasScrolledTermsToEnd}
              onChange={(e) => setAcceptedCheckbox(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-600 disabled:opacity-50 shrink-0"
            />
            <span>
              Potwierdzam, że przeczytałem/am i akceptuję{' '}
              <strong>Regulamin i Politykę Prywatności</strong> oraz warunki{' '}
              <strong>Wolnej Licencji Domowo-Edukacyjnej (WLDE)</strong>.
              Rozumiem, że aplikacja jest bezpłatna do użytku edukacyjnego (w
              placówkach oświatowych oraz dla nauczycieli i pedagogów) i
              domowego, a dane uczniów przetwarzane są wyłącznie lokalnie w
              przeglądarce.
            </span>
          </label>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-1">
            <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
              <ShieldCheck className="h-4 w-4 text-teal-700 dark:text-teal-400 shrink-0" />
              <span>
                Zgoda zapisywana jest wyłącznie lokalnie na tym urządzeniu.
              </span>
            </div>

            <button
              type="submit"
              disabled={!canAccept}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-800 px-5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-blue-900 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 dark:disabled:bg-slate-800 dark:disabled:text-slate-500 cursor-pointer shrink-0"
            >
              <span>Akceptuję regulamin i uruchamiam program</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
