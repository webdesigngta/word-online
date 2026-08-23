import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteHeader } from '@/components/SiteHeader';
import type { WordInterfaceDefinition } from '@/tools/word/interfaces/config';

export function DocumentHubPage({
  eyebrow,
  title,
  description,
  tools,
}: {
  eyebrow: string;
  title: string;
  description: string;
  tools: readonly WordInterfaceDefinition[];
}) {
  return (
    <>
      <SiteHeader />
      <main className="fwo-hub-page">
        <style>{`
          .fwo-hub-page{min-height:calc(100vh - 160px);background:#f8fafd;color:#202124;padding:34px 20px 72px;font-family:Arial,Helvetica,sans-serif}.fwo-hub-wrap{width:min(1120px,100%);margin:0 auto}.fwo-hub-hero{max-width:780px;margin:34px 0 34px}.fwo-hub-eyebrow{margin:0 0 10px;color:#0b57d0;font-size:12px;font-weight:700;letter-spacing:.08em}.fwo-hub-hero h1{font-size:clamp(34px,5vw,54px);letter-spacing:-.035em;line-height:1.08;margin:0}.fwo-hub-lead{color:#5f6368;font-size:17px;line-height:1.65;margin:16px 0 0}.fwo-hub-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}.fwo-hub-card{display:block;text-decoration:none;color:#202124;border:1px solid #e0e3e7;border-radius:16px;background:#fff;padding:18px;min-height:145px;transition:transform .15s ease,box-shadow .15s ease,border-color .15s ease}.fwo-hub-card:hover{transform:translateY(-2px);border-color:#b8c6db;box-shadow:0 8px 22px rgba(60,64,67,.09)}.fwo-hub-card small{color:#0b57d0;font-size:10px;font-weight:700;letter-spacing:.06em}.fwo-hub-card strong{display:block;font-size:17px;margin:9px 0 7px}.fwo-hub-card span{display:block;color:#5f6368;line-height:1.5;font-size:13px}.fwo-hub-empty{border:1px solid #e0e3e7;background:#fff;border-radius:16px;padding:24px;color:#5f6368}@media(max-width:820px){.fwo-hub-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:580px){.fwo-hub-page{padding:24px 14px 54px}.fwo-hub-grid{grid-template-columns:1fr}.fwo-hub-hero{margin-top:24px}}
        `}</style>
        <div className="fwo-hub-wrap">
          <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: title }]} />
          <section className="fwo-hub-hero">
            <p className="fwo-hub-eyebrow">{eyebrow}</p>
            <h1>{title}</h1>
            <p className="fwo-hub-lead">{description}</p>
          </section>
          {tools.length ? (
            <section className="fwo-hub-grid" aria-label={`${title} tools`}>
              {tools.map((tool) => (
                <Link className="fwo-hub-card" href={tool.route} key={tool.id}>
                  <small>{tool.eyebrow}</small>
                  <strong>{tool.name}</strong>
                  <span>{tool.primaryIntent}</span>
                </Link>
              ))}
            </section>
          ) : <div className="fwo-hub-empty">No live tools are available in this category yet.</div>}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
