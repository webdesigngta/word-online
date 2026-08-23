import type { File } from '../../../core/document-engine/types/File';
import { isReadableFile } from './wordValidator';
import { DOCX_MIME, type ReadableFile, type WordOutput, type WordWarning } from './wordTypes';

export function outputName(sourceName: string, extension: string, requested?: string): string {
  const base = (requested ?? sourceName.replace(/\.[^.]+$/, '')).replace(/\.[^.]+$/, '').replace(/[\\/:*?"<>|]+/g, '').trim();
  return `${base || 'Untitled document'}.${extension}`;
}
export function asOutput(name: string, blob: Blob, type: string, metadata?: Record<string, unknown>): WordOutput {
  return { name, blob, size: blob.size, type, metadata };
}
export function isDocxArchive(data: ArrayBuffer): boolean { const bytes = new Uint8Array(data); return bytes.length >= 2 && bytes[0] === 0x50 && bytes[1] === 0x4b; }
export async function readFile(file: File): Promise<ArrayBuffer> { if (!isReadableFile(file)) throw new Error('Input file could not be read'); return file.arrayBuffer(); }
export function mammothWarnings(messages: readonly { message: string }[]): WordWarning[] { return messages.map((message) => ({ code: 'DOCX_CONVERSION_WARNING', message: message.message })); }
