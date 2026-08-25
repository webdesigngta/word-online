import type { PlatformToolDefinition } from './catalog';

export const livePdfStampTools: readonly PlatformToolDefinition[] = [
  {
    id: 'sign-pdf', route: '/sign-pdf', name: 'Sign PDF',
    title: 'Sign PDF – Add a Signature Online',
    description: 'Add a visible PNG or JPG signature image to a selected PDF page and download a new signed copy in your browser.',
    eyebrow: 'SIGN PDF', primaryIntent: 'Add a visible signature to a PDF', kind: 'pdf', cluster: 'PDF', priority: 'P2', stage: 'PDF Expansion',
    secondaryKeywords: ['sign pdf', 'sign pdf online', 'add signature to pdf', 'pdf signature'],
    input: ['pdf', 'png', 'jpg'], output: ['pdf'], processor: 'pdfEditorProcessor', launchState: 'live', indexable: true,
  },
  {
    id: 'watermark-pdf', route: '/watermark-pdf', name: 'Watermark PDF',
    title: 'Watermark PDF – Add Watermark Online',
    description: 'Add a centered text watermark to every PDF page, control opacity and text size, and download a new watermarked PDF.',
    eyebrow: 'WATERMARK PDF', primaryIntent: 'Add a text watermark to PDF pages', kind: 'pdf', cluster: 'PDF', priority: 'P2', stage: 'PDF Expansion',
    secondaryKeywords: ['watermark pdf', 'add watermark to pdf', 'pdf watermark', 'watermark pdf online'],
    input: ['pdf'], output: ['pdf'], processor: 'pdfEditorProcessor', launchState: 'live', indexable: true,
  },
  {
    id: 'number-pdf-pages', route: '/number-pdf-pages', name: 'Add Page Numbers to PDF',
    title: 'Add Page Numbers to PDF Online',
    description: 'Add sequential page numbers to a PDF and choose top or bottom left, center, or right placement before downloading the numbered copy.',
    eyebrow: 'NUMBER PDF PAGES', primaryIntent: 'Add page numbers to every page in a PDF', kind: 'pdf', cluster: 'PDF', priority: 'P2', stage: 'PDF Expansion',
    secondaryKeywords: ['add page numbers to pdf', 'number pdf pages', 'insert page numbers pdf', 'page numbers pdf'],
    input: ['pdf'], output: ['pdf'], processor: 'pdfEditorProcessor', launchState: 'live', indexable: true,
  },
];
