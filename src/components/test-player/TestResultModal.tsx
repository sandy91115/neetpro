import React, { useState } from 'react';
import {
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  FileWarning,
  Filter,
  HelpCircle,
  PlusCircle,
  Target,
  TrendingUp,
  X,
  XCircle,
} from 'lucide-react';
import { SUBJECT_META } from '../../data/neetSyllabusData';
import type { MistakeCategory, Question, TestAttemptResult } from '../../types/neet';

interface TestResultModalProps {
  result: TestAttemptResult;
  onClose: () => void;
  onAddMistakeToNotebook: (
    question: Question,
    selectedOption: 'A' | 'B' | 'C' | 'D' | null,
    category: MistakeCategory,
    note: string,
    testTitle: string
  ) => void;
}

export const TestResultModal: React.FC<TestResultModalProps> = ({
  result,
  onClose,
  onAddMistakeToNotebook,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'incorrect' | 'unattempted' | 'correct'>('all');
  const [addedMistakeMap, setAddedMistakeMap] = useState<Record<string, MistakeCategory>>({});

  const filteredQuestions = result.questions.filter((q) => {
    const chosen = result.responses[q.id]?.selectedOption ?? null;
    if (filterType === 'incorrect') return chosen !== null && chosen !== q.correctOption;
    if (filterType === 'unattempted') return chosen === null;
    if (filterType === 'correct') return chosen === q.correctOption;
    return true;
  });

  const handleQuickTagMistake = (
    q: Question,
    chosen: 'A' | 'B' | 'C' | 'D' | null,
    category: MistakeCategory
  ) => {
    const defaultNotes: Record<MistakeCategory, string> = {
      conceptual: `Needs NCERT concept revision in ${q.chapterName} (${q.topicName}).`,
      calculation: `Formula / numerical calculation slip in ${q.topicName}.`,
      silly: `Misread question stem or marked wrong option in ${q.topicName}.`,
    };
    onAddMistakeToNotebook(q, chosen, category, defaultNotes[category], result.testTitle);
    setAddedMistakeMap((prev) => ({ ...prev, [q.id]: category }));
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Top Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Test Score and Solutions
            </span>
            <h2 className="text-lg md:text-xl font-bold mt-0.5">{result.testTitle}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-4 rounded-xl shadow-sm">
              <div className="flex items-center justify-between text-blue-100 text-xs font-semibold uppercase">
                <span>Total Marks</span>
                <Award className="w-4 h-4" />
              </div>
              <div className="text-2xl md:text-3xl font-extrabold mt-1">
                {result.totalScore} <span className="text-sm font-normal text-blue-200">/ {result.maxScore}</span>
              </div>
              <div className="text-xs text-blue-100 mt-1">
                +{result.correctCount * 4} Positive · -{result.incorrectCount} Negative
              </div>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl">
              <div className="flex items-center justify-between text-emerald-700 text-xs font-bold uppercase">
                <span>Accuracy Rate</span>
                <Target className="w-4 h-4" />
              </div>
              <div className="text-2xl md:text-3xl font-extrabold text-emerald-900 mt-1">
                {result.accuracyPercent}%
              </div>
              <div className="text-xs text-emerald-700 mt-1">
                {result.correctCount} Correct · {result.incorrectCount} Wrong · {result.unattemptedCount} Left
              </div>
            </div>

            <div className="bg-purple-50 border border-purple-200 p-4 rounded-xl">
              <div className="flex items-center justify-between text-purple-700 text-xs font-bold uppercase">
                <span>Rank estimate</span>
                <TrendingUp className="w-4 h-4" />
              </div>
              <div className="text-lg font-extrabold text-purple-900 mt-2">Not available</div>
              <div className="text-xs text-purple-700 mt-1">A mock score cannot predict an official AIR.</div>
            </div>

            <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl">
              <div className="flex items-center justify-between text-amber-700 text-xs font-bold uppercase">
                <span>Time Analysis</span>
                <Clock className="w-4 h-4" />
              </div>
              <div className="text-2xl md:text-3xl font-extrabold text-amber-900 mt-1">
                {Math.max(1, Math.round(result.timeTakenSeconds / 60))} min
              </div>
              <div className="text-xs text-amber-700 mt-1">
                Avg {Math.round(result.timeTakenSeconds / Math.max(1, result.totalQuestions))}s per question
              </div>
            </div>
          </div>

          {/* Subject-wise Performance Table */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-3 bg-white border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-800">Subject-Wise Score & Accuracy Breakdown</h3>
              <span className="text-xs text-slate-500">NEET +4 / -1 Marking</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 text-xs uppercase">
                    <th className="py-2.5 px-4">Subject</th>
                    <th className="py-2.5 px-4 text-center">Questions</th>
                    <th className="py-2.5 px-4 text-center text-emerald-700">Correct (+4)</th>
                    <th className="py-2.5 px-4 text-center text-rose-700">Incorrect (-1)</th>
                    <th className="py-2.5 px-4 text-center text-slate-500">Left (0)</th>
                    <th className="py-2.5 px-4 text-center">Accuracy</th>
                    <th className="py-2.5 px-4 text-right">Net Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {result.subjectBreakdowns.map((sb) => (
                    <tr key={sb.subjectId} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-semibold text-slate-900">{sb.subjectName}</td>
                      <td className="py-3 px-4 text-center text-slate-600">{sb.totalQuestions}</td>
                      <td className="py-3 px-4 text-center font-semibold text-emerald-600">{sb.correct}</td>
                      <td className="py-3 px-4 text-center font-semibold text-rose-600">{sb.incorrect}</td>
                      <td className="py-3 px-4 text-center text-slate-500">{sb.unattempted}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
                          {sb.accuracy}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">
                        {sb.score} <span className="text-xs font-normal text-slate-400">/ {sb.maxScore}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Question-by-Question Solutions & Mistake Tagger */}
          {result.questions.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-blue-600" />
                    Detailed Solutions & Mistake Notebook Tagger
                  </h3>
                  <p className="text-xs text-slate-500">
                    Tag any wrong or unattempted question into your Mistake Notebook for targeted revision.
                  </p>
                </div>

                <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
                  <Filter className="w-3.5 h-3.5 text-slate-400 ml-2 mr-1" />
                  {(['all', 'incorrect', 'unattempted', 'correct'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setFilterType(tab)}
                      className={`px-3 py-1 rounded-md text-xs font-semibold capitalize transition cursor-pointer ${
                        filterType === tab
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                {filteredQuestions.map((q, idx) => {
                  const chosen = result.responses[q.id]?.selectedOption ?? null;
                  const isCorrect = chosen === q.correctOption;
                  const isUnattempted = chosen === null;
                  const taggedCategory = addedMistakeMap[q.id];

                  return (
                    <div
                      key={q.id}
                      className={`p-5 rounded-xl border ${
                        isCorrect
                          ? 'border-emerald-200 bg-emerald-50/20'
                          : isUnattempted
                            ? 'border-slate-200 bg-white'
                            : 'border-rose-200 bg-rose-50/20'
                      }`}
                    >
                      <div className="flex items-center justify-between flex-wrap gap-2 mb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs px-2.5 py-1 rounded bg-slate-900 text-white">
                            Q#{idx + 1}
                          </span>
                          <span
                            className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                              SUBJECT_META[q.subjectId].bgLight
                            } ${SUBJECT_META[q.subjectId].textDark} ${SUBJECT_META[q.subjectId].border}`}
                          >
                            {SUBJECT_META[q.subjectId].name} · {q.chapterName}
                          </span>
                          {q.sourceUrl ? (
                            <a href={q.sourceUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-700 underline">
                              {q.sourceLabel}{q.sourceQuestionNumber ? ` · Q${q.sourceQuestionNumber}` : ''}{q.sourcePage ? ` · page ${q.sourcePage}` : ''} · Source
                            </a>
                          ) : (
                            <span className="text-xs text-slate-500">{q.sourceLabel}</span>
                          )}
                        </div>

                        <div>
                          {isCorrect ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Correct (+4)
                            </span>
                          ) : isUnattempted ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 bg-slate-200 px-2.5 py-1 rounded-full">
                              <HelpCircle className="w-3.5 h-3.5" /> Unattempted (0)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-100 px-2.5 py-1 rounded-full">
                              <XCircle className="w-3.5 h-3.5" /> Incorrect (-1)
                            </span>
                          )}
                        </div>
                      </div>

                      <p className="text-sm font-medium text-slate-900 mb-3 whitespace-pre-line">{q.stem}</p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
                        {q.options.map((opt) => {
                          const isOptCorrect = opt.id === q.correctOption;
                          const isOptChosen = opt.id === chosen;
                          return (
                            <div
                              key={opt.id}
                              className={`px-3 py-2 rounded-lg border text-xs font-medium flex items-center justify-between ${
                                isOptCorrect
                                  ? 'bg-emerald-100/80 border-emerald-400 text-emerald-950 font-semibold'
                                  : isOptChosen && !isOptCorrect
                                    ? 'bg-rose-100/80 border-rose-400 text-rose-950'
                                    : 'bg-white border-slate-200 text-slate-700'
                              }`}
                            >
                              <span>
                                <strong>({opt.id})</strong> {opt.text}
                              </span>
                              {isOptCorrect && (
                                <span className="text-[11px] font-bold text-emerald-700 ml-2">
                                  ✓ Correct Key
                                </span>
                              )}
                              {isOptChosen && !isOptCorrect && (
                                <span className="text-[11px] font-bold text-rose-700 ml-2">
                                  ✗ Your Choice
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-xs space-y-1">
                        <div className="font-bold text-slate-800">Detailed Solution:</div>
                        <p className="text-slate-700 leading-relaxed">{q.explanation}</p>
                        <div className="text-blue-700 font-medium pt-1">
                          📖 Reference: {q.ncertReference}
                        </div>
                      </div>

                      {/* Mistake Notebook Tagger for wrong/unattempted questions */}
                      {!isCorrect && (
                        <div className="mt-3 pt-3 border-t border-slate-200/80 flex items-center justify-between flex-wrap gap-2">
                          <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                            <FileWarning className="w-3.5 h-3.5 text-amber-600" />
                            Save to Mistake Notebook as:
                          </span>
                          {taggedCategory ? (
                            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-lg">
                              ✓ Saved under "{taggedCategory.toUpperCase()} MISTAKE"
                            </span>
                          ) : (
                            <div className="flex items-center gap-2 flex-wrap">
                              <button
                                onClick={() => handleQuickTagMistake(q, chosen, 'conceptual')}
                                className="px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 flex items-center gap-1 transition cursor-pointer"
                              >
                                <PlusCircle className="w-3 h-3" /> Conceptual Mistake
                              </button>
                              <button
                                onClick={() => handleQuickTagMistake(q, chosen, 'calculation')}
                                className="px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 flex items-center gap-1 transition cursor-pointer"
                              >
                                <PlusCircle className="w-3 h-3" /> Calculation Mistake
                              </button>
                              <button
                                onClick={() => handleQuickTagMistake(q, chosen, 'silly')}
                                className="px-2.5 py-1 rounded-md text-xs font-semibold bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 flex items-center gap-1 transition cursor-pointer"
                              >
                                <PlusCircle className="w-3 h-3" /> Silly / Reading Mistake
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm transition cursor-pointer"
          >
            Back to Platform
          </button>
        </div>
      </div>
    </div>
  );
};
