import { pageMetadata } from '@/lib/seo';
import { SeoLanding } from '@/components/SeoLanding';

export const metadata = pageMetadata({
  title: 'Free Word Editor Online – No Sign Up',
  description: 'Use a free Word editor online without signing up. Write, format and export documents from a browser.',
  path: '/free-word-editor',
});

const faq = [
  { question: 'Is the Word editor really free?', answer: 'Yes. The basic editor can be used without creating an account or paying a subscription.' },
  { question: 'Do I need Microsoft Word installed?', answer: 'No. The editor runs in a modern web browser and can open DOCX documents directly.' },
  { question: 'Can I download my work?', answer: 'Yes. You can export to DOCX or HTML, and you can use the browser print dialog to save a PDF.' },
];

export default function FreeWordEditorPage() {
  return <SeoLanding eyebrow="FREE WORD EDITOR" title="A free Word editor with no sign-up wall" description="Write and edit documents online with a familiar ribbon-style interface. Start immediately, keep a local autosave, and download your work when you are done." bullets={["No login required", "Common formatting tools", "DOCX and HTML export", "Local browser autosave"]} sections={[{ title: 'Write without installing software', text: 'Use the editor from a modern desktop or mobile browser. There is no desktop installer and no account setup before you can begin writing.' },{ title: 'Format documents quickly', text: 'Apply bold, italics, underline, fonts, sizes, alignment, lists and other common document formatting from the toolbar.' },{ title: 'Keep control of your files', text: 'Basic document editing is performed in the browser. Export a copy to your device when you finish.' }]} faq={faq} />;
}
