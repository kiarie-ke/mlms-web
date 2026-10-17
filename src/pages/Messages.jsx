import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { Loading, PageHeader } from '../components/ui.jsx';
import { fmtDateTime } from '../lib/format.js';

export default function Messages() {
  const { user } = useAuth();
  const [contacts, setContacts] = useState(null);
  const [active, setActive] = useState(null);
  const [thread, setThread] = useState([]);
  const [text, setText] = useState('');
  const [q, setQ] = useState('');
  const [error, setError] = useState('');
  const end = useRef(null);

  const loadContacts = useCallback(() => api.get('/messages/contacts').then(setContacts).catch((e) => setError(e.message)), []);
  const loadThread = useCallback((id) => api.get(`/messages/with/${id}`).then(setThread).catch(() => {}), []);

  useEffect(() => { loadContacts(); const t = setInterval(loadContacts, 10000); return () => clearInterval(t); }, [loadContacts]);
  useEffect(() => {
    if (!active) return undefined;
    loadThread(active.id);
    const t = setInterval(() => loadThread(active.id), 5000);
    return () => clearInterval(t);
  }, [active, loadThread]);
  useEffect(() => { end.current?.scrollIntoView({ block: 'end' }); }, [thread.length]);

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    try {
      await api.post('/messages', { toId: active.id, body: text });
      setText('');
      loadThread(active.id);
    } catch (err) { setError(err.message); }
  };

  if (!contacts) return <Loading error={error} />;
  const list = contacts.filter((c) => c.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <PageHeader title={user.role === 'ADMIN' ? 'Messages' : 'Private chat'} />
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
      <div className="grid h-[70vh] gap-4 md:grid-cols-[18rem_1fr]">
        <div className="card flex flex-col overflow-hidden p-3">
          <input className="input mb-2" placeholder="Search people…" value={q} onChange={(e) => setQ(e.target.value)} />
          <ul className="flex-1 overflow-y-auto">
            {list.map((c) => (
              <li key={c.id}>
                <button onClick={() => { setActive(c); setThread([]); setContacts((cs) => cs.map((x) => (x.id === c.id ? { ...x, unread: 0 } : x))); }}
                  className={`flex w-full items-center justify-between rounded-sm px-2 py-2 text-left text-sm ${active?.id === c.id ? 'bg-brand/10' : 'hover:bg-offwhite'}`}>
                  <span><span className="block font-medium">{c.name}</span><span className="text-xs text-ink-soft">{c.role.toLowerCase()}</span></span>
                  {c.unread > 0 && <span className="rounded-full bg-brand px-2 text-xs text-white">{c.unread}</span>}
                </button>
              </li>
            ))}
            {!list.length && <li className="p-2 text-sm text-ink-soft">No contacts.</li>}
          </ul>
        </div>
        <div className="card flex flex-col p-0">
          {!active ? <p className="m-auto text-sm text-ink-soft">Select someone to start chatting.</p> : (
            <>
              <div className="border-b border-line px-4 py-3 font-semibold">{active.name}</div>
              <div className="flex-1 space-y-2 overflow-y-auto p-4">
                {thread.map((m) => (
                  <div key={m.id} className={`flex ${m.fromId === user.id ? 'justify-end' : ''}`}>
                    <div className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${m.fromId === user.id ? 'bg-brand text-white' : 'bg-offwhite'}`}>
                      <p className="whitespace-pre-wrap break-words">{m.body}</p>
                      <p className={`mt-1 text-[10px] ${m.fromId === user.id ? 'text-white/70' : 'text-ink-soft'}`}>{fmtDateTime(m.createdAt)}</p>
                    </div>
                  </div>
                ))}
                <div ref={end} />
              </div>
              <form onSubmit={send} className="flex gap-2 border-t border-line p-3">
                <input className="input" placeholder="Type a message…" value={text} onChange={(e) => setText(e.target.value)} maxLength={2000} />
                <button className="btn-primary">Send</button>
              </form>
            </>
          )}
        </div>
      </div>
    </>
  );
}
