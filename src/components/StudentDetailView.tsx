import React, { useCallback, useEffect, useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  CalendarCheck,
  FileText,
  Lock,
  Pencil,
  Printer,
  Trash2,
} from 'lucide-react';
import {
  addJournalEntry,
  addPeriodicEvaluation,
  addProgramAnnex,
  deleteJournalEntry,
  deletePeriodicEvaluation,
  deleteProgramAnnex,
  listAnnexesByStudent,
  listEvaluationsByStudent,
  listJournalEntriesByStudent,
} from '../db/database';
import {
  DOCUMENT_TYPE_LABELS,
  EDUCATION_STAGE_LABELS,
  type FacilitySettings,
  type JournalEntry,
  type PeriodicEvaluation,
  type ProgramModificationAnnex,
  type StudentProfile,
} from '../types/domain';
import { ConfirmDialog } from './ConfirmDialog';
import { TestDataStamp } from './TestDataStamp';
import { PeriodicEvaluationAndAnnexesView } from './evaluations/PeriodicEvaluationAndAnnexesView';
import { ObservationJournalView } from './journal/ObservationJournalView';
import { PrintExportView } from './print/PrintExportView';
import { EncryptedExportModal } from './security/EncryptedExportModal';
import { DocumentationWizard } from './wizard/DocumentationWizard';

interface StudentDetailViewProps {
  student: StudentProfile;
  facilitySettings: FacilitySettings;
  defaultTeamRole: string;
  onBack: () => void;
  onEditStudent: (student: StudentProfile) => void;
  onSaveStudent: (updated: StudentProfile) => Promise<void>;
  onDeleteStudent: (studentId: string) => Promise<void>;
  onDataChanged: () => Promise<void>;
}

type DetailTab = 'PROFILE' | 'WIZARD' | 'JOURNAL' | 'EVALUATIONS' | 'PRINT';

export const StudentDetailView: React.FC<StudentDetailViewProps> = ({
  student,
  facilitySettings,
  defaultTeamRole,
  onBack,
  onEditStudent,
  onSaveStudent,
  onDeleteStudent,
  onDataChanged,
}) => {
  const [activeTab, setActiveTab] = useState<DetailTab>('PROFILE');
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [evaluations, setEvaluations] = useState<PeriodicEvaluation[]>([]);
  const [annexes, setAnnexes] = useState<ProgramModificationAnnex[]>([]);
  const [confirmDeleteStudent, setConfirmDeleteStudent] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);

  const loadRelatedRecords = useCallback(async () => {
    const [entries, evals, loadedAnnexes] = await Promise.all([
      listJournalEntriesByStudent(student.id),
      listEvaluationsByStudent(student.id),
      listAnnexesByStudent(student.id),
    ]);
    setJournalEntries(entries);
    setEvaluations(evals);
    setAnnexes(loadedAnnexes);
  }, [student.id]);

  useEffect(() => {
    void loadRelatedRecords();
  }, [loadRelatedRecords]);

  const handleSaveJournal = async (entry: JournalEntry) => {
    await addJournalEntry(entry);
    await loadRelatedRecords();
    await onDataChanged();
  };

  const handleDeleteJournal = async (entryId: string) => {
    await deleteJournalEntry(entryId);
    await loadRelatedRecords();
    await onDataChanged();
  };

  const handleSaveEvaluation = async (evaluation: PeriodicEvaluation) => {
    await addPeriodicEvaluation(evaluation);
    await loadRelatedRecords();
    await onDataChanged();
  };

  const handleDeleteEvaluation = async (evalId: string) => {
    await deletePeriodicEvaluation(evalId);
    await loadRelatedRecords();
    await onDataChanged();
  };

  const handleSaveAnnex = async (annex: ProgramModificationAnnex) => {
    await addProgramAnnex(annex);
    await loadRelatedRecords();
    await onDataChanged();
  };

  const handleDeleteAnnex = async (annexId: string) => {
    await deleteProgramAnnex(annexId);
    await loadRelatedRecords();
    await onDataChanged();
  };

  return (
    <div className="space-y-6">
      {/* Nagłówek teczki ucznia */}
      <div className="print:hidden rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Powrót do listy uczniów</span>
            </button>

            <div className="mt-3 flex flex-wrap items-center gap-2.5">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                {student.firstName} {student.lastName}
              </h2>
              {student.isTestData && <TestDataStamp />}
            </div>

            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-300 tabular-nums">
              <span>Klasa {student.className}</span>
              <span aria-hidden="true">·</span>
              <span>Rok szkolny {student.schoolYear}</span>
              <span aria-hidden="true">·</span>
              <span>{student.documentType}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono">
                {student.pppDocument.documentNumber}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setExportModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3.5 py-2 text-xs font-semibold text-blue-900 transition-colors hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-200 dark:hover:bg-blue-900/50 whitespace-nowrap shrink-0"
            >
              <Lock className="h-3.5 w-3.5" />
              <span>Eksport .ipet</span>
            </button>
            <button
              type="button"
              onClick={() => onEditStudent(student)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800 whitespace-nowrap shrink-0"
            >
              <Pencil className="h-3.5 w-3.5" />
              <span>Edytuj dane</span>
            </button>
            <button
              type="button"
              onClick={() => setConfirmDeleteStudent(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-semibold text-red-800 transition-colors hover:bg-red-100 dark:border-red-900/60 dark:bg-red-950/50 dark:text-red-200 dark:hover:bg-red-900/60 whitespace-nowrap shrink-0"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Usuń teczkę</span>
            </button>
          </div>
        </div>

        {/* Zakładki */}
        <div className="mt-6 flex flex-wrap gap-1 border-t border-slate-100 pt-4 dark:border-slate-800">
          {[
            {
              id: 'PROFILE' as const,
              label: 'Profil i dokument PPP',
              icon: FileText,
            },
            {
              id: 'WIZARD' as const,
              label:
                student.documentType === 'ORZECZENIE'
                  ? 'Kreator WOPFU i IPET'
                  : 'Dostosowania i pomoc PPP',
              icon: FileText,
            },
            {
              id: 'JOURNAL' as const,
              label: `Dziennik obserwacji (${journalEntries.length})`,
              icon: BookOpen,
            },
            {
              id: 'EVALUATIONS' as const,
              label: `Oceny okresowe i aneksy (${evaluations.length}/${annexes.length})`,
              icon: CalendarCheck,
            },
            {
              id: 'PRINT' as const,
              label: 'Druk i PDF',
              icon: Printer,
            },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  active
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Zakładka 1: Profil i dokument PPP */}
      {activeTab === 'PROFILE' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Dane ucznia i organizacja wsparcia
            </h3>
            <dl className="mt-4 divide-y divide-slate-100 text-sm dark:divide-slate-800">
              <div className="flex justify-between gap-4 py-2.5">
                <dt className="text-slate-500 dark:text-slate-400">
                  Imię i nazwisko
                </dt>
                <dd className="font-medium text-slate-900 dark:text-slate-100 text-right">
                  {student.firstName} {student.lastName}
                </dd>
              </div>
              <div className="flex justify-between gap-4 py-2.5">
                <dt className="text-slate-500 dark:text-slate-400">
                  Data urodzenia
                </dt>
                <dd className="font-mono text-slate-900 dark:text-slate-100 tabular-nums">
                  {student.birthDate || 'Nie podano'}
                </dd>
              </div>
              <div className="flex justify-between gap-4 py-2.5">
                <dt className="text-slate-500 dark:text-slate-400">
                  Klasa / oddział
                </dt>
                <dd className="font-medium text-slate-900 dark:text-slate-100">
                  {student.className}
                </dd>
              </div>
              <div className="flex justify-between gap-4 py-2.5">
                <dt className="text-slate-500 dark:text-slate-400">
                  Etap edukacyjny
                </dt>
                <dd className="text-slate-900 dark:text-slate-100 text-right">
                  {EDUCATION_STAGE_LABELS[student.educationStage]}
                </dd>
              </div>
              <div className="flex justify-between gap-4 py-2.5">
                <dt className="text-slate-500 dark:text-slate-400">
                  Rok szkolny
                </dt>
                <dd className="font-mono text-slate-900 dark:text-slate-100 tabular-nums">
                  {student.schoolYear}
                </dd>
              </div>
              <div className="flex justify-between gap-4 py-2.5">
                <dt className="text-slate-500 dark:text-slate-400">
                  Koordynator zespołu
                </dt>
                <dd className="text-slate-900 dark:text-slate-100 text-right">
                  {student.teamCoordinator || 'Nie wskazano'}
                </dd>
              </div>
              <div className="flex justify-between gap-4 py-2.5">
                <dt className="text-slate-500 dark:text-slate-400">
                  Status dokumentacji
                </dt>
                <dd className="font-medium text-slate-900 dark:text-slate-100">
                  {student.status === 'AKTYWNY' ? 'Aktywna' : 'Archiwum'}
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Dokument z Poradni (PPP)
            </h3>
            <dl className="mt-4 divide-y divide-slate-100 text-sm dark:divide-slate-800">
              <div className="flex justify-between gap-4 py-2.5">
                <dt className="text-slate-500 dark:text-slate-400">
                  Rodzaj dokumentu
                </dt>
                <dd className="font-medium text-slate-900 dark:text-slate-100 text-right">
                  {DOCUMENT_TYPE_LABELS[student.documentType]}
                </dd>
              </div>
              <div className="flex justify-between gap-4 py-2.5">
                <dt className="text-slate-500 dark:text-slate-400">
                  Numer dokumentu
                </dt>
                <dd className="font-mono font-medium text-slate-900 dark:text-slate-100 tabular-nums">
                  {student.pppDocument.documentNumber}
                </dd>
              </div>
              <div className="flex justify-between gap-4 py-2.5">
                <dt className="text-slate-500 dark:text-slate-400">
                  Data wydania
                </dt>
                <dd className="font-mono text-slate-900 dark:text-slate-100 tabular-nums">
                  {student.pppDocument.issueDate || 'Nie podano'}
                </dd>
              </div>
              <div className="flex justify-between gap-4 py-2.5">
                <dt className="text-slate-500 dark:text-slate-400">
                  Data złożenia w szkole
                </dt>
                <dd className="font-mono text-slate-900 dark:text-slate-100 tabular-nums">
                  {student.pppDocument.submissionDate || 'Nie podano'}
                </dd>
              </div>
              <div className="flex justify-between gap-4 py-2.5">
                <dt className="text-slate-500 dark:text-slate-400">
                  Okres ważności
                </dt>
                <dd className="text-slate-900 dark:text-slate-100 text-right">
                  {student.pppDocument.validUntil || 'Nie określono'}
                </dd>
              </div>
              <div className="py-2.5">
                <dt className="text-slate-500 dark:text-slate-400">
                  Poradnia wydająca
                </dt>
                <dd className="mt-1 text-slate-900 dark:text-slate-100">
                  {student.pppDocument.issuingAuthority || 'Nie podano'}
                </dd>
              </div>
              <div className="py-2.5">
                <dt className="text-slate-500 dark:text-slate-400">
                  Podstawa / rozpoznanie
                </dt>
                <dd className="mt-1 font-medium text-slate-900 dark:text-slate-100">
                  {student.pppDocument.reasonCategory || 'Nie uzupełniono'}
                </dd>
              </div>
              <div className="py-2.5">
                <dt className="text-slate-500 dark:text-slate-400">
                  Zalecenia poradni
                </dt>
                <dd className="mt-1 leading-relaxed text-slate-700 dark:text-slate-300">
                  {student.pppDocument.recommendationsSummary ||
                    'Brak wpisanych zaleceń.'}
                </dd>
              </div>
            </dl>

            <div className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-800 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('PRINT')}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800 whitespace-nowrap shrink-0"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Druk i PDF</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('JOURNAL')}
                className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800 whitespace-nowrap shrink-0"
              >
                Dziennik obserwacji
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('WIZARD')}
                className="rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 whitespace-nowrap shrink-0"
              >
                {student.documentType === 'ORZECZENIE'
                  ? 'Otwórz kreator WOPFU i IPET →'
                  : 'Otwórz kreator dostosowań (Opinia PPP) →'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Zakładka 2: Kreator dokumentacji */}
      {activeTab === 'WIZARD' && (
        <DocumentationWizard
          student={student}
          onSaveStudent={onSaveStudent}
        />
      )}

      {/* Zakładka 3: Dziennik obserwacji i postępów */}
      {activeTab === 'JOURNAL' && (
        <ObservationJournalView
          student={student}
          entries={journalEntries}
          defaultTeamRole={defaultTeamRole}
          onSaveEntry={handleSaveJournal}
          onDeleteEntry={handleDeleteJournal}
        />
      )}

      {/* Zakładka 4: Okresowe oceny efektywności i aneksy */}
      {activeTab === 'EVALUATIONS' && (
        <PeriodicEvaluationAndAnnexesView
          student={student}
          evaluations={evaluations}
          annexes={annexes}
          journalEntries={journalEntries}
          onSaveEvaluation={handleSaveEvaluation}
          onDeleteEvaluation={handleDeleteEvaluation}
          onSaveAnnex={handleSaveAnnex}
          onDeleteAnnex={handleDeleteAnnex}
        />
      )}

      {/* Zakładka 5: Generowanie PDF i układ pod druk */}
      {activeTab === 'PRINT' && (
        <PrintExportView
          student={student}
          settings={facilitySettings}
          journalEntries={journalEntries}
          evaluations={evaluations}
          annexes={annexes}
        />
      )}

      <ConfirmDialog
        open={confirmDeleteStudent}
        title="Usunąć teczkę ucznia z pamięci urządzenia?"
        description={`Spowoduje to trwałe usunięcie profilu ucznia ${student.firstName} ${student.lastName} oraz powiązanych wpisów dziennika, ocen okresowych i aneksów z bazy IndexedDB.`}
        confirmLabel="Usuń teczkę"
        destructive
        onCancel={() => setConfirmDeleteStudent(false)}
        onConfirm={async () => {
          setConfirmDeleteStudent(false);
          await onDeleteStudent(student.id);
        }}
      />

      <EncryptedExportModal
        open={exportModalOpen}
        mode="SINGLE_STUDENT"
        student={student}
        onClose={() => setExportModalOpen(false)}
      />
    </div>
  );
};
