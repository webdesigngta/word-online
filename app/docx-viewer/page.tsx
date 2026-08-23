import { pageMetadata } from '@/lib/seo';
import { getWordInterface } from '@/tools/word/interfaces/config';
import { WordTaskPage } from '@/components/WordTaskPage';
import { DocxViewerInterface } from '@/components/DocxViewerInterface';

const tool = getWordInterface('docx-viewer');
export const metadata = pageMetadata({ title: tool.title, description: tool.description, path: tool.route });

const faq = [
  { question: 'Can I open a DOCX file without Word?', answer: 'Yes. Choose a DOCX file and the viewer converts its readable content into a browser preview.' },
  { question: 'Does the viewer edit my file?', answer: 'No. This interface is read-only. Use the DOCX Editor if you want to change the document.' },
  { question: 'Will every Word feature appear exactly the same?', answer: 'The viewer is designed for readable document content. Advanced Word-only fields, macros and highly complex layouts can be simplified.' },
];

export default function DocxViewerPage() {
  return (
    <WordTaskPage
      eyebrow={tool.eyebrow}
      title="Open and view DOCX files online"
      description={tool.description}
      tool={<DocxViewerInterface />}
      details={[
        { title: 'Read-only by design', text: 'The viewer solves the viewing task without exposing editing controls or changing the uploaded document.' },
        { title: 'Uses the shared DOCX engine', text: 'The same Word document processing layer powers the viewer and other document tools.' },
        { title: 'No software install', text: 'The preview is generated in the browser, making it useful on computers without Microsoft Word.' },
      ]}
      faq={faq}
    />
  );
}
