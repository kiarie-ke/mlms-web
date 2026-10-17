import { Loading, PageHeader, Stat, Table, useFetch } from '../components/ui.jsx';
import { fmtDate, kes } from '../lib/format.js';

export default function Financials() {
  const { data, error } = useFetch('/financials');
  if (!data) return <Loading error={error} />;
  const max = Math.max(1, ...data.monthly.map((m) => m.total ?? m.amount ?? 0));
  return (
    <>
      <PageHeader title="Financials" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Billed" value={kes(data.billed)} />
        <Stat label="Discounts" value={kes(data.discounts)} />
        <Stat label="Collected" value={kes(data.collected)} />
        <Stat label="Outstanding" value={kes(data.outstanding)} />
      </div>
      <h2 className="mb-3 mt-8 text-lg font-semibold">Income by month</h2>
      <div className="card space-y-2">
        {data.monthly.map((m) => {
          const v = m.total ?? m.amount ?? 0;
          return (
            <div key={m.month} className="flex items-center gap-3 text-sm">
              <span className="w-20 text-ink-soft">{m.month}</span>
              <div className="h-3 flex-1 rounded-full bg-line"><div className="h-3 rounded-full bg-brand" style={{ width: `${(v / max) * 100}%` }} /></div>
              <span className="w-28 text-right">{kes(v)}</span>
            </div>
          );
        })}
        {!data.monthly.length && <p className="text-sm text-ink-soft">No income recorded yet.</p>}
      </div>
      <h2 className="mb-3 mt-8 text-lg font-semibold">Transactions</h2>
      <Table rows={data.transactions} columns={[
        { header: 'Date', cell: (t) => fmtDate(t.createdAt ?? t.date) },
        { header: 'Student', cell: (t) => t.student ?? t.invoice?.student?.user?.name ?? '—' },
        { header: 'Method', cell: (t) => t.method },
        { header: 'Reference', cell: (t) => t.reference || '—' },
        { header: 'Amount', cell: (t) => kes(t.amount) },
      ]} />
    </>
  );
}
