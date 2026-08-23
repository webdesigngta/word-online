import type { PlatformTool } from '@/core/tool-system/toolTypes';

export const wordTool = {
  id: 'word-online',
  name: 'Word Online',
  route: '/word-online',
  category: 'document',
  description:
    'Open, edit, format, autosave, and export Word documents directly in the browser.',
  enabled: true,
} satisfies PlatformTool;

export const wordToolSeo = {
  title: 'Word Online – Free Browser Word Editor',
  description:
    'Use Word Online free in your browser. Open DOCX files, format documents, autosave locally, and export without creating an account.',
  path: wordTool.route,
} as const;

export const wordToolCapabilities = {
  import: ['docx', 'html', 'txt'],
  export: ['docx', 'html', 'pdf'],
  autosave: true,
  noLogin: true,
  browserFirst: true,
} as const;
