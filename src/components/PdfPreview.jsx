import { useEffect, useState } from 'react';
import { Modal, Notice } from './ui.jsx';

export default function PdfPreview({ material, onClose }) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    let objectUrl;
    setUrl('');
    setError('');
    setLoading(true);

    const load = async () => {
      let response = await fetch(`/api/materials/${material.id}/preview`, { credentials: 'include' });
      if (response.status === 401) {
        const refresh = await fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' });
        if (refresh.ok) {
          response = await fetch(`/api/materials/${material.id}/preview`, { credentials: 'include' });
        }
      }
      if (!response.ok) {
        const details = await response.json().catch(() => ({}));
        const message = Array.isArray(details.message) ? details.message.join(', ') : details.message;
        throw new Error(message || `Could not load PDF (${response.status}).`);
      }
      if (!response.headers.get('content-type')?.includes('application/pdf')) {
        throw new Error('The server did not return a PDF file.');
      }
      objectUrl = URL.createObjectURL(await response.blob());
      if (active) setUrl(objectUrl);
      else URL.revokeObjectURL(objectUrl);
    };

    load()
      .catch((err) => active && setError(err.message))
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [material.id]);

  return (
    <Modal wide title={material.title} onClose={onClose}>
      {loading && <p className="mb-3 text-sm text-ink-soft">Loading PDF…</p>}
      <Notice error>{error}</Notice>
      {url && (
        <iframe
          className="h-[70vh] w-full rounded border border-line"
          src={url}
          title={`PDF preview: ${material.title}`}
        />
      )}
      <a className="mt-3 inline-block text-sm text-brand" href={`/api/materials/${material.id}/file`}>Download PDF</a>
    </Modal>
  );
}
