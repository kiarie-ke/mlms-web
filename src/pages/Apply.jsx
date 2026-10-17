import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { Field, Notice, TextArea } from '../components/ui.jsx';
import { errMsg } from '../lib/format.js';

export default function Apply() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', course: 'Junior Software Development', message: '' });
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const body = { ...form };
      if (!body.phone) delete body.phone;
      if (!body.message) delete body.message;
      await api.post('/admissions/apply', body);
      setDone(true);
    } catch (err) {
      setError(errMsg(err));
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-navy p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
        <img src="/logo.png" alt="MODARA" className="mb-4 h-12 w-12 rounded-sm" />
        <h1 className="text-2xl font-bold">Apply to MODARA</h1>
        {done ? (
          <>
            <p className="my-6 text-sm">Thanks! We received your application and will contact you soon.</p>
            <Link to="/" className="btn-primary w-full">Back to sign in</Link>
          </>
        ) : (
          <form onSubmit={submit} className="mt-4">
            <Field label="Full name" value={form.name} onChange={set('name')} required />
            <Field label="Email" type="email" value={form.email} onChange={set('email')} required />
            <Field label="Phone" value={form.phone} onChange={set('phone')} />
            <Field label="Course" value={form.course} onChange={set('course')} required />
            <TextArea label="Anything we should know?" rows="3" value={form.message} onChange={set('message')} />
            <Notice error>{error}</Notice>
            <button className="btn-primary w-full">Submit application</button>
            <p className="mt-4 text-center text-sm"><Link to="/" className="text-brand">Back to sign in</Link></p>
          </form>
        )}
      </div>
    </div>
  );
}
