import { useEffect, useRef, useState } from 'react';
import {
  BookOpen,
  ClipboardCheck,
  Database,
  FileWarning,
  GraduationCap,
  LayoutDashboard,
  Library,
  Layers,
  Play,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { LiveTestPlayer } from './components/test-player/LiveTestPlayer';
import { TestResultModal } from './components/test-player/TestResultModal';
import {
  generateTestQuestionSet,
  INITIAL_QUESTIONS,
} from './data/neetQuestionBank';
import { INITIAL_NEET_SYLLABUS, SUBJECT_META } from './data/neetSyllabusData';
import { StudentDashboard } from './modules/dashboard/StudentDashboard';
import { PyqAndPracticeBank } from './modules/pyq/PyqAndPracticeBank';
import { MistakeNotebookAndPlanner } from './modules/revision/MistakeNotebookAndPlanner';
import { SyllabusTracker } from './modules/syllabus/SyllabusTracker';
import { StudyResources } from './modules/resources/StudyResources';
import { MockTestHub } from './modules/tests/MockTestHub';
import { BackendWorkspace } from './modules/backend/BackendWorkspace';
import { api, getApiToken } from './lib/neetApi';
import { usePersistentState } from './hooks/usePersistentState';
import type {
  ActiveTestSession,
  ChapterSyllabus,
  CompletionStatus,
  DailyTask,
  Difficulty,
  MistakeCategory,
  MistakeNotebookEntry,
  Question,
  ScheduledSeriesTest,
  SubjectId,
  TestAttemptResult,
  TestCategory,
} from './types/neet';

interface ApiQuestionRow {
  id: number;
  topic_name?: string | null;
  question_type: Question['questionType'];
  difficulty: Difficulty;
  stem: string;
  options: Question['options'];
  correct_option?: Question['correctOption'];
  explanation?: string | null;
  ncert_reference?: string | null;
  is_pyq: boolean;
  pyq_year?: number | null;
  source_label?: string | null;
  source_url?: string | null;
  source_page?: string | null;
  source_question_number?: string | null;
  review_status: Question['reviewStatus'];
  subject: { code: SubjectId; name: string };
  chapter: { slug: string; name: string };
}

interface ApiGeneratedTest {
  id: number;
  title: string;
  test_category: TestCategory;
  duration_minutes: number;
  positive_marks: number;
  negative_marks: number;
  questions: ApiQuestionRow[];
}

function mapApiQuestion(row: ApiQuestionRow): Question {
  return {
    id: String(row.id), subjectId: row.subject.code, chapterId: row.chapter.slug,
    chapterName: row.chapter.name, topicName: row.topic_name || '',
    difficulty: row.difficulty, questionType: row.question_type, stem: row.stem,
    options: row.options, correctOption: row.correct_option || 'A', explanation: row.explanation || '',
    ncertReference: row.ncert_reference || '', isPyq: row.is_pyq, pyqYear: row.pyq_year || undefined,
    sourceLabel: row.source_label || (row.is_pyq ? `NEET ${row.pyq_year || ''} PYQ` : 'Approved practice'),
    sourceUrl: row.source_url || undefined, sourcePage: row.source_page || undefined,
    sourceQuestionNumber: row.source_question_number || undefined, reviewStatus: row.review_status,
  };
}

function makeApiSession(test: ApiGeneratedTest): ActiveTestSession {
  return {
    id: `backend-${test.id}`, title: test.title, category: test.test_category,
    durationMinutes: test.duration_minutes, positiveMarks: test.positive_marks,
    negativeMarks: test.negative_marks, questions: test.questions.map(mapApiQuestion),
    startedAt: new Date().toISOString(),
  };
}

function isOfficialPyqUrl(value: string): boolean {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    return url.protocol === 'https:' && (
      host === 'nta.ac.in' || host.endsWith('.nta.ac.in') ||
      host.endsWith('.nmc.org.in') || host === 'nmc.org.in' ||
      host === 'cdnbbsr.s3waas.gov.in'
    );
  } catch {
    return false;
  }
}

function getStarterPracticeQuestions(): Question[] {
  return INITIAL_QUESTIONS
    .filter((question) => !question.id.startsWith('q-ai-pending-'))
    .map((question) => ({
      ...question,
      // These bundled examples are available for practice, but carry no verified PYQ claim.
      isPyq: false,
      pyqYear: undefined,
      sourceLabel: 'Starter practice · source not verified',
    }));
}

function getInitialSyllabus(): ChapterSyllabus[] {
  return INITIAL_NEET_SYLLABUS.map((chapter) => ({
    ...chapter,
    status: 'not_started',
    ncertReadCount: 0,
    pyqSolved: false,
    formulaSheetRevised: false,
    accuracyPercent: 0,
    topics: chapter.topics.map((topic) => ({ ...topic, completed: false })),
  }));
}

export function App() {
  const [activeNav, setActiveNav] = useState<string>('dashboard');
  const backupFileInput = useRef<HTMLInputElement>(null);

  // Core Application State
  const [syllabus, setSyllabus] = usePersistentState<ChapterSyllabus[]>(
    'neet-prep-v1/syllabus',
    getInitialSyllabus
  );
  const [officialSyllabusProgress, setOfficialSyllabusProgress] = usePersistentState<Record<string, boolean>>(
    'neet-prep-v1/official-2026-syllabus-progress', {}
  );
  const [questions, setQuestions] = usePersistentState<Question[]>(
    'neet-prep-v1/questions',
    getStarterPracticeQuestions
  );
  useEffect(() => {
    setQuestions((current) => {
      let changed = false;
      const normalized = current.map((question) => {
        const hasTraceablePyqSource = Boolean(
          question.pyqYear && question.sourceQuestionNumber && question.sourcePage &&
          question.sourceLabel && question.sourceUrl && isOfficialPyqUrl(question.sourceUrl)
        );
        if (question.isPyq && !hasTraceablePyqSource) {
          changed = true;
          return {
            ...question,
            isPyq: false,
            pyqYear: undefined,
            sourceLabel: 'Practice question · PYQ source details incomplete',
          };
        }
        return question;
      });
      return changed ? normalized : current;
    });
  }, [setQuestions]);
  const [seriesTests, setSeriesTests] = usePersistentState<ScheduledSeriesTest[]>(
    'neet-prep-v1/series-tests', []
  );
  const [attempts, setAttempts] = usePersistentState<TestAttemptResult[]>(
    'neet-prep-v1/attempts', []
  );
  const [mistakes, setMistakes] = usePersistentState<MistakeNotebookEntry[]>(
    'neet-prep-v1/mistakes', []
  );
  const [dailyTasks, setDailyTasks] = usePersistentState<DailyTask[]>(
    'neet-prep-v1/daily-tasks', []
  );
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(
    () => {
      try {
        return new Set(JSON.parse(window.localStorage.getItem('neet-prep-v1/bookmarks') || '[]'));
      } catch {
        return new Set();
      }
    }
  );
  useEffect(() => {
    window.localStorage.setItem('neet-prep-v1/bookmarks', JSON.stringify([...bookmarkedIds]));
  }, [bookmarkedIds]);

  const [backendUser, setBackendUser] = useState<{ id: number; name: string; email: string; role: string } | null>(null);
  const [backendStateReady, setBackendStateReady] = useState(false);
  const localWorkspaceRef = useRef({ syllabus, officialSyllabusProgress, attempts, seriesTests, mistakes, dailyTasks, bookmarks: [...bookmarkedIds] });
  localWorkspaceRef.current = { syllabus, officialSyllabusProgress, attempts, seriesTests, mistakes, dailyTasks, bookmarks: [...bookmarkedIds] };
  const backendOwnerIdRef = useRef<number | null>(null);
  const forceEmptyWorkspaceRef = useRef(false);
  const resetAccountWorkspace = () => {
    setSyllabus(getInitialSyllabus()); setOfficialSyllabusProgress({}); setAttempts([]);
    setSeriesTests([]); setMistakes([]); setDailyTasks([]); setBookmarkedIds(new Set());
  };

  useEffect(() => {
    let active = true;
    const hydrateFromBackend = async () => {
      setBackendStateReady(false);
      const token = getApiToken();
      if (!token) {
        if (backendOwnerIdRef.current !== null) {
          resetAccountWorkspace(); backendOwnerIdRef.current = null; forceEmptyWorkspaceRef.current = true;
        }
        setBackendUser(null); return;
      }
      try {
        const { user } = await api<{ user: { id: number; name: string; email: string; role: string } }>('/auth/me');
        if (!active) return;
        if (backendOwnerIdRef.current !== null && backendOwnerIdRef.current !== user.id) {
          resetAccountWorkspace(); forceEmptyWorkspaceRef.current = true;
        }
        backendOwnerIdRef.current = user.id;
        setBackendUser(user);
        if (user.role !== 'student') { resetAccountWorkspace(); forceEmptyWorkspaceRef.current = true; return; }
        const [workspaceResult, firstQuestionPage, attemptPage, syllabusResult] = await Promise.all([
          api<{ data: Record<string, unknown> | null }>('/student/workspace'),
          api<{ data: ApiQuestionRow[]; last_page: number }>('/questions?per_page=100&page=1'),
          api<{ data: { data: TestAttemptResult[] } }>('/attempts'),
          api<{ subjects: { chapters: { id: number; slug: string }[] }[] }>('/syllabus'),
        ]);
        backendUnitChapterIds.current = Object.fromEntries(syllabusResult.subjects.flatMap((subject) => subject.chapters.map((chapter) => [chapter.slug, chapter.id])));
        let apiQuestions = firstQuestionPage.data || [];
        for (let page = 2; page <= Math.min(firstQuestionPage.last_page || 1, 50); page++) {
          const next = await api<{ data: ApiQuestionRow[] }>(`/questions?per_page=100&page=${page}`);
          apiQuestions = apiQuestions.concat(next.data || []);
        }
        if (!active) return;
        const saved = workspaceResult.data;
        if (saved) {
          if (Array.isArray(saved.syllabus) && saved.syllabus.length) setSyllabus(saved.syllabus as ChapterSyllabus[]);
          if (saved.official_syllabus_progress && typeof saved.official_syllabus_progress === 'object') setOfficialSyllabusProgress(saved.official_syllabus_progress as Record<string, boolean>);
          if (Array.isArray(saved.daily_tasks)) setDailyTasks(saved.daily_tasks as DailyTask[]);
          if (Array.isArray(saved.mistakes)) setMistakes(saved.mistakes as MistakeNotebookEntry[]);
          if (Array.isArray(saved.series_tests)) setSeriesTests(saved.series_tests as ScheduledSeriesTest[]);
          const localAttempts = Array.isArray(saved.attempts) ? saved.attempts as TestAttemptResult[] : [];
          const serverAttempts = attemptPage.data?.data || [];
          setAttempts([...localAttempts, ...serverAttempts.slice(0, 10)].filter((item, index, items) => items.findIndex((other) => other.id === item.id) === index).slice(-10));
          if (Array.isArray(saved.bookmarks)) setBookmarkedIds(new Set(saved.bookmarks.map(String)));
          forceEmptyWorkspaceRef.current = false;
        } else {
          const current = forceEmptyWorkspaceRef.current ? {
            syllabus: getInitialSyllabus(), officialSyllabusProgress: {}, attempts: [], seriesTests: [],
            mistakes: [], dailyTasks: [], bookmarks: [],
          } : localWorkspaceRef.current;
          await api('/student/workspace', { method: 'PATCH', body: JSON.stringify({
            syllabus: current.syllabus, official_syllabus_progress: current.officialSyllabusProgress,
            attempts: current.attempts.filter((attempt) => !/^\d+$/.test(attempt.testId)), series_tests: current.seriesTests, mistakes: current.mistakes,
            daily_tasks: current.dailyTasks, bookmarks: current.bookmarks,
          }) });
          if (!active) return;
          forceEmptyWorkspaceRef.current = false;
        }
        const backendQuestionBank = apiQuestions.map(mapApiQuestion);
        const knownQuestionText = new Set(backendQuestionBank.map((question) => question.stem.toLowerCase().replace(/\s+/g, ' ').trim()));
        const bundledPractice = getStarterPracticeQuestions().filter((question) => !knownQuestionText.has(question.stem.toLowerCase().replace(/\s+/g, ' ').trim()));
        setQuestions([...backendQuestionBank, ...bundledPractice]);
        setBackendStateReady(true);
      } catch (error) {
        if (active) {
          if (backendOwnerIdRef.current !== null) { resetAccountWorkspace(); backendOwnerIdRef.current = null; forceEmptyWorkspaceRef.current = true; }
          setBackendUser(null);
          setBackendStateReady(false);
          console.error('Backend workspace sync failed.', error);
        }
      }
    };
    void hydrateFromBackend();
    window.addEventListener('neet-auth-changed', hydrateFromBackend);
    return () => { active = false; window.removeEventListener('neet-auth-changed', hydrateFromBackend); };
  }, [setAttempts, setDailyTasks, setMistakes, setOfficialSyllabusProgress, setQuestions, setSeriesTests, setSyllabus]);

  useEffect(() => {
    if (!backendStateReady || backendUser?.role !== 'student') return;
    const timer = window.setTimeout(() => {
      void api('/student/workspace', { method: 'PATCH', body: JSON.stringify({
        syllabus, official_syllabus_progress: officialSyllabusProgress, attempts: attempts.filter((attempt) => !/^\d+$/.test(attempt.testId)),
        series_tests: seriesTests, mistakes, daily_tasks: dailyTasks,
        bookmarks: [...bookmarkedIds],
      }) }).catch((error) => console.error('Could not save student workspace.', error));
    }, 500);
    return () => window.clearTimeout(timer);
  }, [backendStateReady, backendUser, syllabus, officialSyllabusProgress, attempts, seriesTests, mistakes, dailyTasks, bookmarkedIds]);

  const downloadBackup = () => {
    const backup = {
      version: 1,
      createdAt: new Date().toISOString(),
      syllabus,
      officialSyllabusProgress,
      questions,
      seriesTests,
      attempts,
      mistakes,
      dailyTasks,
      bookmarks: [...bookmarkedIds],
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `neet-prep-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const restoreBackup = async (file?: File) => {
    if (!file) return;
    try {
      const backup = JSON.parse(await file.text());
      if (backup.version !== 1 || !Array.isArray(backup.syllabus) || !Array.isArray(backup.questions)) {
        throw new Error('Unsupported backup format.');
      }
      setSyllabus(backup.syllabus);
      setOfficialSyllabusProgress(
        backup.officialSyllabusProgress && typeof backup.officialSyllabusProgress === 'object'
          ? backup.officialSyllabusProgress
          : {}
      );
      setQuestions(backup.questions);
      setSeriesTests(Array.isArray(backup.seriesTests) ? backup.seriesTests : []);
      setAttempts(Array.isArray(backup.attempts) ? backup.attempts : []);
      setMistakes(Array.isArray(backup.mistakes) ? backup.mistakes : []);
      setDailyTasks(Array.isArray(backup.dailyTasks) ? backup.dailyTasks : []);
      setBookmarkedIds(new Set(Array.isArray(backup.bookmarks) ? backup.bookmarks : []));
      window.alert('Backup restored. Refresh the page if the browser does not immediately show every change.');
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Could not read this backup file.');
    }
    if (backupFileInput.current) backupFileInput.current.value = '';
  };

  // Active CBT Exam & Scorecard Modal State
  const [activeTestSession, setActiveTestSession] = usePersistentState<ActiveTestSession | null>(
    'neet-prep-v1/active-session', null
  );
  const [inspectedAttempt, setInspectedAttempt] = useState<TestAttemptResult | null>(null);
  const backendUnitChapterIds = useRef<Record<string, number>>({});
  const activeTestOwnerRef = useRef<number | null>(null);
  useEffect(() => {
    const studentId = backendUser?.role === 'student' ? backendUser.id : null;
    if (activeTestOwnerRef.current !== studentId) {
      setActiveTestSession(null);
      setInspectedAttempt(null);
    }
    activeTestOwnerRef.current = studentId;
  }, [backendUser, setActiveTestSession]);

  const launchBackendTest = async (config: Record<string, unknown>, onQuestionShortage?: () => void) => {
    try {
      const response = await api<{ data: ApiGeneratedTest }>('/tests/generate', {
        method: 'POST', body: JSON.stringify(config),
      });
      setActiveTestSession(makeApiSession(response.data));
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      if (onQuestionShortage && /approved question|question bank|sourced question/i.test(message)) {
        window.alert('The backend bank does not have enough approved questions yet. Starting a clearly labelled local starter practice mock; its attempt will still be saved to your account.');
        onQuestionShortage();
        return;
      }
      window.alert(error instanceof Error ? error.message : 'Backend could not create this test.');
    }
  };

  // Bookmark toggle
  const handleToggleBookmark = (questionId: string) => {
    setBookmarkedIds((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) {
        next.delete(questionId);
      } else {
        next.add(questionId);
      }
      return next;
    });
  };

  // Syllabus handlers
  const handleUpdateChapterStatus = (chapterId: string, status: CompletionStatus) => {
    setSyllabus((prev) =>
      prev.map((ch) => (ch.id === chapterId ? { ...ch, status } : ch))
    );
  };

  const handleToggleOfficialSyllabusUnit = (unitId: string) => {
    setOfficialSyllabusProgress((current) => ({
      ...current,
      [unitId]: !current[unitId],
    }));
  };

  const handleToggleTopicCompleted = (chapterId: string, topicId: string) => {
    setSyllabus((prev) =>
      prev.map((ch) => {
        if (ch.id !== chapterId) return ch;
        return {
          ...ch,
          topics: ch.topics.map((t) =>
            t.id === topicId ? { ...t, completed: !t.completed } : t
          ),
        };
      })
    );
  };

  const handleIncrementNcertRead = (chapterId: string) => {
    setSyllabus((prev) =>
      prev.map((ch) =>
        ch.id === chapterId ? { ...ch, ncertReadCount: ch.ncertReadCount + 1 } : ch
      )
    );
  };

  const handleToggleChapterFlag = (
    chapterId: string,
    field: 'pyqSolved' | 'formulaSheetRevised'
  ) => {
    setSyllabus((prev) =>
      prev.map((ch) =>
        ch.id === chapterId ? { ...ch, [field]: !ch[field] } : ch
      )
    );
  };

  // Daily planner handlers
  const handleToggleDailyTask = (taskId: string) => {
    setDailyTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t))
    );
  };

  const handleAddDailyTask = (title: string, subjectId: SubjectId) => {
    setDailyTasks((prev) => [
      ...prev,
      {
        id: `task-${Date.now()}`,
        title,
        subjectId,
        type: 'pyq_practice',
        durationMinutes: 45,
        completed: false,
      },
    ]);
  };

  // Quick Test Launchers
  const handleQuickStartTest = (
    preset: 'full_180' | 'quick_20' | 'weak_chapters' | 'pyq_sprint'
  ) => {
    const startLocalStarterMock = () => {
      const localQuestions = questions.filter((question) => !/^\d+$/.test(question.id));
      const qs = generateTestQuestionSet({
        allQuestions: localQuestions,
        subjects: ['physics', 'chemistry', 'botany', 'zoology'],
        questionsPerSubject: 5,
      });
      if (!ensureQuestionCount(qs, 20)) return;
      setActiveTestSession({
        id: `test-local-starter-${Date.now()}`,
        title: 'Starter Practice Mock · 20 Questions',
        category: 'minor_test', durationMinutes: 25, positiveMarks: 4, negativeMarks: 1,
        questions: qs, startedAt: new Date().toISOString(),
      });
    };
    if (getApiToken() && preset !== 'weak_chapters') {
      if (preset === 'full_180') {
        void launchBackendTest({ mode: 'full', test_category: 'full_syllabus', title: 'Full NEET 2026 Pattern Mock', question_count: 180, subject_counts: { physics: 45, chemistry: 45, botany: 45, zoology: 45 }, duration_minutes: 180 });
      } else if (preset === 'quick_20') {
        void launchBackendTest({ mode: 'custom', test_category: 'minor_test', title: 'Instant 20 Question Mock', question_count: 20, subject_counts: { physics: 5, chemistry: 5, botany: 5, zoology: 5 }, duration_minutes: 25 }, startLocalStarterMock);
      } else {
        void launchBackendTest({ mode: 'pyq', test_category: 'pyq_test', title: 'Sourced NEET PYQ Sprint', question_count: 20, duration_minutes: 25, pyq_only: true });
      }
      return;
    }
    if (preset === 'full_180') {
      const qs = generateTestQuestionSet({
        allQuestions: questions,
        subjects: ['physics', 'chemistry', 'botany', 'zoology'],
        questionsPerSubject: 45,
      });
      if (!ensureQuestionCount(qs, 180)) return;
      setActiveTestSession({
        id: `test-full-${Date.now()}`,
        title: 'Full Syllabus NEET Mock Test (180 Questions)',
        category: 'full_syllabus',
        durationMinutes: 180,
        positiveMarks: 4,
        negativeMarks: 1,
        questions: qs,
        startedAt: new Date().toISOString(),
      });
    } else if (preset === 'quick_20') {
      const qs = generateTestQuestionSet({
        allQuestions: questions,
        subjects: ['physics', 'chemistry', 'botany', 'zoology'],
        questionsPerSubject: 5,
      });
      if (!ensureQuestionCount(qs, 20)) return;
      setActiveTestSession({
        id: `test-quick-${Date.now()}`,
        title: 'High-Yield 4-Subject NEET Revision Mock (20 Qs · 80 Marks)',
        category: 'minor_test',
        durationMinutes: 25,
        positiveMarks: 4,
        negativeMarks: 1,
        questions: qs,
        startedAt: new Date().toISOString(),
      });
    } else if (preset === 'weak_chapters') {
      const wasChapterAttempted = (chapterId: string) => attempts.some((attempt) =>
        attempt.questions.some((question) =>
          question.chapterId === chapterId && Boolean(attempt.responses[question.id]?.selectedOption)
        )
      );
      const weakIds = syllabus
        .filter((c) => c.status === 'needs_revision' ||
          (wasChapterAttempted(c.id) && c.accuracyPercent < 75)
        )
        .map((c) => c.id);
      const qs = generateTestQuestionSet({
        allQuestions: questions,
        subjects: ['physics', 'chemistry', 'botany', 'zoology'],
        questionsPerSubject: 4,
        chapterIds: weakIds,
      });
      if (!ensureQuestionCount(qs, 16)) return;
      setActiveTestSession({
        id: `test-weak-${Date.now()}`,
        title: 'Targeted Weak-Chapters Improvement Mock Test',
        category: 'chapter_test',
        durationMinutes: 20,
        positiveMarks: 4,
        negativeMarks: 1,
        questions: qs,
        startedAt: new Date().toISOString(),
      });
    } else if (preset === 'pyq_sprint') {
      const qs = generateTestQuestionSet({
        allQuestions: questions,
        subjects: ['physics', 'chemistry', 'botany', 'zoology'],
        questionsPerSubject: 5,
        pyqOnly: true,
      });
      if (!ensureQuestionCount(qs, 20)) return;
      setActiveTestSession({
        id: `test-pyq-${Date.now()}`,
        title: 'NEET Previous Year Questions (PYQ) Sprint Test',
        category: 'pyq_test',
        durationMinutes: 25,
        positiveMarks: 4,
        negativeMarks: 1,
        questions: qs,
        startedAt: new Date().toISOString(),
      });
    }
  };

  function ensureQuestionCount(questionSet: Question[], required: number): boolean {
    if (questionSet.length === required) return true;
    window.alert(
      `Is test ke liye ${required} approved questions chahiye, lekin selection mein ${questionSet.length} mile. Content & Questions panel mein verified questions add/import karein. Test ko adhura ya duplicate questions se nahi banaya gaya.`
    );
    return false;
  }

  const handleStartChapterTest = (chapter: ChapterSyllabus) => {
    const qs = generateTestQuestionSet({
      allQuestions: questions,
      subjects: [chapter.subjectId],
      questionsPerSubject: 10,
      chapterIds: [chapter.id],
    });
    if (!ensureQuestionCount(qs, 10)) return;
    setActiveTestSession({
      id: `test-ch-${chapter.id}-${Date.now()}`,
      title: `Chapter Test: ${chapter.name} (${SUBJECT_META[chapter.subjectId].name})`,
      category: 'chapter_test',
      durationMinutes: 15,
      positiveMarks: 4,
      negativeMarks: 1,
      questions: qs,
      startedAt: new Date().toISOString(),
    });
  };

  const handleStartOfficialUnitTest = (unitId: string, subjectId: SubjectId, unitName: string) => {
    const backendChapterId = backendUnitChapterIds.current[`${unitId}-${subjectId}`];
    if (getApiToken() && backendChapterId) {
      void launchBackendTest({ mode: 'chapter', test_category: 'chapter_test', subject: subjectId, chapter_id: backendChapterId, question_count: 10, duration_minutes: 20, title: `${unitName} · ${SUBJECT_META[subjectId].name} Unit Test` });
      return;
    }
    const qs = generateTestQuestionSet({
      allQuestions: questions,
      subjects: [subjectId],
      questionsPerSubject: 10,
      chapterIds: [unitId],
    });
    if (!ensureQuestionCount(qs, 10)) return;
    setActiveTestSession({
      id: `test-official-unit-${unitId}-${subjectId}-${Date.now()}`,
      title: `NEET 2026 Syllabus Unit: ${unitName} · ${SUBJECT_META[subjectId].name}`,
      category: 'chapter_test',
      durationMinutes: 15,
      positiveMarks: 4,
      negativeMarks: 1,
      questions: qs,
      startedAt: new Date().toISOString(),
    });
  };

  const handleStartCustomTest = (config: {
    title: string;
    category: TestCategory;
    subjects: SubjectId[];
    questionsPerSubject: number;
    durationMinutes: number;
    pyqOnly: boolean;
    difficultyFilter: 'all' | Difficulty;
  }) => {
    if (getApiToken()) {
      const subjectCounts = Object.fromEntries(config.subjects.map((subject) => [subject, config.questionsPerSubject]));
      void launchBackendTest({
        mode: config.pyqOnly ? 'pyq' : 'custom', test_category: config.category,
        title: config.title, subject_counts: subjectCounts,
        question_count: config.subjects.length * config.questionsPerSubject,
        duration_minutes: config.durationMinutes, pyq_only: config.pyqOnly,
        ...(config.difficultyFilter !== 'all' ? { difficulty: config.difficultyFilter } : {}),
      });
      return;
    }
    const qs = generateTestQuestionSet({
      allQuestions: questions,
      subjects: config.subjects,
      questionsPerSubject: config.questionsPerSubject,
      pyqOnly: config.pyqOnly,
      difficultyFilter: config.difficultyFilter,
    });
    if (!ensureQuestionCount(qs, config.subjects.length * config.questionsPerSubject)) return;
    setActiveTestSession({
      id: `test-custom-${Date.now()}`,
      title: config.title,
      category: config.category,
      durationMinutes: config.durationMinutes,
      positiveMarks: 4,
      negativeMarks: 1,
      questions: qs,
      startedAt: new Date().toISOString(),
    });
  };

  const handleStartSeriesTest = (seriesTest: ScheduledSeriesTest) => {
    const qPerSubj = Math.max(
      1,
      Math.floor(seriesTest.questionCount / Math.max(1, seriesTest.subjects.length))
    );
    const qs = generateTestQuestionSet({
      allQuestions: questions,
      subjects: seriesTest.subjects,
      questionsPerSubject: qPerSubj,
      chapterIds: seriesTest.chapterIds,
    });
    if (!ensureQuestionCount(qs, seriesTest.questionCount)) return;
    setActiveTestSession({
      id: seriesTest.id,
      title: `${seriesTest.code}: ${seriesTest.title}`,
      category:
        seriesTest.seriesType === 'Major Full Test' ? 'full_syllabus' : 'minor_test',
      durationMinutes: seriesTest.durationMinutes,
      positiveMarks: 4,
      negativeMarks: 1,
      questions: qs,
      startedAt: new Date().toISOString(),
    });
  };

  const handleStartMistakeRevisionTest = () => {
    const mistakeQuestions = mistakes.map((m) => m.question);
    const pool =
      mistakeQuestions.length > 0
        ? mistakeQuestions
        : questions.filter((q) => q.reviewStatus === 'approved').slice(0, 10);
    if (pool.length === 0) {
      window.alert('Abhi revision ke liye koi saved mistake ya approved question nahi hai.');
      return;
    }
    if (getApiToken() && pool.every((question) => /^\d+$/.test(question.id))) {
      void launchBackendTest({ mode: 'mistake_revision', test_category: 'mistake_revision', title: `Mistake Revision (${pool.length} questions)`, question_ids: pool.map((question) => Number(question.id)), question_count: pool.length, duration_minutes: Math.max(10, pool.length * 2) });
      return;
    }
    setActiveTestSession({
      id: `test-mistakes-${Date.now()}`,
      title: `Mistake Notebook Re-Attempt Test (${pool.length} Error Questions)`,
      category: 'mistake_revision',
      durationMinutes: Math.max(10, pool.length * 2),
      positiveMarks: 4,
      negativeMarks: 1,
      questions: pool,
      startedAt: new Date().toISOString(),
    });
  };

  // Submit Live CBT Test
  const handleSubmitTest = async (result: TestAttemptResult) => {
    let finalResult = result;
    const backendTest = /^backend-(\d+)$/.exec(result.testId);
    if (backendTest) {
      try {
        const responseMap = Object.fromEntries(Object.entries(result.responses).map(([id, response]) => [id, response.selectedOption]));
        const saved = await api<{
          data: { id: number; generated_test_id: number; correct_count: number; incorrect_count: number; unattempted_count: number; total_score: number; max_score: number; accuracy_percent: number; subject_breakdowns: Record<string, { subject_id: string; subject_name: string; total: number; correct: number; incorrect: number; unattempted: number; score: number }> };
          review: { question_id: number; correct_option: Question['correctOption']; explanation?: string }[];
        }>(`/tests/${backendTest[1]}/submit`, { method: 'POST', body: JSON.stringify({ responses: responseMap, time_taken_seconds: result.timeTakenSeconds }) });
        const keys = new Map(saved.review.map((item) => [String(item.question_id), item]));
        const questions = result.questions.map((question) => {
          const key = keys.get(question.id);
          return key ? { ...question, correctOption: key.correct_option, explanation: key.explanation || '' } : question;
        });
        const subjectBreakdowns = Object.values(saved.data.subject_breakdowns).map((row) => ({
          subjectId: row.subject_id as SubjectId, subjectName: row.subject_name,
          totalQuestions: row.total, correct: row.correct, incorrect: row.incorrect,
          unattempted: row.unattempted, score: row.score, maxScore: row.total * 4,
          accuracy: row.correct + row.incorrect ? Math.round(row.correct / (row.correct + row.incorrect) * 1000) / 10 : 0,
          timeSpentSeconds: 0,
        }));
        finalResult = {
          ...result, id: `attempt-${saved.data.id}`, testId: String(saved.data.generated_test_id),
          attemptedAt: new Date().toLocaleString('en-IN'), questions,
          correctCount: saved.data.correct_count, incorrectCount: saved.data.incorrect_count,
          unattemptedCount: saved.data.unattempted_count, totalScore: saved.data.total_score,
          maxScore: saved.data.max_score, accuracyPercent: Number(saved.data.accuracy_percent),
          subjectBreakdowns,
        };
      } catch (error) {
        window.alert(error instanceof Error ? error.message : 'Could not save the test result. Keep this test open and retry.');
        return;
      }
    }
    setAttempts((prev) => [...prev.filter((attempt) => attempt.id !== finalResult.id), finalResult].slice(-10));
    setSyllabus((prev) => prev.map((chapter) => {
      const chapterQuestions = finalResult.questions.filter((question) => question.chapterId === chapter.id);
      const attempted = chapterQuestions.filter((question) => finalResult.responses[question.id]?.selectedOption);
      if (attempted.length === 0) return chapter;
      const correct = attempted.filter(
        (question) => finalResult.responses[question.id]?.selectedOption === question.correctOption
      ).length;
      return { ...chapter, accuracyPercent: Math.round((correct / attempted.length) * 100) };
    }));
    setSeriesTests((prev) => prev.map((st) => st.id === finalResult.testId ? { ...st, status: 'completed', lastScore: finalResult.totalScore } : st));
    setActiveTestSession(null);
    setInspectedAttempt(finalResult);
  };

  // Mistake Notebook handlers
  const handleAddMistakeToNotebook = (
    question: Question,
    selectedOption: 'A' | 'B' | 'C' | 'D' | null,
    category: MistakeCategory,
    note: string,
    testTitle: string
  ) => {
    setMistakes((prev) => {
      const existingIdx = prev.findIndex((m) => m.question.id === question.id);
      if (existingIdx !== -1) {
        const updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          selectedOption,
          category,
          userNote: note,
          resolved: false,
          repeatCount: updated[existingIdx].repeatCount + 1,
        };
        return updated;
      }
      return [
        {
          id: `mistake-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          question,
          selectedOption,
          category,
          userNote: note,
          testTitle,
          addedAt: new Date().toLocaleDateString(),
          resolved: false,
          repeatCount: 1,
        },
        ...prev,
      ];
    });
  };

  const handleToggleMistakeResolved = (mistakeId: string) => {
    setMistakes((prev) =>
      prev.map((m) => (m.id === mistakeId ? { ...m, resolved: !m.resolved } : m))
    );
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'syllabus', label: 'NEET Syllabus', icon: BookOpen },
    { id: 'tests', label: 'Mock Test Engine', icon: ClipboardCheck },
    { id: 'pyq', label: 'PYQ & Practice Bank', icon: Layers },
    { id: 'resources', label: 'Study Resources', icon: Library },
    {
      id: 'revision',
      label: 'Mistake Notebook',
      icon: FileWarning,
      badge: mistakes.filter((m) => !m.resolved).length,
    },
    {
      id: 'admin',
      label: 'Admin & AI Studio',
      icon: Database,
      badge: questions.filter((q) => q.reviewStatus === 'pending_review').length,
    },
  ];

  return (
    <div className="neet-app-shell min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Top Global Navigation Bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xs border-b border-slate-200 px-4 lg:px-8 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shadow-sm font-black text-lg">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-slate-900">
                NEET PREP PRO
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                TARGET 2027 · DROPPER
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              Personal NEET preparation workspace | tests | practice | revision
            </p>
          </div>
        </div>

        {/* Center Navigation Pills */}
        <nav className="hidden 2xl:flex items-center gap-1 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/70">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeNav === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveNav(item.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                      isActive ? 'bg-rose-500 text-white' : 'bg-rose-100 text-rose-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Quick Launch CTA */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={downloadBackup}
            className="hidden md:inline-flex px-3 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs"
          >
            Backup
          </button>
          <label className="hidden md:inline-flex px-3 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs cursor-pointer">
            Restore
            <input ref={backupFileInput} type="file" accept="application/json,.json" className="hidden" onChange={(event) => void restoreBackup(event.target.files?.[0])} />
          </label>
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>{backendUser ? (backendStateReady ? 'Progress saved to your account' : 'Syncing account progress…') : 'Progress saved in this browser'}</span>
          </div>

          <button
            onClick={() => handleQuickStartTest('quick_20')}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            Start Instant Mock
          </button>
        </div>
      </header>

      {/* Mobile / Tablet Navigation Bar */}
      <div className="2xl:hidden bg-white border-b border-slate-200 px-4 py-2 flex items-center gap-2 overflow-x-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeNav === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveNav(item.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeNav === 'dashboard' && (
          <StudentDashboard
            syllabus={syllabus}
            attempts={attempts}
            mistakes={mistakes}
            dailyTasks={dailyTasks}
            onToggleDailyTask={handleToggleDailyTask}
            onAddDailyTask={handleAddDailyTask}
            onQuickStartTest={handleQuickStartTest}
            onNavigateTab={setActiveNav}
            onInspectAttempt={setInspectedAttempt}
          />
        )}

        {activeNav === 'syllabus' && (
          <SyllabusTracker
            syllabus={syllabus}
            officialSyllabusProgress={officialSyllabusProgress}
            onToggleOfficialSyllabusUnit={handleToggleOfficialSyllabusUnit}
            onStartOfficialUnitTest={handleStartOfficialUnitTest}
            onUpdateChapterStatus={handleUpdateChapterStatus}
            onToggleTopicCompleted={handleToggleTopicCompleted}
            onIncrementNcertRead={handleIncrementNcertRead}
            onToggleChapterFlag={handleToggleChapterFlag}
            onStartChapterTest={handleStartChapterTest}
          />
        )}

        {activeNav === 'tests' && (
          <>
          <BackendWorkspace mode="student" onStartTest={setActiveTestSession} />
          {!backendUser && <MockTestHub
            seriesTests={seriesTests}
            attempts={attempts}
            onStartCustomTest={handleStartCustomTest}
            onStartSeriesTest={handleStartSeriesTest}
            onInspectAttempt={setInspectedAttempt}
          />}
          </>
        )}

        {activeNav === 'pyq' && (
          <PyqAndPracticeBank
            questions={questions}
            bookmarkedIds={bookmarkedIds}
            onToggleBookmark={handleToggleBookmark}
            onAddMistakeToNotebook={handleAddMistakeToNotebook}
          />
        )}

        {activeNav === 'resources' && <StudyResources />}

        {activeNav === 'revision' && (
          <MistakeNotebookAndPlanner
            mistakes={mistakes}
            onToggleMistakeResolved={handleToggleMistakeResolved}
            onStartMistakeRevisionTest={handleStartMistakeRevisionTest}
          />
        )}

        {activeNav === 'admin' && (
          <BackendWorkspace mode="admin" onStartTest={setActiveTestSession} />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 px-6 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between max-w-7xl w-full mx-auto">
        <div className="flex items-center gap-2 font-semibold text-slate-700">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          NEET Prep Pro 2027 — Personal Dropper Test Series & Learning Platform
        </div>
        <div>
          Pattern: 180 Questions (45 PHY + 45 CHEM + 45 BOT + 45 ZOO) · 720 Marks (+4 / -1)
        </div>
      </footer>

      {/* Full-Screen NEET Practice Test */}
      {activeTestSession && (
        <LiveTestPlayer
          session={activeTestSession}
          onSubmitTest={handleSubmitTest}
          onExitWithoutSubmit={() => setActiveTestSession(null)}
          onToggleBookmark={handleToggleBookmark}
          bookmarkedIds={bookmarkedIds}
        />
      )}

      {/* Instant Scorecard & Solutions Modal */}
      {inspectedAttempt && (
        <TestResultModal
          result={inspectedAttempt}
          onClose={() => setInspectedAttempt(null)}
          onAddMistakeToNotebook={handleAddMistakeToNotebook}
        />
      )}
    </div>
  );
}

export default App;
