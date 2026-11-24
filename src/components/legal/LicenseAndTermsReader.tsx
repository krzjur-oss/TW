import React from 'react';
import {
  LICENSE_META,
  LICENSE_SECTIONS,
  TERMS_META,
  TERMS_SECTIONS,
  type LegalDocumentSection,
} from '../../config/legalDocuments';

export type LegalDocTab = 'TERMS' | 'LICENSE';

interface SectionListProps {
  sections: LegalDocumentSection[];
}

const SectionList: React.FC<SectionListProps> = ({ sections }) => (
  <div className="space-y-4">
    {sections.map((section) => (
      <section key={section.id} className="space-y-2">
        <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
          {section.heading}
        </h4>
        {section.paragraphs.map((paragraph, idx) => (
          <p
            key={idx}
            className="text-xs leading-relaxed text-slate-700 dark:text-slate-300"
          >
            {paragraph}
          </p>
        ))}
        {section.bullets && section.bullets.length > 0 && (
          <ul className="space-y-1.5 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
            {section.bullets.map((bullet, bIdx) => (
              <li key={bIdx} className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-700 dark:bg-blue-400 shrink-0" />
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        )}
        {section.note && (
          <p className="rounded-lg border border-amber-200 bg-amber-50/70 px-3 py-2 text-xs leading-relaxed text-amber-950 dark:border-amber-800/70 dark:bg-amber-950/30 dark:text-amber-100">
            {section.note}
          </p>
        )}
      </section>
    ))}
  </div>
);

interface LicenseAndTermsContentProps {
  activeTab: LegalDocTab;
}

export const LicenseAndTermsContent: React.FC<LicenseAndTermsContentProps> = ({
  activeTab,
}) => {
  if (activeTab === 'LICENSE') {
    return (
      <div className="space-y-5">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/80 space-y-1.5">
          <div className="text-xs font-bold uppercase tracking-wide text-blue-800 dark:text-blue-400">
            {LICENSE_META.subtitle}
          </div>
          <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
            {LICENSE_META.title} — {LICENSE_META.projectLabel}
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-300">
            Właściciel praw autorskich i twórca:{' '}
            <strong>{LICENSE_META.author}</strong> · {LICENSE_META.copyright}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            Kontakt: {LICENSE_META.contactEmail} · GitHub:{' '}
            {LICENSE_META.githubLabel}
          </div>
        </div>

        <div className="space-y-1.5">
          <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
            Preambuła
          </h4>
          <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
            {LICENSE_META.preamble}
          </p>
        </div>

        <SectionList sections={LICENSE_SECTIONS} />

        <div className="border-t border-slate-200 pt-3 text-[11px] text-slate-500 dark:border-slate-800 dark:text-slate-400">
          Data sporządzenia: {LICENSE_META.preparedDateLabel}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/80 space-y-1.5">
        <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
          {TERMS_META.title}
        </div>
        <div className="text-xs font-medium text-blue-800 dark:text-blue-400">
          {TERMS_META.versionLabel}
        </div>
        <div className="text-xs text-slate-600 dark:text-slate-300">
          Autor i właściciel: <strong>{TERMS_META.author}</strong> ·{' '}
          {TERMS_META.appUrlLabel}
        </div>
        <div className="text-[11px] text-slate-500 dark:text-slate-400">
          Kontakt: {TERMS_META.contactEmail} · GitHub:{' '}
          {TERMS_META.githubLabel} · {TERMS_META.copyright}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-3 dark:border-emerald-800/70 dark:bg-emerald-950/30">
          <div className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
            Dozwolone (bezpłatnie)
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-emerald-950/90 dark:text-emerald-100/90">
            Praca nauczycieli, pedagogów i specjalistów w placówkach
            edukacyjnych, użytek domowy, instalacja offline PWA oraz eksport
            własnych dokumentów PDF i kopii `.ipet`.
          </p>
        </div>
        <div className="rounded-lg border border-rose-200 bg-rose-50/70 p-3 dark:border-rose-800/70 dark:bg-rose-950/30">
          <div className="text-xs font-bold text-rose-900 dark:text-rose-200">
            Zabronione bez pisemnej zgody
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-rose-950/90 dark:text-rose-100/90">
            Kopiowanie i modyfikowanie kodu, tworzenie forków,
            rozpowszechnianie osobom trzecim, sprzedaż, komercjalizacja oraz
            usuwanie oznaczeń Autora.
          </p>
        </div>
      </div>

      <SectionList sections={TERMS_SECTIONS} />

      <div className="border-t border-slate-200 pt-3 text-[11px] text-slate-500 dark:border-slate-800 dark:text-slate-400">
        {TERMS_META.copyright}
      </div>
    </div>
  );
};
