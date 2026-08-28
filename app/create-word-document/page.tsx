import { pageMetadata } from '@/lib/seo';
import { getWordInterface } from '@/tools/word/interfaces/config';
import { PlatformTaskPage } from '@/components/PlatformTaskPage';
import { WordEditorExperience } from '@/components/WordEditorExperience';
import { SoftwareJsonLd } from '@/components/JsonLd';

const tool = getWordInterface('create-word-document');
export const metadata = pageMetadata({ title: tool.title, description: tool.description, path: tool.route });

const details = [
  { title: 'Start from blank', text: 'Dismiss the start prompt and begin typing immediately with the standard formatting, table, image and page tools.' },
  { title: 'Choose a template', text: 'Open the template picker directly for a resume, cover letter, business letter, notes, report or invoice starter.' },
  { title: 'Export your work', text: 'Download DOCX or HTML, or use the print workflow for PDF when the document is ready.' },
];

const faq = [
  { question: 'Can I create a Word document online for free?', answer: 'Yes. Start with a blank page or choose a starter template, then download the result as DOCX.' },
  { question: 'Can I use a resume or letter template?', answer: 'Yes. The route-specific start options open the template picker for resumes, cover letters, business letters, meeting notes, reports and invoices.' },
  { question: 'Can I download the document as DOCX?', answer: 'Yes. Use the download controls to create an editable DOCX copy.' },
];

export default function CreateWordDocumentPage() {
  return (
    <>
      <PlatformTaskPage
        route={tool.route}
        title={tool.title}
        description={tool.description}
        tool={
          <WordEditorExperience
            interfaceId="create-word-document"
            heading="Create a Word Document Online"
            runtimeOptions={{ documentId: 'create-word-document', initialContent: '<p><br></p>' }}
            intentPrompt="create-word-document"
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
