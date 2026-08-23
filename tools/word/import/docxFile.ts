import { detectFileType } from '@/core/files/fileValidation';

export function isWordDocumentFile(name: string): boolean {
  return detectFileType(name) === 'docx';
}

export function assertWordDocumentFile(name: string): void {
  if (!isWordDocumentFile(name)) {
    throw new Error('Unsupported Word document. Please choose a .docx file.');
  }
}
