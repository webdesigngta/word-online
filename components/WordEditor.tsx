'use client';

import { ChangeEvent, ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { GoogleMaterialIcon } from '@/components/GoogleMaterialIcon';
import type { EditorRuntime } from '@/tools/word/editor/EditorRuntime';

const EMPTY_DOCUMENT = '<p><br></p>';

function runCommand(command: string, value?: string) {
  document.execCommand(command, false, value);
}

export function WordEditor({ runtime }: { runtime: EditorRuntime }) {
  const pagesRef = useRef<(HTMLDivElement | null)[]>([]);
  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const saveTimerRef = useRef<number | undefined>(undefined);
  const [pageCount, setPageCount] = useState(1);
  const [title, setTitle] = useState('Untitled document');
  const [zoom, setZoom] = useState(100);
  const [fontSize, setFontSize] = useState('11');
  const [spellCheck, setSpellCheck] = useState(true);

  const documentHtml = useCallback(() => pagesRef.current
    .slice(0, pageCount)
    .map((page) => page?.innerHTML ?? '')
    .join(''), [pageCount]);

  const save = useCallback((documentTitle = title) => {
    window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(() => {
      void runtime.draft.save({ title: documentTitle, html: documentHtml() });
    }, 400);
  }, [documentHtml, runtime, title]);

  const paginate = useCallback((start = 0) => {
    const pages = pagesRef.current;
    for (let index = Math.max(0, start); index < pageCount; index += 1) {
      const page = pages[index];
      if (!page) continue;
      while (page.scrollHeight > page.clientHeight && page.lastChild) {
        const next = pages[index + 1];
        if (!next) {
          setPageCount((count) => count + 1);
          window.requestAnimationFrame(() => paginate(index));
          return;
        }
        next.prepend(page.lastChild);
      }
      const next = pages[index + 1];
      while (next?.firstChild) {
        const candidate = next.firstChild;
        page.append(candidate);
        if (page.scrollHeight > page.clientHeight) {
          next.prepend(candidate);
          break;
        }
      }
    }
    while (pagesRef.current[pageCount - 1]?.childNodes.length === 0 && pageCount > 1) {
      setPageCount((count) => count - 1);
      break;
    }
  }, [pageCount]);

  const loadHtml = useCallback((html: string) => {
    setPageCount(1);
    window.requestAnimationFrame(() => {
      const first = pagesRef.current[0];
      if (!first) return;
      first.innerHTML = html || EMPTY_DOCUMENT;
      paginate(0);
    });
  }, [paginate]);

  useEffect(() => {
    let disposed = false;
    void runtime.draft.migrateLegacy().then((draft) => {
      if (disposed) return;
      if (draft) setTitle(draft.title);
      loadHtml(draft?.html || runtime.getInitialContent() || EMPTY_DOCUMENT);
    });
    return () => {
      disposed = true;
      window.clearTimeout(saveTimerRef.current);
    };
  }, [loadHtml, runtime]);

  function command(name: string, value?: string) {
    runCommand(name, value);
    save();
  }

  async function openFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > runtime.files.maxBytes) {
      window.alert('Please choose a file smaller than 20 MB.');
      return;
    }
    const result = await runtime.files.open(file);
    setTitle(result.title);
    loadHtml(result.html);
    event.target.value = '';
  }

  function insertImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === 'string' && command('insertImage', reader.result);
    reader.readAsDataURL(file);
    event.target.value = '';
  }

  return (
    <section className="word-app docs-word-app" aria-label="Document editor">
      <input ref={fileInputRef} className="hidden-input" type="file" accept=".docx,.html,.htm,.txt" onChange={openFile} />
      <input ref={imageInputRef} className="hidden-input" type="file" accept="image/*" onChange={insertImage} />
      <header className="docs-chrome">
        <div className="docs-topbar">
          <a className="docs-file-link" href="/" aria-label="Home"><GoogleMaterialIcon name="description" /></a>
          <input className="docs-document-title" aria-label="Document name" value={title} onChange={(event) => { setTitle(event.target.value); save(event.target.value); }} />
          <div className="docs-primary-actions">
            <ToolbarButton label="Open document" onClick={() => fileInputRef.current?.click()}><GoogleMaterialIcon name="folder_open" /></ToolbarButton>
            <ToolbarButton label="Download DOCX" onClick={() => canvasRef.current && void runtime.files.exportDocx(canvasRef.current, title)}><GoogleMaterialIcon name="download" /></ToolbarButton>
            <ToolbarButton label="Settings" onClick={() => setSpellCheck((value) => !value)}><GoogleMaterialIcon name="settings" /></ToolbarButton>
            <a className="docs-help-button" href="/supported-formats" aria-label="Help" title="Help"><GoogleMaterialIcon name="help" /></a>
          </div>
        </div>
        <div className="docs-toolbar" aria-label="Formatting toolbar">
          <ToolbarButton label="Undo" onClick={() => command('undo')}><GoogleMaterialIcon name="undo" /></ToolbarButton>
          <ToolbarButton label="Redo" onClick={() => command('redo')}><GoogleMaterialIcon name="redo" /></ToolbarButton>
          <Divider />
          <select className="docs-toolbar-select docs-zoom-select" aria-label="Zoom" value={zoom} onChange={(event) => setZoom(Number(event.target.value))}><option>75</option><option>100</option><option>125</option><option>150</option></select>
          <Divider />
          <select className="docs-toolbar-select docs-style-select" aria-label="Paragraph style" defaultValue="p" onChange={(event) => command('formatBlock', event.target.value)}><option value="p">Normal text</option><option value="h1">Heading 1</option><option value="h2">Heading 2</option><option value="h3">Heading 3</option></select>
          <select className="docs-toolbar-select docs-font-select" aria-label="Font" defaultValue="Arial" onChange={(event) => command('fontName', event.target.value)}><option>Arial</option><option>Georgia</option><option>Times New Roman</option></select>
          <input className="docs-font-size-input" aria-label="Font size" value={fontSize} onChange={(event) => setFontSize(event.target.value)} onBlur={() => command('fontSize', '3')} />
          <Divider />
          <ToolbarButton label="Bold" onClick={() => command('bold')}><GoogleMaterialIcon name="format_bold" /></ToolbarButton>
          <ToolbarButton label="Italic" onClick={() => command('italic')}><GoogleMaterialIcon name="format_italic" /></ToolbarButton>
          <ToolbarButton label="Underline" onClick={() => command('underline')}><GoogleMaterialIcon name="format_underlined" /></ToolbarButton>
          <Divider />
          <ToolbarButton label="Insert link" onClick={() => { const url = window.prompt('Enter a URL'); if (url) command('createLink', url); }}><GoogleMaterialIcon name="link" /></ToolbarButton>
          <ToolbarButton label="Insert image" onClick={() => imageInputRef.current?.click()}><GoogleMaterialIcon name="image" /></ToolbarButton>
          <ToolbarButton label="Bulleted list" onClick={() => command('insertUnorderedList')}><GoogleMaterialIcon name="format_list_bulleted" /></ToolbarButton>
          <ToolbarButton label="Numbered list" onClick={() => command('insertOrderedList')}><GoogleMaterialIcon name="format_list_numbered" /></ToolbarButton>
          <ToolbarButton label="Align left" onClick={() => command('justifyLeft')}><GoogleMaterialIcon name="format_align_left" /></ToolbarButton>
        </div>
      </header>
      <main className="docs-editor-workspace">
        <div ref={canvasRef} className="docs-pages" style={{ zoom: zoom / 100 }}>
          {Array.from({ length: pageCount }, (_, index) => (
            <div
              key={index}
              ref={(node) => { pagesRef.current[index] = node; }}
              className="editor-page"
              contentEditable
              suppressContentEditableWarning
              spellCheck={spellCheck}
              aria-label={`Document page ${index + 1}`}
              onInput={() => { paginate(index); save(); }}
            />
          ))}
        </div>
      </main>
    </section>
  );
}

function ToolbarButton({ label, children, onClick }: { label: string; children: ReactNode; onClick: () => void }) {
  return <button className="docs-toolbar-button" type="button" title={label} aria-label={label} onMouseDown={(event) => event.preventDefault()} onClick={onClick}>{children}</button>;
}

function Divider() {
  return <span className="docs-toolbar-divider" aria-hidden="true" />;
}
