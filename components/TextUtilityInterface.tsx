'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Clipboard, Download, Eraser, RotateCcw, Save } from 'lucide-react';
import { trackToolEvent } from '@/lib/toolAnalytics';

export type TextUtilityMode =
  | 'notepad'
  | 'character-count'
  | 'change-case'
  | 'find-replace'
  | 'remove-formatting'
  | 'remove-duplicate-lines'
  | 'sort-text';

const NOTEPAD_STORAGE_KEY = 'fwo:online-notepad:v1';

function countWords(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed.split(/\s+/u).length : 0;
}

function countParagraphs(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed.split(/\n\s*\n/u).filter(Boolean).length : 0;
}

function toTitleCase(value: string) {
  return value.toLowerCase().replace(/\b([\p{L}\p{N}])/gu, (match) => match.toUpperCase());
}

function toSentenceCase(value: string) {
  const lower = value.toLowerCase();
  return lower.replace(/(^\s*[\p{L}\p{N}]|[.!?]\s+[\p{L}\p{N}])/gu, (match) => match.toUpperCase());
}

function countLiteralOccurrences(value: string, query: string) {
  if (!query) return 0;
  return value.split(query).length - 1;
}

export function TextUtilityInterface({
  mode,
  toolId,
}: {
  mode: TextUtilityMode;
  toolId: string;
}) {
  const [text, setText] = useState('');
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [status, setStatus] = useState('');
  const [storageReady, setStorageReady] = useState(mode !== 'notepad');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (mode !== 'notepad') return;
    try {
      setText(window.localStorage.getItem(NOTEPAD_STORAGE_KEY) ?? '');
    } finally {
      setStorageReady(true);
    }
  }, [mode]);

  useEffect(() => {
    if (mode !== 'notepad' || !storageReady) return;
    window.localStorage.setItem(NOTEPAD_STORAGE_KEY, text);
  }, [mode, storageReady, text]);

  const stats = useMemo(() => ({
    characters: text.length,
    charactersNoSpaces: text.replace(/\s/gu, '').length,
    words: countWords(text),
    lines: text ? text.split(/\r?\n/u).length : 0,
    paragraphs: countParagraphs(text),
  }), [text]);

  const findMatches = useMemo(
    () => countLiteralOccurrences(text, findText),
    [findText, text],
  );

  function updateText(next: string, eventName?: string) {
    setText(next);
    setStatus('');
    if (eventName) trackToolEvent('tool_success', { toolId, metadata: { action: eventName } });
  }

  async function copyText() {
    await navigator.clipboard.writeText(text);
    setStatus('Copied to clipboard.');
    trackToolEvent('tool_download', { toolId, outputType: 'clipboard' });
  }

  function downloadText() {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = mode === 'notepad' ? 'online-notepad.txt' : `${toolId}.txt`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    setStatus('TXT file downloaded.');
    trackToolEvent('tool_download', { toolId, outputType: 'txt' });
  }

  function clearText() {
    setText('');
    setFindText('');
    setReplaceText('');
    setStatus('Cleared.');
    textareaRef.current?.focus();
  }

  function replaceFirst() {
    if (!findText) return;
    const index = text.indexOf(findText);
    if (index < 0) {
      setStatus('No matches found.');
      return;
    }
    updateText(
      `${text.slice(0, index)}${replaceText}${text.slice(index + findText.length)}`,
      'replace-first',
    );
    setStatus('Replaced the first match.');
  }

  function replaceAll() {
    if (!findText) return;
    if (!findMatches) {
      setStatus('No matches found.');
      return;
    }
    updateText(text.split(findText).join(replaceText), 'replace-all');
    setStatus(`Replaced ${findMatches} ${findMatches === 1 ? 'match' : 'matches'}.`);
  }

  function removeDuplicateLines() {
    const seen = new Set<string>();
    const next = text
      .split(/\r?\n/u)
      .filter((line) => {
        if (seen.has(line)) return false;
        seen.add(line);
        return true;
      })
      .join('\n');
    updateText(next, 'remove-duplicate-lines');
    setStatus('Duplicate lines removed.');
  }

  function sortLines(direction: 'asc' | 'desc') {
    const next = [...text.split(/\r?\n/u)].sort((left, right) => {
      const result = left.localeCompare(right, undefined, { sensitivity: 'base', numeric: true });
      return direction === 'asc' ? result : -result;
    }).join('\n');
    updateText(next, direction === 'asc' ? 'sort-ascending' : 'sort-descending');
    setStatus(direction === 'asc' ? 'Sorted A–Z.' : 'Sorted Z–A.');
  }

  return (
    <div className="text-utility">
      <style>{`
        .text-utility{display:grid;gap:14px}
        .text-utility-toolbar{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
        .text-utility-button{border:1px solid #d4d9e1;background:#fff;color:#202124;border-radius:20px;padding:9px 14px;font-weight:650;cursor:pointer;display:inline-flex;align-items:center;gap:7px}
        .text-utility-button:hover{background:#f3f6fb;border-color:#b8c6db}
        .text-utility-button.primary{background:#0b57d0;color:#fff;border-color:#0b57d0}
        .text-utility-button:disabled{opacity:.45;cursor:not-allowed}
        .text-utility-textarea{width:100%;min-height:360px;resize:vertical;border:1px solid #d9dde4;border-radius:14px;padding:18px;font:15px/1.65 Arial,Helvetica,sans-serif;color:#202124;background:#fff;outline:none;box-sizing:border-box}
        .text-utility-textarea:focus{border-color:#0b57d0;box-shadow:0 0 0 3px rgba(11,87,208,.10)}
        .text-utility-stats{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px}
        .text-utility-stat{border:1px solid #e0e3e7;border-radius:12px;padding:11px 12px;background:#f8fafd}
        .text-utility-stat strong{display:block;font-size:18px}
        .text-utility-stat span{display:block;color:#5f6368;font-size:11px;margin-top:3px}
        .text-utility-find{display:grid;grid-template-columns:1fr 1fr auto auto;gap:8px}
        .text-utility-input{min-width:0;border:1px solid #d9dde4;border-radius:12px;padding:10px 12px;font:14px Arial,Helvetica,sans-serif;outline:none}
        .text-utility-input:focus{border-color:#0b57d0}
        .text-utility-status{min-height:18px;color:#5f6368;font-size:12px}
        .text-utility-note{border-radius:12px;background:#f8fafd;border:1px solid #e0e3e7;padding:11px 13px;color:#5f6368;font-size:12px;line-height:1.5}
        @media(max-width:760px){.text-utility-stats{grid-template-columns:repeat(2,minmax(0,1fr))}.text-utility-find{grid-template-columns:1fr}.text-utility-textarea{min-height:300px;padding:14px}}
      `}</style>

      {mode === 'find-replace' ? (
        <div className="text-utility-find">
          <input className="text-utility-input" value={findText} onChange={(event) => setFindText(event.target.value)} placeholder="Find" aria-label="Find text" />
          <input className="text-utility-input" value={replaceText} onChange={(event) => setReplaceText(event.target.value)} placeholder="Replace with" aria-label="Replacement text" />
          <button className="text-utility-button" type="button" disabled={!findText} onClick={replaceFirst}>Replace first</button>
          <button className="text-utility-button primary" type="button" disabled={!findText} onClick={replaceAll}>Replace all ({findMatches})</button>
        </div>
      ) : null}

      {mode === 'change-case' ? (
        <div className="text-utility-toolbar" aria-label="Case conversion actions">
          <button className="text-utility-button" type="button" onClick={() => updateText(text.toUpperCase(), 'uppercase')}>UPPERCASE</button>
          <button className="text-utility-button" type="button" onClick={() => updateText(text.toLowerCase(), 'lowercase')}>lowercase</button>
          <button className="text-utility-button" type="button" onClick={() => updateText(toTitleCase(text), 'title-case')}>Title Case</button>
          <button className="text-utility-button" type="button" onClick={() => updateText(toSentenceCase(text), 'sentence-case')}>Sentence case</button>
        </div>
      ) : null}

      {mode === 'remove-duplicate-lines' ? (
        <div className="text-utility-toolbar">
          <button className="text-utility-button primary" type="button" onClick={removeDuplicateLines}>Remove duplicate lines</button>
        </div>
      ) : null}

      {mode === 'sort-text' ? (
        <div className="text-utility-toolbar">
          <button className="text-utility-button primary" type="button" onClick={() => sortLines('asc')}>Sort A–Z</button>
          <button className="text-utility-button" type="button" onClick={() => sortLines('desc')}>Sort Z–A</button>
        </div>
      ) : null}

      {mode === 'remove-formatting' ? (
        <div className="text-utility-note">Paste formatted text below. A textarea stores plain text only, so font, color, links, and other rich formatting are stripped automatically.</div>
      ) : null}

      {mode === 'notepad' ? (
        <div className="text-utility-note">Your note autosaves in this browser using local storage. It is not uploaded to an account or synced to a server.</div>
      ) : null}

      <textarea
        ref={textareaRef}
        className="text-utility-textarea"
        value={text}
        onChange={(event) => {
          if (!text) trackToolEvent('tool_start', { toolId, fileType: 'text' });
          setText(event.target.value);
          setStatus('');
        }}
        placeholder={mode === 'notepad' ? 'Start writing…' : 'Paste or type text here…'}
        aria-label="Text input"
      />

      <div className="text-utility-stats" aria-label="Text statistics">
        <div className="text-utility-stat"><strong>{stats.characters}</strong><span>Characters</span></div>
        <div className="text-utility-stat"><strong>{stats.charactersNoSpaces}</strong><span>Without spaces</span></div>
        <div className="text-utility-stat"><strong>{stats.words}</strong><span>Words</span></div>
        <div className="text-utility-stat"><strong>{stats.lines}</strong><span>Lines</span></div>
        <div className="text-utility-stat"><strong>{stats.paragraphs}</strong><span>Paragraphs</span></div>
      </div>

      <div className="text-utility-toolbar">
        <button className="text-utility-button primary" type="button" disabled={!text} onClick={() => void copyText()}><Clipboard size={16} />Copy</button>
        {mode === 'notepad' || mode === 'remove-formatting' ? (
          <button className="text-utility-button" type="button" disabled={!text} onClick={downloadText}><Download size={16} />Download TXT</button>
        ) : null}
        {mode === 'notepad' ? <span className="text-utility-button" aria-label="Autosave enabled"><Save size={16} />Autosaved locally</span> : null}
        <button className="text-utility-button" type="button" disabled={!text && !findText && !replaceText} onClick={clearText}>
          {mode === 'remove-formatting' ? <Eraser size={16} /> : <RotateCcw size={16} />}Clear
        </button>
      </div>
      <div className="text-utility-status" aria-live="polite">{status}</div>
    </div>
  );
}
