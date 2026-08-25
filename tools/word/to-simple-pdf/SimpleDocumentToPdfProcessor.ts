import type { DocumentProcessor } from '../../../core/document-engine/registry/documentRegistry';
import type { File } from '../../../core/document-engine/types/File';
import { rtfToHtml } from '../shared/batchHelpers';

export type SimpleDocumentPdfMode = 'txt' | 'rtf';

export interface SimpleDocumentToPdfResult {
  success: boolean;
  source: { name: string; size: number; type?: string; lastModified?: number };
  outputSize: number;
  pageCount: number | null;
  output?: { name: string; blob: Blob; size: number; type: 'application/pdf'; pageCount: number | null };
  warnings: string[];
  errors: Array<{ code: string; message: string }>;
}

function readable(file: File): file is File & { arrayBuffer(): Promise<ArrayBuffer> } {
  return typeof (file as File & { arrayBuffer?: unknown }).arrayBuffer === 'function';
}

function source(file: File) {
  return { name: file.name, size: file.size, type: file.type, lastModified: file.lastModified };
}

function safeName(name: string) {
  return `${name.replace(/\.(?:txt|rtf)$/i, '').replace(/[\\/:*?"<>|]+/g, '').trim() || 'document'}.pdf`;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char] ?? char));
}

function sanitizeHtml(html: string) {
  const template = document.createElement('template');
  template.innerHTML = html;
  template.content.querySelectorAll('script,style,iframe,object,embed,form,input,button,textarea,select,meta,link,base').forEach((node) => node.remove());
  template.content.querySelectorAll<HTMLElement>('*').forEach((element) => {
    Array.from(element.attributes).forEach((attribute) => {
      const name = attribute.name.toLowerCase();
      const value = attribute.value.trim();
      if (name.startsWith('on')) element.removeAttribute(attribute.name);
      if (name === 'href' && /^javascript:/i.test(value)) element.removeAttribute(attribute.name);
      if (name === 'src' && value && !/^(data:image\/|blob:)/i.test(value)) element.removeAttribute(attribute.name);
      if (name === 'style' && /(url\s*\(|expression\s*\()/i.test(attribute.value)) element.removeAttribute(attribute.name);
    });
  });
  return template.innerHTML;
}

async function pageCount(blob: Blob): Promise<number | null> {
  try {
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
    const pdf = await pdfjs.getDocument({ data: new Uint8Array(await blob.arrayBuffer()) }).promise;
    return pdf.numPages;
  } catch {
    return null;
  }
}

export class SimpleDocumentToPdfProcessor implements DocumentProcessor<SimpleDocumentToPdfResult> {
  type = 'text' as const;

  async process(input: File | readonly File[], rawOptions: Record<string, unknown> = {}): Promise<SimpleDocumentToPdfResult> {
    if (!('size' in input)) {
      return { success: false, source: { name: '', size: 0 }, outputSize: 0, pageCount: null, warnings: [], errors: [{ code: 'FILE_REQUIRED', message: 'A single TXT or RTF file is required' }] };
    }

    const base: SimpleDocumentToPdfResult = { success: false, source: source(input), outputSize: 0, pageCount: null, warnings: [], errors: [] };
    if (!readable(input)) return { ...base, errors: [{ code: 'FILE_UNREADABLE', message: 'The document could not be read' }] };
    if (input.size <= 0 || input.size > 20 * 1024 * 1024) return { ...base, errors: [{ code: 'INVALID_FILE_SIZE', message: 'Files must be between 1 byte and 20 MB' }] };

    const options = rawOptions as { mode?: SimpleDocumentPdfMode; pageFormat?: 'a4' | 'letter'; orientation?: 'portrait' | 'landscape'; margin?: number };
    const mode = options.mode ?? (/\.rtf$/i.test(input.name) ? 'rtf' : 'txt');
    if (mode === 'txt' && !(input.type === 'text/plain' || /\.txt$/i.test(input.name))) return { ...base, errors: [{ code: 'INVALID_TXT', message: 'Choose a TXT file' }] };
    if (mode === 'rtf' && !(/\.rtf$/i.test(input.name) || /rtf/i.test(input.type ?? ''))) return { ...base, errors: [{ code: 'INVALID_RTF', message: 'Choose an RTF file' }] };

    try {
      const text = new TextDecoder().decode(await input.arrayBuffer());
      if (!text.trim()) return { ...base, errors: [{ code: 'EMPTY_DOCUMENT', message: 'The document does not contain printable text' }] };

      let bodyHtml: string;
      let warnings: string[] = [];
      if (mode === 'rtf') {
        const converted = rtfToHtml(text);
        bodyHtml = converted.html;
        warnings = converted.warnings.map((item) => typeof item === 'string' ? item : item.message);
      } else {
        bodyHtml = `<pre style="white-space:pre-wrap;word-break:break-word;font-family:Arial,sans-serif;font-size:11pt;line-height:1.55;margin:0">${escapeHtml(text)}</pre>`;
      }

      const container = document.createElement('div');
      container.innerHTML = sanitizeHtml(bodyHtml);
      container.style.cssText = 'position:fixed;left:-100000px;top:0;width:794px;padding:24px;background:#fff;color:#111;font-family:Arial,sans-serif;font-size:11pt;line-height:1.5;';
      document.body.appendChild(container);

      let blob: Blob;
      try {
        const html2pdf = (await import('html2pdf.js')).default;
        blob = await html2pdf().set({
          margin: options.margin ?? 12,
          filename: safeName(input.name),
          image: { type: 'jpeg', quality: 0.96 },
          html2canvas: { scale: 2, useCORS: false, backgroundColor: '#ffffff' },
          jsPDF: { unit: 'mm', format: options.pageFormat ?? 'a4', orientation: options.orientation ?? 'portrait' },
          pagebreak: { mode: ['css', 'legacy'] },
        } as any).from(container).toPdf().outputPdf('blob');
      } finally {
        container.remove();
      }

      if (!blob.size) throw new Error('The document renderer did not produce a PDF');
      const count = await pageCount(blob);
      const output = { name: safeName(input.name), blob, size: blob.size, type: 'application/pdf' as const, pageCount: count };
      return { success: true, source: source(input), outputSize: blob.size, pageCount: count, output, warnings, errors: [] };
    } catch (error) {
      return { ...base, errors: [{ code: 'SIMPLE_DOCUMENT_TO_PDF_FAILED', message: error instanceof Error ? error.message : 'Document to PDF conversion failed' }] };
    }
  }
}

export const simpleDocumentToPdfProcessor = new SimpleDocumentToPdfProcessor();
