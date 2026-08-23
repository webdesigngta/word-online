import type { DocumentProcessor, DocumentRegistry } from '../../../core/document-engine/registry/documentRegistry';
import type { File } from '../../../core/document-engine/types/File';
import { MAX_PDF_FILE_SIZE, validatePdfFile } from '../shared/pdfValidator';
import type { PdfFile } from '../shared/pdfTypes';
import type { PdfToWordOptions } from './PdfToWordOptions';
import type {
  PdfToWordError,
  PdfToWordOutput,
  PdfToWordResult,
  PdfToWordSource,
  PdfToWordWarning,
} from './PdfToWordResult';

const DOCX_TYPE = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' as const;

interface ExtractedLine {
  text: string;
  fontSize: number;
}

interface ExtractedPage {
  lines: ExtractedLine[];
}

function isPdfFile(file: File): file is PdfFile {
  return typeof (file as Partial<PdfFile>).arrayBuffer === 'function';
}

function sourceMetadata(file: File): PdfToWordSource {
  return {
    name: file.name,
    size: file.size,
    type: file.type,
    lastModified: file.lastModified,
  };
}

function failure(
  source: PdfToWordSource,
  originalPageCount: number | null,
  code: string,
  message: string,
  warnings: PdfToWordWarning[] = [],
): PdfToWordResult {
  return {
    success: false,
    source,
    originalPageCount,
    outputSize: 0,
    warnings,
    errors: [{ code, message }],
  };
}

function warning(code: string, message: string): PdfToWordWarning {
  return { code, message };
}

function error(code: string, message: string): PdfToWordError {
  return { code, message };
}

function cleanText(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function appendLineText(current: string, next: string): string {
  if (!current) return next;
  if (/^[,.;:!?%)\]}]/.test(next) || /[([{\-/]$/.test(current)) return `${current}${next}`;
  return `${current} ${next}`;
}

function itemValue(item: unknown): { text: string; x: number; y: number; fontSize: number; hasEOL: boolean } | null {
  if (!item || typeof item !== 'object' || !('str' in item)) return null;
  const value = item as { str?: unknown; transform?: unknown; hasEOL?: unknown };
  if (typeof value.str !== 'string' || !value.str.trim()) return null;
  const transform = Array.isArray(value.transform) ? value.transform : [];
  const x = typeof transform[4] === 'number' ? transform[4] : 0;
  const y = typeof transform[5] === 'number' ? transform[5] : 0;
  const fontSize = typeof transform[0] === 'number' ? Math.abs(transform[0]) : 0;
  return {
    text: value.str,
    x,
    y,
    fontSize,
    hasEOL: value.hasEOL === true,
  };
}

function extractLines(items: unknown[]): ExtractedLine[] {
  const lines: Array<ExtractedLine & { y: number; lastX: number }> = [];
  for (const rawItem of items) {
    const item = itemValue(rawItem);
    if (!item) continue;
    const current = lines[lines.length - 1];
    const newLine = !current || Math.abs(current.y - item.y) > 2;
    if (newLine) {
      lines.push({ text: cleanText(item.text), fontSize: item.fontSize, y: item.y, lastX: item.x });
    } else {
      current.text = appendLineText(current.text, item.text);
      current.fontSize = Math.max(current.fontSize, item.fontSize);
      current.lastX = item.x;
    }
    if (item.hasEOL && lines[lines.length - 1] === current) {
      lines.push({ text: '', fontSize: 0, y: Number.NaN, lastX: 0 });
    }
  }
  return lines
    .filter((line) => line.text)
    .map(({ text, fontSize }) => ({ text, fontSize }));
}

function lineIsHeading(line: ExtractedLine): boolean {
  return line.fontSize >= 18 || (line.text.length <= 80 && /^[A-Z0-9][A-Z0-9\s:&-]+$/.test(line.text) && line.text.length > 3);
}

function outputName(sourceName: string, title?: string): string {
  const baseName = (title ?? sourceName.replace(/\.pdf$/i, '')).replace(/[\\/:*?"<>|]+/g, '').trim();
  return `${baseName || 'Untitled document'}.docx`;
}

async function extractPdf(
  data: Uint8Array,
): Promise<{ pages: ExtractedPage[]; pageCount: number }> {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const document = await pdfjs.getDocument({ data }).promise;
  const pages: ExtractedPage[] = [];
  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const textContent = await page.getTextContent();
    pages.push({ lines: extractLines(textContent.items) });
  }
  return { pages, pageCount: document.numPages };
}

async function buildDocx(pages: readonly ExtractedPage[], preservePageBreaks: boolean): Promise<Blob> {
  const docx = await import('docx');
  const children: any[] = [];
  pages.forEach((page, pageIndex) => {
    page.lines.forEach((line) => {
      const options: Record<string, unknown> = {
        children: [new docx.TextRun({ text: line.text })],
        spacing: { after: 120 },
      };
      if (lineIsHeading(line)) {
        options.heading = line.fontSize >= 18 ? docx.HeadingLevel.HEADING_1 : docx.HeadingLevel.HEADING_2;
      }
      children.push(new docx.Paragraph(options as any));
    });
    if (preservePageBreaks && pageIndex < pages.length - 1) {
      children.push(new docx.Paragraph({ pageBreakBefore: true }));
    }
  });
  if (!children.length) children.push(new docx.Paragraph(''));
  const document = new docx.Document({ sections: [{ properties: {}, children }] });
  return docx.Packer.toBlob(document);
}

export class PdfToWordProcessor implements DocumentProcessor<PdfToWordResult> {
  type = 'pdf' as const;

  async process(
    file: File | readonly File[],
    rawOptions: Record<string, unknown> = {},
  ): Promise<PdfToWordResult> {
    if (!('size' in file)) {
      return failure({ name: '', size: 0 }, null, 'PDF_FILE_REQUIRED', 'A single PDF file is required');
    }
    const source = sourceMetadata(file);
    if (!isPdfFile(file)) {
      return failure(source, null, 'PDF_FILE_UNREADABLE', 'The PDF file could not be read');
    }

    try {
      const validation = validatePdfFile(file, MAX_PDF_FILE_SIZE);
      if (!validation.valid) return failure(source, null, 'INVALID_PDF_FILE', validation.errors.join('. '));

      const data = new Uint8Array(await file.arrayBuffer());
      if (new TextDecoder().decode(data.subarray(0, 5)) !== '%PDF-') {
        return failure(source, null, 'CORRUPT_PDF_FILE', 'The file is not a valid PDF');
      }

      const extracted = await extractPdf(data);
      const meaningfulText = extracted.pages.flatMap((page) => page.lines).some((line) => /\S/.test(line.text));
      if (!meaningfulText) {
        return failure(
          source,
          extracted.pageCount,
          'OCR_REQUIRED',
          'This PDF does not contain extractable text. OCR is required for scanned PDFs.',
          [warning('OCR_REQUIRED', 'No meaningful text was found in the PDF; no DOCX was generated')],
        );
      }

      const options = rawOptions as PdfToWordOptions;
      const blob = await buildDocx(extracted.pages, options.preservePageBreaks !== false);
      const pageWarnings = extracted.pages
        .map((page, index) => page.lines.length ? null : warning('PAGE_TEXT_UNAVAILABLE', `Page ${index + 1} contains no extractable text`))
        .filter((item): item is PdfToWordWarning => item !== null);
      const output: PdfToWordOutput = {
        name: outputName(file.name, options.title),
        blob,
        size: blob.size,
        type: DOCX_TYPE,
      };
      return {
        success: true,
        source,
        originalPageCount: extracted.pageCount,
        outputSize: blob.size,
        output,
        warnings: pageWarnings,
        errors: [],
      };
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'PDF to Word conversion failed';
      return failure(source, null, 'PDF_TO_WORD_FAILED', message);
    }
  }
}

export const pdfToWordProcessor = new PdfToWordProcessor();

export function registerPdfToWordProcessor(registry: DocumentRegistry): PdfToWordProcessor {
  if (registry.getAll(pdfToWordProcessor.type).includes(pdfToWordProcessor)) return pdfToWordProcessor;
  registry.register(pdfToWordProcessor);
  return pdfToWordProcessor;
}