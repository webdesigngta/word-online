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
    id: 'word-online', route: '/word-online', kind: 'editor', name: 'Word Online',
    title: 'Word Online – Free Browser Word Editor',
    description: 'Use Word Online free in your browser. Open DOCX files, format documents, autosave locally, and export without creating an account.',
    eyebrow: 'WORD ONLINE', primaryIntent: 'Edit or create a Word document in the browser',
    input: ['docx', 'html', 'txt'], output: ['docx', 'html', 'pdf'], indexable: true,
  },
  {
    id: 'docx-editor', route: '/docx-editor', kind: 'editor', name: 'DOCX Editor',
    title: 'DOCX Editor Online – Edit Word Files Free',
    description: 'Open and edit DOCX files directly in your browser. Format text, add tables and images, autosave locally, and download a new DOCX copy.',
    eyebrow: 'DOCX EDITOR', primaryIntent: 'Open and edit a DOCX file',
    input: ['docx'], output: ['docx', 'html', 'pdf'], indexable: true,
  },
  {
    id: 'docx-viewer', route: '/docx-viewer', kind: 'viewer', name: 'DOCX Viewer',
    title: 'DOCX Viewer Online – Open Word Files Free',
    description: 'View DOCX files online without Microsoft Word. Upload a Word document and read it securely in your browser with no account required.',
    eyebrow: 'DOCX VIEWER', primaryIntent: 'Open and read a DOCX file without editing it', processor: 'docxViewerProcessor',
    input: ['docx'], output: ['browser-preview'], indexable: true,
  },
  {
    id: 'create-word-document', route: '/create-word-document', kind: 'editor', name: 'Create Word Document',
    title: 'Create a Word Document Online – Free DOCX Maker',
    description: 'Create a Word document online from a blank page or template, format it in your browser, and download the finished file as DOCX.',
    eyebrow: 'CREATE WORD DOCUMENT', primaryIntent: 'Create a new Word document from scratch',
    input: ['blank', 'templates'], output: ['docx', 'html', 'pdf'], indexable: true,
  },
  {
    id: 'word-to-pdf', route: '/word-to-pdf', kind: 'converter', name: 'Word to PDF',
    title: 'Word to PDF Converter – Convert DOCX to PDF Free',
    description: 'Convert Word documents to PDF in your browser. Upload a DOCX file, create a PDF, and download it without installing software.',
    eyebrow: 'WORD TO PDF', primaryIntent: 'Convert a DOCX Word document to PDF', processor: 'wordToPdfProcessor',
    input: ['docx'], output: ['pdf'], indexable: true,
  },
  {
    id: 'docx-to-pdf', route: '/docx-to-pdf', kind: 'converter', name: 'DOCX to PDF',
    title: 'DOCX to PDF Converter – Convert Word Files Free',
    description: 'Convert DOCX to PDF online in your browser. Upload a DOCX document and download a PDF copy with no account required.',
    eyebrow: 'DOCX TO PDF', primaryIntent: 'Convert a DOCX file to PDF', processor: 'wordToPdfProcessor',
    input: ['docx'], output: ['pdf'], indexable: true,
  },
  {
    id: 'word-count', route: '/word-count', kind: 'analyzer', name: 'Word Count',
    title: 'Word Count Online – Count Words & Characters Free',
    description: 'Count words, characters, sentences, paragraphs, headings and estimated reading time. Paste text or analyze a DOCX file in your browser.',
    eyebrow: 'WORD COUNT', primaryIntent: 'Count words and document statistics', processor: 'wordStatisticsProcessor',
    input: ['text', 'docx'], output: ['statistics'], indexable: true,
  },
  {
    id: 'merge-word-documents', route: '/merge-word-documents', kind: 'utility', name: 'Merge Word Documents',
    title: 'Merge Word Documents Online – Combine DOCX Files',
    description: 'Merge two or more DOCX files into one Word document online. Select files in order and download the combined DOCX file.',
    eyebrow: 'MERGE WORD DOCUMENTS', primaryIntent: 'Combine multiple DOCX documents into one file', processor: 'docxMergeProcessor',
    input: ['docx', 'docx+'], output: ['docx'], indexable: true,
  },
  {
    id: 'docx-to-html', route: '/docx-to-html', kind: 'converter', name: 'DOCX to HTML',
    title: 'DOCX to HTML Converter – Convert Word to HTML Free',
    description: 'Convert a DOCX Word document to HTML in your browser and download the generated HTML file.',
    eyebrow: 'DOCX TO HTML', primaryIntent: 'Convert DOCX content to HTML', processor: 'docxToHtmlProcessor',
    input: ['docx'], output: ['html'], indexable: true,
  },
  {
    id: 'html-to-docx', route: '/html-to-docx', kind: 'converter', name: 'HTML to DOCX',
    title: 'HTML to DOCX Converter – Convert HTML to Word Free',
    description: 'Convert an HTML file to an editable DOCX Word document directly in your browser.',
    eyebrow: 'HTML TO DOCX', primaryIntent: 'Convert HTML into a Word document', processor: 'htmlToDocxProcessor',
    input: ['html'], output: ['docx'], indexable: true,
  },
  {
    id: 'docx-to-txt', route: '/docx-to-txt', kind: 'converter', name: 'DOCX to TXT',
    title: 'DOCX to TXT Converter – Convert Word to Text Free',
    description: 'Extract readable text from a DOCX file and download it as a plain TXT file in your browser.',
    eyebrow: 'DOCX TO TXT', primaryIntent: 'Convert DOCX to plain text', processor: 'docxToTxtProcessor',
    input: ['docx'], output: ['txt'], indexable: true,
  },
  {
    id: 'txt-to-docx', route: '/txt-to-docx', kind: 'converter', name: 'TXT to DOCX',
    title: 'TXT to DOCX Converter – Convert Text to Word Free',
    description: 'Convert a plain text file into an editable DOCX Word document online.',
    eyebrow: 'TXT TO DOCX', primaryIntent: 'Convert plain text into a Word document', processor: 'txtToDocxProcessor',
    input: ['txt'], output: ['docx'], indexable: true,
  },
  {
    id: 'docx-to-rtf', route: '/docx-to-rtf', kind: 'converter', name: 'DOCX to RTF',
    title: 'DOCX to RTF Converter – Convert Word to RTF Free',
    description: 'Convert a DOCX document to Rich Text Format online and download the RTF file.',
    eyebrow: 'DOCX TO RTF', primaryIntent: 'Convert DOCX to RTF', processor: 'docxToRtfProcessor',
    input: ['docx'], output: ['rtf'], indexable: true,
  },
  {
    id: 'rtf-to-docx', route: '/rtf-to-docx', kind: 'converter', name: 'RTF to DOCX',
    title: 'RTF to DOCX Converter – Convert RTF to Word Free',
    description: 'Convert an RTF document into an editable DOCX Word file in your browser.',
    eyebrow: 'RTF TO DOCX', primaryIntent: 'Convert RTF into DOCX', processor: 'rtfToDocxProcessor',
    input: ['rtf'], output: ['docx'], indexable: true,
  },
  {
    id: 'docx-to-odt', route: '/docx-to-odt', kind: 'converter', name: 'DOCX to ODT',
    title: 'DOCX to ODT Converter – Convert Word to ODT Free',
    description: 'Convert a DOCX Word document to OpenDocument Text format online.',
    eyebrow: 'DOCX TO ODT', primaryIntent: 'Convert DOCX to ODT', processor: 'docxToOdtProcessor',
    input: ['docx'], output: ['odt'], indexable: true,
  },
  {
    id: 'odt-to-docx', route: '/odt-to-docx', kind: 'converter', name: 'ODT to DOCX',
    title: 'ODT to DOCX Converter – Convert ODT to Word Free',
    description: 'Convert an ODT OpenDocument file into an editable DOCX Word document online.',
    eyebrow: 'ODT TO DOCX', primaryIntent: 'Convert ODT into DOCX', processor: 'odtToDocxProcessor',
    input: ['odt'], output: ['docx'], indexable: true,
  },
  {
    id: 'compress-docx', route: '/compress-docx', kind: 'utility', name: 'Compress DOCX',
    title: 'Compress DOCX Online – Reduce Word File Size',
    description: 'Compress a DOCX Word document online and download a smaller DOCX file when compression is possible.',
    eyebrow: 'COMPRESS DOCX', primaryIntent: 'Reduce DOCX file size', processor: 'docxCompressProcessor',
    input: ['docx'], output: ['docx'], indexable: true,
  },
  {
    id: 'repair-docx', route: '/repair-docx', kind: 'utility', name: 'Repair DOCX',
    title: 'Repair DOCX Online – Fix a Word Document',
    description: 'Attempt to repair a damaged or problematic DOCX file and download a rebuilt Word document.',
    eyebrow: 'REPAIR DOCX', primaryIntent: 'Repair a DOCX document', processor: 'docxRepairProcessor',
    input: ['docx'], output: ['docx'], indexable: true,
  },
  {
    id: 'compare-word-documents', route: '/compare-word-documents', kind: 'utility', name: 'Compare Word Documents',
    title: 'Compare Word Documents Online – Compare DOCX Files',
    description: 'Compare two DOCX Word documents online and review paragraph-level additions, removals and changed content.',
    eyebrow: 'COMPARE WORD DOCUMENTS', primaryIntent: 'Compare two DOCX files for content differences', processor: 'docxCompareProcessor',
    input: ['docx', 'docx'], output: ['comparison'], indexable: true,
  },
  {
    id: 'split-word-document', route: '/split-word-document', kind: 'utility', name: 'Split Word Document',
    title: 'Split Word Document Online – Split DOCX by Headings',
    description: 'Split a DOCX Word document into separate DOCX files using heading boundaries and download each section.',
    eyebrow: 'SPLIT WORD DOCUMENT', primaryIntent: 'Split a DOCX document into multiple Word files', processor: 'docxSplitProcessor',
    input: ['docx'], output: ['docx+'], indexable: true,
  },
  {
    id: 'extract-docx-images', route: '/extract-docx-images', kind: 'utility', name: 'Extract DOCX Images',
    title: 'Extract Images from DOCX – Download Word Images Online',
    description: 'Extract embedded images from a DOCX Word document and download the original image files from the document package.',
    eyebrow: 'EXTRACT DOCX IMAGES', primaryIntent: 'Extract embedded images from a DOCX file', processor: 'docxExtractImagesProcessor',
    input: ['docx'], output: ['images'], indexable: true,
  },
  {
    id: 'word-document-info', route: '/word-document-info', kind: 'analyzer', name: 'Word Document Info',
    title: 'Word Document Info – Inspect DOCX Metadata & Statistics',
    description: 'Inspect a DOCX file for document statistics and stored metadata including author, title, dates, headings, tables and images.',
    eyebrow: 'WORD DOCUMENT INFO', primaryIntent: 'Inspect DOCX document metadata and statistics', processor: 'wordDocumentInfoProcessor',
    input: ['docx'], output: ['metadata', 'json'], indexable: true,
  },
  {
    id: 'remove-word-metadata', route: '/remove-word-metadata', kind: 'utility', name: 'Remove Word Metadata',
    title: 'Remove Word Metadata – Clean DOCX Properties Online',
    description: 'Remove common document properties and custom metadata from a DOCX file, then download a cleaned Word document.',
    eyebrow: 'REMOVE WORD METADATA', primaryIntent: 'Remove stored metadata from a DOCX file', processor: 'docxRemoveMetadataProcessor',
    input: ['docx'], output: ['docx'], indexable: true,
  },
] as const satisfies readonly WordInterfaceDefinition[];

export type WordInterfaceId = (typeof wordInterfaces)[number]['id'];

export function getWordInterface(id: WordInterfaceId) {
  return wordInterfaces.find((item) => item.id === id)!;
}

export function getWordInterfaceByRoute(route: string) {
  return wordInterfaces.find((item) => item.route === route);
}
