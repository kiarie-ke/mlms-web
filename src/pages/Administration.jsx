import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useConfirm } from '../providers/ConfirmProvider.jsx';
import { api } from '../lib/api.js';
import {
  Badge,
  Field,
  Loading,
  Modal,
  Notice,
  PageHeader,
  Select,
  Table,
  TextArea,
  useFetch,
} from '../components/ui.jsx';
import { errMsg } from '../lib/format.js';

const SETTINGS = [
  ['schoolName', 'School name'],
  ['contactEmail', 'Contact email'],
  ['contactPhone', 'Contact phone'],
  ['currency', 'Currency'],
  ['address', 'Address'],
  ['assignmentWeight', 'Assignment weight (%)'],
  ['quizWeight', 'Quiz weight (%)'],
];

export default function Administration() {
  const confirm = useConfirm();
  const users = useFetch('/admin/users');
  const settings = useFetch('/admin/settings');
  const [auditPage, setAuditPage] = useState(1);
  const [auditFilters, setAuditFilters] = useState({ action: '', entityType: '', from: '', to: '' });
  const auditParams = new URLSearchParams({ page: String(auditPage), limit: '20' });
  Object.entries(auditFilters).forEach(([key, value]) => {
    if (value) auditParams.set(key, value);
  });
  const audit = useFetch(`/admin/audit-logs?${auditParams.toString()}`);
  const [values, setValues] = useState({});
  const [saved, setSaved] = useState({ text: '', error: false });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', role: 'ADMIN' });
  const [created, setCreated] = useState({ text: '', error: false });
  const [resetLink, setResetLink] = useState({ name: '', url: '', expiresAt: '', error: '' });

  useEffect(() => {
    if (settings.data) setValues({ assignmentWeight: '70', quizWeight: '30', ...settings.data });
  }, [settings.data]);

  const saveSettings = async (e) => {
    e.preventDefault();
    try {
      await api.put('/admin/settings', { values });
      setSaved({ text: 'Settings saved.', error: false });
    } catch (err) {
      setSaved({ text: errMsg(err), error: true });
    }
  };
  const createUser = async (e) => {
    e.preventDefault();
    try {
      const r = await api.post('/admin/users', form);
      setCreated({
        text: `Created. Default password (must be changed on first sign-in): ${r.temporaryPassword}`,
        error: false,
      });
      users.reload();
    } catch (err) {
      setCreated({ text: errMsg(err), error: true });
    }
  };
  const toggle = async (u) => {
    try {
      await api.patch(`/admin/users/${u.id}/active`, { active: !u.active });
      users.reload();
    } catch (err) {
      toast.error(errMsg(err));
    }
  };
  const deleteUser = async (u) => {
    const dataWarning = u.role === 'STUDENT'
      ? ' Their student profile and academic records will also be deleted.'
      : '';
    if (!await confirm({
      title: 'Permanently delete user?',
      message: `Permanently delete ${u.name}?${dataWarning} This cannot be undone.`,
      confirmText: 'Delete',
      variant: 'danger',
    })) return;
    try {
      await api.del(`/admin/users/${u.id}`);
      users.reload();
    } catch (err) {
      toast.error(errMsg(err));
    }
  };
  const reset = async (u) => {
    if (!await confirm({
      title: 'Reset password?',
      message: `Reset password for ${u.name}?`,
      confirmText: 'Reset password',
    })) return;
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
  const updateAuditFilter = (key, value) => {
    setAuditFilters({ ...auditFilters, [key]: value });
    setAuditPage(1);
  };

  if (!users.data) return <Loading error={users.error} />;
  return (
    <>
      <PageHeader title="Administration" />
      {resetLink.error && <Notice error>{resetLink.error}</Notice>}
      {resetLink.url && (
        <div className="card mb-6 max-w-2xl">
          <h2 className="font-semibold">Password reset link for {resetLink.name}</h2>
          <p className="mb-3 text-sm text-ink-soft">
            This link works once and expires {new Date(resetLink.expiresAt).toLocaleString()}.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              className="input min-w-0 flex-1"
              aria-label="Password reset link"
              readOnly
              value={resetLink.url}
            />
            <button type="button" className="btn-ghost" onClick={copyResetLink}>
              Copy link
            </button>
          </div>
        </div>
      )}
      <h2 className="mb-3 text-lg font-semibold">School settings</h2>
      <form onSubmit={saveSettings} className="card mb-8 max-w-xl">
        {SETTINGS.map(([k, label]) =>
          k === 'address' ? (
            <TextArea
              key={k}
              label={label}
              rows="2"
              value={values[k] ?? ''}
              onChange={(e) => setValues({ ...values, [k]: e.target.value })}
            />
          ) : (
            <Field
              key={k}
              label={label}
              type={k.endsWith('Weight') ? 'number' : undefined}
              min={k.endsWith('Weight') ? 0 : undefined}
              max={k.endsWith('Weight') ? 100 : undefined}
              step={k.endsWith('Weight') ? 1 : undefined}
              value={values[k] ?? ''}
              onChange={(e) => setValues({ ...values, [k]: e.target.value })}
            />
          ),
        )}
        <p className="mb-3 text-xs text-ink-soft">
          Assignment and quiz weights must add up to 100%.
        </p>
        <Notice error={saved.error}>{saved.text}</Notice>
        <button className="btn-primary">Save settings</button>
      </form>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Users</h2>
        <button
          className="btn-primary"
          onClick={() => {
            setCreated({ text: '' });
            setOpen(true);
          }}
        >
          Add staff user
        </button>
      </div>
      <Table
        rows={users.data}
        columns={[
          { header: 'Name', cell: (u) => u.name },
          { header: 'Email', cell: (u) => u.email },
          { header: 'Role', cell: (u) => <Badge>{u.role}</Badge> },
          { header: 'Active', cell: (u) => <Badge>{u.active ? 'ACTIVE' : 'SUSPENDED'}</Badge> },
          {
            header: 'Actions',
            cell: (u) => (
              <div className="flex flex-wrap gap-3 text-sm">
                <button className="text-brand" onClick={() => toggle(u)}>
                  {u.active ? 'Deactivate' : 'Activate'}
                </button>
                <button className="text-brand" onClick={() => reset(u)}>
                  Reset password
                </button>
                <button className="text-red-600" onClick={() => deleteUser(u)}>
                  Delete
                </button>
              </div>
            ),
          },
        ]}
      />
      <section className="mt-10">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Recent admin activity</h2>
            <p className="text-sm text-ink-soft">Audit history of data changes.</p>
          </div>
          <button type="button" className="btn-ghost" onClick={audit.reload}>Refresh</button>
        </div>
        <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-xs font-semibold text-ink-soft">
            Action
            <select
              className="input mt-1"
              value={auditFilters.action}
              onChange={(e) => updateAuditFilter('action', e.target.value)}
            >
              <option value="">All actions</option>
              {[
                'instructor.created', 'instructor.updated', 'instructor.deleted',
                'student.created', 'student.updated', 'student.deleted', 'student.assigned',
                'student.auto_assigned', 'cohort.message_sent',
              ].map((action) => <option key={action} value={action}>{action}</option>)}
            </select>
          </label>
          <label className="text-xs font-semibold text-ink-soft">
            Entity
            <select
              className="input mt-1"
              value={auditFilters.entityType}
              onChange={(e) => updateAuditFilter('entityType', e.target.value)}
            >
              <option value="">All entities</option>
              {['instructor', 'student', 'cohort', 'user', 'message', 'announcement', 'class', 'course', 'setting']
                .map((entityType) => <option key={entityType} value={entityType}>{entityType}</option>)}
            </select>
          </label>
          <label className="text-xs font-semibold text-ink-soft">
            From
            <input
              className="input mt-1"
              type="date"
              value={auditFilters.from}
              onChange={(e) => updateAuditFilter('from', e.target.value)}
            />
          </label>
          <label className="text-xs font-semibold text-ink-soft">
            To
            <input
              className="input mt-1"
              type="date"
              value={auditFilters.to}
              onChange={(e) => updateAuditFilter('to', e.target.value)}
            />
          </label>
        </div>
        {!audit.data ? <Loading error={audit.error} /> : (
          <>
            <Table
              rows={audit.data.data}
              columns={[
                {
                  header: 'Actor',
                  cell: (entry) => (
                    <span>{entry.user?.name ?? (entry.actorId ? 'Deleted user' : 'Unknown actor')}
                      <span className="ml-1 text-xs text-ink-soft">{entry.actorRole ?? entry.user?.role ?? ''}</span>
                    </span>
                  ),
                },
                { header: 'Action', cell: (entry) => entry.action ?? 'Legacy event' },
                {
                  header: 'Entity',
                  cell: (entry) => entry.entityType
                    ? <span>{entry.entityType}{entry.entityId ? <span className="block text-xs text-ink-soft">{entry.entityId}</span> : ''}</span>
                    : entry.path,
                },
                { header: 'Time', cell: (entry) => new Date(entry.createdAt).toLocaleString() },
                {
                  header: 'Changes',
                  cell: (entry) => {
                    const oldValues = entry.oldValues ?? null;
                    const newValues = entry.newValues ?? (entry.isLegacy ? entry.body : null);
                    return oldValues === null && newValues === null ? '—' : (
                      <details>
                        <summary className="cursor-pointer text-brand">View changes</summary>
                        <div className="mt-2 grid gap-2 sm:grid-cols-2">
                          <div>
                            <p className="text-xs font-semibold">Old values</p>
                            <pre className="max-w-md overflow-auto whitespace-pre-wrap text-xs">{JSON.stringify(oldValues, null, 2)}</pre>
                          </div>
                          <div>
                            <p className="text-xs font-semibold">New values</p>
                            <pre className="max-w-md overflow-auto whitespace-pre-wrap text-xs">{JSON.stringify(newValues, null, 2)}</pre>
                          </div>
                        </div>
                      </details>
                    );
                  },
                },
              ]}
              empty="No audit entries match these filters."
            />
            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="text-ink-soft">{audit.data.total} entries</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="btn-ghost"
                  disabled={auditPage <= 1}
                  onClick={() => setAuditPage((page) => page - 1)}
                >
                  Previous
                </button>
                <span>Page {audit.data.page} of {Math.max(1, audit.data.pages)}</span>
                <button
                  type="button"
                  className="btn-ghost"
                  disabled={auditPage >= audit.data.pages}
                  onClick={() => setAuditPage((page) => page + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </section>
      {open && (
        <Modal title="Add staff user" onClose={() => setOpen(false)}>
          <form onSubmit={createUser}>
            <Field
              label="Full name"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <Field
              label="Email"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <Select
              label="Role"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              <option value="ADMIN">Admin</option>
              <option value="INSTRUCTOR">Instructor</option>
            </Select>
            <Notice error={created.error}>{created.text}</Notice>
            <button className="btn-primary w-full">Create user</button>
          </form>
        </Modal>
      )}
    </>
  );
}
