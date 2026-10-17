import { useState } from 'react';
import { api } from '../lib/api.js';
import { Badge, Field, Loading, Modal, Notice, PageHeader, Table, useFetch } from '../components/ui.jsx';
import { errMsg } from '../lib/format.js';

export default function Instructors() {
  const { data, error, reload } = useFetch('/instructors');
  const cohorts = useFetch('/cohorts');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '' });
  const [msg, setMsg] = useState({ text: '', error: false });

  const create = async (e) => {
    e.preventDefault();
    try {
      const r = await api.post('/instructors', form);
      setMsg({ text: `Created. Temporary password (share it once): ${r.temporaryPassword}`, error: false });
      setForm({ name: '', email: '' });
      reload();
    } catch (err) { setMsg({ text: errMsg(err), error: true }); }
  };
  const toggle = async (i) => { await api.patch(`/instructors/${i.id}`, { active: !i.active }); reload(); };
  const assign = async (i, cohortId, on) => {
    const ids = new Set(i.teaching.map((t) => t.id));
    on ? ids.add(cohortId) : ids.delete(cohortId);
    await api.patch(`/instructors/${i.id}`, { cohortIds: [...ids] });
    reload();
  };

  if (!data) return <Loading error={error} />;
  return (
    <>
      <PageHeader title="Instructors"><button className="btn-primary" onClick={() => { setMsg({ text: '' }); setOpen(true); }}>Add instructor</button></PageHeader>
      <Table rows={data} columns={[
        { header: 'Name', cell: (i) => i.name },
        { header: 'Email', cell: (i) => i.email },
        { header: 'Status', cell: (i) => <Badge>{i.active ? 'ACTIVE' : 'SUSPENDED'}</Badge> },
        { header: 'Cohorts', cell: (i) => (
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {cohorts.data?.map((c) => (
              <label key={c.id} className="flex items-center gap-1 text-sm">
                <input type="checkbox" checked={i.teaching.some((t) => t.id === c.id)} onChange={(e) => assign(i, c.id, e.target.checked)} /> {c.name}
              </label>
            ))}
          </div>
        ) },
        { header: '', cell: (i) => <button className="btn-ghost" onClick={() => toggle(i)}>{i.active ? 'Deactivate' : 'Activate'}</button> },
      ]} />
      {open && (
        <Modal title="Add instructor" onClose={() => setOpen(false)}>
          <form onSubmit={create}>
            <Field label="Full name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Field label="Email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <Notice error={msg.error}>{msg.text}</Notice>
            <button className="btn-primary w-full">Create instructor</button>
          </form>
        </Modal>
      )}
    </>
  );
}
