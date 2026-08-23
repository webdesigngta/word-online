import type { ReactNode } from 'react';
import { SiteHeader } from '@/components/SiteHeader';
import { FaqJsonLd } from '@/components/JsonLd';

export function WordTaskPage({
  eyebrow,
  title,
  description,
  tool,
  details,
  faq,
}: {
  eyebrow: string;
  title: string;
  description: string;
  tool: ReactNode;
  details: Array<{ title: string; text: string }>;
  faq: Array<{ question: string; answer: string }>;
}) {
  return (
    <>
      <SiteHeader />
      <main className="word-task-page">
        <style>{`
          .word-task-page { background:#f8fafd; color:#202124; min-height:100vh; padding:44px 20px 72px; font-family:Arial,Helvetica,sans-serif; }
          .word-task-wrap { width:min(1120px,100%); margin:0 auto; }
          .word-task-hero { text-align:center; max-width:820px; margin:0 auto 28px; }
          .word-task-eyebrow { margin:0 0 10px; color:#0b57d0; font-size:12px; font-weight:700; letter-spacing:.08em; }
          .word-task-hero h1 { margin:0; color:#202124; font-size:clamp(32px,5vw,52px); line-height:1.08; letter-spacing:-.035em; }
          .word-task-lead { margin:16px auto 0; color:#5f6368; font-size:17px; line-height:1.65; max-width:740px; }
          .word-task-card { border:1px solid #e0e3e7; border-radius:20px; background:#fff; box-shadow:0 12px 34px rgba(60,64,67,.09); padding:24px; }
          .word-task-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:16px; margin-top:30px; }
          .word-task-detail { background:#fff; border:1px solid #e6e9ef; border-radius:16px; padding:20px; }
          .word-task-detail h2 { margin:0 0 8px; font-size:17px; }
          .word-task-detail p { margin:0; color:#5f6368; line-height:1.6; font-size:14px; }
          .word-task-faq { margin:34px auto 0; max-width:900px; }
          .word-task-faq h2 { font-size:26px; margin:0 0 14px; }
          .word-task-faq details { background:#fff; border:1px solid #e0e3e7; border-radius:14px; padding:0 18px; margin:10px 0; }
          .word-task-faq summary { cursor:pointer; padding:16px 0; font-weight:600; }
          .word-task-faq p { color:#5f6368; line-height:1.6; margin:0 0 16px; }
          @media(max-width:760px){ .word-task-page{padding:28px 12px 56px}.word-task-card{padding:14px}.word-task-grid{grid-template-columns:1fr}.word-task-hero h1{font-size:34px} }
        `}</style>
        <div className="word-task-wrap">
          <section className="word-task-hero">
            <p className="word-task-eyebrow">{eyebrow}</p>
            <h1>{title}</h1>
            <p className="word-task-lead">{description}</p>
          </section>
          <section className="word-task-card">{tool}</section>
          <section className="word-task-grid">
            {details.map((item) => (
              <article className="word-task-detail" key={item.title}>
                <h2>{item.title}</h2>
                <p>{item.text}</p>
              </article>
            ))}
          </section>
          <section className="word-task-faq">
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
      <FaqJsonLd items={faq} />
    </>
  );
}
