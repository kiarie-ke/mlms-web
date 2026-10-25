import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, ExternalLink } from 'lucide-react';
import { api } from '../lib/api.js';
import { PageHeader } from '../components/ui.jsx';

const dateKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const dayLabel = (date) => new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(date);
const monthLabel = (date) => new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(date);
const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function Calendar() {
  const [month, setMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const range = useMemo(() => ({
    from: new Date(month.getFullYear(), month.getMonth(), 1).toISOString(),
    to: new Date(month.getFullYear(), month.getMonth() + 1, 1).toISOString(),
  }), [month]);

  useEffect(() => {
    let current = true;
    setLoading(true);
    setError('');
    api.get(`/calendar?from=${encodeURIComponent(range.from)}&to=${encodeURIComponent(range.to)}`)
      .then((result) => { if (current) setEvents(result); })
      .catch((requestError) => { if (current) setError(requestError.message); })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [range]);

  const eventsByDate = useMemo(() => {
    const grouped = new Map();
    for (const event of events) {
      const key = dateKey(new Date(event.date));
      grouped.set(key, [...(grouped.get(key) ?? []), event]);
    }
    return grouped;
  }, [events]);

  const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
  const offset = (monthStart.getDay() + 6) % 7;
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cellCount = Math.ceil((offset + daysInMonth) / 7) * 7;
  const today = dateKey(new Date());
  const selectedKey = dateKey(selectedDate);
  const selectedEvents = eventsByDate.get(selectedKey) ?? [];
  const days = Array.from({ length: cellCount }, (_, index) => new Date(month.getFullYear(), month.getMonth(), index - offset + 1));

  const moveMonth = (amount) => {
    const next = new Date(month.getFullYear(), month.getMonth() + amount, 1);
    setMonth(next);
    setSelectedDate(next);
  };
  const goToToday = () => {
    const now = new Date();
    setMonth(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelectedDate(now);
  };

  return (
    <>
      <PageHeader title="Calendar" />
      <section className="card">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button className="btn-ghost !px-3" onClick={() => moveMonth(-1)} aria-label="Previous month"><ChevronLeft size={18} /></button>
            <h2 className="min-w-40 text-center font-display text-lg font-bold">{monthLabel(month)}</h2>
            <button className="btn-ghost !px-3" onClick={() => moveMonth(1)} aria-label="Next month"><ChevronRight size={18} /></button>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-3 text-xs text-ink-soft sm:flex">
              <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-brand" />Classes</span>
              <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber" />Assignment due</span>
            </div>
            <button className="btn-ghost" onClick={goToToday}>Today</button>
          </div>
        </div>
        {error && <p role="alert" className="mb-3 text-sm text-red-600">Could not load calendar events: {error}</p>}
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {weekdays.map((day) => <div key={day} className="pb-1 text-center text-[10px] font-bold uppercase tracking-wide text-ink-soft sm:text-xs">{day}</div>)}
          {days.map((date) => {
            const key = dateKey(date);
            const dayEvents = eventsByDate.get(key) ?? [];
            const inMonth = date.getMonth() === month.getMonth();
            const hasClass = dayEvents.some((event) => event.type === 'class');
            const hasAssignment = dayEvents.some((event) => event.type === 'assignment');
            return (
              <button
                key={key}
                type="button"
                aria-pressed={key === selectedKey}
                aria-label={`${dayLabel(date)}${dayEvents.length ? `, ${dayEvents.length} event${dayEvents.length === 1 ? '' : 's'}` : ''}`}
                onClick={() => setSelectedDate(date)}
                className={`flex min-h-16 flex-col items-start rounded-xl border p-1.5 text-left transition sm:min-h-24 sm:p-2 ${
                  key === selectedKey ? 'border-brand bg-brand/5 ring-1 ring-brand/20' : 'border-line hover:border-brand/40'
                } ${inMonth ? 'bg-white' : 'bg-slate-50 text-slate-400'}`}
              >
                <span className={`grid h-6 w-6 place-items-center rounded-full text-xs font-semibold ${
                  key === today ? 'bg-navy text-white' : key === selectedKey ? 'text-brand' : ''
                }`}>{date.getDate()}</span>
                <span className="mt-auto flex items-center gap-1.5" aria-hidden="true">
                  {hasClass && <span className="h-2 w-2 rounded-full bg-brand" />}
                  {hasAssignment && <span className="h-2 w-2 rounded-full bg-amber" />}
                  {dayEvents.length > 0 && <span className="text-[10px] text-ink-soft">{dayEvents.length}</span>}
                </span>
              </button>
            );
          })}
        </div>
        <div className="mt-6 border-t border-line pt-4">
          <div className="mb-3 flex items-center gap-2">
            <CalendarDays size={18} className="text-brand" />
            <h3 className="font-semibold">{dayLabel(selectedDate)}</h3>
          </div>
          {loading ? <p role="status" className="text-sm text-ink-soft">Loading calendar…</p>
            : selectedEvents.length ? (
              <ul className="space-y-2">
                {selectedEvents.map((event) => (
                  <li key={event.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line p-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${event.type === 'class' ? 'bg-brand' : 'bg-amber'}`} />
                      <div className="min-w-0">
                        <p className="font-medium">{event.title}</p>
                        <p className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-ink-soft">
                          {event.type === 'class' && <span className="inline-flex items-center gap-1"><Clock3 size={12} />{new Date(event.date).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}</span>}
                          <span>{event.type === 'class' ? 'Class' : 'Assignment due'} · {event.cohortName}</span>
                        </p>
                      </div>
                    </div>
                    {event.type === 'class' && event.meetingUrl
                      ? <a className="inline-flex items-center gap-1 text-sm font-semibold text-brand" href={event.meetingUrl} target="_blank" rel="noreferrer noopener">Join <ExternalLink size={14} /></a>
                      : <Link className="text-sm font-semibold text-brand" to={event.type === 'class' ? '/classes' : '/assignments'}>View</Link>}
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-ink-soft">No classes or assignment deadlines on this day.</p>}
        </div>
      </section>
    </>
  );
}
