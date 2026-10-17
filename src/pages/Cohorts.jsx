import { useState } from 'react';
import { useAuth } from '../lib/auth.jsx';
import { api } from '../lib/api.js';
import { Field, Loading, Modal, Notice, PageHeader, Select, Table, TextArea, useFetch } from '../components/ui.jsx';
import { errMsg, fmtDate } from '../lib/format.js';

export default function Cohorts() {
  const { user } = useAuth();
  const admin = user.role === 'ADMIN';
  const { data, error, reload } = useFetch('/cohorts');
  const courses = useFetch('/courses');
  const instructors = useFetch(admin ? '/instructors' : null);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [msg, setMsg] = useState('');

  const open = (kind, initial = {}) => { setForm(initial); setMsg(''); setModal(kind); };
  const submit = (path, body, after) => async (e) => {
    e.preventDefault();
    try { await api.post(path, body); setModal(null); after?.(); } catch (err) { setMsg(errMsg(err)); }
  };
  const assign = async (cohort, instructorId, on) => {
    const inst = instructors.data.find((i) => i.id === instructorId);
    const ids = new Set(inst.teaching.map((t) => t.id));
    on ? ids.add(cohort.id) : ids.delete(cohort.id);
    await api.patch(`/instructors/${instructorId}`, { cohortIds: [...ids] });
    instructors.reload();
    reload();
  };

  if (!data) return <Loading error={error} />;
  const current = modal === 'staff' ? data.find((c) => c.id === form.id) : null;
  return (
    <>
      <PageHeader title="Courses & cohorts">
        {admin && <button className="btn-ghost" onClick={() => open('course')}>New course</button>}
        {admin && <button className="btn-primary" onClick={() => open('cohort')}>New cohort</button>}
      </PageHeader>

      <h2 className="mb-3 text-lg font-semibold">Cohorts</h2>
      <Table
        rows={data}
        columns={[
          { header: 'Name', cell: (c) => c.name },
          { header: 'Course', cell: (c) => c.course.title },
          { header: 'Starts', cell: (c) => fmtDate(c.startDate) },
          { header: 'Students', cell: (c) => c._count.students },
          { header: 'Instructors', cell: (c) => c.instructors.map((i) => i.name).join(', ') || '—' },
          ...(admin ? [{ header: '', cell: (c) => <button className="btn-ghost" onClick={() => open('staff', { id: c.id })}>Instructors</button> }] : []),
        ]}
      />

      <h2 className="mb-3 mt-8 text-lg font-semibold">Courses</h2>
      <div className="grid gap-4 lg:grid-cols-2">
        {courses.data?.map((c) => (
          <div key={c.id} className="card">
            <h3 className="font-semibold">{c.title}</h3>
            <p className="text-sm text-ink-soft">{c.description || 'No description'}</p>
            <p className="mt-2 text-xs text-ink-soft">{c._count.modules} modules</p>
          </div>
        ))}
      </div>

      {modal === 'course' && (
        <Modal title="New course" onClose={() => setModal(null)}>
          <form onSubmit={submit('/courses', form, courses.reload)}>
            <Field label="Title" value={form.title ?? ''} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            <TextArea label="Description" rows="3" value={form.description ?? ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <Notice error>{msg}</Notice>
            <button className="btn-primary w-full">Create course</button>
          </form>
        </Modal>
      )}
      {modal === 'cohort' && (
        <Modal title="New cohort" onClose={() => setModal(null)}>
          <form onSubmit={submit('/cohorts', { name: form.name, courseId: form.courseId, startDate: form.startDate && new Date(form.startDate).toISOString() }, reload)}>
            <Field label="Name" value={form.name ?? ''} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <Select label="Course" required value={form.courseId ?? ''} onChange={(e) => setForm({ ...form, courseId: e.target.value })}>
              <option value="">Select…</option>
              {courses.data?.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </Select>
            <Field label="Start date" type="date" value={form.startDate ?? ''} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required />
            <Notice error>{msg}</Notice>
            <button className="btn-primary w-full">Create cohort</button>
          </form>
        </Modal>
      )}
      {current && instructors.data && (
        <Modal title={`Instructors for ${current.name}`} onClose={() => setModal(null)}>
          <div className="space-y-2">
            {instructors.data.filter((i) => i.active).map((i) => (
              <label key={i.id} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={current.instructors.some((x) => x.id === i.id)} onChange={(e) => assign(current, i.id, e.target.checked)} />
                {i.name}
              </label>
            ))}
            {!instructors.data.length && <p className="text-sm text-ink-soft">Add instructors first.</p>}
          </div>
        </Modal>
      )}
    </>
  );
}
