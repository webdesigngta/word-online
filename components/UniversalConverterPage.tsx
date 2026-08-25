import { PlatformTaskPage } from '@/components/PlatformTaskPage';
import { UniversalConverterInterface, type UniversalConverterMode } from '@/components/UniversalConverterInterface';
import { getAllPlatformToolByRoute } from '@/tools/platform/allTools';

const content: Record<UniversalConverterMode, { details: Array<{ title: string; text: string }>; faq: Array<{ question: string; answer: string }> }> = {
  'document-converter': {
    details: [
      { title: 'One converter for common document formats', text: 'Convert supported PDF, DOCX, JPG, PNG, HTML, XLSX, and CSV files without navigating between separate tools.' },
      { title: 'Uses the same real conversion engines', text: 'Each format pair is dispatched to the dedicated processor already used by its standalone conversion page.' },
      { title: 'Only supported outputs are shown', text: 'The output selector changes after file detection so the interface never advertises a conversion pair the platform cannot perform.' },
    ],
    faq: [
      { question: 'Which document formats can I convert?', answer: 'The current converter supports DOCX to PDF, PDF to DOCX or JPG, JPG and PNG to PDF, HTML to PDF, XLSX to PDF, and CSV to PDF.' },
      { question: 'Can I convert every format to every other format?', answer: 'No. Only conversion pairs backed by a working processor are shown.' },
      { question: 'Are multi-page PDF to JPG results supported?', answer: 'Yes. Multiple JPG pages are packaged into a ZIP download.' },
    ],
  },
  'pdf-converter': {
    details: [
      { title: 'Convert to PDF', text: 'Turn DOCX, JPG, PNG, HTML, XLSX, and CSV files into PDF using the platform’s existing dedicated processors.' },
      { title: 'Convert from PDF', text: 'Convert text-based PDFs to editable DOCX or render PDF pages as JPG images.' },
      { title: 'A real multi-format PDF workflow', text: 'The page performs conversions directly rather than acting as a directory of links to other tools.' },
    ],
    faq: [
      { question: 'What can I convert to PDF?', answer: 'DOCX, JPG, PNG, HTML, XLSX, and CSV are currently supported as PDF inputs.' },
      { question: 'What can I convert a PDF into?', answer: 'The current PDF outputs are editable DOCX and JPG page images.' },
      { question: 'Can scanned PDFs convert to Word?', answer: 'PDF to Word needs extractable text. For scanned PDFs without text, use the OCR or Scan to Word tools.' },
    ],
  },
};

export function UniversalConverterPage({ route, mode }: { route: string; mode: UniversalConverterMode }) {
  const tool = getAllPlatformToolByRoute(route);
  if (!tool) throw new Error(`Unknown universal converter route: ${route}`);
  const page = content[mode];
  return <PlatformTaskPage route={route} title={tool.title} description={tool.description} tool={<UniversalConverterInterface mode={mode} toolId={tool.id} />} details={page.details} faq={page.faq} />;
}
