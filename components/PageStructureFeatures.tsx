'use client';

import { FileText, LayoutTemplate, Plus, Settings2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

type Panel = 'menu' | 'pageSetup' | 'templates' | null;
type Anchor = { left: number; top: number };
type Template = { id: string; name: string; description: string; title: string; html: string };

const TEMPLATES: Template[] = [
  {
    id: 'blank',
    name: 'Blank document',
    description: 'Start with a clean page.',
    title: 'Untitled document',
    html: '<p><br></p>',
  },
  {
    id: 'resume',
    name: 'Professional resume',
    description: 'Simple one-page resume structure.',
    title: 'Resume',
    html: '<h1>Your Name</h1><p><strong>City, Province · email@example.com · 000-000-0000</strong></p><hr><h2>Professional Summary</h2><p>Write a concise summary of your experience and strengths.</p><h2>Experience</h2><p><strong>Job Title — Company</strong></p><p>Month Year – Month Year</p><ul><li>Describe a measurable accomplishment.</li><li>Describe your responsibilities and impact.</li></ul><h2>Education</h2><p><strong>Program — School</strong></p><h2>Skills</h2><p>Skill · Skill · Skill</p>',
  },
  {
    id: 'cover-letter',
    name: 'Cover letter',
    description: 'Professional cover-letter framework.',
    title: 'Cover Letter',
    html: '<p>Your Name<br>Your Address<br>City, Province Postal Code<br>email@example.com · 000-000-0000</p><p>Date</p><p>Hiring Manager<br>Company Name<br>Company Address</p><p>Dear Hiring Manager,</p><p>I am writing to apply for the [Position] role at [Company].</p><p>Use this paragraph to connect your experience and results to the role.</p><p>Use this paragraph to explain why you are interested in the company and how you can contribute.</p><p>Thank you for your consideration. I would welcome the opportunity to discuss my application.</p><p>Sincerely,<br>Your Name</p>',
  },
  {
    id: 'business-letter',
    name: 'Business letter',
    description: 'Formal letter with standard sections.',
    title: 'Business Letter',
    html: '<p><strong>Your Name</strong><br>Your Organization<br>Your Address<br>City, Province Postal Code</p><p>Date</p><p>Recipient Name<br>Recipient Organization<br>Recipient Address</p><p>Dear [Name],</p><p>State the purpose of your letter clearly in the opening paragraph.</p><p>Add the important details, context, and requested next steps here.</p><p>Thank you for your time and consideration.</p><p>Sincerely,<br>Your Name</p>',
  },
  {
    id: 'meeting-notes',
    name: 'Meeting notes',
    description: 'Agenda, decisions and action items.',
    title: 'Meeting Notes',
    html: '<h1>Meeting Notes</h1><p><strong>Date:</strong> </p><p><strong>Attendees:</strong> </p><h2>Agenda</h2><ol><li>Topic one</li><li>Topic two</li></ol><h2>Notes</h2><p>Capture the key discussion points here.</p><h2>Decisions</h2><ul><li>Decision</li></ul><h2>Action Items</h2><table><tbody><tr><th>Action</th><th>Owner</th><th>Due</th></tr><tr><td><br></td><td><br></td><td><br></td></tr></tbody></table>',
  },
  {
    id: 'report',
    name: 'Project report',
    description: 'Structured report with summary and findings.',
    title: 'Project Report',
    html: '<h1>Project Report</h1><p><strong>Prepared by:</strong> </p><p><strong>Date:</strong> </p><h2>Executive Summary</h2><p>Summarize the purpose, key findings, and recommendation.</p><h2>Background</h2><p>Provide the relevant context.</p><h2>Findings</h2><ul><li>Finding one</li><li>Finding two</li></ul><h2>Recommendations</h2><ol><li>Recommendation one</li><li>Recommendation two</li></ol><h2>Next Steps</h2><p>List owners, dates, and follow-up actions.</p>',
  },
  {
    id: 'invoice',
    name: 'Simple invoice',
    description: 'Editable invoice for services or products.',
    title: 'Invoice',
    html: '<h1>INVOICE</h1><p><strong>Your Business Name</strong><br>Address<br>email@example.com · 000-000-0000</p><p><strong>Invoice #:</strong> 0001<br><strong>Date:</strong> <br><strong>Due:</strong> </p><h2>Bill To</h2><p>Client Name<br>Client Address</p><table><tbody><tr><th>Description</th><th>Qty</th><th>Rate</th><th>Amount</th></tr><tr><td>Service or product</td><td>1</td><td>$0.00</td><td>$0.00</td></tr><tr><td><strong>Total</strong></td><td></td><td></td><td><strong>$0.00</strong></td></tr></tbody></table><p><strong>Payment terms:</strong> </p><p>Thank you for your business.</p>',
  },
];

function editor() {
  return document.querySelector<HTMLElement>('.editor-page');
}

function dispatchEditorInput(root: HTMLElement) {
  root.dispatchEvent(new Event('input', { bubbles: true }));
}

function setDocumentTitle(value: string) {
  const input = document.querySelector<HTMLInputElement>('.docs-document-title');
  if (!input) return;
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
  if (setter) setter.call(input, value);
  else input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function regionText(type: 'header' | 'footer') {
  return editor()?.querySelector<HTMLElement>(`[data-fwo-${type}]`)?.innerText.trim() ?? '';
}

function upsertRegion(type: 'header' | 'footer', value: string) {
  const root = editor();
  if (!root) return;
  const selector = `[data-fwo-${type}]`;
  const existing = root.querySelector<HTMLElement>(selector);
  const clean = value.trim();

  if (!clean) {
    existing?.remove();
    dispatchEditorInput(root);
    return;
  }

  const node = existing ?? document.createElement('div');
  node.setAttribute(`data-fwo-${type}`, 'true');
  node.setAttribute('contenteditable', 'false');
  node.innerHTML = clean.split(/\r?\n/).map(escapeHtml).join('<br>');

  if (!existing) {
    if (type === 'header') root.insertBefore(node, root.firstChild);
    else root.appendChild(node);
  }
  dispatchEditorInput(root);
}

function currentPageCount() {
  const root = editor();
  if (!root) return 1;
  return Math.max(1, root.querySelectorAll('[data-fwo-page-break]').length + 1);
}

function documentHasContent(root: HTMLElement) {
  const text = root.innerText.replace(/\s+/g, ' ').trim();
  const meaningful = Array.from(root.children).some((child) => {
    if (!(child instanceof HTMLElement)) return false;
    if (child.hasAttribute('data-fwo-header') || child.hasAttribute('data-fwo-footer')) return false;
    if (child.hasAttribute('data-fwo-page-break')) return false;
    return (child.innerText || '').trim() || child.querySelector('img,table,hr');
  });
  return Boolean(text || meaningful);
}

export function PageStructureFeatures() {
  const savedRangeRef = useRef<Range | null>(null);
  const [toolbarTarget, setToolbarTarget] = useState<HTMLElement | null>(null);
  const [panel, setPanel] = useState<Panel>(null);
  const [anchor, setAnchor] = useState<Anchor>({ left: 16, top: 120 });
  const [header, setHeader] = useState('');
  const [footer, setFooter] = useState('');
  const [pageCount, setPageCount] = useState(1);
  const [toast, setToast] = useState('');

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast((current) => current === message ? '' : current), 2200);
  }

  function refreshPageCount() {
    setPageCount(currentPageCount());
  }

  function rememberSelection() {
    const root = editor();
    const selection = window.getSelection();
    if (!root || !selection?.rangeCount) return;
    const range = selection.getRangeAt(0);
    if (root.contains(range.commonAncestorContainer)) savedRangeRef.current = range.cloneRange();
  }

  function restoreSelection() {
    const root = editor();
    const range = savedRangeRef.current;
    if (!root || !range) return null;
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
    root.focus({ preventScroll: true });
    return range;
  }

  function insertPageBreak() {
    const root = editor();
    if (!root) return;
    const range = restoreSelection();
    if (!range) {
      showToast('Place the cursor in the document first');
      return;
    }

    if ((range.startContainer instanceof HTMLElement && range.startContainer.closest('[data-fwo-header],[data-fwo-footer]')) ||
        (range.startContainer.parentElement?.closest('[data-fwo-header],[data-fwo-footer]'))) {
      showToast('Place the cursor in the document body first');
      return;
    }

    const marker = document.createElement('div');
    marker.setAttribute('data-fwo-page-break', 'true');
    marker.setAttribute('contenteditable', 'false');
    marker.setAttribute('aria-label', 'Page break');
    marker.innerHTML = '<span>Page break</span>';

    const after = document.createElement('p');
    after.innerHTML = '<br>';

    range.deleteContents();
    range.insertNode(after);
    range.insertNode(marker);
    range.setStart(after, 0);
    range.collapse(true);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
    dispatchEditorInput(root);
    refreshPageCount();
    setPanel(null);
    showToast('Page break inserted');
  }

  function openPageSetup() {
    setHeader(regionText('header'));
    setFooter(regionText('footer'));
    setPanel('pageSetup');
  }

  function savePageSetup() {
    upsertRegion('header', header);
    upsertRegion('footer', footer);
    setPanel(null);
    showToast('Header and footer updated');
  }

  function applyTemplate(template: Template) {
    const root = editor();
    if (!root) return;
    if (documentHasContent(root) && !window.confirm(`Replace the current document with the “${template.name}” template?`)) return;
    root.innerHTML = template.html;
    setDocumentTitle(template.title);
    dispatchEditorInput(root);
    refreshPageCount();
    setPanel(null);
    root.focus({ preventScroll: true });
    showToast(`${template.name} loaded`);
  }

  useEffect(() => {
    const findTarget = () => setToolbarTarget(document.querySelector<HTMLElement>('.docs-toolbar'));
    findTarget();
    const observer = new MutationObserver(findTarget);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const root = editor();
    if (!root) return;
    refreshPageCount();
    const observer = new MutationObserver(refreshPageCount);
    observer.observe(root, { childList: true, subtree: true });
    const onSelection = () => rememberSelection();
    document.addEventListener('selectionchange', onSelection);
    return () => {
      observer.disconnect();
      document.removeEventListener('selectionchange', onSelection);
    };
  }, [toolbarTarget]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
        const root = editor();
        const active = document.activeElement;
        if (!root || !(active === root || root.contains(active))) return;
        event.preventDefault();
        rememberSelection();
        insertPageBreak();
      }
      if (event.key === 'Escape') setPanel(null);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  if (!toolbarTarget) return null;

  const trigger = (
    <button
      type="button"
      className="docs-toolbar-icon fwo-page-tools-trigger"
      aria-label="Page tools"
      title={`Page tools · ${pageCount} ${pageCount === 1 ? 'page' : 'pages'}`}
      onMouseDown={() => rememberSelection()}
      onClick={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        setAnchor({
          left: Math.max(8, Math.min(window.innerWidth - 286, rect.left)),
          top: Math.min(window.innerHeight - 280, rect.bottom + 6),
        });
        setPanel((current) => current === 'menu' ? null : 'menu');
      }}
    >
      <FileText />
      <span className="fwo-page-count-badge">{pageCount}</span>
    </button>
  );

  const overlays = (
    <>
      {panel === 'menu' && (
        <div className="fwo-page-popover" style={{ left: anchor.left, top: anchor.top }} role="menu">
          <button type="button" onClick={insertPageBreak}><Plus /><span><strong>Page break</strong><small>Start the next page · Ctrl/⌘ + Enter</small></span></button>
          <button type="button" onClick={openPageSetup}><Settings2 /><span><strong>Headers & footers</strong><small>Shown in the editor and exported to DOCX</small></span></button>
          <button type="button" onClick={() => setPanel('templates')}><LayoutTemplate /><span><strong>Templates</strong><small>Resume, letter, notes, report and invoice</small></span></button>
          <div className="fwo-page-popover-foot">{pageCount} {pageCount === 1 ? 'page' : 'pages'} in this document</div>
        </div>
      )}

      {panel === 'pageSetup' && (
        <div className="fwo-phase4-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setPanel(null); }}>
          <div className="fwo-phase4-dialog" role="dialog" aria-modal="true" aria-labelledby="fwo-page-setup-title">
            <div className="fwo-phase4-dialog-head"><div><h2 id="fwo-page-setup-title">Headers & footers</h2><p>These repeat as real header/footer content when you download DOCX.</p></div><button type="button" aria-label="Close" onClick={() => setPanel(null)}><X /></button></div>
            <label>Header<textarea value={header} onChange={(event) => setHeader(event.target.value)} placeholder="Optional header text" /></label>
            <label>Footer<textarea value={footer} onChange={(event) => setFooter(event.target.value)} placeholder="Optional footer text" /></label>
            <div className="fwo-phase4-dialog-actions"><button type="button" className="secondary" onClick={() => { setHeader(''); setFooter(''); }}>Clear both</button><span /><button type="button" className="secondary" onClick={() => setPanel(null)}>Cancel</button><button type="button" className="primary" onClick={savePageSetup}>Apply</button></div>
          </div>
        </div>
      )}

      {panel === 'templates' && (
        <div className="fwo-phase4-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setPanel(null); }}>
          <div className="fwo-phase4-dialog fwo-template-dialog" role="dialog" aria-modal="true" aria-labelledby="fwo-template-title">
            <div className="fwo-phase4-dialog-head"><div><h2 id="fwo-template-title">Start from a template</h2><p>Each template opens directly in the same Word editor.</p></div><button type="button" aria-label="Close" onClick={() => setPanel(null)}><X /></button></div>
            <div className="fwo-template-grid">
              {TEMPLATES.map((template) => <button type="button" key={template.id} onClick={() => applyTemplate(template)}><span className="fwo-template-preview"><FileText /></span><strong>{template.name}</strong><small>{template.description}</small></button>)}
            </div>
          </div>
        </div>
      )}

      {toast && <div className="fwo-phase4-toast" role="status">{toast}</div>}

      <style jsx global>{`
        .fwo-page-tools-trigger { position:relative; overflow:visible!important; }
        .fwo-page-count-badge { position:absolute; right:1px; bottom:1px; min-width:13px; height:13px; padding:0 3px; border-radius:7px; background:#0b57d0; color:#fff; font:700 8px/13px Arial,sans-serif; text-align:center; }
        .fwo-page-popover { position:fixed; z-index:7000; width:278px; padding:7px; border:1px solid #e0e3e7; border-radius:12px; background:#fff; box-shadow:0 10px 30px rgba(60,64,67,.24); font-family:Arial,Helvetica,sans-serif; }
        .fwo-page-popover > button { width:100%; border:0; border-radius:8px; background:transparent; padding:10px; display:grid; grid-template-columns:24px minmax(0,1fr); gap:10px; color:#303134; text-align:left; cursor:pointer; }
        .fwo-page-popover > button:hover { background:#f1f3f4; }
        .fwo-page-popover svg { width:18px; height:18px; margin-top:2px; }
        .fwo-page-popover span { display:grid; gap:3px; }
        .fwo-page-popover strong { font-size:13px; font-weight:500; }
        .fwo-page-popover small { color:#5f6368; font-size:11px; line-height:1.35; }
        .fwo-page-popover-foot { margin:5px 4px 0; padding:8px 7px 4px; border-top:1px solid #e8eaed; color:#80868b; font-size:10px; }
        .editor-page [data-fwo-header],.editor-page [data-fwo-footer] { color:#5f6368; font-size:10pt; line-height:1.35; cursor:default; user-select:none; }
        .editor-page [data-fwo-header] { min-height:34px; margin:-42px 0 28px; padding:0 0 10px; border-bottom:1px dashed #dadce0; }
        .editor-page [data-fwo-footer] { min-height:34px; margin:34px 0 -42px; padding:10px 0 0; border-top:1px dashed #dadce0; }
        .editor-page [data-fwo-page-break] { position:relative; height:46px; margin:54px -73px; border-top:1px solid #c7c7c7; border-bottom:1px solid #c7c7c7; background:#f8fafd; break-after:page; page-break-after:always; cursor:default; user-select:none; }
        .editor-page [data-fwo-page-break] span { position:absolute; left:50%; top:50%; transform:translate(-50%,-50%); padding:2px 8px; border-radius:9px; background:#fff; color:#80868b; font:10px/16px Arial,sans-serif; box-shadow:0 0 0 1px #e0e3e7; }
        .fwo-phase4-backdrop { position:fixed; inset:0; z-index:7200; display:grid; place-items:center; padding:20px; background:rgba(32,33,36,.30); font-family:Arial,Helvetica,sans-serif; }
        .fwo-phase4-dialog { width:min(560px,94vw); max-height:90vh; overflow:auto; padding:20px; border-radius:16px; background:#fff; box-shadow:0 14px 40px rgba(60,64,67,.28); color:#202124; }
        .fwo-phase4-dialog-head { display:flex; justify-content:space-between; gap:16px; margin-bottom:18px; }
        .fwo-phase4-dialog-head h2 { margin:0; font-size:20px; font-weight:500; }
        .fwo-phase4-dialog-head p { margin:5px 0 0; color:#5f6368; font-size:12px; line-height:1.4; }
        .fwo-phase4-dialog-head > button { width:36px; height:36px; border:0; border-radius:18px; background:transparent; color:#444746; cursor:pointer; }
        .fwo-phase4-dialog-head > button:hover { background:#f1f3f4; }
        .fwo-phase4-dialog-head svg { width:18px; height:18px; }
        .fwo-phase4-dialog label { display:grid; gap:7px; margin:14px 0; color:#3c4043; font-size:12px; font-weight:500; }
        .fwo-phase4-dialog textarea { min-height:78px; resize:vertical; border:1px solid #dadce0; border-radius:10px; padding:10px 12px; outline:0; color:#202124; font:13px/1.5 Arial,sans-serif; }
        .fwo-phase4-dialog textarea:focus { border-color:#0b57d0; box-shadow:0 0 0 1px #0b57d0; }
        .fwo-phase4-dialog-actions { display:flex; align-items:center; gap:8px; margin-top:18px; }
        .fwo-phase4-dialog-actions span { flex:1; }
        .fwo-phase4-dialog-actions button { min-height:36px; border-radius:18px; padding:0 16px; cursor:pointer; font-size:12px; font-weight:500; }
        .fwo-phase4-dialog-actions .secondary { border:1px solid #dadce0; background:#fff; color:#0b57d0; }
        .fwo-phase4-dialog-actions .primary { border:0; background:#0b57d0; color:#fff; }
        .fwo-template-dialog { width:min(720px,96vw); }
        .fwo-template-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:10px; }
        .fwo-template-grid > button { border:1px solid #e0e3e7; border-radius:12px; background:#fff; padding:12px; display:grid; grid-template-columns:42px minmax(0,1fr); grid-template-rows:auto auto; column-gap:11px; text-align:left; color:#202124; cursor:pointer; }
        .fwo-template-grid > button:hover { border-color:#a8c7fa; background:#f8fafd; }
        .fwo-template-preview { grid-row:1 / span 2; width:42px; height:52px; border:1px solid #dadce0; border-radius:4px; display:grid; place-items:center; color:#0b57d0; background:#fff; }
        .fwo-template-preview svg { width:22px; height:22px; }
        .fwo-template-grid strong { align-self:end; font-size:13px; font-weight:500; }
        .fwo-template-grid small { align-self:start; margin-top:3px; color:#5f6368; font-size:11px; line-height:1.35; }
        .fwo-phase4-toast { position:fixed; z-index:7600; left:50%; bottom:28px; transform:translateX(-50%); max-width:min(420px,90vw); padding:9px 14px; border-radius:8px; background:#303134; color:#fff; font:12px/1.4 Arial,sans-serif; box-shadow:0 4px 14px rgba(0,0,0,.22); }
        @media print { .editor-page [data-fwo-page-break] { height:0; margin:0; border:0; background:transparent; } .editor-page [data-fwo-page-break] span { display:none; } }
        @media(max-width:600px) { .fwo-template-grid { grid-template-columns:1fr; } .fwo-phase4-dialog { padding:16px; } }
      `}</style>
    </>
  );

  return (
    <>
      {createPortal(trigger, toolbarTarget)}
      {createPortal(overlays, document.body)}
    </>
  );
}
