import { DocumentHubPage } from '@/components/DocumentHubPage';
import { pageMetadata } from '@/lib/seo';
import { wordInterfaces } from '@/tools/word/interfaces/config';

export const metadata = pageMetadata({
  title: 'Create Documents Online – Free Word Document Maker',
  description: 'Start a new Word document online from a blank page or use the full browser-based Word editing experience.',
  path: '/create',
});

const createIds = new Set(['create-word-document', 'word-online']);
const tools = wordInterfaces.filter((tool) => tool.indexable && createIds.has(tool.id));

export default function CreateHubPage() {
  return <DocumentHubPage eyebrow="CREATE DOCUMENTS" title="Create Documents" description="Start a new document from a blank page or open the full Word Online editing experience. Creation routes reuse the same editor engine with different starting states." tools={tools} />;
}
