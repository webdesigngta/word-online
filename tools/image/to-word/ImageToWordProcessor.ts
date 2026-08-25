import type { DocumentProcessor, DocumentRegistry } from '../../../core/document-engine/registry/documentRegistry';
import type { File } from '../../../core/document-engine/types/File';
import { isReadableImageFile, validateImageFile } from '../shared/imageValidator';
import type { ImageFile, ImageFormat } from '../shared/imageTypes';

const DOCX_TYPE = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' as const;

export type ImageToWordExpectedFormat = 'image' | 'jpg' | 'png';

export interface ImageToWordOptions {
  expectedFormat?: ImageToWordExpectedFormat;
  language?: string;
  title?: string;
}

export interface ImageToWordOutput {
  name: string;
  blob: Blob;
  size: number;
  type: typeof DOCX_TYPE;
}

export interface ImageToWordWarning { code: string; message: string }
export interface ImageToWordError { code: string; message: string }

export interface ImageToWordResult {
  success: boolean;
  source: { name: string; size: number; type?: string; lastModified?: number };
  detectedFormat: ImageFormat | null;
  text: string;
  confidence: number | null;
  output?: ImageToWordOutput;
  warnings: ImageToWordWarning[];
  errors: ImageToWordError[];
}

function source(file: File) {
  return { name: file.name, size: file.size, type: file.type, lastModified: file.lastModified };
}

function failure(file: File, detectedFormat: ImageFormat | null, code: string, message: string): ImageToWordResult {
  return { success: false, source: source(file), detectedFormat, text: '', confidence: null, warnings: [], errors: [{ code, message }] };
}

function detectFormat(file: File): ImageFormat | null {
  const type = file.type?.toLowerCase() ?? '';
  if (type === 'image/png' || /\.png$/i.test(file.name)) return 'png';
  if (type === 'image/jpeg' || type === 'image/jpg' || /\.jpe?g$/i.test(file.name)) return 'jpg';
  return null;
}

function outputName(sourceName: string, title?: string) {
  const base = (title ?? sourceName.replace(/\.(?:png|jpe?g)$/i, '')).replace(/[\\/:*?"<>|]+/g, '').trim();
  return `${base || 'recognized-document'}.docx`;
}

async function renderImage(file: ImageFile): Promise<HTMLCanvasElement> {
  const objectUrl = URL.createObjectURL(file as unknown as Blob);
  try {
    const image = new Image();
    image.decoding = 'async';
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('The image could not be decoded'));
      image.src = objectUrl;
    });
    if (!image.naturalWidth || !image.naturalHeight) throw new Error('The image has invalid dimensions');
    const maxDimension = 6000;
    const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) throw new Error('Could not create an OCR canvas');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

async function buildDocx(text: string, title?: string): Promise<Blob> {
  const docx = await import('docx');
  const children: any[] = [];
  if (title?.trim()) {
    children.push(new docx.Paragraph({ text: title.trim(), heading: docx.HeadingLevel.TITLE }));
  }
  const normalized = text.replace(/\r\n?/g, '\n');
  normalized.split('\n').forEach((line) => {
    children.push(new docx.Paragraph({ children: [new docx.TextRun({ text: line })], spacing: { after: line ? 100 : 0 } }));
  });
  if (!children.length) children.push(new docx.Paragraph(''));
  const document = new docx.Document({ sections: [{ properties: {}, children }] });
  return docx.Packer.toBlob(document);
}

export class ImageToWordProcessor implements DocumentProcessor<ImageToWordResult> {
  type = 'image' as const;

  async process(file: File | readonly File[], rawOptions: Record<string, unknown> = {}): Promise<ImageToWordResult> {
    if (!('size' in file)) return failure({ name: '', size: 0 }, null, 'IMAGE_FILE_REQUIRED', 'A single image file is required');
    if (!isReadableImageFile(file)) return failure(file, null, 'IMAGE_FILE_UNREADABLE', 'The image file could not be read');

    const detectedFormat = detectFormat(file);
    if (!detectedFormat) return failure(file, null, 'UNSUPPORTED_IMAGE_FORMAT', 'Choose a JPG, JPEG, or PNG image');
    const options = rawOptions as ImageToWordOptions;
    const expected = options.expectedFormat ?? 'image';
    if (expected !== 'image' && expected !== detectedFormat) {
      return failure(file, detectedFormat, 'WRONG_IMAGE_FORMAT', `This tool accepts ${expected.toUpperCase()} images`);
    }
    const validation = validateImageFile(file, detectedFormat);
    if (!validation.valid) return failure(file, detectedFormat, 'INVALID_IMAGE_FILE', validation.errors.join('. '));

    let worker: { recognize(image: HTMLCanvasElement): Promise<{ data: { text: string; confidence: number } }>; terminate(): Promise<void> } | undefined;
    let canvas: HTMLCanvasElement | undefined;
    try {
      canvas = await renderImage(file);
      const tesseract = await import('tesseract.js');
      worker = await tesseract.createWorker(options.language || 'eng', 1) as unknown as typeof worker;
      if (!worker) throw new Error('OCR worker could not be created');
      const recognized = await worker.recognize(canvas);
      const text = recognized.data.text.replace(/[ \t]+\n/g, '\n').trim();
      if (!text) return failure(file, detectedFormat, 'OCR_EMPTY_RESULT', 'No readable text was recognized in this image');
      const blob = await buildDocx(text, options.title);
      const warnings: ImageToWordWarning[] = [];
      if (recognized.data.confidence < 60) warnings.push({ code: 'LOW_OCR_CONFIDENCE', message: 'OCR confidence is low. Review the Word document for recognition errors.' });
      return {
        success: true,
        source: source(file),
        detectedFormat,
        text,
        confidence: recognized.data.confidence,
        output: { name: outputName(file.name, options.title), blob, size: blob.size, type: DOCX_TYPE },
        warnings,
        errors: [],
      };
    } catch (error) {
      return failure(file, detectedFormat, 'IMAGE_TO_WORD_FAILED', error instanceof Error ? error.message : 'Image to Word conversion failed');
    } finally {
      if (canvas) { canvas.width = 0; canvas.height = 0; }
      await worker?.terminate().catch(() => undefined);
    }
  }
}

export const imageToWordProcessor = new ImageToWordProcessor();

export function registerImageToWordProcessor(registry: DocumentRegistry): ImageToWordProcessor {
  if (!registry.getAll(imageToWordProcessor.type).includes(imageToWordProcessor)) registry.register(imageToWordProcessor);
  return imageToWordProcessor;
}
