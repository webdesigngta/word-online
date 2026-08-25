import type { ReactNode } from 'react';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteHeader } from '@/components/SiteHeader';
import { FaqJsonLd } from '@/components/JsonLd';
import { ToolViewAnalytics } from '@/components/ToolViewAnalytics';
import { getPlatformToolByRoute, livePlatformTools } from '@/tools/platform/catalog';

const priorityRank = { P0: 0, P1: 1, P2: 2, P3: 3 } as const;

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
  const current = getPlatformToolByRoute(route);
  const relatedTools = livePlatformTools
    .filter((item) => item.route !== current?.route)
    .sort((left, right) => {
      const leftSameCluster = Number(left.cluster === current?.cluster);
      const rightSameCluster = Number(right.cluster === current?.cluster);
      if (leftSameCluster !== rightSameCluster) return rightSameCluster - leftSameCluster;
      return priorityRank[left.priority] - priorityRank[right.priority];
    })
    .slice(0, 6);
  const toolId = current?.id ?? route.replace(/^\/|\/$/g, '').replace(/[^a-z0-9]+/g, '-');

  return (
    <>
      <ToolViewAnalytics toolId={toolId} route={current?.route ?? route} />
      <SiteHeader />
      <main className="platform-task-page">
        <style>{`
          .platform-task-page{background:#f8fafd;color:#202124;min-height:100vh;padding:30px 20px 72px;font-family:Arial,Helvetica,sans-serif}
          .platform-task-wrap{width:min(1120px,100%);margin:0 auto}
          .platform-task-hero{text-align:center;max-width:820px;margin:22px auto 28px}
          .platform-task-eyebrow{margin:0 0 10px;color:#0b57d0;font-size:12px;font-weight:700;letter-spacing:.08em}
          .platform-task-hero h1{margin:0;color:#202124;font-size:clamp(32px,5vw,52px);line-height:1.08;letter-spacing:-.035em}
          .platform-task-lead{margin:16px auto 0;color:#5f6368;font-size:17px;line-height:1.65;max-width:740px}
          .platform-task-card{border:1px solid #e0e3e7;border-radius:20px;background:#fff;box-shadow:0 12px 34px rgba(60,64,67,.09);padding:24px}
          .platform-task-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;margin-top:30px}
          .platform-task-detail{background:#fff;border:1px solid #e6e9ef;border-radius:16px;padding:20px}
          .platform-task-detail h2{margin:0 0 8px;font-size:17px}
          .platform-task-detail p{margin:0;color:#5f6368;line-height:1.6;font-size:14px}
          .platform-task-related{margin:34px 0 0}
          .platform-task-related h2{font-size:24px;margin:0 0 6px}
          .platform-task-related>p{color:#5f6368;margin:0 0 14px;line-height:1.55}
          .platform-task-related-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
          .platform-task-related-link{display:block;color:#202124;text-decoration:none;background:#fff;border:1px solid #e0e3e7;border-radius:13px;padding:14px 15px}
          .platform-task-related-link:hover{border-color:#a8b9d3;box-shadow:0 5px 14px rgba(60,64,67,.07)}
          .platform-task-related-link strong{display:block;font-size:14px;margin-bottom:4px}
          .platform-task-related-link span{color:#5f6368;font-size:12px;line-height:1.45}
          .platform-task-faq{margin:34px auto 0;max-width:900px}
          .platform-task-faq h2{font-size:26px;margin:0 0 14px}
          .platform-task-faq details{background:#fff;border:1px solid #e0e3e7;border-radius:14px;padding:0 18px;margin:10px 0}
          .platform-task-faq summary{cursor:pointer;padding:16px 0;font-weight:600}
          .platform-task-faq p{color:#5f6368;line-height:1.6;margin:0 0 16px}
          @media(max-width:760px){.platform-task-page{padding:24px 12px 56px}.platform-task-card{padding:14px}.platform-task-grid,.platform-task-related-grid{grid-template-columns:1fr}.platform-task-hero h1{font-size:34px}}
        `}</style>
        <div className="platform-task-wrap">
          <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Tools', href: '/tools' }, { label: current?.name ?? title }]} />
          <section className="platform-task-hero">
            <p className="platform-task-eyebrow">{current?.eyebrow ?? 'DOCUMENT TOOL'}</p>
            <h1>{title}</h1>
            <p className="platform-task-lead">{description}</p>
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
              <h2 id="related-platform-tools">Related document tools</h2>
              <p>Continue with another live tool on the same browser-based document platform.</p>
              <div className="platform-task-related-grid">
                {relatedTools.map((item) => (
                  <Link className="platform-task-related-link" href={item.route} key={item.route}>
                    <strong>{item.name}</strong>
                    <span>{item.primaryIntent}</span>
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
