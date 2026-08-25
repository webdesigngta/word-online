import type { PlatformToolDefinition } from './catalog';

export const liveRemainingRoadmapTools: readonly PlatformToolDefinition[] = [
  {
    id: 'doc-editor', route: '/doc-editor', name: 'DOC Editor', title: 'DOC Editor – Edit Word 97–2003 DOC Online',
    description: 'Recover readable text from a supported legacy DOC file, edit it locally, and download a Word-compatible DOC without running macros.',
    eyebrow: 'DOC EDITOR', primaryIntent: 'Edit DOC online', kind: 'editor', cluster: 'Word Legacy', priority: 'P1', stage: 'After Core',
    secondaryKeywords: ['doc editor online', 'edit doc file online', 'word 2003 editor'], input: ['DOC'], output: ['DOC', 'Preview'], processor: 'browser-legacy-doc-editor', launchState: 'live', indexable: true,
  },
  {
    id: 'docx-to-doc', route: '/docx-to-doc', name: 'DOCX to DOC', title: 'DOCX to DOC – Convert DOCX to Word DOC Online',
    description: 'Convert supported DOCX content locally into a Microsoft Word-compatible .doc file using HTML packaging.',
    eyebrow: 'DOCX TO DOC', primaryIntent: 'Convert DOCX to DOC', kind: 'converter', cluster: 'Word Legacy', priority: 'P1', stage: 'After Core',
    secondaryKeywords: ['docx to doc', 'convert docx to doc', 'word docx to doc'], input: ['DOCX'], output: ['DOC'], processor: 'browser-docx-to-word-html-doc', launchState: 'live', indexable: true,
  },
  {
    id: 'protect-word-document', route: '/protect-word-document', name: 'Protect Word Document', title: 'Protect Word Document – Restrict DOCX Editing Online',
    description: 'Apply a standard OOXML read-only editing restriction to a DOCX file locally in your browser without encrypting the file.',
    eyebrow: 'PROTECT WORD', primaryIntent: 'Protect Word document', kind: 'utility', cluster: 'Word Security', priority: 'P2', stage: 'After Core',
    secondaryKeywords: ['protect word document', 'make docx read only', 'restrict word editing'], input: ['DOCX'], output: ['DOCX'], processor: 'browser-docx-document-protection', launchState: 'live', indexable: true,
  },
  {
    id: 'unlock-word-document', route: '/unlock-word-document', name: 'Unlock Word Document', title: 'Unlock Word Document – Remove DOCX Editing Restriction',
    description: 'Remove standard OOXML documentProtection editing restrictions from supported DOCX files without bypassing password-to-open encryption.',
    eyebrow: 'UNLOCK WORD', primaryIntent: 'Unlock Word document', kind: 'utility', cluster: 'Word Security', priority: 'P2', stage: 'After Core',
    secondaryKeywords: ['unlock word document', 'remove docx protection', 'remove word editing restriction'], input: ['DOCX'], output: ['DOCX'], processor: 'browser-docx-remove-document-protection', launchState: 'live', indexable: true,
  },
  {
    id: 'pdf-to-pdfa', route: '/pdf-to-pdfa', name: 'PDF to PDF/A', title: 'PDF to PDF/A – Create Archival PDF/A-2B Online',
    description: 'Flatten PDF pages into a clean visual archive and apply PDF/A-2B metadata, document ID, and sRGB output intent in the browser.',
    eyebrow: 'PDF TO PDF/A', primaryIntent: 'Convert PDF to PDF/A', kind: 'converter', cluster: 'PDF Archival', priority: 'P2', stage: 'After Core',
    secondaryKeywords: ['pdf to pdfa', 'convert pdf to pdf a', 'pdf a converter', 'archival pdf'], input: ['PDF'], output: ['PDF/A-2B'], processor: 'browser-raster-pdfa2b', launchState: 'live', indexable: true,
  },
  {
    id: 'translate-pdf', route: '/translate-pdf', name: 'Translate PDF', title: 'Translate PDF – Translate PDF Text Online',
    description: 'Extract selectable PDF text locally and translate it using an on-device browser translator or private browser-model fallback for supported language pairs.',
    eyebrow: 'TRANSLATE PDF', primaryIntent: 'Translate a PDF', kind: 'utility', cluster: 'AI PDF', priority: 'P3', stage: 'Later',
    secondaryKeywords: ['translate pdf', 'pdf translator', 'translate pdf online', 'document translator'], input: ['PDF'], output: ['Translated text', 'TXT', 'PDF'], processor: 'browser-pdf-translation', launchState: 'live', indexable: true,
  },
  {
    id: 'chat-with-pdf', route: '/chat-with-pdf', name: 'Chat with PDF', title: 'Chat with PDF – Ask Questions About a PDF',
    description: 'Ask questions about selectable PDF text and receive source-grounded passage answers with page references using local retrieval.',
    eyebrow: 'CHAT WITH PDF', primaryIntent: 'Chat with a PDF', kind: 'utility', cluster: 'AI PDF', priority: 'P3', stage: 'Later',
    secondaryKeywords: ['chat with pdf', 'ask pdf questions', 'pdf chat', 'talk to pdf'], input: ['PDF', 'Question'], output: ['Answer', 'Page references'], processor: 'browser-pdf-retrieval-chat', launchState: 'live', indexable: true,
  },
];
