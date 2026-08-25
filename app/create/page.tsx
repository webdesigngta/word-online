import { DocumentHubPage } from '@/components/DocumentHubPage';
import { pageMetadata } from '@/lib/seo';
import { allLivePlatformTools } from '@/tools/platform/allTools';

export const metadata = pageMetadata({
  title: 'Create Documents Online – Word, Presentations & Templates',
  description: 'Start a Word document, presentation, spreadsheet, resume, invoice, proposal and other practical documents in your browser.',
  path: '/create',
});

const createIds = new Set(['create-word-document', 'word-online', 'spreadsheet-online', 'presentation-maker', 'powerpoint-online']);
const tools = allLivePlatformTools.filter((tool) => tool.indexable && (tool.kind === 'creator' || createIds.has(tool.id)));

export default function CreateHubPage() {
  return <DocumentHubPage eyebrow="CREATE" title="Create documents online" description="Start from a blank workspace or use a guided document maker. Each tool keeps the same visual system while adapting the fields and controls to the document you are creating." tools={tools} />;
}
