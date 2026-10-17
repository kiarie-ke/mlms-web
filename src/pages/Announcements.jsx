import { useState } from 'react';
import { useAuth } from '../lib/auth.jsx';
import { api } from '../lib/api.js';
import { Field, Loading, PageHeader, useFetch } from '../components/ui.jsx';

export default function Announcements() {
  const { user } = useAuth();
  const { data, error, reload } = useFetch('/announcements');
  const [form, setForm] = useState({ title: '', body: '' });
  const staff = user.role !== 'STUDENT';

  const post = async (e) => {
    e.preventDefault();
    await api.post('/announcements', form);
    setForm({ title: '', body: '' });
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
            <p className="mt-2 text-xs text-ink-soft">{a.author.name} · {new Date(a.createdAt).toLocaleString()}</p>
          </div>
        ))}
        {!data.length && <p className="text-ink-soft">No announcements yet.</p>}
      </div>
    </>
  );
}
