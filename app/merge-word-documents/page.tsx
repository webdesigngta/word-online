import { pageMetadata } from '@/lib/seo';
import { getWordInterface } from '@/tools/word/interfaces/config';
import { WordTaskPage } from '@/components/WordTaskPage';
import { DocxMergeInterface } from '@/components/DocxMergeInterface';

const tool = getWordInterface('merge-word-documents');
export const metadata = pageMetadata({ title: tool.title, description: tool.description, path: tool.route });

const faq = [
  { question: 'How many Word documents can I merge?', answer: 'The current tool requires at least two DOCX files. Browser memory and file size determine the practical upper limit.' },
  { question: 'What order are the documents combined in?', answer: 'They are merged in the same order they appear after you select them.' },
  { question: 'Will advanced Word formatting remain identical?', answer: 'The merge engine uses an HTML round-trip, so document-specific styles, comments, tracked changes, headers and footers can be simplified.' },
];

export default function MergeWordDocumentsPage() {
  return (
    <WordTaskPage
      eyebrow={tool.eyebrow}
      title="Merge Word documents online"
      description={tool.description}
      tool={<DocxMergeInterface />}
      details={[
        { title: 'Choose multiple DOCX files', text: 'Select at least two Word documents in the order you want them combined.' },
        { title: 'Shared merge processor', text: 'Each document is processed by the existing DOCX engine and combined into one output workflow.' },
        { title: 'Download one DOCX', text: 'When processing finishes, download the merged Word document as a single DOCX file.' },
      ]}
      faq={faq}
    />
  );
}
