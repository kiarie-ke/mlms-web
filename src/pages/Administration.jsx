import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { Badge, Field, Loading, Modal, Notice, PageHeader, Select, Table, TextArea, useFetch } from '../components/ui.jsx';
import { errMsg } from '../lib/format.js';

const SETTINGS = [['schoolName', 'School name'], ['contactEmail', 'Contact email'], ['contactPhone', 'Contact phone'], ['currency', 'Currency'], ['address', 'Address']];

export default function Administration() {
  const users = useFetch('/admin/users');
  const settings = useFetch('/admin/settings');
  const [values, setValues] = useState({});
  const [saved, setSaved] = useState({ text: '', error: false });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', role: 'ADMIN' });
  const [created, setCreated] = useState({ text: '', error: false });
  const [resetLink, setResetLink] = useState({ name: '', url: '', expiresAt: '', error: '' });

  useEffect(() => { if (settings.data) setValues(settings.data); }, [settings.data]);

  const saveSettings = async (e) => {
    e.preventDefault();
    try { await api.put('/admin/settings', { values }); setSaved({ text: 'Settings saved.', error: false }); }
    catch (err) { setSaved({ text: errMsg(err), error: true }); }
  };
  const createUser = async (e) => {
    e.preventDefault();
    try {
      const r = await api.post('/admin/users', form);
      setCreated({ text: `Created. Temporary password (share it once): ${r.temporaryPassword}`, error: false });
      users.reload();
    } catch (err) { setCreated({ text: errMsg(err), error: true }); }
  };
  const toggle = async (u) => {
    try { await api.patch(`/admin/users/${u.id}/active`, { active: !u.active }); users.reload(); } catch (err) { window.alert(errMsg(err)); }
  };
  const reset = async (u) => {
    if (!window.confirm(`Reset password for ${u.name}?`)) return;
    try {
      const r = await api.post(`/admin/users/${u.id}/reset-password`);
      setResetLink({ name: u.name, url: r.resetUrl, expiresAt: r.expiresAt, error: '' });
    } catch (err) {
      setResetLink({ name: u.name, url: '', expiresAt: '', error: errMsg(err) });
    }
  };
  const copyResetLink = async () => {
    try {
      await navigator.clipboard.writeText(resetLink.url);
    } catch (err) {
      setResetLink({ ...resetLink, error: `Could not copy the link: ${errMsg(err)}` });
    }
  };

  if (!users.data) return <Loading error={users.error} />;
  return (
    <>
      <PageHeader title="Administration" />
      {resetLink.error && <Notice error>{resetLink.error}</Notice>}
      {resetLink.url && (
        <div className="card mb-6 max-w-2xl">
          <h2 className="font-semibold">Password reset link for {resetLink.name}</h2>
          <p className="mb-3 text-sm text-ink-soft">This link works once and expires {new Date(resetLink.expiresAt).toLocaleString()}.</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input className="input min-w-0 flex-1" aria-label="Password reset link" readOnly value={resetLink.url} />
            <button type="button" className="btn-ghost" onClick={copyResetLink}>Copy link</button>
          </div>
        </div>
      )}
      <h2 className="mb-3 text-lg font-semibold">School settings</h2>
      <form onSubmit={saveSettings} className="card mb-8 max-w-xl">
        {SETTINGS.map(([k, label]) => k === 'address'
          ? <TextArea key={k} label={label} rows="2" value={values[k] ?? ''} onChange={(e) => setValues({ ...values, [k]: e.target.value })} />
          : <Field key={k} label={label} value={values[k] ?? ''} onChange={(e) => setValues({ ...values, [k]: e.target.value })} />)}
        <Notice error={saved.error}>{saved.text}</Notice>
        <button className="btn-primary">Save settings</button>
      </form>
      <div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-semibold">Users</h2><button className="btn-primary" onClick={() => { setCreated({ text: '' }); setOpen(true); }}>Add staff user</button></div>
      <Table rows={users.data} columns={[
        { header: 'Name', cell: (u) => u.name }, { header: 'Email', cell: (u) => u.email }, { header: 'Role', cell: (u) => <Badge>{u.role}</Badge> },
        { header: 'Active', cell: (u) => <Badge>{u.active ? 'ACTIVE' : 'SUSPENDED'}</Badge> },
        { header: 'Actions', cell: (u) => <div className="flex gap-3 text-sm"><button className="text-brand" onClick={() => toggle(u)}>{u.active ? 'Deactivate' : 'Activate'}</button><button className="text-brand" onClick={() => reset(u)}>Reset password</button></div> },
      ]} />
      {open && (
        <Modal title="Add staff user" onClose={() => setOpen(false)}>
          <form onSubmit={createUser}>
            <Field label="Full name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Field label="Email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <Select label="Role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}><option value="ADMIN">Admin</option><option value="INSTRUCTOR">Instructor</option></Select>
            <Notice error={created.error}>{created.text}</Notice>
            <button className="btn-primary w-full">Create user</button>
          </form>
        </Modal>
      )}
    </>
  );
}
