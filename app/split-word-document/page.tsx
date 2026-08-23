import { pageMetadata } from '@/lib/seo';
import { getWordInterface } from '@/tools/word/interfaces/config';
import { WordTaskPage } from '@/components/WordTaskPage';
import { DocxSplitInterface } from '@/components/DocxSplitInterface';

const tool = getWordInterface('split-word-document');
export const metadata = pageMetadata({ title: tool.title, description: tool.description, path: tool.route });

const faq = [
  { question: 'How is the Word document split?', answer: 'Choose a heading level and the processor starts a new DOCX section when it reaches matching heading boundaries.' },
  { question: 'Can I split at Heading 2 or Heading 3?', answer: 'Yes. The interface can split using Heading 1 only, Heading 1–2, or Heading 1–3 boundaries.' },
  { question: 'Will each result be a DOCX file?', answer: 'Yes. Each generated section is returned as a separate downloadable DOCX document.' },
];

export default function SplitWordDocumentPage() {
  return <WordTaskPage eyebrow={tool.eyebrow} title="Split a Word document into separate DOCX files" description={tool.description} tool={<DocxSplitInterface />} details={[
    { title: 'Choose the split level', text: 'Use your document heading structure to decide where each new Word file begins.' },
    { title: 'Shared split processor', text: 'The existing DOCX engine converts each detected section into a separate Word document.' },
    { title: 'Download each section', text: 'The resulting DOCX files are listed individually so you can download only the sections you need.' },
  ]} faq={faq} />;
}
