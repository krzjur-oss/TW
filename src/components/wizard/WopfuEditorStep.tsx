import React, { useState } from 'react';
import { CheckCircle2, Plus, X } from 'lucide-react';
import {
  WOPFU_BARRIER_SUGGESTIONS,
  WOPFU_HINTS,
  WOPFU_STRENGTH_SUGGESTIONS,
} from '../../data/functionalExamples';
import type { WopfuStructureDraft } from '../../types/domain';
import { FunctionalHintBox } from './FunctionalHintBox';

interface WopfuEditorStepProps {
  wopfu: WopfuStructureDraft;
  onChange: (nextWopfu: WopfuStructureDraft) => void;
  onPrevStep: () => void;
  onNextStep: () => void;
}

export const WopfuEditorStep: React.FC<WopfuEditorStepProps> = ({
  wopfu,
  onChange,
  onPrevStep,
  onNextStep,
}) => {
  const [newStrength, setNewStrength] = useState('');
  const [newBarrier, setNewBarrier] = useState('');

  const updateField = <K extends keyof WopfuStructureDraft>(
    key: K,
    value: WopfuStructureDraft[K],
  ) => {
    onChange({
      ...wopfu,
      [key]: value,
      lastUpdatedAt: new Date().toISOString(),
    });
  };

  const updateArea = (
    area: keyof WopfuStructureDraft['functioningAreas'],
    value: string,
  ) => {
    onChange({
      ...wopfu,
      functioningAreas: {
        ...wopfu.functioningAreas,
        [area]: value,
      },
      lastUpdatedAt: new Date().toISOString(),
    });
  };

  const addStrength = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || wopfu.strengths.includes(trimmed)) return;
    updateField('strengths', [...wopfu.strengths, trimmed]);
    setNewStrength('');
  };

  const removeStrength = (idx: number) => {
    updateField(
      'strengths',
      wopfu.strengths.filter((_, i) => i !== idx),
    );
  };

  const addBarrier = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || wopfu.barriersAndNeeds.includes(trimmed)) return;
    updateField('barriersAndNeeds', [...wopfu.barriersAndNeeds, trimmed]);
    setNewBarrier('');
  };

  const removeBarrier = (idx: number) => {
    updateField(
      'barriersAndNeeds',
      wopfu.barriersAndNeeds.filter((_, i) => i !== idx),
    );
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 space-y-6">
        <div className="flex flex-col gap-4 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              WOPFU — Wielospecjalistyczna Ocena Poziomu Funkcjonowania Ucznia
            </h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Opisz mocne strony, bariery i funkcjonowanie ucznia językiem konkretnym (obserwowalne zachowania i warunki pracy).
            </p>
          </div>
          <div className="w-full sm:w-48 shrink-0">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Data sporządzenia WOPFU
            </label>
            <input
              type="date"
              value={wopfu.assessmentDate ?? ''}
              onChange={(e) => updateField('assessmentDate', e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-mono text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
          </div>
        </div>

        {/* 1. Mocne strony i bariery */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100">
              Mocne strony, predyspozycje i zasoby ucznia
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newStrength}
                onChange={(e) => setNewStrength(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addStrength(newStrength);
                  }
                }}
                placeholder="np. Bardzo dobra pamięć wzrokowa do schematów"
                className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
              <button
                type="button"
                onClick={() => addStrength(newStrength)}
                className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 whitespace-nowrap shrink-0"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Dodaj</span>
              </button>
            </div>

            {wopfu.strengths.length > 0 && (
              <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
                {wopfu.strengths.map((item, idx) => (
                  <li
                    key={`${item}-${idx}`}
                    className="flex items-start justify-between gap-2 px-3 py-2 text-xs text-slate-800 dark:text-slate-200"
                  >
                    <span className="leading-relaxed">{item}</span>
                    <button
                      type="button"
                      onClick={() => removeStrength(idx)}
                      aria-label="Usuń mocną stronę"
                      className="text-slate-400 hover:text-red-600 shrink-0"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <div className="space-y-1.5 pt-1">
              <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Przykłady do szybkiego dodania:
              </div>
              <div className="flex flex-col gap-1">
                {WOPFU_STRENGTH_SUGGESTIONS.filter(
                  (s) => !wopfu.strengths.includes(s),
                )
                  .slice(0, 3)
                  .map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => addStrength(suggestion)}
                      className="text-left text-xs text-blue-700 hover:underline dark:text-blue-300"
                    >
                      + {suggestion}
                    </button>
                  ))}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100">
              Bariery i czynniki utrudniające funkcjonowanie
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newBarrier}
                onChange={(e) => setNewBarrier(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addBarrier(newBarrier);
                  }
                }}
                placeholder="np. Przeciążenie hałasem podczas przerw"
                className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
              <button
                type="button"
                onClick={() => addBarrier(newBarrier)}
                className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 whitespace-nowrap shrink-0"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Dodaj</span>
              </button>
            </div>

            {wopfu.barriersAndNeeds.length > 0 && (
              <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
                {wopfu.barriersAndNeeds.map((item, idx) => (
                  <li
                    key={`${item}-${idx}`}
                    className="flex items-start justify-between gap-2 px-3 py-2 text-xs text-slate-800 dark:text-slate-200"
                  >
                    <span className="leading-relaxed">{item}</span>
                    <button
                      type="button"
                      onClick={() => removeBarrier(idx)}
                      aria-label="Usuń barierę"
                      className="text-slate-400 hover:text-red-600 shrink-0"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <div className="space-y-1.5 pt-1">
              <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Przykłady do szybkiego dodania:
              </div>
              <div className="flex flex-col gap-1">
                {WOPFU_BARRIER_SUGGESTIONS.filter(
                  (s) => !wopfu.barriersAndNeeds.includes(s),
                )
                  .slice(0, 3)
                  .map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => addBarrier(suggestion)}
                      className="text-left text-xs text-blue-700 hover:underline dark:text-blue-300"
                    >
                      + {suggestion}
                    </button>
                  ))}
              </div>
            </div>
          </div>
        </div>

        {/* 2. Uwarunkowania */}
        <div className="border-t border-slate-100 pt-5 dark:border-slate-800">
          <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1.5">
            Uwarunkowania indywidualne, rozwojowe i środowiskowe
          </label>
          <textarea
            rows={3}
            value={wopfu.conditionsAndContext}
            onChange={(e) =>
              updateField('conditionsAndContext', e.target.value)
            }
            placeholder="Opisz warunki w klasie, czynniki środowiskowe i sytuacje sprzyjające oraz obciążające..."
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          />
          <FunctionalHintBox
            hints={WOPFU_HINTS.conditions}
            currentValue={wopfu.conditionsAndContext}
            onApply={(v) => updateField('conditionsAndContext', v)}
          />
        </div>

        {/* 3. Obszary funkcjonowania */}
        <div className="border-t border-slate-100 pt-5 space-y-5 dark:border-slate-800">
          <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Ocena funkcjonowania w kluczowych obszarach
          </h4>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                Obszar poznawczo-edukacyjny (uwaga, pamięć, uczenie się)
              </label>
              <textarea
                rows={4}
                value={wopfu.functioningAreas.cognitive}
                onChange={(e) => updateArea('cognitive', e.target.value)}
                placeholder="Jak uczeń przyswaja nowe treści, ile minut utrzymuje uwagę, jakich instrukcji potrzebuje..."
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
              <FunctionalHintBox
                hints={WOPFU_HINTS.cognitive}
                currentValue={wopfu.functioningAreas.cognitive}
                onApply={(v) => updateArea('cognitive', v)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                Obszar komunikacyjny i językowy
              </label>
              <textarea
                rows={4}
                value={wopfu.functioningAreas.communication}
                onChange={(e) => updateArea('communication', e.target.value)}
                placeholder="Rozumienie poleceń, formułowanie wypowiedzi ustnych i pisemnych, komunikacja w grupie..."
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
              <FunctionalHintBox
                hints={WOPFU_HINTS.communication}
                currentValue={wopfu.functioningAreas.communication}
                onApply={(v) => updateArea('communication', v)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                Obszar emocjonalno-społeczny i relacje rówieśnicze
              </label>
              <textarea
                rows={4}
                value={wopfu.functioningAreas.emotionalSocial}
                onChange={(e) => updateArea('emotionalSocial', e.target.value)}
                placeholder="Radzenie sobie ze stresem, zmianą planu, współpracą w parze i grupie..."
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
              <FunctionalHintBox
                hints={WOPFU_HINTS.emotionalSocial}
                currentValue={wopfu.functioningAreas.emotionalSocial}
                onApply={(v) => updateArea('emotionalSocial', v)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                Obszar motoryczno-sensoryczny i samoobsługa
              </label>
              <textarea
                rows={4}
                value={wopfu.functioningAreas.motorSensory}
                onChange={(e) => updateArea('motorSensory', e.target.value)}
                placeholder="Tempo pisania, grafomotoryka, wrażliwość na bodźce słuchowe/wzrokowe, organizacja stanowiska..."
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
              <FunctionalHintBox
                hints={WOPFU_HINTS.motorSensory}
                currentValue={wopfu.functioningAreas.motorSensory}
                onApply={(v) => updateArea('motorSensory', v)}
              />
            </div>
          </div>
        </div>

        {/* 4. Podsumowanie potrzeb rozwojowych */}
        <div className="border-t border-slate-100 pt-5 dark:border-slate-800">
          <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1.5">
            Zintegrowane potrzeby rozwojowe i edukacyjne (wnioski do IPET)
          </label>
          <textarea
            rows={3}
            value={wopfu.developmentalNeedsSummary}
            onChange={(e) =>
              updateField('developmentalNeedsSummary', e.target.value)
            }
            placeholder="Wypunktuj priorytetowe potrzeby, które zostaną przełożone na cele i dostosowania w IPET..."
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          />
          <FunctionalHintBox
            hints={WOPFU_HINTS.needs}
            currentValue={wopfu.developmentalNeedsSummary}
            onApply={(v) => updateField('developmentalNeedsSummary', v)}
          />
        </div>

        {/* Stopka WOPFU */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-5 dark:border-slate-800">
          <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-800 dark:text-slate-200 cursor-pointer">
            <input
              type="checkbox"
              checked={wopfu.isCompleted}
              onChange={(e) => updateField('isCompleted', e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-teal-700 focus:ring-teal-600"
            />
            <CheckCircle2 className="h-4 w-4 text-teal-700 dark:text-teal-400" />
            <span>Oznacz WOPFU jako zakończone</span>
          </label>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onPrevStep}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 whitespace-nowrap shrink-0"
            >
              ← Zespół i terminy
            </button>
            <button
              type="button"
              onClick={onNextStep}
              className="rounded-lg bg-blue-700 px-5 py-2 text-xs font-semibold text-white hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 whitespace-nowrap shrink-0"
            >
              Przejdź do kreatora IPET →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
