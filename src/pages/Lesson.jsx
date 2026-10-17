import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { Loading, PageHeader } from '../components/ui.jsx';
import Markdown from '../components/Markdown.jsx';

const ytId = (u) => {
  try {
    const x = new URL(u);
    if (x.hostname === 'youtu.be') return x.pathname.slice(1);
    if (/(^|\.)youtube\.com$/.test(x.hostname)) return x.searchParams.get('v');
  } catch { /* not a url */ }
  return null;
};

export default function Lesson() {
  const { id } = useParams();
  const { user } = useAuth();
  const [lesson, setLesson] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => { api.get(`/lessons/${id}`).then(setLesson).catch((e) => setError(e.message)); }, [id]);
  const toggle = async () => {
    if (lesson.completed) await api.del(`/lessons/${id}/complete`);
    else await api.post(`/lessons/${id}/complete`);
    setLesson({ ...lesson, completed: !lesson.completed });
  };

  if (!lesson) return <Loading error={error} />;
  return (
    <>
      <Link to={user.role === 'STUDENT' ? '/learning' : '/courses'} className="text-sm text-brand">← Back</Link>
      <PageHeader title={lesson.title}>
        {user.role === 'STUDENT' && <button className={lesson.completed ? 'btn-ghost' : 'btn-primary'} onClick={toggle}>{lesson.completed ? 'Completed ✓ (undo)' : 'Mark as complete'}</button>}
      </PageHeader>
      <p className="mb-4 text-sm text-ink-soft">{lesson.module.title}{lesson.summary ? ` · ${lesson.summary}` : ''}</p>
      <article className="card">{lesson.content ? <Markdown>{lesson.content}</Markdown> : <p className="text-ink-soft">No notes have been added to this lesson yet.</p>}</article>
      {lesson.materials?.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-3 text-lg font-semibold">Lesson resources</h2>
          <div className="space-y-3">
            {lesson.materials.map((m) => {
              const yt = m.url && ytId(m.url);
              return (
                <div key={m.id} className="card">
                  <p className="mb-2 font-medium">{m.title}</p>
                  {yt && <div className="mb-2 aspect-video overflow-hidden rounded"><iframe className="h-full w-full" src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(yt)}`} title={m.title} allowFullScreen referrerPolicy="strict-origin-when-cross-origin" /></div>}
                  {m.url
                    ? <a className="text-brand underline" href={m.url} target="_blank" rel="noreferrer noopener">Open link</a>
                    : <a className="text-brand underline" href={`/api/materials/${m.id}/file`}>Download {m.fileName}</a>}
                </div>
              );
            })}
          </div>
        </section>
      )}
    </>
  );
}
