import { PlatformTaskPage } from '@/components/PlatformTaskPage';
import { WordFinishInterface } from '@/components/WordFinishInterface';
import { WordViewerInterface } from '@/components/WordViewerInterface';
import { getAllPlatformToolByRoute } from '@/tools/platform/allTools';
import type { WordFinishMode } from '@/tools/word/finish/docxFinish';

const content: Record<WordFinishMode | 'viewer', { details: Array<{title:string;text:string}>; faq: Array<{question:string;answer:string}> }> = {
  viewer: {
    details: [
      { title: 'Word-compatible viewing', text: 'Open DOCX, RTF, or ODT documents in a clean read-only browser view.' },
      { title: 'No document editing', text: 'The viewer does not overwrite your source file or expose editing controls.' },
      { title: 'Format-aware rendering', text: 'DOCX uses the existing Word viewer engine while RTF and ODT use their dedicated parsers.' },
    ],
    faq: [
      { question: 'What files can Word Viewer open?', answer: 'The current Word Viewer supports DOCX, RTF, and ODT documents.' },
      { question: 'Can it open old .doc files?', answer: 'Not yet. Legacy binary DOC files require a different engine and are not falsely treated as DOCX.' },
      { question: 'Does viewing change my file?', answer: 'No. The viewer reads the file locally and leaves the original unchanged.' },
    ],
  },
  'page-numbers': {
    details: [
      { title: 'Live Word page field', text: 'Adds a real PAGE field to the default footer so Word can update numbering as pagination changes.' },
      { title: 'Section aware', text: 'Existing section footers are extended where possible, and missing default footers are created.' },
      { title: 'Preserves the DOCX package', text: 'The tool edits the existing OOXML package rather than rebuilding body content from plain text.' },
    ],
    faq: [
      { question: 'Can I add page numbers to a Word document online?', answer: 'Yes. Choose a DOCX file, select left, center, or right alignment, and download a new numbered copy.' },
      { question: 'Are the page numbers real Word fields?', answer: 'Yes. The output uses a PAGE field in the footer so Microsoft Word can update it.' },
      { question: 'Does it replace an existing footer?', answer: 'No. The tool appends page numbering to an existing default footer when one is available.' },
    ],
  },
  signature: {
    details: [
      { title: 'Visible image signature', text: 'Insert a PNG or JPG signature image as a new paragraph near the end of the DOCX document.' },
      { title: 'Size and alignment controls', text: 'Choose signature width and left, center, or right alignment before export.' },
      { title: 'Not a digital certificate', text: 'This is a visible signature image, not a cryptographic or certificate-backed digital signature.' },
    ],
    faq: [
      { question: 'Can I add a signature to a Word document online?', answer: 'Yes. Upload a PNG or JPG signature and the tool inserts it into a new DOCX copy.' },
      { question: 'Is this a legally verified digital signature?', answer: 'No. It places a visible signature image and does not create a certificate-backed signature.' },
      { question: 'Where is the signature placed?', answer: 'The current tool appends it near the end of the document, before final section properties.' },
    ],
  },
  watermark: {
    details: [
      { title: 'Diagonal watermark', text: 'Adds light diagonal watermark text through the document header using Word-compatible VML.' },
      { title: 'Across document sections', text: 'The watermark is added through default section headers so it can appear throughout the document.' },
      { title: 'Original stays unchanged', text: 'A separate watermarked DOCX is generated in your browser.' },
    ],
    faq: [
      { question: 'Can I add a watermark to Word online?', answer: 'Yes. Enter watermark text such as DRAFT or CONFIDENTIAL and download a new DOCX copy.' },
      { question: 'Will the watermark cover my text?', answer: 'It is configured as a light background-style watermark through the document header.' },
      { question: 'Does it upload the Word file?', answer: 'No. The DOCX package is modified locally in your browser.' },
    ],
  },
  'header-footer': {
    details: [
      { title: 'Header, footer, or both', text: 'Add text to the default Word header and footer with left, center, or right alignment.' },
      { title: 'Preserves existing content', text: 'When a default header or footer already exists, the new paragraph is appended instead of replacing the whole part.' },
      { title: 'OOXML package editing', text: 'The tool modifies header/footer relationships inside the DOCX package while preserving document body content.' },
    ],
    faq: [
      { question: 'Can I add a header and footer to Word online?', answer: 'Yes. Enter either header text, footer text, or both, choose alignment, and download a new DOCX.' },
      { question: 'Will it delete my current header?', answer: 'No. The tool appends to existing default header/footer parts when available.' },
      { question: 'Can I add images to the header?', answer: 'Not in this version. The current header/footer tool adds text.' },
    ],
  },
  redact: {
    details: [
      { title: 'Permanent text replacement', text: 'Matched sensitive text is replaced in the underlying Word XML rather than hidden with a visual rectangle.' },
      { title: 'Cross-run matching', text: 'The redaction engine joins Word text runs within each paragraph so phrases split by formatting runs can still be found.' },
      { title: 'Covers common text parts', text: 'Document text, headers, footers, footnotes, endnotes, and comments are checked for requested terms.' },
    ],
    faq: [
      { question: 'Does Word redaction actually remove the original text?', answer: 'The matched underlying characters are replaced with block characters, so the original matched text is no longer stored in those text nodes.' },
      { question: 'Can I redact multiple phrases?', answer: 'Yes. Enter one phrase per line or separate phrases with commas.' },
      { question: 'Should I review the output?', answer: 'Yes. Always inspect the exported document before sharing it, especially when redacting sensitive information.' },
    ],
  },
};

export function WordFinishPage({ route, mode }: { route: string; mode: WordFinishMode | 'viewer' }) {
  const tool = getAllPlatformToolByRoute(route);
  if (!tool) throw new Error(`Unknown Word utility route: ${route}`);
  const page = content[mode];
  return <PlatformTaskPage route={route} title={tool.title} description={tool.description} tool={mode === 'viewer' ? <WordViewerInterface toolId={tool.id}/> : <WordFinishInterface mode={mode} toolId={tool.id}/>} details={page.details} faq={page.faq}/>;
}
