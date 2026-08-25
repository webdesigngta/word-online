import type { PlatformToolDefinition } from './catalog';

const documentSuiteTools: readonly PlatformToolDefinition[] = [
  {
    id: 'odt-editor', route: '/odt-editor', name: 'ODT Editor', title: 'ODT Editor – Edit ODT Online',
    description: 'Open an ODT document, edit supported text content in your browser, and download a rebuilt ODT file.',
    eyebrow: 'ODT EDITOR', primaryIntent: 'Edit ODT files online', kind: 'editor', cluster: 'Document Format', priority: 'P2', stage: 'After Core',
    secondaryKeywords: ['edit odt online', 'online odt editor', 'openoffice document editor'], input: ['ODT'], output: ['ODT'], processor: 'shared-odt-html', launchState: 'live', indexable: true,
  },
  {
    id: 'odt-viewer', route: '/odt-viewer', name: 'ODT Viewer', title: 'ODT Viewer – View ODT Online',
    description: 'Open supported ODT text content in a clean read-only browser view without installing office software.',
    eyebrow: 'ODT VIEWER', primaryIntent: 'View ODT files online', kind: 'viewer', cluster: 'Document Format', priority: 'P2', stage: 'After Core',
    secondaryKeywords: ['view odt online', 'odt reader online', 'open odt file online'], input: ['ODT'], output: ['Preview'], processor: 'shared-odt-html', launchState: 'live', indexable: true,
  },
  {
    id: 'odt-to-pdf', route: '/odt-to-pdf', name: 'ODT to PDF', title: 'ODT to PDF – Convert ODT to PDF Online',
    description: 'Convert supported ODT text content to PDF directly in your browser with no desktop office app required.',
    eyebrow: 'ODT TO PDF', primaryIntent: 'Convert ODT to PDF', kind: 'converter', cluster: 'Document Format', priority: 'P2', stage: 'After Core',
    secondaryKeywords: ['convert odt to pdf', 'odt pdf converter', 'openoffice to pdf'], input: ['ODT'], output: ['PDF'], processor: 'odt-html-to-pdf', launchState: 'live', indexable: true,
  },
  {
    id: 'rtf-editor', route: '/rtf-editor', name: 'RTF Editor', title: 'RTF Editor – Edit RTF Online',
    description: 'Open an RTF document, edit supported rich-text content in your browser, and download an updated RTF file.',
    eyebrow: 'RTF EDITOR', primaryIntent: 'Edit RTF files online', kind: 'editor', cluster: 'Document Format', priority: 'P2', stage: 'After Core',
    secondaryKeywords: ['edit rtf online', 'online rtf editor', 'rich text editor rtf'], input: ['RTF'], output: ['RTF'], processor: 'shared-rtf-html', launchState: 'live', indexable: true,
  },
  {
    id: 'rtf-viewer', route: '/rtf-viewer', name: 'RTF Viewer', title: 'RTF Viewer – View RTF Online',
    description: 'Open supported RTF text and common inline formatting in a read-only browser viewer.',
    eyebrow: 'RTF VIEWER', primaryIntent: 'View RTF files online', kind: 'viewer', cluster: 'Document Format', priority: 'P2', stage: 'After Core',
    secondaryKeywords: ['view rtf online', 'rtf reader online', 'open rtf file online'], input: ['RTF'], output: ['Preview'], processor: 'shared-rtf-html', launchState: 'live', indexable: true,
  },
  {
    id: 'markdown-editor', route: '/markdown-editor', name: 'Markdown Editor', title: 'Markdown Editor – Edit Markdown Online',
    description: 'Write Markdown with a live browser preview, then download Markdown or convert the current document to DOCX.',
    eyebrow: 'MARKDOWN EDITOR', primaryIntent: 'Write and preview Markdown online', kind: 'editor', cluster: 'Markdown', priority: 'P2', stage: 'After Core',
    secondaryKeywords: ['markdown editor online', 'md editor', 'markdown preview editor'], input: ['Markdown', 'Text'], output: ['Markdown', 'DOCX', 'Preview'], processor: 'shared-markdown', launchState: 'live', indexable: true,
  },
  {
    id: 'markdown-to-docx', route: '/markdown-to-docx', name: 'Markdown to DOCX', title: 'Markdown to DOCX – Convert Markdown to Word',
    description: 'Convert Markdown headings, paragraphs, emphasis, lists, links, code, blockquotes, and simple tables into a DOCX file.',
    eyebrow: 'MARKDOWN TO DOCX', primaryIntent: 'Convert Markdown to DOCX', kind: 'converter', cluster: 'Markdown', priority: 'P2', stage: 'After Core',
    secondaryKeywords: ['markdown to word', 'md to docx', 'convert markdown to docx'], input: ['Markdown', 'Text'], output: ['DOCX'], processor: 'markdown-html-docx', launchState: 'live', indexable: true,
  },
  {
    id: 'docx-to-markdown', route: '/docx-to-markdown', name: 'DOCX to Markdown', title: 'DOCX to Markdown – Convert Word to Markdown',
    description: 'Convert supported DOCX document content into clean Markdown in your browser and download the result as an MD file.',
    eyebrow: 'DOCX TO MARKDOWN', primaryIntent: 'Convert DOCX to Markdown', kind: 'converter', cluster: 'Markdown', priority: 'P2', stage: 'After Core',
    secondaryKeywords: ['word to markdown', 'docx to md', 'convert docx to markdown'], input: ['DOCX'], output: ['Markdown'], processor: 'docx-html-markdown', launchState: 'live', indexable: true,
  },
  {
    id: 'speech-to-text-document', route: '/speech-to-text-document', name: 'Speech to Text', title: 'Speech to Text Document – Dictate Text Online',
    description: 'Dictate text with supported browser speech recognition, edit the transcript, copy it, or download it as a TXT document.',
    eyebrow: 'SPEECH TO TEXT', primaryIntent: 'Dictate a document with speech recognition', kind: 'accessibility', cluster: 'Accessibility', priority: 'P3', stage: 'Later',
    secondaryKeywords: ['speech to text document', 'voice typing online', 'dictation tool online'], input: ['Microphone'], output: ['Text', 'TXT'], processor: 'browser-speech-recognition', launchState: 'live', indexable: true,
  },
  {
    id: 'text-to-speech-document', route: '/text-to-speech-document', name: 'Text to Speech', title: 'Text to Speech Document – Read Text Aloud Online',
    description: 'Paste or type a document and have your browser read it aloud with pause, resume, stop, and playback-speed controls.',
    eyebrow: 'TEXT TO SPEECH', primaryIntent: 'Read document text aloud', kind: 'accessibility', cluster: 'Accessibility', priority: 'P3', stage: 'Later',
    secondaryKeywords: ['text to speech document', 'read text aloud online', 'document reader voice'], input: ['Text'], output: ['Speech', 'TXT'], processor: 'browser-speech-synthesis', launchState: 'live', indexable: true,
  },
];

export const liveDocumentSuiteTools = documentSuiteTools.filter((tool) => tool.launchState === 'live');
