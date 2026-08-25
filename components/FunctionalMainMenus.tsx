'use client';

import {
  AlignLeft, Bold, CheckSquare, Download, FilePlus2, FileText, FolderOpen, Fullscreen,
  Image as ImageIcon, IndentDecrease, IndentIncrease, Italic, Link, List, ListOrdered,
  MessageSquare, Printer, Redo2, RemoveFormatting, Search, SpellCheck2, Type, Underline,
  Undo2, X,
} from 'lucide-react';
import { ComponentType, CSSProperties, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

type Icon = ComponentType<{ size?: number; strokeWidth?: number }>;
type MenuEntry = { label: string; icon?: Icon; shortcut?: string; action?: () => void; children?: MenuEntry[]; separatorBefore?: boolean };
type MenuMap = Record<string, MenuEntry[]>;

function ed() { return document.querySelector<HTMLElement>('.editor-page'); }
function titleInput() { return document.querySelector<HTMLInputElement>('.docs-document-title'); }

function toolbar(label: string) {
  const el = Array.from(document.querySelectorAll<HTMLButtonElement>('.docs-toolbar button')).find((button) => (button.getAttribute('aria-label') || button.getAttribute('title')) === label);
  el?.click();
}

function legacy(menu: string, item: string) {
  const menuButton = Array.from(document.querySelectorAll<HTMLButtonElement>('.docs-menu-button')).find((button) => button.textContent?.trim() === menu);
  if (!menuButton) return;
  menuButton.click();
  window.setTimeout(() => {
    const itemButton = Array.from(document.querySelectorAll<HTMLButtonElement>('.docs-menu-item')).find((button) => button.textContent?.trim() === item);
    itemButton?.click();
  }, 0);
}

function exec(name: string, value?: string) {
  ed()?.focus({ preventScroll: true });
  document.execCommand(name, false, value);
  ed()?.dispatchEvent(new Event('input', { bubbles: true }));
}

function downloadText() {
  const content = ed()?.innerText ?? '';
  const name = (titleInput()?.value || 'Untitled document').replace(/[\\/:*?"<>|]+/g, '').trim() || 'Untitled document';
  const url = URL.createObjectURL(new Blob([content], { type: 'text/plain;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `${name}.txt`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function renameDocument() {
  const input = titleInput();
  input?.focus();
  input?.select();
}

function selectAllDocument() {
  const editor = ed();
  if (!editor) return;
  const range = document.createRange();
  range.selectNodeContents(editor);
  const selection = window.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);
  editor.focus({ preventScroll: true });
}

function findReplace() {
  const editor = ed();
  if (!editor) return;
  const find = window.prompt('Find text');
  if (!find) return;
  const replace = window.prompt(`Replace “${find}” with`, '');
  if (replace === null) return;
  const all = window.confirm('Replace all matches? Choose Cancel to replace only the first match.');
  const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  let node: Node | null;
  while ((node = walker.nextNode())) nodes.push(node as Text);
  let changed = false;
  for (const textNode of nodes) {
    const current = textNode.nodeValue || '';
    if (!current.includes(find)) continue;
    textNode.nodeValue = all ? current.split(find).join(replace) : current.replace(find, replace);
    changed = true;
    if (!all) break;
  }
  if (changed) editor.dispatchEvent(new Event('input', { bubbles: true }));
  else window.alert('No matches found.');
}

function chooseParagraphStyle(label: string) {
  const trigger = document.querySelector<HTMLButtonElement>('.fwo-style-trigger');
  trigger?.click();
  window.setTimeout(() => {
    const option = Array.from(document.querySelectorAll<HTMLButtonElement>('.fwo-style-item')).find((button) => button.textContent?.trim() === label);
    option?.click();
  }, 0);
}

function chooseMode(label: string) {
  const trigger = document.querySelector<HTMLButtonElement>('button[aria-label="Editing mode options"]');
  trigger?.click();
  window.setTimeout(() => {
    const option = Array.from(document.querySelectorAll<HTMLButtonElement>('.fwo-local-popover button')).find((button) => button.textContent?.trim().startsWith(label));
    option?.click();
  }, 0);
}

function applySpacing(value: string) {
  const editor = ed();
  if (!editor) return;
  const selection = window.getSelection();
  if (!selection?.rangeCount) return;
  const range = selection.getRangeAt(0);
  let node: Node | null = range.startContainer;
  if (node.nodeType === Node.TEXT_NODE) node = node.parentElement;
  const block = node instanceof HTMLElement ? node.closest<HTMLElement>('p,h1,h2,h3,h4,h5,h6,li,div') : null;
  if (block && editor.contains(block)) {
    block.style.lineHeight = value;
    editor.dispatchEvent(new Event('input', { bubbles: true }));
  }
}

function togglePageOrientation() {
  const editor = ed();
  if (!editor) return;
  const landscape = editor.classList.toggle('fwo-landscape-page');
  editor.setAttribute('data-orientation', landscape ? 'landscape' : 'portrait');
}

function reviewSuggestions() {
  const editor = ed();
  if (!editor) return;
  const insertions = Array.from(editor.querySelectorAll<HTMLElement>('ins[data-fwo-suggestion="insert"]'));
  const deletions = Array.from(editor.querySelectorAll<HTMLElement>('del[data-fwo-suggestion="delete"]'));
  if (!insertions.length && !deletions.length) {
    window.alert('There are no suggested edits to review.');
    return;
  }
  if (window.confirm(`Accept all ${insertions.length + deletions.length} suggested edits?`)) {
    insertions.forEach((item) => item.replaceWith(...Array.from(item.childNodes)));
    deletions.forEach((item) => item.remove());
  } else if (window.confirm('Reject all suggested edits instead?')) {
    insertions.forEach((item) => item.remove());
    deletions.forEach((item) => item.replaceWith(...Array.from(item.childNodes)));
  } else return;
  editor.normalize();
  editor.dispatchEvent(new Event('input', { bubbles: true }));
}

export function FunctionalMainMenus() {
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [sub, setSub] = useState<string | null>(null);
  const [sidebar, setSidebar] = useState(true);
  const [ruler, setRuler] = useState(true);
  const [marks, setMarks] = useState(false);
  const [printLayout, setPrintLayout] = useState(true);
  const [menuPosition, setMenuPosition] = useState<CSSProperties>({});
  const triggerRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    setTarget(document.querySelector<HTMLElement>('.docs-title-stack'));
  }, []);

  useEffect(() => {
    if (!open) return;

    const closeOutside = (event: MouseEvent) => {
      const row = document.querySelector<HTMLElement>('.fwo-main-menu-row');
      if (row?.contains(event.target as Node) || (event.target as Element).closest?.('.fwo-menu-layer')) return;
      setOpen(null);
      setSub(null);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setOpen(null);
      setSub(null);
    };
    const closeOnBlur = () => {
      setOpen(null);
      setSub(null);
    };

    document.addEventListener('mousedown', closeOutside, true);
    document.addEventListener('contextmenu', closeOutside, true);
    window.addEventListener('keydown', closeOnEscape);
    window.addEventListener('blur', closeOnBlur);
    return () => {
      document.removeEventListener('mousedown', closeOutside, true);
      document.removeEventListener('contextmenu', closeOutside, true);
      window.removeEventListener('keydown', closeOnEscape);
      window.removeEventListener('blur', closeOnBlur);
    };
  }, [open]);

  useLayoutEffect(() => {
    if (!open) return;
    const align = () => {
      const rect = triggerRefs.current[open]?.getBoundingClientRect();
      if (!rect) return;
      setMenuPosition({ top: rect.bottom + 2, left: Math.max(8, Math.min(rect.left, window.innerWidth - 302)) });
    };
    align();
    window.addEventListener('resize', align);
    window.addEventListener('scroll', align, true);
    return () => {
      window.removeEventListener('resize', align);
      window.removeEventListener('scroll', align, true);
    };
  }, [open]);

  function close() {
    setOpen(null);
    setSub(null);
  }

  function run(action?: () => void) {
    close();
    action?.();
  }

  function toggleSidebar() {
    const outline = document.querySelector<HTMLElement>('.fwo-outline');
    const next = !sidebar;
    setSidebar(next);
    if (outline) outline.style.display = next ? '' : 'none';
  }

  function toggleRuler() {
    const el = document.querySelector<HTMLElement>('.docs-editor-workspace .ruler');
    const next = !ruler;
    setRuler(next);
    if (el) el.style.display = next ? '' : 'none';
  }

  function toggleMarks() {
    const next = !marks;
    setMarks(next);
    ed()?.classList.toggle('fwo-show-marks', next);
  }

  function togglePrintLayout() {
    const next = !printLayout;
    setPrintLayout(next);
    document.querySelector('.docs-editor-workspace')?.classList.toggle('fwo-no-print-layout', !next);
  }

  function fullscreen() {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
    else document.exitFullscreen?.();
  }

  const menus: MenuMap = {
    File: [
      { label: 'New', icon: FilePlus2, action: () => legacy('File', 'New document') },
      { label: 'Open', icon: FolderOpen, shortcut: '⌘O', action: () => document.querySelector<HTMLInputElement>('input.hidden-input[type="file"]')?.click() },
      { label: 'Download', icon: Download, children: [
        { label: 'Word (.docx)', action: () => legacy('File', 'Download DOCX') },
        { label: 'PDF (.pdf)', action: () => legacy('File', 'Print / Save as PDF') },
        { label: 'HTML (.html)', action: () => legacy('File', 'Download HTML') },
        { label: 'Plain text (.txt)', action: downloadText },
      ]},
      { label: 'Rename', icon: Type, separatorBefore: true, action: renameDocument },
      { label: 'Print', icon: Printer, shortcut: '⌘P', separatorBefore: true, action: () => legacy('File', 'Print / Save as PDF') },
    ],
    Edit: [
      { label: 'Undo', icon: Undo2, shortcut: '⌘Z', action: () => toolbar('Undo') },
      { label: 'Redo', icon: Redo2, shortcut: '⌘Y', action: () => toolbar('Redo') },
      { label: 'Cut', shortcut: '⌘X', separatorBefore: true, action: () => exec('cut') },
      { label: 'Copy', shortcut: '⌘C', action: () => exec('copy') },
      { label: 'Select all', shortcut: '⌘A', separatorBefore: true, action: selectAllDocument },
      { label: 'Delete', icon: X, action: () => exec('delete') },
      { label: 'Find and replace', icon: Search, shortcut: '⌘⇧H', separatorBefore: true, action: findReplace },
    ],
    View: [
      { label: 'Mode', children: [
        { label: 'Editing', action: () => chooseMode('Editing') },
        { label: 'Suggesting', action: () => chooseMode('Suggesting') },
        { label: 'Viewing', action: () => chooseMode('Viewing') },
      ]},
      { label: 'Comments', icon: MessageSquare, action: () => toolbar('Add comment') },
      { label: sidebar ? 'Collapse tabs & outline sidebar' : 'Show tabs & outline sidebar', action: toggleSidebar },
      { label: printLayout ? 'Hide print layout' : 'Show print layout', separatorBefore: true, action: togglePrintLayout },
      { label: ruler ? 'Hide ruler' : 'Show ruler', action: toggleRuler },
      { label: marks ? 'Hide non-printing characters' : 'Show non-printing characters', action: toggleMarks },
      { label: 'Full screen', icon: Fullscreen, separatorBefore: true, action: fullscreen },
    ],
    Insert: [
      { label: 'Image', icon: ImageIcon, action: () => document.querySelector<HTMLInputElement>('input.hidden-input[accept="image/*"]')?.click() },
      { label: 'Table', action: () => legacy('Insert', 'Table') },
      { label: 'Link', icon: Link, action: () => toolbar('Insert link') },
      { label: 'Horizontal line', action: () => legacy('Insert', 'Horizontal line') },
    ],
    Format: [
      { label: 'Text', icon: Type, children: [
        { label: 'Bold', icon: Bold, shortcut: '⌘B', action: () => toolbar('Bold') },
        { label: 'Italic', icon: Italic, shortcut: '⌘I', action: () => toolbar('Italic') },
        { label: 'Underline', icon: Underline, shortcut: '⌘U', action: () => toolbar('Underline') },
        { label: 'Strikethrough', separatorBefore: true, action: () => exec('strikeThrough') },
        { label: 'Superscript', action: () => exec('superscript') },
        { label: 'Subscript', action: () => exec('subscript') },
      ]},
      { label: 'Paragraph styles', children: ['Normal text','Title','Subtitle','Heading 1','Heading 2','Heading 3','Heading 4','Heading 5','Heading 6'].map((label) => ({ label, action: () => chooseParagraphStyle(label) })) },
      { label: 'Align & indent', icon: AlignLeft, children: [
        { label: 'Align left', action: () => exec('justifyLeft') },
        { label: 'Center', action: () => exec('justifyCenter') },
        { label: 'Align right', action: () => exec('justifyRight') },
        { label: 'Justify', action: () => exec('justifyFull') },
        { label: 'Decrease indent', icon: IndentDecrease, separatorBefore: true, action: () => exec('outdent') },
        { label: 'Increase indent', icon: IndentIncrease, action: () => exec('indent') },
      ]},
      { label: 'Line & paragraph spacing', children: ['1','1.15','1.5','2'].map((value) => ({ label: value === '1' ? 'Single' : value === '2' ? 'Double' : value, action: () => applySpacing(value) })) },
      { label: 'Bullets & numbering', children: [
        { label: 'Checklist', icon: CheckSquare, action: () => toolbar('Checklist') },
        { label: 'Bulleted list', icon: List, action: () => exec('insertUnorderedList') },
        { label: 'Numbered list', icon: ListOrdered, action: () => exec('insertOrderedList') },
      ]},
      { label: 'Page orientation', separatorBefore: true, action: togglePageOrientation },
      { label: 'Clear formatting', icon: RemoveFormatting, separatorBefore: true, shortcut: '⌘\\', action: () => toolbar('Clear formatting') },
    ],
    Tools: [
      { label: 'Spelling and grammar', icon: SpellCheck2, action: () => { const button = document.querySelector<HTMLButtonElement>('button[aria-label^="Spelling"]'); button?.click(); } },
      { label: 'Word count', icon: FileText, shortcut: '⌘⇧C', action: () => { const text = ed()?.innerText || ''; const words = text.trim() ? text.trim().split(/\s+/).length : 0; window.alert(`${words} words\n${text.length} characters`); } },
      { label: 'Review suggested edits', separatorBefore: true, action: reviewSuggestions },
    ],
    Help: [
      { label: 'Info', action: () => { window.location.href = `${window.location.pathname.replace(/\/?$/, '/').replace(/info\/$/, '')}info/`; } },
      { label: 'Keyboard shortcuts', action: () => window.alert('⌘Z Undo\n⌘Y Redo\n⌘B Bold\n⌘I Italic\n⌘U Underline\n⌘A Select all\n⌘P Print') },
      { label: 'About Free Word Online', separatorBefore: true, action: () => window.alert('Free Word Online\nNo login required. Documents autosave locally in your browser.') },
    ],
  };

  if (!target) return null;

  const nav = (
    <nav className="fwo-main-menu-row" aria-label="Document menus">
      {Object.keys(menus).map((name) => (
        <div className="fwo-main-menu-wrap" key={name}>
          <button
            ref={(element) => { triggerRefs.current[name] = element; }}
            type="button"
            className="fwo-main-menu-trigger"
            aria-expanded={open === name}
            onMouseEnter={() => {
              if (open && open !== name) {
                setOpen(name);
                setSub(null);
              }
            }}
            onClick={() => {
              setOpen(open === name ? null : name);
              setSub(null);
            }}
          >
            {name}
          </button>
        </div>
      ))}
      <style jsx global>{`
        .docs-menu-row { visibility:hidden !important; pointer-events:none !important; }
        .docs-title-stack { position:relative; }
        .fwo-main-menu-row { position:absolute; left:0; bottom:0; height:28px; display:flex; align-items:center; z-index:5200; white-space:nowrap; font-family:Arial,Helvetica,sans-serif; }
        .fwo-main-menu-wrap { position:relative; }
        .fwo-main-menu-trigger { height:28px; padding:0 7px; border:0; border-radius:4px; background:transparent; color:#444746; font-size:14px; cursor:pointer; }
        .fwo-main-menu-trigger:hover,.fwo-main-menu-trigger[aria-expanded='true'] { background:#e9eef6; }
        .fwo-menu-layer { position:fixed; z-index:1000; font-family:Arial,Helvetica,sans-serif; }
        .fwo-main-menu-panel { width:286px; padding:6px; overflow:visible; border:1px solid #e0e3e7; border-radius:9px; background:#fff; box-shadow:0 8px 26px rgba(60,64,67,.22); }
        .fwo-main-menu-item-wrap { position:relative; }
        .fwo-main-menu-item { width:100%; min-height:34px; border:0; border-radius:5px; background:transparent; color:#303134; padding:6px 10px; display:grid; grid-template-columns:20px minmax(0,1fr) auto; align-items:center; gap:8px; text-align:left; cursor:pointer; font-size:13px; }
        .fwo-main-menu-item:hover,.fwo-main-menu-item[aria-expanded='true'] { background:#f1f3f4; }
        .fwo-main-menu-item svg { width:16px; height:16px; }
        .fwo-main-menu-item .fwo-menu-empty-icon { width:16px; }
        .fwo-menu-shortcut { color:#9aa0a6; font-size:11px; white-space:nowrap; }
        .fwo-menu-arrow { color:#80868b; font-size:15px; line-height:1; }
        .fwo-menu-separator { height:1px; margin:5px 2px; background:#dadce0; }
        .fwo-submenu { position:absolute; top:-6px; left:calc(100% + 3px); z-index:6300; width:262px; max-height:calc(100vh - 105px); overflow:auto; padding:6px; border:1px solid #e0e3e7; border-radius:9px; background:#fff; box-shadow:0 8px 26px rgba(60,64,67,.22); }
        .fwo-submenu::before { content:''; position:absolute; left:-5px; top:0; bottom:0; width:6px; }
        .fwo-landscape-page { width:1056px !important; min-width:1056px !important; min-height:816px !important; }
        .fwo-no-print-layout .paper-stage { background:#fff !important; padding-top:0 !important; }
        .fwo-no-print-layout .editor-page { box-shadow:none !important; border-color:transparent !important; }
        .editor-page.fwo-show-marks p::after,.editor-page.fwo-show-marks h1::after,.editor-page.fwo-show-marks h2::after,.editor-page.fwo-show-marks h3::after { content:' ¶'; color:#9aa0a6; font-weight:400; }
        @media(max-width:720px) {
          .fwo-main-menu-trigger { padding:0 5px; font-size:13px; }
          .fwo-menu-layer { left:8px!important; right:8px; }
          .fwo-main-menu-panel { width:auto; max-height:calc(100vh - 100px); overflow:auto; }
          .fwo-submenu { position:static; width:auto; max-height:42vh; margin:3px 0 3px 24px; box-shadow:none; border-color:#e8eaed; }
        }
      `}</style>
    </nav>
  );

  return <>{createPortal(nav, target)}{open && createPortal(
    <div className="fwo-menu-layer" style={menuPosition}>
      <MenuPanel entries={menus[open]} sub={sub} setSub={setSub} run={run} />
    </div>, document.body
  )}</>;
}

function MenuPanel({ entries, sub, setSub, run }: { entries: MenuEntry[]; sub: string | null; setSub: (value: string | null) => void; run: (action?: () => void) => void }) {
  return (
    <div className="fwo-main-menu-panel" role="menu" onMouseDown={(event) => event.stopPropagation()}>
      {entries.map((entry) => (
        <div
          className="fwo-main-menu-item-wrap"
          key={entry.label}
          onMouseEnter={() => setSub(entry.children ? entry.label : null)}
        >
          {entry.separatorBefore && <div className="fwo-menu-separator" />}
          <button
            type="button"
            className="fwo-main-menu-item"
            aria-haspopup={entry.children ? 'menu' : undefined}
            aria-expanded={Boolean(entry.children && sub === entry.label)}
            onClick={(event) => {
              event.stopPropagation();
              if (entry.children) setSub(entry.label);
              else run(entry.action);
            }}
          >
            {entry.icon ? <entry.icon size={16} strokeWidth={1.8} /> : <span className="fwo-menu-empty-icon" />}
            <span>{entry.label}</span>
            <span className={entry.children ? 'fwo-menu-arrow' : 'fwo-menu-shortcut'}>{entry.children ? '›' : entry.shortcut || ''}</span>
          </button>
          {entry.children && sub === entry.label && (
            <div className="fwo-submenu" role="menu">
              <MenuPanelInner entries={entry.children} run={run} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function MenuPanelInner({ entries, run }: { entries: MenuEntry[]; run: (action?: () => void) => void }) {
  return (
    <>
      {entries.map((entry) => (
        <div key={entry.label}>
          {entry.separatorBefore && <div className="fwo-menu-separator" />}
          <button type="button" className="fwo-main-menu-item" onClick={() => run(entry.action)}>
            {entry.icon ? <entry.icon size={16} strokeWidth={1.8} /> : <span className="fwo-menu-empty-icon" />}
            <span>{entry.label}</span>
            <span className="fwo-menu-shortcut">{entry.shortcut || ''}</span>
          </button>
        </div>
      ))}
    </>
  );
}
