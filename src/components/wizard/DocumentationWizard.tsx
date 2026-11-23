import React, { useEffect, useRef, useState } from 'react';
import { Check, CheckCircle2, Save } from 'lucide-react';
import type {
  IpetStructureDraft,
  OpinionSupportDraft,
  StudentProfile,
  TeamMember,
  WopfuStructureDraft,
} from '../../types/domain';
import { IpetEditorStep } from './IpetEditorStep';
import { OpinionSupportEditor } from './OpinionSupportWizard';
import { TeamAndDeadlinesStep } from './TeamAndDeadlinesStep';
import { WopfuEditorStep } from './WopfuEditorStep';

interface DocumentationWizardProps {
  student: StudentProfile;
  onSaveStudent: (updated: StudentProfile) => Promise<void>;
}

export const DocumentationWizard: React.FC<DocumentationWizardProps> = ({
  student,
  onSaveStudent,
}) => {
  const [draftStudent, setDraftStudent] = useState<StudentProfile>(student);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>(
    'idle',
  );
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const saveTimerRef = useRef<number | null>(null);

  // Sync when switching to another student
  useEffect(() => {
    setDraftStudent(student);
    setStep(1);
    setSaveState('idle');
    setLastSavedTime(null);
  }, [student.id]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

  const persistUpdate = async (next: StudentProfile, immediate = false) => {
    setDraftStudent(next);
    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current);
    }

    const executeSave = async () => {
      setSaveState('saving');
      await onSaveStudent(next);
      setSaveState('saved');
      setLastSavedTime(
        new Date().toLocaleTimeString('pl-PL', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
      );
    };

    if (immediate) {
      await executeSave();
    } else {
      setSaveState('saving');
      saveTimerRef.current = window.setTimeout(() => {
        void executeSave();
      }, 450);
    }
  };

  const isOrzeczenie = draftStudent.documentType === 'ORZECZENIE';

  const steps = isOrzeczenie
    ? [
        {
          num: 1 as const,
          title: 'Zespół i terminy',
          done: draftStudent.teamMembers.length > 0,
        },
        {
          num: 2 as const,
          title: 'WOPFU',
          done: draftStudent.wopfuDraft.isCompleted,
        },
        {
          num: 3 as const,
          title: 'IPET',
          done: draftStudent.ipetDraft.isCompleted,
        },
      ]
    : [
        {
          num: 1 as const,
          title: 'Nauczyciele i terminy',
          done: draftStudent.teamMembers.length > 0,
        },
        {
          num: 2 as const,
          title: 'Funkcjonowanie i dostosowania',
          done: draftStudent.opinionSupportDraft.subjectAdaptations.length > 0,
        },
        {
          num: 3 as const,
          title: 'Pomoc PPP i rodzice',
          done: draftStudent.opinionSupportDraft.isCompleted,
        },
      ];

  const handleChangeSubmissionDate = (nextDate: string) => {
    void persistUpdate({
      ...draftStudent,
      pppDocument: {
        ...draftStudent.pppDocument,
        submissionDate: nextDate,
      },
    });
  };

  const handleChangeTeamMembers = (nextMembers: TeamMember[]) => {
    const coordinator = nextMembers.find((m) => m.isCoordinator);
    void persistUpdate(
      {
        ...draftStudent,
        teamMembers: nextMembers,
        teamCoordinator: coordinator
          ? `${coordinator.name} (${coordinator.role})`
          : draftStudent.teamCoordinator,
      },
      true,
    );
  };

  const handleChangeWopfu = (nextWopfu: WopfuStructureDraft) => {
    void persistUpdate({
      ...draftStudent,
      wopfuDraft: nextWopfu,
    });
  };

  const handleChangeIpet = (nextIpet: IpetStructureDraft) => {
    void persistUpdate({
      ...draftStudent,
      ipetDraft: nextIpet,
    });
  };

  const handleChangeOpinionDraft = (nextOpinion: OpinionSupportDraft) => {
    void persistUpdate({
      ...draftStudent,
      opinionSupportDraft: nextOpinion,
    });
  };

  return (
    <div className="space-y-6">
      {/* Nagłówek ścieżki prawnej i postępu */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-xs font-semibold tracking-wide text-blue-800 dark:text-blue-300">
              {isOrzeczenie
                ? 'Ścieżka A · Orzeczenie o potrzebie kształcenia specjalnego'
                : 'Ścieżka B · Opinia PPP (dostosowanie wymagań i pomoc PPP)'}
            </div>
            <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">
              {isOrzeczenie
                ? 'Pełny proces dokumentacji: Zespół nauczycieli i specjalistów → WOPFU → IPET.'
                : 'Uproszczona ścieżka dla opinii poradni: bez wymuszania pełnego IPET właściwego dla kształcenia specjalnego.'}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
              {saveState === 'saving' && 'Zapisywanie w IndexedDB...'}
              {saveState === 'saved' && lastSavedTime && (
                <span className="inline-flex items-center gap-1 text-teal-700 dark:text-teal-300 font-medium">
                  <Check className="h-3.5 w-3.5" />
                  <span>Zapisano lokalnie ({lastSavedTime})</span>
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => void persistUpdate(draftStudent, true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800 whitespace-nowrap shrink-0"
            >
              <Save className="h-3.5 w-3.5" />
              <span>Zapisz teraz</span>
            </button>
          </div>
        </div>

        {/* Pasek kroków kreatora */}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 border-t border-slate-100 pt-4 dark:border-slate-800">
          {steps.map((item) => {
            const isActive = step === item.num;
            return (
              <button
                key={item.num}
                type="button"
                onClick={() => setStep(item.num)}
                className={`flex items-center justify-between gap-2 rounded-lg border px-3.5 py-2.5 text-left text-xs font-medium transition-colors ${
                  isActive
                    ? 'border-blue-600 bg-blue-50 text-blue-950 dark:border-blue-500 dark:bg-blue-950/60 dark:text-blue-100'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-300 dark:hover:bg-slate-800'
                }`}
              >
                <span className="flex items-center gap-2 truncate">
                  <span className="font-mono font-semibold tabular-nums">
                    0{item.num}.
                  </span>
                  <span className="truncate font-semibold">{item.title}</span>
                </span>
                {item.done && (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-teal-700 dark:text-teal-400" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Zawartość aktywnego kroku */}
      {step === 1 && (
        <TeamAndDeadlinesStep
          documentType={draftStudent.documentType}
          schoolYear={draftStudent.schoolYear}
          submissionDate={draftStudent.pppDocument.submissionDate ?? ''}
          teamMembers={draftStudent.teamMembers}
          onChangeSubmissionDate={handleChangeSubmissionDate}
          onChangeTeamMembers={handleChangeTeamMembers}
          onNextStep={() => setStep(2)}
          nextStepLabel={
            isOrzeczenie
              ? 'Przejdź do WOPFU →'
              : 'Przejdź do dostosowań wymagań →'
          }
        />
      )}

      {isOrzeczenie && step === 2 && (
        <WopfuEditorStep
          wopfu={draftStudent.wopfuDraft}
          onChange={handleChangeWopfu}
          onPrevStep={() => setStep(1)}
          onNextStep={() => setStep(3)}
        />
      )}

      {isOrzeczenie && step === 3 && (
        <IpetEditorStep
          ipet={draftStudent.ipetDraft}
          schoolYear={draftStudent.schoolYear}
          onChange={handleChangeIpet}
          onPrevStep={() => setStep(2)}
        />
      )}

      {!isOrzeczenie && (step === 2 || step === 3) && (
        <OpinionSupportEditor
          step={step}
          draft={draftStudent.opinionSupportDraft}
          schoolYear={draftStudent.schoolYear}
          onChange={handleChangeOpinionDraft}
          onPrevStep={() => setStep(step === 2 ? 1 : 2)}
          onNextStep={step === 2 ? () => setStep(3) : undefined}
        />
      )}
    </div>
  );
};
