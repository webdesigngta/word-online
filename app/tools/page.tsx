import { DocumentHubPage } from '@/components/DocumentHubPage';
import { pageMetadata } from '@/lib/seo';
import { livePlatformTools } from '@/tools/platform/catalog';

export const metadata = pageMetadata({
  title: 'All Document Tools – Free Word Online',
  description: 'Browse the live Word, DOCX, text, converter and utility tools available on the shared Free Word Online document platform.',
  path: '/tools',
});

export default function ToolsPage() {
  return (
    <DocumentHubPage
      eyebrow="DOCUMENT TOOLS"
      title="All Document Tools"
      description="Browse every live document tool currently available. Only tools that have passed functional implementation are listed here; planned roadmap tools stay out of search indexing until they are ready."
      tools={livePlatformTools}
    />
  );
}
