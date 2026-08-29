import { pageMetadata } from '@/lib/seo';
import { getWordInterface } from '@/tools/word/interfaces/config';
import { WordTaskPage } from '@/components/WordTaskPage';
import { WordSingleFileProcessorInterface } from '@/components/WordSingleFileProcessorInterface';
import {
  DocxToHtmlEditorialContent,
  docxToHtmlFaq,
  docxToHtmlHowToSteps,
} from '@/components/DocxToHtmlEditorialContent';

const tool = getWordInterface('docx-to-html');
const seoTitle = 'Free Online DOCX to HTML Converter';
const description = 'Free online DOCX to HTML converter from DOC321. Upload a Word document and convert its content into HTML quickly with a simple browser-based tool.';

export const metadata = pageMetadata({ title: seoTitle, description, path: tool.route });

export default function Page() {
  return (
    <WordTaskPage
      eyebrow={tool.eyebrow}
      title="Convert DOCX to HTML online"
      description={description}
      tool={
        <WordSingleFileProcessorInterface
          processorId="docx-to-html"
          title={tool.name}
          description="Upload your DOCX file and convert it to HTML."
          accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          inputLabel="a DOCX file"
          actionLabel="Converting to HTML"
          downloadLabel="Download HTML"
        />
      }
      details={[]}
      faq={docxToHtmlFaq}
      customContent={<DocxToHtmlEditorialContent />}
      customHowToSteps={docxToHtmlHowToSteps}
    />
  );
}
