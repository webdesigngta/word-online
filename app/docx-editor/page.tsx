import { pageMetadata } from '@/lib/seo';
import { getWordInterface } from '@/tools/word/interfaces/config';
import { WordEditorExperience } from '@/components/WordEditorExperience';
import { WordEditorInfo } from '@/components/WordEditorInfo';
import { SoftwareJsonLd } from '@/components/JsonLd';

const tool = getWordInterface('docx-editor');
export const metadata = pageMetadata({ title: tool.title, description: tool.description, path: tool.route });

const faq = [
  { question: 'Can I edit a DOCX file without Microsoft Word?', answer: 'Yes. Open a DOCX file in the browser editor, make changes, then download a new DOCX copy.' },
  { question: 'Does the DOCX editor require an account?', answer: 'No. Core editing works without creating an account, and local autosave stays in the browser.' },
  { question: 'Will complex Word formatting always match perfectly?', answer: 'Common document formatting is supported, but advanced Word-only layout features can be simplified in a browser editor.' },
];

export default function DocxEditorPage() {
  return (
    <>
      <WordEditorExperience interfaceId="docx-editor" heading="DOCX Editor Online" runtimeOptions={{ documentId: 'docx-editor' }} />
      <WordEditorInfo
        title="Edit DOCX files directly in the browser"
        description="This page mounts the same document engine as Word Online, but it is dedicated to the DOCX editing task instead of sending you to another landing page."
        details={[
          { title: 'Open DOCX', text: 'Use File → Open or the editor controls to load a .docx file from your device.' },
          { title: 'Make real edits', text: 'Edit text, headings, lists, tables, images, links, page breaks, headers and footers.' },
          { title: 'Download DOCX', text: 'Export a new Word document after editing, with common formatting and document structure preserved.' },
        ]}
        faq={faq}
      />
      <SoftwareJsonLd />
    </>
  );
}
