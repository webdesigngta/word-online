import type { PlatformToolDefinition } from './catalog';

export const liveOfficeExpansionTools: readonly PlatformToolDefinition[] = [
  {
    id: 'pdf-to-excel', route: '/pdf-to-excel', name: 'PDF to Excel', title: 'PDF to Excel – Convert PDF to XLSX',
    description: 'Extract positioned text from PDF pages into a real XLSX workbook with one worksheet per page, directly in your browser.',
    eyebrow: 'PDF TO EXCEL', primaryIntent: 'Convert PDF to Excel XLSX', kind: 'converter', cluster: 'PDF', priority: 'P1', stage: 'PDF Expansion',
    secondaryKeywords: ['pdf to excel', 'convert pdf to excel', 'pdf to xlsx', 'pdf excel converter'], input: ['PDF'], output: ['XLSX'], processor: 'pdf-text-to-xlsx', launchState: 'live', indexable: true,
  },
  {
    id: 'pdf-to-ppt', route: '/pdf-to-ppt', name: 'PDF to PowerPoint', title: 'PDF to PowerPoint – Convert PDF to PPTX',
    description: 'Convert each PDF page into a high-resolution visual PowerPoint slide and download a real PPTX presentation.',
    eyebrow: 'PDF TO POWERPOINT', primaryIntent: 'Convert PDF to PowerPoint PPTX', kind: 'converter', cluster: 'PDF', priority: 'P1', stage: 'PDF Expansion',
    secondaryKeywords: ['pdf to ppt', 'pdf to powerpoint', 'convert pdf to powerpoint', 'pdf to pptx'], input: ['PDF'], output: ['PPTX'], processor: 'pdf-pages-to-pptx', launchState: 'live', indexable: true,
  },
  {
    id: 'epub-to-pdf', route: '/epub-to-pdf', name: 'EPUB to PDF', title: 'EPUB to PDF – Convert eBooks to PDF',
    description: 'Convert standard reflowable EPUB books to paginated PDF in your browser by following the ebook reading order and embedding local chapter images.',
    eyebrow: 'EPUB TO PDF', primaryIntent: 'Convert EPUB ebook to PDF', kind: 'converter', cluster: 'PDF', priority: 'P3', stage: 'PDF Expansion',
    secondaryKeywords: ['epub to pdf', 'convert epub to pdf', 'ebook to pdf'], input: ['EPUB'], output: ['PDF'], processor: 'epub-spine-html-to-pdf', launchState: 'live', indexable: true,
  },
  {
    id: 'presentation-maker', route: '/presentation-maker', name: 'Presentation Maker', title: 'Presentation Maker – Create Presentations Online',
    description: 'Turn a structured slide outline into a clean title-and-bullet presentation, preview the slides, and download a real PPTX file.',
    eyebrow: 'PRESENTATION MAKER', primaryIntent: 'Create a presentation online', kind: 'creator', cluster: 'Presentation', priority: 'P3', stage: 'Future Platform',
    secondaryKeywords: ['make presentation online', 'presentation maker', 'create presentation online'], input: ['Text outline'], output: ['PPTX'], processor: 'simple-pptx-writer', launchState: 'live', indexable: true,
  },
  {
    id: 'powerpoint-online', route: '/powerpoint-online', name: 'PowerPoint Online', title: 'PowerPoint Online – Edit Presentations in Your Browser',
    description: 'Create and manually edit lightweight title-and-bullet slides in your browser, preview the deck, and export it as a PPTX file.',
    eyebrow: 'POWERPOINT ONLINE', primaryIntent: 'Create and edit presentation slides online', kind: 'editor', cluster: 'Presentation', priority: 'P3', stage: 'Future Platform',
    secondaryKeywords: ['edit presentation online', 'online powerpoint editor', 'presentation editor online'], input: ['Blank slides'], output: ['PPTX'], processor: 'simple-pptx-writer', launchState: 'live', indexable: true,
  },
];
