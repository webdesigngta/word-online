import createQpdfModule, { type QpdfInstance } from '@neslinesli93/qpdf-wasm';
import type { DocumentProcessor } from '../../../core/document-engine/registry/documentRegistry';
import type { File } from '../../../core/document-engine/types/File';
import { MAX_PDF_FILE_SIZE, validatePdfFile } from '../shared/pdfValidator';

type QpdfFileSystem = QpdfInstance['FS'] & {
  writeFile(path: string, data: Uint8Array): void;
};

export type PdfSecurityMode = 'protect' | 'unlock' | 'repair';

export interface PdfSecurityOptions {
  mode: PdfSecurityMode;
  password?: string;
  wasmUrl?: string;
}

export interface PdfSecurityError {
  code: string;
  message: string;
}

export interface PdfSecurityResult {
  success: boolean;
  mode: PdfSecurityMode;
  originalSize: number;
  resultingSize: number;
  data?: Uint8Array;
  warnings: string[];
  errors: PdfSecurityError[];
}

const INPUT_PATH = '/pdf-security-input.pdf';
const OUTPUT_PATH = '/pdf-security-output.pdf';

function canRead(file: File): file is File & { arrayBuffer(): Promise<ArrayBuffer> } {
  return typeof (file as File & { arrayBuffer?: unknown }).arrayBuffer === 'function';
}

function failure(mode: PdfSecurityMode, originalSize: number, code: string, message: string): PdfSecurityResult {
  return { success: false, mode, originalSize, resultingSize: 0, warnings: [], errors: [{ code, message }] };
}

function wasmUrl(options: PdfSecurityOptions): string {
  return options.wasmUrl ?? new URL('@neslinesli93/qpdf-wasm/dist/qpdf.wasm', import.meta.url).toString();
}

async function createQpdf(options: PdfSecurityOptions): Promise<QpdfInstance> {
  return createQpdfModule({ locateFile: () => wasmUrl(options) });
}

function randomOwnerPassword(): string {
  const bytes = new Uint8Array(24);
  if (globalThis.crypto?.getRandomValues) globalThis.crypto.getRandomValues(bytes);
  else for (let index = 0; index < bytes.length; index += 1) bytes[index] = Math.floor(Math.random() * 256);
  return Array.from(bytes, (value) => value.toString(16).padStart(2, '0')).join('');
}

function argumentsFor(options: PdfSecurityOptions): string[] {
  const password = options.password ?? '';
  if (options.mode === 'protect') {
    if (!password) throw new Error('Enter a password before protecting the PDF.');
    return [
      '--encrypt',
      password,
      randomOwnerPassword(),
      '256',
      '--',
      INPUT_PATH,
      OUTPUT_PATH,
    ];
  }
  if (options.mode === 'unlock') {
    if (!password) throw new Error('Enter the PDF password before unlocking it.');
    return [`--password=${password}`, '--decrypt', INPUT_PATH, OUTPUT_PATH];
  }
  return [INPUT_PATH, '--object-streams=generate', '--compress-streams=y', OUTPUT_PATH];
}

export class PdfSecurityProcessor implements DocumentProcessor<PdfSecurityResult> {
  type = 'pdf' as const;

  async process(file: File | readonly File[], rawOptions: Record<string, unknown> = {}): Promise<PdfSecurityResult> {
    const options = rawOptions as unknown as PdfSecurityOptions;
    const mode = options.mode ?? 'repair';
    if (!('size' in file)) return failure(mode, 0, 'PDF_FILE_REQUIRED', 'Choose one PDF file.');
    if (!canRead(file)) return failure(mode, file.size, 'PDF_FILE_UNREADABLE', 'The PDF file could not be read.');

    const validation = validatePdfFile(file, MAX_PDF_FILE_SIZE);
    if (!validation.valid) return failure(mode, file.size, 'INVALID_PDF_FILE', validation.errors.join('. '));

    try {
      const qpdf = await createQpdf(options);
      const fs = qpdf.FS as QpdfFileSystem;
      fs.writeFile(INPUT_PATH, new Uint8Array(await file.arrayBuffer()));
      const exitCode = qpdf.callMain(argumentsFor(options));
      if (exitCode !== 0 && exitCode !== 3) throw new Error(`QPDF exited with code ${exitCode}.`);
      const data = qpdf.FS.readFile(OUTPUT_PATH);
      if (!data?.byteLength) throw new Error('QPDF did not create an output PDF.');
      return {
        success: true,
        mode,
        originalSize: file.size,
        resultingSize: data.byteLength,
        data,
        warnings: exitCode === 3 ? ['QPDF recovered the file with warnings. Review the output before relying on it.'] : [],
        errors: [],
      };
    } catch (error) {
      const fallback = mode === 'unlock'
        ? 'Could not unlock this PDF. Check the password and try again.'
        : mode === 'protect'
          ? 'Could not protect this PDF.'
          : 'QPDF could not repair this PDF.';
      return failure(mode, file.size, 'PDF_SECURITY_OPERATION_FAILED', error instanceof Error ? error.message : fallback);
    }
  }
}

export const pdfSecurityProcessor = new PdfSecurityProcessor();
