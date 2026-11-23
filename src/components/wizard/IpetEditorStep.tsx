import React, { useState } from 'react';
import { CheckCircle2, Plus, Trash2 } from 'lucide-react';
import {
  ADAPTATION_SUGGESTIONS,
  IPET_HINTS,
} from '../../data/functionalExamples';
import {
  REHAB_CATEGORY_LABELS,
  type IpetStructureDraft,
  type SpecialRehabClassItem,
  type SpecialistSupportItem,
  type SubjectAdaptationItem,
} from '../../types/domain';
import { FunctionalHintBox } from './FunctionalHintBox';

interface IpetEditorStepProps {
  ipet: IpetStructureDraft;
  schoolYear: string;
  onChange: (nextIpet: IpetStructureDraft) => void;
  onPrevStep: () => void;
}

export const IpetEditorStep: React.FC<IpetEditorStepProps> = ({
  ipet,
  schoolYear,
  onChange,
  onPrevStep,
}) => {
  // Nowe dostosowanie przedmiotowe
  const [subjName, setSubjName] = useState('');
  const [subjMethods, setSubjMethods] = useState('');
  const [subjCriteria, setSubjCriteria] = useState('');

  // Nowa forma pomocy PPP
  const [supType, setSupType] = useState('');
  const [supPeriod, setSupPeriod] = useState(`IX ${schoolYear.slice(0, 4)} – VI ${Number(schoolYear.slice(0, 4)) + 1}`);
  const [supHours, setSupHours] = useState('1');
  const [supSpecialist, setSupSpecialist] = useState('');
  const [supGoal, setSupGoal] = useState('');

  // Nowe zajęcia rewalidacyjne / socjoterapeutyczne / resocjalizacyjne
  const [rehabCat, setRehabCat] =
    useState<SpecialRehabClassItem['category']>('REWALIDACYJNE');
  const [rehabName, setRehabName] = useState('');
  const [rehabPeriod, setRehabPeriod] = useState(`IX ${schoolYear.slice(0, 4)} – VI ${Number(schoolYear.slice(0, 4)) + 1}`);
  const [rehabHours, setRehabHours] = useState('2');
  const [rehabSpecialist, setRehabSpecialist] = useState('');
  const [rehabGoal, setRehabGoal] = useState('');

  const updateField = <K extends keyof IpetStructureDraft>(
    key: K,
    value: IpetStructureDraft[K],
  ) => {
    onChange({
      ...ipet,
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
    updateField('subjectAdaptations', [...ipet.subjectAdaptations, item]);
    setSubjName('');
    setSubjMethods('');
    setSubjCriteria('');
  };

  const handleInsertAdaptationPreset = (preset: {
    subject: string;
    methodsAndForms: string;
    assessmentCriteria: string;
  }) => {
    const exists = ipet.subjectAdaptations.some(
      (a) => a.subject.toLowerCase() === preset.subject.toLowerCase(),
    );
    if (exists) return;
    updateField('subjectAdaptations', [
      ...ipet.subjectAdaptations,
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
    updateField('specialistSupportHours', [
      ...ipet.specialistSupportHours,
      item,
    ]);
    setSupType('');
    setSupSpecialist('');
    setSupGoal('');
  };

  const handleAddRehab = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rehabName.trim()) return;
    const item: SpecialRehabClassItem = {
      id: crypto.randomUUID(),
      category: rehabCat,
      name: rehabName.trim(),
      hoursPerWeek: Number(rehabHours) || 2,
      period: rehabPeriod.trim(),
      specialistName: rehabSpecialist.trim(),
      functionalGoal: rehabGoal.trim(),
    };
    updateField('rehabAndSpecialClasses', [
      ...ipet.rehabAndSpecialClasses,
      item,
    ]);
    setRehabName('');
    setRehabSpecialist('');
    setRehabGoal('');
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 space-y-7">
        <div className="flex flex-col gap-4 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              IPET — Indywidualny Program Edukacyjno-Terapeutyczny
            </h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Program opracowywany w oparciu o orzeczenie PPP oraz wnioski z WOPFU. W polach zastosuj język mierzalnych efektów i warunków pracy.
            </p>
          </div>
          <div className="w-full sm:w-48 shrink-0">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Data zatwierdzenia IPET
            </label>
            <input
              type="date"
              value={ipet.approvedDate ?? ''}
              onChange={(e) => updateField('approvedDate', e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-mono text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
          </div>
        </div>

        {/* 1. Cele edukacyjne i terapeutyczne */}
        <div>
          <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1.5">
            1. Cele edukacyjne i terapeutyczne
          </label>
          <textarea
            rows={4}
            value={ipet.educationalAndTherapeuticGoals}
            onChange={(e) =>
              updateField('educationalAndTherapeuticGoals', e.target.value)
            }
            placeholder="Określ cele krótko- i długoterminowe w języku funkcjonalnym (jakie konkretne umiejętności uczeń rozwinie)..."
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          />
          <FunctionalHintBox
            hints={IPET_HINTS.goals}
            currentValue={ipet.educationalAndTherapeuticGoals}
            onApply={(v) => updateField('educationalAndTherapeuticGoals', v)}
          />
        </div>

        {/* 2. Metody i formy pracy */}
        <div className="border-t border-slate-100 pt-5 dark:border-slate-800">
          <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1.5">
            2. Ogólne metody i formy pracy z uczniem
          </label>
          <textarea
            rows={3}
            value={ipet.methodsAndFormsOfWork}
            onChange={(e) =>
              updateField('methodsAndFormsOfWork', e.target.value)
            }
            placeholder="Opisz organizację przestrzeni, sposób podawania poleceń, dobór środków dydaktycznych..."
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          />
          <FunctionalHintBox
            hints={IPET_HINTS.methods}
            currentValue={ipet.methodsAndFormsOfWork}
            onApply={(v) => updateField('methodsAndFormsOfWork', v)}
          />
        </div>

        {/* 3. Zakres dostosowania wymagań edukacyjnych */}
        <div className="border-t border-slate-100 pt-5 space-y-4 dark:border-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                3. Zakres dostosowania wymagań edukacyjnych do indywidualnych potrzeb
              </h4>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Konkretne modyfikacje metod, form sprawdzania wiedzy i kryteriów oceniania dla poszczególnych przedmiotów.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {ADAPTATION_SUGGESTIONS.map((preset) => (
                <button
                  key={preset.subject}
                  type="button"
                  onClick={() => handleInsertAdaptationPreset(preset)}
                  className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 whitespace-nowrap shrink-0"
                >
                  + Szablon: {preset.subject}
                </button>
              ))}
            </div>
          </div>

          {ipet.subjectAdaptations.length > 0 && (
            <div className="divide-y divide-slate-200 rounded-lg border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
              {ipet.subjectAdaptations.map((item) => (
                <div key={item.id} className="p-4 flex items-start justify-between gap-4">
                  <div className="space-y-1.5 text-sm">
                    <div className="font-semibold text-slate-900 dark:text-slate-100">
                      {item.subject}
                    </div>
                    <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                      <strong>Metody i formy pracy:</strong>{' '}
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
                        ipet.subjectAdaptations.filter((a) => a.id !== item.id),
                      )
                    }
                    aria-label={`Usuń dostosowanie dla ${item.subject}`}
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
                  Przedmiot / edukacja
                </label>
                <input
                  type="text"
                  value={subjName}
                  onChange={(e) => setSubjName(e.target.value)}
                  placeholder="np. Historia / Edukacja polonistyczna"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Dostosowanie metod i warunków pracy
                </label>
                <input
                  type="text"
                  value={subjMethods}
                  onChange={(e) => setSubjMethods(e.target.value)}
                  placeholder="np. Karta z osią czasu, brak przepisywania definicji"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Dostosowanie oceniania
                </label>
                <input
                  type="text"
                  value={subjCriteria}
                  onChange={(e) => setSubjCriteria(e.target.value)}
                  placeholder="np. Wydłużony czas o 50%, odpowiedź w parze"
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
                <span>Dodaj dostosowanie przedmiotowe</span>
              </button>
            </div>
          </form>
        </div>

        {/* 4. Zintegrowane działania nauczycieli i specjalistów */}
        <div className="border-t border-slate-100 pt-5 dark:border-slate-800">
          <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1.5">
            4. Zintegrowane działania nauczycieli i specjalistów
          </label>
          <textarea
            rows={3}
            value={ipet.integratedTeamActions}
            onChange={(e) =>
              updateField('integratedTeamActions', e.target.value)
            }
            placeholder="Opisz wspólne zasady i przenoszenie strategii terapeutycznych na wszystkie lekcje..."
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          />
          <FunctionalHintBox
            hints={IPET_HINTS.integratedActions}
            currentValue={ipet.integratedTeamActions}
            onApply={(v) => updateField('integratedTeamActions', v)}
          />
        </div>

        {/* 5. Formy i okresy udzielania pomocy psychologiczno-pedagogicznej */}
        <div className="border-t border-slate-100 pt-5 space-y-4 dark:border-slate-800">
          <div>
            <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              5. Formy i okresy udzielania pomocy psychologiczno-pedagogicznej
            </h4>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Np. zajęcia korekcyjno-kompensacyjne, logopedyczne, rozwijające kompetencje emocjonalno-społeczne, dydaktyczno-wyrównawcze.
            </p>
          </div>

          {ipet.specialistSupportHours.length > 0 && (
            <div className="divide-y divide-slate-200 rounded-lg border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
              {ipet.specialistSupportHours.map((sup) => (
                <div key={sup.id} className="p-4 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                      <span>{sup.type}</span>
                      <span className="font-mono text-xs font-normal text-slate-500 dark:text-slate-400 tabular-nums">
                        · {sup.hoursPerWeek} godz./tyg. · {sup.period || 'Cały rok'}
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
                        'specialistSupportHours',
                        ipet.specialistSupportHours.filter(
                          (s) => s.id !== sup.id,
                        ),
                      )
                    }
                    aria-label="Usuń formę pomocy"
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
                  Forma pomocy PPP
                </label>
                <input
                  type="text"
                  value={supType}
                  onChange={(e) => setSupType(e.target.value)}
                  placeholder="np. Zajęcia rozwijające kompetencje emocjonalno-społeczne"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>
              <div className="sm:col-span-3">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Okres realizacji
                </label>
                <input
                  type="text"
                  value={supPeriod}
                  onChange={(e) => setSupPeriod(e.target.value)}
                  placeholder="np. IX 2026 – VI 2027"
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
                  Specjalista
                </label>
                <input
                  type="text"
                  value={supSpecialist}
                  onChange={(e) => setSupSpecialist(e.target.value)}
                  placeholder="Imię i nazwisko"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <input
                type="text"
                value={supGoal}
                onChange={(e) => setSupGoal(e.target.value)}
                placeholder="Cel funkcjonalny zajęć (np. utrwalanie strategii proszenia o przerwę i planowania pracy)"
                className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 whitespace-nowrap shrink-0"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Dodaj pomoc PPP</span>
              </button>
            </div>
          </form>
        </div>

        {/* 6. Zajęcia rewalidacyjne / socjoterapeutyczne / resocjalizacyjne */}
        <div className="border-t border-slate-100 pt-5 space-y-4 dark:border-slate-800">
          <div>
            <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              6. Zajęcia rewalidacyjne / socjoterapeutyczne / resocjalizacyjne (jeśli dotyczy)
            </h4>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Dla uczniów z orzeczeniem o niepełnosprawności lub autyzmie: min. 2 godz. rewalidacji tygodniowo; dla zagrożonych niedostosowaniem: socjoterapia lub resocjalizacja.
            </p>
          </div>

          {ipet.rehabAndSpecialClasses.length > 0 && (
            <div className="divide-y divide-slate-200 rounded-lg border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
              {ipet.rehabAndSpecialClasses.map((rc) => (
                <div key={rc.id} className="p-4 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                      <span>{rc.name}</span>
                      <span className="font-mono text-xs font-normal text-slate-500 dark:text-slate-400 tabular-nums">
                        · {REHAB_CATEGORY_LABELS[rc.category]} · {rc.hoursPerWeek} godz./tyg. · {rc.period}
                      </span>
                    </div>
                    {rc.specialistName && (
                      <div className="text-xs text-slate-600 dark:text-slate-300">
                        Prowadzący: {rc.specialistName}
                      </div>
                    )}
                    {rc.functionalGoal && (
                      <div className="text-xs text-slate-600 dark:text-slate-300">
                        Cel funkcjonalny: {rc.functionalGoal}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      updateField(
                        'rehabAndSpecialClasses',
                        ipet.rehabAndSpecialClasses.filter(
                          (item) => item.id !== rc.id,
                        ),
                      )
                    }
                    aria-label="Usuń zajęcia"
                    className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/60 dark:hover:text-red-300 shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <form
            onSubmit={handleAddRehab}
            className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60"
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
              <div className="sm:col-span-3">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Rodzaj zajęć
                </label>
                <select
                  value={rehabCat}
                  onChange={(e) =>
                    setRehabCat(
                      e.target.value as SpecialRehabClassItem['category'],
                    )
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                >
                  {Object.entries(REHAB_CATEGORY_LABELS).map(([k, lbl]) => (
                    <option key={k} value={k}>
                      {lbl}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-4">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Nazwa / zakres zajęć
                </label>
                <input
                  type="text"
                  value={rehabName}
                  onChange={(e) => setRehabName(e.target.value)}
                  placeholder="np. Rewalidacja – trening kompetencji społecznych"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
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
                  value={rehabHours}
                  onChange={(e) => setRehabHours(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-mono text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>
              <div className="sm:col-span-3">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Prowadzący / okres
                </label>
                <input
                  type="text"
                  value={rehabSpecialist}
                  onChange={(e) => setRehabSpecialist(e.target.value)}
                  placeholder="np. mgr Anna Nowak"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-12 sm:items-center">
              <div className="sm:col-span-3">
                <input
                  type="text"
                  value={rehabPeriod}
                  onChange={(e) => setRehabPeriod(e.target.value)}
                  placeholder="IX 2026 – VI 2027"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-mono text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>
              <div className="sm:col-span-6">
                <input
                  type="text"
                  value={rehabGoal}
                  onChange={(e) => setRehabGoal(e.target.value)}
                  placeholder="Cel funkcjonalny zajęć rewalidacyjnych / socjoterapeutycznych"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>
              <div className="sm:col-span-3 flex justify-end">
                <button
                  type="submit"
                  className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 whitespace-nowrap shrink-0"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Dodaj zajęcia</span>
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* 7. Współpraca z rodzicami */}
        <div className="border-t border-slate-100 pt-5 dark:border-slate-800">
          <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1.5">
            7. Zakres i formy współpracy z rodzicami / opiekunami ucznia
          </label>
          <textarea
            rows={3}
            value={ipet.parentCollaborationNotes}
            onChange={(e) =>
              updateField('parentCollaborationNotes', e.target.value)
            }
            placeholder="Opisz częstotliwość kontaktów, sposób przekazywania informacji zwrotnej i wspólne działania w domu..."
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          />
          <FunctionalHintBox
            hints={IPET_HINTS.parentCollaboration}
            currentValue={ipet.parentCollaborationNotes}
            onApply={(v) => updateField('parentCollaborationNotes', v)}
          />
        </div>

        {/* Stopka IPET */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-5 dark:border-slate-800">
          <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-800 dark:text-slate-200 cursor-pointer">
            <input
              type="checkbox"
              checked={ipet.isCompleted}
              onChange={(e) => updateField('isCompleted', e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-teal-700 focus:ring-teal-600"
            />
            <CheckCircle2 className="h-4 w-4 text-teal-700 dark:text-teal-400" />
            <span>Oznacz program IPET jako gotowy</span>
          </label>

          <button
            type="button"
            onClick={onPrevStep}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 whitespace-nowrap shrink-0"
          >
            ← Wróć do WOPFU
          </button>
        </div>
      </div>
    </div>
  );
};
