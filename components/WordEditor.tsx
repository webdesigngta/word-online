'use client';

import {
  Bold,
  Check,
  ChevronDown,
  Copy,
  Download,
  FilePlus2,
  FileText,
  FolderOpen,
  History,
  Image as ImageIcon,
  Italic,
  Link as LinkIcon,
  LockKeyhole,
  MessageSquare,
  Minus,
  Plus,
  Printer,
  Redo2,
  RemoveFormatting,
  Save,
  Scissors,
  Search,
  Sparkles,
  SpellCheck2,
  Table as TableIcon,
  Underline,
  Undo2,
  Video,
} from 'lucide-react';
import { ChangeEvent, ReactNode, useEffect, useRef, useState } from 'react';
import { GoogleMaterialIcon } from '@/components/GoogleMaterialIcon';
import type { EditorRuntime } from '@/tools/word/editor/EditorRuntime';

const defaultDocument = '<p><br></p>';

type MenuName = 'File' | 'Edit' | 'View' | 'Insert' | 'Format' | 'Tools' | 'Extensions' | 'Help';
type MenuItem = { label: string; icon: ReactNode; action: () => void };

function runCommand(command: string, value?: string) {
  document.execCommand(command, false, value);
}

export function WordEditor({ runtime }: { runtime: EditorRuntime }) {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const savedRangeRef = useRef<Range | null>(null);

  const [title, setTitle] = useState('Untitled document');
  const [zoom, setZoom] = useState(100);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [savedState, setSavedState] = useState<'Saved' | 'Saving…'>('Saved');
  const [notice, setNotice] = useState('Ready');
  const [fontFamily, setFontFamily] = useState('Arial');
  const [fontSize, setFontSize] = useState('11');
  const [openMenu, setOpenMenu] = useState<MenuName | null>(null);
  const [spellCheckEnabled, setSpellCheckEnabled] = useState(true);

  useEffect(() => {
    let disposed = false;

    void runtime.draft.migrateLegacy().then((draft) => {
      if (disposed) return;
      if (draft) {
        setTitle(draft.title);
        if (editorRef.current) editorRef.current.innerHTML = draft.html;
      } else if (editorRef.current) {
        editorRef.current.innerHTML = runtime.getInitialContent() || defaultDocument;
      }
      refreshCounts();
    });

    return () => {
      disposed = true;
    };
  }, [runtime]);

  function saveSelection() {
    const selection = window.getSelection();
    if (!selection?.rangeCount || !editorRef.current) return;
    const range = selection.getRangeAt(0);
    if (editorRef.current.contains(range.commonAncestorContainer)) {
      savedRangeRef.current = range.cloneRange();
    }
  }

  function restoreSelection() {
    const range = savedRangeRef.current;
    if (!range) return;
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
  }

  function refreshCounts() {
    const text = editorRef.current?.innerText ?? '';
    const trimmed = text.trim();
    setWordCount(trimmed ? trimmed.split(/\s+/).length : 0);
    setCharCount(text.length);
  }

  function onEditorInput(documentTitle = title) {
    refreshCounts();
    setSavedState('Saving…');
    window.clearTimeout((window as typeof window & { __fwoSaveTimer?: number }).__fwoSaveTimer);
    (window as typeof window & { __fwoSaveTimer?: number }).__fwoSaveTimer = window.setTimeout(() => {
      try {
        if (!editorRef.current) return;
        void runtime.draft.save({ title: documentTitle, html: editorRef.current.innerHTML })
          .then(() => setSavedState('Saved'))
          .catch(() => {
            setSavedState('Saved');
            setNotice('Local autosave is full — download a copy');
          });
      } catch {
        setSavedState('Saved');
        setNotice('Local autosave is full — download a copy');
      }
    }, 500);
  }

  function command(name: string, value?: string) {
    restoreSelection();
    editorRef.current?.focus({ preventScroll: true });
    runCommand(name, value);
    saveSelection();
    onEditorInput();
  }

  function applyFont(value: string) {
    setFontFamily(value);
    command('fontName', value);
  }

  function applyFontSize(value: string) {
    const numericSize = Math.min(96, Math.max(6, Number(value) || 11));
    const normalized = String(numericSize);
    setFontSize(normalized);
    restoreSelection();
    const selection = window.getSelection();
    if (!selection?.rangeCount) return;
    const range = selection.getRangeAt(0);
    if (!editorRef.current?.contains(range.commonAncestorContainer)) return;
    const span = document.createElement('span');
    span.style.fontSize = `${normalized}pt`;
    try {
      range.surroundContents(span);
    } catch {
      command('fontSize', '3');
      const fonts = editorRef.current.querySelectorAll('font[size="3"]');
      fonts.forEach((node) => {
        (node as HTMLElement).removeAttribute('size');
        (node as HTMLElement).style.fontSize = `${normalized}pt`;
      });
    }
    saveSelection();
    onEditorInput();
  }

  async function openFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > runtime.files.maxBytes) {
      setNotice('Please choose a file smaller than 20 MB');
      event.target.value = '';
      return;
    }

    setNotice(`Opening ${file.name}…`);
    try {
      const result = await runtime.files.open(file);
      setTitle(result.title);
      if (editorRef.current) editorRef.current.innerHTML = result.html;
      setNotice(result.warnings.length ? 'Opened DOCX with conversion notes' : `${result.format.toUpperCase()} opened`);
      onEditorInput(result.title);
    } catch (error) {
      console.error(error);
      setNotice('Could not open that file');
    } finally {
      event.target.value = '';
    }
  }

  async function downloadDocx() {
    if (!editorRef.current) return;
    setNotice('Preparing DOCX…');
    try {
      await runtime.files.exportDocx(editorRef.current, title);
      setNotice('DOCX downloaded');
    } catch (error) {
      console.error(error);
      setNotice('Could not export DOCX');
    }
  }

  function downloadHtml() {
    runtime.files.exportHtml(editorRef.current?.innerHTML ?? '', title);
    setNotice('HTML downloaded');
  }

  function insertLink() {
    const url = window.prompt('Enter a URL');
    if (url) command('createLink', url);
  }

  function insertTable() {
    const rawRows = window.prompt('Rows', '3');
    const rawCols = window.prompt('Columns', '3');
    const rows = Math.min(20, Math.max(1, Number(rawRows) || 0));
    const cols = Math.min(12, Math.max(1, Number(rawCols) || 0));
    if (!rows || !cols) return;
    const html = `<table><tbody>${Array.from({ length: rows }, () => `<tr>${Array.from({ length: cols }, () => '<td><br></td>').join('')}</tr>`).join('')}</tbody></table><p><br></p>`;
    command('insertHTML', html);
  }

  function insertImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') command('insertImage', reader.result);
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  }

  function insertHorizontalLine() {
    command('insertHorizontalRule');
  }

  function newDocument() {
    if (!window.confirm('Start a new document? Your current local draft will be replaced.')) return;
    if (editorRef.current) editorRef.current.innerHTML = '<p><br></p>';
    setTitle('Untitled document');
    void runtime.draft.clear();
    refreshCounts();
    setNotice('New document');
  }

  function printDocument() {
    setOpenMenu(null);
    window.print();
  }

  function findText() {
    const term = window.prompt('Find text');
    if (!term) return;
    const browserFind = (window as typeof window & { find?: (...args: unknown[]) => boolean }).find;
    browserFind?.call(window, term, false, false, true, false, true, false);
  }

  async function shareDocument() {
    setOpenMenu(null);
    try {
      if (navigator.share) {
        await navigator.share({ title, url: window.location.href });
        setNotice('Share sheet opened');
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.href);
        setNotice('Editor link copied');
      } else {
        setNotice('Copy the page address to share');
      }
    } catch {
      setNotice('Share cancelled');
    }
  }

  function showWordCount() {
    setNotice(`${wordCount} words · ${charCount} characters`);
    setOpenMenu(null);
  }

  function setZoomLevel(value: number) {
    setZoom(Math.min(200, Math.max(50, value)));
  }

  const menuItems: Record<MenuName, MenuItem[]> = {
    File: [
      { label: 'New document', icon: <FilePlus2 />, action: newDocument },
      { label: 'Open file', icon: <FolderOpen />, action: () => fileInputRef.current?.click() },
      { label: 'Download DOCX', icon: <Download />, action: downloadDocx },
      { label: 'Download HTML', icon: <Save />, action: downloadHtml },
      { label: 'Print / Save as PDF', icon: <Printer />, action: printDocument },
    ],
    Edit: [
      { label: 'Undo', icon: <Undo2 />, action: () => command('undo') },
      { label: 'Redo', icon: <Redo2 />, action: () => command('redo') },
      { label: 'Cut', icon: <Scissors />, action: () => command('cut') },
      { label: 'Copy', icon: <Copy />, action: () => command('copy') },
      { label: 'Find', icon: <Search />, action: findText },
    ],
    View: [
      { label: 'Zoom in', icon: <Plus />, action: () => setZoomLevel(zoom + 10) },
      { label: 'Zoom out', icon: <Minus />, action: () => setZoomLevel(zoom - 10) },
      { label: 'Reset zoom', icon: <Check />, action: () => setZoomLevel(100) },
    ],
    Insert: [
      { label: 'Image', icon: <ImageIcon />, action: () => imageInputRef.current?.click() },
      { label: 'Table', icon: <TableIcon />, action: insertTable },
      { label: 'Link', icon: <LinkIcon />, action: insertLink },
      { label: 'Horizontal line', icon: <Minus />, action: insertHorizontalLine },
    ],
    Format: [
      { label: 'Bold', icon: <Bold />, action: () => command('bold') },
      { label: 'Italic', icon: <Italic />, action: () => command('italic') },
      { label: 'Underline', icon: <Underline />, action: () => command('underline') },
      { label: 'Clear formatting', icon: <RemoveFormatting />, action: () => command('removeFormat') },
    ],
    Tools: [
      { label: 'Spelling', icon: <SpellCheck2 />, action: () => setSpellCheckEnabled((value) => !value) },
      { label: 'Word count', icon: <FileText />, action: showWordCount },
      { label: 'Find', icon: <Search />, action: findText },
    ],
    Extensions: [
      { label: 'Add-ons coming soon', icon: <Sparkles />, action: () => setNotice('Extensions are coming soon') },
    ],
    Help: [
      { label: 'Keyboard shortcuts', icon: <FileText />, action: () => setNotice('Ctrl/Cmd+B bold · Ctrl/Cmd+I italic · Ctrl/Cmd+U underline · Ctrl/Cmd+Z undo') },
      { label: 'About Free Word Online', icon: <Sparkles />, action: () => setNotice('Free Word Online — browser-based document editor') },
    ],
  };

  const menus: MenuName[] = ['File', 'Edit', 'View', 'Insert', 'Format', 'Tools', 'Extensions', 'Help'];

  return (
    <section className="word-app docs-word-app" aria-label="Free Word Online editor">
      <input ref={fileInputRef} className="hidden-input" type="file" accept=".docx,.html,.htm,.txt" onChange={openFile} />
      <input ref={imageInputRef} className="hidden-input" type="file" accept="image/*" onChange={insertImage} />

      <header className="docs-chrome">
        <div className="docs-topbar">
          <div className="docs-left">
            <a className="docs-file-link" href="../" aria-label="Free Word Online home" title="Free Word Online">
              <span className="docs-file-glyph"><FileText /></span>
            </a>

            <div className="docs-title-stack">
              <div className="docs-title-line">
                <input
                  aria-label="Document name"
                  className="docs-document-title"
                  value={title}
                  onChange={(event) => {
                    setTitle(event.target.value);
                    onEditorInput(event.target.value);
                  }}
                />
                <button className="docs-title-icon" type="button" title="Star" aria-label="Star document" onClick={() => setNotice('Starred')}><GoogleMaterialIcon name="star" /></button>
                <button className="docs-title-icon" type="button" title="Move" aria-label="Move document" onClick={() => setNotice('Saved locally in this browser')}><GoogleMaterialIcon name="drive_file_move" /></button>
                <button
                  className="docs-title-icon docs-save-cloud"
                  data-saving={savedState === 'Saving…'}
                  type="button"
                  title={savedState}
                  aria-label={savedState}
                  onClick={() => setNotice(savedState)}
                ><GoogleMaterialIcon name="cloud_done" /></button>
              </div>

              <nav className="docs-menu-row" aria-label="Document menus">
                {menus.map((menu) => (
                  <div className="docs-menu-wrap" key={menu}>
                    <button
                      className="docs-menu-button"
                      type="button"
                      aria-expanded={openMenu === menu}
                      onClick={() => setOpenMenu((current) => current === menu ? null : menu)}
                    >{menu}</button>
                    {openMenu === menu && (
                      <div className="docs-menu-popover" role="menu">
                        {menuItems[menu].map((item) => (
                          <button
                            className="docs-menu-item"
                            type="button"
                            role="menuitem"
                            key={item.label}
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => { setOpenMenu(null); item.action(); }}
                          >{item.icon}<span>{item.label}</span></button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </nav>
            </div>
          </div>

          <div className="docs-right">
            <button className="docs-top-icon" type="button" title="Version history" aria-label="Version history" onClick={() => setNotice('Local autosave is active')}><History /></button>
            <button className="docs-top-icon" type="button" title="Comments" aria-label="Comments" onClick={() => setNotice('Comments are coming soon')}><MessageSquare /></button>
            <button className="docs-top-icon docs-video-button" type="button" title="Video call" aria-label="Video call" onClick={() => setNotice('Video collaboration is coming soon')}><Video /><ChevronDown className="tiny-chevron" /></button>
            <button className="docs-action-pill docs-pdf-button" type="button" onClick={printDocument}><span className="docs-pdf-icon">PDF</span><span>Convert to PDF</span></button>
            <button className="docs-share-button" type="button" onClick={shareDocument}><LockKeyhole /><span>Share</span><ChevronDown className="tiny-chevron" /></button>
            <button className="docs-upgrade-button" type="button" onClick={() => setNotice('Core editing stays free')}>Upgrade</button>
            <span className="docs-gem" title="AI tools"><Sparkles /></span>
            <button className="docs-avatar" type="button" title="Account" aria-label="Account">K</button>
          </div>
        </div>

        <div className="docs-toolbar" aria-label="Formatting toolbar">
          <div className="docs-toolbar-group docs-toolbar-history-group">
            <ToolbarButton label="Search menus" className="docs-toolbar-search" onClick={findText}><GoogleMaterialIcon name="search" /></ToolbarButton>
            <ToolbarButton label="Undo" onClick={() => command('undo')}><GoogleMaterialIcon name="undo" /></ToolbarButton>
            <ToolbarButton label="Redo" onClick={() => command('redo')}><GoogleMaterialIcon name="redo" /></ToolbarButton>
            <ToolbarButton label="Print" onClick={printDocument}><GoogleMaterialIcon name="print" /></ToolbarButton>
            <ToolbarButton label={spellCheckEnabled ? 'Spelling on' : 'Spelling off'} onClick={() => setSpellCheckEnabled((value) => !value)}><GoogleMaterialIcon name="spellcheck" /></ToolbarButton>
            <ToolbarButton label="Paint format" onClick={() => setNotice('Paint format is coming soon')}><GoogleMaterialIcon name="format_paint" /></ToolbarButton>
          </div>

          <ToolbarDivider />

          <div className="docs-toolbar-group docs-toolbar-zoom-group"><select className="docs-toolbar-select docs-zoom-select" aria-label="Zoom" value={zoom} onChange={(event) => setZoomLevel(Number(event.target.value))}>
            <option value={50}>50%</option>
            <option value={75}>75%</option>
            <option value={90}>90%</option>
            <option value={100}>100%</option>
            <option value={125}>125%</option>
            <option value={150}>150%</option>
            <option value={200}>200%</option>
          </select></div>

          <ToolbarDivider />

          <div className="docs-toolbar-group docs-toolbar-style-group"><select className="docs-toolbar-select docs-style-select" aria-label="Paragraph style" defaultValue="p" onMouseDown={() => saveSelection()} onChange={(event) => command('formatBlock', event.target.value)}>
            <option value="p">Normal text</option>
            <option value="h1">Title</option>
            <option value="h2">Heading 1</option>
            <option value="h3">Heading 2</option>
          </select></div>

          <ToolbarDivider />

          <div className="docs-toolbar-group docs-toolbar-font-group"><select className="docs-toolbar-select docs-font-select" aria-label="Font family" value={fontFamily} onMouseDown={() => saveSelection()} onChange={(event) => applyFont(event.target.value)}>
            <option>Arial</option>
            <option>Calibri</option>
            <option>Georgia</option>
            <option>Times New Roman</option>
            <option>Verdana</option>
            <option>Courier New</option>
          </select></div>

          <ToolbarDivider />

          <div className="docs-toolbar-group"><div className="docs-font-size-control">
            <button className="docs-toolbar-split" type="button" title="Decrease font size" aria-label="Decrease font size" onMouseDown={(event) => event.preventDefault()} onClick={() => applyFontSize(String(Number(fontSize) - 1))}><GoogleMaterialIcon name="remove" /></button>
            <input
              className="docs-font-size-input"
              aria-label="Font size"
              value={fontSize}
              onMouseDown={() => saveSelection()}
              onChange={(event) => setFontSize(event.target.value)}
              onBlur={(event) => applyFontSize(event.target.value)}
              onKeyDown={(event) => { if (event.key === 'Enter') applyFontSize(fontSize); }}
            />
            <button className="docs-toolbar-split" type="button" title="Increase font size" aria-label="Increase font size" onMouseDown={(event) => event.preventDefault()} onClick={() => applyFontSize(String(Number(fontSize) + 1))}><GoogleMaterialIcon name="add" /></button>
          </div></div>

          <ToolbarDivider />

          <div className="docs-toolbar-group docs-toolbar-format-group"><ToolbarButton label="Bold" onClick={() => command('bold')}><GoogleMaterialIcon name="format_bold" /></ToolbarButton>
          <ToolbarButton label="Italic" onClick={() => command('italic')}><GoogleMaterialIcon name="format_italic" /></ToolbarButton>
          <ToolbarButton label="Underline" onClick={() => command('underline')}><GoogleMaterialIcon name="format_underlined" /></ToolbarButton>

          <label className="docs-color-tool" title="Text color" onMouseDown={() => saveSelection()}><GoogleMaterialIcon name="format_color_text" /><input aria-label="Text color" type="color" onChange={(event) => command('foreColor', event.target.value)} /></label>
          <label className="docs-color-tool highlight" title="Highlight color" onMouseDown={() => saveSelection()}><GoogleMaterialIcon name="ink_highlighter" /><input aria-label="Highlight color" type="color" defaultValue="#fdd663" onChange={(event) => command('hiliteColor', event.target.value)} /></label></div>

          <ToolbarDivider />

          <div className="docs-toolbar-group"><ToolbarButton label="Insert link" onClick={insertLink}><GoogleMaterialIcon name="link" /></ToolbarButton>
          <ToolbarButton label="Add comment" onClick={() => setNotice('Comments are coming soon')}><GoogleMaterialIcon name="add_comment" /></ToolbarButton>
          <div className="docs-toolbar-combo">
            <ToolbarButton label="Insert image" onClick={() => imageInputRef.current?.click()}><GoogleMaterialIcon name="image" /></ToolbarButton>
            <button className="docs-toolbar-split" type="button" title="Image options" aria-label="Image options" onClick={() => setNotice('Choose an image from your device')}><GoogleMaterialIcon name="arrow_drop_down" /></button>
          </div></div>

          <ToolbarDivider />

          <div className="docs-toolbar-group docs-toolbar-paragraph-group"><div className="docs-toolbar-combo">
            <ToolbarButton label="Align left" onClick={() => command('justifyLeft')}><GoogleMaterialIcon name="format_align_left" /></ToolbarButton>
            <button className="docs-toolbar-split" type="button" title="Alignment options" aria-label="Alignment options" onClick={() => setNotice('Use Format for more alignment options')}><GoogleMaterialIcon name="arrow_drop_down" /></button>
          </div>
          <ToolbarButton label="Line spacing" onClick={() => setNotice('Line spacing options are coming soon')}><GoogleMaterialIcon name="format_line_spacing" /></ToolbarButton>
          <div className="docs-toolbar-combo">
            <ToolbarButton label="Checklist" onClick={() => command('insertUnorderedList')}><GoogleMaterialIcon name="checklist" /></ToolbarButton>
            <button className="docs-toolbar-split" type="button" title="Checklist options" aria-label="Checklist options"><GoogleMaterialIcon name="arrow_drop_down" /></button>
          </div>
          <ToolbarButton label="Bulleted list" onClick={() => command('insertUnorderedList')}><GoogleMaterialIcon name="format_list_bulleted" /></ToolbarButton>
          <ToolbarButton label="Numbered list" onClick={() => command('insertOrderedList')}><GoogleMaterialIcon name="format_list_numbered" /></ToolbarButton>
          <ToolbarButton label="Decrease indent" onClick={() => command('outdent')}><GoogleMaterialIcon name="format_indent_decrease" /></ToolbarButton>
          <ToolbarButton label="Increase indent" onClick={() => command('indent')}><GoogleMaterialIcon name="format_indent_increase" /></ToolbarButton>
          <ToolbarButton label="Clear formatting" onClick={() => command('removeFormat')}><GoogleMaterialIcon name="format_clear" /></ToolbarButton></div>

          <ToolbarDivider />

          <div className="docs-toolbar-group docs-toolbar-mode-group"><div className="docs-toolbar-combo">
            <ToolbarButton label="Editing mode" onClick={() => setNotice('Editing mode')}><GoogleMaterialIcon name="edit" /></ToolbarButton>
            <button className="docs-toolbar-split" type="button" title="Editing mode options" aria-label="Editing mode options"><GoogleMaterialIcon name="arrow_drop_down" /></button>
          </div></div>
          <span className="docs-toolbar-right-spacer" />
          <ToolbarButton label="Hide toolbar" onClick={() => setNotice('Toolbar pinned')}><GoogleMaterialIcon name="keyboard_arrow_up" /></ToolbarButton>
        </div>
      </header>

      <div className="editor-workspace docs-editor-workspace" onMouseDown={() => setOpenMenu(null)}>
        <div className="ruler" aria-hidden="true"><span>0</span><span>1</span><span>2</span><span>3</span><span>4</span><span>5</span><span>6</span><span>7</span></div>
        <div className="paper-stage">
          <div
            ref={editorRef}
            className="editor-page"
            contentEditable
            suppressContentEditableWarning
            spellCheck={spellCheckEnabled}
            onInput={() => { onEditorInput(); saveSelection(); }}
            onMouseUp={saveSelection}
            onKeyUp={saveSelection}
            onFocus={saveSelection}
            style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
            aria-label="Document editing area"
          />
        </div>
      </div>

      <div className="docs-statusbar">
        <div><span>{notice}</span><span>{wordCount} words</span><span>{charCount} characters</span></div>
        <div><button type="button" onClick={() => setZoomLevel(zoom - 10)}>−</button><span>{zoom}%</span><input aria-label="Zoom" type="range" min="50" max="200" step="10" value={zoom} onChange={(event) => setZoomLevel(Number(event.target.value))} /><button type="button" onClick={() => setZoomLevel(zoom + 10)}>+</button></div>
      </div>
    </section>
  );
}

function ToolbarButton({ label, children, onClick, className = '' }: { label: string; children: ReactNode; onClick: () => void; className?: string }) {
  return (
    <button className={`docs-toolbar-button ${className}`} type="button" title={label} aria-label={label} onMouseDown={(event) => event.preventDefault()} onClick={onClick}>
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return <span className="docs-toolbar-divider" aria-hidden="true" />;
}
