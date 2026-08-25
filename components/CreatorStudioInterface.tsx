'use client';

import { useMemo, useState } from 'react';
import { Download, FileText, RefreshCw } from 'lucide-react';
import { creatorDefinitions, type CreatorMode } from '@/tools/creator/creatorDefinitions';
import { buildCreatorHtml } from '@/tools/creator/creatorRender';
import { creatorDocx, creatorPdf, plainTextFromHtml } from '@/tools/creator/creatorExport';
import { downloadDocumentBlob } from '@/tools/document/formatHelpers';

function initialValues(mode: CreatorMode) {
  const definition = creatorDefinitions[mode];
  const today = new Date().toISOString().slice(0, 10);
  return Object.fromEntries(definition.fields.map((field) => [field.id, field.defaultValue ?? (field.type === 'date' ? today : '')]));
}

function safeBaseName(value: string) {
  return value.replace(/[\\/:*?"<>|]+/g, '').trim() || 'document';
}

export function CreatorStudioInterface({ mode }: { mode: CreatorMode }) {
  const definition = creatorDefinitions[mode];
  const [values, setValues] = useState<Record<string, string>>(() => initialValues(mode));
  const [busy, setBusy] = useState<'docx' | 'pdf' | 'txt' | null>(null);
  const [status, setStatus] = useState(definition.intro);
  const html = useMemo(() => buildCreatorHtml(mode, values), [mode, values]);

  function update(id: string, value: string) {
    setValues((current) => ({ ...current, [id]: value }));
  }

  async function exportDocx() {
    setBusy('docx');
    setStatus('Building DOCX…');
    try {
      const blob = await creatorDocx(html);
      downloadDocumentBlob(blob, `${safeBaseName(definition.filename)}.docx`);
      setStatus('DOCX downloaded.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not create DOCX.');
    } finally {
      setBusy(null);
    }
  }

  async function exportPdf() {
    setBusy('pdf');
    setStatus('Building PDF…');
    try {
      const blob = await creatorPdf(html, safeBaseName(definition.filename));
      downloadDocumentBlob(blob, `${safeBaseName(definition.filename)}.pdf`);
      setStatus('PDF downloaded.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not create PDF.');
    } finally {
      setBusy(null);
    }
  }

  function exportTxt() {
    setBusy('txt');
    const text = plainTextFromHtml(html);
    downloadDocumentBlob(new Blob([text], { type: 'text/plain;charset=utf-8' }), `${safeBaseName(definition.filename)}.txt`);
    setStatus('TXT downloaded.');
    setBusy(null);
  }

  function reset() {
    setValues(initialValues(mode));
    setStatus('Form reset.');
  }

  return (
    <div className="fwo-creator">
      <style>{`
        .fwo-creator{display:grid;gap:16px}.fwo-creator-head{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}.fwo-creator-title{display:flex;align-items:center;gap:10px}.fwo-creator-icon{width:42px;height:42px;border-radius:12px;background:#e6f4ea;color:#137333;display:grid;place-items:center}.fwo-creator-icon svg{width:21px}.fwo-creator-copy strong{display:block;font-size:14px}.fwo-creator-copy span{display:block;color:#5f6368;font-size:12px;margin-top:3px}.fwo-creator-actions{display:flex;gap:8px;flex-wrap:wrap}.fwo-creator-btn{border:1px solid #dadce0;border-radius:20px;background:#fff;color:#202124;padding:9px 14px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:7px}.fwo-creator-btn.primary{background:#0b57d0;border-color:#0b57d0;color:#fff}.fwo-creator-btn:disabled{opacity:.55;cursor:not-allowed}.fwo-creator-btn svg{width:16px}.fwo-creator-layout{display:grid;grid-template-columns:minmax(320px,.85fr) minmax(420px,1.15fr);gap:16px;align-items:start}.fwo-creator-form{border:1px solid #dadce0;border-radius:14px;background:#fff;padding:18px;display:grid;gap:13px;max-height:72vh;overflow:auto}.fwo-creator-field{display:grid;gap:6px}.fwo-creator-field label{font-size:12px;font-weight:700;color:#3c4043}.fwo-creator-field input,.fwo-creator-field textarea{width:100%;border:1px solid #dadce0;border-radius:9px;padding:10px 11px;font:14px/1.45 Arial,sans-serif;color:#202124;outline:none;background:#fff}.fwo-creator-field textarea{resize:vertical;min-height:78px}.fwo-creator-field input:focus,.fwo-creator-field textarea:focus{border-color:#0b57d0;box-shadow:0 0 0 1px #0b57d0}.fwo-creator-preview-wrap{background:#f1f3f4;border-radius:14px;padding:18px;max-height:72vh;overflow:auto}.fwo-creator-preview-label{font-size:12px;font-weight:700;color:#5f6368;margin:0 0 10px}.fwo-creator-paper{background:#fff;max-width:794px;min-height:980px;margin:0 auto;padding:54px 58px;box-shadow:0 1px 3px rgba(60,64,67,.2);font:14px/1.55 Arial,sans-serif;color:#202124}.fwo-creator-paper h1{font-size:28px;margin:0 0 7px;line-height:1.2}.fwo-creator-paper h2{font-size:16px;border-bottom:1px solid #dadce0;padding-bottom:4px;margin:24px 0 9px}.fwo-creator-paper h3{margin:0 0 8px}.fwo-creator-paper .meta{color:#5f6368;font-size:12px}.fwo-creator-paper table{width:100%;border-collapse:collapse;margin:12px 0}.fwo-creator-paper th,.fwo-creator-paper td{border:1px solid #dadce0;padding:7px;text-align:left;vertical-align:top}.fwo-creator-paper .totals{text-align:right}.fwo-creator-paper .checklist{list-style:none;padding:0}.fwo-creator-paper .checklist li{padding:4px 0}.fwo-creator-note{font-size:12px;color:#5f6368;background:#f8fafd;border-radius:10px;padding:10px 12px}@media(max-width:900px){.fwo-creator-layout{grid-template-columns:1fr}.fwo-creator-form,.fwo-creator-preview-wrap{max-height:none}.fwo-creator-paper{min-height:700px;padding:34px 28px}}@media(max-width:600px){.fwo-creator-btn{padding:8px 10px}.fwo-creator-paper{padding:28px 20px}}
      `}</style>
      <div className="fwo-creator-head">
        <div className="fwo-creator-title"><div className="fwo-creator-icon"><FileText /></div><div className="fwo-creator-copy"><strong>{definition.name}</strong><span>{status}</span></div></div>
        <div className="fwo-creator-actions">
          <button className="fwo-creator-btn" type="button" disabled={busy !== null} onClick={reset}><RefreshCw />Reset</button>
          <button className="fwo-creator-btn" type="button" disabled={busy !== null} onClick={exportTxt}><Download />TXT</button>
          <button className="fwo-creator-btn" type="button" disabled={busy !== null} onClick={() => void exportDocx()}><Download />{busy === 'docx' ? 'Building…' : 'DOCX'}</button>
          <button className="fwo-creator-btn primary" type="button" disabled={busy !== null} onClick={() => void exportPdf()}><Download />{busy === 'pdf' ? 'Building…' : 'PDF'}</button>
        </div>
      </div>
      <div className="fwo-creator-layout">
        <div className="fwo-creator-form">
          {definition.fields.map((field) => <div className="fwo-creator-field" key={field.id}><label htmlFor={`creator-${field.id}`}>{field.label}</label>{field.type === 'textarea' ? <textarea id={`creator-${field.id}`} rows={field.rows ?? 4} placeholder={field.placeholder} value={values[field.id] ?? ''} onChange={(event) => update(field.id, event.target.value)} /> : <input id={`creator-${field.id}`} type={field.type ?? 'text'} placeholder={field.placeholder} value={values[field.id] ?? ''} onChange={(event) => update(field.id, event.target.value)} />}</div>)}
        </div>
        <div className="fwo-creator-preview-wrap"><div className="fwo-creator-preview-label">LIVE DOCUMENT PREVIEW</div><div className="fwo-creator-paper" dangerouslySetInnerHTML={{ __html: html }} /></div>
      </div>
      <div className="fwo-creator-note">Everything is assembled in your browser. DOCX and PDF exports are generated from the supported document structure shown in the live preview; you can edit the downloaded files further in compatible office software.</div>
    </div>
  );
}
