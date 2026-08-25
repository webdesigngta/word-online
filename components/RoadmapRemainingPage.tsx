import { PlatformTaskPage } from '@/components/PlatformTaskPage';
import { RoadmapRemainingInterface, type RoadmapRemainingMode } from '@/components/RoadmapRemainingInterface';
import { getAllPlatformToolByRoute } from '@/tools/platform/allTools';

const copy: Record<RoadmapRemainingMode, { details: Array<{ title: string; text: string }>; faq: Array<{ question: string; answer: string }> }> = {
  'doc-editor': {
    details: [
      { title: 'Open legacy DOC content', text: 'Recover readable text from supported Word 97–2003 DOC files directly in the browser.' },
      { title: 'Edit locally', text: 'Change the recovered document text in a focused editor without uploading the file to a conversion server.' },
      { title: 'Word-compatible export', text: 'Download an edited .doc using Word-compatible HTML packaging. It is not a reconstructed binary Word 97 container.' },
    ],
    faq: [
      { question: 'Can I edit an old DOC file online?', answer: 'Yes. Supported legacy DOC text can be recovered, edited, and downloaded as a Word-compatible .doc file.' },
      { question: 'Are macros and embedded objects preserved?', answer: 'No. The editor is content-focused and does not execute or reconstruct legacy macros, OLE objects, or complex binary layout.' },
    ],
  },
  'docx-to-doc': {
    details: [
      { title: 'Read DOCX locally', text: 'The browser extracts supported DOCX structure and formatting without sending your document to a server.' },
      { title: 'Word-compatible DOC', text: 'The converted output uses Microsoft Word-compatible HTML inside a .doc file for broad compatibility.' },
      { title: 'Honest format limits', text: 'The result is not a native Word 97 binary container, and complex OOXML features can be simplified.' },
    ],
    faq: [
      { question: 'Can I convert DOCX to DOC?', answer: 'Yes. The tool converts supported DOCX content into a Word-compatible .doc file that Microsoft Word can open.' },
      { question: 'Is the output a native binary Word 97 file?', answer: 'No. It is Word-compatible HTML packaged with a .doc extension, which avoids falsely claiming binary-format reconstruction.' },
    ],
  },
  'protect-word-document': {
    details: [
      { title: 'Restrict DOCX editing', text: 'Apply the standard OOXML read-only documentProtection setting to a DOCX package.' },
      { title: 'No document upload', text: 'The DOCX archive is modified locally with JSZip and downloaded as a new file.' },
      { title: 'Clear security boundary', text: 'This is an editing restriction, not password-to-open encryption or DRM.' },
    ],
    faq: [
      { question: 'Does this password-encrypt my Word file?', answer: 'No. It applies a standard read-only editing restriction. The document can still be opened without a password.' },
      { question: 'Will the original file change?', answer: 'No. A new protected DOCX is created and the original remains untouched.' },
    ],
  },
  'unlock-word-document': {
    details: [
      { title: 'Remove editing restriction', text: 'Remove standard OOXML documentProtection settings from a DOCX package.' },
      { title: 'Local package update', text: 'The document is processed in your browser and saved as a new unlocked DOCX.' },
      { title: 'No encryption bypass', text: 'The tool does not crack or decrypt password-to-open Office encryption.' },
    ],
    faq: [
      { question: 'Can this unlock an editing-restricted DOCX?', answer: 'Yes. It removes standard OOXML documentProtection settings from supported DOCX files.' },
      { question: 'Can it crack an encrypted Word password?', answer: 'No. Password-to-open encryption is intentionally outside this tool’s scope.' },
    ],
  },
  'pdf-to-pdfa': {
    details: [
      { title: 'Flatten to archival pages', text: 'Each PDF page is rendered to a static image, removing interactive features that commonly conflict with archival conversion.' },
      { title: 'PDF/A-2B structure', text: 'The rebuilt file receives PDF/A-2B metadata, document ID, and an embedded sRGB output intent.' },
      { title: 'Validation recommended', text: 'For legal or regulated archiving, independently validate the result with a PDF/A validator such as veraPDF.' },
    ],
    faq: [
      { question: 'Why does the converter rasterize pages?', answer: 'Flattening lets the browser rebuild a clean archival document without carrying forward unsupported scripts, forms, layers, or unembedded-font problems.' },
      { question: 'Will text remain searchable?', answer: 'No. The archival conversion intentionally prioritizes reliable visual preservation and PDF/A structure over searchable text.' },
    ],
  },
  'translate-pdf': {
    details: [
      { title: 'Extract PDF text locally', text: 'Selectable PDF text is read page by page with PDF.js before translation begins.' },
      { title: 'On-device translation first', text: 'Supporting browsers use their built-in Translator model. A private browser-model fallback covers English with French, Spanish, and German.' },
      { title: 'Clean translated output', text: 'Translated text can be downloaded as TXT or rebuilt as a clean PDF instead of pretending to translate the original layout in place.' },
    ],
    faq: [
      { question: 'Does Translate PDF upload my document?', answer: 'No document upload is required. PDF text extraction happens locally; translation uses an on-device browser model when available or a model downloaded to the browser for supported fallback pairs.' },
      { question: 'Does it preserve the original PDF layout?', answer: 'No. The tool translates extracted text and rebuilds clean output rather than falsely claiming exact layout translation.' },
    ],
  },
  'chat-with-pdf': {
    details: [
      { title: 'Local PDF indexing', text: 'Selectable PDF text is split into source passages and indexed in the browser.' },
      { title: 'Question-based retrieval', text: 'Your question is matched against document passages using transparent term overlap scoring.' },
      { title: 'Page-grounded answers', text: 'The response returns the strongest source passages with page references instead of generating unsupported claims.' },
    ],
    faq: [
      { question: 'Is Chat with PDF generative AI?', answer: 'No. It is a source-grounded retrieval chat that returns relevant passages from the PDF with page references.' },
      { question: 'Does it work with scanned PDFs?', answer: 'Run scanned PDFs through PDF OCR first so the document contains selectable text.' },
    ],
  },
};

export function RoadmapRemainingPage({ route, mode }: { route: string; mode: RoadmapRemainingMode }) {
  const tool = getAllPlatformToolByRoute(route);
  if (!tool) throw new Error(`Unknown remaining roadmap route: ${route}`);
  const page = copy[mode];
  return <PlatformTaskPage route={route} title={tool.title} description={tool.description} tool={<RoadmapRemainingInterface mode={mode} toolId={tool.id}/>} details={page.details} faq={page.faq}/>;
}
