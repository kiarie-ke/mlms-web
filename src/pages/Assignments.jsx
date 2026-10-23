import { useState } from 'react';
import { useAuth } from '../lib/auth.jsx';
import { api } from '../lib/api.js';
import { Badge, Field, Loading, Modal, Notice, PageHeader, Select, Table, TextArea, useFetch } from '../components/ui.jsx';
import { errMsg, fmtDate } from '../lib/format.js';

function Grading({ assignment, onClose }) {
  const { data, error, reload } = useFetch(`/assignments/${assignment.id}/submissions`);
  const [grade, setGrade] = useState({});
  const [msg, setMsg] = useState('');
  const save = async (sub) => {
    const g = grade[sub.id] ?? {};
    try {
      await api.patch(`/submissions/${sub.id}/grade`, { score: Number(g.score ?? sub.score), feedback: g.feedback ?? sub.feedback ?? '' });
      setMsg('');
      reload();
    } catch (err) { setMsg(errMsg(err)); }
  };
  const upd = (id, k, v) => setGrade((g) => ({ ...g, [id]: { ...g[id], [k]: v } }));
  return (
    <Modal title={`Submissions: ${assignment.title}`} onClose={onClose}>
      {!data ? <Loading error={error} /> : (
        <div className="max-h-[60vh] space-y-3 overflow-y-auto">
          <Notice error>{msg}</Notice>
          {data.submissions.map((s) => (
            <div key={s.id} className="rounded-sm border border-line p-3 text-sm">
              <p className="font-medium">{s.student?.user?.name ?? 'Student'}</p>
              {s.text && <p className="mt-1 whitespace-pre-wrap">{s.text}</p>}
              {s.link && <a className="text-brand" href={s.link} target="_blank" rel="noreferrer noopener">{s.link}</a>}
              {s.fileName && <a className="mt-1 block text-brand" href={`/api/submissions/${s.id}/file`}>{s.fileName}</a>}
              <div className="mt-2 flex gap-2">
                <input className="input w-24" type="number" min="0" max={data.assignment.maxScore} placeholder={`/${data.assignment.maxScore}`} defaultValue={s.score ?? ''} onChange={(e) => upd(s.id, 'score', e.target.value)} />
                <input className="input" placeholder="Feedback" defaultValue={s.feedback ?? ''} onChange={(e) => upd(s.id, 'feedback', e.target.value)} />
                <button className="btn-primary" onClick={() => save(s)}>Save</button>
              </div>
            </div>
          ))}
          {!data.submissions.length && <p className="text-sm text-ink-soft">No submissions yet.</p>}
        </div>
      )}
    </Modal>
  );
}

export default function Assignments() {
  const { user } = useAuth();
  const staff = user.role !== 'STUDENT';
  const { data, error, reload } = useFetch('/assignments');
  const cohorts = useFetch(staff ? '/cohorts' : null);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [msg, setMsg] = useState('');
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const open = (kind, initial = {}) => { setForm(initial); setMsg(''); setModal(kind); };

  const create = async (e) => {
    e.preventDefault();
    try {
      await api.post('/assignments', { cohortId: form.cohortId, title: form.title, description: form.description, maxScore: Number(form.maxScore || 100), dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : undefined });
      setModal(null); reload();
    } catch (err) { setMsg(errMsg(err)); }
  };
  const submit = async (e) => {
    e.preventDefault();
    try {
      const body = new FormData();
      if (form.text?.trim()) body.append('text', form.text);
      if (form.link) body.append('link', form.link);
      if (form.file) body.append('file', form.file);
      await api.post(`/assignments/${form.id}/submit`, body);
      setModal(null); reload();
    } catch (err) { setMsg(errMsg(err)); }
  };
  const remove = async (a) => { if (window.confirm('Delete this assignment and its submissions?')) { await api.del(`/assignments/${a.id}`); reload(); } };

  if (!data) return <Loading error={error} />;
  return (
    <>
      <PageHeader title={staff ? 'Assignments & grading' : 'Assignments'}>
        {staff && <button className="btn-primary" onClick={() => open('create', { maxScore: 100 })}>New assignment</button>}
      </PageHeader>
      <Table rows={data} columns={[
        { header: 'Title', cell: (a) => <><p className="font-medium">{a.title}</p><p className="text-xs text-ink-soft">{a.description}</p></> },
        { header: 'Due', cell: (a) => fmtDate(a.dueDate) },
        { header: 'Max', cell: (a) => a.maxScore },
        staff
          ? { header: 'Submissions', cell: (a) => `${a._count.submissions} (${a.graded} graded)` }
          : { header: 'My status', cell: (a) => a.submission ? (
            <div>
              {a.submission.score != null ? <span>{a.submission.score}/{a.maxScore} <span className="text-xs text-ink-soft">{a.submission.feedback}</span></span> : <Badge>Submitted</Badge>}
              {a.submission.fileName && <a className="mt-1 block text-xs text-brand" href={`/api/submissions/${a.submission.id}/file`}>{a.submission.fileName}</a>}
            </div>
          ) : <Badge>Pending</Badge> },
        { header: 'Actions', cell: (a) => staff ? (
          <div className="flex gap-3 text-sm"><button className="text-brand" onClick={() => open('grade', a)}>Grade</button><button className="text-red-600" onClick={() => remove(a)}>Delete</button></div>
        ) : !(a.submission?.score != null) && <button className="btn-ghost" onClick={() => open('submit', { id: a.id, text: a.submission?.text ?? '', link: a.submission?.link ?? '', fileName: a.submission?.fileName ?? '' })}>{a.submission ? 'Resubmit' : 'Submit'}</button> },
      ]} />
      {modal === 'create' && (
        <Modal title="New assignment" onClose={() => setModal(null)}>
          <form onSubmit={create}>
            <Select label="Cohort" required value={form.cohortId ?? ''} onChange={set('cohortId')}><option value="">Select…</option>{cohorts.data?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select>
            <Field label="Title" required value={form.title ?? ''} onChange={set('title')} />
            <TextArea label="Instructions" value={form.description ?? ''} onChange={set('description')} />
            <Field label="Max score" type="number" min="1" value={form.maxScore} onChange={set('maxScore')} />
            <Field label="Due date" type="date" value={form.dueDate ?? ''} onChange={set('dueDate')} />
            <Notice error>{msg}</Notice>
            <button className="btn-primary w-full">Create</button>
          </form>
        </Modal>
      )}
      {modal === 'submit' && (
        <Modal title="Submit work" onClose={() => setModal(null)}>
          <form onSubmit={submit}>
            <TextArea label="Your answer" rows="5" value={form.text} onChange={set('text')} />
            <Field label="Link (GitHub, CodePen…)" type="url" value={form.link} onChange={set('link')} />
            <label className="mb-3 block">
              <span className="label">Attachment (max 10 MB)</span>
              <input
                className="input"
                type="file"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.md,.zip,.png,.jpg,.jpeg,.gif,.html,.css,.js,.json"
                onChange={(e) => setForm({ ...form, file: e.target.files?.[0] })}
              />
              {form.file?.name && <span className="mt-1 block text-xs text-ink-soft">{form.file.name}</span>}
              {!form.file && form.fileName && <span className="mt-1 block text-xs text-ink-soft">Current file: {form.fileName}</span>}
            </label>
            <Notice error>{msg}</Notice>
            <button className="btn-primary w-full">Submit</button>
          </form>
        </Modal>
      )}
      {modal === 'grade' && <Grading assignment={form} onClose={() => { setModal(null); reload(); }} />}
    </>
  );
}
