import React, { useState } from 'react';
import {
  Award,
  Calendar,
  CheckSquare,
  Clock,
  FileCheck2,
  Layers,
  Play,
  Sliders,
  Sparkles,
  Square,
  Zap,
} from 'lucide-react';
import { SUBJECT_META } from '../../data/neetSyllabusData';
import type {
  Difficulty,
  ScheduledSeriesTest,
  SubjectId,
  TestAttemptResult,
  TestCategory,
} from '../../types/neet';

interface MockTestHubProps {
  seriesTests: ScheduledSeriesTest[];
  attempts: TestAttemptResult[];
  onStartCustomTest: (config: {
    title: string;
    category: TestCategory;
    subjects: SubjectId[];
    questionsPerSubject: number;
    durationMinutes: number;
    pyqOnly: boolean;
    difficultyFilter: 'all' | Difficulty;
  }) => void;
  onStartSeriesTest: (seriesTest: ScheduledSeriesTest) => void;
  onInspectAttempt: (attempt: TestAttemptResult) => void;
}

export const MockTestHub: React.FC<MockTestHubProps> = ({
  seriesTests,
  attempts,
  onStartCustomTest,
  onStartSeriesTest,
  onInspectAttempt,
}) => {
  const [activeTab, setActiveTab] = useState<'generator' | 'series' | 'history'>('generator');

  // Custom Generator State
  const [presetMode, setPresetMode] = useState<
    'full_neet_180' | 'mini_mock_20' | 'subject_45' | 'pyq_only'
  >('mini_mock_20');
  const [selectedSubjects, setSelectedSubjects] = useState<SubjectId[]>([
    'physics',
    'chemistry',
    'botany',
    'zoology',
  ]);
  const [questionsPerSubject, setQuestionsPerSubject] = useState<number>(5);
  const [durationMinutes, setDurationMinutes] = useState<number>(25);
  const [pyqOnly, setPyqOnly] = useState<boolean>(false);
  const [difficultyFilter, setDifficultyFilter] = useState<'all' | Difficulty>('all');
  const [customTitle, setCustomTitle] = useState<string>(
    'Custom NEET 2027 Practice Mock Test'
  );

  const applyPreset = (
    preset: 'full_neet_180' | 'mini_mock_20' | 'subject_45' | 'pyq_only'
  ) => {
    setPresetMode(preset);
    if (preset === 'full_neet_180') {
      setSelectedSubjects(['physics', 'chemistry', 'botany', 'zoology']);
      setQuestionsPerSubject(45);
      setDurationMinutes(200);
      setPyqOnly(false);
      setCustomTitle('Full Syllabus NEET 2027 Mock Test (180 Qs · 720 Marks)');
    } else if (preset === 'mini_mock_20') {
      setSelectedSubjects(['physics', 'chemistry', 'botany', 'zoology']);
      setQuestionsPerSubject(5);
      setDurationMinutes(25);
      setPyqOnly(false);
      setCustomTitle('High-Yield 4-Subject Mini Mock (20 Qs · 80 Marks)');
    } else if (preset === 'subject_45') {
      setSelectedSubjects(['physics']);
      setQuestionsPerSubject(45);
      setDurationMinutes(50);
      setPyqOnly(false);
      setCustomTitle('Subject-Wise Full Pattern Mock (45 Qs · 180 Marks)');
    } else if (preset === 'pyq_only') {
      setSelectedSubjects(['physics', 'chemistry', 'botany', 'zoology']);
      setQuestionsPerSubject(5);
      setDurationMinutes(25);
      setPyqOnly(true);
      setCustomTitle('NEET Previous Year Questions (PYQ) Benchmark Test');
    }
  };

  const toggleSubject = (subj: SubjectId) => {
    setSelectedSubjects((prev) => {
      if (prev.includes(subj)) {
        if (prev.length === 1) return prev; // Keep at least 1 subject
        return prev.filter((s) => s !== subj);
      }
      return [...prev, subj];
    });
  };

  const totalQuestions = selectedSubjects.length * questionsPerSubject;
  const totalMaxMarks = totalQuestions * 4;

  const handleLaunchCustom = () => {
    onStartCustomTest({
      title: customTitle.trim() || 'Auto-Generated NEET Mock Test',
      category:
        presetMode === 'full_neet_180'
          ? 'full_syllabus'
          : presetMode === 'pyq_only'
            ? 'pyq_test'
            : 'subject_test',
      subjects: selectedSubjects,
      questionsPerSubject,
      durationMinutes,
      pyqOnly,
      difficultyFilter,
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Sub-Navigation */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">
            Mock Tests and Test History
          </h1>
          <p className="text-xs text-slate-500">
            Generate instant custom NEET tests or attempt scheduled Minor, Semi-Major, Major & AIOT
            papers
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl">
          <button
            onClick={() => setActiveTab('generator')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'generator'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ⚡ Auto Mock Generator
          </button>
          <button
            onClick={() => setActiveTab('series')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'series'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📅 Scheduled Tests ({seriesTests.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'history'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📊 Attempt History ({attempts.length})
          </button>
        </div>
      </div>

      {/* TAB 1: AUTOMATIC MOCK TEST GENERATOR */}
      {activeTab === 'generator' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Columns: Configuration Controls */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
            <div>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                Smart Blueprint Engine
              </span>
              <h2 className="text-lg font-bold text-slate-900">
                1. Choose Test Blueprint Preset
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                {
                  id: 'mini_mock_20',
                  title: 'Quick 4-Subject Mock (20 Qs)',
                  desc: '5 Qs per subject · 80 Marks · 25 Mins',
                },
                {
                  id: 'full_neet_180',
                  title: 'Full NEET UG Pattern (180 Qs)',
                  desc: '45 Qs × 4 Subjects · 720 Marks · 200 Mins',
                },
                {
                  id: 'subject_45',
                  title: 'Single Subject Test (45 Qs)',
                  desc: '45 Qs · 180 Marks · 50 Mins',
                },
                {
                  id: 'pyq_only',
                  title: 'NEET PYQ-Only Benchmark',
                  desc: 'PYQ-tagged questions with recorded sources',
                },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() =>
                    applyPreset(
                      item.id as 'full_neet_180' | 'mini_mock_20' | 'subject_45' | 'pyq_only'
                    )
                  }
                  className={`p-4 rounded-xl border-2 text-left transition cursor-pointer ${
                    presetMode === item.id
                      ? 'border-blue-600 bg-blue-50/60'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="font-bold text-sm text-slate-900">{item.title}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{item.desc}</div>
                </button>
              ))}
            </div>

            {/* Subject Selector */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-2.5">
                2. Select Subjects Included
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {(['physics', 'chemistry', 'botany', 'zoology'] as SubjectId[]).map((subj) => {
                  const isSelected = selectedSubjects.includes(subj);
                  const meta = SUBJECT_META[subj];
                  return (
                    <button
                      key={subj}
                      onClick={() => toggleSubject(subj)}
                      className={`p-3 rounded-xl border font-bold text-xs flex items-center gap-2 transition cursor-pointer ${
                        isSelected
                          ? `${meta.bgLight} ${meta.textDark} ${meta.border} ring-1 ring-blue-500/30`
                          : 'bg-slate-50 text-slate-500 border-slate-200'
                      }`}
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 shrink-0" />
                      )}
                      <span>{meta.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sliders & Options */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Questions per Subject
                </label>
                <select
                  value={questionsPerSubject}
                  onChange={(e) => setQuestionsPerSubject(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50 text-slate-800"
                >
                  <option value={5}>5 Qs / Subject</option>
                  <option value={10}>10 Qs / Subject</option>
                  <option value={15}>15 Qs / Subject</option>
                  <option value={25}>25 Qs / Subject</option>
                  <option value={45}>45 Qs / Subject (Full NEET)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Duration (Minutes)
                </label>
                <select
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50 text-slate-800"
                >
                  <option value={15}>15 Minutes</option>
                  <option value={25}>25 Minutes</option>
                  <option value={50}>50 Minutes</option>
                  <option value={90}>90 Minutes</option>
                  <option value={180}>180 Minutes (3 Hours)</option>
                  <option value={200}>200 Minutes (3 Hr 20m NEET)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Difficulty Distribution
                </label>
                <select
                  value={difficultyFilter}
                  onChange={(e) => setDifficultyFilter(e.target.value as 'all' | Difficulty)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50 text-slate-800"
                >
                  <option value="all">Balanced NEET Mix (Easy+Med+Hard)</option>
                  <option value="easy">NCERT Foundation (Easy)</option>
                  <option value="medium">Standard NEET Level (Medium)</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>

            {/* Test Title Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Custom Test Title
              </label>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>

          {/* Right Column: Live Summary Card & Launch CTA */}
          <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-lg flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                  Live Test Blueprint Summary
                </span>
                <Sliders className="w-4 h-4 text-slate-400" />
              </div>

              <h3 className="text-lg font-extrabold leading-snug">{customTitle}</h3>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="bg-slate-800/90 p-3.5 rounded-xl border border-slate-700">
                  <div className="text-2xl font-extrabold text-white">{totalQuestions}</div>
                  <div className="text-xs text-slate-400">Total MCQs</div>
                </div>
                <div className="bg-slate-800/90 p-3.5 rounded-xl border border-slate-700">
                  <div className="text-2xl font-extrabold text-emerald-400">{totalMaxMarks}</div>
                  <div className="text-xs text-slate-400">Max Marks (+4/-1)</div>
                </div>
                <div className="bg-slate-800/90 p-3.5 rounded-xl border border-slate-700">
                  <div className="text-xl font-extrabold text-amber-400">{durationMinutes} min</div>
                  <div className="text-xs text-slate-400">Exam Timer</div>
                </div>
                <div className="bg-slate-800/90 p-3.5 rounded-xl border border-slate-700">
                  <div className="text-xl font-extrabold text-purple-300">
                    {selectedSubjects.length}
                  </div>
                  <div className="text-xs text-slate-400">Subject Sections</div>
                </div>
              </div>

              <div className="pt-2 space-y-2 text-xs text-slate-300">
                <div className="flex items-center justify-between py-1.5 border-b border-slate-800">
                  <span>Marking Pattern:</span>
                  <span className="font-bold text-emerald-400">+4 Correct, -1 Wrong, 0 Left</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-slate-800">
                  <span>NTA Question Palette:</span>
                  <span className="font-bold text-white">Enabled (1–{totalQuestions})</span>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <span>Score & Solutions:</span>
                  <span className="font-bold text-blue-400">Enabled</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleLaunchCustom}
              className="mt-6 w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg transition cursor-pointer"
            >
              <Zap className="w-4 h-4 fill-white" />
              Generate & Start CBT Exam Now
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: SCHEDULED TESTS */}
      {activeTab === 'series' && (
        <div className="space-y-4">
          {seriesTests.length === 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-sm text-slate-600">
              No scheduled tests yet. Generate a test from the Test Generator tab.
            </div>
          )}
          {seriesTests.map((st) => (
            <div
              key={st.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-blue-300 transition flex flex-col md:flex-row md:items-center md:justify-between gap-4"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-slate-900 text-white">
                    {st.code}
                  </span>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    {st.seriesType}
                  </span>
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> {st.scheduledDate}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900">{st.title}</h3>
                <p className="text-xs text-slate-500">
                  <strong>Syllabus:</strong> {st.syllabusSummary}
                </p>

                <div className="flex items-center gap-4 text-xs text-slate-600 pt-1">
                  <span className="flex items-center gap-1 font-semibold">
                    <Layers className="w-3.5 h-3.5 text-blue-600" /> {st.questionCount} Questions
                  </span>
                  <span className="flex items-center gap-1 font-semibold">
                    <Award className="w-3.5 h-3.5 text-emerald-600" /> {st.maxMarks} Max Marks
                  </span>
                  <span className="flex items-center gap-1 font-semibold">
                    <Clock className="w-3.5 h-3.5 text-amber-600" /> {st.durationMinutes} Mins
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {st.lastScore !== undefined && (
                  <div className="text-right px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200">
                    <div className="text-[10px] font-bold uppercase text-emerald-700">
                      Previous Score
                    </div>
                    <div className="text-sm font-extrabold text-emerald-900">
                      {st.lastScore} / {st.maxMarks}
                    </div>
                  </div>
                )}

                <button
                  onClick={() => onStartSeriesTest(st)}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs md:text-sm flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-white" />
                  {st.status === 'completed' ? 'Re-Attempt Test' : 'Start Test Now'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: ATTEMPT HISTORY & REPORTS */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {attempts
            .slice()
            .reverse()
            .map((att) => (
              <div
                key={att.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Evaluated
                    </span>
                    <span className="text-xs text-slate-500">{att.attemptedAt}</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{att.testTitle}</h3>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 mt-2">
                    <span>
                      Score: <strong className="text-slate-900">{att.totalScore}/{att.maxScore}</strong>
                    </span>
                    <span className="text-emerald-700 font-semibold">
                      ✓ {att.correctCount} Correct
                    </span>
                    <span className="text-rose-700 font-semibold">
                      ✗ {att.incorrectCount} Wrong
                    </span>
                    <span>○ {att.unattemptedCount} Unattempted</span>
                  </div>
                </div>

                <button
                  onClick={() => onInspectAttempt(att)}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shrink-0"
                >
                  <FileCheck2 className="w-4 h-4" />
                  View Scorecard & Solutions
                </button>
              </div>
            ))}
        </div>
      )}
    </div>
  );
};
