import type { DocumentProcessor, DocumentRegistry } from '../../../core/document-engine/registry/documentRegistry';
import type { File } from '../../../core/document-engine/types/File';
import { MAX_PDF_FILE_SIZE, validatePdfFile } from '../shared/pdfValidator';
import type { PdfFile } from '../shared/pdfTypes';
import type { PdfOcrOptions } from './PdfOcrOptions';
import type { PdfOcrError, PdfOcrOutput, PdfOcrResult, PdfOcrSource, PdfOcrWarning } from './PdfOcrResult';
import type { PdfOcrPageResult, PdfOcrWord } from './PdfOcrTypes';

const PDF_TYPE = 'application/pdf' as const;

function sourceMetadata(file: File): PdfOcrSource {
  return { name: file.name, size: file.size, type: file.type, lastModified: file.lastModified };
}

function failure(
  source: PdfOcrSource,
  originalPageCount: number | null,
  pages: readonly PdfOcrPageResult[],
  code: string,
  message: string,
  warnings: PdfOcrWarning[] = [],
): PdfOcrResult {
  return {
    success: false,
    source,
    originalPageCount,
    processedPageCount: pages.length,
    pages,
    text: pages.map((page) => page.text).filter(Boolean).join('\n\n'),
    confidence: confidenceAverage(pages),
    warnings,
    errors: [{ code, message }],
  };
}

function isPdfFile(file: File): file is PdfFile {
  return typeof (file as Partial<PdfFile>).arrayBuffer === 'function';
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function pageSelection(options: PdfOcrOptions, pageCount: number): number[] | PdfOcrError {
  if (options.allPages && options.pages !== undefined) {
    return { code: 'INVALID_PAGE_SELECTION', message: 'allPages cannot be combined with pages' };
  }
  const pages = options.allPages || options.pages === undefined
    ? Array.from({ length: pageCount }, (_, index) => index + 1)
    : [...options.pages];
  if (!pages.length) return { code: 'EMPTY_PAGE_SELECTION', message: 'At least one page must be selected' };
  if (pages.some((page) => !Number.isInteger(page) || page < 1 || page > pageCount)) {
    return { code: 'INVALID_PAGE_SELECTION', message: `Page numbers must be between 1 and ${pageCount}` };
  }
  if (new Set(pages).size !== pages.length) return { code: 'DUPLICATE_PAGE_SELECTION', message: 'Duplicate page numbers are not allowed' };
  return pages;
}

function confidenceAverage(pages: readonly PdfOcrPageResult[]): number | null {
  const values = pages.map((page) => page.confidence).filter((value): value is number => value !== null);
  return values.length ? values.reduce((total, value) => total + value, 0) / values.length : null;
}

function outputName(sourceName: string): string {
  const baseName = sourceName.replace(/\.pdf$/i, '').replace(/[\\/:*?"<>|]+/g, '').trim();
  return `${baseName || 'document'}-searchable.pdf`;
}

function imageDataUrl(canvas: HTMLCanvasElement): string {
  return canvas.toDataURL('image/png');
}

async function renderPage(pdfPage: any, scale: number): Promise<HTMLCanvasElement> {
  const viewport = pdfPage.getViewport({ scale });
  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Could not create a PDF rendering canvas');
  await pdfPage.render({ canvasContext: context, viewport }).promise;
  return canvas;
}

async function searchablePdf(
  sourceData: Uint8Array,
  pages: readonly PdfOcrPageResult[],
  scale: number,
): Promise<Uint8Array> {
  const pdfLib = await import('pdf-lib');
  const document = await pdfLib.PDFDocument.load(sourceData);
  const font = await document.embedFont(pdfLib.StandardFonts.Helvetica);
  for (const result of pages) {
    const page = document.getPage(result.pageNumber - 1);
    const pageHeight = page.getHeight();
    for (const word of result.words) {
      if (!word.text.trim()) continue;
      const size = Math.max(4, (word.bbox.y1 - word.bbox.y0) / scale);
      page.drawText(word.text, {
        x: word.bbox.x0 / scale,
        y: pageHeight - word.bbox.y1 / scale,
        size,
        font,
        color: pdfLib.rgb(1, 1, 1),
        opacity: 0,
      });
    }
  }
  return document.save();
}

export class PdfOcrProcessor implements DocumentProcessor<PdfOcrResult> {
  type = 'pdf' as const;

  async process(file: File | readonly File[], rawOptions: Record<string, unknown> = {}): Promise<PdfOcrResult> {
    if (!('size' in file)) return failure({ name: '', size: 0 }, null, [], 'PDF_FILE_REQUIRED', 'A single PDF file is required');
    const source = sourceMetadata(file);
    if (!isPdfFile(file)) return failure(source, null, [], 'PDF_FILE_UNREADABLE', 'The PDF file could not be read');

    let worker: { recognize(image: HTMLCanvasElement): Promise<{ data: { text: string; confidence: number; words: PdfOcrWord[] } }>; terminate(): Promise<void> } | undefined;
    try {
      const validation = validatePdfFile(file, MAX_PDF_FILE_SIZE);
      if (!validation.valid) return failure(source, null, [], 'INVALID_PDF_FILE', validation.errors.join('. '));
      const sourceData = new Uint8Array(await file.arrayBuffer());
      if (new TextDecoder().decode(sourceData.subarray(0, 5)) !== '%PDF-') return failure(source, null, [], 'CORRUPT_PDF_FILE', 'The file is not a valid PDF');

      const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
      const pdf = await pdfjs.getDocument({ data: sourceData }).promise;
      if (!pdf.numPages) return failure(source, 0, [], 'EMPTY_PDF', 'The PDF contains no pages');
      const options = rawOptions as PdfOcrOptions;
      const selected = pageSelection(options, pdf.numPages);
      if (!Array.isArray(selected)) return failure(source, pdf.numPages, [], selected.code, selected.message);
      const threshold = options.confidenceThreshold ?? 0;
      const scale = options.renderScale ?? 2;
      if (!isFiniteNumber(threshold) || threshold < 0 || threshold > 100) return failure(source, pdf.numPages, [], 'INVALID_CONFIDENCE_THRESHOLD', 'Confidence threshold must be between 0 and 100');
      if (!isFiniteNumber(scale) || scale < 1 || scale > 4) return failure(source, pdf.numPages, [], 'INVALID_RENDER_SCALE', 'Render scale must be between 1 and 4');

      const tesseract = await import('tesseract.js');
      worker = await tesseract.createWorker(options.language || 'eng', 1);
      const results: PdfOcrPageResult[] = [];
      for (const pageNumber of selected) {
        const canvas = await renderPage(await pdf.getPage(pageNumber), scale);
        const recognized = await worker.recognize(canvas);
        const words = recognized.data.words.filter((word) => word.confidence >= threshold && word.text.trim());
        results.push({ pageNumber, text: words.map((word) => word.text).join(' ').trim() || recognized.data.text.trim(), confidence: recognized.data.confidence, words });
        canvas.width = 0;
        canvas.height = 0;
      }

      const text = results.map((page) => page.text).filter(Boolean).join('\n\n');
      if (!text) return failure(source, pdf.numPages, results, 'OCR_EMPTY_RESULT', 'OCR did not recognize meaningful text');
      const warnings: PdfOcrWarning[] = [];
      let output: PdfOcrOutput | undefined;
      if (options.searchablePdf !== false) {
        try {
          const bytes = await searchablePdf(sourceData, results, scale);
          const outputBuffer = new ArrayBuffer(bytes.byteLength);
          new Uint8Array(outputBuffer).set(bytes);
          const blob = new Blob([outputBuffer], { type: PDF_TYPE });
          output = { name: outputName(file.name), blob, size: blob.size, type: PDF_TYPE, pageCount: pdf.numPages };
        } catch (error) {
          warnings.push({ code: 'SEARCHABLE_PDF_UNAVAILABLE', message: error instanceof Error ? error.message : 'Could not create a searchable PDF' });
        }
      }
      return { success: true, source, originalPageCount: pdf.numPages, processedPageCount: results.length, pages: results, text, confidence: confidenceAverage(results), output, warnings, errors: [] };
    } catch (error) {
      return failure(source, null, [], 'PDF_OCR_FAILED', error instanceof Error ? error.message : 'PDF OCR failed');
    } finally {
      await worker?.terminate().catch(() => undefined);
    }
  }
}

export const pdfOcrProcessor = new PdfOcrProcessor();

export function registerPdfOcrProcessor(registry: DocumentRegistry): PdfOcrProcessor {
  if (registry.getAll(pdfOcrProcessor.type).includes(pdfOcrProcessor)) return pdfOcrProcessor;
  registry.register(pdfOcrProcessor);
  return pdfOcrProcessor;
}