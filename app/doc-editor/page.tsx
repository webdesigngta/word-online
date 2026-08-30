import { RoadmapRemainingPage } from '@/components/RoadmapRemainingPage';
import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'DOC Editor Online – Edit Legacy Word DOC Files',
  description: 'Open supported Word 97–2003 DOC files, recover readable text, edit it in your browser, and download a Word-compatible DOC copy.',
  path: '/doc-editor',
});

export default function Page() {
  return <RoadmapRemainingPage route="/doc-editor" mode="doc-editor" />;
}
