'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bold,
  ChevronLeft,
  ChevronRight,
  Download,
  FileSearch,
  FileUp,
  Italic,
  LoaderCircle,
  RotateCcw,
  ScanText,
  Trash2,
} from 'lucide-react';
import { trackToolEvent } from '@/lib/toolAnalytics';

const DISPLAY_SCALE = 1.35;
const ANALYSIS_SCALE = 1.7;
const OCR_SCALE = 2.6;

const FONT_CHOICES = ['Arial', 'Helvetica', 'Times New Roman', 'Georgia', 'Calibri', 'Verdana', 'Courier New'];

type SourceKind = 'native' | 'ocr';
type FontWeightValue = 400 | 700;
type FontStyleValue = 'normal' | 'italic';

type EditableTextBox = {
  id: string;
  page: number;
  text: string;
  originalText: string;
  x: number;
  top: number;
  width: number;
  height: number;
  fontFamily: string;
  originalFontFamily: string;
  fontSize: number;
  originalFontSize: number;
  fontWeight: FontWeightValue;
  originalFontWeight: FontWeightValue;
  fontStyle: FontStyleValue;
  originalFontStyle: FontStyleValue;
  color: string;
  originalColor: string;
  background: string;
  source: SourceKind;
  confidence: number | null;
};

type PageModel = {
  pageNumber: number;
  width: number;
  height: number;
  source: SourceKind;
  confidence: number | null;
  boxes: EditableTextBox[];
};

type SampleBox = { x: number; top: number; width: number; height: number };

type NativeRun = {
  text: string;
  x: number;
  top: number;
  width: number;
  height: number;
  fontFamily: string;
  fontSize: number;
  fontWeight: FontWeightValue;
  fontStyle: FontStyleValue;
  fontName: string;
};

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function formatBytes(value: number) {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

function cleanFamily(raw: string | undefined, fontName = '') {
  const value = `${raw || ''} ${fontName}`.toLowerCase();
  if (value.includes('calibri')) return 'Calibri';
  if (value.includes('georgia')) return 'Georgia';
  if (value.includes('courier') || value.includes('mono')) return 'Courier New';
  if (value.includes('times') || value.includes('serif')) return 'Times New Roman';
  if (value.includes('verdana')) return 'Verdana';
  if (value.includes('helvetica')) return 'Helvetica';
  return 'Arial';
}

function fontMeta(fontName = '', family = '') {
  const value = `${fontName} ${family}`.toLowerCase();
  return {
    family: cleanFamily(family, fontName),
    weight: /bold|black|heavy|semibold|demi/.test(value) ? 700 as const : 400 as const,
    style: /italic|oblique/.test(value) ? 'italic' as const : 'normal' as const,
  };
}

function hexFromRgb(r: number, g: number, b: number) {
  return `#${[r, g, b].map((channel) => clamp(Math.round(channel), 0, 255).toString(16).padStart(2, '0')).join('')}`;
}

function rgb01(hex: string) {
  const clean = hex.replace('#', '');
  const value = clean.length === 3 ? clean.split('').map((item) => item + item).join('') : clean.padEnd(6, '0').slice(0, 6);
  return {
    r: parseInt(value.slice(0, 2), 16) / 255,
    g: parseInt(value.slice(2, 4), 16) / 255,
    b: parseInt(value.slice(4, 6), 16) / 255,
  };
}

function sampleColors(canvas: HTMLCanvasElement, box: SampleBox, scale: number) {
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return { color: '#202124', background: '#ffffff' };

  const left = clamp(Math.floor(box.x * scale), 0, Math.max(0, canvas.width - 1));
  const top = clamp(Math.floor(box.top * scale), 0, Math.max(0, canvas.height - 1));
  const width = clamp(Math.ceil(box.width * scale), 1, Math.max(1, canvas.width - left));
  const height = clamp(Math.ceil(box.height * scale), 1, Math.max(1, canvas.height - top));
  const data = context.getImageData(left, top, width, height).data;

  const edge: Array<[number, number, number]> = [];
  const strideX = Math.max(1, Math.floor(width / 12));
  const strideY = Math.max(1, Math.floor(height / 6));
  const pixel = (x: number, y: number) => {
    const index = (y * width + x) * 4;
    return [data[index], data[index + 1], data[index + 2]] as [number, number, number];
  };

  for (let x = 0; x < width; x += strideX) {
    edge.push(pixel(x, 0), pixel(x, Math.max(0, height - 1)));
  }
  for (let y = 0; y < height; y += strideY) {
    edge.push(pixel(0, y), pixel(Math.max(0, width - 1), y));
  }

  const background = edge.length
    ? edge.reduce((total, item) => [total[0] + item[0], total[1] + item[1], total[2] + item[2]] as [number, number, number], [0, 0, 0] as [number, number, number]).map((value) => value / edge.length) as [number, number, number]
    : [255, 255, 255] as [number, number, number];

  let foreground: [number, number, number] = [32, 33, 36];
  let bestDistance = -1;
  for (let y = 0; y < height; y += Math.max(1, Math.floor(height / 12))) {
    for (let x = 0; x < width; x += Math.max(1, Math.floor(width / 24))) {
      const candidate = pixel(x, y);
      const distance = Math.hypot(candidate[0] - background[0], candidate[1] - background[1], candidate[2] - background[2]);
      if (distance > bestDistance) {
        bestDistance = distance;
        foreground = candidate;
      }
    }
  }

  return {
    color: bestDistance < 28 ? '#202124' : hexFromRgb(...foreground),
    background: hexFromRgb(...background),
  };
}

async function renderPageCanvas(page: any, scale: number) {
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  const context = canvas.getContext('2d', { alpha: false });
  if (!context) throw new Error('Could not create the PDF page canvas.');
  context.fillStyle = '#fff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvasContext: context, viewport }).promise;
  return canvas;
}

function mergeNativeRuns(runs: NativeRun[]) {
  const sorted = [...runs].sort((a, b) => Math.abs(a.top - b.top) < Math.max(a.height, b.height) * 0.35 ? a.x - b.x : a.top - b.top);
  const output: NativeRun[] = [];

  for (const run of sorted) {
    const previous = output[output.length - 1];
    if (!previous) {
      output.push({ ...run });
      continue;
    }
    const sameLine = Math.abs((previous.top + previous.height / 2) - (run.top + run.height / 2)) <= Math.max(previous.height, run.height) * 0.34;
    const sameStyle = previous.fontName === run.fontName && Math.abs(previous.fontSize - run.fontSize) <= 0.6;
    const gap = run.x - (previous.x + previous.width);
    const closeEnough = gap >= -1 && gap <= Math.max(18, previous.fontSize * 1.65);
    if (sameLine && sameStyle && closeEnough) {
      const separator = gap > Math.max(1.5, previous.fontSize * 0.12) && !/\s$/.test(previous.text) && !/^\s/.test(run.text) ? ' ' : '';
      previous.text += separator + run.text;
      previous.width = Math.max(previous.width, run.x + run.width - previous.x);
      previous.height = Math.max(previous.height, run.height);
      previous.top = Math.min(previous.top, run.top);
    } else {
      output.push({ ...run });
    }
  }
  return output;
}

function groupOcrWords(words: Array<{ text: string; confidence: number; bbox: { x0: number; y0: number; x1: number; y1: number } }>) {
  const valid = words.filter((word) => word.text?.trim() && word.confidence >= 20 && word.bbox.x1 > word.bbox.x0 && word.bbox.y1 > word.bbox.y0);
  const heights = valid.map((word) => word.bbox.y1 - word.bbox.y0).sort((a, b) => a - b);
  const medianHeight = heights.length ? heights[Math.floor(heights.length / 2)] : 20;
  const lines: typeof valid[] = [];

  for (const word of [...valid].sort((a, b) => ((a.bbox.y0 + a.bbox.y1) / 2) - ((b.bbox.y0 + b.bbox.y1) / 2) || a.bbox.x0 - b.bbox.x0)) {
    const center = (word.bbox.y0 + word.bbox.y1) / 2;
    let line = lines.find((candidate) => {
      const average = candidate.reduce((total, item) => total + (item.bbox.y0 + item.bbox.y1) / 2, 0) / candidate.length;
      return Math.abs(average - center) <= Math.max(medianHeight * 0.55, (word.bbox.y1 - word.bbox.y0) * 0.55);
    });
    if (!line) {
      line = [];
      lines.push(line);
    }
    line.push(word);
  }

  return lines.map((line) => {
    line.sort((a, b) => a.bbox.x0 - b.bbox.x0);
    const x0 = Math.min(...line.map((word) => word.bbox.x0));
    const y0 = Math.min(...line.map((word) => word.bbox.y0));
    const x1 = Math.max(...line.map((word) => word.bbox.x1));
    const y1 = Math.max(...line.map((word) => word.bbox.y1));
    return {
      text: line.map((word) => word.text.trim()).join(' '),
      confidence: line.reduce((total, word) => total + word.confidence, 0) / line.length,
      bbox: { x0, y0, x1, y1 },
    };
  }).filter((line) => line.text.trim());
}

function boxChanged(box: EditableTextBox) {
  return box.text !== box.originalText
    || box.fontFamily !== box.originalFontFamily
    || Math.abs(box.fontSize - box.originalFontSize) > 0.05
    || box.fontWeight !== box.originalFontWeight
    || box.fontStyle !== box.originalFontStyle
    || box.color !== box.originalColor;
}

function standardFontKey(box: EditableTextBox) {
  const family = box.fontFamily.toLowerCase();
  const bold = box.fontWeight >= 700;
  const italic = box.fontStyle === 'italic';
  if (family.includes('times') || family.includes('georgia')) return `TimesRoman${bold ? 'Bold' : ''}${italic ? 'Italic' : ''}`;
  if (family.includes('courier')) return `Courier${bold ? 'Bold' : ''}${italic ? 'Oblique' : ''}`;
  return `Helvetica${bold ? 'Bold' : ''}${italic ? 'Oblique' : ''}`;
}

function standardFontName(key: string, standardFonts: Record<string, string>) {
  return standardFonts[key] || standardFonts.Helvetica;
}

function wrapText(text: string, font: any, size: number, maxWidth: number) {
  const output: string[] = [];
  for (const rawLine of text.replace(/\r/g, '').split('\n')) {
    const words = rawLine.split(/\s+/).filter(Boolean);
    if (!words.length) {
      output.push('');
      continue;
    }
    let line = words[0];
    for (let index = 1; index < words.length; index += 1) {
      const candidate = `${line} ${words[index]}`;
      if (font.widthOfTextAtSize(candidate, size) <= maxWidth || line.length === 0) line = candidate;
      else {
        output.push(line);
        line = words[index];
      }
    }
    output.push(line);
  }
  return output;
}

export function PdfSmartEditInterface({ toolId }: { toolId: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pdfRef = useRef<any>(null);
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PageModel[]>([]);
  const [pageNumber, setPageNumber] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('Choose a PDF. DOC321 will use embedded PDF text first and OCR scanned pages automatically.');
  const [progress, setProgress] = useState(0);
  const [language, setLanguage] = useState('eng');

  const page = pages.find((item) => item.pageNumber === pageNumber) || null;
  const selected = useMemo(() => page?.boxes.find((box) => box.id === selectedId) || null, [page, selectedId]);
  const changedCount = useMemo(() => pages.reduce((total, item) => total + item.boxes.filter(boxChanged).length, 0), [pages]);

  useEffect(() => () => {
    pdfRef.current?.destroy?.();
  }, []);

  async function drawPage(pageNo: number) {
    const pdf = pdfRef.current;
    const canvas = canvasRef.current;
    if (!pdf || !canvas) return;
    const pdfPage = await pdf.getPage(pageNo);
    const viewport = pdfPage.getViewport({ scale: DISPLAY_SCALE });
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) return;
    context.fillStyle = '#fff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    await pdfPage.render({ canvasContext: context, viewport }).promise;
  }

  useEffect(() => {
    if (file && page) void drawPage(pageNumber);
  }, [file, pageNumber, page]);

  function updateBox(id: string, patch: Partial<EditableTextBox>) {
    setPages((current) => current.map((item) => item.pageNumber !== pageNumber ? item : {
      ...item,
      boxes: item.boxes.map((box) => box.id === id ? { ...box, ...patch } : box),
    }));
  }

  function resetSelected() {
    if (!selected) return;
    updateBox(selected.id, {
      text: selected.originalText,
      fontFamily: selected.originalFontFamily,
      fontSize: selected.originalFontSize,
      fontWeight: selected.originalFontWeight,
      fontStyle: selected.originalFontStyle,
      color: selected.originalColor,
    });
  }

  async function analyzePdf(pdf: any) {
    const models: PageModel[] = [];
    let worker: any = null;
    try {
      const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
      for (let pageIndex = 1; pageIndex <= pdf.numPages; pageIndex += 1) {
        setStatus(`Analyzing page ${pageIndex} of ${pdf.numPages}...`);
        setProgress(Math.round(((pageIndex - 1) / pdf.numPages) * 100));
        const pdfPage = await pdf.getPage(pageIndex);
        const viewport = pdfPage.getViewport({ scale: 1 });
        const textContent = await pdfPage.getTextContent();
        const items = textContent.items.filter((item: any) => typeof item.str === 'string' && item.str.trim());
        const nativeCharacters = items.reduce((total: number, item: any) => total + item.str.trim().length, 0);

        if (nativeCharacters >= 12) {
          const analysisCanvas = await renderPageCanvas(pdfPage, ANALYSIS_SCALE);
          const runs = items.map((item: any) => {
            const transform = pdfjs.Util.transform(viewport.transform, item.transform);
            const fontSize = Math.max(4, Math.hypot(transform[2], transform[3]));
            const style = (textContent.styles as Record<string, any>)[item.fontName] || {};
            const meta = fontMeta(item.fontName, style.fontFamily);
            return {
              text: item.str,
              x: transform[4],
              top: transform[5] - fontSize,
              width: Math.max(item.width || 0, fontSize * 0.35),
              height: Math.max(fontSize * 1.08, 5),
              fontFamily: meta.family,
              fontSize,
              fontWeight: meta.weight,
              fontStyle: meta.style,
              fontName: item.fontName || '',
            } satisfies NativeRun;
          }).filter((run: NativeRun) => run.width > 0 && run.height > 0 && run.x < viewport.width && run.top < viewport.height);

          const merged = mergeNativeRuns(runs);
          const boxes = merged.map((run, index) => {
            const sampled = sampleColors(analysisCanvas, run, ANALYSIS_SCALE);
            return {
              id: `p${pageIndex}-native-${index}`,
              page: pageIndex,
              text: run.text,
              originalText: run.text,
              x: clamp(run.x, 0, viewport.width),
              top: clamp(run.top, 0, viewport.height),
              width: clamp(run.width, 8, Math.max(8, viewport.width - run.x)),
              height: clamp(run.height, 6, Math.max(6, viewport.height - run.top)),
              fontFamily: run.fontFamily,
              originalFontFamily: run.fontFamily,
              fontSize: run.fontSize,
              originalFontSize: run.fontSize,
              fontWeight: run.fontWeight,
              originalFontWeight: run.fontWeight,
              fontStyle: run.fontStyle,
              originalFontStyle: run.fontStyle,
              color: sampled.color,
              originalColor: sampled.color,
              background: sampled.background,
              source: 'native' as const,
              confidence: 100,
            };
          });
          analysisCanvas.width = 0;
          analysisCanvas.height = 0;
          models.push({ pageNumber: pageIndex, width: viewport.width, height: viewport.height, source: 'native', confidence: 100, boxes });
        } else {
          if (!worker) {
            const tesseract = await import('tesseract.js');
            worker = await tesseract.createWorker(language, 1, {
              logger: (message: { status?: string; progress?: number }) => {
                if (message.status?.includes('recognizing') && typeof message.progress === 'number') {
                  const withinPage = message.progress / Math.max(1, pdf.numPages);
                  setProgress(Math.min(99, Math.round((((pageIndex - 1) / pdf.numPages) + withinPage) * 100)));
                }
              },
            });
          }
          const ocrCanvas = await renderPageCanvas(pdfPage, OCR_SCALE);
          const recognized = await worker.recognize(ocrCanvas);
          const lines = groupOcrWords(recognized.data.words || []);
          const boxes = lines.map((line, index) => {
            const x = line.bbox.x0 / OCR_SCALE;
            const top = line.bbox.y0 / OCR_SCALE;
            const width = (line.bbox.x1 - line.bbox.x0) / OCR_SCALE;
            const height = (line.bbox.y1 - line.bbox.y0) / OCR_SCALE;
            const sampled = sampleColors(ocrCanvas, { x, top, width, height }, OCR_SCALE);
            const estimatedSize = clamp(height * 0.9, 6, 72);
            return {
              id: `p${pageIndex}-ocr-${index}`,
              page: pageIndex,
              text: line.text,
              originalText: line.text,
              x,
              top,
              width: Math.max(12, width),
              height: Math.max(7, height * 1.12),
              fontFamily: 'Arial',
              originalFontFamily: 'Arial',
              fontSize: estimatedSize,
              originalFontSize: estimatedSize,
              fontWeight: 400 as const,
              originalFontWeight: 400 as const,
              fontStyle: 'normal' as const,
              originalFontStyle: 'normal' as const,
              color: sampled.color,
              originalColor: sampled.color,
              background: sampled.background,
              source: 'ocr' as const,
              confidence: line.confidence,
            };
          });
          const confidence = typeof recognized.data.confidence === 'number' ? recognized.data.confidence : null;
          ocrCanvas.width = 0;
          ocrCanvas.height = 0;
          models.push({ pageNumber: pageIndex, width: viewport.width, height: viewport.height, source: 'ocr', confidence, boxes });
        }
      }
      setProgress(100);
      return models;
    } finally {
      await worker?.terminate?.().catch(() => undefined);
    }
  }

  async function chooseFile(files: FileList | null) {
    const next = files?.[0];
    if (!next) return;
    if (!(next.type === 'application/pdf' || /\.pdf$/i.test(next.name))) {
      setStatus('Please choose a PDF file.');
      return;
    }
    setBusy(true);
    setPages([]);
    setSelectedId(null);
    setPageNumber(1);
    setProgress(0);
    setStatus('Opening PDF...');
    try {
      pdfRef.current?.destroy?.();
      const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
      const pdf = await pdfjs.getDocument({ data: new Uint8Array(await next.arrayBuffer()) }).promise;
      pdfRef.current = pdf;
      setFile(next);
      const models = await analyzePdf(pdf);
      setPages(models);
      await drawPage(1);
      const nativePages = models.filter((item) => item.source === 'native').length;
      const ocrPages = models.length - nativePages;
      setStatus(`Ready. ${nativePages} page${nativePages === 1 ? '' : 's'} used embedded PDF text and ${ocrPages} page${ocrPages === 1 ? '' : 's'} used OCR. Click any recognized text to edit it.`);
      trackToolEvent('tool_start', { toolId, fileType: 'pdf', metadata: { pageCount: pdf.numPages, nativePages, ocrPages, mode: 'smart-edit' } });
    } catch (error) {
      setFile(null);
      setPages([]);
      setProgress(0);
      setStatus(error instanceof Error ? error.message : 'Could not analyze this PDF.');
    } finally {
      setBusy(false);
    }
  }

  async function exportPdf() {
    if (!file || busy) return;
    const changed = pages.flatMap((item) => item.boxes.filter(boxChanged));
    if (!changed.length) {
      setStatus('Click recognized text and make an edit before downloading.');
      return;
    }
    setBusy(true);
    setStatus(`Applying ${changed.length} text edit${changed.length === 1 ? '' : 's'} to a new PDF...`);
    try {
      const pdfLib = await import('pdf-lib');
      const document = await pdfLib.PDFDocument.load(new Uint8Array(await file.arrayBuffer()));
      const fontCache = new Map<string, any>();

      for (const box of changed) {
        const pdfPage = document.getPage(box.page - 1);
        const pageWidth = pdfPage.getWidth();
        const pageHeight = pdfPage.getHeight();
        const coverX = clamp(box.x - 1.5, 0, pageWidth);
        const coverTop = clamp(box.top - 1.5, 0, pageHeight);
        const coverWidth = clamp(box.width + 3, 1, Math.max(1, pageWidth - coverX));
        const coverHeight = clamp(Math.max(box.height + 3, box.fontSize * 1.25), 1, Math.max(1, pageHeight - coverTop));
        pdfPage.drawRectangle({
          x: coverX,
          y: pageHeight - coverTop - coverHeight,
          width: coverWidth,
          height: coverHeight,
          color: pdfLib.rgb(...Object.values(rgb01(box.background)) as [number, number, number]),
          borderWidth: 0,
        });

        if (!box.text.trim()) continue;
        const key = standardFontKey(box);
        let font = fontCache.get(key);
        if (!font) {
          font = await document.embedFont(standardFontName(key, pdfLib.StandardFonts as unknown as Record<string, string>));
          fontCache.set(key, font);
        }

        let size = clamp(box.fontSize, 4, 96);
        let lines = wrapText(box.text, font, size, Math.max(8, box.width));
        while (size > 5 && (lines.some((line) => font.widthOfTextAtSize(line, size) > box.width * 1.03) || lines.length * size * 1.22 > Math.max(box.height * 2.4, size * 1.3))) {
          size -= 0.5;
          lines = wrapText(box.text, font, size, Math.max(8, box.width));
        }

        const color = rgb01(box.color);
        const baseline = pageHeight - box.top - size;
        lines.forEach((line, index) => {
          if (!line) return;
          pdfPage.drawText(line, {
            x: box.x,
            y: baseline - index * size * 1.18,
            size,
            font,
            color: pdfLib.rgb(color.r, color.g, color.b),
          });
        });
      }

      const bytes = await document.save();
      const buffer = new ArrayBuffer(bytes.byteLength);
      new Uint8Array(buffer).set(bytes);
      const blob = new Blob([buffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `${file.name.replace(/\.pdf$/i, '') || 'document'}-edited.pdf`;
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 2000);
      setStatus(`Done. Downloaded an edited copy with ${changed.length} text edit${changed.length === 1 ? '' : 's'}.`);
      trackToolEvent('tool_success', { toolId, fileType: 'pdf', outputType: 'pdf', metadata: { mode: 'smart-edit', edits: changed.length } });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not create the edited PDF.';
      setStatus(message);
      trackToolEvent('tool_error', { toolId, fileType: 'pdf', metadata: { mode: 'smart-edit', message } });
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    pdfRef.current?.destroy?.();
    pdfRef.current = null;
    setFile(null);
    setPages([]);
    setPageNumber(1);
    setSelectedId(null);
    setProgress(0);
    setStatus('Choose a PDF. DOC321 will use embedded PDF text first and OCR scanned pages automatically.');
    if (inputRef.current) inputRef.current.value = '';
  }

  return <div className="smart-pdf-editor">
    <style>{`
      .smart-pdf-editor{display:grid;gap:14px}.spe-drop{border:2px dashed #d4d9e1;border-radius:18px;padding:24px;text-align:center;background:#f8fafd}.spe-drop svg{width:44px;height:44px;color:#0b57d0}.spe-drop h2{margin:8px 0 5px}.spe-drop p{margin:0 auto 14px;color:#5f6368;max-width:700px}.spe-btn{border:1px solid #d4d9e1;background:#fff;border-radius:10px;padding:9px 13px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:7px;color:#202124}.spe-btn.primary{background:#0b57d0;color:#fff;border-color:#0b57d0}.spe-btn.success{background:#137333;color:#fff;border-color:#137333}.spe-btn.active{background:#e8f0fe;border-color:#8ab4f8;color:#174ea6}.spe-btn:disabled{opacity:.45;cursor:not-allowed}.spe-file,.spe-topbar,.spe-stylebar,.spe-status{display:flex;align-items:center;gap:9px;flex-wrap:wrap;border:1px solid #e0e3e7;border-radius:13px;padding:11px 13px;background:#fff}.spe-file{justify-content:space-between}.spe-file small{display:block;color:#5f6368;margin-top:2px}.spe-topbar{justify-content:space-between}.spe-pagebar{display:flex;align-items:center;gap:8px}.spe-stylebar label{font-size:11px;font-weight:800;color:#5f6368;text-transform:uppercase;letter-spacing:.03em}.spe-select,.spe-number,.spe-color{height:36px;border:1px solid #cfd5dd;border-radius:8px;background:#fff;padding:0 9px}.spe-number{width:72px}.spe-color{width:42px;padding:3px}.spe-detail{margin-left:auto;color:#5f6368;font-size:12px}.spe-workspace{overflow:auto;max-height:76vh;background:#e9edf3;border:1px solid #dfe3e8;border-radius:14px;padding:20px}.spe-page{position:relative;margin:auto;background:#fff;box-shadow:0 5px 24px rgba(60,64,67,.22)}.spe-page canvas{position:absolute;inset:0;display:block}.spe-text-layer{position:absolute;inset:0}.spe-text-box{position:absolute;box-sizing:border-box;min-width:8px;padding:0 1px;border:1px solid transparent;outline:0;white-space:pre-wrap;overflow:visible;cursor:text;line-height:1.05;transform-origin:top left}.spe-text-box:hover{border-color:rgba(11,87,208,.4);background-image:linear-gradient(rgba(232,240,254,.25),rgba(232,240,254,.25))}.spe-text-box[data-selected='true']{border:1.5px solid #0b57d0;box-shadow:0 0 0 2px rgba(11,87,208,.12);z-index:3}.spe-badge{display:inline-flex;align-items:center;gap:5px;padding:5px 8px;border-radius:999px;background:#f1f3f4;font-size:11px;font-weight:700;color:#3c4043}.spe-status{font-size:13px;color:#5f6368}.spe-progress{height:7px;border-radius:999px;background:#e8eaed;overflow:hidden;flex:1;min-width:180px}.spe-progress>span{display:block;height:100%;background:#0b57d0;transition:width .2s}.spe-empty-note{padding:18px;text-align:center;color:#5f6368}.spe-warning{font-size:11px;color:#6b7280;margin-top:-4px}@media(max-width:720px){.spe-drop{padding:18px 12px}.spe-file,.spe-topbar{align-items:flex-start;flex-direction:column}.spe-stylebar{align-items:flex-end;overflow-x:auto;flex-wrap:nowrap}.spe-detail{margin-left:0;white-space:nowrap}.spe-workspace{padding:8px;max-height:70vh}.spe-pagebar{width:100%;justify-content:center}}
    `}</style>

    <input ref={inputRef} hidden type="file" accept="application/pdf,.pdf" onChange={(event) => void chooseFile(event.target.files)} />
    <div className="spe-drop">
      <ScanText />
      <h2>Smart OCR PDF Editor</h2>
      <p>DOC321 first reads the PDF's real text objects, font metadata, size and position. Scanned pages automatically fall back to high-resolution OCR, then every recognized text region becomes directly editable on top of the original page.</p>
      <div style={{display:'flex',justifyContent:'center',gap:8,flexWrap:'wrap'}}>
        <select className="spe-select" aria-label="OCR language" value={language} disabled={busy || Boolean(file)} onChange={(event)=>setLanguage(event.target.value)}>
          <option value="eng">English OCR</option><option value="fra">French OCR</option><option value="spa">Spanish OCR</option><option value="deu">German OCR</option><option value="hin">Hindi OCR</option>
        </select>
        <button className="spe-btn primary" type="button" disabled={busy} onClick={()=>inputRef.current?.click()}><FileUp size={16}/>{file?'Choose another PDF':'Choose PDF'}</button>
      </div>
      <div className="spe-warning">Embedded PDF text gives the highest fidelity. On scanned pages, font family and some styling are inferred from the pixels and remain editable so you can correct them before export.</div>
    </div>

    {busy && progress < 100 ? <div className="spe-status"><LoaderCircle size={16} className="spin"/><span>{status}</span><div className="spe-progress"><span style={{width:`${progress}%`}}/></div><strong>{progress}%</strong></div> : null}

    {file ? <>
      <div className="spe-file"><div><strong>{file.name}</strong><small>{formatBytes(file.size)} · {pages.length || '...'} pages · {changedCount} edited text region{changedCount === 1 ? '' : 's'}</small></div><div style={{display:'flex',gap:8,flexWrap:'wrap'}}><button className="spe-btn" type="button" onClick={reset} disabled={busy}><Trash2 size={15}/>Reset</button><button className="spe-btn success" type="button" onClick={()=>void exportPdf()} disabled={busy || changedCount===0}><Download size={15}/>Download edited PDF</button></div></div>

      {page ? <>
        <div className="spe-topbar">
          <div className="spe-pagebar"><button className="spe-btn" type="button" disabled={busy||pageNumber<=1} onClick={()=>{setSelectedId(null);setPageNumber((value)=>value-1)}}><ChevronLeft size={15}/>Previous</button><strong>Page {pageNumber} of {pages.length}</strong><button className="spe-btn" type="button" disabled={busy||pageNumber>=pages.length} onClick={()=>{setSelectedId(null);setPageNumber((value)=>value+1)}}>Next<ChevronRight size={15}/></button></div>
          <span className="spe-badge"><FileSearch size={14}/>{page.source==='native'?'PDF text metadata':'OCR'}{page.confidence!=null?` · ${Math.round(page.confidence)}%`:''}</span>
        </div>

        <div className="spe-stylebar">
          <label>Font</label><select className="spe-select" disabled={!selected} value={selected?.fontFamily || 'Arial'} onChange={(event)=>selected&&updateBox(selected.id,{fontFamily:event.target.value})}>{FONT_CHOICES.map((font)=><option key={font}>{font}</option>)}</select>
          <label>Size</label><input className="spe-number" disabled={!selected} type="number" min="4" max="96" step="0.5" value={selected?Number(selected.fontSize.toFixed(1)):12} onChange={(event)=>selected&&updateBox(selected.id,{fontSize:clamp(Number(event.target.value)||selected.fontSize,4,96)})}/>
          <button className={`spe-btn ${selected?.fontWeight===700?'active':''}`} type="button" disabled={!selected} onClick={()=>selected&&updateBox(selected.id,{fontWeight:selected.fontWeight===700?400:700})}><Bold size={15}/></button>
          <button className={`spe-btn ${selected?.fontStyle==='italic'?'active':''}`} type="button" disabled={!selected} onClick={()=>selected&&updateBox(selected.id,{fontStyle:selected.fontStyle==='italic'?'normal':'italic'})}><Italic size={15}/></button>
          <label>Color</label><input className="spe-color" disabled={!selected} type="color" value={selected?.color || '#202124'} onChange={(event)=>selected&&updateBox(selected.id,{color:event.target.value})}/>
          <button className="spe-btn" type="button" disabled={!selected || !boxChanged(selected)} onClick={resetSelected}><RotateCcw size={15}/>Reset text style</button>
          <span className="spe-detail">{selected ? `${selected.source==='native'?'PDF metadata':'OCR estimate'} · ${selected.confidence!=null?`${Math.round(selected.confidence)}% · `:''}${selected.width.toFixed(1)}×${selected.height.toFixed(1)} pt` : 'Click a text region to edit'}</span>
        </div>

        <div className="spe-workspace">
          <div className="spe-page" style={{width:page.width*DISPLAY_SCALE,height:page.height*DISPLAY_SCALE}}>
            <canvas ref={canvasRef}/>
            <div className="spe-text-layer">
              {page.boxes.map((box)=><div
                key={box.id}
                className="spe-text-box"
                data-selected={selectedId===box.id?'true':'false'}
                contentEditable
                suppressContentEditableWarning
                spellCheck
                onFocus={()=>setSelectedId(box.id)}
                onMouseDown={(event)=>{event.stopPropagation();setSelectedId(box.id)}}
                onInput={(event)=>updateBox(box.id,{text:event.currentTarget.innerText.replace(/\n$/,'')})}
                style={{
                  left:box.x*DISPLAY_SCALE,
                  top:box.top*DISPLAY_SCALE,
                  width:Math.max(12,box.width*DISPLAY_SCALE),
                  minHeight:Math.max(8,box.height*DISPLAY_SCALE),
                  fontFamily:`${box.fontFamily}, Arial, sans-serif`,
                  fontSize:box.fontSize*DISPLAY_SCALE,
                  fontWeight:box.fontWeight,
                  fontStyle:box.fontStyle,
                  color:box.color,
                  backgroundColor:box.background,
                }}
              >{box.text}</div>)}
            </div>
          </div>
        </div>
      </> : <div className="spe-empty-note">{busy ? 'Analyzing document...' : 'No editable text regions were found.'}</div>}
      <div className="spe-status"><span>{status}</span></div>
    </> : null}
  </div>;
}
