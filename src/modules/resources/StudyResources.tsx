import React, { useEffect, useState } from 'react';
import { ExternalLink, FileText, GraduationCap, Library, Video } from 'lucide-react';
import { api } from '../../lib/neetApi';

const fallbackResources = [
  {
    title: 'SATHEE NEET by IIT Kanpur',
    provider: 'Ministry of Education, Government of India · IIT Kanpur',
    description: 'Free recorded/live classes, NCERT videos, practice questions, PYQs, mock tests and doubt support. Sign in on SATHEE to use its student tools.',
    includes: 'Lectures · PYQs · mocks · doubt support',
    href: 'https://sathee.iitk.ac.in/sathee-neet/imp-for-exam/neet-course/',
    icon: Video,
    color: 'bg-violet-50 text-violet-700 border-violet-200',
  },
  {
    title: 'NCERT Exemplar Problems',
    provider: 'NCERT official resource',
    description: 'Open class XI/XII Physics, Chemistry and Biology exemplar chapters and their answer sections for additional practice.',
    includes: 'Chapter questions · answer sections',
    href: 'https://ncert.nic.in/exemplar-problems.php?ln=en',
    icon: Library,
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  {
    title: 'NCERT Textbooks',
    provider: 'NCERT official resource',
    description: 'Read or download current NCERT textbooks and chapters. Use the applicable book edition alongside the official NEET syllabus.',
    includes: 'Class XI/XII textbooks · chapter PDFs',
    href: 'https://ncert.nic.in/textbook.php',
    icon: FileText,
    color: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  {
    title: 'NTA NEET Archive',
    provider: 'National Testing Agency',
    description: 'Find official question paper PDFs and answer-key notices where NTA has published them. Use paper/set, question number and key when importing PYQs.',
    includes: 'Question papers · notices · answer keys',
    href: 'https://neet.nta.nic.in/archive/',
    icon: GraduationCap,
    color: 'bg-amber-50 text-amber-800 border-amber-200',
  },
  {
    title: 'SATHEE NEET Previous-Year Questions',
    provider: 'Ministry of Education · IIT Kanpur',
    description: 'Free year-wise NEET PYQ practice. Questions open on the provider site and are not copied into this app without a verified source record.',
    includes: 'Year-wise PYQs · answer explanations',
    href: 'https://sathee.iitk.ac.in/sathee-neet/neet-pyq/',
    icon: GraduationCap,
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  {
    title: 'SATHEE Chapter-Wise PYQ Practice',
    provider: 'Ministry of Education · IIT Kanpur',
    description: 'Use chapter and topic filters for targeted PYQ practice and revision.',
    includes: 'Chapter-wise PYQs · topic practice',
    href: 'https://sathee.iitk.ac.in/sathee-neet/previous-year-neet-exam-problems/pyq/',
    icon: GraduationCap,
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  {
    title: 'NTA NEET UG 2025 Final Answer Key',
    provider: 'National Testing Agency',
    description: 'Check final answer keys by paper code when reviewing a PYQ or imported question.',
    includes: 'Official final answer keys',
    href: 'https://neet.nta.nic.in/document/final-answer-keys-for-neetug-2025/',
    icon: FileText,
    color: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  {
    title: 'NTA NEET UG 2026 Re-Examination Final Answer Key',
    provider: 'National Testing Agency',
    description: 'Official final key notice for the 2026 re-examination. Match the question paper code before checking answers.',
    includes: 'Official final answer key',
    href: 'https://neet.nta.nic.in/final-answer-keys-for-neet-ug-2026-re-examination/',
    icon: FileText,
    color: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  {
    title: 'NEET UG 2026 Syllabus',
    provider: 'NTA / National Medical Commission',
    description: 'The latest official syllabus currently linked in this app. Check the notice for your exam year before finalising preparation.',
    includes: 'Official unit and topic list',
    href: 'https://neet.nta.nic.in/document/syllabus-for-neet-ug-2026-examination/',
    icon: FileText,
    color: 'bg-slate-100 text-slate-700 border-slate-300',
  },
];

type ApiResource = { id: number; title: string; provider: string; description?: string; resource_type: string; url: string; is_official: boolean; subject_id?: number | null; chapter_id?: number | null; subject?: { id: number; name: string } | null; chapter?: { id: number; name: string } | null };
type DisplayResource = { title: string; provider: string; description: string; includes: string; href: string; icon: typeof Video; color: string; subjectId?: number | null; chapterId?: number | null; resourceType?: string };

export const StudyResources: React.FC = () => {
  const [backendResources, setBackendResources] = useState<ApiResource[]>([]);
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [chapterFilter, setChapterFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  useEffect(() => {
    api<{ data: ApiResource[] }>('/resources').then((result) => setBackendResources(result.data)).catch(() => undefined);
  }, []);
  const resources: DisplayResource[] = backendResources.length ? backendResources.map((resource) => ({
    title: resource.title,
    provider: resource.provider,
    description: resource.description || 'Open this resource on the provider website.',
    includes: resource.resource_type.replaceAll('_', ' '),
    href: resource.url,
    subjectId: resource.subject_id,
    chapterId: resource.chapter_id,
    resourceType: resource.resource_type,
    icon: resource.resource_type === 'video' || resource.resource_type === 'course' ? Video : resource.resource_type === 'pyq_source' ? GraduationCap : resource.resource_type === 'textbook' ? Library : FileText,
    color: resource.is_official ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-700 border-slate-300',
  })) : fallbackResources;
  const availableSubjects = backendResources.flatMap((resource) => resource.subject ? [resource.subject] : []).filter((subject, index, items) => items.findIndex((item) => item.id === subject.id) === index);
  const availableChapters = backendResources.flatMap((resource) => resource.chapter && (subjectFilter === 'all' || resource.subject_id === Number(subjectFilter)) ? [resource.chapter] : []).filter((chapter, index, items) => items.findIndex((item) => item.id === chapter.id) === index);
  const visibleResources = resources.filter((resource) =>
    (subjectFilter === 'all' || !resource.subjectId || resource.subjectId === Number(subjectFilter)) &&
    (chapterFilter === 'all' || resource.chapterId === Number(chapterFilter)) &&
    (typeFilter === 'all' || resource.resourceType === typeFilter)
  );
  return (
  <div className="space-y-6">
    <header className="bg-slate-900 text-white rounded-2xl p-6">
      <div className="text-xs font-bold uppercase tracking-wide text-blue-300">Official content directory</div>
      <h1 className="text-xl font-extrabold mt-1">Study Resources</h1>
      <p className="text-xs text-slate-300 mt-2 max-w-3xl">
        Open official study, practice and exam sources without uploading their PDFs here. External resources open on their provider sites; only questions added through Content & Questions are saved in this app and included in its tests.
      </p>
    </header>

    {backendResources.length > 0 && <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-3 sm:grid-cols-3">
      <label className="text-xs font-semibold text-slate-600">Subject<select value={subjectFilter} onChange={(event) => { setSubjectFilter(event.target.value); setChapterFilter('all'); }} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white p-2 text-sm"><option value="all">All subjects</option>{availableSubjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}</select></label>
      <label className="text-xs font-semibold text-slate-600">Chapter<select value={chapterFilter} onChange={(event) => setChapterFilter(event.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white p-2 text-sm"><option value="all">All chapters</option>{availableChapters.map((chapter) => <option key={chapter.id} value={chapter.id}>{chapter.name}</option>)}</select></label>
      <label className="text-xs font-semibold text-slate-600">Resource type<select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white p-2 text-sm"><option value="all">All types</option>{[...new Set(backendResources.map((resource) => resource.resource_type))].sort().map((type) => <option key={type} value={type}>{type.replaceAll('_', ' ')}</option>)}</select></label>
    </div>}

    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {visibleResources.map((resource) => {
        const Icon = resource.icon;
        return (
          <article key={resource.title} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <span className={`w-11 h-11 shrink-0 rounded-xl border flex items-center justify-center ${resource.color}`}>
                <Icon className="w-5 h-5" />
              </span>
              <div>
                <h2 className="font-extrabold text-slate-900">{resource.title}</h2>
                <p className="text-[11px] text-slate-500 mt-0.5">{resource.provider}</p>
              </div>
            </div>
            <p className="text-xs leading-relaxed text-slate-600">{resource.description}</p>
            <div className="mt-auto flex items-center justify-between gap-3 flex-wrap">
              <span className="text-[11px] font-semibold text-slate-500">{resource.includes}</span>
              <a href={resource.href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 text-white text-xs font-bold hover:bg-slate-800">
                Open resource <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </article>
        );
      })}
      {visibleResources.length === 0 && <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-600">No resources match these filters.</div>}
    </div>

    <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 text-xs text-blue-950">
      To use an official question inside this app’s timed tests, add it through <strong>Admin → CSV Import</strong>, include its source details, and approve it after checking the answer key. The NTA and NCERT links above remain the source of record.
    </div>
  </div>
  );
};
