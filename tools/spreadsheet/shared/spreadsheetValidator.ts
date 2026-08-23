import type { File } from '../../../core/document-engine/types/File';
import type { SpreadsheetFile } from './spreadsheetTypes';

export const MAX_SPREADSHEET_FILE_SIZE = 50 * 1024 * 1024;

export function isReadableSpreadsheetFile(file: File): file is SpreadsheetFile {
  return typeof (file as Partial<SpreadsheetFile>).arrayBuffer === 'function';
}

export function validateSpreadsheetFile(file: File, maxSize = MAX_SPREADSHEET_FILE_SIZE): string[] {
  const supported = /\.xlsx$/i.test(file.name) || /spreadsheetml\.sheet|application\/vnd\.ms-excel/i.test(file.type ?? '');
  const errors: string[] = [];
  if (!supported) errors.push('File must be an XLSX workbook');
  if (!file.size || file.size > maxSize) errors.push(`Spreadsheet must be between 1 and ${maxSize} bytes`);
  if (!isReadableSpreadsheetFile(file)) errors.push('Spreadsheet file could not be read');
  return errors;
}