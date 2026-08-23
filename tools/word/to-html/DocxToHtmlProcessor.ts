import type { DocumentProcessor, DocumentRegistry } from '../../../core/document-engine/registry/documentRegistry';
import type { File } from '../../../core/document-engine/types/File';
import type { DocxToHtmlResult } from './DocxToHtmlResult';
import { asOutput, caught, failed, isDocxArchive, mammothWarnings, outputName, readFile, sourceOf } from '../shared';
import { validateDocxFile } from '../shared';
export class DocxToHtmlProcessor implements DocumentProcessor<DocxToHtmlResult> {
  type = 'docx' as const;
  async process(file: File | readonly File[], rawOptions: Record<string, unknown> = {}): Promise<DocxToHtmlResult> {
    if (!('size' in file)) return failed({ name: '', size: 0 }, 'DOCX_FILE_REQUIRED', 'A single DOCX file is required');
    const source = sourceOf(file); const invalid = validateDocxFile(file); if (invalid.length) return failed(source, 'INVALID_DOCX', invalid.join('. '));
    try { const data = await readFile(file); if (!isDocxArchive(data)) return failed(source, 'CORRUPT_DOCX', 'The file is not a valid DOCX archive'); const mammoth = await import('mammoth'); const converted = await mammoth.convertToHtml({ arrayBuffer: data }); const warnings = mammothWarnings(converted.messages); if (!converted.value.trim()) return failed(source, 'EMPTY_DOCUMENT', 'The DOCX contains no printable content', warnings); const metadata = { sourceName: file.name, sourceSize: file.size, messageCount: converted.messages.length }; const blob = new Blob([converted.value], { type: 'text/html' }); const options = rawOptions as { filename?: string }; return { success: true, source, outputSize: blob.size, output: asOutput(outputName(file.name, 'html', options.filename), blob, 'text/html', metadata), warnings, errors: [], metadata }; } catch (error) { return caught(source, 'DOCX_TO_HTML_FAILED', error); }
  }
}
export const docxToHtmlProcessor = new DocxToHtmlProcessor();
export function registerDocxToHtmlProcessor(registry: DocumentRegistry): DocxToHtmlProcessor { if (!registry.getAll(docxToHtmlProcessor.type).includes(docxToHtmlProcessor)) registry.register(docxToHtmlProcessor); return docxToHtmlProcessor; }
