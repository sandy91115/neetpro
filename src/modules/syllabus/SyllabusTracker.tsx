import React, { useState } from 'react';
import {
  BookCheck,
  CheckCircle2,
  CheckSquare,
  Flame,
  Play,
  Plus,
  Search,
  Sparkles,
  Square,
} from 'lucide-react';
import { SUBJECT_META } from '../../data/neetSyllabusData';
import { OFFICIAL_NEET_2026_SYLLABUS } from '../../data/officialNeet2026Syllabus';
import type { ChapterSyllabus, CompletionStatus, SubjectId } from '../../types/neet';

interface SyllabusTrackerProps {
  syllabus: ChapterSyllabus[];
  officialSyllabusProgress: Record<string, boolean>;
  onToggleOfficialSyllabusUnit: (unitId: string) => void;
  onStartOfficialUnitTest: (unitId: string, subjectId: SubjectId, unitName: string) => void;
  onUpdateChapterStatus: (chapterId: string, status: CompletionStatus) => void;
  onToggleTopicCompleted: (chapterId: string, topicId: string) => void;
  onIncrementNcertRead: (chapterId: string) => void;
  onToggleChapterFlag: (chapterId: string, field: 'pyqSolved' | 'formulaSheetRevised') => void;
  onStartChapterTest: (chapter: ChapterSyllabus) => void;
}

export const SyllabusTracker: React.FC<SyllabusTrackerProps> = ({
  syllabus,
  officialSyllabusProgress,
  onToggleOfficialSyllabusUnit,
  onStartOfficialUnitTest,
  onUpdateChapterStatus,
  onToggleTopicCompleted,
  onIncrementNcertRead,
  onToggleChapterFlag,
  onStartChapterTest,
}) => {
  const [selectedSubject, setSelectedSubject] = useState<'all' | SubjectId>('all');
  const [selectedClass, setSelectedClass] = useState<'all' | '11th' | '12th'>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | CompletionStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredChapters = syllabus.filter((ch) => {
    if (selectedSubject !== 'all' && ch.subjectId !== selectedSubject) return false;
    if (selectedClass !== 'all' && ch.classLevel !== selectedClass) return false;
    if (selectedStatus !== 'all' && ch.status !== selectedStatus) return false;
    if (
      searchQuery.trim() &&
      !ch.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !ch.unitName.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !ch.topics.some((t) => t.name.toLowerCase().includes(searchQuery.toLowerCase()))
    ) {
      return false;
    }
    return true;
  });
  const officialUnitCount = OFFICIAL_NEET_2026_SYLLABUS.reduce((sum, subject) => sum + subject.units.length, 0);
  const officialCompletedCount = OFFICIAL_NEET_2026_SYLLABUS.reduce(
    (sum, subject) => sum + subject.units.filter((unit) => officialSyllabusProgress[unit.id]).length,
    0
  );

  const getStatusBadge = (status: CompletionStatus) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'needs_revision':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'in_progress':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'not_started':
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Info Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Syllabus Tracker | Official syllabus + chapter progress
          </div>
          <h1 className="text-xl font-extrabold text-slate-900">
            NEET Syllabus & NCERT Revision Tracker
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Track chapter completion, NCERT reading count, formula revision, PYQ status, and launch
            1-click chapter tests.
          </p>
          <p className="text-xs text-amber-800 mt-2">
            This is a starter outline, not a verified complete 2027 syllabus.{' '}
            <a
              href="https://nta.ac.in/Download/Notice/Notice_20260108180635.pdf"
              target="_blank"
              rel="noreferrer"
              className="font-bold underline"
            >
              Open the official NEET UG 2026 syllabus
            </a>{' '}
            and compare it with the 2027 bulletin when published.
          </p>
        </div>

        {/* Subject Quick Summary Pills */}
        <div className="flex flex-wrap gap-2">
          {(['physics', 'chemistry', 'botany', 'zoology'] as SubjectId[]).map((subjId) => {
            const meta = SUBJECT_META[subjId];
            const total = syllabus.filter((c) => c.subjectId === subjId).length;
            const done = syllabus.filter(
              (c) => c.subjectId === subjId && c.status === 'completed'
            ).length;
            return (
              <div
                key={subjId}
                className={`px-3 py-2 rounded-xl border text-xs font-bold ${meta.bgLight} ${meta.textDark} ${meta.border}`}
              >
                {meta.name}: {done}/{total} Done
              </div>
            );
          })}
        </div>
      </div>

      <section className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 md:p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <div className="text-xs font-bold uppercase tracking-wide text-blue-700">Official syllabus checklist · 2026</div>
            <h2 className="text-lg font-extrabold text-slate-900 mt-1">Complete NTA/NMC unit outline</h2>
            <p className="text-xs text-slate-600 mt-1">All 50 official units and their listed topics are included. Tick a unit after finishing it; this checklist is saved in this browser.</p>
          </div>
          <div className="text-sm font-extrabold text-slate-800">{officialCompletedCount}/{officialUnitCount} units complete</div>
        </div>
        <div className="p-4 md:p-6 space-y-3">
          <div className="text-xs text-amber-900 bg-amber-50 border border-amber-200 rounded-xl p-3">
            This is the official NEET UG 2026 syllabus. Check the official notice for your exam year before planning; the 2027 syllabus may be updated.{' '}
            <a href="https://neet.nta.nic.in/document/syllabus-for-neet-ug-2026-examination/" target="_blank" rel="noreferrer" className="font-bold underline">Open official source</a>
          </div>
          {OFFICIAL_NEET_2026_SYLLABUS.map((subject) => {
            const completed = subject.units.filter((unit) => officialSyllabusProgress[unit.id]).length;
            return (
              <details key={subject.id} className="group rounded-xl border border-slate-200 bg-slate-50 open:bg-white">
                <summary className="cursor-pointer list-none p-4 flex items-center justify-between gap-3">
                  <span className="font-extrabold text-sm text-slate-900">{subject.name}</span>
                  <span className="text-xs font-bold text-slate-600">{completed}/{subject.units.length} units</span>
                </summary>
                <div className="px-3 pb-3 space-y-2">
                  {subject.units.map((unit) => (
                    <div key={unit.id} className="rounded-lg border border-slate-200 p-3 flex items-start gap-2.5">
                        <input
                          type="checkbox"
                          checked={Boolean(officialSyllabusProgress[unit.id])}
                          onChange={() => onToggleOfficialSyllabusUnit(unit.id)}
                          aria-label={`Mark ${subject.name} unit ${unit.number}: ${unit.title} complete`}
                          className="mt-0.5 accent-emerald-600"
                        />
                      <details className="flex-1 min-w-0">
                        <summary className="cursor-pointer text-xs font-bold text-slate-800">Unit {unit.number}: {unit.title}</summary>
                        <div className="mt-3 space-y-2 text-xs leading-relaxed text-slate-700">
                          {unit.topics.map((topic, index) => <p key={index}>{topic}</p>)}
                          <div className="pt-2 flex flex-wrap gap-2">
                            {(subject.id === 'biology' ? ['botany', 'zoology'] as SubjectId[] : [subject.id as SubjectId]).map((appSubject) => (
                              <button
                                key={appSubject}
                                type="button"
                                onClick={() => onStartOfficialUnitTest(unit.id, appSubject, unit.title)}
                                className="px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 font-bold hover:bg-blue-100"
                              >
                                {SUBJECT_META[appSubject].name} unit test · 10 questions
                              </button>
                            ))}
                          </div>
                        </div>
                      </details>
                    </div>
                  ))}
                </div>
              </details>
            );
          })}
        </div>
      </section>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {(['all', 'physics', 'chemistry', 'botany', 'zoology'] as const).map((subj) => (
            <button
              key={subj}
              onClick={() => setSelectedSubject(subj)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition cursor-pointer ${
                selectedSubject === subj
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {subj === 'all' ? 'All Subjects' : SUBJECT_META[subj].name}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value as 'all' | '11th' | '12th')}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50 text-slate-700"
          >
            <option value="all">Class 11th + 12th</option>
            <option value="11th">Class 11th Only</option>
            <option value="12th">Class 12th Only</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as 'all' | CompletionStatus)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50 text-slate-700"
          >
            <option value="all">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="needs_revision">Needs Revision</option>
            <option value="in_progress">In Progress</option>
            <option value="not_started">Not Started</option>
          </select>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chapter or topic..."
              className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Chapters Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredChapters.map((ch) => {
          const meta = SUBJECT_META[ch.subjectId];
          return (
            <div
              key={ch.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition flex flex-col justify-between gap-4"
            >
              <div>
                {/* Top Badges */}
                <div className="flex items-center justify-between flex-wrap gap-2 mb-2.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${meta.bgLight} ${meta.textDark} ${meta.border}`}
                    >
                      {meta.name} · Class {ch.classLevel}
                    </span>
                    <span className="text-xs font-medium text-slate-500">{ch.unitName}</span>
                    {ch.highYield && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                        <Flame className="w-3 h-3 fill-amber-500 text-amber-500" />
                        High Yield (~{ch.expectedQuestions} Qs)
                      </span>
                    )}
                  </div>

                  <select
                    value={ch.status}
                    onChange={(e) =>
                      onUpdateChapterStatus(ch.id, e.target.value as CompletionStatus)
                    }
                    className={`text-xs font-bold px-2.5 py-1 rounded-lg border cursor-pointer ${getStatusBadge(
                      ch.status
                    )}`}
                  >
                    <option value="completed">✓ Completed</option>
                    <option value="needs_revision">⚠ Needs Revision</option>
                    <option value="in_progress">⏳ In Progress</option>
                    <option value="not_started">○ Not Started</option>
                  </select>
                </div>

                {/* Chapter Title */}
                <h3 className="text-base font-bold text-slate-900 mb-3">{ch.name}</h3>

                {/* Subtopics Checklist */}
                <div className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-100 mb-3">
                  <div className="text-[11px] font-bold uppercase text-slate-400 mb-1">
                    Topics in this starter outline:
                  </div>
                  {ch.topics.map((topic) => (
                    <div
                      key={topic.id}
                      onClick={() => onToggleTopicCompleted(ch.id, topic.id)}
                      className="flex items-center gap-2 text-xs cursor-pointer hover:text-blue-600 transition"
                    >
                      {topic.completed ? (
                        <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                      <span
                        className={
                          topic.completed
                            ? 'text-slate-600 line-through'
                            : 'text-slate-800 font-medium'
                        }
                      >
                        {topic.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Revision Trackers & Quick Test Button */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => onIncrementNcertRead(ch.id)}
                    className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                    title="Click to increment NCERT Reading Count"
                  >
                    <BookCheck className="w-3.5 h-3.5" />
                    NCERT Reads: {ch.ncertReadCount}x
                    <Plus className="w-3 h-3 ml-0.5" />
                  </button>

                  <button
                    onClick={() => onToggleChapterFlag(ch.id, 'pyqSolved')}
                    className={`px-2.5 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1 transition cursor-pointer ${
                      ch.pyqSolved
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-slate-50 text-slate-500 border-slate-200'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    PYQs Solved
                  </button>

                  <button
                    onClick={() => onToggleChapterFlag(ch.id, 'formulaSheetRevised')}
                    className={`px-2.5 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1 transition cursor-pointer ${
                      ch.formulaSheetRevised
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                        : 'bg-slate-50 text-slate-500 border-slate-200'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Notes/Formula
                  </button>
                </div>

                <button
                  onClick={() => onStartChapterTest(ch)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-blue-600 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  Practice Test
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
