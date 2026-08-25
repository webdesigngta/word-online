import { PlatformTaskPage } from '@/components/PlatformTaskPage';
import { LegacyFormatInterface, type LegacyFormatMode } from '@/components/LegacyFormatInterface';
import { MarkdownUtilityInterface, type MarkdownUtilityMode } from '@/components/MarkdownUtilityInterface';
import { SpeechDocumentInterface, type SpeechDocumentMode } from '@/components/SpeechDocumentInterface';
import { getAllPlatformToolByRoute } from '@/tools/platform/allTools';

export type DocumentSuiteMode = LegacyFormatMode | MarkdownUtilityMode | SpeechDocumentMode;

type PageCopy = { details: Array<{ title: string; text: string }>; faq: Array<{ question: string; answer: string }> };

const content: Record<DocumentSuiteMode, PageCopy> = {
  'odt-editor': {
    details: [
      { title: 'Edit supported ODT content', text: 'OpenDocument text is parsed into a browser editing surface so you can change text and common inline formatting.' },
      { title: 'Download a rebuilt ODT', text: 'The edited browser content is written back into a new ODT package instead of merely renaming another file format.' },
      { title: 'Clear fidelity limits', text: 'Complex page layout, embedded media, advanced styles, tracked changes, and unsupported OpenDocument features may be simplified.' },
    ],
    faq: [
      { question: 'Can I edit ODT files without LibreOffice?', answer: 'Yes for supported text structure and common formatting. Open the ODT, edit it in the browser, and download a rebuilt ODT.' },
      { question: 'Will every ODT feature be preserved?', answer: 'No. This lightweight editor focuses on supported document text and common formatting, not full office-suite layout fidelity.' },
      { question: 'Does the original file change?', answer: 'No. The original upload is not overwritten; the tool creates a new downloadable ODT file.' },
    ],
  },
  'odt-viewer': {
    details: [
      { title: 'Read ODT in the browser', text: 'The viewer extracts supported OpenDocument text structure into a clean read-only page.' },
      { title: 'No office software required', text: 'You can inspect common ODT content without installing LibreOffice or another desktop editor.' },
      { title: 'Local document workflow', text: 'The ODT package is opened and interpreted in the browser.' },
    ],
    faq: [
      { question: 'Can I view ODT files online?', answer: 'Yes. Choose an ODT file and supported content is displayed in a read-only browser view.' },
      { question: 'Can the viewer edit the file?', answer: 'No. Use the ODT Editor when you need to change supported content.' },
      { question: 'Are complex ODT layouts exact?', answer: 'No. Advanced layout and unsupported OpenDocument elements may be simplified in the preview.' },
    ],
  },
  'odt-to-pdf': {
    details: [
      { title: 'Real PDF output', text: 'Supported ODT content is rendered through the existing browser PDF engine and downloaded as a PDF file.' },
      { title: 'Composed from proven engines', text: 'The converter reuses the ODT parser and HTML-to-PDF renderer already used elsewhere on the platform.' },
      { title: 'Text-focused fidelity', text: 'Unsupported ODT layout, advanced styles, and embedded office features may be simplified before PDF rendering.' },
    ],
    faq: [
      { question: 'Can I convert ODT to PDF?', answer: 'Yes. Open an ODT file and download a PDF generated from its supported browser-rendered content.' },
      { question: 'Does it need LibreOffice?', answer: 'No. The conversion runs through the platform’s browser-side ODT and PDF engines.' },
      { question: 'Will complex layout be identical?', answer: 'Not always. This converter prioritizes supported text structure and common formatting over exact office-suite pagination.' },
    ],
  },
  'rtf-editor': {
    details: [
      { title: 'Rich-text editing', text: 'Open supported RTF text with bold, italic, and underline formatting in a browser editing surface.' },
      { title: 'RTF download', text: 'Your edited browser content is serialized into a new RTF document for download.' },
      { title: 'Lightweight compatibility', text: 'Unsupported RTF control words, images, and advanced layout features may be simplified or omitted.' },
    ],
    faq: [
      { question: 'Can I edit an RTF file online?', answer: 'Yes. Open the RTF, edit supported rich-text content, and download a rebuilt RTF file.' },
      { question: 'Are images preserved?', answer: 'No guarantee. The current lightweight RTF path focuses on text and common inline formatting.' },
      { question: 'Does it overwrite my original file?', answer: 'No. Your source file remains unchanged and the edited result downloads as a new RTF.' },
    ],
  },
  'rtf-viewer': {
    details: [
      { title: 'Read RTF without Word', text: 'Supported RTF text and common inline formatting are shown directly in your browser.' },
      { title: 'Read-only view', text: 'The viewer does not modify your source file or expose editing controls.' },
      { title: 'Helpful compatibility warnings', text: 'Unsupported RTF control words are reported when the parser has to simplify them.' },
    ],
    faq: [
      { question: 'Can I open RTF without Microsoft Word?', answer: 'Yes. Choose an RTF file and supported content appears in a clean browser view.' },
      { question: 'Can this viewer edit RTF?', answer: 'No. Use the separate RTF Editor for changes.' },
      { question: 'Does it support every RTF feature?', answer: 'No. The parser focuses on text and common inline formatting and may simplify advanced RTF constructs.' },
    ],
  },
  'markdown-editor': {
    details: [
      { title: 'Markdown source and live preview', text: 'Write Markdown on the left while the rendered document updates in the browser preview.' },
      { title: 'Download Markdown or DOCX', text: 'Save the source as an MD file or convert the current Markdown into a real DOCX document.' },
      { title: 'Common Markdown structure', text: 'Headings, paragraphs, emphasis, lists, links, code, blockquotes, and simple tables are supported by the conversion layer.' },
    ],
    faq: [
      { question: 'Can I preview Markdown online?', answer: 'Yes. The editor shows the Markdown source and a rendered preview together.' },
      { question: 'Can I convert what I write to Word?', answer: 'Yes. Use Download DOCX to create a Word-compatible DOCX file from the current Markdown.' },
      { question: 'Does it execute HTML or scripts from Markdown?', answer: 'No. The Markdown renderer escapes raw markup and only generates supported safe structures.' },
    ],
  },
  'markdown-to-docx': {
    details: [
      { title: 'Markdown to real DOCX', text: 'The converter maps supported Markdown into structured HTML and then builds an actual DOCX document.' },
      { title: 'Preview before download', text: 'Inspect the rendered Markdown in the browser before exporting the Word file.' },
      { title: 'No fake extension change', text: 'The result is generated as an Open XML DOCX package, not a renamed text file.' },
    ],
    faq: [
      { question: 'Can I convert Markdown to Word?', answer: 'Yes. Upload a Markdown file and download a generated DOCX document.' },
      { question: 'What Markdown is supported?', answer: 'Common headings, paragraphs, emphasis, lists, links, code, blockquotes, and simple table structures are supported.' },
      { question: 'Will custom Markdown extensions work?', answer: 'Not necessarily. The tool intentionally supports a compact predictable Markdown subset.' },
    ],
  },
  'docx-to-markdown': {
    details: [
      { title: 'DOCX content extraction', text: 'The existing DOCX-to-HTML engine reads supported Word content before it is converted into Markdown.' },
      { title: 'Clean Markdown output', text: 'Common headings, emphasis, lists, links, code-like content, blockquotes, and simple tables are translated to Markdown syntax.' },
      { title: 'Layout is simplified', text: 'Word-specific page layout, complex floating objects, advanced styles, and unsupported embedded content do not map directly to Markdown.' },
    ],
    faq: [
      { question: 'Can I convert Word to Markdown?', answer: 'Yes. Upload a DOCX file and download supported document content as an MD file.' },
      { question: 'Will Word formatting be identical in Markdown?', answer: 'No. Markdown is intentionally simpler than Word, so complex layout and styling are reduced to supported text structure.' },
      { question: 'Can I edit the converted Markdown?', answer: 'The converter shows the generated Markdown read-only. Open the downloaded MD file in the Markdown Editor for further edits.' },
    ],
  },
  'speech-to-text-document': {
    details: [
      { title: 'Browser voice dictation', text: 'Use supported browser speech recognition to turn microphone input into editable document text.' },
      { title: 'Edit, copy, and download', text: 'Clean up the transcript in the text area, copy it, or download it as a TXT file.' },
      { title: 'Device-dependent recognition', text: 'Recognition availability, privacy behavior, language support, and accuracy depend on the browser and operating system.' },
    ],
    faq: [
      { question: 'Does speech to text need microphone permission?', answer: 'Yes. The browser must support speech recognition and you must allow microphone access.' },
      { question: 'Can I edit the transcript?', answer: 'Yes. The recognized text remains editable before copying or downloading.' },
      { question: 'Is audio uploaded by this website?', answer: 'The page uses the browser speech-recognition API. How audio is processed is determined by your browser and its speech service.' },
    ],
  },
  'text-to-speech-document': {
    details: [
      { title: 'Read text aloud', text: 'Paste or type document text and use your browser’s available speech synthesis voice to read it aloud.' },
      { title: 'Playback controls', text: 'Start, pause, resume, stop, and adjust reading speed before playback.' },
      { title: 'Uses device voices', text: 'Voice quality, available languages, and pronunciation depend on your browser and operating system.' },
    ],
    faq: [
      { question: 'Can this read a document aloud?', answer: 'Yes. Paste or type the document text and choose Read aloud.' },
      { question: 'Can I change the speed?', answer: 'Yes. Set the playback speed from 0.5× to 2× before starting speech.' },
      { question: 'Does it generate an audio file?', answer: 'No. This tool plays speech through the browser; it does not currently export MP3 or other audio files.' },
    ],
  },
};

export function DocumentSuitePage({ route, mode }: { route: string; mode: DocumentSuiteMode }) {
  const tool = getAllPlatformToolByRoute(route);
  if (!tool) throw new Error(`Unknown document suite route: ${route}`);
  const page = content[mode];
  const interfaceNode = mode.startsWith('odt') || mode.startsWith('rtf')
    ? <LegacyFormatInterface mode={mode as LegacyFormatMode} />
    : mode.includes('markdown')
      ? <MarkdownUtilityInterface mode={mode as MarkdownUtilityMode} />
      : <SpeechDocumentInterface mode={mode as SpeechDocumentMode} />;
  return <PlatformTaskPage route={route} title={tool.title} description={tool.description} tool={interfaceNode} details={page.details} faq={page.faq} />;
}
