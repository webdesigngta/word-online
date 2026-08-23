import type { File } from '../../../core/document-engine/types/File';
import { caught, failed, wordWarning } from './wordErrors';
import { asOutput, isDocxArchive, outputName, readFile } from './docxHelpers';
import { docxHtml } from './batchHelpers';
import { validateDocxFile } from './wordValidator';
import type { WordOutput, WordResult, WordSource, WordWarning } from './wordTypes';

export type ZipArchive = Awaited<ReturnType<(typeof import('jszip'))['loadAsync']>>;
const MAX_ARCHIVE_ENTRIES = 5000;
const REQUIRED_DOCX_ENTRIES = ['[Content_Types].xml', '_rels/.rels', 'word/document.xml', 'word/_rels/document.xml.rels'];

export function filesFrom(input: File | readonly File[] | undefined): File[] {
  if (!input) return [];
  return 'size' in input ? [input] : [...input];
}

export async function openDocx(file: File): Promise<{ data: ArrayBuffer; zip: ZipArchive } | WordResult> {
  const source = { name: file.name, size: file.size, type: file.type, lastModified: file.lastModified } satisfies WordSource;
  const invalid = validateDocxFile(file);
  if (invalid.length) return failed(source, 'INVALID_DOCX', invalid.join('. '));
  try {
    const data = await readFile(file);
    if (!isDocxArchive(data)) return failed(source, 'CORRUPT_DOCX', 'The file is not a valid DOCX archive');
    const zip = await (await import('jszip')).default.loadAsync(data);
    const names = Object.keys(zip.files);
    if (names.length > MAX_ARCHIVE_ENTRIES) return failed(source, 'DOCX_TOO_MANY_ENTRIES', 'The DOCX archive contains too many entries');
    if (names.some((name) => name.split('/').includes('..') || name.startsWith('/'))) return failed(source, 'UNSAFE_DOCX_ARCHIVE', 'The DOCX archive contains an unsafe path');
    return { data, zip };
  } catch (error) {
    return caught(source, 'DOCX_READ_FAILED', error);
  }
}

export function xmlDocument(xml: string): XMLDocument {
  const document = new DOMParser().parseFromString(xml, 'application/xml');
  if (document.querySelector('parsererror')) throw new Error('The DOCX package contains invalid XML');
  return document;
}

export function xmlText(xml: string, tag: string): string | null {
  const document = xmlDocument(xml);
  return document.getElementsByTagNameNS('*', tag)[0]?.textContent?.trim() || null;
}

export function missingDocxEntries(zip: ZipArchive): string[] {
  return REQUIRED_DOCX_ENTRIES.filter((name) => !zip.file(name));
}

export async function htmlDocxOutput(html: string, name: string): Promise<{ output: WordOutput; warnings: WordWarning[] }> {
  const converted = await (await import('./batchHelpers')).htmlToDocx(html);
  return { output: asOutput(name, converted, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'), warnings: [] };
}

export async function mammothHtml(file: File): Promise<{ html: string; warnings: WordWarning[]; data: ArrayBuffer } | WordResult> {
  return docxHtml(file);
}

export function success(source: WordSource, output: WordOutput, warnings: WordWarning[] = [], metadata?: Record<string, unknown>): WordResult {
  return { success: true, source, outputSize: output.size, output, warnings, errors: [], metadata };
}

export function inputRequired(code: string, message: string): WordResult {
  return failed({ name: '', size: 0 }, code, message);
}

export function safeWarning(message: string): WordWarning {
  return wordWarning('FIDELITY_LIMITED', message);
}

export function outputDocxName(source: string, requested?: string): string {
  return outputName(source, 'docx', requested);
}

export function bodyHtml(html: string): HTMLElement {
  return new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html').body;
}