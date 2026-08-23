import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteHeader } from '@/components/SiteHeader';

export type InformationSection = {
  title: string;
  body: string;
  items?: string[];
};

export function InformationPage({
  eyebrow,
  title,
  description,
  sections,
  related = [],
}: {
  eyebrow: string;
  title: string;
  description: string;
  sections: InformationSection[];
  related?: Array<{ label: string; href: string }>;
}) {
  return (
    <>
      <SiteHeader />
      <main className="fwo-info-page">
        <style>{`
          .fwo-info-page{min-height:calc(100vh - 160px);background:#f8fafd;color:#202124;padding:34px 20px 72px;font-family:Arial,Helvetica,sans-serif}.fwo-info-wrap{width:min(960px,100%);margin:0 auto}.fwo-info-hero{max-width:780px;margin:34px 0 34px}.fwo-info-eyebrow{margin:0 0 10px;color:#0b57d0;font-size:12px;font-weight:700;letter-spacing:.08em}.fwo-info-hero h1{font-size:clamp(34px,5vw,54px);letter-spacing:-.035em;line-height:1.08;margin:0}.fwo-info-lead{color:#5f6368;font-size:17px;line-height:1.65;margin:16px 0 0}.fwo-info-sections{display:grid;gap:14px}.fwo-info-section{border:1px solid #e0e3e7;border-radius:16px;background:#fff;padding:22px}.fwo-info-section h2{margin:0 0 9px;font-size:20px}.fwo-info-section p{margin:0;color:#5f6368;line-height:1.7;font-size:14px}.fwo-info-section ul{margin:14px 0 0;padding-left:21px;color:#444746}.fwo-info-section li{margin:7px 0;line-height:1.55}.fwo-info-related{margin-top:30px;border-top:1px solid #dfe3e8;padding-top:22px}.fwo-info-related h2{font-size:20px;margin:0 0 12px}.fwo-info-links{display:flex;gap:10px;flex-wrap:wrap}.fwo-info-links a{display:inline-flex;border:1px solid #c7d3e4;border-radius:999px;background:#fff;color:#0b57d0;text-decoration:none;padding:9px 13px;font-size:13px;font-weight:600}.fwo-info-links a:hover{background:#eef4ff}@media(max-width:600px){.fwo-info-page{padding:24px 14px 54px}.fwo-info-section{padding:18px}.fwo-info-hero{margin-top:24px}}
        `}</style>
        <div className="fwo-info-wrap">
          <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: title }]} />
          <section className="fwo-info-hero">
            <p className="fwo-info-eyebrow">{eyebrow}</p>
            <h1>{title}</h1>
            <p className="fwo-info-lead">{description}</p>
          </section>
          <div className="fwo-info-sections">
            {sections.map((section) => (
              <section className="fwo-info-section" key={section.title}>
                <h2>{section.title}</h2>
                <p>{section.body}</p>
                {section.items?.length ? <ul>{section.items.map((item) => <li key={item}>{item}</li>)}</ul> : null}
              </section>
            ))}
          </div>
          {related.length ? (
            <section className="fwo-info-related">
              <h2>Related pages</h2>
              <div className="fwo-info-links">{related.map((item) => <Link href={item.href} key={item.href}>{item.label}</Link>)}</div>
            </section>
          ) : null}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
