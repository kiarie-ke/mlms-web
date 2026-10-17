import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/auth.jsx';
import { api } from '../lib/api.js';
import { Badge, Loading, Modal, PageHeader, Table, useFetch } from '../components/ui.jsx';
import { errMsg, fmtDate, kes } from '../lib/format.js';

function Printable({ cert, onClose }) {
  return (
    <Modal title="Certificate" onClose={onClose}>
      <div id="cert" className="rounded border-4 border-double border-brand p-6 text-center">
        <p className="font-display text-sm uppercase tracking-widest text-brand">MODARA School</p>
        <h2 className="mt-2 font-display text-2xl font-bold">Certificate of Completion</h2>
        <p className="mt-4 text-sm text-ink-soft">This certifies that</p>
        <p className="font-display text-xl font-bold">{cert.student.user.name}</p>
        <p className="mt-2 text-sm text-ink-soft">has successfully completed</p>
        <p className="font-semibold">{cert.course.title}</p>
        <p className="mt-4 text-xs text-ink-soft">Issued {fmtDate(cert.issuedAt)} · Code {cert.code}</p>
        <p className="text-xs text-ink-soft">Verify at {window.location.origin}/verify/{cert.code}</p>
      </div>
      <div className="mt-4 flex gap-2 print:hidden">
        <button className="btn-primary flex-1" onClick={() => window.print()}>Print / save PDF</button>
        <Link className="btn-ghost" to={`/verify/${cert.code}`} target="_blank">Verify</Link>
      </div>
    </Modal>
  );
}

export default function Certification() {
  const { user } = useAuth();
  const admin = user.role === 'ADMIN';
  const staff = user.role !== 'STUDENT';
  const certs = useFetch('/certificates');
  const clearance = useFetch(staff ? '/certificates/clearance' : null);
  const [view, setView] = useState(null);

  const issue = async (r) => {
    const override = !r.cleared;
    if (override && !window.confirm(`${r.name} has not met all requirements (progress, fees). Issue anyway?`)) return;
    try { await api.post('/certificates', { studentId: r.studentId, override }); clearance.reload(); certs.reload(); } catch (err) { window.alert(errMsg(err)); }
  };

  if (!certs.data) return <Loading error={certs.error} />;
  return (
    <>
      <PageHeader title="Certification" />
      {staff && (
        <>
          <h2 className="mb-3 text-lg font-semibold">Completion clearance</h2>
          {!clearance.data ? <Loading error={clearance.error} /> : (
            <Table rows={clearance.data.map((r) => ({ ...r, id: r.studentId }))} columns={[
              { header: 'Student', cell: (r) => r.name }, { header: 'Cohort', cell: (r) => r.cohort ?? '—' },
              { header: 'Progress', cell: (r) => `${r.progress}%` }, { header: 'Attendance', cell: (r) => (r.attendance == null ? '—' : `${r.attendance}%`) },
              { header: 'Fee balance', cell: (r) => kes(r.balance) },
              { header: 'Cleared', cell: (r) => <Badge>{r.cleared ? 'PAID' : 'PENDING'}</Badge> },
              { header: '', cell: (r) => r.certificate ? <span className="text-sm text-emerald">Issued</span> : admin && <button className="btn-ghost" onClick={() => issue(r)}>{r.cleared ? 'Issue' : 'Issue (override)'}</button> },
            ]} />
          )}
          <h2 className="mb-3 mt-8 text-lg font-semibold">Issued certificates</h2>
        </>
      )}
      <Table rows={certs.data} empty="No certificates issued yet." columns={[
        ...(staff ? [{ header: 'Student', cell: (c) => c.student.user.name }] : []),
        { header: 'Course', cell: (c) => c.course.title }, { header: 'Code', cell: (c) => c.code }, { header: 'Issued', cell: (c) => fmtDate(c.issuedAt) },
        { header: '', cell: (c) => <button className="btn-ghost" onClick={() => setView(c)}>View</button> },
      ]} />
      {view && <Printable cert={view} onClose={() => setView(null)} />}
    </>
  );
}
