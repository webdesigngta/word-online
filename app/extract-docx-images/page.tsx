import { pageMetadata } from '@/lib/seo';
import { getWordInterface } from '@/tools/word/interfaces/config';
import { WordTaskPage } from '@/components/WordTaskPage';
import { DocxExtractImagesInterface } from '@/components/DocxExtractImagesInterface';

const tool = getWordInterface('extract-docx-images');
export const metadata = pageMetadata({ title: tool.title, description: tool.description, path: tool.route });

const faq = [
  { question: 'Can I extract the original images from a DOCX file?', answer: 'The tool reads the DOCX package media folder and exposes supported embedded image files for individual download.' },
  { question: 'Does the tool take screenshots of document pages?', answer: 'No. It extracts embedded image assets from the DOCX package rather than rendering page screenshots.' },
  { question: 'What image formats can be extracted?', answer: 'Common DOCX media formats such as PNG, JPEG, GIF, WebP, BMP and TIFF are recognized when present.' },
];

export default function ExtractDocxImagesPage() {
  return <WordTaskPage eyebrow={tool.eyebrow} title="Extract images from a DOCX file" description={tool.description} tool={<DocxExtractImagesInterface />} details={[
    { title: 'Read embedded media', text: 'The DOCX package is inspected for image assets stored under the document media directory.' },
    { title: 'Preview extracted images', text: 'Supported images appear in a browser gallery so you can identify them before downloading.' },
    { title: 'Download originals', text: 'Each extracted asset is offered as its original packaged image file rather than a recreated screenshot.' },
  ]} faq={faq} />;
}
