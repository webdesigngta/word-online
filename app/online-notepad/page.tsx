import { NotepadInterface } from '@/components/NotepadInterface';
import { PlatformTaskPage } from '@/components/PlatformTaskPage';
import { pageMetadata } from '@/lib/seo';
import { getPlatformToolByRoute } from '@/tools/platform/catalog';

const route = '/online-notepad';
const tool = getPlatformToolByRoute(route)!;

export const metadata = pageMetadata({
  title: tool.title,
  description: tool.description,
  path: tool.route,
});

const details = [
  { title: 'Write without friction', text: 'Start typing immediately in a clean rich-text canvas with headings, fonts, lists, links, images and tables.' },
  { title: 'Autosave in your browser', text: 'Your note is saved locally as you type. Dark mode and zoom preferences are remembered on the same browser.' },
  { title: 'Export when you are done', text: 'Copy your note or download it as TXT, HTML or PDF. You can also open text, Markdown and HTML files.' },
];

const faq = [
  { question: 'Does the Online Notepad autosave?', answer: 'Yes. The editor automatically saves the current note to local browser storage as you type.' },
  { question: 'What formatting does the notepad support?', answer: 'You can use headings, fonts, bold, italic, underline, strikethrough, text color, alignment, lists, links, images, tables and dates.' },
  { question: 'Can I download my note?', answer: 'Yes. The notepad can export the current note as TXT, HTML or PDF.' },
  { question: 'Can I use speech to text?', answer: 'Yes in browsers that provide the Web Speech Recognition API. Use the microphone button to start and stop dictation.' },
];

export default function Page() {
  return (
    <PlatformTaskPage
      route={route}
      title={tool.title}
      description={tool.description}
      tool={(
        <>
          <style>{`
            .platform-task-card:has(> .notepad-is-shell){padding:0;border:0;background:transparent;box-shadow:none;overflow:visible}
            .platform-task-card:has(> .notepad-is-shell):before{display:none}
          `}</style>
          <NotepadInterface toolId={tool.id} />
        </>
      )}
      details={details}
      faq={faq}
    />
  );
}
