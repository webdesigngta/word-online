import { pageMetadata } from '@/lib/seo';
import { getWordInterface } from '@/tools/word/interfaces/config';
import { WordEditorExperience } from '@/components/WordEditorExperience';
import { NativeToolEditorial } from '@/components/NativeToolEditorial';
import { SiteFooter } from '@/components/SiteFooter';
import { SoftwareJsonLd } from '@/components/JsonLd';

const tool = getWordInterface('docx-editor');
export const metadata = pageMetadata({ title: tool.title, description: tool.description, path: tool.route });

const details = [
  { title: 'Open DOCX First', text: 'Start with the Word file you actually need to change. The DOCX-first workflow keeps the existing document at the center instead of sending you through a generic editor landing page.' },
  { title: 'Make Practical Word Document Edits', text: 'Update text, headings, lists, tables, images, links, headers, footers and other everyday document content directly in the browser editor.' },
  { title: 'Download a New DOCX Copy', text: 'Review the edited document and export a new Word file when you are finished, keeping the original source separate.' },
];

const faq = [
  { question: 'Can I edit a DOCX file without Microsoft Word?', answer: 'Yes. Use the Open DOCX start action, make changes in the browser editor, then download a new DOCX copy.' },
  { question: 'Does the DOCX editor require an account?', answer: 'No. Core editing works without creating an account, and local autosave stays in the browser.' },
  { question: 'Will complex Word formatting always match perfectly?', answer: 'Common document formatting is supported, but advanced Word-only layout features can be simplified in a browser editor.' },
];

const steps = [
  { title: 'Open your DOCX file', text: 'Choose the Word document you want to edit from the DOCX-first start action.' },
  { title: 'Make your changes', text: 'Edit the text, formatting, tables, images, links or page structure you need to update.' },
  { title: 'Review the document', text: 'Check important formatting and content before you create the finished copy.' },
  { title: 'Download DOCX', text: 'Export a new editable DOCX file and continue with another document task only if needed.' },
];

export default function DocxEditorPage() {
  return (
    <>
      <WordEditorExperience interfaceId="docx-editor" heading="DOCX Editor Online" runtimeOptions={{ documentId: 'docx-editor' }} intentPrompt="docx-editor" />
      <NativeToolEditorial route={tool.route} description={tool.description} details={details} faq={faq} steps={steps} />
      <SiteFooter />
      <SoftwareJsonLd />
    </>
  );
}
