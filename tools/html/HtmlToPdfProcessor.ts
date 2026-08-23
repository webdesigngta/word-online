import type { DocumentProcessor, DocumentRegistry } from '../../core/document-engine/registry/documentRegistry';
import type { File } from '../../core/document-engine/types/File';
import type { HtmlToPdfOptions } from './HtmlToPdfOptions';
import type { HtmlToPdfResult } from './HtmlToPdfResult';
import { isReadableHtmlFile, validateHtmlFile } from './shared/htmlValidator';

const PDF_TYPE = 'application/pdf' as const;

function metadata(file: File) { return { name: file.name, size: file.size, type: file.type, lastModified: file.lastModified }; }
function outputName(name: string, filename?: string): string { const base = (filename ?? name.replace(/\.html?$/i, '')).replace(/\.pdf$/i, '').replace(/[\\/:*?"<>|]+/g, '').trim(); return `${base || 'document'}.pdf`; }
function escapeText(value: string): string { return value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character] ?? character)); }

function sanitizeHtml(html: string): { html: string; warnings: { code: string; message: string }[] } {
  const template = document.createElement('template');
  template.innerHTML = html;
  const warnings: { code: string; message: string }[] = [];
  const removed = template.content.querySelectorAll('script,iframe,object,embed,form,link,base,meta').length;
  template.content.querySelectorAll('script,iframe,object,embed,form,link,base,meta').forEach((node) => node.remove());
  template.content.querySelectorAll('style').forEach((style) => {
    style.textContent = (style.textContent ?? '').replace(/@import[^;]+;|url\s*\([^)]*\)|expression\s*\([^)]*\)/gi, '');
  });
  template.content.querySelectorAll<HTMLElement>('*').forEach((element) => {
    Array.from(element.attributes).forEach((attribute) => {
      const name = attribute.name.toLowerCase();
      const value = attribute.value.trim();
      if (name.startsWith('on') || name === 'srcdoc' || name === 'formaction') element.removeAttribute(attribute.name);
      if (name === 'href' || name === 'poster' || name === 'action') element.removeAttribute(attribute.name);
      if (name === 'src' && !/^data:image\/(?:png|jpe?g|gif|webp);base64,/i.test(value)) element.removeAttribute(attribute.name);
      if (name === 'style' && /(url\s*\(|expression\s*\(|@import)/i.test(value)) element.removeAttribute(attribute.name);
    });
  });
  if (removed) warnings.push({ code: 'UNSAFE_MARKUP_REMOVED', message: 'Scripts, styles, embeds, forms, metadata, and remote resources were removed before rendering.' });
  return { html: template.innerHTML, warnings };
}

async function countPages(blob: Blob): Promise<number | null> { try { const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs'); return (await pdfjs.getDocument({ data: new Uint8Array(await blob.arrayBuffer()) }).promise).numPages; } catch { return null; } }

async function render(html: string, options: HtmlToPdfOptions, filename: string): Promise<Blob> {
  const html2pdf = (await import('html2pdf.js')).default;
  const container = document.createElement('div');
  container.innerHTML = html;
  container.style.cssText = 'position:fixed;left:-100000px;top:0;width:794px;padding:0;background:#fff;color:#111;font-family:Arial,sans-serif;font-size:12pt;line-height:1.35;';
  document.body.appendChild(container);
  try { return await html2pdf().set({ margin: options.margin ?? 12, filename, image: { type: 'jpeg', quality: 0.95 }, html2canvas: { scale: 2, useCORS: false, backgroundColor: '#ffffff' }, jsPDF: { unit: 'mm', format: options.pageFormat ?? 'a4', orientation: options.orientation ?? 'portrait' }, pagebreak: { mode: ['css', 'legacy'] } } as any).from(container).toPdf().outputPdf('blob'); } finally { container.remove(); }
}

export class HtmlToPdfProcessor implements DocumentProcessor<HtmlToPdfResult> {
  type = 'html' as const;
  async process(input: File | readonly File[] | string, rawOptions: Record<string, unknown> = {}): Promise<HtmlToPdfResult> {
    if (typeof input !== 'string' && !('size' in input)) return { success: false, source: { name: '', size: 0 }, outputSize: 0, pageCount: null, warnings: [], errors: [{ code: 'HTML_INPUT_REQUIRED', message: 'An HTML string or a single HTML file is required' }] };
    const file = typeof input === 'string' ? { name: 'document.html', size: new TextEncoder().encode(input).byteLength, type: 'text/html' } : input;
    const base = { source: metadata(file), outputSize: 0, pageCount: null, warnings: [], errors: [] };
    try {
      let html = typeof input === 'string' ? input : '';
      if (typeof input !== 'string') {
        const validationErrors = validateHtmlFile(input);
        if (validationErrors.length) return { ...base, success: false, errors: validationErrors.map((message) => ({ code: 'INVALID_HTML', message })) };
        if (!isReadableHtmlFile(input)) return { ...base, success: false, errors: [{ code: 'HTML_FILE_UNREADABLE', message: 'HTML file could not be read' }] };
        html = new TextDecoder().decode(await input.arrayBuffer());
      }
      if (!html.trim()) return { ...base, success: false, errors: [{ code: 'EMPTY_HTML', message: 'HTML content is empty' }] };
      const sanitized = sanitizeHtml(html);
      const options = rawOptions as HtmlToPdfOptions;
      const blob = await render(sanitized.html, options, outputName(file.name, options.filename));
      if (blob.type !== PDF_TYPE || !blob.size) return { ...base, success: false, warnings: sanitized.warnings, errors: [{ code: 'INVALID_PDF_OUTPUT', message: 'The converter did not produce a valid PDF' }] };
      const count = await countPages(blob);
      const output = { name: outputName(file.name, options.filename), blob, size: blob.size, type: PDF_TYPE, pageCount: count };
      return { success: true, source: metadata(file), outputSize: blob.size, pageCount: count, output, warnings: sanitized.warnings, errors: [] };
    } catch (error) { return { ...base, success: false, errors: [{ code: 'HTML_TO_PDF_FAILED', message: error instanceof Error ? error.message : 'HTML to PDF conversion failed' }] }; }
  }
}

export const htmlToPdfProcessor = new HtmlToPdfProcessor();
export function registerHtmlToPdfProcessor(registry: DocumentRegistry): HtmlToPdfProcessor { if (!registry.getAll(htmlToPdfProcessor.type).includes(htmlToPdfProcessor)) registry.register(htmlToPdfProcessor); return htmlToPdfProcessor; }