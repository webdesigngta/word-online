import type { CSSProperties, ReactNode } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteHeader } from '@/components/SiteHeader';
import { FaqJsonLd } from '@/components/JsonLd';
import { PdfJsWorkerSetup } from '@/components/PdfJsWorkerSetup';
import { ToolViewAnalytics } from '@/components/ToolViewAnalytics';
import { ToolVisual } from '@/components/ToolVisual';
import { directoryGroupId, groupDefinition, relatedToolScore, toolPalette } from '@/lib/toolDesign';
import { allLivePlatformTools, getAllPlatformToolByRoute } from '@/tools/platform/allTools';

const fallbackPalette = { familyLabel: 'Document', primary: '#1a73e8', secondary: '#1a73e8', soft: '#e8f0fe', ink: '#174ea6' } as const;

export function PlatformTaskPage({
  route,
  title,
  description,
  tool,
  details,
  faq,
}: {
  route: string;
  title: string;
  description: string;
  tool: ReactNode;
  details: Array<{ title: string; text: string }>;
  faq: Array<{ question: string; answer: string }>;
}) {
  const current = getAllPlatformToolByRoute(route);
  const palette = current ? toolPalette(current) : fallbackPalette;
  const group = current ? groupDefinition(directoryGroupId(current)) : groupDefinition('formats');
  const relatedTools = current
    ? allLivePlatformTools
      .filter((item) => item.route !== current.route)
      .sort((left, right) => relatedToolScore(current, right) - relatedToolScore(current, left) || left.name.localeCompare(right.name))
      .slice(0, 8)
    : [];
  const toolId = current?.id ?? route.replace(/^\/|\/$/g, '').replace(/[^a-z0-9]+/g, '-');
  const usesPdf = Boolean(current
    ? [...current.input, ...current.output].some((type) => /pdf/i.test(type)) || /pdf/i.test(current.route)
    : /pdf/i.test(route));
  const pageStyle = {
    '--tool-primary': palette.primary,
    '--tool-secondary': palette.secondary,
    '--tool-soft': palette.soft,
    '--tool-ink': palette.ink,
  } as CSSProperties;

  return (
    <>
      <ToolViewAnalytics toolId={toolId} route={current?.route ?? route} />
      {usesPdf ? <PdfJsWorkerSetup /> : null}
      <SiteHeader />
      <main className="platform-task-page" style={pageStyle}>
        <style>{`
          .platform-task-page{background:#f8fafd;color:#202124;min-height:100vh;padding:28px 20px 72px;font-family:Arial,Helvetica,sans-serif}
          .platform-task-wrap{width:min(1140px,100%);margin:0 auto}
          .platform-task-hero{text-align:center;max-width:860px;margin:26px auto 28px}
          .platform-task-identity{display:flex;align-items:center;justify-content:center;gap:12px;margin:0 0 14px}
          .platform-task-eyebrow{display:inline-flex;align-items:center;min-height:28px;padding:0 10px;border-radius:999px;background:var(--tool-soft);color:var(--tool-ink);font-size:11px;font-weight:750;letter-spacing:.055em;text-transform:uppercase}
          .platform-task-hero h1{margin:0;color:#202124;font-size:clamp(34px,5vw,52px);line-height:1.07;letter-spacing:-.04em;text-wrap:balance}
          .platform-task-lead{margin:14px auto 0;color:#5f6368;font-size:17px;line-height:1.62;max-width:760px;text-wrap:balance}
          .platform-task-family-link{display:inline-flex;align-items:center;gap:5px;margin-top:13px;color:var(--tool-ink);font-size:12px;font-weight:650;text-decoration:none}.platform-task-family-link:hover{text-decoration:underline}
          .platform-task-card{position:relative;border:1px solid #dadce0;border-radius:20px;background:#fff;box-shadow:0 2px 8px rgba(60,64,67,.08);padding:24px;overflow:hidden}
          .platform-task-card:before{content:'';position:absolute;left:0;right:0;top:0;height:4px;background:linear-gradient(90deg,var(--tool-primary),var(--tool-secondary))}
          .platform-task-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-top:24px}
          .platform-task-detail{background:#fff;border:1px solid #e0e3e7;border-radius:16px;padding:20px}
          .platform-task-detail h2{margin:0 0 8px;font-size:16px;letter-spacing:-.01em}.platform-task-detail p{margin:0;color:#5f6368;line-height:1.6;font-size:13px}
          .platform-task-related{margin:38px 0 0;padding-top:4px}.platform-task-related-head{display:flex;align-items:flex-end;justify-content:space-between;gap:14px;margin:0 0 14px}.platform-task-related h2{font-size:24px;letter-spacing:-.025em;margin:0}.platform-task-related-head p{color:#5f6368;margin:5px 0 0;line-height:1.5;font-size:13px}.platform-task-related-all{display:inline-flex;align-items:center;gap:5px;color:#174ea6;font-size:12px;font-weight:700;text-decoration:none;white-space:nowrap}.platform-task-related-all:hover{text-decoration:underline}
          .platform-task-related-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.platform-task-related-link{position:relative;display:grid;grid-template-columns:auto 1fr;align-items:center;gap:10px;color:#202124;text-decoration:none;background:#fff;border:1px solid #dadce0;border-radius:14px;padding:12px;min-height:82px;transition:transform .15s,border-color .15s,box-shadow .15s}.platform-task-related-link:hover{transform:translateY(-1px);border-color:#bdc1c6;box-shadow:0 3px 10px rgba(60,64,67,.08)}.platform-task-related-copy{min-width:0}.platform-task-related-link strong{display:block;font-size:13px;line-height:1.3;margin-bottom:3px}.platform-task-related-link small{display:block;color:#5f6368;font-size:10px;line-height:1.35;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
          .platform-task-faq{margin:38px auto 0;max-width:900px}.platform-task-faq h2{font-size:25px;letter-spacing:-.02em;margin:0 0 14px}.platform-task-faq details{background:#fff;border:1px solid #dadce0;border-radius:14px;padding:0 18px;margin:9px 0}.platform-task-faq summary{cursor:pointer;padding:16px 0;font-weight:650;font-size:14px}.platform-task-faq p{color:#5f6368;line-height:1.62;margin:0 0 16px;font-size:13px}
          .tool-visual{display:inline-flex;align-items:center;justify-content:center;gap:3px;color:#fff;font-weight:800;letter-spacing:-.02em;box-shadow:inset 0 -1px 0 rgba(0,0,0,.12);flex:0 0 auto}.tool-visual span{color:#fff!important;margin:0!important;line-height:1!important}.tool-visual b{font-size:.75em;opacity:.88}.tool-visual-sm{width:34px;height:34px;border-radius:10px;font-size:7px}.tool-visual-md{width:46px;height:46px;border-radius:13px;font-size:8px}.tool-visual-lg{width:58px;height:58px;border-radius:16px;font-size:9px}
          @media(max-width:900px){.platform-task-related-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
          @media(max-width:760px){.platform-task-page{padding:22px 12px 56px}.platform-task-card{padding:14px}.platform-task-grid{grid-template-columns:1fr}.platform-task-hero{margin-top:22px}.platform-task-hero h1{font-size:34px}.platform-task-lead{font-size:15px}.platform-task-related-head{align-items:flex-start;flex-direction:column}.platform-task-related-all{align-self:flex-start}}
          @media(max-width:480px){.platform-task-related-grid{grid-template-columns:1fr}.platform-task-identity{gap:9px}.tool-visual-lg{width:52px;height:52px;border-radius:15px}}
        `}</style>
        <div className="platform-task-wrap">
          <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Tools', href: '/tools' }, { label: current?.name ?? title }]} />
          <section className="platform-task-hero">
            <div className="platform-task-identity">
              {current ? <ToolVisual tool={current} size="lg" /> : null}
              <span className="platform-task-eyebrow">{current?.eyebrow ?? 'DOCUMENT TOOL'}</span>
            </div>
            <h1>{title}</h1>
            <p className="platform-task-lead">{description}</p>
            <Link className="platform-task-family-link" href={`/tools#tools-${group.id}`}>Browse {group.label}<ArrowRight size={14}/></Link>
          </section>
          <section className="platform-task-card">{tool}</section>
          <section className="platform-task-grid">
            {details.map((item) => (
              <article className="platform-task-detail" key={item.title}>
                <h2>{item.title}</h2>
                <p>{item.text}</p>
              </article>
            ))}
          </section>
          {relatedTools.length ? (
            <section className="platform-task-related" aria-labelledby="related-platform-tools">
              <div className="platform-task-related-head"><div><h2 id="related-platform-tools">Related tools</h2><p>Useful next steps selected by file type, task and product family.</p></div><Link className="platform-task-related-all" href="/tools">Explore all 126 tools<ArrowRight size={14}/></Link></div>
              <div className="platform-task-related-grid">
                {relatedTools.map((item) => (
                  <Link className="platform-task-related-link" href={item.route} key={item.route}>
                    <ToolVisual tool={item} size="sm" />
                    <span className="platform-task-related-copy"><strong>{item.name}</strong><small>{item.primaryIntent}</small></span>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
          <section className="platform-task-faq">
            <h2>Frequently asked questions</h2>
            {faq.map((item) => (
              <details key={item.question}>
                <summary>{item.question}</summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </section>
        </div>
      </main>
      <SiteFooter />
      <FaqJsonLd items={faq} />
    </>
  );
}
