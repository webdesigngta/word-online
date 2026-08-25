import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteHeader } from '@/components/SiteHeader';
import { ToolVisual } from '@/components/ToolVisual';
import { toolPalette } from '@/lib/toolDesign';
import type { PlatformToolDefinition } from '@/tools/platform/catalog';

export function DocumentHubPage({
  eyebrow,
  title,
  description,
  tools,
}: {
  eyebrow: string;
  title: string;
  description: string;
  tools: readonly PlatformToolDefinition[];
}) {
  return (
    <>
      <SiteHeader />
      <main className="fwo-hub-page">
        <style>{`
          .fwo-hub-page{min-height:calc(100vh - 160px);background:#f8fafd;color:#202124;padding:30px 20px 72px;font-family:Arial,Helvetica,sans-serif}
          .fwo-hub-wrap{width:min(1160px,100%);margin:0 auto}.fwo-hub-hero{max-width:780px;margin:34px 0 32px}.fwo-hub-eyebrow{display:inline-flex;align-items:center;min-height:28px;padding:0 10px;border-radius:999px;background:#e8f0fe;color:#174ea6;font-size:11px;font-weight:750;letter-spacing:.06em;text-transform:uppercase;margin:0 0 12px}.fwo-hub-hero h1{font-size:clamp(36px,5vw,54px);letter-spacing:-.04em;line-height:1.06;margin:0}.fwo-hub-lead{color:#5f6368;font-size:17px;line-height:1.65;margin:15px 0 0}.fwo-hub-meta{display:flex;gap:8px;flex-wrap:wrap;margin-top:17px}.fwo-hub-meta span{border:1px solid #dadce0;border-radius:999px;background:#fff;color:#5f6368;padding:6px 10px;font-size:11px;font-weight:600}
          .fwo-hub-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.fwo-hub-card{position:relative;display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:13px;text-decoration:none;color:#202124;border:1px solid #dadce0;border-radius:16px;background:#fff;padding:15px;min-height:104px;overflow:hidden;transition:transform .16s ease,box-shadow .16s ease,border-color .16s ease}.fwo-hub-card:before{content:'';position:absolute;left:0;top:18px;bottom:18px;width:3px;border-radius:0 3px 3px 0;background:var(--hub-accent)}.fwo-hub-card:hover{transform:translateY(-2px);border-color:#bdc1c6;box-shadow:0 5px 18px rgba(60,64,67,.10)}.fwo-hub-copy{min-width:0}.fwo-hub-card small{color:#5f6368;font-size:10px;font-weight:700;letter-spacing:.04em;text-transform:uppercase}.fwo-hub-card strong{display:block;font-size:15px;line-height:1.3;margin:4px 0}.fwo-hub-card .fwo-hub-intent{display:block;color:#5f6368;line-height:1.45;font-size:12px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.fwo-hub-arrow{color:#9aa0a6}.fwo-hub-card:hover .fwo-hub-arrow{color:var(--hub-accent);transform:translateX(2px)}.fwo-hub-empty{border:1px solid #e0e3e7;background:#fff;border-radius:16px;padding:24px;color:#5f6368}
          .tool-visual{display:inline-flex;align-items:center;justify-content:center;gap:3px;color:#fff;font-weight:800;letter-spacing:-.02em;box-shadow:inset 0 -1px 0 rgba(0,0,0,.12);flex:0 0 auto}.tool-visual span{color:#fff!important;margin:0!important;line-height:1!important}.tool-visual b{font-size:.75em;opacity:.88}.tool-visual-sm{width:34px;height:34px;border-radius:10px;font-size:7px}.tool-visual-md{width:46px;height:46px;border-radius:13px;font-size:8px}.tool-visual-lg{width:58px;height:58px;border-radius:16px;font-size:9px}
          @media(max-width:840px){.fwo-hub-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:580px){.fwo-hub-page{padding:22px 12px 54px}.fwo-hub-grid{grid-template-columns:1fr}.fwo-hub-hero{margin-top:24px}.fwo-hub-lead{font-size:15px}}
        `}</style>
        <div className="fwo-hub-wrap">
          <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Tools', href: '/tools' }, { label: title }]} />
          <section className="fwo-hub-hero">
            <p className="fwo-hub-eyebrow">{eyebrow}</p>
            <h1>{title}</h1>
            <p className="fwo-hub-lead">{description}</p>
            <div className="fwo-hub-meta"><span>{tools.length} live tools</span><span>Browser-first</span><span>No account required</span></div>
          </section>
          {tools.length ? (
            <section className="fwo-hub-grid" aria-label={`${title} tools`}>
              {tools.map((tool) => {
                const palette = toolPalette(tool);
                return <Link className="fwo-hub-card" href={tool.route} key={tool.id} style={{ '--hub-accent': palette.primary } as React.CSSProperties}>
                  <ToolVisual tool={tool}/>
                  <span className="fwo-hub-copy"><small>{palette.familyLabel}</small><strong>{tool.name}</strong><span className="fwo-hub-intent">{tool.primaryIntent}</span></span>
                  <ArrowRight className="fwo-hub-arrow" size={18} aria-hidden="true"/>
                </Link>;
              })}
            </section>
          ) : <div className="fwo-hub-empty">No live tools are available in this category yet.</div>}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
