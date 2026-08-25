import { PlatformTaskPage } from '@/components/PlatformTaskPage';
import { PdfStampInterface, type PdfStampMode } from '@/components/PdfStampInterface';
import { getAllPlatformToolByRoute } from '@/tools/platform/allTools';

const content: Record<PdfStampMode, { details: Array<{ title: string; text: string }>; faq: Array<{ question: string; answer: string }> }> = {
  'sign-pdf': {
    details: [
      { title: 'Place a signature image', text: 'Choose a PNG or JPG signature image, select a PDF page and position, then create a new signed copy.' },
      { title: 'Page-aware placement', text: 'Signature placement uses the selected PDF page dimensions so corner and center positions stay inside the page.' },
      { title: 'Original stays unchanged', text: 'The tool creates a new PDF and does not modify the source file you selected.' },
    ],
    faq: [
      { question: 'How do I add a signature to a PDF?', answer: 'Choose a PDF, upload a PNG or JPG signature image, select the page and position, then create the signed PDF.' },
      { question: 'Does this create a cryptographic digital signature?', answer: 'No. This tool places a visible signature image on the PDF. It does not create a certificate-based digital signature.' },
      { question: 'Can I choose where the signature appears?', answer: 'Yes. Choose the target page, common page positions, and the signature width before creating the output.' },
    ],
  },
  'watermark-pdf': {
    details: [
      { title: 'Text watermark on every page', text: 'Enter a short watermark such as DRAFT or CONFIDENTIAL and apply it consistently across the PDF.' },
      { title: 'Adjust visibility', text: 'Control watermark opacity and text size so the label is visible without overwhelming the document.' },
      { title: 'Browser-side PDF editing', text: 'Watermark operations use the shared PDF editor processor and produce a new downloadable PDF.' },
    ],
    faq: [
      { question: 'Can I add a watermark to every PDF page?', answer: 'Yes. The entered text is added to every page of the selected PDF.' },
      { question: 'Can I change watermark opacity?', answer: 'Yes. Use the opacity control to make the text lighter or stronger before processing.' },
      { question: 'Is the watermark diagonal?', answer: 'No. This version places a centered horizontal text watermark. It does not claim rotated or diagonal watermark support.' },
    ],
  },
  'number-pdf-pages': {
    details: [
      { title: 'Number every PDF page', text: 'Add sequential page numbers starting at 1 across the complete PDF.' },
      { title: 'Choose the page corner or center', text: 'Place numbers at the top or bottom, aligned left, center, or right.' },
      { title: 'Create a separate numbered copy', text: 'The source PDF remains untouched while the tool creates a new numbered PDF.' },
    ],
    faq: [
      { question: 'Can I add page numbers to a PDF online?', answer: 'Yes. Choose a PDF, select a number position, then create a new PDF numbered from the first page to the last.' },
      { question: 'Can I choose where page numbers appear?', answer: 'Yes. Top and bottom left, center, and right positions are available.' },
      { question: 'Can I start numbering from another number?', answer: 'Not in this version. The current tool numbers pages sequentially starting from 1.' },
    ],
  },
};

export function PdfStampPage({ route, mode }: { route: string; mode: PdfStampMode }) {
  const tool = getAllPlatformToolByRoute(route);
  if (!tool) throw new Error(`Unknown PDF stamp route: ${route}`);
  const page = content[mode];
  return <PlatformTaskPage route={route} title={tool.title} description={tool.description} tool={<PdfStampInterface mode={mode} toolId={tool.id} />} details={page.details} faq={page.faq} />;
}
