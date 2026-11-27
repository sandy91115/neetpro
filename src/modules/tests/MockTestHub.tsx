import React, { useState } from 'react';
import {
  Award,
  Calendar,
  CheckSquare,
  Clock,
  FileCheck2,
  Flame,
  Layers,
  Play,
  Search,
  Sliders,
  Sparkles,
  Square,
  Target,
  Zap,
} from 'lucide-react';
import { SUBJECT_META } from '../../data/neetSyllabusData';
import { OFFICIAL_NEET_2026_SYLLABUS } from '../../data/officialNeet2026Syllabus';
import type {
  ChapterSyllabus,
  Difficulty,
  ScheduledSeriesTest,
  SubjectId,
  TestAttemptResult,
  TestCategory,
} from '../../types/neet';

interface MockTestHubProps {
  syllabus: ChapterSyllabus[];
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
    chapterIds?: string[];
    topicQuery?: string;
  }) => void;
  onStartSubjectTest: (subjectId: SubjectId, questionCount: number, pyqOnly?: boolean) => void;
  onStartChapterTest: (chapter: ChapterSyllabus, questionCount?: number) => void;
  onStartTopicTest: (chapter: ChapterSyllabus, topicName: string, questionCount?: number) => void;
  onStartOfficialUnitTest: (unitId: string, subjectId: SubjectId, unitName: string) => void;
  onStartSeriesTest: (seriesTest: ScheduledSeriesTest) => void;
  onInspectAttempt: (attempt: TestAttemptResult) => void;
}

export const MockTestHub: React.FC<MockTestHubProps> = ({
  syllabus,
  seriesTests,
  attempts,
  onStartCustomTest,
  onStartSubjectTest,
  onStartChapterTest,
  onStartTopicTest,
  onStartOfficialUnitTest,
  onStartSeriesTest,
  onInspectAttempt,
}) => {
  const [activeTab, setActiveTab] = useState<
    'chapter_topic' | 'subject_wise' | 'generator' | 'series' | 'history'
  >('chapter_topic');

  // Chapter & Topic Browser State
  const [filterSubject, setFilterSubject] = useState<'all' | SubjectId>('all');
  const [filterClass, setFilterClass] = useState<'all' | '11th' | '12th'>('all');
  const [chapterSearch, setChapterSearch] = useState('');
  const [chapterQuestionCount, setChapterQuestionCount] = useState<number>(10);
  const [topicQuestionCount, setTopicQuestionCount] = useState<number>(5);
  const [expandedChapterIds, setExpandedChapterIds] = useState<Record<string, boolean>>(() => ({
    [syllabus[0]?.id || 'phy-units-measurements']: true,
  }));

  const toggleExpandChapter = (chId: string) => {
    setExpandedChapterIds((prev) => ({ ...prev, [chId]: !prev[chId] }));
  };

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
  const [selectedChapterId, setSelectedChapterId] = useState<string>('all');
  const [selectedTopicName, setSelectedTopicName] = useState<string>('all');
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
    setSelectedChapterId('all');
    setSelectedTopicName('all');
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
    setSelectedChapterId('all');
    setSelectedTopicName('all');
    setSelectedSubjects((prev) => {
      if (prev.includes(subj)) {
        if (prev.length === 1) return prev;
        return prev.filter((s) => s !== subj);
      }
      return [...prev, subj];
    });
  };

  const totalQuestions = selectedSubjects.length * questionsPerSubject;
  const totalMaxMarks = totalQuestions * 4;

  const generatorChapters = syllabus.filter((ch) => selectedSubjects.includes(ch.subjectId));
  const activeGeneratorChapter = syllabus.find((ch) => ch.id === selectedChapterId);

  const handleLaunchCustom = () => {
    onStartCustomTest({
      title: customTitle.trim() || 'Auto-Generated NEET Mock Test',
      category:
        selectedChapterId !== 'all'
          ? 'chapter_test'
          : presetMode === 'full_neet_180'
            ? 'full_syllabus'
            : presetMode === 'pyq_only'
              ? 'pyq_test'
              : 'subject_test',
      subjects: selectedSubjects,
      questionsPerSubject,
      durationMinutes,
      pyqOnly,
      difficultyFilter,
      chapterIds: selectedChapterId !== 'all' ? [selectedChapterId] : undefined,
      topicQuery: selectedTopicName !== 'all' ? selectedTopicName : undefined,
    });
  };

  const filteredChapters = syllabus.filter((ch) => {
    if (filterSubject !== 'all' && ch.subjectId !== filterSubject) return false;
    if (filterClass !== 'all' && ch.classLevel !== filterClass) return false;
    if (
      chapterSearch.trim() &&
      !ch.name.toLowerCase().includes(chapterSearch.toLowerCase()) &&
      !ch.unitName.toLowerCase().includes(chapterSearch.toLowerCase()) &&
      !ch.topics.some((t) => t.name.toLowerCase().includes(chapterSearch.toLowerCase()))
    ) {
      return false;
    }
    return true;
  });

  const totalTopicsCount = syllabus.reduce((acc, ch) => acc + ch.topics.length, 0);

  return (
    <div className="space-y-5">
      {/* Top Sub-Navigation — Mobile Scrollable Pills */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h1 className="text-lg sm:text-xl font-extrabold text-slate-900">
              NEET Test Center — Subject, Chapter, Topic & Full Mocks
            </h1>
            <p className="text-xs text-slate-500">
              Attempt 1-tap Subject-Wise, Chapter-Wise ({syllabus.length} Chapters + 50 Official Units), Topic-Wise ({totalTopicsCount} Topics) & Full 720-Mark Mocks
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('chapter_topic')}
            className={`min-h-10 shrink-0 px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'chapter_topic'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📖 Chapter & Topic Tests ({syllabus.length})
          </button>
          <button
            onClick={() => setActiveTab('subject_wise')}
            className={`min-h-10 shrink-0 px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'subject_wise'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🎯 Subject-Wise Tests (4)
          </button>
          <button
            onClick={() => setActiveTab('generator')}
            className={`min-h-10 shrink-0 px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'generator'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ⚡ Custom Mock Builder
          </button>
          <button
            onClick={() => setActiveTab('series')}
            className={`min-h-10 shrink-0 px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'series'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📅 Test Series ({seriesTests.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`min-h-10 shrink-0 px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'history'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📊 History ({attempts.length})
          </button>
        </div>
      </div>

      {/* TAB 1: CHAPTER-WISE & TOPIC-WISE TESTS (ALL CHAPTERS + ALL TOPICS + 50 OFFICIAL UNITS) */}
      {activeTab === 'chapter_topic' && (
        <div className="space-y-5">
          {/* Mobile-Friendly Filter & Test Size Controls */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {(['all', 'physics', 'chemistry', 'botany', 'zoology'] as const).map((subj) => (
                <button
                  key={subj}
                  onClick={() => setFilterSubject(subj)}
                  className={`min-h-10 shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold capitalize transition cursor-pointer ${
                    filterSubject === subj
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {subj === 'all'
                    ? `All Subjects (${syllabus.length})`
                    : `${SUBJECT_META[subj].name} (${syllabus.filter((c) => c.subjectId === subj).length})`}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={chapterSearch}
                  onChange={(e) => setChapterSearch(e.target.value)}
                  placeholder="Search any chapter or topic..."
                  className="w-full min-h-10 pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <select
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value as 'all' | '11th' | '12th')}
                className="min-h-10 px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50 text-slate-700"
              >
                <option value="all">Class 11th + 12th Chapters</option>
                <option value="11th">Class 11th Chapters Only</option>
                <option value="12th">Class 12th Chapters Only</option>
              </select>

              <select
                value={chapterQuestionCount}
                onChange={(e) => setChapterQuestionCount(Number(e.target.value))}
                className="min-h-10 px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-blue-50/70 text-blue-900"
              >
                <option value={10}>Chapter Test Size: 10 Qs (15m)</option>
                <option value={15}>Chapter Test Size: 15 Qs (20m)</option>
                <option value={20}>Chapter Test Size: 20 Qs (25m)</option>
                <option value={30}>Chapter Test Size: 30 Qs (35m)</option>
              </select>

              <select
                value={topicQuestionCount}
                onChange={(e) => setTopicQuestionCount(Number(e.target.value))}
                className="min-h-10 px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-indigo-50/70 text-indigo-900"
              >
                <option value={5}>Topic Test Size: 5 Qs (8m)</option>
                <option value={10}>Topic Test Size: 10 Qs (15m)</option>
                <option value={15}>Topic Test Size: 15 Qs (20m)</option>
              </select>
            </div>
          </div>

          {/* Minimal ALLEN-Style Chapter Accordion Cards with Expandable Topic Micro-Tests */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {filteredChapters.map((ch) => {
              const meta = SUBJECT_META[ch.subjectId];
              const isExpanded = Boolean(expandedChapterIds[ch.id] || chapterSearch.trim());
              return (
                <div
                  key={ch.id}
                  className="bg-white rounded-2xl border border-slate-200/90 p-3.5 sm:p-4 shadow-2xs hover:border-blue-300 transition flex flex-col justify-between gap-3"
                >
                  {/* Clean Single-Row Chapter Card Header */}
                  <div className="flex items-start justify-between gap-2.5">
                    <div
                      onClick={() => toggleExpandChapter(ch.id)}
                      className="min-w-0 flex-1 cursor-pointer"
                    >
                      <div className="flex items-center gap-1.5 flex-wrap mb-1">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${meta.bgLight} ${meta.textDark} ${meta.border}`}
                        >
                          {meta.shortName} · {ch.classLevel}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-400">
                          Acc: {ch.accuracyPercent}%
                        </span>
                        {ch.highYield && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full">
                            <Flame className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                            High Yield
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm sm:text-base font-extrabold text-slate-900 leading-snug">
                        {ch.name}
                      </h3>
                      <button
                        type="button"
                        className="mt-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
                      >
                        <span>
                          {isExpanded
                            ? `▾ Hide ${ch.topics.length} Topic Tests`
                            : `▸ View ${ch.topics.length} Topic-Wise Tests`}
                        </span>
                      </button>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <button
                        onClick={() => onStartChapterTest(ch, chapterQuestionCount)}
                        className="min-h-9 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1 shadow-2xs transition cursor-pointer"
                      >
                        <Play className="w-3 h-3 fill-white" />
                        <span>{chapterQuestionCount}Q Test</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onStartChapterTest(ch, 20)}
                        className="text-[10px] font-bold text-slate-500 hover:text-slate-900 cursor-pointer"
                      >
                        Full 20Q →
                      </button>
                    </div>
                  </div>

                  {/* Collapsible Topic-Wise Micro-Tests (Minimal until tapped) */}
                  {isExpanded && (
                    <div className="bg-slate-50 rounded-xl border border-slate-200/80 p-2.5 space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">
                        <span>Topic-Wise Micro Tests</span>
                        <span>{topicQuestionCount} Qs / Topic</span>
                      </div>

                      <div className="divide-y divide-slate-200/60">
                        {ch.topics.map((topic) => (
                          <div
                            key={topic.id}
                            className="py-1.5 first:pt-1 last:pb-0.5 flex items-center justify-between gap-2"
                          >
                            <div className="min-w-0 flex items-center gap-1.5">
                              <Target className="w-3 h-3 text-indigo-600 shrink-0" />
                              <span className="text-xs font-medium text-slate-800 leading-snug">
                                {topic.name}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => onStartTopicTest(ch, topic.name, topicQuestionCount)}
                              className="min-h-8 shrink-0 px-2.5 py-1 rounded-lg bg-white hover:bg-indigo-600 text-indigo-700 hover:text-white border border-indigo-200 hover:border-indigo-600 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                            >
                              <Play className="w-2.5 h-2.5 fill-current" />
                              <span>{topicQuestionCount}Q</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Official 50 NTA/NMC Units Direct Test Grid */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
                Complete Official NTA / NMC 50 Units
              </span>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 mt-0.5">
                Official NEET Unit-Wise Practice Tests (All 50 Units)
              </h2>
              <p className="text-xs text-slate-500">
                Tap any official unit below to immediately start a 10-question unit test on mobile or desktop.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {OFFICIAL_NEET_2026_SYLLABUS.map((subject) => (
                <div key={subject.id} className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-2.5">
                  <div className="font-extrabold text-sm text-slate-900 flex items-center justify-between">
                    <span>{subject.name}</span>
                    <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                      {subject.units.length} Units
                    </span>
                  </div>
                  <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                    {subject.units.map((unit) => {
                      const appSubjects =
                        subject.id === 'biology'
                          ? (['botany', 'zoology'] as SubjectId[])
                          : ([subject.id] as SubjectId[]);
                      return (
                        <div
                          key={unit.id}
                          className="bg-white rounded-lg border border-slate-200 p-2.5 space-y-2"
                        >
                          <div className="text-xs font-bold text-slate-800">
                            Unit {unit.number}: {unit.title}
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {appSubjects.map((appSubj) => (
                              <button
                                key={appSubj}
                                type="button"
                                onClick={() => onStartOfficialUnitTest(unit.id, appSubj, unit.title)}
                                className="min-h-9 flex-1 px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <Play className="w-3 h-3 fill-white" />
                                {SUBJECT_META[appSubj].shortName} Test (10 Qs)
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SUBJECT-WISE TESTS (PHYSICS, CHEMISTRY, BOTANY, ZOOLOGY) */}
      {activeTab === 'subject_wise' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(['physics', 'chemistry', 'botany', 'zoology'] as SubjectId[]).map((subjId) => {
            const meta = SUBJECT_META[subjId];
            const subjChapters = syllabus.filter((c) => c.subjectId === subjId);
            const subjTopics = subjChapters.reduce((sum, c) => sum + c.topics.length, 0);

            return (
              <div
                key={subjId}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between gap-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-xs font-extrabold px-3 py-1 rounded-full border ${meta.bgLight} ${meta.textDark} ${meta.border}`}
                    >
                      {meta.name} · NEET Section (180 Marks)
                    </span>
                    <span className="text-xs font-bold text-slate-500">
                      {subjChapters.length} Chapters · {subjTopics} Topics
                    </span>
                  </div>

                  <h3 className="text-lg font-extrabold text-slate-900">
                    {meta.name} Subject-Wise Mock Tests
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Choose a quick 15-Q subject sprint, 25-Q half paper, full 45-Q NEET subject paper (180 Marks), or 20-Q {meta.name} PYQ-only test.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={() => onStartSubjectTest(subjId, 15, false)}
                      className="min-h-12 p-3 rounded-xl border border-slate-200 hover:border-blue-400 bg-slate-50 hover:bg-blue-50/40 text-left transition cursor-pointer flex items-center justify-between"
                    >
                      <div>
                        <div className="text-xs font-extrabold text-slate-900">
                          ⚡ 15-Q Quick Sprint
                        </div>
                        <div className="text-[11px] text-slate-500">60 Marks · 20 Mins</div>
                      </div>
                      <Play className="w-4 h-4 text-blue-600 fill-blue-600 shrink-0" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onStartSubjectTest(subjId, 25, false)}
                      className="min-h-12 p-3 rounded-xl border border-slate-200 hover:border-blue-400 bg-slate-50 hover:bg-blue-50/40 text-left transition cursor-pointer flex items-center justify-between"
                    >
                      <div>
                        <div className="text-xs font-extrabold text-slate-900">
                          🎯 25-Q Half Subject
                        </div>
                        <div className="text-[11px] text-slate-500">100 Marks · 30 Mins</div>
                      </div>
                      <Play className="w-4 h-4 text-blue-600 fill-blue-600 shrink-0" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onStartSubjectTest(subjId, 45, false)}
                      className="min-h-12 p-3 rounded-xl border-2 border-blue-600 bg-blue-600 hover:bg-blue-700 text-white text-left transition cursor-pointer flex items-center justify-between"
                    >
                      <div>
                        <div className="text-xs font-extrabold">
                          🏆 Full 45-Q NEET Paper
                        </div>
                        <div className="text-[11px] text-blue-100">180 Marks · 50 Mins</div>
                      </div>
                      <Play className="w-4 h-4 fill-white shrink-0" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onStartSubjectTest(subjId, 20, true)}
                      className="min-h-12 p-3 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-950 text-left transition cursor-pointer flex items-center justify-between"
                    >
                      <div>
                        <div className="text-xs font-extrabold">
                          📜 20-Q {meta.shortName} PYQ Test
                        </div>
                        <div className="text-[11px] text-indigo-700">2015–2025 PYQs · 25m</div>
                      </div>
                      <Play className="w-4 h-4 text-indigo-700 fill-indigo-700 shrink-0" />
                    </button>
                  </div>
                </div>

                {/* Quick Chapter Pills inside Subject Card */}
                <div className="pt-3 border-t border-slate-100">
                  <div className="text-[11px] font-bold uppercase text-slate-400 mb-2">
                    Or tap any {meta.name} chapter for an instant 10-Q test:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {subjChapters.map((ch) => (
                      <button
                        key={ch.id}
                        type="button"
                        onClick={() => onStartChapterTest(ch, 10)}
                        className="min-h-8 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-900 text-slate-700 hover:text-white text-[11px] font-semibold transition cursor-pointer"
                      >
                        {ch.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 3: AUTOMATIC CUSTOM MOCK TEST GENERATOR */}
      {activeTab === 'generator' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Columns: Configuration Controls */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-6">
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
                  desc: '2015–2025 Official PYQs across subjects',
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
                      className={`min-h-11 p-3 rounded-xl border font-bold text-xs flex items-center gap-2 transition cursor-pointer ${
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

            {/* Chapter & Topic Scope Selector inside Custom Generator */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  3. Chapter Filter (Optional — All or Specific Chapter)
                </label>
                <select
                  value={selectedChapterId}
                  onChange={(e) => {
                    const chId = e.target.value;
                    setSelectedChapterId(chId);
                    setSelectedTopicName('all');
                    if (chId !== 'all') {
                      const chObj = syllabus.find((c) => c.id === chId);
                      if (chObj) {
                        setSelectedSubjects([chObj.subjectId]);
                        setCustomTitle(`Chapter Mock: ${chObj.name}`);
                      }
                    }
                  }}
                  className="w-full min-h-10 px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50 text-slate-800"
                >
                  <option value="all">All Selected Subject Chapters</option>
                  {generatorChapters.map((ch) => (
                    <option key={ch.id} value={ch.id}>
                      [{SUBJECT_META[ch.subjectId].shortName}] {ch.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  4. Topic Filter (Optional — Specific Subtopic)
                </label>
                <select
                  value={selectedTopicName}
                  disabled={!activeGeneratorChapter}
                  onChange={(e) => {
                    const tName = e.target.value;
                    setSelectedTopicName(tName);
                    if (tName !== 'all' && activeGeneratorChapter) {
                      setCustomTitle(`Topic Test: ${tName} (${activeGeneratorChapter.name})`);
                    }
                  }}
                  className="w-full min-h-10 px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50 text-slate-800 disabled:opacity-50"
                >
                  <option value="all">
                    {activeGeneratorChapter ? 'All Topics in Chapter' : 'Select a chapter first'}
                  </option>
                  {activeGeneratorChapter?.topics.map((topic) => (
                    <option key={topic.id} value={topic.name}>
                      {topic.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Sliders & Options */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Questions per Subject
                </label>
                <select
                  value={questionsPerSubject}
                  onChange={(e) => setQuestionsPerSubject(Number(e.target.value))}
                  className="w-full min-h-10 px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50 text-slate-800"
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
                  className="w-full min-h-10 px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50 text-slate-800"
                >
                  <option value={10}>10 Minutes</option>
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
                  className="w-full min-h-10 px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50 text-slate-800"
                >
                  <option value="all">Balanced NEET Mix (Easy+Med+Hard)</option>
                  <option value="easy">NCERT Foundation (Easy)</option>
                  <option value="medium">Standard NEET Level (Medium)</option>
                  <option value="hard">Rank Booster (Hard)</option>
                </select>
              </div>
            </div>

            {/* PYQ Only Toggle & Custom Title */}
            <div className="space-y-3">
              <label className="flex items-center gap-2.5 text-xs font-bold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={pyqOnly}
                  onChange={(e) => setPyqOnly(e.target.checked)}
                  className="w-4 h-4 accent-blue-600 rounded"
                />
                <span>Include Only Official NEET Previous Year Questions (2015–2025 PYQs)</span>
              </label>

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
                  <span>Scope:</span>
                  <span className="font-bold text-white truncate max-w-[180px]">
                    {selectedTopicName !== 'all'
                      ? selectedTopicName
                      : activeGeneratorChapter
                        ? activeGeneratorChapter.name
                        : 'Full Selected Subjects'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-slate-800">
                  <span>Marking Pattern:</span>
                  <span className="font-bold text-emerald-400">+4 Correct, -1 Wrong, 0 Left</span>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <span>Mobile & Desktop CBT:</span>
                  <span className="font-bold text-blue-400">Enabled (1–{totalQuestions})</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleLaunchCustom}
              className="mt-6 w-full min-h-12 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg transition cursor-pointer"
            >
              <Zap className="w-4 h-4 fill-white" />
              Generate & Start CBT Exam Now
            </button>
          </div>
        </div>
      )}

      {/* TAB 4: SCHEDULED TESTS */}
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
              className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs hover:border-blue-300 transition flex flex-col md:flex-row md:items-center md:justify-between gap-4"
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

                <div className="flex items-center gap-4 text-xs text-slate-600 pt-1 flex-wrap">
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
                  className="min-h-11 flex-1 md:flex-initial justify-center px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs md:text-sm flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-white" />
                  {st.status === 'completed' ? 'Re-Attempt Test' : 'Start Test Now'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 5: ATTEMPT HISTORY & REPORTS */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {attempts
            .slice()
            .reverse()
            .map((att) => (
              <div
                key={att.id}
                className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4"
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
                  className="min-h-11 justify-center px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shrink-0"
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
