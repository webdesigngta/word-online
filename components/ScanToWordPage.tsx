import { PlatformTaskPage } from '@/components/PlatformTaskPage';
import { ScanToWordInterface } from '@/components/ScanToWordInterface';
import { getAllPlatformToolByRoute } from '@/tools/platform/allTools';

export function ScanToWordPage() {
  const route = '/scan-to-word';
  const tool = getAllPlatformToolByRoute(route);
  if (!tool) throw new Error(`Unknown scan tool route: ${route}`);
  return <PlatformTaskPage route={route} title={tool.title} description={tool.description} tool={<ScanToWordInterface toolId={tool.id} />} details={[
    { title: 'Scanned PDFs and images', text: 'Use one tool for scanned PDF pages or JPG, JPEG, and PNG scans instead of choosing separate OCR workflows.' },
    { title: 'Editable Word output', text: 'Recognized text is rebuilt into a standard DOCX document so you can edit, format, and reuse it.' },
    { title: 'OCR confidence and review', text: 'The tool reports OCR confidence and exposes the recognized text so you can review it before relying on the document.' },
  ]} faq={[
    { question: 'Can I convert a scanned PDF to Word?', answer: 'Yes. Upload a scanned PDF and OCR processes its pages before creating an editable DOCX document.' },
    { question: 'Can I scan an image into Word?', answer: 'Yes. JPG, JPEG, and PNG scans with readable text are supported by the same tool.' },
    { question: 'Will the Word file look exactly like the scan?', answer: 'No. The goal is editable recognized text. Complex layout, graphics, handwriting, and exact positioning may require manual adjustment.' },
  ]} />;
}
