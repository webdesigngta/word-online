import { storageService } from '@/core/storage/storageService';

const WORD_HISTORY_KEY = 'word-online:history:v1';
const MAX_HISTORY_SNAPSHOTS = 20;
const SNAPSHOT_BUCKET_MS = 60_000;

export interface WordHistorySnapshot {
  id: string;
  title: string;
  html: string;
  createdAt: number;
}

function createSnapshot(input: { title: string; html: string; updatedAt: number }): WordHistorySnapshot {
  return {
    id: `${input.updatedAt}-${Math.random().toString(36).slice(2, 9)}`,
    title: input.title.trim() || 'Untitled document',
    html: input.html || '<p><br></p>',
    createdAt: input.updatedAt,
  };
}

export async function listWordHistory(): Promise<WordHistorySnapshot[]> {
  const value = await storageService.load<WordHistorySnapshot[]>(WORD_HISTORY_KEY);
  if (!Array.isArray(value)) return [];
  return value
    .filter((snapshot) => snapshot && typeof snapshot.html === 'string' && typeof snapshot.createdAt === 'number')
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, MAX_HISTORY_SNAPSHOTS);
}

export async function recordWordHistorySnapshot(input: {
  title: string;
  html: string;
  updatedAt: number;
}): Promise<void> {
  if (typeof window === 'undefined') return;

  const history = await listWordHistory();
  const latest = history[0];

  if (latest && latest.title === input.title && latest.html === input.html) return;

  const snapshot = createSnapshot(input);
  let next: WordHistorySnapshot[];

  if (latest && input.updatedAt - latest.createdAt < SNAPSHOT_BUCKET_MS) {
    next = [snapshot, ...history.slice(1)];
  } else {
    next = [snapshot, ...history];
  }

  await storageService.save(WORD_HISTORY_KEY, next.slice(0, MAX_HISTORY_SNAPSHOTS));
}

export async function clearWordHistory(): Promise<void> {
  await storageService.remove(WORD_HISTORY_KEY);
}
