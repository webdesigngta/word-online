import { WordEditorExperience } from '@/components/WordEditorExperience';
import { SoftwareJsonLd } from '@/components/JsonLd';
import { pageMetadata } from '@/lib/seo';
import { wordToolSeo } from '@/tools/word';

const baseMetadata = pageMetadata(wordToolSeo);

export const metadata = {
  ...baseMetadata,
  title: { absolute: wordToolSeo.title },
};

export default function WordOnlinePage() {
  return (
    <>
      <WordEditorExperience interfaceId="word-online" heading="Word Online editor" />
      <SoftwareJsonLd />
    </>
  );
}
