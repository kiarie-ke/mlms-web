import { Badge, Loading, PageHeader, Table, useFetch } from '../components/ui.jsx';

const pct = (v) => (v == null ? '—' : `${v}%`);

function exportCsv(data) {
  const rows = [
    ['Section', 'Name / status', 'Course', 'Count', 'Attendance %', 'Average grade %'],
    ...data.studentsByStatus.map((row) => ['Students', row.status, '', row.count, '', '']),
    ...data.applicationsByStatus.map((row) => ['Applications', row.status, '', row.count, '', '']),
    ...data.cohorts.map((row) => [
      'Cohort performance',
      row.name,
      row.course,
      row.students,
      row.attendance ?? '',
      row.averageGrade ?? '',
    ]),
  ];
  const csv = `\uFEFF${rows.map((row) => row.map((value) => {
    const text = String(value ?? '');
    const safeText = /^[\s]*[=+\-@]/.test(text) ? `'${text}` : text;
    return `"${safeText.replaceAll('"', '""')}"`;
  }).join(',')).join('\r\n')}`;
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `modara-report-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export default function Reports() {
  const { data, error } = useFetch('/reports/summary');
  if (!data) return <Loading error={error} />;
  return (
    <>
      <PageHeader title="Reports">
        <button className="btn-ghost" onClick={() => exportCsv(data)}>Export CSV</button>
        <button className="btn-ghost" onClick={() => window.print()}>Print</button>
      </PageHeader>
      <div className="grid gap-6 lg:grid-cols-2">
        <section><h2 className="mb-3 text-lg font-semibold">Students by status</h2>
          <Table rows={data.studentsByStatus.map((r) => ({ ...r, id: r.status }))} columns={[{ header: 'Status', cell: (r) => <Badge>{r.status}</Badge> }, { header: 'Count', cell: (r) => r.count }]} /></section>
        <section><h2 className="mb-3 text-lg font-semibold">Applications</h2>
          <Table rows={data.applicationsByStatus.map((r) => ({ ...r, id: r.status }))} columns={[{ header: 'Status', cell: (r) => <Badge>{r.status}</Badge> }, { header: 'Count', cell: (r) => r.count }]} /></section>
      </div>
      <h2 className="mb-3 mt-8 text-lg font-semibold">Cohort performance</h2>
      <Table rows={data.cohorts} columns={[
        { header: 'Cohort', cell: (c) => c.name }, { header: 'Course', cell: (c) => c.course }, { header: 'Students', cell: (c) => c.students },
        { header: 'Attendance', cell: (c) => pct(c.attendance) }, { header: 'Avg. grade', cell: (c) => pct(c.averageGrade) },
      ]} />
    </>
  );
}
