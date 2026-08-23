import { DocumentHubPage } from '@/components/DocumentHubPage';
import { pageMetadata } from '@/lib/seo';
import { wordInterfaces } from '@/tools/word/interfaces/config';

export const metadata = pageMetadata({
  title: 'View Documents Online – Free Document Viewers',
  description: 'Open supported Word documents in focused browser viewer interfaces without loading the full editing workflow.',
  path: '/view',
});

const tools = wordInterfaces.filter((tool) => tool.indexable && tool.kind === 'viewer');

export default function ViewHubPage() {
  return <DocumentHubPage eyebrow="VIEW DOCUMENTS" title="View Documents" description="Use focused read-only document viewers when you only need to open and inspect a file without editing it." tools={tools} />;
}
