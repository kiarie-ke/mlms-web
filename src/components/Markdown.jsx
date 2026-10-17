import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';

// Raw HTML in notes is not rendered (react-markdown default), so content cannot inject scripts.
const components = {
  a: ({ node, ...p }) => <a {...p} target="_blank" rel="noreferrer noopener" className="text-brand underline" />,
  img: ({ node, ...p }) => <img {...p} loading="lazy" className="my-3 max-w-full rounded" />,
  h1: ({ node, ...p }) => <h2 {...p} className="mb-3 mt-6 font-display text-2xl font-bold" />,
  h2: ({ node, ...p }) => <h2 {...p} className="mb-2 mt-6 font-display text-xl font-bold" />,
  h3: ({ node, ...p }) => <h3 {...p} className="mb-2 mt-4 font-display text-lg font-semibold" />,
  p: ({ node, ...p }) => <p {...p} className="my-3 leading-relaxed" />,
  ul: ({ node, ...p }) => <ul {...p} className="my-3 list-disc space-y-1 pl-6" />,
  ol: ({ node, ...p }) => <ol {...p} className="my-3 list-decimal space-y-1 pl-6" />,
  blockquote: ({ node, ...p }) => <blockquote {...p} className="my-3 border-l-4 border-brand pl-4 text-ink-soft" />,
  pre: ({ node, ...p }) => <pre {...p} className="my-3 overflow-x-auto rounded bg-[#0d1117] p-0 text-sm" />,
  code: ({ node, inline, className, children, ...p }) => (className
    ? <code {...p} className={`${className} !bg-transparent`}>{children}</code>
    : <code {...p} className="rounded bg-offwhite px-1.5 py-0.5 text-[0.9em] text-[#b45309]">{children}</code>),
  table: ({ node, ...p }) => <div className="my-3 overflow-x-auto"><table {...p} className="w-full border border-line text-sm" /></div>,
  th: ({ node, ...p }) => <th {...p} className="border border-line bg-offwhite px-3 py-1.5 text-left" />,
  td: ({ node, ...p }) => <td {...p} className="border border-line px-3 py-1.5" />,
};

export default function Markdown({ children }) {
  return <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]} components={components}>{children || ''}</ReactMarkdown>;
}
