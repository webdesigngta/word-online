import { pageMetadata } from '@/lib/seo';
import { getWordInterface } from '@/tools/word/interfaces/config';
import { WordTaskPage } from '@/components/WordTaskPage';
import { DocxCompareInterface } from '@/components/DocxCompareInterface';

const tool = getWordInterface('compare-word-documents');
export const metadata = pageMetadata({ title: tool.title, description: tool.description, path: tool.route });

const faq = [
  { question: 'How does the Word document comparison work?', answer: 'Choose exactly two DOCX files. The current processor compares paragraph and heading content in order and reports changed, added and removed blocks.' },
  { question: 'Does it create a tracked-changes Word file?', answer: 'No. This version provides an on-screen content comparison rather than generating Microsoft Word tracked changes.' },
  { question: 'Can complex layout differences be detected?', answer: 'The comparison focuses on readable paragraph and heading content, so purely visual layout changes may not appear.' },
];

export default function CompareWordDocumentsPage() {
  return <WordTaskPage eyebrow={tool.eyebrow} title="Compare two Word documents online" description={tool.description} tool={<DocxCompareInterface />} details={[
    { title: 'Two DOCX inputs', text: 'Select an original document and a second version to compare.' },
    { title: 'Content-level differences', text: 'The shared comparison processor identifies changed paragraph and heading blocks and summarizes the result.' },
    { title: 'Review in the browser', text: 'Changed before/after text is displayed directly on the page without requiring desktop Word.' },
  ]} faq={faq} />;
}
