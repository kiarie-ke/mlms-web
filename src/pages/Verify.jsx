import { Link, useParams } from 'react-router-dom';
import { Loading, useFetch } from '../components/ui.jsx';
import { fmtDate } from '../lib/format.js';

export default function Verify() {
  const { code } = useParams();
  const { data, error } = useFetch(`/certificates/verify/${encodeURIComponent(code)}`);
  return (
    <div className="grid min-h-screen place-items-center bg-navy p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 text-center shadow-lg">
        <h1 className="mb-4 text-xl font-bold">Certificate verification</h1>
        {!data ? <Loading error={error} /> : data.valid ? (
          <>
            <p className="font-display text-2xl font-bold text-emerald">Valid certificate</p>
            <p className="mt-3">{data.name}</p>
            <p className="text-sm text-ink-soft">{data.course}</p>
            <p className="text-sm text-ink-soft">Issued {fmtDate(data.issuedAt)} · {data.code}</p>
          </>
        ) : <p className="font-display text-xl font-bold text-red-600">No certificate found for this code.</p>}
        <Link to="/" className="mt-6 inline-block text-sm text-brand">Go to MODARA LMS</Link>
      </div>
    </div>
  );
}
