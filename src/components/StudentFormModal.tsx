import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import {
  createEmptyIpetDraft,
  createEmptyOpinionSupportDraft,
  createEmptyWopfuDraft,
} from '../db/database';
import {
  EDUCATION_STAGE_LABELS,
  type DocumentType,
  type EducationStage,
  type StudentProfile,
  type StudentStatus,
} from '../types/domain';
import { useRegisterUnsavedChanges } from '../utils/unsavedChangesRegistry';

interface StudentFormModalProps {
  open: boolean;
  initialStudent: StudentProfile | null;
  defaultSchoolYear: string;
  onSave: (student: StudentProfile) => Promise<void>;
  onClose: () => void;
}

interface FormState {
  firstName: string;
  lastName: string;
  birthDate: string;
  className: string;
  schoolYear: string;
  educationStage: EducationStage;
  documentType: DocumentType;
  documentNumber: string;
  issueDate: string;
  submissionDate: string;
  validUntil: string;
  issuingAuthority: string;
  reasonCategory: string;
  recommendationsSummary: string;
  teamCoordinator: string;
  status: StudentStatus;
}

function buildInitialState(
  student: StudentProfile | null,
  defaultSchoolYear: string,
): FormState {
  if (student) {
    return {
      firstName: student.firstName,
      lastName: student.lastName,
      birthDate: student.birthDate,
      className: student.className,
      schoolYear: student.schoolYear,
      educationStage: student.educationStage,
      documentType: student.documentType,
      documentNumber: student.pppDocument.documentNumber,
      issueDate: student.pppDocument.issueDate,
      submissionDate: student.pppDocument.submissionDate ?? '',
      validUntil: student.pppDocument.validUntil,
      issuingAuthority: student.pppDocument.issuingAuthority,
      reasonCategory: student.pppDocument.reasonCategory,
      recommendationsSummary: student.pppDocument.recommendationsSummary,
      teamCoordinator: student.teamCoordinator,
      status: student.status,
    };
  }
  return {
    firstName: '',
    lastName: '',
    birthDate: '',
    className: '',
    schoolYear: defaultSchoolYear || '2026/2027',
    educationStage: 'KLASY_4_8',
    documentType: 'ORZECZENIE',
    documentNumber: '',
    issueDate: '',
    submissionDate: '',
    validUntil: '',
    issuingAuthority: '',
    reasonCategory: '',
    recommendationsSummary: '',
    teamCoordinator: '',
    status: 'AKTYWNY',
  };
}

export const StudentFormModal: React.FC<StudentFormModalProps> = ({
  open,
  initialStudent,
  defaultSchoolYear,
  onSave,
  onClose,
}) => {
  const [form, setForm] = useState<FormState>(() =>
    buildInitialState(initialStudent, defaultSchoolYear),
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(buildInitialState(initialStudent, defaultSchoolYear));
      setError(null);
      setSaving(false);
    }
  }, [open, initialStudent, defaultSchoolYear]);

  const initialSerialized = JSON.stringify(
    buildInitialState(initialStudent, defaultSchoolYear),
  );
  const isDirty = open && JSON.stringify(form) !== initialSerialized;
  useRegisterUnsavedChanges(
    'student-form-modal',
    isDirty,
    'Formularz danych ucznia',
  );

  if (!open) return null;

  const isEditing = Boolean(initialStudent);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError('Podaj imię i nazwisko ucznia.');
      return;
    }
    if (!form.className.trim()) {
      setError('Podaj klasę lub oddział (np. 5B).');
      return;
    }
    if (!form.schoolYear.trim()) {
      setError('Podaj rok szkolny (np. 2026/2027).');
      return;
    }
    if (!form.documentNumber.trim()) {
      setError('Podaj numer dokumentu z Poradni Psychologiczno-Pedagogicznej.');
      return;
    }

    setSaving(true);
    setError(null);
    const now = new Date().toISOString();

    const payload: StudentProfile = {
      id: initialStudent ? initialStudent.id : crypto.randomUUID(),
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      birthDate: form.birthDate,
      className: form.className.trim(),
      schoolYear: form.schoolYear.trim(),
      educationStage: form.educationStage,
      documentType: form.documentType,
      pppDocument: {
        documentNumber: form.documentNumber.trim(),
        issueDate: form.issueDate,
        submissionDate: form.submissionDate,
        validUntil: form.validUntil.trim(),
        issuingAuthority: form.issuingAuthority.trim(),
        reasonCategory: form.reasonCategory.trim(),
        recommendationsSummary: form.recommendationsSummary.trim(),
      },
      teamCoordinator: form.teamCoordinator.trim(),
      teamMembers: initialStudent
        ? initialStudent.teamMembers
        : form.teamCoordinator.trim()
          ? [
              {
                id: crypto.randomUUID(),
                name: form.teamCoordinator.trim(),
                role: 'Koordynator zespołu',
                isCoordinator: true,
              },
            ]
          : [],
      status: form.status,
      isTestData: initialStudent ? initialStudent.isTestData : false,
      wopfuDraft: initialStudent
        ? initialStudent.wopfuDraft
        : createEmptyWopfuDraft(),
      ipetDraft: initialStudent
        ? initialStudent.ipetDraft
        : createEmptyIpetDraft(),
      opinionSupportDraft: initialStudent
        ? initialStudent.opinionSupportDraft
        : createEmptyOpinionSupportDraft(),
      createdAt: initialStudent ? initialStudent.createdAt : now,
      updatedAt: now,
    };

    try {
      await onSave(payload);
      onClose();
    } catch {
      setError('Nie udało się zapisać danych ucznia w pamięci przeglądarki.');
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="student-form-title"
    >
      <div className="my-auto w-full max-w-2xl rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <div>
            <h2
              id="student-form-title"
              className="text-lg font-semibold text-slate-900 dark:text-slate-100"
            >
              {isEditing ? 'Edycja danych ucznia i dokumentu PPP' : 'Nowy uczeń w dokumentacji'}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Dane zapisywane są wyłącznie lokalnie w bazie IndexedDB tego urządzenia.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Zamknij formularz"
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="max-h-[80vh] overflow-y-auto px-6 py-5 space-y-6">
          {error && (
            <div
              role="alert"
              className="rounded-lg border border-red-300 bg-red-50 px-4 py-2.5 text-sm text-red-900 dark:border-red-800 dark:bg-red-950/60 dark:text-red-200"
            >
              {error}
            </div>
          )}

          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 border-b border-slate-100 pb-2 dark:border-slate-800">
              1. Podstawowe dane ucznia
            </h3>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Imię <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  placeholder="np. Zofia"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Nazwisko <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  placeholder="np. Zielińska"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Data urodzenia
                </label>
                <input
                  type="date"
                  value={form.birthDate}
                  onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Klasa / oddział <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.className}
                    onChange={(e) => setForm({ ...form, className: e.target.value })}
                    placeholder="np. 4A"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Rok szkolny <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.schoolYear}
                    onChange={(e) => setForm({ ...form, schoolYear: e.target.value })}
                    placeholder="2026/2027"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Etap edukacyjny
                </label>
                <select
                  value={form.educationStage}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      educationStage: e.target.value as EducationStage,
                    })
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                >
                  {Object.entries(EDUCATION_STAGE_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Koordynator zespołu / wychowawca
                </label>
                <input
                  type="text"
                  value={form.teamCoordinator}
                  onChange={(e) =>
                    setForm({ ...form, teamCoordinator: e.target.value })
                  }
                  placeholder="np. mgr Katarzyna Kowalczyk"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 border-b border-slate-100 pb-2 dark:border-slate-800">
              2. Dokument z Poradni Psychologiczno-Pedagogicznej (PPP)
            </h3>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Typ dokumentu
              </label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, documentType: 'ORZECZENIE' })}
                  className={`rounded-lg border px-3.5 py-2.5 text-left text-sm transition-colors ${
                    form.documentType === 'ORZECZENIE'
                      ? 'border-blue-600 bg-blue-50 font-semibold text-blue-950 dark:border-blue-500 dark:bg-blue-950/60 dark:text-blue-100'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`}
                >
                  <div>ORZECZENIE</div>
                  <div className="mt-0.5 text-xs font-normal text-slate-500 dark:text-slate-400">
                    Potrzeba kształcenia specjalnego (wymaga WOPFU i IPET)
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, documentType: 'OPINIA' })}
                  className={`rounded-lg border px-3.5 py-2.5 text-left text-sm transition-colors ${
                    form.documentType === 'OPINIA'
                      ? 'border-blue-600 bg-blue-50 font-semibold text-blue-950 dark:border-blue-500 dark:bg-blue-950/60 dark:text-blue-100'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`}
                >
                  <div>OPINIA</div>
                  <div className="mt-0.5 text-xs font-normal text-slate-500 dark:text-slate-400">
                    Dostosowanie wymagań edukacyjnych lub pomoc PPP
                  </div>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Numer dokumentu PPP <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.documentNumber}
                  onChange={(e) =>
                    setForm({ ...form, documentNumber: e.target.value })
                  }
                  placeholder="np. ORZ/PPP1/2026/089"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Data wydania dokumentu
                </label>
                <input
                  type="date"
                  value={form.issueDate}
                  onChange={(e) => setForm({ ...form, issueDate: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Data złożenia dokumentu w placówce
                </label>
                <input
                  type="date"
                  value={form.submissionDate}
                  onChange={(e) =>
                    setForm({ ...form, submissionDate: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Poradnia wydająca (PPP)
                </label>
                <input
                  type="text"
                  value={form.issuingAuthority}
                  onChange={(e) =>
                    setForm({ ...form, issuingAuthority: e.target.value })
                  }
                  placeholder="np. Poradnia Psychologiczno-Pedagogiczna nr 1"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Okres obowiązywania / ważność
                </label>
                <input
                  type="text"
                  value={form.validUntil}
                  onChange={(e) =>
                    setForm({ ...form, validUntil: e.target.value })
                  }
                  placeholder="np. do ukończenia szkoły podstawowej"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Podstawa / przyczyna wydania dokumentu
              </label>
              <input
                type="text"
                value={form.reasonCategory}
                onChange={(e) =>
                  setForm({ ...form, reasonCategory: e.target.value })
                }
                placeholder="np. Dysleksja rozwojowa / Słabowidzenie / Spektrum autyzmu"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Główne zalecenia z dokumentu PPP
              </label>
              <textarea
                rows={3}
                value={form.recommendationsSummary}
                onChange={(e) =>
                  setForm({ ...form, recommendationsSummary: e.target.value })
                }
                placeholder="Wpisz kluczowe zalecenia dotyczące form wsparcia, rewalidacji i dostosowania wymagań..."
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>

            {isEditing && (
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Status teczki ucznia
                </label>
                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      status: e.target.value as StudentStatus,
                    })
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                >
                  <option value="AKTYWNY">Aktywna dokumentacja</option>
                  <option value="ARCHIWUM">Archiwum</option>
                </select>
              </div>
            )}
          </section>

          <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 whitespace-nowrap shrink-0"
            >
              Anuluj
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-blue-700 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-800 disabled:opacity-60 dark:bg-blue-600 dark:hover:bg-blue-500 whitespace-nowrap shrink-0"
            >
              {saving ? 'Zapisywanie...' : isEditing ? 'Zapisz zmiany' : 'Dodaj ucznia'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
