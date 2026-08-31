import { PlatformTaskPage } from '@/components/PlatformTaskPage';
import { PdfMarkupInterface, type PdfMarkupMode } from '@/components/PdfMarkupInterface';
import { PdfSmartEditLoader } from '@/components/PdfSmartEditLoader';
import { getAllPlatformToolByRoute } from '@/tools/platform/allTools';

const content: Record<PdfMarkupMode, { details: Array<{ title: string; text: string }>; faq: Array<{ question: string; answer: string }> }> = {
  'edit-pdf': {
    details: [
      { title: 'Recognize existing PDF text before editing', text: 'DOC321 reads embedded PDF text objects first because they carry the most accurate position, font metadata and font size. Scanned pages automatically fall back to high-resolution OCR.' },
      { title: 'Edit recognized text in place', text: 'Click any detected text region directly on the PDF page, change the wording, font family, font size, weight, italic styling or text color, and review the result against the original page.' },
      { title: 'Keep page geometry while creating an edited copy', text: 'Text regions remain anchored to their original page coordinates. DOC321 covers the replaced visual text and writes the edited version into a new PDF while leaving the source file unchanged.' },
    ],
    faq: [
      { question: 'Can I edit text already inside a PDF?', answer: 'Yes. DOC321 detects existing text and turns recognized text regions into editable fields on top of the original page. Digital PDFs use their embedded text metadata; scanned PDFs use OCR.' },
      { question: 'Can DOC321 recognize the original font and size?', answer: 'For digital PDFs, DOC321 uses the PDF text metadata and font transform for the highest available fidelity. For scanned pages, OCR can estimate text size, position and color, while font family and some styling remain visual estimates that you can correct before export.' },
      { question: 'Does the tool change my original PDF?', answer: 'No. It creates a new edited PDF and leaves the selected source file unchanged.' },
    ],
  },
  'pdf-annotator': {
    details: [
      { title: 'Highlight important passages', text: 'Drag directly over a region of the preview to add a translucent highlight annotation-style overlay.' },
      { title: 'Add text notes and boxes', text: 'Place short text notes with a click or drag a blue box around areas that need attention.' },
      { title: 'Undo before export', text: 'All changes are queued first, so you can undo or clear them before creating the annotated PDF.' },
    ],
    faq: [
      { question: 'Can I annotate a PDF online?', answer: 'Yes. Open the PDF, choose a markup tool, add highlights, text notes, or boxes, then export the annotated copy.' },
      { question: 'Are these native PDF comments?', answer: 'No. This version applies visible markup directly to the PDF page rather than creating separate comment objects.' },
      { question: 'Can I annotate more than one page?', answer: 'Yes. Navigate between pages and keep adding markup before exporting the final PDF.' },
    ],
  },
};

export function PdfMarkupPage({ route, mode }: { route: string; mode: PdfMarkupMode }) {
  const tool = getAllPlatformToolByRoute(route);
  if (!tool) throw new Error(`Unknown PDF markup route: ${route}`);
  const page = content[mode];
  const interfaceNode = mode === 'edit-pdf'
    ? <PdfSmartEditLoader toolId={tool.id} />
    : <PdfMarkupInterface mode={mode} toolId={tool.id} />;
  return <PlatformTaskPage route={route} title={tool.title} description={tool.description} tool={interfaceNode} details={page.details} faq={page.faq} />;
}
