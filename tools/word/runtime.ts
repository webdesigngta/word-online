'use client';

import {
  MAX_WORD_FILE_BYTES,
  exportWordDocumentDocx,
  exportWordDocumentHtml,
  openWordDocument,
  sanitizeWordFilename,
} from './client';
import {
  clearWordSession,
  createWordSession,
  loadWordSession,
  saveWordSession,
} from './state/wordSession';
import {
  clearWordDraft,
  loadWordDraft,
  migrateLegacyWordDraft,
  saveWordDraft,
} from './state/wordDraft';

export const wordRuntime = {
  files: {
    maxBytes: MAX_WORD_FILE_BYTES,
    open: openWordDocument,
    exportDocx: exportWordDocumentDocx,
    exportHtml: exportWordDocumentHtml,
    sanitizeFilename: sanitizeWordFilename,
  },
  session: {
    create: createWordSession,
    load: loadWordSession,
    save: saveWordSession,
    clear: clearWordSession,
  },
  draft: {
    load: loadWordDraft,
    save: saveWordDraft,
    clear: clearWordDraft,
    migrateLegacy: migrateLegacyWordDraft,
  },
} as const;

export type WordRuntime = typeof wordRuntime;
