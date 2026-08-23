import type { DocumentProcessor, DocumentRegistry } from '../../../core/document-engine/registry/documentRegistry';
import type { File } from '../../../core/document-engine/types/File';
import { convertImagesToPdf } from '../shared/imageToPdfShared';
import type { PngToPdfResult } from './PngToPdfResult';

export class PngToPdfProcessor implements DocumentProcessor<PngToPdfResult> {
  type = 'image' as const;

  async process(file: File | readonly File[], options: Record<string, unknown> = {}): Promise<PngToPdfResult> {
    const files = 'size' in file ? [file] : [...file];
    const originalSize = files.reduce((total, item) => total + item.size, 0);
    try {
      const result = await convertImagesToPdf(file, 'png', options);
      return { success: true, inputCount: result.inputCount, originalSize, outputSize: result.output.size, pageCount: result.output.pageCount, output: result.output, warnings: result.warnings, errors: [] };
    } catch (error) {
      return { success: false, inputCount: files.length, originalSize, outputSize: 0, pageCount: 0, warnings: [], errors: [{ code: 'PNG_TO_PDF_FAILED', message: error instanceof Error ? error.message : 'PNG to PDF conversion failed' }] };
    }
  }
}

export const pngToPdfProcessor = new PngToPdfProcessor();

export function registerPngToPdfProcessor(registry: DocumentRegistry): PngToPdfProcessor {
  if (registry.getAll(pngToPdfProcessor.type).includes(pngToPdfProcessor)) return pngToPdfProcessor;
  registry.register(pngToPdfProcessor);
  return pngToPdfProcessor;
}