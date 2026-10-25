import { useEffect, useState } from 'react';
import { Modal } from './ui.jsx';

export default function PdfPreview({ material, onClose }) {
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    let objectUrl;

    setPdfUrl(null);
    setLoading(true);
    setError(false);

    const loadPdf = async () => {
      try {
        const response = await fetch(`/api/materials/${material.id}/preview`, {
          credentials: 'include',
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(`PDF request failed with status ${response.status}`);

        const pdf = await response.blob();
        if (controller.signal.aborted) return;
        objectUrl = URL.createObjectURL(pdf);
        setPdfUrl(objectUrl);
      } catch {
        if (!controller.signal.aborted) setError(true);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    loadPdf();
    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [material.id]);

  return (
    <Modal wide title={material.title} onClose={onClose}>
      {loading && <p role="status" className="py-8 text-center text-ink-soft">Loading PDF preview…</p>}
      {error && <p role="alert" className="py-8 text-center text-red-600">Unable to load the PDF preview. Use the download link below to open the PDF.</p>}
      {pdfUrl && (
        <>
          <iframe
            className="hidden h-[70vh] w-full rounded border border-line md:block"
            src={pdfUrl}
            title={`PDF preview: ${material.title}`}
          />
          <div className="py-4 text-center md:hidden">
            <p className="mb-3 text-sm text-ink-soft">Open the PDF in your phone’s PDF viewer for the best experience.</p>
            <a className="btn-primary inline-flex justify-center" href={pdfUrl} target="_blank" rel="noreferrer noopener">
              Open PDF
            </a>
          </div>
        </>
      )}
      <a className="mt-3 inline-block text-sm text-brand" href={`/api/materials/${material.id}/file`}>Download PDF</a>
    </Modal>
  );
}
