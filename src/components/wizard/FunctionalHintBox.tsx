import React, { useState } from 'react';
import { Lightbulb, Plus } from 'lucide-react';
import type { FunctionalHintItem } from '../../data/functionalExamples';

interface FunctionalHintBoxProps {
  hints: FunctionalHintItem[];
  currentValue: string;
  onApply: (nextValue: string) => void;
}

export const FunctionalHintBox: React.FC<FunctionalHintBoxProps> = ({
  hints,
  currentValue,
  onApply,
}) => {
  const [expanded, setExpanded] = useState(false);

  if (hints.length === 0) return null;

  const handleInsert = (text: string) => {
    const trimmed = currentValue.trim();
    if (!trimmed) {
      onApply(text);
    } else if (!trimmed.includes(text)) {
      onApply(`${trimmed}\n${text}`);
    }
  };

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-200"
      >
        <Lightbulb className="h-3.5 w-3.5 shrink-0" />
        <span>
          {expanded
            ? 'Ukryj podpowiedzi w języku funkcjonalnym'
            : 'Pokaż podpowiedź i przykład w języku funkcjonalnym'}
        </span>
      </button>

      {expanded && (
        <div className="mt-2 space-y-2.5 rounded-lg border border-slate-200 bg-slate-50 p-3.5 text-xs dark:border-slate-800 dark:bg-slate-950/70">
          {hints.map((hint) => (
            <div
              key={hint.label}
              className="space-y-1.5 border-b border-slate-200/80 pb-2.5 last:border-b-0 last:pb-0 dark:border-slate-800"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold text-slate-800 dark:text-slate-100">
                  {hint.label}
                </span>
                <button
                  type="button"
                  onClick={() => handleInsert(hint.functionalText)}
                  className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-blue-800 transition-colors hover:bg-blue-50 dark:border-blue-800 dark:bg-slate-900 dark:text-blue-200 dark:hover:bg-blue-950/50 whitespace-nowrap shrink-0"
                >
                  <Plus className="h-3 w-3" />
                  <span>Wstaw przykład</span>
                </button>
              </div>
              <p className="text-slate-500 dark:text-slate-400">
                <span className="font-medium text-slate-600 dark:text-slate-300">
                  Unikaj ogólnika:
                </span>{' '}
                „{hint.avoid}”
              </p>
              <p className="leading-relaxed text-slate-700 dark:text-slate-200">
                <span className="font-medium text-teal-800 dark:text-teal-300">
                  Język funkcjonalny:
                </span>{' '}
                {hint.functionalText}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
