import { useState } from 'react';
import { useAuth } from '../lib/auth.jsx';
import { api } from '../lib/api.js';
import { Badge, Field, Loading, Modal, Notice, PageHeader, Select, Stat, Table, useFetch } from '../components/ui.jsx';
import { errMsg, fmtDate, kes } from '../lib/format.js';

const METHODS = ['CASH', 'BANK', 'MPESA', 'OTHER'];
const bal = (i) => i.amount - i.discount - i.paid;

function Student() {
  const { data, error } = useFetch('/fees/mine');
  if (!data) return <Loading error={error} />;
  const owing = data.reduce((s, i) => s + bal(i), 0);
  return (
    <>
      <PageHeader title="My fees" />
      <div className="mb-6 max-w-xs"><Stat label="Outstanding balance" value={kes(owing)} /></div>
      <Table rows={data} columns={[
        { header: 'Invoice', cell: (i) => i.title },
        { header: 'Amount', cell: (i) => kes(i.amount - i.discount) },
        { header: 'Paid', cell: (i) => kes(i.paid) },
        { header: 'Balance', cell: (i) => kes(bal(i)) },
        { header: 'Due', cell: (i) => fmtDate(i.dueDate) },
        { header: 'Status', cell: (i) => <Badge>{i.status}</Badge> },
        { header: 'Payments', cell: (i) => i.payments.map((p) => `${fmtDate(p.createdAt)}: ${kes(p.amount)} (${p.method})`).join('; ') || '—' },
      ]} />
      <p className="mt-3 text-sm text-ink-soft">Pay at the school office or by bank transfer; the office records your payment here.</p>
    </>
  );
}

function Admin() {
  const [tab, setTab] = useState('invoices');
  const invoices = useFetch('/fees');
  const plans = useFetch('/fees/plans');
  const students = useFetch('/students');
  const cohorts = useFetch('/cohorts');
  const courses = useFetch('/courses');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [msg, setMsg] = useState('');
  const open = (kind, initial = {}) => { setForm(initial); setMsg(''); setModal(kind); };
  const num = (v) => Number(v || 0);

  const submit = async (e) => {
    e.preventDefault();
    try {
      const due = form.dueDate ? new Date(form.dueDate).toISOString() : undefined;
      if (modal === 'pay') await api.post(`/fees/${form.id}/payments`, { amount: num(form.amount), method: form.method || 'CASH', reference: form.reference });
      if (modal === 'invoice') await api.post('/fees', { studentId: form.studentId, title: form.title, amount: num(form.amount), discount: num(form.discount), dueDate: due });
      if (modal === 'discount') await api.patch(`/fees/${form.id}`, { discount: num(form.discount), dueDate: due });
      if (modal === 'plan') await api.post('/fees/plans', { title: form.title, amount: num(form.amount), courseId: form.courseId || undefined });
      if (modal === 'assign') {
        const r = await api.post(`/fees/plans/${form.id}/assign`, { cohortId: form.cohortId, discount: num(form.discount), dueDate: due });
        window.alert(`${r.created} invoices created.`);
      }
      setModal(null);
      invoices.reload();
      plans.reload();
    } catch (err) { setMsg(errMsg(err)); }
  };
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  if (!invoices.data) return <Loading error={invoices.error} />;
  const titles = { pay: 'Record payment', invoice: 'New invoice', discount: 'Discount & due date', plan: 'New fee plan', assign: 'Assign plan to cohort' };
  return (
    <>
      <PageHeader title="Fees & payments">
        <button className="btn-ghost" onClick={() => open('plan')}>New plan</button>
        <button className="btn-primary" onClick={() => open('invoice')}>New invoice</button>
      </PageHeader>
      <div className="mb-4 flex gap-2">
        {['invoices', 'plans'].map((t) => <button key={t} className={tab === t ? 'btn-primary' : 'btn-ghost'} onClick={() => setTab(t)}>{t === 'invoices' ? 'Invoices' : 'Fee plans'}</button>)}
      </div>
      {tab === 'invoices' ? (
        <Table rows={invoices.data} columns={[
          { header: 'Student', cell: (i) => i.student.user.name },
          { header: 'Invoice', cell: (i) => i.title },
          { header: 'Net', cell: (i) => kes(i.amount - i.discount) },
          { header: 'Paid', cell: (i) => kes(i.paid) },
          { header: 'Balance', cell: (i) => kes(bal(i)) },
          { header: 'Due', cell: (i) => fmtDate(i.dueDate) },
          { header: 'Status', cell: (i) => <Badge>{i.status}</Badge> },
          { header: 'Actions', cell: (i) => (
            <div className="flex gap-3 text-sm">
              {i.status !== 'PAID' && <button className="text-brand" onClick={() => open('pay', { id: i.id, method: 'CASH', amount: bal(i) })}>Record payment</button>}
              <button className="text-brand" onClick={() => open('discount', { id: i.id, discount: i.discount })}>Discount</button>
            </div>
          ) },
        ]} />
      ) : (
        <Table rows={plans.data ?? []} columns={[
          { header: 'Plan', cell: (p) => p.title },
          { header: 'Course', cell: (p) => p.course?.title ?? '—' },
          { header: 'Amount', cell: (p) => kes(p.amount) },
          { header: '', cell: (p) => <button className="btn-ghost" onClick={() => open('assign', { id: p.id })}>Assign to cohort</button> },
        ]} />
      )}
      {modal && (
        <Modal title={titles[modal]} onClose={() => setModal(null)}>
          <form onSubmit={submit}>
            {modal === 'invoice' && (
              <Select label="Student" required value={form.studentId ?? ''} onChange={set('studentId')}>
                <option value="">Select…</option>
                {students.data?.map((s) => <option key={s.id} value={s.id}>{s.user.name}</option>)}
              </Select>
            )}
            {(modal === 'invoice' || modal === 'plan') && <Field label="Title" required value={form.title ?? ''} onChange={set('title')} />}
            {modal === 'plan' && (
              <Select label="Course (optional)" value={form.courseId ?? ''} onChange={set('courseId')}>
                <option value="">Any</option>
                {courses.data?.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
              </Select>
            )}
            {modal === 'assign' && (
              <Select label="Cohort" required value={form.cohortId ?? ''} onChange={set('cohortId')}>
                <option value="">Select…</option>
                {cohorts.data?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            )}
            {['invoice', 'plan', 'pay'].includes(modal) && <Field label="Amount (KES)" type="number" min="1" required value={form.amount ?? ''} onChange={set('amount')} />}
            {['invoice', 'discount', 'assign'].includes(modal) && <Field label="Discount (KES)" type="number" min="0" value={form.discount ?? ''} onChange={set('discount')} />}
            {['invoice', 'discount', 'assign'].includes(modal) && <Field label="Due date" type="date" value={form.dueDate ?? ''} onChange={set('dueDate')} />}
            {modal === 'pay' && (
              <>
                <Select label="Method" value={form.method} onChange={set('method')}>{METHODS.map((m) => <option key={m}>{m}</option>)}</Select>
                <Field label="Reference" value={form.reference ?? ''} onChange={set('reference')} />
              </>
            )}
            <Notice error>{msg}</Notice>
            <button className="btn-primary w-full">Save</button>
          </form>
        </Modal>
      )}
    </>
  );
}

export default function Fees() {
  return useAuth().user.role === 'STUDENT' ? <Student /> : <Admin />;
}
