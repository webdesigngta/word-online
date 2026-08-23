export type SupportedFileType =
  | 'docx'
  | 'pdf'
  | 'xlsx'
  | 'image'
  | 'unknown';

export interface PlatformFile {
  name: string;
  size: number;
  type: SupportedFileType;
  lastModified?: number;
}

export function getFileExtension(name: string): string {
  return name.split('.').pop()?.toLowerCase() || '';
}
