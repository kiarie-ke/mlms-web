import { useRef, useState } from 'react';
import { Bold, Code, Code2, Heading2, Image as ImageIcon, Italic, Link2, List, ListOrdered, Quote } from 'lucide-react';
import Markdown from './Markdown.jsx';
import { errMsg } from '../lib/format.js';

async function uploadImage(file) {
  const fd = new FormData();
  fd.append('file', file);
  const res = await fetch('/api/materials/image', { method: 'POST', body: fd, credentials: 'include' });
  const d = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(Array.isArray(d.message) ? d.message.join(', ') : d.message || res.statusText);
  return d.url;
}

// Markdown editor with a toolbar, live preview and image upload.
export default function RichEditor({ value, onChange, rows = 12 }) {
  const ta = useRef(null);
  const file = useRef(null);
  const [tab, setTab] = useState('write');
  const [err, setErr] = useState('');

  const edit = (fn) => {
    const el = ta.current;
    const [s, e] = [el.selectionStart, el.selectionEnd];
    const { text, from, to } = fn(value.slice(0, s), value.slice(s, e), value.slice(e));
    onChange(text);
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(from, to); });
  };
  const wrap = (a, b = a, ph = 'text') => () => edit((pre, sel, post) => {
    const mid = sel || ph;
    return { text: pre + a + mid + b + post, from: pre.length + a.length, to: pre.length + a.length + mid.length };
  });
  const linePrefix = (prefix, ph) => () => edit((pre, sel, post) => {
    const lead = pre && !pre.endsWith('\n') ? '\n' : '';
    const body = (sel || ph).split('\n').map((l, i) => (prefix === '1. ' ? `${i + 1}. ` : prefix) + l).join('\n');
    return { text: pre + lead + body + post, from: pre.length + lead.length, to: pre.length + lead.length + body.length };
  });
  const codeBlock = () => edit((pre, sel, post) => {
    const lead = pre && !pre.endsWith('\n') ? '\n' : '';
    const body = sel || 'code here';
    const head = `${lead}\`\`\`js\n`;
    return { text: `${pre}${head}${body}\n\`\`\`\n${post}`, from: pre.length + head.length, to: pre.length + head.length + body.length };
  });
  const link = () => edit((pre, sel, post) => {
    const label = sel || 'link text';
    return { text: `${pre}[${label}](https://)${post}`, from: pre.length + label.length + 3, to: pre.length + label.length + 11 };
  });
  const onImage = async (e) => {
    const f = e.target.files[0];
    e.target.value = '';
    if (!f) return;
    setErr('');
    try {
      const url = await uploadImage(f);
      edit((pre, _sel, post) => {
        const md = `\n![${f.name.replace(/\.[^.]+$/, '')}](${url})\n`;
        return { text: pre + md + post, from: pre.length + md.length, to: pre.length + md.length };
      });
    } catch (x) { setErr(errMsg(x)); }
  };

  const tools = [
    [Heading2, 'Heading', wrap('## ', '', 'Heading')], [Bold, 'Bold', wrap('**')], [Italic, 'Italic', wrap('*')],
    [Code, 'Inline code', wrap('`', '`', 'code')], [Code2, 'Code block', codeBlock],
    [List, 'Bullet list', linePrefix('- ', 'item')], [ListOrdered, 'Numbered list', linePrefix('1. ', 'item')],
    [Quote, 'Quote', linePrefix('> ', 'quote')], [Link2, 'Link', link],
  ];
  return (
    <div className="mb-3">
      <div className="mb-1 flex flex-wrap items-center gap-1">
        {tab === 'write' && tools.map(([Icon, label, fn]) => (
          <button key={label} type="button" title={label} aria-label={label} onClick={fn} className="rounded-sm p-1.5 text-ink-soft hover:bg-offwhite hover:text-brand"><Icon size={16} /></button>
        ))}
        {tab === 'write' && (
          <>
            <button type="button" title="Upload image" aria-label="Upload image" onClick={() => file.current.click()} className="rounded-sm p-1.5 text-ink-soft hover:bg-offwhite hover:text-brand"><ImageIcon size={16} /></button>
            <input ref={file} type="file" accept="image/png,image/jpeg,image/gif,image/webp" hidden onChange={onImage} />
          </>
        )}
        <div className="ml-auto flex gap-1 text-sm">
          {['write', 'preview'].map((t) => <button key={t} type="button" onClick={() => setTab(t)} className={`rounded-sm px-2 py-1 capitalize ${tab === t ? 'bg-brand/10 text-brand' : 'text-ink-soft'}`}>{t}</button>)}
        </div>
      </div>
      {tab === 'write'
        ? <textarea ref={ta} className="input font-mono text-sm" rows={rows} value={value} onChange={(e) => onChange(e.target.value)} placeholder="Write lesson notes in Markdown. Use the toolbar for headings, code and images." />
        : <div className="min-h-[10rem] rounded border border-line p-3">{value.trim() ? <Markdown>{value}</Markdown> : <p className="text-sm text-ink-soft">Nothing to preview.</p>}</div>}
      {err && <p className="mt-1 text-sm text-red-600">{err}</p>}
    </div>
  );
}
