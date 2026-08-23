'use client';

import { useEffect, useRef, useState } from 'react';

type MenuKind = 'align' | 'spacing' | 'checklist' | 'bullets' | 'numbering' | null;
type Point = { left: number; top: number };

function editor() {
  return document.querySelector<HTMLElement>('.editor-page[contenteditable="true"], .editor-page');
}

function saveRange() {
  const ed = editor();
  const selection = window.getSelection();
  if (!ed || !selection?.rangeCount) return null;
  const range = selection.getRangeAt(0);
  return ed.contains(range.commonAncestorContainer) ? range.cloneRange() : null;
}

function restoreRange(range: Range | null) {
  const ed = editor();
  if (!ed || !range) return;
  const selection = window.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);
  ed.focus({ preventScroll: true });
}

function inputChanged() {
  editor()?.dispatchEvent(new Event('input', { bubbles: true }));
}

function selectedBlocks(range: Range | null) {
  const ed = editor();
  if (!ed || !range) return [] as HTMLElement[];
  const blocks = Array.from(ed.querySelectorAll<HTMLElement>('p,h1,h2,h3,h4,h5,h6,li,div')).filter((el) => {
    try { return range.intersectsNode(el); } catch { return false; }
  });
  if (blocks.length) return blocks.filter((block) => !blocks.some((other) => other !== block && block.contains(other)));
  let node: Node | null = range.startContainer;
  if (node.nodeType === Node.TEXT_NODE) node = node.parentElement;
  const block = node instanceof HTMLElement ? node.closest<HTMLElement>('p,h1,h2,h3,h4,h5,h6,li,div') : null;
  return block ? [block] : [];
}

export function ToolbarGalleryMenus() {
  const [menu, setMenu] = useState<MenuKind>(null);
  const [point, setPoint] = useState<Point>({ left: 8, top: 100 });
  const rangeRef = useRef<Range | null>(null);
  const [lineSpacing, setLineSpacing] = useState('1.15');

  function open(kind: Exclude<MenuKind, null>, button: HTMLElement) {
    rangeRef.current = saveRange();
    const rect = button.getBoundingClientRect();
    const width = kind === 'bullets' || kind === 'numbering' ? 260 : kind === 'spacing' ? 278 : 180;
    const left = Math.max(8, Math.min(rect.left, window.innerWidth - width - 8));
    setPoint({ left, top: Math.min(window.innerHeight - 90, rect.bottom + 6) });
    setMenu(kind);
  }

  function command(name: string, value?: string) {
    restoreRange(rangeRef.current);
    document.execCommand(name, false, value);
    inputChanged();
    setMenu(null);
  }

  function applyBlocks(mutator: (block: HTMLElement) => void) {
    restoreRange(rangeRef.current);
    selectedBlocks(rangeRef.current).forEach(mutator);
    inputChanged();
    setMenu(null);
  }

  function applyLine(value: string) {
    setLineSpacing(value);
    applyBlocks((block) => { block.style.lineHeight = value; });
  }

  function customSpacing() {
    const line = window.prompt('Line spacing (for example 1.25)', lineSpacing);
    if (!line) return;
    const parsed = Number(line);
    if (!Number.isFinite(parsed) || parsed < 0.5 || parsed > 5) return;
    const before = window.prompt('Space before paragraph in px', '0');
    if (before === null) return;
    const after = window.prompt('Space after paragraph in px', '0');
    if (after === null) return;
    setLineSpacing(String(parsed));
    applyBlocks((block) => {
      block.style.lineHeight = String(parsed);
      block.style.marginTop = `${Math.max(0, Number(before) || 0)}px`;
      block.style.marginBottom = `${Math.max(0, Number(after) || 0)}px`;
    });
  }

  function applyBullet(style: string) {
    restoreRange(rangeRef.current);
    document.execCommand('insertUnorderedList');
    const ed = editor();
    const selection = window.getSelection();
    let node: Node | null = selection?.anchorNode ?? null;
    if (node?.nodeType === Node.TEXT_NODE) node = node.parentElement;
    const list = node instanceof HTMLElement ? node.closest<HTMLUListElement>('ul') : null;
    if (list && ed?.contains(list)) list.style.listStyleType = style;
    inputChanged();
    setMenu(null);
  }

  function applyNumber(style: string) {
    restoreRange(rangeRef.current);
    document.execCommand('insertOrderedList');
    const ed = editor();
    const selection = window.getSelection();
    let node: Node | null = selection?.anchorNode ?? null;
    if (node?.nodeType === Node.TEXT_NODE) node = node.parentElement;
    const list = node instanceof HTMLElement ? node.closest<HTMLOListElement>('ol') : null;
    if (list && ed?.contains(list)) list.style.listStyleType = style;
    inputChanged();
    setMenu(null);
  }

  function checklist(style: 'box' | 'check') {
    restoreRange(rangeRef.current);
    const range = rangeRef.current;
    if (!range) return;
    const selected = range.toString().trim();
    const lines = selected ? selected.split(/\n+/).map((x) => x.trim()).filter(Boolean) : [''];
    const escape = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const html = `<ul class="fwo-checklist fwo-check-${style}" data-fwo-checklist="true">${lines.map((line) => `<li data-fwo-check-item="true" data-checked="false">${line ? escape(line) : '<br>'}</li>`).join('')}</ul>`;
    document.execCommand('insertHTML', false, html);
    inputChanged();
    setMenu(null);
  }

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const button = target?.closest<HTMLButtonElement>('button');
      if (!button) return;
      const label = (button.getAttribute('aria-label') || button.getAttribute('title') || '').trim();
      let kind: Exclude<MenuKind, null> | null = null;
      if (label === 'Alignment options') kind = 'align';
      else if (label === 'Line spacing') kind = 'spacing';
      else if (label === 'Checklist options' || label === 'Checklist') kind = 'checklist';
      else if (label === 'Bulleted list') kind = 'bullets';
      else if (label === 'Numbered list') kind = 'numbering';
      if (!kind) return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      open(kind, button);
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);

  useEffect(() => {
    if (!menu) return;
    const close = (event: MouseEvent) => {
      const el = event.target as HTMLElement | null;
      if (!el?.closest('.fwo-gallery-popover')) setMenu(null);
    };
    const key = (event: KeyboardEvent) => { if (event.key === 'Escape') setMenu(null); };
    window.setTimeout(() => document.addEventListener('mousedown', close), 0);
    window.addEventListener('keydown', key);
    return () => { document.removeEventListener('mousedown', close); window.removeEventListener('keydown', key); };
  }, [menu]);

  return (
    <>
      {menu && (
        <div className={`fwo-gallery-popover fwo-gallery-${menu}`} style={{ left: point.left, top: point.top }} role="menu">
          {menu === 'align' && <div className="fwo-align-grid">
            {[
              ['Left', 'justifyLeft', 'left'], ['Center', 'justifyCenter', 'center'], ['Right', 'justifyRight', 'right'], ['Justify', 'justifyFull', 'justify'],
            ].map(([name, cmd, align]) => <button key={name} type="button" onClick={() => command(cmd)} aria-label={`Align ${name.toLowerCase()}`}><span className={`fwo-lines ${align}`}><i/><i/><i/></span><small>{name}</small></button>)}
          </div>}

          {menu === 'spacing' && <div className="fwo-text-menu">
            {['1','1.15','1.5','2'].map((value) => <button type="button" key={value} onClick={() => applyLine(value)}><span className="check">{lineSpacing === value ? '✓' : ''}</span><span>{value === '1' ? 'Single' : value === '2' ? 'Double' : value}</span></button>)}
            <hr/>
            <button type="button" onClick={() => applyBlocks((b) => { b.style.marginTop = '12px'; })}>Add space before paragraph</button>
            <button type="button" onClick={() => applyBlocks((b) => { b.style.marginBottom = '12px'; })}>Add space after paragraph</button>
            <hr/>
            <button type="button" onClick={customSpacing}>Custom spacing…</button>
            <hr/>
            <button type="button" onClick={() => applyBlocks((b) => { b.style.breakAfter = 'avoid'; })}>Keep with next</button>
            <button type="button" onClick={() => applyBlocks((b) => { b.style.breakInside = 'avoid'; })}>Keep lines together</button>
            <button type="button" onClick={() => applyBlocks((b) => { b.style.orphans = '2'; b.style.widows = '2'; })}>Prevent single lines</button>
            <button type="button" onClick={() => applyBlocks((b) => { b.style.breakBefore = 'page'; })}>Add page break before</button>
          </div>}

          {menu === 'checklist' && <div className="fwo-check-grid">
            <button type="button" onClick={() => checklist('box')}><span>☐ ─────</span><span>☑ ─────</span></button>
            <button type="button" onClick={() => checklist('check')}><span>□ ─────</span><span>✓ ─────</span></button>
          </div>}

          {menu === 'bullets' && <div className="fwo-style-grid">
            {[
              ['disc','•'], ['circle','○'], ['square','■'], ['"◆  "','◆'], ['"➤  "','➤'], ['"★  "','★'],
            ].map(([style, glyph]) => <button key={style} type="button" onClick={() => applyBullet(style)}><b>{glyph}</b><span>────────</span><b>{glyph}</b><span>──────</span><b>{glyph}</b><span>────</span></button>)}
          </div>}

          {menu === 'numbering' && <div className="fwo-style-grid fwo-number-grid">
            {[
              ['decimal',['1.','2.','3.']], ['decimal-leading-zero',['01.','02.','03.']], ['lower-alpha',['a.','b.','c.']], ['upper-alpha',['A.','B.','C.']], ['lower-roman',['i.','ii.','iii.']], ['upper-roman',['I.','II.','III.']],
            ].map(([style, labels]) => <button key={style as string} type="button" onClick={() => applyNumber(style as string)}>{(labels as string[]).map((x) => <span key={x}><b>{x}</b> ─────</span>)}</button>)}
          </div>}
        </div>
      )}
      <style jsx global>{`
        .fwo-gallery-popover { position: fixed; z-index: 6100; box-sizing: border-box; max-height: calc(100vh - 110px); overflow: auto; padding: 7px; border: 1px solid #dfe3e7; border-radius: 10px; background: #fff; box-shadow: 0 8px 24px rgba(60,64,67,.24),0 2px 5px rgba(60,64,67,.12); font-family: Arial,Helvetica,sans-serif; color:#202124; }
        .fwo-gallery-align { width: 184px; }
        .fwo-gallery-spacing { width: 278px; }
        .fwo-gallery-checklist { width: 220px; }
        .fwo-gallery-bullets,.fwo-gallery-numbering { width: 266px; }
        .fwo-align-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:4px; }
        .fwo-align-grid button,.fwo-check-grid button,.fwo-style-grid button { border:1px solid #d5d9dd; background:#fff; border-radius:5px; cursor:pointer; color:#3c4043; }
        .fwo-align-grid button { min-height:64px; padding:7px 4px 5px; display:grid; place-items:center; gap:4px; }
        .fwo-align-grid button:hover,.fwo-check-grid button:hover,.fwo-style-grid button:hover { background:#eef3fb; border-color:#a8c7fa; }
        .fwo-align-grid small { font-size:9px; }
        .fwo-lines { width:28px; display:grid; gap:3px; }
        .fwo-lines i { height:2px; background:#5f6368; display:block; }
        .fwo-lines i:nth-child(2){width:75%}.fwo-lines.center i:nth-child(2){justify-self:center}.fwo-lines.right i:nth-child(2){justify-self:end}.fwo-lines.justify i:nth-child(2){width:100%}
        .fwo-text-menu { display:grid; }
        .fwo-text-menu button { min-height:34px; border:0; border-radius:5px; background:transparent; padding:7px 12px; text-align:left; font-size:13px; color:#202124; cursor:pointer; }
        .fwo-text-menu button:hover { background:#f1f3f4; }
        .fwo-text-menu button:has(.check) { display:grid; grid-template-columns:22px 1fr; align-items:center; }
        .fwo-text-menu .check { color:#3c4043; font-size:15px; }
        .fwo-text-menu hr { width:100%; border:0; border-top:1px solid #e0e3e7; margin:5px 0; }
        .fwo-check-grid { display:grid; grid-template-columns:1fr 1fr; gap:7px; }
        .fwo-check-grid button { min-height:70px; padding:9px; display:grid; gap:7px; text-align:left; font-size:12px; }
        .fwo-style-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:6px; }
        .fwo-style-grid button { min-height:92px; padding:8px; display:grid; grid-template-columns:16px 1fr; align-content:center; align-items:center; gap:4px; text-align:left; font-size:10px; }
        .fwo-style-grid button b { font-size:13px; }
        .fwo-number-grid button { grid-template-columns:1fr; gap:6px; }
        .fwo-number-grid button span { display:block; white-space:nowrap; }
        .docs-toolbar button[aria-label='Bulleted list'],.docs-toolbar button[aria-label='Numbered list'],.docs-toolbar button[aria-label='Line spacing'] { width:auto !important; min-width:38px; padding-right:13px; position:relative; }
        .docs-toolbar button[aria-label='Bulleted list']::after,.docs-toolbar button[aria-label='Numbered list']::after,.docs-toolbar button[aria-label='Line spacing']::after { content:'▾'; position:absolute; right:3px; top:50%; transform:translateY(-50%); font-size:9px; color:#5f6368; }
        .fwo-check-check li[data-fwo-check-item]::before { content:'✓' !important; border:1px solid #5f6368; width:14px; height:14px; display:grid; place-items:center; font-size:10px !important; top:2px !important; }
        @media(max-width:520px){ .fwo-gallery-popover { left:8px !important; right:8px; width:auto !important; max-height:calc(100vh - 100px); } .fwo-style-grid{grid-template-columns:repeat(3,minmax(0,1fr));} }
      `}</style>
    </>
  );
}
