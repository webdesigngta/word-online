import type { File } from '../../../core/document-engine/types/File';
import { DOCX_MIME, MAX_WORD_INPUT_BYTES, type ReadableFile } from './wordTypes';

export function isReadableFile(file: File): file is ReadableFile { return typeof (file as Partial<ReadableFile>).arrayBuffer === 'function'; }
export function validateDocxFile(file: File, maxSize = MAX_WORD_INPUT_BYTES): string[] {
  const errors: string[] = [];
  if (!/\.docx$/i.test(file.name) && file.type !== DOCX_MIME) errors.push('File must be a DOCX document');
  if (!file.size || file.size > maxSize) errors.push(`DOCX must be between 1 and ${maxSize} bytes`);
  if (!isReadableFile(file)) errors.push('DOCX file could not be read');
  return errors;
}
export function validateText(value: string, label = 'Text'): string[] { return value.trim() ? [] : [`${label} content is empty`]; }
export function validateTextFile(file: File, maxSize = MAX_WORD_INPUT_BYTES): string[] {
  const errors: string[] = [];
  if (!/\.txt$/i.test(file.name) && !/^text\/plain/i.test(file.type ?? '')) errors.push('File must be a TXT document');
  if (!file.size || file.size > maxSize) errors.push(`TXT must be between 1 and ${maxSize} bytes`);
  if (!isReadableFile(file)) errors.push('TXT file could not be read');
  return errors;
}
export function validateHtml(value: string): string[] { return value.trim() ? [] : ['HTML content is empty']; }
export function validateHtmlFile(file: File, maxSize = MAX_WORD_INPUT_BYTES): string[] {
  const errors: string[] = [];
  if (!/\.html?$/i.test(file.name) && !/^text\/html/i.test(file.type ?? '')) errors.push('File must be an HTML document');
  if (!file.size || file.size > maxSize) errors.push(`HTML must be between 1 and ${maxSize} bytes`);
  if (!isReadableFile(file)) errors.push('HTML file could not be read');
  return errors;
}
