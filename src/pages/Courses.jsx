import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { Field, Loading, Modal, Notice, PageHeader, useFetch } from '../components/ui.jsx';
import RichEditor from '../components/RichEditor.jsx';
import { errMsg } from '../lib/format.js';

// Files and links attached to a single lesson.
function Attachments({ lessonId }) {
  const { data, reload } = useFetch(`/lessons/${lessonId}`);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [file, setFile] = useState(null);
  const [msg, setMsg] = useState('');
  const add = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append('lessonId', lessonId);
    fd.append('title', title);
    if (url) fd.append('url', url);
    if (file) fd.append('file', file);
    try {
      const res = await fetch('/api/materials', { method: 'POST', body: fd, credentials: 'include' });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(Array.isArray(d.message) ? d.message.join(', ') : d.message || res.statusText);
      }
      setTitle(''); setUrl(''); setFile(null); setMsg(''); e.target.reset(); reload();
    } catch (err) { setMsg(errMsg(err)); }
  };
  const del = async (id) => { await api.del(`/materials/${id}`); reload(); };
  return (
    <div className="mt-2 rounded-sm border border-line p-3">
      <p className="mb-2 font-medium">Attachments (files, videos, links)</p>
      <ul className="mb-3 space-y-1 text-sm">
        {data?.materials.map((m) => <li key={m.id} className="flex justify-between"><span>{m.title} <span className="text-ink-soft">({m.url ? 'link' : m.fileName})</span></span><button type="button" className="text-red-600" onClick={() => del(m.id)}>Remove</button></li>)}
        {data && !data.materials.length && <li className="text-ink-soft">None yet.</li>}
      </ul>
      <form onSubmit={add} className="grid gap-2 sm:grid-cols-2">
        <input className="input" placeholder="Title" required value={title} onChange={(e) => setTitle(e.target.value)} />
        <input className="input" type="url" placeholder="Video or page link (YouTube plays inline)" value={url} onChange={(e) => setUrl(e.target.value)} />
        <input className="input" type="file" onChange={(e) => setFile(e.target.files[0] ?? null)} />
        <button className="btn-ghost" disabled={!url && !file}>Add attachment</button>
      </form>
      <Notice error>{msg}</Notice>
    </div>
  );
}

// Learning content authoring for admins and instructors.
function CourseTree({ id }) {
  const { data, reload } = useFetch(`/courses/${id}`);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [msg, setMsg] = useState('');

  const openModal = (m) => { setForm(m.initial ?? {}); setMsg(''); setModal(m); };
  const save = async (e) => {
    e.preventDefault();
    try {
      if (modal.kind === 'module') await api.post(`/courses/${id}/modules`, { title: form.title });
      if (modal.kind === 'lesson') {
        const l = await api.post(`/modules/${modal.moduleId}/lessons`, form);
        setModal({ kind: 'edit', lessonId: l.id, created: true });
        reload();
        return;
      }
      if (modal.kind === 'edit') await api.patch(`/lessons/${modal.lessonId}`, form);
      setModal(null);
      reload();
    } catch (err) { setMsg(errMsg(err)); }
  };
  const del = async (path, what) => { if (window.confirm(`Delete this ${what}?`)) { await api.del(path); reload(); } };

  if (!data) return <Loading />;
  return (
    <div className="mt-4 space-y-3">
      {data.modules.map((m) => (
        <div key={m.id} className="rounded-sm border border-line p-3">
          <div className="flex items-center justify-between">
            <p className="font-display font-semibold">{m.title}</p>
            <div className="flex gap-3 text-sm">
              <button className="text-brand" onClick={() => openModal({ kind: 'lesson', moduleId: m.id })}>+ Lesson</button>
              <button className="text-red-600" onClick={() => del(`/modules/${m.id}`, 'module')}>Delete</button>
            </div>
          </div>
          <ul className="mt-2 space-y-1">
            {m.lessons.map((l) => (
              <li key={l.id} className="flex items-center justify-between text-sm">
                <Link className="hover:underline" to={`/lessons/${l.id}`}>{l.title}</Link>
                <span className="flex gap-3">
                  <button className="text-brand" onClick={() => openModal({ kind: 'edit', lessonId: l.id, initial: { title: l.title, summary: l.summary, content: l.content } })}>Edit</button>
                  <button className="text-red-600" onClick={() => del(`/lessons/${l.id}`, 'lesson')}>Delete</button>
                </span>
              </li>
            ))}
            {!m.lessons.length && <li className="text-sm text-ink-soft">No lessons yet.</li>}
          </ul>
        </div>
      ))}
      <button className="btn-ghost" onClick={() => openModal({ kind: 'module' })}>+ Add module</button>
      {modal && (
        <Modal wide={modal.kind !== 'module'} title={modal.kind === 'module' ? 'New module' : modal.kind === 'lesson' ? 'New lesson' : 'Edit lesson'} onClose={() => setModal(null)}>
          <form onSubmit={save}>
            <Field label="Title" value={form.title ?? ''} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            {modal.kind !== 'module' && (
              <>
                <Field label="Summary" value={form.summary ?? ''} onChange={(e) => setForm({ ...form, summary: e.target.value })} />
                <label className="label">Lesson notes</label>
                <RichEditor value={form.content ?? ''} onChange={(content) => setForm({ ...form, content })} />
              </>
            )}
            <Notice error>{msg}</Notice>
            {modal.created && <Notice>Lesson created. You can now add attachments below, then save any further changes.</Notice>}
            <button className="btn-primary w-full">Save</button>
          </form>
          {modal.lessonId && <Attachments lessonId={modal.lessonId} />}
        </Modal>
      )}
    </div>
  );
}

export default function Courses() {
  const { data, error } = useFetch('/courses');
  const [openId, setOpenId] = useState(null);
  if (!data) return <Loading error={error} />;
  return (
    <>
      <PageHeader title="Learning content" />
      <div className="grid gap-4">
        {data.map((c) => (
          <div key={c.id} className="card">
            <h3 className="text-lg font-semibold">{c.title}</h3>
            <p className="text-sm text-ink-soft">{c.description}</p>
            <button className="btn-ghost mt-3" onClick={() => setOpenId(openId === c.id ? null : c.id)}>
              {openId === c.id ? 'Hide' : 'Manage'} {c._count.modules} modules
            </button>
            {openId === c.id && <CourseTree id={c.id} />}
          </div>
        ))}
      </div>
    </>
  );
}
