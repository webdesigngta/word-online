import { storageService } from '@/core/storage/storageService';
import { recordWordHistorySnapshot } from './wordHistory';

const WORD_DRAFT_KEY = 'word-online:draft:v2';
const LEGACY_WORD_DRAFT_KEY = 'free-word-online:draft:v1';

export interface WordDraft {
  version: 2;
  title: string;
  html: string;
  updatedAt: number;
}

export async function saveWordDraft(input: { title: string; html: string }): Promise<WordDraft> {
  const draft: WordDraft = {
    version: 2,
    title: input.title.trim() || 'Untitled document',
    html: input.html || '<p><br></p>',
    updatedAt: Date.now(),
  };

  await storageService.save(WORD_DRAFT_KEY, draft);
  await recordWordHistorySnapshot(draft);
  return draft;
}

export async function loadWordDraft(): Promise<WordDraft | null> {
  return storageService.load<WordDraft>(WORD_DRAFT_KEY);
}

export async function clearWordDraft(): Promise<void> {
  await storageService.remove(WORD_DRAFT_KEY);
}

/**
 * One-way migration bridge for drafts created before the platform storage
 * layer existed. Keeping the legacy key knowledge here prevents it from
 * leaking into future editor implementations.
 */
export async function migrateLegacyWordDraft(): Promise<WordDraft | null> {
  const current = await loadWordDraft();
  if (current) return current;
  if (typeof window === 'undefined') return null;

  const legacyHtml = window.localStorage.getItem(LEGACY_WORD_DRAFT_KEY);
  if (!legacyHtml) return null;

  return saveWordDraft({
    title: 'Untitled document',
    html: legacyHtml,
  });
}
