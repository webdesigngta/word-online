import { DocumentHubPage } from '@/components/DocumentHubPage';
import { pageMetadata } from '@/lib/seo';
import { wordInterfaces } from '@/tools/word/interfaces/config';

export const metadata = pageMetadata({
  title: 'Convert Documents Online – Free Word Converters',
  description: 'Browse browser-based Word and document conversion tools for DOCX, PDF, HTML, TXT, RTF and ODT workflows.',
  path: '/convert',
});

const tools = wordInterfaces.filter((tool) => tool.indexable && tool.kind === 'converter');

export default function ConvertHubPage() {
  return <DocumentHubPage eyebrow="CONVERT DOCUMENTS" title="Convert Documents" description="Choose a focused conversion workflow. The interfaces share validation and processing logic while keeping each input and output path task-specific." tools={tools} />;
}
