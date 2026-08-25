import { PlatformTaskPage } from '@/components/PlatformTaskPage';
import { ScanCsvToPdfInterface, type ScanCsvToPdfMode } from '@/components/ScanCsvToPdfInterface';
import { getAllPlatformToolByRoute } from '@/tools/platform/allTools';

const content: Record<ScanCsvToPdfMode, { details: Array<{ title: string; text: string }>; faq: Array<{ question: string; answer: string }> }> = {
  'scan-to-pdf': {
    details: [
      { title: 'Mix JPG and PNG scans', text: 'Combine JPG, JPEG, and PNG scans in one ordered PDF instead of converting each image format separately.' },
      { title: 'Arrange pages before conversion', text: 'Move scans up or down so the final PDF page order matches the document you scanned.' },
      { title: 'Choose page layout', text: 'Create A4 or Letter pages in portrait or landscape and choose whether each scan is contained or fills the page.' },
    ],
    faq: [
      { question: 'Can I combine photos and scans into one PDF?', answer: 'Yes. Select JPG, JPEG, and PNG images together and arrange them before creating the PDF.' },
      { question: 'Does each scan become one PDF page?', answer: 'Yes. Each selected image becomes one PDF page in the order shown.' },
      { question: 'Does Scan to PDF perform OCR?', answer: 'No. This tool preserves the scan image as a PDF page. Use PDF OCR when you need searchable text.' },
    ],
  },
  'csv-to-pdf': {
    details: [
      { title: 'Render CSV as a table', text: 'The browser parses the CSV into rows and columns and renders the table into a downloadable PDF.' },
      { title: 'Automatic table header styling', text: 'The first CSV row is treated as the table header and rendered with clear borders and wrapping.' },
      { title: 'Choose page size and orientation', text: 'Render the table on A4 or Letter pages in portrait or landscape orientation.' },
    ],
    faq: [
      { question: 'Can I convert a CSV file to PDF?', answer: 'Yes. Choose a CSV file and the tool renders its table into a new PDF in your browser.' },
      { question: 'Will a wide CSV fit on one page?', answer: 'Wide tables may span or scale across PDF pages. Landscape orientation is usually better for files with many columns.' },
      { question: 'Does this change my CSV file?', answer: 'No. The source CSV stays unchanged and a separate PDF is created.' },
    ],
  },
};

export function ScanCsvToPdfPage({ route, mode }: { route: string; mode: ScanCsvToPdfMode }) {
  const tool = getAllPlatformToolByRoute(route);
  if (!tool) throw new Error(`Unknown Scan/CSV PDF route: ${route}`);
  const page = content[mode];
  return <PlatformTaskPage route={route} title={tool.title} description={tool.description} tool={<ScanCsvToPdfInterface mode={mode} toolId={tool.id} />} details={page.details} faq={page.faq} />;
}
