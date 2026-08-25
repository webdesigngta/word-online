import { PlatformTaskPage } from '@/components/PlatformTaskPage';
import { SimpleDocumentToPdfInterface } from '@/components/SimpleDocumentToPdfInterface';
import { DocumentViewerInterface } from '@/components/DocumentViewerInterface';
import { getAllPlatformToolByRoute } from '@/tools/platform/allTools';

export type DocumentFormatMode = 'txt-to-pdf' | 'rtf-to-pdf' | 'document-viewer';

const content: Record<DocumentFormatMode, { details: Array<{ title: string; text: string }>; faq: Array<{ question: string; answer: string }> }> = {
  'txt-to-pdf': {
    details: [
      { title: 'Preserves plain-text structure', text: 'Line breaks and spacing are rendered into a clean, readable PDF instead of being collapsed into one paragraph.' },
      { title: 'A4 or US Letter', text: 'Choose page size and portrait or landscape orientation before creating the PDF.' },
      { title: 'Browser-side processing', text: 'The TXT file is read and rendered in your browser without requiring an account.' },
    ],
    faq: [
      { question: 'Can I convert a TXT file to PDF?', answer: 'Yes. Choose a TXT file, select page settings, and download the generated PDF.' },
      { question: 'Will line breaks be preserved?', answer: 'Yes. Plain-text line breaks and spacing are kept in a wrapped text layout.' },
      { question: 'Can I use US Letter instead of A4?', answer: 'Yes. Both A4 and US Letter are available in portrait or landscape orientation.' },
    ],
  },
  'rtf-to-pdf': {
    details: [
      { title: 'RTF formatting is interpreted', text: 'The existing RTF parser converts readable formatting into HTML before the browser renders the PDF.' },
      { title: 'No fake legacy conversion', text: 'This tool only accepts RTF files and uses the platform’s working RTF conversion path.' },
      { title: 'Configurable PDF pages', text: 'Choose A4 or US Letter and portrait or landscape output.' },
    ],
    faq: [
      { question: 'Does RTF to PDF keep formatting?', answer: 'Common readable RTF formatting is interpreted before PDF rendering. Highly specialized RTF features may be simplified.' },
      { question: 'Do I need Microsoft Word?', answer: 'No. The conversion runs in the browser.' },
      { question: 'Can I convert DOC files here?', answer: 'No. This page is specifically for RTF files and does not claim legacy DOC support.' },
    ],
  },
  'document-viewer': {
    details: [
      { title: 'One viewer for common files', text: 'Open DOCX, PDF, TXT, HTML, RTF, JPG, PNG, CSV, and XLSX files from one read-only interface.' },
      { title: 'Format-aware preview', text: 'Word files use the DOCX viewer engine, spreadsheets render as tables, PDFs use a browser PDF preview, and text or HTML is sanitized for reading.' },
      { title: 'Read-only by design', text: 'The viewer does not edit or overwrite the source document.' },
    ],
    faq: [
      { question: 'Which formats can the Document Viewer open?', answer: 'DOCX, PDF, TXT, HTML, RTF, JPG, JPEG, PNG, CSV, and XLSX are currently supported.' },
      { question: 'Can I edit files in the Document Viewer?', answer: 'No. It is intentionally read-only. Use a dedicated editor when you need to change a document.' },
      { question: 'How are Excel workbooks displayed?', answer: 'XLSX files are shown as a read-only table preview of the first sheet, with a notice when the workbook contains additional sheets.' },
    ],
  },
};

export function DocumentFormatPage({ route, mode }: { route: string; mode: DocumentFormatMode }) {
  const tool = getAllPlatformToolByRoute(route);
  if (!tool) throw new Error(`Unknown document format route: ${route}`);
  const page = content[mode];
  const interfaceNode = mode === 'document-viewer'
    ? <DocumentViewerInterface toolId={tool.id} />
    : <SimpleDocumentToPdfInterface mode={mode === 'txt-to-pdf' ? 'txt' : 'rtf'} toolId={tool.id} />;

  return <PlatformTaskPage route={route} title={tool.title} description={tool.description} tool={interfaceNode} details={page.details} faq={page.faq} />;
}
