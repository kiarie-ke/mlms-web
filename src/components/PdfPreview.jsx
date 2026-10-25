import { Modal } from './ui.jsx';

export default function PdfPreview({ material, onClose }) {
  return (
    <Modal wide title={material.title} onClose={onClose}>
      <iframe
        className="h-[70vh] w-full rounded border border-line"
        src={`/api/materials/${material.id}/preview`}
        title={`PDF preview: ${material.title}`}
      />
      <a className="mt-3 inline-block text-sm text-brand" href={`/api/materials/${material.id}/file`}>Download PDF</a>
    </Modal>
  );
}
