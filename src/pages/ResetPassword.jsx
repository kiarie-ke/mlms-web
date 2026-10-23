import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Field, Notice } from '../components/ui.jsx';
import { api } from '../lib/api.js';
import { errMsg } from '../lib/format.js';

export default function ResetPassword() {
  const { token: routeToken } = useParams();
  const [searchParams] = useSearchParams();
  const token = routeToken ?? searchParams.get('token') ?? '';
  const [email, setEmail] = useState('');
  const [requestMessage, setRequestMessage] = useState({ text: '', error: false });
  const [requestBusy, setRequestBusy] = useState(false);
  const [requestComplete, setRequestComplete] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState({ text: '', error: false });
  const [busy, setBusy] = useState(false);
  const [complete, setComplete] = useState(false);

  const requestReset = async (event) => {
    event.preventDefault();
    setRequestBusy(true);
    setRequestMessage({ text: '', error: false });
    try {
      await api.post('/auth/reset-request', { email });
      setRequestComplete(true);
    } catch (err) {
      setRequestMessage({ text: errMsg(err), error: true });
    } finally {
      setRequestBusy(false);
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!token) {
      setMessage({ text: 'This reset link is missing its token. Ask an administrator for a new link.', error: true });
      return;
    }
    if (password !== confirm) {
      setMessage({ text: 'The passwords do not match.', error: true });
      return;
    }
    setBusy(true);
    setMessage({ text: '', error: false });
    try {
      await api.post('/auth/password/reset', { token, password });
      setComplete(true);
    } catch (err) {
      setMessage({ text: errMsg(err), error: true });
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 p-4">
      <section className="card w-full max-w-md">
        <img src="/logo.png" alt="MODARA" className="mb-5 h-12 w-12 rounded-xl" />
        <h1 className="font-display text-2xl font-bold text-ink">
          {token ? 'Set your password' : 'Reset your password'}
        </h1>
        {token && complete ? (
          <>
            <p className="mt-3 text-sm text-ink-soft">Your password has been updated. You can now sign in.</p>
            <Link to="/login" className="btn-primary mt-6 block text-center">Go to sign in</Link>
          </>
        ) : token ? (
          <form className="mt-5" onSubmit={submit}>
            <Field label="New password (at least 8 characters)" type="password" autoComplete="new-password" minLength={8} maxLength={128} required value={password} onChange={(event) => setPassword(event.target.value)} />
            <Field label="Confirm new password" type="password" autoComplete="new-password" minLength={8} maxLength={128} required value={confirm} onChange={(event) => setConfirm(event.target.value)} />
            <Notice error={message.error}>{message.text}</Notice>
            <button className="btn-primary mt-3 w-full" disabled={busy}>{busy ? 'Updating password...' : 'Update password'}</button>
            <p className="mt-4 text-center text-sm text-ink-soft"><Link to="/login" className="text-brand">Back to sign in</Link></p>
          </form>
        ) : requestComplete ? (
          <>
            <p className="mt-3 text-sm text-ink-soft">
              If an account matches that email, a reset link will arrive shortly.
            </p>
            <Link to="/login" className="btn-primary mt-6 block text-center">Back to sign in</Link>
          </>
        ) : (
          <form className="mt-5" onSubmit={requestReset}>
            <p className="mb-4 text-sm text-ink-soft">
              Enter your email address and we’ll send a password reset link if an account matches.
            </p>
            <Field
              label="Email address"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <Notice error={requestMessage.error}>{requestMessage.text}</Notice>
            <button className="btn-primary mt-3 w-full" disabled={requestBusy}>
              {requestBusy ? 'Sending link...' : 'Send reset link'}
            </button>
            <p className="mt-4 text-center text-sm text-ink-soft">
              <Link to="/login" className="text-brand">Back to sign in</Link>
            </p>
          </form>
        )}
      </section>
    </main>
  );
}
