import type { DocumentProcessor, DocumentRegistry } from '../../../core/document-engine/registry/documentRegistry';
import type { File } from '../../../core/document-engine/types/File';
import { MAX_IMAGE_FILE_SIZE, isReadableImageFile } from '../shared/imageValidator';
import type { ImageToPdfOptions, ImageToPdfOutput } from '../shared/imageTypes';

export interface ScanToPdfResult {
  success: boolean;
  inputCount: number;
  originalSize: number;
  outputSize: number;
  pageCount: number;
  output?: ImageToPdfOutput;
  errors: Array<{ code: string; message: string }>;
}

const PAGE_SIZES = { a4: [595.28, 841.89], letter: [612, 792] } as const;

function kind(file: File): 'jpg' | 'png' | null {
  if (/^image\/png$/i.test(file.type ?? '') || /\.png$/i.test(file.name)) return 'png';
  if (/^image\/(?:jpeg|jpg)$/i.test(file.type ?? '') || /\.jpe?g$/i.test(file.name)) return 'jpg';
  return null;
}

function concreteBuffer(bytes: Uint8Array): ArrayBuffer {
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  return buffer;
}

export class ScanToPdfProcessor implements DocumentProcessor<ScanToPdfResult> {
  type = 'image' as const;

  async process(file: File | readonly File[], rawOptions: Record<string, unknown> = {}): Promise<ScanToPdfResult> {
    const files = 'size' in file ? [file] : [...file];
    const originalSize = files.reduce((sum, item) => sum + item.size, 0);
    const fail = (message: string): ScanToPdfResult => ({ success: false, inputCount: files.length, originalSize, outputSize: 0, pageCount: 0, errors: [{ code: 'SCAN_TO_PDF_FAILED', message }] });
    if (!files.length) return fail('Choose at least one JPG or PNG scan');
    for (const item of files) {
      if (!isReadableImageFile(item)) return fail(`Could not read ${item.name}`);
      if (!kind(item)) return fail(`${item.name} must be a JPG, JPEG, or PNG image`);
      if (item.size <= 0 || item.size > MAX_IMAGE_FILE_SIZE) return fail(`${item.name} must be between 1 byte and ${MAX_IMAGE_FILE_SIZE} bytes`);
    }

    const options = rawOptions as ImageToPdfOptions;
    try {
      const pdfLib = await import('pdf-lib');
      const document = await pdfLib.PDFDocument.create();
      const format = options.pageFormat ?? 'a4';
      const orientation = options.orientation ?? 'portrait';
      const margin = options.margin ?? 18;
      if (!Number.isFinite(margin) || margin < 0) throw new Error('Margin must be a non-negative number');
      const base = PAGE_SIZES[format];
      const pageSize = orientation === 'landscape' ? [base[1], base[0]] : base;
      const availableWidth = pageSize[0] - margin * 2;
      const availableHeight = pageSize[1] - margin * 2;
      if (availableWidth <= 0 || availableHeight <= 0) throw new Error('Margin is too large for the selected page size');

      for (const item of files) {
        const bytes = new Uint8Array(await (item as File & { arrayBuffer(): Promise<ArrayBuffer> }).arrayBuffer());
        const embedded = kind(item) === 'png' ? await document.embedPng(bytes) : await document.embedJpg(bytes);
        const page = document.addPage(pageSize as [number, number]);
        page.drawRectangle({ x: 0, y: 0, width: pageSize[0], height: pageSize[1], color: pdfLib.rgb(1, 1, 1) });
        const imageRatio = embedded.width / embedded.height;
        const pageRatio = availableWidth / availableHeight;
        const scale = options.fit === 'cover'
          ? (imageRatio > pageRatio ? availableHeight / embedded.height : availableWidth / embedded.width)
          : (imageRatio > pageRatio ? availableWidth / embedded.width : availableHeight / embedded.height);
        const width = embedded.width * scale;
        const height = embedded.height * scale;
        page.drawImage(embedded, { x: (pageSize[0] - width) / 2, y: (pageSize[1] - height) / 2, width, height });
      }

      const bytes = await document.save();
      const blob = new Blob([concreteBuffer(bytes)], { type: 'application/pdf' });
      const output: ImageToPdfOutput = { name: 'scanned-document.pdf', blob, size: blob.size, pageCount: files.length };
      return { success: true, inputCount: files.length, originalSize, outputSize: blob.size, pageCount: files.length, output, errors: [] };
    } catch (error) {
      return fail(error instanceof Error ? error.message : 'Scan to PDF conversion failed');
    }
  }
}

export const scanToPdfProcessor = new ScanToPdfProcessor();
export function registerScanToPdfProcessor(registry: DocumentRegistry): ScanToPdfProcessor {
  if (!registry.getAll(scanToPdfProcessor.type).includes(scanToPdfProcessor)) registry.register(scanToPdfProcessor);
  return scanToPdfProcessor;
}
