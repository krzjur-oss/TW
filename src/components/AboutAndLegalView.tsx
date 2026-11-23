import React, { useState } from 'react';
import {
  BookMarked,
  Calendar,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  History,
  Info,
  Scale,
  ShieldCheck,
} from 'lucide-react';
import {
  APP_CHANGELOG,
  APP_INFO,
  POLISH_LEGAL_FRAMEWORK,
  PROGRAM_FEATURES,
} from '../config/appInfo';

export const AboutAndLegalView: React.FC = () => {
  const [expandedVersions, setExpandedVersions] = useState<Set<string>>(
    () => new Set(APP_CHANGELOG.slice(0, 2).map((entry) => entry.version)),
  );

  const olderVersions = APP_CHANGELOG.slice(2);
  const allOlderExpanded =
    olderVersions.length > 0 &&
    olderVersions.every((entry) => expandedVersions.has(entry.version));

  const toggleVersion = (version: string) => {
    setExpandedVersions((prev) => {
      const next = new Set(prev);
      if (next.has(version)) {
        next.delete(version);
      } else {
        next.add(version);
      }
      return next;
    });
  };

  const toggleAllOlder = () => {
    setExpandedVersions((prev) => {
      const next = new Set(prev);
      if (allOlderExpanded) {
        for (const entry of olderVersions) {
          next.delete(entry.version);
        }
      } else {
        for (const entry of olderVersions) {
          next.add(entry.version);
        }
      }
      return next;
    });
  };

  return (
    <div className="space-y-6">
      {/* Karta główna: wersja i opis programu */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 space-y-5">
        <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-start sm:justify-between dark:border-slate-800">
          <div className="flex items-start gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-800 text-white shrink-0">
              <BookMarked className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                {APP_INFO.name}
              </h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {APP_INFO.editionLabel}
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-left sm:text-right dark:border-slate-700 dark:bg-slate-950 shrink-0">
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Wersja programu
            </div>
            <div className="font-mono text-base font-bold text-slate-900 dark:text-slate-100 tabular-nums">
              v{APP_INFO.version}
            </div>
          </div>
        </div>

        <div className="space-y-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          <p>{APP_INFO.summary}</p>
          <div className="flex items-start gap-2.5 rounded-lg border border-teal-200 bg-teal-50/70 p-3.5 text-xs leading-relaxed text-teal-950 dark:border-teal-800/70 dark:bg-teal-950/30 dark:text-teal-100">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-teal-700 dark:text-teal-300" />
            <span>{APP_INFO.architectureNote}</span>
          </div>
        </div>

        {/* Opis głównych modułów */}
        <div className="pt-2">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">
            Zakres funkcjonalny programu
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {PROGRAM_FEATURES.map((feat) => (
              <div
                key={feat.title}
                className="rounded-lg border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-950/50"
              >
                <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                  {feat.title}
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                  {feat.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Historia zmian (Changelog) */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 space-y-4">
        <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200 shrink-0">
              <History className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Historia zmian w programie
              </h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Dwie najnowsze wersje są wyświetlane w całości, a wcześniejsze wersje można rozwinąć w razie potrzeby.
              </p>
            </div>
          </div>

          {olderVersions.length > 0 && (
            <button
              type="button"
              onClick={toggleAllOlder}
              className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-lg border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 cursor-pointer shrink-0"
            >
              {allOlderExpanded ? (
                <>
                  <ChevronUp className="h-3.5 w-3.5" />
                  Zwiń starsze ({olderVersions.length})
                </>
              ) : (
                <>
                  <ChevronDown className="h-3.5 w-3.5" />
                  Rozwiń starsze ({olderVersions.length})
                </>
              )}
            </button>
          )}
        </div>

        <div className="space-y-3">
          {APP_CHANGELOG.map((entry, idx) => {
            const isNewestTwo = idx < 2;
            const isExpanded = expandedVersions.has(entry.version);

            return (
              <article
                key={entry.version}
                className={`rounded-xl border transition-colors ${
                  isExpanded
                    ? 'border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/50'
                    : 'border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-950/30'
                }`}
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap items-center gap-2.5 min-w-0">
                    <span
                      className={`font-mono text-xs font-bold px-2 py-0.5 rounded-md tabular-nums ${
                        idx === 0
                          ? 'bg-blue-800 text-white'
                          : 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200'
                      }`}
                    >
                      v{entry.version}
                    </span>
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      {entry.dateLabel}
                    </span>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {entry.title}
                    </h3>
                  </div>

                  {!isNewestTwo || !isExpanded ? (
                    <button
                      type="button"
                      onClick={() => toggleVersion(entry.version)}
                      aria-expanded={isExpanded}
                      className="inline-flex items-center gap-1 self-start sm:self-center rounded-md px-2.5 py-1 text-xs font-medium text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/40 cursor-pointer shrink-0"
                    >
                      {isExpanded ? (
                        <>
                          <span>Zwiń</span>
                          <ChevronUp className="h-3.5 w-3.5" />
                        </>
                      ) : (
                        <>
                          <span>Pokaż szczegóły</span>
                          <ChevronDown className="h-3.5 w-3.5" />
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => toggleVersion(entry.version)}
                      aria-expanded={isExpanded}
                      className="inline-flex items-center gap-1 self-start sm:self-center rounded-md px-2.5 py-1 text-xs font-medium text-slate-500 hover:bg-slate-200/70 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 cursor-pointer shrink-0"
                    >
                      <span>Zwiń</span>
                      <ChevronUp className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {isExpanded && (
                  <div className="mt-3 space-y-2 border-t border-slate-200/80 pt-3 dark:border-slate-800">
                    <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                      {entry.summary}
                    </p>
                    <ul className="space-y-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                      {entry.highlights.map((item, itemIdx) => (
                        <li key={itemIdx} className="flex items-start gap-2">
                          <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-700 dark:bg-blue-400 shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>

      {/* Przepisy prawa polskiego */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 space-y-5">
        <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-start sm:justify-between dark:border-slate-800">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200 shrink-0">
              <Scale className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Przepisy prawa polskiego mające zastosowanie w programie
              </h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Zestawienie aktów prawnych regulujących organizację kształcenia specjalnego, pomoc psychologiczno-pedagogiczną, ocenianie, dokumentację szkolną oraz ochronę danych osobowych.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3.5 py-2 text-xs font-semibold text-blue-950 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-100 shrink-0">
            <Calendar className="h-4 w-4 text-blue-700 dark:text-blue-400 shrink-0" />
            <span>
              Stan prawny na dzień {APP_INFO.legalStateDateLabel} (
              <span className="font-mono">{APP_INFO.legalStateDateIso}</span>)
            </span>
          </div>
        </div>

        <div className="space-y-4">
          {POLISH_LEGAL_FRAMEWORK.map((act) => (
            <article
              key={act.id}
              className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950/40 space-y-3"
            >
              <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-blue-800 dark:text-blue-400">
                  {act.category}
                </span>
                <span className="font-mono text-xs text-slate-600 dark:text-slate-300">
                  {act.publicationRef}
                </span>
              </div>

              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {act.fullTitle}
                </h3>
                <a
                  href={act.eliUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-mono text-[11px] font-medium text-blue-700 hover:underline dark:text-blue-400 shrink-0"
                >
                  <span>ELI: {act.eliIdentifier}</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>

              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {act.verificationNote}
              </p>

              <div className="space-y-1.5 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                {act.keyProvisions.map((prov, index) => (
                  <p key={index} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
                    <span>{prov}</span>
                  </p>
                ))}
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs leading-relaxed text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                <strong className="text-slate-900 dark:text-slate-100">
                  Zastosowanie w programie:
                </strong>{' '}
                {act.applicationMapping}
              </div>
            </article>
          ))}
        </div>

        <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50/70 p-3.5 text-xs leading-relaxed text-amber-950 dark:border-amber-800/70 dark:bg-amber-950/30 dark:text-amber-100">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-700 dark:text-amber-300" />
          <span>
            <strong>Charakter pomocniczy dokumentacji:</strong> aplikacja wspiera
            zespół w porządkowaniu i dokumentowaniu wsparcia, ale nie zastępuje
            decyzji zespołu nauczycieli i specjalistów, dyrektora szkoły ani
            bieżącej analizy obowiązujących przepisów (Dziennik Ustaw / ELI,
            statut placówki, wzory przyjęte przez radę pedagogiczną). Stan
            prawny zestawienia: <strong>{APP_INFO.legalStateDateLabel}</strong>.
          </span>
        </div>
      </section>
    </div>
  );
};
