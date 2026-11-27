import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Award,
  BookOpenCheck,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  FileWarning,
  Flame,
  Layers,
  Play,
  Plus,
  Sparkles,
  Target,
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
  onStartSubjectTest: (subjectId: SubjectId, questionCount: number, pyqOnly?: boolean) => void;
  onStartChapterTest: (chapter: ChapterSyllabus, questionCount?: number) => void;
  onStartTopicTest: (chapter: ChapterSyllabus, topicName: string, questionCount?: number) => void;
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
  onStartSubjectTest,
  onStartChapterTest,
  onStartTopicTest,
  onNavigateTab,
  onInspectAttempt,
}) => {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskSubject, setNewTaskSubject] = useState<SubjectId>('physics');
  const [quickSubject, setQuickSubject] = useState<SubjectId>('physics');
  const subjectChapters = syllabus.filter((c) => c.subjectId === quickSubject);
  const [quickChapterId, setQuickChapterId] = useState<string>(
    syllabus[0]?.id || 'phy-units-measurements'
  );
  const activeQuickChapter =
    syllabus.find((c) => c.id === quickChapterId && c.subjectId === quickSubject) ||
    subjectChapters[0] ||
    syllabus[0];

  const latestAttempt = attempts[attempts.length - 1];
  const completedChapters = syllabus.filter((c) => c.status === 'completed').length;
  const syllabusPercent = Math.round((completedChapters / Math.max(1, syllabus.length)) * 100);
  const weakChapters = syllabus.filter(
    (chapter) => chapter.status === 'needs_revision' || chapter.accuracyPercent < 75
  );
  const unresolvedMistakes = mistakes.filter((m) => !m.resolved);
  const attemptedQuestionCount = attempts.reduce(
    (total, attempt) => total + attempt.correctCount + attempt.incorrectCount,
    0
  );
  const overallAccuracy =
    attemptedQuestionCount > 0
      ? Math.round(
          (attempts.reduce((total, attempt) => total + attempt.correctCount, 0) /
            attemptedQuestionCount) *
            100
        )
      : 89;

  const handleAddTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    onAddDailyTask(newTaskTitle.trim(), newTaskSubject);
    setNewTaskTitle('');
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* ALLEN Digital-Style Compact Hero & Batch Status Card */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-[#0f2342] to-blue-950 p-4 sm:p-6 text-white shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-[11px] font-bold uppercase tracking-wider">
                <Sparkles className="w-3 h-3" />
                LEADER BATCH · NEET (UG) 2027
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-[11px] font-bold">
                <Flame className="w-3 h-3 fill-amber-400 text-amber-400" />
                14 Day Streak
              </span>
            </div>
            <h1 className="text-lg sm:text-2xl font-extrabold tracking-tight">
              Target Score: 680+ / 720
            </h1>
            <p className="text-xs text-slate-300">
              ALLEN Digital Pattern · Chapter, Topic, Subject & Full 180-Q CBT Mock Workspace
            </p>
          </div>

          {/* Primary 2-Button Mobile/Desktop Action Row */}
          <div className="grid grid-cols-2 sm:flex items-center gap-2.5">
            <button
              onClick={() => onQuickStartTest('quick_20')}
              className="min-h-11 px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <Zap className="w-4 h-4 fill-white shrink-0" />
              <span>20-Q Mini Mock</span>
            </button>
            <button
              onClick={() => onQuickStartTest('full_180')}
              className="min-h-11 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-white shrink-0" />
              <span>Full 180-Q Mock</span>
            </button>
          </div>
        </div>

        {/* Compact 4-Metric Strip inside Hero (Minimal Mobile Layout) */}
        <div className="mt-4 pt-3.5 border-t border-white/10 grid grid-cols-4 gap-2 text-center sm:text-left">
          <div className="bg-white/5 rounded-xl p-2.5">
            <div className="text-[10px] font-semibold uppercase text-slate-300">Last Score</div>
            <div className="text-sm sm:text-lg font-extrabold text-white mt-0.5">
              {latestAttempt ? `${latestAttempt.totalScore}/${latestAttempt.maxScore}` : '618/720'}
            </div>
          </div>
          <div className="bg-white/5 rounded-xl p-2.5">
            <div className="text-[10px] font-semibold uppercase text-slate-300">Accuracy</div>
            <div className="text-sm sm:text-lg font-extrabold text-emerald-300 mt-0.5">
              {overallAccuracy}%
            </div>
          </div>
          <div className="bg-white/5 rounded-xl p-2.5">
            <div className="text-[10px] font-semibold uppercase text-slate-300">Syllabus</div>
            <div className="text-sm sm:text-lg font-extrabold text-blue-300 mt-0.5">
              {syllabusPercent}%
            </div>
          </div>
          <div
            onClick={() => onNavigateTab('revision')}
            className="bg-white/5 hover:bg-white/10 rounded-xl p-2.5 cursor-pointer transition"
          >
            <div className="text-[10px] font-semibold uppercase text-rose-300">Mistakes</div>
            <div className="text-sm sm:text-lg font-extrabold text-rose-300 mt-0.5">
              {unresolvedMistakes.length} Fix →
            </div>
          </div>
        </div>
      </div>

      {/* ALLEN Digital 4-Tile Quick Feature Grid (2x2 on Mobile, 4x1 on Desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        <button
          type="button"
          onClick={() => onNavigateTab('tests')}
          className="bg-white hover:border-blue-400 rounded-2xl border border-slate-200/90 p-3.5 text-left shadow-2xs transition flex items-center justify-between gap-2 cursor-pointer"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <ClipboardCheck className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs sm:text-sm font-extrabold text-slate-900 truncate">
                Chapter & Topic
              </div>
              <div className="text-[11px] text-slate-500 truncate">32 Ch · 110+ Topics</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
        </button>

        <button
          type="button"
          onClick={() => onQuickStartTest('pyq_sprint')}
          className="bg-white hover:border-indigo-400 rounded-2xl border border-slate-200/90 p-3.5 text-left shadow-2xs transition flex items-center justify-between gap-2 cursor-pointer"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Layers className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs sm:text-sm font-extrabold text-slate-900 truncate">
                PYQ Sprint Test
              </div>
              <div className="text-[11px] text-slate-500 truncate">2015–2025 Papers</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab('syllabus')}
          className="bg-white hover:border-emerald-400 rounded-2xl border border-slate-200/90 p-3.5 text-left shadow-2xs transition flex items-center justify-between gap-2 cursor-pointer"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <BookOpenCheck className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs sm:text-sm font-extrabold text-slate-900 truncate">
                NCERT Tracker
              </div>
              <div className="text-[11px] text-slate-500 truncate">50 Official Units</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab('revision')}
          className="bg-white hover:border-rose-400 rounded-2xl border border-slate-200/90 p-3.5 text-left shadow-2xs transition flex items-center justify-between gap-2 cursor-pointer"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <FileWarning className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs sm:text-sm font-extrabold text-slate-900 truncate">
                Improvement Book
              </div>
              <div className="text-[11px] text-slate-500 truncate">
                {unresolvedMistakes.length} Errors & Notes
              </div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
        </button>
      </div>

      {/* ALLEN Custom Practice Card: Instant Subject -> Chapter -> Topic Launcher */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs space-y-3.5">
        <div className="flex items-center justify-between gap-2">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600">
              ALLEN Custom Practice
            </span>
            <h2 className="text-sm sm:text-base font-extrabold text-slate-900">
              Start Subject, Chapter or Topic Test
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('tests')}
            className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer shrink-0"
          >
            All Tests <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 4 Subject Tabs */}
        <div className="grid grid-cols-4 gap-1.5 bg-slate-100 p-1 rounded-xl">
          {(['physics', 'chemistry', 'botany', 'zoology'] as SubjectId[]).map((subj) => {
            const isSelected = quickSubject === subj;
            return (
              <button
                key={subj}
                type="button"
                onClick={() => {
                  setQuickSubject(subj);
                  const firstCh = syllabus.find((c) => c.subjectId === subj);
                  if (firstCh) setQuickChapterId(firstCh.id);
                }}
                className={`min-h-9 py-1.5 px-2 rounded-lg text-xs font-bold transition cursor-pointer truncate ${
                  isSelected
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {SUBJECT_META[subj].name}
              </button>
            );
          })}
        </div>

        {/* Quick Subject Action Row */}
        <div className="flex items-center justify-between gap-2 bg-slate-50 rounded-xl px-3 py-2 border border-slate-200/70">
          <div className="text-xs font-semibold text-slate-700">
            Full <strong>{SUBJECT_META[quickSubject].name}</strong> Section Test:
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onStartSubjectTest(quickSubject, 15, false)}
              className="min-h-8 px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 text-xs font-bold cursor-pointer"
            >
              15-Q Sprint
            </button>
            <button
              type="button"
              onClick={() => onStartSubjectTest(quickSubject, 45, false)}
              className="min-h-8 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-blue-600 text-white text-xs font-bold cursor-pointer"
            >
              45-Q Full
            </button>
          </div>
        </div>

        {/* Chapter Dropdown + Topic Chips */}
        {activeQuickChapter && (
          <div className="space-y-2.5 pt-1">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <select
                value={activeQuickChapter.id}
                onChange={(e) => setQuickChapterId(e.target.value)}
                className="min-h-10 flex-1 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-900"
              >
                {subjectChapters.map((ch) => (
                  <option key={ch.id} value={ch.id}>
                    {ch.name} (Class {ch.classLevel} · {ch.accuracyPercent}%)
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => onStartChapterTest(activeQuickChapter, 10)}
                className="min-h-10 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer shrink-0"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                Chapter Test (10 Qs)
              </button>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
              <span className="text-[11px] font-bold text-slate-400 shrink-0 mr-1">
                Topics (5Q):
              </span>
              {activeQuickChapter.topics.map((topic) => (
                <button
                  key={topic.id}
                  type="button"
                  onClick={() => onStartTopicTest(activeQuickChapter, topic.name, 5)}
                  className="min-h-8 shrink-0 px-2.5 py-1 rounded-lg bg-indigo-50/70 hover:bg-indigo-600 text-indigo-700 hover:text-white border border-indigo-200/80 text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer"
                >
                  <Target className="w-3 h-3 shrink-0" />
                  <span>{topic.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Middle Row: 4-Subject Mastery + Weak Topic Revision */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Subject-Wise Readiness */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-3.5">
            <h2 className="text-sm sm:text-base font-extrabold text-slate-900">
              Subject-Wise Performance (720 Pattern)
            </h2>
            <button
              onClick={() => onNavigateTab('syllabus')}
              className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
            >
              Syllabus →
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(['physics', 'chemistry', 'botany', 'zoology'] as SubjectId[]).map((subjId) => {
              const meta = SUBJECT_META[subjId];
              const chapters = syllabus.filter((c) => c.subjectId === subjId);
              const subjectBreakdowns = attempts
                .flatMap((attempt) => attempt.subjectBreakdowns)
                .filter((breakdown) => breakdown.subjectId === subjId);
              const subjectCorrect = subjectBreakdowns.reduce(
                (sum, breakdown) => sum + breakdown.correct,
                0
              );
              const subjectAttempted = subjectBreakdowns.reduce(
                (sum, breakdown) => sum + breakdown.correct + breakdown.incorrect,
                0
              );
              const subjectAccuracy =
                subjectAttempted > 0 ? Math.round((subjectCorrect / subjectAttempted) * 100) : 85;
              const completedCount = chapters.filter((c) => c.status === 'completed').length;

              return (
                <div
                  key={subjId}
                  className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 flex flex-col justify-between gap-2.5"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-extrabold text-sm text-slate-900">{meta.name}</span>
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${meta.bgLight} ${meta.textDark} ${meta.border}`}
                      >
                        {subjectAccuracy}% Acc
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mb-2 flex items-center justify-between">
                      <span>
                        Done: <strong>{completedCount}/{chapters.length} Ch</strong>
                      </span>
                      <span>45 Qs · 180M</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${subjectAccuracy}%`, backgroundColor: meta.color }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={() => onStartSubjectTest(subjId, 15, false)}
                      className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Play className="w-3 h-3 fill-blue-600" /> Practice 15-Q
                    </button>
                    <button
                      type="button"
                      onClick={() => onStartSubjectTest(subjId, 20, true)}
                      className="text-[11px] font-semibold text-slate-500 hover:text-slate-900 cursor-pointer"
                    >
                      PYQ Set →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Weak Chapters Card */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs flex flex-col justify-between gap-3">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                <AlertCircle className="w-3 h-3" />
                Weak Chapters ({weakChapters.length})
              </span>
              <span className="text-[11px] text-slate-400">Acc &lt; 75%</span>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-0.5">
              {weakChapters.slice(0, 5).map((ch) => (
                <div
                  key={ch.id}
                  onClick={() => onStartChapterTest(ch, 10)}
                  className="p-2.5 rounded-xl bg-slate-50 hover:bg-rose-50/50 border border-slate-200/80 flex items-center justify-between gap-2 cursor-pointer transition"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 truncate">{ch.name}</div>
                    <div className="text-[10px] text-slate-500">
                      {SUBJECT_META[ch.subjectId].shortName} · Tap for 10-Q Revision
                    </div>
                  </div>
                  <span className="text-[11px] font-extrabold text-rose-700 bg-rose-100 px-2 py-0.5 rounded shrink-0">
                    {ch.accuracyPercent}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => onQuickStartTest('weak_chapters')}
            className="w-full min-h-10 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5" />
            Start Weak-Chapters Test (16 Qs)
          </button>
        </div>
      </div>

      {/* Bottom Row: Daily Targets + Recent Attempts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Daily Study Checklist */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
              Today’s Study Targets
            </h3>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
              {dailyTasks.filter((t) => t.completed).length}/{dailyTasks.length} Done
            </span>
          </div>

          <div className="space-y-2 mb-3">
            {dailyTasks.map((task) => (
              <div
                key={task.id}
                onClick={() => onToggleDailyTask(task.id)}
                className={`p-2.5 rounded-xl border flex items-center justify-between gap-2.5 cursor-pointer transition ${
                  task.completed
                    ? 'bg-emerald-50/30 border-emerald-200/70 text-slate-400 line-through'
                    : 'bg-white border-slate-200/80 hover:border-blue-300 text-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <CheckCircle2
                    className={`w-4 h-4 shrink-0 ${
                      task.completed ? 'text-emerald-600' : 'text-slate-300'
                    }`}
                  />
                  <span className="text-xs font-semibold truncate">{task.title}</span>
                </div>
                <span
                  className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border shrink-0 ${
                    SUBJECT_META[task.subjectId].bgLight
                  } ${SUBJECT_META[task.subjectId].textDark} ${SUBJECT_META[task.subjectId].border}`}
                >
                  {SUBJECT_META[task.subjectId].shortName}
                </span>
              </div>
            ))}
          </div>

          <form onSubmit={handleAddTaskSubmit} className="flex min-w-0 items-center gap-1.5">
            <select
              value={newTaskSubject}
              onChange={(e) => setNewTaskSubject(e.target.value as SubjectId)}
              className="min-h-9 shrink-0 px-2 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50 text-slate-700"
            >
              <option value="physics">PHY</option>
              <option value="chemistry">CHEM</option>
              <option value="botany">BOT</option>
              <option value="zoology">ZOO</option>
            </select>
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Add daily target..."
              className="min-h-9 min-w-0 flex-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              className="min-h-9 shrink-0 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </form>
        </div>

        {/* Recent Test Scorecards */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                Recent Test Scorecards
              </h3>
              <button
                onClick={() => onNavigateTab('tests')}
                className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
              >
                History <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2">
              {attempts
                .slice()
                .reverse()
                .slice(0, 4)
                .map((att) => (
                  <div
                    key={att.id}
                    onClick={() => onInspectAttempt(att)}
                    className="p-3 rounded-xl border border-slate-200/80 hover:border-blue-400 bg-slate-50/40 transition flex items-center justify-between gap-3 cursor-pointer"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate">
                        {att.testTitle}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {att.attemptedAt} · Acc: <strong>{att.accuracyPercent}%</strong>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-extrabold text-blue-600">
                        {att.totalScore}
                        <span className="text-[11px] font-normal text-slate-400">
                          /{att.maxScore}
                        </span>
                      </div>
                      <span className="text-[10px] font-semibold text-slate-500">
                        Analysis →
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1 font-medium">
              <Award className="w-3.5 h-3.5 text-amber-500" /> ALLEN Leader Schedule
            </span>
            <button
              onClick={() => onQuickStartTest('pyq_sprint')}
              className="font-bold text-blue-600 hover:underline cursor-pointer"
            >
              Launch 20-Q PYQ Sprint →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
