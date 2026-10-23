import { useState } from 'react';
import { useAuth } from '../lib/auth.jsx';
import { api } from '../lib/api.js';
import { Field, Loading, PageHeader, useFetch } from '../components/ui.jsx';
import Avatar from '../components/Avatar.jsx';

export default function Announcements() {
  const { user } = useAuth();
  const { data, error, reload } = useFetch('/announcements');
  const staff = user.role !== 'STUDENT';
  const { data: cohorts, error: cohortsError } = useFetch(staff ? '/cohorts' : null);
  const [form, setForm] = useState({ title: '', body: '', cohortId: '' });

  const post = async (e) => {
    e.preventDefault();
    await api.post('/announcements', {
      ...form,
      cohortId: form.cohortId || undefined,
    });
    setForm({ title: '', body: '', cohortId: '' });
    reload();
  };
  const remove = async (id) => { await api.del(`/announcements/${id}`); reload(); };

  if (!data) return <Loading error={error} />;
  return (
    <>
      <PageHeader title="Announcements" />
      {staff && (
        <form onSubmit={post} className="card mb-6 max-w-xl">
          <Field label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <div className="mb-3"><label className="label">Message</label>
            <textarea className="input" rows="3" required value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} /></div>
          <div className="mb-3">
            <label className="label" htmlFor="announcement-cohort">Audience</label>
            <select
              id="announcement-cohort"
              className="input"
              value={form.cohortId}
              disabled={!cohorts}
              onChange={(e) => setForm({ ...form, cohortId: e.target.value })}
            >
              <option value="">Everyone</option>
              {(cohorts ?? []).map((cohort) => (
                <option key={cohort.id} value={cohort.id}>{cohort.name}</option>
              ))}
            </select>
            {cohortsError && <p className="mt-1 text-sm text-red-600">{cohortsError}</p>}
          </div>
          <button className="btn-primary">Post</button>
        </form>
      )}
      <div className="space-y-3">
        {data.map((a) => (
          <div key={a.id} className="card">
            <div className="flex justify-between gap-2">
              <h3 className="font-semibold">{a.title}</h3>
              {user.role === 'ADMIN' && <button className="text-sm text-red-600" onClick={() => remove(a.id)}>Delete</button>}
            </div>
            <p className="mt-1 text-sm">{a.body}</p>
            <div className="mt-3 flex items-center gap-2.5">
              <Avatar user={a.author} size="h-9 w-9" className="text-[10px]" />
              <div>
                <p className="text-sm font-medium">{a.author.name}</p>
                <p className="text-xs text-ink-soft">{new Date(a.createdAt).toLocaleString()}</p>
              </div>
            </div>
          </div>
        ))}
        {!data.length && <p className="text-ink-soft">No announcements yet.</p>}
      </div>
    </>
  );
}
