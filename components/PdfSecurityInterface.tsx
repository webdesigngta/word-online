'use client';

import { useEffect, useRef, useState } from 'react';
import { Download, FileUp, LockKeyhole, ShieldCheck, Trash2, UnlockKeyhole, Wrench } from 'lucide-react';
import { trackToolEvent } from '@/lib/toolAnalytics';
import type { PdfSecurityMode } from '@/tools/pdf/security';

type DownloadState = { name: string; url: string; size: number } | null;

function formatBytes(value: number) {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

const modeCopy: Record<PdfSecurityMode, { action: string; working: string; suffix: string }> = {
  protect: { action: 'Protect PDF', working: 'Encrypting PDF…', suffix: 'protected' },
  unlock: { action: 'Unlock PDF', working: 'Decrypting PDF…', suffix: 'unlocked' },
  repair: { action: 'Repair PDF', working: 'Rewriting PDF structure…', suffix: 'repaired' },
};

export function PdfSecurityInterface({ mode, toolId }: { mode: PdfSecurityMode; toolId: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('Choose a PDF file to begin.');
  const [download, setDownload] = useState<DownloadState>(null);

  useEffect(() => () => { if (download) URL.revokeObjectURL(download.url); }, [download]);

  function clearOutput() {
    if (download) URL.revokeObjectURL(download.url);
    setDownload(null);
  }

  function chooseFile(fileList: FileList | null) {
    const next = fileList?.[0];
    if (!next) return;
    if (!(next.type === 'application/pdf' || /\.pdf$/i.test(next.name))) {
      setStatus('Please choose a PDF file.');
      return;
    }
    clearOutput();
    setFile(next);
    setStatus(`${next.name} is ready.`);
    trackToolEvent('tool_start', { toolId, fileType: 'pdf', metadata: { mode, size: next.size } });
  }

  function reset() {
    clearOutput();
    setFile(null);
    setPassword('');
    setConfirmPassword('');
    setStatus('Choose a PDF file to begin.');
    if (inputRef.current) inputRef.current.value = '';
  }

  const passwordMissing = mode !== 'repair' && !password;
  const passwordMismatch = mode === 'protect' && password !== confirmPassword;
  const canRun = Boolean(file) && !busy && !passwordMissing && !passwordMismatch;

  async function run() {
    if (!file || !canRun) return;
    setBusy(true);
    clearOutput();
    setStatus(modeCopy[mode].working);
    try {
      const { pdfSecurityProcessor } = await import('@/tools/pdf/security');
      const result = await pdfSecurityProcessor.process(file as never, { mode, password });
      if (!result.success || !result.data) throw new Error(result.errors[0]?.message || 'PDF operation failed.');
      const name = `${file.name.replace(/\.pdf$/i, '') || 'document'}-${modeCopy[mode].suffix}.pdf`;
      const blob = new Blob([result.data as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setDownload({ name, url, size: blob.size });
      const warning = result.warnings[0];
      setStatus(warning ? `Done with warning: ${warning}` : `Done. Created ${formatBytes(blob.size)} PDF.`);
      trackToolEvent('tool_success', { toolId, fileType: 'pdf', metadata: { mode, resultingSize: blob.size, warning: Boolean(warning) } });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'PDF operation failed.';
      setStatus(message);
      trackToolEvent('tool_error', { toolId, fileType: 'pdf', metadata: { mode, message } });
    } finally {
      setBusy(false);
    }
  }

  const Icon = mode === 'protect' ? LockKeyhole : mode === 'unlock' ? UnlockKeyhole : Wrench;

  return <div className="pdf-security-tool">
    <style>{`
      .pdf-security-tool{display:grid;gap:15px}.pdf-security-drop{border:2px dashed #d4d9e1;border-radius:18px;padding:26px;text-align:center;background:#f8fafd}.pdf-security-drop>svg{width:44px;height:44px;color:#0b57d0}.pdf-security-drop h2{margin:9px 0 5px;font-size:21px}.pdf-security-drop p{margin:0 0 14px;color:#5f6368}.pdf-security-button{border:1px solid #d4d9e1;background:#fff;color:#202124;border-radius:22px;padding:10px 15px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:7px;text-decoration:none}.pdf-security-button.primary{background:#0b57d0;border-color:#0b57d0;color:#fff}.pdf-security-button.success{background:#137333;border-color:#137333;color:#fff}.pdf-security-button:disabled{opacity:.45;cursor:not-allowed}.pdf-security-file{display:flex;justify-content:space-between;align-items:center;gap:12px;border:1px solid #e0e3e7;border-radius:12px;padding:11px 13px}.pdf-security-file strong{display:block}.pdf-security-file span{display:block;color:#5f6368;font-size:11px;margin-top:2px}.pdf-security-controls{display:grid;gap:10px;border:1px solid #e0e3e7;border-radius:14px;padding:13px}.pdf-security-field label{display:block;font-size:12px;font-weight:700;margin-bottom:5px}.pdf-security-field input{width:100%;box-sizing:border-box;border:1px solid #d4d9e1;border-radius:10px;padding:10px 11px;background:#fff}.pdf-security-help{color:#5f6368;font-size:12px}.pdf-security-error{color:#b3261e;font-size:12px}.pdf-security-actions{display:flex;gap:9px;align-items:center;flex-wrap:wrap}.pdf-security-status{color:#5f6368;font-size:13px}.pdf-security-output{display:flex;justify-content:space-between;align-items:center;gap:12px;border:1px solid #cde3d3;background:#f4faf6;border-radius:14px;padding:13px}.pdf-security-output-main{display:flex;align-items:center;gap:9px;min-width:0}.pdf-security-output-main strong{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.pdf-security-output-main span{display:block;color:#5f6368;font-size:11px;margin-top:2px}@media(max-width:650px){.pdf-security-drop{padding:20px 12px}.pdf-security-output,.pdf-security-file{align-items:flex-start;flex-direction:column}}
    `}</style>
    <input ref={inputRef} hidden type="file" accept="application/pdf,.pdf" onChange={(event)=>chooseFile(event.target.files)} />
    <div className="pdf-security-drop"><FileUp/><h2>Choose a PDF file</h2><p>{mode==='protect'?'Add 256-bit password protection to a new PDF copy.':mode==='unlock'?'Remove password encryption from a PDF when you know its password.':'Rewrite PDF structure with QPDF recovery enabled when the file can be read.'}</p><button type="button" className="pdf-security-button primary" disabled={busy} onClick={()=>inputRef.current?.click()}><FileUp size={16}/>{file?'Choose again':'Choose PDF'}</button></div>
    {file?<div className="pdf-security-file"><div><strong>{file.name}</strong><span>{formatBytes(file.size)}</span></div><button type="button" className="pdf-security-button" disabled={busy} onClick={reset}><Trash2 size={15}/>Clear</button></div>:null}
    {mode!=='repair'?<div className="pdf-security-controls"><div className="pdf-security-field"><label htmlFor={`${toolId}-password`}>{mode==='protect'?'Open password':'Current PDF password'}</label><input id={`${toolId}-password`} type="password" autoComplete="new-password" value={password} disabled={busy} onChange={(event)=>setPassword(event.target.value)} /></div>{mode==='protect'?<div className="pdf-security-field"><label htmlFor={`${toolId}-confirm`}>Confirm password</label><input id={`${toolId}-confirm`} type="password" autoComplete="new-password" value={confirmPassword} disabled={busy} onChange={(event)=>setConfirmPassword(event.target.value)} /></div>:null}<div className="pdf-security-help">{mode==='protect'?'Use a strong password you can remember. The tool creates a separate encrypted copy.':'Unlocking requires a valid password for the PDF. This tool is not intended to bypass access controls.'}</div>{passwordMismatch?<div className="pdf-security-error">Passwords do not match.</div>:null}</div>:null}
    <div className="pdf-security-actions"><button type="button" className="pdf-security-button primary" disabled={!canRun} onClick={()=>void run()}><Icon size={16}/>{busy?modeCopy[mode].working:modeCopy[mode].action}</button><span className="pdf-security-status" aria-live="polite">{status}</span></div>
    {download?<div className="pdf-security-output"><div className="pdf-security-output-main"><ShieldCheck size={20}/><div><strong>{download.name}</strong><span>{formatBytes(download.size)}</span></div></div><a className="pdf-security-button success" href={download.url} download={download.name} onClick={()=>trackToolEvent('tool_download',{toolId,outputType:'pdf'})}><Download size={16}/>Download PDF</a></div>:null}
  </div>;
}
