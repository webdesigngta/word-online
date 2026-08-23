import type { DocumentProcessor, DocumentRegistry } from '../../../core/document-engine/registry/documentRegistry';
import type { File } from '../../../core/document-engine/types/File';
import { convertImagesToPdf } from '../shared/imageToPdfShared';
import type { JpgToPdfResult } from './JpgToPdfResult';

export class JpgToPdfProcessor implements DocumentProcessor<JpgToPdfResult> {
  type = 'image' as const;

  async process(file: File | readonly File[], options: Record<string, unknown> = {}): Promise<JpgToPdfResult> {
    const files = 'size' in file ? [file] : [...file];
    const originalSize = files.reduce((total, item) => total + item.size, 0);
    try {
      const result = await convertImagesToPdf(file, 'jpg', options);
      return { success: true, inputCount: result.inputCount, originalSize, outputSize: result.output.size, pageCount: result.output.pageCount, output: result.output, warnings: result.warnings, errors: [] };
    } catch (error) {
      return { success: false, inputCount: files.length, originalSize, outputSize: 0, pageCount: 0, warnings: [], errors: [{ code: 'JPG_TO_PDF_FAILED', message: error instanceof Error ? error.message : 'JPG to PDF conversion failed' }] };
    }
  }
}

export const jpgToPdfProcessor = new JpgToPdfProcessor();

export function registerJpgToPdfProcessor(registry: DocumentRegistry): JpgToPdfProcessor {
  if (registry.getAll(jpgToPdfProcessor.type).includes(jpgToPdfProcessor)) return jpgToPdfProcessor;
  registry.register(jpgToPdfProcessor);
  return jpgToPdfProcessor;
}