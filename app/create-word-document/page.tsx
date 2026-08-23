import { pageMetadata } from '@/lib/seo';
import { getWordInterface } from '@/tools/word/interfaces/config';
import { WordEditorExperience } from '@/components/WordEditorExperience';
import { WordEditorInfo } from '@/components/WordEditorInfo';
import { SoftwareJsonLd } from '@/components/JsonLd';

const tool = getWordInterface('create-word-document');
export const metadata = pageMetadata({ title: tool.title, description: tool.description, path: tool.route });

const faq = [
  { question: 'Can I create a Word document online for free?', answer: 'Yes. Start with the browser editor, type or choose a starter template, then download the result as DOCX.' },
  { question: 'Can I use a resume or letter template?', answer: 'Yes. Page Tools includes starter templates for resumes, cover letters, business letters, meeting notes, reports and invoices.' },
  { question: 'Can I download the document as DOCX?', answer: 'Yes. Use the download controls to create an editable DOCX copy.' },
];

export default function CreateWordDocumentPage() {
  return (
    <>
      <WordEditorExperience interfaceId="create-word-document" heading="Create a Word Document Online" runtimeOptions={{ documentId: 'create-word-document', initialContent: '<p><br></p>' }} />
      <WordEditorInfo
        title="Start a new Word document in your browser"
        description="This interface opens the shared Word engine in a creation-focused workflow so you can begin with a blank page or a document template and export the result when finished."
        details={[
          { title: 'Start from blank', text: 'Begin typing immediately with familiar formatting, paragraph, table and image controls.' },
          { title: 'Use templates', text: 'Open Page Tools to load a resume, cover letter, business letter, notes, report or invoice starter.' },
          { title: 'Export your work', text: 'Download DOCX, HTML or use the print workflow for PDF when the document is ready.' },
        ]}
        faq={faq}
      />
      <SoftwareJsonLd />
    </>
  );
}
