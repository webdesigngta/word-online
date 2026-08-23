'use client';

import {
  BookOpen,
  ChevronRight,
  Clipboard,
  ClipboardPaste,
  Copy,
  Lightbulb,
  Link2,
  MessageSquarePlus,
  RemoveFormatting,
  Scissors,
  SmilePlus,
  SquarePen,
  Trash2,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

type MenuState = {
  x: number;
  y: number;
  text: string;
  heading: HTMLElement | null;
  range: Range;
};

const KEEP_KEY = 'free-word-online:keep:v1';
const EMOJIS = ['👍', '❤️', '😂', '🎉', '😮', '😢', '👏', '✅'];

function getEditor() {
  return document.querySelector<HTMLElement>('.editor-page[contenteditable]');
}

function rangeAtPoint(x: number, y: number) {
  const doc = document as Document & {
    caretRangeFromPoint?: (x: number, y: number) => Range | null;
    caretPositionFromPoint?: (x: number, y: number) => { offsetNode: Node; offset: number } | null;
  };

  if (doc.caretRangeFromPoint) return doc.caretRangeFromPoint(x, y);
  const position = doc.caretPositionFromPoint?.(x, y);
  if (!position) return null;
  const range = document.createRange();
  range.setStart(position.offsetNode, position.offset);
  range.collapse(true);
  return range;
}

function selectWordAtPoint(editor: HTMLElement, x: number, y: number) {
  const range = rangeAtPoint(x, y);
  if (!range || !editor.contains(range.startContainer)) return null;

  let node = range.startContainer;
  let offset = range.startOffset;
  if (node.nodeType !== Node.TEXT_NODE) {
    const element = node instanceof HTMLElement ? node : node.parentElement;
    const textNode = Array.from(element?.childNodes || []).find((child) => child.nodeType === Node.TEXT_NODE && child.textContent?.trim());
    if (!textNode) return null;
    node = textNode;
    offset = Math.min(offset, textNode.textContent?.length || 0);
  }

  const value = node.textContent || '';
  if (!value.trim()) return null;
  let start = Math.min(offset, value.length);
  let end = start;
  const isWord = (char: string) => /[\p{L}\p{N}_'’-]/u.test(char);

  if (start === value.length && start > 0) start -= 1;
  if (!isWord(value[start] || '')) {
    const next = value.slice(start).search(/[\p{L}\p{N}_'’-]/u);
    if (next < 0) return null;
    start += next;
  }
  end = start + 1;
  while (start > 0 && isWord(value[start - 1])) start -= 1;
  while (end < value.length && isWord(value[end])) end += 1;

  const wordRange = document.createRange();
  wordRange.setStart(node, start);
  wordRange.setEnd(node, end);
  const selection = window.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(wordRange);
  return wordRange;
}

function dispatchInput(editor: HTMLElement) {
  editor.dispatchEvent(new Event('input', { bubbles: true }));
}

function shortcut(key: string) {
  const mac = /Mac|iPhone|iPad|iPod/.test(navigator.platform);
  return `${mac ? '⌘' : 'Ctrl+'}${key}`;
}

export function EditorContextMenu() {
  const [menu, setMenu] = useState<MenuState | null>(null);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const editor = getEditor();
    if (!editor) return;

    const onContextMenu = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target || !editor.contains(target)) return;

      let selection = window.getSelection();
      let range: Range | null = null;
      if (selection?.rangeCount) {
        const current = selection.getRangeAt(0);
        if (!current.collapsed && editor.contains(current.commonAncestorContainer)) range = current.cloneRange();
      }
      if (!range) range = selectWordAtPoint(editor, event.clientX, event.clientY)?.cloneRange() || null;
      if (!range) return;

      const text = range.toString().trim();
      if (!text) return;

      event.preventDefault();
      event.stopPropagation();
      const heading = target.closest<HTMLElement>('h1,h2,h3,h4,h5,h6');
      setEmojiOpen(false);
      setMenu({ x: event.clientX, y: event.clientY, text, heading, range });
    };

    editor.addEventListener('contextmenu', onContextMenu);
    return () => editor.removeEventListener('contextmenu', onContextMenu);
  }, []);

  useEffect(() => {
    if (!menu) return;
    const close = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenu(null);
    };
    const closeOnKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenu(null);
    };
    const closeOnScroll = () => setMenu(null);
    document.addEventListener('mousedown', close);
    window.addEventListener('keydown', closeOnKey);
    window.addEventListener('resize', closeOnScroll);
    document.querySelector('.docs-editor-workspace')?.addEventListener('scroll', closeOnScroll);
    return () => {
      document.removeEventListener('mousedown', close);
      window.removeEventListener('keydown', closeOnKey);
      window.removeEventListener('resize', closeOnScroll);
      document.querySelector('.docs-editor-workspace')?.removeEventListener('scroll', closeOnScroll);
    };
  }, [menu]);

  function restoreRange() {
    const editor = getEditor();
    if (!menu || !editor) return null;
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(menu.range);
    editor.focus({ preventScroll: true });
    return { editor, range: menu.range };
  }

  async function copyText(cut = false) {
    const restored = restoreRange();
    if (!restored || !menu) return;
    try {
      await navigator.clipboard.writeText(menu.text);
    } catch {
      document.execCommand('copy');
    }
    if (cut) {
      restored.range.deleteContents();
      dispatchInput(restored.editor);
    }
    setMenu(null);
  }

  async function pasteText() {
    const restored = restoreRange();
    if (!restored) return;
    try {
      const text = await navigator.clipboard.readText();
      restored.range.deleteContents();
      const node = document.createTextNode(text);
      restored.range.insertNode(node);
      restored.range.setStartAfter(node);
      restored.range.collapse(true);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(restored.range);
      dispatchInput(restored.editor);
    } catch {
      // Browser clipboard permission may be unavailable; native keyboard paste remains available.
    }
    setMenu(null);
  }

  function deleteSelection() {
    const restored = restoreRange();
    if (!restored) return;
    restored.range.deleteContents();
    dispatchInput(restored.editor);
    setMenu(null);
  }

  function triggerToolbar(label: string) {
    restoreRange();
    const button = document.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`);
    setMenu(null);
    window.setTimeout(() => button?.click(), 0);
  }

  function suggestEdits() {
    restoreRange();
    setMenu(null);
    const modeButton = document.querySelector<HTMLButtonElement>('button[aria-label="Editing mode options"]');
    modeButton?.click();
    window.setTimeout(() => {
      const option = Array.from(document.querySelectorAll<HTMLButtonElement>('.fwo-local-popover button'))
        .find((button) => button.textContent?.includes('Suggesting'));
      option?.click();
    }, 50);
  }

  function addReaction(emoji: string) {
    const restored = restoreRange();
    if (!restored) return;
    try {
      const mark = document.createElement('span');
      mark.className = 'fwo-reaction-mark';
      mark.dataset.fwoReaction = emoji;
      mark.title = `Reaction: ${emoji}`;
      restored.range.surroundContents(mark);
      const badge = document.createElement('span');
      badge.className = 'fwo-reaction-badge';
      badge.contentEditable = 'false';
      badge.textContent = emoji;
      mark.after(badge);
      dispatchInput(restored.editor);
    } catch {
      // Complex cross-block selections are left unchanged.
    }
    setMenu(null);
  }

  function defineText() {
    if (!menu) return;
    const query = encodeURIComponent(`define ${menu.text}`);
    window.open(`https://www.google.com/search?q=${query}`, '_blank', 'noopener,noreferrer');
    setMenu(null);
  }

  function saveToKeep() {
    if (!menu) return;
    try {
      const existing = JSON.parse(localStorage.getItem(KEEP_KEY) || '[]');
      const notes = Array.isArray(existing) ? existing : [];
      notes.push({ text: menu.text, createdAt: new Date().toISOString() });
      localStorage.setItem(KEEP_KEY, JSON.stringify(notes.slice(-100)));
    } catch {
      // Keep the editor usable if local storage is unavailable.
    }
    setMenu(null);
  }

  async function copyHeadingLink() {
    if (!menu?.heading) return;
    const heading = menu.heading;
    if (!heading.id) {
      const slug = (heading.innerText || 'heading')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || 'heading';
      let id = slug;
      let index = 2;
      while (document.getElementById(id) && document.getElementById(id) !== heading) id = `${slug}-${index++}`;
      heading.id = id;
      getEditor() && dispatchInput(getEditor()!);
    }
    const url = `${window.location.href.split('#')[0]}#${heading.id}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Clipboard may be blocked by browser permissions.
    }
    setMenu(null);
  }

  function toggleLandscape() {
    const editor = getEditor();
    if (!editor) return;
    editor.classList.toggle('fwo-page-landscape');
    localStorage.setItem('free-word-online:landscape', editor.classList.contains('fwo-page-landscape') ? '1' : '0');
    setMenu(null);
  }

  function openFormatMenu() {
    setMenu(null);
    const button = Array.from(document.querySelectorAll<HTMLButtonElement>('.docs-menu-button'))
      .find((candidate) => candidate.textContent?.trim() === 'Format');
    window.setTimeout(() => button?.click(), 0);
  }

  function clearFormatting() {
    const restored = restoreRange();
    if (!restored) return;
    document.execCommand('removeFormat');
    dispatchInput(restored.editor);
    setMenu(null);
  }

  useEffect(() => {
    const editor = getEditor();
    if (!editor) return;
    if (localStorage.getItem('free-word-online:landscape') === '1') editor.classList.add('fwo-page-landscape');
  }, []);

  if (!menu) return null;

  const width = 322;
  const left = Math.max(8, Math.min(menu.x, window.innerWidth - width - 8));
  const top = Math.max(8, Math.min(menu.y, window.innerHeight - 590));
  const defineLabel = `Define “${menu.text.length > 26 ? `${menu.text.slice(0, 26)}…` : menu.text}”`;

  return (
    <>
      <div
        ref={menuRef}
        className="fwo-context-menu"
        role="menu"
        style={{ left, top }}
        onMouseDown={(event) => event.preventDefault()}
      >
        <MenuItem icon={<Scissors />} label="Cut" shortcut={shortcut('X')} onClick={() => copyText(true)} />
        <MenuItem icon={<Copy />} label="Copy" shortcut={shortcut('C')} onClick={() => copyText(false)} />
        <MenuItem icon={<ClipboardPaste />} label="Paste" shortcut={shortcut('V')} onClick={pasteText} />
        <MenuItem icon={<Clipboard />} label="Paste without formatting" shortcut={`${shortcut('Shift+V')}`} onClick={pasteText} />
        <MenuItem icon={<Trash2 />} label="Delete" onClick={deleteSelection} />

        <Divider />

        <MenuItem icon={<MessageSquarePlus />} label="Comment" shortcut={shortcut('Option+M')} onClick={() => triggerToolbar('Add comment')} />
        <MenuItem icon={<SquarePen />} label="Suggest edits" onClick={suggestEdits} />

        <Divider />

        <div className="fwo-context-subwrap">
          <MenuItem icon={<SmilePlus />} label="Insert emoji reaction" right={<ChevronRight />} onClick={() => setEmojiOpen((value) => !value)} />
          {emojiOpen && (
            <div className="fwo-emoji-submenu" role="menu" aria-label="Emoji reactions">
              {EMOJIS.map((emoji) => <button type="button" key={emoji} onClick={() => addReaction(emoji)}>{emoji}</button>)}
            </div>
          )}
        </div>
        <MenuItem icon={<Link2 />} label="Insert link" shortcut={shortcut('K')} onClick={() => triggerToolbar('Insert link')} />

        <Divider />

        <MenuItem icon={<BookOpen />} label={defineLabel} onClick={defineText} />
        <MenuItem icon={<Lightbulb />} label="Save to Keep" onClick={saveToKeep} />

        <Divider />

        <MenuItem icon={<Copy />} label="Copy heading link" disabled={!menu.heading} onClick={copyHeadingLink} />

        <Divider />

        <MenuItem icon={<SquarePen />} label="Change page to landscape" onClick={toggleLandscape} />
        <MenuItem icon={<SquarePen />} label="Format options" right={<ChevronRight />} onClick={openFormatMenu} />
        <MenuItem icon={<RemoveFormatting />} label="Clear formatting" shortcut={shortcut('\\')} onClick={clearFormatting} />
      </div>

      <style jsx global>{`
        .fwo-context-menu {
          position: fixed;
          z-index: 2200;
          width: 322px;
          max-height: calc(100dvh - 16px);
          overflow-y: auto;
          padding: 6px 0;
          border: 1px solid #e0e3e7;
          border-radius: 8px;
          background: #fff;
          color: #3c4043;
          box-shadow: 0 8px 24px rgba(60,64,67,.24), 0 1px 4px rgba(60,64,67,.16);
          font: 400 14px/1.2 Arial, Helvetica, sans-serif;
          overscroll-behavior: contain;
        }
        .fwo-context-item {
          width: 100%;
          min-height: 34px;
          border: 0;
          background: transparent;
          color: #3c4043;
          padding: 0 14px;
          display: grid;
          grid-template-columns: 22px minmax(0, 1fr) auto;
          align-items: center;
          gap: 8px;
          text-align: left;
          cursor: pointer;
        }
        .fwo-context-item:hover:not(:disabled), .fwo-context-item:focus-visible { background: #f1f3f4; outline: 0; }
        .fwo-context-item:disabled { color: #a0a4a8; cursor: default; }
        .fwo-context-item svg { width: 17px; height: 17px; stroke-width: 1.8; }
        .fwo-context-label { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .fwo-context-shortcut { color: #8a8d91; font-size: 12px; white-space: nowrap; }
        .fwo-context-right { display: grid; place-items: center; color: #8a8d91; }
        .fwo-context-right svg { width: 14px; height: 14px; }
        .fwo-context-divider { height: 1px; margin: 5px 0; background: #dadce0; }
        .fwo-context-subwrap { position: relative; }
        .fwo-emoji-submenu {
          position: absolute;
          left: calc(100% - 8px);
          top: -6px;
          z-index: 2201;
          width: 170px;
          padding: 7px;
          border: 1px solid #e0e3e7;
          border-radius: 10px;
          background: #fff;
          box-shadow: 0 8px 24px rgba(60,64,67,.22);
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 3px;
        }
        .fwo-emoji-submenu button { width: 36px; height: 36px; border: 0; border-radius: 8px; background: transparent; font-size: 19px; cursor: pointer; }
        .fwo-emoji-submenu button:hover { background: #f1f3f4; }
        .fwo-reaction-mark { background: rgba(11,87,208,.08); border-bottom: 1px solid rgba(11,87,208,.35); }
        .fwo-reaction-badge { display: inline-block; margin-left: 3px; vertical-align: super; font-size: .72em; user-select: none; }
        .editor-page.fwo-page-landscape { width: 1056px !important; min-width: 1056px !important; min-height: 816px !important; }

        @media (max-width: 560px) {
          .fwo-context-menu { width: min(322px, calc(100vw - 16px)); font-size: 13px; }
          .fwo-context-item { min-height: 40px; padding: 0 12px; }
          .fwo-emoji-submenu { position: fixed; left: 8px; right: 8px; top: auto; bottom: 8px; width: auto; grid-template-columns: repeat(8, 1fr); }
          .fwo-emoji-submenu button { width: 100%; }
        }

        @media print {
          .fwo-context-menu, .fwo-emoji-submenu, .fwo-reaction-badge { display: none !important; }
          .fwo-reaction-mark { background: transparent !important; border: 0 !important; }
        }
      `}</style>
    </>
  );
}

function Divider() {
  return <div className="fwo-context-divider" role="separator" />;
}

function MenuItem({
  icon,
  label,
  shortcut: keyHint,
  right,
  disabled = false,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
  right?: React.ReactNode;
  disabled?: boolean;
  onClick: () => void | Promise<void>;
}) {
  return (
    <button className="fwo-context-item" type="button" role="menuitem" disabled={disabled} onClick={onClick}>
      <span aria-hidden="true">{icon}</span>
      <span className="fwo-context-label">{label}</span>
      {right ? <span className="fwo-context-right" aria-hidden="true">{right}</span> : <span className="fwo-context-shortcut">{keyHint || ''}</span>}
    </button>
  );
}
