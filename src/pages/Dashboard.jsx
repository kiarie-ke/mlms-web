import { useAuth } from '../lib/auth.jsx';
import { Loading, PageHeader, Stat, useFetch } from '../components/ui.jsx';
import { fmtDate, fmtDateTime } from '../lib/format.js';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, CalendarDays, ClipboardList, Megaphone } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const { data, error } = useFetch('/dashboard');
  const news = useFetch('/announcements');
  const firstName = user.name.split(' ')[0];
  const today = new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date());
  return (
    <>
      <PageHeader title="Dashboard" />
      <section className="relative mb-7 overflow-hidden rounded-3xl bg-gradient-to-br from-navy via-[#0C2038] to-[#173D6B] px-6 py-7 text-white shadow-lg sm:px-8 sm:py-9">
        <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full border-[38px] border-white/[0.045]" />
        <div className="pointer-events-none absolute -bottom-24 right-1/4 h-52 w-52 rounded-full bg-cyan/10 blur-3xl" />
        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-cyan">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan" /> Learning workspace
            </p>
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Welcome back, {firstName}</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">Here’s your latest activity and what’s coming up next.</p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3 backdrop-blur">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-cyan/15 text-cyan"><CalendarDays size={20} /></span>
            <div><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Today</p><p className="mt-0.5 text-sm font-semibold">{today}</p></div>
          </div>
        </div>
      </section>
      {!data ? <Loading error={error} /> : (
        <>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-ink">At a glance</h2>
            <span className="text-xs font-medium text-ink-soft">Your current overview</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {data.cards.map((c) => <Stat key={c.label} {...c} />)}
          </div>
          <section className="mt-8" aria-labelledby="next-actions-heading">
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <h2 id="next-actions-heading" className="font-display text-lg font-bold text-ink">{user.role === 'STUDENT' ? 'Your next steps' : 'Needs your attention'}</h2>
                <p className="mt-1 text-xs text-ink-soft">{user.role === 'STUDENT' ? 'A quick look at what you can do next.' : 'Priority items across your workspace.'}</p>
              </div>
            </div>
            {data.nextActions?.length ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {data.nextActions.map((action) => (
                  <Link key={action.id} to={action.href} className="group rounded-2xl border border-line bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-md">
                    <div className="flex items-start justify-between gap-4">
                      <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand/10 text-brand"><ClipboardList size={19} /></span>
                      <span className="rounded-full bg-amber/15 px-2.5 py-1 text-xs font-bold text-[#9a5a00]">{action.value}</span>
                    </div>
                    <h3 className="mt-4 font-semibold text-ink">{action.title}</h3>
                    <p className="mt-1 min-h-10 text-sm leading-5 text-ink-soft">{action.description}</p>
                    <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand">View details <ArrowRight size={15} className="transition group-hover:translate-x-0.5" /></span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-3 rounded-2xl border border-emerald/20 bg-emerald/5 p-5 text-sm text-emerald">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-emerald/10"><ClipboardList size={18} /></span>
                <span><strong className="block">You’re all caught up.</strong><span className="text-emerald/80">There are no priority items right now.</span></span>
              </div>
            )}
          </section>
          {user.role === 'STUDENT' && data.openAssignments?.length > 0 && (
            <section className="mt-8" aria-labelledby="assignments-heading">
              <div className="mb-4 flex items-end justify-between gap-4">
                <div>
                  <h2 id="assignments-heading" className="font-display text-lg font-bold text-ink">Assignments to submit</h2>
                  <p className="mt-1 text-xs text-ink-soft">Your next outstanding assignments.</p>
                </div>
                <Link to="/assignments" className="inline-flex items-center gap-1 text-sm font-semibold text-brand">All assignments <ArrowRight size={15} /></Link>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {data.openAssignments.map((assignment) => {
                  const overdue = assignment.dueDate && new Date(assignment.dueDate) < new Date();
                  return (
                    <Link key={assignment.id} to="/assignments" className="rounded-2xl border border-line bg-white p-4 shadow-sm transition hover:border-brand/30 hover:shadow-md">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-ink">{assignment.title}</h3>
                        {overdue && <span className="shrink-0 rounded-full bg-red-100 px-2 py-1 text-[10px] font-bold text-red-700">Overdue</span>}
                      </div>
                      <p className="mt-2 text-xs text-ink-soft">{assignment.dueDate ? `Due ${fmtDate(assignment.dueDate)}` : 'No due date'}</p>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}
          <div className="mt-8 grid gap-6 xl:grid-cols-2">
            <section>
              <div className="mb-4 flex items-center justify-between gap-3">
                <div><h2 className="font-display text-lg font-bold text-ink">Upcoming classes</h2><p className="mt-1 text-xs text-ink-soft">Your next scheduled sessions</p></div>
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand/10 text-brand"><CalendarDays size={19} /></span>
              </div>
              <div className="space-y-3">
                {data.upcoming.map((c) => (
                  <div key={c.id} className="card flex items-center justify-between gap-4 transition hover:border-brand/25 hover:shadow-md">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-cyan/10 text-cyan"><CalendarDays size={19} /></span>
                      <div className="min-w-0"><p className="truncate font-semibold text-ink">{c.title}</p><p className="mt-1 text-xs text-ink-soft">{fmtDateTime(c.date)}</p></div>
                    </div>
                    {c.meetingUrl && <a className="btn-primary shrink-0" href={c.meetingUrl} target="_blank" rel="noreferrer noopener">Join <ArrowUpRight size={15} /></a>}
                  </div>
                ))}
                {!data.upcoming.length && <div className="card flex items-center gap-3 text-sm text-ink-soft"><CalendarDays size={18} className="text-slate-400" />No upcoming classes.</div>}
              </div>
            </section>
            <section>
              <div className="mb-4 flex items-center justify-between gap-3">
                <div><h2 className="font-display text-lg font-bold text-ink">Latest announcements</h2><p className="mt-1 text-xs text-ink-soft">Updates from your school</p></div>
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-amber/15 text-[#b45309]"><Megaphone size={19} /></span>
              </div>
              <div className="space-y-3">
                {news.data?.slice(0, 3).map((a) => (
                  <article key={a.id} className="card transition hover:border-brand/25 hover:shadow-md">
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand/10 text-brand"><Megaphone size={17} /></span>
                      <div><p className="font-semibold text-ink">{a.title}</p><p className="mt-1.5 line-clamp-3 text-sm leading-6 text-ink-soft">{a.body}</p></div>
                    </div>
                  </article>
                ))}
                {news.data && !news.data.length && <div className="card flex items-center gap-3 text-sm text-ink-soft"><Megaphone size={18} className="text-slate-400" />Nothing new.</div>}
                {!news.data && news.error && <Loading error={news.error} />}
              </div>
            </section>
          </div>
        </>
      )}
    </>
  );
}
