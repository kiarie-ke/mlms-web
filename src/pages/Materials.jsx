import { useState } from 'react';
import { useAuth } from '../lib/auth.jsx';
import { api } from '../lib/api.js';
import { Field, Loading, Modal, Notice, PageHeader, Select, Table, TextArea, useFetch } from '../components/ui.jsx';
import { errMsg, fmtDate } from '../lib/format.js';

export default function Materials() {
  const { user } = useAuth();
  const staff = user.role !== 'STUDENT';
  const { data, error, reload } = useFetch('/materials');
  const courses = useFetch(staff ? '/courses' : null);
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState('');

  const upload = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    for (const [k, v] of [...fd.entries()]) if (v === '' || (v instanceof File && !v.size)) fd.delete(k);
    try {
      const res = await fetch('/api/materials', { method: 'POST', body: fd, credentials: 'include' });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(Array.isArray(d.message) ? d.message.join(', ') : d.message || res.statusText);
      }
      setOpen(false); reload();
    } catch (err) { setMsg(errMsg(err)); }
  };
  const remove = async (m) => { if (window.confirm('Delete this material?')) { await api.del(`/materials/${m.id}`); reload(); } };

  if (!data) return <Loading error={error} />;
  return (
    <>
      <PageHeader title={staff ? 'Teaching materials' : 'Learning materials'}>{staff && <button className="btn-primary" onClick={() => { setMsg(''); setOpen(true); }}>Add material</button>}</PageHeader>
      <Table rows={data} columns={[
        { header: 'Title', cell: (m) => <><p className="font-medium">{m.title}</p><p className="text-xs text-ink-soft">{m.description}</p></> },
        { header: 'Added', cell: (m) => fmtDate(m.createdAt) },
        { header: 'Open', cell: (m) => m.url
          ? <a className="text-brand" href={m.url} target="_blank" rel="noreferrer noopener">Open link</a>
          : <a className="text-brand" href={`/api/materials/${m.id}/file`}>Download</a> },
        ...(staff ? [{ header: '', cell: (m) => <button className="text-sm text-red-600" onClick={() => remove(m)}>Delete</button> }] : []),
      ]} />
      {open && (
        <Modal title="Add material" onClose={() => setOpen(false)}>
          <form onSubmit={upload}>
            <Field label="Title" name="title" required />
            <TextArea label="Description" name="description" rows="2" />
            <Select label="Course" name="courseId" required defaultValue="">
              <option value="" disabled>Select…</option>{courses.data?.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </Select>
            <div className="mb-3"><label className="label">File (pdf, doc, ppt, zip, images…; max 10MB)</label><input className="input" type="file" name="file" /></div>
            <Field label="…or a link" name="url" type="url" />
            <Notice error>{msg}</Notice>
            <button className="btn-primary w-full">Save</button>
          </form>
        </Modal>
      )}
    </>
  );
}
