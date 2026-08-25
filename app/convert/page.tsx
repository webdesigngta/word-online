import { DocumentHubPage } from '@/components/DocumentHubPage';
import { pageMetadata } from '@/lib/seo';
import { allLivePlatformTools } from '@/tools/platform/allTools';

export const metadata = pageMetadata({
  title: 'Convert Documents Online – PDF, Word, Excel & More',
  description: 'Browse live converters for PDF, Word, DOCX, images, spreadsheets, presentations, HTML, text and other document formats.',
  path: '/convert',
});

const tools = allLivePlatformTools.filter((tool) => tool.indexable && tool.kind === 'converter');

export default function ConvertHubPage() {
  return <DocumentHubPage eyebrow="CONVERT" title="Convert documents online" description="Choose an input and output format. Converter cards use both product colors so cross-format workflows are easy to recognize at a glance." tools={tools} />;
}
