import React, { useMemo, useState } from 'react';
import {
  ChevronRight,
  FileUp,
  FolderPlus,
  Pencil,
  Search,
  SlidersHorizontal,
  UserPlus,
} from 'lucide-react';
import {
  EDUCATION_STAGE_LABELS,
  type DocumentType,
  type StudentProfile,
  type StudentStatus,
} from '../types/domain';
import { TestDataStamp } from './TestDataStamp';

interface StudentListViewProps {
  students: StudentProfile[];
  loading: boolean;
  onSelectStudent: (studentId: string) => void;
  onAddStudent: () => void;
  onImportStudent: () => void;
  onEditStudent: (student: StudentProfile) => void;
  onGoToSettings: () => void;
}

export const StudentListView: React.FC<StudentListViewProps> = ({
  students,
  loading,
  onSelectStudent,
  onAddStudent,
  onImportStudent,
  onEditStudent,
  onGoToSettings,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState<string>('ALL');
  const [yearFilter, setYearFilter] = useState<string>('ALL');
  const [docTypeFilter, setDocTypeFilter] = useState<'ALL' | DocumentType>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | StudentStatus>('AKTYWNY');

  const availableClasses = useMemo(() => {
    const set = new Set(students.map((s) => s.className).filter(Boolean));
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'pl'));
  }, [students]);

  const availableYears = useMemo(() => {
    const set = new Set(students.map((s) => s.schoolYear).filter(Boolean));
    return Array.from(set).sort((a, b) => b.localeCompare(a, 'pl'));
  }, [students]);

  const filteredStudents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return students.filter((student) => {
      if (statusFilter !== 'ALL' && student.status !== statusFilter) {
        return false;
      }
      if (classFilter !== 'ALL' && student.className !== classFilter) {
        return false;
      }
      if (yearFilter !== 'ALL' && student.schoolYear !== yearFilter) {
        return false;
      }
      if (docTypeFilter !== 'ALL' && student.documentType !== docTypeFilter) {
        return false;
      }
      if (q) {
        const haystack = [
          student.firstName,
          student.lastName,
          `${student.firstName} ${student.lastName}`,
          `${student.lastName} ${student.firstName}`,
          student.className,
          student.pppDocument.documentNumber,
          student.pppDocument.issuingAuthority,
          student.pppDocument.reasonCategory,
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [students, statusFilter, classFilter, yearFilter, docTypeFilter, searchQuery]);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    classFilter !== 'ALL' ||
    yearFilter !== 'ALL' ||
    docTypeFilter !== 'ALL' ||
    statusFilter !== 'AKTYWNY';

  const resetFilters = () => {
    setSearchQuery('');
    setClassFilter('ALL');
    setYearFilter('ALL');
    setDocTypeFilter('ALL');
    setStatusFilter('AKTYWNY');
  };

  return (
    <div className="space-y-6">
      {/* Pasek wyszukiwania i filtrów */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Szukaj ucznia po imieniu, nazwisku, klasie lub numerze dokumentu PPP..."
              aria-label="Szukaj ucznia"
              className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
              {(['ALL', 'ORZECZENIE', 'OPINIA'] as const).map((type) => {
                const active = docTypeFilter === type;
                const label = type === 'ALL' ? 'Wszystkie' : type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setDocTypeFilter(type)}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                      active
                        ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-950 dark:text-slate-100'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            <select
              aria-label="Filtruj po klasie"
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
            >
              <option value="ALL">Klasa: wszystkie</option>
              {availableClasses.map((cls) => (
                <option key={cls} value={cls}>
                  Klasa {cls}
                </option>
              ))}
            </select>

            <select
              aria-label="Filtruj po roku szkolnym"
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
            >
              <option value="ALL">Rok szkolny: wszystkie</option>
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>
                  Rok {yr}
                </option>
              ))}
            </select>

            <select
              aria-label="Filtruj po statusie"
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as 'ALL' | StudentStatus)
              }
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
            >
              <option value="AKTYWNY">Status: aktywni</option>
              <option value="ARCHIWUM">Status: archiwum</option>
              <option value="ALL">Status: wszyscy</option>
            </select>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="rounded-lg px-2.5 py-2 text-xs font-medium text-blue-700 hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-blue-950/50 whitespace-nowrap shrink-0"
              >
                Wyczyść filtry
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stan ładowania */}
      {loading && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="space-y-3 animate-pulse">
            <div className="h-4 w-48 rounded bg-slate-200 dark:bg-slate-800" />
            <div className="h-11 w-full rounded bg-slate-100 dark:bg-slate-800/60" />
            <div className="h-11 w-full rounded bg-slate-100 dark:bg-slate-800/60" />
          </div>
        </div>
      )}

      {/* Pusty stan — brak uczniów w bazie */}
      {!loading && students.length === 0 && (
        <div className="rounded-xl border border-slate-200 bg-white px-6 py-12 text-center dark:border-slate-800 dark:bg-slate-900">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
            <FolderPlus className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-slate-900 dark:text-slate-100">
            Brak zapisanych teczek uczniów
          </h3>
          <p className="mx-auto mt-1.5 max-w-md text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            Dodaj pierwszego ucznia wraz z dokumentem z Poradni Psychologiczno-Pedagogicznej albo wczytaj przykładowy profil testowy w ustawieniach placówki.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={onAddStudent}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 whitespace-nowrap shrink-0"
            >
              <UserPlus className="h-4 w-4" />
              <span>Dodaj pierwszego ucznia</span>
            </button>
            <button
              type="button"
              onClick={onImportStudent}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 whitespace-nowrap shrink-0"
            >
              <FileUp className="h-4 w-4" />
              <span>Importuj plik .ipet</span>
            </button>
            <button
              type="button"
              onClick={onGoToSettings}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 whitespace-nowrap shrink-0"
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span>Przejdź do ustawień i danych testowych</span>
            </button>
          </div>
        </div>
      )}

      {/* Brak wyników filtrowania */}
      {!loading && students.length > 0 && filteredStudents.length === 0 && (
        <div className="rounded-xl border border-slate-200 bg-white px-6 py-10 text-center dark:border-slate-800 dark:bg-slate-900">
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Brak uczniów spełniających wybrane kryteria
          </h3>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Zmień wyszukiwaną frazę lub wyczyść aktywne filtry klasy, roku i typu dokumentu.
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="mt-4 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Pokaż wszystkich aktywnych uczniów
          </button>
        </div>
      )}

      {/* Tabela uczniów */}
      {!loading && filteredStudents.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
            <span className="tabular-nums">
              Wyświetlono {filteredStudents.length} z {students.length} teczek uczniów
            </span>
            <span>Baza lokalna przeglądarki (IndexedDB)</span>
          </div>

          <div className="hidden md:block overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-300">
                  <th className="px-4 py-3">Uczeń</th>
                  <th className="px-4 py-3">Klasa i etap</th>
                  <th className="px-4 py-3">Rok szkolny</th>
                  <th className="px-4 py-3">Dokument PPP</th>
                  <th className="px-4 py-3">Przyczyna / podstawa</th>
                  <th className="px-4 py-3 text-right">Działania</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredStudents.map((student) => (
                  <tr
                    key={student.id}
                    onClick={() => onSelectStudent(student.id)}
                    className="cursor-pointer transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                  >
                    <td className="px-4 py-3.5 align-top">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-slate-900 dark:text-slate-100">
                          {student.lastName} {student.firstName}
                        </span>
                        {student.isTestData && <TestDataStamp />}
                      </div>
                      {student.teamCoordinator && (
                        <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                          Koordynator: {student.teamCoordinator}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3.5 align-top">
                      <div className="font-medium text-slate-900 dark:text-slate-100 tabular-nums">
                        Klasa {student.className}
                      </div>
                      <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        {EDUCATION_STAGE_LABELS[student.educationStage]}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 align-top font-mono text-xs text-slate-700 dark:text-slate-300 tabular-nums">
                      {student.schoolYear}
                    </td>
                    <td className="px-4 py-3.5 align-top">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">
                        {student.documentType}
                      </div>
                      <div className="mt-0.5 font-mono text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                        {student.pppDocument.documentNumber}
                        {student.pppDocument.issueDate
                          ? ` · ${student.pppDocument.issueDate}`
                          : ''}
                      </div>
                      <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                        {student.documentType === 'ORZECZENIE'
                          ? `WOPFU: ${student.wopfuDraft.isCompleted ? 'gotowe' : 'szkic'} · IPET: ${student.ipetDraft.isCompleted ? 'gotowy' : 'szkic'}`
                          : `Dostosowania: ${student.opinionSupportDraft.isCompleted ? 'gotowe' : 'szkic'}`}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 align-top text-xs text-slate-600 dark:text-slate-300 max-w-xs">
                      <div className="line-clamp-2">
                        {student.pppDocument.reasonCategory || 'Nie uzupełniono'}
                      </div>
                    </td>
                    <td
                      className="px-4 py-3.5 align-top text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="inline-flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => onEditStudent(student)}
                          aria-label={`Edytuj dane ucznia ${student.firstName} ${student.lastName}`}
                          className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800 whitespace-nowrap shrink-0"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          <span>Edytuj</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onSelectStudent(student.id)}
                          className="inline-flex items-center gap-1 rounded-md bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 whitespace-nowrap shrink-0"
                        >
                          <span>Otwórz</span>
                          <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Widok mobilny (karty wierszowe) */}
          <div className="divide-y divide-slate-100 md:hidden dark:divide-slate-800">
            {filteredStudents.map((student) => (
              <div
                key={student.id}
                onClick={() => onSelectStudent(student.id)}
                className="cursor-pointer p-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {student.lastName} {student.firstName}
                      </span>
                      {student.isTestData && <TestDataStamp />}
                    </div>
                    <div className="mt-1 text-xs text-slate-600 dark:text-slate-300 tabular-nums">
                      Klasa {student.className} · {student.schoolYear} · {student.documentType}
                    </div>
                    <div className="mt-0.5 font-mono text-xs text-slate-500 dark:text-slate-400">
                      {student.pppDocument.documentNumber}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditStudent(student);
                    }}
                    aria-label="Edytuj ucznia"
                    className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
