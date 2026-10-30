import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Award,
  BookOpenCheck,
  CheckCircle2,
  Flame,
  Layers,
  Play,
  Plus,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { SUBJECT_META } from '../../data/neetSyllabusData';
import type {
  ChapterSyllabus,
  DailyTask,
  MistakeNotebookEntry,
  SubjectId,
  TestAttemptResult,
} from '../../types/neet';

interface StudentDashboardProps {
  syllabus: ChapterSyllabus[];
  attempts: TestAttemptResult[];
  mistakes: MistakeNotebookEntry[];
  dailyTasks: DailyTask[];
  onToggleDailyTask: (taskId: string) => void;
  onAddDailyTask: (title: string, subjectId: SubjectId) => void;
  onQuickStartTest: (preset: 'full_180' | 'quick_20' | 'weak_chapters' | 'pyq_sprint') => void;
  onNavigateTab: (tab: string) => void;
  onInspectAttempt: (attempt: TestAttemptResult) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  syllabus,
  attempts,
  mistakes,
  dailyTasks,
  onToggleDailyTask,
  onAddDailyTask,
  onQuickStartTest,
  onNavigateTab,
  onInspectAttempt,
}) => {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskSubject, setNewTaskSubject] = useState<SubjectId>('physics');

  const latestAttempt = attempts[attempts.length - 1];
  const completedChapters = syllabus.filter((c) => c.status === 'completed').length;
  const syllabusPercent = Math.round((completedChapters / Math.max(1, syllabus.length)) * 100);
  const wasChapterAttempted = (chapterId: string) => attempts.some((attempt) =>
    attempt.questions.some((question) =>
      question.chapterId === chapterId && Boolean(attempt.responses[question.id]?.selectedOption)
    )
  );
  const weakChapters = syllabus.filter(
    (chapter) => chapter.status === 'needs_revision' ||
      (wasChapterAttempted(chapter.id) && chapter.accuracyPercent < 75)
  );
  const unresolvedMistakes = mistakes.filter((m) => !m.resolved);
  const attemptedQuestionCount = attempts.reduce(
    (total, attempt) => total + attempt.correctCount + attempt.incorrectCount,
    0
  );
  const overallAccuracy = attemptedQuestionCount > 0
    ? Math.round(attempts.reduce((total, attempt) => total + attempt.correctCount, 0) / attemptedQuestionCount * 100)
    : null;

  const handleAddTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    onAddDailyTask(newTaskTitle.trim(), newTaskSubject);
    setNewTaskTitle('');
  };

  return (
    <div className="space-y-6">
      {/* Top Dropper Hero Banner */}
      <div className="bg-[#14263f] rounded-2xl p-6 md:p-8 text-white shadow-sm border border-[#263b56] relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              NEET 2027 Dropper · Leader Online Test Series Mode
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Welcome back, Future Doctor
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Track your syllabus, practise questions, take tests, and review mistakes. Your study data stays saved in this browser.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onQuickStartTest('quick_20')}
              className="px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm flex items-center gap-2 shadow-md transition cursor-pointer"
            >
              <Zap className="w-4 h-4" />
              Instant 20-Q High-Yield Test
            </button>
            <button
              onClick={() => onQuickStartTest('full_180')}
              className="px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center gap-2 shadow-md transition cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white" />
              Full 180-Q NEET Mock (720M)
            </button>
          </div>
        </div>
      </div>

      {/* 4 Core KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold uppercase text-slate-400">
            <span>Latest Mock Score</span>
            <Award className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">
              {latestAttempt ? latestAttempt.totalScore : '—'}
            </span>
            <span className="text-sm font-semibold text-slate-400">
              {latestAttempt ? ` / ${latestAttempt.maxScore}` : ''}
            </span>
          </div>
          <div className="mt-2 text-xs text-emerald-600 font-semibold flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            {latestAttempt ? `${latestAttempt.accuracyPercent}% accuracy` : 'No saved attempts yet'}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold uppercase text-slate-400">
            <span>Syllabus Mastery</span>
            <BookOpenCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{syllabusPercent}%</span>
            <span className="text-xs font-medium text-slate-500">
              ({completedChapters}/{syllabus.length} Units Done)
            </span>
          </div>
          <div className="mt-2.5 w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-600 rounded-full transition-all"
              style={{ width: `${syllabusPercent}%` }}
            />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold uppercase text-slate-400">
            <span>Overall Accuracy</span>
            <Target className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">
              {overallAccuracy === null ? '—' : `${overallAccuracy}%`}
            </span>
            <span className="text-xs font-semibold text-indigo-600">Saved attempts: {attempts.length}</span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            {attempts.length} Full/Part Tests Evaluated
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold uppercase text-slate-400">
            <span>Mistake Notebook</span>
            <Flame className="w-4 h-4 text-rose-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-rose-600">{unresolvedMistakes.length}</span>
            <span className="text-xs font-medium text-slate-500">Pending Error Questions</span>
          </div>
          <button
            onClick={() => onNavigateTab('revision')}
            className="mt-2 text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
          >
            Open Mistake Notebook <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Middle Row: Subject-Wise Readiness + Weak Chapters Alert */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Subject-wise Readiness */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" />
                Subject-Wise NEET 720 Readiness & Accuracy
              </h2>
              <p className="text-xs text-slate-500">
                Mock tests use saved questions; compare this starter outline with the current official syllabus.
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('syllabus')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
            >
              Manage Syllabus <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(['physics', 'chemistry', 'botany', 'zoology'] as SubjectId[]).map((subjId) => {
              const meta = SUBJECT_META[subjId];
              const chapters = syllabus.filter((c) => c.subjectId === subjId);
              const subjectBreakdowns = attempts.flatMap((attempt) => attempt.subjectBreakdowns)
                .filter((breakdown) => breakdown.subjectId === subjId);
              const subjectCorrect = subjectBreakdowns.reduce((sum, breakdown) => sum + breakdown.correct, 0);
              const subjectAttempted = subjectBreakdowns.reduce(
                (sum, breakdown) => sum + breakdown.correct + breakdown.incorrect,
                0
              );
              const subjectAccuracy = subjectAttempted > 0
                ? Math.round(subjectCorrect / subjectAttempted * 100)
                : null;
              const completedCount = chapters.filter((c) => c.status === 'completed').length;

              return (
                <div
                  key={subjId}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-slate-900">{meta.name}</span>
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${meta.bgLight} ${meta.textDark} ${meta.border}`}
                    >
                      {subjectAccuracy === null ? 'No test data' : `${subjectAccuracy}% Accuracy`}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mb-2.5 flex items-center justify-between">
                    <span>
                      Chapters Completed: <strong>{completedCount}/{chapters.length}</strong>
                    </span>
                    <span>Weightage: 45 Qs (180M)</span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${subjectAccuracy ?? 0}%`, backgroundColor: meta.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Weak Chapters Detector */}
        <div className="bg-white rounded-2xl border border-rose-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                <AlertCircle className="w-3.5 h-3.5" />
                Weak Topic Detector
              </span>
              <span className="text-xs font-semibold text-slate-400">
                {weakChapters.length} Priority Units
              </span>
            </div>
            <h3 className="font-bold text-base text-slate-900 mb-1">
              Chapters Needing Revision
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Automatically detected from your test accuracy (&lt;75%) and revision tags:
            </p>

            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {weakChapters.map((ch) => (
                <div
                  key={ch.id}
                  className="p-3 rounded-xl bg-rose-50/50 border border-rose-100 flex items-center justify-between gap-2"
                >
                  <div>
                    <div className="text-xs font-bold text-slate-900 line-clamp-1">{ch.name}</div>
                    <div className="text-[11px] text-slate-500">
                      {SUBJECT_META[ch.subjectId].name} · Class {ch.classLevel} · Expected:{' '}
                      {ch.expectedQuestions} Qs
                    </div>
                  </div>
                  <span className="text-xs font-extrabold text-rose-700 bg-rose-100 px-2 py-0.5 rounded shrink-0">
                    {ch.accuracyPercent}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => onQuickStartTest('weak_chapters')}
            className="mt-4 w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs md:text-sm flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer"
          >
            <Zap className="w-4 h-4" />
            Generate Weak-Chapter Revision Test
          </button>
        </div>
      </div>

      {/* Bottom Row: Daily Dropper Study Planner + Recent Test Attempts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Study Planner */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-base text-slate-900">
                Daily Dropper Study & NCERT Checklist
              </h3>
              <p className="text-xs text-slate-500">
                Stay consistent with daily NCERT Biology + Physics/Chemistry numerical targets
              </p>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
              {dailyTasks.filter((t) => t.completed).length}/{dailyTasks.length} Done
            </span>
          </div>

          <div className="space-y-2.5 mb-4">
            {dailyTasks.map((task) => (
              <div
                key={task.id}
                onClick={() => onToggleDailyTask(task.id)}
                className={`p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition ${
                  task.completed
                    ? 'bg-emerald-50/40 border-emerald-200 text-slate-400 line-through'
                    : 'bg-white border-slate-200 hover:border-blue-300 text-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <CheckCircle2
                    className={`w-5 h-5 shrink-0 ${
                      task.completed ? 'text-emerald-600' : 'text-slate-300'
                    }`}
                  />
                  <div>
                    <div className="text-xs md:text-sm font-semibold">{task.title}</div>
                    <div className="text-[11px] text-slate-400">
                      {SUBJECT_META[task.subjectId].name} · {task.durationMinutes} mins
                    </div>
                  </div>
                </div>
                <span
                  className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                    SUBJECT_META[task.subjectId].bgLight
                  } ${SUBJECT_META[task.subjectId].textDark} ${SUBJECT_META[task.subjectId].border}`}
                >
                  {SUBJECT_META[task.subjectId].shortName}
                </span>
              </div>
            ))}
          </div>

          <form onSubmit={handleAddTaskSubmit} className="flex min-w-0 items-center gap-1.5 sm:gap-2">
            <select
              value={newTaskSubject}
              onChange={(e) => setNewTaskSubject(e.target.value as SubjectId)}
              className="shrink-0 px-2 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50 text-slate-700 sm:px-3"
            >
              <option value="physics">Physics</option>
              <option value="chemistry">Chemistry</option>
              <option value="botany">Botany</option>
              <option value="zoology">Zoology</option>
            </select>
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Add today's revision target (e.g. Solve 40 Electrochemistry PYQs)..."
              className="min-w-0 flex-1 px-2 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-blue-500 sm:px-3.5"
            />
            <button
              type="submit"
              className="shrink-0 px-2.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1 cursor-pointer sm:px-3.5"
            >
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </form>
        </div>

        {/* Recent Mock Test History */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-base text-slate-900">Recent Mock Test Performance</h3>
                <p className="text-xs text-slate-500">
                  Click any attempt to inspect subject-wise scores & solutions
                </p>
              </div>
              <button
                onClick={() => onNavigateTab('tests')}
                className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
              >
                All Tests <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {attempts
                .slice()
                .reverse()
                .slice(0, 4)
                .map((att) => (
                  <div
                    key={att.id}
                    onClick={() => onInspectAttempt(att)}
                    className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/20 transition flex items-center justify-between gap-3 cursor-pointer"
                  >
                    <div>
                      <div className="text-xs md:text-sm font-bold text-slate-900">{att.testTitle}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {att.attemptedAt} · Accuracy: <strong>{att.accuracyPercent}%</strong>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-base font-extrabold text-blue-700">
                        {att.totalScore} <span className="text-xs font-normal text-slate-400">/ {att.maxScore}</span>
                      </div>
                      <span className="text-[10px] font-semibold text-blue-600">View Report →</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Recommended Dropper Schedule: 2 Part Tests + 1 Full Mock / week</span>
            <button
              onClick={() => onQuickStartTest('pyq_sprint')}
              className="font-bold text-indigo-600 hover:underline cursor-pointer"
            >
              Start PYQ Sprint →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
