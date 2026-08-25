import type { File } from '../../../core/document-engine/types/File';
import { imageToWordProcessor } from '../../image/to-word';
import { pdfOcrProcessor } from '../../pdf/ocr';

const DOCX_TYPE = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' as const;
type SourceKind = 'pdf' | 'image';

export interface ScanToWordOptions { language?: string; title?: string }
export interface ScanToWordOutput { name: string; blob: Blob; size: number; type: typeof DOCX_TYPE }
export interface ScanToWordWarning { code: string; message: string }
export interface ScanToWordError { code: string; message: string }
export interface ScanToWordResult {
  success: boolean;
  source: { name: string; size: number; type?: string; lastModified?: number };
  sourceKind: SourceKind | null;
  pageCount: number | null;
  text: string;
  confidence: number | null;
  output?: ScanToWordOutput;
  warnings: ScanToWordWarning[];
  errors: ScanToWordError[];
}

function source(file: File) { return { name: file.name, size: file.size, type: file.type, lastModified: file.lastModified }; }
function kind(file: File): SourceKind | null {
  const type = file.type?.toLowerCase() ?? '';
  if (type === 'application/pdf' || /\.pdf$/i.test(file.name)) return 'pdf';
  if (type === 'image/png' || type === 'image/jpeg' || type === 'image/jpg' || /\.(?:png|jpe?g)$/i.test(file.name)) return 'image';
  return null;
}
function failure(file: File, sourceKind: SourceKind | null, code: string, message: string): ScanToWordResult {
  return { success: false, source: source(file), sourceKind, pageCount: null, text: '', confidence: null, warnings: [], errors: [{ code, message }] };
}
function outputName(sourceName: string, title?: string) {
  const base = (title ?? sourceName.replace(/\.(?:pdf|png|jpe?g)$/i, '')).replace(/[\\/:*?"<>|]+/g, '').trim();
  return `${base || 'scanned-document'}.docx`;
}
async function buildDocx(text: string, title?: string): Promise<Blob> {
  const docx = await import('docx');
  const children: any[] = [];
  if (title?.trim()) children.push(new docx.Paragraph({ text: title.trim(), heading: docx.HeadingLevel.TITLE }));
  text.replace(/\r\n?/g, '\n').split('\n').forEach((line) => {
    children.push(new docx.Paragraph({ children: [new docx.TextRun({ text: line })], spacing: { after: line ? 100 : 0 } }));
  });
  if (!children.length) children.push(new docx.Paragraph(''));
  return docx.Packer.toBlob(new docx.Document({ sections: [{ properties: {}, children }] }));
}

export class ScanToWordProcessor {
  async process(file: File | readonly File[], rawOptions: Record<string, unknown> = {}): Promise<ScanToWordResult> {
    if (!('size' in file)) return failure({ name: '', size: 0 }, null, 'SCAN_FILE_REQUIRED', 'A single scanned PDF or image is required');
    const sourceKind = kind(file);
    if (!sourceKind) return failure(file, null, 'UNSUPPORTED_SCAN_FORMAT', 'Choose a PDF, JPG, JPEG, or PNG scan');
    const options = rawOptions as ScanToWordOptions;
    try {
      if (sourceKind === 'image') {
        const result = await imageToWordProcessor.process(file, { expectedFormat: 'image', language: options.language || 'eng', title: options.title });
        if (!result.success || !result.output) return failure(file, sourceKind, result.errors[0]?.code || 'IMAGE_OCR_FAILED', result.errors[0]?.message || 'The image scan could not be recognized');
        return { success: true, source: source(file), sourceKind, pageCount: 1, text: result.text, confidence: result.confidence, output: result.output, warnings: result.warnings, errors: [] };
      }
      const pdfResult = await pdfOcrProcessor.process(file, { allPages: true, searchablePdf: false, language: options.language || 'eng' });
      if (!pdfResult.success || !pdfResult.text.trim()) return failure(file, sourceKind, pdfResult.errors[0]?.code || 'PDF_OCR_FAILED', pdfResult.errors[0]?.message || 'The scanned PDF could not be recognized');
      const blob = await buildDocx(pdfResult.text, options.title);
      return {
        success: true,
        source: source(file),
        sourceKind,
        pageCount: pdfResult.originalPageCount,
        text: pdfResult.text,
        confidence: pdfResult.confidence,
        output: { name: outputName(file.name, options.title), blob, size: blob.size, type: DOCX_TYPE },
        warnings: pdfResult.warnings,
        errors: [],
      };
    } catch (error) {
      return failure(file, sourceKind, 'SCAN_TO_WORD_FAILED', error instanceof Error ? error.message : 'Scan to Word conversion failed');
    }
  }
}

export const scanToWordProcessor = new ScanToWordProcessor();
