import { NotepadInterface } from '@/components/NotepadInterface';
import { NativeToolEditorial } from '@/components/NativeToolEditorial';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteHeader } from '@/components/SiteHeader';
import { ToolViewAnalytics } from '@/components/ToolViewAnalytics';
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
  { title: 'Write Notes on a Familiar Page', text: 'A ruled-paper writing surface and notebook margin make the editor feel natural while keeping the speed and convenience of an online notepad.' },
  { title: 'Autosave Notes in Your Browser', text: 'Your current note is saved locally as you type, and useful preferences such as dark mode and zoom can stay available in the same browser.' },
  { title: 'Copy or Export When You Are Done', text: 'Copy your writing or download it as TXT, HTML or PDF. You can also open text, Markdown and HTML files when you already have content to continue.' },
];

const faq = [
  { question: 'Does the Online Notepad autosave?', answer: 'Yes. The editor automatically saves the current note to local browser storage as you type.' },
  { question: 'What formatting does the notepad support?', answer: 'You can use headings, fonts, bold, italic, underline, strikethrough, text color, alignment, lists, links, images, tables and dates.' },
  { question: 'Can I download my note?', answer: 'Yes. The notepad can export the current note as TXT, HTML or PDF.' },
  { question: 'Can I use speech to text?', answer: 'Yes in browsers that provide the Web Speech Recognition API. Use the microphone button to start and stop dictation.' },
];

const steps = [
  { title: 'Start typing your note', text: 'Click into the ruled writing page and begin with a blank note, or open supported text content you already have.' },
  { title: 'Format only when you need to', text: 'Use headings, lists, links, images, tables and other writing controls when the note needs more structure.' },
  { title: 'Let local autosave keep your current work', text: 'The notepad stores the current note in local browser storage while you write.' },
  { title: 'Copy or download the result', text: 'Take the finished note as copied text or export it as TXT, HTML or PDF for the next task.' },
];

export default function Page() {
  return (
    <>
      <ToolViewAnalytics toolId={tool.id} route={route} />
      <SiteHeader />
      <main className="notepad-native-page">
        <style>{`
          .notepad-native-page{padding:14px 0 0;background:#fff;color:#202124;font-family:Arial,Helvetica,sans-serif}
          .notepad-native-wrap{width:min(1500px,calc(100% - 48px));margin:0 auto}

          /* Online Notepad owns its editor UI. Generic upload normalization is intentionally not used here. */
          .notepad-is-shell{border-radius:15px!important;border-color:#dfe3e8!important;box-shadow:0 2px 7px rgba(32,33,36,.10)!important;background:#fff!important}
          .notepad-is-shell .np-topbar{padding:8px 12px;background:#fff;border-bottom-color:#e1e4e8;backdrop-filter:none;-webkit-backdrop-filter:none}
          .notepad-is-shell .np-mark{width:30px;height:30px;border-radius:9px;font-size:13px}
          .notepad-is-shell .np-toolbar{padding:7px 10px;gap:5px;background:#fff;border-bottom-color:#dfe3e8;box-shadow:0 1px 3px rgba(32,33,36,.06)}
          .notepad-is-shell .np-btn{height:32px;min-width:32px;border-radius:7px}
          .notepad-is-shell .np-select{height:32px}
          .notepad-is-shell .np-heading{width:118px;min-width:118px}

          .notepad-is-shell .np-workspace{padding:0;min-height:650px;background:#fff;overflow:auto}
          .notepad-is-shell .np-paper-wrap{width:100%;max-width:none;margin:0;overflow:visible}
          .notepad-is-shell .np-paper{min-height:650px;border:0;border-radius:0;box-shadow:none;background:#fff}
          .notepad-is-shell .np-editor{
            min-height:650px;
            padding:3px 46px 80px 98px;
            font-size:16px;
            line-height:28px;
            background-color:#fff;
            background-image:
              linear-gradient(to right,transparent 0,transparent 80px,rgba(232,83,83,.34) 80px,rgba(232,83,83,.34) 81px,transparent 81px),
              repeating-linear-gradient(to bottom,transparent 0,transparent 27px,rgba(102,114,132,.18) 27px,rgba(102,114,132,.18) 28px);
            background-size:100% 100%,100% 28px;
            background-position:0 0,0 0;
          }
          .notepad-is-shell .np-editor p{margin:0;line-height:28px}
          .notepad-is-shell .np-editor:empty:before{color:#9aa0a6}
          .notepad-is-shell .np-statusbar{background:#fff;border-top-color:#dfe3e8}

          .notepad-is-shell.is-dark{background:#17191d!important}
          .notepad-is-shell.is-dark .np-topbar,
          .notepad-is-shell.is-dark .np-toolbar,
          .notepad-is-shell.is-dark .np-statusbar{background:#1c1e23}
          .notepad-is-shell.is-dark .np-workspace,
          .notepad-is-shell.is-dark .np-paper{background:#1c1e23}
          .notepad-is-shell.is-dark .np-editor{
            background-color:#1c1e23;
            background-image:
              linear-gradient(to right,transparent 0,transparent 80px,rgba(245,112,112,.38) 80px,rgba(245,112,112,.38) 81px,transparent 81px),
              repeating-linear-gradient(to bottom,transparent 0,transparent 27px,rgba(222,226,232,.11) 27px,rgba(222,226,232,.11) 28px);
          }

          .product-site-header .site-nav a:first-child{background:#e8f0fe;color:#174ea6;box-shadow:inset 0 0 0 1px #d2e3fc}

          @media(max-width:760px){
            .notepad-native-page{padding-top:8px}
            .notepad-native-wrap{width:calc(100% - 20px)}
            .notepad-is-shell{border-radius:12px!important}
            .notepad-is-shell .np-workspace,
            .notepad-is-shell .np-paper,
            .notepad-is-shell .np-editor{min-height:540px}
            .notepad-is-shell .np-editor{
              padding:1px 22px 64px 70px;
              font-size:15px;
              line-height:27px;
              background-image:
                linear-gradient(to right,transparent 0,transparent 54px,rgba(232,83,83,.34) 54px,rgba(232,83,83,.34) 55px,transparent 55px),
                repeating-linear-gradient(to bottom,transparent 0,transparent 26px,rgba(102,114,132,.18) 26px,rgba(102,114,132,.18) 27px);
              background-size:100% 100%,100% 27px;
              background-position:0 0,0 0;
            }
            .notepad-is-shell .np-editor p{line-height:27px}
            .notepad-is-shell.is-dark .np-editor{
              background-image:
                linear-gradient(to right,transparent 0,transparent 54px,rgba(245,112,112,.38) 54px,rgba(245,112,112,.38) 55px,transparent 55px),
                repeating-linear-gradient(to bottom,transparent 0,transparent 26px,rgba(222,226,232,.11) 26px,rgba(222,226,232,.11) 27px);
            }
          }

          @media(max-width:480px){
            .notepad-native-wrap{width:calc(100% - 12px)}
            .notepad-is-shell{border-radius:10px!important}
            .notepad-is-shell .np-editor{padding-right:14px;padding-left:62px}
          }
        `}</style>
        <div className="notepad-native-wrap">
          <NotepadInterface toolId={tool.id} />
        </div>
      </main>
      <NativeToolEditorial route={route} description={tool.description} details={details} faq={faq} steps={steps} />
      <SiteFooter />
    </>
  );
}
