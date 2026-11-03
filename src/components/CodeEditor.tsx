'use client';

import React, { useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { html as langHtml } from '@codemirror/lang-html';
import { css as langCss } from '@codemirror/lang-css';
import { javascript as langJs } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';
import { FileCode, Sparkles } from 'lucide-react';

interface CodeEditorProps {
  html: string;
  setHtml: (val: string) => void;
  css: string;
  setCss: (val: string) => void;
  js: string;
  setJs: (val: string) => void;
}

type TabType = 'html' | 'css' | 'js';

const TEMPLATES = [
  {
    name: 'Counter App',
    html: `<div class="card">
  <h1>Interactive Counter</h1>
  <p>Click the buttons below to change the score:</p>
  <div class="counter-display" id="count">0</div>
  <div class="actions">
    <button id="dec">- Decrease</button>
    <button id="reset">Reset</button>
    <button id="inc">+ Increase</button>
  </div>
</div>`,
    css: `body {
  margin: 0;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0f172a, #1e1b4b);
  font-family: system-ui, -apple-system, sans-serif;
  color: #f8fafc;
}

.card {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(12px);
  padding: 2.5rem;
  border-radius: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.15);
  text-align: center;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
}

h1 { margin: 0 0 0.5rem 0; font-size: 1.75rem; }
p { color: #94a3b8; font-size: 0.9rem; margin-bottom: 2rem; }

.counter-display {
  font-size: 4.5rem;
  font-weight: 800;
  margin-bottom: 2rem;
  color: #38bdf8;
}

.actions {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
}

button {
  background: #2563eb;
  color: white;
  border: none;
  padding: 0.75rem 1.25rem;
  font-size: 0.95rem;
  font-weight: 600;
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
}

button:hover {
  background: #3b82f6;
  transform: translateY(-2px);
}

#reset {
  background: #334155;
}
#reset:hover {
  background: #475569;
}`,
    js: `let count = 0;
const countEl = document.getElementById('count');
const incBtn = document.getElementById('inc');
const decBtn = document.getElementById('dec');
const resetBtn = document.getElementById('reset');

function updateDisplay() {
  countEl.textContent = count;
  countEl.style.transform = 'scale(1.15)';
  setTimeout(() => {
    countEl.style.transform = 'scale(1)';
  }, 150);
}

incBtn.addEventListener('click', () => {
  count++;
  updateDisplay();
});

decBtn.addEventListener('click', () => {
  count--;
  updateDisplay();
});

resetBtn.addEventListener('click', () => {
  count = 0;
  updateDisplay();
});`,
  },
  {
    name: 'Glow Card',
    html: `<div class="container">
  <div class="glow-box">
    <h2>Neon Vibes</h2>
    <p>Hover over this card to see dynamic lighting and smooth transformation effects.</p>
    <a href="#" class="btn">Explore More</a>
  </div>
</div>`,
    css: `body {
  margin: 0;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #09090b;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.glow-box {
  background: #18181b;
  color: white;
  padding: 3rem 2.5rem;
  border-radius: 20px;
  max-width: 340px;
  text-align: center;
  position: relative;
  border: 1px solid #27272a;
  transition: transform 0.3s, box-shadow 0.3s;
}

.glow-box:hover {
  transform: translateY(-8px);
  box-shadow: 0 10px 30px rgba(168, 85, 247, 0.35);
  border-color: #a855f7;
}

h2 {
  color: #c084fc;
  margin-top: 0;
}

p {
  color: #a1a1aa;
  font-size: 14px;
  line-height: 1.6;
}

.btn {
  display: inline-block;
  margin-top: 1.5rem;
  padding: 0.65rem 1.4rem;
  background: linear-gradient(135deg, #a855f7, #6366f1);
  color: white;
  text-decoration: none;
  border-radius: 9999px;
  font-weight: 600;
  font-size: 14px;
}`,
    js: `// Interactive click sparkle
document.querySelector('.glow-box').addEventListener('click', () => {
  console.log('Card clicked!');
});`,
  },
];

export default function CodeEditor({
  html,
  setHtml,
  css,
  setCss,
  js,
  setJs,
}: CodeEditorProps) {
  const [activeTab, setActiveTab] = useState<TabType>('html');

  const applyTemplate = (t: (typeof TEMPLATES)[0]) => {
    setHtml(t.html);
    setCss(t.css);
    setJs(t.js);
  };

  const currentCode =
    activeTab === 'html' ? html : activeTab === 'css' ? css : js;
  const currentSetter =
    activeTab === 'html' ? setHtml : activeTab === 'css' ? setCss : setJs;

  const getLanguageExtension = () => {
    switch (activeTab) {
      case 'html':
        return [langHtml()];
      case 'css':
        return [langCss()];
      case 'js':
        return [langJs()];
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
      {/* Tab Navigation Header */}
      <div className="flex items-center justify-between bg-slate-950 border-b border-slate-800 px-3 py-2 shrink-0">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveTab('html')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition ${
              activeTab === 'html'
                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            HTML
          </button>
          <button
            onClick={() => setActiveTab('css')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition ${
              activeTab === 'css'
                ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-sky-400"></span>
            CSS
          </button>
          <button
            onClick={() => setActiveTab('js')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition ${
              activeTab === 'js'
                ? 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
            JavaScript
          </button>
        </div>

        {/* Templates Dropdown / Buttons */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-500 hidden md:inline">Starter:</span>
          {TEMPLATES.map((tmpl) => (
            <button
              key={tmpl.name}
              onClick={() => applyTemplate(tmpl)}
              className="flex items-center gap-1 text-[11px] text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-750 px-2 py-1 rounded border border-slate-700/60 transition"
              title={`Load ${tmpl.name} template`}
            >
              <Sparkles className="w-3 h-3 text-indigo-400" />
              <span>{tmpl.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex-1 min-h-[360px] max-h-[600px] overflow-auto text-sm font-mono">
        <CodeMirror
          value={currentCode}
          height="100%"
          theme={oneDark}
          extensions={getLanguageExtension()}
          onChange={(val) => currentSetter(val)}
          className="h-full text-sm"
          basicSetup={{
            lineNumbers: true,
            highlightActiveLineGutter: true,
            foldGutter: true,
            dropCursor: true,
            allowMultipleSelections: true,
            indentOnInput: true,
            bracketMatching: true,
            closeBrackets: true,
            autocompletion: true,
            rectangularSelection: true,
            crosshairCursor: true,
            highlightActiveLine: true,
            highlightSelectionMatches: true,
            closeBracketsKeymap: true,
            defaultKeymap: true,
            searchKeymap: true,
            historyKeymap: true,
            foldKeymap: true,
            completionKeymap: true,
            lintKeymap: true,
          }}
        />
      </div>

      {/* Editor Footer */}
      <div className="flex items-center justify-between bg-slate-950 border-t border-slate-800/80 px-4 py-1.5 text-xs text-slate-500 shrink-0">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <FileCode className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-300 uppercase font-medium">{activeTab}</span>
          </span>
          <span>{currentCode.split('\n').length} lines</span>
          <span>{currentCode.length} chars</span>
        </div>
        <div className="text-[11px] text-slate-500">Auto-saved to session</div>
      </div>
    </div>
  );
}
