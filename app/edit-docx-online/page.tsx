import { pageMetadata } from '@/lib/seo';
import { SeoLanding } from '@/components/SeoLanding';

export const metadata = pageMetadata({
  title: 'Edit DOCX Online Free – Browser Document Editor',
  description: 'Edit DOCX online free with no account. Upload a Word document, make changes in your browser, and download your edited file.',
  path: '/edit-docx-online',
});

const faq = [
  { question: 'How do I edit a DOCX online?', answer: 'Open the editor, choose your DOCX file, make your changes, then use Download DOCX to save a new copy.' },
  { question: 'Do I have to upload the file to an account?', answer: 'No account is required. The browser editor can process common DOCX content locally.' },
  { question: 'Does autosave work?', answer: 'Yes. The editor stores a local draft in the browser so accidental refreshes are less likely to lose recent work.' },
];

export default function EditDocxPage() {
  return <SeoLanding eyebrow="EDIT DOCX ONLINE" title="Edit a DOCX online in a few clicks" description="Open a Word file from your device, edit it with browser-based document tools, and download an updated copy without creating an account." bullets={["Open from your device", "Edit text and formatting", "Local autosave", "Download DOCX"]} sections={[{ title: '1. Open your document', text: 'Choose a DOCX file from your computer or phone. The document content is loaded into the editor.' },{ title: '2. Make your edits', text: 'Write, delete and format text, create lists, add links, insert images and build simple tables.' },{ title: '3. Download the result', text: 'Export an editable DOCX copy, save HTML, or print the document to PDF.' }]} faq={faq} />;
}
