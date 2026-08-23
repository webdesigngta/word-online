import { pageMetadata } from '@/lib/seo';
import { SeoLanding } from '@/components/SeoLanding';

export const metadata = pageMetadata({
  title: 'DOCX Editor Online – Open & Edit Word Files',
  description: 'Open and edit DOCX files online in your browser. Make text changes, format content and download an editable document.',
  path: '/docx-editor-online',
});

const faq = [
  { question: 'Can I open a DOCX file in the browser?', answer: 'Yes. Choose a DOCX file from your device and the editor converts its document content into an editable browser view.' },
  { question: 'Will every Word layout look exactly the same?', answer: 'Simple documents translate well, but very complex Word layouts, advanced fields, macros and some desktop-only features can differ in a browser editor.' },
  { question: 'Can I export back to DOCX?', answer: 'Yes. The editor can generate a DOCX file with common text and paragraph formatting.' },
];

export default function DocxEditorPage() {
  return <SeoLanding eyebrow="DOCX EDITOR ONLINE" title="Open and edit DOCX files online" description="Make changes to Word documents from your browser without installing Microsoft Word. Import a DOCX file, edit the document, then export a new copy." bullets={["DOCX import", "Browser-based editing", "Familiar ribbon controls", "DOCX export"]} sections={[{ title: 'Open Word documents', text: 'Use the Open button to select a .docx file from your device. The document is converted into clean editable HTML for the browser.' },{ title: 'Make everyday edits', text: 'Change text, headings, alignment, lists, links and basic formatting with familiar controls.' },{ title: 'Export a new copy', text: 'Download a new DOCX file after editing, or export HTML for web use and print to PDF.' }]} faq={faq} />;
}
