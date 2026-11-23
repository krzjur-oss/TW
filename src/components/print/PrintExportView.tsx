import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Download,
  FileSpreadsheet,
  FileText,
  Printer,
  ScrollText,
} from 'lucide-react';
import { LEGAL_FRAMEWORK_AS_OF_PL } from '../../config/appInfo';
import {
  formatFacilityLocation,
  generateAndDownloadPdf,
  getLegalBasisText,
  type PrintDocumentVariant,
} from '../../pdf/pdfGenerator';
import {
  DOCUMENT_TYPE_LABELS,
  EDUCATION_STAGE_LABELS,
  EFFECTIVENESS_RATING_LABELS,
  FUNCTIONING_AREA_OPTIONS,
  JOURNAL_CATEGORY_LABELS,
  REHAB_CATEGORY_LABELS,
  type FacilitySettings,
  type JournalEntry,
  type PeriodicEvaluation,
  type ProgramModificationAnnex,
  type StudentProfile,
} from '../../types/domain';

interface PrintExportViewProps {
  student: StudentProfile;
  settings: FacilitySettings;
  journalEntries: JournalEntry[];
  evaluations: PeriodicEvaluation[];
  annexes: ProgramModificationAnnex[];
}

function getTodayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export const PrintExportView: React.FC<PrintExportViewProps> = ({
  student,
  settings,
  journalEntries,
  evaluations,
  annexes,
}) => {
  const [variant, setVariant] = useState<PrintDocumentVariant>('IPET');
  const [preparedDate, setPreparedDate] = useState<string>(getTodayIso);
  const [includeWopfuInIpet, setIncludeWopfuInIpet] = useState(true);
  const [selectedEvaluationId, setSelectedEvaluationId] = useState<string>('ALL');
  const [journalAreaFilter, setJournalAreaFilter] = useState<string>('ALL');

  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [downloadedFileName, setDownloadedFileName] = useState<string | null>(
    null,
  );
  const [pdfError, setPdfError] = useState<string | null>(null);

  const sortedAnnexes = useMemo(
    () => [...annexes].sort((a, b) => a.versionNumber - b.versionNumber),
    [annexes],
  );

  const filteredEvaluations = useMemo(() => {
    const ordered = [...evaluations].sort((a, b) =>
      b.evaluationDate.localeCompare(a.evaluationDate),
    );
    if (selectedEvaluationId === 'ALL') return ordered;
    return ordered.filter((ev) => ev.id === selectedEvaluationId);
  }, [evaluations, selectedEvaluationId]);

  const filteredJournalEntries = useMemo(() => {
    const ordered = [...journalEntries].sort((a, b) =>
      a.date.localeCompare(b.date),
    );
    if (journalAreaFilter === 'ALL') return ordered;
    return ordered.filter((entry) => entry.relatedArea === journalAreaFilter);
  }, [journalEntries, journalAreaFilter]);

  const handleDownloadPdf = async () => {
    setGeneratingPdf(true);
    setPdfError(null);
    setDownloadedFileName(null);
    try {
      const fileName = await generateAndDownloadPdf({
        variant,
        student,
        settings,
        journalEntries,
        evaluations,
        annexes,
        preparedDate,
        includeWopfuInIpet,
        selectedEvaluationId,
        journalAreaFilter,
      });
      setDownloadedFileName(fileName);
    } catch (err) {
      setPdfError(
        err instanceof Error
          ? `Nie udało się wygenerować pliku PDF: ${err.message}`
          : 'Wystąpił nieoczekiwany błąd podczas generowania pliku PDF.',
      );
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const locationLine = formatFacilityLocation(settings);
  const legalBasis = getLegalBasisText(student);
  const membersForSignatures =
    student.teamMembers.length > 0
      ? student.teamMembers
      : [
          {
            id: 'coord-fallback',
            name: student.teamCoordinator || '........................................',
            role: 'Koordynator zespołu',
            isCoordinator: true,
          },
        ];

  const missingFacilityMeta =
    !settings.address?.trim() || !settings.directorName?.trim();

  return (
    <div className="space-y-6">
      {/* Panel konfiguracji i eksportu (ukryty na wydruku) */}
      <div className="print:hidden rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 space-y-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Eksport dokumentacji do PDF i wydruk A4
            </h3>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
              Generowanie odbywa się w 100% lokalnie w przeglądarce z pełną obsługą polskich znaków i kontrolą łamania tabel.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800 whitespace-nowrap shrink-0"
            >
              <Printer className="h-4 w-4" />
              <span>Drukuj / Zapisz A4</span>
            </button>
            <button
              type="button"
              disabled={generatingPdf}
              onClick={handleDownloadPdf}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-800 disabled:opacity-60 dark:bg-blue-600 dark:hover:bg-blue-500 whitespace-nowrap shrink-0"
            >
              <Download className="h-4 w-4" />
              <span>
                {generatingPdf ? 'Generowanie PDF...' : 'Pobierz plik PDF'}
              </span>
            </button>
          </div>
        </div>

        {/* Wybór wariantu dokumentu */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {[
            {
              id: 'IPET' as const,
              title:
                student.documentType === 'ORZECZENIE'
                  ? '1. Dokument IPET (z WOPFU)'
                  : '1. Karta dostosowań i pomocy PPP',
              desc:
                student.documentType === 'ORZECZENIE'
                  ? 'Skład zespołu, WOPFU, 7 sekcji IPET, aneksy oraz podpisy.'
                  : 'Profil funkcjonalny, dostosowania wymagań, pomoc PPP i podpisy.',
              icon: FileText,
            },
            {
              id: 'EVALUATION' as const,
              title: '2. Arkusz oceny okresowej',
              desc: `Sprawozdanie z efektywności wsparcia i decyzje o aneksach (${evaluations.length}).`,
              icon: FileSpreadsheet,
            },
            {
              id: 'JOURNAL' as const,
              title: '3. Karta obserwacji i działań',
              desc: `Chronologiczny zapis obserwacji i podsumowanie wsparcia (${journalEntries.length}).`,
              icon: ScrollText,
            },
          ].map((item) => {
            const Icon = item.icon;
            const active = variant === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setVariant(item.id);
                  setDownloadedFileName(null);
                  setPdfError(null);
                }}
                className={`flex flex-col items-start rounded-lg border p-3.5 text-left transition-colors ${
                  active
                    ? 'border-blue-700 bg-blue-50/70 dark:border-blue-500 dark:bg-blue-950/30'
                    : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100/80 dark:border-slate-800 dark:bg-slate-950/60 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-900 dark:text-slate-100">
                  <Icon
                    className={`h-4 w-4 shrink-0 ${
                      active
                        ? 'text-blue-700 dark:text-blue-400'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  />
                  <span>{item.title}</span>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                  {item.desc}
                </p>
              </button>
            );
          })}
        </div>

        {/* Opcje szczegółowe wybranego wariantu */}
        <div className="flex flex-wrap items-end gap-4 border-t border-slate-100 pt-4 dark:border-slate-800">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Data sporządzenia dokumentu
            </label>
            <input
              type="date"
              value={preparedDate}
              onChange={(e) => setPreparedDate(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-mono text-xs text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 tabular-nums"
            />
          </div>

          {variant === 'IPET' && student.documentType === 'ORZECZENIE' && (
            <label className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={includeWopfuInIpet}
                onChange={(e) => setIncludeWopfuInIpet(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-slate-300 text-blue-700 focus:ring-blue-600"
              />
              <span>Dołącz sekcję WOPFU przed programem IPET</span>
            </label>
          )}

          {variant === 'EVALUATION' && (
            <div className="min-w-[260px]">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Zakres ocen okresowych
              </label>
              <select
                value={selectedEvaluationId}
                onChange={(e) => setSelectedEvaluationId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              >
                <option value="ALL">
                  Wszystkie zapisane oceny ({evaluations.length})
                </option>
                {evaluations.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.periodLabel} ({ev.evaluationDate})
                  </option>
                ))}
              </select>
            </div>
          )}

          {variant === 'JOURNAL' && (
            <div className="min-w-[260px]">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Filtr obszaru obserwacji
              </label>
              <select
                value={journalAreaFilter}
                onChange={(e) => setJournalAreaFilter(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              >
                <option value="ALL">
                  Wszystkie obszary ({journalEntries.length})
                </option>
                {FUNCTIONING_AREA_OPTIONS.map((area) => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {downloadedFileName && (
          <div className="flex items-center gap-2 rounded-lg border border-teal-200 bg-teal-50 px-3.5 py-2.5 text-xs text-teal-900 dark:border-teal-800 dark:bg-teal-950/40 dark:text-teal-200">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>
              Wygenerowano i pobrano dokument:{' '}
              <strong className="font-mono">{downloadedFileName}</strong>
            </span>
          </div>
        )}

        {pdfError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-900 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
            {pdfError}
          </div>
        )}

        {missingFacilityMeta && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-400">
            Wskazówka: w zakładce <strong>Ustawienia placówki</strong> możesz uzupełnić pełny adres szkoły oraz dane dyrektora — pojawią się automatycznie w poniższym nagłówku.
          </div>
        )}
      </div>

      {/* Arkusz podglądu A4 (zawsze czarny tekst na białym tle papieru, także w trybie ciemnym) */}
      <div className="print-sheet mx-auto max-w-[210mm] rounded-xl border border-slate-300 bg-white p-8 text-slate-900 shadow-sm sm:p-12">
        {/* Nagłówek placówki */}
        <header className="flex flex-col justify-between gap-3 border-b-2 border-slate-800 pb-4 sm:flex-row sm:items-end">
          <div>
            <div className="text-sm font-bold text-slate-900">
              {settings.schoolName || 'Nazwa placówki'}
            </div>
            <div className="text-xs text-slate-700">
              {settings.schoolType || 'Placówka oświatowa'} · {locationLine}
            </div>
            {settings.directorName?.trim() && (
              <div className="text-xs text-slate-700">
                Dyrektor: {settings.directorName.trim()}
              </div>
            )}
          </div>
          <div className="text-left sm:text-right text-xs text-slate-700 tabular-nums">
            <div className="font-semibold text-slate-900">
              Rok szkolny: {student.schoolYear}
            </div>
            <div>Data sporządzenia: {preparedDate}</div>
            <div className="font-mono">
              Dokument PPP: {student.pppDocument.documentNumber}
            </div>
          </div>
        </header>

        {/* Oznaczenie danych testowych na wydruku */}
        {student.isTestData && (
          <div className="mt-4 border border-amber-600 bg-amber-50 px-3 py-1.5 text-center text-xs font-bold tracking-wide text-amber-900">
            DANE TESTOWE — DOKUMENT PRZYKŁADOWY WYGENEROWANY DO CELÓW DEMONSTRACYJNYCH
          </div>
        )}

        {/* Tytuł dokumentu */}
        <div className="mt-6 text-center print-keep-with-next">
          <h2 className="text-base font-bold uppercase tracking-tight text-slate-950">
            {variant === 'IPET'
              ? student.documentType === 'ORZECZENIE'
                ? 'Indywidualny Program Edukacyjno-Terapeutyczny (IPET)'
                : 'Karta dostosowania wymagań edukacyjnych i pomocy PPP'
              : variant === 'EVALUATION'
                ? 'Arkusz okresowej oceny efektywności wsparcia / sprawozdanie'
                : 'Karta obserwacji i podsumowanie działań'}
          </h2>
          <p className="mt-1 text-xs text-slate-600">
            {variant === 'IPET'
              ? student.documentType === 'ORZECZENIE'
                ? includeWopfuInIpet
                  ? 'wraz z Wielospecjalistyczną Oceną Poziomu Funkcjonowania Ucznia (WOPFU)'
                  : 'Opracowany na podstawie orzeczenia o potrzebie kształcenia specjalnego'
                : 'Opracowana na podstawie opinii Poradni Psychologiczno-Pedagogicznej (bez wymogu pełnego IPET)'
              : variant === 'EVALUATION'
                ? 'Wielospecjalistyczna ocena efektywności udzielanej pomocy psychologiczno-pedagogicznej i kształcenia specjalnego'
                : 'Chronologiczny zapis obserwacji postępów, barier oraz zrealizowanych modyfikacji wsparcia'}
          </p>
        </div>

        {/* Metryczka ucznia i dokumentu PPP */}
        <section className="mt-5">
          <table className="w-full border-collapse text-xs">
            <tbody>
              <tr className="print-avoid-break">
                <th className="w-[24%] border border-slate-300 bg-slate-50 px-2.5 py-1.5 text-left font-semibold text-slate-700">
                  Uczeń / Uczennica
                </th>
                <td className="w-[26%] border border-slate-300 px-2.5 py-1.5 font-semibold text-slate-900">
                  {student.firstName} {student.lastName}
                </td>
                <th className="w-[24%] border border-slate-300 bg-slate-50 px-2.5 py-1.5 text-left font-semibold text-slate-700">
                  Klasa / oddział
                </th>
                <td className="w-[26%] border border-slate-300 px-2.5 py-1.5 font-semibold text-slate-900">
                  {student.className}
                </td>
              </tr>
              <tr className="print-avoid-break">
                <th className="border border-slate-300 bg-slate-50 px-2.5 py-1.5 text-left font-semibold text-slate-700">
                  Data urodzenia
                </th>
                <td className="border border-slate-300 px-2.5 py-1.5 font-mono tabular-nums">
                  {student.birthDate || '—'}
                </td>
                <th className="border border-slate-300 bg-slate-50 px-2.5 py-1.5 text-left font-semibold text-slate-700">
                  Etap edukacyjny
                </th>
                <td className="border border-slate-300 px-2.5 py-1.5">
                  {EDUCATION_STAGE_LABELS[student.educationStage]}
                </td>
              </tr>
              <tr className="print-avoid-break">
                <th className="border border-slate-300 bg-slate-50 px-2.5 py-1.5 text-left font-semibold text-slate-700">
                  Podstawa PPP
                </th>
                <td
                  colSpan={3}
                  className="border border-slate-300 px-2.5 py-1.5"
                >
                  {DOCUMENT_TYPE_LABELS[student.documentType]} · nr{' '}
                  <span className="font-mono">
                    {student.pppDocument.documentNumber}
                  </span>{' '}
                  (wyd. {student.pppDocument.issueDate || '—'}, ważny:{' '}
                  {student.pppDocument.validUntil || '—'})
                </td>
              </tr>
              <tr className="print-avoid-break">
                <th className="border border-slate-300 bg-slate-50 px-2.5 py-1.5 text-left font-semibold text-slate-700">
                  Poradnia wydająca
                </th>
                <td className="border border-slate-300 px-2.5 py-1.5">
                  {student.pppDocument.issuingAuthority || '—'}
                </td>
                <th className="border border-slate-300 bg-slate-50 px-2.5 py-1.5 text-left font-semibold text-slate-700">
                  Koordynator zespołu
                </th>
                <td className="border border-slate-300 px-2.5 py-1.5">
                  {student.teamCoordinator || '—'}
                </td>
              </tr>
              <tr className="print-avoid-break">
                <th className="border border-slate-300 bg-slate-50 px-2.5 py-1.5 text-left font-semibold text-slate-700">
                  Rozpoznanie / powód
                </th>
                <td
                  colSpan={3}
                  className="border border-slate-300 px-2.5 py-1.5"
                >
                  {student.pppDocument.reasonCategory || '—'}
                </td>
              </tr>
              <tr className="print-avoid-break">
                <th className="border border-slate-300 bg-slate-50 px-2.5 py-1.5 text-left font-semibold text-slate-700">
                  Podstawa prawna
                </th>
                <td
                  colSpan={3}
                  className="border border-slate-300 px-2.5 py-1.5 text-[11px] leading-snug text-slate-700"
                >
                  {legalBasis}
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* WARIANT 1: IPET / DOSTOSOWANIA */}
        {variant === 'IPET' && (
          <div className="mt-6 space-y-6">
            {/* Skład zespołu */}
            <section>
              <h3 className="text-xs font-bold uppercase tracking-wide text-blue-900 mb-2 print-keep-with-next">
                Skład zespołu nauczycieli i specjalistów
              </h3>
              {student.teamMembers.length === 0 ? (
                <p className="text-xs text-slate-700">
                  Koordynator: {student.teamCoordinator || 'Nie wskazano'}.
                </p>
              ) : (
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="w-10 border border-slate-300 px-2 py-1.5 text-center font-semibold">
                        Lp.
                      </th>
                      <th className="border border-slate-300 px-2.5 py-1.5 text-left font-semibold">
                        Imię i nazwisko
                      </th>
                      <th className="border border-slate-300 px-2.5 py-1.5 text-left font-semibold">
                        Stanowisko / przedmiot
                      </th>
                      <th className="border border-slate-300 px-2.5 py-1.5 text-left font-semibold">
                        Funkcja w zespole
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {student.teamMembers.map((m, idx) => (
                      <tr key={m.id} className="print-avoid-break">
                        <td className="border border-slate-300 px-2 py-1.5 text-center tabular-nums">
                          {idx + 1}.
                        </td>
                        <td className="border border-slate-300 px-2.5 py-1.5 font-medium">
                          {m.name}
                        </td>
                        <td className="border border-slate-300 px-2.5 py-1.5">
                          {m.role}
                        </td>
                        <td className="border border-slate-300 px-2.5 py-1.5">
                          {m.isCoordinator
                            ? 'Koordynator zespołu'
                            : 'Członek zespołu'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>

            {student.documentType === 'ORZECZENIE' ? (
              <>
                {includeWopfuInIpet && (
                  <section>
                    <h3 className="text-xs font-bold uppercase tracking-wide text-blue-900 mb-2 print-keep-with-next">
                      Część I. Wielospecjalistyczna Ocena Poziomu Funkcjonowania
                      Ucznia (WOPFU)
                      {student.wopfuDraft.assessmentDate
                        ? ` — data oceny: ${student.wopfuDraft.assessmentDate}`
                        : ''}
                    </h3>
                    <table className="w-full border-collapse text-xs">
                      <tbody>
                        {[
                          {
                            label: 'Uwarunkowania i kontekst funkcjonowania',
                            val: student.wopfuDraft.conditionsAndContext,
                          },
                          {
                            label: 'Funkcjonowanie poznawcze i edukacyjne',
                            val: student.wopfuDraft.functioningAreas.cognitive,
                          },
                          {
                            label: 'Komunikacja i język',
                            val: student.wopfuDraft.functioningAreas
                              .communication,
                          },
                          {
                            label: 'Sfera emocjonalno-społeczna',
                            val: student.wopfuDraft.functioningAreas
                              .emotionalSocial,
                          },
                          {
                            label: 'Motoryka i sfera sensoryczna',
                            val: student.wopfuDraft.functioningAreas
                              .motorSensory,
                          },
                          {
                            label: 'Mocne strony i zasoby ucznia',
                            val: student.wopfuDraft.strengths
                              .map((s) => `• ${s}`)
                              .join('\n'),
                          },
                          {
                            label: 'Napotykane bariery i trudności',
                            val: student.wopfuDraft.barriersAndNeeds
                              .map((b) => `• ${b}`)
                              .join('\n'),
                          },
                          {
                            label:
                              'Podsumowanie potrzeb rozwojowych i edukacyjnych',
                            val: student.wopfuDraft.developmentalNeedsSummary,
                          },
                        ].map((row) => (
                          <tr key={row.label} className="print-avoid-break">
                            <th className="w-[28%] border border-slate-300 bg-slate-50 px-2.5 py-1.5 text-left align-top font-semibold text-slate-700">
                              {row.label}
                            </th>
                            <td className="border border-slate-300 px-2.5 py-1.5 whitespace-pre-line leading-relaxed">
                              {row.val?.trim() || 'Nie uzupełniono'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </section>
                )}

                <section>
                  <h3 className="text-xs font-bold uppercase tracking-wide text-blue-900 mb-2 print-keep-with-next">
                    Część II. Indywidualny Program Edukacyjno-Terapeutyczny
                    (IPET)
                    {student.ipetDraft.approvedDate
                      ? ` — data zatwierdzenia: ${student.ipetDraft.approvedDate}`
                      : ''}
                  </h3>
                  <table className="w-full border-collapse text-xs">
                    <tbody>
                      {[
                        {
                          label: '1. Cele edukacyjne i terapeutyczne',
                          val: student.ipetDraft.educationalAndTherapeuticGoals,
                        },
                        {
                          label: '2. Metody i formy pracy z uczniem',
                          val: student.ipetDraft.methodsAndFormsOfWork,
                        },
                        {
                          label:
                            '4. Zintegrowane działania nauczycieli i specjalistów',
                          val: student.ipetDraft.integratedTeamActions,
                        },
                        {
                          label:
                            '7. Zakres i sposób współpracy z rodzicami / opiekunami',
                          val: student.ipetDraft.parentCollaborationNotes,
                        },
                      ].map((row) => (
                        <tr key={row.label} className="print-avoid-break">
                          <th className="w-[28%] border border-slate-300 bg-slate-50 px-2.5 py-1.5 text-left align-top font-semibold text-slate-700">
                            {row.label}
                          </th>
                          <td className="border border-slate-300 px-2.5 py-1.5 whitespace-pre-line leading-relaxed">
                            {row.val?.trim() || 'Nie uzupełniono'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </section>

                <section>
                  <h3 className="text-xs font-bold uppercase tracking-wide text-blue-900 mb-2 print-keep-with-next">
                    3. Zakres dostosowania wymagań edukacyjnych
                  </h3>
                  {student.ipetDraft.subjectAdaptations.length === 0 ? (
                    <p className="text-xs italic text-slate-500">
                      Brak szczegółowych dostosowań przedmiotowych.
                    </p>
                  ) : (
                    <table className="w-full border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-100">
                          <th className="w-[22%] border border-slate-300 px-2.5 py-1.5 text-left font-semibold">
                            Przedmiot / obszar
                          </th>
                          <th className="w-[41%] border border-slate-300 px-2.5 py-1.5 text-left font-semibold">
                            Metody, formy pracy i warunki
                          </th>
                          <th className="w-[37%] border border-slate-300 px-2.5 py-1.5 text-left font-semibold">
                            Wymagania i ocenianie
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {student.ipetDraft.subjectAdaptations.map((a) => (
                          <tr key={a.id} className="print-avoid-break">
                            <td className="border border-slate-300 px-2.5 py-1.5 font-semibold align-top">
                              {a.subject}
                            </td>
                            <td className="border border-slate-300 px-2.5 py-1.5 whitespace-pre-line align-top">
                              {a.methodsAndForms}
                            </td>
                            <td className="border border-slate-300 px-2.5 py-1.5 whitespace-pre-line align-top">
                              {a.assessmentCriteria}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </section>

                <section>
                  <h3 className="text-xs font-bold uppercase tracking-wide text-blue-900 mb-2 print-keep-with-next">
                    5. Formy i okresy udzielania pomocy
                    psychologiczno-pedagogicznej
                  </h3>
                  {student.ipetDraft.specialistSupportHours.length === 0 ? (
                    <p className="text-xs italic text-slate-500">
                      Brak wpisanych form pomocy PPP.
                    </p>
                  ) : (
                    <table className="w-full border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-100">
                          <th className="border border-slate-300 px-2.5 py-1.5 text-left font-semibold">
                            Forma pomocy
                          </th>
                          <th className="border border-slate-300 px-2.5 py-1.5 text-left font-semibold">
                            Okres
                          </th>
                          <th className="border border-slate-300 px-2.5 py-1.5 text-center font-semibold">
                            Wymiar
                          </th>
                          <th className="border border-slate-300 px-2.5 py-1.5 text-left font-semibold">
                            Prowadzący
                          </th>
                          <th className="border border-slate-300 px-2.5 py-1.5 text-left font-semibold">
                            Cel funkcjonalny
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {student.ipetDraft.specialistSupportHours.map((s) => (
                          <tr key={s.id} className="print-avoid-break">
                            <td className="border border-slate-300 px-2.5 py-1.5 font-semibold align-top">
                              {s.type}
                            </td>
                            <td className="border border-slate-300 px-2.5 py-1.5 align-top">
                              {s.period}
                            </td>
                            <td className="border border-slate-300 px-2.5 py-1.5 text-center tabular-nums align-top">
                              {s.hoursPerWeek} godz./tyg.
                            </td>
                            <td className="border border-slate-300 px-2.5 py-1.5 align-top">
                              {s.specialistName}
                            </td>
                            <td className="border border-slate-300 px-2.5 py-1.5 align-top">
                              {s.functionalGoal}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </section>

                <section>
                  <h3 className="text-xs font-bold uppercase tracking-wide text-blue-900 mb-2 print-keep-with-next">
                    6. Zajęcia rewalidacyjne / socjoterapeutyczne /
                    resocjalizacyjne
                  </h3>
                  {student.ipetDraft.rehabAndSpecialClasses.length === 0 ? (
                    <p className="text-xs italic text-slate-500">
                      Brak wpisanych zajęć rewalidacyjnych lub
                      specjalistycznych.
                    </p>
                  ) : (
                    <table className="w-full border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-100">
                          <th className="border border-slate-300 px-2.5 py-1.5 text-left font-semibold">
                            Kategoria i nazwa zajęć
                          </th>
                          <th className="border border-slate-300 px-2.5 py-1.5 text-left font-semibold">
                            Okres
                          </th>
                          <th className="border border-slate-300 px-2.5 py-1.5 text-center font-semibold">
                            Wymiar
                          </th>
                          <th className="border border-slate-300 px-2.5 py-1.5 text-left font-semibold">
                            Specjalista
                          </th>
                          <th className="border border-slate-300 px-2.5 py-1.5 text-left font-semibold">
                            Cel funkcjonalny
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {student.ipetDraft.rehabAndSpecialClasses.map((r) => (
                          <tr key={r.id} className="print-avoid-break">
                            <td className="border border-slate-300 px-2.5 py-1.5 align-top">
                              <div className="text-[10px] text-slate-500">
                                {REHAB_CATEGORY_LABELS[r.category]}
                              </div>
                              <div className="font-semibold">{r.name}</div>
                            </td>
                            <td className="border border-slate-300 px-2.5 py-1.5 align-top">
                              {r.period}
                            </td>
                            <td className="border border-slate-300 px-2.5 py-1.5 text-center tabular-nums align-top">
                              {r.hoursPerWeek} godz./tyg.
                            </td>
                            <td className="border border-slate-300 px-2.5 py-1.5 align-top">
                              {r.specialistName}
                            </td>
                            <td className="border border-slate-300 px-2.5 py-1.5 align-top">
                              {r.functionalGoal}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </section>
              </>
            ) : (
              <>
                <section>
                  <h3 className="text-xs font-bold uppercase tracking-wide text-blue-900 mb-2 print-keep-with-next">
                    Część I. Profil funkcjonalny i współpraca z rodzicami
                  </h3>
                  <table className="w-full border-collapse text-xs">
                    <tbody>
                      <tr className="print-avoid-break">
                        <th className="w-[28%] border border-slate-300 bg-slate-50 px-2.5 py-1.5 text-left align-top font-semibold text-slate-700">
                          Profil funkcjonalny ucznia
                        </th>
                        <td className="border border-slate-300 px-2.5 py-1.5 whitespace-pre-line">
                          {student.opinionSupportDraft.functionalProfileSummary?.trim() ||
                            'Nie uzupełniono'}
                        </td>
                      </tr>
                      <tr className="print-avoid-break">
                        <th className="border border-slate-300 bg-slate-50 px-2.5 py-1.5 text-left align-top font-semibold text-slate-700">
                          Zalecenia z opinii PPP
                        </th>
                        <td className="border border-slate-300 px-2.5 py-1.5 whitespace-pre-line">
                          {student.pppDocument.recommendationsSummary?.trim() ||
                            'Nie uzupełniono'}
                        </td>
                      </tr>
                      <tr className="print-avoid-break">
                        <th className="border border-slate-300 bg-slate-50 px-2.5 py-1.5 text-left align-top font-semibold text-slate-700">
                          Współpraca z rodzicami / opiekunami
                        </th>
                        <td className="border border-slate-300 px-2.5 py-1.5 whitespace-pre-line">
                          {student.opinionSupportDraft.parentCollaborationNotes?.trim() ||
                            'Nie uzupełniono'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </section>

                <section>
                  <h3 className="text-xs font-bold uppercase tracking-wide text-blue-900 mb-2 print-keep-with-next">
                    Część II. Zakres dostosowania wymagań edukacyjnych
                  </h3>
                  {student.opinionSupportDraft.subjectAdaptations.length ===
                  0 ? (
                    <p className="text-xs italic text-slate-500">
                      Brak szczegółowych dostosowań przedmiotowych.
                    </p>
                  ) : (
                    <table className="w-full border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-100">
                          <th className="w-[22%] border border-slate-300 px-2.5 py-1.5 text-left font-semibold">
                            Przedmiot / obszar
                          </th>
                          <th className="w-[41%] border border-slate-300 px-2.5 py-1.5 text-left font-semibold">
                            Metody, formy pracy i warunki
                          </th>
                          <th className="w-[37%] border border-slate-300 px-2.5 py-1.5 text-left font-semibold">
                            Wymagania i ocenianie
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {student.opinionSupportDraft.subjectAdaptations.map(
                          (a) => (
                            <tr key={a.id} className="print-avoid-break">
                              <td className="border border-slate-300 px-2.5 py-1.5 font-semibold align-top">
                                {a.subject}
                              </td>
                              <td className="border border-slate-300 px-2.5 py-1.5 whitespace-pre-line align-top">
                                {a.methodsAndForms}
                              </td>
                              <td className="border border-slate-300 px-2.5 py-1.5 whitespace-pre-line align-top">
                                {a.assessmentCriteria}
                              </td>
                            </tr>
                          ),
                        )}
                      </tbody>
                    </table>
                  )}
                </section>

                <section>
                  <h3 className="text-xs font-bold uppercase tracking-wide text-blue-900 mb-2 print-keep-with-next">
                    Część III. Formy i okresy udzielania pomocy PPP
                  </h3>
                  {student.opinionSupportDraft.psychologicalPedagogicalSupport
                    .length === 0 ? (
                    <p className="text-xs italic text-slate-500">
                      Brak wpisanych form pomocy PPP.
                    </p>
                  ) : (
                    <table className="w-full border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-100">
                          <th className="border border-slate-300 px-2.5 py-1.5 text-left font-semibold">
                            Forma pomocy
                          </th>
                          <th className="border border-slate-300 px-2.5 py-1.5 text-left font-semibold">
                            Okres
                          </th>
                          <th className="border border-slate-300 px-2.5 py-1.5 text-center font-semibold">
                            Wymiar
                          </th>
                          <th className="border border-slate-300 px-2.5 py-1.5 text-left font-semibold">
                            Prowadzący
                          </th>
                          <th className="border border-slate-300 px-2.5 py-1.5 text-left font-semibold">
                            Cel funkcjonalny
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {student.opinionSupportDraft.psychologicalPedagogicalSupport.map(
                          (s) => (
                            <tr key={s.id} className="print-avoid-break">
                              <td className="border border-slate-300 px-2.5 py-1.5 font-semibold align-top">
                                {s.type}
                              </td>
                              <td className="border border-slate-300 px-2.5 py-1.5 align-top">
                                {s.period}
                              </td>
                              <td className="border border-slate-300 px-2.5 py-1.5 text-center tabular-nums align-top">
                                {s.hoursPerWeek} godz./tyg.
                              </td>
                              <td className="border border-slate-300 px-2.5 py-1.5 align-top">
                                {s.specialistName}
                              </td>
                              <td className="border border-slate-300 px-2.5 py-1.5 align-top">
                                {s.functionalGoal}
                              </td>
                            </tr>
                          ),
                        )}
                      </tbody>
                    </table>
                  )}
                </section>
              </>
            )}

            {sortedAnnexes.length > 0 && (
              <section>
                <h3 className="text-xs font-bold uppercase tracking-wide text-blue-900 mb-2 print-keep-with-next">
                  Historia modyfikacji i aneksów do programu
                </h3>
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="w-16 border border-slate-300 px-2 py-1.5 text-center font-semibold">
                        Wersja
                      </th>
                      <th className="w-24 border border-slate-300 px-2.5 py-1.5 text-left font-semibold">
                        Data
                      </th>
                      <th className="w-[26%] border border-slate-300 px-2.5 py-1.5 text-left font-semibold">
                        Tytuł / decyzja
                      </th>
                      <th className="border border-slate-300 px-2.5 py-1.5 text-left font-semibold">
                        Zakres zmian lub uzasadnienie
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedAnnexes.map((a) => (
                      <tr key={a.id} className="print-avoid-break">
                        <td className="border border-slate-300 px-2 py-1.5 text-center font-mono font-semibold align-top">
                          v{a.versionNumber}
                        </td>
                        <td className="border border-slate-300 px-2.5 py-1.5 font-mono tabular-nums align-top">
                          {a.annexDate}
                        </td>
                        <td className="border border-slate-300 px-2.5 py-1.5 font-medium align-top">
                          {a.title}
                        </td>
                        <td className="border border-slate-300 px-2.5 py-1.5 align-top">
                          {a.changedSections.length > 0 && (
                            <span className="font-medium">
                              [{a.changedSections.join(', ')}]{' '}
                            </span>
                          )}
                          {a.changeDescription}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            )}
          </div>
        )}

        {/* WARIANT 2: ARKUSZ OCENY OKRESOWEJ */}
        {variant === 'EVALUATION' && (
          <div className="mt-6 space-y-6">
            {filteredEvaluations.length === 0 ? (
              <p className="text-xs italic text-slate-500">
                Brak zapisanych ocen okresowych dla tego ucznia.
              </p>
            ) : (
              filteredEvaluations.map((ev, idx) => {
                const linkedAnnex = ev.linkedAnnexId
                  ? annexes.find((a) => a.id === ev.linkedAnnexId)
                  : undefined;
                return (
                  <section key={ev.id} className="space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-wide text-blue-900 print-keep-with-next">
                      {idx + 1}. {ev.periodLabel} ({ev.schoolYear}) — data
                      oceny: {ev.evaluationDate}
                    </h3>
                    <table className="w-full border-collapse text-xs">
                      <tbody>
                        <tr className="print-avoid-break">
                          <th className="w-[28%] border border-slate-300 bg-slate-50 px-2.5 py-1.5 text-left font-semibold text-slate-700">
                            Rodzaj i status oceny
                          </th>
                          <td className="border border-slate-300 px-2.5 py-1.5">
                            {ev.type === 'WOPFU_AKTUALIZACJA'
                              ? 'Aktualizacja WOPFU + ocena'
                              : 'Okresowa ocena efektywności wsparcia'}{' '}
                            · Status:{' '}
                            <strong>
                              {ev.status === 'ZATWIERDZONA'
                                ? 'Zatwierdzona'
                                : 'Szkic roboczy'}
                            </strong>
                          </td>
                        </tr>
                        <tr className="print-avoid-break">
                          <th className="border border-slate-300 bg-slate-50 px-2.5 py-1.5 text-left font-semibold text-slate-700">
                            Skład zespołu oceniającego
                          </th>
                          <td className="border border-slate-300 px-2.5 py-1.5">
                            {ev.teamMembers || '—'}
                          </td>
                        </tr>
                        <tr className="print-avoid-break">
                          <th className="border border-slate-300 bg-slate-50 px-2.5 py-1.5 text-left font-semibold text-slate-700">
                            Ocena skuteczności wsparcia
                          </th>
                          <td className="border border-slate-300 px-2.5 py-1.5 font-semibold">
                            {
                              EFFECTIVENESS_RATING_LABELS[
                                ev.effectivenessRating
                              ]
                            }
                          </td>
                        </tr>
                        <tr className="print-avoid-break">
                          <th className="border border-slate-300 bg-slate-50 px-2.5 py-1.5 text-left font-semibold text-slate-700">
                            Odniesienie do celów i obserwacji
                          </th>
                          <td className="border border-slate-300 px-2.5 py-1.5 whitespace-pre-line">
                            {ev.goalsReferenceNotes || '—'}
                          </td>
                        </tr>
                        <tr className="print-avoid-break">
                          <th className="border border-slate-300 bg-slate-50 px-2.5 py-1.5 text-left font-semibold text-slate-700">
                            Podsumowanie postępów i wnioski
                          </th>
                          <td className="border border-slate-300 px-2.5 py-1.5 whitespace-pre-line">
                            {ev.progressSummary || '—'}
                          </td>
                        </tr>
                        <tr className="print-avoid-break">
                          <th className="border border-slate-300 bg-slate-50 px-2.5 py-1.5 text-left font-semibold text-slate-700">
                            Decyzja zespołu / aneks
                          </th>
                          <td className="border border-slate-300 px-2.5 py-1.5 whitespace-pre-line">
                            {ev.modificationDecision === 'WPROWADZONO_ANEKS' ? (
                              <>
                                <strong>Wprowadzono modyfikację / aneks:</strong>{' '}
                                {ev.modificationsNeeded || '—'}
                                {linkedAnnex &&
                                  ` (Aneks v${linkedAnnex.versionNumber} z dn. ${linkedAnnex.annexDate})`}
                              </>
                            ) : (
                              <>
                                <strong>Świadomy brak zmian w programie:</strong>{' '}
                                {ev.noChangeJustification || '—'}
                              </>
                            )}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </section>
                );
              })
            )}
          </div>
        )}

        {/* WARIANT 3: KARTA OBSERWACJI I PODSUMOWANIE DZIAŁAŃ */}
        {variant === 'JOURNAL' && (
          <div className="mt-6 space-y-6">
            <section>
              <h3 className="text-xs font-bold uppercase tracking-wide text-blue-900 mb-2 print-keep-with-next">
                Podsumowanie zakresu działań i ciągłości wsparcia
              </h3>
              <table className="w-full border-collapse text-xs">
                <tbody>
                  <tr className="print-avoid-break">
                    <th className="w-[30%] border border-slate-300 bg-slate-50 px-2.5 py-1.5 text-left font-semibold text-slate-700">
                      Zakres wydruku obserwacji
                    </th>
                    <td className="border border-slate-300 px-2.5 py-1.5">
                      {journalAreaFilter === 'ALL'
                        ? `Wszystkie obszary funkcjonowania (${filteredJournalEntries.length} wpisów)`
                        : `Obszar: ${journalAreaFilter} (${filteredJournalEntries.length} wpisów)`}
                    </td>
                  </tr>
                  <tr className="print-avoid-break">
                    <th className="border border-slate-300 bg-slate-50 px-2.5 py-1.5 text-left font-semibold text-slate-700">
                      Oceny okresowe i aneksy
                    </th>
                    <td className="border border-slate-300 px-2.5 py-1.5 tabular-nums">
                      Zapisane oceny okresowe: {evaluations.length} · Aneksy i
                      decyzje o ciągłości: {annexes.length}
                    </td>
                  </tr>
                </tbody>
              </table>
            </section>

            <section>
              <h3 className="text-xs font-bold uppercase tracking-wide text-blue-900 mb-2 print-keep-with-next">
                Chronologiczny rejestr obserwacji i wniosków
              </h3>
              {filteredJournalEntries.length === 0 ? (
                <p className="text-xs italic text-slate-500">
                  Brak wpisów w dzienniku obserwacji dla wybranego filtra.
                </p>
              ) : (
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="w-24 border border-slate-300 px-2 py-1.5 text-left font-semibold">
                        Data
                      </th>
                      <th className="w-[18%] border border-slate-300 px-2.5 py-1.5 text-left font-semibold">
                        Autor / rola
                      </th>
                      <th className="w-[20%] border border-slate-300 px-2.5 py-1.5 text-left font-semibold">
                        Obszar / kategoria
                      </th>
                      <th className="border border-slate-300 px-2.5 py-1.5 text-left font-semibold">
                        Obserwacje, bariery i wnioski
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredJournalEntries.map((entry) => (
                      <tr key={entry.id} className="print-avoid-break">
                        <td className="border border-slate-300 px-2 py-1.5 font-mono font-medium tabular-nums align-top">
                          {entry.date}
                        </td>
                        <td className="border border-slate-300 px-2.5 py-1.5 align-top">
                          <div className="font-semibold">
                            {entry.authorName}
                          </div>
                          <div className="text-[11px] text-slate-600">
                            {entry.authorRole}
                          </div>
                        </td>
                        <td className="border border-slate-300 px-2.5 py-1.5 align-top">
                          <div className="font-semibold text-blue-900">
                            {JOURNAL_CATEGORY_LABELS[entry.category]}
                          </div>
                          <div className="text-[11px] text-slate-600 mt-0.5">
                            {entry.relatedArea}
                          </div>
                        </td>
                        <td className="border border-slate-300 px-2.5 py-1.5 space-y-1 align-top">
                          <div className="font-semibold text-slate-900">
                            {entry.title}
                          </div>
                          {entry.content?.trim() && (
                            <div className="text-slate-700">{entry.content}</div>
                          )}
                          {entry.whatWorked?.trim() && (
                            <div className="text-teal-800">
                              <strong>Co zadziałało:</strong> {entry.whatWorked}
                            </div>
                          )}
                          {entry.barriersObserved?.trim() && (
                            <div className="text-amber-900">
                              <strong>Bariery:</strong> {entry.barriersObserved}
                            </div>
                          )}
                          {entry.conclusions?.trim() && (
                            <div className="font-medium text-slate-900">
                              <strong>Wnioski:</strong> {entry.conclusions}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          </div>
        )}

        {/* Blok podpisów zespołu, dyrektora i potwierdzenia rodzica */}
        <footer className="mt-8 space-y-5 print-avoid-break">
          <div className="text-xs text-slate-700 tabular-nums">
            {settings.city?.trim() || '........................'}, dnia{' '}
            {preparedDate}
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wide text-blue-900 mb-2">
              Podpisy członków zespołu nauczycieli i specjalistów
            </h3>
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100">
                  <th className="w-10 border border-slate-300 px-2 py-1.5 text-center font-semibold">
                    Lp.
                  </th>
                  <th className="w-[30%] border border-slate-300 px-2.5 py-1.5 text-left font-semibold">
                    Imię i nazwisko
                  </th>
                  <th className="w-[34%] border border-slate-300 px-2.5 py-1.5 text-left font-semibold">
                    Funkcja / stanowisko
                  </th>
                  <th className="border border-slate-300 px-2.5 py-1.5 text-left font-semibold">
                    Podpis i data
                  </th>
                </tr>
              </thead>
              <tbody>
                {membersForSignatures.map((m, idx) => (
                  <tr key={m.id} className="print-avoid-break">
                    <td className="border border-slate-300 px-2 py-2.5 text-center tabular-nums">
                      {idx + 1}.
                    </td>
                    <td className="border border-slate-300 px-2.5 py-2.5 font-medium">
                      {m.name}
                    </td>
                    <td className="border border-slate-300 px-2.5 py-2.5">
                      {m.isCoordinator ? `${m.role} (Koordynator)` : m.role}
                    </td>
                    <td className="border border-slate-300 px-2.5 py-2.5" />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {variant === 'IPET' && student.documentType === 'ORZECZENIE' && (
            <div className="border border-slate-400 p-3.5 text-xs print-avoid-break">
              <div className="font-bold text-slate-900">
                Zatwierdzenie programu przez Dyrektora placówki
              </div>
              <div className="text-slate-600 mt-0.5">
                {settings.directorName?.trim()
                  ? `Dyrektor: ${settings.directorName.trim()}`
                  : 'Dyrektor placówki'}
              </div>
              <div className="mt-8 grid grid-cols-2 gap-8 text-center text-[11px] text-slate-500">
                <div>
                  <div className="border-t border-dotted border-slate-500 pt-1">
                    miejscowość, data
                  </div>
                </div>
                <div>
                  <div className="border-t border-dotted border-slate-500 pt-1">
                    pieczątka i podpis Dyrektora
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="border border-slate-400 p-3.5 text-xs print-avoid-break">
            <div className="font-bold text-slate-900">
              Potwierdzenie zapoznania się oraz otrzymania kopii dokumentu przez
              rodzica / opiekuna prawnego
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-700">
              Oświadczam, że zostałem/am zapoznany/a z treścią powyższego
              dokumentu, ustalonymi formami wsparcia oraz otrzymałem/am jego
              kopię (lub informację o programie i dostosowaniach).
            </p>
            <div className="mt-8 grid grid-cols-2 gap-8 text-center text-[11px] text-slate-500">
              <div>
                <div className="border-t border-dotted border-slate-500 pt-1">
                  data potwierdzenia
                </div>
              </div>
              <div>
                <div className="border-t border-dotted border-slate-500 pt-1">
                  czytelny podpis rodzica / opiekuna prawnego
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-slate-200 pt-2 text-[10px] leading-snug text-slate-500">
            Wzór pomocniczy (stan prawny opracowania na dzień{' '}
            {LEGAL_FRAMEWORK_AS_OF_PL}). Zatwierdzenie treści oraz weryfikacja
            zgodności z aktualnymi przepisami i procedurami placówki należą do
            zespołu oraz dyrektora szkoły.
          </div>
        </footer>
      </div>
    </div>
  );
};
