import { useState } from 'react';
import { toast } from 'sonner';
import { useConfirm } from '../providers/ConfirmProvider.jsx';
import { api } from '../lib/api.js';
import { Badge, Field, Loading, Modal, Notice, PageHeader, Table, useFetch } from '../components/ui.jsx';
import { errMsg } from '../lib/format.js';

export default function Instructors() {
  const confirm = useConfirm();
  const { data, error, reload } = useFetch('/instructors');
  const cohorts = useFetch('/cohorts');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '' });
  const [msg, setMsg] = useState({ text: '', error: false });
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({ active: true, cohortIds: [] });
  const [editMsg, setEditMsg] = useState({ text: '', error: false });
  const [saving, setSaving] = useState(false);

  const create = async (e) => {
    e.preventDefault();
    try {
      const r = await api.post('/instructors', form);
      setMsg({ text: `Created. Default password (must be changed on first sign-in): ${r.temporaryPassword}`, error: false });
      setForm({ name: '', email: '' });
      reload();
    } catch (err) { setMsg({ text: errMsg(err), error: true }); }
  };
  const edit = (instructor) => {
    setEditing(instructor);
    setEditForm({
      active: instructor.active,
      cohortIds: instructor.teaching.map((cohort) => cohort.id),
    });
    setEditMsg({ text: '', error: false });
  };
  const saveInstructor = async (e) => {
    e.preventDefault();
    if (saving) return;
    const changes = {};
    if (editForm.active !== editing.active) changes.active = editForm.active;
    const originalCohortIds = editing.teaching.map((cohort) => cohort.id).sort();
    const updatedCohortIds = [...editForm.cohortIds].sort();
    if (JSON.stringify(originalCohortIds) !== JSON.stringify(updatedCohortIds)) {
      changes.cohortIds = editForm.cohortIds;
    }
    if (!Object.keys(changes).length) {
      setEditing(null);
      return;
    }

    setSaving(true);
    try {
      await api.patch(`/instructors/${editing.id}`, changes);
      setEditing(null);
      reload();
    } catch (err) {
      setEditMsg({ text: errMsg(err), error: true });
    } finally {
      setSaving(false);
    }
  };
  const remove = async (i) => {
    if (!await confirm({
      title: 'Delete instructor?',
      message: `Delete instructor ${i.name}? This cannot be undone.`,
      confirmText: 'Delete',
      variant: 'danger',
    })) return;
    try { await api.del(`/instructors/${i.id}`); reload(); } catch (err) { toast.error(errMsg(err)); }
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
              <span key={c.id} className="text-sm">{c.name}</span>
            ))}
          </div>
        ) },
        { header: '', cell: (i) => (
          <div className="flex gap-2">
            <button className="btn-ghost" onClick={() => edit(i)}>Edit</button>
            <button className="btn-ghost text-red-600" onClick={() => remove(i)}>Delete</button>
          </div>
        ) },
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
      {editing && (
        <Modal title={`Edit ${editing.name}`} onClose={() => !saving && setEditing(null)}>
          <form onSubmit={saveInstructor}>
            <label className="mb-4 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={editForm.active}
                onChange={(e) => setEditForm({ ...editForm, active: e.target.checked })}
              />
              Active
            </label>
            <p className="label">Cohorts</p>
            <div className="mb-4 space-y-2">
              {cohorts.data?.map((cohort) => (
                <label key={cohort.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={editForm.cohortIds.includes(cohort.id)}
                    onChange={(e) => {
                      const cohortIds = new Set(editForm.cohortIds);
                      e.target.checked ? cohortIds.add(cohort.id) : cohortIds.delete(cohort.id);
                      setEditForm({ ...editForm, cohortIds: [...cohortIds] });
                    }}
                  />
                  {cohort.name}
                </label>
              ))}
            </div>
            <Notice error={editMsg.error}>{editMsg.text}</Notice>
            <button className="btn-primary w-full" disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </form>
        </Modal>
      )}
    </>
  );
}
