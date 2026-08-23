import Link from 'next/link';

const footerLinks = [
  ['Tools', '/tools'],
  ['Edit', '/edit'],
  ['View', '/view'],
  ['Convert', '/convert'],
  ['Create', '/create'],
] as const;

export function SiteFooter() {
  return (
    <footer className="fwo-site-footer">
      <style>{`
        .fwo-site-footer{border-top:1px solid #e0e3e7;background:#fff;color:#5f6368;font-family:Arial,Helvetica,sans-serif}.fwo-site-footer-inner{width:min(1120px,calc(100% - 32px));margin:0 auto;min-height:86px;display:flex;align-items:center;justify-content:space-between;gap:18px;padding:18px 0}.fwo-site-footer-brand{color:#202124;font-weight:700;text-decoration:none}.fwo-site-footer nav{display:flex;gap:16px;flex-wrap:wrap}.fwo-site-footer nav a{color:#5f6368;text-decoration:none;font-size:13px}.fwo-site-footer nav a:hover{text-decoration:underline;color:#0b57d0}.fwo-site-footer small{font-size:11px}@media(max-width:680px){.fwo-site-footer-inner{align-items:flex-start;flex-direction:column}.fwo-site-footer nav{gap:12px}}
      `}</style>
      <div className="fwo-site-footer-inner">
        <div>
          <Link className="fwo-site-footer-brand" href="/">Free Word Online</Link>
          <small> · Browser-based document tools</small>
        </div>
        <nav aria-label="Footer navigation">
          {footerLinks.map(([label, href]) => <Link href={href} key={href}>{label}</Link>)}
        </nav>
      </div>
    </footer>
  );
}
