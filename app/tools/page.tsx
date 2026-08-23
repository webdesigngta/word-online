import { DocumentHubPage } from '@/components/DocumentHubPage';
import { pageMetadata } from '@/lib/seo';
import { wordInterfaces } from '@/tools/word/interfaces/config';

export const metadata = pageMetadata({
  title: 'All Document Tools – Free Word Online',
  description: 'Browse the live Word document editor, viewer, converter and utility tools available in Free Word Online.',
  path: '/tools',
});

const tools = wordInterfaces.filter((tool) => tool.indexable);

export default function ToolsPage() {
  return <DocumentHubPage eyebrow="DOCUMENT TOOLS" title="All Document Tools" description="Browse every live document tool currently available. Each interface is backed by the shared document-processing platform instead of a separate app." tools={tools} />;
}
