import { NotepadInterface } from '@/components/NotepadInterface';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteHeader } from '@/components/SiteHeader';
import { FaqJsonLd } from '@/components/JsonLd';
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
    <>
      <ToolViewAnalytics toolId={tool.id} route={route} />
      <SiteHeader />
      <main className="notepad-native-page">
        <style>{`
          .notepad-native-page{padding:14px 0 72px;background:#fff;color:#202124;font-family:Arial,Helvetica,sans-serif}
          .notepad-native-wrap{width:min(1500px,calc(100% - 48px));margin:0 auto}

          /* Online Notepad owns its editor UI. Generic tool-page upload/button/readability
             normalization is intentionally not used on this route. */
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

          .notepad-native-info{width:min(1140px,calc(100% - 32px));margin:54px auto 0}
          .notepad-native-info-head{text-align:center;max-width:720px;margin:0 auto 24px}
          .notepad-native-info-head h1{margin:0;font-size:clamp(30px,4vw,42px);line-height:1.08;letter-spacing:-.04em;color:#101828}
          .notepad-native-info-head p{margin:12px auto 0;color:#667085;font-size:16px;line-height:1.65}
          .notepad-native-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}
          .notepad-native-card{padding:22px;border:1px solid #e1e6ed;border-radius:16px;background:#fff;box-shadow:0 2px 8px rgba(32,33,36,.05)}
          .notepad-native-card h2{margin:0 0 8px;font-size:18px;letter-spacing:-.02em}.notepad-native-card p{margin:0;color:#667085;font-size:14px;line-height:1.65}
          .notepad-native-faq{max-width:900px;margin:50px auto 0}.notepad-native-faq h2{margin:0 0 16px;text-align:center;font-size:28px;letter-spacing:-.03em}
          .notepad-native-faq details{margin:9px 0;padding:0 18px;border:1px solid #e1e6ed;border-radius:14px;background:#fff}.notepad-native-faq summary{cursor:pointer;padding:16px 0;font-size:15px;font-weight:700}.notepad-native-faq p{margin:0 0 16px;color:#667085;font-size:14px;line-height:1.65}

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
            .notepad-native-grid{grid-template-columns:1fr}
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
        <section className="notepad-native-info" aria-labelledby="notepad-native-title">
          <div className="notepad-native-info-head">
            <h1 id="notepad-native-title">Online Notepad</h1>
            <p>A focused browser notepad with a ruled writing surface, local autosave, formatting tools and simple exports.</p>
          </div>
          <div className="notepad-native-grid">
            {details.map((item) => (
              <article className="notepad-native-card" key={item.title}>
                <h2>{item.title}</h2>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
          <section className="notepad-native-faq" aria-labelledby="notepad-native-faq-title">
            <h2 id="notepad-native-faq-title">Frequently asked questions</h2>
            {faq.map((item) => (
              <details key={item.question}>
                <summary>{item.question}</summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </section>
        </section>
      </main>
      <SiteFooter />
      <FaqJsonLd items={faq} />
    </>
  );
}
