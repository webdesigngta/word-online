import Link from 'next/link';

const footerLinks = [
  ['All tools', '/tools'],
  ['Word', '/tools#tools-word'],
  ['PDF', '/tools#tools-pdf'],
  ['PDF converters', '/tools#tools-pdf-convert'],
  ['Spreadsheets', '/tools#tools-spreadsheets'],
  ['Presentations', '/tools#tools-presentations'],
  ['Images & OCR', '/tools#tools-images-ocr'],
  ['Create', '/tools#tools-create'],
] as const;

export function SiteFooter() {
  return (
    <footer className="fwo-site-footer">
      <style>{`
        .fwo-site-footer{border-top:1px solid #e0e3e7;background:#fff;color:#5f6368;font-family:Arial,Helvetica,sans-serif}.fwo-site-footer-inner{width:min(1160px,calc(100% - 32px));margin:0 auto;display:grid;grid-template-columns:minmax(210px,.7fr) 1.3fr;gap:28px;padding:28px 0}.fwo-site-footer-brand{display:flex;align-items:center;gap:8px;text-decoration:none}.fwo-site-footer-mark{width:30px;height:30px;display:block}.fwo-site-footer-wordmark{font-size:18px;font-weight:900;letter-spacing:-.055em;color:#0B66E6}.fwo-site-footer-wordmark b{font:inherit}.fwo-site-footer-wordmark .n3{color:#22D07D}.fwo-site-footer-wordmark .n2{color:#F4B400}.fwo-site-footer-wordmark .n1{color:#23B8F5}.fwo-site-footer p{font-size:12px;line-height:1.55;margin:8px 0 0;max-width:270px}.fwo-site-footer nav{display:flex;gap:8px 14px;flex-wrap:wrap;align-content:flex-start;justify-content:flex-end}.fwo-site-footer nav a{color:#5f6368;text-decoration:none;font-size:12px;padding:7px 0}.fwo-site-footer nav a:hover{text-decoration:underline;color:#174ea6}@media(max-width:700px){.fwo-site-footer-inner{grid-template-columns:1fr;gap:14px}.fwo-site-footer nav{justify-content:flex-start}.fwo-site-footer p{max-width:none}}
      `}</style>
      <div className="fwo-site-footer-inner">
        <div>
          <Link className="fwo-site-footer-brand" href="/" aria-label="DOC321 home">
            <img className="fwo-site-footer-mark" src="/app-icon.svg" alt="" aria-hidden="true" />
            <span className="fwo-site-footer-wordmark"><span>DOC</span><b className="n3">3</b><b className="n2">2</b><b className="n1">1</b></span>
          </Link>
          <p>Fast, browser-first tools for Word, PDF, spreadsheets, presentations and everyday documents.</p>
        </div>
        <nav aria-label="Document tool families">
          {footerLinks.map(([label, href]) => <Link href={href} key={href}>{label}</Link>)}
        </nav>
      </div>
    </footer>
  );
}
