import { WordEditorExperience } from '@/components/WordEditorExperience';
import { SoftwareJsonLd } from '@/components/JsonLd';
import { pageMetadata } from '@/lib/seo';
import { wordToolSeo } from '@/tools/word';

export const metadata = pageMetadata(wordToolSeo);

export default function WordOnlinePage() {
  return (
    <>
      <WordEditorExperience interfaceId="word-online" heading="Free Word Online editor" />
      <SoftwareJsonLd />
    </>
  );
}
