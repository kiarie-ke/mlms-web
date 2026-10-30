import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { Loading, PageHeader } from '../components/ui.jsx';
import { fmtDateTime } from '../lib/format.js';
import Avatar from '../components/Avatar.jsx';
import { Check, CheckCheck, Reply, Users, X } from 'lucide-react';

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

function ChatMessage({ message, isCohort, own, sender, user, onReply }) {
  const swipeStart = useRef(null);
  const quotedSender = isCohort ? message.replyTo?.sender : message.replyTo?.from;
  const reply = () => onReply(message, own ? user.name : sender.name);
  const onTouchStart = (event) => {
    const touch = event.touches[0];
    swipeStart.current = { x: touch.clientX, y: touch.clientY };
  };
  const onTouchEnd = (event) => {
    const start = swipeStart.current;
    const touch = event.changedTouches[0];
    swipeStart.current = null;
    if (start && touch && touch.clientX - start.x > 72 && Math.abs(touch.clientY - start.y) < 48) reply();
  };
  const quotedMessage = message.replyTo;

  return (
    <div className={`group flex items-end gap-2 ${own ? 'justify-end' : ''}`}>
      {!own && <Avatar user={sender} size="h-8 w-8" className="text-[10px]" online={sender.online} />}
      <div
        id={`chat-message-${message.id}`}
        className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${own ? 'bg-brand text-white' : 'bg-offwhite'}`}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        style={{ touchAction: 'pan-y' }}
      >
        {isCohort && !own && <p className="mb-1 text-xs font-semibold">{sender.name}</p>}
        {quotedMessage && (
          <button
            type="button"
            onClick={() => document.getElementById(`chat-message-${quotedMessage.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
            className={`mb-2 block w-full rounded border-l-2 px-2 py-1 text-left ${own ? 'border-white/70 bg-white/10' : 'border-brand bg-white'}`}
          >
            <span className={`block text-xs font-semibold ${own ? 'text-white' : 'text-brand'}`}>{quotedSender?.name ?? 'Message'}</span>
            <span className="block truncate text-xs">{quotedMessage.body}</span>
          </button>
        )}
        <p className="whitespace-pre-wrap break-words">{message.body}</p>
        <p className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${own ? 'text-white/70' : 'text-ink-soft'}`}>
          {fmtDateTime(message.createdAt)}
          {!isCohort && own && (message.readAt
            ? <CheckCheck size={13} aria-label="Seen" title="Seen" className="text-cyan-100" />
            : <Check size={13} aria-label="Sent, not yet read" title="Sent, not yet read" />)}
        </p>
      </div>
      <button
        type="button"
        onClick={reply}
        aria-label={`Reply to ${sender.name}'s message`}
        title="Reply"
        className="mb-1 rounded-full p-1.5 text-ink-soft transition hover:bg-brand/10 hover:text-brand"
      >
        <Reply size={16} />
      </button>
      {own && <Avatar user={user} size="h-8 w-8" className="text-[10px]" />}
    </div>
  );
}

function ReplyPreview({ target, onCancel }) {
  if (!target) return null;
  return (
    <div className="flex items-center justify-between gap-3 border-t border-line bg-offwhite px-4 py-2">
      <div className="min-w-0 border-l-2 border-brand pl-2">
        <p className="text-xs font-semibold text-brand">Replying to {target.author}</p>
        <p className="truncate text-sm text-ink-soft">{target.body}</p>
      </div>
      <button type="button" onClick={onCancel} aria-label="Cancel reply" className="rounded-full p-1.5 text-ink-soft hover:bg-white hover:text-ink">
        <X size={16} />
      </button>
    </div>
  );
}

export default function Messages() {
  const { user } = useAuth();
  const [contacts, setContacts] = useState(null);
  const [cohortChats, setCohortChats] = useState(null);
  const [active, setActive] = useState(null);
  const [activeCohort, setActiveCohort] = useState(null);
  const [thread, setThread] = useState([]);
  const [cohortThread, setCohortThread] = useState([]);
  const [replyTarget, setReplyTarget] = useState(null);
  const [text, setText] = useState('');
  const [q, setQ] = useState('');
  const [error, setError] = useState('');
  const threadPane = useRef(null);

  const loadContacts = useCallback(() => api.get('/messages/contacts').then((next) => {
    setContacts(next);
    setActive((current) => {
      const latest = current && next.find((contact) => contact.id === current.id);
      return latest ? { ...current, ...latest } : current;
    });
  }).catch((e) => setError(e.message)), []);
  const loadCohortChats = useCallback(() => api.get('/messages/cohorts').then((next) => {
    setCohortChats(next);
    setActiveCohort((current) => {
      const latest = current && next.find((cohort) => cohort.id === current.id);
      return latest ?? null;
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
  const loadCohortThread = useCallback(async (id) => {
    try {
      setCohortThread(await api.get(`/messages/cohorts/${id}`));
      setCohortChats((current) => current?.map((cohort) => (cohort.id === id ? { ...cohort, unread: 0 } : cohort)));
      window.dispatchEvent(new Event('messages-read'));
      return true;
    } catch (loadError) {
      setError(loadError.message);
      return false;
    }
  }, []);

  useEffect(() => {
    const refresh = () => {
      if (!document.hidden) {
        loadContacts();
        loadCohortChats();
      }
    };
    loadContacts();
    loadCohortChats();
    const t = setInterval(refresh, 10000);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      clearInterval(t);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [loadContacts, loadCohortChats]);
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
  useEffect(() => {
    const cohortId = activeCohort?.id;
    if (!cohortId) return undefined;
    loadCohortThread(cohortId);
    const refresh = () => { if (!document.hidden) loadCohortThread(cohortId); };
    const t = setInterval(refresh, 5000);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      clearInterval(t);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [activeCohort?.id, loadCohortThread]);
  useEffect(() => {
    const pane = threadPane.current;
    if (pane) pane.scrollTop = pane.scrollHeight;
  }, [thread.length, cohortThread.length]);

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    try {
      if (activeCohort) {
        await api.post(`/messages/cohorts/${activeCohort.id}`, { body: text, replyToId: replyTarget?.id });
        loadCohortThread(activeCohort.id);
      } else {
        await api.post('/messages', { toId: active.id, body: text, replyToId: replyTarget?.id });
        loadThread(active.id);
      }
      setText('');
      setReplyTarget(null);
    } catch (err) { setError(err.message); }
  };
  const beginReply = (message, author) => setReplyTarget({ id: message.id, body: message.body, author });

  if (!contacts || !cohortChats) return <Loading error={error} />;
  const list = contacts.filter((c) => c.name.toLowerCase().includes(q.toLowerCase()));
  const cohortList = cohortChats.filter((c) => c.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="md:flex md:h-full md:min-h-0 md:flex-col">
      <PageHeader title={user.role === 'ADMIN' ? 'Messages' : 'Chat'} />
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
      <div className="grid h-[70vh] gap-4 md:h-auto md:min-h-0 md:flex-1 md:grid-cols-[18rem_1fr]">
        <div className="card flex min-h-0 flex-col overflow-hidden p-3">
          <input className="input mb-2" placeholder="Search people or cohorts…" value={q} onChange={(e) => setQ(e.target.value)} />
          <ul className="min-h-0 flex-1 overflow-y-auto">
            {cohortList.length > 0 && (
              <>
                <li className="px-2 pb-1 pt-3 text-xs font-semibold uppercase tracking-wide text-ink-soft">Cohort chats</li>
                {cohortList.map((c) => (
                  <li key={`cohort-${c.id}`}>
                    <button
                      onClick={() => {
                        setActive(null);
                        setActiveCohort(c);
                        setThread([]);
                        setCohortThread([]);
                        setReplyTarget(null);
                        setError('');
                      }}
                      className={`flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left text-sm ${activeCohort?.id === c.id ? 'bg-brand/10' : 'hover:bg-offwhite'}`}
                    >
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand/10 text-brand"><Users size={18} /></span>
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{c.name}</span>
                        <span className="text-xs text-ink-soft">{c.studentCount} students</span>
                      </span>
                      {c.unread > 0 && <span className="rounded-full bg-brand px-2 py-0.5 text-xs font-semibold text-white">{c.unread > 99 ? '99+' : c.unread}</span>}
                    </button>
                  </li>
                ))}
              </>
            )}
            {list.length > 0 && <li className="px-2 pb-1 pt-3 text-xs font-semibold uppercase tracking-wide text-ink-soft">Private chats</li>}
            {list.map((c) => (
              <li key={c.id}>
                <div className={`flex items-center gap-2 rounded-xl px-2 py-2 text-sm ${active?.id === c.id ? 'bg-brand/10' : 'hover:bg-offwhite'}`}>
                  <Avatar user={c} size="h-10 w-10" className="text-xs" online={c.online} />
                  <button
                    onClick={() => {
                      setActiveCohort(null);
                      setActive(c);
                      setThread([]);
                      setCohortThread([]);
                      setReplyTarget(null);
                      setError('');
                      setContacts((cs) => cs.map((x) => (x.id === c.id ? { ...x, unread: 0 } : x)));
                    }}
                    className="flex min-w-0 flex-1 items-center justify-between text-left"
                  >
                    <span className="min-w-0"><span className="block truncate font-medium">{c.name}</span><span className="text-xs text-ink-soft">{c.role.toLowerCase()} · {presenceLabel(c)}</span></span>
                    {c.unread > 0 && <span className="ml-2 rounded-full bg-brand px-2 text-xs text-white">{c.unread > 99 ? '99+' : c.unread}</span>}
                  </button>
                </div>
              </li>
            ))}
            {!list.length && !cohortList.length && <li className="p-2 text-sm text-ink-soft">No chats found.</li>}
          </ul>
        </div>
        <div className="card flex min-h-0 flex-col overflow-hidden p-0">
          {!active && !activeCohort ? <p className="m-auto text-sm text-ink-soft">Select someone to start chatting.</p> : activeCohort ? (
            <>
              <div className="flex items-center gap-3 border-b border-line px-4 py-3">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-brand/10 text-brand"><Users size={18} /></span>
                <div>
                  <p className="font-semibold">{activeCohort.name}</p>
                  <p className="text-xs text-ink-soft">{activeCohort.studentCount} students · Cohort chat</p>
                </div>
              </div>
              <div ref={threadPane} className="min-h-0 flex-1 space-y-2 overflow-y-auto p-4">
                {cohortThread.map((m) => (
                  <ChatMessage
                    key={m.id}
                    message={m}
                    isCohort
                    own={m.senderId === user.id}
                    sender={m.sender}
                    user={user}
                    onReply={beginReply}
                  />
                ))}
                {!cohortThread.length && <p className="py-4 text-center text-sm text-ink-soft">Start the conversation with your cohort.</p>}
              </div>
              <ReplyPreview target={replyTarget} onCancel={() => setReplyTarget(null)} />
              <form onSubmit={send} className={`flex gap-2 p-3 ${replyTarget ? '' : 'border-t border-line'}`}>
                <input className="input" placeholder="Message your cohort…" value={text} onChange={(e) => setText(e.target.value)} maxLength={4000} />
                <button className="btn-primary">Send</button>
              </form>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 border-b border-line px-4 py-3">
                <Avatar user={active} size="h-10 w-10" className="text-xs" online={active.online} />
                <div><p className="font-semibold">{active.name}</p><p className="text-xs capitalize text-ink-soft">{active.role.toLowerCase()} · {presenceLabel(active)}</p></div>
              </div>
              <div ref={threadPane} className="min-h-0 flex-1 space-y-2 overflow-y-auto p-4">
                {thread.map((m) => (
                  <ChatMessage
                    key={m.id}
                    message={m}
                    own={m.fromId === user.id}
                    sender={active}
                    user={user}
                    onReply={beginReply}
                  />
                ))}
              </div>
              <ReplyPreview target={replyTarget} onCancel={() => setReplyTarget(null)} />
              <form onSubmit={send} className={`flex gap-2 p-3 ${replyTarget ? '' : 'border-t border-line'}`}>
                <input className="input" placeholder="Type a message…" value={text} onChange={(e) => setText(e.target.value)} maxLength={2000} />
                <button className="btn-primary">Send</button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
