import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Bookmark,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eraser,
  Flag,
  Pause,
  Play,
  Send,
  ShieldCheck,
  X,
} from 'lucide-react';
import { SUBJECT_META } from '../../data/neetSyllabusData';
import { usePersistentState } from '../../hooks/usePersistentState';
import type {
  ActiveTestSession,
  PaletteStatus,
  QuestionResponseState,
  SubjectId,
  SubjectScoreBreakdown,
  TestAttemptResult,
} from '../../types/neet';

interface LiveTestPlayerProps {
  session: ActiveTestSession;
  onSubmitTest: (result: TestAttemptResult) => void;
  onExitWithoutSubmit: () => void;
  onToggleBookmark: (questionId: string) => void;
  bookmarkedIds: Set<string>;
}

export const LiveTestPlayer: React.FC<LiveTestPlayerProps> = ({
  session,
  onSubmitTest,
  onExitWithoutSubmit,
  onToggleBookmark,
  bookmarkedIds,
}) => {
  const { questions, durationMinutes, positiveMarks, negativeMarks } = session;

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [remainingSeconds, setRemainingSeconds] = usePersistentState<number>(
    `neet-prep-v1/test/${session.id}/remaining`, durationMinutes * 60
  );
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);
  const [showMobilePalette, setShowMobilePalette] = useState<boolean>(false);

  // Initialize response state for all questions
  const [responses, setResponses] = usePersistentState<Record<string, QuestionResponseState>>(
    `neet-prep-v1/test/${session.id}/responses`, () => {
    const initial: Record<string, QuestionResponseState> = {};
    questions.forEach((q, idx) => {
      initial[q.id] = {
        questionId: q.id,
        selectedOption: null,
        status: idx === 0 ? 'not_answered' : 'not_visited',
        timeSpentSeconds: 0,
      };
    });
    return initial;
    }
  );

  const currentQuestion = questions[currentIndex];
  const currentResponse = responses[currentQuestion.id];

  // Available subjects in this test
  const availableSubjects = useMemo(() => {
    const order: SubjectId[] = ['physics', 'chemistry', 'botany', 'zoology'];
    return order.filter((subj) => questions.some((q) => q.subjectId === subj));
  }, [questions]);

  // Countdown timer & per-question time tracking
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleConfirmSubmit();
          return 0;
        }
        return prev - 1;
      });

      setResponses((prev) => {
        const qId = questions[currentIndex]?.id;
        if (!qId || !prev[qId]) return prev;
        return {
          ...prev,
          [qId]: {
            ...prev[qId],
            timeSpentSeconds: prev[qId].timeSpentSeconds + 1,
          },
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused, currentIndex, questions, remainingSeconds]);

  const navigateToQuestion = (index: number) => {
    if (index < 0 || index >= questions.length) return;
    const targetQ = questions[index];
    setResponses((prev) => {
      const existing = prev[targetQ.id];
      if (existing && existing.status === 'not_visited') {
        return {
          ...prev,
          [targetQ.id]: {
            ...existing,
            status: 'not_answered',
          },
        };
      }
      return prev;
    });
    setCurrentIndex(index);
  };

  const handleSelectOption = (optionId: 'A' | 'B' | 'C' | 'D') => {
    setResponses((prev) => ({
      ...prev,
      [currentQuestion.id]: {
        ...prev[currentQuestion.id],
        selectedOption: optionId,
      },
    }));
  };

  const handleSaveAndNext = () => {
    const selected = currentResponse?.selectedOption ?? null;
    const nextStatus: PaletteStatus = selected ? 'answered' : 'not_answered';
    setResponses((prev) => ({
      ...prev,
      [currentQuestion.id]: {
        ...prev[currentQuestion.id],
        status: nextStatus,
      },
    }));
    if (currentIndex < questions.length - 1) {
      navigateToQuestion(currentIndex + 1);
    }
  };

  const handleMarkForReviewAndNext = () => {
    const selected = currentResponse?.selectedOption ?? null;
    const nextStatus: PaletteStatus = selected ? 'answered_marked_for_review' : 'marked_for_review';
    setResponses((prev) => ({
      ...prev,
      [currentQuestion.id]: {
        ...prev[currentQuestion.id],
        status: nextStatus,
      },
    }));
    if (currentIndex < questions.length - 1) {
      navigateToQuestion(currentIndex + 1);
    }
  };

  const handleClearResponse = () => {
    setResponses((prev) => ({
      ...prev,
      [currentQuestion.id]: {
        ...prev[currentQuestion.id],
        selectedOption: null,
        status: 'not_answered',
      },
    }));
  };

  const handleSwitchSubjectTab = (subjectId: SubjectId) => {
    const firstIdx = questions.findIndex((q) => q.subjectId === subjectId);
    if (firstIdx !== -1) {
      navigateToQuestion(firstIdx);
    }
  };

  // Palette summary statistics
  const paletteCounts = useMemo(() => {
    const counts = {
      answered: 0,
      not_answered: 0,
      not_visited: 0,
      marked_for_review: 0,
      answered_marked_for_review: 0,
    };
    Object.values(responses).forEach((r) => {
      counts[r.status]++;
    });
    return counts;
  }, [responses]);

  const handleConfirmSubmit = () => {
    const totalTimeTaken = durationMinutes * 60 - remainingSeconds;
    let correctCount = 0;
    let incorrectCount = 0;
    let unattemptedCount = 0;

    const subjectBreakdowns: SubjectScoreBreakdown[] = availableSubjects.map((subjId) => {
      const subjQuestions = questions.filter((q) => q.subjectId === subjId);
      let sCorrect = 0;
      let sIncorrect = 0;
      let sUnattempted = 0;
      let sTime = 0;

      subjQuestions.forEach((q) => {
        const resp = responses[q.id];
        sTime += resp?.timeSpentSeconds || 0;
        const chosen = resp?.selectedOption;
        if (!chosen) {
          sUnattempted++;
          unattemptedCount++;
        } else if (chosen === q.correctOption) {
          sCorrect++;
          correctCount++;
        } else {
          sIncorrect++;
          incorrectCount++;
        }
      });

      const sScore = sCorrect * positiveMarks - sIncorrect * negativeMarks;
      const sMax = subjQuestions.length * positiveMarks;
      const attempted = sCorrect + sIncorrect;
      const sAccuracy = attempted > 0 ? Math.round((sCorrect / attempted) * 1000) / 10 : 0;

      return {
        subjectId: subjId,
        subjectName: SUBJECT_META[subjId].name,
        totalQuestions: subjQuestions.length,
        correct: sCorrect,
        incorrect: sIncorrect,
        unattempted: sUnattempted,
        score: sScore,
        maxScore: sMax,
        accuracy: sAccuracy,
        timeSpentSeconds: sTime,
      };
    });

    const totalScore = correctCount * positiveMarks - incorrectCount * negativeMarks;
    const maxScore = questions.length * positiveMarks;
    const totalAttempted = correctCount + incorrectCount;
    const accuracyPercent =
      totalAttempted > 0 ? Math.round((correctCount / totalAttempted) * 1000) / 10 : 0;

    const result: TestAttemptResult = {
      id: `attempt-${Date.now()}`,
      testId: session.id,
      testTitle: session.title,
      category: session.category,
      attemptedAt: new Date().toLocaleString('en-IN'),
      durationMinutes,
      timeTakenSeconds: Math.max(10, totalTimeTaken),
      totalQuestions: questions.length,
      correctCount,
      incorrectCount,
      unattemptedCount,
      totalScore,
      maxScore,
      accuracyPercent,
      predictedAir: 0,
      percentile: 0,
      subjectBreakdowns,
      responses,
      questions,
    };

    onSubmitTest(result);
  };

  const formatTimer = (sec: number) => {
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const secs = sec % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const getPaletteButtonStyle = (status: PaletteStatus, isCurrent: boolean) => {
    const ring = isCurrent ? 'ring-2 ring-offset-2 ring-blue-600 scale-105' : '';
    switch (status) {
      case 'answered':
        return `bg-emerald-600 text-white border-emerald-700 rounded-t-xl ${ring}`;
      case 'not_answered':
        return `bg-rose-600 text-white border-rose-700 rounded-b-xl ${ring}`;
      case 'marked_for_review':
        return `bg-purple-600 text-white border-purple-700 rounded-full ${ring}`;
      case 'answered_marked_for_review':
        return `bg-purple-700 text-white border-purple-800 rounded-full relative ${ring}`;
      case 'not_visited':
      default:
        return `bg-slate-100 text-slate-700 border-slate-300 rounded-md hover:bg-slate-200 ${ring}`;
    }
  };

  const isBookmarked = bookmarkedIds.has(currentQuestion.id);
  const handleOpenSubmit = () => {
    setShowMobilePalette(false);
    setShowSubmitModal(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex h-[100dvh] flex-col overflow-hidden bg-slate-100 select-none">
      {/* Test player header */}
      <header className="shrink-0 bg-slate-900 px-3 pb-2.5 pt-[max(0.625rem,env(safe-area-inset-top))] text-white border-b border-slate-800 shadow-md sm:px-4 sm:py-2.5">
        <div className="flex min-w-0 items-center justify-between gap-2 sm:gap-3">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <div title="NEET Practice Test" className="shrink-0 bg-blue-600 text-white font-bold px-1.5 py-1 rounded text-[10px] sm:px-2.5 sm:text-xs tracking-wider uppercase flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" />
            <span className="hidden sm:inline">NEET Practice Test</span>
          </div>
          <div className="min-w-0">
            <h1 className="font-bold text-sm md:text-base line-clamp-1">{session.title}</h1>
            <p className="hidden text-xs text-slate-400 sm:block">
              Marking Scheme: <span className="text-emerald-400 font-semibold">+{positiveMarks} Correct</span> ·{' '}
              <span className="text-rose-400 font-semibold">-{negativeMarks} Incorrect</span> · 0 Unattempted
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
          {/* Live Countdown Timer */}
          <div
            className={`flex items-center gap-1 px-2 py-1.5 rounded-lg border font-mono text-xs sm:gap-2 sm:px-3.5 sm:text-sm md:text-base font-bold ${
              remainingSeconds < 300
                ? 'bg-rose-950/90 border-rose-500 text-rose-300 animate-pulse'
                : 'bg-slate-800 border-slate-700 text-amber-300'
            }`}
          >
            <Clock className="hidden h-4 w-4 text-amber-400 sm:block" />
            <span className="hidden sm:inline">Time Left: </span>
            <span>{formatTimer(remainingSeconds)}</span>
            <button
              onClick={() => setIsPaused((p) => !p)}
              title={isPaused ? 'Resume Timer' : 'Pause Timer (Practice Mode)'}
              aria-label={isPaused ? 'Resume timer' : 'Pause timer'}
              className="ml-0.5 min-h-8 min-w-8 rounded p-1 text-slate-300 hover:bg-slate-700 sm:ml-1"
            >
              {isPaused ? <Play className="w-3.5 h-3.5 text-emerald-400" /> : <Pause className="w-3.5 h-3.5" />}
            </button>
          </div>

          <button
            onClick={handleOpenSubmit}
            className="min-h-10 rounded-lg bg-emerald-600 px-2.5 py-2 text-xs font-semibold text-white shadow transition hover:bg-emerald-500 cursor-pointer sm:px-4 sm:text-sm flex items-center gap-1.5"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Submit Test</span>
            <span className="sm:hidden">Submit</span>
          </button>

          <button
            onClick={onExitWithoutSubmit}
            title="Exit Test Without Submitting"
            className="min-h-10 min-w-10 rounded-lg bg-slate-800 p-2 text-slate-300 transition hover:bg-rose-900/60 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        </div>
      </header>

      {/* Subject Section Bar */}
      <div className="shrink-0 border-b border-slate-200 bg-white px-3 py-2 sm:px-4">
        <div className="flex min-w-0 items-center gap-2 overflow-x-auto">
          <span className="mr-1 shrink-0 text-[10px] font-semibold uppercase tracking-wider text-slate-400 sm:text-xs">
            Sections:
          </span>
          {availableSubjects.map((subjId) => {
            const meta = SUBJECT_META[subjId];
            const isActive = currentQuestion.subjectId === subjId;
            const subjQs = questions.filter((q) => q.subjectId === subjId);
            const answeredInSubj = subjQs.filter(
              (q) =>
                responses[q.id]?.status === 'answered' ||
                responses[q.id]?.status === 'answered_marked_for_review'
            ).length;

            return (
              <button
                key={subjId}
                onClick={() => handleSwitchSubjectTab(subjId)}
                className={`min-h-10 shrink-0 px-3 py-1.5 rounded-lg text-xs md:text-sm font-semibold transition flex items-center gap-2 cursor-pointer border ${
                  isActive
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>{meta.name}</span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${
                    isActive ? 'bg-blue-800 text-blue-100' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {answeredInSubj}/{subjQs.length}
                </span>
              </button>
            );
          })}
        </div>

        <div className="text-xs text-slate-500 hidden sm:flex items-center gap-2">
          <span>Candidate:</span>
          <span className="font-semibold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-md">
            NEET 2027 Dropper (Leader Batch)
          </span>
        </div>
      </div>

      {/* Main Content Split: Question Area (Left) + NTA Question Palette (Right) */}
      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden md:flex-row">
        {/* Left: Question Viewer */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-white">
          {/* Question Meta Header */}
          <div className="shrink-0 border-b border-slate-200 bg-slate-50 px-3 py-2.5 sm:px-6 sm:py-3.5">
            <div className="flex min-w-0 items-center justify-between gap-2">
              <span className="shrink-0 rounded-md bg-slate-900 px-2.5 py-1 text-xs font-bold text-white sm:px-3 sm:text-sm">
                Question {currentIndex + 1} of {questions.length}
              </span>
              <button
                type="button"
                onClick={() => setShowMobilePalette(true)}
                className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-xs font-bold text-slate-700 shadow-sm md:hidden"
                aria-label={`Open question palette. ${paletteCounts.answered} answered.`}
              >
                Questions
                <span className="rounded bg-slate-100 px-1.5 py-0.5">{paletteCounts.answered}/{questions.length}</span>
              </button>
              <div className="hidden min-w-0 items-center gap-2.5 sm:flex sm:flex-wrap">
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                  SUBJECT_META[currentQuestion.subjectId].bgLight
                } ${SUBJECT_META[currentQuestion.subjectId].textDark} ${
                  SUBJECT_META[currentQuestion.subjectId].border
                }`}
              >
                {SUBJECT_META[currentQuestion.subjectId].name} · {currentQuestion.chapterName}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
                {currentQuestion.sourceUrl ? (
                  <a href={currentQuestion.sourceUrl} target="_blank" rel="noreferrer" className="underline">
                    {currentQuestion.sourceLabel}{currentQuestion.sourceQuestionNumber ? ` · Q${currentQuestion.sourceQuestionNumber}` : ''}{currentQuestion.sourcePage ? ` · page ${currentQuestion.sourcePage}` : ''}
                  </a>
                ) : currentQuestion.sourceLabel}
              </span>
              <span
                className={`px-2 py-0.5 rounded text-xs font-semibold uppercase ${
                  currentQuestion.difficulty === 'easy'
                    ? 'bg-emerald-50 text-emerald-700'
                    : currentQuestion.difficulty === 'medium'
                      ? 'bg-amber-50 text-amber-700'
                      : 'bg-rose-50 text-rose-700'
                }`}
              >
                {currentQuestion.difficulty}
              </span>
              </div>
            </div>

            <div className="mt-2 flex items-center justify-between gap-2 sm:hidden">
              <span className={`max-w-[62%] truncate rounded-full border px-2.5 py-1 text-[11px] font-semibold ${SUBJECT_META[currentQuestion.subjectId].bgLight} ${SUBJECT_META[currentQuestion.subjectId].textDark} ${SUBJECT_META[currentQuestion.subjectId].border}`}>
                {SUBJECT_META[currentQuestion.subjectId].name} · {currentQuestion.chapterName}
              </span>
              <button
                onClick={() => onToggleBookmark(currentQuestion.id)}
                className={`inline-flex min-h-10 shrink-0 items-center gap-1 rounded-md border px-2.5 text-xs font-semibold transition cursor-pointer ${
                  isBookmarked
                    ? 'bg-amber-50 text-amber-700 border-amber-300'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Bookmark className={`h-3.5 w-3.5 ${isBookmarked ? 'fill-amber-500 text-amber-500' : ''}`} />
                {isBookmarked ? 'Saved' : 'Save'}
              </button>
            </div>

            <div className="hidden items-center gap-3 sm:flex">
              <span className="text-xs text-slate-500 font-mono">
                Time on Q: {currentResponse?.timeSpentSeconds || 0}s
              </span>
              <button
                onClick={() => onToggleBookmark(currentQuestion.id)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold border transition cursor-pointer ${
                  isBookmarked
                    ? 'bg-amber-50 text-amber-700 border-amber-300'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-amber-500 text-amber-500' : ''}`} />
                {isBookmarked ? 'Bookmarked' : 'Bookmark'}
              </button>
            </div>
          </div>

          {/* Scrollable Question Stem & Options */}
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 md:p-8 md:max-w-4xl">
            <div className="mb-6 whitespace-pre-line text-base font-medium leading-relaxed text-slate-900 sm:mb-8 md:text-lg">
              {currentQuestion.stem}
            </div>

            <div className="space-y-3 sm:space-y-3.5">
              {currentQuestion.options.map((opt) => {
                const isSelected = currentResponse?.selectedOption === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => handleSelectOption(opt.id)}
                    className={`w-full min-h-14 text-left p-3.5 sm:p-4 rounded-xl border-2 transition flex items-start gap-3 sm:gap-4 cursor-pointer ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/70 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/70 bg-white'
                    }`}
                  >
                    <span
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 border ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-slate-100 text-slate-700 border-slate-300'
                      }`}
                    >
                      {opt.id}
                    </span>
                    <span className="text-sm md:text-base text-slate-800 font-medium pt-1">
                      {opt.text}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bottom NTA Action Controls */}
          <div className="shrink-0 border-t border-slate-200 bg-slate-50 px-3 pb-[max(0.625rem,env(safe-area-inset-bottom))] pt-2.5 sm:px-6 sm:py-4">
            <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:justify-between sm:gap-3">
            <div className="contents sm:flex sm:flex-wrap sm:items-center sm:gap-2.5">
              <button
                onClick={handleMarkForReviewAndNext}
                className="flex min-h-11 items-center justify-center gap-1.5 rounded-lg bg-purple-600 px-2.5 py-2.5 text-[11px] font-semibold text-white shadow-sm transition hover:bg-purple-700 cursor-pointer sm:px-4 sm:text-xs md:text-sm"
              >
                <Flag className="w-4 h-4" />
                Mark for Review & Next
              </button>

              <button
                onClick={handleClearResponse}
                className="flex min-h-11 items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-2.5 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-100 cursor-pointer sm:px-4 sm:text-xs md:text-sm"
              >
                <Eraser className="w-4 h-4" />
                Clear Response
              </button>
            </div>

            <div className="contents sm:flex sm:items-center sm:gap-2.5">
              <button
                onClick={() => navigateToQuestion(currentIndex - 1)}
                disabled={currentIndex === 0}
                className="flex min-h-11 items-center justify-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-2.5 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-40 cursor-pointer sm:px-3.5 sm:text-xs md:text-sm"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>

              <button
                onClick={handleSaveAndNext}
                className="flex min-h-11 items-center justify-center gap-1 rounded-lg bg-blue-600 px-3 py-2.5 text-[11px] font-bold text-white shadow transition hover:bg-blue-700 cursor-pointer sm:px-6 sm:gap-1.5 sm:text-xs md:text-sm"
              >
                Save & Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
        </div>

        {/* Right: NTA Question Palette Sidebar */}
        {showMobilePalette && (
          <button
            type="button"
            aria-label="Close question palette"
            onClick={() => setShowMobilePalette(false)}
            className="fixed inset-0 z-[60] bg-slate-950/45 md:hidden"
          />
        )}
        <aside className={`${showMobilePalette ? 'fixed inset-x-0 bottom-0 z-[70] h-[72dvh] max-h-[72dvh] rounded-t-2xl shadow-2xl' : 'hidden'} flex min-h-0 shrink-0 flex-col border-slate-200 bg-slate-50 md:static md:flex md:h-full md:w-80 md:border-l md:rounded-none md:shadow-none lg:w-96`}>
          {/* Palette Status Legend */}
          <div className="shrink-0 border-b border-slate-200 bg-white p-3 sm:p-4">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Question Palette Summary
              </h3>
              <button type="button" onClick={() => setShowMobilePalette(false)} className="min-h-10 min-w-10 rounded-lg text-slate-500 hover:bg-slate-100 md:hidden" aria-label="Close question palette">
                <X className="mx-auto h-5 w-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-t-lg bg-emerald-600 text-white font-bold flex items-center justify-center">
                  {paletteCounts.answered}
                </span>
                <span className="text-slate-700 font-medium">Answered</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-b-lg bg-rose-600 text-white font-bold flex items-center justify-center">
                  {paletteCounts.not_answered}
                </span>
                <span className="text-slate-700 font-medium">Not Answered</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-slate-200 text-slate-700 font-bold flex items-center justify-center border border-slate-300">
                  {paletteCounts.not_visited}
                </span>
                <span className="text-slate-700 font-medium">Not Visited</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-purple-600 text-white font-bold flex items-center justify-center">
                  {paletteCounts.marked_for_review}
                </span>
                <span className="text-slate-700 font-medium">Marked Review</span>
              </div>
              <div className="col-span-2 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-purple-700 text-white font-bold flex items-center justify-center relative">
                  {paletteCounts.answered_marked_for_review}
                  <span className="w-2 h-2 rounded-full bg-emerald-400 absolute bottom-0 right-0" />
                </span>
                <span className="text-slate-700 font-medium">
                  Answered & Marked for Review (Will be evaluated)
                </span>
              </div>
            </div>
          </div>

          {/* Question Number Grid */}
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 sm:p-4">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold uppercase text-slate-500">
                Choose a Question (1 – {questions.length})
              </span>
              <span className="text-xs font-semibold text-blue-600">
                {SUBJECT_META[currentQuestion.subjectId].name}
              </span>
            </div>

            <div className="grid grid-cols-5 gap-2 sm:gap-2.5">
              {questions.map((q, idx) => {
                const resp = responses[q.id];
                const status = resp?.status || 'not_visited';
                const isCurrent = idx === currentIndex;
                return (
                  <button
                    key={q.id}
                    onClick={() => {
                      navigateToQuestion(idx);
                      setShowMobilePalette(false);
                    }}
                    className={`h-11 font-bold text-xs border transition flex items-center justify-center cursor-pointer ${getPaletteButtonStyle(
                      status,
                      isCurrent
                    )}`}
                  >
                    {idx + 1}
                    {status === 'answered_marked_for_review' && (
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 border border-white absolute -bottom-0.5 -right-0.5" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bottom Submit CTA */}
          <div className="shrink-0 border-t border-slate-200 bg-white p-3 pb-[max(2rem,env(safe-area-inset-bottom))] sm:p-4">
            <button
              onClick={handleOpenSubmit}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              Finish & Submit Exam
            </button>
          </div>
        </aside>
      </div>

      {/* Submit Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Confirm Exam Submission</h2>
                <p className="text-xs text-slate-500">
                  Please verify your attempt summary before generating your final NEET scorecard & AIR rank.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 mb-6">
              <div className="grid grid-cols-3 gap-3 text-center mb-4">
                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <div className="text-xl font-bold text-emerald-600">
                    {paletteCounts.answered + paletteCounts.answered_marked_for_review}
                  </div>
                  <div className="text-xs text-slate-500 font-medium">Total Answered</div>
                </div>
                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <div className="text-xl font-bold text-rose-600">
                    {paletteCounts.not_answered + paletteCounts.not_visited}
                  </div>
                  <div className="text-xs text-slate-500 font-medium">Unattempted</div>
                </div>
                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <div className="text-xl font-bold text-purple-600">
                    {paletteCounts.marked_for_review + paletteCounts.answered_marked_for_review}
                  </div>
                  <div className="text-xs text-slate-500 font-medium">Marked Review</div>
                </div>
              </div>

              <div className="text-xs text-slate-600 flex items-center justify-between px-1">
                <span>Time Remaining:</span>
                <span className="font-mono font-bold text-slate-900">{formatTimer(remainingSeconds)}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-100 transition cursor-pointer"
              >
                Resume Exam
              </button>
              <button
                onClick={handleConfirmSubmit}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition cursor-pointer"
              >
                Submit & View Instant Result
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
