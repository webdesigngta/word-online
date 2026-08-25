import type { File } from '../../../core/document-engine/types/File';
import { wordToPdfProcessor } from '../to-pdf/WordToPdfProcessor';

export type WordImageFormat = 'jpg' | 'png';

export interface WordToImageOptions {
  format: WordImageFormat;
  quality?: number;
  scale?: number;
}

export interface WordToImageOutput {
  name: string;
  blob: Blob;
  size: number;
  pageNumber: number;
  type: 'image/jpeg' | 'image/png';
}

export interface WordToImageResult {
  success: boolean;
  outputs?: WordToImageOutput[];
  pageCount: number;
  warnings: string[];
  errors: Array<{ code: string; message: string }>;
}

function failure(code: string, message: string, warnings: string[] = []): WordToImageResult {
  return { success: false, pageCount: 0, warnings, errors: [{ code, message }] };
}

function baseName(name: string) {
  return name.replace(/\.docx$/i, '').replace(/[\\/:*?"<>|]+/g, '').trim() || 'document';
}

function canvasBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Could not encode image output')), type, quality);
  });
}

export class WordToImageProcessor {
  async process(file: File | readonly File[], rawOptions: Record<string, unknown> = {}): Promise<WordToImageResult> {
    if (!('size' in file)) return failure('DOCX_FILE_REQUIRED', 'A single DOCX file is required');
    const options = rawOptions as unknown as WordToImageOptions;
    const format = options.format;
    if (format !== 'jpg' && format !== 'png') return failure('INVALID_IMAGE_FORMAT', 'Choose JPG or PNG output');
    const scale = Math.min(3, Math.max(1, Number(options.scale ?? 2)));
    const quality = Math.min(1, Math.max(0.5, Number(options.quality ?? 0.92)));

    try {
      const pdfResult = await wordToPdfProcessor.process(file, { pageFormat: 'a4', margin: 12 });
      if (!pdfResult.success || !pdfResult.output) {
        return failure('WORD_RENDER_FAILED', pdfResult.errors[0]?.message || 'The Word document could not be rendered', pdfResult.warnings.map((item) => item.message));
      }

      const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
      const pdf = await pdfjs.getDocument({ data: new Uint8Array(await pdfResult.output.blob.arrayBuffer()) }).promise;
      const outputs: WordToImageOutput[] = [];
      const mime = format === 'jpg' ? 'image/jpeg' as const : 'image/png' as const;
      const extension = format === 'jpg' ? 'jpg' : 'png';

      try {
        for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
          const page = await pdf.getPage(pageNumber);
          const viewport = page.getViewport({ scale });
          const canvas = document.createElement('canvas');
          canvas.width = Math.ceil(viewport.width);
          canvas.height = Math.ceil(viewport.height);
          const context = canvas.getContext('2d', { alpha: false });
          if (!context) throw new Error('Could not create an image canvas');
          context.fillStyle = '#ffffff';
          context.fillRect(0, 0, canvas.width, canvas.height);
          await page.render({ canvas, canvasContext: context, viewport }).promise;
          const blob = await canvasBlob(canvas, mime, format === 'jpg' ? quality : undefined);
          outputs.push({ name: `${baseName(file.name)}-page-${pageNumber}.${extension}`, blob, size: blob.size, pageNumber, type: mime });
          canvas.width = 0;
          canvas.height = 0;
        }
      } finally {
        await (pdf as unknown as { destroy?: () => Promise<void> }).destroy?.();
      }

      return { success: true, outputs, pageCount: outputs.length, warnings: pdfResult.warnings.map((item) => item.message), errors: [] };
    } catch (error) {
      return failure('WORD_TO_IMAGE_FAILED', error instanceof Error ? error.message : 'Word to image conversion failed');
    }
  }
}

export const wordToImageProcessor = new WordToImageProcessor();
