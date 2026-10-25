import { useRef, useState } from 'react';
import { useAuth } from '../lib/auth.jsx';
import { api } from '../lib/api.js';
import { errMsg } from '../lib/format.js';
import PdfPreview from './PdfPreview.jsx';
import { Notice, useFetch } from './ui.jsx';

const titleFromFilename = (filename) =>
  filename
    .replace(/\.pdf$/i, '')
    .replace(/^\d+[_\s-]*/, '')
    .replace(/[_\s-]+STUDENT$/i, '')
    .replace(/[_-]+/g, ' ')
    .trim() || filename;

export default function SharedLearningNotes({ canManage = false }) {
  const { user } = useAuth();
  const { data, error, reload } = useFetch('/materials/shared');
  const [files, setFiles] = useState([]);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [notice, setNotice] = useState('');
  const [actionError, setActionError] = useState('');
  const fileInput = useRef(null);

  const upload = async (e) => {
    e.preventDefault();
    const selectedFiles = files;
    const form = e.currentTarget;
    const failedFiles = [];
    const failures = [];
    let uploaded = 0;
    setUploading(true);
    setNotice('');
    setActionError('');

    for (const file of selectedFiles) {
      const body = new FormData();
      body.append('title', titleFromFilename(file.name));
      body.append('description', 'Shared learning note for all students.');
      body.append('file', file);
      try {
        await api.post('/materials', body);
        uploaded += 1;
      } catch (err) {
        failedFiles.push(file);
        failures.push(`${file.name}: ${errMsg(err)}`);
      }
    }

    setFiles(failedFiles);
    if (fileInput.current) fileInput.current.value = '';
    if (uploaded) reload();
    if (failures.length) {
      setNotice(`Uploaded ${uploaded} of ${selectedFiles.length} files. Select the remaining files again to retry.`);
      setActionError(failures.join(' '));
    } else {
      setNotice(`Uploaded ${uploaded} learning note${uploaded === 1 ? '' : 's'} for all students.`);
      form.reset();
    }
    setUploading(false);
  };

  const remove = async (material) => {
    if (!window.confirm(`Delete "${material.title}"?`)) return;
    setActionError('');
    try {
      await api.del(`/materials/${material.id}`);
      reload();
    } catch (err) {
      setActionError(errMsg(err));
    }
  };

  return (
    <section className="card mb-6">
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Shared learning notes</h2>
        <p className="text-sm text-ink-soft">Available to all students, regardless of course.</p>
      </div>
      {canManage && (
        <form className="mb-5 rounded-xl border border-line p-3" onSubmit={upload}>
          <label className="label" htmlFor="shared-learning-note-files">Add PDF notes for all students</label>
          <input
            ref={fileInput}
            id="shared-learning-note-files"
            className="input mb-3"
            type="file"
            accept=".pdf,application/pdf"
            multiple
            onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
          />
          {files.length > 0 && <p className="mb-3 text-sm text-ink-soft">{files.length} PDF file{files.length === 1 ? '' : 's'} selected.</p>}
          <button className="btn-primary" disabled={!files.length || uploading}>
            {uploading ? 'Uploading…' : 'Upload shared notes'}
          </button>
        </form>
      )}
      <Notice>{notice}</Notice>
      <Notice error>{error || actionError}</Notice>
      {!data && !error && <p className="text-sm text-ink-soft">Loading shared notes…</p>}
      {data?.length === 0 && <p className="text-sm text-ink-soft">No shared notes have been added yet.</p>}
      {data?.length > 0 && (
        <div className="space-y-3">
          {data.map((material) => {
            const isPdf = material.fileName?.toLowerCase().endsWith('.pdf');
            const canDelete = canManage && (user.role === 'ADMIN' || material.uploadedById === user.id);
            return (
              <div key={material.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line p-3">
                <div>
                  <p className="font-medium">{material.title}</p>
                  {material.description && <p className="text-sm text-ink-soft">{material.description}</p>}
                </div>
                <div className="flex items-center gap-3 text-sm">
                  {isPdf ? (
                    <button className="text-brand" onClick={() => setPreview(material)}>Read PDF</button>
                  ) : material.url ? (
                    <a className="text-brand" href={material.url} target="_blank" rel="noreferrer noopener">Open link</a>
                  ) : (
                    <a className="text-brand" href={`/api/materials/${material.id}/file`}>Download</a>
                  )}
                  {canDelete && <button className="text-red-600" onClick={() => remove(material)}>Delete</button>}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {preview && (
        <PdfPreview material={preview} onClose={() => setPreview(null)} />
      )}
    </section>
  );
}
