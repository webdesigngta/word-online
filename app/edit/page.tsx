import { DocumentHubPage } from '@/components/DocumentHubPage';
import { pageMetadata } from '@/lib/seo';
import { allLivePlatformTools } from '@/tools/platform/allTools';

export const metadata = pageMetadata({
  title: 'Edit Documents Online – Word, PDF, Spreadsheets & More',
  description: 'Browse live document editors for Word, DOCX, PDF, spreadsheets, Markdown and other supported formats.',
  path: '/edit',
});

const tools = allLivePlatformTools.filter((tool) => tool.indexable && tool.kind === 'editor');

export default function EditHubPage() {
  return <DocumentHubPage eyebrow="EDIT" title="Edit documents online" description="Choose the editor that matches your file. Word, PDF, spreadsheet and text experiences use the same product design system while keeping file-specific controls focused." tools={tools} />;
}
