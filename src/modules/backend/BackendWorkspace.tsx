import { useEffect, useState, type FormEvent } from 'react';
import { BookOpenCheck, Database, KeyRound, LogOut, Play, ShieldCheck, Upload, Pencil, Plus, Trash2, X } from 'lucide-react';
import { api, clearApiToken, getApiToken, setApiToken } from '../../lib/neetApi';
import type { ActiveTestSession, Question, SubjectId, TestCategory } from '../../types/neet';

type User = { id: number; name: string; email: string; role: 'student' | 'admin' };
type Option = { id: 'A' | 'B' | 'C' | 'D'; text: string };
type TestQuestion = { id: number; topic_name?: string | null; question_type: Question['questionType']; stem: string; options: Option[]; difficulty: Question['difficulty']; subject: { code: SubjectId; name: string }; chapter: { slug: string; name: string }; is_pyq: boolean; pyq_year?: number; source_label?: string | null; source_url?: string | null; source_page?: string | null; source_question_number?: string | null };
type Blueprint = { id: number; title: string; slug: string; cadence: string; test_category: string; config: { question_count?: number; plan_group?: string; sequence?: number; year?: number; generation_mode?: string; subject?: string; chapter_ids?: number[]; subject_counts?: Record<string, number>; difficulty_mix?: Record<string, number> }; duration_minutes: number; positive_marks: number; negative_marks: number; pyq_only: boolean; is_active: boolean; availability?: { ready: boolean; required: number; available: number } };
type GeneratedTest = { id: number; title: string; test_category: TestCategory; duration_minutes: number; positive_marks: number; negative_marks: number; questions: TestQuestion[] };
type ApiTopic = { id: number; name: string; position: number };
type ApiChapter = { id: number; name: string; slug: string; official_unit_code?: string | null; weightage_percent?: number | string | null; expected_questions?: number | null; topics?: ApiTopic[] };
type ApiSubject = { id: number; code: string; name: string; chapters: ApiChapter[] };

function parseCsv(text: string): string[][] {
  const output: string[][] = [];
  let row: string[] = [], cell = '', quoted = false;
  for (let index = 0; index < text.length; index++) {
    const character = text[index];
    if (character === '"' && quoted && text[index + 1] === '"') { cell += '"'; index++; }
    else if (character === '"') quoted = !quoted;
    else if (character === ',' && !quoted) { row.push(cell.trim()); cell = ''; }
    else if ((character === '\n' || character === '\r') && !quoted) {
      if (character === '\r' && text[index + 1] === '\n') index++;
      row.push(cell.trim()); if (row.some(Boolean)) output.push(row); row = []; cell = '';
    } else cell += character;
  }
  row.push(cell.trim()); if (row.some(Boolean)) output.push(row);
  return output;
}

export function BackendWorkspace({ mode, onStartTest }: { mode: 'student' | 'admin'; onStartTest: (session: ActiveTestSession) => void }) {
  const [user, setUser] = useState<User | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [register, setRegister] = useState(false);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [blueprints, setBlueprints] = useState<Blueprint[]>([]);
  const [blueprintSearch, setBlueprintSearch] = useState('');
  const [blueprintGroup, setBlueprintGroup] = useState('all');
  const [blueprintPage, setBlueprintPage] = useState(1);
  const [subjects, setSubjects] = useState<ApiSubject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState('physics');
  const [selectedChapter, setSelectedChapter] = useState('');
  const [test, setTest] = useState<GeneratedTest | null>(null);
  const [adminQuestions, setAdminQuestions] = useState<any[]>([]);
  const [questionStatus, setQuestionStatus] = useState('pending_review');
  const [questionPage, setQuestionPage] = useState(1);
  const [questionLastPage, setQuestionLastPage] = useState(1);
  const [questionTotal, setQuestionTotal] = useState(0);
  const [editingQuestionId, setEditingQuestionId] = useState<number | null>(null);
  const [importText, setImportText] = useState('');
  const [resources, setResources] = useState<any[]>([]);
  const [editingResourceId, setEditingResourceId] = useState<number | null>(null);
  const emptyResource = { title: '', provider: '', url: '', description: '', resource_type: 'reference', is_official: false, subject_id: '', chapter_id: '' };
  const [resourceForm, setResourceForm] = useState(emptyResource);
  const [editingBlueprintId, setEditingBlueprintId] = useState<number | null>(null);
  const [topicName, setTopicName] = useState('');
  const [blueprintForm, setBlueprintForm] = useState({ title: 'Weekly NEET Test', cadence: 'weekly', question_count: 60, duration_minutes: 90 });
  const [weightage, setWeightage] = useState('');
  const [expectedQuestions, setExpectedQuestions] = useState('');
  const [weightageSource, setWeightageSource] = useState<'verified_pyq_frequency' | 'admin_estimate' | 'equal'>('verified_pyq_frequency');

  const loadUser = async () => {
    if (!getApiToken()) return;
    try {
      const result = await api<{ user: User }>('/auth/me');
      setUser(result.user);
    } catch { clearApiToken(); setUser(null); }
  };
  useEffect(() => { void loadUser(); }, []);
  useEffect(() => {
    if (!user) return;
    if (user.role === 'student') {
      api<{ data: Blueprint[] }>('/test-blueprints').then((r) => setBlueprints(r.data)).catch((e) => setMessage(e.message));
      api<{ subjects: ApiSubject[] }>('/syllabus').then((r) => { setSubjects(r.subjects); if (r.subjects[0]) setSelectedSubject(r.subjects[0].code); }).catch((e) => setMessage(e.message));
    }
    if (user.role === 'admin') {
      refreshQuestions(); refreshResources();
      api<{ data: Blueprint[] }>('/admin/test-blueprints').then((r) => setBlueprints(r.data)).catch((e) => setMessage(e.message));
      api<{ subjects: ApiSubject[] }>('/syllabus').then((r)=>setSubjects(r.subjects)).catch(()=>{});
    }
  }, [user]);

  async function refreshQuestions(status = questionStatus, page = questionPage) {
    try {
      const r = await api<{ data: any[]; current_page: number; last_page: number; total: number }>(`/admin/questions?status=${status}&per_page=50&page=${page}`);
      setAdminQuestions(r.data); setQuestionPage(r.current_page); setQuestionLastPage(r.last_page); setQuestionTotal(r.total);
    }
    catch (e) { setMessage((e as Error).message); }
  }
  async function refreshResources() {
    try { const r = await api<{ data: any[] }>('/admin/resources'); setResources(r.data); }
    catch (e) { setMessage((e as Error).message); }
  }
  async function signIn(event: FormEvent) {
    event.preventDefault(); setBusy(true); setMessage('');
    try {
      const path = register ? '/auth/register' : '/auth/login';
      const result = await api<{ token: string; user: User }>(path, { method: 'POST', body: JSON.stringify(register ? { name, email, password, password_confirmation: password } : { email, password }) });
      setApiToken(result.token); setUser(result.user); setPassword(''); setMessage('Backend account connected.');
    } catch (e) { setMessage((e as Error).message); } finally { setBusy(false); }
  }
  async function logout() {
    try { await api('/auth/logout', { method: 'POST' }); } catch { /* token is cleared locally regardless */ }
    clearApiToken(); setUser(null); setTest(null);
  }
  async function generate(blueprintId?: number, modeName?: string) {
    setBusy(true); setMessage('');
    try {
      const payload = blueprintId ? { blueprint_id: blueprintId } : { mode: modeName, subject: modeName === 'subject' ? selectedSubject : undefined, chapter_id: modeName === 'chapter' ? Number(selectedChapter) : undefined, question_count: 20, duration_minutes: 40, pyq_only: modeName === 'pyq', weightage_source: modeName === 'weightage' ? weightageSource : undefined };
      const result = await api<{ data: GeneratedTest }>('/tests/generate', { method: 'POST', body: JSON.stringify(payload) });
      setTest(result.data); setMessage(`${result.data.questions.length} approved questions loaded from backend.`);
    } catch (e) { setMessage((e as Error).message); } finally { setBusy(false); }
  }
  function startTimedTest() {
    if (!test) return;
    const questions: Question[] = test.questions.map((q) => ({
      id: String(q.id), subjectId: q.subject.code, chapterId: q.chapter.slug, chapterName: q.chapter.name,
      topicName: q.topic_name || '', difficulty: q.difficulty, questionType: q.question_type,
      stem: q.stem, options: q.options, correctOption: 'A', explanation: '', ncertReference: '',
      isPyq: q.is_pyq, pyqYear: q.pyq_year, sourceLabel: q.source_label || 'Approved question',
      sourceUrl: q.source_url || undefined, sourcePage: q.source_page || undefined,
      sourceQuestionNumber: q.source_question_number || undefined, reviewStatus: 'approved',
    }));
    onStartTest({ id: `backend-${test.id}`, title: test.title, category: test.test_category,
      durationMinutes: test.duration_minutes, positiveMarks: test.positive_marks,
      negativeMarks: test.negative_marks, questions, startedAt: new Date().toISOString() });
    setTest(null);
  }
  async function reviewQuestion(id: number, status: 'approved' | 'rejected') {
    try { await api(`/admin/questions/${id}/review`, { method: 'PATCH', body: JSON.stringify({ review_status: status }) }); await refreshQuestions(); setMessage(`Question ${status}.`); }
    catch (e) { setMessage((e as Error).message); }
  }
  async function archiveQuestion(id: number) {
    try { await api(`/admin/questions/${id}`, { method: 'DELETE' }); await refreshQuestions(); setMessage('Question removed from the active bank.'); }
    catch (e) { setMessage((e as Error).message); }
  }
  function editQuestion(q: any) {
    setEditingQuestionId(q.id);
    setImportText(JSON.stringify({
      subject_id: q.subject?.code, chapter_id: q.chapter?.slug, topic_name: q.topic_name,
      difficulty: q.difficulty, stem: q.stem, options: q.options, correct_option: q.correct_option,
      explanation: q.explanation, ncert_reference: q.ncert_reference, is_pyq: q.is_pyq,
      pyq_year: q.pyq_year, source_label: q.source_label, source_url: q.source_url,
      source_page: q.source_page, source_question_number: q.source_question_number, content_license: q.content_license,
    }, null, 2));
    document.getElementById('question-editor')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  async function importQuestions() {
    try {
      const rows = JSON.parse(importText);
      if (!Array.isArray(rows) || rows.length !== 1 && editingQuestionId) throw new Error('Editing expects exactly one question row.');
      if (editingQuestionId) {
        await api(`/admin/questions/${editingQuestionId}`, { method: 'PUT', body: JSON.stringify(rows[0]) });
        setMessage('Question updated and returned to pending review.'); setEditingQuestionId(null);
      } else {
        const result = await api<{ created: number; duplicates: number; invalid: number }>('/admin/questions/import', { method: 'POST', body: JSON.stringify({ questions: rows }) });
        setMessage(`Imported ${result.created}; duplicates ${result.duplicates}; invalid ${result.invalid}. Imported rows remain pending review.`);
      }
      setImportText(''); await refreshQuestions();
    }
    catch (e) { setMessage((e as Error).message); }
  }
  async function importCsv(file?: File) {
    if (!file) return;
    try {
      if (file.name.toLowerCase().endsWith('.json')) { setImportText(await file.text()); setMessage('JSON loaded. Review it, then choose Import.'); return; }
      const matrix = parseCsv((await file.text()).replace(/^\uFEFF/, ''));
      if (matrix.length < 2) throw new Error('CSV needs a header and at least one question row.');
      const headers = matrix[0].map((header) => header.toLowerCase());
      const required = ['subject_id','chapter_id','question','option_a','option_b','option_c','option_d','answer'];
      const missing = required.filter((header) => !headers.includes(header));
      if (missing.length) throw new Error(`Missing CSV columns: ${missing.join(', ')}`);
      const rows = matrix.slice(1).map((cells) => Object.fromEntries(headers.map((header, index) => [header, cells[index] || ''])));
      const normalized = rows.map((row: Record<string,string>) => {
        const subject = subjects.find((item) => item.code === row.subject_id.toLowerCase());
        const chapter = subject?.chapters.find((item) => item.slug === row.chapter_id || item.official_unit_code === row.chapter_id);
        if (!subject || !chapter) throw new Error(`Unknown subject/chapter in CSV row ${rows.indexOf(row) + 2}.`);
        const pyq = Boolean(row.pyq_year?.trim());
        return {
          subject_id: subject.code, chapter_id: chapter.slug, topic_name: row.topic || null,
          difficulty: ['easy','medium','hard'].includes(row.difficulty?.toLowerCase()) ? row.difficulty.toLowerCase() : 'medium',
          stem: row.question, options: [row.option_a,row.option_b,row.option_c,row.option_d].map((text,index)=>({ id: ['A','B','C','D'][index], text })),
          correct_option: row.answer.toUpperCase(), explanation: row.explanation || null,
          ncert_reference: row.ncert_reference || null, is_pyq: pyq,
          pyq_year: pyq ? Number(row.pyq_year) : null, source_label: row.source_label || null,
          source_url: row.source_url || null, source_page: row.source_page || null,
          source_question_number: row.source_question_number || null,
          content_license: row.content_license || null,
        };
      });
      const result = await api<{ created: number; duplicates: number; invalid: number }>('/admin/questions/import', { method: 'POST', body: JSON.stringify({ questions: normalized }) });
      setMessage(`CSV imported: ${result.created} added to review, ${result.duplicates} duplicates, ${result.invalid} invalid.`); await refreshQuestions();
    } catch (error) { setMessage((error as Error).message); }
  }
  async function saveResource(event: FormEvent) {
    event.preventDefault();
    try {
      await api(editingResourceId ? `/admin/resources/${editingResourceId}` : '/admin/resources', { method: editingResourceId ? 'PUT' : 'POST', body: JSON.stringify({ ...resourceForm, subject_id: resourceForm.subject_id ? Number(resourceForm.subject_id) : null, chapter_id: resourceForm.chapter_id ? Number(resourceForm.chapter_id) : null, is_active: true }) });
      setResourceForm(emptyResource); setEditingResourceId(null); setMessage(editingResourceId ? 'Resource updated.' : 'Resource saved to backend catalog.'); await refreshResources();
    }
    catch (e) { setMessage((e as Error).message); }
  }
  function editResource(resource: any) {
    setEditingResourceId(resource.id);
    setResourceForm({ title: resource.title, provider: resource.provider, url: resource.url, description: resource.description || '', resource_type: resource.resource_type, is_official: Boolean(resource.is_official), subject_id: resource.subject_id ? String(resource.subject_id) : '', chapter_id: resource.chapter_id ? String(resource.chapter_id) : '' });
  }
  async function archiveResource(id: number) {
    try { await api(`/admin/resources/${id}`, { method: 'DELETE' }); await refreshResources(); setMessage('Resource archived.'); }
    catch (e) { setMessage((e as Error).message); }
  }
  async function saveBlueprint(event: FormEvent) {
    event.preventDefault();
    const count = Number(blueprintForm.question_count);
    try {
      const blueprint = blueprints.find((item) => item.id === editingBlueprintId);
      const oldCounts = blueprint?.config.subject_counts || Object.fromEntries(subjects.map((subject) => [subject.code, 1]));
      const oldTotal = Object.values(oldCounts).reduce((sum, value) => sum + value, 0) || 1;
      const subjectCounts = Object.fromEntries(Object.entries(oldCounts).map(([code, value]) => [code, Math.floor(count * value / oldTotal)]));
      const remainder = count - Object.values(subjectCounts).reduce((sum, value) => sum + value, 0);
      const firstCode = Object.keys(subjectCounts)[0];
      if (firstCode) subjectCounts[firstCode] += remainder;
      const config = { ...(blueprint?.config || {}), question_count: count, subject_counts: subjectCounts, difficulty_mix: blueprint?.config.difficulty_mix || { easy: 0.3, medium: 0.5, hard: 0.2 } };
      await api(editingBlueprintId ? `/admin/test-blueprints/${editingBlueprintId}` : '/admin/test-blueprints', { method: editingBlueprintId ? 'PUT' : 'POST', body: JSON.stringify({ slug: blueprint?.slug, title: blueprintForm.title, cadence: blueprintForm.cadence, test_category: blueprint?.test_category || (blueprintForm.cadence === 'monthly' ? 'full_syllabus' : 'minor_test'), config, duration_minutes: Number(blueprintForm.duration_minutes), positive_marks: blueprint?.positive_marks || 4, negative_marks: blueprint?.negative_marks || 1, pyq_only: blueprint?.pyq_only || false, is_active: blueprint?.is_active ?? true }) });
      setMessage(editingBlueprintId ? 'Test blueprint updated.' : 'Test blueprint created. It will become available when the approved bank has enough questions.');
      setEditingBlueprintId(null); await refreshBlueprints();
    }
    catch (e) { setMessage((e as Error).message); }
  }
  async function refreshBlueprints() {
    try { const result = await api<{ data: Blueprint[] }>('/admin/test-blueprints'); setBlueprints(result.data); }
    catch (e) { setMessage((e as Error).message); }
  }
  function editBlueprint(blueprint: Blueprint) {
    setEditingBlueprintId(blueprint.id);
    setBlueprintForm({ title: blueprint.title, cadence: blueprint.cadence, question_count: blueprint.config.question_count || 60, duration_minutes: blueprint.duration_minutes });
  }
  async function setBlueprintActive(blueprint: Blueprint, isActive: boolean) {
    try {
      await api(`/admin/test-blueprints/${blueprint.id}`, { method: 'PUT', body: JSON.stringify({ slug: blueprint.slug, title: blueprint.title, cadence: blueprint.cadence, test_category: blueprint.test_category, config: blueprint.config, duration_minutes: blueprint.duration_minutes, positive_marks: blueprint.positive_marks, negative_marks: blueprint.negative_marks, pyq_only: blueprint.pyq_only, is_active: isActive }) });
      await refreshBlueprints(); setMessage(isActive ? 'Blueprint activated.' : 'Blueprint deactivated.');
    } catch (e) { setMessage((e as Error).message); }
  }
  async function addTopic(event: FormEvent) {
    event.preventDefault(); if (!selectedChapter) return;
    try {
      await api(`/admin/chapters/${selectedChapter}/topics`, { method: 'POST', body: JSON.stringify({ name: topicName }) });
      const result = await api<{ subjects: ApiSubject[] }>('/syllabus'); setSubjects(result.subjects); setTopicName(''); setMessage('Topic added to chapter.');
    } catch (e) { setMessage((e as Error).message); }
  }
  async function updateTopic(topic: ApiTopic) {
    const name = window.prompt('Update topic name', topic.name)?.trim();
    if (!name || name === topic.name) return;
    try { await api(`/admin/topics/${topic.id}`, { method: 'PUT', body: JSON.stringify({ name, position: topic.position }) }); const result = await api<{ subjects: ApiSubject[] }>('/syllabus'); setSubjects(result.subjects); }
    catch (e) { setMessage((e as Error).message); }
  }
  async function deleteTopic(topic: ApiTopic) {
    if (!window.confirm(`Delete topic “${topic.name}”?`)) return;
    try { await api(`/admin/topics/${topic.id}`, { method: 'DELETE' }); const result = await api<{ subjects: ApiSubject[] }>('/syllabus'); setSubjects(result.subjects); setMessage('Topic deleted.'); }
    catch (e) { setMessage((e as Error).message); }
  }
  async function saveWeightage(event: FormEvent) {
    event.preventDefault(); if (!selectedChapter) return;
    try { await api(`/admin/chapters/${selectedChapter}/weightage`, { method: 'PATCH', body: JSON.stringify({ weightage_percent: Number(weightage), expected_questions: expectedQuestions === '' ? 0 : Number(expectedQuestions), reference_year: new Date().getFullYear() }) }); const result = await api<{ subjects: ApiSubject[] }>('/syllabus'); setSubjects(result.subjects); setMessage('Weightage estimate saved and labelled as admin estimate.'); }
    catch (e) { setMessage((e as Error).message); }
  }

  const accessAllowed = user && (mode === 'student' || user.role === 'admin');
  const filteredBlueprints = blueprints.filter((blueprint) =>
    (blueprintGroup === 'all' || blueprint.config.plan_group === blueprintGroup) &&
    (!blueprintSearch.trim() || blueprint.title.toLowerCase().includes(blueprintSearch.trim().toLowerCase()))
  );
  const blueprintPageSize = mode === 'admin' ? 10 : 12;
  const blueprintPageCount = Math.max(1, Math.ceil(filteredBlueprints.length / blueprintPageSize));
  const visibleBlueprints = filteredBlueprints.slice((blueprintPage - 1) * blueprintPageSize, blueprintPage * blueprintPageSize);
  return <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2"><div className="rounded-xl bg-indigo-50 p-2 text-indigo-700">{mode === 'admin' ? <Database size={19}/> : <BookOpenCheck size={19}/>}</div><div><h2 className="font-bold text-slate-900">{mode === 'admin' ? 'Backend Admin Studio' : 'Backend Test Series'}</h2><p className="text-xs text-slate-500">{mode === 'admin' ? 'Question review and bank import' : 'Server generated tests from approved questions'}</p></div></div>
      {user && <button onClick={() => void logout()} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600"><LogOut size={14}/> Sign out</button>}
    </div>
    {message && <div role="status" className="mb-4 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">{message}</div>}
    {user && mode === 'admin' && user.role !== 'admin' && <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">This account has student access. Sign out and connect with an admin account to manage questions, resources, and test blueprints.</div>}
    {!user && <form onSubmit={(e) => void signIn(e)} className="grid gap-3 sm:grid-cols-2">
      {register && <label className="text-xs font-semibold text-slate-600">Name<input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={name} onChange={(e)=>setName(e.target.value)} required/></label>}
      <label className="text-xs font-semibold text-slate-600">Email<input type="email" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={email} onChange={(e)=>setEmail(e.target.value)} required/></label>
      <label className="text-xs font-semibold text-slate-600">Password<input type="password" minLength={register ? 10 : 1} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={password} onChange={(e)=>setPassword(e.target.value)} required/></label>
      <div className="flex items-center gap-2 sm:col-span-2"><button disabled={busy} className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"><KeyRound size={15}/>{busy ? 'Connectingâ€¦' : register ? 'Create student account' : 'Connect to backend'}</button>{mode === 'student' && <button type="button" onClick={()=>setRegister(!register)} className="px-2 py-2 text-xs font-semibold text-blue-700">{register ? 'Have an account? Sign in' : 'New student? Create account'}</button>}{mode === 'admin' && <span className="text-xs text-slate-500">Admin account: create with <code>php artisan neet:make-admin email@example.com</code></span>}</div>
    </form>}
    {accessAllowed && mode === 'student' && !test && <>
      <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50/70 p-4">
        <div className="flex flex-wrap items-start justify-between gap-2"><div><h3 className="text-sm font-bold text-slate-900">Anytime preparation plan</h3><p className="mt-1 text-xs leading-5 text-slate-600">{blueprints.filter((plan)=>plan.availability?.ready).length} of {blueprints.length} plans are ready from the approved question bank. Monthly plans include compact 48-question revision sets and separate 180-question full mocks. Actual PYQ papers unlock only when source-traced questions are available. Start a ready plan whenever you want and repeat attempts.</p></div><span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-blue-800">{blueprints.length} plans</span></div>
        <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_180px]"><input aria-label="Search test plans" value={blueprintSearch} onChange={(e)=>{setBlueprintSearch(e.target.value);setBlueprintPage(1);}} placeholder="Search week, subject, chapter or PYQ year" className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"/><select aria-label="Filter test plan type" value={blueprintGroup} onChange={(e)=>{setBlueprintGroup(e.target.value);setBlueprintPage(1);}} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"><option value="all">All plan types</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option><option value="pyq">PYQ papers</option><option value="subject">Subject-wise</option><option value="chapter">Chapter-wise</option></select></div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {visibleBlueprints.map((b)=><button key={b.id} disabled={busy || (b.availability ? !b.availability.ready : false)} onClick={()=>void generate(b.id)} className="rounded-xl border border-slate-200 p-4 text-left transition hover:border-blue-400 hover:bg-blue-50/40 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-75"><div className="mb-2 flex items-center justify-between gap-2"><span className="rounded-full bg-blue-50 px-2 py-1 text-[10px] font-bold uppercase text-blue-700">{b.config.plan_group || b.cadence}{b.config.sequence ? ` · ${String(b.config.sequence).padStart(2,'0')}` : ''}</span>{b.availability?.ready ? <Play size={16} className="shrink-0 text-blue-700"/> : <span className="shrink-0 text-[10px] font-semibold text-amber-700">Bank needed</span>}</div><strong className="text-sm">{b.title}</strong><p className="mt-1 text-xs text-slate-500">{b.config.question_count ?? 'Custom'} questions · {b.duration_minutes} min · anytime</p><p className={`mt-2 text-[11px] font-semibold ${b.availability?.ready ? 'text-emerald-700' : 'text-amber-700'}`}>{b.availability ? `${b.availability.available}/${b.availability.required} approved questions available` : 'Availability updates after bank check'}</p></button>)}
      {visibleBlueprints.length===0&&<p className="rounded-xl border border-dashed border-slate-300 p-5 text-sm text-slate-500 sm:col-span-2 lg:col-span-3">No plans match this search.</p>}
      <div className="flex items-center justify-between text-xs text-slate-500 sm:col-span-2 lg:col-span-3"><span>{filteredBlueprints.length} plans · Page {blueprintPage} of {blueprintPageCount}</span><div className="flex gap-2"><button disabled={blueprintPage<=1} onClick={()=>setBlueprintPage(blueprintPage-1)} className="rounded-lg border px-3 py-1.5 font-semibold disabled:opacity-40">Previous</button><button disabled={blueprintPage>=blueprintPageCount} onClick={()=>setBlueprintPage(blueprintPage+1)} className="rounded-lg border px-3 py-1.5 font-semibold disabled:opacity-40">Next</button></div></div>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <div className="rounded-xl border border-slate-200 p-4"><label className="block text-xs font-semibold text-slate-600">Subject<select value={selectedSubject} onChange={(e)=>setSelectedSubject(e.target.value)} className="mt-2 w-full rounded-lg border p-2 text-sm">{subjects.map((s)=><option key={s.code} value={s.code}>{s.name}</option>)}</select></label><button disabled={busy} onClick={()=>void generate(undefined,'subject')} className="mt-3 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-bold text-white"><Play size={14}/>Generate subject test</button></div>
      <div className="rounded-xl border border-slate-200 p-4"><label className="block text-xs font-semibold text-slate-600">Chapter<select value={selectedChapter} onChange={(e)=>setSelectedChapter(e.target.value)} className="mt-2 w-full rounded-lg border p-2 text-sm"><option value="">Choose chapter</option>{subjects.flatMap((s)=>s.chapters.map((c)=><option key={c.id} value={c.id}>{s.name} Â· {c.name}</option>))}</select></label><button disabled={busy||!selectedChapter} onClick={()=>void generate(undefined,'chapter')} className="mt-3 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-bold text-white"><Play size={14}/>Generate chapter test</button></div>
      {(['weightage','pyq'] as const).map((m)=><div key={m} className="rounded-xl border border-slate-200 p-4"><strong className="capitalize">{m}-wise test</strong>{m==='weightage'&&<label className="mt-2 block text-xs font-semibold text-slate-600">Distribution<select value={weightageSource} onChange={(e)=>setWeightageSource(e.target.value as typeof weightageSource)} className="mt-1 w-full rounded-lg border p-2 text-xs"><option value="verified_pyq_frequency">Verified PYQ frequency</option><option value="admin_estimate">Admin chapter estimates</option><option value="equal">Equal chapter distribution</option></select></label>}<p className="mt-1 text-xs text-slate-500">{m==='weightage'?'Uses approved PYQ counts or available chapter estimates':'Uses sourced, approved PYQs only'}</p><button disabled={busy} onClick={()=>void generate(undefined,m)} className="mt-3 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-bold text-white"><Play size={14}/>Generate test</button></div>)}
      </div>
    </>}
    {accessAllowed && mode === 'student' && test && <div className="rounded-xl border border-blue-200 bg-blue-50 p-5"><h3 className="font-bold text-slate-900">{test.title}</h3><p className="mt-1 text-sm text-slate-600">{test.questions.length} questions · {test.duration_minutes} minutes · +{test.positive_marks}/−{test.negative_marks}</p><div className="mt-4 flex gap-2"><button onClick={startTimedTest} className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-bold text-white"><Play size={16}/>Start timed NEET test</button><button onClick={()=>setTest(null)} className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold">Cancel</button></div></div>}    {accessAllowed && mode === 'admin' && <div className="grid gap-5 lg:grid-cols-2">
      <div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2"><h3 className="flex items-center gap-2 text-sm font-bold"><ShieldCheck size={16}/>Question bank review ({questionTotal})</h3><select aria-label="Question review status" value={questionStatus} onChange={(e)=>{setQuestionStatus(e.target.value);setQuestionPage(1);void refreshQuestions(e.target.value,1);}} className="rounded-lg border border-slate-300 px-2 py-1.5 text-xs"><option value="pending_review">Pending review</option><option value="approved">Approved</option><option value="rejected">Rejected</option></select></div>
        {adminQuestions.length===0?<p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-500">No {questionStatus.replace('_',' ')} question rows in the backend.</p>:<div className="max-h-[34rem] space-y-2 overflow-auto">{adminQuestions.map((q)=><article key={q.id} className="rounded-xl border p-3"><p className="whitespace-pre-wrap text-sm">{q.stem}</p><p className="mt-1 text-[11px] text-slate-500">{q.subject?.name} · {q.chapter?.name} · {q.is_pyq?'PYQ '+q.pyq_year:'Practice'} · {q.review_status}</p><div className="mt-2 grid gap-1 sm:grid-cols-2">{(q.options||[]).map((o:Option)=><p key={o.id} className="text-xs"><b>{o.id}.</b> {o.text}</p>)}</div><p className="mt-2 text-xs font-semibold text-emerald-800">Stored key: {q.correct_option}</p>{q.explanation&&<p className="mt-1 text-xs text-slate-600">{q.explanation}</p>}{q.is_pyq && <a className="mt-1 block truncate text-xs text-blue-700 underline" href={q.source_url} target="_blank" rel="noreferrer">{q.source_label}: source page {q.source_page}, Q{q.source_question_number}</a>}<div className="mt-2 flex flex-wrap gap-2">{q.review_status==='pending_review'&&<><button onClick={()=>void reviewQuestion(q.id,'approved')} className="rounded bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white">Approve</button><button onClick={()=>void reviewQuestion(q.id,'rejected')} className="rounded border px-3 py-1.5 text-xs font-bold">Reject</button></>}<button onClick={()=>editQuestion(q)} className="inline-flex items-center gap-1 rounded border px-3 py-1.5 text-xs font-semibold"><Pencil size={12}/>Edit</button>{q.review_status!=='rejected'&&<button onClick={()=>void archiveQuestion(q.id)} className="inline-flex items-center gap-1 rounded border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700"><Trash2 size={12}/>Remove</button>}</div></article>)}</div>}
        <div className="mt-2 flex items-center justify-between gap-2 text-xs text-slate-600"><span>Page {questionPage} of {questionLastPage}</span><div className="flex gap-2"><button disabled={questionPage<=1} onClick={()=>void refreshQuestions(questionStatus,questionPage-1)} className="rounded-lg border px-3 py-1.5 font-semibold disabled:opacity-40">Previous</button><button disabled={questionPage>=questionLastPage} onClick={()=>void refreshQuestions(questionStatus,questionPage+1)} className="rounded-lg border px-3 py-1.5 font-semibold disabled:opacity-40">Next</button></div></div>
      </div>
      <div id="question-editor"><h3 className="mb-2 flex items-center gap-2 text-sm font-bold"><Upload size={16}/>{editingQuestionId ? `Edit question #${editingQuestionId}` : 'Import questions'}</h3><p className="mb-2 text-xs text-slate-500">JSON rows or CSV. Use backend subject codes and chapter slugs/unit codes. Imported or edited rows return to review first.</p><a href="/question-import-template.csv" download className="mb-2 inline-flex rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-blue-800 underline">Download CSV template</a><label className="mb-2 block text-xs font-semibold text-slate-600">Load CSV / JSON file<input type="file" accept=".csv,.json,text/csv,application/json" onChange={(e)=>{const file=e.target.files?.[0];e.currentTarget.value='';void importCsv(file);}} className="mt-1 block w-full rounded-lg border border-slate-300 p-2 text-xs"/></label><textarea value={importText} onChange={(e)=>setImportText(e.target.value)} placeholder={'[{"subject_id":"physics","chapter_id":"physics-unit-01-physics","difficulty":"medium","stem":"...","options":[{"id":"A","text":"..."},{"id":"B","text":"..."},{"id":"C","text":"..."},{"id":"D","text":"..."}],"correct_option":"A"}]'} className="h-52 w-full rounded-lg border border-slate-300 p-3 font-mono text-xs"/><div className="mt-2 flex flex-wrap gap-2"><button onClick={()=>void importQuestions()} disabled={!importText||busy} className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-bold text-white">{editingQuestionId?'Save question changes':'Import question rows'}</button>{editingQuestionId&&<button onClick={()=>{setEditingQuestionId(null);setImportText('');}} className="inline-flex items-center gap-1 rounded-lg border px-4 py-2 text-xs font-semibold"><X size={13}/>Cancel edit</button>}</div><p className="mt-2 text-[11px] text-slate-500">CSV headers: subject_id, chapter_id, question, option_a, option_b, option_c, option_d, answer. Optional: topic, difficulty, explanation, ncert_reference, pyq_year, source_label, source_url, source_page, source_question_number, content_license.</p></div>
      <div><h3 className="mb-2 text-sm font-bold">Study resource catalog</h3><form onSubmit={(e)=>void saveResource(e)} className="grid gap-2 sm:grid-cols-2"><input required placeholder="Resource title" value={resourceForm.title} onChange={(e)=>setResourceForm({...resourceForm,title:e.target.value})} className="rounded-lg border p-2 text-xs"/><input required placeholder="Provider" value={resourceForm.provider} onChange={(e)=>setResourceForm({...resourceForm,provider:e.target.value})} className="rounded-lg border p-2 text-xs"/><input required type="url" placeholder="https://" value={resourceForm.url} onChange={(e)=>setResourceForm({...resourceForm,url:e.target.value})} className="rounded-lg border p-2 text-xs sm:col-span-2"/><input placeholder="Short description" value={resourceForm.description} onChange={(e)=>setResourceForm({...resourceForm,description:e.target.value})} className="rounded-lg border p-2 text-xs sm:col-span-2"/><select aria-label="Resource subject" value={resourceForm.subject_id} onChange={(e)=>setResourceForm({...resourceForm,subject_id:e.target.value,chapter_id:''})} className="rounded-lg border p-2 text-xs"><option value="">All subjects</option>{subjects.map((subject)=><option key={subject.id} value={subject.id}>{subject.name}</option>)}</select><select aria-label="Resource chapter" value={resourceForm.chapter_id} onChange={(e)=>setResourceForm({...resourceForm,chapter_id:e.target.value})} disabled={!resourceForm.subject_id} className="rounded-lg border p-2 text-xs disabled:bg-slate-100"><option value="">All chapters</option>{subjects.find((subject)=>String(subject.id)===resourceForm.subject_id)?.chapters.map((chapter)=><option key={chapter.id} value={chapter.id}>{chapter.name}</option>)}</select><select value={resourceForm.resource_type} onChange={(e)=>setResourceForm({...resourceForm,resource_type:e.target.value})} className="rounded-lg border p-2 text-xs"><option value="reference">Reference</option><option value="syllabus">Syllabus</option><option value="textbook">Textbook</option><option value="practice">Practice</option><option value="pyq_source">PYQ source</option><option value="video">Video</option><option value="notes">Notes</option><option value="course">Course</option></select><label className="flex items-center gap-2 rounded-lg border px-2 text-xs"><input type="checkbox" checked={resourceForm.is_official} onChange={(e)=>setResourceForm({...resourceForm,is_official:e.target.checked})}/>Official source</label><button className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white sm:col-span-2">{editingResourceId?'Update resource':'Add resource'}</button>{editingResourceId&&<button type="button" onClick={()=>{setEditingResourceId(null);setResourceForm(emptyResource);}} className="rounded-lg border px-3 py-2 text-xs font-semibold sm:col-span-2">Cancel edit</button>}</form><div className="mt-3 max-h-48 space-y-1 overflow-auto">{resources.map((r)=><div key={r.id} className="flex items-center gap-2 rounded-lg bg-slate-50 p-2 text-xs"><a className="min-w-0 flex-1 truncate text-blue-700 underline" href={r.url} target="_blank" rel="noreferrer">{r.title}</a><button aria-label={`Edit ${r.title}`} onClick={()=>editResource(r)} className="inline-flex shrink-0 items-center gap-1 text-slate-700"><Pencil size={12}/>Edit</button><button onClick={()=>void archiveResource(r.id)} className="shrink-0 text-rose-700">Archive</button></div>)}</div></div>
      <div><h3 className="mb-2 text-sm font-bold">Weekly / monthly test blueprints</h3><div className="mb-3 max-h-40 space-y-1 overflow-auto">{blueprints.map((blueprint)=><div key={blueprint.id} className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 p-2 text-xs"><div className="min-w-0"><strong className="block truncate">{blueprint.title}</strong><span className="text-slate-500">{blueprint.cadence} · {blueprint.config.question_count} questions · {blueprint.is_active?'Active':'Inactive'}</span></div><div className="flex shrink-0 gap-2"><button onClick={()=>editBlueprint(blueprint)} aria-label={`Edit ${blueprint.title}`} className="text-blue-700"><Pencil size={14}/></button><button onClick={()=>void setBlueprintActive(blueprint,!blueprint.is_active)} className={blueprint.is_active?'text-rose-700':'text-emerald-700'}>{blueprint.is_active?'Deactivate':'Activate'}</button></div></div>)}</div><form onSubmit={(e)=>void saveBlueprint(e)} className="grid gap-2 sm:grid-cols-2"><input required value={blueprintForm.title} onChange={(e)=>setBlueprintForm({...blueprintForm,title:e.target.value})} className="rounded-lg border p-2 text-xs sm:col-span-2"/><select value={blueprintForm.cadence} onChange={(e)=>{const cadence=e.target.value;setBlueprintForm({...blueprintForm,cadence,question_count:cadence==='monthly'?180:cadence==='weekly'?60:20,duration_minutes:cadence==='monthly'?180:cadence==='weekly'?90:40})}} className="rounded-lg border p-2 text-xs"><option value="weekly">Weekly</option><option value="monthly">Monthly</option><option value="custom">Custom</option></select><input type="number" min="1" max="180" value={blueprintForm.question_count} onChange={(e)=>setBlueprintForm({...blueprintForm,question_count:Number(e.target.value)})} className="rounded-lg border p-2 text-xs"/><input type="number" min="5" max="300" value={blueprintForm.duration_minutes} onChange={(e)=>setBlueprintForm({...blueprintForm,duration_minutes:Number(e.target.value)})} className="rounded-lg border p-2 text-xs"/><button className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white">{editingBlueprintId?'Update blueprint':'Save blueprint'}</button>{editingBlueprintId&&<button type="button" onClick={()=>{setEditingBlueprintId(null);setBlueprintForm({title:'Weekly NEET Test',cadence:'weekly',question_count:60,duration_minutes:90});}} className="rounded-lg border px-3 py-2 text-xs font-semibold">Cancel edit</button>}</form><p className="mt-2 text-[11px] text-slate-500">Question distribution is balanced across subjects. The generator never fills missing questions with generated or unreviewed content.</p></div>
      <div><h3 className="mb-2 text-sm font-bold">Chapter topics and weightage</h3><select value={selectedChapter} onChange={(e)=>{const id=e.target.value;setSelectedChapter(id);const chapter=subjects.flatMap((subject)=>subject.chapters).find((item)=>String(item.id)===id);setWeightage(chapter?.weightage_percent==null?'':String(chapter.weightage_percent));setExpectedQuestions(chapter?.expected_questions==null?'':String(chapter.expected_questions));}} className="mb-2 w-full rounded-lg border p-2 text-xs"><option value="">Choose chapter</option>{subjects.flatMap((s)=>s.chapters.map((c)=><option key={c.id} value={c.id}>{s.name} · {c.name}</option>))}</select><form onSubmit={(e)=>void addTopic(e)} className="mb-3 flex gap-2"><input required value={topicName} onChange={(e)=>setTopicName(e.target.value)} placeholder="Add a chapter topic" disabled={!selectedChapter} className="min-w-0 flex-1 rounded-lg border p-2 text-xs"/><button disabled={!selectedChapter||!topicName.trim()} className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white"><Plus size={13}/>Add</button></form><div className="mb-3 max-h-36 space-y-1 overflow-auto">{subjects.flatMap((subject)=>subject.chapters.filter((chapter)=>String(chapter.id)===selectedChapter).flatMap((chapter)=>chapter.topics||[])).map((topic)=><div key={topic.id} className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-2 py-1.5 text-xs"><span>{topic.name}</span><span className="flex gap-2"><button onClick={()=>void updateTopic(topic)} aria-label={`Edit ${topic.name}`} className="text-blue-700"><Pencil size={13}/></button><button onClick={()=>void deleteTopic(topic)} aria-label={`Delete ${topic.name}`} className="text-rose-700"><Trash2 size={13}/></button></span></div>)}</div><form onSubmit={(e)=>void saveWeightage(e)} className="flex flex-wrap gap-2"><input aria-label="Weightage percentage" type="number" min="0" max="100" step="0.1" required value={weightage} onChange={(e)=>setWeightage(e.target.value)} placeholder="Weightage %" className="w-28 rounded-lg border p-2 text-xs"/><input aria-label="Expected questions per full test" type="number" min="0" max="45" value={expectedQuestions} onChange={(e)=>setExpectedQuestions(e.target.value)} placeholder="Expected Qs" className="w-28 rounded-lg border p-2 text-xs"/><button disabled={!selectedChapter} className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white">Save estimate</button></form><p className="mt-2 text-[11px] text-amber-700">Manual values are labelled as admin estimates. Verified PYQ frequency is calculated separately from approved, source-traced questions.</p></div>
    </div>}
  </section>;
}


