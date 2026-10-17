import { Link } from 'react-router-dom';
import { Bar, Loading, PageHeader, useFetch } from '../components/ui.jsx';

export default function Learning() {
  const { data, error } = useFetch('/learning');
  if (!data) return <Loading error={error} />;
  if (!data.course) return <p className="text-ink-soft">You have not been placed in a cohort yet.</p>;
  return (
    <>
      <PageHeader title="My learning" />
      <div className="card mb-6">
        <div className="mb-2 flex justify-between"><p className="font-semibold">{data.course.title}</p><p className="font-display font-bold text-brand">{data.percent}%</p></div>
        <Bar percent={data.percent} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {data.modules.map((m) => (
          <div key={m.id} className="card">
            <div className="mb-2 flex justify-between"><h3 className="font-semibold">{m.title}</h3><span className="text-sm text-ink-soft">{m.percent}%</span></div>
            <Bar percent={m.percent} />
            <ul className="mt-3 space-y-1.5">
              {m.lessons.map((l) => (
                <li key={l.id} className="flex items-center gap-2 text-sm">
                  <span className={l.completed ? 'text-emerald' : 'text-line'}>●</span>
                  <Link className="hover:underline" to={`/lessons/${l.id}`}>{l.title}</Link>
                </li>
              ))}
              {!m.lessons.length && <li className="text-sm text-ink-soft">Lessons coming soon.</li>}
            </ul>
          </div>
        ))}
      </div>
    </>
  );
}
