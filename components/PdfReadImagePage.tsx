import { PlatformTaskPage } from '@/components/PlatformTaskPage';
import { PdfReaderImageInterface, type PdfReaderImageMode } from '@/components/PdfReaderImageInterface';
import { getAllPlatformToolByRoute } from '@/tools/platform/allTools';

const content: Record<PdfReaderImageMode, { details: Array<{ title: string; text: string }>; faq: Array<{ question: string; answer: string }> }> = {
  'pdf-reader': {
    details: [
      { title: 'Read PDF pages online', text: 'Open a PDF directly in the browser and move through pages without converting the document first.' },
      { title: 'Zoom without changing the file', text: 'Increase or decrease preview zoom while keeping the original PDF untouched.' },
      { title: 'Browser-based viewing', text: 'The viewer uses the shared PDF.js runtime already used by the platform for PDF processing.' },
    ],
    faq: [
      { question: 'Can I read a PDF online without downloading software?', answer: 'Yes. Choose a PDF and the browser renders its pages with navigation and zoom controls.' },
      { question: 'Does the PDF Reader edit my file?', answer: 'No. The reader only renders the selected PDF for viewing and does not modify the original file.' },
      { question: 'Can I zoom in on PDF pages?', answer: 'Yes. Use the zoom controls above the document preview to increase or decrease the rendered page size.' },
    ],
  },
  'pdf-to-jpg': {
    details: [
      { title: 'Choose exactly which pages to export', text: 'Convert all pages or enter individual page numbers and ranges such as 1,3,5-7.' },
      { title: 'Control image quality', text: 'Choose JPG quality and rendering resolution depending on whether you prefer smaller files or sharper output.' },
      { title: 'Download one image or a ZIP', text: 'Single-page conversions download as JPG. Multiple converted pages are bundled into one ZIP for convenience.' },
    ],
    faq: [
      { question: 'How do I convert PDF to JPG?', answer: 'Choose a PDF, select all pages or specific page numbers, choose quality, then run Convert to JPG.' },
      { question: 'Can I convert only one PDF page to JPG?', answer: 'Yes. Enter a single page number in the Pages field and only that page will be exported.' },
      { question: 'What happens with a multi-page PDF?', answer: 'When more than one page is converted, the JPG images are packaged into a ZIP download.' },
    ],
  },
};

export function PdfReadImagePage({ route, mode }: { route: string; mode: PdfReaderImageMode }) {
  const tool = getAllPlatformToolByRoute(route);
  if (!tool) throw new Error(`Unknown PDF tool route: ${route}`);
  const page = content[mode];
  return <PlatformTaskPage route={route} title={tool.title} description={tool.description} tool={<PdfReaderImageInterface mode={mode} toolId={tool.id} />} details={page.details} faq={page.faq} />;
}
