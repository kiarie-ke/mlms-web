import { useState } from 'react';
import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { Field, Notice, PageHeader } from '../components/ui.jsx';
import { errMsg } from '../lib/format.js';

export default function Account() {
  const { user } = useAuth();
  const [form, setForm] = useState({ current: '', next: '' });
  const [msg, setMsg] = useState({ text: '', error: false });

  const save = async (e) => {
    e.preventDefault();
    try {
      await api.post('/auth/password', form);
      setForm({ current: '', next: '' });
      setMsg({ text: 'Password updated.', error: false });
    } catch (err) {
      setMsg({ text: errMsg(err), error: true });
    }
  };

  return (
    <>
      <PageHeader title="My account" />
      <div className="card max-w-md">
        <p className="font-semibold">{user.name}</p>
        <p className="mb-4 text-sm text-ink-soft">{user.email} · {user.role}</p>
        <form onSubmit={save}>
          <Field label="Current password" type="password" value={form.current} onChange={(e) => setForm({ ...form, current: e.target.value })} required />
          <Field label="New password (min 8 characters)" type="password" minLength={8} value={form.next} onChange={(e) => setForm({ ...form, next: e.target.value })} required />
          <Notice error={msg.error}>{msg.text}</Notice>
          <button className="btn-primary">Change password</button>
        </form>
      </div>
    </>
  );
}
