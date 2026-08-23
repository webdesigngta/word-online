'use client';

import { Check, Copy, ExternalLink, Link as LinkIcon, Pencil, Search, Unlink2, X } from 'lucide-react';
import { FormEvent, useEffect, useRef, useState } from 'react';

type DialogMode = 'search' | 'link' | null;
type LinkKind = 'url' | 'heading';
type HeadingTarget = { value: string; label: string; element: HTMLElement };
type LinkHoverState = { anchor: HTMLAnchorElement; href: string; left: number; top: number };

function slugify(value: string) {
  const slug = value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return slug || `section-${Date.now()}`;
}

function normalizeHref(value: string) {
  const clean = value.trim();
  if (!clean) return '';
  if (clean.startsWith('#') || /^(https?:|mailto:|tel:)/i.test(clean)) return clean;
  return `https://${clean}`;
}

function resolvedHref(href: string) {
  if (href.startsWith('#')) return `${window.location.href.split('#')[0]}${href}`;
  try {
    return new URL(href, window.location.href).href;
  } catch {
    return href;
  }
}

export function GracefulEditorDialogs() {
  const [mode, setMode] = useState<DialogMode>(null);
  const [value, setValue] = useState('');
  const [linkKind, setLinkKind] = useState<LinkKind>('url');
  const [headingTargets, setHeadingTargets] = useState<Array<{ value: string; label: string }>>([]);
  const [headingValue, setHeadingValue] = useState('');
  const [linkHover, setLinkHover] = useState<LinkHoverState | null>(null);
  const [editingLink, setEditingLink] = useState(false);
  const [editingHref, setEditingHref] = useState('');
  const savedRangeRef = useRef<Range | null>(null);
  const headingElementsRef = useRef<Map<string, HTMLElement>>(new Map());
  const hoverTimerRef = useRef<number | null>(null);
  const closeTimerRef = useRef<number | null>(null);
  const linkCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const closeOpenEditorMenu = () => {
      const workspace = document.querySelector<HTMLElement>('.docs-editor-workspace');
      workspace?.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    };

    const saveEditorSelection = () => {
      const editor = document.querySelector<HTMLElement>('.editor-page');
      const selection = window.getSelection();
      if (!editor || !selection?.rangeCount) return;
      const range = selection.getRangeAt(0);
      if (editor.contains(range.commonAncestorContainer)) savedRangeRef.current = range.cloneRange();
    };

    const collectHeadings = () => {
      const editor = document.querySelector<HTMLElement>('.editor-page');
      const map = new Map<string, HTMLElement>();
      const options: Array<{ value: string; label: string }> = [];
      if (!editor) return options;

      const nodes = Array.from(editor.querySelectorAll<HTMLElement>('h1,h2,h3,h4,h5,h6,[id]'));
      nodes.forEach((element, index) => {
        const text = element.innerText.trim() || element.id || `Bookmark ${index + 1}`;
        const key = `target-${index}`;
        map.set(key, element);
        options.push({ value: key, label: text });
      });
      headingElementsRef.current = map;
      return options;
    };

    const onClickCapture = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const button = target?.closest<HTMLButtonElement>('button');
      if (!button) return;

      const ariaLabel = button.getAttribute('aria-label')?.trim();
      const buttonText = button.textContent?.trim();
      const isMenuItem = button.classList.contains('docs-menu-item');
      const isSearch = ariaLabel === 'Search menus' || (isMenuItem && buttonText === 'Find');
      const isLink = ariaLabel === 'Insert link' || (isMenuItem && buttonText === 'Link');
      if (!isSearch && !isLink) return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      saveEditorSelection();
      closeOpenEditorMenu();
      setLinkHover(null);
      setEditingLink(false);
      setValue('');
      setLinkKind('url');
      if (isLink) {
        const headings = collectHeadings();
        setHeadingTargets(headings);
        setHeadingValue(headings[0]?.value || '');
      }
      setMode(isLink ? 'link' : 'search');
    };

    document.addEventListener('click', onClickCapture, true);
    return () => document.removeEventListener('click', onClickCapture, true);
  }, []);

  useEffect(() => {
    if (!mode) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setMode(null);
        setValue('');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mode]);

  useEffect(() => {
    const editor = document.querySelector<HTMLElement>('.editor-page');
    if (!editor) return;

    const clearHoverTimer = () => {
      if (hoverTimerRef.current !== null) window.clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    };
    const clearCloseTimer = () => {
      if (closeTimerRef.current !== null) window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    };
    const closeSoon = () => {
      clearCloseTimer();
      closeTimerRef.current = window.setTimeout(() => {
        setLinkHover(null);
        setEditingLink(false);
      }, 180);
    };
    const showAnchor = (anchor: HTMLAnchorElement, delay = 260) => {
      clearHoverTimer();
      clearCloseTimer();
      hoverTimerRef.current = window.setTimeout(() => {
        const rect = anchor.getBoundingClientRect();
        const width = Math.min(390, Math.max(280, window.innerWidth - 16));
        const left = Math.max(8, Math.min(rect.left, window.innerWidth - width - 8));
        const below = rect.bottom + 8;
        const top = below + 64 < window.innerHeight ? below : Math.max(8, rect.top - 56);
        const href = anchor.getAttribute('href') || '';
        setEditingLink(false);
        setEditingHref(href);
        setLinkHover({ anchor, href, left, top });
      }, delay);
    };

    const onMouseOver = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest<HTMLAnchorElement>('a[href]');
      if (!anchor || !editor.contains(anchor)) return;
      showAnchor(anchor);
    };
    const onMouseOut = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest<HTMLAnchorElement>('a[href]');
      if (!anchor || !editor.contains(anchor)) return;
      const related = event.relatedTarget as Node | null;
      if (related && anchor.contains(related)) return;
      closeSoon();
    };
    const onFocusIn = (event: FocusEvent) => {
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest<HTMLAnchorElement>('a[href]');
      if (anchor && editor.contains(anchor)) showAnchor(anchor, 0);
    };
    const onEditorScroll = () => {
      clearHoverTimer();
      setLinkHover(null);
      setEditingLink(false);
    };

    editor.addEventListener('mouseover', onMouseOver);
    editor.addEventListener('mouseout', onMouseOut);
    editor.addEventListener('focusin', onFocusIn);
    document.querySelector('.docs-editor-workspace')?.addEventListener('scroll', onEditorScroll);
    window.addEventListener('resize', onEditorScroll);

    return () => {
      clearHoverTimer();
      clearCloseTimer();
      editor.removeEventListener('mouseover', onMouseOver);
      editor.removeEventListener('mouseout', onMouseOut);
      editor.removeEventListener('focusin', onFocusIn);
      document.querySelector('.docs-editor-workspace')?.removeEventListener('scroll', onEditorScroll);
      window.removeEventListener('resize', onEditorScroll);
    };
  }, []);

  useEffect(() => {
    if (!linkHover) return;
    const closeOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (linkCardRef.current?.contains(target) || linkHover.anchor.contains(target)) return;
      setLinkHover(null);
      setEditingLink(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setLinkHover(null);
        setEditingLink(false);
      }
    };
    document.addEventListener('mousedown', closeOutside);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', closeOutside);
      window.removeEventListener('keydown', onKey);
    };
  }, [linkHover]);

  function closeDialog() {
    setMode(null);
    setValue('');
  }

  function applyLink(href: string) {
    const editor = document.querySelector<HTMLElement>('.editor-page');
    const range = savedRangeRef.current;
    if (!editor || !range) return;
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
    editor.focus({ preventScroll: true });
    document.execCommand('createLink', false, href);
    editor.dispatchEvent(new Event('input', { bubbles: true }));
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (mode === 'search') {
      const cleanValue = value.trim();
      if (!cleanValue) return;
      const browserFind = (window as typeof window & { find?: (...args: unknown[]) => boolean }).find;
      browserFind?.call(window, cleanValue, false, false, true, false, true, false);
      closeDialog();
      return;
    }

    if (mode === 'link') {
      if (linkKind === 'url') {
        const cleanValue = normalizeHref(value);
        if (!cleanValue) return;
        applyLink(cleanValue);
      } else {
        const target = headingElementsRef.current.get(headingValue);
        if (!target) return;
        if (!target.id) {
          let id = slugify(target.innerText || 'section');
          let suffix = 2;
          while (document.getElementById(id) && document.getElementById(id) !== target) {
            id = `${slugify(target.innerText || 'section')}-${suffix++}`;
          }
          target.id = id;
        }
        applyLink(`#${target.id}`);
      }
      closeDialog();
    }
  }

  function openHoveredLink() {
    if (!linkHover) return;
    if (linkHover.href.startsWith('#')) {
      const target = document.getElementById(linkHover.href.slice(1));
      target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    window.open(resolvedHref(linkHover.href), '_blank', 'noopener,noreferrer');
  }

  async function copyHoveredLink() {
    if (!linkHover) return;
    const text = resolvedHref(linkHover.href);
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const area = document.createElement('textarea');
      area.value = text;
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      document.execCommand('copy');
      area.remove();
    }
  }

  function saveHoveredLink() {
    if (!linkHover) return;
    const href = normalizeHref(editingHref);
    if (!href) return;
    linkHover.anchor.setAttribute('href', href);
    document.querySelector<HTMLElement>('.editor-page')?.dispatchEvent(new Event('input', { bubbles: true }));
    setLinkHover({ ...linkHover, href });
    setEditingLink(false);
  }

  function removeHoveredLink() {
    if (!linkHover) return;
    const editor = document.querySelector<HTMLElement>('.editor-page');
    const anchor = linkHover.anchor;
    anchor.replaceWith(...Array.from(anchor.childNodes));
    editor?.dispatchEvent(new Event('input', { bubbles: true }));
    setLinkHover(null);
    setEditingLink(false);
  }

  const isSearch = mode === 'search';
  const canSubmit = isSearch ? Boolean(value.trim()) : linkKind === 'url' ? Boolean(value.trim()) : Boolean(headingValue);

  return (
    <>
      {linkHover && !mode && (
        <div
          ref={linkCardRef}
          className="fwo-link-hover-card"
          style={{ left: linkHover.left, top: linkHover.top }}
          role="group"
          aria-label="Link actions"
          onMouseEnter={() => {
            if (closeTimerRef.current !== null) window.clearTimeout(closeTimerRef.current);
            closeTimerRef.current = null;
          }}
          onMouseLeave={() => {
            if (editingLink) return;
            if (closeTimerRef.current !== null) window.clearTimeout(closeTimerRef.current);
            closeTimerRef.current = window.setTimeout(() => setLinkHover(null), 180);
          }}
        >
          {!editingLink ? (
            <>
              <button className="fwo-link-site" type="button" onClick={openHoveredLink} aria-label="Open link">
                <ExternalLink />
                <span>{linkHover.href.startsWith('#') ? `Heading ${linkHover.href}` : linkHover.href}</span>
              </button>
              <button className="fwo-link-action" type="button" onClick={copyHoveredLink} aria-label="Copy link"><Copy /></button>
              <button className="fwo-link-action" type="button" onClick={() => { setEditingHref(linkHover.href); setEditingLink(true); }} aria-label="Edit link"><Pencil /></button>
              <button className="fwo-link-action" type="button" onClick={removeHoveredLink} aria-label="Remove link"><Unlink2 /></button>
            </>
          ) : (
            <>
              <LinkIcon className="fwo-link-edit-icon" />
              <input autoFocus className="fwo-link-edit-input" value={editingHref} onChange={(event) => setEditingHref(event.target.value)} onKeyDown={(event) => {
                if (event.key === 'Enter') { event.preventDefault(); saveHoveredLink(); }
                if (event.key === 'Escape') { event.preventDefault(); setEditingLink(false); }
              }} aria-label="Link address" />
              <button className="fwo-link-action" type="button" onClick={saveHoveredLink} aria-label="Save link"><Check /></button>
              <button className="fwo-link-action" type="button" onClick={() => setEditingLink(false)} aria-label="Cancel editing"><X /></button>
            </>
          )}
        </div>
      )}

      {mode && (
        <div className="fwo-dialog-backdrop" role="presentation" onMouseDown={closeDialog}>
          <form className="fwo-dialog" role="dialog" aria-modal="true" aria-labelledby="fwo-dialog-title" onSubmit={submit} onMouseDown={(event) => event.stopPropagation()}>
            <div className="fwo-dialog-header">
              <span className="fwo-dialog-icon" aria-hidden="true">{isSearch ? <Search /> : <LinkIcon />}</span>
              <div>
                <h2 id="fwo-dialog-title">{isSearch ? 'Find in document' : 'Insert link'}</h2>
                <p>{isSearch ? 'Search the text in your document.' : 'Link selected text to a web address, heading, or bookmark.'}</p>
              </div>
              <button className="fwo-dialog-close" type="button" onClick={closeDialog} aria-label="Close dialog"><X /></button>
            </div>

            {!isSearch && (
              <div className="fwo-link-tabs" role="tablist" aria-label="Link type">
                <button type="button" className={linkKind === 'url' ? 'active' : ''} onClick={() => setLinkKind('url')}>Web address</button>
                <button type="button" className={linkKind === 'heading' ? 'active' : ''} onClick={() => setLinkKind('heading')}>Heading / bookmark</button>
              </div>
            )}

            {(isSearch || linkKind === 'url') && (
              <label className="fwo-dialog-field">
                <span>{isSearch ? 'Search text' : 'Web address'}</span>
                <input autoFocus type={isSearch ? 'search' : 'text'} inputMode={isSearch ? 'search' : 'url'} value={value} onChange={(event) => setValue(event.target.value)} placeholder={isSearch ? 'Type what you want to find' : 'https://example.com'} spellCheck={false} />
              </label>
            )}

            {!isSearch && linkKind === 'heading' && (
              <label className="fwo-dialog-field">
                <span>Document destination</span>
                <select autoFocus value={headingValue} onChange={(event) => setHeadingValue(event.target.value)}>
                  {headingTargets.length ? headingTargets.map((target) => <option key={target.value} value={target.value}>{target.label}</option>) : <option value="">No headings or bookmarks yet</option>}
                </select>
              </label>
            )}

            <div className="fwo-dialog-actions">
              <button className="fwo-dialog-cancel" type="button" onClick={closeDialog}>Cancel</button>
              <button className="fwo-dialog-primary" type="submit" disabled={!canSubmit}>{isSearch ? 'Find' : 'Insert link'}</button>
            </div>
          </form>
        </div>
      )}

      <style jsx global>{`
        .fwo-link-hover-card { position: fixed; z-index: 7600; min-width: 290px; max-width: min(390px,calc(100vw - 16px)); height: 48px; box-sizing: border-box; padding: 5px 6px; display: flex; align-items: center; gap: 3px; border: 1px solid #e2e6ea; border-radius: 12px; background: #fff; box-shadow: 0 4px 14px rgba(60,64,67,.22),0 1px 3px rgba(60,64,67,.16); color: #3c4043; font-family: Arial,Helvetica,sans-serif; animation: fwo-link-card-in 100ms ease-out; }
        .fwo-link-site { min-width: 0; flex: 1 1 auto; height: 36px; padding: 0 8px; border: 0; border-radius: 8px; background: transparent; display: grid; grid-template-columns: 18px minmax(0,1fr); align-items: center; gap: 8px; text-align: left; color: #0b57d0; cursor: pointer; }
        .fwo-link-site:hover { background: #f1f3f4; }
        .fwo-link-site svg { width: 17px; height: 17px; color: #3c4043; stroke-width: 2; }
        .fwo-link-site span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 13px; }
        .fwo-link-action { width: 36px; height: 36px; flex: 0 0 36px; border: 0; border-radius: 8px; background: transparent; color: #3c4043; display: grid; place-items: center; cursor: pointer; }
        .fwo-link-action:hover { background: #f1f3f4; }
        .fwo-link-action svg { width: 18px; height: 18px; stroke-width: 2; }
        .fwo-link-edit-icon { width: 18px; height: 18px; margin-left: 7px; flex: 0 0 auto; color: #5f6368; }
        .fwo-link-edit-input { min-width: 0; flex: 1 1 auto; height: 34px; box-sizing: border-box; border: 1px solid #a8c7fa; border-radius: 8px; outline: 0; padding: 0 9px; color: #202124; background: #fff; font: 400 13px/1 Arial,Helvetica,sans-serif; box-shadow: 0 0 0 2px rgba(11,87,208,.1); }
        .editor-page a[href] { color: #1155cc; text-decoration: underline; text-underline-offset: 2px; cursor: pointer; }
        @keyframes fwo-link-card-in { from { opacity: 0; transform: translateY(-2px) scale(.99); } to { opacity: 1; transform: translateY(0) scale(1); } }

        .fwo-dialog-backdrop { position: fixed; inset: 0; z-index: 1300; display: grid; place-items: center; padding: 20px; background: rgba(32,33,36,.24); backdrop-filter: blur(2px); animation: fwo-fade-in 120ms ease-out; }
        .fwo-dialog { width: min(450px, calc(100vw - 32px)); border: 1px solid #e2e6ea; border-radius: 20px; background: #fff; box-shadow: 0 18px 48px rgba(32,33,36,.22),0 2px 8px rgba(32,33,36,.12); padding: 20px; color: #202124; font-family: Arial,Helvetica,sans-serif; animation: fwo-dialog-in 150ms cubic-bezier(.2,.8,.2,1); }
        .fwo-dialog-header { display: grid; grid-template-columns: 42px minmax(0,1fr) 36px; align-items: start; gap: 12px; }
        .fwo-dialog-icon { width: 42px; height: 42px; border-radius: 14px; display: grid; place-items: center; background: #e8f0fe; color: #0b57d0; }
        .fwo-dialog-icon svg { width: 20px; height: 20px; stroke-width: 2; }
        .fwo-dialog h2 { margin: 1px 0 4px; font-size: 18px; line-height: 1.3; font-weight: 600; letter-spacing: -.01em; }
        .fwo-dialog p { margin: 0; color: #5f6368; font-size: 13px; line-height: 1.45; }
        .fwo-dialog-close { width: 36px; height: 36px; border: 0; border-radius: 18px; background: transparent; color: #5f6368; display: grid; place-items: center; cursor: pointer; }
        .fwo-dialog-close:hover { background: #f1f3f4; color: #202124; }
        .fwo-dialog-close svg { width: 18px; height: 18px; }
        .fwo-link-tabs { margin-top: 18px; padding: 3px; border-radius: 10px; background: #f1f3f4; display: grid; grid-template-columns: 1fr 1fr; gap: 3px; }
        .fwo-link-tabs button { min-height: 34px; border: 0; border-radius: 8px; background: transparent; color: #5f6368; font-size: 12px; font-weight: 600; cursor: pointer; }
        .fwo-link-tabs button.active { background: #fff; color: #0b57d0; box-shadow: 0 1px 3px rgba(60,64,67,.14); }
        .fwo-dialog-field { display: grid; gap: 7px; margin-top: 18px; }
        .fwo-dialog-field > span { color: #3c4043; font-size: 12px; font-weight: 600; }
        .fwo-dialog-field input, .fwo-dialog-field select { width: 100%; height: 48px; box-sizing: border-box; border: 1px solid #c9cdd2; border-radius: 12px; outline: 0; background: #fff; color: #202124; padding: 0 14px; font: 400 14px/1 Arial,Helvetica,sans-serif; transition: border-color 120ms ease,box-shadow 120ms ease; }
        .fwo-dialog-field input::placeholder { color: #8a9097; }
        .fwo-dialog-field input:focus, .fwo-dialog-field select:focus { border-color: #0b57d0; box-shadow: 0 0 0 2px rgba(11,87,208,.14); }
        .fwo-dialog-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 20px; }
        .fwo-dialog-actions button { min-width: 78px; height: 38px; border-radius: 19px; padding: 0 16px; font: 600 13px/1 Arial,Helvetica,sans-serif; cursor: pointer; }
        .fwo-dialog-cancel { border: 1px solid #d7dce1; background: #fff; color: #0b57d0; }
        .fwo-dialog-cancel:hover { background: #f7f9fc; }
        .fwo-dialog-primary { border: 1px solid #0b57d0; background: #0b57d0; color: #fff; }
        .fwo-dialog-primary:hover:not(:disabled) { background: #0847ad; border-color: #0847ad; }
        .fwo-dialog-primary:disabled { border-color: #d8dce1; background: #e5e8eb; color: #92979d; cursor: default; }
        @keyframes fwo-fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fwo-dialog-in { from { opacity: 0; transform: translateY(8px) scale(.985); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @media (max-width: 560px) { .fwo-dialog-backdrop { align-items: end; padding: 12px; } .fwo-dialog { width: 100%; border-radius: 20px; padding: 18px; } .fwo-link-hover-card { width: calc(100vw - 16px); min-width: 0; left: 8px !important; } }
      `}</style>
    </>
  );
}
