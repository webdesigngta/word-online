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
  { title: 'Write on a familiar page', text: 'A ruled-paper writing surface and notebook margin make the editor feel natural while keeping the speed of an online tool.' },
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
            /* Notepad is an editor-first page: keep the global header and Tools link,
               then put the writing surface immediately in front of the user. */
            .platform-task-page{padding-top:14px;background:#fff}
            .platform-task-page .platform-task-wrap{width:min(1500px,calc(100% - 48px))}
            .platform-task-page .fwo-breadcrumbs,
            .platform-task-page .platform-task-hero{display:none}
            .platform-task-card:has(> .notepad-is-shell){padding:0;border:0;background:transparent;box-shadow:none;overflow:visible}
            .platform-task-card:has(> .notepad-is-shell):before{display:none}
            .platform-task-page .platform-task-grid,
            .platform-task-page .platform-task-related{max-width:1140px;margin-left:auto;margin-right:auto}

            /* Flatter, document-like chrome inspired by a real desktop notepad. */
            .notepad-is-shell{border-radius:15px!important;border-color:#dfe3e8!important;box-shadow:0 2px 7px rgba(32,33,36,.10)!important;background:#fff!important}
            .notepad-is-shell .np-topbar{padding:8px 12px;background:#fff;border-bottom-color:#e1e4e8;backdrop-filter:none;-webkit-backdrop-filter:none}
            .notepad-is-shell .np-mark{width:30px;height:30px;border-radius:9px;font-size:13px}
            .notepad-is-shell .np-toolbar{padding:7px 10px;gap:5px;background:#fff;border-bottom-color:#dfe3e8;box-shadow:0 1px 3px rgba(32,33,36,.06)}
            .notepad-is-shell .np-btn{height:32px;min-width:32px;border-radius:7px}
            .notepad-is-shell .np-select{height:32px}
            .notepad-is-shell .np-heading{width:118px;min-width:118px}

            /* The editor itself is the page: ruled lines plus a soft red notebook margin. */
            .notepad-is-shell .np-workspace{padding:0;min-height:650px;background:#fff;overflow:auto}
            .notepad-is-shell .np-paper-wrap{width:100%;max-width:none;margin:0;overflow:visible}
            .notepad-is-shell .np-paper{min-height:650px;border:0;border-radius:0;box-shadow:none;background:#fff}
            .notepad-is-shell .np-editor{
              min-height:650px;
              padding:11px 46px 80px 98px;
              font-size:16px;
              line-height:28px;
              background-color:#fff;
              background-image:
                linear-gradient(to right,transparent 0,transparent 80px,rgba(232,83,83,.34) 80px,rgba(232,83,83,.34) 81px,transparent 81px),
                repeating-linear-gradient(to bottom,transparent 0,transparent 27px,rgba(102,114,132,.18) 27px,rgba(102,114,132,.18) 28px);
              background-size:100% 100%,100% 28px;
              background-position:0 0,0 8px;
            }
            .notepad-is-shell .np-editor p{margin:0;line-height:28px}
            .notepad-is-shell .np-editor:empty:before{color:#9aa0a6}
            .notepad-is-shell .np-statusbar{background:#fff;border-top-color:#dfe3e8}

            /* Keep the ruled-paper illusion in dark mode instead of reverting to a plain panel. */
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

            /* The normal site header already exposes Tools, Edit, View, Convert and Create.
               Make Tools especially obvious on this editor-first route. */
            .product-site-header .site-nav a:first-child{background:#e8f0fe;color:#174ea6;box-shadow:inset 0 0 0 1px #d2e3fc}

            @media(max-width:760px){
              .platform-task-page{padding-top:8px}
              .platform-task-page .platform-task-wrap{width:calc(100% - 20px)}
              .notepad-is-shell{border-radius:12px!important}
              .notepad-is-shell .np-workspace,
              .notepad-is-shell .np-paper,
              .notepad-is-shell .np-editor{min-height:540px}
              .notepad-is-shell .np-editor{
                padding:9px 22px 64px 70px;
                font-size:15px;
                line-height:27px;
                background-image:
                  linear-gradient(to right,transparent 0,transparent 54px,rgba(232,83,83,.34) 54px,rgba(232,83,83,.34) 55px,transparent 55px),
                  repeating-linear-gradient(to bottom,transparent 0,transparent 26px,rgba(102,114,132,.18) 26px,rgba(102,114,132,.18) 27px);
                background-size:100% 100%,100% 27px;
                background-position:0 0,0 8px;
              }
              .notepad-is-shell .np-editor p{line-height:27px}
              .notepad-is-shell.is-dark .np-editor{
                background-image:
                  linear-gradient(to right,transparent 0,transparent 54px,rgba(245,112,112,.38) 54px,rgba(245,112,112,.38) 55px,transparent 55px),
                  repeating-linear-gradient(to bottom,transparent 0,transparent 26px,rgba(222,226,232,.11) 26px,rgba(222,226,232,.11) 27px);
              }
            }

            @media(max-width:480px){
              .platform-task-page .platform-task-wrap{width:calc(100% - 12px)}
              .notepad-is-shell{border-radius:10px!important}
              .notepad-is-shell .np-editor{padding-right:14px;padding-left:62px}
            }
          `}</style>
          <NotepadInterface toolId={tool.id} />
        </>
      )}
      details={details}
      faq={faq}
    />
  );
}
