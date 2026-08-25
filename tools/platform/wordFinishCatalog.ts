import type { PlatformToolDefinition } from './catalog';

export const liveWordFinishTools: readonly PlatformToolDefinition[] = [
  {
    id: 'word-viewer', route: '/word-viewer', name: 'Word Viewer', title: 'Word Viewer – View Word Documents Online',
    description: 'Open DOCX, RTF, and ODT Word-compatible documents in a clean read-only browser viewer without changing the source file.',
    eyebrow: 'WORD VIEWER', primaryIntent: 'View Word documents online', kind: 'viewer', cluster: 'Word', priority: 'P1', stage: 'Next',
    secondaryKeywords: ['view word document online', 'online word file viewer', 'word document viewer', 'word viewer online'], input: ['DOCX', 'RTF', 'ODT'], output: ['Preview'], processor: 'word-compatible-viewer', launchState: 'live', indexable: true,
  },
  {
    id: 'add-page-numbers-word', route: '/add-page-numbers-word', name: 'Add Page Numbers to Word', title: 'Add Page Numbers to Word Online',
    description: 'Add a real Word PAGE field to DOCX footers with left, center, or right alignment while preserving the original document body.',
    eyebrow: 'WORD PAGE NUMBERS', primaryIntent: 'Add page numbers to Word online', kind: 'utility', cluster: 'Word', priority: 'P2', stage: 'After Core',
    secondaryKeywords: ['add page numbers to word online', 'insert page numbers word', 'page number word document'], input: ['DOCX'], output: ['DOCX'], processor: 'docx-ooxml-finish', launchState: 'live', indexable: true,
  },
  {
    id: 'add-signature-to-word', route: '/add-signature-to-word', name: 'Add Signature to Word', title: 'Add Signature to Word – Sign Word Documents Online',
    description: 'Insert a visible PNG or JPG signature image into a DOCX document and download a separate signed copy.',
    eyebrow: 'SIGN WORD DOCUMENT', primaryIntent: 'Add signature to Word document', kind: 'utility', cluster: 'Word', priority: 'P2', stage: 'After Core',
    secondaryKeywords: ['sign word document online', 'add signature to word', 'insert signature in word document'], input: ['DOCX', 'PNG', 'JPG'], output: ['DOCX'], processor: 'docx-ooxml-finish', launchState: 'live', indexable: true,
  },
  {
    id: 'add-watermark-word', route: '/add-watermark-word', name: 'Add Watermark to Word', title: 'Add Watermark to Word Online',
    description: 'Add light diagonal watermark text such as DRAFT or CONFIDENTIAL to a DOCX document through Word-compatible header markup.',
    eyebrow: 'WORD WATERMARK', primaryIntent: 'Add watermark to Word online', kind: 'utility', cluster: 'Word', priority: 'P2', stage: 'After Core',
    secondaryKeywords: ['add watermark to word online', 'watermark word document', 'insert watermark in word'], input: ['DOCX'], output: ['DOCX'], processor: 'docx-ooxml-finish', launchState: 'live', indexable: true,
  },
  {
    id: 'add-header-footer-word', route: '/add-header-footer-word', name: 'Add Header and Footer to Word', title: 'Add Header and Footer to Word Online',
    description: 'Add aligned header text, footer text, or both to a DOCX document while preserving existing default header and footer content.',
    eyebrow: 'WORD HEADER & FOOTER', primaryIntent: 'Add header and footer to Word online', kind: 'utility', cluster: 'Word', priority: 'P2', stage: 'After Core',
    secondaryKeywords: ['add header footer word online', 'add header to word document', 'add footer to word document'], input: ['DOCX'], output: ['DOCX'], processor: 'docx-ooxml-finish', launchState: 'live', indexable: true,
  },
  {
    id: 'redact-word-document', route: '/redact-word-document', name: 'Redact Word Document', title: 'Redact Word Document Online',
    description: 'Permanently replace specified text in DOCX document content, headers, footers, notes, and comments with redaction blocks.',
    eyebrow: 'WORD REDACTION', primaryIntent: 'Redact a Word document online', kind: 'utility', cluster: 'Word', priority: 'P2', stage: 'After Core',
    secondaryKeywords: ['redact word document online', 'redact docx', 'remove sensitive text from word'], input: ['DOCX', 'Redaction terms'], output: ['DOCX'], processor: 'docx-ooxml-finish', launchState: 'live', indexable: true,
  },
];
