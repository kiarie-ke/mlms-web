import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const dateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const timeLabel = (value) => new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(new Date(value));

export default function TeachingCalendar({ events, error }) {
  const [month, setMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [selectedDay, setSelectedDay] = useState(() => dateKey(new Date()));
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const leadingDays = (new Date(year, monthIndex, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const cellCount = Math.ceil((leadingDays + daysInMonth) / 7) * 7;
  const cells = Array.from({ length: cellCount }, (_, index) => new Date(year, monthIndex, index - leadingDays + 1));
  const eventsByDay = new Map();

  for (const event of events ?? []) {
    const key = dateKey(new Date(event.date));
    const dayEvents = eventsByDay.get(key) ?? [];
    dayEvents.push(event);
    eventsByDay.set(key, dayEvents);
  }

  for (const dayEvents of eventsByDay.values()) {
    dayEvents.sort((a, b) => new Date(a.date) - new Date(b.date));
  }
  const monthLabel = new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(month);

  const changeMonth = (offset) => {
    const nextMonth = new Date(year, monthIndex + offset, 1);
    setMonth(nextMonth);
    setSelectedDay(dateKey(nextMonth));
  };
  const goToToday = () => {
    const today = new Date();
    setMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDay(dateKey(today));
  };

  return (
    <div className="card">
      {error ? (
        <p role="alert" className="text-sm text-red-700">Could not load the teaching schedule: {error}</p>
      ) : !events ? (
        <p role="status" className="text-sm text-ink-soft">Loading teaching schedule…</p>
      ) : (
        <div>
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button type="button" aria-label="Previous month" onClick={() => changeMonth(-1)} className="btn-ghost !px-2.5"><ChevronLeft size={18} /></button>
                <h3 className="min-w-36 text-center font-semibold text-ink">{monthLabel}</h3>
                <button type="button" aria-label="Next month" onClick={() => changeMonth(1)} className="btn-ghost !px-2.5"><ChevronRight size={18} /></button>
              </div>
              <div className="flex items-center gap-3">
                <Link to="/classes" className="text-xs font-semibold text-brand hover:underline">Full schedule</Link>
                <button type="button" onClick={goToToday} className="text-xs font-semibold text-brand hover:underline">Today</button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((weekday) => (
                <span key={weekday} className="py-2 text-center text-[10px] font-bold uppercase tracking-wide text-ink-soft">{weekday}</span>
              ))}
              {cells.map((date) => {
                const key = dateKey(date);
                const dayEvents = eventsByDay.get(key) ?? [];
                const inMonth = date.getMonth() === monthIndex;
                return (
                  <div
                    key={key}
                    className={`min-h-24 overflow-hidden rounded-xl border p-1 transition sm:min-h-32 sm:p-2 ${
                      key === selectedDay ? 'border-brand bg-brand/[0.04]' : 'border-line/70 bg-white'
                    } ${inMonth ? '' : 'opacity-50'}`}
                  >
                    <button
                      type="button"
                      aria-label={`${date.toLocaleDateString()}${dayEvents.length ? `, ${dayEvents.length} scheduled ${dayEvents.length === 1 ? 'session' : 'sessions'}` : ''}`}
                      aria-pressed={key === selectedDay}
                      onClick={() => setSelectedDay(key)}
                      className={`grid h-7 w-7 place-items-center rounded-full text-xs transition hover:bg-brand/10 ${
                        key === selectedDay ? 'bg-brand font-bold text-white hover:bg-brand' : inMonth ? 'text-ink' : 'text-slate-400'
                      }`}
                    >
                      {date.getDate()}
                    </button>
                    <div className="mt-1 space-y-1">
                      {dayEvents.slice(0, 2).map((event) => {
                        const details = [
                          timeLabel(event.date),
                          event.title,
                          event.lesson?.title,
                          event.cohort?.name,
                          event.teachingPlan,
                        ].filter(Boolean).join(' · ');
                        const entry = (
                          <>
                            <p className="truncate text-[9px] font-bold leading-tight text-brand sm:text-[10px]">
                              <span className="sm:hidden">{timeLabel(event.date)} </span>
                              <span className="hidden sm:inline">{timeLabel(event.date)} · </span>
                              {event.title}
                            </p>
                            {event.lesson && <p className="hidden truncate text-[9px] font-medium leading-tight text-ink sm:block">{event.lesson.title}</p>}
                            {event.cohort?.name && <p className="hidden truncate text-[9px] leading-tight text-ink-soft sm:block">{event.cohort.name}</p>}
                            {event.teachingPlan && <p className="hidden line-clamp-2 text-[9px] leading-tight text-ink-soft md:block">{event.teachingPlan}</p>}
                          </>
                        );
                        return event.lesson ? (
                          <Link
                            key={event.id}
                            to={`/lessons/${event.lesson.id}`}
                            aria-label={details}
                            title={details}
                            className="block rounded-md bg-brand/5 px-1 py-1 hover:bg-brand/10"
                          >
                            {entry}
                          </Link>
                        ) : (
                          <div key={event.id} title={details} className="rounded-md bg-brand/5 px-1 py-1">
                            {entry}
                          </div>
                        );
                      })}
                      {dayEvents.length > 2 && <p className="px-1 text-[9px] font-semibold text-ink-soft">+{dayEvents.length - 2} more</p>}
                    </div>
                  </div>
                );
              })}
            </div>
        </div>
      )}
    </div>
  );
}
