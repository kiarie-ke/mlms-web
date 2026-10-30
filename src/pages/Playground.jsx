import { useEffect, useMemo, useRef, useState } from 'react';
import Editor from '@monaco-editor/react';
import { PageHeader } from '../components/ui.jsx';
import { useConfirm } from '../providers/ConfirmProvider.jsx';

const KEY = 'mlms.playground.v2';
const start = {
  html: '<h1>Hello MODARA</h1>\n<button id="b">Click me</button>',
  css: 'body {\n  font-family: system-ui, sans-serif;\n  padding: 1rem;\n}\nh1 { color: #2563EB; }',
  js: "document.getElementById('b').onclick = () => {\n  console.log('Button clicked');\n};",
  node: 'const name = "MODARA";\nconsole.log("Hello from Node.js, " + name + "!");\nconsole.log("Node version:", process.version);',
  react: `import React, { useState } from 'react';

export default function App() {
  const [count, setCount] = useState(0);

  return (
    <main>
      <h1>React playground</h1>
      <p>Edit App.jsx, then see your changes in the preview.</p>
      <button onClick={() => setCount((value) => value + 1)}>
        Clicked {count} times
      </button>
    </main>
  );
}`,
  reactCss: `* {
  box-sizing: border-box;
}

body {
  margin: 0;
  color: #172033;
  background: #f4f7fb;
  font: 16px system-ui, sans-serif;
}

main {
  max-width: 42rem;
  margin: 4rem auto;
  padding: 2rem;
}

button {
  padding: 0.7rem 1rem;
  border: 0;
  border-radius: 0.4rem;
  color: white;
  background: #2563eb;
  cursor: pointer;
}`,
};
const webTabs = [['html', 'index.html'], ['css', 'style.css'], ['js', 'script.js']];
const reactTabs = [['react', 'App.jsx'], ['reactCss', 'style.css']];

let webContainerPromise;
let reactInstallPromise;
let reactDependenciesInstalled = false;

async function getWebContainer() {
  if (!window.crossOriginIsolated) {
    throw new Error('Node.js and React require cross-origin isolation. Configure the site with COOP and COEP headers, then reload.');
  }
  if (!webContainerPromise) {
    webContainerPromise = import('@webcontainer/api')
      .then(({ WebContainer }) => WebContainer.boot())
      .catch((error) => {
        webContainerPromise = undefined;
        throw error;
      });
  }
  return webContainerPromise;
}

async function writeReactFiles(container, code) {
  await container.fs.mkdir('/src', { recursive: true });
  await Promise.all([
    container.fs.writeFile('/package.json', JSON.stringify({
      name: 'mlms-react-playground',
      private: true,
      type: 'module',
      scripts: { dev: 'vite --host 0.0.0.0 --port 5173 --strictPort' },
      dependencies: { react: '18.3.1', 'react-dom': '18.3.1' },
      devDependencies: { vite: '5.4.21' },
    }, null, 2)),
    container.fs.writeFile('/index.html', '<!doctype html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>React Playground</title></head><body><div id="root"></div><script type="module" src="/src/main.jsx"></script></body></html>'),
    container.fs.writeFile('/src/main.jsx', "import React from 'react';\nimport { createRoot } from 'react-dom/client';\nimport App from './App.jsx';\nimport './style.css';\n\ncreateRoot(document.getElementById('root')).render(<App />);\n"),
    container.fs.writeFile('/src/App.jsx', code.react),
    container.fs.writeFile('/src/style.css', code.reactCss),
  ]);
}

async function installReactDependencies(container, onProcess, onOutput) {
  if (reactDependenciesInstalled) return;
  if (!reactInstallPromise) {
    reactInstallPromise = (async () => {
      const process = await container.spawn('npm', ['install', '--no-progress', '--no-fund', '--no-audit']);
      onProcess(process);
      const output = process.output.pipeTo(new WritableStream({ write: onOutput }));
      const exitCode = await process.exit;
      await output;
      if (exitCode !== 0) throw new Error(`React dependencies could not be installed (exit code ${exitCode}).`);
      reactDependenciesInstalled = true;
    })();
  }
  const installing = reactInstallPromise;
  try {
    await installing;
  } finally {
    if (reactInstallPromise === installing) reactInstallPromise = undefined;
  }
}

function waitForServer(container, port) {
  let unsubscribe = () => {};
  let timeout;
  const promise = new Promise((resolve, reject) => {
    unsubscribe = container.on('server-ready', (readyPort, url) => {
      if (readyPort !== port) return;
      window.clearTimeout(timeout);
      unsubscribe();
      resolve(url);
    });
    timeout = window.setTimeout(() => {
      unsubscribe();
      reject(new Error('The React development server did not become ready. Check the output and try again.'));
    }, 90000);
  });
  return {
    promise,
    cancel: () => {
      window.clearTimeout(timeout);
      unsubscribe();
    },
  };
}

const bridge = `<script>
(function(){
  function send(type,args){try{parent.postMessage({mlms:true,type:type,text:args.map(function(a){try{return typeof a==='object'?JSON.stringify(a):String(a)}catch(e){return String(a)}}).join(' ')},'*')}catch(e){}}
  ['log','info','warn','error'].forEach(function(k){var o=console[k];console[k]=function(){send(k,[].slice.call(arguments));o.apply(console,arguments)}});
  window.addEventListener('error',function(e){send('error',[e.message+' (line '+e.lineno+')'])});
  window.addEventListener('unhandledrejection',function(e){send('error',['Unhandled promise rejection: '+e.reason])});
})();
<\/script>`;

const build = (c) => `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">${bridge}<style>${c.css}</style></head><body>${c.html}<script>${c.js.replace(/<\/script/gi, '<\\/script')}<\/script></body></html>`;

export default function Playground() {
  const confirm = useConfirm();
  const [code, setCode] = useState(() => {
    try { return { ...start, ...JSON.parse(localStorage.getItem(KEY)) }; } catch { return start; }
  });
  const [run, setRun] = useState(code);
  const [tab, setTab] = useState('html');
  const [mode, setMode] = useState('web');
  const [reactTab, setReactTab] = useState('react');
  const [auto, setAuto] = useState(true);
  const [logs, setLogs] = useState([]);
  const [nodeOutput, setNodeOutput] = useState('');
  const [nodeRunning, setNodeRunning] = useState(false);
  const [nodeError, setNodeError] = useState('');
  const [reactUrl, setReactUrl] = useState('');
  const frame = useRef(null);
  const nodeProcess = useRef(null);
  const nodeRunId = useRef(0);

  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(code)); }, [code]);
  useEffect(() => {
    if (!auto) return undefined;
    const t = setTimeout(() => setRun({ html: code.html, css: code.css, js: code.js }), 600);
    return () => clearTimeout(t);
  }, [code.html, code.css, code.js, auto]);
  useEffect(() => { setLogs([]); }, [run]);
  useEffect(() => {
    const h = (e) => {
      if (e.source !== frame.current?.contentWindow || !e.data?.mlms) return;
      setLogs((l) => [...l.slice(-199), { type: e.data.type, text: String(e.data.text).slice(0, 2000) }]);
    };
    window.addEventListener('message', h);
    return () => window.removeEventListener('message', h);
  }, []);
  useEffect(() => () => {
    nodeRunId.current += 1;
    nodeProcess.current?.kill();
    nodeProcess.current = null;
  }, []);
  useEffect(() => {
    if (mode !== 'react' || !reactUrl) return undefined;
    let active = true;
    const file = reactTab === 'react' ? '/src/App.jsx' : '/src/style.css';
    const contents = code[reactTab];
    const timeout = window.setTimeout(() => {
      getWebContainer()
        .then((container) => active && container.fs.writeFile(file, contents))
        .catch((error) => active && setNodeError(error.message || 'Unable to update the React preview.'));
    }, 250);
    return () => {
      active = false;
      window.clearTimeout(timeout);
    };
  }, [mode, reactUrl, reactTab, code.react, code.reactCss]);

  const doc = useMemo(() => build(run), [run]);
  const appendOutput = (data) => setNodeOutput((current) => `${current}${data}`
    .replace(/\u001b\[[0-?]*[ -/]*[@-~]/g, '')
    .replace(/\r/g, '')
    .slice(-50000));
  const currentFile = mode === 'web' ? tab : mode === 'node' ? 'node' : reactTab;
  const editorValue = code[currentFile];
  const editorLanguage = mode === 'web'
    ? (tab === 'js' ? 'javascript' : tab)
    : currentFile === 'reactCss' ? 'css' : 'javascript';
  const download = () => {
    const content = mode === 'web' ? build(code).replace(bridge, '') : code[currentFile];
    const a = document.createElement('a');
    const mimeType = mode === 'web' ? 'text/html' : currentFile === 'reactCss' ? 'text/css' : 'text/javascript';
    const filename = mode === 'web' ? 'playground.html' : mode === 'node' ? 'index.js' : currentFile === 'reactCss' ? 'style.css' : 'App.jsx';
    a.href = URL.createObjectURL(new Blob([content], { type: mimeType }));
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  const stopExecution = () => {
    nodeRunId.current += 1;
    nodeProcess.current?.kill();
    nodeProcess.current = null;
    setNodeRunning(false);
    setReactUrl('');
    setNodeOutput((output) => `${output}${output && !output.endsWith('\n') ? '\n' : ''}Process stopped.`);
  };
  const runNode = async () => {
    const id = ++nodeRunId.current;
    setNodeRunning(true);
    setNodeError('');
    setNodeOutput('');
    try {
      const container = await getWebContainer();
      if (nodeRunId.current !== id) return;
      await container.fs.writeFile('/index.js', code.node);
      if (nodeRunId.current !== id) return;
      const process = await container.spawn('node', ['index.js']);
      if (nodeRunId.current !== id) {
        process.kill();
        return;
      }
      nodeProcess.current = process;
      const output = process.output.pipeTo(new WritableStream({
        write(data) { appendOutput(data); },
      }));
      const exitCode = await process.exit;
      await output;
      if (nodeRunId.current === id) {
        setNodeOutput((current) => `${current}${current && !current.endsWith('\n') ? '\n' : ''}Process exited with code ${exitCode}.`);
        nodeProcess.current = null;
        setNodeRunning(false);
      }
    } catch (error) {
      if (nodeRunId.current === id) {
        setNodeError(error.message || 'Unable to start the Node.js runtime.');
        setNodeRunning(false);
      }
    }
  };
  const runReact = async () => {
    const id = ++nodeRunId.current;
    setNodeRunning(true);
    setNodeError('');
    setNodeOutput('Preparing the React project…\n');
    setReactUrl('');
    let serverWait;
    try {
      const container = await getWebContainer();
      if (nodeRunId.current !== id) return;
      await writeReactFiles(container, code);
      if (nodeRunId.current !== id) return;
      await installReactDependencies(
        container,
        (process) => { if (nodeRunId.current === id) nodeProcess.current = process; },
        appendOutput,
      );
      if (nodeRunId.current !== id) return;
      nodeProcess.current = null;
      serverWait = waitForServer(container, 5173);
      const process = await container.spawn('npm', ['run', 'dev']);
      if (nodeRunId.current !== id) {
        process.kill();
        serverWait.cancel();
        return;
      }
      nodeProcess.current = process;
      process.output.pipeTo(new WritableStream({
        write(data) { appendOutput(data); },
      })).catch((error) => {
        if (nodeRunId.current === id) setNodeError(error.message || 'Unable to read the React server output.');
      });
      const url = await Promise.race([
        serverWait.promise,
        process.exit.then((exitCode) => { throw new Error(`The React development server exited with code ${exitCode}.`); }),
      ]);
      if (nodeRunId.current === id) setReactUrl(url);
    } catch (error) {
      serverWait?.cancel();
      if (nodeRunId.current === id) {
        setNodeError(error.message || 'Unable to start the React playground.');
        setNodeRunning(false);
        nodeProcess.current = null;
      }
    }
  };
  const changeMode = (nextMode) => {
    if (nextMode !== mode && nodeRunning) stopExecution();
    setMode(nextMode);
  };

  return (
    <>
      <PageHeader title="Code playground">
        <label className="flex items-center gap-2 text-sm">Run target
          <select className="input w-auto" value={mode} onChange={(event) => changeMode(event.target.value)}>
            <option value="web">Web</option>
            <option value="node">Node.js</option>
            <option value="react">React</option>
          </select>
        </label>
        {mode === 'web' && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} /> Live preview</label>}
        <button className="btn-ghost" onClick={download}>Download</button>
        <button className="btn-ghost" onClick={async () => {
          if (await confirm({ title: 'Reset code?', message: 'Reset to the starter code?', confirmText: 'Reset' })) {
            setCode(start);
            setRun(start);
          }
        }}>Reset</button>
        {mode === 'web' && !auto && <button className="btn-primary" onClick={() => setRun(code)}>Run ▶</button>}
        {mode !== 'web' && (
          <button className="btn-primary" onClick={nodeRunning ? stopExecution : mode === 'node' ? runNode : runReact}>
            {nodeRunning ? 'Stop ■' : mode === 'node' ? 'Run Node.js ▶' : 'Run React ▶'}
          </button>
        )}
      </PageHeader>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="overflow-hidden rounded border border-line bg-[#1e1e1e]">
          <div className="flex gap-1 bg-[#1e1e1e] px-2 pt-2">
            {mode === 'web'
              ? webTabs.map(([key, label]) => (
                <button key={key} onClick={() => setTab(key)} className={`rounded-t px-3 py-1.5 text-sm ${tab === key ? 'bg-[#2d2d2d] text-white' : 'text-slate-400 hover:text-white'}`}>{label}</button>
              ))
              : mode === 'node'
                ? <span className="rounded-t bg-[#2d2d2d] px-3 py-1.5 text-sm text-white">index.js</span>
                : reactTabs.map(([key, label]) => (
                  <button key={key} onClick={() => setReactTab(key)} className={`rounded-t px-3 py-1.5 text-sm ${reactTab === key ? 'bg-[#2d2d2d] text-white' : 'text-slate-400 hover:text-white'}`}>{label}</button>
                ))}
          </div>
          <Editor
            height="26rem"
            language={editorLanguage}
            theme="vs-dark"
            value={editorValue}
            onChange={(value) => setCode((current) => ({ ...current, [currentFile]: value ?? '' }))}
            options={{
              automaticLayout: true,
              fontSize: 14,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              wordWrap: 'on',
            }}
          />
        </div>
        {mode === 'web' ? (
          <div className="flex flex-col gap-3">
            <iframe ref={frame} title="Preview" sandbox="allow-scripts allow-modals" srcDoc={doc} className="h-80 w-full rounded border border-line bg-white" />
            <div className="h-40 overflow-y-auto rounded bg-[#1e1e1e] p-3 font-mono text-xs">
              <div className="mb-1 flex justify-between text-slate-400"><span>Console</span><button onClick={() => setLogs([])}>Clear</button></div>
              {logs.map((log, index) => <div key={index} className={log.type === 'error' ? 'text-red-400' : log.type === 'warn' ? 'text-amber' : 'text-slate-200'}>{log.text}</div>)}
              {!logs.length && <div className="text-slate-500">console.log output appears here.</div>}
            </div>
          </div>
        ) : mode === 'node' ? (
          <div className="flex min-h-[26rem] flex-col overflow-hidden rounded border border-line bg-[#1e1e1e]">
            <div className="border-b border-slate-700 px-3 py-2 text-sm text-slate-300">Node.js output</div>
            <pre aria-live="polite" className="flex-1 overflow-auto whitespace-pre-wrap p-3 font-mono text-xs text-slate-100">{nodeOutput || (nodeRunning ? 'Starting Node.js…' : 'Click “Run Node.js” to execute your script.')}</pre>
            {nodeError && <p role="alert" className="border-t border-red-900 bg-red-950/40 p-3 text-sm text-red-300">{nodeError}</p>}
            {!window.crossOriginIsolated && <p className="border-t border-amber-700 bg-amber-950/30 p-3 text-sm text-amber-200">Node.js needs the site’s COOP and COEP security headers. See the deployment instructions.</p>}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {reactUrl
              ? <iframe title="React preview" src={reactUrl} sandbox="allow-scripts allow-forms allow-modals allow-same-origin" className="h-80 w-full rounded border border-line bg-white" />
              : <div className="grid h-80 w-full place-items-center rounded border border-line bg-white p-6 text-center text-sm text-ink-soft">{nodeRunning ? 'Installing React and starting the preview…' : 'Click “Run React” to install dependencies and start the preview.'}</div>}
            <div className="h-40 overflow-y-auto rounded bg-[#1e1e1e] p-3 font-mono text-xs">
              <div className="mb-1 flex justify-between text-slate-400"><span>React output</span><button onClick={() => setNodeOutput('')}>Clear</button></div>
              <pre aria-live="polite" className="whitespace-pre-wrap text-slate-200">{nodeOutput || 'Vite and npm output appears here.'}</pre>
              {nodeError && <p role="alert" className="mt-2 text-red-400">{nodeError}</p>}
            </div>
            {!window.crossOriginIsolated && <p className="rounded border border-amber-700 bg-amber-950/30 p-3 text-sm text-amber-200">React’s browser runtime needs the site’s COOP and COEP security headers. See the deployment instructions.</p>}
          </div>
        )}
      </div>
    </>
  );
}
