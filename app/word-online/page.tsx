import { pageMetadata } from '@/lib/seo';
import { wordToolSeo } from '@/tools/word';
import { getWordInterface } from '@/tools/word/interfaces/config';
import { PlatformTaskPage } from '@/components/PlatformTaskPage';
import { WordEditorExperience } from '@/components/WordEditorExperience';
import { SoftwareJsonLd } from '@/components/JsonLd';

const tool = getWordInterface('word-online');

export const metadata = pageMetadata(wordToolSeo);

const details = [
  { title: 'Open and edit DOCX files', text: 'Load a Word document into the browser editor, make everyday edits, and download a fresh DOCX copy when you are finished.' },
  { title: 'Create documents from scratch', text: 'Start with a blank page and use familiar document controls for text, headings, lists, links, tables, images, page breaks, headers and footers.' },
  { title: 'Keep the workflow in your browser', text: 'The core editor works without requiring an account, with browser-local autosave available while you work.' },
];

const faq = [
  { question: 'Can I use Word Online without installing Microsoft Word?', answer: 'Yes. DOC321 runs the editor in your browser so you can open, edit and export common Word documents without installing desktop software.' },
  { question: 'Can I open and download DOCX files?', answer: 'Yes. DOCX is the primary rich-document format supported by the editor, and you can download a new DOCX copy after editing.' },
  { question: 'Do I need an account?', answer: 'No. The core Word Online editing workflow works without creating an account.' },
  { question: 'Does the editor autosave?', answer: 'Yes. Draft data and rolling version history can be stored locally in the browser on the device where you are editing.' },
];

export default function WordOnlinePage() {
  return (
    <>
      <PlatformTaskPage
        route={tool.route}
        title={tool.title}
        description={tool.description}
        tool={<WordEditorExperience interfaceId="word-online" heading="Free Word Online editor" embedded />}
        details={details}
        faq={faq}
      />
      <SoftwareJsonLd />
    </>
  );
}
