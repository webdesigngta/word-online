import { pageMetadata } from '@/lib/seo';
import { getWordInterface } from '@/tools/word/interfaces/config';
import { WordTaskPage } from '@/components/WordTaskPage';
import { WordCountInterface } from '@/components/WordCountInterface';

const tool = getWordInterface('word-count');
export const metadata = pageMetadata({ title: tool.title, description: tool.description, path: tool.route });

const faq = [
  { question: 'Can I count words without uploading a file?', answer: 'Yes. Paste or type text for instant live word and character counts.' },
  { question: 'Can I count words in a DOCX file?', answer: 'Yes. Upload a DOCX file to calculate words, characters, sentences, paragraphs, headings, tables, images and estimated reading time.' },
  { question: 'How is reading time calculated?', answer: 'The estimate uses roughly 200 words per minute and rounds up to a whole minute.' },
];

export default function WordCountPage() {
  return (
    <WordTaskPage
      eyebrow={tool.eyebrow}
      title="Count words, characters and document statistics"
      description={tool.description}
      tool={<WordCountInterface />}
      details={[
        { title: 'Live text counter', text: 'Paste or type text and the counts update immediately without a page reload.' },
        { title: 'DOCX analysis', text: 'The shared Word statistics processor can inspect uploaded DOCX files and report document structure.' },
        { title: 'More than word count', text: 'See characters, sentences, paragraphs, reading time and DOCX-specific heading, table and image counts.' },
      ]}
      faq={faq}
    />
  );
}
