import { PlatformTaskPage } from '@/components/PlatformTaskPage';
import { ScanToPdfInterface } from '@/components/ScanToPdfInterface';
import { getAllPlatformToolByRoute } from '@/tools/platform/allTools';

export function ScanToPdfPage() {
  const route = '/scan-to-pdf';
  const tool = getAllPlatformToolByRoute(route);
  if (!tool) throw new Error('Unknown Scan to PDF route');
  return <PlatformTaskPage
    route={route}
    title={tool.title}
    description={tool.description}
    tool={<ScanToPdfInterface toolId={tool.id} />}
    details={[
      { title: 'Combine scans in order', text: 'Choose one or more JPG, JPEG, or PNG scans and keep the selected order as PDF page order.' },
      { title: 'A4 or US Letter output', text: 'Each scan is fitted proportionally onto an A4 or US Letter page, with optional margins.' },
      { title: 'Mixed JPG and PNG support', text: 'A single PDF can contain both JPEG and PNG scans without requiring separate conversion steps.' },
    ]}
    faq={[
      { question: 'How do I turn scanned images into one PDF?', answer: 'Choose your JPG or PNG scans together, select a page size and margin, then create and download the PDF.' },
      { question: 'Can I combine multiple scans into one PDF?', answer: 'Yes. Each selected image becomes one page in the resulting PDF.' },
      { question: 'Does Scan to PDF perform OCR?', answer: 'No. This tool preserves the scans as images inside a PDF. Use Scan to Word when you need editable OCR text.' },
    ]}
  />;
}
