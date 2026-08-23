import type { File } from '../../../core/document-engine/types/File';
import type { HtmlFile } from './htmlTypes';

export const MAX_HTML_FILE_SIZE = 10 * 1024 * 1024;

export function isReadableHtmlFile(file: File): file is HtmlFile {
  return typeof (file as Partial<HtmlFile>).arrayBuffer === 'function';
}

export function validateHtmlFile(file: File, maxSize = MAX_HTML_FILE_SIZE): string[] {
  const errors: string[] = [];
  if (!/\.html?$/i.test(file.name) && !/text\/html/i.test(file.type ?? '')) errors.push('File must be an HTML document');
  if (!file.size || file.size > maxSize) errors.push(`HTML must be between 1 and ${maxSize} bytes`);
  if (!isReadableHtmlFile(file)) errors.push('HTML file could not be read');
  return errors;
}