import React, { useMemo, useState } from 'react';
import {
  CalendarCheck,
  CheckCircle2,
  FileDiff,
  History,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import {
  EFFECTIVENESS_RATING_LABELS,
  EVALUATION_PERIOD_LABELS,
  IPET_ANNEX_SECTIONS,
  type AnnexDecisionType,
  type EffectivenessRating,
  type EvaluationPeriodType,
  type EvaluationStatus,
  type EvaluationType,
  type JournalEntry,
  type ModificationDecision,
  type PeriodicEvaluation,
  type ProgramModificationAnnex,
  type StudentProfile,
} from '../../types/domain';
import { ConfirmDialog } from '../ConfirmDialog';
import { TestDataStamp } from '../TestDataStamp';

interface PeriodicEvaluationAndAnnexesViewProps {
  student: StudentProfile;
  evaluations: PeriodicEvaluation[];
  annexes: ProgramModificationAnnex[];
  journalEntries: JournalEntry[];
  onSaveEvaluation: (evaluation: PeriodicEvaluation) => Promise<void>;
  onDeleteEvaluation: (evaluationId: string) => Promise<void>;
  onSaveAnnex: (annex: ProgramModificationAnnex) => Promise<void>;
  onDeleteAnnex: (annexId: string) => Promise<void>;
}

export const PeriodicEvaluationAndAnnexesView: React.FC<
  PeriodicEvaluationAndAnnexesViewProps
> = ({
  student,
  evaluations,
  annexes,
  journalEntries,
  onSaveEvaluation,
  onDeleteEvaluation,
  onSaveAnnex,
  onDeleteAnnex,
}) => {
  const isOrzeczenie = student.documentType === 'ORZECZENIE';
  const [selectedYear, setSelectedYear] = useState(student.schoolYear);
  const [showEvalForm, setShowEvalForm] = useState(false);
  const [showAnnexForm, setShowAnnexForm] = useState(false);
  const [deleteEvalId, setDeleteEvalId] = useState<string | null>(null);
  const [deleteAnnexId, setDeleteAnnexId] = useState<string | null>(null);

  // Formularz oceny okresowej
  const defaultTeamText = useMemo(() => {
    if (student.teamMembers.length > 0) {
      return student.teamMembers.map((m) => `${m.name} (${m.role})`).join(', ');
    }
    return student.teamCoordinator || 'Zespół nauczycieli i specjalistów';
  }, [student.teamMembers, student.teamCoordinator]);

  const [evalDate, setEvalDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [evalSchoolYear, setEvalSchoolYear] = useState(student.schoolYear);
  const [periodType, setPeriodType] =
    useState<EvaluationPeriodType>('I_POLROCZE');
  const [periodLabel, setPeriodLabel] = useState(
    `Ocena za I półrocze ${student.schoolYear}`,
  );
  const [evalType, setEvalType] = useState<EvaluationType>(
    isOrzeczenie ? 'OCENA_OKRESOWA_IPET' : 'WOPFU_AKTUALIZACJA',
  );
  const [evalTeam, setEvalTeam] = useState(defaultTeamText);
  const [goalsReferenceNotes, setGoalsReferenceNotes] = useState('');
  const [effectivenessRating, setEffectivenessRating] =
    useState<EffectivenessRating>('CZESCIOWA');
  const [progressSummary, setProgressSummary] = useState('');
  const [modificationDecision, setModificationDecision] =
    useState<ModificationDecision>('WPROWADZONO_ANEKS');
  const [modificationsNeeded, setModificationsNeeded] = useState('');
  const [noChangeJustification, setNoChangeJustification] = useState('');
  const [changedSections, setChangedSections] = useState<string[]>([]);
  const [parentNotifiedDate, setParentNotifiedDate] = useState('');
  const [evalStatus, setEvalStatus] = useState<EvaluationStatus>('ZATWIERDZONA');
  const [evalError, setEvalError] = useState<string | null>(null);

  // Formularz samodzielnego aneksu / modyfikacji
  const [annexDate, setAnnexDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [annexTitle, setAnnexTitle] = useState('');
  const [annexDecision, setAnnexDecision] = useState<AnnexDecisionType>(
    isOrzeczenie ? 'MODYFIKACJA_IPET' : 'AKTUALIZACJA_DOSTOSOWAN',
  );
  const [annexSections, setAnnexSections] = useState<string[]>([]);
  const [annexDescription, setAnnexDescription] = useState('');
  const [annexParentDate, setAnnexParentDate] = useState('');
  const [annexError, setAnnexError] = useState<string | null>(null);

  // Podsumowanie cyklu min. 2 ocen w roku szkolnym
  const cycleStats = useMemo(() => {
    const yearEvals = evaluations.filter((e) => e.schoolYear === selectedYear);
    const hasFirstSemester = yearEvals.some(
      (e) => e.periodType === 'I_POLROCZE' || e.semester === 'I',
    );
    const hasEndOfYear = yearEvals.some(
      (e) => e.periodType === 'KONIEC_ROKU' || e.semester === 'II',
    );
    return {
      totalInYear: yearEvals.length,
      hasFirstSemester,
      hasEndOfYear,
    };
  }, [evaluations, selectedYear]);

  const availableYears = useMemo(() => {
    const set = new Set<string>([student.schoolYear]);
    evaluations.forEach((e) => set.add(e.schoolYear));
    annexes.forEach((a) => set.add(a.schoolYear));
    return Array.from(set).sort((a, b) => b.localeCompare(a, 'pl'));
  }, [student.schoolYear, evaluations, annexes]);

  const nextVersionNumber = useMemo(() => {
    if (annexes.length === 0) return 1;
    return Math.max(...annexes.map((a) => a.versionNumber)) + 1;
  }, [annexes]);

  const handlePeriodTypeChange = (nextType: EvaluationPeriodType) => {
    setPeriodType(nextType);
    if (nextType === 'I_POLROCZE') {
      setPeriodLabel(`Ocena za I półrocze ${evalSchoolYear}`);
    } else if (nextType === 'KONIEC_ROKU') {
      setPeriodLabel(`Ocena na koniec roku szkolnego ${evalSchoolYear}`);
    } else {
      setPeriodLabel(`Ocena doraźna (${evalSchoolYear})`);
    }
  };

  const toggleSection = (
    list: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    section: string,
  ) => {
    if (list.includes(section)) {
      setter(list.filter((s) => s !== section));
    } else {
      setter([...list, section]);
    }
  };

  const handleImportGoalsAndJournalContext = () => {
    const parts: string[] = [];
    if (isOrzeczenie && student.ipetDraft.educationalAndTherapeuticGoals) {
      parts.push(
        `Cele IPET: ${student.ipetDraft.educationalAndTherapeuticGoals}`,
      );
    } else if (!isOrzeczenie && student.opinionSupportDraft.functionalProfileSummary) {
      parts.push(
        `Założenia wsparcia (Opinia PPP): ${student.opinionSupportDraft.functionalProfileSummary}`,
      );
    }
    const recentObs = journalEntries.slice(0, 3);
    if (recentObs.length > 0) {
      parts.push(
        `Ostatnie obserwacje z dziennika (${recentObs.length}): ${recentObs
          .map(
            (o) =>
              `[${o.date}] ${o.title}${o.conclusions ? ` — wnioski: ${o.conclusions}` : ''}`,
          )
          .join('; ')}`,
      );
    }
    if (parts.length > 0) {
      setGoalsReferenceNotes(parts.join('\n'));
    }
  };

  const handleCreateEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!progressSummary.trim()) {
      setEvalError('Opisz ocenę skuteczności dotychczasowych form wsparcia.');
      return;
    }
    if (
      modificationDecision === 'WPROWADZONO_ANEKS' &&
      !modificationsNeeded.trim()
    ) {
      setEvalError('Opisz zakres modyfikacji / aneksu.');
      return;
    }
    if (
      modificationDecision === 'BRAK_ZMIAN' &&
      !noChangeJustification.trim()
    ) {
      setEvalError(
        'Podaj uzasadnienie świadomego utrzymania programu bez zmian.',
      );
      return;
    }

    setEvalError(null);
    const now = new Date().toISOString();
    const evaluationId = crypto.randomUUID();
    const annexId = crypto.randomUUID();

    const annexRecord: ProgramModificationAnnex = {
      id: annexId,
      studentId: student.id,
      versionNumber: nextVersionNumber,
      annexDate: evalDate,
      schoolYear: evalSchoolYear.trim() || student.schoolYear,
      evaluationId,
      decisionType:
        modificationDecision === 'BRAK_ZMIAN'
          ? 'BRAK_ZMIAN'
          : isOrzeczenie
            ? 'MODYFIKACJA_IPET'
            : 'AKTUALIZACJA_DOSTOSOWAN',
      title:
        modificationDecision === 'BRAK_ZMIAN'
          ? `Wersja ${nextVersionNumber}: Kontynuacja bez zmian (${periodLabel.trim()})`
          : `Aneks nr ${nextVersionNumber} (${periodLabel.trim()})`,
      changedSections:
        modificationDecision === 'BRAK_ZMIAN' ? [] : changedSections,
      changeDescription:
        modificationDecision === 'BRAK_ZMIAN'
          ? noChangeJustification.trim()
          : modificationsNeeded.trim(),
      authorAndTeam: evalTeam.trim() || defaultTeamText,
      parentNotifiedDate: parentNotifiedDate || undefined,
      isTestData: student.isTestData,
      createdAt: now,
      updatedAt: now,
    };

    const evaluationRecord: PeriodicEvaluation = {
      id: evaluationId,
      studentId: student.id,
      schoolYear: evalSchoolYear.trim() || student.schoolYear,
      semester: periodType === 'KONIEC_ROKU' ? 'II' : 'I',
      periodType,
      periodLabel: periodLabel.trim() || EVALUATION_PERIOD_LABELS[periodType],
      evaluationDate: evalDate,
      type: evalType,
      teamMembers: evalTeam.trim() || defaultTeamText,
      goalsReferenceNotes: goalsReferenceNotes.trim(),
      effectivenessRating,
      progressSummary: progressSummary.trim(),
      modificationDecision,
      modificationsNeeded:
        modificationDecision === 'WPROWADZONO_ANEKS'
          ? modificationsNeeded.trim()
          : '',
      noChangeJustification:
        modificationDecision === 'BRAK_ZMIAN'
          ? noChangeJustification.trim()
          : '',
      linkedAnnexId: annexId,
      status: evalStatus,
      isTestData: student.isTestData,
      createdAt: now,
      updatedAt: now,
    };

    await onSaveAnnex(annexRecord);
    await onSaveEvaluation(evaluationRecord);

    setProgressSummary('');
    setModificationsNeeded('');
    setNoChangeJustification('');
    setGoalsReferenceNotes('');
    setChangedSections([]);
    setParentNotifiedDate('');
    setShowEvalForm(false);
  };

  const handleToggleEvaluationStatus = async (ev: PeriodicEvaluation) => {
    await onSaveEvaluation({
      ...ev,
      status: ev.status === 'ZATWIERDZONA' ? 'SZKIC' : 'ZATWIERDZONA',
      updatedAt: new Date().toISOString(),
    });
  };

  const handleCreateStandaloneAnnex = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annexTitle.trim() || !annexDescription.trim()) {
      setAnnexError('Podaj tytuł aneksu oraz opis wprowadzonych zmian lub uzasadnienie.');
      return;
    }
    setAnnexError(null);
    const now = new Date().toISOString();
    await onSaveAnnex({
      id: crypto.randomUUID(),
      studentId: student.id,
      versionNumber: nextVersionNumber,
      annexDate,
      schoolYear: student.schoolYear,
      decisionType: annexDecision,
      title: annexTitle.trim(),
      changedSections: annexDecision === 'BRAK_ZMIAN' ? [] : annexSections,
      changeDescription: annexDescription.trim(),
      authorAndTeam: defaultTeamText,
      parentNotifiedDate: annexParentDate || undefined,
      isTestData: student.isTestData,
      createdAt: now,
      updatedAt: now,
    });
    setAnnexTitle('');
    setAnnexDescription('');
    setAnnexSections([]);
    setAnnexParentDate('');
    setShowAnnexForm(false);
  };

  return (
    <div className="space-y-6">
      {/* Monitor cyklu ocen okresowych (min. 2 razy w roku szkolnym) */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <CalendarCheck className="h-4 w-4 text-blue-700 dark:text-blue-400" />
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Cykl okresowych ocen efektywności (min. 2 razy w roku szkolnym)
              </h3>
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {isOrzeczenie
                ? 'Zespół dokonuje okresowej wielospecjalistycznej oceny funkcjonowania oraz efektywności IPET co najmniej dwa razy w roku szkolnym.'
                : 'Przegląd skuteczności wdrożonych dostosowań wymagań i form pomocy PPP co najmniej raz na półrocze.'}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <select
              aria-label="Wybierz rok szkolny cyklu ocen"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-mono text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
            >
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>
                  Rok {yr}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setShowEvalForm((prev) => !prev)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 whitespace-nowrap shrink-0"
            >
              {showEvalForm ? (
                <>
                  <X className="h-3.5 w-3.5" />
                  <span>Zamknij formularz</span>
                </>
              ) : (
                <>
                  <Plus className="h-3.5 w-3.5" />
                  <span>Nowa ocena okresowa</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 border-t border-slate-100 pt-4 dark:border-slate-800">
          <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-950/60">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              1. Ocena za I półrocze
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-slate-900 dark:text-slate-100">
              <CheckCircle2
                className={`h-4 w-4 ${
                  cycleStats.hasFirstSemester
                    ? 'text-teal-700 dark:text-teal-400'
                    : 'text-slate-300 dark:text-slate-600'
                }`}
              />
              <span>
                {cycleStats.hasFirstSemester ? 'Zrealizowana' : 'Oczekuje na ocenę'}
              </span>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-950/60">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              2. Ocena na koniec roku
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-slate-900 dark:text-slate-100">
              <CheckCircle2
                className={`h-4 w-4 ${
                  cycleStats.hasEndOfYear
                    ? 'text-teal-700 dark:text-teal-400'
                    : 'text-slate-300 dark:text-slate-600'
                }`}
              />
              <span>
                {cycleStats.hasEndOfYear ? 'Zrealizowana' : 'Oczekuje na ocenę'}
              </span>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-950/60">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Łącznie ocen / wersji aneksów
            </div>
            <div className="mt-1 font-mono text-sm font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
              {cycleStats.totalInYear} ocen w {selectedYear} · {annexes.length} wersji w historii
            </div>
          </div>
        </div>
      </div>

      {/* Formularz nowej oceny okresowej */}
      {showEvalForm && (
        <form
          onSubmit={handleCreateEvaluation}
          className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 space-y-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
            <div>
              <h4 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Arkusz okresowej oceny efektywności i decyzji o modyfikacji
              </h4>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Oceń skuteczność form wsparcia w odniesieniu do celów i wpisów z dziennika, a następnie zapisz decyzję o aneksie lub kontynuacji bez zmian.
              </p>
            </div>
            <button
              type="button"
              onClick={handleImportGoalsAndJournalContext}
              className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-800 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950/60 dark:text-blue-200 whitespace-nowrap shrink-0"
            >
              Pobierz cele i ostatnie obserwacje
            </button>
          </div>

          {evalError && (
            <div
              role="alert"
              className="rounded-lg border border-red-300 bg-red-50 px-4 py-2.5 text-xs text-red-900 dark:border-red-800 dark:bg-red-950/60 dark:text-red-200"
            >
              {evalError}
            </div>
          )}

          {/* Panel kontekstu celów i ostatnich obserwacji */}
          {(journalEntries.length > 0 ||
            student.ipetDraft.educationalAndTherapeuticGoals ||
            student.opinionSupportDraft.functionalProfileSummary) && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs space-y-2 dark:border-slate-800 dark:bg-slate-950/60">
              <div className="font-semibold text-slate-800 dark:text-slate-200">
                Kontekst z teczki ucznia ({journalEntries.length} wpisów w dzienniku):
              </div>
              {isOrzeczenie && student.ipetDraft.educationalAndTherapeuticGoals && (
                <p className="text-slate-600 dark:text-slate-300 line-clamp-3">
                  <strong>Zapisane cele IPET:</strong>{' '}
                  {student.ipetDraft.educationalAndTherapeuticGoals}
                </p>
              )}
              {!isOrzeczenie &&
                student.opinionSupportDraft.functionalProfileSummary && (
                  <p className="text-slate-600 dark:text-slate-300 line-clamp-3">
                    <strong>Założenia wsparcia (Opinia PPP):</strong>{' '}
                    {student.opinionSupportDraft.functionalProfileSummary}
                  </p>
                )}
              {journalEntries.slice(0, 3).length > 0 && (
                <div className="text-slate-600 dark:text-slate-300">
                  <strong>Ostatnie obserwacje:</strong>{' '}
                  {journalEntries
                    .slice(0, 3)
                    .map((j) => `${j.date} (${j.title})`)
                    .join(' · ')}
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Okres oceny
              </label>
              <select
                value={periodType}
                onChange={(e) =>
                  handlePeriodTypeChange(e.target.value as EvaluationPeriodType)
                }
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              >
                {Object.entries(EVALUATION_PERIOD_LABELS).map(([k, lbl]) => (
                  <option key={k} value={k}>
                    {lbl}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Etykieta okresu
              </label>
              <input
                type="text"
                value={periodLabel}
                onChange={(e) => setPeriodLabel(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Rok szkolny
              </label>
              <input
                type="text"
                value={evalSchoolYear}
                onChange={(e) => setEvalSchoolYear(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Data posiedzenia zespołu
              </label>
              <input
                type="date"
                required
                value={evalDate}
                onChange={(e) => setEvalDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Przedmiot oceny
              </label>
              <select
                value={evalType}
                onChange={(e) => setEvalType(e.target.value as EvaluationType)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              >
                <option value="OCENA_OKRESOWA_IPET">
                  {isOrzeczenie
                    ? 'Ocena efektywności IPET'
                    : 'Ocena efektywności dostosowań (Opinia)'}
                </option>
                <option value="WOPFU_AKTUALIZACJA">
                  Okresowa ocena funkcjonowania (WOPFU)
                </option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Skuteczność dotychczasowego wsparcia
              </label>
              <select
                value={effectivenessRating}
                onChange={(e) =>
                  setEffectivenessRating(e.target.value as EffectivenessRating)
                }
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              >
                {Object.entries(EFFECTIVENESS_RATING_LABELS).map(([k, lbl]) => (
                  <option key={k} value={k}>
                    {lbl}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Status dokumentu oceny
              </label>
              <select
                value={evalStatus}
                onChange={(e) =>
                  setEvalStatus(e.target.value as EvaluationStatus)
                }
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              >
                <option value="ZATWIERDZONA">Zatwierdzona przez zespół</option>
                <option value="SZKIC">Szkic roboczy</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Skład zespołu uczestniczącego w ocenie
            </label>
            <input
              type="text"
              value={evalTeam}
              onChange={(e) => setEvalTeam(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Odniesienie do celów i kluczowych obserwacji (opcjonalnie)
            </label>
            <textarea
              rows={2}
              value={goalsReferenceNotes}
              onChange={(e) => setGoalsReferenceNotes(e.target.value)}
              placeholder="Możesz użyć przycisku „Pobierz cele i ostatnie obserwacje” powyżej..."
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Ocena efektywności form wsparcia i postępów ucznia *
            </label>
            <textarea
              rows={3}
              required
              value={progressSummary}
              onChange={(e) => setProgressSummary(e.target.value)}
              placeholder="Opisz osiągnięte postępy w języku funkcjonalnym, które dostosowania zadziałały najlepiej i gdzie utrzymują się trudności..."
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
          </div>

          {/* Decyzja w sprawie modyfikacji / aneksu */}
          <div className="space-y-4 border-t border-slate-100 pt-4 dark:border-slate-800">
            <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100">
              Decyzja zespołu: modyfikacja / aneks czy utrzymanie bez zmian?
            </label>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setModificationDecision('WPROWADZONO_ANEKS')}
                className={`rounded-lg border px-4 py-3 text-left text-xs transition-colors ${
                  modificationDecision === 'WPROWADZONO_ANEKS'
                    ? 'border-blue-600 bg-blue-50 text-blue-950 dark:border-blue-500 dark:bg-blue-950/60 dark:text-blue-100'
                    : 'border-slate-200 bg-white text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300'
                }`}
              >
                <div className="font-semibold">
                  {isOrzeczenie
                    ? 'Wprowadzono modyfikację / aneks do IPET'
                    : 'Zaktualizowano dostosowania i pomoc PPP'}
                </div>
                <div className="mt-0.5 text-slate-500 dark:text-slate-400">
                  Utworzy nowy wpis wersji (Aneks nr {nextVersionNumber}) w historii zmian.
                </div>
              </button>

              <button
                type="button"
                onClick={() => setModificationDecision('BRAK_ZMIAN')}
                className={`rounded-lg border px-4 py-3 text-left text-xs transition-colors ${
                  modificationDecision === 'BRAK_ZMIAN'
                    ? 'border-teal-700 bg-teal-50 text-teal-950 dark:border-teal-500 dark:bg-teal-950/50 dark:text-teal-100'
                    : 'border-slate-200 bg-white text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300'
                }`}
              >
                <div className="font-semibold">
                  Świadomy brak zmian (kontynuacja bez aneksu)
                </div>
                <div className="mt-0.5 text-slate-500 dark:text-slate-400">
                  Zapisze w historii wersji potwierdzenie przeglądu wraz z uzasadnieniem.
                </div>
              </button>
            </div>

            {modificationDecision === 'WPROWADZONO_ANEKS' ? (
              <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
                <div>
                  <span className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Modyfikowane obszary dokumentu:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {IPET_ANNEX_SECTIONS.map((sec) => {
                      const selected = changedSections.includes(sec);
                      return (
                        <button
                          key={sec}
                          type="button"
                          onClick={() =>
                            toggleSection(
                              changedSections,
                              setChangedSections,
                              sec,
                            )
                          }
                          className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
                            selected
                              ? 'border-blue-600 bg-blue-700 text-white dark:border-blue-500 dark:bg-blue-600'
                              : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
                          }`}
                        >
                          {sec}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Treść modyfikacji / aneksu nr {nextVersionNumber} *
                  </label>
                  <textarea
                    rows={3}
                    value={modificationsNeeded}
                    onChange={(e) => setModificationsNeeded(e.target.value)}
                    placeholder="Opisz dokładnie co zmieniono (np. wymiar zajęć, nowe dostosowanie na sprawdzianach, zmiana strategii współpracy)..."
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  />
                </div>

                <div className="w-full sm:w-64">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Data przekazania informacji rodzicom
                  </label>
                  <input
                    type="date"
                    value={parentNotifiedDate}
                    onChange={(e) => setParentNotifiedDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-mono text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Uzasadnienie świadomego braku zmian *
                  </label>
                  <textarea
                    rows={2}
                    value={noChangeJustification}
                    onChange={(e) => setNoChangeJustification(e.target.value)}
                    placeholder="np. Dotychczasowe cele i formy pracy są adekwatne i przynoszą stabilne postępy; zespół utrzymuje program w niezmienionej formie na kolejny okres."
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  />
                </div>
                <div className="w-full sm:w-64">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Data poinformowania rodziców o ocenie
                  </label>
                  <input
                    type="date"
                    value={parentNotifiedDate}
                    onChange={(e) => setParentNotifiedDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-mono text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowEvalForm(false)}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              Anuluj
            </button>
            <button
              type="submit"
              className="rounded-lg bg-blue-700 px-5 py-2 text-xs font-semibold text-white hover:bg-blue-800 dark:bg-blue-600"
            >
              Zapisz ocenę i wpis w historii wersji
            </button>
          </div>
        </form>
      )}

      {/* Lista ocen okresowych */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 space-y-4">
        <h4 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          Zapisane oceny okresowe ({evaluations.length})
        </h4>

        {evaluations.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">
            Brak zapisanych ocen okresowych. Dodaj ocenę za I półrocze lub koniec roku szkolnego przyciskiem powyżej.
          </p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {evaluations.map((ev) => (
              <article key={ev.id} className="py-4 first:pt-0 last:pb-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                      <span className="font-mono font-medium text-slate-700 dark:text-slate-200">
                        {ev.evaluationDate}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {ev.periodLabel}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>
                        {EFFECTIVENESS_RATING_LABELS[ev.effectivenessRating]}
                      </span>
                      <span aria-hidden="true">·</span>
                      <button
                        type="button"
                        onClick={() => handleToggleEvaluationStatus(ev)}
                        className="underline decoration-dotted hover:text-slate-800 dark:hover:text-slate-100"
                      >
                        {ev.status === 'ZATWIERDZONA' ? 'Zatwierdzona' : 'Szkic'}
                      </button>
                      {ev.isTestData && (
                        <>
                          <span aria-hidden="true">·</span>
                          <TestDataStamp />
                        </>
                      )}
                    </div>

                    <p className="text-sm leading-relaxed text-slate-800 dark:text-slate-200">
                      {ev.progressSummary}
                    </p>

                    {ev.goalsReferenceNotes && (
                      <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                        <strong>Odniesienie do celów i obserwacji:</strong>{' '}
                        {ev.goalsReferenceNotes}
                      </p>
                    )}

                    {ev.modificationDecision === 'WPROWADZONO_ANEKS' &&
                      ev.modificationsNeeded && (
                        <p className="text-xs leading-relaxed text-blue-900 dark:text-blue-200">
                          <strong>Modyfikacja / aneks:</strong>{' '}
                          {ev.modificationsNeeded}
                        </p>
                      )}

                    {ev.modificationDecision === 'BRAK_ZMIAN' && (
                      <p className="text-xs leading-relaxed text-teal-900 dark:text-teal-200">
                        <strong>Decyzja o braku zmian:</strong>{' '}
                        {ev.noChangeJustification ||
                          'Kontynuacja dotychczasowego programu bez modyfikacji.'}
                      </p>
                    )}

                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Zespół: {ev.teamMembers}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setDeleteEvalId(ev.id)}
                    aria-label="Usuń ocenę okresową"
                    className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/60 dark:hover:text-red-300 shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* Historia wersji, modyfikacji i aneksów */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-slate-700 dark:text-slate-300" />
              <h4 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Historia wersji, modyfikacji i aneksów ({annexes.length})
              </h4>
            </div>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Chronologiczny rejestr zmian wprowadzanych w trakcie roku szkolnego lub potwierdzeń kontynuacji bez zmian.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowAnnexForm((prev) => !prev)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800 whitespace-nowrap shrink-0"
          >
            <FileDiff className="h-3.5 w-3.5" />
            <span>
              {showAnnexForm ? 'Ukryj formularz' : 'Dodaj doraźny aneks / zmianę'}
            </span>
          </button>
        </div>

        {showAnnexForm && (
          <form
            onSubmit={handleCreateStandaloneAnnex}
            className="space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60"
          >
            {annexError && (
              <div
                role="alert"
                className="rounded-lg border border-red-300 bg-red-50 px-3.5 py-2 text-xs text-red-900 dark:border-red-800 dark:bg-red-950/60 dark:text-red-200"
              >
                {annexError}
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Data aneksu / decyzji
                </label>
                <input
                  type="date"
                  required
                  value={annexDate}
                  onChange={(e) => setAnnexDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-mono text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Rodzaj wpisu w historii
                </label>
                <select
                  value={annexDecision}
                  onChange={(e) =>
                    setAnnexDecision(e.target.value as AnnexDecisionType)
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                >
                  <option value="MODYFIKACJA_IPET">Modyfikacja / Aneks IPET</option>
                  <option value="AKTUALIZACJA_DOSTOSOWAN">
                    Aktualizacja dostosowań (Opinia PPP)
                  </option>
                  <option value="BRAK_ZMIAN">
                    Potwierdzenie braku zmian (uzasadnienie)
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Data przekazania rodzicom
                </label>
                <input
                  type="date"
                  value={annexParentDate}
                  onChange={(e) => setAnnexParentDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-mono text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Tytuł aneksu / wpisu (Wersja {nextVersionNumber}) *
              </label>
              <input
                type="text"
                required
                value={annexTitle}
                onChange={(e) => setAnnexTitle(e.target.value)}
                placeholder={`np. Aneks nr ${nextVersionNumber} — zmiana wymiaru zajęć rewalidacyjnych`}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </div>

            {annexDecision !== 'BRAK_ZMIAN' && (
              <div>
                <span className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Zmienione sekcje:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {IPET_ANNEX_SECTIONS.map((sec) => {
                    const selected = annexSections.includes(sec);
                    return (
                      <button
                        key={sec}
                        type="button"
                        onClick={() =>
                          toggleSection(annexSections, setAnnexSections, sec)
                        }
                        className={`rounded-md border px-2.5 py-1 text-xs font-medium ${
                          selected
                            ? 'border-blue-600 bg-blue-700 text-white'
                            : 'border-slate-300 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
                        }`}
                      >
                        {sec}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Opis zmian lub uzasadnienie utrzymania dotychczasowego planu *
              </label>
              <textarea
                rows={3}
                required
                value={annexDescription}
                onChange={(e) => setAnnexDescription(e.target.value)}
                placeholder="Opisz wprowadzone modyfikacje lub uzasadnij utrzymanie bez zmian..."
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAnnexForm(false)}
                className="rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              >
                Anuluj
              </button>
              <button
                type="submit"
                className="rounded-lg bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900"
              >
                Zapisz wersję {nextVersionNumber}
              </button>
            </div>
          </form>
        )}

        {annexes.length === 0 ? (
          <p className="py-4 text-center text-sm text-slate-500 dark:text-slate-400">
            Brak zapisanych aneksów i modyfikacji w historii wersji.
          </p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {annexes.map((annex) => (
              <div key={annex.id} className="py-4 first:pt-0 last:pb-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                      <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                        Wersja {annex.versionNumber}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono">{annex.annexDate}</span>
                      <span aria-hidden="true">·</span>
                      <span>
                        {annex.decisionType === 'BRAK_ZMIAN'
                          ? 'Brak zmian (przegląd)'
                          : annex.decisionType === 'MODYFIKACJA_IPET'
                            ? 'Aneks / modyfikacja IPET'
                            : 'Aktualizacja dostosowań'}
                      </span>
                      {annex.parentNotifiedDate && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>Przekazano rodzicom: {annex.parentNotifiedDate}</span>
                        </>
                      )}
                      {annex.isTestData && (
                        <>
                          <span aria-hidden="true">·</span>
                          <TestDataStamp />
                        </>
                      )}
                    </div>

                    <h5 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {annex.title}
                    </h5>

                    <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                      {annex.changeDescription}
                    </p>

                    {annex.changedSections.length > 0 && (
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        <strong>Zmienione sekcje:</strong>{' '}
                        {annex.changedSections.join(' · ')}
                      </p>
                    )}

                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Zespół: {annex.authorAndTeam}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setDeleteAnnexId(annex.id)}
                    aria-label="Usuń wpis z historii wersji"
                    className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/60 dark:hover:text-red-300 shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={deleteEvalId !== null}
        title="Usunąć ocenę okresową?"
        description="Wybrana ocena okresowa zostanie trwale usunięta z bazy urządzenia."
        confirmLabel="Usuń ocenę"
        destructive
        onCancel={() => setDeleteEvalId(null)}
        onConfirm={async () => {
          if (deleteEvalId) {
            await onDeleteEvaluation(deleteEvalId);
          }
          setDeleteEvalId(null);
        }}
      />

      <ConfirmDialog
        open={deleteAnnexId !== null}
        title="Usunąć wpis z historii wersji / aneksów?"
        description="Wybrana wersja modyfikacji lub potwierdzenie braku zmian zostanie usunięte z historii ucznia."
        confirmLabel="Usuń wpis"
        destructive
        onCancel={() => setDeleteAnnexId(null)}
        onConfirm={async () => {
          if (deleteAnnexId) {
            await onDeleteAnnex(deleteAnnexId);
          }
          setDeleteAnnexId(null);
        }}
      />
    </div>
  );
};
