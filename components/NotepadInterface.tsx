'use client';

import { ChangeEvent, useEffect, useRef, useState } from 'react';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  CalendarDays,
  Copy,
  Download,
  FileCode2,
  FileText,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Maximize2,
  Mic,
  MicOff,
  Moon,
  Redo2,
  Share2,
  Strikethrough,
  Sun,
  Table2,
  Trash2,
  Underline,
  Undo2,
  Upload,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { trackToolEvent } from '@/lib/toolAnalytics';

const STORAGE_KEY = 'fwo:online-notepad:rich:v1';
const STORAGE_META_KEY = 'fwo:online-notepad:rich:meta:v1';
const DEFAULT_ZOOM = 100;
const SAVE_IDLE_MS = 260;

type PaperStyle = 'notebook' | 'plain';
type NoteStats = { words: number; characters: number; lines: number };

interface SpeechRecognitionEventLike extends Event {
  results: ArrayLike<{ 0: { transcript: string }; isFinal?: boolean }>;
}

interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function sanitizeImportedHtml(input: string) {
  const doc = new DOMParser().parseFromString(input, 'text/html');
  doc.querySelectorAll('script,style,iframe,object,embed,form,meta,link').forEach((node) => node.remove());
  doc.querySelectorAll('*').forEach((node) => {
    [...node.attributes].forEach((attribute) => {
      const name = attribute.name.toLowerCase();
      const value = attribute.value.trim().toLowerCase();
      if (name.startsWith('on') || value.startsWith('javascript:')) node.removeAttribute(attribute.name);
    });
  });
  return doc.body.innerHTML;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function formatSavedTime(date: Date | null) {
  if (!date) return 'Saved locally';
  return `Saved ${date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
}

function normalizeText(value: string) {
  return value.replace(/\u00a0/g, ' ').replace(/\n{3,}/g, '\n\n').trimEnd();
}

function noteStats(text: string): NoteStats {
  const trimmed = text.trim();
  return {
    words: trimmed ? trimmed.split(/\s+/u).length : 0,
    characters: text.length,
    lines: text ? text.split(/\r?\n/u).length : 0,
  };
}

function hasMeaningfulContent(editor: HTMLElement, text?: string) {
  const currentText = text ?? editor.innerText ?? '';
  return Boolean(currentText.trim() || editor.querySelector('img,table,hr'));
}

export function NotepadInterface({ toolId }: { toolId: string }) {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const speechRef = useRef<SpeechRecognitionLike | null>(null);
  const saveTimerRef = useRef<number | null>(null);
  const startedRef = useRef(false);
  const contentPresentRef = useRef(false);
  const readyRef = useRef(false);

  const [ready, setReady] = useState(false);
  const [hasContent, setHasContent] = useState(false);
  const [stats, setStats] = useState<NoteStats>({ words: 0, characters: 0, lines: 0 });
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [paperStyle, setPaperStyle] = useState<PaperStyle>('notebook');
  const [listening, setListening] = useState(false);
  const [status, setStatus] = useState('');
  const [fontFamily, setFontFamily] = useState('Arial');
  const [blockType, setBlockType] = useState('p');
  const [textColor, setTextColor] = useState('#202124');

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY) ?? '';
      const metaRaw = window.localStorage.getItem(STORAGE_META_KEY);
      const meta = metaRaw ? JSON.parse(metaRaw) as { darkMode?: boolean; zoom?: number; paperStyle?: PaperStyle } : {};

      setDarkMode(Boolean(meta.darkMode));
      if (typeof meta.zoom === 'number') setZoom(Math.min(200, Math.max(75, meta.zoom)));
      if (meta.paperStyle === 'plain' || meta.paperStyle === 'notebook') setPaperStyle(meta.paperStyle);

      const editor = editorRef.current;
      if (editor) {
        editor.innerHTML = saved;
        const text = editor.innerText ?? '';
        const present = hasMeaningfulContent(editor, text);
        contentPresentRef.current = present;
        startedRef.current = present;
        setHasContent(present);
        setStats(noteStats(text));
      }
    } catch {
      const editor = editorRef.current;
      if (editor) editor.innerHTML = '';
    } finally {
      readyRef.current = true;
      setReady(true);
    }
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_META_KEY, JSON.stringify({ darkMode, zoom, paperStyle }));
    } catch {
      // Preferences are optional; editing remains fully usable if storage is unavailable.
    }
  }, [darkMode, paperStyle, ready, zoom]);

  useEffect(() => {
    return () => {
      speechRef.current?.stop();
      if (saveTimerRef.current !== null) window.clearTimeout(saveTimerRef.current);
      const editor = editorRef.current;
      if (editor && readyRef.current) {
        try {
          window.localStorage.setItem(STORAGE_KEY, editor.innerHTML);
        } catch {
          // Do not block navigation if browser storage is unavailable/full.
        }
      }
    };
  }, []);

  function updateContentState(present: boolean) {
    if (contentPresentRef.current === present) return;
    contentPresentRef.current = present;
    setHasContent(present);
  }

  function persistEditor() {
    if (!readyRef.current) return;
    const editor = editorRef.current;
    if (!editor) return;

    const text = editor.innerText ?? '';
    const present = hasMeaningfulContent(editor, text);
    updateContentState(present);
    setStats(noteStats(text));

    try {
      window.localStorage.setItem(STORAGE_KEY, editor.innerHTML);
      const now = new Date();
      setSavedAt(now);
    } catch {
      setStatus('Autosave storage is full — download a copy');
    }
  }

  function scheduleEditorSync() {
    const editor = editorRef.current;
    if (!editor) return;

    if (!startedRef.current) {
      const text = editor.textContent ?? '';
      if (text.trim() || editor.querySelector('img,table,hr')) {
        startedRef.current = true;
        updateContentState(true);
        trackToolEvent('tool_start', { toolId, fileType: 'text' });
      }
    }

    if (status) setStatus('');
    if (saveTimerRef.current !== null) window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(() => {
      saveTimerRef.current = null;
      persistEditor();
    }, SAVE_IDLE_MS);
  }

  function flushEditor() {
    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    persistEditor();
  }

  function focusEditor() {
    editorRef.current?.focus();
  }

  function runCommand(command: string, value?: string) {
    focusEditor();
    document.execCommand(command, false, value);
    scheduleEditorSync();
  }

  function setHeading(value: string) {
    setBlockType(value);
    runCommand('formatBlock', value === 'p' ? 'p' : value);
  }

  function setFont(value: string) {
    setFontFamily(value);
    runCommand('fontName', value);
  }

  function setColor(value: string) {
    setTextColor(value);
    runCommand('foreColor', value);
  }

  function clearEditor() {
    const editor = editorRef.current;
    if (!editor) return;
    editor.innerHTML = '';
    updateContentState(false);
    setStats({ words: 0, characters: 0, lines: 0 });
    setStatus('Note cleared');
    if (saveTimerRef.current !== null) window.clearTimeout(saveTimerRef.current);
    try {
      window.localStorage.setItem(STORAGE_KEY, '');
      setSavedAt(new Date());
    } catch {
      // Clearing the editor itself still succeeds.
    }
    focusEditor();
  }

  function currentPlainText() {
    return editorRef.current?.innerText ?? '';
  }

  async function copyText() {
    await navigator.clipboard.writeText(normalizeText(currentPlainText()));
    setStatus('Copied to clipboard');
    trackToolEvent('tool_download', { toolId, outputType: 'clipboard' });
  }

  function downloadTxt() {
    downloadBlob(new Blob([normalizeText(currentPlainText())], { type: 'text/plain;charset=utf-8' }), 'online-notepad.txt');
    setStatus('TXT downloaded');
    trackToolEvent('tool_download', { toolId, outputType: 'txt' });
  }

  function downloadHtml() {
    const html = editorRef.current?.innerHTML ?? '';
    const documentHtml = `<!doctype html><html><head><meta charset="utf-8"><title>Online Notepad</title></head><body>${html}</body></html>`;
    downloadBlob(new Blob([documentHtml], { type: 'text/html;charset=utf-8' }), 'online-notepad.html');
    setStatus('HTML downloaded');
    trackToolEvent('tool_download', { toolId, outputType: 'html' });
  }

  async function downloadPdf() {
    const editor = editorRef.current;
    if (!editor) return;
    const { default: html2pdf } = await import('html2pdf.js');
    const clone = editor.cloneNode(true) as HTMLElement;
    clone.style.cssText = 'width:186mm;min-height:273mm;padding:12mm;font:16px/1.65 Arial,Helvetica,sans-serif;color:#202124;background:#fff;box-sizing:border-box;';
    const blob = await html2pdf().set({
      margin: [0, 0, 0, 0],
      filename: 'online-notepad.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, backgroundColor: '#ffffff' },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    }).from(clone).toPdf().outputPdf('blob');
    downloadBlob(blob, 'online-notepad.pdf');
    setStatus('PDF downloaded');
    trackToolEvent('tool_download', { toolId, outputType: 'pdf' });
  }

  async function shareNote() {
    const text = normalizeText(currentPlainText());
    if (navigator.share) {
      await navigator.share({ title: 'Online Notepad', text });
      setStatus('Share sheet opened');
      return;
    }
    await navigator.clipboard.writeText(text);
    setStatus('Note copied — ready to share');
  }

  function insertLink() {
    const href = window.prompt('Paste a link');
    if (href) runCommand('createLink', href);
  }

  function insertTable() {
    runCommand('insertHTML', '<table><tbody><tr><td>Cell</td><td>Cell</td></tr><tr><td>Cell</td><td>Cell</td></tr></tbody></table><p><br></p>');
  }

  function insertDate() {
    runCommand('insertText', new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }));
  }

  function handleFileUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? '');
      const nextHtml = /\.html?$/i.test(file.name)
        ? sanitizeImportedHtml(result)
        : result.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');
      if (editorRef.current) {
        editorRef.current.innerHTML = nextHtml;
        startedRef.current = true;
        flushEditor();
      }
      setStatus(`${file.name} opened`);
      trackToolEvent('tool_success', { toolId, metadata: { action: 'upload-note' } });
    };
    reader.readAsText(file);
    event.target.value = '';
  }

  function handleImageUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => runCommand('insertImage', String(reader.result ?? ''));
    reader.readAsDataURL(file);
    event.target.value = '';
  }

  function toggleFullscreen() {
    setFullscreen((value) => !value);
    window.setTimeout(focusEditor, 0);
  }

  function changeZoom(delta: number) {
    setZoom((value) => Math.min(200, Math.max(75, value + delta)));
  }

  function toggleSpeech() {
    if (listening) {
      speechRef.current?.stop();
      setListening(false);
      return;
    }
    const speechWindow = window as typeof window & {
      SpeechRecognition?: SpeechRecognitionCtor;
      webkitSpeechRecognition?: SpeechRecognitionCtor;
    };
    const Recognition = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
    if (!Recognition) {
      setStatus('Speech-to-text is not supported in this browser');
      return;
    }
    const recognition = new Recognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = navigator.language || 'en-US';
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results).map((result) => result[0]?.transcript ?? '').join(' ');
      if (transcript.trim()) runCommand('insertText', `${transcript.trim()} `);
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => {
      setListening(false);
      setStatus('Speech-to-text stopped');
    };
    speechRef.current = recognition;
    recognition.start();
    setListening(true);
    setStatus('Listening…');
  }

  return (
    <div className={`notepad-is-shell${darkMode ? ' is-dark' : ''}${fullscreen ? ' is-fullscreen' : ''}${paperStyle === 'plain' ? ' is-plain' : ''}`}>
      <style>{`
        .notepad-is-shell{--np-bg:#edf1f6;--np-panel:rgba(255,255,255,.94);--np-panel-solid:#fff;--np-paper:#fff;--np-ink:#202124;--np-muted:#6f7580;--np-line:#e0e5ec;--np-hover:#edf1f7;--np-accent:#7457f5;--np-accent-soft:#eee9ff;--np-rule:rgba(86,109,148,.10);--np-margin:rgba(223,92,111,.16);position:relative;width:100%;border:1px solid var(--np-line);border-radius:20px;background:var(--np-bg);color:var(--np-ink);overflow:hidden;box-shadow:0 14px 42px rgba(31,38,57,.10);font-family:Inter,Arial,Helvetica,sans-serif}
        .notepad-is-shell.is-dark{--np-bg:#15181d;--np-panel:rgba(28,30,35,.96);--np-panel-solid:#1d2025;--np-paper:#202329;--np-ink:#f4f5f7;--np-muted:#a6abb4;--np-line:#313640;--np-hover:#2b3038;--np-accent:#9b85ff;--np-accent-soft:#302b43;--np-rule:rgba(215,221,233,.07);--np-margin:rgba(255,128,145,.13);box-shadow:0 18px 50px rgba(0,0,0,.30)}
        .notepad-is-shell.is-fullscreen{position:fixed;inset:0;z-index:9999;border:0;border-radius:0;display:flex;flex-direction:column}
        .np-topbar{display:flex;align-items:center;justify-content:flex-start;gap:14px;padding:14px 16px;border-bottom:1px solid var(--np-line);background:var(--np-panel);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px)}
        .np-brand{display:flex;align-items:center;gap:9px;min-width:0}.np-mark{width:34px;height:34px;border-radius:10px;background:linear-gradient(145deg,#8d72ff,#6f52f0);display:grid;place-items:center;color:#fff;font-weight:800;font-size:15px;box-shadow:0 7px 18px rgba(124,92,255,.28)}.np-brand-copy{min-width:0;display:flex;align-items:baseline;gap:9px}.np-brand-copy strong{display:block;font-size:14px;letter-spacing:-.01em}.np-save{color:var(--np-muted);font-size:10px;white-space:nowrap}
        .np-toolbar,.np-toolgroup{display:flex;align-items:center}.np-toolbar{gap:7px;padding:10px 12px;border-bottom:1px solid var(--np-line);background:var(--np-panel-solid);overflow-x:auto;scrollbar-width:none}.np-toolbar::-webkit-scrollbar{display:none}.np-toolgroup{gap:3px;padding-right:7px;border-right:1px solid var(--np-line);flex:0 0 auto}.np-toolgroup:last-child{border-right:0;padding-right:0}.np-utility{margin-left:auto}
        .np-btn{height:34px;min-width:34px;border:0;border-radius:8px;background:transparent;color:var(--np-ink);display:inline-flex;align-items:center;justify-content:center;gap:7px;padding:0 9px;cursor:pointer;font:600 12px/1 Arial,Helvetica,sans-serif;white-space:nowrap}.np-btn:hover{background:var(--np-hover)}.np-btn.is-accent{background:var(--np-accent-soft);color:var(--np-accent)}.np-btn.is-recording{background:#ffe9ea;color:#d93025}.is-dark .np-btn.is-recording{background:#452426;color:#ff8a80}.np-btn:disabled{opacity:.45;cursor:not-allowed}.np-btn svg{width:16px;height:16px;stroke-width:1.9}
        .np-select{height:34px;border:0;border-radius:8px;background:transparent;color:var(--np-ink);padding:0 27px 0 9px;font:600 12px Arial,Helvetica,sans-serif;outline:none;cursor:pointer}.np-select:hover{background:var(--np-hover)}.np-font{width:105px}.np-heading{width:94px}.np-paper-mode{width:102px}.np-color{width:28px;height:28px;border:0;background:transparent;padding:3px;border-radius:7px;cursor:pointer}
        .np-workspace{position:relative;padding:clamp(12px,3vw,34px);background:radial-gradient(circle at 50% 0,rgba(116,87,245,.09),transparent 32%),linear-gradient(135deg,rgba(255,255,255,.48),transparent 46%),var(--np-bg);flex:1;min-height:520px;overflow:auto}
        .np-paper-wrap{width:min(210mm,100%);margin:0 auto;transform-origin:top center}
        .np-paper{position:relative;width:100%;aspect-ratio:210/297;background:var(--np-paper);border:1px solid rgba(95,105,120,.18);border-radius:5px;box-shadow:0 18px 46px rgba(48,55,70,.16),0 2px 5px rgba(48,55,70,.08);overflow:hidden;transform-origin:top center;transition:transform .18s ease}
        .np-paper:before{content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(90deg,transparent 0,transparent clamp(28px,8%,58px),var(--np-margin) clamp(28px,8%,58px),var(--np-margin) calc(clamp(28px,8%,58px) + 1px),transparent calc(clamp(28px,8%,58px) + 1px)),repeating-linear-gradient(to bottom,transparent 0,transparent 31px,var(--np-rule) 31px,var(--np-rule) 32px);opacity:.78}
        .np-editor{position:relative;z-index:1;width:100%;height:100%;box-sizing:border-box;padding:clamp(34px,7.3%,58px) clamp(28px,8.2%,65px);outline:none;color:var(--np-ink);font:clamp(14px,1.75vw,16px)/1.72 Arial,Helvetica,sans-serif;word-break:break-word;overflow:auto;scrollbar-width:thin;caret-color:var(--np-accent);background:transparent}.np-editor:empty:before{content:attr(data-placeholder);color:var(--np-muted);pointer-events:none}.np-editor h1{font-size:2em;line-height:1.2;margin:.65em 0 .35em}.np-editor h2{font-size:1.55em;line-height:1.25;margin:.65em 0 .35em}.np-editor h3{font-size:1.25em;line-height:1.3;margin:.65em 0 .35em}.np-editor p{margin:.6em 0}.np-editor ul,.np-editor ol{padding-left:1.5em}.np-editor a{color:var(--np-accent)}.np-editor img{max-width:100%;height:auto;border-radius:8px}.np-editor table{border-collapse:collapse;width:100%;margin:14px 0}.np-editor td,.np-editor th{border:1px solid var(--np-line);padding:8px 10px;min-width:80px}
        .notepad-is-shell.is-plain .np-paper:before{display:none!important}.notepad-is-shell.is-plain .np-paper{background:#fff!important}.notepad-is-shell.is-plain .np-editor{background:#fff!important;background-image:none!important;color:#202124!important}.notepad-is-shell.is-plain .np-editor:empty:before{color:#9aa0a6!important}.notepad-is-shell.is-plain .np-editor a{color:#7457f5!important}
        .np-statusbar{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 16px;border-top:1px solid var(--np-line);background:var(--np-panel);color:var(--np-muted);font-size:11px}.np-stats{display:flex;align-items:center;gap:14px;white-space:nowrap}.np-status-right{display:flex;align-items:center;gap:8px}.np-status-message{color:var(--np-accent);font-weight:650;max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.np-zoom{display:flex;align-items:center;gap:2px}.np-zoom .np-btn{height:28px;min-width:28px;padding:0}.np-zoom-value{min-width:42px;text-align:center;font-weight:650;color:var(--np-ink)}.np-hidden{display:none}
        .is-fullscreen .np-workspace{min-height:0}.is-fullscreen .np-paper-wrap{width:min(210mm,calc(100vw - 48px))}
        @media(max-width:760px){.notepad-is-shell{border-radius:14px}.np-topbar{padding:9px 11px}.np-toolbar{padding:8px}.np-workspace{padding:12px;min-height:0}.np-paper{border-radius:4px}.np-editor{padding:clamp(26px,7vw,42px) clamp(20px,7vw,36px);font-size:15px}.np-statusbar{padding:9px 11px}.np-status-message{display:none}.np-stats{gap:9px}.np-stats span:nth-child(3){display:none}}
        @media(max-width:480px){.np-brand-copy strong{font-size:13px}.np-save{font-size:9px}.np-workspace{padding:8px}.np-editor{padding:24px 18px;font-size:14px;line-height:1.62}.np-paper:before{background:repeating-linear-gradient(to bottom,transparent 0,transparent 27px,var(--np-rule) 27px,var(--np-rule) 28px)}.np-stats span:nth-child(2){display:none}}
      `}</style>

      <input ref={fileInputRef} className="np-hidden" type="file" accept=".txt,.md,.html,.htm,text/plain,text/markdown,text/html" onChange={handleFileUpload} />
      <input ref={imageInputRef} className="np-hidden" type="file" accept="image/*" onChange={handleImageUpload} />

      <div className="np-topbar">
        <div className="np-brand">
          <div className="np-mark">N</div>
          <div className="np-brand-copy"><strong>Notepad</strong><div className="np-save">{formatSavedTime(savedAt)}</div></div>
        </div>
      </div>

      <div className="np-toolbar" aria-label="Notepad toolbar">
        <div className="np-toolgroup"><button className="np-btn" type="button" onClick={() => runCommand('undo')} title="Undo"><Undo2/></button><button className="np-btn" type="button" onClick={() => runCommand('redo')} title="Redo"><Redo2/></button></div>
        <div className="np-toolgroup">
          <select className="np-select np-heading" value={blockType} onChange={(event) => setHeading(event.target.value)} aria-label="Text style"><option value="p">Paragraph</option><option value="h1">Heading 1</option><option value="h2">Heading 2</option><option value="h3">Heading 3</option><option value="h4">Heading 4</option><option value="h5">Heading 5</option><option value="h6">Heading 6</option></select>
          <select className="np-select np-font" value={fontFamily} onChange={(event) => setFont(event.target.value)} aria-label="Font family"><option>Arial</option><option>Georgia</option><option>Verdana</option><option>Tahoma</option><option>Trebuchet MS</option><option>Times New Roman</option><option>Courier New</option></select>
        </div>
        <div className="np-toolgroup"><button className="np-btn" type="button" onClick={() => runCommand('bold')} title="Bold"><Bold/></button><button className="np-btn" type="button" onClick={() => runCommand('italic')} title="Italic"><Italic/></button><button className="np-btn" type="button" onClick={() => runCommand('underline')} title="Underline"><Underline/></button><button className="np-btn" type="button" onClick={() => runCommand('strikeThrough')} title="Strikethrough"><Strikethrough/></button><input className="np-color" type="color" value={textColor} onChange={(event) => setColor(event.target.value)} title="Text color" aria-label="Text color" /></div>
        <div className="np-toolgroup"><button className="np-btn" type="button" onClick={() => runCommand('justifyLeft')} title="Align left"><AlignLeft/></button><button className="np-btn" type="button" onClick={() => runCommand('justifyCenter')} title="Align center"><AlignCenter/></button><button className="np-btn" type="button" onClick={() => runCommand('justifyRight')} title="Align right"><AlignRight/></button><button className="np-btn" type="button" onClick={() => runCommand('insertUnorderedList')} title="Bulleted list"><List/></button><button className="np-btn" type="button" onClick={() => runCommand('insertOrderedList')} title="Numbered list"><ListOrdered/></button></div>
        <div className="np-toolgroup"><button className="np-btn" type="button" onClick={insertLink} title="Insert link"><Link2/></button><button className="np-btn" type="button" onClick={() => imageInputRef.current?.click()} title="Insert image"><ImagePlus/></button><button className="np-btn" type="button" onClick={insertTable} title="Insert table"><Table2/></button><button className="np-btn" type="button" onClick={insertDate} title="Insert date"><CalendarDays/></button></div>
        <div className="np-toolgroup"><button className="np-btn" type="button" disabled={!hasContent} onClick={() => void copyText()} title="Copy"><Copy/></button><button className="np-btn" type="button" disabled={!hasContent} onClick={downloadTxt} title="Download TXT"><FileText/></button><button className="np-btn" type="button" disabled={!hasContent} onClick={downloadHtml} title="Export HTML"><FileCode2/></button><button className="np-btn is-accent" type="button" disabled={!hasContent} onClick={() => void downloadPdf()} title="Download PDF"><Download/>PDF</button><button className="np-btn" type="button" disabled={!hasContent} onClick={clearEditor} title="Clear note"><Trash2/></button></div>
        <div className="np-toolgroup">
          <select className="np-select np-paper-mode" value={paperStyle} onChange={(event) => setPaperStyle(event.target.value as PaperStyle)} aria-label="Page background">
            <option value="notebook">Notebook</option>
            <option value="plain">Plain</option>
          </select>
        </div>
        <div className="np-toolgroup np-utility">
          <button className="np-btn" type="button" onClick={() => fileInputRef.current?.click()} title="Open a text, Markdown or HTML file"><Upload/><span>Upload</span></button>
          <button className="np-btn" type="button" disabled={!hasContent} onClick={() => void shareNote()} title="Share note"><Share2/><span>Share</span></button>
          <button className={`np-btn${listening ? ' is-recording' : ''}`} type="button" onClick={toggleSpeech} title="Speech to text">{listening ? <MicOff/> : <Mic/>}</button>
          <button className="np-btn" type="button" onClick={() => setDarkMode((value) => !value)} title="Toggle dark mode">{darkMode ? <Sun/> : <Moon/>}</button>
          <button className="np-btn" type="button" onClick={toggleFullscreen} title={fullscreen ? 'Exit full screen' : 'Full screen'}>{fullscreen ? <MinimizeIcon/> : <Maximize2/>}</button>
        </div>
      </div>

      <div className="np-workspace">
        <div className="np-paper-wrap" style={{ transform: `scale(${zoom / 100})`, marginBottom: `${Math.max(0, (zoom - 100) * 5.8)}px` }}>
          <div className="np-paper">
            <div ref={editorRef} className="np-editor" contentEditable suppressContentEditableWarning data-placeholder="Start writing here…" onInput={scheduleEditorSync} onBlur={flushEditor} spellCheck aria-label="Online notepad editor" />
          </div>
        </div>
      </div>

      <div className="np-statusbar">
        <div className="np-stats"><span>{stats.words} words</span><span>{stats.characters} characters</span><span>{stats.lines} lines</span></div>
        <div className="np-status-right"><span className="np-status-message" aria-live="polite">{status}</span><div className="np-zoom"><button className="np-btn" type="button" onClick={() => changeZoom(-25)} aria-label="Zoom out"><ZoomOut/></button><span className="np-zoom-value">{zoom}%</span><button className="np-btn" type="button" onClick={() => changeZoom(25)} aria-label="Zoom in"><ZoomIn/></button></div></div>
      </div>
    </div>
  );
}

function MinimizeIcon() {
  return <Maximize2 style={{ transform: 'rotate(45deg)' }} />;
}
