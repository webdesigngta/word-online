'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';

type PopupType = 'align' | 'spacing' | 'mode' | 'image' | 'grammar' | 'comments' | null;
type EditorMode = 'editing' | 'suggesting' | 'viewing';
type AnchorPoint = { left: number; top: number };
type GrammarIssue = { id: string; label: string; match: string };
type LocalComment = { id: string; quote: string; text: string; createdAt: string };
type PaintStyle = {
  fontFamily: string;
  fontSize: string;
  fontWeight: string;
  fontStyle: string;
  textDecorationLine: string;
  color: string;
  backgroundColor: string;
};

const COMMENTS_KEY = 'free-word-online:comments:v1';

function getEditor() {
  return document.querySelector<HTMLElement>('.editor-page');
}

function dispatchEditorInput(editor: HTMLElement) {
  editor.dispatchEvent(new Event('input', { bubbles: true }));
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function selectionRangeInside(editor: HTMLElement) {
  const selection = window.getSelection();
  if (!selection?.rangeCount) return null;
  const range = selection.getRangeAt(0);
  if (!editor.contains(range.commonAncestorContainer)) return null;
  return range;
}

function selectedBlocks(editor: HTMLElement, range: Range | null) {
  const selector = 'p,h1,h2,h3,h4,h5,h6,li,div';
  if (!range) return [] as HTMLElement[];
  const blocks = Array.from(editor.querySelectorAll<HTMLElement>(selector)).filter((block) => {
    try {
      return range.intersectsNode(block);
    } catch {
      return false;
    }
  });
  if (blocks.length) return blocks.filter((block) => !blocks.some((other) => other !== block && block.contains(other)));
  let node: Node | null = range.startContainer;
  if (node.nodeType === Node.TEXT_NODE) node = node.parentElement;
  const closest = node instanceof HTMLElement ? node.closest<HTMLElement>(selector) : null;
  return closest && editor.contains(closest) ? [closest] : [];
}

function findGrammarIssues(text: string): GrammarIssue[] {
  const issues: GrammarIssue[] = [];
  const add = (label: string, match: string) => {
    const key = `${label}:${match}`;
    if (!issues.some((issue) => issue.id === key)) issues.push({ id: key, label, match });
  };

  for (const match of text.matchAll(/\b([A-Za-z]+)\s+\1\b/gi)) add('Repeated word', match[0]);
  for (const match of text.matchAll(/\s+[,.!?;:]/g)) add('Remove the space before punctuation', match[0].trim() || match[0]);
  for (const match of text.matchAll(/ {2,}/g)) add('Use a single space', match[0]);
  for (const match of text.matchAll(/\bi\b/g)) add('Capitalize the pronoun “I”', match[0]);

  const commonTypos: Record<string, string> = {
    teh: 'Possible spelling: “the”',
    adn: 'Possible spelling: “and”',
    recieve: 'Possible spelling: “receive”',
    seperate: 'Possible spelling: “separate”',
    occured: 'Possible spelling: “occurred”',
  };
  for (const word of Object.keys(commonTypos)) {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    for (const match of text.matchAll(regex)) add(commonTypos[word], match[0]);
  }

  return issues.slice(0, 50);
}

export function NoLoginToolbarFeatures() {
  const savedRangeRef = useRef<Range | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const [popup, setPopup] = useState<PopupType>(null);
  const [anchor, setAnchor] = useState<AnchorPoint>({ left: 16, top: 120 });
  const [mode, setMode] = useState<EditorMode>('editing');
  const [toolbarCollapsed, setToolbarCollapsed] = useState(false);
  const [paintStyle, setPaintStyle] = useState<PaintStyle | null>(null);
  const [grammarIssues, setGrammarIssues] = useState<GrammarIssue[]>([]);
  const [comments, setComments] = useState<LocalComment[]>([]);
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentQuote, setCommentQuote] = useState('');
  const [imageUrlOpen, setImageUrlOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [toast, setToast] = useState('');

  function showToast(message: string) {
    setToast(message);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(''), 2200);
  }

  function saveSelection() {
    const editor = getEditor();
    if (!editor) return;
    const range = selectionRangeInside(editor);
    if (range) savedRangeRef.current = range.cloneRange();
  }

  function restoreSelection() {
    const editor = getEditor();
    const range = savedRangeRef.current;
    if (!editor || !range) return null;
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
    editor.focus({ preventScroll: true });
    return range;
  }

  function anchorTo(button: HTMLElement) {
    const rect = button.getBoundingClientRect();
    const left = Math.max(8, Math.min(window.innerWidth - 270, rect.left));
    const top = Math.min(window.innerHeight - 80, rect.bottom + 6);
    setAnchor({ left, top });
  }

  function closePopup() {
    setPopup(null);
  }

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(COMMENTS_KEY) || '[]');
      if (Array.isArray(stored)) setComments(stored);
    } catch {
      setComments([]);
    }

    return () => {
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const editor = getEditor();
    if (!editor) return;

    const onSelectionChange = () => saveSelection();
    const onMouseUp = () => saveSelection();
    const onKeyUp = () => saveSelection();
    document.addEventListener('selectionchange', onSelectionChange);
    editor.addEventListener('mouseup', onMouseUp);
    editor.addEventListener('keyup', onKeyUp);

    return () => {
      document.removeEventListener('selectionchange', onSelectionChange);
      editor.removeEventListener('mouseup', onMouseUp);
      editor.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  useEffect(() => {
    const editor = getEditor();
    if (!editor) return;
    editor.contentEditable = mode === 'viewing' ? 'false' : 'true';
    editor.dataset.fwoMode = mode;
    editor.spellcheck = mode !== 'viewing';
    if (mode === 'viewing') editor.blur();
  }, [mode]);

  useEffect(() => {
    const app = document.querySelector<HTMLElement>('.word-app.docs-word-app');
    if (!app) return;
    app.classList.toggle('fwo-toolbar-collapsed', toolbarCollapsed);
    document.body.classList.toggle('fwo-toolbar-is-collapsed', toolbarCollapsed);
    return () => document.body.classList.remove('fwo-toolbar-is-collapsed');
  }, [toolbarCollapsed]);

  useEffect(() => {
    const paintButton = document.querySelector<HTMLElement>('[aria-label="Paint format"]');
    paintButton?.classList.toggle('fwo-tool-active', Boolean(paintStyle));
    return () => paintButton?.classList.remove('fwo-tool-active');
  }, [paintStyle]);

  useEffect(() => {
    const editor = getEditor();
    if (!editor || !paintStyle) return;

    const applyPaint = () => {
      const range = selectionRangeInside(editor);
      if (!range || range.collapsed) return;
      document.execCommand('styleWithCSS', false, 'true');
      document.execCommand('fontName', false, paintStyle.fontFamily.replace(/["']/g, '').split(',')[0]);
      document.execCommand('foreColor', false, paintStyle.color);
      if (paintStyle.backgroundColor && paintStyle.backgroundColor !== 'rgba(0, 0, 0, 0)') {
        document.execCommand('hiliteColor', false, paintStyle.backgroundColor);
      }
      const bold = Number.parseInt(paintStyle.fontWeight, 10) >= 600 || paintStyle.fontWeight === 'bold';
      const italic = paintStyle.fontStyle === 'italic';
      const underline = paintStyle.textDecorationLine.includes('underline');
      if (document.queryCommandState('bold') !== bold) document.execCommand('bold');
      if (document.queryCommandState('italic') !== italic) document.execCommand('italic');
      if (document.queryCommandState('underline') !== underline) document.execCommand('underline');

      try {
        const span = document.createElement('span');
        span.style.fontSize = paintStyle.fontSize;
        range.surroundContents(span);
      } catch {
        // Cross-block selections keep the other copied formatting even when exact size cannot be wrapped safely.
      }
      dispatchEditorInput(editor);
      setPaintStyle(null);
      showToast('Formatting applied');
    };

    editor.addEventListener('mouseup', applyPaint);
    return () => editor.removeEventListener('mouseup', applyPaint);
  }, [paintStyle]);

  useEffect(() => {
    const editor = getEditor();
    if (!editor) return;

    const markDeletion = (range: Range) => {
      if (range.collapsed) return null;
      const deleted = document.createElement('del');
      deleted.dataset.fwoSuggestion = 'delete';
      deleted.appendChild(range.extractContents());
      range.insertNode(deleted);
      range.setStartAfter(deleted);
      range.collapse(true);
      return range;
    };

    const insertSuggestion = (text: string) => {
      const selection = window.getSelection();
      if (!selection?.rangeCount) return;
      const range = selection.getRangeAt(0);
      if (!editor.contains(range.commonAncestorContainer)) return;
      if (!range.collapsed) markDeletion(range);

      const insertion = document.createElement('ins');
      insertion.dataset.fwoSuggestion = 'insert';
      insertion.textContent = text;
      range.insertNode(insertion);
      range.setStartAfter(insertion);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
      dispatchEditorInput(editor);
    };

    const markSingleCharacterDelete = (direction: 'backward' | 'forward') => {
      const selection = window.getSelection();
      if (!selection?.rangeCount) return false;
      const range = selection.getRangeAt(0);
      if (!editor.contains(range.commonAncestorContainer)) return false;
      if (!range.collapsed) {
        markDeletion(range);
        selection.removeAllRanges();
        selection.addRange(range);
        dispatchEditorInput(editor);
        return true;
      }
      if (range.startContainer.nodeType !== Node.TEXT_NODE) return false;
      const textNode = range.startContainer;
      const offset = range.startOffset;
      const length = textNode.textContent?.length ?? 0;
      const start = direction === 'backward' ? offset - 1 : offset;
      const end = direction === 'backward' ? offset : offset + 1;
      if (start < 0 || end > length) return false;
      const deleteRange = document.createRange();
      deleteRange.setStart(textNode, start);
      deleteRange.setEnd(textNode, end);
      markDeletion(deleteRange);
      selection.removeAllRanges();
      selection.addRange(deleteRange);
      dispatchEditorInput(editor);
      return true;
    };

    const onBeforeInput = (event: InputEvent) => {
      if (mode !== 'suggesting') return;
      if (event.inputType === 'insertText' && event.data) {
        event.preventDefault();
        insertSuggestion(event.data);
      } else if (event.inputType === 'deleteContentBackward') {
        if (markSingleCharacterDelete('backward')) event.preventDefault();
      } else if (event.inputType === 'deleteContentForward') {
        if (markSingleCharacterDelete('forward')) event.preventDefault();
      }
    };

    const onPaste = (event: ClipboardEvent) => {
      if (mode !== 'suggesting') return;
      const text = event.clipboardData?.getData('text/plain');
      if (!text) return;
      event.preventDefault();
      insertSuggestion(text);
    };

    editor.addEventListener('beforeinput', onBeforeInput as EventListener);
    editor.addEventListener('paste', onPaste);
    return () => {
      editor.removeEventListener('beforeinput', onBeforeInput as EventListener);
      editor.removeEventListener('paste', onPaste);
    };
  }, [mode]);

  useEffect(() => {
    const editor = getEditor();
    if (!editor) return;

    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const checklistItem = target?.closest<HTMLElement>('li[data-fwo-check-item]');
      if (checklistItem) {
        const rect = checklistItem.getBoundingClientRect();
        if (event.clientX <= rect.left + 28) {
          event.preventDefault();
          checklistItem.dataset.checked = checklistItem.dataset.checked === 'true' ? 'false' : 'true';
          dispatchEditorInput(editor);
          return;
        }
      }

      const commentMark = target?.closest<HTMLElement>('[data-fwo-comment-id]');
      if (commentMark) {
        const rect = commentMark.getBoundingClientRect();
        setAnchor({ left: Math.min(window.innerWidth - 330, rect.right + 8), top: Math.min(window.innerHeight - 220, rect.top) });
        setPopup('comments');
      }
    };

    editor.addEventListener('click', onClick);
    return () => editor.removeEventListener('click', onClick);
  }, []);

  useEffect(() => {
    const onDocumentClickCapture = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const button = target?.closest<HTMLButtonElement>('button');
      if (!button) return;
      const label = (button.getAttribute('aria-label') || button.getAttribute('title') || button.textContent || '').trim();

      const intercept = () => {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        saveSelection();
        anchorTo(button);
      };

      if (label === 'Spelling on' || label === 'Spelling off' || label === 'Spelling') {
        intercept();
        const editor = getEditor();
        if (editor) {
          editor.spellcheck = true;
          setGrammarIssues(findGrammarIssues(editor.innerText || ''));
        }
        setPopup('grammar');
        return;
      }

      if (label === 'Paint format') {
        intercept();
        const editor = getEditor();
        const range = savedRangeRef.current;
        if (!editor || !range) {
          showToast('Select formatted text first');
          return;
        }
        let node: Node | null = range.startContainer;
        if (node.nodeType === Node.TEXT_NODE) node = node.parentElement;
        const element = node instanceof HTMLElement ? node : null;
        if (!element || !editor.contains(element)) {
          showToast('Select formatted text first');
          return;
        }
        const style = getComputedStyle(element);
        setPaintStyle({
          fontFamily: style.fontFamily,
          fontSize: style.fontSize,
          fontWeight: style.fontWeight,
          fontStyle: style.fontStyle,
          textDecorationLine: style.textDecorationLine,
          color: style.color,
          backgroundColor: style.backgroundColor,
        });
        showToast('Formatting copied — select text to apply');
        return;
      }

      if (label === 'Alignment options') {
        intercept();
        setPopup('align');
        return;
      }

      if (label === 'Line spacing') {
        intercept();
        setPopup('spacing');
        return;
      }

      if (label === 'Checklist') {
        intercept();
        insertChecklist();
        return;
      }

      if (label === 'Add comment') {
        intercept();
        const editor = getEditor();
        const range = savedRangeRef.current;
        const quote = range && editor && editor.contains(range.commonAncestorContainer) ? range.toString().trim() : '';
        if (!quote) {
          setPopup('comments');
          showToast(comments.length ? 'Select text to add another comment' : 'Select text first, then add a comment');
          return;
        }
        setCommentQuote(quote);
        setCommentText('');
        setCommentDialogOpen(true);
        return;
      }

      if (label === 'Image options') {
        intercept();
        setPopup('image');
        return;
      }

      if (label === 'Editing mode' || label === 'Editing mode options') {
        intercept();
        setPopup('mode');
        return;
      }

      if (label === 'Hide toolbar') {
        intercept();
        setToolbarCollapsed(true);
        closePopup();
      }
    };

    document.addEventListener('click', onDocumentClickCapture, true);
    return () => document.removeEventListener('click', onDocumentClickCapture, true);
  }, [comments.length]);

  function runCommand(command: string, value?: string) {
    const editor = getEditor();
    if (!editor || mode === 'viewing') return;
    restoreSelection();
    document.execCommand(command, false, value);
    dispatchEditorInput(editor);
    closePopup();
  }

  function applySpacing(lineHeight?: string, marginBefore?: string, marginAfter?: string) {
    const editor = getEditor();
    if (!editor || mode === 'viewing') return;
    const range = restoreSelection() || selectionRangeInside(editor);
    const blocks = selectedBlocks(editor, range);
    for (const block of blocks) {
      if (lineHeight !== undefined) block.style.lineHeight = lineHeight;
      if (marginBefore !== undefined) block.style.marginTop = marginBefore;
      if (marginAfter !== undefined) block.style.marginBottom = marginAfter;
    }
    dispatchEditorInput(editor);
    closePopup();
  }

  function insertChecklist() {
    const editor = getEditor();
    if (!editor || mode === 'viewing') return;
    const range = restoreSelection() || selectionRangeInside(editor);
    if (!range) return;
    const text = range.toString().trim();
    const lines = text ? text.split(/\n+/).map((line) => line.trim()).filter(Boolean) : [''];
    const html = `<ul class="fwo-checklist" data-fwo-checklist="true">${lines.map((line) => `<li data-fwo-check-item="true" data-checked="false">${line ? escapeHtml(line) : '<br>'}</li>`).join('')}</ul>`;
    document.execCommand('insertHTML', false, html);
    dispatchEditorInput(editor);
    showToast('Checklist inserted — click a box to check it');
  }

  function chooseMode(nextMode: EditorMode) {
    setMode(nextMode);
    closePopup();
    showToast(nextMode === 'editing' ? 'Editing mode' : nextMode === 'suggesting' ? 'Suggesting mode — changes are marked' : 'Viewing mode — editing is locked');
  }

  function openImageUpload() {
    closePopup();
    document.querySelector<HTMLInputElement>('input.hidden-input[type="file"][accept="image/*"]')?.click();
  }

  function submitImageUrl(event: FormEvent) {
    event.preventDefault();
    const clean = imageUrl.trim();
    if (!clean || mode === 'viewing') return;
    const editor = getEditor();
    if (!editor) return;
    restoreSelection();
    document.execCommand('insertImage', false, clean);
    dispatchEditorInput(editor);
    setImageUrl('');
    setImageUrlOpen(false);
    showToast('Image inserted');
  }

  function addLocalComment(event: FormEvent) {
    event.preventDefault();
    const clean = commentText.trim();
    const editor = getEditor();
    const range = savedRangeRef.current;
    if (!clean || !editor || !range || mode === 'viewing') return;

    const id = `comment-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    try {
      restoreSelection();
      const mark = document.createElement('span');
      mark.dataset.fwoCommentId = id;
      mark.className = 'fwo-comment-mark';
      range.surroundContents(mark);
      dispatchEditorInput(editor);
    } catch {
      // Keep the local comment record even for complex cross-block selections.
    }

    const record: LocalComment = { id, quote: commentQuote, text: clean, createdAt: new Date().toISOString() };
    const next = [...comments, record];
    setComments(next);
    localStorage.setItem(COMMENTS_KEY, JSON.stringify(next));
    setCommentDialogOpen(false);
    setCommentText('');
    setPopup('comments');
    showToast('Comment saved locally');
  }

  function deleteComment(id: string) {
    const editor = getEditor();
    editor?.querySelectorAll<HTMLElement>(`[data-fwo-comment-id="${id}"]`).forEach((mark) => {
      const parent = mark.parentNode;
      while (mark.firstChild) parent?.insertBefore(mark.firstChild, mark);
      mark.remove();
      parent?.normalize();
    });
    if (editor) dispatchEditorInput(editor);
    const next = comments.filter((comment) => comment.id !== id);
    setComments(next);
    localStorage.setItem(COMMENTS_KEY, JSON.stringify(next));
  }

  function jumpToText(match: string) {
    const browserFind = (window as typeof window & { find?: (...args: unknown[]) => boolean }).find;
    browserFind?.call(window, match, false, false, true, false, true, false);
  }

  return (
    <>
      {popup === 'align' && (
        <div className="fwo-local-popover" style={{ left: anchor.left, top: anchor.top }}>
          <button type="button" onClick={() => runCommand('justifyLeft')}>Align left</button>
          <button type="button" onClick={() => runCommand('justifyCenter')}>Center</button>
          <button type="button" onClick={() => runCommand('justifyRight')}>Align right</button>
          <button type="button" onClick={() => runCommand('justifyFull')}>Justify</button>
        </div>
      )}

      {popup === 'spacing' && (
        <div className="fwo-local-popover" style={{ left: anchor.left, top: anchor.top }}>
          <div className="fwo-popover-label">Line spacing</div>
          <button type="button" onClick={() => applySpacing('1')}>Single</button>
          <button type="button" onClick={() => applySpacing('1.15')}>1.15</button>
          <button type="button" onClick={() => applySpacing('1.5')}>1.5</button>
          <button type="button" onClick={() => applySpacing('2')}>Double</button>
          <div className="fwo-popover-separator" />
          <button type="button" onClick={() => applySpacing(undefined, '12px', undefined)}>Add space before paragraph</button>
          <button type="button" onClick={() => applySpacing(undefined, undefined, '12px')}>Add space after paragraph</button>
          <button type="button" onClick={() => applySpacing(undefined, '0', '0')}>Remove paragraph spacing</button>
        </div>
      )}

      {popup === 'mode' && (
        <div className="fwo-local-popover" style={{ left: anchor.left, top: anchor.top }}>
          <button className={mode === 'editing' ? 'selected' : ''} type="button" onClick={() => chooseMode('editing')}><span>Editing</span><small>Edit the document directly</small></button>
          <button className={mode === 'suggesting' ? 'selected' : ''} type="button" onClick={() => chooseMode('suggesting')}><span>Suggesting</span><small>Mark insertions and deletions</small></button>
          <button className={mode === 'viewing' ? 'selected' : ''} type="button" onClick={() => chooseMode('viewing')}><span>Viewing</span><small>Read without changing text</small></button>
        </div>
      )}

      {popup === 'image' && (
        <div className="fwo-local-popover" style={{ left: anchor.left, top: anchor.top }}>
          <button type="button" onClick={openImageUpload}>Upload from device</button>
          <button type="button" onClick={() => { closePopup(); setImageUrl(''); setImageUrlOpen(true); }}>Insert image by URL</button>
        </div>
      )}

      {popup === 'grammar' && (
        <div className="fwo-local-panel" style={{ left: anchor.left, top: anchor.top }}>
          <div className="fwo-panel-title"><strong>Spelling & grammar</strong><button type="button" onClick={closePopup}>×</button></div>
          <p className="fwo-panel-note">Browser spellcheck is on. Grammar checks run locally in this browser.</p>
          {grammarIssues.length ? grammarIssues.map((issue) => (
            <button className="fwo-issue" type="button" key={issue.id} onClick={() => jumpToText(issue.match)}>
              <strong>{issue.label}</strong><span>{issue.match}</span>
            </button>
          )) : <div className="fwo-empty-state">No local grammar issues found.</div>}
        </div>
      )}

      {popup === 'comments' && (
        <div className="fwo-local-panel" style={{ left: anchor.left, top: anchor.top }}>
          <div className="fwo-panel-title"><strong>Local comments</strong><button type="button" onClick={closePopup}>×</button></div>
          <p className="fwo-panel-note">Comments stay on this device and do not require an account.</p>
          {comments.length ? comments.map((comment) => (
            <div className="fwo-comment-card" key={comment.id}>
              <blockquote>{comment.quote || 'Selected text'}</blockquote>
              <p>{comment.text}</p>
              <button type="button" onClick={() => deleteComment(comment.id)}>Delete</button>
            </div>
          )) : <div className="fwo-empty-state">No comments yet. Select text and click Add comment.</div>}
        </div>
      )}

      {commentDialogOpen && (
        <div className="fwo-feature-backdrop" onMouseDown={() => setCommentDialogOpen(false)}>
          <form className="fwo-feature-dialog" onSubmit={addLocalComment} onMouseDown={(event) => event.stopPropagation()}>
            <h2>Add comment</h2>
            <p className="fwo-dialog-quote">“{commentQuote}”</p>
            <textarea autoFocus value={commentText} onChange={(event) => setCommentText(event.target.value)} placeholder="Write a comment" />
            <div><button type="button" onClick={() => setCommentDialogOpen(false)}>Cancel</button><button className="primary" type="submit" disabled={!commentText.trim()}>Comment</button></div>
          </form>
        </div>
      )}

      {imageUrlOpen && (
        <div className="fwo-feature-backdrop" onMouseDown={() => setImageUrlOpen(false)}>
          <form className="fwo-feature-dialog" onSubmit={submitImageUrl} onMouseDown={(event) => event.stopPropagation()}>
            <h2>Insert image by URL</h2>
            <input autoFocus type="url" value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} placeholder="https://example.com/image.jpg" />
            <div><button type="button" onClick={() => setImageUrlOpen(false)}>Cancel</button><button className="primary" type="submit" disabled={!imageUrl.trim()}>Insert</button></div>
          </form>
        </div>
      )}

      {toolbarCollapsed && <button className="fwo-show-toolbar" type="button" onClick={() => setToolbarCollapsed(false)} title="Show toolbar" aria-label="Show toolbar">⌄</button>}
      {toast && <div className="fwo-feature-toast" role="status">{toast}</div>}

      <style jsx global>{`
        .fwo-local-popover, .fwo-local-panel {
          position: fixed;
          z-index: 1200;
          width: 250px;
          padding: 6px;
          border: 1px solid #dde2e7;
          border-radius: 12px;
          background: #fff;
          box-shadow: 0 8px 28px rgba(60,64,67,.22);
          font-family: Arial, Helvetica, sans-serif;
        }
        .fwo-local-popover button {
          width: 100%;
          min-height: 36px;
          border: 0;
          border-radius: 7px;
          background: transparent;
          color: #202124;
          padding: 7px 10px;
          display: grid;
          gap: 2px;
          text-align: left;
          font-size: 13px;
          cursor: pointer;
        }
        .fwo-local-popover button:hover, .fwo-local-popover button.selected { background: #f1f3f4; }
        .fwo-local-popover button.selected { color: #0b57d0; }
        .fwo-local-popover small { color: #6b7280; font-size: 11px; }
        .fwo-popover-label { padding: 7px 10px 5px; color: #5f6368; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; }
        .fwo-popover-separator { height: 1px; margin: 5px 4px; background: #e4e7eb; }

        .fwo-local-panel { width: 310px; max-height: min(480px, calc(100vh - 130px)); overflow: auto; padding: 10px; }
        .fwo-panel-title { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 2px 2px 6px; }
        .fwo-panel-title strong { font-size: 14px; }
        .fwo-panel-title button { width: 28px; height: 28px; border: 0; border-radius: 14px; background: transparent; font-size: 20px; cursor: pointer; }
        .fwo-panel-title button:hover { background: #f1f3f4; }
        .fwo-panel-note { margin: 0 2px 8px; color: #6b7280; font-size: 11px; line-height: 1.4; }
        .fwo-issue { width: 100%; margin-top: 5px; padding: 9px 10px; border: 0; border-radius: 8px; background: #f8fafd; display: grid; gap: 4px; text-align: left; cursor: pointer; }
        .fwo-issue:hover { background: #eef3fb; }
        .fwo-issue strong { font-size: 12px; color: #202124; }
        .fwo-issue span { color: #5f6368; font-size: 11px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .fwo-empty-state { padding: 16px 10px; color: #6b7280; font-size: 12px; text-align: center; }

        .fwo-comment-card { margin-top: 7px; padding: 10px; border: 1px solid #e2e6ea; border-radius: 10px; background: #fff; }
        .fwo-comment-card blockquote { margin: 0 0 7px; padding-left: 8px; border-left: 3px solid #fbbc04; color: #5f6368; font-size: 11px; line-height: 1.35; }
        .fwo-comment-card p { margin: 0; font-size: 12px; line-height: 1.45; color: #202124; }
        .fwo-comment-card > button { margin-top: 7px; border: 0; background: transparent; color: #b3261e; padding: 2px 0; font-size: 11px; cursor: pointer; }
        .fwo-comment-mark { background: #fff1a8; border-bottom: 2px solid #f9ab00; border-radius: 2px; cursor: pointer; }

        .fwo-checklist { list-style: none; padding-left: 28px; }
        .fwo-checklist li[data-fwo-check-item] { position: relative; min-height: 1.5em; }
        .fwo-checklist li[data-fwo-check-item]::before { content: '☐'; position: absolute; left: -24px; top: 0; color: #5f6368; font-size: 16px; line-height: 1.35; cursor: pointer; }
        .fwo-checklist li[data-fwo-check-item][data-checked='true'] { color: #6b7280; text-decoration: line-through; }
        .fwo-checklist li[data-fwo-check-item][data-checked='true']::before { content: '☑'; color: #0b57d0; }

        .editor-page[data-fwo-mode='suggesting'] ins[data-fwo-suggestion='insert'] { color: #137333; background: #e6f4ea; text-decoration: none; border-bottom: 1px solid #34a853; }
        .editor-page[data-fwo-mode='suggesting'] del[data-fwo-suggestion='delete'] { color: #b3261e; background: #fce8e6; text-decoration: line-through; }
        .editor-page[data-fwo-mode='viewing'] { cursor: default; }

        .docs-toolbar-icon.fwo-tool-active { background: #d3e3fd !important; color: #0b57d0 !important; }
        .word-app.docs-word-app.fwo-toolbar-collapsed { grid-template-rows: 58px minmax(0, 1fr) !important; }
        .word-app.fwo-toolbar-collapsed .docs-toolbar { display: none !important; }
        body.fwo-toolbar-is-collapsed .fwo-outline { top: 58px !important; }
        .fwo-show-toolbar { position: fixed; top: 61px; right: 14px; z-index: 250; width: 34px; height: 26px; border: 1px solid #d9dde2; border-radius: 13px; background: #fff; color: #3c4043; box-shadow: 0 1px 4px rgba(60,64,67,.16); cursor: pointer; font-size: 18px; line-height: 1; }

        .fwo-feature-backdrop { position: fixed; inset: 0; z-index: 1400; display: grid; place-items: center; padding: 20px; background: rgba(32,33,36,.24); backdrop-filter: blur(2px); }
        .fwo-feature-dialog { width: min(430px, calc(100vw - 30px)); padding: 20px; border: 1px solid #e0e4e8; border-radius: 18px; background: #fff; box-shadow: 0 18px 50px rgba(32,33,36,.24); font-family: Arial, Helvetica, sans-serif; }
        .fwo-feature-dialog h2 { margin: 0 0 12px; font-size: 18px; }
        .fwo-feature-dialog input, .fwo-feature-dialog textarea { width: 100%; box-sizing: border-box; border: 1px solid #c9cdd2; border-radius: 11px; outline: 0; padding: 11px 12px; font: 400 14px/1.4 Arial, Helvetica, sans-serif; }
        .fwo-feature-dialog input:focus, .fwo-feature-dialog textarea:focus { border-color: #0b57d0; box-shadow: 0 0 0 2px rgba(11,87,208,.12); }
        .fwo-feature-dialog textarea { min-height: 104px; resize: vertical; }
        .fwo-feature-dialog > div:last-child { display: flex; justify-content: flex-end; gap: 8px; margin-top: 14px; }
        .fwo-feature-dialog > div:last-child button { height: 36px; min-width: 76px; padding: 0 14px; border: 1px solid #d8dce1; border-radius: 18px; background: #fff; color: #0b57d0; font-weight: 600; cursor: pointer; }
        .fwo-feature-dialog > div:last-child button.primary { border-color: #0b57d0; background: #0b57d0; color: #fff; }
        .fwo-feature-dialog > div:last-child button:disabled { opacity: .45; cursor: default; }
        .fwo-dialog-quote { margin: 0 0 12px; padding: 9px 10px; border-left: 3px solid #fbbc04; background: #fff8d8; color: #5f6368; font-size: 12px; line-height: 1.4; }

        .fwo-feature-toast { position: fixed; left: 50%; bottom: 22px; z-index: 1600; transform: translateX(-50%); max-width: min(520px, calc(100vw - 28px)); padding: 9px 14px; border-radius: 18px; background: #202124; color: #fff; box-shadow: 0 4px 16px rgba(32,33,36,.22); font: 500 12px/1.35 Arial, Helvetica, sans-serif; }

        @media (max-width: 700px) {
          .fwo-local-popover, .fwo-local-panel { left: 10px !important; right: 10px; width: auto; }
          .fwo-feature-backdrop { align-items: end; padding: 10px; }
          .fwo-feature-dialog { width: 100%; border-radius: 18px; }
        }
        @media print {
          .fwo-local-popover, .fwo-local-panel, .fwo-feature-backdrop, .fwo-feature-toast, .fwo-show-toolbar { display: none !important; }
          .fwo-comment-mark { background: transparent !important; border: 0 !important; }
          ins[data-fwo-suggestion='insert'] { color: inherit !important; background: transparent !important; text-decoration: none !important; border: 0 !important; }
          del[data-fwo-suggestion='delete'] { display: none !important; }
        }
      `}</style>
    </>
  );
}
