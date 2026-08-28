import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  Layers,
  Lock,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Zap,
} from 'lucide-react';
import { pageMetadata } from '@/lib/seo';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteHeader } from '@/components/SiteHeader';
import { SoftwareJsonLd } from '@/components/JsonLd';
import { ToolVisual } from '@/components/ToolVisual';
import { HomeToolSearch, type HomeSearchTool } from '@/components/HomeToolSearch';
import { allLivePlatformTools } from '@/tools/platform/allTools';

export const metadata = pageMetadata({
  title: 'DOC321 – Free Online PDF & Document Tools',
  description: 'Use free online PDF and document tools to edit, convert, compress, merge, organize and work with Word files, images and more.',
  path: '/',
});

const popularRoutes = ['/pdf-to-word', '/compress-pdf', '/merge-pdf', '/edit-pdf', '/word-to-pdf', '/jpg-to-pdf'];
const popularTools = popularRoutes
  .map((route) => allLivePlatformTools.find((tool) => tool.route === route))
  .filter((tool): tool is NonNullable<typeof tool> => Boolean(tool));

const searchTools: readonly HomeSearchTool[] = allLivePlatformTools.map((tool) => ({
  route: tool.route,
  name: tool.name,
  primaryIntent: tool.primaryIntent,
  searchText: [tool.name, tool.primaryIntent, tool.description, tool.cluster, ...tool.input, ...tool.output, ...tool.secondaryKeywords].join(' '),
}));

const features = [
  { title: 'Free to use', detail: 'Start with any tool', Icon: Sparkles },
  { title: 'No signup', detail: 'Get straight to work', Icon: UserCheck },
  { title: 'Fast & simple', detail: 'Built for quick tasks', Icon: Zap },
  { title: 'Private by design', detail: 'Your files stay yours', Icon: ShieldCheck },
  { title: 'Automatic cleanup', detail: 'Files deleted after 10 min', Icon: Clock },
] as const;

const reasons = [
  { title: 'One simple toolkit', detail: 'Convert, edit, merge, compress and organize documents without jumping between websites.', Icon: Layers },
  { title: 'Built for speed', detail: 'Straightforward tools, clear actions and lightweight pages keep common document jobs moving.', Icon: Zap },
  { title: 'Privacy first', detail: 'Files are handled only for the task you choose and are automatically cleaned up after processing.', Icon: Lock },
  { title: 'Useful downloads', detail: 'Finish the job and download the result directly, with no account needed to get started.', Icon: Download },
  { title: 'Works in your browser', detail: 'Use DOC321 from desktop, tablet or phone without installing another desktop application.', Icon: FileText },
  { title: 'Easy from the first click', detail: 'Search for what you need, open a tool and follow a focused workflow with minimal clutter.', Icon: CheckCircle2 },
] as const;

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main className="doc-home">
        <style>{`
          .doc-home{--ink:#191b1f;--muted:#686d75;--line:#e5e7eb;--soft:#f6f7f8;--soft2:#fafafa;--blue:#2563eb;--blue-soft:#eff6ff;background:#fff;color:var(--ink);font-family:Arial,Helvetica,sans-serif}
          .dh-wrap{width:min(1160px,calc(100% - 40px));margin:0 auto}
          .dh-hero{padding:86px 0 48px;text-align:center}
          .dh-hero-inner{max-width:890px;margin:0 auto}
          .dh-eyebrow{display:inline-flex;align-items:center;gap:7px;margin-bottom:18px;padding:7px 11px;border:1px solid #e2e5ea;border-radius:999px;background:#fafbfc;color:#5b6169;font-size:11px;font-weight:700;letter-spacing:.02em}
          .dh-eyebrow:before{content:'';width:6px;height:6px;border-radius:50%;background:var(--blue)}
          .dh-hero h1{max-width:820px;margin:0 auto 17px;font-size:clamp(46px,6.1vw,72px);line-height:.98;letter-spacing:-.055em;font-weight:800}
          .dh-hero-copy{max-width:670px;margin:0 auto;color:var(--muted);font-size:17px;line-height:1.65}
          .dh-search-area{position:relative;z-index:8;width:min(780px,100%);margin:31px auto 0;text-align:left}
          .home-tool-search{position:relative}
          .hts-form{display:flex;align-items:center;gap:12px;min-height:64px;padding:0 18px;border:1px solid #cfd4dc;border-radius:14px;background:#fff;box-shadow:0 12px 34px rgba(17,24,39,.08);transition:border-color .15s,box-shadow .15s}
          .hts-form:focus-within{border-color:#8bb0f9;box-shadow:0 0 0 4px rgba(37,99,235,.10),0 14px 38px rgba(17,24,39,.09)}
          .hts-form svg{color:#626871;flex:0 0 auto}
          .hts-form input{min-width:0;flex:1;border:0;outline:0;background:transparent;color:var(--ink);font-size:15px}
          .hts-form input::placeholder{color:#8a9098}
          .hts-clear{width:36px;height:36px;display:grid;place-items:center;border:0;border-radius:50%;background:transparent;color:#626871;cursor:pointer}
          .hts-clear:hover{background:#f1f3f5}
          .hts-results{position:absolute;left:0;right:0;top:72px;background:#fff;border:1px solid #dde1e7;border-radius:14px;padding:7px;box-shadow:0 20px 44px rgba(17,24,39,.16);z-index:30}
          .hts-result{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:11px 12px;border-radius:10px;color:var(--ink);text-decoration:none}
          .hts-result:hover{background:#f7f8fa}
          .hts-result span{min-width:0}
          .hts-result strong{display:block;font-size:13px}
          .hts-result small{display:block;margin-top:3px;color:var(--muted);font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
          .hts-result svg{color:#8a9098;flex:0 0 auto}
          .hts-no-result{padding:12px}
          .hts-quick{display:flex;align-items:center;justify-content:center;gap:7px;flex-wrap:wrap;margin-top:13px}
          .hts-quick>span{color:#747981;font-size:10px;font-weight:700}
          .hts-quick a{display:inline-flex;align-items:center;min-height:28px;padding:0 9px;border:1px solid #dfe3e8;border-radius:999px;color:#40454b;background:#fff;text-decoration:none;font-size:10px;font-weight:700}
          .hts-quick a:hover{background:#f8f9fa;border-color:#c9ced5}
          .dh-features{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));max-width:980px;margin:40px auto 0;padding:18px 0 0;border-top:1px solid var(--line)}
          .dh-feature{display:flex;align-items:center;justify-content:center;gap:9px;min-width:0;padding:0 12px;text-align:left;position:relative}
          .dh-feature:not(:last-child):after{content:'';position:absolute;right:0;top:2px;bottom:2px;width:1px;background:#eceef1}
          .dh-feature-icon{width:31px;height:31px;display:grid;place-items:center;border-radius:10px;background:#f4f6f8;color:#4b5563;flex:0 0 auto}
          .dh-feature strong{display:block;font-size:11px;line-height:1.2}
          .dh-feature small{display:block;margin-top:2px;color:#858b93;font-size:9px;line-height:1.3}
          .dh-section{padding:82px 0}
          .dh-section-soft{background:linear-gradient(180deg,#fafafa 0%,#fff 100%);border-top:1px solid #f0f1f3;border-bottom:1px solid #f0f1f3}
          .dh-section-head{max-width:680px;margin:0 auto 30px;text-align:center}
          .dh-section-kicker{display:block;margin-bottom:8px;color:#6b7280;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.1em}
          .dh-section-head h2{margin:0;font-size:clamp(30px,3.6vw,42px);line-height:1.06;letter-spacing:-.045em}
          .dh-section-head p{max-width:600px;margin:13px auto 0;color:var(--muted);font-size:14px;line-height:1.65}
          .dh-popular-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
          .dh-tool-card{display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:13px;min-height:92px;padding:16px;border:1px solid #dfe3e8;border-radius:13px;background:#fff;color:var(--ink);text-decoration:none;transition:transform .15s,border-color .15s,box-shadow .15s}
          .dh-tool-card:hover{transform:translateY(-2px);border-color:#c9ced5;box-shadow:0 10px 24px rgba(17,24,39,.07)}
          .dh-tool-card>span{min-width:0}
          .dh-tool-card strong{display:block;font-size:13px;line-height:1.25}
          .dh-tool-card small{display:block;margin-top:5px;color:var(--muted);font-size:10px;line-height:1.35}
          .dh-tool-arrow{color:#8a9098}
          .tool-visual{display:inline-flex;align-items:center;justify-content:center;gap:3px;color:#fff;font-weight:800;letter-spacing:-.02em;box-shadow:inset 0 -1px 0 rgba(0,0,0,.12);flex:0 0 auto}
          .tool-visual span{color:#fff!important;margin:0!important;line-height:1!important}
          .tool-visual b{font-size:.75em;opacity:.88}
          .tool-visual-md{width:44px;height:44px;border-radius:11px;font-size:8px}
          .dh-center-action{display:flex;justify-content:center;margin-top:25px}
          .dh-outline-link,.dh-solid-link{display:inline-flex;align-items:center;justify-content:center;gap:7px;min-height:42px;padding:0 16px;border-radius:9px;font-size:12px;font-weight:800;text-decoration:none}
          .dh-outline-link{border:1px solid #ccd1d7;background:#fff;color:#272a2f}
          .dh-outline-link:hover{background:#f7f8f9}
          .dh-solid-link{border:1px solid #202124;background:#202124;color:#fff}
          .dh-solid-link:hover{background:#090a0b}
          .dh-story{padding:16px 0 30px}
          .dh-story-row{display:grid;grid-template-columns:minmax(0,.92fr) minmax(420px,1.08fr);gap:78px;align-items:center;padding:72px 0;border-bottom:1px solid #eceef1}
          .dh-story-row:last-child{border-bottom:0}
          .dh-story-row.reverse .dh-story-copy{order:2}
          .dh-story-row.reverse .dh-visual{order:1}
          .dh-story-copy{max-width:470px}
          .dh-story-copy h2{margin:0 0 14px;font-size:clamp(29px,3.2vw,39px);line-height:1.08;letter-spacing:-.04em}
          .dh-story-copy p{margin:0;color:var(--muted);font-size:14px;line-height:1.72}
          .dh-text-link{display:inline-flex;align-items:center;gap:6px;margin-top:18px;color:#24272b;font-size:12px;font-weight:800;text-decoration:none}
          .dh-text-link:hover{text-decoration:underline}
          .dh-visual{position:relative;min-height:310px;display:grid;place-items:center;border-radius:22px;background:#f6f7f8;overflow:hidden}
          .dh-visual:before,.dh-visual:after{content:'';position:absolute;border-radius:24px;background:#e6e8eb;transform:rotate(-16deg)}
          .dh-visual:before{width:170px;height:170px;right:30px;top:24px}
          .dh-visual:after{width:120px;height:120px;left:38px;bottom:8px;transform:rotate(18deg);background:#eceef0}
          .mock-window{position:relative;z-index:2;width:min(76%,430px);height:228px;border:1px solid #cfd3d8;border-radius:12px;background:#fff;box-shadow:0 16px 35px rgba(17,24,39,.08);overflow:hidden}
          .mock-top{height:28px;display:flex;align-items:center;gap:5px;padding:0 10px;border-bottom:1px solid #e6e8eb;background:#fafafa}
          .mock-dot{width:6px;height:6px;border-radius:50%;background:#d4d7db}
          .mock-body{display:grid;grid-template-columns:45px 1fr;height:calc(100% - 28px)}
          .mock-side{display:grid;align-content:start;justify-content:center;gap:9px;padding-top:15px;border-right:1px solid #eceef0;background:#fcfcfc}
          .mock-side span{width:15px;height:15px;border:1px solid #cfd3d8;border-radius:4px;background:#f4f5f6}
          .mock-paper{padding:22px 25px}
          .mock-line{height:7px;border-radius:4px;background:#e6e8eb;margin-bottom:10px}
          .mock-line.w1{width:48%}.mock-line.w2{width:74%}.mock-line.w3{width:62%}.mock-line.w4{width:84%}
          .mock-select{width:45%;height:55px;margin:22px auto 0;border:1px dashed #747b84;border-radius:4px;display:grid;place-items:center}
          .mock-sign{width:58px;height:2px;background:#8d939a;transform:rotate(-11deg);box-shadow:10px -5px 0 -1px #8d939a,-8px 5px 0 -1px #8d939a}
          .convert-stage{position:relative;z-index:2;display:flex;align-items:center;gap:24px}
          .convert-file{width:145px;height:185px;padding:18px;border:1px solid #d0d4d9;border-radius:14px;background:#fff;box-shadow:0 14px 30px rgba(17,24,39,.07)}
          .convert-file b{display:grid;place-items:center;width:48px;height:48px;border-radius:12px;background:#f0f2f4;color:#50565e;font-size:12px}
          .convert-file .mock-line:first-of-type{margin-top:26px}
          .convert-arrow{width:42px;height:42px;display:grid;place-items:center;border-radius:50%;background:#202124;color:#fff}
          .stack-stage{position:relative;z-index:2;width:330px;height:220px}
          .stack-card{position:absolute;width:235px;height:160px;padding:22px;border:1px solid #d2d6db;border-radius:13px;background:#fff;box-shadow:0 12px 28px rgba(17,24,39,.07)}
          .stack-card.one{left:10px;top:38px;transform:rotate(-5deg)}
          .stack-card.two{left:50px;top:25px;transform:rotate(2deg)}
          .stack-card.three{left:86px;top:39px;transform:rotate(7deg)}
          .stack-chip{display:inline-flex;align-items:center;gap:6px;margin-top:18px;padding:6px 8px;border:1px solid #e0e3e7;border-radius:7px;color:#6a7078;font-size:9px;font-weight:800}
          .word-stage{position:relative;z-index:2;width:min(70%,360px);height:230px;padding:32px 35px;border:1px solid #d2d6db;border-radius:10px;background:#fff;box-shadow:0 16px 34px rgba(17,24,39,.08)}
          .word-stage:before{content:'A';position:absolute;right:22px;top:18px;width:34px;height:34px;display:grid;place-items:center;border-radius:8px;background:#f0f2f4;color:#4f555d;font-weight:800}
          .word-blocks{display:grid;grid-template-columns:1.4fr .7fr;gap:14px;margin-top:22px}
          .word-image{height:82px;border-radius:8px;background:#e9ebee}
          .word-text .mock-line{height:6px;margin-bottom:8px}
          .dh-reasons{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}
          .dh-reason{padding:24px;border:1px solid #e0e3e7;border-radius:14px;background:#fff}
          .dh-reason-icon{width:40px;height:40px;display:grid;place-items:center;margin-bottom:17px;border-radius:11px;background:#f2f4f6;color:#4f5660}
          .dh-reason h3{margin:0;font-size:14px;letter-spacing:-.015em}
          .dh-reason p{margin:8px 0 0;color:var(--muted);font-size:11px;line-height:1.6}
          .dh-cta{padding:0 0 84px}
          .dh-cta-card{position:relative;overflow:hidden;display:grid;grid-template-columns:1.15fr .85fr;align-items:center;gap:40px;min-height:250px;padding:46px 52px;border-radius:20px;background:linear-gradient(135deg,#f6f7f8 0%,#eceef1 100%)}
          .dh-cta-copy{position:relative;z-index:2;max-width:550px}
          .dh-cta h2{margin:0 0 12px;font-size:clamp(31px,4vw,46px);line-height:1.02;letter-spacing:-.05em}
          .dh-cta p{margin:0 0 22px;color:#626871;font-size:13px;line-height:1.65}
          .dh-cta-art{position:relative;min-height:160px}
          .dh-cta-art span{position:absolute;border-radius:22px;background:#cfd3d8;transform:rotate(19deg)}
          .dh-cta-art .a{width:128px;height:128px;right:40px;top:6px}
          .dh-cta-art .b{width:86px;height:86px;right:154px;top:65px;transform:rotate(-13deg);background:#d9dce0}
          .dh-cta-art .c{width:64px;height:64px;right:5px;bottom:5px;transform:rotate(8deg);background:#e1e3e6}
          @media(max-width:980px){
            .dh-hero{padding-top:68px}
            .dh-features{grid-template-columns:repeat(3,minmax(0,1fr));row-gap:18px}
            .dh-feature:nth-child(3):after,.dh-feature:last-child:after{display:none}
            .dh-popular-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
            .dh-story-row{grid-template-columns:1fr;gap:34px;padding:58px 0}
            .dh-story-row.reverse .dh-story-copy,.dh-story-row.reverse .dh-visual{order:initial}
            .dh-story-copy{max-width:620px;text-align:center;margin:0 auto}
            .dh-visual{width:min(720px,100%);margin:0 auto}
            .dh-reasons{grid-template-columns:repeat(2,minmax(0,1fr))}
          }
          @media(max-width:680px){
            .dh-wrap{width:min(100% - 24px,1160px)}
            .dh-hero{padding:52px 0 34px}
            .dh-eyebrow{font-size:10px;margin-bottom:15px}
            .dh-hero h1{max-width:520px;font-size:clamp(40px,12vw,54px)}
            .dh-hero-copy{font-size:14px;max-width:520px}
            .dh-search-area{margin-top:24px}
            .hts-form{min-height:56px;padding:0 14px;border-radius:12px}
            .hts-form input{font-size:13px}
            .hts-results{top:64px}
            .hts-quick{margin-top:11px}
            .hts-quick>span{width:100%;text-align:center}
            .dh-features{grid-template-columns:repeat(2,minmax(0,1fr));margin-top:28px;padding-top:16px;row-gap:17px}
            .dh-feature{justify-content:flex-start;padding:0 9px}
            .dh-feature:nth-child(even):after{display:none}
            .dh-feature:nth-child(odd):after{display:block}
            .dh-feature:last-child{grid-column:1/-1;justify-content:center}
            .dh-feature:last-child:after{display:none}
            .dh-section{padding:62px 0}
            .dh-section-head{margin-bottom:24px}
            .dh-section-head p{font-size:12px}
            .dh-popular-grid{grid-template-columns:1fr}
            .dh-tool-card{min-height:84px}
            .dh-story{padding-top:0}
            .dh-story-row{padding:48px 0;gap:28px}
            .dh-story-copy h2{font-size:30px}
            .dh-story-copy p{font-size:12px}
            .dh-visual{min-height:250px;border-radius:16px}
            .mock-window{width:84%;height:190px}
            .mock-body{grid-template-columns:38px 1fr}
            .mock-paper{padding:18px}
            .mock-select{height:44px;margin-top:14px}
            .convert-stage{gap:13px}
            .convert-file{width:108px;height:150px;padding:14px}
            .convert-file b{width:40px;height:40px;font-size:10px}
            .convert-file .mock-line:first-of-type{margin-top:19px}
            .convert-arrow{width:34px;height:34px}
            .stack-stage{transform:scale(.82)}
            .word-stage{width:82%;height:195px;padding:27px 25px}
            .dh-reasons{grid-template-columns:1fr}
            .dh-reason{padding:21px}
            .dh-cta{padding-bottom:62px}
            .dh-cta-card{grid-template-columns:1fr;min-height:0;padding:38px 27px;text-align:center}
            .dh-cta-art{display:none}
            .dh-solid-link{width:100%}
          }
          @media(max-width:390px){
            .dh-feature small{display:none}
            .dh-feature{justify-content:center;text-align:center}
            .dh-feature-icon{display:none}
            .convert-file{width:96px}
          }
        `}</style>

        <section className="dh-hero" aria-labelledby="home-heading">
          <div className="dh-wrap">
            <div className="dh-hero-inner">
              <span className="dh-eyebrow">{allLivePlatformTools.length}+ online document tools</span>
              <h1 id="home-heading">Every document tool you need. In one place.</h1>
              <p className="dh-hero-copy">Edit, convert, compress, merge and organize PDFs, Word files, images and more — fast, free and right in your browser.</p>

              <div className="dh-search-area">
                <HomeToolSearch tools={searchTools} />
              </div>

              <div className="dh-features" aria-label="DOC321 features">
                {features.map(({ title, detail, Icon }) => (
                  <div className="dh-feature" key={title}>
                    <span className="dh-feature-icon"><Icon size={15} aria-hidden="true" /></span>
                    <span><strong>{title}</strong><small>{detail}</small></span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="dh-section dh-section-soft" aria-labelledby="popular-tools-heading">
          <div className="dh-wrap">
            <div className="dh-section-head">
              <span className="dh-section-kicker">Most popular</span>
              <h2 id="popular-tools-heading">Popular PDF & document tools</h2>
              <p>Jump into the everyday tools people use most to convert, compress, combine and edit documents.</p>
            </div>

            <div className="dh-popular-grid">
              {popularTools.map((tool) => (
                <Link className="dh-tool-card" href={tool.route} key={tool.id}>
                  <ToolVisual tool={tool} size="md" />
                  <span><strong>{tool.name}</strong><small>{tool.primaryIntent}</small></span>
                  <ArrowRight className="dh-tool-arrow" size={16} aria-hidden="true" />
                </Link>
              ))}
            </div>

            <div className="dh-center-action">
              <Link className="dh-outline-link" href="/tools">View all tools<ArrowRight size={14} /></Link>
            </div>
          </div>
        </section>

        <section className="dh-story" aria-label="What you can do with DOC321">
          <div className="dh-wrap">
            <div className="dh-story-row">
              <div className="dh-story-copy">
                <h2>Work directly on your files</h2>
                <p>Edit text, adjust content and handle everyday document tasks in a focused workspace. DOC321 keeps the workflow simple so you can open a tool, finish the job and move on.</p>
                <Link className="dh-text-link" href="/edit-pdf">Edit PDF<ArrowRight size={14} /></Link>
              </div>
              <div className="dh-visual" aria-hidden="true">
                <div className="mock-window">
                  <div className="mock-top"><span className="mock-dot" /><span className="mock-dot" /><span className="mock-dot" /></div>
                  <div className="mock-body">
                    <div className="mock-side"><span /><span /><span /><span /></div>
                    <div className="mock-paper">
                      <div className="mock-line w1" /><div className="mock-line w4" /><div className="mock-line w2" /><div className="mock-line w3" />
                      <div className="mock-select"><span className="mock-sign" /></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="dh-story-row reverse">
              <div className="dh-story-copy">
                <h2>Convert documents without the mess</h2>
                <p>Move between PDF, Word, JPG and other useful formats with clear tools built around a single job. No complicated software menus, just pick the conversion you need.</p>
                <Link className="dh-text-link" href="/pdf-to-word">Convert PDF to Word<ArrowRight size={14} /></Link>
              </div>
              <div className="dh-visual" aria-hidden="true">
                <div className="convert-stage">
                  <div className="convert-file"><b>PDF</b><div className="mock-line w4" /><div className="mock-line w2" /><div className="mock-line w3" /></div>
                  <span className="convert-arrow"><ArrowRight size={17} /></span>
                  <div className="convert-file"><b>DOCX</b><div className="mock-line w3" /><div className="mock-line w4" /><div className="mock-line w2" /></div>
                </div>
              </div>
            </div>

            <div className="dh-story-row">
              <div className="dh-story-copy">
                <h2>Compress, merge and organize PDFs</h2>
                <p>Reduce file size, combine multiple documents, split pages and keep PDF tasks under control. Each tool is designed to make one common job obvious and quick.</p>
                <Link className="dh-text-link" href="/merge-pdf">Merge PDF<ArrowRight size={14} /></Link>
              </div>
              <div className="dh-visual" aria-hidden="true">
                <div className="stack-stage">
                  <div className="stack-card one"><div className="mock-line w3" /><div className="mock-line w4" /><div className="stack-chip">PDF page 1</div></div>
                  <div className="stack-card two"><div className="mock-line w2" /><div className="mock-line w4" /><div className="stack-chip">PDF page 2</div></div>
                  <div className="stack-card three"><div className="mock-line w1" /><div className="mock-line w3" /><div className="stack-chip">Combined file</div></div>
                </div>
              </div>
            </div>

            <div className="dh-story-row reverse">
              <div className="dh-story-copy">
                <h2>Create and finish documents online</h2>
                <p>Work with Word documents from your browser, then convert or download what you need. DOC321 brings document creation and utility tools together in one consistent place.</p>
                <Link className="dh-text-link" href="/word-online">Open Word Online<ArrowRight size={14} /></Link>
              </div>
              <div className="dh-visual" aria-hidden="true">
                <div className="word-stage">
                  <div className="mock-line w1" /><div className="mock-line w4" /><div className="mock-line w2" />
                  <div className="word-blocks">
                    <div className="word-text"><div className="mock-line w4" /><div className="mock-line w2" /><div className="mock-line w3" /><div className="mock-line w4" /></div>
                    <div className="word-image" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="dh-section dh-section-soft" aria-labelledby="why-doc321-heading">
          <div className="dh-wrap">
            <div className="dh-section-head">
              <span className="dh-section-kicker">Why DOC321</span>
              <h2 id="why-doc321-heading">Simple tools. Less friction.</h2>
              <p>Everything is designed around getting a document task done quickly, with a clean interface that feels familiar from the first visit.</p>
            </div>
            <div className="dh-reasons">
              {reasons.map(({ title, detail, Icon }) => (
                <article className="dh-reason" key={title}>
                  <span className="dh-reason-icon"><Icon size={19} aria-hidden="true" /></span>
                  <h3>{title}</h3>
                  <p>{detail}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="dh-cta">
          <div className="dh-wrap">
            <div className="dh-cta-card">
              <div className="dh-cta-copy">
                <h2>Find the right tool and get it done.</h2>
                <p>Browse the full DOC321 toolkit for PDF, Word, image and document tasks.</p>
                <Link className="dh-solid-link" href="/tools">Explore all tools<ArrowRight size={15} /></Link>
              </div>
              <div className="dh-cta-art" aria-hidden="true"><span className="a" /><span className="b" /><span className="c" /></div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
      <SoftwareJsonLd />
    </>
  );
}
