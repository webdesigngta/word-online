import { PlatformTaskPage } from '@/components/PlatformTaskPage';
import { RoadmapFinalInterface, type RoadmapFinalMode } from '@/components/RoadmapFinalInterface';
import { getAllPlatformToolByRoute } from '@/tools/platform/allTools';

const copy: Record<RoadmapFinalMode, { details: Array<{ title: string; text: string }>; faq: Array<{ question: string; answer: string }> }> = {
  'doc-to-pdf': {
    details: [
      { title: 'Read legacy DOC locally', text: 'The browser opens Word 97–2003 binary DOC content without sending the document to a conversion server.' },
      { title: 'Readable PDF output', text: 'Recovered document text is laid out into a standard multipage PDF that you can download immediately.' },
      { title: 'Honest legacy limits', text: 'Complex macros, embedded objects, fields, and exact desktop pagination may be simplified rather than falsely reproduced.' },
    ],
    faq: [
      { question: 'Can I convert an old .doc file to PDF?', answer: 'Yes. The tool reads supported Word 97–2003 DOC content in your browser and creates a PDF from the recovered text.' },
      { question: 'Does it preserve every Word 2003 layout detail?', answer: 'No. Legacy binary layouts can contain features that a lightweight browser converter cannot reproduce exactly.' },
    ],
  },
  'doc-viewer': {
    details: [
      { title: 'Open old Word files', text: 'View recovered text from Word 97–2003 DOC files directly in the browser.' },
      { title: 'Read-only preview', text: 'The source file remains unchanged while its readable content is displayed in a clean document view.' },
      { title: 'Browser-side parsing', text: 'The file stays on your device during parsing; only the pinned compatibility code is loaded when needed.' },
    ],
    faq: [
      { question: 'Can I open a DOC file without Microsoft Word?', answer: 'Yes, for supported Word 97–2003 documents. The viewer extracts and displays readable content in your browser.' },
      { question: 'Can it run DOC macros?', answer: 'No. Macros are not executed.' },
    ],
  },
  'doc-to-docx': {
    details: [
      { title: 'Recover DOC content', text: 'Readable content is extracted from the legacy Word binary file in the browser.' },
      { title: 'Create an editable DOCX', text: 'The recovered text is rebuilt into a modern OOXML DOCX file using the existing Word document engine.' },
      { title: 'Migration-focused conversion', text: 'The result prioritizes editable content over pretending to preserve unsupported legacy layout features pixel-for-pixel.' },
    ],
    faq: [
      { question: 'Can I convert DOC to DOCX online?', answer: 'Yes. Supported legacy DOC content is recovered and rebuilt as a modern editable DOCX file.' },
      { question: 'Will macros be moved into the DOCX?', answer: 'No. The conversion focuses on readable document content and does not migrate VBA macros.' },
    ],
  },
  'spell-checker': {
    details: [
      { title: 'Common spelling fixes', text: 'Detect and replace a focused set of frequent English misspellings with one click.' },
      { title: 'Native browser underlines', text: 'The editor also enables your browser spell-checking for broader word-level review.' },
      { title: 'Private local editing', text: 'Typed or pasted text stays in the browser and can be downloaded as TXT after review.' },
    ],
    faq: [
      { question: 'Is this a full dictionary spell checker?', answer: 'It combines deterministic common-error suggestions with the browser’s native spelling support; coverage varies by browser and installed dictionaries.' },
      { question: 'Does it upload my text?', answer: 'No. The checking interface runs locally in the browser.' },
    ],
  },
  'grammar-checker': {
    details: [
      { title: 'Deterministic grammar rules', text: 'Find repeated words, spacing problems, capitalization, punctuation, and basic a/an issues.' },
      { title: 'Safe one-click fixes', text: 'Apply individual suggestions or the currently detected safe fixes in one action.' },
      { title: 'No AI claims', text: 'This is intentionally a lightweight rule-based checker, not a generative AI proofreader.' },
    ],
    faq: [
      { question: 'Is the grammar checker AI-powered?', answer: 'No. It uses transparent browser-side rules for common mechanical grammar and punctuation problems.' },
      { question: 'Will it catch every grammar issue?', answer: 'No. Nuanced style and context require more advanced language analysis; this tool focuses on deterministic issues.' },
    ],
  },
  'pptx-editor': {
    details: [
      { title: 'Import existing PPTX', text: 'Open a PowerPoint OOXML deck and recover readable slide titles and paragraph text.' },
      { title: 'Edit slide text', text: 'Change imported titles and bullet lines directly in a simple browser slide editor.' },
      { title: 'Rebuild a clean PPTX', text: 'Download the edited content as a standard title-and-bullet PPTX while complex original effects are intentionally simplified.' },
    ],
    faq: [
      { question: 'Can I edit an existing PPTX online?', answer: 'Yes, for supported slide text. The current editor imports readable text and rebuilds a clean PPTX deck.' },
      { question: 'Are animations and charts preserved?', answer: 'No. The rebuilt deck focuses on text slides and does not claim full desktop PowerPoint fidelity.' },
    ],
  },
  'pptx-viewer': {
    details: [
      { title: 'Read PPTX in-browser', text: 'Open the OOXML package locally and extract readable text from each slide.' },
      { title: 'Slide-by-slide preview', text: 'Review recovered titles and bullet content in 16:9 browser slide cards.' },
      { title: 'No source changes', text: 'The PPTX remains untouched because the viewer is read-only.' },
    ],
    faq: [
      { question: 'Can I view PPTX without PowerPoint?', answer: 'Yes. Supported slide text is displayed directly in your browser.' },
      { question: 'Does it play transitions?', answer: 'No. It is a text-focused read-only presentation viewer.' },
    ],
  },
  'ppt-viewer': {
    details: [
      { title: 'Legacy PPT support', text: 'Open PowerPoint 97–2003 binary PPT files using a browser compatibility parser.' },
      { title: 'Recovered slide content', text: 'Readable presentation text is organized into slide-like previews where the legacy structure can be recovered.' },
      { title: 'No macro execution', text: 'Legacy code and embedded executables are not run.' },
    ],
    faq: [
      { question: 'Can I open an old .ppt file online?', answer: 'Yes. The viewer extracts supported readable content from PowerPoint 97–2003 files in the browser.' },
      { question: 'Is the preview pixel-perfect?', answer: 'No. Complex legacy drawings, transitions, and embedded media may not reproduce exactly.' },
    ],
  },
  'ppt-to-pdf': {
    details: [
      { title: 'PPT and PPTX input', text: 'Convert modern PPTX slide text or supported legacy PPT content through one PowerPoint-to-PDF workflow.' },
      { title: '16:9 PDF slides', text: 'Recovered slide titles and bullets are rendered onto one PDF page per slide.' },
      { title: 'Content-focused conversion', text: 'Animations, videos, SmartArt, and unsupported complex graphics are not falsely represented as preserved.' },
    ],
    faq: [
      { question: 'Can I convert both PPT and PPTX to PDF?', answer: 'Yes. PPTX is read directly from OOXML, while legacy PPT uses the browser compatibility parser.' },
      { question: 'Will animations appear in PDF?', answer: 'No. PDF is static, and this converter focuses on recovered slide text.' },
    ],
  },
  'pdf-summarizer': {
    details: [
      { title: 'Local PDF text extraction', text: 'Selectable PDF text is read page by page with PDF.js directly in the browser.' },
      { title: 'Extractive ranking', text: 'Important source sentences are ranked by term frequency and position, then returned in their original document order.' },
      { title: 'Page references included', text: 'Each selected sentence keeps its source page number so you can verify it against the PDF.' },
    ],
    faq: [
      { question: 'Is this PDF summarizer generative AI?', answer: 'No. It is an extractive summarizer that selects important existing sentences instead of generating new prose.' },
      { question: 'Does it work on scanned PDFs?', answer: 'Not directly. Run the scanned file through PDF OCR first so it contains extractable text.' },
    ],
  },
};

export function RoadmapFinalPage({ route, mode }: { route: string; mode: RoadmapFinalMode }) {
  const tool = getAllPlatformToolByRoute(route);
  if (!tool) throw new Error(`Unknown final roadmap route: ${route}`);
  const page = copy[mode];
  return <PlatformTaskPage route={route} title={tool.title} description={tool.description} tool={<RoadmapFinalInterface mode={mode} toolId={tool.id}/>} details={page.details} faq={page.faq}/>;
}
