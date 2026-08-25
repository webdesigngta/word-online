import type { PlatformToolDefinition } from './catalog';

export const livePdfPageTools: readonly PlatformToolDefinition[] = [
  {
    id: 'rotate-pdf', route: '/rotate-pdf', name: 'Rotate PDF',
    title: 'Rotate PDF – Rotate PDF Pages Online',
    description: 'Rotate all PDF pages or a selected set of pages by 90, 180, or 270 degrees directly in your browser.',
    eyebrow: 'ROTATE PDF', primaryIntent: 'Rotate PDF pages', kind: 'pdf', cluster: 'PDF', priority: 'P2', stage: 'PDF Expansion',
    secondaryKeywords: ['rotate pdf pages', 'turn pdf pages', 'rotate pdf online'], input: ['pdf'], output: ['pdf'], processor: 'pdfEditorProcessor', launchState: 'live', indexable: true,
  },
  {
    id: 'delete-pdf-pages', route: '/delete-pdf-pages', name: 'Delete PDF Pages',
    title: 'Delete PDF Pages – Remove Pages from PDF Online',
    description: 'Remove selected pages from a PDF in your browser and download a new PDF containing the pages you kept.',
    eyebrow: 'DELETE PDF PAGES', primaryIntent: 'Delete selected pages from a PDF', kind: 'pdf', cluster: 'PDF', priority: 'P2', stage: 'PDF Expansion',
    secondaryKeywords: ['remove pages from pdf', 'delete page from pdf', 'remove pdf pages'], input: ['pdf'], output: ['pdf'], processor: 'pdfEditorProcessor', launchState: 'live', indexable: true,
  },
  {
    id: 'extract-pdf-pages', route: '/extract-pdf-pages', name: 'Extract PDF Pages',
    title: 'Extract PDF Pages – Save Selected PDF Pages Online',
    description: 'Extract selected pages from a PDF and save them as a new PDF while leaving the original file unchanged.',
    eyebrow: 'EXTRACT PDF PAGES', primaryIntent: 'Extract selected pages from a PDF', kind: 'pdf', cluster: 'PDF', priority: 'P2', stage: 'PDF Expansion',
    secondaryKeywords: ['save pages from pdf', 'extract page from pdf', 'extract pages from pdf'], input: ['pdf'], output: ['pdf'], processor: 'pdfEditorProcessor', launchState: 'live', indexable: true,
  },
  {
    id: 'organize-pdf', route: '/organize-pdf', name: 'Organize PDF',
    title: 'Organize PDF – Reorder PDF Pages Online',
    description: 'Reorder every page in a PDF by entering the new page sequence, then download the reorganized document.',
    eyebrow: 'ORGANIZE PDF', primaryIntent: 'Reorder PDF pages', kind: 'pdf', cluster: 'PDF', priority: 'P2', stage: 'PDF Expansion',
    secondaryKeywords: ['reorder pdf pages', 'arrange pdf pages', 'organize pdf pages'], input: ['pdf'], output: ['pdf'], processor: 'pdfEditorProcessor', launchState: 'live', indexable: true,
  },
];
