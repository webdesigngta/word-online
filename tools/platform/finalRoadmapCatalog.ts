import type { PlatformToolDefinition } from './catalog';

const tools: readonly PlatformToolDefinition[] = [
  {
    id: 'doc-to-pdf', route: '/doc-to-pdf', name: 'DOC to PDF', title: 'DOC to PDF – Convert Word 97–2003 DOC to PDF',
    description: 'Recover readable content from a legacy Word 97–2003 DOC file in your browser and convert it into a downloadable PDF.',
    eyebrow: 'DOC TO PDF', primaryIntent: 'Convert DOC to PDF', kind: 'converter', cluster: 'Word Legacy', priority: 'P0', stage: 'Core',
    secondaryKeywords: ['doc to pdf', 'convert doc to pdf', 'word 2003 to pdf', 'old word file to pdf'], input: ['DOC'], output: ['PDF'], processor: 'browser-legacy-doc-to-pdf', launchState: 'live', indexable: true,
  },
  {
    id: 'doc-viewer', route: '/doc-viewer', name: 'DOC Viewer', title: 'DOC Viewer – Open Word 97–2003 DOC Online',
    description: 'Open supported legacy Word DOC files in a clean read-only browser view without installing Microsoft Word.',
    eyebrow: 'DOC VIEWER', primaryIntent: 'View DOC files online', kind: 'viewer', cluster: 'Word Legacy', priority: 'P1', stage: 'After Core',
    secondaryKeywords: ['doc viewer online', 'open doc online', 'view old word file'], input: ['DOC'], output: ['Preview'], processor: 'browser-legacy-doc-viewer', launchState: 'live', indexable: true,
  },
  {
    id: 'doc-to-docx', route: '/doc-to-docx', name: 'DOC to DOCX', title: 'DOC to DOCX – Convert Legacy Word DOC to DOCX',
    description: 'Recover readable Word 97–2003 DOC content and rebuild it as a modern editable DOCX file directly in your browser.',
    eyebrow: 'DOC TO DOCX', primaryIntent: 'Convert DOC to DOCX', kind: 'converter', cluster: 'Word Legacy', priority: 'P1', stage: 'After Core',
    secondaryKeywords: ['doc to docx', 'convert doc to docx', 'old word to docx'], input: ['DOC'], output: ['DOCX'], processor: 'browser-legacy-doc-to-docx', launchState: 'live', indexable: true,
  },
  {
    id: 'spell-checker', route: '/spell-checker', name: 'Spell Checker', title: 'Spell Checker – Check English Spelling Online',
    description: 'Review common English spelling mistakes locally, apply suggested corrections, and use your browser’s native spelling underlines for broader checking.',
    eyebrow: 'SPELL CHECKER', primaryIntent: 'Check spelling online', kind: 'editor', cluster: 'Writing', priority: 'P2', stage: 'After Core',
    secondaryKeywords: ['spell checker online', 'spelling checker', 'check spelling'], input: ['Text'], output: ['Text', 'TXT'], processor: 'browser-spelling-rules', launchState: 'live', indexable: true,
  },
  {
    id: 'grammar-checker', route: '/grammar-checker', name: 'Grammar Checker', title: 'Grammar Checker – Check Basic Grammar Online',
    description: 'Run a private rule-based review for repeated words, spacing, punctuation, capitalization, and common article issues.',
    eyebrow: 'GRAMMAR CHECKER', primaryIntent: 'Check grammar online', kind: 'editor', cluster: 'Writing', priority: 'P2', stage: 'After Core',
    secondaryKeywords: ['grammar checker online', 'check grammar', 'basic grammar checker'], input: ['Text'], output: ['Text', 'TXT'], processor: 'browser-grammar-rules', launchState: 'live', indexable: true,
  },
  {
    id: 'pptx-editor', route: '/pptx-editor', name: 'PPTX Editor', title: 'PPTX Editor – Edit PowerPoint Text Online',
    description: 'Import readable text from an existing PPTX, edit slide titles and bullets, and rebuild the result as a clean standard PPTX file.',
    eyebrow: 'PPTX EDITOR', primaryIntent: 'Edit PPTX online', kind: 'editor', cluster: 'PowerPoint', priority: 'P3', stage: 'Later',
    secondaryKeywords: ['pptx editor online', 'edit powerpoint online', 'edit pptx'], input: ['PPTX'], output: ['PPTX', 'Preview'], processor: 'browser-pptx-text-editor', launchState: 'live', indexable: true,
  },
  {
    id: 'pptx-viewer', route: '/pptx-viewer', name: 'PPTX Viewer', title: 'PPTX Viewer – View PowerPoint PPTX Online',
    description: 'Open a PPTX package locally and view recovered slide titles and paragraph text in a clean browser presentation view.',
    eyebrow: 'PPTX VIEWER', primaryIntent: 'View PPTX online', kind: 'viewer', cluster: 'PowerPoint', priority: 'P3', stage: 'Later',
    secondaryKeywords: ['pptx viewer online', 'view powerpoint online', 'open pptx'], input: ['PPTX'], output: ['Preview'], processor: 'browser-pptx-viewer', launchState: 'live', indexable: true,
  },
  {
    id: 'ppt-viewer', route: '/ppt-viewer', name: 'PPT Viewer', title: 'PPT Viewer – Open Legacy PowerPoint PPT Online',
    description: 'Recover and view readable content from supported PowerPoint 97–2003 PPT files directly in your browser.',
    eyebrow: 'PPT VIEWER', primaryIntent: 'View PPT files online', kind: 'viewer', cluster: 'PowerPoint', priority: 'P3', stage: 'Later',
    secondaryKeywords: ['ppt viewer online', 'open ppt online', 'view old powerpoint'], input: ['PPT'], output: ['Preview'], processor: 'browser-legacy-ppt-viewer', launchState: 'live', indexable: true,
  },
  {
    id: 'ppt-to-pdf', route: '/ppt-to-pdf', name: 'PowerPoint to PDF', title: 'PowerPoint to PDF – Convert PPT or PPTX to PDF',
    description: 'Convert recovered slide titles and bullets from PPTX or supported legacy PPT files into a static 16:9 PDF presentation.',
    eyebrow: 'POWERPOINT TO PDF', primaryIntent: 'Convert PowerPoint to PDF', kind: 'converter', cluster: 'PowerPoint', priority: 'P1', stage: 'After Core',
    secondaryKeywords: ['powerpoint to pdf', 'ppt to pdf', 'pptx to pdf', 'convert powerpoint to pdf'], input: ['PPT', 'PPTX'], output: ['PDF'], processor: 'browser-powerpoint-to-pdf', launchState: 'live', indexable: true,
  },
  {
    id: 'pdf-summarizer', route: '/pdf-summarizer', name: 'PDF Summarizer', title: 'PDF Summarizer – Extractive PDF Summary Online',
    description: 'Extract PDF text locally and create a source-grounded summary by ranking important existing sentences with page references.',
    eyebrow: 'PDF SUMMARIZER', primaryIntent: 'Summarize a PDF', kind: 'utility', cluster: 'AI PDF', priority: 'P3', stage: 'Later',
    secondaryKeywords: ['pdf summarizer', 'summarize pdf online', 'pdf summary tool'], input: ['PDF'], output: ['Summary', 'TXT'], processor: 'browser-extractive-pdf-summary', launchState: 'live', indexable: true,
  },
];

export const liveFinalRoadmapTools = tools.filter((tool) => tool.launchState === 'live');
