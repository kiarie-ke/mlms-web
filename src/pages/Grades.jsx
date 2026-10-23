import { Badge, Loading, PageHeader, Stat, Table, useFetch } from '../components/ui.jsx';
import { fmtDate } from '../lib/format.js';
import { useAuth } from '../lib/auth.jsx';

export default function Grades() {
  const { user } = useAuth();
  const { data, error } = useFetch('/grades');
  if (!data) return <Loading error={error} />;
  return (
    <>
      <PageHeader title="Grades" />
      {user.role === 'STUDENT' ? (
        <section className="mb-6">
          <h2 className="mb-3 text-lg font-semibold">Overall course grades</h2>
          <Table
            rows={data.courseGrades ?? []}
            columns={[
              { header: 'Course', cell: (grade) => grade.course },
              {
                header: 'Assignments',
                cell: (grade) =>
                  `${grade.assignmentAverage ?? '—'}${grade.assignmentAverage == null ? '' : `% (${grade.assignmentWeight}% weight)`}`,
              },
              {
                header: 'Quizzes',
                cell: (grade) =>
                  `${grade.quizAverage ?? '—'}${grade.quizAverage == null ? '' : `% (${grade.quizWeight}% weight)`}`,
              },
              {
                header: 'Overall',
                cell: (grade) => (grade.overall == null ? '—' : `${grade.overall}%`),
              },
            ]}
            empty="No course grade is available yet."
          />
          <p className="mt-2 text-xs text-ink-soft">
            Only categories with graded work contribute until both have scores.
          </p>
        </section>
      ) : (
        <div className="mb-6 max-w-xs">
          <Stat label="Average" value={data.average != null ? `${data.average}%` : '—'} />
        </div>
      )}
      <Table
        rows={data.rows}
        columns={[
          ...(data.rows.some((r) => r.student)
            ? [{ header: 'Student', cell: (r) => r.student }]
            : []),
          { header: 'Type', cell: (r) => <Badge>{r.kind}</Badge> },
          { header: 'Title', cell: (r) => r.title },
          { header: 'Score', cell: (r) => `${r.score}/${r.max}` },
          { header: 'Feedback', cell: (r) => r.feedback || '—' },
          { header: 'Date', cell: (r) => fmtDate(r.date) },
        ]}
      />
    </>
  );
}
