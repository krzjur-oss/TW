import React, { useState } from 'react';
import { CalendarClock, Plus, Trash2, Users } from 'lucide-react';
import { calculateDocumentDeadlines } from '../../data/functionalExamples';
import type { DocumentType, TeamMember } from '../../types/domain';

interface TeamAndDeadlinesStepProps {
  documentType: DocumentType;
  schoolYear: string;
  submissionDate: string;
  teamMembers: TeamMember[];
  onChangeSubmissionDate: (nextDate: string) => void;
  onChangeTeamMembers: (nextMembers: TeamMember[]) => void;
  onNextStep: () => void;
  nextStepLabel: string;
}

const ROLE_PRESETS = [
  'Pedagog specjalny',
  'Wychowawca klasy',
  'Psycholog szkolny',
  'Logopeda',
  'Terapeuta pedagogiczny',
  'Nauczyciel przedmiotu',
  'Rodzic / opiekun (konsultacje)',
];

export const TeamAndDeadlinesStep: React.FC<TeamAndDeadlinesStepProps> = ({
  documentType,
  schoolYear,
  submissionDate,
  teamMembers,
  onChangeSubmissionDate,
  onChangeTeamMembers,
  onNextStep,
  nextStepLabel,
}) => {
  const [memberName, setMemberName] = useState('');
  const [memberRole, setMemberRole] = useState('Pedagog specjalny');
  const [isCoordinator, setIsCoordinator] = useState(false);

  const deadline = calculateDocumentDeadlines(
    documentType,
    schoolYear,
    submissionDate,
  );

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberName.trim()) return;
    const newMember: TeamMember = {
      id: crypto.randomUUID(),
      name: memberName.trim(),
      role: memberRole.trim() || 'Specjalista',
      isCoordinator,
    };

    const updated: TeamMember[] = isCoordinator
      ? [
          ...teamMembers.map((m): TeamMember => ({ ...m, isCoordinator: false })),
          newMember,
        ]
      : [...teamMembers, newMember];

    onChangeTeamMembers(updated);
    setMemberName('');
    setIsCoordinator(false);
  };

  const handleSetCoordinator = (id: string) => {
    onChangeTeamMembers(
      teamMembers.map((m) => ({
        ...m,
        isCoordinator: m.id === id,
      })),
    );
  };

  const handleRemoveMember = (id: string) => {
    onChangeTeamMembers(teamMembers.filter((m) => m.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Wskaźnik orientacyjnych terminów ustawowych */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-blue-700 dark:text-blue-400 shrink-0" />
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Orientacyjne terminy dokumentacji
              </h3>
            </div>
            <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              {deadline.ruleDescription}
            </p>
            <p
              className={`text-sm font-medium pt-1 ${
                deadline.isUrgentOrOverdue
                  ? 'text-amber-800 dark:text-amber-300'
                  : 'text-slate-900 dark:text-slate-100'
              }`}
            >
              {deadline.statusText}
            </p>
          </div>

          <div className="w-full lg:w-64 shrink-0">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Data złożenia dokumentu PPP w szkole
            </label>
            <input
              type="date"
              value={submissionDate}
              onChange={(e) => onChangeSubmissionDate(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              Na podstawie tej daty przeliczany jest termin orientacyjny.
            </p>
          </div>
        </div>
      </div>

      {/* Skład zespołu nauczycieli i specjalistów */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 space-y-5">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-slate-700 dark:text-slate-300 shrink-0" />
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                {documentType === 'ORZECZENIE'
                  ? 'Skład zespołu opracowującego WOPFU i IPET'
                  : 'Nauczyciele i specjaliści realizujący dostosowania'}
              </h3>
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {documentType === 'ORZECZENIE'
                ? 'Zespół powoływany przez dyrektora placówki: wychowawca, nauczyciele oraz specjaliści prowadzący zajęcia z uczniem.'
                : 'Wskaż wychowawcę, nauczycieli przedmiotów i specjalistów zaangażowanych we wdrożenie zaleceń z opinii PPP.'}
            </p>
          </div>
          <span className="font-mono text-xs text-slate-500 dark:text-slate-400 tabular-nums shrink-0">
            Członkowie: {teamMembers.length}
          </span>
        </div>

        <form
          onSubmit={handleAddMember}
          className="grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:grid-cols-12 sm:items-end dark:border-slate-800 dark:bg-slate-950/60"
        >
          <div className="sm:col-span-5">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Imię i nazwisko nauczyciela / specjalisty
            </label>
            <input
              type="text"
              value={memberName}
              onChange={(e) => setMemberName(e.target.value)}
              placeholder="np. mgr Anna Nowak"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="sm:col-span-4">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Funkcja / specjalizacja
            </label>
            <select
              value={memberRole}
              onChange={(e) => setMemberRole(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            >
              {ROLE_PRESETS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-3 flex items-center justify-between gap-2 sm:flex-col sm:items-stretch">
            <label className="inline-flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={isCoordinator}
                onChange={(e) => setIsCoordinator(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-600"
              />
              <span>Koordynator zespołu</span>
            </label>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 whitespace-nowrap shrink-0"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Dodaj do zespołu</span>
            </button>
          </div>
        </form>

        {teamMembers.length === 0 ? (
          <p className="py-4 text-center text-sm text-slate-500 dark:text-slate-400">
            Nie dodano jeszcze członków zespołu. Użyj formularza powyżej, aby utworzyć skład zespołu.
          </p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {teamMembers.map((member) => (
              <div
                key={member.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {member.name}
                    </span>
                    {member.isCoordinator && (
                      <span className="rounded border border-blue-200 bg-blue-50 px-1.5 py-0.5 text-[11px] font-semibold text-blue-900 dark:border-blue-800 dark:bg-blue-950/60 dark:text-blue-200">
                        Koordynator
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    {member.role}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!member.isCoordinator && (
                    <button
                      type="button"
                      onClick={() => handleSetCoordinator(member.id)}
                      className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800 whitespace-nowrap shrink-0"
                    >
                      Ustaw jako koordynatora
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveMember(member.id)}
                    aria-label={`Usuń osobę ${member.name} z zespołu`}
                    className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/60 dark:hover:text-red-300"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end border-t border-slate-100 pt-4 dark:border-slate-800">
          <button
            type="button"
            onClick={onNextStep}
            className="rounded-lg bg-blue-700 px-5 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 whitespace-nowrap shrink-0"
          >
            {nextStepLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
