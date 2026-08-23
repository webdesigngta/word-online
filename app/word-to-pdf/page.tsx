import { pageMetadata } from '@/lib/seo';
import { getWordInterface } from '@/tools/word/interfaces/config';
import { WordTaskPage } from '@/components/WordTaskPage';
import { WordToPdfInterface } from '@/components/WordToPdfInterface';

const tool = getWordInterface('word-to-pdf');
export const metadata = pageMetadata({ title: tool.title, description: tool.description, path: tool.route });

const faq = [
  { question: 'How do I convert Word to PDF online?', answer: 'Choose a DOCX file, let the browser conversion finish, then download the generated PDF.' },
  { question: 'Do I need Microsoft Word installed?', answer: 'No. The conversion uses the site’s browser-based Word document processor.' },
  { question: 'Can the PDF layout differ from Word?', answer: 'Yes. The converter renders DOCX content through browser HTML, so highly complex Word layouts can differ from Microsoft Word.' },
];

export default function WordToPdfPage() {
  return (
    <WordTaskPage
      eyebrow={tool.eyebrow}
      title="Convert Word to PDF online"
      description={tool.description}
      tool={<WordToPdfInterface label="Word to PDF converter" />}
      details={[
        { title: 'Upload DOCX', text: 'The converter validates and reads your Word document with the shared DOCX processing engine.' },
        { title: 'Browser conversion', text: 'Document content is rendered to a PDF workflow directly in the browser.' },
        { title: 'Download PDF', text: 'When conversion succeeds, download the generated PDF file immediately.' },
      ]}
      faq={faq}
    />
  );
}
