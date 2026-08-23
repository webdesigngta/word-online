import Link from 'next/link';
import { FaqJsonLd } from './JsonLd';
import { SiteHeader } from './SiteHeader';

export function SeoLanding({
  eyebrow,
  title,
  description,
  bullets,
  sections,
  faq,
}: {
  eyebrow: string;
  title: string;
  description: string;
  bullets: string[];
  sections: Array<{ title: string; text: string }>;
  faq: Array<{ question: string; answer: string }>;
}) {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="landing-hero">
          <div className="landing-copy">
            <p className="eyebrow">{eyebrow}</p>
            <h1>{title}</h1>
            <p className="landing-lead">{description}</p>
            <div className="hero-actions">
              <Link href="/word-online" className="primary-link">Open the editor</Link>
              <span className="privacy-note">No account required</span>
            </div>
          </div>
          <div className="feature-card" aria-label="Key features">
            <strong>Built for quick document work</strong>
            <ul>{bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul>
          </div>
        </section>
        <section className="content-grid">
          {sections.map((section) => (
            <article className="content-card" key={section.title}>
              <h2>{section.title}</h2>
              <p>{section.text}</p>
            </article>
          ))}
        </section>
        <section className="faq-section">
          <h2>Frequently asked questions</h2>
          <div className="faq-list">
            {faq.map((item) => (
              <details key={item.question}>
                <summary>{item.question}</summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </div>
        </section>
      </main>
      <FaqJsonLd items={faq} />
    </>
  );
}
