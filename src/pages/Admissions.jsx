import { useState } from 'react';
import { api } from '../lib/api.js';
import { Badge, Loading, Modal, Notice, PageHeader, Select, Table, useFetch } from '../components/ui.jsx';
import { errMsg, fmtDate } from '../lib/format.js';

export default function Admissions() {
  const { data, error, reload } = useFetch('/admissions');
  const cohorts = useFetch('/cohorts');
  const [approving, setApproving] = useState(null);
  const [cohortId, setCohortId] = useState('');
  const [msg, setMsg] = useState({ text: '', error: false });

  const approve = async () => {
    try {
      const r = await api.post(`/admissions/${approving.id}/approve`, cohortId ? { cohortId } : {});
      setMsg({ text: `Approved. Student account created. Default password: ${r.temporaryPassword} (the student should change it in their portal)`, error: false });
      reload();
    } catch (err) {
      setMsg({ text: errMsg(err), error: true });
    }
  };
  const reject = async (a) => { await api.patch(`/admissions/${a.id}/reject`); reload(); };

  if (!data) return <Loading error={error} />;
  return (
    <>
      <PageHeader title="Admissions">
        <button className="btn-ghost" onClick={() => navigator.clipboard?.writeText(`${window.location.origin}/apply`)}>Copy application link</button>
      </PageHeader>
      <Table
        rows={data}
        empty="No applications yet."
        columns={[
          { header: 'Applicant', cell: (a) => <><p className="font-medium">{a.name}</p><p className="text-xs text-ink-soft">{a.email}{a.phone ? ` · ${a.phone}` : ''}</p></> },
          { header: 'Course', cell: (a) => a.course },
          { header: 'Note', cell: (a) => a.message || '—' },
          { header: 'Date', cell: (a) => fmtDate(a.createdAt) },
          { header: 'Status', cell: (a) => <Badge>{a.status}</Badge> },
          {
            header: '',
            cell: (a) => a.status === 'PENDING' && (
              <div className="flex gap-2">
                <button className="btn-primary" onClick={() => { setMsg({ text: '' }); setCohortId(''); setApproving(a); }}>Approve</button>
                <button className="btn-ghost" onClick={() => reject(a)}>Reject</button>
              </div>
            ),
          },
        ]}
      />
      {approving && (
        <Modal title={`Approve ${approving.name}`} onClose={() => setApproving(null)}>
          <Select label="Place in cohort" value={cohortId} onChange={(e) => setCohortId(e.target.value)}>
            <option value="">Decide later</option>
            {cohorts.data?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
          <Notice error={msg.error}>{msg.text}</Notice>
          {!msg.text || msg.error ? <button className="btn-primary w-full" onClick={approve}>Approve and create account</button> : <button className="btn-ghost w-full" onClick={() => setApproving(null)}>Done</button>}
        </Modal>
      )}
    </>
  );
}
