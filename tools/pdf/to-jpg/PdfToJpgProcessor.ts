import type { DocumentProcessor, DocumentRegistry } from '../../../core/document-engine/registry/documentRegistry';
import type { File } from '../../../core/document-engine/types/File';
import { MAX_PDF_FILE_SIZE, validatePdfFile } from '../shared/pdfValidator';

type ReadablePdfFile = File & { arrayBuffer(): Promise<ArrayBuffer> };

export interface PdfToJpgOptions {
  pages?: readonly number[];
  quality?: number;
  scale?: number;
}

export interface PdfToJpgOutput {
  name: string;
  blob: Blob;
  size: number;
  pageNumber: number;
  width: number;
  height: number;
}

export interface PdfToJpgError {
  code: string;
  message: string;
}

export interface PdfToJpgResult {
  success: boolean;
  source: { name: string; size: number; type?: string; lastModified?: number };
  originalPageCount: number | null;
  resultingFileCount: number;
  totalOutputSize: number;
  outputs?: readonly PdfToJpgOutput[];
  errors: PdfToJpgError[];
}

function isReadablePdf(file: File): file is ReadablePdfFile {
  return typeof (file as Partial<ReadablePdfFile>).arrayBuffer === 'function';
}

function source(file: File) {
  return { name: file.name, size: file.size, type: file.type, lastModified: file.lastModified };
}

function failure(file: File, pageCount: number | null, code: string, message: string): PdfToJpgResult {
  return {
    success: false,
    source: source(file),
    originalPageCount: pageCount,
    resultingFileCount: 0,
    totalOutputSize: 0,
    errors: [{ code, message }],
  };
}

function outputName(sourceName: string, pageNumber: number, pageCount: number): string {
  const base = sourceName.replace(/\.pdf$/i, '').replace(/[\\/:*?"<>|]+/g, '').trim() || 'document';
  const width = String(pageCount).length;
  return `${base}-page-${String(pageNumber).padStart(width, '0')}.jpg`;
}

function canvasToJpeg(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) reject(new Error('The page could not be encoded as a JPG image'));
      else resolve(blob);
    }, 'image/jpeg', quality);
  });
}

function selectedPages(value: readonly number[] | undefined, pageCount: number): number[] | PdfToJpgError {
  const pages = value?.length ? [...value] : Array.from({ length: pageCount }, (_, index) => index + 1);
  if (pages.some((page) => !Number.isInteger(page) || page < 1 || page > pageCount)) {
    return { code: 'INVALID_PAGE_SELECTION', message: `Page numbers must be between 1 and ${pageCount}` };
  }
  if (new Set(pages).size !== pages.length) {
    return { code: 'DUPLICATE_PAGE_SELECTION', message: 'Duplicate page numbers are not allowed' };
  }
  return pages;
}

export class PdfToJpgProcessor implements DocumentProcessor<PdfToJpgResult> {
  type = 'pdf' as const;

  async process(file: File | readonly File[], rawOptions: Record<string, unknown> = {}): Promise<PdfToJpgResult> {
    if (!('size' in file)) {
      return failure({ name: '', size: 0 }, null, 'PDF_FILE_REQUIRED', 'A single PDF file is required');
    }
    if (!isReadablePdf(file)) {
      return failure(file, null, 'PDF_FILE_UNREADABLE', 'The PDF file could not be read');
    }

    const validation = validatePdfFile(file, MAX_PDF_FILE_SIZE);
    if (!validation.valid) return failure(file, null, 'INVALID_PDF_FILE', validation.errors.join('. '));

    const options = rawOptions as PdfToJpgOptions;
    const quality = options.quality ?? 0.9;
    const scale = options.scale ?? 2;
    if (!Number.isFinite(quality) || quality < 0.4 || quality > 1) {
      return failure(file, null, 'INVALID_JPG_QUALITY', 'JPG quality must be between 0.4 and 1');
    }
    if (!Number.isFinite(scale) || scale < 1 || scale > 4) {
      return failure(file, null, 'INVALID_RENDER_SCALE', 'Render scale must be between 1 and 4');
    }

    try {
      const data = new Uint8Array(await file.arrayBuffer());
      if (new TextDecoder().decode(data.subarray(0, 5)) !== '%PDF-') {
        return failure(file, null, 'CORRUPT_PDF_FILE', 'The file is not a valid PDF');
      }
      const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
      const pdf = await pdfjs.getDocument({ data }).promise;
      const selection = selectedPages(options.pages, pdf.numPages);
      if (!Array.isArray(selection)) return failure(file, pdf.numPages, selection.code, selection.message);

      const outputs: PdfToJpgOutput[] = [];
      for (const pageNumber of selection) {
        const page = await pdf.getPage(pageNumber);
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement('canvas');
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        const context = canvas.getContext('2d', { alpha: false });
        if (!context) throw new Error('Could not create an image rendering canvas');
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);
        await page.render({ canvasContext: context, viewport }).promise;
        const blob = await canvasToJpeg(canvas, quality);
        outputs.push({
          name: outputName(file.name, pageNumber, pdf.numPages),
          blob,
          size: blob.size,
          pageNumber,
          width: canvas.width,
          height: canvas.height,
        });
        canvas.width = 0;
        canvas.height = 0;
      }

      return {
        success: true,
        source: source(file),
        originalPageCount: pdf.numPages,
        resultingFileCount: outputs.length,
        totalOutputSize: outputs.reduce((total, output) => total + output.size, 0),
        outputs,
        errors: [],
      };
    } catch (error) {
      return failure(file, null, 'PDF_TO_JPG_FAILED', error instanceof Error ? error.message : 'PDF to JPG conversion failed');
    }
  }
}

export const pdfToJpgProcessor = new PdfToJpgProcessor();

export function registerPdfToJpgProcessor(registry: DocumentRegistry): PdfToJpgProcessor {
  if (!registry.getAll(pdfToJpgProcessor.type).includes(pdfToJpgProcessor)) registry.register(pdfToJpgProcessor);
  return pdfToJpgProcessor;
}
