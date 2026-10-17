import { useState } from 'react';
import { useAuth } from '../lib/auth.jsx';
import { api } from '../lib/api.js';
import { Field, Loading, Modal, Notice, PageHeader, Select, Table, useFetch } from '../components/ui.jsx';
import { errMsg, fmtDateTime } from '../lib/format.js';

export default function Classes() {
  const { user } = useAuth();
  const staff = user.role !== 'STUDENT';
  const { data, error, reload } = useFetch('/classes');
  const cohorts = useFetch(staff ? '/cohorts' : null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ cohortId: '', title: '', date: '', meetingUrl: '' });
  const [msg, setMsg] = useState('');
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const create = async (e) => {
    e.preventDefault();
    try {
      await api.post('/classes', { ...form, date: new Date(form.date).toISOString(), meetingUrl: form.meetingUrl || undefined });
      setOpen(false); reload();
    } catch (err) { setMsg(errMsg(err)); }
  };
  const remove = async (c) => { if (window.confirm('Delete this class?')) { await api.del(`/classes/${c.id}`); reload(); } };

  if (!data) return <Loading error={error} />;
  const now = Date.now();
  const upcoming = data.filter((c) => new Date(c.date) >= now).sort((a, b) => new Date(a.date) - new Date(b.date));
  const past = data.filter((c) => new Date(c.date) < now).sort((a, b) => new Date(b.date) - new Date(a.date));
  const cols = [
    { header: 'Class', cell: (c) => c.title },
    { header: 'Cohort', cell: (c) => c.cohort?.name ?? '—' },
    { header: 'When', cell: (c) => fmtDateTime(c.date) },
    { header: 'Link', cell: (c) => c.meetingUrl ? <a className="btn-primary" href={c.meetingUrl} target="_blank" rel="noreferrer noopener">Join</a> : '—' },
    ...(staff ? [{ header: '', cell: (c) => <button className="text-sm text-red-600" onClick={() => remove(c)}>Delete</button> }] : []),
  ];
  return (
    <>
      <PageHeader title="Online classes">{staff && <button className="btn-primary" onClick={() => { setMsg(''); setOpen(true); }}>Schedule class</button>}</PageHeader>
      <h2 className="mb-3 text-lg font-semibold">Upcoming</h2>
      <Table rows={upcoming} columns={cols} empty="No upcoming classes." />
      <h2 className="mb-3 mt-8 text-lg font-semibold">Past</h2>
      <Table rows={past} columns={cols} empty="No past classes." />
      {open && (
        <Modal title="Schedule class" onClose={() => setOpen(false)}>
          <form onSubmit={create}>
            <Select label="Cohort" required value={form.cohortId} onChange={set('cohortId')}><option value="">Select…</option>{cohorts.data?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select>
            <Field label="Title" required value={form.title} onChange={set('title')} />
            <Field label="Date & time" type="datetime-local" required value={form.date} onChange={set('date')} />
            <Field label="Meeting link (Zoom, Meet…)" type="url" value={form.meetingUrl} onChange={set('meetingUrl')} />
            <Notice error>{msg}</Notice>
            <button className="btn-primary w-full">Schedule</button>
          </form>
        </Modal>
      )}
    </>
  );
}
