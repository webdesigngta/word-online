import type { File } from '../../../core/document-engine/types/File';

export interface ScanToPdfOptions {
  pageFormat?: 'a4' | 'letter';
  marginMm?: number;
}

export interface ScanToPdfResult {
  success: boolean;
  output?: { name: string; blob: Blob; size: number; pageCount: number };
  inputCount: number;
  errors: Array<{ code: string; message: string }>;
}

const PAGE_SIZES = {
  a4: [595.28, 841.89],
  letter: [612, 792],
} as const;

function isSupportedImage(file: File) {
  return /^image\/(?:jpeg|png)$/i.test(file.type ?? '') || /\.(?:jpe?g|png)$/i.test(file.name);
}

function isReadable(file: File): file is File & { arrayBuffer(): Promise<ArrayBuffer> } {
  return typeof (file as File & { arrayBuffer?: unknown }).arrayBuffer === 'function';
}

function outputName(files: readonly File[]) {
  if (files.length === 1) {
    const base = files[0].name.replace(/\.(?:jpe?g|png)$/i, '').replace(/[\\/:*?"<>|]+/g, '').trim();
    return `${base || 'scan'}.pdf`;
  }
  return 'scanned-document.pdf';
}

function concreteBuffer(bytes: Uint8Array): ArrayBuffer {
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  return buffer;
}

export class ScanToPdfProcessor {
  async process(file: File | readonly File[], rawOptions: Record<string, unknown> = {}): Promise<ScanToPdfResult> {
    const files = 'size' in file ? [file] : [...file];
    if (!files.length) return { success: false, inputCount: 0, errors: [{ code: 'IMAGE_REQUIRED', message: 'Choose at least one JPG or PNG scan' }] };
    if (files.some((item) => !isSupportedImage(item) || !isReadable(item))) {
      return { success: false, inputCount: files.length, errors: [{ code: 'UNSUPPORTED_IMAGE', message: 'Scan to PDF supports readable JPG, JPEG, and PNG images' }] };
    }

    const options = rawOptions as unknown as ScanToPdfOptions;
    const pageFormat = options.pageFormat ?? 'a4';
    const marginMm = Math.min(30, Math.max(0, Number(options.marginMm ?? 6)));
    const margin = marginMm * 72 / 25.4;

    try {
      const pdfLib = await import('pdf-lib');
      const pdf = await pdfLib.PDFDocument.create();
      for (const source of files) {
        const bytes = new Uint8Array(await source.arrayBuffer());
        const png = /^image\/png$/i.test(source.type ?? '') || /\.png$/i.test(source.name);
        const image = png ? await pdf.embedPng(bytes) : await pdf.embedJpg(bytes);
        const base = PAGE_SIZES[pageFormat];
        const landscape = image.width > image.height;
        const pageSize = landscape ? [base[1], base[0]] as const : base;
        const page = pdf.addPage(pageSize as [number, number]);
        const availableWidth = pageSize[0] - margin * 2;
        const availableHeight = pageSize[1] - margin * 2;
        const scale = Math.min(availableWidth / image.width, availableHeight / image.height);
        const width = image.width * scale;
        const height = image.height * scale;
        page.drawImage(image, {
          x: (pageSize[0] - width) / 2,
          y: (pageSize[1] - height) / 2,
          width,
          height,
        });
      }
      const bytes = await pdf.save();
      const blob = new Blob([concreteBuffer(bytes)], { type: 'application/pdf' });
      return {
        success: true,
        inputCount: files.length,
        output: { name: outputName(files), blob, size: blob.size, pageCount: files.length },
        errors: [],
      };
    } catch (error) {
      return { success: false, inputCount: files.length, errors: [{ code: 'SCAN_TO_PDF_FAILED', message: error instanceof Error ? error.message : 'Scan to PDF conversion failed' }] };
    }
  }
}

export const scanToPdfProcessor = new ScanToPdfProcessor();
