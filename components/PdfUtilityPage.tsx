import { PlatformTaskPage } from '@/components/PlatformTaskPage';
import { PdfToolInterface, type PdfToolMode } from '@/components/PdfToolInterface';
import { getAllPlatformToolByRoute } from '@/tools/platform/allTools';

const content: Record<PdfToolMode, { details: Array<{ title: string; text: string }>; faq: Array<{ question: string; answer: string }> }> = {
  'pdf-to-word': {
    details: [
      { title: 'Extract readable PDF text', text: 'The converter reads text positions from text-based PDFs and rebuilds readable lines in a DOCX document.' },
      { title: 'Create an editable DOCX', text: 'Extracted content is written to a standard Word DOCX file with basic heading detection and optional page breaks.' },
      { title: 'Know the fidelity limits', text: 'Complex layouts, forms, embedded graphics, and scanned pages may not match the original PDF. Scanned PDFs should use PDF OCR first.' },
    ],
    faq: [
      { question: 'Can I convert PDF to Word online?', answer: 'Yes. Choose a text-based PDF and the browser creates a downloadable DOCX Word document.' },
      { question: 'Will the Word file look exactly like the PDF?', answer: 'Not always. The converter focuses on editable text and basic document structure rather than pixel-perfect reconstruction of complex PDF layouts.' },
      { question: 'What about a scanned PDF?', answer: 'Use the PDF OCR tool first if the PDF contains scanned images instead of extractable text.' },
    ],
  },
  'compress-pdf': {
    details: [
      { title: 'Browser-based QPDF compression', text: 'The tool rebuilds PDF object and stream structures using the QPDF WebAssembly engine.' },
      { title: 'Choose a compression level', text: 'Low, medium, and high settings control stream recompression effort without rasterizing every page.' },
      { title: 'No fake savings', text: 'If the PDF cannot actually be made smaller, the tool reports that instead of returning a larger file as a compressed result.' },
    ],
    faq: [
      { question: 'How do I reduce PDF file size?', answer: 'Choose a PDF, select a compression level, then run Compress PDF. A download appears only when the resulting file is smaller.' },
      { question: 'Does compression lower image quality?', answer: 'This compressor focuses on PDF object and stream compression. It does not intentionally rasterize every page at a lower image resolution.' },
      { question: 'Why can some PDFs not be compressed further?', answer: 'Some PDFs are already optimized or mostly contain data that QPDF cannot reduce without destructive recompression.' },
    ],
  },
  'merge-pdf': {
    details: [
      { title: 'Choose multiple PDFs', text: 'Select at least two PDF files and arrange them in the exact order you want.' },
      { title: 'Reorder before merging', text: 'Move files up or down in the list without renaming or modifying the source files.' },
      { title: 'Download one combined PDF', text: 'The QPDF browser engine combines all selected pages into a single output file.' },
    ],
    faq: [
      { question: 'Can I combine multiple PDF files online?', answer: 'Yes. Select two or more PDFs, arrange their order, and download one merged PDF.' },
      { question: 'Does file order matter?', answer: 'Yes. The merged PDF follows the order shown in the file list before processing.' },
      { question: 'Are the original PDFs changed?', answer: 'No. The tool reads the selected files and creates a new merged PDF.' },
    ],
  },
  'split-pdf': {
    details: [
      { title: 'Choose specific pages', text: 'Enter page numbers and ranges such as 1,3,5-7 to create a PDF containing just those pages.' },
      { title: 'Separate every page', text: 'Turn on Separate every page to create one PDF per source page.' },
      { title: 'Download efficiently', text: 'A single extracted PDF downloads directly; multiple page files are bundled into a ZIP.' },
    ],
    faq: [
      { question: 'How do I split a PDF by page?', answer: 'Choose the PDF, enter page numbers or ranges, and run Split PDF. You can also separate every page automatically.' },
      { question: 'Can I extract pages 1, 3, and 5 through 7?', answer: 'Yes. Enter 1,3,5-7 in the page field.' },
      { question: 'What happens when every page is separated?', answer: 'The individual PDF files are packaged together in a ZIP download.' },
    ],
  },
  'pdf-ocr': {
    details: [
      { title: 'Render scanned pages', text: 'PDF pages are rendered to browser canvases and passed through the OCR engine.' },
      { title: 'Extract recognized text', text: 'The tool shows recognized English text and reports average OCR confidence when available.' },
      { title: 'Create a searchable PDF', text: 'Recognized words are added as an invisible text layer so the PDF can become searchable while retaining its original page appearance.' },
    ],
    faq: [
      { question: 'What is PDF OCR?', answer: 'OCR recognizes text inside scanned or image-based PDF pages so the content can be copied, searched, and reused.' },
      { question: 'Does the OCR change the visible PDF?', answer: 'The searchable PDF keeps the source pages and adds an invisible recognized-text layer when generation succeeds.' },
      { question: 'Which language does this version support?', answer: 'The current interface runs English OCR. Additional language options can be added to the shared OCR processor later.' },
    ],
  },
};

export function PdfUtilityPage({ route, mode }: { route: string; mode: PdfToolMode }) {
  const tool = getAllPlatformToolByRoute(route);
  if (!tool) throw new Error(`Unknown PDF tool route: ${route}`);
  const page = content[mode];
  return <PlatformTaskPage route={route} title={tool.title} description={tool.description} tool={<PdfToolInterface mode={mode} toolId={tool.id} />} details={page.details} faq={page.faq} />;
}
