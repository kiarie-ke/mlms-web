import { useState } from 'react';
import { toast } from 'sonner';
import { useConfirm } from '../providers/ConfirmProvider.jsx';
import { useAuth } from '../lib/auth.jsx';
import { api } from '../lib/api.js';
import { Badge, Field, Loading, Modal, Notice, PageHeader, Select, Table, useFetch } from '../components/ui.jsx';
import { errMsg, fmtDate } from '../lib/format.js';

const STATUSES = ['ACTIVE', 'SUSPENDED', 'GRADUATED', 'DEFERRED'];
const empty = { name: '', email: '', phone: '', cohortId: '' };

export default function Students() {
  const { user } = useAuth();
  const confirm = useConfirm();
  const admin = user.role === 'ADMIN';
  const { data, error, reload } = useFetch('/students');
  const atRisk = useFetch('/students/at-risk');
  const cohorts = useFetch('/cohorts');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [msg, setMsg] = useState({ text: '', error: false });
  const [q, setQ] = useState('');
  const [sel, setSel] = useState([]);
  const [cohortFilter, setCohortFilter] = useState('');
  const [mineOnly, setMineOnly] = useState(true);
  const instructors = useFetch(admin ? '/instructors' : null);
  const toggleSel = (id) => setSel((x) => (x.includes(id) ? x.filter((i) => i !== id) : [...x, id]));
  const assign = async (instructorId) => {
    try { await api.post('/students/assign', { studentIds: sel, instructorId: instructorId || null }); setSel([]); reload(); } catch (err) { toast.error(errMsg(err)); }
  };
  const autoAssign = async () => {
    if (!cohortFilter) return;
    if (!await confirm({
      title: 'Replace student assignments?',
      message: 'Split all students of this cohort evenly between its instructors? Existing assignments will be replaced.',
      confirmText: 'Split evenly',
      variant: 'danger',
    })) return;
    try {
      const r = await api.post('/students/auto-assign', { cohortId: cohortFilter });
      toast.success(`${r.updated} students assigned.`);
      reload();
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  const save = async (e) => {
    e.preventDefault();
    try {
      const body = { ...form };
      if (!body.cohortId) delete body.cohortId;
      if (!body.phone) delete body.phone;
      const s = await api.post('/students', body);
      setMsg({ text: s.temporaryPassword ? `Created. Default password: ${s.temporaryPassword} (the student should change it in their portal)` : 'Created.', error: false });
      setForm(empty);
      reload();
    } catch (err) {
      setMsg({ text: errMsg(err), error: true });
    }
  };
  const patch = async (id, body) => { await api.patch(`/students/${id}`, body); reload(); };
  const remove = async (s) => {
    if (!await confirm({
      title: 'Delete student?',
      message: `Delete ${s.user.name} and all their records?`,
      confirmText: 'Delete',
      variant: 'danger',
    })) return;
    await api.del(`/students/${s.id}`);
    reload();
  };

  if (!data) return <Loading error={error} />;
  const rows = data.filter((s) => `${s.user.name} ${s.user.email} ${s.admissionNo}`.toLowerCase().includes(q.toLowerCase())
    && (!admin || !cohortFilter || s.cohortId === cohortFilter)
    && (admin || !mineOnly || s.mentorId === user.id));
  const allSelected = rows.length > 0 && rows.every((s) => sel.includes(s.id));
  return (
    <>
      <PageHeader title={admin ? 'Students' : 'My students'}>
        <input className="input w-56" placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} />
        {!admin && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={mineOnly} onChange={(e) => setMineOnly(e.target.checked)} /> Only students assigned to me</label>}
        {admin && (
          <select className="input w-44" value={cohortFilter} onChange={(e) => setCohortFilter(e.target.value)}>
            <option value="">All cohorts</option>
            {cohorts.data?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        )}
        {admin && cohortFilter && <button className="btn-ghost" onClick={autoAssign}>Split evenly</button>}
        {admin && <button className="btn-primary" onClick={() => { setMsg({ text: '' }); setOpen(true); }}>Add student</button>}
      </PageHeader>
      <section className="mb-8" aria-labelledby="student-follow-up-heading">
        <div className="mb-3">
          <h2 id="student-follow-up-heading" className="font-display text-lg font-bold text-ink">Students needing follow-up</h2>
          <p className="mt-1 text-xs text-ink-soft">
            Active students with attendance below 75%, overdue assignments, or a recent grade decline.
          </p>
        </div>
        {!atRisk.data ? <Loading error={atRisk.error} /> : atRisk.data.length ? (
          <div className="grid gap-3 lg:grid-cols-2">
            {atRisk.data.map((student) => (
              <article key={student.studentId} className="rounded-2xl border border-line bg-white p-4 shadow-sm">
                <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-ink">{student.name}</h3>
                    <p className="text-xs text-ink-soft">{student.admissionNo} · {student.cohortName}</p>
                  </div>
                </div>
                <ul className="space-y-2 text-sm">
                  {student.attendance && student.attendance.percent < 75 && (
                    <li className="rounded-xl bg-red-50 px-3 py-2 text-red-800">
                      Attendance is {student.attendance.percent}% ({student.attendance.attended}/{student.attendance.total} attended); follow-up threshold is 75%.
                    </li>
                  )}
                  {student.overdueAssignments.map((assignment) => (
                    <li key={assignment.id} className="rounded-xl bg-amber-50 px-3 py-2 text-amber-900">
                      <span className="font-semibold">Overdue:</span> {assignment.title}
                      {assignment.dueDate && <span className="text-xs"> · due {fmtDate(assignment.dueDate)}</span>}
                    </li>
                  ))}
                  {student.gradeTrend && (
                    <li className="rounded-xl bg-amber-50 px-3 py-2 text-amber-900">
                      Grades declined {student.gradeTrend.drop} points: recent average {student.gradeTrend.recentAverage}%,
                      previously {student.gradeTrend.previousAverage}%.
                    </li>
                  )}
                </ul>
              </article>
            ))}
          </div>
        ) : (
          <p className="rounded-2xl border border-emerald/20 bg-emerald/5 p-4 text-sm text-emerald">
            No active students currently meet the follow-up criteria.
          </p>
        )}
      </section>
      {admin && sel.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded border border-line bg-white p-3 text-sm">
          <span>{sel.length} selected</span>
          <select className="input w-52" defaultValue="" onChange={(e) => { if (e.target.value) assign(e.target.value === 'none' ? '' : e.target.value); e.target.value = ''; }}>
            <option value="" disabled>Assign to instructor…</option>
            {instructors.data?.filter((i) => i.active).map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
            <option value="none">Unassign</option>
          </select>
          <button className="text-ink-soft" onClick={() => setSel([])}>Clear</button>
        </div>
      )}
      <Table
        rows={rows}
        columns={[
          ...(admin ? [{ header: <input type="checkbox" aria-label="Select all" checked={allSelected} onChange={() => setSel(allSelected ? [] : rows.map((s) => s.id))} />, cell: (s) => <input type="checkbox" checked={sel.includes(s.id)} onChange={() => toggleSel(s.id)} /> }] : []),
          { header: 'Admission no', cell: (s) => s.admissionNo },
          { header: 'Name', cell: (s) => s.user.name },
          { header: 'Email', cell: (s) => s.user.email },
          { header: 'Phone', cell: (s) => s.phone ?? '—' },
          { header: 'Cohort', cell: (s) => s.cohort?.name ?? '—' },
          { header: 'Instructor', cell: (s) => s.mentor?.name ?? '—' },
          {
            header: 'Status',
            cell: (s) => admin ? (
              <select className="input w-36" value={s.status} onChange={(e) => patch(s.id, { status: e.target.value })}>{STATUSES.map((x) => <option key={x}>{x}</option>)}</select>
            ) : <Badge>{s.status}</Badge>,
          },
          ...(admin ? [{
            header: '',
            cell: (s) => (
              <div className="flex gap-2">
                <select className="input w-40" value={s.cohortId ?? ''} onChange={(e) => patch(s.id, { cohortId: e.target.value })}>
                  <option value="" disabled>Move to cohort…</option>
                  {cohorts.data?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <button className="text-sm text-red-600" onClick={() => remove(s)}>Delete</button>
              </div>
            ),
          }] : []),
        ]}
      />
      {open && (
        <Modal title="Add student" onClose={() => setOpen(false)}>
          <form onSubmit={save}>
            <Field label="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <Field label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            <Field label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <Select label="Cohort" value={form.cohortId} onChange={(e) => setForm({ ...form, cohortId: e.target.value })}>
              <option value="">None</option>
              {cohorts.data?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
            <Notice error={msg.error}>{msg.text}</Notice>
            <button className="btn-primary w-full">Create student</button>
          </form>
        </Modal>
      )}
    </>
  );
}
