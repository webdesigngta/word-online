import { PlatformTaskPage } from '@/components/PlatformTaskPage';
import { PdfMarkupInterface, type PdfMarkupMode } from '@/components/PdfMarkupInterface';
import { getAllPlatformToolByRoute } from '@/tools/platform/allTools';

const content: Record<PdfMarkupMode, { details: Array<{ title: string; text: string }>; faq: Array<{ question: string; answer: string }> }> = {
  'edit-pdf': {
    details: [
      { title: 'Edit directly on the PDF preview', text: 'Open a PDF page, choose text, highlight, or box, then click or drag directly on the rendered page.' },
      { title: 'Work across multiple pages', text: 'Navigate page by page while keeping every queued edit until you export the final PDF.' },
      { title: 'Create a separate edited copy', text: 'The source PDF remains unchanged. Your queued overlays are applied to a new downloadable PDF.' },
    ],
    faq: [
      { question: 'Can I edit text already inside a PDF?', answer: 'This version adds new text and markup overlays. It does not rewrite existing embedded PDF text objects.' },
      { question: 'Can I highlight parts of a PDF?', answer: 'Yes. Choose Highlight and drag across the area you want to mark.' },
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
  return <PlatformTaskPage route={route} title={tool.title} description={tool.description} tool={<PdfMarkupInterface mode={mode} toolId={tool.id} />} details={page.details} faq={page.faq} />;
}
