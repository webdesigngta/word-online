import { DocumentFormatPage } from '@/components/DocumentFormatPage';
import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'Document Viewer Online – Open Common Documents',
  description: 'Open DOCX, PDF, TXT, HTML, RTF, JPG, PNG, CSV, and XLSX files in a read-only browser viewer without installing desktop software.',
  path: '/document-viewer',
});

export default function DocumentViewerPage() {
  return <DocumentFormatPage route="/document-viewer" mode="document-viewer" />;
}
