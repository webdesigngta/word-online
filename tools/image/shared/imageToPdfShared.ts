import type { File } from '../../../core/document-engine/types/File';
import type { Color } from 'pdf-lib';
import type { ImageFile, ImageFormat, ImageToPdfOptions, ImageToPdfOutput } from './imageTypes';
import { isReadableImageFile, validateImageFile } from './imageValidator';

const PAGE_SIZES = {
  a4: [595.28, 841.89],
  letter: [612, 792],
} as const;

function imageFormat(file: ImageFile, expectedFormat: ImageFormat): ImageFormat {
  if (expectedFormat === 'png') return 'png';
  return /^image\/jpeg$/i.test(file.type ?? '') || /\.jpe?g$/i.test(file.name) ? 'jpg' : expectedFormat;
}

function outputName(files: readonly ImageFile[], format: ImageFormat): string {
  const base = files.length === 1
    ? files[0].name.replace(/\.(?:jpe?g|png)$/i, '')
    : `${format.toUpperCase()} images`;
  return `${base.replace(/[\\/:*?"<>|]+/g, '').trim() || 'images'}.pdf`;
}

function color(options: ImageToPdfOptions, rgb: (r: number, g: number, b: number) => Color): Color {
  const value = options.backgroundColor ?? { r: 1, g: 1, b: 1 };
  if (![value.r, value.g, value.b].every((channel) => Number.isFinite(channel) && channel >= 0 && channel <= 1)) {
    throw new Error('Background color channels must be between 0 and 1');
  }
  return rgb(value.r, value.g, value.b);
}

function concreteBuffer(bytes: Uint8Array): ArrayBuffer {
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  return buffer;
}

export async function convertImagesToPdf(
  files: File | readonly File[],
  expectedFormat: ImageFormat,
  options: ImageToPdfOptions = {},
): Promise<{ output: ImageToPdfOutput; inputCount: number; warnings: string[] }> {
  if ('size' in files) throw new Error('At least one image file is required');
  if (!files.length) throw new Error('At least one image file is required');
  const images: ImageFile[] = [];
  for (const file of files) {
    if (!isReadableImageFile(file)) throw new Error(`Could not read ${file.name}`);
    const validation = validateImageFile(file, expectedFormat);
    if (!validation.valid) throw new Error(`${file.name}: ${validation.errors.join('. ')}`);
    images.push(file);
  }

  const pdfLib = await import('pdf-lib');
  const document = await pdfLib.PDFDocument.create();
  const warnings: string[] = [];
  const format = options.pageFormat ?? 'a4';
  const orientation = options.orientation ?? 'portrait';
  const margin = options.margin ?? 24;
  if (!Number.isFinite(margin) || margin < 0) throw new Error('Margin must be a non-negative number');
  const baseSize = PAGE_SIZES[format];
  const pageSize = orientation === 'landscape' ? [baseSize[1], baseSize[0]] : baseSize;
  const pageColor = color(options, pdfLib.rgb);

  for (const file of images) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const embedded = imageFormat(file, expectedFormat) === 'png'
      ? await document.embedPng(bytes)
      : await document.embedJpg(bytes);
    const page = document.addPage(pageSize as [number, number]);
    page.drawRectangle({ x: 0, y: 0, width: pageSize[0], height: pageSize[1], color: pageColor });
    const availableWidth = pageSize[0] - margin * 2;
    const availableHeight = pageSize[1] - margin * 2;
    if (availableWidth <= 0 || availableHeight <= 0) throw new Error('Margin is too large for the selected page size');
    const imageRatio = embedded.width / embedded.height;
    const pageRatio = availableWidth / availableHeight;
    const scale = options.fit === 'cover'
      ? (imageRatio > pageRatio ? availableHeight / embedded.height : availableWidth / embedded.width)
      : (imageRatio > pageRatio ? availableWidth / embedded.width : availableHeight / embedded.height);
    const width = embedded.width * scale;
    const height = embedded.height * scale;
    page.drawImage(embedded, {
      x: (pageSize[0] - width) / 2,
      y: (pageSize[1] - height) / 2,
      width,
      height,
    });
    if (expectedFormat === 'png') warnings.push('PNG transparency is preserved where supported by the PDF format.');
  }

  const bytes = await document.save();
  const blob = new Blob([concreteBuffer(bytes)], { type: 'application/pdf' });
  return {
    output: { name: outputName(images, expectedFormat), blob, size: blob.size, pageCount: images.length },
    inputCount: images.length,
    warnings: [...new Set(warnings)],
  };
}