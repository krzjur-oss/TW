import React, { useState } from 'react';
import { CheckCircle2, Plus, Trash2 } from 'lucide-react';
import {
  ADAPTATION_SUGGESTIONS,
  OPINION_HINTS,
} from '../../data/functionalExamples';
import type {
  OpinionSupportDraft,
  SpecialistSupportItem,
  SubjectAdaptationItem,
} from '../../types/domain';
import { FunctionalHintBox } from './FunctionalHintBox';

interface OpinionSupportEditorProps {
  step: 2 | 3;
  draft: OpinionSupportDraft;
  schoolYear: string;
  onChange: (next: OpinionSupportDraft) => void;
  onPrevStep: () => void;
  onNextStep?: () => void;
}

export const OpinionSupportEditor: React.FC<OpinionSupportEditorProps> = ({
  step,
  draft,
  schoolYear,
  onChange,
  onPrevStep,
  onNextStep,
}) => {
  const [subjName, setSubjName] = useState('');
  const [subjMethods, setSubjMethods] = useState('');
  const [subjCriteria, setSubjCriteria] = useState('');

  const [supType, setSupType] = useState('');
  const [supPeriod, setSupPeriod] = useState(
    `IX ${schoolYear.slice(0, 4)} – VI ${Number(schoolYear.slice(0, 4)) + 1}`,
  );
  const [supHours, setSupHours] = useState('1');
  const [supSpecialist, setSupSpecialist] = useState('');
  const [supGoal, setSupGoal] = useState('');

  const updateField = <K extends keyof OpinionSupportDraft>(
    key: K,
    value: OpinionSupportDraft[K],
  ) => {
    onChange({
      ...draft,
      [key]: value,
      lastUpdatedAt: new Date().toISOString(),
    });
  };

  const handleAddAdaptation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjName.trim()) return;
    const item: SubjectAdaptationItem = {
      id: crypto.randomUUID(),
      subject: subjName.trim(),
      methodsAndForms: subjMethods.trim(),
      assessmentCriteria: subjCriteria.trim(),
    };
    updateField('subjectAdaptations', [...draft.subjectAdaptations, item]);
    setSubjName('');
    setSubjMethods('');
    setSubjCriteria('');
  };

  const handleInsertPreset = (preset: {
    subject: string;
    methodsAndForms: string;
    assessmentCriteria: string;
  }) => {
    const exists = draft.subjectAdaptations.some(
      (a) => a.subject.toLowerCase() === preset.subject.toLowerCase(),
    );
    if (exists) return;
    updateField('subjectAdaptations', [
      ...draft.subjectAdaptations,
      {
        id: crypto.randomUUID(),
        ...preset,
      },
    ]);
  };

  const handleAddSupport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supType.trim()) return;
    const item: SpecialistSupportItem = {
      id: crypto.randomUUID(),
      type: supType.trim(),
      period: supPeriod.trim(),
      hoursPerWeek: Number(supHours) || 1,
      specialistName: supSpecialist.trim(),
      functionalGoal: supGoal.trim(),
    };
    updateField('psychologicalPedagogicalSupport', [
      ...draft.psychologicalPedagogicalSupport,
      item,
    ]);
    setSupType('');
    setSupSpecialist('');
    setSupGoal('');
  };

  if (step === 2) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 space-y-6">
        <div className="border-b border-slate-100 pb-4 dark:border-slate-800">
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Funkcjonowanie ucznia i dostosowanie wymagań edukacyjnych
          </h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Dla opinii PPP nie sporządza się pełnego IPET. Określ konkretne warunki pracy oraz modyfikacje wymagań przedmiotowych na podstawie zaleceń poradni.
          </p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1.5">
            Charakterystyka funkcjonowania ucznia (język funkcjonalny)
          </label>
          <textarea
            rows={4}
            value={draft.functionalProfileSummary}
            onChange={(e) =>
              updateField('functionalProfileSummary', e.target.value)
            }
            placeholder="Opisz mocne strony, trudności w czytaniu/pisaniu/koncentracji oraz warunki, w których uczeń pracuje najlepiej..."
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          />
          <FunctionalHintBox
            hints={OPINION_HINTS.profileSummary}
            currentValue={draft.functionalProfileSummary}
            onApply={(v) => updateField('functionalProfileSummary', v)}
          />
        </div>

        <div className="border-t border-slate-100 pt-5 space-y-4 dark:border-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Karta dostosowań wymagań edukacyjnych (przedmioty)
              </h4>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Wskazówki dla nauczycieli uczących dotyczące metod pracy oraz oceniania.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {ADAPTATION_SUGGESTIONS.map((preset) => (
                <button
                  key={preset.subject}
                  type="button"
                  onClick={() => handleInsertPreset(preset)}
                  className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 whitespace-nowrap shrink-0"
                >
                  + Szablon: {preset.subject}
                </button>
              ))}
            </div>
          </div>

          {draft.subjectAdaptations.length > 0 && (
            <div className="divide-y divide-slate-200 rounded-lg border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
              {draft.subjectAdaptations.map((item) => (
                <div key={item.id} className="p-4 flex items-start justify-between gap-4">
                  <div className="space-y-1.5 text-sm">
                    <div className="font-semibold text-slate-900 dark:text-slate-100">
                      {item.subject}
                    </div>
                    <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                      <strong>Metody i warunki pracy:</strong>{' '}
                      {item.methodsAndForms || 'Nie określono'}
                    </p>
                    <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                      <strong>Kryteria oceniania:</strong>{' '}
                      {item.assessmentCriteria || 'Nie określono'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      updateField(
                        'subjectAdaptations',
                        draft.subjectAdaptations.filter(
                          (a) => a.id !== item.id,
                        ),
                      )
                    }
                    aria-label="Usuń dostosowanie"
                    className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/60 dark:hover:text-red-300 shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <form
            onSubmit={handleAddAdaptation}
            className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60"
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Przedmiot
                </label>
                <input
                  type="text"
                  value={subjName}
                  onChange={(e) => setSubjName(e.target.value)}
                  placeholder="np. Język polski"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Modyfikacje metod pracy
                </label>
                <input
                  type="text"
                  value={subjMethods}
                  onChange={(e) => setSubjMethods(e.target.value)}
                  placeholder="np. Głośne odczytanie poleceń, czcionka bezszeryfowa"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Ocenianie
                </label>
                <input
                  type="text"
                  value={subjCriteria}
                  onChange={(e) => setSubjCriteria(e.target.value)}
                  placeholder="np. Bez oceny za błędy ortograficzne, +50% czasu"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 whitespace-nowrap shrink-0"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Dodaj dostosowanie</span>
              </button>
            </div>
          </form>
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 pt-5 dark:border-slate-800">
          <button
            type="button"
            onClick={onPrevStep}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 whitespace-nowrap shrink-0"
          >
            ← Nauczyciele i terminy
          </button>
          {onNextStep && (
            <button
              type="button"
              onClick={onNextStep}
              className="rounded-lg bg-blue-700 px-5 py-2 text-xs font-semibold text-white hover:bg-blue-800 dark:bg-blue-600 whitespace-nowrap shrink-0"
            >
              Pomoc PPP i rodzice →
            </button>
          )}
        </div>
      </div>
    );
  }

  // Step 3: Pomoc psychologiczno-pedagogiczna i współpraca z rodzicami
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 space-y-6">
      <div className="flex flex-col gap-4 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Formy pomocy psychologiczno-pedagogicznej i współpraca z rodzicami
          </h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Zaplanuj zajęcia specjalistyczne wynikające z opinii PPP (np. korekcyjno-kompensacyjne, dydaktyczno-wyrównawcze, logopedyczne) oraz ustalenia z opiekunami.
          </p>
        </div>
        <div className="w-full sm:w-48 shrink-0">
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Data wdrożenia planu
          </label>
          <input
            type="date"
            value={draft.implementedDate ?? ''}
            onChange={(e) => updateField('implementedDate', e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-mono text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          />
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          Przyznane formy pomocy psychologiczno-pedagogicznej
        </h4>

        {draft.psychologicalPedagogicalSupport.length > 0 && (
          <div className="divide-y divide-slate-200 rounded-lg border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
            {draft.psychologicalPedagogicalSupport.map((sup) => (
              <div key={sup.id} className="p-4 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                    <span>{sup.type}</span>
                    <span className="font-mono text-xs font-normal text-slate-500 dark:text-slate-400 tabular-nums">
                      · {sup.hoursPerWeek} godz./tyg. · {sup.period}
                    </span>
                  </div>
                  {sup.specialistName && (
                    <div className="text-xs text-slate-600 dark:text-slate-300">
                      Prowadzący: {sup.specialistName}
                    </div>
                  )}
                  {sup.functionalGoal && (
                    <div className="text-xs text-slate-600 dark:text-slate-300">
                      Cel funkcjonalny: {sup.functionalGoal}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() =>
                    updateField(
                      'psychologicalPedagogicalSupport',
                      draft.psychologicalPedagogicalSupport.filter(
                        (s) => s.id !== sup.id,
                      ),
                    )
                  }
                  aria-label="Usuń zajęcia pomocy PPP"
                  className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/60 dark:hover:text-red-300 shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        <form
          onSubmit={handleAddSupport}
          className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
            <div className="sm:col-span-5">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Rodzaj zajęć PPP
              </label>
              <input
                type="text"
                value={supType}
                onChange={(e) => setSupType(e.target.value)}
                placeholder="np. Zajęcia korekcyjno-kompensacyjne"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </div>
            <div className="sm:col-span-3">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Okres
              </label>
              <input
                type="text"
                value={supPeriod}
                onChange={(e) => setSupPeriod(e.target.value)}
                placeholder="IX 2026 – VI 2027"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-mono text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Godz./tyg.
              </label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                value={supHours}
                onChange={(e) => setSupHours(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-mono text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Prowadzący
              </label>
              <input
                type="text"
                value={supSpecialist}
                onChange={(e) => setSupSpecialist(e.target.value)}
                placeholder="Specjalista"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              type="text"
              value={supGoal}
              onChange={(e) => setSupGoal(e.target.value)}
              placeholder="Cel funkcjonalny (np. automatyzacja techniki czytania i autokorekta błędów)"
              className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 whitespace-nowrap shrink-0"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Dodaj zajęcia PPP</span>
            </button>
          </div>
        </form>
      </div>

      <div className="border-t border-slate-100 pt-5 dark:border-slate-800">
        <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1.5">
          Współpraca z rodzicami / przekazanie informacji o dostosowaniach
        </label>
        <textarea
          rows={3}
          value={draft.parentCollaborationNotes}
          onChange={(e) =>
            updateField('parentCollaborationNotes', e.target.value)
          }
          placeholder="Opisz kiedy i w jakiej formie rodzice otrzymali informację o dostosowaniach i formach wsparcia..."
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
        />
        <FunctionalHintBox
          hints={OPINION_HINTS.parentCollaboration}
          currentValue={draft.parentCollaborationNotes}
          onApply={(v) => updateField('parentCollaborationNotes', v)}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-5 dark:border-slate-800">
        <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-800 dark:text-slate-200 cursor-pointer">
          <input
            type="checkbox"
            checked={draft.isCompleted}
            onChange={(e) => updateField('isCompleted', e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-teal-700 focus:ring-teal-600"
          />
          <CheckCircle2 className="h-4 w-4 text-teal-700 dark:text-teal-400" />
          <span>Oznacz kartę dostosowań i pomocy PPP jako gotową</span>
        </label>

        <button
          type="button"
          onClick={onPrevStep}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 whitespace-nowrap shrink-0"
        >
          ← Wróć do dostosowań
        </button>
      </div>
    </div>
  );
};
