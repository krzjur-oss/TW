import React from 'react';
import {
  BookMarked,
  Info,
  Scale,
  ShieldCheck,
} from 'lucide-react';
import {
  APP_INFO,
  POLISH_LEGAL_FRAMEWORK,
  PROGRAM_FEATURES,
} from '../config/appInfo';

export const AboutAndLegalView: React.FC = () => {
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

      {/* Przepisy prawa polskiego */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 space-y-5">
        <div className="flex items-start gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
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
                <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
                  {act.publicationRef}
                </span>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {act.fullTitle}
                </h3>
              </div>

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

        <div className="flex items-start gap-2.5 rounded-lg border border-slate-200 bg-slate-50 p-3.5 text-xs leading-relaxed text-slate-600 dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-400">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
          <span>
            Informacja prawna ma charakter pomocniczy i edukacyjno-organizacyjny.
            Przed zatwierdzeniem dokumentacji należy uwzględnić aktualne
            nowelizacje ustaw i rozporządzeń publikowane w Dzienniku Ustaw oraz
            wewnętrzne procedury obowiązujące w danej placówce (statut szkoły,
            wzory przyjęte przez radę pedagogiczną).
          </span>
        </div>
      </section>
    </div>
  );
};
