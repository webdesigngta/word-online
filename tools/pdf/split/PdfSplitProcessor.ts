import createQpdfModule, { type QpdfInstance } from '@neslinesli93/qpdf-wasm';
import type { DocumentProcessor, DocumentRegistry } from '../../../core/document-engine/registry/documentRegistry';
import type { File } from '../../../core/document-engine/types/File';
import { MAX_PDF_FILE_SIZE, validatePdfFile } from '../shared/pdfValidator';
import type { PdfFile } from '../shared/pdfTypes';
import type { PdfSplitOptions } from './PdfSplitOptions';
import type { PdfSplitError, PdfSplitOutput, PdfSplitResult } from './PdfSplitResult';

type QpdfFileSystem = QpdfInstance['FS'] & {
  writeFile(path: string, data: Uint8Array): void;
};

const INPUT_PATH = '/pdf-split-input.pdf';
const OUTPUT_DIRECTORY = '/pdf-split-outputs';

function isPdfFile(file: File): file is PdfFile {
  return typeof (file as Partial<PdfFile>).arrayBuffer === 'function';
}

function failure(
  originalSize: number,
  originalPageCount: number | null,
  code: string,
  message: string,
): PdfSplitResult {
  return {
    success: false,
    originalSize,
    originalPageCount,
    resultingFileCount: 0,
    totalOutputSize: 0,
    errors: [{ code, message }],
  };
}

function wasmUrl(options: PdfSplitOptions): string {
  return options.wasmUrl ?? new URL(
    '@neslinesli93/qpdf-wasm/dist/qpdf.wasm',
    import.meta.url,
  ).toString();
}

async function createQpdf(options: PdfSplitOptions): Promise<QpdfInstance> {
  return createQpdfModule({ locateFile: () => wasmUrl(options) });
}

function countPages(data: Uint8Array): number | null {
  const text = new TextDecoder().decode(data);
  const matches = text.match(/\/Type\s*\/Page\b/g);
  return matches?.length ?? null;
}

function invalidOptions(
  originalSize: number,
  originalPageCount: number,
  message: string,
): PdfSplitResult {
  return failure(originalSize, originalPageCount, 'INVALID_SPLIT_OPTIONS', message);
}

function parseRange(value: string): number[] | PdfSplitError {
  const match = /^(\d+)\s*-\s*(\d+)$/.exec(value.trim());
  if (!match) {
    return { code: 'INVALID_PAGE_RANGE', message: `Invalid page range "${value}"` };
  }

  const start = Number(match[1]);
  const end = Number(match[2]);
  if (start < 1 || end < 1 || start > end) {
    return { code: 'INVALID_PAGE_RANGE', message: `Invalid page range "${value}"` };
  }

  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

function selectPages(
  options: PdfSplitOptions,
  originalPageCount: number,
  originalSize: number,
): { pages: number[]; everyPage: boolean } | PdfSplitResult {
  const rangeValues = [
    ...(options.range === undefined ? [] : [options.range]),
    ...(options.ranges ?? []),
  ];
  const everyPage = options.everyPage === true || options.mode === 'every-page';
  const hasSelection = options.pages !== undefined || rangeValues.length > 0;
  if (everyPage && hasSelection) {
    return invalidOptions(originalSize, originalPageCount, 'every-page cannot be combined with page selections');
  }
  if (options.mode === 'pages' && rangeValues.length > 0) {
    return invalidOptions(originalSize, originalPageCount, 'The pages mode cannot include a range');
  }
  if (options.mode === 'range' && options.pages !== undefined) {
    return invalidOptions(originalSize, originalPageCount, 'The range mode cannot include page numbers');
  }
  if (everyPage) return { pages: Array.from({ length: originalPageCount }, (_, index) => index + 1), everyPage: true };
  if (!hasSelection) {
    return invalidOptions(originalSize, originalPageCount, 'A page selection is required');
  }

  const pages = [...(options.pages ?? [])];
  for (const range of rangeValues) {
    const parsed = parseRange(range);
    if (!Array.isArray(parsed)) return failure(originalSize, originalPageCount, parsed.code, parsed.message);
    pages.push(...parsed);
  }

  if (pages.length === 0) {
    return invalidOptions(originalSize, originalPageCount, 'The page selection cannot be empty');
  }
  if (pages.some((page) => !Number.isInteger(page) || page < 1 || page > originalPageCount)) {
    return invalidOptions(originalSize, originalPageCount, 'Page selections must be within the source PDF page count');
  }
  if (new Set(pages).size !== pages.length) {
    return invalidOptions(originalSize, originalPageCount, 'Duplicate page selections are not allowed');
  }

  return { pages, everyPage: false };
}

function outputName(sourceName: string, pages: readonly number[], everyPage: boolean): string {
  const baseName = sourceName.replace(/\.pdf$/i, '') || 'document';
  return everyPage
    ? `${baseName}-page-${pages[0]}.pdf`
    : `${baseName}-split.pdf`;
}

export class PdfSplitProcessor implements DocumentProcessor<PdfSplitResult> {
  type = 'pdf' as const;

  async process(
    file: File | readonly File[],
    rawOptions: Record<string, unknown> = {},
  ): Promise<PdfSplitResult> {
    if (!('size' in file)) {
      return failure(0, null, 'PDF_FILE_REQUIRED', 'A single PDF file is required');
    }
    if (!isPdfFile(file)) {
      return failure(file.size, null, 'PDF_FILE_UNREADABLE', 'The PDF file could not be read');
    }

    const options = rawOptions as PdfSplitOptions;
    try {
      const validation = validatePdfFile(file, MAX_PDF_FILE_SIZE);
      if (!validation.valid) {
        return failure(file.size, null, 'INVALID_PDF_FILE', validation.errors.join('. '));
      }

      const sourceData = new Uint8Array(await file.arrayBuffer());
      if (new TextDecoder().decode(sourceData.subarray(0, 5)) !== '%PDF-') {
        return failure(file.size, null, 'CORRUPT_PDF_FILE', 'The file is not a valid PDF');
      }

      const originalPageCount = countPages(sourceData);
      if (!originalPageCount) {
        return failure(file.size, originalPageCount, 'PDF_PAGE_COUNT_UNAVAILABLE', 'Could not determine the PDF page count');
      }

      const selection = selectPages(options, originalPageCount, file.size);
      if ('success' in selection) return selection;

      const outputGroups = selection.everyPage
        ? selection.pages.map((page) => [page])
        : [selection.pages];
      const qpdf = await createQpdf(options);
      const fileSystem = qpdf.FS as QpdfFileSystem;
      fileSystem.mkdir(OUTPUT_DIRECTORY);
      fileSystem.writeFile(INPUT_PATH, sourceData);

      const outputs: PdfSplitOutput[] = [];
      for (let index = 0; index < outputGroups.length; index += 1) {
        const pages = outputGroups[index];
        const outputPath = `${OUTPUT_DIRECTORY}/output-${index}.pdf`;
        const exitCode = qpdf.callMain([
          '--empty',
          '--pages',
          INPUT_PATH,
          ...pages.map(String),
          '--',
          outputPath,
        ]);
        if (exitCode !== 0) throw new Error(`QPDF exited with code ${exitCode}`);

        const data = qpdf.FS.readFile(outputPath);
        outputs.push({
          name: outputName(file.name, pages, selection.everyPage),
          data,
          size: data.byteLength,
          pageCount: countPages(data),
          pages,
        });
      }

      return {
        success: true,
        originalSize: file.size,
        originalPageCount,
        resultingFileCount: outputs.length,
        totalOutputSize: outputs.reduce((total, output) => total + output.size, 0),
        outputs,
        errors: [],
      };
    } catch (error) {
      return failure(
        file.size,
        null,
        'PDF_SPLIT_FAILED',
        error instanceof Error ? error.message : 'PDF split failed',
      );
    }
  }
}

export const pdfSplitProcessor = new PdfSplitProcessor();

export function registerPdfSplitProcessor(registry: DocumentRegistry): PdfSplitProcessor {
  if (registry.getAll(pdfSplitProcessor.type).includes(pdfSplitProcessor)) {
    return pdfSplitProcessor;
  }
  registry.register(pdfSplitProcessor);
  return pdfSplitProcessor;
}