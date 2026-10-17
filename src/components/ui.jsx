import { useEffect, useState } from 'react';
import { AlertCircle, BookOpen, CalendarCheck, ClipboardList, GraduationCap, Layers, UserPlus, Users, Wallet } from 'lucide-react';
import { api } from '../lib/api.js';

const tones = {
  ok: 'bg-emerald/10 text-emerald',
  warn: 'bg-amber/15 text-[#b45309]',
  bad: 'bg-red-100 text-red-700',
  info: 'bg-brand/10 text-brand',
};
const toneOf = (s = '') => {
  s = s.toLowerCase();
  if (['active', 'paid', 'present', 'approved', 'graduated'].includes(s)) return 'ok';
  if (['suspended', 'absent', 'overdue', 'rejected'].includes(s)) return 'bad';
  if (['pending', 'late', 'partial', 'unpaid', 'deferred', 'excused'].includes(s)) return 'warn';
  return 'info';
};

export const Badge = ({ children }) => (
  <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${tones[toneOf(String(children))]}`}>{children}</span>
);

export const PageHeader = ({ title, children }) => (
  <div className="mb-7 flex flex-wrap items-center justify-between gap-4 border-b border-line/80 pb-5">
    <h1 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">{title}</h1>
    <div className="flex gap-2">{children}</div>
  </div>
);

export function Table({ columns, rows, empty = 'Nothing here yet.' }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-line bg-white shadow-sm">
      <table className="w-full border-collapse">
        <thead className="border-b border-line bg-slate-50/80">
          <tr>{columns.map((c) => <th key={c.header} className="th">{c.header}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((r, i) => (
            <tr key={r.id ?? i} className="transition-colors hover:bg-brand/[0.025]">{columns.map((c) => <td key={c.header} className="td">{c.cell(r)}</td>)}</tr>
          ))}
          {!rows.length && <tr><td className="td text-ink-soft" colSpan={columns.length}>{empty}</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

export function useFetch(path) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!path) return undefined;
    let live = true;
    api.get(path).then((d) => live && setData(d)).catch((e) => live && setError(e.message));
    return () => { live = false; };
  }, [path, tick]);
  return { data, error, reload: () => setTick((t) => t + 1) };
}

export function Modal({ title, onClose, children, wide }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-navy/60 p-4" onClick={onClose}>
      <div className={`max-h-[92vh] w-full overflow-y-auto rounded-lg bg-white p-6 shadow-lg ${wide ? 'max-w-3xl' : 'max-w-md'}`} onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} aria-label="Close" className="text-ink-soft">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export const Field = ({ label, type, ...props }) => {
  const [show, setShow] = useState(false);
  const isPw = type === 'password';
  return (
    <div className="mb-3">
      <label className="label">{label}</label>
      <div className="relative">
        <input className={isPw ? 'input pr-16' : 'input'} type={isPw && show ? 'text' : type} {...props} />
        {isPw && (
          <button type="button" onClick={() => setShow(!show)} aria-label={show ? 'Hide password' : 'Show password'}
            className="absolute inset-y-0 right-3 flex items-center text-ink-soft hover:text-brand">
            {show ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a18.5 18.5 0 0 1 5.06-5.94M9.9 4.24A10.9 10.9 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19M14.12 14.12a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

const SkeletonBlock = ({ className = '' }) => (
  <div aria-hidden="true" className={`animate-pulse rounded-lg bg-slate-200 motion-reduce:animate-none ${className}`} />
);

export function PageSkeleton() {
  return (
    <div role="status" aria-label="Loading content" aria-busy="true" className="space-y-6">
      <div aria-hidden="true" className="flex items-center justify-between gap-4 border-b border-line/80 pb-5">
        <SkeletonBlock className="h-8 w-48 max-w-[55%] rounded-md" />
        <SkeletonBlock className="h-10 w-28" />
      </div>
      <div aria-hidden="true" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <div key={item} className="rounded-2xl border border-line bg-white p-5 shadow-sm">
            <SkeletonBlock className="h-3 w-2/5" />
            <SkeletonBlock className="mt-5 h-8 w-1/2 rounded-md" />
          </div>
        ))}
      </div>
      <div aria-hidden="true" className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
        <div className="flex gap-4 border-b border-line bg-slate-50/80 px-5 py-4">
          {[0, 1, 2, 3].map((item) => <SkeletonBlock key={item} className="h-3 flex-1" />)}
        </div>
        {[0, 1, 2, 3].map((row) => (
          <div key={row} className="flex items-center gap-4 border-b border-line px-5 py-5 last:border-0">
            <SkeletonBlock className="h-9 w-9 shrink-0 rounded-full" />
            {[0, 1, 2, 3].map((item) => <SkeletonBlock key={item} className={`h-3 flex-1 ${item === 3 ? 'hidden sm:block' : ''}`} />)}
          </div>
        ))}
      </div>
    </div>
  );
}

export function AppSkeleton() {
  return (
    <div role="status" aria-label="Loading workspace" aria-busy="true" className="flex min-h-screen bg-offwhite">
      <aside aria-hidden="true" className="hidden w-[17rem] shrink-0 flex-col gap-8 bg-navy p-6 md:flex">
        <div className="flex items-center gap-3 border-b border-white/10 pb-6">
          <SkeletonBlock className="h-11 w-11 shrink-0 rounded-xl bg-white/15" />
          <div className="flex-1 space-y-2">
            <SkeletonBlock className="h-4 w-24 bg-white/15" />
            <SkeletonBlock className="h-2 w-20 bg-white/10" />
          </div>
        </div>
        <div className="space-y-3">
          {[0, 1, 2, 3, 4, 5, 6].map((item) => (
            <SkeletonBlock key={item} className={`h-10 rounded-xl bg-white/10 ${item === 0 ? 'bg-brand/70' : ''}`} />
          ))}
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <div aria-hidden="true" className="flex h-[4.5rem] items-center justify-between border-b border-line/80 bg-white px-5 sm:px-7">
          <div className="space-y-2">
            <SkeletonBlock className="h-3 w-40" />
            <SkeletonBlock className="h-2 w-52 max-w-[60vw]" />
          </div>
          <SkeletonBlock className="h-10 w-10 rounded-full" />
        </div>
        <div className="mx-auto w-full max-w-[1440px] p-5 sm:p-7 lg:p-10">
          <PageSkeleton />
        </div>
      </div>
    </div>
  );
}

export const Loading = ({ error }) => error ? (
  <div role="alert" className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
    <AlertCircle size={18} className="mt-0.5 shrink-0" />
    <div><p className="font-semibold">This section could not be loaded</p><p className="mt-1 text-red-700">{error}</p></div>
  </div>
) : <PageSkeleton />;

export const Select = ({ label, children, ...props }) => (
  <div className="mb-3">
    {label && <label className="label">{label}</label>}
    <select className="input" {...props}>{children}</select>
  </div>
);

export const TextArea = ({ label, ...props }) => (
  <div className="mb-3">
    {label && <label className="label">{label}</label>}
    <textarea className="input" rows="4" {...props} />
  </div>
);

export const Bar = ({ percent }) => (
  <div className="h-2 w-full overflow-hidden rounded-full bg-line">
    <div className="h-full rounded-full bg-brand" style={{ width: `${percent}%` }} />
  </div>
);

const statIcons = {
  students: Users,
  cohorts: Layers,
  courses: BookOpen,
  'submissions to grade': ClipboardList,
  'pending applications': UserPlus,
  'open invoices': Wallet,
  cohort: Layers,
  'course progress': GraduationCap,
  attendance: CalendarCheck,
  'assignments to do': ClipboardList,
  'fee balance (kes)': Wallet,
};

export const Stat = ({ label, value }) => {
  const Icon = statIcons[label.toLowerCase()] ?? BookOpen;
  return (
    <article className="group relative overflow-hidden rounded-2xl border border-line bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-ink-soft">{label}</p>
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand transition group-hover:bg-brand group-hover:text-white">
          <Icon size={19} strokeWidth={1.8} />
        </span>
      </div>
      <p className="mt-5 break-words font-display text-2xl font-bold leading-tight text-ink sm:text-3xl">{value}</p>
      <div className="mt-5 h-1 w-12 rounded-full bg-gradient-to-r from-brand to-cyan" />
    </article>
  );
};

export const Notice = ({ children, error }) =>
  children ? <p className={`mb-3 rounded-sm px-3 py-2 text-sm ${error ? 'bg-red-50 text-red-700' : 'bg-emerald/10 text-emerald'}`}>{children}</p> : null;
