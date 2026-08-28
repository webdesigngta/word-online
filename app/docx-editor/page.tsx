import { pageMetadata } from '@/lib/seo';
import { getWordInterface } from '@/tools/word/interfaces/config';
import { PlatformTaskPage } from '@/components/PlatformTaskPage';
import { WordEditorExperience } from '@/components/WordEditorExperience';
import { SoftwareJsonLd } from '@/components/JsonLd';

const tool = getWordInterface('docx-editor');
export const metadata = pageMetadata({ title: tool.title, description: tool.description, path: tool.route });

const details = [
  { title: 'Open DOCX first', text: 'The route-specific start control opens your device picker so you can begin with the Word file you came here to edit.' },
  { title: 'Make real edits', text: 'Edit text, headings, lists, tables, images, links, page breaks, headers and footers with the shared Word engine.' },
  { title: 'Download DOCX', text: 'Export a new Word document after editing, with common formatting and document structure preserved.' },
];

const faq = [
  { question: 'Can I edit a DOCX file without Microsoft Word?', answer: 'Yes. Use the Open DOCX start action, make changes in the browser editor, then download a new DOCX copy.' },
  { question: 'Does the DOCX editor require an account?', answer: 'No. Core editing works without creating an account, and local autosave stays in the browser.' },
  { question: 'Will complex Word formatting always match perfectly?', answer: 'Common document formatting is supported, but advanced Word-only layout features can be simplified in a browser editor.' },
];

export default function DocxEditorPage() {
  return (
    <>
      <PlatformTaskPage
        route={tool.route}
        title={tool.title}
        description={tool.description}
        tool={
          <WordEditorExperience
            interfaceId="docx-editor"
            heading="DOCX Editor Online"
            runtimeOptions={{ documentId: 'docx-editor' }}
            intentPrompt="docx-editor"
            embedded
          />
        }
        details={details}
        faq={faq}
      />
      <SoftwareJsonLd />
    </>
  );
}
