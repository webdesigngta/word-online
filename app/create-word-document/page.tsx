import { pageMetadata } from '@/lib/seo';
import { getWordInterface } from '@/tools/word/interfaces/config';
import { WordEditorExperience } from '@/components/WordEditorExperience';
import { NativeToolEditorial } from '@/components/NativeToolEditorial';
import { SiteFooter } from '@/components/SiteFooter';
import { SoftwareJsonLd } from '@/components/JsonLd';

const tool = getWordInterface('create-word-document');
export const metadata = pageMetadata({ title: tool.title, description: tool.description, path: tool.route });

const details = [
  { title: 'Start a New Word Document in Your Browser', text: 'Begin from a clean page when you already know what you want to write, or use a starter template when a little structure will help you get moving faster.' },
  { title: 'Choose a Useful Starting Point', text: 'Use blank-document mode or start from common formats such as a resume, cover letter, business letter, meeting notes, report or invoice.' },
  { title: 'Export the Finished Document', text: 'Review your content and formatting, then download an editable DOCX copy or continue into another DOC321 document workflow.' },
];

const faq = [
  { question: 'Can I create a Word document online for free?', answer: 'Yes. Start with a blank page or choose a starter template, then download the result as DOCX.' },
  { question: 'Can I use a resume or letter template?', answer: 'Yes. The route-specific start options open the template picker for resumes, cover letters, business letters, meeting notes, reports and invoices.' },
  { question: 'Can I download the document as DOCX?', answer: 'Yes. Use the download controls to create an editable DOCX copy.' },
];

const steps = [
  { title: 'Start from blank or choose a template', text: 'Open a clean document or select a starter that matches the kind of Word file you want to create.' },
  { title: 'Write and format the document', text: 'Add your text, headings, lists, tables, images, links and other document content.' },
  { title: 'Review the finished page', text: 'Check names, dates, wording, layout and formatting before you export the file.' },
  { title: 'Download your Word document', text: 'Save an editable DOCX copy or continue with another DOC321 document tool if the file needs another step.' },
];

export default function CreateWordDocumentPage() {
  return (
    <>
      <WordEditorExperience
        interfaceId="create-word-document"
        heading="Create a Word Document Online"
        runtimeOptions={{ documentId: 'create-word-document', initialContent: '<p><br></p>' }}
        intentPrompt="create-word-document"
      />
      <NativeToolEditorial route={tool.route} description={tool.description} details={details} faq={faq} steps={steps} />
      <SiteFooter />
      <SoftwareJsonLd />
    </>
  );
}
