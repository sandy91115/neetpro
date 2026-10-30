import React, { useState } from 'react';
import {
  CheckCircle2,
  Database,
  FileSpreadsheet,
  Plus,
  ShieldAlert,
  Trash2,
} from 'lucide-react';
import { SUBJECT_META } from '../../data/neetSyllabusData';
import { OFFICIAL_NEET_2026_SYLLABUS } from '../../data/officialNeet2026Syllabus';
import type { ChapterSyllabus, Question, SubjectId } from '../../types/neet';

function parseCsvRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"' && quoted && text[i + 1] === '"') {
      cell += '"';
      i++;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === ',' && !quoted) {
      row.push(cell.trim());
      cell = '';
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && text[i + 1] === '\n') i++;
      row.push(cell.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += char;
    }
  }
  row.push(cell.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

function isOfficialExamSource(value: string): boolean {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    return url.protocol === 'https:' && (
      host === 'nta.ac.in' || host.endsWith('.nta.ac.in') ||
      host === 'neet.nta.nic.in' || host.endsWith('.nmc.org.in') || host === 'nmc.org.in' ||
        host === 'cdnbbsr.s3waas.gov.in'
    );
  } catch {
    return false;
  }
}

function normalizeQuestionStem(value: string): string {
  return value.toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}

interface AdminPanelProps {
  syllabus: ChapterSyllabus[];
  questions: Question[];
  onApproveQuestion: (questionId: string) => void;
  onRejectQuestion: (questionId: string) => void;
  onAddNewQuestion: (question: Question) => void;
  onAddTopicToChapter: (chapterId: string, topicName: string) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  syllabus,
  questions,
  onApproveQuestion,
  onRejectQuestion,
  onAddNewQuestion,
  onAddTopicToChapter,
}) => {
  const [adminTab, setAdminTab] = useState<'syllabus_seeder' | 'ai_generator' | 'manual_import'>(
    'syllabus_seeder'
  );

  // Question review and import state
  const [aiToast, setAiToast] = useState<string>('');

  // Add Topic State
  const [selectedChapterForTopic, setSelectedChapterForTopic] = useState<string>(
    syllabus[0]?.id || 'phy-units-measurements'
  );
  const [manualChapterId, setManualChapterId] = useState<string>(syllabus[0]?.id || '');
  const [newTopicName, setNewTopicName] = useState<string>('');

  // Manual Question Form State
  const [manualSubj, setManualSubj] = useState<SubjectId>('botany');
  const [manualStem, setManualStem] = useState<string>('');
  const [optA, setOptA] = useState<string>('');
  const [optB, setOptB] = useState<string>('');
  const [optC, setOptC] = useState<string>('');
  const [optD, setOptD] = useState<string>('');
  const [correctOpt, setCorrectOpt] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const [manualExp, setManualExp] = useState<string>('');
  const [manualReference, setManualReference] = useState<string>('');

  const pendingQuestions = questions.filter((q) => q.reviewStatus === 'pending_review');
  const approvedQuestions = questions.filter((q) => q.reviewStatus === 'approved');

  const [csvMessage, setCsvMessage] = useState('');

  const handleCsvFile = async (file?: File) => {
    if (!file) return;
    const rows = parseCsvRows((await file.text()).replace(/^\uFEFF/, ''));
    if (rows.length < 2) {
      setCsvMessage('CSV mein header aur kam se kam ek question row hona chahiye.');
      return;
    }
    const headers = rows[0].map((header) => header.trim().toLowerCase());
    const requiredHeaders = [
      'subject_id', 'chapter_id', 'question', 'option_a', 'option_b', 'option_c', 'option_d', 'answer',
    ];
    const missing = requiredHeaders.filter((header) => !headers.includes(header));
    if (missing.length) {
      setCsvMessage(`Required CSV columns missing: ${missing.join(', ')}`);
      return;
    }

    const added: Question[] = [];
    let invalid = 0;
    let duplicates = 0;
    rows.slice(1).forEach((values, index) => {
      const row = Object.fromEntries(headers.map((header, i) => [header, values[i] ?? '']));
      const subjectId = row.subject_id?.toLowerCase() as SubjectId;
      const chapter = syllabus.find(
        (item) => item.id.toLowerCase() === row.chapter_id?.toLowerCase() && item.subjectId === subjectId
      );
      const officialUnit = OFFICIAL_NEET_2026_SYLLABUS
        .flatMap((subject) => subject.units.map((unit) => ({ ...unit, officialSubjectId: subject.id })))
        .find((unit) => unit.id.toLowerCase() === row.chapter_id?.toLowerCase());
      const officialUnitMatchesAppSubject = Boolean(
        officialUnit && (
          (officialUnit.officialSubjectId === 'physics' && subjectId === 'physics') ||
          (officialUnit.officialSubjectId === 'chemistry' && subjectId === 'chemistry') ||
          (officialUnit.officialSubjectId === 'biology' && (subjectId === 'botany' || subjectId === 'zoology'))
        )
      );
      const answer = row.answer?.toUpperCase();
      const pyqYear = Number.parseInt(row.pyq_year, 10);
      const sourceLabel = row.source_label?.trim() || 'Imported practice question · source not verified';
      const sourceUrl = row.source_url?.trim() || '';
      const sourcePage = row.source_page?.trim() || '';
      const sourceQuestionNumber = row.source_question_number?.trim() || '';
      const options = [row.option_a, row.option_b, row.option_c, row.option_d];
      if (
        !['physics', 'chemistry', 'botany', 'zoology'].includes(subjectId) ||
        (!chapter && !officialUnitMatchesAppSubject) || !row.question?.trim() || options.some((option) => !option?.trim()) ||
        !['A', 'B', 'C', 'D'].includes(answer) ||
        (row.pyq_year && (
          !/^\d{4}$/.test(row.pyq_year) || !Number.isInteger(pyqYear) || pyqYear < 1980 || !row.source_label?.trim() ||
            !isOfficialExamSource(sourceUrl) || !sourcePage || !sourceQuestionNumber
        ))
      ) {
        invalid++;
        return;
      }
      const normalizedStem = normalizeQuestionStem(row.question);
      if (
        questions.some((question) => normalizeQuestionStem(question.stem) === normalizedStem) ||
        added.some((question) => normalizeQuestionStem(question.stem) === normalizedStem)
      ) {
        duplicates++;
        return;
      }
      added.push({
        id: `import-${Date.now()}-${index}`,
        subjectId,
        chapterId: chapter?.id || officialUnit?.id || '',
        chapterName: chapter?.name || officialUnit?.title || 'Unknown chapter',
        topicName: row.topic?.trim() || chapter?.topics[0]?.name || officialUnit?.title || 'Core topic',
        difficulty: ['easy', 'medium', 'hard'].includes(row.difficulty?.toLowerCase())
          ? row.difficulty.toLowerCase() as Question['difficulty']
          : 'medium',
        questionType: 'single_correct',
        stem: row.question.trim(),
        options: options.map((option, i) => ({ id: ['A', 'B', 'C', 'D'][i] as 'A' | 'B' | 'C' | 'D', text: option.trim() })),
        correctOption: answer as 'A' | 'B' | 'C' | 'D',
        explanation: row.explanation?.trim() || 'Explanation not provided; verify before use.',
        ncertReference: row.ncert_reference?.trim() || 'Reference not provided',
        isPyq: Boolean(row.pyq_year),
        pyqYear: row.pyq_year ? pyqYear : undefined,
        sourceLabel,
        sourceUrl: sourceUrl || undefined,
        sourcePage: sourcePage || undefined,
        sourceQuestionNumber: sourceQuestionNumber || undefined,
        reviewStatus: 'pending_review',
      });
    });
    added.forEach(onAddNewQuestion);
    setCsvMessage(`${added.length} question(s) added to review; ${invalid} invalid and ${duplicates} duplicate row(s) skipped.`);
  };

  const downloadCsvTemplate = () => {
    const headers = 'subject_id,chapter_id,topic,question,option_a,option_b,option_c,option_d,answer,difficulty,explanation,ncert_reference,source_label,source_url,source_page,source_question_number,pyq_year';
    const url = URL.createObjectURL(new Blob([headers + '\n'], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'neet-question-import-template.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadChapterMap = () => {
    const quote = (value: string) => `"${value.replace(/"/g, '""')}"`;
    const rows = [
      ['subject_id', 'subject_name', 'chapter_id', 'chapter_name', 'topic_names', 'syllabus_source'],
      ...syllabus.map((chapter) => [
        chapter.subjectId,
        SUBJECT_META[chapter.subjectId].name,
        chapter.id,
        chapter.name,
        chapter.topics.map((topic) => topic.name).join(' | '),
        'App starter chapter outline',
      ]),
      ...OFFICIAL_NEET_2026_SYLLABUS.flatMap((subject) => subject.units.flatMap((unit) => {
        const appSubjects = subject.id === 'biology' ? ['botany', 'zoology'] as SubjectId[] : [subject.id as SubjectId];
        return appSubjects.map((appSubject) => [
          appSubject,
          `${SUBJECT_META[appSubject].name} · Official ${subject.name}`,
          unit.id,
          unit.title,
          unit.topics.join(' | '),
          'Official NEET UG 2026 syllabus',
        ]);
      })),
    ];
    const csv = rows.map((row) => row.map((cell) => quote(String(cell))).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'neet-syllabus-chapter-map.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCreateManualQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualStem.trim() || !optA.trim() || !optB.trim() || !optC.trim() || !optD.trim() || !manualExp.trim()) {
      setAiToast('Question, all four options, and an explanation are required.');
      return;
    }
    const ch = syllabus.find((c) => c.id === manualChapterId && c.subjectId === manualSubj)
      || syllabus.find((c) => c.subjectId === manualSubj)
      || syllabus[0];
    if (!ch) return;
    const newQ: Question = {
      id: `q-manual-${Date.now()}`,
      subjectId: manualSubj,
      chapterId: ch.id,
      chapterName: ch.name,
      topicName: ch.topics[0]?.name || 'Core NCERT Concept',
      difficulty: 'medium',
      questionType: 'single_correct',
      stem: manualStem.trim(),
      options: [
        { id: 'A', text: optA.trim() },
        { id: 'B', text: optB.trim() },
        { id: 'C', text: optC.trim() },
        { id: 'D', text: optD.trim() },
      ],
      correctOption: correctOpt,
      explanation: manualExp.trim(),
      ncertReference: manualReference.trim() || 'Reference not provided',
      isPyq: false,
      sourceLabel: 'Admin Custom Entry',
      reviewStatus: 'pending_review',
    };
    onAddNewQuestion(newQ);
    setManualStem('');
    setOptA('');
    setOptB('');
    setOptC('');
    setOptD('');
    setManualExp('');
    setManualReference('');
    setAiToast('Question saved to the review queue. Verify the answer before approving it.');
    setTimeout(() => setAiToast(''), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Top Admin Header */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-400/30 px-2.5 py-0.5 rounded-full mb-2">
            <Database className="w-3.5 h-3.5" />
            Student Content & Question Tools
          </span>
          <h1 className="text-xl font-extrabold">
            Syllabus, Practice Questions & Your Study Data
          </h1>
          <p className="text-xs text-slate-300 mt-0.5">
            Your progress is saved in this browser. Starter questions are examples; check their sources before relying on them.
          </p>
        </div>

        <div className="flex w-full min-w-0 items-center gap-1.5 overflow-x-auto rounded-xl bg-slate-800 p-1.5 md:w-auto">
          <button
            onClick={() => setAdminTab('syllabus_seeder')}
            className={`shrink-0 px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              adminTab === 'syllabus_seeder'
                ? 'bg-blue-600 text-white'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            📚 Syllabus Outline ({syllabus.length})
          </button>
          <button
            onClick={() => setAdminTab('ai_generator')}
            className={`shrink-0 px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              adminTab === 'ai_generator'
                ? 'bg-blue-600 text-white'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Review Questions ({pendingQuestions.length})
          </button>
          <button
            onClick={() => setAdminTab('manual_import')}
            className={`shrink-0 px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              adminTab === 'manual_import'
                ? 'bg-blue-600 text-white'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            📥 CSV Import & Add MCQ
          </button>
        </div>
      </div>

      {aiToast && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          {aiToast}
        </div>
      )}

      {/* TAB 1: PRELOADED SYLLABUS SEEDER STATUS */}
      {adminTab === 'syllabus_seeder' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {(['physics', 'chemistry', 'botany', 'zoology'] as SubjectId[]).map((subjId) => {
              const meta = SUBJECT_META[subjId];
              const chs = syllabus.filter((c) => c.subjectId === subjId);
              const topicCount = chs.reduce((acc, c) => acc + c.topics.length, 0);
              return (
                <div
                  key={subjId}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-extrabold text-base text-slate-900">{meta.name}</span>
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      ✓ Included
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 space-y-1">
                    <div>
                      Chapters in outline: <strong>{chs.length} Units</strong>
                    </div>
                    <div>
                      Topics in outline: <strong>{topicCount} Topics</strong>
                    </div>
                    <div>
                      Full Test Pattern: <strong>45 Qs (180 Marks)</strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Add Subtopic to Existing Included Chapter */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Optional: Add Subtopic to Any Included Chapter
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Add a topic here when you need to track syllabus details that are missing from the starter list.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newTopicName.trim()) return;
                onAddTopicToChapter(selectedChapterForTopic, newTopicName.trim());
                setNewTopicName('');
                setAiToast('✓ Subtopic added to chapter syllabus!');
                setTimeout(() => setAiToast(''), 3000);
              }}
              className="flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center"
            >
              <select
                value={selectedChapterForTopic}
                onChange={(e) => setSelectedChapterForTopic(e.target.value)}
                className="w-full min-w-0 max-w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50 text-slate-800 sm:w-auto"
              >
                {syllabus.map((ch) => (
                  <option key={ch.id} value={ch.id}>
                    [{SUBJECT_META[ch.subjectId].shortName}] {ch.name}
                  </option>
                ))}
              </select>

              <input
                type="text"
                value={newTopicName}
                onChange={(e) => setNewTopicName(e.target.value)}
                placeholder="Enter new subtopic name (e.g. Experimental Skills - Vernier Calipers)..."
                className="w-full min-w-0 flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-blue-600 sm:min-w-[240px]"
              />

              <button
                type="submit"
                className="flex min-h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-800 cursor-pointer sm:w-auto"
              >
                <Plus className="w-4 h-4" /> Add Subtopic
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: AI QUESTION GENERATOR & VERIFICATION WORKFLOW */}
      {adminTab === 'ai_generator' && (
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 text-sm text-blue-950">
            <strong>AI question generation is not connected yet.</strong> Questions you add or import stay in this review queue until you check the answer and approve them.
          </div>

          {/* Pending Review Queue */}
          <div className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                Pending Verification Queue ({pendingQuestions.length} Questions)
              </h3>
              <span className="text-xs text-slate-500">
                Approved in Bank: <strong>{approvedQuestions.length} Questions</strong>
              </span>
            </div>

            {pendingQuestions.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-xs text-slate-500">
                No questions are waiting for review. Add a question or import a CSV to get started.
              </div>
            ) : (
              pendingQuestions.map((q) => (
                <div
                  key={q.id}
                  className="bg-white rounded-2xl border-2 border-amber-200 p-5 shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
                        ⏳ Pending Admin Verification
                      </span>
                      <span className="text-xs font-bold text-slate-700">
                        {SUBJECT_META[q.subjectId].name} · {q.chapterName}
                      </span>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span>{q.sourceLabel}{q.pyqYear ? ` · NEET ${q.pyqYear}` : ''}</span>
                        {q.sourceUrl && (
                          <a href={q.sourceUrl} target="_blank" rel="noreferrer" className="font-bold text-blue-700 underline">
                            Open source{q.sourceQuestionNumber ? ` · Q${q.sourceQuestionNumber}` : ''}{q.sourcePage ? ` · page ${q.sourcePage}` : ''}
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onApproveQuestion(q.id)}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Approve & Publish
                      </button>
                      <button
                        onClick={() => onRejectQuestion(q.id)}
                        className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Reject
                      </button>
                    </div>
                  </div>

                  <p className="text-sm font-medium text-slate-900">{q.stem}</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {q.options.map((opt) => (
                      <div
                        key={opt.id}
                        className={`px-3 py-2 rounded-lg border ${
                          opt.id === q.correctOption
                            ? 'bg-emerald-50 border-emerald-400 text-emerald-900 font-bold'
                            : 'bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        ({opt.id}) {opt.text}{' '}
                        {opt.id === q.correctOption && '✓ [Proposed Key]'}
                      </div>
                    ))}
                  </div>

                  <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <strong>Explanation:</strong> {q.explanation} ({q.ncertReference})
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: BULK CSV IMPORT & MANUAL MCQ CREATOR */}
      {adminTab === 'manual_import' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Working bulk CSV import */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Import Questions from CSV</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Har row subject_id aur chapter_id se match hona chahiye. Imported questions pehle review queue mein aayenge.
            </p>
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-[11px] text-amber-950 space-y-1.5">
                <p>PYQ row ke liye year, paper/set label, official NTA/NMC paper URL, PDF page aur question number zaroori hain. Link par question aur final answer key verify karke hi approve karein. Official Biology units app ke Botany/Zoology split mein dono options ke saath map mein milenge.</p>
                <div className="flex flex-wrap gap-x-3 gap-y-1 font-bold">
                  <a href="https://neet.nta.nic.in/archive/" target="_blank" rel="noreferrer" className="underline">NTA question paper archive</a>
                  <a href="https://neet.nta.nic.in/document/final-answer-keys-for-neetug-2025/" target="_blank" rel="noreferrer" className="underline">2025 final answer key</a>
                  <a href="https://nta.ac.in/Download/Notice/Notice_20260108180635.pdf" target="_blank" rel="noreferrer" className="underline">2026 official syllabus</a>
                </div>
              </div>
            <button type="button" onClick={downloadCsvTemplate} className="w-full py-2.5 rounded-xl border border-slate-300 text-slate-800 font-bold text-xs hover:bg-slate-50 cursor-pointer">
              Download CSV column template
            </button>
              <button type="button" onClick={downloadChapterMap} className="w-full py-2.5 rounded-xl border border-slate-300 text-slate-800 font-bold text-xs hover:bg-slate-50 cursor-pointer">
                Download subject and chapter ID map
              </button>
            <label className="block text-xs font-semibold text-slate-700">
              Choose .csv file
              <input type="file" accept=".csv,text/csv" onChange={(event) => void handleCsvFile(event.target.files?.[0])} className="block w-full mt-2 text-xs" />
            </label>
            {csvMessage && <p role="status" className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-900">{csvMessage}</p>}
            <div className="text-[11px] text-slate-500 break-words">
                Required: subject_id, chapter_id, question, option_a, option_b, option_c, option_d, answer. For PYQs also fill source_label (year and set), source_url, source_page, source_question_number, and pyq_year. Other fields are optional.
            </div>
          </div>

          {/* Manual MCQ Entry Form */}
          <form
            onSubmit={handleCreateManualQuestion}
            className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4"
          >
            <h3 className="text-base font-bold text-slate-900">
              Add Single Verified MCQ to Question Bank
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Subject</label>
                <select
                  value={manualSubj}
                  onChange={(e) => {
                    const subjectId = e.target.value as SubjectId;
                    setManualSubj(subjectId);
                    setManualChapterId(syllabus.find((chapter) => chapter.subjectId === subjectId)?.id || '');
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50"
                >
                  <option value="physics">Physics</option>
                  <option value="chemistry">Chemistry</option>
                  <option value="botany">Botany</option>
                  <option value="zoology">Zoology</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Chapter</label>
                <select
                  value={manualChapterId}
                  onChange={(e) => setManualChapterId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50"
                >
                  {syllabus.filter((chapter) => chapter.subjectId === manualSubj).map((chapter) => (
                    <option key={chapter.id} value={chapter.id}>{chapter.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Correct Answer Key
                </label>
                <select
                  value={correctOpt}
                  onChange={(e) => setCorrectOpt(e.target.value as 'A' | 'B' | 'C' | 'D')}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50"
                >
                  <option value="A">Option A</option>
                  <option value="B">Option B</option>
                  <option value="C">Option C</option>
                  <option value="D">Option D</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Question Stem</label>
              <textarea
                rows={2}
                value={manualStem}
                onChange={(e) => setManualStem(e.target.value)}
                placeholder="Type NEET MCQ question stem here..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-blue-600"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <input
                type="text"
                value={optA}
                onChange={(e) => setOptA(e.target.value)}
                placeholder="Option A text..."
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs"
              />
              <input
                type="text"
                value={optB}
                onChange={(e) => setOptB(e.target.value)}
                placeholder="Option B text..."
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs"
              />
              <input
                type="text"
                value={optC}
                onChange={(e) => setOptC(e.target.value)}
                placeholder="Option C text..."
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs"
              />
              <input
                type="text"
                value={optD}
                onChange={(e) => setOptD(e.target.value)}
                placeholder="Option D text..."
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Explanation
              </label>
              <input
                type="text"
                value={manualExp}
                onChange={(e) => setManualExp(e.target.value)}
                placeholder="Explain why the correct option is right..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
              />
              <input
                type="text"
                value={manualReference}
                onChange={(e) => setManualReference(e.target.value)}
                placeholder="Source / NCERT chapter / page (optional)"
                className="w-full mt-2 px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
              />
            </div>

            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Save to Review Queue
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
