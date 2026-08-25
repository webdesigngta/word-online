'use client';

import { useMemo, useRef, useState } from 'react';
import { Archive, Download, FileLock2, FileText, FileUp, Languages, MessageSquareText, RefreshCw, Send, ShieldCheck, Unlock } from 'lucide-react';
import { trackToolEvent } from '@/lib/toolAnalytics';

export type RoadmapRemainingMode =
  | 'doc-editor'
  | 'docx-to-doc'
  | 'protect-word-document'
  | 'unlock-word-document'
  | 'pdf-to-pdfa'
  | 'translate-pdf'
  | 'chat-with-pdf';

type DownloadState = { name: string; url: string; label: string } | null;
type LegacyAst = { toText: () => string };
type DocstreamApi = { parseOffice: (input: File | ArrayBuffer, options?: Record<string, unknown>) => Promise<LegacyAst> };
type TranslatorInstance = { translate: (input: string) => Promise<string>; destroy?: () => void };
type TranslatorCtor = {
  availability: (options: { sourceLanguage: string; targetLanguage: string }) => Promise<string | null>;
  create: (options: { sourceLanguage: string; targetLanguage: string; monitor?: (monitor: { addEventListener: (name: string, handler: (event: { loaded: number }) => void) => void }) => void }) => Promise<TranslatorInstance>;
};
type TransformersApi = { pipeline: (task: string, model: string, options?: Record<string, unknown>) => Promise<(input: string, options?: Record<string, unknown>) => Promise<unknown>> };
type CantooPdfDocument = { setTitle: (value: string) => void; setCreator: (value: string) => void; convertToPDFA: (options: { conformance: '2B' }) => void; save: () => Promise<Uint8Array> };
type CantooApi = { PDFDocument: { load: (bytes: Uint8Array | ArrayBuffer) => Promise<CantooPdfDocument> } };

declare global {
  interface Window {
    docstream?: DocstreamApi;
    Translator?: TranslatorCtor;
    PDFLib?: CantooApi;
    FWOTransformers?: TransformersApi;
  }
}

const DOCSTREAM_SRC = 'https://cdn.jsdelivr.net/npm/@jose.espana/docstream@0.1.3/dist/officeparser.browser.js';
const PDF_A_SRC = 'https://cdn.jsdelivr.net/npm/@cantoo/pdf-lib@2.7.4/dist/pdf-lib.min.js';
const TRANSFORMERS_SRC = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.2.0';
let docstreamPromise: Promise<DocstreamApi> | null = null;
let cantooPromise: Promise<CantooApi> | null = null;
let transformersPromise: Promise<TransformersApi> | null = null;

function cleanText(value: string) {
  return value.replace(/\r/g, '').replace(/[\t ]+\n/g, '\n').replace(/\n{4,}/g, '\n\n\n').trim();
}
function baseName(name: string) { return name.replace(/\.[^.]+$/, '') || 'document'; }
function escapeHtml(value: string) { return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function makeDownload(blob: Blob, name: string, label?: string): DownloadState { return { name, url: URL.createObjectURL(blob), label: label || `Download ${name.split('.').pop()?.toUpperCase() || 'file'}` }; }
function revokeDownload(download: DownloadState) { if (download) URL.revokeObjectURL(download.url); }
function bytesBlob(bytes: Uint8Array, type: string) { const copy = new Uint8Array(bytes.byteLength); copy.set(bytes); return new Blob([copy.buffer], { type }); }

function loadScript<T>(src: string, key: string, ready: () => T | undefined): Promise<T> {
  const current = ready();
  if (current) return Promise.resolve(current);
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[data-fwo-${key}]`);
    const finish = () => { const api = ready(); api ? resolve(api) : reject(new Error(`${key} module did not initialize.`)); };
    if (existing) { existing.addEventListener('load', finish, { once: true }); existing.addEventListener('error', () => reject(new Error(`Could not load ${key} module.`)), { once: true }); return; }
    const script = document.createElement('script');
    script.src = src; script.async = true; script.dataset[`fwo${key.replace(/(^|-)([a-z])/g, (_, __, c: string) => c.toUpperCase())}`] = 'true';
    script.addEventListener('load', finish, { once: true }); script.addEventListener('error', () => reject(new Error(`Could not load ${key} module.`)), { once: true }); document.head.appendChild(script);
  });
}

function loadDocstream() {
  if (!docstreamPromise) docstreamPromise = loadScript(DOCSTREAM_SRC, 'docstream', () => window.docstream);
  return docstreamPromise;
}
function loadCantoo() {
  if (!cantooPromise) cantooPromise = loadScript(PDF_A_SRC, 'pdfa', () => window.PDFLib?.PDFDocument ? window.PDFLib : undefined);
  return cantooPromise;
}
async function loadTransformers() {
  if (window.FWOTransformers?.pipeline) return window.FWOTransformers;
  if (transformersPromise) return transformersPromise;
  transformersPromise = (async () => {
    const importer = new Function('url', 'return import(url)') as (url: string) => Promise<Record<string, unknown>>;
    const module = await importer(TRANSFORMERS_SRC);
    const pipeline = module.pipeline;
    if (typeof pipeline !== 'function') throw new Error('Translation fallback module did not initialize.');
    window.FWOTransformers = { pipeline: pipeline as TransformersApi['pipeline'] };
    return window.FWOTransformers;
  })();
  return transformersPromise;
}

async function parseLegacyDoc(file: File) {
  const api = await loadDocstream();
  const ast = await api.parseOffice(file, { ocr: false, extractAttachments: false, outputErrorToConsole: false });
  const text = cleanText(ast.toText?.() || '');
  if (!text) throw new Error('No readable text could be recovered from this DOC file.');
  return text;
}

function wordHtmlDocument(html: string, title: string) {
  return `<!DOCTYPE html><html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><meta name="ProgId" content="Word.Document"><meta name="Generator" content="Free Word Online"><title>${escapeHtml(title)}</title><style>@page{size:8.5in 11in;margin:1in}body{font-family:Arial,Helvetica,sans-serif;font-size:11pt;color:#202124;line-height:1.45}table{border-collapse:collapse}td,th{border:1px solid #c7c7c7;padding:4px 6px}img{max-width:100%;height:auto}</style></head><body>${html}</body></html>`;
}
function textToWordHtml(text: string) { return text.split(/\n{2,}/).map((block) => `<p>${escapeHtml(block).replace(/\n/g, '<br>')}</p>`).join(''); }
function downloadWordHtml(html: string, title: string) { return new Blob(['\ufeff', wordHtmlDocument(html, title)], { type: 'application/msword;charset=utf-8' }); }

async function docxToHtml(file: File) {
  const mammoth = await import('mammoth');
  const result = await mammoth.convertToHtml({ arrayBuffer: await file.arrayBuffer() });
  if (!result.value.trim()) throw new Error('No readable document content was found in this DOCX file.');
  return result.value;
}

async function modifyDocxProtection(file: File, protect: boolean) {
  const JSZip = (await import('jszip')).default;
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  if (!zip.file('[Content_Types].xml') || !zip.file('word/document.xml')) throw new Error('This is not a valid DOCX package.');
  const removeProtection = (xml: string) => xml.replace(/<w:documentProtection\b[^>]*(?:\/>|>[\s\S]*?<\/w:documentProtection>)/gi, '');
  let settings = await zip.file('word/settings.xml')?.async('string');
  if (!settings) settings = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:settings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"></w:settings>';
  settings = removeProtection(settings);
  if (protect) settings = settings.replace(/<\/w:settings>\s*$/i, '<w:documentProtection w:edit="readOnly" w:enforcement="1"/></w:settings>');
  zip.file('word/settings.xml', settings);

  let types = await zip.file('[Content_Types].xml')!.async('string');
  if (!/PartName="\/word\/settings\.xml"/i.test(types)) types = types.replace(/<\/Types>\s*$/i, '<Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/></Types>');
  zip.file('[Content_Types].xml', types);

  let rels = await zip.file('word/_rels/document.xml.rels')?.async('string');
  if (!rels) rels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>';
  if (!/relationships\/settings/i.test(rels)) {
    let id = 1; while (new RegExp(`Id="rId${id}"`, 'i').test(rels)) id += 1;
    rels = rels.replace(/<\/Relationships>\s*$/i, `<Relationship Id="rId${id}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/></Relationships>`);
  }
  zip.file('word/_rels/document.xml.rels', rels);
  return zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
}

async function extractPdfPages(file: File) {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const pdf = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  const pages: string[] = [];
  try {
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      pages.push(cleanText(content.items.map((item: unknown) => item && typeof item === 'object' && 'str' in item ? String((item as { str?: string }).str || '') : '').join(' ')));
    }
  } finally { (pdf as unknown as { destroy?: () => void }).destroy?.(); }
  return pages;
}

function canvasBlob(canvas: HTMLCanvasElement, type = 'image/jpeg', quality = .92) {
  return new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Could not render a PDF page image.')), type, quality));
}
async function convertPdfToPdfA(file: File, onProgress: (text: string) => void) {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const { PDFDocument } = await import('pdf-lib');
  const source = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  const flat = await PDFDocument.create();
  try {
    for (let n = 1; n <= source.numPages; n += 1) {
      onProgress(`Rasterizing page ${n} of ${source.numPages}…`);
      const page = await source.getPage(n);
      const base = page.getViewport({ scale: 1 });
      const view = page.getViewport({ scale: 1.65 });
      const canvas = document.createElement('canvas'); canvas.width = Math.ceil(view.width); canvas.height = Math.ceil(view.height);
      const context = canvas.getContext('2d', { alpha: false }); if (!context) throw new Error('Could not create the archival render canvas.');
      context.fillStyle = '#ffffff'; context.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvasContext: context, viewport: view }).promise;
      const jpeg = await canvasBlob(canvas);
      const image = await flat.embedJpg(await jpeg.arrayBuffer());
      const out = flat.addPage([base.width, base.height]); out.drawImage(image, { x: 0, y: 0, width: base.width, height: base.height });
      canvas.width = 0; canvas.height = 0;
    }
  } finally { (source as unknown as { destroy?: () => void }).destroy?.(); }
  const rasterBytes = await flat.save();
  onProgress('Adding PDF/A-2B archival metadata and sRGB output intent…');
  const cantoo = await loadCantoo();
  const archival = await cantoo.PDFDocument.load(rasterBytes);
  archival.setTitle(baseName(file.name)); archival.setCreator('Free Word Online PDF/A converter'); archival.convertToPDFA({ conformance: '2B' });
  const result = await archival.save();
  return bytesBlob(result, 'application/pdf');
}

const LANGUAGE_OPTIONS = [
  ['en','English'],['fr','French'],['es','Spanish'],['de','German'],['it','Italian'],['pt','Portuguese'],['nl','Dutch'],['pl','Polish'],['ja','Japanese'],['ko','Korean'],['zh','Chinese'],['ar','Arabic'],['hi','Hindi']
] as const;
const FALLBACK_MODELS: Record<string, string> = {
  'en-fr':'Xenova/opus-mt-en-fr','fr-en':'Xenova/opus-mt-fr-en','en-es':'Xenova/opus-mt-en-es','es-en':'Xenova/opus-mt-es-en','en-de':'Xenova/opus-mt-en-de','de-en':'Xenova/opus-mt-de-en'
};
function chunks(text: string, limit = 900) {
  const source = cleanText(text); if (!source) return [];
  const sentences = source.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [source]; const result: string[] = []; let current = '';
  sentences.forEach((sentence) => { const next = current ? `${current} ${sentence.trim()}` : sentence.trim(); if (next.length > limit && current) { result.push(current); current = sentence.trim(); } else current = next; });
  if (current) result.push(current); return result;
}
async function translateText(text: string, sourceLanguage: string, targetLanguage: string, onProgress: (text: string) => void) {
  const browserTranslator = window.Translator;
  if (browserTranslator) {
    try {
      const availability = await browserTranslator.availability({ sourceLanguage, targetLanguage });
      if (availability && availability !== 'unavailable') {
        onProgress(availability === 'available' ? 'Using your browser’s on-device translator…' : 'Downloading the browser translation model…');
        const translator = await browserTranslator.create({ sourceLanguage, targetLanguage, monitor(monitor) { monitor.addEventListener('downloadprogress', (event) => onProgress(`Downloading translation model: ${Math.round(event.loaded * 100)}%`)); } });
        try { const parts = chunks(text); const output: string[] = []; for (let i = 0; i < parts.length; i += 1) { onProgress(`Translating section ${i + 1} of ${parts.length}…`); output.push(await translator.translate(parts[i])); } return output.join(' '); }
        finally { translator.destroy?.(); }
      }
    } catch { /* fall through to portable fallback */ }
  }
  const model = FALLBACK_MODELS[`${sourceLanguage}-${targetLanguage}`];
  if (!model) throw new Error('This browser does not provide on-device translation for that language pair. Portable fallback currently supports English ↔ French, Spanish, and German.');
  onProgress('Loading a private browser translation model. The first use can download a large model…');
  const transformers = await loadTransformers();
  const pipe = await transformers.pipeline('translation', model, { dtype: 'q8' });
  const parts = chunks(text, 700), output: string[] = [];
  for (let i = 0; i < parts.length; i += 1) {
    onProgress(`Translating section ${i + 1} of ${parts.length}…`);
    const result = await pipe(parts[i], { max_new_tokens: 512 });
    const item = Array.isArray(result) ? result[0] : result;
    const translated = item && typeof item === 'object' && 'translation_text' in item ? String((item as { translation_text?: string }).translation_text || '') : '';
    if (!translated) throw new Error('The local translation model returned no text.'); output.push(translated);
  }
  return output.join(' ');
}

function DocTools({ mode, toolId }: { mode: 'doc-editor' | 'docx-to-doc'; toolId: string }) {
  const inputRef = useRef<HTMLInputElement>(null); const [fileName,setFileName]=useState(''); const [busy,setBusy]=useState(false); const [status,setStatus]=useState('Choose a document to begin.'); const [text,setText]=useState(''); const [html,setHtml]=useState(''); const [download,setDownload]=useState<DownloadState>(null);
  const editor = mode === 'doc-editor';
  const open = async (file?: File) => { if (!file) return; setBusy(true); revokeDownload(download); setDownload(null); setFileName(file.name); setStatus(`Opening ${file.name}…`); try { if (editor) { if (!/\.doc$/i.test(file.name)) throw new Error('Choose a Word 97–2003 .doc file.'); const recovered = await parseLegacyDoc(file); setText(recovered); setHtml(''); setStatus('Readable DOC content recovered. Edit the text below.'); } else { if (!/\.docx$/i.test(file.name)) throw new Error('Choose a .docx file.'); const recovered = await docxToHtml(file); setHtml(recovered); setText(''); setStatus('DOCX content recovered and ready for Word-compatible DOC export.'); } trackToolEvent('tool_start',{toolId,fileType:editor?'doc':'docx'}); } catch(error){setStatus(error instanceof Error?error.message:'Could not open this document.');setText('');setHtml('');trackToolEvent('tool_error',{toolId});} finally {setBusy(false);if(inputRef.current)inputRef.current.value='';} };
  const build = async () => { if (busy || (!text && !html)) return; setBusy(true); revokeDownload(download); try { const title=baseName(fileName); const body=editor?textToWordHtml(text):html; const blob=downloadWordHtml(body,title); setDownload(makeDownload(blob,`${title}${editor?'-edited':''}.doc`,'Download Word-compatible DOC')); setStatus('DOC created. This is Word-compatible HTML packaged with a .doc extension, not a reconstructed binary Word 97 file.'); trackToolEvent('tool_success',{toolId,outputType:'doc'}); } catch(error){setStatus(error instanceof Error?error.message:'Could not build DOC.');} finally {setBusy(false);} };
  return <div className="rr-tool"><style>{css}</style><input ref={inputRef} hidden type="file" accept={editor?'.doc,application/msword':'.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document'} onChange={(e)=>void open(e.target.files?.[0])}/><div className="rr-head"><div className="rr-title"><div className="rr-icon"><FileText/></div><div><strong>{editor?'DOC Editor':'DOCX to DOC'}</strong><span>{status}</span></div></div><div className="rr-actions"><button className="rr-btn primary" disabled={busy} onClick={()=>inputRef.current?.click()}><FileUp size={16}/>{busy?'Working…':fileName?'Open another':'Choose file'}</button>{(text||html)?<button className="rr-btn" disabled={busy} onClick={()=>void build()}><Download size={16}/>Build DOC</button>:null}</div></div><div className="rr-note">{editor?'Legacy DOC parsing is content-focused. Edit recovered text and export a Word-compatible .doc; complex binary formatting, macros and objects are not reconstructed.':'DOCX structure is converted to Word-compatible HTML inside a .doc file. Complex OOXML layout may be simplified, and the result is not a native binary Word 97 container.'}</div>{editor&&text?<textarea className="rr-editor" value={text} onChange={(e)=>setText(e.target.value)} spellCheck/>:html?<div className="rr-paper" dangerouslySetInnerHTML={{__html:html}}/>:<button className="rr-empty" onClick={()=>inputRef.current?.click()}><FileText/><strong>{editor?'Open a DOC to edit':'Choose a DOCX to convert'}</strong><span>Document processing happens in your browser.</span></button>}{download?<DownloadCard download={download} toolId={toolId}/>:null}</div>;
}

function WordProtection({ mode, toolId }: { mode: 'protect-word-document' | 'unlock-word-document'; toolId: string }) {
  const inputRef=useRef<HTMLInputElement>(null); const[file,setFile]=useState<File|null>(null); const[busy,setBusy]=useState(false); const[status,setStatus]=useState(mode==='protect-word-document'?'Choose a DOCX to restrict editing.':'Choose a DOCX to remove standard editing restrictions.'); const[download,setDownload]=useState<DownloadState>(null); const protect=mode==='protect-word-document';
  const open=(next?:File)=>{if(!next)return;if(!/\.docx$/i.test(next.name)){setStatus('Choose a .docx file.');return}revokeDownload(download);setDownload(null);setFile(next);setStatus(protect?'Ready to apply read-only editing restriction.':'Ready to remove OOXML documentProtection restrictions.');trackToolEvent('tool_start',{toolId,fileType:'docx'});if(inputRef.current)inputRef.current.value='';};
  const run=async()=>{if(!file||busy)return;setBusy(true);revokeDownload(download);setDownload(null);setStatus(protect?'Applying DOCX editing restriction…':'Removing DOCX editing restriction…');try{const blob=await modifyDocxProtection(file,protect);const name=`${baseName(file.name)}-${protect?'protected':'unlocked'}.docx`;setDownload(makeDownload(blob,name));setStatus(protect?'Editing restriction applied. The file is not encrypted and does not require a password to open.':'Standard OOXML editing restriction removed. This tool does not bypass password-to-open encryption.');trackToolEvent('tool_success',{toolId,outputType:'docx'});}catch(error){setStatus(error instanceof Error?error.message:'Could not update document protection.');trackToolEvent('tool_error',{toolId});}finally{setBusy(false)}};
  return <div className="rr-tool"><style>{css}</style><input ref={inputRef} hidden type="file" accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={(e)=>open(e.target.files?.[0])}/><div className="rr-head"><div className="rr-title"><div className="rr-icon">{protect?<FileLock2/>:<Unlock/>}</div><div><strong>{protect?'Protect Word Document':'Unlock Word Document'}</strong><span>{status}</span></div></div><div className="rr-actions"><button className="rr-btn primary" disabled={busy} onClick={()=>inputRef.current?.click()}><FileUp size={16}/>{file?'Choose another':'Choose DOCX'}</button>{file?<button className="rr-btn" disabled={busy} onClick={()=>void run()}>{protect?<ShieldCheck size={16}/>:<Unlock size={16}/>} {busy?'Working…':protect?'Restrict editing':'Remove restriction'}</button>:null}</div></div><div className="rr-note">{protect?'This applies the standard OOXML read-only editing restriction. It is useful for discouraging accidental edits, but it is not password-to-open encryption.':'This removes standard DOCX documentProtection settings. It does not decrypt encrypted/password-to-open Office files.'}</div>{!file?<button className="rr-empty" onClick={()=>inputRef.current?.click()}>{protect?<FileLock2/>:<Unlock/>}<strong>{protect?'Restrict DOCX editing':'Remove DOCX editing restriction'}</strong><span>Your file stays in the browser.</span></button>:<div className="rr-file"><FileText/><div><strong>{file.name}</strong><span>{(file.size/1024).toFixed(1)} KB</span></div></div>}{download?<DownloadCard download={download} toolId={toolId}/>:null}</div>;
}

function PdfA({toolId}:{toolId:string}){
  const inputRef=useRef<HTMLInputElement>(null); const[file,setFile]=useState<File|null>(null); const[busy,setBusy]=useState(false); const[status,setStatus]=useState('Choose a PDF to rebuild as an archival PDF/A-2B document.'); const[download,setDownload]=useState<DownloadState>(null);
  const open=(next?:File)=>{if(!next)return;if(!(next.type==='application/pdf'||/\.pdf$/i.test(next.name))){setStatus('Choose a PDF file.');return}revokeDownload(download);setDownload(null);setFile(next);setStatus('Ready. Conversion rasterizes every page to remove unsupported interactive content.');trackToolEvent('tool_start',{toolId,fileType:'pdf'});if(inputRef.current)inputRef.current.value='';};
  const run=async()=>{if(!file||busy)return;setBusy(true);revokeDownload(download);setDownload(null);try{const blob=await convertPdfToPdfA(file,setStatus);setDownload(makeDownload(blob,`${baseName(file.name)}-pdfa-2b.pdf`,'Download PDF/A-2B'));setStatus('Archival PDF created with rasterized pages, PDF/A-2B metadata, document ID and sRGB output intent. Validate with veraPDF for regulated archival workflows.');trackToolEvent('tool_success',{toolId,fileType:'pdf',outputType:'pdfa'});}catch(error){setStatus(error instanceof Error?error.message:'Could not create archival PDF.');trackToolEvent('tool_error',{toolId,fileType:'pdf'});}finally{setBusy(false)}};
  return <div className="rr-tool"><style>{css}</style><input ref={inputRef} hidden type="file" accept="application/pdf,.pdf" onChange={(e)=>open(e.target.files?.[0])}/><div className="rr-head"><div className="rr-title"><div className="rr-icon"><Archive/></div><div><strong>PDF to PDF/A</strong><span>{status}</span></div></div><div className="rr-actions"><button className="rr-btn primary" disabled={busy} onClick={()=>inputRef.current?.click()}><FileUp size={16}/>{file?'Choose another':'Choose PDF'}</button>{file?<button className="rr-btn" disabled={busy} onClick={()=>void run()}><Archive size={16}/>{busy?'Converting…':'Create PDF/A-2B'}</button>:null}</div></div><div className="rr-note">For dependable browser-side archival conversion, each page is flattened to an image before PDF/A structure is applied. Searchable text, links, forms, annotations, layers, signatures and interactive features are not retained. Independent validation is recommended for legal or regulated archives.</div>{!file?<button className="rr-empty" onClick={()=>inputRef.current?.click()}><Archive/><strong>Convert PDF to PDF/A-2B</strong><span>Runs locally after the archival library is loaded.</span></button>:<div className="rr-file"><FileText/><div><strong>{file.name}</strong><span>{(file.size/1024/1024).toFixed(2)} MB</span></div></div>}{download?<DownloadCard download={download} toolId={toolId}/>:null}</div>;
}

function TranslatePdf({toolId}:{toolId:string}){
  const inputRef=useRef<HTMLInputElement>(null); const[fileName,setFileName]=useState(''); const[pages,setPages]=useState<string[]>([]); const[source,setSource]=useState('en'); const[target,setTarget]=useState('fr'); const[translated,setTranslated]=useState<string[]>([]); const[busy,setBusy]=useState(false); const[status,setStatus]=useState('Choose a text-based PDF, then select source and target languages.'); const[download,setDownload]=useState<DownloadState>(null);
  const open=async(file?:File)=>{if(!file)return;if(!(file.type==='application/pdf'||/\.pdf$/i.test(file.name))){setStatus('Choose a PDF file.');return}setBusy(true);setPages([]);setTranslated([]);revokeDownload(download);setDownload(null);setFileName(file.name);setStatus('Extracting PDF text locally…');try{const next=await extractPdfPages(file);if(!next.some(Boolean))throw new Error('No selectable text was found. Run PDF OCR first for scanned pages.');setPages(next);setStatus(`Extracted ${next.length} ${next.length===1?'page':'pages'}. Choose languages and translate.`);trackToolEvent('tool_start',{toolId,fileType:'pdf'});}catch(error){setStatus(error instanceof Error?error.message:'Could not read PDF text.');trackToolEvent('tool_error',{toolId});}finally{setBusy(false);if(inputRef.current)inputRef.current.value='';}};
  const run=async()=>{if(!pages.length||busy)return;if(source===target){setStatus('Choose two different languages.');return}setBusy(true);setTranslated([]);revokeDownload(download);setDownload(null);try{const result:string[]=[];for(let i=0;i<pages.length;i+=1){if(!pages[i]){result.push('');continue}setStatus(`Page ${i+1} of ${pages.length}: preparing translation…`);result.push(await translateText(pages[i],source,target,(message)=>setStatus(`Page ${i+1} of ${pages.length}: ${message}`)));}setTranslated(result);setStatus(`Translated ${result.filter(Boolean).length} page${result.filter(Boolean).length===1?'':'s'} in the browser.`);trackToolEvent('tool_success',{toolId,fileType:'pdf',outputType:'translation'});}catch(error){setStatus(error instanceof Error?error.message:'Translation failed.');trackToolEvent('tool_error',{toolId});}finally{setBusy(false)}};
  const saveTxt=()=>{const blob=new Blob([translated.map((text,i)=>`Page ${i+1}\n${text}`).join('\n\n')],{type:'text/plain;charset=utf-8'});revokeDownload(download);setDownload(makeDownload(blob,`${baseName(fileName)}-${target}.txt`,'Download translated TXT'));};
  const savePdf=async()=>{if(!translated.length)return;setBusy(true);try{const {saveHtmlAsPdf}=await import('@/tools/document/formatHelpers');const html=translated.map((text,i)=>`<h2>Page ${i+1}</h2>${text.split(/\n{2,}/).map((p)=>`<p>${escapeHtml(p)}</p>`).join('')}`).join('<div style="page-break-after:always"></div>');const result=await saveHtmlAsPdf(html,`${baseName(fileName)}-${target}`);revokeDownload(download);setDownload(makeDownload(result.blob,result.name,'Download translated PDF'));trackToolEvent('tool_success',{toolId,outputType:'pdf'});}catch(error){setStatus(error instanceof Error?error.message:'Could not create translated PDF.');}finally{setBusy(false)}};
  return <div className="rr-tool"><style>{css}</style><input ref={inputRef} hidden type="file" accept="application/pdf,.pdf" onChange={(e)=>void open(e.target.files?.[0])}/><div className="rr-head"><div className="rr-title"><div className="rr-icon"><Languages/></div><div><strong>Translate PDF</strong><span>{status}</span></div></div><button className="rr-btn primary" disabled={busy} onClick={()=>inputRef.current?.click()}><FileUp size={16}/>{fileName?'Choose another':'Choose PDF'}</button></div><div className="rr-note">Translation runs through the browser’s on-device Translator API when available. On unsupported browsers, English ↔ French, Spanish and German can fall back to a private browser model download. PDF layout is not translated in place; translated text is rebuilt into a clean output.</div>{pages.length?<><div className="rr-controls"><label>From<select value={source} onChange={(e)=>setSource(e.target.value)}>{LANGUAGE_OPTIONS.map(([code,name])=><option value={code} key={code}>{name}</option>)}</select></label><span>→</span><label>To<select value={target} onChange={(e)=>setTarget(e.target.value)}>{LANGUAGE_OPTIONS.map(([code,name])=><option value={code} key={code}>{name}</option>)}</select></label><button className="rr-btn primary" disabled={busy||source===target} onClick={()=>void run()}><Languages size={16}/>{busy?'Translating…':'Translate'}</button></div>{translated.length?<><div className="rr-paper">{translated.map((text,i)=><section key={i}><strong>Page {i+1}</strong><p>{text}</p></section>)}</div><div className="rr-actions"><button className="rr-btn" onClick={saveTxt}><Download size={16}/>Prepare TXT</button><button className="rr-btn" disabled={busy} onClick={()=>void savePdf()}><Download size={16}/>Prepare PDF</button></div></>:null}</>:<button className="rr-empty" onClick={()=>inputRef.current?.click()}><Languages/><strong>Translate a text-based PDF</strong><span>Use PDF OCR first for scanned pages.</span></button>}{download?<DownloadCard download={download} toolId={toolId}/>:null}</div>;
}

type ChatMessage={role:'user'|'assistant';text:string;refs?:number[]};
const CHAT_STOP=new Set('the a an and or but if to of in on for from by with as at is are was were be been it this that these those do does did can could should would may might will what which who how why when where tell explain about please document pdf'.split(' '));
function answerFromPdf(pages:string[],question:string){const query=(question.toLowerCase().match(/[\p{L}\p{N}][\p{L}\p{N}'’-]{1,}/gu)||[]).filter((w)=>!CHAT_STOP.has(w));if(!query.length)return {text:'Ask a more specific question using terms that appear in the document.',refs:[]};const candidates: Array<{text:string;page:number;score:number}>=[];pages.forEach((page,pageIndex)=>{const sentences=page.replace(/\s+/g,' ').match(/[^.!?]+[.!?]+|[^.!?]+$/g)||[];sentences.map((s)=>s.trim()).filter((s)=>s.length>=25&&s.length<=800).forEach((text)=>{const lower=text.toLowerCase();const score=query.reduce((sum,word)=>sum+(lower.includes(word)?1:0),0);if(score)candidates.push({text,page:pageIndex+1,score:score/query.length+(text.length<320?.08:0)})})});const top=candidates.sort((a,b)=>b.score-a.score).slice(0,3);if(!top.length)return {text:'I could not find a strong source passage for that question. Try using a phrase, name, number, or topic from the PDF.',refs:[]};return {text:top.map((item)=>item.text).join('\n\n'),refs:[...new Set(top.map((item)=>item.page))]};}
function ChatPdf({toolId}:{toolId:string}){
  const inputRef=useRef<HTMLInputElement>(null);const[fileName,setFileName]=useState('');const[pages,setPages]=useState<string[]>([]);const[question,setQuestion]=useState('');const[messages,setMessages]=useState<ChatMessage[]>([]);const[busy,setBusy]=useState(false);const[status,setStatus]=useState('Choose a text-based PDF to start a source-grounded chat.');
  const open=async(file?:File)=>{if(!file)return;if(!(file.type==='application/pdf'||/\.pdf$/i.test(file.name))){setStatus('Choose a PDF file.');return}setBusy(true);setPages([]);setMessages([]);setFileName(file.name);setStatus('Indexing selectable PDF text locally…');try{const next=await extractPdfPages(file);if(!next.some(Boolean))throw new Error('No selectable text was found. Run PDF OCR first for scanned pages.');setPages(next);setMessages([{role:'assistant',text:`Ready. I indexed ${next.length} page${next.length===1?'':'s'}. Ask a question and I will return the most relevant source passages with page references.`}]);setStatus('PDF indexed locally.');trackToolEvent('tool_start',{toolId,fileType:'pdf'});}catch(error){setStatus(error instanceof Error?error.message:'Could not index this PDF.');trackToolEvent('tool_error',{toolId});}finally{setBusy(false);if(inputRef.current)inputRef.current.value='';}};
  const ask=()=>{const q=question.trim();if(!q||!pages.length)return;const answer=answerFromPdf(pages,q);setMessages((current)=>[...current,{role:'user',text:q},{role:'assistant',text:answer.text,refs:answer.refs}]);setQuestion('');trackToolEvent('tool_success',{toolId,outputType:'retrieval-answer',metadata:{pages:answer.refs.length}});};
  return <div className="rr-tool"><style>{css}</style><input ref={inputRef} hidden type="file" accept="application/pdf,.pdf" onChange={(e)=>void open(e.target.files?.[0])}/><div className="rr-head"><div className="rr-title"><div className="rr-icon"><MessageSquareText/></div><div><strong>Chat with PDF</strong><span>{status}</span></div></div><button className="rr-btn primary" disabled={busy} onClick={()=>inputRef.current?.click()}><FileUp size={16}/>{fileName?'Choose another':'Choose PDF'}</button></div><div className="rr-note">This is local retrieval chat, not a generative model. Answers are verbatim or near-verbatim source passages selected from the PDF and include page references, which reduces hallucination risk.</div>{pages.length?<><div className="rr-chat">{messages.map((message,i)=><div className={`rr-msg ${message.role}`} key={i}><strong>{message.role==='user'?'You':'PDF'}</strong><p>{message.text}</p>{message.refs?.length?<span>Sources: {message.refs.map((p)=>`p. ${p}`).join(', ')}</span>:null}</div>)}</div><div className="rr-chat-input"><input value={question} onChange={(e)=>setQuestion(e.target.value)} onKeyDown={(e)=>{if(e.key==='Enter')ask()}} placeholder="Ask about a name, topic, date, clause, number…"/><button className="rr-btn primary" disabled={!question.trim()} onClick={ask}><Send size={16}/>Ask</button></div></>:<button className="rr-empty" onClick={()=>inputRef.current?.click()}><MessageSquareText/><strong>Chat with a PDF locally</strong><span>Use PDF OCR first for scanned pages.</span></button>}</div>;
}

function DownloadCard({download,toolId}:{download:Exclude<DownloadState,null>;toolId:string}){return <div className="rr-download"><div><strong>{download.name}</strong><span>Original file remains unchanged.</span></div><a className="rr-btn success" href={download.url} download={download.name} onClick={()=>trackToolEvent('tool_download',{toolId,outputType:download.name.split('.').pop()})}><Download size={16}/>{download.label}</a></div>}

const css=`.rr-tool{display:grid;gap:16px}.rr-head{display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap}.rr-title{display:flex;align-items:center;gap:10px;min-width:0}.rr-icon{width:42px;height:42px;border-radius:12px;background:#e8f0fe;color:#0b57d0;display:grid;place-items:center}.rr-icon svg{width:21px}.rr-title strong{display:block;font-size:14px}.rr-title span{display:block;color:#5f6368;font-size:12px;margin-top:3px;max-width:690px}.rr-actions{display:flex;gap:8px;flex-wrap:wrap}.rr-btn{border:1px solid #dadce0;border-radius:20px;background:#fff;color:#202124;padding:9px 14px;font-weight:650;cursor:pointer;display:inline-flex;align-items:center;gap:7px;text-decoration:none}.rr-btn.primary{background:#0b57d0;color:#fff;border-color:#0b57d0}.rr-btn.success{background:#137333;color:#fff;border-color:#137333}.rr-btn:disabled{opacity:.5;cursor:not-allowed}.rr-note{padding:11px 13px;border-radius:11px;background:#fef7e0;color:#5f4b00;font-size:12px;line-height:1.5}.rr-empty{min-height:320px;border:2px dashed #d5dae2;border-radius:16px;background:#fbfcfe;display:grid;place-items:center;align-content:center;gap:8px;text-align:center;padding:32px;color:#5f6368;cursor:pointer}.rr-empty svg{width:42px;height:42px;color:#0b57d0}.rr-empty strong{color:#202124}.rr-editor{min-height:520px;border:1px solid #dadce0;border-radius:14px;background:#fff;padding:32px 38px;font:15px/1.6 Arial,sans-serif;resize:vertical;outline:none}.rr-editor:focus{border-color:#0b57d0;box-shadow:0 0 0 1px #0b57d0}.rr-paper{max-height:68vh;overflow:auto;border:1px solid #dadce0;border-radius:14px;background:#fff;padding:30px 36px;line-height:1.6}.rr-paper section+section{border-top:1px solid #e8eaed;margin-top:20px;padding-top:20px}.rr-paper p{white-space:pre-wrap}.rr-file{border:1px solid #dadce0;border-radius:14px;padding:18px;background:#fff;display:flex;gap:12px;align-items:center}.rr-file svg{color:#0b57d0}.rr-file strong{display:block}.rr-file span{display:block;font-size:12px;color:#5f6368;margin-top:3px}.rr-download{display:flex;align-items:center;justify-content:space-between;gap:12px;border:1px solid #cde3d3;border-radius:14px;padding:13px 15px;background:#f4faf6}.rr-download span{display:block;font-size:11px;color:#5f6368;margin-top:3px}.rr-controls{display:flex;align-items:end;gap:10px;flex-wrap:wrap;border:1px solid #e0e3e7;border-radius:14px;padding:14px;background:#fff}.rr-controls label{display:grid;gap:5px;font-size:12px;font-weight:650}.rr-controls select{min-width:150px;border:1px solid #dadce0;border-radius:10px;padding:9px 11px;background:#fff}.rr-chat{display:grid;gap:10px;max-height:60vh;overflow:auto;border:1px solid #dadce0;border-radius:14px;padding:16px;background:#f8fafd}.rr-msg{max-width:86%;border-radius:14px;padding:11px 13px;background:#fff;border:1px solid #e0e3e7}.rr-msg.user{justify-self:end;background:#e8f0fe;border-color:#c7d7f2}.rr-msg strong{font-size:11px;text-transform:uppercase;color:#5f6368}.rr-msg p{margin:5px 0 0;white-space:pre-wrap;line-height:1.55}.rr-msg span{display:block;margin-top:8px;font-size:11px;color:#0b57d0;font-weight:700}.rr-chat-input{display:flex;gap:8px}.rr-chat-input input{flex:1;border:1px solid #dadce0;border-radius:22px;padding:10px 14px;outline:none}.rr-chat-input input:focus{border-color:#0b57d0}@media(max-width:700px){.rr-editor,.rr-paper{padding:22px 18px}.rr-download{align-items:flex-start;flex-direction:column}.rr-chat-input{align-items:stretch;flex-direction:column}.rr-msg{max-width:95%}}`;

export function RoadmapRemainingInterface({mode,toolId}:{mode:RoadmapRemainingMode;toolId:string}){
  if(mode==='doc-editor'||mode==='docx-to-doc')return <DocTools mode={mode} toolId={toolId}/>;
  if(mode==='protect-word-document'||mode==='unlock-word-document')return <WordProtection mode={mode} toolId={toolId}/>;
  if(mode==='pdf-to-pdfa')return <PdfA toolId={toolId}/>;
  if(mode==='translate-pdf')return <TranslatePdf toolId={toolId}/>;
  return <ChatPdf toolId={toolId}/>;
}
