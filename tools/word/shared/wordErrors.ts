import type { WordError, WordResult, WordSource, WordWarning } from './wordTypes';

export function wordError(code: string, message: string): WordError { return { code, message }; }
export function wordWarning(code: string, message: string): WordWarning { return { code, message }; }
export function failed(source: WordSource, code: string, message: string, warnings: WordWarning[] = []): WordResult {
  return { success: false, source, outputSize: 0, warnings, errors: [wordError(code, message)] };
}
export function caught(source: WordSource, code: string, error: unknown, warnings: WordWarning[] = []): WordResult {
  return failed(source, code, error instanceof Error ? error.message : 'Word conversion failed', warnings);
}
