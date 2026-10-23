import { useState } from 'react';
import { useAuth } from '../lib/auth.jsx';
import { api } from '../lib/api.js';
import { Badge, Field, Loading, Modal, PageHeader, Table, useFetch } from '../components/ui.jsx';

const STATUSES = ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'];

function Student() {
  const { data, error } = useFetch('/attendance/mine');
  if (!data) return <Loading error={error} />;
  return (
    <>
      <PageHeader title="My attendance" />
      <div className="card mb-4 inline-block">
        <p className="text-sm text-ink-soft">Overall</p>
        <p className="font-display text-2xl font-bold text-brand">{data.percent}%</p>
      </div>
      <Table
        rows={data.records}
        columns={[
          { header: 'Class', cell: (r) => r.session.title },
          { header: 'Date', cell: (r) => new Date(r.session.date).toLocaleDateString() },
          { header: 'Status', cell: (r) => <Badge>{r.status}</Badge> },
        ]}
      />
    </>
  );
}

function Staff() {
  const sessions = useFetch('/attendance/sessions');
  const cohorts = useFetch('/cohorts');
  const students = useFetch('/students');
  const [create, setCreate] = useState(false);
  const [form, setForm] = useState({ cohortId: '', title: '', date: '' });
  const [marking, setMarking] = useState(null);
  const [marks, setMarks] = useState({});

  const createSession = async (e) => {
    e.preventDefault();
    await api.post('/attendance/sessions', { ...form, date: new Date(form.date).toISOString() });
    setCreate(false);
    sessions.reload();
  };
  const saveMarks = async () => {
    const records = Object.entries(marks).map(([studentId, status]) => ({ studentId, status }));
    await api.post(`/attendance/sessions/${marking.id}/mark`, { records });
    setMarking(null);
    sessions.reload();
  };
  const roster = marking
    ? (students.data ?? []).filter((s) => s.cohort?.id === marking.cohortId)
    : [];

  if (!sessions.data) return <Loading error={sessions.error} />;
  return (
    <>
      <PageHeader title="Attendance">
        <button className="btn-primary" onClick={() => setCreate(true)}>
          New class session
        </button>
      </PageHeader>
      <Table
        rows={sessions.data}
        columns={[
          { header: 'Class', cell: (s) => s.title },
          { header: 'Cohort', cell: (s) => s.cohort.name },
          { header: 'Date', cell: (s) => new Date(s.date).toLocaleDateString() },
          { header: 'Marked', cell: (s) => s._count.records },
          { header: 'Present (weekdays)', cell: (s) => s.presentCount ?? 'Weekend — excluded' },
          {
            header: '',
            cell: (s) => (
              <button
                className="btn-ghost"
                onClick={() => {
                  const roster = (students.data ?? []).filter((x) => x.cohort?.id === s.cohortId);
                  const savedMarks = new Map(
                    s.records.map((record) => [record.studentId, record.status]),
                  );
                  setMarks(
                    Object.fromEntries(
                      roster.map((student) => [
                        student.id,
                        savedMarks.get(student.id) ?? 'PRESENT',
                      ]),
                    ),
                  );
                  setMarking(s);
                }}
              >
                Mark
              </button>
            ),
          },
        ]}
      />
      {create && (
        <Modal title="New class session" onClose={() => setCreate(false)}>
          <form onSubmit={createSession}>
            <div className="mb-3">
              <label className="label">Cohort</label>
              <select
                className="input"
                required
                value={form.cohortId}
                onChange={(e) => setForm({ ...form, cohortId: e.target.value })}
              >
                <option value="">Select…</option>
                {cohorts.data?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <Field
              label="Title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
            <Field
              label="Date"
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              required
            />
            <button className="btn-primary w-full">Create</button>
          </form>
        </Modal>
      )}
      {marking && (
        <Modal title={`Mark: ${marking.title}`} onClose={() => setMarking(null)}>
          <div className="mb-4 space-y-2">
            {roster.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-2">
                <span className="text-sm">{s.user.name}</span>
                <select
                  className="input w-32"
                  value={marks[s.id] ?? 'PRESENT'}
                  onChange={(e) => setMarks({ ...marks, [s.id]: e.target.value })}
                >
                  {STATUSES.map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </div>
            ))}
            {!roster.length && <p className="text-sm text-ink-soft">No students in this cohort.</p>}
          </div>
          <button className="btn-primary w-full" onClick={saveMarks} disabled={!roster.length}>
            Save
          </button>
        </Modal>
      )}
    </>
  );
}

export default function Attendance() {
  return useAuth().user.role === 'STUDENT' ? <Student /> : <Staff />;
}
