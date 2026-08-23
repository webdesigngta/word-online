import createQpdfModule, { type QpdfInstance } from '@neslinesli93/qpdf-wasm';
import type { DocumentProcessor } from '../../../core/document-engine/registry/documentRegistry';
import type { File } from '../../../core/document-engine/types/File';
import { MAX_PDF_FILE_SIZE, validatePdfFile } from '../shared/pdfValidator';
import type { PdfFile, PdfCompressionLevel } from '../shared/pdfTypes';
import type { PdfCompressionOptions } from './PdfCompressionOptions';
import type { PdfCompressionResult } from './PdfCompressionResult';

type QpdfFileSystem = QpdfInstance['FS'] & {
  writeFile(path: string, data: Uint8Array): void;
};

const INPUT_PATH = '/pdf-compressor-input.pdf';
const OUTPUT_PATH = '/pdf-compressor-output.pdf';

const compressionArguments: Record<PdfCompressionLevel, string[]> = {
  low: ['--object-streams=generate', '--compress-streams=y'],
  medium: ['--object-streams=generate', '--compress-streams=y', '--recompress-flate'],
  high: ['--object-streams=generate', '--compress-streams=y', '--recompress-flate', '--compression-level=9'],
};

function toPdfFile(file: File): file is PdfFile {
  return typeof (file as Partial<PdfFile>).arrayBuffer === 'function';
}

function failure(
  originalSize: number,
  code: string,
  message: string,
): PdfCompressionResult {
  return {
    success: false,
    originalSize,
    resultingSize: 0,
    bytesSaved: 0,
    compressionPercentage: null,
    errors: [{ code, message }],
  };
}

function wasmUrl(options: PdfCompressionOptions): string {
  return options.wasmUrl ?? new URL(
    '@neslinesli93/qpdf-wasm/dist/qpdf.wasm',
    import.meta.url,
  ).toString();
}

async function createQpdf(options: PdfCompressionOptions): Promise<QpdfInstance> {
  return createQpdfModule({ locateFile: () => wasmUrl(options) });
}

function runQpdf(qpdf: QpdfInstance, options: PdfCompressionOptions): Uint8Array {
  const exitCode = qpdf.callMain([
    INPUT_PATH,
    ...compressionArguments[options.level ?? 'medium'],
    OUTPUT_PATH,
  ]);
  if (exitCode !== 0) throw new Error(`QPDF exited with code ${exitCode}`);
  return qpdf.FS.readFile(OUTPUT_PATH);
}

export class PdfCompressorProcessor implements DocumentProcessor<PdfCompressionResult> {
  type = 'pdf' as const;

  async process(
    file: File | readonly File[],
    rawOptions: Record<string, unknown> = {},
  ): Promise<PdfCompressionResult> {
    if (!('size' in file)) {
      return failure(0, 'PDF_FILE_UNREADABLE', 'A single PDF file is required');
    }
    if (!toPdfFile(file)) {
      return failure(file.size, 'PDF_FILE_UNREADABLE', 'The PDF file could not be read');
    }

    const validation = validatePdfFile(file, MAX_PDF_FILE_SIZE);
    if (!validation.valid) {
      return failure(file.size, 'INVALID_PDF_FILE', validation.errors.join('. '));
    }

    const options = rawOptions as PdfCompressionOptions;
    try {
      const qpdf = await createQpdf(options);
      const fileSystem = qpdf.FS as QpdfFileSystem;
      fileSystem.writeFile(INPUT_PATH, new Uint8Array(await file.arrayBuffer()));
      const data = runQpdf(qpdf, options);
      const resultingSize = data.byteLength;
      if (resultingSize >= file.size) {
        return failure(file.size, 'NO_SIZE_REDUCTION', 'QPDF could not reduce this PDF size');
      }

      return {
        success: true,
        originalSize: file.size,
        resultingSize,
        bytesSaved: file.size - resultingSize,
        compressionPercentage: ((file.size - resultingSize) / file.size) * 100,
        data,
        errors: [],
      };
    } catch (error) {
      return failure(
        file.size,
        'PDF_COMPRESSION_FAILED',
        error instanceof Error ? error.message : 'PDF compression failed',
      );
    }
  }
}

export const pdfCompressorProcessor = new PdfCompressorProcessor();

export function registerPdfCompressorProcessor(
  registry: import('../../../core/document-engine/registry/documentRegistry').DocumentRegistry,
): PdfCompressorProcessor {
  if (registry.getAll(pdfCompressorProcessor.type).includes(pdfCompressorProcessor)) {
    return pdfCompressorProcessor;
  }
  registry.register(pdfCompressorProcessor);
  return pdfCompressorProcessor;
}