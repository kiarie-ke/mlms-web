import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useConfirm } from '../providers/ConfirmProvider.jsx';
import { useAuth } from '../lib/auth.jsx';
import { api } from '../lib/api.js';
import { Field, Loading, Modal, Notice, PageHeader, Select, Table, useFetch } from '../components/ui.jsx';
import { errMsg, fmtDateTime } from '../lib/format.js';

const emptyForm = { cohortId: '', title: '', date: '', meetingUrl: '', lessonId: '', teachingPlan: '' };
const localDateTime = (date) => {
  const value = new Date(date);
  return new Date(value.getTime() - value.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

export default function Classes() {
  const { user } = useAuth();
  const confirm = useConfirm();
  const staff = user.role !== 'STUDENT';
  const { data, error, reload } = useFetch('/classes');
  const cohorts = useFetch(staff ? '/cohorts' : null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [msg, setMsg] = useState('');
  const [pageError, setPageError] = useState('');
  const selectedCohort = cohorts.data?.find((cohort) => cohort.id === form.cohortId);
  const course = useFetch(selectedCohort?.courseId ? `/courses/${selectedCohort.courseId}` : null);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const openForm = (session = null) => {
    setEditing(session);
    setMsg('');
    setForm(session ? {
      cohortId: session.cohortId,
      title: session.title,
      date: localDateTime(session.date),
      meetingUrl: session.meetingUrl ?? '',
      lessonId: session.lessonId ?? '',
      teachingPlan: session.teachingPlan ?? '',
    } : emptyForm);
    setOpen(true);
  };

  const save = async (e) => {
    e.preventDefault();
    try {
      const { cohortId, ...session } = form;
      const payload = {
        ...session,
        date: new Date(form.date).toISOString(),
        meetingUrl: form.meetingUrl || null,
        lessonId: form.lessonId || null,
      };
      if (editing) await api.patch(`/classes/${editing.id}`, payload);
      else await api.post('/classes', { ...payload, cohortId });
      setOpen(false);
      reload();
    } catch (err) { setMsg(errMsg(err)); }
  };

  const remove = async (session) => {
    if (!await confirm({
      title: 'Delete class?',
      message: `Delete this class "${session.title}"?`,
      confirmText: 'Delete',
      variant: 'danger',
    })) return;
    try {
      await api.del(`/classes/${session.id}`);
      setPageError('');
      reload();
    } catch (err) { setPageError(errMsg(err)); }
  };

  if (!data) return <Loading error={error} />;
  const lessons = course.data && course.data.id === selectedCohort?.courseId ? course.data.modules.flatMap((module) => module.lessons.map((lesson) => ({
    ...lesson,
    moduleTitle: module.title,
  }))) : [];
  const now = Date.now();
  const upcoming = data.filter((c) => new Date(c.date) >= now).sort((a, b) => new Date(a.date) - new Date(b.date));
  const past = data.filter((c) => new Date(c.date) < now).sort((a, b) => new Date(b.date) - new Date(a.date));
  const cols = [
    { header: 'Class', cell: (c) => <div><p className="font-medium">{c.title}</p>{c.lesson && <Link className="mt-1 inline-block text-xs text-brand hover:underline" to={`/lessons/${c.lesson.id}`}>{c.lesson.module.title} · {c.lesson.title}</Link>}</div> },
    { header: 'Cohort', cell: (c) => c.cohort?.name ?? '—' },
    { header: 'When', cell: (c) => fmtDateTime(c.date) },
    { header: 'Teaching plan', cell: (c) => c.teachingPlan ? <span className="whitespace-pre-line">{c.teachingPlan}</span> : '—' },
    { header: 'Link', cell: (c) => c.meetingUrl ? <a className="btn-primary" href={c.meetingUrl} target="_blank" rel="noreferrer noopener">Join</a> : '—' },
    ...(staff ? [{
      header: '',
      cell: (c) => <div className="flex gap-3"><button className="text-sm text-brand" onClick={() => openForm(c)}>Edit</button><button className="text-sm text-red-600" onClick={() => remove(c)}>Delete</button></div>,
    }] : []),
  ];
  return (
    <>
      <PageHeader title="Online classes">{staff && <button className="btn-primary" onClick={() => openForm()}>Schedule class</button>}</PageHeader>
      <Notice error>{pageError}</Notice>
      <h2 className="mb-3 text-lg font-semibold">Upcoming</h2>
      <Table rows={upcoming} columns={cols} empty="No upcoming classes." />
      <h2 className="mb-3 mt-8 text-lg font-semibold">Past</h2>
      <Table rows={past} columns={cols} empty="No past classes." />
      {open && (
        <Modal title={editing ? 'Edit class schedule' : 'Schedule class'} onClose={() => setOpen(false)}>
          <form onSubmit={save}>
            {!editing && <Select label="Cohort" required value={form.cohortId} onChange={set('cohortId')}><option value="">Select…</option>{cohorts.data?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select>}
            <Field label="Title / topic" required value={form.title} onChange={set('title')} />
            <Field label="Date & time" type="datetime-local" required value={form.date} onChange={set('date')} />
            <Field label="Meeting link (Zoom, Meet…)" type="url" value={form.meetingUrl} onChange={set('meetingUrl')} />
            <Select label="Course lesson (optional)" value={form.lessonId} onChange={set('lessonId')} disabled={!selectedCohort}>
              <option value="">{selectedCohort ? 'No linked lesson' : 'Select a cohort first'}</option>
              {lessons.map((lesson) => <option key={lesson.id} value={lesson.id}>{lesson.moduleTitle} · {lesson.title}</option>)}
            </Select>
            {course.error && <Notice error>{course.error}</Notice>}
            <div className="mb-3">
              <label className="label" htmlFor="teaching-plan">How will it be taught?</label>
              <textarea id="teaching-plan" className="input min-h-24" maxLength={3000} value={form.teachingPlan} onChange={set('teachingPlan')} placeholder="For example: short introduction, instructor demonstration, guided practice, then questions." />
            </div>
            <Notice error>{msg}</Notice>
            <button className="btn-primary w-full">{editing ? 'Save changes' : 'Schedule class'}</button>
          </form>
        </Modal>
      )}
    </>
  );
}
