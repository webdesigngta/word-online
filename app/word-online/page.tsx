import { pageMetadata } from '@/lib/seo';
import { wordToolSeo } from '@/tools/word';
import { WordEditorExperience } from '@/components/WordEditorExperience';
import { WordOnlineFlagshipContent } from '@/components/WordOnlineFlagshipContent';
import { SoftwareJsonLd } from '@/components/JsonLd';

export const metadata = pageMetadata(wordToolSeo);

export default function WordOnlinePage() {
  return (
    <>
      <WordEditorExperience interfaceId="word-online" heading="Free Word Online editor" />
      <WordOnlineFlagshipContent />
      <SoftwareJsonLd />
    </>
  );
}
