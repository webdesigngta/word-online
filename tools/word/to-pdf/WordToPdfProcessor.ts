import type { DocumentProcessor, DocumentRegistry } from '../../../core/document-engine/registry/documentRegistry';
import type { File } from '../../../core/document-engine/types/File';
import { MAX_WORD_FILE_BYTES } from '../import/openDocument';
import type { WordToPdfOptions } from './WordToPdfOptions';
import type {
  WordToPdfOutput,
  WordToPdfResult,
  WordToPdfSource,
  WordToPdfWarning,
} from './WordToPdfResult';

const DOCX_TYPE = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

function sourceMetadata(file: File): WordToPdfSource {
  return { name: file.name, size: file.size, type: file.type, lastModified: file.lastModified };
}

function failure(source: WordToPdfSource, code: string, message: string, warnings: WordToPdfWarning[] = []): WordToPdfResult {
  return { success: false, source, outputSize: 0, pageCount: null, warnings, errors: [{ code, message }] };
}

function warning(code: string, message: string): WordToPdfWarning {
  return { code, message };
}

function isDocxFile(file: File): boolean {
  return file.type === DOCX_TYPE || /\.docx$/i.test(file.name);
}

function isReadableFile(file: File): file is File & { arrayBuffer(): Promise<ArrayBuffer> } {
  return typeof (file as Partial<File & { arrayBuffer(): Promise<ArrayBuffer> }>).arrayBuffer === 'function';
}

function outputName(sourceName: string, filename?: string): string {
  const baseName = (filename ?? sourceName.replace(/\.docx$/i, '')).replace(/\.pdf$/i, '');
  const cleanName = baseName.replace(/[\\/:*?"<>|]+/g, '').trim();
  return `${cleanName || 'Untitled document'}.pdf`;
}

function sanitizeHtml(html: string): string {
  const template = document.createElement('template');
  template.innerHTML = html;
  template.content
    .querySelectorAll('script,style,iframe,object,embed,form,input,button,textarea,select,meta,link,base')
    .forEach((node) => node.remove());
  template.content.querySelectorAll<HTMLElement>('*').forEach((element) => {
    Array.from(element.attributes).forEach((attribute) => {
      const name = attribute.name.toLowerCase();
      const value = attribute.value.trim();
      if (name.startsWith('on')) element.removeAttribute(attribute.name);
      if (name === 'src' && value && !/^(data:image\/|blob:)/i.test(value)) element.removeAttribute(attribute.name);
      if (name === 'style' && /(url\s*\(|expression\s*\()/i.test(attribute.value)) element.removeAttribute(attribute.name);
    });
  });
  return template.innerHTML;
}

async function countPdfPages(data: ArrayBuffer): Promise<number | null> {
  try {
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
    const document = await pdfjs.getDocument({ data: new Uint8Array(data) }).promise;
    return document.numPages;
  } catch {
    return null;
  }
}

async function renderHtmlToPdf(html: string, options: WordToPdfOptions): Promise<Blob> {
  const html2pdf = (await import('html2pdf.js')).default;
  const container = document.createElement('div');
  container.innerHTML = sanitizeHtml(html);
  container.style.cssText = [
    'position: fixed', 'left: -100000px', 'top: 0', 'width: 794px', 'padding: 0',
    'background: #ffffff', 'color: #000000', 'font-family: Arial, sans-serif',
    'font-size: 12pt', 'line-height: 1.35',
  ].join(';');
  document.body.appendChild(container);
  try {
    return await html2pdf()
      .set({
        margin: options.margin ?? 12,
        filename: outputName('document.docx', options.filename),
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: { scale: 2, useCORS: false, backgroundColor: '#ffffff' },
        jsPDF: { unit: 'mm', format: options.pageFormat ?? 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['css', 'legacy'] },
      } as any)
      .from(container)
      .toPdf()
      .outputPdf('blob');
  } finally {
    container.remove();
  }
}

export class WordToPdfProcessor implements DocumentProcessor<WordToPdfResult> {
  type = 'docx' as const;

  async process(file: File | readonly File[], rawOptions: Record<string, unknown> = {}): Promise<WordToPdfResult> {
    if (!('size' in file)) return failure({ name: '', size: 0 }, 'DOCX_FILE_REQUIRED', 'A single DOCX file is required');
    const source = sourceMetadata(file);
    if (!isDocxFile(file)) return failure(source, 'UNSUPPORTED_FILE', 'The file must be a DOCX document');
    if (!isReadableFile(file)) return failure(source, 'DOCX_FILE_UNREADABLE', 'The DOCX file could not be read');
    if (file.size <= 0 || file.size > MAX_WORD_FILE_BYTES) return failure(source, 'INVALID_FILE_SIZE', `DOCX must be between 1 and ${MAX_WORD_FILE_BYTES} bytes`);

    try {
      const data = await file.arrayBuffer();
      const header = new Uint8Array(data).subarray(0, 2);
      if (header[0] !== 0x50 || header[1] !== 0x4b) return failure(source, 'CORRUPT_DOCX', 'The file is not a valid DOCX archive');
      const mammoth = await import('mammoth');
      const converted = await mammoth.convertToHtml({ arrayBuffer: data });
      const warnings = converted.messages.map((message) => warning('DOCX_CONVERSION_WARNING', message.message));
      if (!converted.value.trim()) return failure(source, 'EMPTY_DOCUMENT', 'The DOCX contains no printable content', warnings);
      const options = rawOptions as WordToPdfOptions;
      const blob = await renderHtmlToPdf(converted.value, options);
      if (blob.type !== 'application/pdf' || blob.size === 0) return failure(source, 'INVALID_PDF_OUTPUT', 'The converter did not produce a valid PDF', warnings);
      const pageCount = await countPdfPages(await blob.arrayBuffer());
      const output: WordToPdfOutput = { name: outputName(file.name, options.filename), blob, size: blob.size, type: 'application/pdf', pageCount };
      return { success: true, source, outputSize: blob.size, pageCount, output, warnings, errors: [] };
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'Word to PDF conversion failed';
      return failure(source, 'WORD_TO_PDF_FAILED', message, [warning('FIDELITY_LIMITED', 'PDF output is rendered from converted HTML and may differ from Microsoft Word layout')]);
    }
  }
}

export const wordToPdfProcessor = new WordToPdfProcessor();

export function registerWordToPdfProcessor(registry: DocumentRegistry): WordToPdfProcessor {
  if (registry.getAll(wordToPdfProcessor.type).includes(wordToPdfProcessor)) return wordToPdfProcessor;
  registry.register(wordToPdfProcessor);
  return wordToPdfProcessor;
}