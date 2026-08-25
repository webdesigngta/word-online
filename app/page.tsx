import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { pageMetadata } from '@/lib/seo';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteHeader } from '@/components/SiteHeader';
import { SoftwareJsonLd } from '@/components/JsonLd';
import { ToolVisual } from '@/components/ToolVisual';
import { allLivePlatformTools } from '@/tools/platform/allTools';
import { DIRECTORY_GROUPS, familyTheme } from '@/lib/toolDesign';

export const metadata = pageMetadata({
  title: 'Free Word Online – Edit Word Documents Free',
  description: 'Edit Word documents online and use free browser-based PDF, spreadsheet, presentation, image, OCR and document tools without creating an account.',
  path: '/',
});

const popularRoutes = ['/word-online', '/pdf-to-word', '/word-to-pdf', '/edit-pdf', '/compress-pdf', '/merge-pdf', '/pdf-to-jpg', '/xlsx-editor'];
const popularTools = popularRoutes.map((route) => allLivePlatformTools.find((tool) => tool.route === route)).filter((tool): tool is NonNullable<typeof tool> => Boolean(tool));

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main className="product-home">
        <style>{`
          .product-home{background:#fff;color:#202124;font-family:Arial,Helvetica,sans-serif}.ph-wrap{width:min(1160px,calc(100% - 40px));margin:0 auto}.ph-hero{min-height:610px;display:grid;grid-template-columns:minmax(0,1fr) minmax(420px,.9fr);gap:64px;align-items:center;padding:70px 0 66px}.ph-kicker{display:inline-flex;align-items:center;min-height:30px;padding:0 11px;border-radius:999px;background:#e8f0fe;color:#174ea6;font-size:11px;font-weight:750;letter-spacing:.055em;text-transform:uppercase}.ph-hero h1{font-size:clamp(44px,6vw,70px);line-height:1.01;letter-spacing:-.05em;margin:16px 0 20px;max-width:730px}.ph-lead{max-width:680px;color:#5f6368;font-size:19px;line-height:1.62;margin:0}.ph-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:26px}.ph-btn{min-height:46px;padding:0 19px;border-radius:999px;display:inline-flex;align-items:center;gap:7px;font-size:14px;font-weight:700;text-decoration:none;border:1px solid #dadce0}.ph-btn.primary{background:#1a73e8;border-color:#1a73e8;color:#fff}.ph-btn.primary:hover{background:#1765cc}.ph-btn.secondary{background:#fff;color:#202124}.ph-btn.secondary:hover{background:#f8fafd}.ph-trust{display:flex;gap:8px;flex-wrap:wrap;margin-top:22px}.ph-trust span{font-size:11px;color:#5f6368;border:1px solid #e0e3e7;border-radius:999px;padding:6px 9px;background:#fff}
          .ph-preview{border:1px solid #dadce0;border-radius:22px;background:#fff;box-shadow:0 18px 50px rgba(60,64,67,.15);overflow:hidden;transform:rotate(1deg)}.ph-preview-bar{height:48px;border-bottom:1px solid #edf0f2;display:flex;align-items:center;gap:9px;padding:0 14px;font-size:12px;font-weight:700}.ph-preview-mark{width:28px;height:28px;border-radius:8px;background:#1a73e8;color:#fff;display:grid;place-items:center;font-weight:800}.ph-preview-tabs{display:flex;gap:16px;padding:10px 15px;border-bottom:1px solid #e0e3e7;color:#5f6368;font-size:10px}.ph-preview-ribbon{display:flex;align-items:center;gap:9px;height:55px;padding:0 15px;border-bottom:1px solid #e0e3e7}.ph-preview-pill{height:28px;display:inline-flex;align-items:center;padding:0 9px;border:1px solid #dadce0;border-radius:7px;font-size:10px}.ph-preview-canvas{background:#eef2f6;padding:24px 38px}.ph-preview-page{min-height:280px;background:#fff;box-shadow:0 2px 8px rgba(60,64,67,.13);padding:38px 42px}.ph-preview-page h3{font-size:24px;margin:0 0 14px}.ph-preview-page p{font-size:13px;line-height:1.7;color:#5f6368}.ph-preview-line{height:7px;border-radius:5px;background:#edf0f2;margin:12px 0}.ph-preview-line.short{width:62%}
          .ph-section{padding:58px 0}.ph-section.alt{background:#f8fafd}.ph-section-head{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;margin-bottom:22px}.ph-section h2{font-size:30px;letter-spacing:-.03em;margin:0}.ph-section-head p{color:#5f6368;margin:7px 0 0;font-size:14px}.ph-all-link{display:inline-flex;align-items:center;gap:5px;color:#174ea6;font-size:13px;font-weight:700;text-decoration:none}.ph-all-link:hover{text-decoration:underline}
          .ph-popular-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:11px}.ph-tool-card{display:grid;grid-template-columns:auto 1fr;align-items:center;gap:11px;border:1px solid #dadce0;border-radius:15px;background:#fff;padding:13px;text-decoration:none;color:#202124;min-height:76px;transition:transform .15s,border-color .15s,box-shadow .15s}.ph-tool-card:hover{transform:translateY(-1px);border-color:#bdc1c6;box-shadow:0 3px 10px rgba(60,64,67,.08)}.ph-tool-card strong{font-size:13px;line-height:1.3}.ph-tool-card small{display:block;color:#5f6368;font-size:10px;margin-top:3px}
          .ph-family-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.ph-family{position:relative;border:1px solid #dadce0;border-radius:18px;background:#fff;padding:20px 20px 18px;text-decoration:none;color:#202124;overflow:hidden;transition:transform .15s,border-color .15s,box-shadow .15s}.ph-family:before{content:'';position:absolute;left:0;right:0;top:0;height:4px;background:var(--family)}.ph-family:hover{transform:translateY(-2px);border-color:#bdc1c6;box-shadow:0 5px 16px rgba(60,64,67,.09)}.ph-family-mark{width:38px;height:38px;border-radius:12px;background:var(--family-soft);color:var(--family-ink);display:grid;place-items:center;font-weight:800;font-size:12px;margin-bottom:14px}.ph-family h3{font-size:17px;margin:0 0 7px}.ph-family p{color:#5f6368;font-size:12px;line-height:1.5;margin:0 0 12px}.ph-family span{color:var(--family-ink);font-size:11px;font-weight:700;display:inline-flex;align-items:center;gap:4px}
          .tool-visual{display:inline-flex;align-items:center;justify-content:center;gap:3px;color:#fff;font-weight:800;letter-spacing:-.02em;box-shadow:inset 0 -1px 0 rgba(0,0,0,.12);flex:0 0 auto}.tool-visual span{color:#fff!important;margin:0!important;line-height:1!important}.tool-visual b{font-size:.75em;opacity:.88}.tool-visual-sm{width:34px;height:34px;border-radius:10px;font-size:7px}.tool-visual-md{width:46px;height:46px;border-radius:13px;font-size:8px}.tool-visual-lg{width:58px;height:58px;border-radius:16px;font-size:9px}
          @media(max-width:900px){.ph-hero{grid-template-columns:1fr;gap:38px;padding-top:54px}.ph-preview{max-width:650px}.ph-popular-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.ph-family-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
          @media(max-width:600px){.ph-wrap{width:min(100% - 24px,1160px)}.ph-hero{padding:42px 0 46px;min-height:0}.ph-hero h1{font-size:43px}.ph-lead{font-size:16px}.ph-preview-canvas{padding:16px}.ph-preview-page{padding:28px 24px;min-height:230px}.ph-section{padding:44px 0}.ph-section-head{align-items:flex-start;flex-direction:column}.ph-popular-grid,.ph-family-grid{grid-template-columns:1fr}.ph-tool-card{min-height:72px}}
        `}</style>

        <div className="ph-wrap">
          <section className="ph-hero">
            <div>
              <span className="ph-kicker">Free · No login · Browser-first</span>
              <h1>Word online, plus every document tool around it.</h1>
              <p className="ph-lead">Edit DOCX files in a familiar Word workspace, then convert PDFs, organize pages, work with spreadsheets and presentations, run OCR, or create everyday documents—all from one consistent platform.</p>
              <div className="ph-actions"><Link className="ph-btn primary" href="/word-online">Start Word editor<ArrowRight size={16}/></Link><Link className="ph-btn secondary" href="/tools">Browse all {allLivePlatformTools.length} tools</Link></div>
              <div className="ph-trust"><span>No sign-up</span><span>Local-first workflows</span><span>Real file outputs</span><span>Clear format limits</span></div>
            </div>
            <div className="ph-preview" aria-hidden="true"><div className="ph-preview-bar"><span className="ph-preview-mark">W</span><span>Document.docx</span></div><div className="ph-preview-tabs">File <b>Home</b> Insert Layout Review View</div><div className="ph-preview-ribbon"><b>B</b><i>I</i><u>U</u><span className="ph-preview-pill">Arial</span><span className="ph-preview-pill">11</span></div><div className="ph-preview-canvas"><div className="ph-preview-page"><h3>Your document</h3><p>Write, format and export with a focused browser editor.</p><div className="ph-preview-line"/><div className="ph-preview-line"/><div className="ph-preview-line short"/></div></div></div>
          </section>
        </div>

        <section className="ph-section alt"><div className="ph-wrap"><div className="ph-section-head"><div><h2>Popular tools</h2><p>Jump directly into the workflows people use most.</p></div><Link className="ph-all-link" href="/tools">All tools<ArrowRight size={14}/></Link></div><div className="ph-popular-grid">{popularTools.map((tool) => <Link className="ph-tool-card" href={tool.route} key={tool.id}><ToolVisual tool={tool} size="sm"/><span><strong>{tool.name}</strong><small>{tool.primaryIntent}</small></span></Link>)}</div></div></section>

        <section className="ph-section"><div className="ph-wrap"><div className="ph-section-head"><div><h2>Everything is organized by product family</h2><p>Consistent colors and controls make it easy to understand what each tool works with.</p></div></div><div className="ph-family-grid">{DIRECTORY_GROUPS.slice(0, 6).map((group) => { const theme = familyTheme(group.family); return <Link className="ph-family" href={`/tools#tools-${group.id}`} key={group.id} style={{ '--family': theme.primary, '--family-soft': theme.soft, '--family-ink': theme.ink } as React.CSSProperties}><span className="ph-family-mark">{group.label.split(' ')[0].slice(0,4).toUpperCase()}</span><h3>{group.label}</h3><p>{group.description}</p><span>Explore tools<ArrowRight size={13}/></span></Link>; })}</div></div></section>
      </main>
      <SiteFooter />
      <SoftwareJsonLd />
    </>
  );
}
