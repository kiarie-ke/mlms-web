import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { Badge, Loading, PageHeader, Select, useFetch } from '../components/ui.jsx';
import { fmtDateTime } from '../lib/format.js';
import Avatar from '../components/Avatar.jsx';

export default function Discussions() {
  const { user } = useAuth();
  const cohorts = useFetch('/cohorts');
  const [cohortId, setCohortId] = useState('');
  const [posts, setPosts] = useState([]);
  const [text, setText] = useState('');
  const [replyText, setReplyText] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!cohortId && cohorts.data?.length) setCohortId(cohorts.data[0].id);
  }, [cohorts.data, cohortId]);
  const load = useCallback(
    () =>
      cohortId
        ? api
            .get(`/discussions?cohortId=${cohortId}`)
            .then(setPosts)
            .catch((e) => setError(e.message))
        : undefined,
    [cohortId],
  );
  useEffect(() => {
    const refresh = () => {
      if (!document.hidden) load();
    };
    load();
    const t = setInterval(refresh, 5000);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      clearInterval(t);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [load]);

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    try {
      await api.post('/discussions', { cohortId, body: text });
      setText('');
      load();
    } catch (err) {
      setError(err.message);
    }
  };
  const sendReply = async (e, parentId) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    try {
      await api.post('/discussions', { cohortId, parentId, body: replyText });
      setReplyText('');
      setReplyingTo(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  };
  const remove = async (id) => {
    await api.del(`/discussions/${id}`);
    load();
  };
  const roots = posts.filter((post) => !post.parentId);
  const repliesFor = (id) => posts.filter((post) => post.parentId === id);

  if (!cohorts.data) return <Loading error={cohorts.error} />;
  if (!cohorts.data.length)
    return <p className="text-ink-soft">No cohort available for discussions yet.</p>;
  return (
    <>
      <PageHeader title="Group discussion">
        {cohorts.data.length > 1 && (
          <Select value={cohortId} onChange={(e) => setCohortId(e.target.value)}>
            {cohorts.data.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        )}
      </PageHeader>
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
      <div className="space-y-3">
        {roots.map((p) => (
          <div key={p.id} className="card">
            <div className="mb-2 flex items-center gap-3 text-sm">
              <Avatar user={p.author} size="h-9 w-9" className="text-[10px]" />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{p.author.name}</span>
                  {p.author.role !== 'STUDENT' && <Badge>{p.author.role}</Badge>}
                </div>
                <span className="text-xs text-ink-soft">{fmtDateTime(p.createdAt)}</span>
              </div>
              <button
                className="ml-auto text-xs text-brand"
                onClick={() => setReplyingTo(replyingTo === p.id ? null : p.id)}
              >
                Reply
              </button>
              {(user.role === 'ADMIN' || p.authorId === user.id) && (
                <button className="text-xs text-red-600" onClick={() => remove(p.id)}>
                  Delete
                </button>
              )}
            </div>
            <p className="whitespace-pre-wrap break-words text-sm">{p.body}</p>
            {repliesFor(p.id).map((reply) => (
              <div key={reply.id} className="ml-4 mt-3 border-l-2 border-line pl-3">
                <div className="mb-2 flex items-center gap-3 text-sm">
                  <Avatar user={reply.author} size="h-8 w-8" className="text-[10px]" />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">{reply.author.name}</span>
                      {reply.author.role !== 'STUDENT' && <Badge>{reply.author.role}</Badge>}
                    </div>
                    <span className="text-xs text-ink-soft">{fmtDateTime(reply.createdAt)}</span>
                  </div>
                  {(user.role === 'ADMIN' || reply.authorId === user.id) && (
                    <button
                      className="ml-auto text-xs text-red-600"
                      onClick={() => remove(reply.id)}
                    >
                      Delete
                    </button>
                  )}
                </div>
                <p className="whitespace-pre-wrap break-words text-sm">{reply.body}</p>
              </div>
            ))}
            {replyingTo === p.id && (
              <form onSubmit={(e) => sendReply(e, p.id)} className="mt-3 flex gap-2">
                <input
                  className="input"
                  placeholder="Write a reply…"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  maxLength={4000}
                />
                <button className="btn-primary">Reply</button>
              </form>
            )}
          </div>
        ))}
        {!roots.length && (
          <p className="text-sm text-ink-soft">No posts yet. Start the conversation.</p>
        )}
      </div>
      <form onSubmit={send} className="mt-4 flex gap-2">
        <input
          className="input"
          placeholder="Write a message to the class…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={2000}
        />
        <button className="btn-primary">Post</button>
      </form>
    </>
  );
}
