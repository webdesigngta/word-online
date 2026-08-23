import type { DocumentType } from '../types/Document';
import type { File } from '../types/File';

export const DEFAULT_MAX_FILE_SIZE = 20 * 1024 * 1024;

export interface FileValidationOptions {
  maxSize?: number;
  supportedTypes?: readonly DocumentType[];
}

export interface FileValidationResult {
  valid: boolean;
  typeValid: boolean;
  sizeValid: boolean;
  type: DocumentType | null;
  errors: string[];
}

const extensionTypes: Record<string, DocumentType> = {
  docx: 'docx',
  pdf: 'pdf',
  xlsx: 'xlsx',
  html: 'html',
  htm: 'html',
  txt: 'txt',
  png: 'image',
  jpg: 'image',
  jpeg: 'image',
  gif: 'image',
  webp: 'image',
};

function detectDocumentType(name: string): DocumentType | null {
  const extension = name.split('.').pop()?.toLowerCase() || '';
  return extensionTypes[extension] ?? null;
}

export function validateFile(
  file: File,
  options: FileValidationOptions = {},
): FileValidationResult {
  const supportedTypes = options.supportedTypes ?? Object.values(extensionTypes).filter(
    (type, index, types) => types.indexOf(type) === index,
  );
  const type = detectDocumentType(file.name);
  const typeValid = type !== null && supportedTypes.includes(type);
  const maxSize = options.maxSize ?? DEFAULT_MAX_FILE_SIZE;
  const sizeValid = file.size >= 0 && file.size <= maxSize;
  const errors: string[] = [];

  if (!typeValid) errors.push('Unsupported document type');
  if (!sizeValid) errors.push(`File must be smaller than ${maxSize} bytes`);

  return {
    valid: typeValid && sizeValid,
    typeValid,
    sizeValid,
    type,
    errors,
  };
}

export function validateFileType(
  file: File,
  supportedTypes?: readonly DocumentType[],
): boolean {
  return validateFile(file, { supportedTypes }).typeValid;
}

export function validateFileSize(file: File, maxSize = DEFAULT_MAX_FILE_SIZE): boolean {
  return validateFile(file, { maxSize }).sizeValid;
}
