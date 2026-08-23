import { SupportedFileType, getFileExtension } from './fileTypes';

const extensionMap: Record<string, SupportedFileType> = {
  docx: 'docx',
  pdf: 'pdf',
  xlsx: 'xlsx',
  png: 'image',
  jpg: 'image',
  jpeg: 'image',
};

export function detectFileType(name: string): SupportedFileType {
  return extensionMap[getFileExtension(name)] || 'unknown';
}

export function isSupportedFile(name: string): boolean {
  return detectFileType(name) !== 'unknown';
}
