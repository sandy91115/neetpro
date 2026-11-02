import React, { useEffect, useRef, useState } from 'react';
import {
  Bookmark,
  BookOpen,
  CheckCircle2,
  Eye,
  FileWarning,
  PlusCircle,
  RotateCcw,
  Search,
  XCircle,
} from 'lucide-react';
import { SUBJECT_META } from '../../data/neetSyllabusData';
import { usePersistentState } from '../../hooks/usePersistentState';
import { api, getApiToken } from '../../lib/neetApi';
import type { Difficulty, MistakeCategory, Question, SubjectId } from '../../types/neet';

interface PyqAndPracticeBankProps {
  questions: Question[];
  bookmarkedIds: Set<string>;
  onToggleBookmark: (questionId: string) => void;
  onAddMistakeToNotebook: (
    question: Question,
    selectedOption: 'A' | 'B' | 'C' | 'D' | null,
    category: MistakeCategory,
    note: string,
    testTitle: string
  ) => void;
}

type PracticeAnswer = { question_id: number; correct_option: 'A' | 'B' | 'C' | 'D'; is_correct: boolean; explanation?: string | null; ncert_reference?: string | null };

export const PyqAndPracticeBank: React.FC<PyqAndPracticeBankProps> = ({
  questions,
  bookmarkedIds,
  onToggleBookmark,
  onAddMistakeToNotebook,
}) => {
  const [selectedSubject, setSelectedSubject] = useState<'all' | SubjectId>('all');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'pyq' | 'bookmarked'>('all');
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [chapterFilter, setChapterFilter] = useState<string>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<'all' | Difficulty>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Local practice state: selected option per question
  const [practiceSelections, setPracticeSelections] = usePersistentState<
    Record<string, 'A' | 'B' | 'C' | 'D'>
  >('neet-prep-v1/practice-selections', {});
  const [revealedSolutions, setRevealedSolutions] = usePersistentState<Record<string, boolean>>(
    'neet-prep-v1/practice-solutions', {}
  );
  const [savedMistakeIds, setSavedMistakeIds] = usePersistentState<Record<string, MistakeCategory>>(
    'neet-prep-v1/practice-mistakes', {}
  );
  const [workspaceReady, setWorkspaceReady] = useState(false);
  const [practiceAnswers, setPracticeAnswers] = useState<Record<string, PracticeAnswer>>({});
  const [busyQuestionId, setBusyQuestionId] = useState<string | null>(null);
  const [practiceMessage, setPracticeMessage] = useState('');
  const workspaceUserId = useRef<number | null>(null);

  useEffect(() => {
    let active = true;
    const loadWorkspace = async () => {
      setWorkspaceReady(false);
      if (!getApiToken()) {
        if (workspaceUserId.current !== null) {
          setPracticeSelections({}); setRevealedSolutions({}); setSavedMistakeIds({}); setPracticeAnswers({});
          workspaceUserId.current = null;
        }
        setWorkspaceReady(false); return;
      }
      try {
        const account = await api<{ user: { id: number } }>('/auth/me');
        if (!active) return;
        if (workspaceUserId.current !== null && workspaceUserId.current !== account.user.id) {
          setPracticeSelections({}); setRevealedSolutions({}); setSavedMistakeIds({}); setPracticeAnswers({});
        }
        workspaceUserId.current = account.user.id;
        const result = await api<{ data: Record<string, unknown> | null }>('/student/workspace');
        if (!active) return;
        if (result.data) {
          if (result.data.practice_selections && typeof result.data.practice_selections === 'object') setPracticeSelections(result.data.practice_selections as Record<string, 'A'|'B'|'C'|'D'>);
          if (result.data.revealed_solutions && typeof result.data.revealed_solutions === 'object') setRevealedSolutions(result.data.revealed_solutions as Record<string, boolean>);
          if (result.data.saved_practice_mistakes && typeof result.data.saved_practice_mistakes === 'object') setSavedMistakeIds(result.data.saved_practice_mistakes as Record<string, MistakeCategory>);
        }
        setWorkspaceReady(true);
      } catch {
        if (active) {
          if (workspaceUserId.current !== null) { setPracticeSelections({}); setRevealedSolutions({}); setSavedMistakeIds({}); setPracticeAnswers({}); workspaceUserId.current = null; }
          setWorkspaceReady(false);
        }
      }
    };
    void loadWorkspace();
    window.addEventListener('neet-auth-changed', loadWorkspace);
    return () => { active = false; window.removeEventListener('neet-auth-changed', loadWorkspace); };
  }, [setPracticeSelections, setRevealedSolutions, setSavedMistakeIds]);

  useEffect(() => {
    if (!workspaceReady || !getApiToken()) return;
    const timer = window.setTimeout(() => {
      void api('/student/workspace', { method: 'PATCH', body: JSON.stringify({
        practice_selections: practiceSelections, revealed_solutions: revealedSolutions,
        saved_practice_mistakes: savedMistakeIds,
      }) }).catch(() => undefined);
    }, 400);
    return () => window.clearTimeout(timer);
  }, [workspaceReady, practiceSelections, revealedSolutions, savedMistakeIds]);

  const approvedQuestions = questions.filter((q) => q.reviewStatus === 'approved');
  const sourceCompletePyqCount = approvedQuestions.filter((q) => q.isPyq).length;
  const availableYears = [...new Set(approvedQuestions.map((q) => q.pyqYear).filter((y): y is number => typeof y === 'number'))].sort((a, b) => b - a);
  const availableChapters = approvedQuestions
    .filter((q) => selectedSubject === 'all' || q.subjectId === selectedSubject)
    .reduce<{ id: string; name: string }[]>((acc, q) => {
      if (!acc.some((item) => item.id === q.chapterId)) {
        acc.push({ id: q.chapterId, name: q.chapterName });
      }
      return acc;
    }, []);

  const filteredQuestions = approvedQuestions.filter((q) => {
    if (selectedSubject !== 'all' && q.subjectId !== selectedSubject) return false;
    if (sourceFilter === 'pyq' && !q.isPyq) return false;
    if (sourceFilter === 'bookmarked' && !bookmarkedIds.has(q.id)) return false;
    if (yearFilter !== 'all' && String(q.pyqYear || '') !== yearFilter) return false;
    if (chapterFilter !== 'all' && q.chapterId !== chapterFilter) return false;
    if (difficultyFilter !== 'all' && q.difficulty !== difficultyFilter) return false;
    if (
      searchQuery.trim() &&
      !q.stem.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !q.chapterName.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !q.topicName.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const handleChooseOption = async (question: Question, optionId: 'A' | 'B' | 'C' | 'D') => {
    const questionId = question.id;
    if (/^\d+$/.test(questionId)) {
      if (!getApiToken()) { setPracticeMessage('Sign in to check answers for backend questions.'); return; }
      setBusyQuestionId(questionId); setPracticeMessage('');
      try {
        const result = await api<{ data: PracticeAnswer }>(`/questions/${questionId}/answer`, { method: 'POST', body: JSON.stringify({ selected_option: optionId }) });
        setPracticeAnswers((previous) => ({ ...previous, [questionId]: result.data }));
        setPracticeSelections((previous) => ({ ...previous, [questionId]: optionId }));
        setRevealedSolutions((previous) => ({ ...previous, [questionId]: true }));
      } catch (error) { setPracticeMessage(error instanceof Error ? error.message : 'Could not check this answer.'); }
      finally { setBusyQuestionId(null); }
      return;
    }
    setPracticeSelections((prev) => ({ ...prev, [questionId]: optionId }));
    setRevealedSolutions((prev) => ({ ...prev, [questionId]: true }));
  };

  const toggleSolution = async (question: Question) => {
    const questionId = question.id;
    if (revealedSolutions[questionId] && (!/^\d+$/.test(questionId) || practiceAnswers[questionId])) {
      setRevealedSolutions((previous) => ({ ...previous, [questionId]: false }));
      return;
    }
    if (/^\d+$/.test(questionId) && !practiceAnswers[questionId]) {
      if (!getApiToken()) { setPracticeMessage('Sign in to reveal answers for backend questions.'); return; }
      setBusyQuestionId(questionId); setPracticeMessage('');
      try {
        const result = await api<{ data: PracticeAnswer }>(`/questions/${questionId}/answer`, { method: 'POST', body: JSON.stringify({ selected_option: practiceSelections[questionId] || null }) });
        setPracticeAnswers((previous) => ({ ...previous, [questionId]: result.data }));
        setRevealedSolutions((previous) => ({ ...previous, [questionId]: true }));
      } catch (error) { setPracticeMessage(error instanceof Error ? error.message : 'Could not load this solution.'); }
      finally { setBusyQuestionId(null); }
      return;
    }
    setRevealedSolutions((previous) => ({ ...previous, [questionId]: !previous[questionId] }));
  };

  const handleResetQuestion = (questionId: string) => {
    setPracticeSelections((prev) => {
      const next = { ...prev };
      delete next[questionId];
      return next;
    });
    setRevealedSolutions((prev) => ({ ...prev, [questionId]: false }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">
            NEET PYQ & Practice Question Bank
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Complete Physics, Chemistry, Botany & Zoology PYQs (2020–2024) + NCERT Pattern Practice MCQs with step-by-step solutions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
          <span className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-200">
            Approved Questions: {approvedQuestions.length}
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200">
            Official PYQs: {sourceCompletePyqCount}
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
            Bookmarked: {bookmarkedIds.size}
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {(['all', 'physics', 'chemistry', 'botany', 'zoology'] as const).map((subj) => (
            <button
              key={subj}
              onClick={() => {
                setSelectedSubject(subj);
                setChapterFilter('all');
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition cursor-pointer ${
                selectedSubject === subj
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {subj === 'all' ? 'All Subjects' : SUBJECT_META[subj].name}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value as 'all' | 'pyq' | 'bookmarked')}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50 text-slate-700"
          >
            <option value="all">All Questions ({approvedQuestions.length})</option>
            <option value="pyq">Official PYQs Only ({sourceCompletePyqCount})</option>
            <option value="bookmarked">Bookmarked Only ({bookmarkedIds.size})</option>
          </select>

          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50 text-slate-700"
          >
            <option value="all">All PYQ Years</option>
            {availableYears.map((yr) => (
              <option key={yr} value={String(yr)}>
                NEET {yr}
              </option>
            ))}
          </select>

          <select
            value={chapterFilter}
            onChange={(e) => setChapterFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50 text-slate-700 max-w-[200px]"
          >
            <option value="all">All Chapters</option>
            {availableChapters.map((ch) => (
              <option key={ch.id} value={ch.id}>
                {ch.name}
              </option>
            ))}
          </select>

          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value as 'all' | Difficulty)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50 text-slate-700"
          >
            <option value="all">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search topic or keyword..."
              className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Question List */}
      <div className="space-y-4">
        {practiceMessage && <div role="status" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{practiceMessage}</div>}
        {filteredQuestions.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-sm text-slate-600">
            No questions match these filters. Import source-checked questions from Content & Questions.
          </div>
        )}
        {filteredQuestions.map((q, idx) => {
          const meta = SUBJECT_META[q.subjectId];
          const chosen = practiceSelections[q.id];
          const isBackendQuestion = /^\d+$/.test(q.id);
          const answer = practiceAnswers[q.id];
          const correctOption = isBackendQuestion ? answer?.correct_option : q.correctOption;
          const explanation = isBackendQuestion ? answer?.explanation : q.explanation;
          const ncertReference = isBackendQuestion ? answer?.ncert_reference : q.ncertReference;
          const isRevealed = Boolean(revealedSolutions[q.id] && (!isBackendQuestion || answer));
          const isBookmarked = bookmarkedIds.has(q.id);
          const mistakeSaved = savedMistakeIds[q.id];

          return (
            <div
              key={q.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4"
            >
              {/* Top Badges */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="bg-slate-900 text-white font-bold text-xs px-2.5 py-1 rounded">
                    #{idx + 1}
                  </span>
                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${meta.bgLight} ${meta.textDark} ${meta.border}`}
                  >
                    {meta.name} · {q.chapterName}
                  </span>
                  <span className="text-xs font-medium text-slate-500">{q.topicName}</span>
                  {q.sourceUrl ? (
                    <a href={q.sourceUrl} target="_blank" rel="noreferrer" className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 hover:underline">
                      {q.sourceLabel}{q.sourceQuestionNumber ? ` · Q${q.sourceQuestionNumber}` : ''}{q.sourcePage ? ` · page ${q.sourcePage}` : ''} · Source
                    </a>
                  ) : (
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {q.sourceLabel}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {chosen && (
                    <button
                      onClick={() => handleResetQuestion(q.id)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" /> Reset
                    </button>
                  )}
                  <button
                    onClick={() => onToggleBookmark(q.id)}
                    className={`px-2.5 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1 cursor-pointer ${
                      isBookmarked
                        ? 'bg-amber-50 text-amber-700 border-amber-300'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Bookmark
                      className={`w-3.5 h-3.5 ${
                        isBookmarked ? 'fill-amber-500 text-amber-500' : ''
                      }`}
                    />
                    {isBookmarked ? 'Saved' : 'Bookmark'}
                  </button>
                </div>
              </div>

              {/* Stem */}
              <p className="text-sm md:text-base font-medium text-slate-900 whitespace-pre-line leading-relaxed">
                {q.stem}
              </p>

              {/* Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {q.options.map((opt) => {
                  const isSelected = chosen === opt.id;
                  const isCorrectOpt = correctOption !== undefined && opt.id === correctOption;

                  let styleClass =
                    'border-slate-200 hover:border-blue-300 hover:bg-slate-50 bg-white text-slate-800';
                  if (chosen) {
                    if (isCorrectOpt) {
                      styleClass =
                        'border-emerald-500 bg-emerald-50 text-emerald-950 font-semibold';
                    } else if (isSelected && !isCorrectOpt) {
                      styleClass = 'border-rose-500 bg-rose-50 text-rose-950 font-semibold';
                    }
                  }

                  return (
                    <button
                      key={opt.id}
                      disabled={busyQuestionId === q.id}
                      onClick={() => void handleChooseOption(q, opt.id)}
                      className={`p-3.5 rounded-xl border-2 text-left text-xs md:text-sm flex items-center justify-between gap-3 transition cursor-pointer disabled:opacity-60 ${styleClass}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center font-bold text-xs shrink-0">
                          {opt.id}
                        </span>
                        <span>{opt.text}</span>
                      </div>

                      {chosen && isCorrectOpt && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      )}
                      {chosen && isSelected && !isCorrectOpt && (
                        <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Reveal Explanation Toggle / Box */}
              <div className="pt-1 flex items-center justify-between flex-wrap gap-2">
                <button
                  disabled={busyQuestionId === q.id}
                  onClick={() => void toggleSolution(q)}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  {busyQuestionId === q.id ? 'Loading answer…' : isRevealed ? 'Hide NCERT Explanation' : 'View Answer & NCERT Solution'}
                </button>

                {chosen && correctOption && chosen !== correctOption && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-rose-600 font-semibold flex items-center gap-1">
                      <FileWarning className="w-3.5 h-3.5" /> Add to Mistake Notebook:
                    </span>
                    {mistakeSaved ? (
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                        ✓ Saved as {mistakeSaved} mistake
                      </span>
                    ) : (
                      (['conceptual', 'calculation', 'silly'] as MistakeCategory[]).map((cat) => (
                        <button
                          key={cat}
                          onClick={() => {
                            onAddMistakeToNotebook(
                              q,
                              chosen,
                              cat,
                              `Marked (${chosen}) instead of (${correctOption}) during PYQ Practice.`,
                              'PYQ Practice Session'
                            );
                            setSavedMistakeIds((prev) => ({ ...prev, [q.id]: cat }));
                          }}
                          className="px-2 py-0.5 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] font-bold capitalize flex items-center gap-1 cursor-pointer"
                        >
                          <PlusCircle className="w-3 h-3" /> {cat}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              {isRevealed && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                  <div className="font-bold text-emerald-700">
                    Correct Option: ({correctOption})
                  </div>
                  <p className="text-slate-700 leading-relaxed">{explanation}</p>
                  <div className="text-blue-700 font-semibold flex items-center gap-1 pt-1">
                    <BookOpen className="w-3.5 h-3.5" /> {ncertReference}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
