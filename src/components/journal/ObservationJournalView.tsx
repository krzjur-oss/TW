import React, { useMemo, useState } from 'react';
import { Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import {
  FUNCTIONING_AREA_OPTIONS,
  JOURNAL_CATEGORY_LABELS,
  type JournalCategory,
  type JournalEntry,
  type StudentProfile,
} from '../../types/domain';
import { ConfirmDialog } from '../ConfirmDialog';
import { TestDataStamp } from '../TestDataStamp';
import { useRegisterUnsavedChanges } from '../../utils/unsavedChangesRegistry';

interface ObservationJournalViewProps {
  student: StudentProfile;
  entries: JournalEntry[];
  defaultTeamRole: string;
  onSaveEntry: (entry: JournalEntry) => Promise<void>;
  onDeleteEntry: (entryId: string) => Promise<void>;
}

export const ObservationJournalView: React.FC<ObservationJournalViewProps> = ({
  student,
  entries,
  defaultTeamRole,
  onSaveEntry,
  onDeleteEntry,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [areaFilter, setAreaFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | JournalCategory>(
    'ALL',
  );

  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Pola formularza
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [category, setCategory] = useState<JournalCategory>('OBSERWACJA');
  const [authorName, setAuthorName] = useState('');
  const [authorRole, setAuthorRole] = useState(defaultTeamRole);
  const [relatedArea, setRelatedArea] = useState(FUNCTIONING_AREA_OPTIONS[0]);
  const [customArea, setCustomArea] = useState('');
  const [title, setTitle] = useState('');
  const [whatWorked, setWhatWorked] = useState('');
  const [barriersObserved, setBarriersObserved] = useState('');
  const [conclusions, setConclusions] = useState('');
  const [content, setContent] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const hasUnsavedDraft =
    showForm &&
    (title.trim() !== '' ||
      content.trim() !== '' ||
      whatWorked.trim() !== '' ||
      barriersObserved.trim() !== '' ||
      conclusions.trim() !== '');
  useRegisterUnsavedChanges(
    'journal-entry-form',
    hasUnsavedDraft,
    'Wpis w dzienniku obserwacji',
  );

  const openNewForm = () => {
    setEditingEntry(null);
    setDate(new Date().toISOString().slice(0, 10));
    setCategory('OBSERWACJA');
    setAuthorName('');
    setAuthorRole(defaultTeamRole);
    setRelatedArea(FUNCTIONING_AREA_OPTIONS[0]);
    setCustomArea('');
    setTitle('');
    setWhatWorked('');
    setBarriersObserved('');
    setConclusions('');
    setContent('');
    setFormError(null);
    setShowForm(true);
  };

  const openEditForm = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setDate(entry.date);
    setCategory(entry.category);
    setAuthorName(entry.authorName);
    setAuthorRole(entry.authorRole);
    const isKnownArea = FUNCTIONING_AREA_OPTIONS.includes(entry.relatedArea);
    if (isKnownArea) {
      setRelatedArea(entry.relatedArea);
      setCustomArea('');
    } else {
      setRelatedArea('__CUSTOM__');
      setCustomArea(entry.relatedArea);
    }
    setTitle(entry.title);
    setWhatWorked(entry.whatWorked);
    setBarriersObserved(entry.barriersObserved);
    setConclusions(entry.conclusions);
    setContent(entry.content);
    setFormError(null);
    setShowForm(true);
  };

  const availableAreas = useMemo(() => {
    const set = new Set<string>(FUNCTIONING_AREA_OPTIONS);
    entries.forEach((e) => {
      if (e.relatedArea.trim()) set.add(e.relatedArea.trim());
    });
    return Array.from(set);
  }, [entries]);

  const filteredEntries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return entries.filter((entry) => {
      if (areaFilter !== 'ALL' && entry.relatedArea !== areaFilter) {
        return false;
      }
      if (categoryFilter !== 'ALL' && entry.category !== categoryFilter) {
        return false;
      }
      if (q) {
        const haystack = [
          entry.title,
          entry.content,
          entry.whatWorked,
          entry.barriersObserved,
          entry.conclusions,
          entry.authorName,
          entry.authorRole,
          entry.relatedArea,
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [entries, areaFilter, categoryFilter, searchQuery]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setFormError('Podaj krótki tytuł lub kontekst wpisu.');
      return;
    }
    if (
      !whatWorked.trim() &&
      !barriersObserved.trim() &&
      !conclusions.trim() &&
      !content.trim()
    ) {
      setFormError(
        'Uzupełnij przynajmniej jedno pole opisowe (co zadziałało, bariery, wnioski lub opis przebiegu).',
      );
      return;
    }

    const resolvedArea =
      relatedArea === '__CUSTOM__'
        ? customArea.trim() || 'Ogólne funkcjonowanie ucznia'
        : relatedArea;

    const now = new Date().toISOString();
    const payload: JournalEntry = {
      id: editingEntry ? editingEntry.id : crypto.randomUUID(),
      studentId: student.id,
      date,
      category,
      authorName: authorName.trim() || 'Specjalista / nauczyciel',
      authorRole: authorRole.trim() || defaultTeamRole,
      title: title.trim(),
      content: content.trim(),
      relatedArea: resolvedArea,
      whatWorked: whatWorked.trim(),
      barriersObserved: barriersObserved.trim(),
      conclusions: conclusions.trim(),
      isTestData: editingEntry ? editingEntry.isTestData : student.isTestData,
      createdAt: editingEntry ? editingEntry.createdAt : now,
      updatedAt: now,
    };

    await onSaveEntry(payload);
    setShowForm(false);
    setEditingEntry(null);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 space-y-5">
        {/* Nagłówek i CTA */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Dziennik obserwacji i postępów ucznia
            </h3>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Datowane wpisy nauczycieli i specjalistów: co zadziałało, napotkane bariery i wnioski do okresowej oceny efektywności.
            </p>
          </div>
          <button
            type="button"
            onClick={() => (showForm ? setShowForm(false) : openNewForm())}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 whitespace-nowrap shrink-0"
          >
            {showForm ? (
              <>
                <X className="h-3.5 w-3.5" />
                <span>Zamknij formularz</span>
              </>
            ) : (
              <>
                <Plus className="h-3.5 w-3.5" />
                <span>Dodaj wpis obserwacji</span>
              </>
            )}
          </button>
        </div>

        {/* Formularz dodawania / edycji wpisu */}
        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950/60"
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {editingEntry
                  ? 'Edycja wpisu w dzienniku obserwacji'
                  : 'Nowy wpis w dzienniku obserwacji'}
              </h4>
              {student.teamMembers.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Autor z zespołu:
                  </span>
                  {student.teamMembers.slice(0, 4).map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        setAuthorName(m.name);
                        setAuthorRole(m.role);
                      }}
                      className="rounded border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      {m.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {formError && (
              <div
                role="alert"
                className="rounded-lg border border-red-300 bg-red-50 px-3.5 py-2 text-xs text-red-900 dark:border-red-800 dark:bg-red-950/60 dark:text-red-200"
              >
                {formError}
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Data obserwacji
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-mono text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Kategoria wpisu
                </label>
                <select
                  value={category}
                  onChange={(e) =>
                    setCategory(e.target.value as JournalCategory)
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                >
                  {Object.entries(JOURNAL_CATEGORY_LABELS).map(([k, label]) => (
                    <option key={k} value={k}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Autor wpisu
                </label>
                <input
                  type="text"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder="np. mgr Anna Nowak"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Rola / przedmiot
                </label>
                <input
                  type="text"
                  value={authorRole}
                  onChange={(e) => setAuthorRole(e.target.value)}
                  placeholder="np. Nauczyciel matematyki"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Obszar funkcjonowania lub kontekst zajęć
                </label>
                <select
                  value={relatedArea}
                  onChange={(e) => setRelatedArea(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                >
                  {FUNCTIONING_AREA_OPTIONS.map((area) => (
                    <option key={area} value={area}>
                      {area}
                    </option>
                  ))}
                  <option value="__CUSTOM__">Inny obszar (wpisz własny)</option>
                </select>
                {relatedArea === '__CUSTOM__' && (
                  <input
                    type="text"
                    value={customArea}
                    onChange={(e) => setCustomArea(e.target.value)}
                    placeholder="Wpisz własny obszar lub nazwę przedmiotu..."
                    className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Tytuł / kontekst obserwacji *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="np. Praca w parze na lekcji języka polskiego"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
              <div>
                <label className="block text-xs font-medium text-teal-800 dark:text-teal-300 mb-1">
                  Co zadziałało (skuteczne strategie)
                </label>
                <textarea
                  rows={3}
                  value={whatWorked}
                  onChange={(e) => setWhatWorked(e.target.value)}
                  placeholder="Jakie modyfikacje, instrukcje lub warunki przyniosły efekt..."
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-amber-800 dark:text-amber-300 mb-1">
                  Napotkane bariery / trudności
                </label>
                <textarea
                  rows={3}
                  value={barriersObserved}
                  onChange={(e) => setBarriersObserved(e.target.value)}
                  placeholder="Co sprawiło trudność lub wywołało przeciążenie..."
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-blue-800 dark:text-blue-300 mb-1">
                  Wnioski do dalszej pracy
                </label>
                <textarea
                  rows={3}
                  value={conclusions}
                  onChange={(e) => setConclusions(e.target.value)}
                  placeholder="Co warto utrzymać lub zmienić na kolejnych zajęciach..."
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Dodatkowy opis sytuacji / przebieg zajęć (opcjonalnie)
              </label>
              <textarea
                rows={2}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Dodatkowy kontekst organizacyjny lub opis przebiegu zajęć..."
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingEntry(null);
                }}
                className="rounded-lg border border-slate-300 bg-white px-4 py-1.5 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              >
                Anuluj
              </button>
              <button
                type="submit"
                className="rounded-lg bg-blue-700 px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-800 dark:bg-blue-600"
              >
                {editingEntry ? 'Zapisz zmiany' : 'Zapisz wpis w dzienniku'}
              </button>
            </div>
          </form>
        )}

        {/* Wyszukiwarka i filtry dziennika */}
        <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center dark:border-slate-800">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Szukaj w treści notatek, wnioskach, strategiach lub po autorze..."
              aria-label="Szukaj w dzienniku obserwacji"
              className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Filtruj wpisy po obszarze funkcjonowania"
              value={areaFilter}
              onChange={(e) => setAreaFilter(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
            >
              <option value="ALL">Obszar: wszystkie</option>
              {availableAreas.map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>

            <select
              aria-label="Filtruj wpisy po kategorii"
              value={categoryFilter}
              onChange={(e) =>
                setCategoryFilter(e.target.value as 'ALL' | JournalCategory)
              }
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
            >
              <option value="ALL">Kategoria: wszystkie</option>
              {Object.entries(JOURNAL_CATEGORY_LABELS).map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </select>

            {(searchQuery || areaFilter !== 'ALL' || categoryFilter !== 'ALL') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setAreaFilter('ALL');
                  setCategoryFilter('ALL');
                }}
                className="text-xs font-medium text-blue-700 hover:underline dark:text-blue-300 px-1"
              >
                Wyczyść
              </button>
            )}
          </div>
        </div>

        {/* Lista wpisów */}
        {entries.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Brak wpisów w dzienniku obserwacji dla tego ucznia.
            </p>
            <button
              type="button"
              onClick={openNewForm}
              className="mt-3 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
            >
              Dodaj pierwszą obserwację
            </button>
          </div>
        ) : filteredEntries.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">
            Brak wpisów pasujących do podanej frazy lub wybranych filtrów.
          </p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredEntries.map((entry) => (
              <article key={entry.id} className="py-5 first:pt-2 last:pb-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                      <span className="font-mono font-medium text-slate-700 dark:text-slate-200">
                        {entry.date}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{JOURNAL_CATEGORY_LABELS[entry.category]}</span>
                      <span aria-hidden="true">·</span>
                      <span>
                        {entry.authorName}
                        {entry.authorRole ? ` (${entry.authorRole})` : ''}
                      </span>
                      {entry.relatedArea && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            {entry.relatedArea}
                          </span>
                        </>
                      )}
                      {entry.isTestData && (
                        <>
                          <span aria-hidden="true">·</span>
                          <TestDataStamp />
                        </>
                      )}
                    </div>

                    <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {entry.title}
                    </h4>

                    {entry.content && (
                      <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                        {entry.content}
                      </p>
                    )}

                    {(entry.whatWorked ||
                      entry.barriersObserved ||
                      entry.conclusions) && (
                      <dl className="grid grid-cols-1 gap-3 pt-1 md:grid-cols-3 text-xs">
                        {entry.whatWorked && (
                          <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-950/50">
                            <dt className="font-semibold text-teal-800 dark:text-teal-300">
                              Co zadziałało
                            </dt>
                            <dd className="mt-1 leading-relaxed text-slate-700 dark:text-slate-300">
                              {entry.whatWorked}
                            </dd>
                          </div>
                        )}
                        {entry.barriersObserved && (
                          <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-950/50">
                            <dt className="font-semibold text-amber-800 dark:text-amber-300">
                              Napotkane bariery
                            </dt>
                            <dd className="mt-1 leading-relaxed text-slate-700 dark:text-slate-300">
                              {entry.barriersObserved}
                            </dd>
                          </div>
                        )}
                        {entry.conclusions && (
                          <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-950/50">
                            <dt className="font-semibold text-blue-800 dark:text-blue-300">
                              Wnioski
                            </dt>
                            <dd className="mt-1 leading-relaxed text-slate-700 dark:text-slate-300">
                              {entry.conclusions}
                            </dd>
                          </div>
                        )}
                      </dl>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => openEditForm(entry)}
                      aria-label="Edytuj wpis w dzienniku"
                      className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTargetId(entry.id)}
                      aria-label="Usuń wpis z dziennika"
                      className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/60 dark:hover:text-red-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={deleteTargetId !== null}
        title="Usunąć wpis z dziennika obserwacji?"
        description="Wpis zostanie trwale usunięty z lokalnej bazy danych urządzenia."
        confirmLabel="Usuń wpis"
        destructive
        onCancel={() => setDeleteTargetId(null)}
        onConfirm={async () => {
          if (deleteTargetId) {
            await onDeleteEntry(deleteTargetId);
          }
          setDeleteTargetId(null);
        }}
      />
    </div>
  );
};
