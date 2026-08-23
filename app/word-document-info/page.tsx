import { pageMetadata } from '@/lib/seo';
import { getWordInterface } from '@/tools/word/interfaces/config';
import { WordTaskPage } from '@/components/WordTaskPage';
import { WordDocumentInfoInterface } from '@/components/WordDocumentInfoInterface';

const tool = getWordInterface('word-document-info');
export const metadata = pageMetadata({ title: tool.title, description: tool.description, path: tool.route });

const faq = [
  { question: 'What information can the DOCX inspector show?', answer: 'It can report document counts such as words, paragraphs, headings, tables and images, plus stored properties such as title, subject, author, dates, keywords and application when available.' },
  { question: 'Does inspecting a Word file change it?', answer: 'No. This tool reads the document information and does not modify the uploaded DOCX.' },
  { question: 'Can I save the document information?', answer: 'Yes. When inspection succeeds, the metadata can also be downloaded as a JSON file.' },
];

export default function WordDocumentInfoPage() {
  return <WordTaskPage eyebrow={tool.eyebrow} title="Inspect DOCX metadata and document statistics" description={tool.description} tool={<WordDocumentInfoInterface />} details={[
    { title: 'Document statistics', text: 'See word, character, paragraph, heading, table and image counts from the DOCX content.' },
    { title: 'Stored properties', text: 'Review common Word metadata such as author, title, subject, created/modified dates, keywords and application.' },
    { title: 'Export information', text: 'Download the extracted information as JSON when you need a machine-readable record.' },
  ]} faq={faq} />;
}
