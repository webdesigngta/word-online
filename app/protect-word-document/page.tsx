import { RoadmapRemainingPage } from '@/components/RoadmapRemainingPage';
import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'Protect Word Document – Restrict DOCX Editing Online',
  description: 'Apply a standard read-only editing restriction to a DOCX Word document in your browser and download a new protected copy.',
  path: '/protect-word-document',
});

export default function Page() {
  return <RoadmapRemainingPage route="/protect-word-document" mode="protect-word-document" />;
}
