import { pageMetadata } from '@/lib/seo';
import { WordOnlineFlagshipContent } from '@/components/WordOnlineFlagshipContent';

export const metadata = pageMetadata({
  title: 'Word Online Editor Information',
  description: 'Learn about supported files, browser-based document handling, and editing features in Free Word Online.',
  path: '/word-online/info',
});

export default function WordOnlineInfoPage() {
  return <WordOnlineFlagshipContent />;
}
