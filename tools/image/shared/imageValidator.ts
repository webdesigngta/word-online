import type { File } from '../../../core/document-engine/types/File';
import type { ImageFile, ImageFormat } from './imageTypes';

export const MAX_IMAGE_FILE_SIZE = 50 * 1024 * 1024;

export interface ImageValidationResult {
  valid: boolean;
  errors: string[];
}

export function isReadableImageFile(file: File): file is ImageFile {
  return typeof (file as Partial<ImageFile>).arrayBuffer === 'function';
}

export function validateImageFile(file: ImageFile, format: ImageFormat, maxSize = MAX_IMAGE_FILE_SIZE): ImageValidationResult {
  const extension = format === 'jpg' ? /\.(?:jpe?g)$/i : /\.png$/i;
  const mime = format === 'jpg' ? /^image\/(?:jpe?g)$/i : /^image\/png$/i;
  const isExpectedType = mime.test(file.type ?? '') || extension.test(file.name);
  const withinSize = file.size > 0 && file.size <= maxSize;
  const errors: string[] = [];
  if (!isExpectedType) errors.push(`File must be a ${format.toUpperCase()} image`);
  if (!withinSize) errors.push(`Image must be between 1 and ${maxSize} bytes`);
  return { valid: isExpectedType && withinSize, errors };
}