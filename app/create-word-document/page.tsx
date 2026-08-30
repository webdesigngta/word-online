import { pageMetadata } from '@/lib/seo';
import { getWordInterface } from '@/tools/word/interfaces/config';
import { WordEditorExperience } from '@/components/WordEditorExperience';
import { SiteFooter } from '@/components/SiteFooter';
import { SoftwareJsonLd } from '@/components/JsonLd';

const tool = getWordInterface('create-word-document');
export const metadata = pageMetadata({ title: tool.title, description: tool.description, path: tool.route });

export default function CreateWordDocumentPage() {
  return (
    <>
      <WordEditorExperience
        interfaceId="create-word-document"
        heading="Create a Word Document Online"
        runtimeOptions={{ documentId: 'create-word-document', initialContent: '<p><br></p>' }}
        intentPrompt="create-word-document"
      />
      <SiteFooter />
      <SoftwareJsonLd />
    </>
  );
}
