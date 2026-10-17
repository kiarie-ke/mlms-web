import { useState } from 'react';
import { ArrowRight, BookOpen, Code2, GraduationCap, Sparkles } from 'lucide-react';
import { useAuth } from '../lib/auth.jsx';
import { Field } from '../components/ui.jsx';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await login(email, password);
    } catch (err) {
      setError(err.status === 401 ? 'Wrong email or password. Try again.' : err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-white md:grid md:h-screen md:min-h-0 md:grid-cols-[0.95fr_1.05fr] md:overflow-hidden">
      <aside className="relative hidden min-h-screen flex-col overflow-hidden bg-gradient-to-br from-navy via-[#0B1C32] to-[#123A64] px-8 py-5 text-white md:flex md:h-screen md:min-h-0 xl:px-12">
        <img src="/images/login-classroom.jpg" alt="" className="absolute inset-0 h-full w-full object-cover object-center" />
        <div className="pointer-events-none absolute inset-0 bg-black/50" />
        <div className="pointer-events-none absolute -right-32 -top-20 h-96 w-96 rounded-full border-[54px] border-white/[0.035]" />
        <div className="pointer-events-none absolute -bottom-44 -left-36 h-[28rem] w-[28rem] rounded-full bg-brand/20 blur-3xl" />
        <div className="relative flex items-center gap-3">
          <img src="/logo.png" alt="" className="h-12 w-12 rounded-xl bg-white p-1 shadow-lg" />
          <div>
            <p className="font-display text-lg font-bold tracking-wide">MODARA</p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">Learning portal</p>
          </div>
        </div>

        <div className="relative my-auto max-w-xl py-6">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan/25 bg-cyan/10 px-3.5 py-2 text-xs font-semibold text-cyan">
            <Sparkles size={15} /> A place to learn and create
          </p>
          <h2 className="font-display text-3xl font-bold leading-tight tracking-tight xl:text-4xl">
            Courses, assignments, and grades in <span className="text-cyan">one place.</span>
          </h2>

          <div className="mt-6 space-y-2">
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.08] p-3 backdrop-blur">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-cyan/15 text-cyan"><BookOpen size={19} /></span>
              <div><p className="text-sm font-semibold">Learn at your pace</p><p className="mt-1 text-xs text-white/80">Lessons, materials, and progress in one place</p></div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.08] p-3 backdrop-blur">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand/25 text-blue-200"><Code2 size={19} /></span>
              <div><p className="text-sm font-semibold">Practice by building</p><p className="mt-1 text-xs text-white/80">Turn what you learn into working projects</p></div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.08] p-3 backdrop-blur">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-amber/15 text-amber"><GraduationCap size={19} /></span>
              <div><p className="text-sm font-semibold">Grow with guidance</p><p className="mt-1 text-xs text-white/80">Stay connected with your learning community</p></div>
            </div>
          </div>
        </div>

        <p className="relative text-xs text-white/80">Learn something today. Build something tomorrow.</p>
      </aside>

      <main className="flex min-h-screen flex-col px-6 pt-6 pb-6 sm:px-12 md:h-screen md:min-h-0 md:justify-center md:overflow-y-auto md:px-14 md:py-6 xl:px-20">
        <div className="mb-6 flex flex-col items-center gap-2 text-center md:hidden">
          <img src="/logo.png" alt="" className="h-11 w-11 rounded-xl bg-white shadow-sm ring-1 ring-line" />
          <div>
            <p className="font-display text-base font-bold tracking-wide text-ink">MODARA</p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-soft">Learning portal</p>
          </div>
        </div>
        <div className="mx-auto w-full max-w-md md:my-auto">
          <div className="mb-6 text-center md:mb-7">
            <div className="mx-auto mb-5 hidden h-14 w-14 place-items-center rounded-2xl bg-brand/10 text-brand md:grid">
              <GraduationCap size={28} strokeWidth={1.8} />
            </div>
            <h1 className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">Welcome back</h1>
            <p className="mt-2 text-sm leading-6 text-ink-soft">Sign in to continue to your learning portal.</p>
          </div>

          <form onSubmit={submit} className="space-y-1 [&_input]:text-base [&_label]:text-sm">
            <Field label="Email address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus autoComplete="username" placeholder="you@example.com" />
            <Field label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" placeholder="Enter your password" />
            <p className="mb-4 -mt-1 text-right text-xs text-ink-soft">Need help signing in? Contact your administrator to reset your password.</p>
            {error && <p role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
            <button className="btn-primary mt-2 min-h-[44px] w-full justify-center gap-2 px-5 py-3" disabled={busy}>
              <span>{busy ? 'Signing in...' : 'Sign in'}</span>
              {!busy && <ArrowRight size={17} />}
            </button>
          </form>

          <div className="mt-6">
            <p className="mb-3 text-center text-sm text-ink-soft">New to MODARA?</p>
            <a href="https://modarainstitute.co.ke/apply" className="flex min-h-[44px] w-full items-center justify-center rounded-xl border border-brand px-4 py-3 text-sm font-semibold text-brand transition hover:bg-brand/5">
              Apply to join
            </a>
          </div>
          <p className="mt-8 text-center text-xs text-slate-500">A supportive space to learn, practice, and grow.</p>
        </div>
      </main>
    </div>
  );
}
