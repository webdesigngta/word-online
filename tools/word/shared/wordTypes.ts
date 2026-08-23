import type { File } from '../../../core/document-engine/types/File';

export const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
export const DOCX_OUTPUT_TYPE = DOCX_MIME;
export const TEXT_OUTPUT_TYPE = 'text/plain';
export const HTML_OUTPUT_TYPE = 'text/html';
export const MAX_WORD_INPUT_BYTES = 25 * 1024 * 1024;

export interface WordSource { name: string; size: number; type?: string; lastModified?: number; }
export interface WordWarning { code: string; message: string; }
export interface WordError { code: string; message: string; }
export interface WordOutput { name: string; blob: Blob; size: number; type: string; metadata?: Record<string, unknown>; }
export interface WordResult { success: boolean; source?: WordSource; outputSize: number; output?: WordOutput; warnings: WordWarning[]; errors: WordError[]; metadata?: Record<string, unknown>; }
export type ReadableFile = File & { arrayBuffer(): Promise<ArrayBuffer> };

export function sourceOf(file: File): WordSource { return { name: file.name, size: file.size, type: file.type, lastModified: file.lastModified }; }
export function isSingleFile(input: File | readonly File[]): input is File { return 'size' in input; }
