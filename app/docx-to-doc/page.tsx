import { RoadmapRemainingPage } from '@/components/RoadmapRemainingPage';
import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'DOCX to DOC Converter – Convert Word DOCX to DOC',
  description: 'Convert supported DOCX content in your browser into a Microsoft Word-compatible DOC file for legacy Word workflows.',
  path: '/docx-to-doc',
});

export default function Page() {
  return <RoadmapRemainingPage route="/docx-to-doc" mode="docx-to-doc" />;
}
