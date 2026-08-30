import { RoadmapRemainingPage } from '@/components/RoadmapRemainingPage';
import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'Unlock Word Document – Remove DOCX Editing Restriction',
  description: 'Remove standard DOCX editing restrictions from supported Word documents in your browser without attempting to bypass file-open encryption.',
  path: '/unlock-word-document',
});

export default function Page() {
  return <RoadmapRemainingPage route="/unlock-word-document" mode="unlock-word-document" />;
}
