import { wordInterfaces } from '@/tools/word/interfaces/config';

export type ToolLaunchState = 'live' | 'qa' | 'planned';
export type ToolPriority = 'P0' | 'P1' | 'P2' | 'P3';
export type PlatformToolKind =
  | 'editor'
  | 'viewer'
  | 'converter'
  | 'analyzer'
  | 'utility'
  | 'creator'
  | 'text'
  | 'ocr'
  | 'pdf'
  | 'spreadsheet'
  | 'presentation'
  | 'language'
  | 'accessibility';

export interface PlatformToolDefinition {
  id: string;
  route: string;
  name: string;
  title: string;
  description: string;
  eyebrow: string;
  primaryIntent: string;
  kind: PlatformToolKind;
  cluster: string;
  priority: ToolPriority;
  stage: string;
  secondaryKeywords: readonly string[];
  input: readonly string[];
  output: readonly string[];
  processor?: string;
  launchState: ToolLaunchState;
  indexable: boolean;
}

type LiveTextToolDefinition = Omit<
  PlatformToolDefinition,
  'launchState' | 'indexable' | 'processor'
>;

const priorityByWordRoute: Record<string, ToolPriority> = {
  '/word-online': 'P0',
  '/docx-editor': 'P0',
  '/docx-viewer': 'P0',
  '/word-to-pdf': 'P0',
  '/docx-to-pdf': 'P0',
  '/create-word-document': 'P1',
  '/word-count': 'P1',
  '/merge-word-documents': 'P1',
  '/compress-docx': 'P1',
  '/compare-word-documents': 'P1',
  '/repair-docx': 'P1',
  '/split-word-document': 'P1',
  '/extract-docx-images': 'P1',
  '/word-document-info': 'P1',
  '/remove-word-metadata': 'P1',
};

const keywordMap: Record<string, readonly string[]> = {
  '/word-online': ['online word editor', 'word editor online', 'free word editor', 'word document online'],
  '/word-to-pdf': ['word to pdf converter', 'convert word to pdf', 'word doc to pdf'],
  '/docx-to-pdf': ['convert docx to pdf', 'docx to pdf converter'],
  '/docx-editor': ['edit docx online', 'docx editor online', 'online docx editor'],
  '/docx-viewer': ['docx viewer online', 'view docx online', 'docx reader online'],
};

const liveWordTools: PlatformToolDefinition[] = wordInterfaces.map((tool) => ({
  id: tool.id,
  route: tool.route,
  name: tool.name,
  title: tool.title,
  description: tool.description,
  eyebrow: tool.eyebrow,
  primaryIntent: tool.primaryIntent,
  kind: tool.kind,
  cluster: tool.kind === 'converter' ? 'Converter' : tool.kind === 'viewer' ? 'Viewer' : tool.kind === 'editor' ? 'Editor' : 'Utility',
  priority: priorityByWordRoute[tool.route] ?? 'P2',
  stage: priorityByWordRoute[tool.route] === 'P0' ? 'Now' : 'After Core',
  secondaryKeywords: keywordMap[tool.route] ?? [],
  input: tool.input,
  output: tool.output,
  processor: tool.processor,
  launchState: 'live',
  indexable: tool.indexable,
}));

const liveTextTools: LiveTextToolDefinition[] = [
  {
    id: 'online-notepad',
    route: '/online-notepad',
    name: 'Online Notepad',
    title: 'Online Notepad – Free Text Editor',
    description: 'Write notes in a fast browser notepad with local autosave, word and character counts, copy, clear, and TXT download.',
    eyebrow: 'ONLINE NOTEPAD',
    primaryIntent: 'Write and save plain-text notes online',
    kind: 'text',
    cluster: 'Text',
    priority: 'P1',
    stage: 'Next',
    secondaryKeywords: ['notepad online', 'notes online', 'online text editor', 'text editor online'],
    input: ['text'],
    output: ['txt', 'clipboard'],
  },
  {
    id: 'character-count',
    route: '/character-count',
    name: 'Character Count',
    title: 'Character Count – Free Online Character Counter',
    description: 'Count characters, characters without spaces, words, lines, and paragraphs instantly in your browser.',
    eyebrow: 'CHARACTER COUNT',
    primaryIntent: 'Count characters and basic text statistics',
    kind: 'text',
    cluster: 'Text Utility',
    priority: 'P1',
    stage: 'Next',
    secondaryKeywords: ['character counter', 'character counter online', 'character count online', 'count characters'],
    input: ['text'],
    output: ['statistics'],
  },
  {
    id: 'change-text-case',
    route: '/change-text-case',
    name: 'Change Text Case',
    title: 'Change Text Case Online',
    description: 'Convert text to uppercase, lowercase, title case, or sentence case instantly in your browser.',
    eyebrow: 'CHANGE TEXT CASE',
    primaryIntent: 'Change capitalization and letter case',
    kind: 'text',
    cluster: 'Text Utility',
    priority: 'P2',
    stage: 'After Core',
    secondaryKeywords: ['uppercase lowercase converter', 'title case converter', 'sentence case converter'],
    input: ['text'],
    output: ['text', 'clipboard'],
  },
  {
    id: 'find-and-replace',
    route: '/find-and-replace',
    name: 'Find and Replace Online',
    title: 'Find and Replace Online – Replace Text Instantly',
    description: 'Find and replace words or phrases in text with literal, browser-based replacement tools.',
    eyebrow: 'FIND AND REPLACE',
    primaryIntent: 'Find text and replace matching words or phrases',
    kind: 'text',
    cluster: 'Text Utility',
    priority: 'P2',
    stage: 'After Core',
    secondaryKeywords: ['find and replace text online', 'replace text online', 'find replace tool'],
    input: ['text'],
    output: ['text', 'clipboard'],
  },
  {
    id: 'remove-formatting',
    route: '/remove-formatting',
    name: 'Remove Formatting',
    title: 'Remove Formatting – Clear Text Formatting Online',
    description: 'Paste formatted content into a plain-text workspace to strip styling, then copy or download the cleaned text.',
    eyebrow: 'REMOVE FORMATTING',
    primaryIntent: 'Remove formatting and keep plain text only',
    kind: 'text',
    cluster: 'Text Utility',
    priority: 'P2',
    stage: 'After Core',
    secondaryKeywords: ['remove text formatting online', 'clear formatting online', 'strip text formatting'],
    input: ['text'],
    output: ['text', 'clipboard', 'txt'],
  },
  {
    id: 'remove-duplicate-lines',
    route: '/remove-duplicate-lines',
    name: 'Remove Duplicate Lines',
    title: 'Remove Duplicate Lines Online',
    description: 'Remove repeated lines while preserving the first occurrence and original line order.',
    eyebrow: 'REMOVE DUPLICATE LINES',
    primaryIntent: 'Remove duplicate lines from text',
    kind: 'text',
    cluster: 'Text Utility',
    priority: 'P3',
    stage: 'Later',
    secondaryKeywords: ['deduplicate lines', 'remove duplicate text lines'],
    input: ['text'],
    output: ['text', 'clipboard'],
  },
  {
    id: 'sort-text',
    route: '/sort-text',
    name: 'Sort Text',
    title: 'Sort Text Online – Sort Lines Alphabetically',
    description: 'Sort text lines alphabetically A–Z or Z–A while keeping one line per item.',
    eyebrow: 'SORT TEXT',
    primaryIntent: 'Sort lines of text alphabetically',
    kind: 'text',
    cluster: 'Text Utility',
    priority: 'P3',
    stage: 'Later',
    secondaryKeywords: ['sort text lines online', 'alphabetize lines', 'sort lines online'],
    input: ['text'],
    output: ['text', 'clipboard'],
  },
];

export const platformTools: readonly PlatformToolDefinition[] = [
  ...liveWordTools,
  ...liveTextTools.map((tool) => ({
    ...tool,
    launchState: 'live' as const,
    indexable: true,
  })),
];

export const livePlatformTools = platformTools.filter(
  (tool) => tool.launchState === 'live' && tool.indexable,
);

export function getPlatformTool(id: string) {
  return platformTools.find((tool) => tool.id === id);
}

export function getPlatformToolByRoute(route: string) {
  const normalized = route !== '/' ? route.replace(/\/$/, '') : route;
  return platformTools.find((tool) => tool.route === normalized);
}

export function isPlatformToolIndexable(tool: PlatformToolDefinition) {
  return tool.launchState === 'live' && tool.indexable;
}
