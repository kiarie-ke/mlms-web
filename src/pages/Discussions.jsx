import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { Badge, Loading, PageHeader, Select, useFetch } from '../components/ui.jsx';
import { fmtDateTime } from '../lib/format.js';

export default function Discussions() {
  const { user } = useAuth();
  const cohorts = useFetch('/cohorts');
  const [cohortId, setCohortId] = useState('');
  const [posts, setPosts] = useState([]);
  const [text, setText] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { if (!cohortId && cohorts.data?.length) setCohortId(cohorts.data[0].id); }, [cohorts.data, cohortId]);
  const load = useCallback(() => (cohortId ? api.get(`/discussions?cohortId=${cohortId}`).then(setPosts).catch((e) => setError(e.message)) : undefined), [cohortId]);
  useEffect(() => { load(); const t = setInterval(load, 5000); return () => clearInterval(t); }, [load]);

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    try { await api.post('/discussions', { cohortId, body: text }); setText(''); load(); } catch (err) { setError(err.message); }
  };
  const remove = async (id) => { await api.del(`/discussions/${id}`); load(); };

  if (!cohorts.data) return <Loading error={cohorts.error} />;
  if (!cohorts.data.length) return <p className="text-ink-soft">No cohort available for discussions yet.</p>;
  return (
    <>
      <PageHeader title="Group discussion">
        {cohorts.data.length > 1 && (
          <Select value={cohortId} onChange={(e) => setCohortId(e.target.value)}>{cohorts.data.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select>
        )}
      </PageHeader>
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
      <div className="space-y-3">
        {posts.map((p) => (
          <div key={p.id} className="card">
            <div className="mb-1 flex items-center gap-2 text-sm">
              <span className="font-semibold">{p.author.name}</span>
              {p.author.role !== 'STUDENT' && <Badge>{p.author.role}</Badge>}
              <span className="text-xs text-ink-soft">{fmtDateTime(p.createdAt)}</span>
              {(user.role === 'ADMIN' || p.authorId === user.id) && <button className="ml-auto text-xs text-red-600" onClick={() => remove(p.id)}>Delete</button>}
            </div>
            <p className="whitespace-pre-wrap break-words text-sm">{p.body}</p>
          </div>
        ))}
        {!posts.length && <p className="text-sm text-ink-soft">No posts yet. Start the conversation.</p>}
      </div>
      <form onSubmit={send} className="mt-4 flex gap-2">
        <input className="input" placeholder="Write a message to the class…" value={text} onChange={(e) => setText(e.target.value)} maxLength={2000} />
        <button className="btn-primary">Post</button>
      </form>
    </>
  );
}
