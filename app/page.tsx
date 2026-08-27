import Link from 'next/link';
import { ArrowRight, Ban, Download, Infinity, Trash2, UserCheck } from 'lucide-react';
import { pageMetadata } from '@/lib/seo';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteHeader } from '@/components/SiteHeader';
import { SoftwareJsonLd } from '@/components/JsonLd';
import { ToolVisual } from '@/components/ToolVisual';
import { HomeToolSearch, type HomeSearchTool } from '@/components/HomeToolSearch';
import { allLivePlatformTools } from '@/tools/platform/allTools';

export const metadata = pageMetadata({
  title: 'Free Word Online – Edit Word Documents Free',
  description: 'Edit Word documents online and use free browser-based PDF, spreadsheet, presentation, image, OCR and document tools without creating an account.',
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
  { title: 'No signup', detail: 'Start instantly', Icon: UserCheck },
  { title: 'No ads', detail: 'Clean, distraction-free tools', Icon: Ban },
  { title: 'No limits', detail: 'Use tools as often as needed', Icon: Infinity },
  { title: 'Unlimited downloads', detail: 'Download as much as you need', Icon: Download },
  { title: 'Files deleted', detail: 'Permanently after 10 minutes', Icon: Trash2 },
] as const;

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main className="doc-home">
        <style>{`
          .doc-home{background:#fff;color:#202124;font-family:Arial,Helvetica,sans-serif}.dh-wrap{width:min(1180px,calc(100% - 40px));margin:0 auto}
          .dh-hero{display:grid;grid-template-columns:minmax(300px,.78fr) minmax(480px,1.22fr);gap:58px;align-items:center;padding:66px 0 34px}.dh-copy h1{font-size:clamp(46px,5.2vw,66px);line-height:1.01;letter-spacing:-.052em;margin:0 0 17px;max-width:570px}.dh-copy p{color:#5f6368;font-size:17px;line-height:1.62;margin:0;max-width:500px}.dh-search-area{position:relative;z-index:4}.home-tool-search{position:relative}.hts-form{display:flex;align-items:center;gap:11px;min-height:62px;padding:0 17px;border:1px solid #cfd4dc;border-radius:16px;background:#fff;box-shadow:0 8px 24px rgba(60,64,67,.07);transition:border-color .15s,box-shadow .15s}.hts-form:focus-within{border-color:#8ab4f8;box-shadow:0 0 0 4px rgba(26,115,232,.10),0 10px 28px rgba(60,64,67,.08)}.hts-form svg{color:#5f6368;flex:0 0 auto}.hts-form input{min-width:0;flex:1;border:0;outline:0;background:transparent;color:#202124;font-size:15px}.hts-form input::placeholder{color:#73777e}.hts-clear{width:36px;height:36px;display:grid;place-items:center;border:0;border-radius:50%;background:transparent;color:#5f6368;cursor:pointer}.hts-clear:hover{background:#f1f3f4}.hts-results{position:absolute;left:0;right:0;top:70px;background:#fff;border:1px solid #dde1e7;border-radius:16px;padding:7px;box-shadow:0 18px 42px rgba(60,64,67,.16);z-index:20}.hts-result{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:10px 11px;border-radius:11px;color:#202124;text-decoration:none}.hts-result:hover{background:#f8fafd}.hts-result span{min-width:0}.hts-result strong{display:block;font-size:13px}.hts-result small{display:block;margin-top:3px;color:#5f6368;font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.hts-result svg{color:#8b9097;flex:0 0 auto}.hts-no-result{padding:12px}.hts-quick{display:flex;align-items:center;gap:7px;flex-wrap:wrap;margin-top:13px}.hts-quick>span{color:#6c7178;font-size:10px;font-weight:700}.hts-quick a{display:inline-flex;align-items:center;min-height:28px;padding:0 9px;border:1px solid #dde1e7;border-radius:999px;color:#3c4043;background:#fff;text-decoration:none;font-size:10px;font-weight:650}.hts-quick a:hover{background:#f8fafd;border-color:#c9ced5}
          .dh-features{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));border:1px solid #e0e3e7;border-radius:18px;background:#fff;overflow:hidden;margin-bottom:46px}.dh-feature{display:grid;grid-template-columns:auto 1fr;align-items:center;gap:10px;min-width:0;padding:16px 17px;position:relative}.dh-feature:not(:last-child):after{content:'';position:absolute;right:0;top:16px;bottom:16px;width:1px;background:#e7e9ed}.dh-feature-icon{width:34px;height:34px;border:1px solid #d8dde5;border-radius:11px;display:grid;place-items:center;color:#174ea6;background:#f8fbff;flex:0 0 auto}.dh-feature strong{display:block;font-size:12px;line-height:1.2}.dh-feature small{display:block;color:#5f6368;font-size:9px;line-height:1.35;margin-top:3px}
          .dh-popular{padding:0 0 72px}.dh-section-head{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:17px}.dh-section-head h2{font-size:22px;letter-spacing:-.025em;margin:0}.dh-all-link{display:inline-flex;align-items:center;gap:5px;color:#174ea6;font-size:12px;font-weight:700;text-decoration:none}.dh-all-link:hover{text-decoration:underline}.dh-popular-grid{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:12px}.dh-tool-card{display:flex;flex-direction:column;align-items:center;justify-content:flex-start;text-align:center;gap:10px;min-width:0;min-height:150px;padding:17px 12px 14px;border:1px solid #dde1e7;border-radius:16px;background:#fff;color:#202124;text-decoration:none;transition:transform .15s,border-color .15s,box-shadow .15s}.dh-tool-card:hover{transform:translateY(-2px);border-color:#c5cad1;box-shadow:0 8px 20px rgba(60,64,67,.08)}.dh-tool-card strong{font-size:12px;line-height:1.25}.dh-tool-card small{display:block;color:#5f6368;font-size:10px;line-height:1.4;margin-top:3px}.tool-visual{display:inline-flex;align-items:center;justify-content:center;gap:3px;color:#fff;font-weight:800;letter-spacing:-.02em;box-shadow:inset 0 -1px 0 rgba(0,0,0,.12);flex:0 0 auto}.tool-visual span{color:#fff!important;margin:0!important;line-height:1!important}.tool-visual b{font-size:.75em;opacity:.88}.tool-visual-md{width:46px;height:46px;border-radius:13px;font-size:8px}
          @media(max-width:980px){.dh-hero{grid-template-columns:1fr;gap:28px;padding-top:50px}.dh-copy{text-align:center}.dh-copy h1,.dh-copy p{margin-left:auto;margin-right:auto}.dh-search-area{max-width:760px;width:100%;margin:0 auto}.dh-features{grid-template-columns:repeat(3,minmax(0,1fr))}.dh-feature:nth-child(3):after,.dh-feature:last-child:after{display:none}.dh-feature:nth-child(-n+2):after{display:block}.dh-feature{border-bottom:1px solid #e7e9ed}.dh-feature:nth-child(n+4){border-bottom:0}.dh-popular-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}
          @media(max-width:620px){.dh-wrap{width:min(100% - 24px,1180px)}.dh-hero{padding:40px 0 26px;gap:23px}.dh-copy h1{font-size:42px;max-width:360px}.dh-copy p{font-size:15px;max-width:390px}.hts-form{min-height:54px;padding:0 13px;border-radius:14px}.hts-form input{font-size:14px}.hts-results{top:62px}.hts-quick{justify-content:center;margin-top:11px}.hts-quick>span{width:100%;text-align:center}.dh-features{grid-template-columns:repeat(2,minmax(0,1fr));border-radius:15px;margin-bottom:36px}.dh-feature{padding:13px 12px;gap:8px;border-bottom:1px solid #e7e9ed}.dh-feature:nth-child(odd):after{display:block}.dh-feature:nth-child(even):after{display:none}.dh-feature:nth-child(4){border-bottom:1px solid #e7e9ed}.dh-feature:last-child{grid-column:1/-1;border-bottom:0}.dh-feature:last-child:after{display:none}.dh-feature-icon{width:32px;height:32px}.dh-feature strong{font-size:11px}.dh-feature small{font-size:8px}.dh-popular{padding-bottom:50px}.dh-section-head h2{font-size:20px}.dh-popular-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.dh-tool-card{min-height:132px;padding:14px 9px 12px}.dh-tool-card strong{font-size:11px}.dh-tool-card small{font-size:9px}.tool-visual-md{width:42px;height:42px}}
          @media(max-width:390px){.dh-copy h1{font-size:38px}.hts-quick a{padding:0 8px;font-size:9px}.dh-feature{padding:12px 10px}.dh-feature small{display:none}}
        `}</style>

        <div className="dh-wrap">
          <section className="dh-hero" aria-labelledby="home-heading">
            <div className="dh-copy">
              <h1 id="home-heading">What do you want to do today?</h1>
              <p>Edit, convert, compress and organize documents — free online.</p>
            </div>
            <div className="dh-search-area">
              <HomeToolSearch tools={searchTools} />
            </div>
          </section>

          <section className="dh-features" aria-label="DOC321 benefits">
            {features.map(({ title, detail, Icon }) => (
              <div className="dh-feature" key={title}>
                <span className="dh-feature-icon"><Icon size={17} aria-hidden="true" /></span>
                <span><strong>{title}</strong><small>{detail}</small></span>
              </div>
            ))}
          </section>

          <section className="dh-popular" aria-labelledby="popular-tools-heading">
            <div className="dh-section-head">
              <h2 id="popular-tools-heading">Popular tools</h2>
              <Link className="dh-all-link" href="/tools">View all tools<ArrowRight size={14} /></Link>
            </div>
            <div className="dh-popular-grid">
              {popularTools.map((tool) => (
                <Link className="dh-tool-card" href={tool.route} key={tool.id}>
                  <ToolVisual tool={tool} size="md" />
                  <span><strong>{tool.name}</strong><small>{tool.primaryIntent}</small></span>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </main>
      <SiteFooter />
      <SoftwareJsonLd />
    </>
  );
}
