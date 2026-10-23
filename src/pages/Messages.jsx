import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { Loading, PageHeader } from '../components/ui.jsx';
import { fmtDateTime } from '../lib/format.js';
import Avatar from '../components/Avatar.jsx';
import { Check, CheckCheck } from 'lucide-react';

function presenceLabel(contact) {
  if (contact.online) return 'Online';
  if (!contact.lastSeenAt) return 'Offline';
  const lastSeen = new Date(contact.lastSeenAt);
  return `Last seen ${lastSeen.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })}`;
}

export default function Messages() {
  const { user } = useAuth();
  const [contacts, setContacts] = useState(null);
  const [active, setActive] = useState(null);
  const [thread, setThread] = useState([]);
  const [text, setText] = useState('');
  const [q, setQ] = useState('');
  const [error, setError] = useState('');
  const end = useRef(null);

  const loadContacts = useCallback(() => api.get('/messages/contacts').then((next) => {
    setContacts(next);
    setActive((current) => {
      const latest = current && next.find((contact) => contact.id === current.id);
      return latest ? { ...current, ...latest } : current;
    });
  }).catch((e) => setError(e.message)), []);
  const loadThread = useCallback(async (id) => {
    try {
      setThread(await api.get(`/messages/with/${id}`));
      return true;
    } catch (loadError) {
      setError(loadError.message);
      return false;
    }
  }, []);

  useEffect(() => {
    const refresh = () => { if (!document.hidden) loadContacts(); };
    loadContacts();
    const t = setInterval(refresh, 10000);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      clearInterval(t);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [loadContacts]);
  useEffect(() => {
    const activeId = active?.id;
    if (!activeId) return undefined;
    loadThread(activeId).then((loaded) => {
      if (loaded) window.dispatchEvent(new Event('messages-read'));
    });
    const refresh = () => { if (!document.hidden) loadThread(activeId); };
    const t = setInterval(refresh, 5000);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      clearInterval(t);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [active?.id, loadThread]);
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
                <div className={`flex items-center gap-2 rounded-xl px-2 py-2 text-sm ${active?.id === c.id ? 'bg-brand/10' : 'hover:bg-offwhite'}`}>
                  <Avatar user={c} size="h-10 w-10" className="text-xs" online={c.online} />
                  <button
                    onClick={() => { setActive(c); setThread([]); setContacts((cs) => cs.map((x) => (x.id === c.id ? { ...x, unread: 0 } : x))); }}
                    className="flex min-w-0 flex-1 items-center justify-between text-left"
                  >
                    <span className="min-w-0"><span className="block truncate font-medium">{c.name}</span><span className="text-xs text-ink-soft">{c.role.toLowerCase()} · {presenceLabel(c)}</span></span>
                    {c.unread > 0 && <span className="ml-2 rounded-full bg-brand px-2 text-xs text-white">{c.unread}</span>}
                  </button>
                </div>
              </li>
            ))}
            {!list.length && <li className="p-2 text-sm text-ink-soft">No contacts.</li>}
          </ul>
        </div>
        <div className="card flex flex-col p-0">
          {!active ? <p className="m-auto text-sm text-ink-soft">Select someone to start chatting.</p> : (
            <>
              <div className="flex items-center gap-3 border-b border-line px-4 py-3">
                <Avatar user={active} size="h-10 w-10" className="text-xs" online={active.online} />
                <div><p className="font-semibold">{active.name}</p><p className="text-xs capitalize text-ink-soft">{active.role.toLowerCase()} · {presenceLabel(active)}</p></div>
              </div>
              <div className="flex-1 space-y-2 overflow-y-auto p-4">
                {thread.map((m) => (
                  <div key={m.id} className={`flex items-end gap-2 ${m.fromId === user.id ? 'justify-end' : ''}`}>
                    {m.fromId !== user.id && <Avatar user={active} size="h-8 w-8" className="text-[10px]" online={active.online} />}
                    <div className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${m.fromId === user.id ? 'bg-brand text-white' : 'bg-offwhite'}`}>
                      <p className="whitespace-pre-wrap break-words">{m.body}</p>
                      <p className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${m.fromId === user.id ? 'text-white/70' : 'text-ink-soft'}`}>
                        {fmtDateTime(m.createdAt)}
                        {m.fromId === user.id && (m.readAt
                          ? <CheckCheck size={13} aria-label="Seen" title="Seen" className="text-cyan-100" />
                          : <Check size={13} aria-label="Sent, not yet read" title="Sent, not yet read" />)}
                      </p>
                    </div>
                    {m.fromId === user.id && <Avatar user={user} size="h-8 w-8" className="text-[10px]" />}
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
