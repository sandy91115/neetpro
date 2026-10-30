export type SubjectId = 'physics' | 'chemistry' | 'botany' | 'zoology';

export type CompletionStatus = 'not_started' | 'in_progress' | 'completed' | 'needs_revision';

export type Difficulty = 'easy' | 'medium' | 'hard';

export type QuestionType = 'single_correct' | 'assertion_reason' | 'statement_based';

export type MistakeCategory = 'conceptual' | 'calculation' | 'silly';

export type QuestionReviewStatus = 'approved' | 'pending_review' | 'rejected';

export interface TopicItem {
  id: string;
  name: string;
  completed: boolean;
}

export interface ChapterSyllabus {
  id: string;
  subjectId: SubjectId;
  classLevel: '11th' | '12th';
  unitName: string;
  name: string;
  weightagePercent: number;
  expectedQuestions: number;
  highYield: boolean;
  status: CompletionStatus;
  ncertReadCount: number;
  pyqSolved: boolean;
  formulaSheetRevised: boolean;
  accuracyPercent: number;
  topics: TopicItem[];
}

export interface QuestionOption {
  id: 'A' | 'B' | 'C' | 'D';
  text: string;
}

export interface Question {
  id: string;
  subjectId: SubjectId;
  chapterId: string;
  chapterName: string;
  topicName: string;
  difficulty: Difficulty;
  questionType: QuestionType;
  stem: string;
  options: QuestionOption[];
  correctOption: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  ncertReference: string;
  isPyq: boolean;
  pyqYear?: number;
  sourceLabel: string; // e.g., "NEET 2024", "NEET 2023", "NCERT Exemplar", "AI Generated"
  sourceUrl?: string;
  sourcePage?: string;
  sourceQuestionNumber?: string;
  reviewStatus: QuestionReviewStatus;
  bookmarked?: boolean;
}

export type PaletteStatus =
  | 'not_visited'
  | 'not_answered'
  | 'answered'
  | 'marked_for_review'
  | 'answered_marked_for_review';

export interface QuestionResponseState {
  questionId: string;
  selectedOption: 'A' | 'B' | 'C' | 'D' | null;
  status: PaletteStatus;
  timeSpentSeconds: number;
}

export type TestCategory =
  | 'full_syllabus'
  | 'minor_test'
  | 'semi_major'
  | 'major_test'
  | 'subject_test'
  | 'chapter_test'
  | 'pyq_test'
  | 'mistake_revision';

export interface ActiveTestSession {
  id: string;
  title: string;
  category: TestCategory;
  durationMinutes: number;
  positiveMarks: number;
  negativeMarks: number;
  questions: Question[];
  startedAt: string;
}

export interface SubjectScoreBreakdown {
  subjectId: SubjectId;
  subjectName: string;
  totalQuestions: number;
  correct: number;
  incorrect: number;
  unattempted: number;
  score: number;
  maxScore: number;
  accuracy: number;
  timeSpentSeconds: number;
}

export interface TestAttemptResult {
  id: string;
  testId: string;
  testTitle: string;
  category: TestCategory;
  attemptedAt: string;
  durationMinutes: number;
  timeTakenSeconds: number;
  totalQuestions: number;
  correctCount: number;
  incorrectCount: number;
  unattemptedCount: number;
  totalScore: number;
  maxScore: number;
  accuracyPercent: number;
  predictedAir: number;
  percentile: number;
  subjectBreakdowns: SubjectScoreBreakdown[];
  responses: Record<string, QuestionResponseState>;
  questions: Question[];
}

export interface MistakeNotebookEntry {
  id: string;
  question: Question;
  selectedOption: 'A' | 'B' | 'C' | 'D' | null;
  category: MistakeCategory;
  userNote: string;
  testTitle: string;
  addedAt: string;
  resolved: boolean;
  repeatCount: number;
}

export interface DailyTask {
  id: string;
  title: string;
  subjectId: SubjectId;
  type: 'ncert_revision' | 'pyq_practice' | 'mock_analysis' | 'formula_drill';
  durationMinutes: number;
  completed: boolean;
}

export interface ScheduledSeriesTest {
  id: string;
  code: string;
  title: string;
  seriesType: 'Minor Test' | 'Semi-Major Test' | 'Major Full Test' | 'AIOT (All India Open Test)';
  syllabusSummary: string;
  questionCount: number;
  maxMarks: number;
  durationMinutes: number;
  scheduledDate: string;
  status: 'completed' | 'available' | 'upcoming';
  lastScore?: number;
  subjects: SubjectId[];
  chapterIds?: string[];
}

