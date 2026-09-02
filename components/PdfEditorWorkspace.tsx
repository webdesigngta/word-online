'use client';

import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { Bold, ChevronLeft, ChevronRight, Download, FileSearch, FileUp, Italic, LoaderCircle, RotateCcw, ScanText, Trash2 } from 'lucide-react';
import { trackToolEvent } from '@/lib/toolAnalytics';

const BASE_SCALE = 1.22;
const OCR_SCALE = 3;
const SAMPLE_SCALE = 1.75;
const HISTORY_LIMIT = 24;
const FONT_CHOICES = ['Arial', 'Helvetica', 'Times New Roman', 'Georgia', 'Calibri', 'Verdana', 'Courier New'];

type SourceKind = 'native' | 'ocr' | 'added';

type TextBox = {
  id: string;
  page: number;
  text: string;
  originalText: string;
  x: number;
  top: number;
  width: number;
  height: number;
  originalX: number;
  originalTop: number;
  originalWidth: number;
  originalHeight: number;
  fontFamily: string;
  originalFontFamily: string;
  fontSize: number;
  originalFontSize: number;
  bold: boolean;
  originalBold: boolean;
  italic: boolean;
  originalItalic: boolean;
  color: string;
  originalColor: string;
  background: string;
  source: SourceKind;
  confidence: number | null;
  isNew: boolean;
};

type PageModel = {
  pageNumber: number;
  width: number;
  height: number;
  source: Exclude<SourceKind, 'added'>;
  confidence: number | null;
  thumbnail: string;
  boxes: TextBox[];
};

type OcrWord = {
  text: string;
  confidence: number;
  bbox: { x0: number; y0: number; x1: number; y1: number };
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function formatBytes(value: number) {
  return value < 1024 * 1024 ? `${(value / 1024).toFixed(1)} KB` : `${(value / 1024 / 1024).toFixed(1)} MB`;
}

function hex(r: number, g: number, b: number) {
  return `#${[r, g, b].map((v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('')}`;
}

function rgb(hexColor: string) {
  const value = hexColor.replace('#', '').padEnd(6, '0').slice(0, 6);
  return {
    r: parseInt(value.slice(0, 2), 16) / 255,
    g: parseInt(value.slice(2, 4), 16) / 255,
    b: parseInt(value.slice(4, 6), 16) / 255,
  };
}

function inferFont(fontName = '', family = '') {
  const value = `${fontName} ${family}`.toLowerCase();
  let resolved = 'Arial';
  if (value.includes('calibri')) resolved = 'Calibri';
  else if (value.includes('georgia')) resolved = 'Georgia';
  else if (value.includes('courier') || value.includes('mono')) resolved = 'Courier New';
  else if (value.includes('times') || value.includes('serif')) resolved = 'Times New Roman';
  else if (value.includes('verdana')) resolved = 'Verdana';
  else if (value.includes('helvetica')) resolved = 'Helvetica';
  return {
    family: resolved,
    bold: /bold|black|heavy|semibold|demi/.test(value),
    italic: /italic|oblique/.test(value),
  };
}

function changed(box: TextBox) {
  return box.isNew
    || box.text !== box.originalText
    || box.fontFamily !== box.originalFontFamily
    || Math.abs(box.fontSize - box.originalFontSize) > 0.05
    || box.bold !== box.originalBold
    || box.italic !== box.originalItalic
    || box.color !== box.originalColor
    || Math.abs(box.x - box.originalX) > 0.05
    || Math.abs(box.top - box.originalTop) > 0.05
    || Math.abs(box.width - box.originalWidth) > 0.05
    || Math.abs(box.height - box.originalHeight) > 0.05;
}

function clonePages(pages: PageModel[]) {
  return pages.map((page) => ({ ...page, boxes: page.boxes.map((box) => ({ ...box })) }));
}

function fontKey(box: TextBox) {
  const family = box.fontFamily.toLowerCase();
  if (family.includes('times') || family.includes('georgia')) return `TimesRoman${box.bold ? 'Bold' : ''}${box.italic ? 'Italic' : ''}`;
  if (family.includes('courier')) return `Courier${box.bold ? 'Bold' : ''}${box.italic ? 'Oblique' : ''}`;
  return `Helvetica${box.bold ? 'Bold' : ''}${box.italic ? 'Oblique' : ''}`;
}

function wrapText(text: string, font: any, size: number, maxWidth: number) {
  const lines: string[] = [];
  for (const raw of text.replace(/\r/g, '').split('\n')) {
    const words = raw.split(/\s+/).filter(Boolean);
    if (!words.length) {
      lines.push('');
      continue;
    }
    let line = words[0];
    for (let index = 1; index < words.length; index += 1) {
      const candidate = `${line} ${words[index]}`;
      if (font.widthOfTextAtSize(candidate, size) <= maxWidth) line = candidate;
      else {
        lines.push(line);
        line = words[index];
      }
    }
    lines.push(line);
  }
  return lines;
}

async function renderCanvas(page: any, scale: number) {
  const viewport = page.getViewport({ scale });
  const canvas = window.document.createElement('canvas');
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  const context = canvas.getContext('2d', { alpha: false });
  if (!context) throw new Error('Could not create a PDF canvas.');
  context.fillStyle = '#fff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvasContext: context, viewport }).promise;
  return canvas;
}

function makeThumbnail(source: HTMLCanvasElement) {
  const width = 108;
  const height = Math.max(60, Math.round(source.height * (width / source.width)));
  const canvas = window.document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d', { alpha: false });
  if (!context) return '';
  context.fillStyle = '#fff';
  context.fillRect(0, 0, width, height);
  context.drawImage(source, 0, 0, width, height);
  const result = canvas.toDataURL('image/jpeg', 0.72);
  canvas.width = 0;
  canvas.height = 0;
  return result;
}

function sampleColors(canvas: HTMLCanvasElement, x: number, top: number, width: number, height: number, scale: number) {
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return { color: '#202124', background: '#ffffff' };
  const left = clamp(Math.floor(x * scale), 0, Math.max(0, canvas.width - 1));
  const y = clamp(Math.floor(top * scale), 0, Math.max(0, canvas.height - 1));
  const w = clamp(Math.ceil(width * scale), 1, Math.max(1, canvas.width - left));
  const h = clamp(Math.ceil(height * scale), 1, Math.max(1, canvas.height - y));
  const image = context.getImageData(left, y, w, h).data;
  const pixel = (px: number, py: number) => {
    const index = (py * w + px) * 4;
    return [image[index], image[index + 1], image[index + 2]] as [number, number, number];
  };
  const edges: Array<[number, number, number]> = [];
  const xStep = Math.max(1, Math.floor(w / 12));
  const yStep = Math.max(1, Math.floor(h / 7));
  for (let px = 0; px < w; px += xStep) edges.push(pixel(px, 0), pixel(px, h - 1));
  for (let py = 0; py < h; py += yStep) edges.push(pixel(0, py), pixel(w - 1, py));
  const background = edges.reduce(
    (sum, item) => [sum[0] + item[0], sum[1] + item[1], sum[2] + item[2]] as [number, number, number],
    [0, 0, 0] as [number, number, number],
  ).map((value) => value / Math.max(1, edges.length)) as [number, number, number];
  let foreground: [number, number, number] = [32, 33, 36];
  let distance = 0;
  for (let py = 0; py < h; py += Math.max(1, Math.floor(h / 12))) {
    for (let px = 0; px < w; px += Math.max(1, Math.floor(w / 24))) {
      const candidate = pixel(px, py);
      const next = Math.hypot(candidate[0] - background[0], candidate[1] - background[1], candidate[2] - background[2]);
      if (next > distance) {
        distance = next;
        foreground = candidate;
      }
    }
  }
  return {
    color: distance > 24 ? hex(...foreground) : '#202124',
    background: hex(...background),
  };
}

function groupOcrWords(words: OcrWord[]) {
  const valid = words.filter((word) => word.text?.trim() && word.confidence >= 18 && word.bbox.x1 > word.bbox.x0 && word.bbox.y1 > word.bbox.y0);
  const heights = valid.map((word) => word.bbox.y1 - word.bbox.y0).sort((a, b) => a - b);
  const median = heights.length ? heights[Math.floor(heights.length / 2)] : 20;
  const lines: OcrWord[][] = [];
  for (const word of [...valid].sort((a, b) => ((a.bbox.y0 + a.bbox.y1) / 2) - ((b.bbox.y0 + b.bbox.y1) / 2) || a.bbox.x0 - b.bbox.x0)) {
    const center = (word.bbox.y0 + word.bbox.y1) / 2;
    let line = lines.find((candidate) => {
      const lineCenter = candidate.reduce((sum, item) => sum + (item.bbox.y0 + item.bbox.y1) / 2, 0) / candidate.length;
      return Math.abs(lineCenter - center) <= Math.max(median * 0.58, (word.bbox.y1 - word.bbox.y0) * 0.58);
    });
    if (!line) {
      line = [];
      lines.push(line);
    }
    line.push(word);
  }
  return lines.map((line) => {
    line.sort((a, b) => a.bbox.x0 - b.bbox.x0);
    return {
      text: line.map((word) => word.text.trim()).join(' '),
      confidence: line.reduce((sum, word) => sum + word.confidence, 0) / line.length,
      x0: Math.min(...line.map((word) => word.bbox.x0)),
      y0: Math.min(...line.map((word) => word.bbox.y0)),
      x1: Math.max(...line.map((word) => word.bbox.x1)),
      y1: Math.max(...line.map((word) => word.bbox.y1)),
    };
  }).filter((line) => line.text);
}

export function PdfEditorWorkspace({ toolId }: { toolId: string }) {
  const fileInput = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pdfRef = useRef<any>(null);
  const renderToken = useRef(0);
  const pagesRef = useRef<PageModel[]>([]);
  const textEditSnapshot = useRef<PageModel[] | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PageModel[]>([]);
  const [pageNumber, setPageNumber] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [language, setLanguage] = useState('eng');
  const [zoom, setZoom] = useState(1);
  const [dragging, setDragging] = useState(false);
  const [undoStack, setUndoStack] = useState<PageModel[][]>([]);
  const [redoStack, setRedoStack] = useState<PageModel[][]>([]);
  const [status, setStatus] = useState('Choose or drop a PDF. DOC321 keeps the original page visible and only redraws regions you actually edit.');

  const page = pages.find((item) => item.pageNumber === pageNumber) || null;
  const selected = useMemo(() => page?.boxes.find((box) => box.id === selectedId) || null, [page, selectedId]);
  const editCount = useMemo(() => pages.reduce((total, item) => total + item.boxes.filter(changed).length, 0), [pages]);
  const regionCount = useMemo(() => pages.reduce((total, item) => total + item.boxes.length, 0), [pages]);
  const cssScale = BASE_SCALE * zoom;

  function setPagesNow(next: PageModel[]) {
    pagesRef.current = next;
    setPages(next);
  }

  function remember(snapshot: PageModel[]) {
    setUndoStack((current) => [...current.slice(-(HISTORY_LIMIT - 1)), clonePages(snapshot)]);
    setRedoStack([]);
  }

  function replacePages(next: PageModel[], withHistory = true) {
    if (withHistory) remember(pagesRef.current);
    setPagesNow(next);
  }

  function patchBox(id: string, patch: Partial<TextBox>) {
    const current = pagesRef.current;
    const next = current.map((item) => item.pageNumber !== pageNumber ? item : {
      ...item,
      boxes: item.boxes.map((box) => box.id === id ? { ...box, ...patch } : box),
    });
    replacePages(next);
  }

  function commitText(id: string, text: string) {
    const current = pagesRef.current;
    const currentBox = current.find((item) => item.pageNumber === pageNumber)?.boxes.find((box) => box.id === id);
    if (!currentBox || currentBox.text === text) {
      textEditSnapshot.current = null;
      return;
    }
    const snapshot = textEditSnapshot.current || clonePages(current);
    const next = current.map((item) => item.pageNumber !== pageNumber ? item : {
      ...item,
      boxes: item.boxes.map((box) => box.id === id ? { ...box, text } : box),
    });
    setUndoStack((history) => [...history.slice(-(HISTORY_LIMIT - 1)), clonePages(snapshot)]);
    setRedoStack([]);
    setPagesNow(next);
    textEditSnapshot.current = null;
  }

  function undo() {
    const previous = undoStack[undoStack.length - 1];
    if (!previous) return;
    setRedoStack((current) => [...current.slice(-(HISTORY_LIMIT - 1)), clonePages(pagesRef.current)]);
    setUndoStack((current) => current.slice(0, -1));
    setPagesNow(clonePages(previous));
    setSelectedId(null);
    setStatus('Undid the last edit.');
  }

  function redo() {
    const nextState = redoStack[redoStack.length - 1];
    if (!nextState) return;
    setUndoStack((current) => [...current.slice(-(HISTORY_LIMIT - 1)), clonePages(pagesRef.current)]);
    setRedoStack((current) => current.slice(0, -1));
    setPagesNow(clonePages(nextState));
    setSelectedId(null);
    setStatus('Redid the edit.');
  }

  function resetSelected() {
    if (!selected) return;
    if (selected.isNew) {
      const next = pagesRef.current.map((item) => item.pageNumber !== pageNumber ? item : { ...item, boxes: item.boxes.filter((box) => box.id !== selected.id) });
      replacePages(next);
      setSelectedId(null);
      return;
    }
    patchBox(selected.id, {
      text: selected.originalText,
      x: selected.originalX,
      top: selected.originalTop,
      width: selected.originalWidth,
      height: selected.originalHeight,
      fontFamily: selected.originalFontFamily,
      fontSize: selected.originalFontSize,
      bold: selected.originalBold,
      italic: selected.originalItalic,
      color: selected.originalColor,
    });
  }

  function addText() {
    if (!page || busy) return;
    const id = `added-${pageNumber}-${Date.now()}`;
    const x = Math.min(56, Math.max(18, page.width * 0.08));
    const top = Math.min(70, Math.max(18, page.height * 0.08));
    const box: TextBox = {
      id,
      page: pageNumber,
      text: 'Type text',
      originalText: '',
      x,
      top,
      width: Math.min(220, Math.max(120, page.width - x - 24)),
      height: 24,
      originalX: x,
      originalTop: top,
      originalWidth: Math.min(220, Math.max(120, page.width - x - 24)),
      originalHeight: 24,
      fontFamily: 'Arial',
      originalFontFamily: 'Arial',
      fontSize: 12,
      originalFontSize: 12,
      bold: false,
      originalBold: false,
      italic: false,
      originalItalic: false,
      color: '#202124',
      originalColor: '#202124',
      background: '#ffffff',
      source: 'added',
      confidence: null,
      isNew: true,
    };
    const next = pagesRef.current.map((item) => item.pageNumber !== pageNumber ? item : { ...item, boxes: [...item.boxes, box] });
    replacePages(next);
    setSelectedId(id);
    setStatus('Added a new text region. Edit the text and position controls, then export the PDF.');
  }

  function deleteSelected() {
    if (!selected) return;
    if (selected.isNew) {
      const next = pagesRef.current.map((item) => item.pageNumber !== pageNumber ? item : { ...item, boxes: item.boxes.filter((box) => box.id !== selected.id) });
      replacePages(next);
      setSelectedId(null);
    } else {
      patchBox(selected.id, { text: '' });
    }
  }

  useEffect(() => () => {
    pdfRef.current?.destroy?.();
  }, []);

  async function drawPage(pageNo: number) {
    const pdf = pdfRef.current;
    const canvas = canvasRef.current;
    const model = pagesRef.current.find((item) => item.pageNumber === pageNo);
    if (!pdf || !canvas || !model) return;
    const token = ++renderToken.current;
    const pdfPage = await pdf.getPage(pageNo);
    const dpr = Math.min(2, Math.max(1, window.devicePixelRatio || 1));
    const viewport = pdfPage.getViewport({ scale: cssScale * dpr });
    if (token !== renderToken.current) return;
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    canvas.style.width = `${model.width * cssScale}px`;
    canvas.style.height = `${model.height * cssScale}px`;
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) return;
    context.fillStyle = '#fff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    await pdfPage.render({ canvasContext: context, viewport }).promise;
  }

  useEffect(() => {
    if (file && page) void drawPage(pageNumber);
  }, [file, pageNumber, zoom, pages.length]);

  async function analyze(pdf: any) {
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
    const models: PageModel[] = [];
    let worker: any = null;
    try {
      for (let pageIndex = 1; pageIndex <= pdf.numPages; pageIndex += 1) {
        setStatus(`Analyzing page ${pageIndex} of ${pdf.numPages}...`);
        setProgress(Math.round(((pageIndex - 1) / pdf.numPages) * 100));
        const pdfPage = await pdf.getPage(pageIndex);
        const viewport = pdfPage.getViewport({ scale: 1 });
        const textContent: any = await pdfPage.getTextContent();
        const items = textContent.items.filter((item: any) => typeof item.str === 'string' && item.str.trim());
        const charCount = items.reduce((sum: number, item: any) => sum + item.str.trim().length, 0);
        const hasNativeText = items.length > 0 && charCount >= 3;
        const sampleScale = hasNativeText ? SAMPLE_SCALE : OCR_SCALE;
        const sample = await renderCanvas(pdfPage, sampleScale);
        const thumbnail = makeThumbnail(sample);

        if (hasNativeText) {
          const boxes: TextBox[] = items.map((item: any, index: number) => {
            const tx = pdfjs.Util.transform(viewport.transform, item.transform);
            const fontSize = Math.max(4, Math.hypot(tx[2], tx[3]));
            const style = (textContent.styles as Record<string, any>)[item.fontName] || {};
            const meta = inferFont(item.fontName, style.fontFamily);
            const x = clamp(tx[4], 0, viewport.width);
            const top = clamp(tx[5] - fontSize, 0, viewport.height);
            const width = clamp(Math.max(Math.abs(item.width || 0), fontSize * 0.45), 6, Math.max(6, viewport.width - x));
            const height = clamp(fontSize * 1.12, 6, Math.max(6, viewport.height - top));
            const sampled = sampleColors(sample, x, top, width, height, sampleScale);
            return {
              id: `native-${pageIndex}-${index}`,
              page: pageIndex,
              text: item.str,
              originalText: item.str,
              x,
              top,
              width,
              height,
              originalX: x,
              originalTop: top,
              originalWidth: width,
              originalHeight: height,
              fontFamily: meta.family,
              originalFontFamily: meta.family,
              fontSize,
              originalFontSize: fontSize,
              bold: meta.bold,
              originalBold: meta.bold,
              italic: meta.italic,
              originalItalic: meta.italic,
              color: sampled.color,
              originalColor: sampled.color,
              background: sampled.background,
              source: 'native' as const,
              confidence: 100,
              isNew: false,
            };
          });
          models.push({ pageNumber: pageIndex, width: viewport.width, height: viewport.height, source: 'native', confidence: 100, thumbnail, boxes });
        } else {
          if (!worker) {
            const tesseract = await import('tesseract.js');
            worker = await tesseract.createWorker(language, 1, {
              logger: (message: { status?: string; progress?: number }) => {
                if (message.status?.includes('recognizing') && typeof message.progress === 'number') {
                  setProgress(Math.min(99, Math.round((((pageIndex - 1) + message.progress) / pdf.numPages) * 100)));
                }
              },
            });
            await worker.setParameters?.({ preserve_interword_spaces: '1' });
          }
          const recognized = await worker.recognize(sample);
          const lines = groupOcrWords(recognized.data.words || []);
          const boxes: TextBox[] = lines.map((line, index) => {
            const x = line.x0 / OCR_SCALE;
            const top = line.y0 / OCR_SCALE;
            const width = Math.max(8, (line.x1 - line.x0) / OCR_SCALE);
            const rawHeight = Math.max(6, (line.y1 - line.y0) / OCR_SCALE);
            const height = rawHeight * 1.14;
            const sampled = sampleColors(sample, x, top, width, rawHeight, OCR_SCALE);
            const size = clamp(rawHeight * 0.9, 6, 72);
            return {
              id: `ocr-${pageIndex}-${index}`,
              page: pageIndex,
              text: line.text,
              originalText: line.text,
              x,
              top,
              width,
              height,
              originalX: x,
              originalTop: top,
              originalWidth: width,
              originalHeight: height,
              fontFamily: 'Arial',
              originalFontFamily: 'Arial',
              fontSize: size,
              originalFontSize: size,
              bold: false,
              originalBold: false,
              italic: false,
              originalItalic: false,
              color: sampled.color,
              originalColor: sampled.color,
              background: sampled.background,
              source: 'ocr' as const,
              confidence: line.confidence,
              isNew: false,
            };
          });
          models.push({
            pageNumber: pageIndex,
            width: viewport.width,
            height: viewport.height,
            source: 'ocr',
            confidence: typeof recognized.data.confidence === 'number' ? recognized.data.confidence : null,
            thumbnail,
            boxes,
          });
        }
        sample.width = 0;
        sample.height = 0;
      }
      setProgress(100);
      return models;
    } finally {
      await worker?.terminate?.().catch(() => undefined);
    }
  }

  async function chooseFile(next: File | null) {
    if (!next || busy) return;
    if (!(next.type === 'application/pdf' || /\.pdf$/i.test(next.name))) {
      setStatus('Please choose a PDF file.');
      return;
    }
    setBusy(true);
    setPagesNow([]);
    setUndoStack([]);
    setRedoStack([]);
    setSelectedId(null);
    setPageNumber(1);
    setZoom(1);
    setProgress(0);
    setStatus('Opening PDF...');
    try {
      pdfRef.current?.destroy?.();
      const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
      const pdf = await pdfjs.getDocument({ data: new Uint8Array(await next.arrayBuffer()) }).promise;
      pdfRef.current = pdf;
      setFile(next);
      const models = await analyze(pdf);
      setPagesNow(models);
      const nativePages = models.filter((item) => item.source === 'native').length;
      const ocrPages = models.length - nativePages;
      const regions = models.reduce((total, item) => total + item.boxes.length, 0);
      setStatus(`Ready. ${nativePages} page${nativePages === 1 ? '' : 's'} used embedded PDF text, ${ocrPages} used OCR, and ${regions} editable text region${regions === 1 ? '' : 's'} were found.`);
      trackToolEvent('tool_start', {
        toolId,
        fileType: 'pdf',
        metadata: { mode: 'source-preserving-smart-edit', pageCount: pdf.numPages, nativePages, ocrPages, regions },
      });
    } catch (error) {
      pdfRef.current?.destroy?.();
      pdfRef.current = null;
      setFile(null);
      setPagesNow([]);
      setStatus(error instanceof Error ? error.message : 'Could not analyze this PDF.');
    } finally {
      setBusy(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  }

  async function exportPdf() {
    if (!file || busy) return;
    const currentPages = pagesRef.current;
    const edits = currentPages.flatMap((item) => item.boxes.filter(changed));
    if (!edits.length) {
      setStatus('Make a text edit or add text first.');
      return;
    }
    setBusy(true);
    setStatus(`Applying ${edits.length} edited region${edits.length === 1 ? '' : 's'}...`);
    try {
      const pdfLib = await import('pdf-lib');
      const pdfDocument = await pdfLib.PDFDocument.load(new Uint8Array(await file.arrayBuffer()));
      const fonts = new Map<string, any>();
      for (const box of edits) {
        const pdfPage = pdfDocument.getPage(box.page - 1);
        const pageWidth = pdfPage.getWidth();
        const pageHeight = pdfPage.getHeight();

        if (!box.isNew) {
          const coverX = clamp(box.originalX - 1.5, 0, pageWidth);
          const coverTop = clamp(box.originalTop - 1.5, 0, pageHeight);
          const coverWidth = clamp(box.originalWidth + 3, 1, Math.max(1, pageWidth - coverX));
          const coverHeight = clamp(Math.max(box.originalHeight + 3, box.originalFontSize * 1.25), 1, Math.max(1, pageHeight - coverTop));
          const bg = rgb(box.background);
          pdfPage.drawRectangle({
            x: coverX,
            y: pageHeight - coverTop - coverHeight,
            width: coverWidth,
            height: coverHeight,
            color: pdfLib.rgb(bg.r, bg.g, bg.b),
            borderWidth: 0,
          });
        }

        if (!box.text.trim()) continue;
        const key = fontKey(box);
        let font = fonts.get(key);
        if (!font) {
          const standard = pdfLib.StandardFonts as unknown as Record<string, string>;
          font = await pdfDocument.embedFont(standard[key] || standard.Helvetica);
          fonts.set(key, font);
        }
        let size = clamp(box.fontSize, 4, 96);
        let lines = wrapText(box.text, font, size, Math.max(8, box.width));
        while (size > 5 && lines.length * size * 1.18 > Math.max(box.height * 2.6, size * 1.3)) {
          size -= 0.5;
          lines = wrapText(box.text, font, size, Math.max(8, box.width));
        }
        const fg = rgb(box.color);
        const baseline = pageHeight - box.top - size;
        lines.forEach((line, index) => {
          if (!line) return;
          pdfPage.drawText(line, {
            x: clamp(box.x, 0, pageWidth),
            y: baseline - index * size * 1.18,
            size,
            font,
            color: pdfLib.rgb(fg.r, fg.g, fg.b),
          });
        });
      }
      const bytes = await pdfDocument.save();
      const buffer = new ArrayBuffer(bytes.byteLength);
      new Uint8Array(buffer).set(bytes);
      const url = URL.createObjectURL(new Blob([buffer], { type: 'application/pdf' }));
      const anchor = window.document.createElement('a');
      anchor.href = url;
      anchor.download = `${file.name.replace(/\.pdf$/i, '') || 'document'}-edited.pdf`;
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 2500);
      setStatus(`Done. Downloaded an edited copy with ${edits.length} changed region${edits.length === 1 ? '' : 's'}.`);
      trackToolEvent('tool_success', {
        toolId,
        fileType: 'pdf',
        outputType: 'pdf',
        metadata: { mode: 'source-preserving-smart-edit', edits: edits.length },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not create the edited PDF.';
      setStatus(message);
      trackToolEvent('tool_error', { toolId, fileType: 'pdf', metadata: { mode: 'source-preserving-smart-edit', message } });
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    pdfRef.current?.destroy?.();
    pdfRef.current = null;
    setFile(null);
    setPagesNow([]);
    setPageNumber(1);
    setSelectedId(null);
    setUndoStack([]);
    setRedoStack([]);
    setProgress(0);
    setZoom(1);
    setStatus('Choose or drop a PDF. DOC321 keeps the original page visible and only redraws regions you actually edit.');
    if (fileInput.current) fileInput.current.value = '';
  }

  const numberValue = (value: number | undefined, fallback: number) => Number((value ?? fallback).toFixed(1));

  return (
    <div className="pdf-editor-workspace smart-pdf-editor" data-pdf-editor-workspace="true">
      <style>{`
        .pdf-editor-workspace{display:grid;gap:12px;color:#202124}.spe-drop{border:2px dashed #cbd2dc;border-radius:18px;padding:22px;text-align:center;background:#f8fafd;transition:.15s border-color,.15s background}.spe-drop.dragging{border-color:#0b57d0;background:#eef4ff}.spe-drop>svg{width:42px;height:42px;color:#0b57d0}.spe-drop h2{margin:7px 0 4px;font-size:20px}.spe-drop p{margin:0 auto 13px;color:#5f6368;max-width:760px;line-height:1.45}.spe-note{font-size:11px;color:#6b7280;margin-top:10px}.spe-actions{display:flex;align-items:center;justify-content:center;gap:7px;flex-wrap:wrap}.spe-btn{border:1px solid #d4d9e1;background:#fff;border-radius:9px;padding:8px 11px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:6px;color:#202124;white-space:nowrap}.spe-btn.primary{background:#0b57d0;color:#fff;border-color:#0b57d0}.spe-btn.success{background:#137333;color:#fff;border-color:#137333}.spe-btn.active{background:#e8f0fe;border-color:#8ab4f8;color:#174ea6}.spe-btn.danger{color:#b3261e}.spe-btn:disabled{opacity:.42;cursor:not-allowed}.spe-select,.spe-number,.spe-color{height:34px;border:1px solid #cfd5dd;border-radius:8px;background:#fff;padding:0 8px;color:#202124}.spe-number{width:66px}.spe-number.small{width:58px}.spe-color{width:40px;padding:3px}.spe-file,.spe-nav,.spe-style,.spe-status,.spe-commandbar{display:flex;align-items:center;gap:8px;flex-wrap:wrap;border:1px solid #e0e3e7;border-radius:12px;padding:9px 11px;background:#fff}.spe-file,.spe-nav,.spe-commandbar{justify-content:space-between}.spe-file small{display:block;color:#5f6368;margin-top:2px}.spe-style label{font-size:10px;font-weight:800;color:#5f6368;text-transform:uppercase;letter-spacing:.04em}.spe-detail{margin-left:auto;color:#5f6368;font-size:11px}.spe-badge{display:inline-flex;align-items:center;gap:5px;padding:5px 8px;border-radius:999px;background:#f1f3f4;font-size:11px;font-weight:700}.spe-editor-shell{display:grid;grid-template-columns:132px minmax(0,1fr);gap:10px;min-height:520px}.spe-sidebar{overflow:auto;max-height:76vh;border:1px solid #dfe3e8;border-radius:12px;background:#f6f8fb;padding:8px;display:grid;align-content:start;gap:8px}.spe-thumb{border:1px solid transparent;border-radius:9px;background:transparent;padding:6px;cursor:pointer;text-align:center;color:#5f6368;font-size:11px}.spe-thumb img{display:block;width:100%;height:auto;border:1px solid #d6dbe2;background:#fff;box-shadow:0 1px 3px rgba(60,64,67,.12);margin-bottom:4px}.spe-thumb.active{border-color:#8ab4f8;background:#e8f0fe;color:#174ea6;font-weight:800}.spe-workspace{overflow:auto;max-height:76vh;background:#e9edf3;border:1px solid #dfe3e8;border-radius:12px;padding:20px}.spe-page{position:relative;margin:auto;background:#fff;box-shadow:0 5px 24px rgba(60,64,67,.22);transform-origin:top left}.spe-page canvas,.spe-layer{position:absolute;inset:0}.spe-erase{position:absolute;pointer-events:none;box-sizing:border-box}.spe-box{position:absolute;box-sizing:border-box;padding:0 1px;border:1px solid transparent;outline:0;white-space:pre-wrap;line-height:1.05;cursor:text;overflow:visible;caret-color:#0b57d0}.spe-box:hover{border-color:rgba(11,87,208,.5)}.spe-box[data-selected='true']{border:1.5px solid #0b57d0;box-shadow:0 0 0 2px rgba(11,87,208,.12);z-index:3}.spe-box[data-changed='true']:not([data-selected='true']){border-color:rgba(19,115,51,.45)}.spe-status{font-size:12px;color:#5f6368}.spe-progress{height:7px;border-radius:999px;background:#e8eaed;overflow:hidden;flex:1;min-width:180px}.spe-progress span{display:block;height:100%;background:#0b57d0}.spe-zoom{font-size:11px;font-weight:800;color:#5f6368;min-width:42px;text-align:center}@media(max-width:850px){.spe-editor-shell{grid-template-columns:96px minmax(0,1fr)}.spe-workspace{padding:10px}.spe-style{overflow-x:auto;flex-wrap:nowrap}.spe-detail{display:none}}@media(max-width:620px){.spe-drop{padding:17px 10px}.spe-file,.spe-nav,.spe-commandbar{align-items:flex-start;flex-direction:column}.spe-editor-shell{grid-template-columns:1fr}.spe-sidebar{display:flex;max-height:none;overflow-x:auto}.spe-thumb{min-width:76px;width:76px}.spe-workspace{max-height:68vh;padding:7px}.spe-style{border-radius:10px}.spe-status{align-items:flex-start}.spe-progress{min-width:120px}}
      `}</style>

      <input
        ref={fileInput}
        hidden
        type="file"
        accept="application/pdf,.pdf"
        onChange={(event) => void chooseFile(event.target.files?.[0] || null)}
      />

      <div
        className={`spe-drop ${dragging ? 'dragging' : ''}`}
        onDragEnter={(event) => { event.preventDefault(); setDragging(true); }}
        onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
        onDragLeave={(event) => { event.preventDefault(); if (event.currentTarget === event.target) setDragging(false); }}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          void chooseFile(event.dataTransfer.files?.[0] || null);
        }}
      >
        <ScanText />
        <h2>Edit PDF text accurately</h2>
        <p>Open a digital or scanned PDF. DOC321 reads embedded text first, falls back to high-resolution OCR when needed, and keeps the original page rendering untouched until you edit a specific text region.</p>
        <div className="spe-actions">
          <select className="spe-select" value={language} disabled={busy || Boolean(file)} onChange={(event) => setLanguage(event.target.value)}>
            <option value="eng">English OCR</option>
            <option value="fra">French OCR</option>
            <option value="spa">Spanish OCR</option>
            <option value="deu">German OCR</option>
            <option value="hin">Hindi OCR</option>
          </select>
          <button className="spe-btn primary" type="button" disabled={busy} onClick={() => { if (fileInput.current) { fileInput.current.value = ''; fileInput.current.click(); } }}>
            <FileUp size={16} />{file ? 'Choose another PDF' : 'Choose PDF'}
          </button>
        </div>
        <div className="spe-note">You can also drag and drop a PDF here. Scanned pages use OCR; digital pages use their embedded text geometry for better placement and sizing.</div>
      </div>

      {busy && progress < 100 ? (
        <div className="spe-status" aria-live="polite">
          <LoaderCircle size={16} />
          <span>{status}</span>
          <div className="spe-progress"><span style={{ width: `${progress}%` }} /></div>
          <strong>{progress}%</strong>
        </div>
      ) : null}

      {file ? (
        <>
          <div className="spe-file">
            <div>
              <strong>{file.name}</strong>
              <small>{formatBytes(file.size)} · {pages.length || '...'} pages · {regionCount} detected regions · {editCount} changed</small>
            </div>
            <div className="spe-actions">
              <button className="spe-btn" type="button" onClick={reset} disabled={busy}><Trash2 size={15} />Close PDF</button>
              <button className="spe-btn success" type="button" onClick={() => void exportPdf()} disabled={busy || editCount === 0}><Download size={15} />Download edited PDF</button>
            </div>
          </div>

          {page ? (
            <>
              <div className="spe-commandbar">
                <div className="spe-actions">
                  <button className="spe-btn" type="button" disabled={busy || undoStack.length === 0} onClick={undo}>Undo</button>
                  <button className="spe-btn" type="button" disabled={busy || redoStack.length === 0} onClick={redo}>Redo</button>
                  <button className="spe-btn" type="button" disabled={busy} onClick={addText}>Add text</button>
                  <button className="spe-btn danger" type="button" disabled={busy || !selected} onClick={deleteSelected}>Delete text</button>
                </div>
                <div className="spe-actions">
                  <button className="spe-btn" type="button" disabled={busy || zoom <= 0.6} onClick={() => setZoom((value) => clamp(Number((value - 0.1).toFixed(1)), 0.6, 2))}>−</button>
                  <span className="spe-zoom">{Math.round(zoom * 100)}%</span>
                  <button className="spe-btn" type="button" disabled={busy || zoom >= 2} onClick={() => setZoom((value) => clamp(Number((value + 0.1).toFixed(1)), 0.6, 2))}>+</button>
                </div>
              </div>

              <div className="spe-nav">
                <div className="spe-actions">
                  <button className="spe-btn" type="button" disabled={busy || pageNumber <= 1} onClick={() => { setSelectedId(null); setPageNumber((value) => value - 1); }}><ChevronLeft size={15} />Previous</button>
                  <strong>Page {pageNumber} of {pages.length}</strong>
                  <button className="spe-btn" type="button" disabled={busy || pageNumber >= pages.length} onClick={() => { setSelectedId(null); setPageNumber((value) => value + 1); }}>Next<ChevronRight size={15} /></button>
                </div>
                <span className="spe-badge"><FileSearch size={14} />{page.source === 'native' ? 'Embedded PDF text' : 'OCR'}{page.confidence != null ? ` · ${Math.round(page.confidence)}%` : ''}</span>
              </div>

              <div className="spe-style">
                <label>Font</label>
                <select className="spe-select" disabled={!selected} value={selected?.fontFamily || 'Arial'} onChange={(event) => selected && patchBox(selected.id, { fontFamily: event.target.value })}>
                  {FONT_CHOICES.map((font) => <option key={font}>{font}</option>)}
                </select>
                <label>Size</label>
                <input className="spe-number small" disabled={!selected} type="number" min="4" max="96" step="0.5" value={numberValue(selected?.fontSize, 12)} onChange={(event) => selected && patchBox(selected.id, { fontSize: clamp(Number(event.target.value) || selected.fontSize, 4, 96) })} />
                <button className={`spe-btn ${selected?.bold ? 'active' : ''}`} type="button" disabled={!selected} onClick={() => selected && patchBox(selected.id, { bold: !selected.bold })}><Bold size={15} /></button>
                <button className={`spe-btn ${selected?.italic ? 'active' : ''}`} type="button" disabled={!selected} onClick={() => selected && patchBox(selected.id, { italic: !selected.italic })}><Italic size={15} /></button>
                <label>Color</label>
                <input className="spe-color" disabled={!selected} type="color" value={selected?.color || '#202124'} onChange={(event) => selected && patchBox(selected.id, { color: event.target.value })} />
                <label>X</label>
                <input className="spe-number small" disabled={!selected} type="number" min="0" step="1" value={numberValue(selected?.x, 0)} onChange={(event) => selected && patchBox(selected.id, { x: clamp(Number(event.target.value) || 0, 0, page.width) })} />
                <label>Y</label>
                <input className="spe-number small" disabled={!selected} type="number" min="0" step="1" value={numberValue(selected?.top, 0)} onChange={(event) => selected && patchBox(selected.id, { top: clamp(Number(event.target.value) || 0, 0, page.height) })} />
                <label>W</label>
                <input className="spe-number small" disabled={!selected} type="number" min="8" step="1" value={numberValue(selected?.width, 80)} onChange={(event) => selected && patchBox(selected.id, { width: clamp(Number(event.target.value) || selected.width, 8, page.width) })} />
                <label>H</label>
                <input className="spe-number small" disabled={!selected} type="number" min="8" step="1" value={numberValue(selected?.height, 20)} onChange={(event) => selected && patchBox(selected.id, { height: clamp(Number(event.target.value) || selected.height, 8, page.height) })} />
                <button className="spe-btn" type="button" disabled={!selected || (!changed(selected) && !selected.isNew)} onClick={resetSelected}><RotateCcw size={15} />Reset region</button>
                <span className="spe-detail">{selected ? `${selected.source === 'native' ? 'PDF metadata' : selected.source === 'ocr' ? 'OCR estimate' : 'New text'}${selected.confidence != null ? ` · ${Math.round(selected.confidence)}%` : ''}` : 'Click a text region to edit it'}</span>
              </div>

              <div className="spe-editor-shell">
                <aside className="spe-sidebar" aria-label="PDF pages">
                  {pages.map((item) => (
                    <button key={item.pageNumber} className={`spe-thumb ${item.pageNumber === pageNumber ? 'active' : ''}`} type="button" onClick={() => { setSelectedId(null); setPageNumber(item.pageNumber); }}>
                      {item.thumbnail ? <img src={item.thumbnail} alt="" /> : null}
                      Page {item.pageNumber}
                    </button>
                  ))}
                </aside>

                <div className="spe-workspace" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedId(null); }}>
                  <div className="spe-page" style={{ width: page.width * cssScale, height: page.height * cssScale }}>
                    <canvas ref={canvasRef} />
                    <div className="spe-layer">
                      {page.boxes.map((box) => {
                        const isSelected = selectedId === box.id;
                        const isChanged = changed(box);
                        const visible = isSelected || isChanged || box.isNew;
                        return (
                          <Fragment key={box.id}>
                            {visible && !box.isNew ? (
                              <div
                                className="spe-erase"
                                style={{
                                  left: (box.originalX - 1.5) * cssScale,
                                  top: (box.originalTop - 1.5) * cssScale,
                                  width: (box.originalWidth + 3) * cssScale,
                                  height: Math.max(box.originalHeight + 3, box.originalFontSize * 1.25) * cssScale,
                                  backgroundColor: box.background,
                                }}
                              />
                            ) : null}
                            <div
                              className="spe-box"
                              data-selected={isSelected ? 'true' : 'false'}
                              data-changed={isChanged ? 'true' : 'false'}
                              contentEditable
                              suppressContentEditableWarning
                              spellCheck
                              onFocus={() => {
                                setSelectedId(box.id);
                                textEditSnapshot.current = clonePages(pagesRef.current);
                              }}
                              onMouseDown={(event) => {
                                event.stopPropagation();
                                setSelectedId(box.id);
                              }}
                              onBlur={(event) => commitText(box.id, event.currentTarget.innerText.replace(/\n$/, ''))}
                              style={{
                                left: box.x * cssScale,
                                top: box.top * cssScale,
                                width: Math.max(12, box.width * cssScale),
                                minHeight: Math.max(8, box.height * cssScale),
                                fontFamily: `${box.fontFamily}, Arial, sans-serif`,
                                fontSize: box.fontSize * cssScale,
                                fontWeight: box.bold ? 700 : 400,
                                fontStyle: box.italic ? 'italic' : 'normal',
                                color: visible ? box.color : 'transparent',
                                backgroundColor: visible ? box.background : 'transparent',
                              }}
                            >{box.text}</div>
                          </Fragment>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : null}

          <div className="spe-status"><span>{status}</span></div>
        </>
      ) : null}
    </div>
  );
}
