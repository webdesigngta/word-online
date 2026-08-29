import { pageMetadata } from '@/lib/seo';
import { wordToolSeo } from '@/tools/word';
import { getAllPlatformToolByRoute } from '@/tools/platform/allTools';
import { WordEditorExperience } from '@/components/WordEditorExperience';
import { NativeToolEditorial } from '@/components/NativeToolEditorial';
import { SiteFooter } from '@/components/SiteFooter';
import { SoftwareJsonLd } from '@/components/JsonLd';

const tool = getAllPlatformToolByRoute('/word-online')!;
export const metadata = pageMetadata(wordToolSeo);

const details = [
  { title: 'Write and Edit Word Documents Online', text: 'Use DOC321 as a browser-based Word workspace for everyday writing and document editing when you want the main tools without opening a separate desktop application.' },
  { title: 'Work With Familiar Document Formatting', text: 'Create headings, paragraphs, lists, tables, images, links, page breaks, headers and footers while keeping the document itself at the center of the workspace.' },
  { title: 'Save the Document for the Next Step', text: 'Review your work and export a usable document when you are finished, then move into conversion, sharing or another related document task only if needed.' },
];

const faq = [
  { question: 'Can I use Word Online for free with DOC321?', answer: 'Yes. DOC321 provides a browser-based Word editor for creating and editing common document content without requiring an account for the core workflow.' },
  { question: 'Can I open an existing Word document?', answer: 'Yes. Use the editor start controls to open a supported DOCX file and continue working with its readable document content.' },
  { question: 'Can I download my document?', answer: 'Yes. When you are finished, use the available export controls to save a new document copy for the next step in your workflow.' },
  { question: 'Does the editor autosave?', answer: 'The editor uses local browser state for autosave support so ongoing work can stay available in the same browser.' },
];

const steps = [
  { title: 'Start a document or open DOCX', text: 'Begin with a blank page or load an existing Word document when you already have content to work with.' },
  { title: 'Write and format your content', text: 'Use the editor controls for text, headings, lists, tables, images, links and page structure.' },
  { title: 'Review the document', text: 'Check the writing and important formatting before you export the finished version.' },
  { title: 'Download and continue', text: 'Save the result, then use another DOC321 tool if the document needs conversion, compression, extraction or another step.' },
];

export default function WordOnlinePage() {
  return (
    <>
      <WordEditorExperience interfaceId="word-online" heading="Free Word Online editor" />
      <NativeToolEditorial route={tool.route} description={tool.description} details={details} faq={faq} steps={steps} />
      <SiteFooter />
      <SoftwareJsonLd />
    </>
  );
}
