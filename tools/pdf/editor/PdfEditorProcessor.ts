import type { DocumentProcessor, DocumentRegistry } from '../../../core/document-engine/registry/documentRegistry';
import type { File } from '../../../core/document-engine/types/File';
import { MAX_PDF_FILE_SIZE, validatePdfFile } from '../shared/pdfValidator';
import type { PdfFile } from '../shared/pdfTypes';
import type {
  PdfEditorColor,
  PdfEditorImageData,
  PdfEditorOperation,
  PdfEditorOptions,
  PdfEditorPoint,
} from './PdfEditorOptions';
import type { PdfEditorOutput, PdfEditorResult, PdfEditorSource, PdfEditorWarning } from './PdfEditorResult';

const PDF_TYPE = 'application/pdf' as const;

function sourceMetadata(file: File): PdfEditorSource {
  return { name: file.name, size: file.size, type: file.type, lastModified: file.lastModified };
}

function failure(
  source: PdfEditorSource,
  originalPageCount: number | null,
  operationsApplied: number,
  code: string,
  message: string,
  warnings: PdfEditorWarning[] = [],
): PdfEditorResult {
  return {
    success: false,
    source,
    originalSize: source.size,
    resultingSize: 0,
    originalPageCount,
    pageCount: null,
    operationsApplied,
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

function colorValue(color: PdfEditorColor | undefined, rgb: (r: number, g: number, b: number) => unknown): unknown {
  const value = color ?? { r: 0, g: 0, b: 0 };
  if (![value.r, value.g, value.b].every((channel) => isFiniteNumber(channel) && channel >= 0 && channel <= 1)) {
    throw new Error('Color channels must be finite numbers between 0 and 1');
  }
  return rgb(value.r, value.g, value.b);
}

function opacityValue(value: number | undefined): number {
  const opacity = value ?? 1;
  if (!isFiniteNumber(opacity) || opacity < 0 || opacity > 1) throw new Error('Opacity must be between 0 and 1');
  return opacity;
}

function pageNumbers(pages: readonly number[], pageCount: number, allowEmpty = false): number[] {
  if (!allowEmpty && pages.length === 0) throw new Error('Page selection cannot be empty');
  if (pages.some((page) => !Number.isInteger(page) || page < 1 || page > pageCount)) {
    throw new Error(`Page numbers must be between 1 and ${pageCount}`);
  }
  if (new Set(pages).size !== pages.length) throw new Error('Duplicate page numbers are not allowed');
  return [...pages];
}

function outputName(sourceName: string): string {
  const baseName = sourceName.replace(/\.pdf$/i, '').replace(/[\\/:*?"<>|]+/g, '').trim();
  return `${baseName || 'document'}-edited.pdf`;
}

function imageBytes(data: PdfEditorImageData): Uint8Array {
  if (data instanceof Uint8Array) return data;
  if (data instanceof ArrayBuffer) return new Uint8Array(data);
  if (typeof data !== 'string') throw new Error('Image data must be a data URL, ArrayBuffer, or Uint8Array');
  const match = /^data:[^;]+;base64,(.+)$/i.exec(data);
  if (!match) throw new Error('Image data must be a base64 data URL');
  const binary = atob(match[1]);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function imageMime(data: PdfEditorImageData): 'png' | 'jpg' {
  if (typeof data === 'string' && /^data:image\/png[;,]/i.test(data)) return 'png';
  if (typeof data === 'string' && /^data:image\/(?:jpeg|jpg)[;,]/i.test(data)) return 'jpg';
  if (typeof data !== 'string') {
    const bytes = data instanceof ArrayBuffer ? new Uint8Array(data) : data;
    if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return 'png';
    if (bytes[0] === 0xff && bytes[1] === 0xd8) return 'jpg';
  }
  throw new Error('Image overlays require PNG or JPEG data');
}

async function reorderPages(pdfDocument: any, pages: readonly number[]): Promise<any> {
  const nextDocument = await pdfDocument.constructor.create();
  const copiedPages = await nextDocument.copyPages(pdfDocument, pages.map((page) => page - 1));
  copiedPages.forEach((page: any) => nextDocument.addPage(page));
  nextDocument.setTitle(pdfDocument.getTitle() ?? '');
  nextDocument.setAuthor(pdfDocument.getAuthor() ?? '');
  nextDocument.setSubject(pdfDocument.getSubject() ?? '');
  nextDocument.setKeywords(pdfDocument.getKeywords()?.split(',').map((keyword: string) => keyword.trim()).filter(Boolean) ?? []);
  return nextDocument;
}

async function applyOperation(pdfDocument: any, operation: PdfEditorOperation, pageCount: number): Promise<any> {
  const pdfLib = await import('pdf-lib');
  const pages = pdfDocument.getPages();
  switch (operation.type) {
    case 'rotate-pages': {
      const selected = pageNumbers(operation.pages, pageCount);
      if (![-270, -180, -90, 90, 180, 270].includes(operation.degrees)) throw new Error('Rotation must be 90, 180, 270, or a negative equivalent');
      selected.forEach((page) => pages[page - 1].setRotation(pdfLib.degrees(pages[page - 1].getRotation().angle + operation.degrees)));
      return pdfDocument;
    }
    case 'delete-pages': {
      const selected = pageNumbers(operation.pages, pageCount);
      if (selected.length >= pageCount) throw new Error('At least one page must remain after deletion');
      [...selected].sort((a, b) => b - a).forEach((page) => pdfDocument.removePage(page - 1));
      return pdfDocument;
    }
    case 'reorder-pages': {
      const selected = pageNumbers(operation.pages, pageCount);
      if (selected.length !== pageCount) throw new Error('Reorder selection must include every page exactly once');
      return reorderPages(pdfDocument, selected);
    }
    case 'extract-pages': {
      const selected = pageNumbers(operation.pages, pageCount);
      return reorderPages(pdfDocument, selected);
    }
    case 'add-text': {
      if (!Number.isInteger(operation.page) || operation.page < 1 || operation.page > pageCount) throw new Error('Text page number is invalid');
      if (!operation.text) throw new Error('Text overlay cannot be empty');
      if (![operation.x, operation.y].every(isFiniteNumber)) throw new Error('Text coordinates must be finite numbers');
      const fontSize = operation.fontSize ?? 12;
      if (!isFiniteNumber(fontSize) || fontSize <= 0) throw new Error('Text font size must be positive');
      pages[operation.page - 1].drawText(operation.text, { x: operation.x, y: operation.y, size: fontSize, font: await pdfDocument.embedFont(pdfLib.StandardFonts.Helvetica), color: colorValue(operation.color, pdfLib.rgb), opacity: opacityValue(operation.opacity) });
      return pdfDocument;
    }
    case 'add-shape': {
      if (!Number.isInteger(operation.page) || operation.page < 1 || operation.page > pageCount) throw new Error('Shape page number is invalid');
      if (![operation.x, operation.y].every(isFiniteNumber)) throw new Error('Shape coordinates must be finite numbers');
      const width = operation.width ?? 0;
      const height = operation.height ?? 0;
      if (!isFiniteNumber(width) || !isFiniteNumber(height) || width <= 0 || height <= 0) throw new Error('Shape dimensions must be positive');
      const page = pages[operation.page - 1];
      const options = { x: operation.x, y: operation.y, width, height, borderColor: colorValue(operation.color, pdfLib.rgb), borderWidth: operation.borderWidth ?? 1, color: operation.fillColor ? colorValue(operation.fillColor, pdfLib.rgb) : undefined, opacity: opacityValue(operation.opacity) };
      if (!isFiniteNumber(options.borderWidth) || options.borderWidth < 0) throw new Error('Shape border width must be non-negative');
      if (operation.shape === 'rectangle') page.drawRectangle(options);
      else if (operation.shape === 'ellipse') page.drawEllipse({ ...options, x: operation.x + width / 2, y: operation.y + height / 2, xScale: width / 2, yScale: height / 2 });
      else page.drawLine({ start: { x: operation.x, y: operation.y }, end: { x: operation.x + width, y: operation.y + height }, color: options.borderColor, thickness: options.borderWidth, opacity: options.opacity });
      return pdfDocument;
    }
    case 'add-image':
    case 'add-signature': {
      if (!Number.isInteger(operation.page) || operation.page < 1 || operation.page > pageCount) throw new Error('Image page number is invalid');
      if (![operation.x, operation.y, operation.width, operation.height].every(isFiniteNumber) || operation.width <= 0 || operation.height <= 0) throw new Error('Image coordinates and dimensions must be positive finite numbers');
      const image = imageMime(operation.data) === 'png' ? await pdfDocument.embedPng(imageBytes(operation.data)) : await pdfDocument.embedJpg(imageBytes(operation.data));
      pages[operation.page - 1].drawImage(image, { x: operation.x, y: operation.y, width: operation.width, height: operation.height, opacity: opacityValue(operation.opacity) });
      return pdfDocument;
    }
    case 'draw': {
      if (!Number.isInteger(operation.page) || operation.page < 1 || operation.page > pageCount) throw new Error('Drawing page number is invalid');
      if (operation.points.length < 2 || operation.points.some((point: PdfEditorPoint) => !isFiniteNumber(point.x) || !isFiniteNumber(point.y))) throw new Error('A drawing needs at least two valid points');
      const page = pages[operation.page - 1];
      for (let index = 1; index < operation.points.length; index += 1) page.drawLine({ start: operation.points[index - 1], end: operation.points[index], color: colorValue(operation.color, pdfLib.rgb), thickness: operation.width ?? 2, opacity: opacityValue(operation.opacity) });
      return pdfDocument;
    }
    case 'highlight': {
      if (!Number.isInteger(operation.page) || operation.page < 1 || operation.page > pageCount) throw new Error('Highlight page number is invalid');
      if (![operation.x, operation.y, operation.width, operation.height].every(isFiniteNumber) || operation.width <= 0 || operation.height <= 0) throw new Error('Highlight coordinates and dimensions must be positive finite numbers');
      pages[operation.page - 1].drawRectangle({ x: operation.x, y: operation.y, width: operation.width, height: operation.height, color: colorValue(operation.color ?? { r: 1, g: 1, b: 0 }, pdfLib.rgb), opacity: opacityValue(operation.opacity ?? 0.35), borderWidth: 0 });
      return pdfDocument;
    }
    case 'set-metadata':
      if (operation.title !== undefined) pdfDocument.setTitle(operation.title);
      if (operation.author !== undefined) pdfDocument.setAuthor(operation.author);
      if (operation.subject !== undefined) pdfDocument.setSubject(operation.subject);
      if (operation.keywords !== undefined) pdfDocument.setKeywords([...operation.keywords]);
      return pdfDocument;
  }
}

export class PdfEditorProcessor implements DocumentProcessor<PdfEditorResult> {
  type = 'pdf' as const;

  async process(file: File | readonly File[], rawOptions: Record<string, unknown> = {}): Promise<PdfEditorResult> {
    if (!('size' in file)) return failure({ name: '', size: 0 }, null, 0, 'PDF_FILE_REQUIRED', 'A single PDF file is required');
    const source = sourceMetadata(file);
    if (!isPdfFile(file)) return failure(source, null, 0, 'PDF_FILE_UNREADABLE', 'The PDF file could not be read');
    try {
      const validation = validatePdfFile(file, MAX_PDF_FILE_SIZE);
      if (!validation.valid) return failure(source, null, 0, 'INVALID_PDF_FILE', validation.errors.join('. '));
      const data = new Uint8Array(await file.arrayBuffer());
      if (new TextDecoder().decode(data.subarray(0, 5)) !== '%PDF-') return failure(source, null, 0, 'CORRUPT_PDF_FILE', 'The file is not a valid PDF');
      const pdfLib = await import('pdf-lib');
      let pdfDocument = await pdfLib.PDFDocument.load(data);
      const originalPageCount = pdfDocument.getPageCount();
      const options = rawOptions as PdfEditorOptions;
      const operations = options.operations ?? [];
      if (!operations.length) return failure(source, originalPageCount, 0, 'EMPTY_OPERATION_LIST', 'At least one PDF editing operation is required');
      let operationsApplied = 0;
      for (const operation of operations) {
        pdfDocument = await applyOperation(pdfDocument, operation, pdfDocument.getPageCount());
        operationsApplied += 1;
      }
      const bytes = await pdfDocument.save();
      const outputBuffer = new ArrayBuffer(bytes.byteLength);
      new Uint8Array(outputBuffer).set(bytes);
      const blob = new Blob([outputBuffer], { type: PDF_TYPE });
      const pageCount = pdfDocument.getPageCount();
      const output: PdfEditorOutput = { name: outputName(file.name), blob, size: blob.size, type: PDF_TYPE, pageCount };
      return { success: true, source, originalSize: file.size, resultingSize: blob.size, originalPageCount, pageCount, operationsApplied, output, warnings: [], errors: [] };
    } catch (caughtError) {
      return failure(source, null, 0, 'PDF_EDIT_FAILED', caughtError instanceof Error ? caughtError.message : 'PDF editing failed');
    }
  }
}

export const pdfEditorProcessor = new PdfEditorProcessor();

export function registerPdfEditorProcessor(registry: DocumentRegistry): PdfEditorProcessor {
  if (registry.getAll(pdfEditorProcessor.type).includes(pdfEditorProcessor)) return pdfEditorProcessor;
  registry.register(pdfEditorProcessor);
  return pdfEditorProcessor;
}