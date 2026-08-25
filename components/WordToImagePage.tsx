import { PlatformTaskPage } from '@/components/PlatformTaskPage';
import { WordToImageInterface } from '@/components/WordToImageInterface';
import { getAllPlatformToolByRoute } from '@/tools/platform/allTools';
import type { WordImageFormat } from '@/tools/word/to-image/WordToImageProcessor';

const copy: Record<WordImageFormat, { details: Array<{ title: string; text: string }>; faq: Array<{ question: string; answer: string }> }> = {
  jpg: {
    details: [
      { title: 'One JPG per Word page', text: 'The DOCX is rendered to PDF first, then each page is exported as a JPG image.' },
      { title: 'Control image quality', text: 'Choose standard, high, or very high rendering resolution and adjust JPG quality before conversion.' },
      { title: 'Multi-page documents download as ZIP', text: 'Single-page documents download as one JPG; multi-page documents are packaged into one ZIP file.' },
    ],
    faq: [
      { question: 'Can I convert a Word document to JPG?', answer: 'Yes. Choose a DOCX file and the tool renders every Word page as a JPG image.' },
      { question: 'What happens with multi-page Word documents?', answer: 'Each page becomes a separate JPG and all pages are downloaded together as a ZIP file.' },
      { question: 'Will the image look exactly like Microsoft Word?', answer: 'The document is rendered from converted Word content, so complex layouts may differ somewhat from Microsoft Word.' },
    ],
  },
  png: {
    details: [
      { title: 'One PNG per Word page', text: 'Render DOCX content page by page and export the result as PNG images.' },
      { title: 'High-resolution rendering', text: 'Choose standard, high, or very high output resolution before converting.' },
      { title: 'Simple multi-page download', text: 'One-page files download directly; multiple PNG pages are packaged into a ZIP file.' },
    ],
    faq: [
      { question: 'Can I convert Word to PNG online?', answer: 'Yes. Choose a DOCX file and each rendered page is exported as a PNG image.' },
      { question: 'Does PNG use a quality setting?', answer: 'PNG is lossless, so the tool uses resolution rather than a JPEG-style quality control.' },
      { question: 'Does Word to PNG change my original file?', answer: 'No. The source DOCX is left unchanged.' },
    ],
  },
};

export function WordToImagePage({ route, format }: { route: string; format: WordImageFormat }) {
  const tool = getAllPlatformToolByRoute(route);
  if (!tool) throw new Error(`Unknown Word image route: ${route}`);
  const page = copy[format];
  return <PlatformTaskPage route={route} title={tool.title} description={tool.description} tool={<WordToImageInterface format={format} toolId={tool.id} />} details={page.details} faq={page.faq} />;
}
