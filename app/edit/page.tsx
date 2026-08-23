import { DocumentHubPage } from '@/components/DocumentHubPage';
import { pageMetadata } from '@/lib/seo';
import { wordInterfaces } from '@/tools/word/interfaces/config';

export const metadata = pageMetadata({
  title: 'Edit Documents Online – Free Word Editors',
  description: 'Choose a browser-based Word document editing workflow for DOCX files or start with the full Word Online editor.',
  path: '/edit',
});

const tools = wordInterfaces.filter((tool) => tool.indexable && tool.kind === 'editor');

export default function EditHubPage() {
  return <DocumentHubPage eyebrow="EDIT DOCUMENTS" title="Edit Documents" description="Open an existing DOCX file or start in the full browser editor. These editing interfaces share the same document engine while keeping each task focused." tools={tools} />;
}
