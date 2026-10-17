import { Badge, Loading, PageHeader, Stat, Table, useFetch } from '../components/ui.jsx';
import { fmtDate } from '../lib/format.js';

export default function Grades() {
  const { data, error } = useFetch('/grades');
  if (!data) return <Loading error={error} />;
  return (
    <>
      <PageHeader title="Grades" />
      <div className="mb-6 max-w-xs"><Stat label="Average" value={data.average != null ? `${data.average}%` : '—'} /></div>
      <Table rows={data.rows} columns={[
        ...(data.rows.some((r) => r.student) ? [{ header: 'Student', cell: (r) => r.student }] : []),
        { header: 'Type', cell: (r) => <Badge>{r.kind}</Badge> },
        { header: 'Title', cell: (r) => r.title },
        { header: 'Score', cell: (r) => `${r.score}/${r.max}` },
        { header: 'Feedback', cell: (r) => r.feedback || '—' },
        { header: 'Date', cell: (r) => fmtDate(r.date) },
      ]} />
    </>
  );
}
