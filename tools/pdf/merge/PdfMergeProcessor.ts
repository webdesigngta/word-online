import createQpdfModule, { type QpdfInstance } from '@neslinesli93/qpdf-wasm';
import type { DocumentProcessor, DocumentRegistry } from '../../../core/document-engine/registry/documentRegistry';
import type { File } from '../../../core/document-engine/types/File';
import { MAX_PDF_FILE_SIZE, validatePdfFile } from '../shared/pdfValidator';
import type { PdfFile } from '../shared/pdfTypes';
import type { PdfMergeOptions } from './PdfMergeOptions';
import type { PdfMergeResult } from './PdfMergeResult';

type QpdfFileSystem = QpdfInstance['FS'] & {
  writeFile(path: string, data: Uint8Array): void;
};

const INPUT_DIRECTORY = '/pdf-merge-inputs';
const OUTPUT_PATH = '/pdf-merge-output.pdf';

function isPdfFile(file: File): file is PdfFile {
  return typeof (file as Partial<PdfFile>).arrayBuffer === 'function';
}

function failure(
  sourceFileCount: number,
  totalInputSize: number,
  code: string,
  message: string,
): PdfMergeResult {
  return {
    success: false,
    totalInputSize,
    outputSize: 0,
    sourceFileCount,
    pageCount: null,
    errors: [{ code, message }],
  };
}

function wasmUrl(options: PdfMergeOptions): string {
  return options.wasmUrl ?? new URL(
    '@neslinesli93/qpdf-wasm/dist/qpdf.wasm',
    import.meta.url,
  ).toString();
}

async function createQpdf(options: PdfMergeOptions): Promise<QpdfInstance> {
  return createQpdfModule({ locateFile: () => wasmUrl(options) });
}

function countPages(data: Uint8Array): number | null {
  const text = new TextDecoder().decode(data);
  const matches = text.match(/\/Type\s*\/Page\b/g);
  return matches?.length ?? null;
}

export class PdfMergeProcessor implements DocumentProcessor<PdfMergeResult> {
  type = 'pdf' as const;

  async process(
    files: File | readonly File[],
    rawOptions: Record<string, unknown> = {},
  ): Promise<PdfMergeResult> {
    if ('size' in files) {
      return failure(1, files.size, 'PDF_FILES_REQUIRED', 'At least two PDF files are required');
    }

    const sourceFileCount = files.length;
    const totalInputSize = files.reduce((total, file) => total + file.size, 0);
    if (sourceFileCount < 2) {
      return failure(sourceFileCount, totalInputSize, 'PDF_FILES_REQUIRED', 'At least two PDF files are required');
    }

    try {
      const pdfFiles: Array<{ file: PdfFile; data: Uint8Array }> = [];
      for (const file of files) {
        if (!isPdfFile(file)) {
          return failure(sourceFileCount, totalInputSize, 'PDF_FILE_UNREADABLE', `Could not read ${file.name}`);
        }
        const validation = validatePdfFile(file, MAX_PDF_FILE_SIZE);
        if (!validation.valid) {
          return failure(sourceFileCount, totalInputSize, 'INVALID_PDF_FILE', `${file.name}: ${validation.errors.join('. ')}`);
        }
        const data = new Uint8Array(await file.arrayBuffer());
        if (new TextDecoder().decode(data.subarray(0, 5)) !== '%PDF-') {
          return failure(sourceFileCount, totalInputSize, 'CORRUPT_PDF_FILE', `${file.name} is not a valid PDF`);
        }
        pdfFiles.push({ file, data });
      }

      const qpdf = await createQpdf(rawOptions as PdfMergeOptions);
      const fileSystem = qpdf.FS as QpdfFileSystem;
      fileSystem.mkdir(INPUT_DIRECTORY);
      const inputPaths: string[] = [];
      for (let index = 0; index < pdfFiles.length; index += 1) {
        const path = `${INPUT_DIRECTORY}/input-${index}.pdf`;
        inputPaths.push(path);
        fileSystem.writeFile(path, pdfFiles[index].data);
      }

      const exitCode = qpdf.callMain(['--empty', '--pages', ...inputPaths, '--', OUTPUT_PATH]);
      if (exitCode !== 0) throw new Error(`QPDF exited with code ${exitCode}`);

      const data = qpdf.FS.readFile(OUTPUT_PATH);
      return {
        success: true,
        totalInputSize,
        outputSize: data.byteLength,
        sourceFileCount,
        pageCount: countPages(data),
        data,
        errors: [],
      };
    } catch (error) {
      return failure(
        sourceFileCount,
        totalInputSize,
        'PDF_MERGE_FAILED',
        error instanceof Error ? error.message : 'PDF merge failed',
      );
    }
  }
}

export const pdfMergeProcessor = new PdfMergeProcessor();

export function registerPdfMergeProcessor(registry: DocumentRegistry): PdfMergeProcessor {
  if (registry.getAll(pdfMergeProcessor.type).includes(pdfMergeProcessor)) {
    return pdfMergeProcessor;
  }
  registry.register(pdfMergeProcessor);
  return pdfMergeProcessor;
}