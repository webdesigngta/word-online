'use client';

import { useEffect, useRef, useState } from 'react';
import { Download, FileText, FolderOpen, ImagePlus, RefreshCw, ShieldCheck } from 'lucide-react';
import { trackToolEvent } from '@/lib/toolAnalytics';
import { finishWordDocument, type WordFinishMode } from '@/tools/word/finish/docxFinish';

type DownloadState = { url: string; name: string; size: number } | null;

type ModeInfo = {
  heading: string;
  intro: string;
  suffix: string;
  action: string;
};

const modeInfo: Record<WordFinishMode, ModeInfo> = {
  'page-numbers': { heading: 'Add page numbers to Word', intro: 'Add a live PAGE field to the footer of each DOCX section.', suffix: 'page-numbers', action: 'Add page numbers' },
  signature: { heading: 'Add signature to Word', intro: 'Append a visible PNG or JPG signature image to the document without changing the original file.', suffix: 'signed', action: 'Add signature' },
  watermark: { heading: 'Add watermark to Word', intro: 'Add a light diagonal text watermark through the document header.', suffix: 'watermarked', action: 'Add watermark' },
  'header-footer': { heading: 'Add header and footer to Word', intro: 'Add text to the default header, footer, or both across DOCX sections.', suffix: 'header-footer', action: 'Add header / footer' },
  redact: { heading: 'Redact Word document', intro: 'Permanently replace specified text with block characters in document text, headers, footers, notes, and comments.', suffix: 'redacted', action: 'Redact document' },
};

function baseName(name: string) {
  return name.replace(/\.docx$/i, '').replace(/[\\/:*?"<>|]+/g, '').trim() || 'document';
}

function formatBytes(value: number) {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

async function imageRatio(file: File) {
  if (typeof createImageBitmap === 'function') {
    const bitmap = await createImageBitmap(file);
    const ratio = bitmap.width / Math.max(1, bitmap.height);
    bitmap.close();
    return ratio;
  }
  return new Promise<number>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      const ratio = image.naturalWidth / Math.max(1, image.naturalHeight);
      URL.revokeObjectURL(url);
      resolve(ratio);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read the signature image.'));
    };
    image.src = url;
  });
}

export function WordFinishInterface({ mode, toolId }: { mode: WordFinishMode; toolId: string }) {
  const docxInputRef = useRef<HTMLInputElement>(null);
  const signatureInputRef = useRef<HTMLInputElement>(null);
  const downloadRef = useRef<DownloadState>(null);
  const [file, setFile] = useState<File | null>(null);
  const [signature, setSignature] = useState<File | null>(null);
  const [alignment, setAlignment] = useState<'left' | 'center' | 'right'>(mode === 'page-numbers' ? 'center' : 'left');
  const [headerText, setHeaderText] = useState('');
  const [footerText, setFooterText] = useState('');
  const [watermarkText, setWatermarkText] = useState('DRAFT');
  const [signatureWidth, setSignatureWidth] = useState(45);
  const [redactionText, setRedactionText] = useState('');
  const [status, setStatus] = useState('Choose a DOCX file to begin.');
  const [busy, setBusy] = useState(false);
  const [download, setDownload] = useState<DownloadState>(null);
  const info = modeInfo[mode];

  useEffect(() => {
    downloadRef.current = download;
  }, [download]);

  useEffect(() => () => {
    const current = downloadRef.current;
    if (current) URL.revokeObjectURL(current.url);
  }, []);

  function clearDownload() {
    const current = downloadRef.current;
    if (current) URL.revokeObjectURL(current.url);
    downloadRef.current = null;
    setDownload(null);
  }

  function chooseDocx(selected?: File) {
    if (!selected) return;
    clearDownload();
    if (!/\.docx$/i.test(selected.name)) {
      setFile(null);
      setStatus('Choose a DOCX file.');
      return;
    }
    if (selected.size <= 0 || selected.size > 50 * 1024 * 1024) {
      setFile(null);
      setStatus('DOCX files must be between 1 byte and 50 MB.');
      return;
    }
    setFile(selected);
    setStatus(`${selected.name} is ready.`);
    trackToolEvent('tool_start', { toolId, fileType: 'docx', metadata: { size: selected.size } });
    if (docxInputRef.current) docxInputRef.current.value = '';
  }

  function chooseSignature(selected?: File) {
    if (!selected) return;
    clearDownload();
    if (!/\.(?:png|jpe?g)$/i.test(selected.name) || !/^image\/(?:png|jpeg)$/i.test(selected.type || 'image/jpeg')) {
      setSignature(null);
      setStatus('Choose a PNG or JPG signature image.');
      return;
    }
    if (selected.size <= 0 || selected.size > 10 * 1024 * 1024) {
      setSignature(null);
      setStatus('Signature images must be between 1 byte and 10 MB.');
      return;
    }
    setSignature(selected);
    setStatus(`${selected.name} will be appended as the visible signature.`);
    if (signatureInputRef.current) signatureInputRef.current.value = '';
  }

  async function apply() {
    if (!file || busy) return;
    setBusy(true);
    clearDownload();
    setStatus('Updating the DOCX package locally in your browser…');
    try {
      const options: Parameters<typeof finishWordDocument>[2] = { alignment };
      if (mode === 'header-footer') {
        options.headerText = headerText;
        options.footerText = footerText;
      } else if (mode === 'watermark') {
        options.watermarkText = watermarkText;
      } else if (mode === 'signature') {
        if (!signature) throw new Error('Choose a PNG or JPG signature image.');
        options.signatureBytes = new Uint8Array(await signature.arrayBuffer());
        options.signatureExtension = /\.png$/i.test(signature.name) ? 'png' : 'jpg';
        options.signatureWidthMm = signatureWidth;
        options.signatureAspectRatio = await imageRatio(signature);
      } else if (mode === 'redact') {
        options.redactionTerms = redactionText.split(/\r?\n|,/).map((term) => term.trim()).filter(Boolean);
      }

      const result = await finishWordDocument(file, mode, options);
      const name = `${baseName(file.name)}-${info.suffix}.docx`;
      const next = { url: URL.createObjectURL(result.blob), name, size: result.blob.size };
      downloadRef.current = next;
      setDownload(next);
      setStatus(mode === 'redact' ? `Redaction complete · ${result.redactionCount ?? 0} match${result.redactionCount === 1 ? '' : 'es'} replaced.` : `${info.action} complete. Your new DOCX is ready.`);
      trackToolEvent('tool_success', { toolId, fileType: 'docx', outputType: 'docx', metadata: mode === 'redact' ? { redactionCount: result.redactionCount ?? 0 } : undefined });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not update this DOCX file.';
      setStatus(message);
      trackToolEvent('tool_error', { toolId, fileType: 'docx', metadata: { message } });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="word-finish-tool">
      <style>{`
        .word-finish-tool{display:grid;gap:16px}.wft-drop{border:2px dashed #d5dae2;border-radius:18px;background:#fbfcfe;padding:28px;text-align:center}.wft-drop svg{width:44px;height:44px;color:#0b57d0;margin-bottom:9px}.wft-drop h2{margin:0;font-size:21px}.wft-drop p{max-width:640px;margin:8px auto 17px;color:#5f6368;line-height:1.55}.wft-btn{border:1px solid #dadce0;border-radius:22px;background:#fff;color:#202124;padding:9px 15px;font-weight:650;cursor:pointer;display:inline-flex;align-items:center;gap:7px;text-decoration:none}.wft-btn.primary{background:#0b57d0;border-color:#0b57d0;color:#fff}.wft-btn.success{background:#137333;border-color:#137333;color:#fff}.wft-btn:disabled{opacity:.5;cursor:not-allowed}.wft-file,.wft-output{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:13px 15px;border:1px solid #e0e3e7;border-radius:14px;background:#fff}.wft-file strong,.wft-output strong{display:block;overflow:hidden;text-overflow:ellipsis}.wft-file span,.wft-output span,.wft-status{display:block;color:#5f6368;font-size:12px;margin-top:3px}.wft-panel{border:1px solid #e0e3e7;border-radius:14px;background:#fff;padding:16px;display:grid;gap:13px}.wft-row{display:grid;grid-template-columns:1fr 1fr;gap:12px}.wft-field{display:grid;gap:6px}.wft-field label{font-size:12px;font-weight:700;color:#3c4043}.wft-input,.wft-select,.wft-textarea{width:100%;border:1px solid #dadce0;border-radius:10px;background:#fff;padding:10px 11px;font:inherit;color:#202124;outline:none}.wft-input:focus,.wft-select:focus,.wft-textarea:focus{border-color:#0b57d0;box-shadow:0 0 0 1px #0b57d0}.wft-textarea{min-height:120px;resize:vertical;line-height:1.5}.wft-note{padding:10px 12px;border-radius:10px;background:#fef7e0;color:#5f4b00;font-size:12px;line-height:1.5}.wft-signature{display:flex;align-items:center;justify-content:space-between;gap:12px;border:1px solid #e0e3e7;border-radius:11px;padding:12px}.wft-actions{display:flex;gap:8px;flex-wrap:wrap}.wft-range{width:100%}@media(max-width:680px){.wft-row{grid-template-columns:1fr}.wft-file,.wft-output,.wft-signature{align-items:flex-start;flex-direction:column}.wft-drop{padding:22px 14px}}
      `}</style>
      <input ref={docxInputRef} hidden type="file" accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={(event) => chooseDocx(event.target.files?.[0])} />
      <input ref={signatureInputRef} hidden type="file" accept=".png,.jpg,.jpeg,image/png,image/jpeg" onChange={(event) => chooseSignature(event.target.files?.[0])} />

      <div className="wft-drop"><FileText /><h2>{info.heading}</h2><p>{info.intro}</p><button className="wft-btn primary" type="button" disabled={busy} onClick={() => docxInputRef.current?.click()}><FolderOpen size={17}/>{file ? 'Choose another DOCX' : 'Choose DOCX'}</button></div>

      {file ? <div className="wft-file"><div><strong>{file.name}</strong><span>{formatBytes(file.size)} · Original file remains unchanged</span></div><button className="wft-btn" type="button" disabled={busy} onClick={() => { clearDownload(); setFile(null); setStatus('Choose a DOCX file to begin.'); }}><RefreshCw size={16}/>Reset</button></div> : null}

      {file ? <div className="wft-panel">
        {mode === 'page-numbers' ? <div className="wft-field"><label>Page-number alignment</label><select className="wft-select" value={alignment} onChange={(event) => setAlignment(event.target.value as typeof alignment)}><option value="left">Left</option><option value="center">Center</option><option value="right">Right</option></select></div> : null}

        {mode === 'header-footer' ? <><div className="wft-row"><div className="wft-field"><label>Header text</label><input className="wft-input" value={headerText} onChange={(event) => setHeaderText(event.target.value)} placeholder="Optional header text" /></div><div className="wft-field"><label>Footer text</label><input className="wft-input" value={footerText} onChange={(event) => setFooterText(event.target.value)} placeholder="Optional footer text" /></div></div><div className="wft-field"><label>Alignment</label><select className="wft-select" value={alignment} onChange={(event) => setAlignment(event.target.value as typeof alignment)}><option value="left">Left</option><option value="center">Center</option><option value="right">Right</option></select></div></> : null}

        {mode === 'watermark' ? <><div className="wft-field"><label>Watermark text</label><input className="wft-input" value={watermarkText} onChange={(event) => setWatermarkText(event.target.value)} maxLength={80} placeholder="DRAFT" /></div><div className="wft-note">The watermark is added as a light diagonal VML watermark in the document header for broad Microsoft Word compatibility.</div></> : null}

        {mode === 'signature' ? <><div className="wft-signature"><div><strong>{signature?.name || 'No signature image selected'}</strong><span className="wft-status">PNG or JPG · up to 10 MB · visible image signature, not a cryptographic digital signature</span></div><button className="wft-btn" type="button" onClick={() => signatureInputRef.current?.click()}><ImagePlus size={16}/>{signature ? 'Change image' : 'Choose signature'}</button></div><div className="wft-row"><div className="wft-field"><label>Signature width · {signatureWidth} mm</label><input className="wft-range" type="range" min="20" max="100" value={signatureWidth} onChange={(event) => setSignatureWidth(Number(event.target.value))} /></div><div className="wft-field"><label>Alignment</label><select className="wft-select" value={alignment} onChange={(event) => setAlignment(event.target.value as typeof alignment)}><option value="left">Left</option><option value="center">Center</option><option value="right">Right</option></select></div></div><div className="wft-note">The signature image is appended as a new paragraph near the end of the document, before the final section properties. It does not create a certificate-backed signature.</div></> : null}

        {mode === 'redact' ? <><div className="wft-field"><label>Words or phrases to redact</label><textarea className="wft-textarea" value={redactionText} onChange={(event) => setRedactionText(event.target.value)} placeholder={'One term per line\nAccount number\nPrivate name'} /></div><div className="wft-note"><ShieldCheck size={14} style={{verticalAlign:'middle',marginRight:6}}/>Matched underlying text is replaced with block characters, including matches split across Word text runs. This is permanent text replacement, not a visual overlay. Review the output before sharing it.</div></> : null}

        <div className="wft-actions"><button className="wft-btn primary" type="button" disabled={busy} onClick={() => void apply()}>{busy ? <RefreshCw size={16}/> : <FileText size={16}/>} {busy ? 'Processing…' : info.action}</button></div>
      </div> : null}

      <div className="wft-status" role="status">{status}</div>
      {download ? <div className="wft-output"><div><strong>{download.name}</strong><span>{formatBytes(download.size)}</span></div><a className="wft-btn success" href={download.url} download={download.name} onClick={() => trackToolEvent('tool_download', { toolId, outputType: 'docx' })}><Download size={16}/>Download DOCX</a></div> : null}
    </div>
  );
}
