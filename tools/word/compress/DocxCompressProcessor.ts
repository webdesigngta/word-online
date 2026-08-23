import type { DocumentProcessor, DocumentRegistry } from '../../../core/document-engine/registry/documentRegistry';
import type { File } from '../../../core/document-engine/types/File';
import { asOutput, sourceOf, type WordResult } from '../shared';
import { caught, failed } from '../shared/wordErrors';
import { missingDocxEntries, openDocx, outputDocxName, success } from '../shared/docxPackage';

const DOCX_TYPE = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

export class DocxCompressProcessor implements DocumentProcessor<WordResult> {
  type = 'docx' as const;

  async process(input: File | readonly File[], rawOptions: Record<string, unknown> = {}): Promise<WordResult> {
    const file = 'size' in input ? input : input[0];
    if (!file) return failed({ name: '', size: 0 }, 'DOCX_FILE_REQUIRED', 'A DOCX file is required');
    const source = sourceOf(file);
    try {
      const opened = await openDocx(file);
      if ('success' in opened) return opened;
      const missing = missingDocxEntries(opened.zip);
      if (missing.length) return failed(source, 'INVALID_DOCX_PACKAGE', `The DOCX package is missing: ${missing.join(', ')}`);
      const options = rawOptions as { removeUnreferencedThumbnail?: boolean; filename?: string };
      const JSZip = (await import('jszip')).default;
      const output = new JSZip();
      const names = Object.keys(opened.zip.files);
      const allText = await Promise.all(names.map(async (name) => opened.zip.file(name)?.async('string').catch(() => '') ?? ''));
      const thumbnail = 'docProps/thumbnail.jpeg';
      const removeThumbnail = options.removeUnreferencedThumbnail === true && names.includes(thumbnail) && !allText.some((text, index) => names[index] !== thumbnail && text.includes(thumbnail));
      for (const name of names) {
        if (removeThumbnail && name === thumbnail) continue;
        const entry = opened.zip.file(name);
        if (entry) output.file(name, await entry.async('uint8array'));
      }
      const blob = await output.generateAsync({ type: 'blob', mimeType: DOCX_TYPE, compression: 'DEFLATE', compressionOptions: { level: 9 } });
      const reduction = file.size - blob.size;
      const warnings = reduction < 0 ? [{ code: 'NO_REDUCTION', message: 'The optimized package is larger than the input; no reduction was achieved.' }] : [];
      return success(source, asOutput(outputDocxName(file.name, options.filename), blob, DOCX_TYPE), warnings, { inputSize: file.size, outputSize: blob.size, bytesSaved: Math.max(0, reduction), thumbnailRemoved: removeThumbnail });
    } catch (error) {
      return caught(source, 'DOCX_COMPRESS_FAILED', error);
    }
  }
}

export const docxCompressProcessor = new DocxCompressProcessor();

export function registerDocxCompressProcessor(registry: DocumentRegistry): DocxCompressProcessor {
  if (!registry.getAll(docxCompressProcessor.type).includes(docxCompressProcessor)) registry.register(docxCompressProcessor);
  return docxCompressProcessor;
}