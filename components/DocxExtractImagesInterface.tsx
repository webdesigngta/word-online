'use client';

import { useEffect, useRef, useState } from 'react';
import { Download, FileImage, Image as ImageIcon, RefreshCw } from 'lucide-react';
import { docxExtractImagesProcessor } from '@/tools/word';

type ImageOutput = { name: string; blob: Blob; size: number; type: string };
type ImageItem = ImageOutput & { url: string };

function imagesFrom(metadata: Record<string, unknown> | undefined): ImageOutput[] {
  const raw = metadata?.images;
  if (!Array.isArray(raw)) return [];
  return raw.filter((item): item is ImageOutput => Boolean(item && typeof item === 'object' && 'blob' in item && 'name' in item)) as ImageOutput[];
}

function formatBytes(value: number) {
  if (value < 1024) return `${value} B`;
  return `${(value / 1024).toFixed(1)} KB`;
}

export function DocxExtractImagesInterface() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [fileName, setFileName] = useState('');
  const [status, setStatus] = useState('Choose a DOCX file to extract embedded images.');
  const [images, setImages] = useState<ImageItem[]>([]);

  useEffect(() => () => images.forEach((item) => URL.revokeObjectURL(item.url)), [images]);

  async function extract(file?: File) {
    if (!file) return;
    images.forEach((item) => URL.revokeObjectURL(item.url));
    setImages([]);
    setBusy(true);
    setFileName(file.name);
    setStatus('Extracting images…');
    try {
      const result = await docxExtractImagesProcessor.process(file);
      if (!result.success) {
        setStatus(result.errors[0]?.message || 'Could not extract images from this DOCX file.');
        return;
      }
      const next = imagesFrom(result.metadata).map((item) => ({ ...item, url: URL.createObjectURL(item.blob) }));
      setImages(next);
      setStatus(next.length ? `Found ${next.length} embedded ${next.length === 1 ? 'image' : 'images'}.` : 'No embedded images were found.');
    } catch {
      setStatus('Could not extract images from this DOCX file.');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div className="fwo-image-extract">
      <style>{`
        .fwo-image-extract{display:grid;gap:16px}.fwo-image-picker{border:2px dashed #d4d9e1;border-radius:18px;background:#fbfcff;min-height:270px;display:grid;place-items:center;text-align:center;padding:26px}.fwo-image-picker>div>svg{width:46px;height:46px;color:#0b57d0;margin-bottom:10px}.fwo-image-picker h2{margin:0 0 7px;font-size:21px}.fwo-image-picker p{margin:0 0 16px;color:#5f6368}.fwo-image-button,.fwo-image-download{border:0;border-radius:22px;padding:10px 17px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:8px;text-decoration:none}.fwo-image-button{background:#0b57d0;color:#fff}.fwo-image-button:disabled{opacity:.55}.fwo-image-meta{font-size:12px;color:#5f6368;margin-top:11px}.fwo-image-meta strong{color:#202124}.fwo-image-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.fwo-image-card{border:1px solid #e0e4ea;border-radius:14px;background:#fff;overflow:hidden}.fwo-image-preview{aspect-ratio:4/3;background:#f1f3f4;display:grid;place-items:center;overflow:hidden}.fwo-image-preview img{width:100%;height:100%;object-fit:contain}.fwo-image-info{padding:11px;display:grid;gap:8px}.fwo-image-info strong{font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.fwo-image-info span{font-size:11px;color:#5f6368}.fwo-image-download{background:#edf2fb;color:#174ea6;padding:8px 10px;font-size:12px;justify-content:center}@media(max-width:760px){.fwo-image-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:480px){.fwo-image-grid{grid-template-columns:1fr}}
      `}</style>
      <input ref={inputRef} hidden type="file" accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={(event) => void extract(event.target.files?.[0])} />
      <div className="fwo-image-picker"><div><FileImage /><h2>Extract images from a Word document</h2><p>Read the DOCX package and expose its embedded image files for download.</p><button className="fwo-image-button" type="button" disabled={busy} onClick={() => inputRef.current?.click()}>{busy ? <RefreshCw /> : <ImageIcon />}{busy ? 'Extracting…' : fileName ? 'Choose another DOCX' : 'Choose DOCX file'}</button><div className="fwo-image-meta">{fileName ? <><strong>{fileName}</strong> · </> : null}{status}</div></div></div>
      {images.length ? <div className="fwo-image-grid">{images.map((item,index) => <article className="fwo-image-card" key={`${item.name}-${index}`}><div className="fwo-image-preview"><img src={item.url} alt={`Extracted image ${index + 1}`} /></div><div className="fwo-image-info"><strong>{item.name}</strong><span>{item.type} · {formatBytes(item.size)}</span><a className="fwo-image-download" href={item.url} download={item.name}><Download />Download image</a></div></article>)}</div> : null}
    </div>
  );
}
