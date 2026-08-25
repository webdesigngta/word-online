import { DocumentHubPage } from '@/components/DocumentHubPage';
import { pageMetadata } from '@/lib/seo';
import { allLivePlatformTools } from '@/tools/platform/allTools';

export const metadata = pageMetadata({
  title: 'View Documents Online – Word, PDF, Excel & PowerPoint',
  description: 'Open supported Word, PDF, spreadsheet and presentation files in focused browser-based viewers.',
  path: '/view',
});

const tools = allLivePlatformTools.filter((tool) => tool.indexable && tool.kind === 'viewer');

export default function ViewHubPage() {
  return <DocumentHubPage eyebrow="VIEW" title="View documents online" description="Open files in focused read-only viewers when you need to inspect content without changing the source document." tools={tools} />;
}
