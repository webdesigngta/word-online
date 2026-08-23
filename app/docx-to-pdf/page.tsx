import { pageMetadata } from '@/lib/seo';
import { getWordInterface } from '@/tools/word/interfaces/config';
import { WordTaskPage } from '@/components/WordTaskPage';
import { WordToPdfInterface } from '@/components/WordToPdfInterface';

const tool = getWordInterface('docx-to-pdf');
export const metadata = pageMetadata({ title: tool.title, description: tool.description, path: tool.route });

const faq = [
  { question: 'Can I convert DOCX to PDF in the browser?', answer: 'Yes. Upload a .docx file and the converter creates a PDF you can download.' },
  { question: 'Is DOCX to PDF different from Word to PDF here?', answer: 'Both routes use the same conversion engine, but this page is specifically configured for the DOCX-to-PDF task.' },
  { question: 'Are complex layouts guaranteed to be identical?', answer: 'No. Browser rendering can simplify highly complex Word-specific layout features.' },
];

export default function DocxToPdfPage() {
  return (
    <WordTaskPage
      eyebrow={tool.eyebrow}
      title="Convert DOCX to PDF online"
      description={tool.description}
      tool={<WordToPdfInterface label="DOCX to PDF converter" />}
      details={[
        { title: 'DOCX-specific workflow', text: 'This interface accepts DOCX files and goes directly from upload to PDF output.' },
        { title: 'One conversion engine', text: 'The same tested Word-to-PDF processor is reused instead of maintaining a second converter implementation.' },
        { title: 'Immediate download', text: 'The generated PDF is returned in the browser with file size and page-count information when available.' },
      ]}
      faq={faq}
    />
  );
}
