'use client';

import { useMemo, useRef, useState } from 'react';
import { CheckCircle2, Download, FileText, FileUp, Presentation, RefreshCw, Search, Sparkles } from 'lucide-react';
import { trackToolEvent } from '@/lib/toolAnalytics';
import { buildSimplePptx, type TextSlide } from '@/tools/presentation/simplePptx';

export type RoadmapFinalMode =
  | 'doc-to-pdf' | 'doc-viewer' | 'doc-to-docx'
  | 'spell-checker' | 'grammar-checker'
  | 'pptx-editor' | 'pptx-viewer' | 'ppt-viewer' | 'ppt-to-pdf'
  | 'pdf-summarizer';

type DownloadState = { name: string; url: string; label: string } | null;
type LegacyAst = { content?: unknown[]; metadata?: Record<string, unknown>; toText: () => string; toMarkdown?: () => string };
type DocstreamApi = { parseOffice: (input: File | ArrayBuffer, options?: Record<string, unknown>) => Promise<LegacyAst> };
type OfficeMode = Exclude<RoadmapFinalMode, 'spell-checker' | 'grammar-checker' | 'pdf-summarizer'>;

declare global { interface Window { docstream?: DocstreamApi } }

const DOCSTREAM_SRC = 'https://cdn.jsdelivr.net/npm/@jose.espana/docstream@0.1.3/dist/officeparser.browser.js';
let docstreamPromise: Promise<DocstreamApi> | null = null;

function loadDocstream(): Promise<DocstreamApi> {
  if (typeof window === 'undefined') return Promise.reject(new Error('Legacy Office parsing requires a browser.'));
  if (window.docstream?.parseOffice) return Promise.resolve(window.docstream);
  if (docstreamPromise) return docstreamPromise;
  docstreamPromise = new Promise((resolve, reject) => {
    const finish = () => window.docstream?.parseOffice ? resolve(window.docstream) : reject(new Error('Legacy Office parser did not initialize.'));
    const existing = document.querySelector<HTMLScriptElement>('script[data-fwo-docstream]');
    if (existing) {
      existing.addEventListener('load', finish, { once: true });
      existing.addEventListener('error', () => reject(new Error('Could not load the legacy Office compatibility module.')), { once: true });
      return;
    }
    const script = document.createElement('script');
    script.src = DOCSTREAM_SRC;
    script.async = true;
    script.dataset.fwoDocstream = 'true';
    script.crossOrigin = 'anonymous';
    script.addEventListener('load', finish, { once: true });
    script.addEventListener('error', () => reject(new Error('Could not load the legacy Office compatibility module.')), { once: true });
    document.head.appendChild(script);
  });
  return docstreamPromise;
}

function cleanText(value: string) {
  return value.replace(/\r/g, '').replace(/[\t ]+\n/g, '\n').replace(/\n{4,}/g, '\n\n\n').trim();
}

async function parseLegacy(file: File) {
  const api = await loadDocstream();
  const ast = await api.parseOffice(file, { ocr: false, extractAttachments: false, outputErrorToConsole: false });
  const text = cleanText(ast.toText?.() || '');
  if (!text) throw new Error('No readable text could be recovered from this legacy Office file.');
  return { ast, text };
}

function nodeText(value: unknown): string {
  if (typeof value === 'string') return value;
  if (!value || typeof value !== 'object') return '';
  const record = value as Record<string, unknown>;
  const own = ['text', 'value', 'contentText'].map((key) => typeof record[key] === 'string' ? String(record[key]) : '').filter(Boolean).join(' ');
  const nested = ['content', 'children', 'items', 'paragraphs', 'runs']
    .flatMap((key) => Array.isArray(record[key]) ? record[key] as unknown[] : [])
    .map(nodeText).filter(Boolean).join('\n');
  return cleanText([own, nested].filter(Boolean).join('\n'));
}

function legacySlides(ast: LegacyAst, fallback: string): TextSlide[] {
  const roots = Array.isArray(ast.content) ? ast.content : [];
  const slides: TextSlide[] = [];
  roots.forEach((node, index) => {
    const record = node && typeof node === 'object' ? node as Record<string, unknown> : {};
    const type = String(record.type || '').toLowerCase();
    if (!type.includes('slide') && !type.includes('page')) return;
    const lines = nodeText(node).split('\n').map((line) => line.trim()).filter(Boolean);
    if (lines.length) slides.push({ title: lines[0] || `Slide ${index + 1}`, body: lines.slice(1, 21) });
  });
  if (slides.length) return slides;
  const blocks = fallback.split(/\n\s*\n|\f/g).map((block) => block.trim()).filter(Boolean);
  return (blocks.length > 1 ? blocks : [fallback]).slice(0, 200).map((block, index) => {
    const lines = block.split('\n').map((line) => line.trim()).filter(Boolean);
    return { title: lines.shift() || `Slide ${index + 1}`, body: lines.slice(0, 20) };
  });
}

async function parsePptx(file: File): Promise<TextSlide[]> {
  const JSZip = (await import('jszip')).default;
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const names = Object.keys(zip.files)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/i.test(name))
    .sort((a, b) => Number(a.match(/slide(\d+)/i)?.[1] || 0) - Number(b.match(/slide(\d+)/i)?.[1] || 0));
  if (!names.length) throw new Error('This file does not contain readable PowerPoint slides.');
  const slides: TextSlide[] = [];
  for (let index = 0; index < names.length; index += 1) {
    const xml = await zip.file(names[index])?.async('string');
    if (!xml) continue;
    const doc = new DOMParser().parseFromString(xml, 'application/xml');
    if (doc.querySelector('parsererror')) continue;
    const paragraphs = Array.from(doc.getElementsByTagNameNS('*', 'p')).map((paragraph) =>
      Array.from(paragraph.getElementsByTagNameNS('*', 't')).map((node) => node.textContent || '').join('').trim()
    ).filter(Boolean);
    const fallback = Array.from(doc.getElementsByTagNameNS('*', 't')).map((node) => node.textContent || '').join(' ').trim();
    slides.push(paragraphs.length ? { title: paragraphs[0], body: paragraphs.slice(1) } : { title: fallback || `Slide ${index + 1}`, body: [] });
  }
  if (!slides.length) throw new Error('No readable slide text was found in this PPTX file.');
  return slides;
}

function escapeHtml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

async function textToDocx(text: string) {
  const { htmlToDocx } = await import('@/tools/word/shared/batchHelpers');
  return htmlToDocx(text.split(/\n{2,}/).map((block) => `<p>${escapeHtml(block).replace(/\n/g, '<br>')}</p>`).join(''));
}

function pdfBlob(bytes: Uint8Array) {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return new Blob([copy.buffer], { type: 'application/pdf' });
}

async function textToPdf(text: string, title: string) {
  const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const pageSize: [number, number] = [612, 792];
  const margin = 54, size = 11, lineHeight = 16, maxWidth = 504;
  const lines: string[] = [];
  text.replace(/\r/g, '').split('\n').forEach((sourceLine) => {
    if (!sourceLine.trim()) { lines.push(''); return; }
    let current = '';
    sourceLine.split(/\s+/).forEach((word) => {
      const next = current ? `${current} ${word}` : word;
      if (font.widthOfTextAtSize(next, size) > maxWidth && current) { lines.push(current); current = word; }
      else current = next;
    });
    lines.push(current);
  });
  let page = pdf.addPage(pageSize), y = 738;
  page.drawText(title.slice(0, 90), { x: margin, y, size: 16, font: bold, color: rgb(.12, .13, .15) });
  y -= 28;
  for (const line of lines) {
    if (y < margin) { page = pdf.addPage(pageSize); y = 738; }
    if (line) page.drawText(line.slice(0, 500), { x: margin, y, size, font, color: rgb(.15, .16, .18) });
    y -= lineHeight;
  }
  return pdfBlob(await pdf.save());
}

async function slidesToPdf(slides: TextSlide[], title: string) {
  const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  for (const slide of slides) {
    const page = pdf.addPage([960, 540]);
    page.drawText((slide.title || title).slice(0, 100), { x: 72, y: 430, size: 34, font: bold, color: rgb(.1, .12, .16), maxWidth: 816 });
    let y = 355;
    for (const line of slide.body.slice(0, 12)) {
      const clean = line.replace(/^[-*•]\s*/, '').trim();
      if (!clean) continue;
      page.drawText(`• ${clean}`.slice(0, 160), { x: 92, y, size: 20, font, color: rgb(.22, .24, .28), maxWidth: 780 });
      y -= 34;
      if (y < 70) break;
    }
  }
  return pdfBlob(await pdf.save());
}

function baseName(name: string) { return name.replace(/\.[^.]+$/, '') || 'document'; }
function makeDownload(blob: Blob, name: string): DownloadState { return { name, url: URL.createObjectURL(blob), label: `Download ${name.split('.').pop()?.toUpperCase() || 'file'}` }; }

const SPELLING_FIXES: Record<string, string> = {
  teh:'the', hte:'the', taht:'that', adn:'and', recieve:'receive', recieved:'received', seperate:'separate', occured:'occurred', definately:'definitely',
  accomodate:'accommodate', untill:'until', wierd:'weird', thier:'their', becuase:'because', goverment:'government', enviroment:'environment', adress:'address',
  begining:'beginning', sucessful:'successful', calender:'calendar', grammer:'grammar', tommorow:'tomorrow', writting:'writing', runing:'running', documant:'document',
  langauge:'language', sentance:'sentence', dowload:'download', freind:'friend', acheive:'achieve', acheived:'achieved', neccessary:'necessary', occurance:'occurrence',
  priviledge:'privilege', recomend:'recommend', recomendation:'recommendation', responsability:'responsibility', similiar:'similar', succesful:'successful', truely:'truly',
  independant:'independent', maintainance:'maintenance'
};

type LanguageIssue = { id: string; found: string; replacement: string; message: string };
function spellingIssues(text: string): LanguageIssue[] {
  const seen = new Set<string>();
  const issues: LanguageIssue[] = [];
  for (const match of text.matchAll(/\b[A-Za-z][A-Za-z'-]{2,}\b/g)) {
    const key = match[0].toLowerCase(), replacement = SPELLING_FIXES[key];
    if (replacement && !seen.has(key)) { seen.add(key); issues.push({ id:`spell-${key}`, found:match[0], replacement, message:`Common misspelling: “${match[0]}”` }); }
  }
  return issues;
}
function escapeRegex(value: string) { return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
function applyWordFix(text: string, issue: LanguageIssue) {
  return text.replace(new RegExp(`\\b${escapeRegex(issue.found)}\\b`, 'gi'), (value) => value[0] === value[0]?.toUpperCase() ? issue.replacement[0].toUpperCase() + issue.replacement.slice(1) : issue.replacement);
}
function grammarIssues(text: string): LanguageIssue[] {
  const issues: LanguageIssue[] = [], add = (id:string, found:string, replacement:string, message:string) => issues.push({ id, found, replacement, message });
  const repeat=/\b([A-Za-z]+)\s+\1\b/i.exec(text); if(repeat) add('repeat-word',repeat[0],repeat[1],'Repeated word.');
  const spaces=/ {2,}/.exec(text); if(spaces) add('double-space',spaces[0],' ','Multiple spaces between words.');
  const before=/\s+([,.;:!?])/.exec(text); if(before) add('space-punctuation',before[0],before[1],'Remove the space before punctuation.');
  const after=/([,.;:!?])([A-Za-z])/.exec(text); if(after) add('missing-space',after[0],`${after[1]} ${after[2]}`,'Add a space after punctuation.');
  const repeated=/([!?])\1{1,}/.exec(text); if(repeated) add('repeat-punctuation',repeated[0],repeated[1],'Repeated punctuation may be unnecessary.');
  const lower=/(^|[.!?]\s+)([a-z])/.exec(text); if(lower) add('capitalization',lower[0],`${lower[1]}${lower[2].toUpperCase()}`,'Capitalize the beginning of the sentence.');
  const article=/\b(a)\s+([aeiou][A-Za-z'-]*)\b/i.exec(text); if(article) add('article-an',article[0],`an ${article[2]}`,'Use “an” before a vowel sound in common cases.');
  const anArticle=/\b(an)\s+([bcdfghjklmnpqrstvwxyz][A-Za-z'-]*)\b/i.exec(text); if(anArticle) add('article-a',anArticle[0],`a ${anArticle[2]}`,'Use “a” before a consonant sound in common cases.');
  if(text.trim() && /[A-Za-z0-9)]$/.test(text.trim())) add('terminal-punctuation',text.trim().slice(-20),`${text.trim().slice(-20)}.`,'The final sentence may need terminal punctuation.');
  return issues;
}

function LanguageTool({ mode, toolId }: { mode:'spell-checker'|'grammar-checker'; toolId:string }) {
  const [text,setText]=useState('Paste or type text here to check your writting and grammer.  this this sample has issues !It also demonstrates a apple');
  const [status,setStatus]=useState('Edits stay in your browser.');
  const issues=useMemo(()=>mode==='spell-checker'?spellingIssues(text):grammarIssues(text),[mode,text]);
  const apply=(issue:LanguageIssue)=>{ setText((current)=>mode==='spell-checker'?applyWordFix(current,issue):current.replace(issue.found,issue.replacement)); setStatus(`Applied: ${issue.replacement}`); trackToolEvent('tool_success',{toolId,outputType:'text'}); };
  const applyAll=()=>{ let next=text; const list=mode==='spell-checker'?spellingIssues(next):grammarIssues(next); list.forEach((issue)=>{next=mode==='spell-checker'?applyWordFix(next,issue):next.replace(issue.found,issue.replacement)}); setText(next); setStatus(`Applied ${list.length} safe ${list.length===1?'change':'changes'}.`); };
  const save=()=>{ const blob=new Blob([text],{type:'text/plain;charset=utf-8'}), url=URL.createObjectURL(blob), a=document.createElement('a'); a.href=url;a.download=`${mode==='spell-checker'?'spell-checked':'grammar-checked'}.txt`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);trackToolEvent('tool_download',{toolId,outputType:'txt'}); };
  return <div className="rfi-tool"><style>{css}</style><div className="rfi-head"><div><strong>{mode==='spell-checker'?'Spell Checker':'Grammar Checker'}</strong><span>{status}</span></div><div className="rfi-actions"><button className="rfi-btn" onClick={applyAll} disabled={!issues.length}><CheckCircle2 size={16}/>Apply safe fixes</button><button className="rfi-btn primary" onClick={save}><Download size={16}/>Download TXT</button></div></div><div className="rfi-language-grid"><textarea className="rfi-textarea" spellCheck value={text} onChange={(e)=>setText(e.target.value)}/><div className="rfi-issues"><div className="rfi-note">{mode==='spell-checker'?'Focused common-error suggestions plus your browser’s native spelling underlines.':'Lightweight deterministic grammar rules, not generative AI proofreading.'}</div>{issues.length?issues.map((issue)=><div className="rfi-issue" key={issue.id}><strong>{issue.message}</strong><span>“{issue.found}” → “{issue.replacement}”</span><button className="rfi-link" onClick={()=>apply(issue)}>Apply</button></div>):<div className="rfi-success"><CheckCircle2/>No matching issues found.</div>}</div></div></div>;
}

type SentenceItem={text:string;page:number;index:number;score:number};
const STOP=new Set('the a an and or but if then than to of in on for from by with as at is are was were be been being it its this that these those he she they we you i me my our your their not no do does did can could should would may might will just into over under about after before between during through because while where when what which who whom whose'.split(' '));
function summarize(pages:string[],length:'short'|'medium'|'detailed') {
  const sentences:SentenceItem[]=[];let index=0;
  pages.forEach((page,pageIndex)=>(page.replace(/\s+/g,' ').match(/[^.!?]+[.!?]+|[^.!?]+$/g)||[]).map((s)=>s.trim()).filter((s)=>s.length>=35&&s.length<=650).forEach((text)=>sentences.push({text,page:pageIndex+1,index:index++,score:0})));
  const freq=new Map<string,number>(); sentences.forEach((s)=>(s.text.toLowerCase().match(/[a-z][a-z'-]{2,}/g)||[]).forEach((w)=>{if(!STOP.has(w))freq.set(w,(freq.get(w)||0)+1)}));
  const max=Math.max(1,...freq.values()); sentences.forEach((s)=>{const words=s.text.toLowerCase().match(/[a-z][a-z'-]{2,}/g)||[];s.score=words.filter((w)=>!STOP.has(w)).reduce((n,w)=>n+(freq.get(w)||0)/max,0)/Math.max(8,words.length)+(s.index<3?.35:s.page===1?.15:0)});
  const limit=Math.min(sentences.length,length==='short'?5:length==='medium'?10:18); return [...sentences].sort((a,b)=>b.score-a.score).slice(0,limit).sort((a,b)=>a.index-b.index);
}
function PdfSummarizer({toolId}:{toolId:string}){
  const inputRef=useRef<HTMLInputElement>(null);const[fileName,setFileName]=useState('');const[busy,setBusy]=useState(false);const[status,setStatus]=useState('Choose a text-based PDF to create a local extractive summary.');const[pages,setPages]=useState<string[]>([]);const[length,setLength]=useState<'short'|'medium'|'detailed'>('medium');const summary=useMemo(()=>summarize(pages,length),[pages,length]);
  const open=async(file?:File)=>{if(!file)return;if(!(file.type==='application/pdf'||/\.pdf$/i.test(file.name))){setStatus('Choose a PDF file.');return}setBusy(true);setPages([]);setFileName(file.name);setStatus('Extracting PDF text in your browser…');try{const pdfjs=await import('pdfjs-dist/legacy/build/pdf.mjs');const pdf=await pdfjs.getDocument({data:new Uint8Array(await file.arrayBuffer())}).promise;const next:string[]=[];for(let n=1;n<=pdf.numPages;n++){const page=await pdf.getPage(n);const content=await page.getTextContent();next.push(cleanText(content.items.map((item:unknown)=>item&&typeof item==='object'&&'str'in item?String((item as{str?:string}).str||''):'').join(' ')))}(pdf as unknown as {destroy?:()=>void}).destroy?.();if(!next.some(Boolean))throw new Error('No extractable text was found. Scanned PDFs should be processed with PDF OCR first.');setPages(next);setStatus(`Extracted ${next.length} ${next.length===1?'page':'pages'} locally.`);trackToolEvent('tool_success',{toolId,fileType:'pdf',outputType:'summary'})}catch(error){setPages([]);setStatus(error instanceof Error?error.message:'Could not summarize this PDF.');trackToolEvent('tool_error',{toolId,fileType:'pdf'})}finally{setBusy(false);if(inputRef.current)inputRef.current.value=''}};
  const summaryText=summary.map((s)=>`[p. ${s.page}] ${s.text}`).join('\n\n');const save=()=>{const blob=new Blob([summaryText],{type:'text/plain;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`${baseName(fileName)}-summary.txt`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);trackToolEvent('tool_download',{toolId,outputType:'txt'})};
  return <div className="rfi-tool"><style>{css}</style><input hidden ref={inputRef} type="file" accept="application/pdf,.pdf" onChange={(e)=>void open(e.target.files?.[0])}/><div className="rfi-head"><div><strong>PDF Summarizer</strong><span>{status}</span></div><div className="rfi-actions"><select className="rfi-select" value={length} onChange={(e)=>setLength(e.target.value as typeof length)}><option value="short">Short</option><option value="medium">Medium</option><option value="detailed">Detailed</option></select><button className="rfi-btn primary" disabled={busy} onClick={()=>inputRef.current?.click()}><FileUp size={16}/>{busy?'Reading…':fileName?'Choose another':'Choose PDF'}</button></div></div><div className="rfi-note"><Sparkles size={16}/>Extractive summary: important existing PDF sentences are selected and page-referenced; no generated claims.</div>{summary.length?<><div className="rfi-summary">{summary.map((s)=><p key={`${s.page}-${s.index}`}><span>p. {s.page}</span>{s.text}</p>)}</div><button className="rfi-btn" onClick={save}><Download size={16}/>Download summary</button></>:<button className="rfi-empty" onClick={()=>inputRef.current?.click()}><Search/><strong>Summarize a PDF locally</strong><span>Use PDF OCR first for scanned pages.</span></button>}</div>;
}

function label(mode:OfficeMode){return({'doc-to-pdf':'DOC to PDF','doc-viewer':'DOC Viewer','doc-to-docx':'DOC to DOCX','pptx-editor':'PPTX Editor','pptx-viewer':'PPTX Viewer','ppt-viewer':'PPT Viewer','ppt-to-pdf':'PowerPoint to PDF'}as const)[mode]}
function note(mode:OfficeMode){if(mode.startsWith('doc-'))return'Legacy Word DOC parsing recovers readable content locally. Complex macros, objects, fields, exact layout and pagination may be simplified.';if(mode==='ppt-viewer')return'Legacy PPT parsing is content-focused. Complex drawings, transitions, media, and exact desktop rendering can be simplified.';if(mode==='pptx-editor')return'This editor imports readable slide text and rebuilds a clean title-and-bullet PPTX; advanced themes, charts, animations and SmartArt are not preserved.';if(mode==='ppt-to-pdf')return'PPTX is read from OOXML; legacy PPT uses the browser compatibility parser. PDF output preserves recovered titles and bullets rather than unsupported animations or media.';return'This viewer focuses on readable slide text and structure rather than claiming full desktop PowerPoint fidelity.'}
function OfficeTool({mode,toolId}:{mode:OfficeMode;toolId:string}){
  const inputRef=useRef<HTMLInputElement>(null);const[fileName,setFileName]=useState('');const[busy,setBusy]=useState(false);const[status,setStatus]=useState('Choose a file to begin.');const[text,setText]=useState('');const[slides,setSlides]=useState<TextSlide[]>([]);const[download,setDownload]=useState<DownloadState>(null);const editor=mode==='pptx-editor',isDoc=mode.startsWith('doc-');const accept=isDoc?'.doc,application/msword':mode==='pptx-editor'||mode==='pptx-viewer'?'.pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation':'.ppt,.pptx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation';
  const clearDownload=()=>{if(download)URL.revokeObjectURL(download.url);setDownload(null)};
  const open=async(file?:File)=>{if(!file)return;setBusy(true);clearDownload();setText('');setSlides([]);setFileName(file.name);setStatus(`Opening ${file.name}…`);trackToolEvent('tool_start',{toolId,fileType:file.name.split('.').pop()||file.type});try{if(file.size<=0||file.size>50*1024*1024)throw new Error('Files must be between 1 byte and 50 MB.');if(isDoc){if(!/\.doc$/i.test(file.name)||/\.docx$/i.test(file.name))throw new Error('Choose a Word 97–2003 .doc file.');const parsed=await parseLegacy(file);setText(parsed.text);if(mode==='doc-to-docx'){setDownload(makeDownload(await textToDocx(parsed.text),`${baseName(file.name)}.docx`));setStatus('Recovered readable DOC content and rebuilt it as an editable DOCX.')}else if(mode==='doc-to-pdf'){setDownload(makeDownload(await textToPdf(parsed.text,baseName(file.name)),`${baseName(file.name)}.pdf`));setStatus('Recovered readable DOC content and converted it to PDF.')}else setStatus('Opened recovered DOC text in a read-only browser view.')}else{let next:TextSlide[];if(/\.pptx$/i.test(file.name))next=await parsePptx(file);else if(/\.ppt$/i.test(file.name)){const parsed=await parseLegacy(file);next=legacySlides(parsed.ast,parsed.text)}else throw new Error('Choose a PPT or PPTX presentation file.');setSlides(next);if(mode==='ppt-to-pdf'){setDownload(makeDownload(await slidesToPdf(next,baseName(file.name)),`${baseName(file.name)}.pdf`));setStatus(`Converted ${next.length} recovered ${next.length===1?'slide':'slides'} to PDF.`)}else setStatus(`Opened ${next.length} ${next.length===1?'slide':'slides'} in the browser.`)}trackToolEvent('tool_success',{toolId,fileType:file.name.split('.').pop()||file.type})}catch(error){setText('');setSlides([]);setStatus(error instanceof Error?error.message:'Could not process this file.');trackToolEvent('tool_error',{toolId,fileType:file.name.split('.').pop()||file.type})}finally{setBusy(false);if(inputRef.current)inputRef.current.value=''}};
  const updateSlide=(index:number,key:'title'|'body',value:string)=>setSlides((current)=>current.map((slide,i)=>i===index?{...slide,[key]:key==='body'?value.split('\n'):value}:slide));
  const savePptx=async()=>{if(!slides.length)return;setBusy(true);clearDownload();setStatus('Building a clean editable PPTX…');try{setDownload(makeDownload(await buildSimplePptx(slides,slides[0]?.title||'Presentation'),`${baseName(fileName)}-edited.pptx`));setStatus('Rebuilt the edited text slides as a standard PPTX file.');trackToolEvent('tool_success',{toolId,outputType:'pptx'})}catch(error){setStatus(error instanceof Error?error.message:'Could not build PPTX.')}finally{setBusy(false)}};
  return <div className="rfi-tool"><style>{css}</style><input hidden ref={inputRef} type="file" accept={accept} onChange={(e)=>void open(e.target.files?.[0])}/><div className="rfi-head"><div className="rfi-title"><div className="rfi-icon">{isDoc?<FileText/>:<Presentation/>}</div><div><strong>{fileName||label(mode)}</strong><span>{status}</span></div></div><div className="rfi-actions">{editor&&slides.length?<button className="rfi-btn" disabled={busy} onClick={()=>void savePptx()}><Download size={16}/>Build edited PPTX</button>:null}<button className="rfi-btn primary" disabled={busy} onClick={()=>inputRef.current?.click()}>{busy?<RefreshCw size={16}/>:<FileUp size={16}/>} {busy?'Working…':fileName?'Open another':'Choose file'}</button></div></div><div className="rfi-note">{note(mode)}</div>{text?<div className="rfi-paper">{text.split(/\n{2,}/).map((block,i)=><p key={i}>{block}</p>)}</div>:null}{slides.length?<div className="rfi-slide-grid">{slides.map((slide,i)=><div className="rfi-slide-wrap" key={i}><span>Slide {i+1}</span><div className="rfi-slide">{editor?<><input value={slide.title} onChange={(e)=>updateSlide(i,'title',e.target.value)}/><textarea value={slide.body.join('\n')} onChange={(e)=>updateSlide(i,'body',e.target.value)}/></>:<><h3>{slide.title}</h3><ul>{slide.body.map((line,j)=><li key={j}>{line}</li>)}</ul></>}</div></div>)}</div>:null}{!text&&!slides.length?<button className="rfi-empty" onClick={()=>inputRef.current?.click()}>{isDoc?<FileText/>:<Presentation/>}<strong>{label(mode)}</strong><span>Processing happens in your browser.</span></button>:null}{download?<div className="rfi-download"><div><strong>{download.name}</strong><span>Original file remains unchanged.</span></div><a href={download.url} download={download.name} className="rfi-btn success" onClick={()=>trackToolEvent('tool_download',{toolId,outputType:download.name.split('.').pop()})}><Download size={16}/>{download.label}</a></div>:null}</div>;
}

const css=`.rfi-tool{display:grid;gap:16px}.rfi-head{display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap}.rfi-title{display:flex;align-items:center;gap:10px;min-width:0}.rfi-icon{width:42px;height:42px;border-radius:12px;background:#e8f0fe;color:#0b57d0;display:grid;place-items:center}.rfi-icon svg{width:21px}.rfi-head strong{display:block;font-size:14px}.rfi-head span{display:block;color:#5f6368;font-size:12px;margin-top:3px;max-width:660px}.rfi-actions{display:flex;gap:8px;flex-wrap:wrap}.rfi-btn{border:1px solid #dadce0;border-radius:20px;background:#fff;color:#202124;padding:9px 14px;font-weight:650;cursor:pointer;display:inline-flex;align-items:center;gap:7px;text-decoration:none}.rfi-btn.primary{background:#0b57d0;color:#fff;border-color:#0b57d0}.rfi-btn.success{background:#137333;color:#fff;border-color:#137333}.rfi-btn:disabled{opacity:.5;cursor:not-allowed}.rfi-select{border:1px solid #dadce0;border-radius:20px;padding:9px 12px;background:#fff}.rfi-note{padding:11px 13px;border-radius:11px;background:#fef7e0;color:#5f4b00;font-size:12px;line-height:1.5;display:flex;gap:8px;align-items:flex-start}.rfi-paper{min-height:420px;max-height:65vh;overflow:auto;border:1px solid #dadce0;border-radius:14px;background:#fff;padding:38px 44px;line-height:1.6;white-space:pre-wrap}.rfi-paper p{margin:0 0 1em}.rfi-empty{min-height:330px;border:2px dashed #d5dae2;border-radius:16px;background:#fbfcfe;display:grid;place-items:center;align-content:center;gap:8px;text-align:center;padding:32px;color:#5f6368;cursor:pointer}.rfi-empty svg{width:42px;height:42px;color:#0b57d0}.rfi-empty strong{color:#202124}.rfi-download{display:flex;align-items:center;justify-content:space-between;gap:12px;border:1px solid #cde3d3;border-radius:14px;padding:13px 15px;background:#f4faf6}.rfi-download span{display:block;font-size:11px;color:#5f6368;margin-top:3px}.rfi-slide-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:16px}.rfi-slide-wrap>span{display:block;font-size:11px;color:#5f6368;margin-bottom:5px}.rfi-slide{aspect-ratio:16/9;border:1px solid #d5dae2;border-radius:10px;background:#fff;padding:8% 9%;overflow:auto}.rfi-slide h3{margin:0 0 8%;font-size:24px}.rfi-slide ul{padding-left:1.25em;line-height:1.45}.rfi-slide input,.rfi-slide textarea{width:100%;border:1px solid #dadce0;border-radius:8px;padding:8px;font:inherit}.rfi-slide input{font-size:20px;font-weight:700}.rfi-slide textarea{min-height:58%;margin-top:10px;resize:none;line-height:1.4}.rfi-language-grid{display:grid;grid-template-columns:minmax(320px,1.1fr) minmax(280px,.9fr);gap:16px}.rfi-textarea{min-height:500px;border:1px solid #dadce0;border-radius:14px;padding:18px;font:15px/1.6 Arial,sans-serif;resize:vertical}.rfi-issues{display:grid;gap:10px}.rfi-issue{border:1px solid #e0e3e7;border-radius:12px;padding:12px;background:#fff;display:grid;gap:5px}.rfi-issue strong{font-size:13px}.rfi-issue span{font-size:12px;color:#5f6368}.rfi-link{justify-self:start;border:0;background:transparent;color:#0b57d0;font-weight:700;padding:2px 0;cursor:pointer}.rfi-success{padding:18px;border:1px solid #cde3d3;border-radius:12px;background:#f4faf6;color:#137333;display:flex;gap:9px;align-items:center}.rfi-summary{border:1px solid #dadce0;border-radius:14px;background:#fff;padding:24px 28px;display:grid;gap:14px}.rfi-summary p{margin:0;line-height:1.6}.rfi-summary p span{display:inline-block;color:#0b57d0;font-size:11px;font-weight:700;margin-right:9px}@media(max-width:760px){.rfi-language-grid{grid-template-columns:1fr}.rfi-textarea{min-height:360px}.rfi-paper{padding:25px 20px}.rfi-download{align-items:flex-start;flex-direction:column}.rfi-slide-grid{grid-template-columns:1fr}}`;

export function RoadmapFinalInterface({mode,toolId}:{mode:RoadmapFinalMode;toolId:string}){
  if(mode==='spell-checker'||mode==='grammar-checker')return <LanguageTool mode={mode} toolId={toolId}/>;
  if(mode==='pdf-summarizer')return <PdfSummarizer toolId={toolId}/>;
  return <OfficeTool mode={mode} toolId={toolId}/>;
}
