import { createDocument, type DocumentModel } from '@/core/documents/documentModel';
import { storageService } from '@/core/storage/storageService';

const WORD_SESSION_KEY = 'word-online:session:v1';

export interface WordSession {
  document: DocumentModel;
  autosave: boolean;
  lastOpenedAt: number;
}

export function createWordSession(name = 'Document.docx'): WordSession {
  return {
    document: createDocument(name, 'docx'),
    autosave: true,
    lastOpenedAt: Date.now(),
  };
}

export async function saveWordSession(session: WordSession): Promise<void> {
  await storageService.save(WORD_SESSION_KEY, session);
}

export async function loadWordSession(): Promise<WordSession | null> {
  return storageService.load<WordSession>(WORD_SESSION_KEY);
}

export async function clearWordSession(): Promise<void> {
  await storageService.remove(WORD_SESSION_KEY);
}
