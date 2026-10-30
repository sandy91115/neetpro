import React, { useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  Calculator,
  CheckCircle2,
  Eye,
  FileText,
  Lightbulb,
  Play,
  Sparkles,
} from 'lucide-react';
import { SUBJECT_META } from '../../data/neetSyllabusData';
import type { MistakeCategory, MistakeNotebookEntry } from '../../types/neet';

interface MistakeNotebookAndPlannerProps {
  mistakes: MistakeNotebookEntry[];
  onToggleMistakeResolved: (mistakeId: string) => void;
  onStartMistakeRevisionTest: () => void;
}

const FORMULA_AND_NOTES_CARDS = [
  {
    id: 'mat-1',
    subjectId: 'physics' as const,
    title: 'Rotational Motion: Moment of Inertia & Pure Rolling Cheat Sheet',
    summary:
      'Ring: mR² | Disc/Solid Cylinder: ½ mR² | Solid Sphere: (2/5)mR² | Hollow Sphere: (2/3)mR² | Acceleration on incline a = g sinθ / (1 + I/mR²).',
    tag: 'Physics Formula Sheet',
  },
  {
    id: 'mat-2',
    subjectId: 'physics' as const,
    title: 'Modern Physics & Logic Gates Rapid Revision',
    summary:
      'λ = h / √(2mqV) | E_n = -13.6 Z²/n² eV | Radius r_n = 0.529 n²/Z Å | NAND & NOR are Universal Gates.',
    tag: 'High-Yield 6 Qs',
  },
  {
    id: 'mat-3',
    subjectId: 'chemistry' as const,
    title: 'Coordination Compounds: Spectrochemical Series & CFT',
    summary:
      'Weak Field (High Spin): I⁻ < Br⁻ < SCN⁻ < Cl⁻ < F⁻ < OH⁻ < H₂O | Strong Field (Low Spin): NCS⁻ < EDTA⁴⁻ < NH₃ < en < CN⁻ < CO.',
    tag: 'Inorganic Must-Know',
  },
  {
    id: 'mat-4',
    subjectId: 'botany' as const,
    title: 'NCERT Algae Reserve Food, Pigments & Flagella Table',
    summary:
      'Chlorophyceae: Chl a,b + Starch (2-8 equal apical) | Phaeophyceae: Chl a,c, Fucoxanthin + Mannitol, Laminarin (2 unequal lateral) | Rhodophyceae: Chl a,d, r-Phycoerythrin + Floridean starch (Absent).',
    tag: 'NCERT Table 3.1',
  },
  {
    id: 'mat-5',
    subjectId: 'zoology' as const,
    title: 'Human Physiology: ECG Waves, Pulmonary Volumes & Hormones',
    summary:
      'P-wave: Atrial depolarisation | QRS: Ventricular depolarisation | T-wave: Ventricular repolarisation | TV = 500 mL, IRV = 2500-3000 mL, ERV = 1000-1100 mL, RV = 1100-1200 mL.',
    tag: 'NCERT Direct Lines',
  },
];

export const MistakeNotebookAndPlanner: React.FC<MistakeNotebookAndPlannerProps> = ({
  mistakes,
  onToggleMistakeResolved,
  onStartMistakeRevisionTest,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'notebook' | 'materials'>('notebook');
  const [categoryFilter, setCategoryFilter] = useState<'all' | MistakeCategory>('all');
  const [showResolved, setShowResolved] = useState<boolean>(true);

  const filteredMistakes = mistakes.filter((m) => {
    if (categoryFilter !== 'all' && m.category !== categoryFilter) return false;
    if (!showResolved && m.resolved) return false;
    return true;
  });

  const getCategoryMeta = (cat: MistakeCategory) => {
    switch (cat) {
      case 'conceptual':
        return {
          label: 'Conceptual Mistake',
          badge: 'bg-rose-100 text-rose-800 border-rose-300',
          icon: Lightbulb,
        };
      case 'calculation':
        return {
          label: 'Calculation Mistake',
          badge: 'bg-amber-100 text-amber-800 border-amber-300',
          icon: Calculator,
        };
      case 'silly':
        return {
          label: 'Silly / Reading Mistake',
          badge: 'bg-purple-100 text-purple-800 border-purple-300',
          icon: Eye,
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Dropper Rank-Booster Module
          </div>
          <h1 className="text-xl font-extrabold text-slate-900">
            Smart Mistake Notebook & NCERT Formula Sheets
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Categorize every test error into Conceptual, Calculation, or Silly mistakes and
            re-attempt them until 100% mastered.
          </p>
        </div>

        <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
          <div className="flex flex-wrap items-center gap-1.5 rounded-xl bg-slate-100 p-1.5">
            <button
              onClick={() => setActiveSubTab('notebook')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeSubTab === 'notebook'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              📓 Mistake Notebook ({mistakes.length})
            </button>
            <button
              onClick={() => setActiveSubTab('materials')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeSubTab === 'materials'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              📑 NCERT & Formula Sheets
            </button>
          </div>

          <button
            onClick={onStartMistakeRevisionTest}
            className="flex min-h-10 items-center justify-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-rose-700 cursor-pointer md:text-sm"
          >
            <Play className="w-4 h-4 fill-white" />
            Re-Attempt Mistakes Test
          </button>
        </div>
      </div>

      {activeSubTab === 'notebook' ? (
        <>
          {/* 3 Category Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {(['conceptual', 'calculation', 'silly'] as MistakeCategory[]).map((cat) => {
              const meta = getCategoryMeta(cat);
              const Icon = meta.icon;
              const count = mistakes.filter((m) => m.category === cat).length;
              const unresolved = mistakes.filter((m) => m.category === cat && !m.resolved).length;
              return (
                <div
                  key={cat}
                  onClick={() =>
                    setCategoryFilter((prev) => (prev === cat ? 'all' : cat))
                  }
                  className={`p-4 rounded-2xl border bg-white shadow-xs cursor-pointer transition ${
                    categoryFilter === cat
                      ? 'ring-2 ring-blue-600 border-blue-600'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${meta.badge}`}>
                      {meta.label}
                    </span>
                    <Icon className="w-5 h-5 text-slate-400" />
                  </div>
                  <div className="mt-3 flex items-baseline justify-between">
                    <span className="text-2xl font-extrabold text-slate-900">{count} Total</span>
                    <span className="text-xs font-bold text-rose-600">
                      {unresolved} Needs Practice
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Filter Toggle */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              {(['all', 'conceptual', 'calculation', 'silly'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize cursor-pointer ${
                    categoryFilter === cat
                      ? 'bg-slate-900 text-white'
                      : 'bg-white border border-slate-200 text-slate-700'
                  }`}
                >
                  {cat === 'all' ? 'All Categories' : `${cat} Mistakes`}
                </button>
              ))}
            </div>

            <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={showResolved}
                onChange={(e) => setShowResolved(e.target.checked)}
                className="rounded"
              />
              Show Mastered/Resolved Mistakes
            </label>
          </div>

          {/* Mistake Entries */}
          <div className="space-y-4">
            {filteredMistakes.map((entry) => {
              const q = entry.question;
              const subjMeta = SUBJECT_META[q.subjectId];
              const catMeta = getCategoryMeta(entry.category);

              return (
                <div
                  key={entry.id}
                  className={`bg-white rounded-2xl border p-6 shadow-xs space-y-4 ${
                    entry.resolved ? 'border-emerald-200 opacity-80' : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${catMeta.badge}`}
                      >
                        {catMeta.label}
                      </span>
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${subjMeta.bgLight} ${subjMeta.textDark} ${subjMeta.border}`}
                      >
                        {subjMeta.name} · {q.chapterName}
                      </span>
                      <span className="text-xs text-slate-400">From: {entry.testTitle}</span>
                    </div>

                    <button
                      onClick={() => onToggleMistakeResolved(entry.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition cursor-pointer ${
                        entry.resolved
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : 'bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border-slate-200'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {entry.resolved ? 'Mastered & Resolved' : 'Mark as Mastered'}
                    </button>
                  </div>

                  <p className="text-sm md:text-base font-medium text-slate-900 whitespace-pre-line">
                    {q.stem}
                  </p>

                  {/* Takeaway Note */}
                  <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-amber-900">Your Error Note: </span>
                      <span className="text-amber-800">{entry.userNote}</span>
                    </div>
                  </div>

                  {/* Correct Answer & Explanation */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 font-bold">
                      <span className="text-rose-600">
                        Your Marked Option: {entry.selectedOption || 'Unattempted'}
                      </span>
                      <span className="text-emerald-700">
                        Correct Key: ({q.correctOption}){' '}
                        {q.options.find((o) => o.id === q.correctOption)?.text}
                      </span>
                    </div>
                    <p className="text-slate-700 pt-1">{q.explanation}</p>
                    <div className="text-blue-700 font-semibold pt-1 flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5" /> {q.ncertReference}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {FORMULA_AND_NOTES_CARDS.map((card) => {
            const meta = SUBJECT_META[card.subjectId];
            return (
              <div
                key={card.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${meta.bgLight} ${meta.textDark} ${meta.border}`}
                  >
                    {meta.name}
                  </span>
                  <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5" /> {card.tag}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900">{card.title}</h3>
                <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  {card.summary}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
