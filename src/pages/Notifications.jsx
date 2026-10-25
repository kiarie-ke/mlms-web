import { api } from '../lib/api.js';
import { Loading, PageHeader, useFetch } from '../components/ui.jsx';
import { fmtDateTime } from '../lib/format.js';
import PushNotificationSettings from '../components/PushNotificationSettings.jsx';

export default function Notifications() {
  const { data, error, reload } = useFetch('/notifications');
  const mark = async (n) => { if (!n.read) { await api.post(`/notifications/${n.id}/read`); reload(); } };
  const all = async () => { await api.post('/notifications/read-all'); reload(); };
  if (!data) return <Loading error={error} />;
  return (
    <>
      <PageHeader title="Notifications">{data.some((n) => !n.read) && <button className="btn-ghost" onClick={all}>Mark all read</button>}</PageHeader>
      <PushNotificationSettings />
      <div className="space-y-2">
        {data.map((n) => (
          <button key={n.id} onClick={() => mark(n)} className={`card block w-full text-left ${n.read ? 'opacity-70' : 'border-l-4 border-l-brand'}`}>
            <p className="font-medium">{n.title}</p>
            {n.body && <p className="text-sm text-ink-soft">{n.body}</p>}
            <p className="mt-1 text-xs text-ink-soft">{fmtDateTime(n.createdAt)}</p>
          </button>
        ))}
        {!data.length && <p className="text-sm text-ink-soft">You're all caught up.</p>}
      </div>
    </>
  );
}
