export type WordInterfaceKind = 'editor' | 'viewer' | 'converter' | 'analyzer' | 'utility';

export interface WordInterfaceDefinition {
  id: string;
  route: string;
  kind: WordInterfaceKind;
  name: string;
  title: string;
  description: string;
  eyebrow: string;
  primaryIntent: string;
  processor?: string;
  input: string[];
  output: string[];
  indexable: boolean;
}

export const wordInterfaces = [
  {
    id: 'word-online',
    route: '/word-online',
    kind: 'editor',
    name: 'Word Online',
    title: 'Word Online – Free Browser Word Editor',
    description: 'Use Word Online free in your browser. Open DOCX files, format documents, autosave locally, and export without creating an account.',
    eyebrow: 'WORD ONLINE',
    primaryIntent: 'Edit or create a Word document in the browser',
    input: ['docx', 'html', 'txt'],
    output: ['docx', 'html', 'pdf'],
    indexable: true,
  },
  {
    id: 'docx-editor',
    route: '/docx-editor',
    kind: 'editor',
    name: 'DOCX Editor',
    title: 'DOCX Editor Online – Edit Word Files Free',
    description: 'Open and edit DOCX files directly in your browser. Format text, add tables and images, autosave locally, and download a new DOCX copy.',
    eyebrow: 'DOCX EDITOR',
    primaryIntent: 'Open and edit a DOCX file',
    input: ['docx'],
    output: ['docx', 'html', 'pdf'],
    indexable: true,
  },
  {
    id: 'docx-viewer',
    route: '/docx-viewer',
    kind: 'viewer',
    name: 'DOCX Viewer',
    title: 'DOCX Viewer Online – Open Word Files Free',
    description: 'View DOCX files online without Microsoft Word. Upload a Word document and read it securely in your browser with no account required.',
    eyebrow: 'DOCX VIEWER',
    primaryIntent: 'Open and read a DOCX file without editing it',
    processor: 'docxViewerProcessor',
    input: ['docx'],
    output: ['browser-preview'],
    indexable: true,
  },
  {
    id: 'create-word-document',
    route: '/create-word-document',
    kind: 'editor',
    name: 'Create Word Document',
    title: 'Create a Word Document Online – Free DOCX Maker',
    description: 'Create a Word document online from a blank page or template, format it in your browser, and download the finished file as DOCX.',
    eyebrow: 'CREATE WORD DOCUMENT',
    primaryIntent: 'Create a new Word document from scratch',
    input: ['blank', 'templates'],
    output: ['docx', 'html', 'pdf'],
    indexable: true,
  },
  {
    id: 'word-to-pdf',
    route: '/word-to-pdf',
    kind: 'converter',
    name: 'Word to PDF',
    title: 'Word to PDF Converter – Convert DOCX to PDF Free',
    description: 'Convert Word documents to PDF in your browser. Upload a DOCX file, create a PDF, and download it without installing software.',
    eyebrow: 'WORD TO PDF',
    primaryIntent: 'Convert a DOCX Word document to PDF',
    processor: 'wordToPdfProcessor',
    input: ['docx'],
    output: ['pdf'],
    indexable: true,
  },
  {
    id: 'docx-to-pdf',
    route: '/docx-to-pdf',
    kind: 'converter',
    name: 'DOCX to PDF',
    title: 'DOCX to PDF Converter – Convert Word Files Free',
    description: 'Convert DOCX to PDF online in your browser. Upload a DOCX document and download a PDF copy with no account required.',
    eyebrow: 'DOCX TO PDF',
    primaryIntent: 'Convert a DOCX file to PDF',
    processor: 'wordToPdfProcessor',
    input: ['docx'],
    output: ['pdf'],
    indexable: true,
  },
  {
    id: 'word-count',
    route: '/word-count',
    kind: 'analyzer',
    name: 'Word Count',
    title: 'Word Count Online – Count Words & Characters Free',
    description: 'Count words, characters, sentences, paragraphs, headings and estimated reading time. Paste text or analyze a DOCX file in your browser.',
    eyebrow: 'WORD COUNT',
    primaryIntent: 'Count words and document statistics',
    processor: 'wordStatisticsProcessor',
    input: ['text', 'docx'],
    output: ['statistics'],
    indexable: true,
  },
  {
    id: 'merge-word-documents',
    route: '/merge-word-documents',
    kind: 'utility',
    name: 'Merge Word Documents',
    title: 'Merge Word Documents Online – Combine DOCX Files',
    description: 'Merge two or more DOCX files into one Word document online. Select files in order and download the combined DOCX file.',
    eyebrow: 'MERGE WORD DOCUMENTS',
    primaryIntent: 'Combine multiple DOCX documents into one file',
    processor: 'docxMergeProcessor',
    input: ['docx', 'docx+'],
    output: ['docx'],
    indexable: true,
  },
] as const satisfies readonly WordInterfaceDefinition[];

export type WordInterfaceId = (typeof wordInterfaces)[number]['id'];

export function getWordInterface(id: WordInterfaceId) {
  return wordInterfaces.find((item) => item.id === id)!;
}

export function getWordInterfaceByRoute(route: string) {
  return wordInterfaces.find((item) => item.route === route);
}
