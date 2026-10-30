import { useState } from 'react';
import { useConfirm } from '../providers/ConfirmProvider.jsx';
import { useAuth } from '../lib/auth.jsx';
import { api } from '../lib/api.js';
import {
  Badge,
  Field,
  Loading,
  Modal,
  Notice,
  PageHeader,
  Select,
  Table,
  TextArea,
  useFetch,
} from '../components/ui.jsx';
import { errMsg, fmtDate } from '../lib/format.js';

function Review({ id }) {
  const { data, error } = useFetch(`/quizzes/${id}/attempt`);
  if (!data) return <Loading error={error} />;
  return (
    <div className="max-h-[65vh] space-y-4 overflow-y-auto">
      <p className="font-display text-3xl font-bold text-brand">
        {data.score}/{data.total}
      </p>
      {data.questions.map((q, i) => (
        <fieldset key={i} className="rounded-sm border border-line p-3">
          <legend className="font-medium">
            {i + 1}. {q.text}
          </legend>
          {q.options.map((option, j) => (
            <p
              key={j}
              className={`py-0.5 text-sm ${j === q.answer ? 'font-semibold text-green-700' : ''}`}
            >
              {option}
              {j === q.answer && ' — Correct answer'}
              {j === q.selected && ' — Your answer'}
            </p>
          ))}
        </fieldset>
      ))}
    </div>
  );
}

function Take({ id, onClose }) {
  const { data, error } = useFetch(`/quizzes/${id}`);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [msg, setMsg] = useState('');
  const submit = async () => {
    try {
      setResult(
        await api.post(`/quizzes/${id}/attempt`, {
          answers: data.questions.map((_, i) => answers[i] ?? -1),
        }),
      );
    } catch (err) {
      setMsg(errMsg(err));
    }
  };
  return (
    <Modal title={data?.title ?? 'Quiz'} onClose={onClose}>
      {!data ? (
        <Loading error={error} />
      ) : result ? (
        <div>
          {data.reviewEnabled ? (
            <Review id={id} />
          ) : (
            <>
              <p className="font-display text-3xl font-bold text-brand">
                {result.score}/{result.total}
              </p>
              <p className="mt-3 text-sm text-ink-soft">Your attempt has been recorded.</p>
            </>
          )}
          <button className="btn-primary mt-4 w-full" onClick={onClose}>
            Close
          </button>
        </div>
      ) : (
        <div className="max-h-[65vh] space-y-4 overflow-y-auto">
          <p className="text-sm text-ink-soft">You can attempt this quiz only once.</p>
          {data.questions.map((q, i) => (
            <fieldset key={i}>
              <legend className="mb-1 font-medium">
                {i + 1}. {q.text}
              </legend>
              {q.options.map((o, j) => (
                <label key={j} className="flex items-center gap-2 py-0.5 text-sm">
                  <input
                    type="radio"
                    name={`q${i}`}
                    checked={answers[i] === j}
                    onChange={() => setAnswers({ ...answers, [i]: j })}
                  />{' '}
                  {o}
                </label>
              ))}
            </fieldset>
          ))}
          <Notice error>{msg}</Notice>
          <button className="btn-primary w-full" onClick={submit}>
            Submit answers
          </button>
        </div>
      )}
    </Modal>
  );
}

const blank = () => ({ text: '', options: ['', '', '', ''], answer: 0 });

function Builder({ cohorts, onClose, onSaved }) {
  const [form, setForm] = useState({
    title: '',
    cohortId: '',
    description: '',
    reviewEnabled: false,
  });
  const [qs, setQs] = useState([blank()]);
  const [msg, setMsg] = useState('');
  const setQ = (i, patch) => setQs(qs.map((q, k) => (k === i ? { ...q, ...patch } : q)));
  const save = async (e) => {
    e.preventDefault();
    try {
      const questions = qs.map((q) => ({
        ...q,
        options: q.options.map((o) => o.trim()).filter(Boolean),
      }));
      await api.post('/quizzes', { ...form, published: true, questions });
      onSaved();
    } catch (err) {
      setMsg(errMsg(err));
    }
  };
  return (
    <Modal title="New quiz" onClose={onClose}>
      <form onSubmit={save} className="max-h-[70vh] overflow-y-auto pr-1">
        <Select
          label="Cohort"
          required
          value={form.cohortId}
          onChange={(e) => setForm({ ...form, cohortId: e.target.value })}
        >
          <option value="">Select…</option>
          {cohorts?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
        <Field
          label="Title"
          required
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
        <TextArea
          label="Description"
          rows="2"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <label className="mb-3 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.reviewEnabled}
            onChange={(e) => setForm({ ...form, reviewEnabled: e.target.checked })}
          />
          Allow students to review correct answers after submission
        </label>
        {qs.map((q, i) => (
          <div key={i} className="mb-3 rounded-sm border border-line p-3">
            <Field
              label={`Question ${i + 1}`}
              required
              value={q.text}
              onChange={(e) => setQ(i, { text: e.target.value })}
            />
            {q.options.map((o, j) => (
              <div key={j} className="mb-1 flex items-center gap-2">
                <input
                  type="radio"
                  name={`ans${i}`}
                  title="Correct answer"
                  checked={q.answer === j}
                  onChange={() => setQ(i, { answer: j })}
                />
                <input
                  className="input"
                  placeholder={`Option ${j + 1}`}
                  value={o}
                  onChange={(e) =>
                    setQ(i, { options: q.options.map((x, k) => (k === j ? e.target.value : x)) })
                  }
                />
              </div>
            ))}
            <p className="text-xs text-ink-soft">Select the radio next to the correct option.</p>
            {qs.length > 1 && (
              <button
                type="button"
                className="mt-1 text-sm text-red-600"
                onClick={() => setQs(qs.filter((_, k) => k !== i))}
              >
                Remove question
              </button>
            )}
          </div>
        ))}
        <button type="button" className="btn-ghost mb-3" onClick={() => setQs([...qs, blank()])}>
          + Add question
        </button>
        <Notice error>{msg}</Notice>
        <button className="btn-primary w-full">Publish quiz</button>
      </form>
    </Modal>
  );
}

export default function Quizzes() {
  const { user } = useAuth();
  const confirm = useConfirm();
  const staff = user.role !== 'STUDENT';
  const { data, error, reload } = useFetch('/quizzes');
  const cohorts = useFetch(staff ? '/cohorts' : null);
  const [taking, setTaking] = useState(null);
  const [building, setBuilding] = useState(false);
  const [attempts, setAttempts] = useState(null);
  const [reviewing, setReviewing] = useState(null);

  const showAttempts = async (q) =>
    setAttempts({ quiz: q, rows: await api.get(`/quizzes/${q.id}/attempts`) });
  const remove = async (q) => {
    if (!await confirm({
      title: 'Delete quiz?',
      message: `Delete this quiz "${q.title}" and its results?`,
      confirmText: 'Delete',
      variant: 'danger',
    })) return;
    await api.del(`/quizzes/${q.id}`);
    reload();
  };

  if (!data) return <Loading error={error} />;
  return (
    <>
      <PageHeader title={staff ? 'Quizzes & exams' : 'Quizzes'}>
        {staff && (
          <button className="btn-primary" onClick={() => setBuilding(true)}>
            New quiz
          </button>
        )}
      </PageHeader>
      <Table
        rows={data}
        columns={[
          {
            header: 'Quiz',
            cell: (q) => (
              <>
                <p className="font-medium">{q.title}</p>
                <p className="text-xs text-ink-soft">{q.description}</p>
              </>
            ),
          },
          { header: 'Questions', cell: (q) => q.questionCount },
          staff
            ? { header: 'Attempts', cell: (q) => q._count?.attempts ?? 0 }
            : {
                header: 'Result',
                cell: (q) =>
                  q.attempt ? (
                    <Badge>{`${q.attempt.score}/${q.attempt.total}`}</Badge>
                  ) : (
                    <Badge>Not taken</Badge>
                  ),
              },
          { header: 'Created', cell: (q) => fmtDate(q.createdAt) },
          {
            header: 'Actions',
            cell: (q) =>
              staff ? (
                <div className="flex gap-3 text-sm">
                  <button className="text-brand" onClick={() => showAttempts(q)}>
                    Results
                  </button>
                  <button className="text-red-600" onClick={() => remove(q)}>
                    Delete
                  </button>
                </div>
              ) : q.attempt ? (
                q.reviewEnabled && (
                  <button className="text-brand" onClick={() => setReviewing(q.id)}>
                    Review
                  </button>
                )
              ) : (
                <button className="btn-primary" onClick={() => setTaking(q.id)}>
                  Take quiz
                </button>
              ),
          },
        ]}
      />
      {taking && (
        <Take
          id={taking}
          onClose={() => {
            setTaking(null);
            reload();
          }}
        />
      )}
      {reviewing && (
        <Modal title="Quiz review" onClose={() => setReviewing(null)}>
          <Review id={reviewing} />
        </Modal>
      )}
      {building && (
        <Builder
          cohorts={cohorts.data}
          onClose={() => setBuilding(false)}
          onSaved={() => {
            setBuilding(false);
            reload();
          }}
        />
      )}
      {attempts && (
        <Modal title={`Results: ${attempts.quiz.title}`} onClose={() => setAttempts(null)}>
          <Table
            rows={attempts.rows}
            columns={[
              { header: 'Student', cell: (a) => a.student?.user?.name ?? a.student ?? '—' },
              { header: 'Score', cell: (a) => `${a.score}/${a.total}` },
            ]}
          />
        </Modal>
      )}
    </>
  );
}
