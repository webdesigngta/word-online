import { FaqJsonLd } from '@/components/JsonLd';

export function WordEditorInfo({
  title,
  description,
  details,
  faq,
}: {
  title: string;
  description: string;
  details: Array<{ title: string; text: string }>;
  faq: Array<{ question: string; answer: string }>;
}) {
  return (
    <section className="word-editor-info" aria-labelledby="word-editor-info-title">
      <style>{`
        .word-editor-info{background:#fff;color:#202124;padding:64px 20px 76px;font-family:Arial,Helvetica,sans-serif;border-top:1px solid #e5e8ed}.word-editor-info-wrap{width:min(1040px,100%);margin:0 auto}.word-editor-info-head{max-width:760px;margin-bottom:28px}.word-editor-info h2{margin:0 0 12px;font-size:30px;letter-spacing:-.02em}.word-editor-info-head p{margin:0;color:#5f6368;font-size:16px;line-height:1.7}.word-editor-info-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:15px}.word-editor-info-card{border:1px solid #e1e5eb;border-radius:15px;background:#f9fbfd;padding:18px}.word-editor-info-card h3{margin:0 0 7px;font-size:16px}.word-editor-info-card p{margin:0;color:#5f6368;line-height:1.6;font-size:14px}.word-editor-info-faq{margin-top:34px;max-width:860px}.word-editor-info-faq h2{font-size:24px}.word-editor-info-faq details{border-bottom:1px solid #e4e7ec}.word-editor-info-faq summary{cursor:pointer;padding:15px 0;font-weight:600}.word-editor-info-faq details p{margin:0 0 16px;color:#5f6368;line-height:1.6}@media(max-width:760px){.word-editor-info{padding:44px 16px 56px}.word-editor-info-grid{grid-template-columns:1fr}}
      `}</style>
      <div className="word-editor-info-wrap">
        <div className="word-editor-info-head">
          <h2 id="word-editor-info-title">{title}</h2>
          <p>{description}</p>
        </div>
        <div className="word-editor-info-grid">
          {details.map((item) => <article className="word-editor-info-card" key={item.title}><h3>{item.title}</h3><p>{item.text}</p></article>)}
        </div>
        <div className="word-editor-info-faq">
          <h2>Frequently asked questions</h2>
          {faq.map((item) => <details key={item.question}><summary>{item.question}</summary><p>{item.answer}</p></details>)}
        </div>
      </div>
      <FaqJsonLd items={faq} />
    </section>
  );
}
