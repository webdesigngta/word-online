import Link from 'next/link';

const navLinks = [
  ['All Tools', '/tools'],
  ['Edit', '/edit'],
  ['View', '/view'],
  ['Convert', '/convert'],
  ['Create', '/create'],
] as const;

type SiteHeaderProps = {
  contextTitle?: string;
  contextMetaId?: string;
  contextMeta?: string;
};

export function SiteHeader({ contextTitle, contextMetaId, contextMeta = '' }: SiteHeaderProps = {}) {
  const hasContext = Boolean(contextTitle);

  return (
    <header className={`site-header product-site-header${hasContext ? ' has-context' : ''}`}>
      <style>{`
        .product-site-header{height:74px;display:flex;align-items:center;justify-content:space-between;gap:18px;padding:0 clamp(18px,4vw,60px);background:rgba(255,255,255,.96);border-bottom:1px solid #e3e6ea;position:sticky;top:0;z-index:40;backdrop-filter:blur(16px);font-family:Arial,Helvetica,sans-serif}
        .product-site-header .site-brand-cluster{display:flex;align-items:center;gap:15px;min-width:0}
        .product-site-header .site-brand{display:flex;align-items:center;min-height:44px;text-decoration:none;white-space:nowrap;min-width:max-content;line-height:0}
        .product-site-header .site-logo{display:block;width:auto;height:40px;max-width:none}
        .product-site-header .site-context{display:flex;align-items:center;gap:13px;min-width:0}
        .product-site-header .site-context-divider{width:1px;height:36px;background:#dfe3e8;flex:0 0 auto}
        .product-site-header .site-context-copy{display:flex;flex-direction:row;align-items:center;justify-content:flex-start;gap:11px;min-width:0;line-height:1}
        .product-site-header .site-context-title{color:#172033;font-size:17px;font-weight:780;letter-spacing:-.02em;white-space:nowrap}
        .product-site-header .site-context-meta{display:inline-flex;align-items:center;min-height:27px;padding:0 9px;border-radius:999px;background:#f3f6fb;color:#687386;font-size:12px;font-weight:650;white-space:nowrap}
        .product-site-header .site-nav{display:flex;align-items:center;gap:4px;overflow-x:auto;scrollbar-width:none}.product-site-header .site-nav::-webkit-scrollbar{display:none}
        .product-site-header .site-nav a{display:inline-flex;align-items:center;justify-content:center;min-height:36px;padding:0 12px;border-radius:999px;color:#4b5560;text-decoration:none;font-size:13px;font-weight:650;white-space:nowrap;transition:background .15s,color .15s}
        .product-site-header .site-nav a:hover{background:#f1f3f4;color:#174ea6}.product-site-header .site-nav a:first-child{background:#e8f0fe;color:#174ea6}
        @media(max-width:980px){.product-site-header.has-context{padding-inline:16px;gap:10px}.product-site-header.has-context .site-brand-cluster{gap:11px}.product-site-header.has-context .site-context{gap:10px}.product-site-header.has-context .site-context-title{font-size:15px}.product-site-header.has-context .site-context-meta{font-size:11px;min-height:25px;padding-inline:8px}.product-site-header.has-context .site-nav a{padding-inline:9px;font-size:12px}}
        @media(max-width:760px){.product-site-header.has-context .site-nav{display:none}.product-site-header.has-context{justify-content:flex-start}}
        @media(max-width:640px){.product-site-header{height:68px;padding:0 12px;gap:8px}.product-site-header .site-logo{height:31px}.product-site-header .site-nav{gap:1px}.product-site-header .site-nav a{padding:0 8px;font-size:12px}.product-site-header .site-nav a:nth-child(3),.product-site-header .site-nav a:nth-child(5){display:none}.product-site-header.has-context .site-brand-cluster{gap:8px}.product-site-header.has-context .site-context{gap:8px}.product-site-header.has-context .site-context-divider{height:28px}.product-site-header.has-context .site-context-copy{gap:7px}.product-site-header.has-context .site-context-title{font-size:14px}.product-site-header.has-context .site-context-meta{font-size:10.5px;min-height:23px;padding-inline:7px}}
        @media(max-width:420px){.product-site-header.has-context{padding-inline:8px}.product-site-header.has-context .site-logo{height:27px}.product-site-header.has-context .site-brand-cluster{gap:6px}.product-site-header.has-context .site-context{gap:6px}.product-site-header.has-context .site-context-divider{height:25px}.product-site-header.has-context .site-context-copy{gap:6px}.product-site-header.has-context .site-context-title{font-size:13px}.product-site-header.has-context .site-context-meta{font-size:9.5px;min-height:21px;padding-inline:6px}}
        @media(max-width:350px){.product-site-header.has-context .site-logo{height:24px}.product-site-header.has-context .site-context-divider{display:none}.product-site-header.has-context .site-context-title{font-size:12.5px}.product-site-header.has-context .site-context-meta{font-size:9px;padding-inline:5px}.product-site-header.has-context .site-context-copy{gap:5px}}
      `}</style>
      <div className="site-brand-cluster">
        <Link href="/" className="site-brand" aria-label="DOC321 home">
          <img className="site-logo" src="/doc321-logo.svg" width="244" height="52" alt="DOC321" decoding="async" fetchPriority="high" />
        </Link>
        {contextTitle ? (
          <div className="site-context" aria-label={contextTitle}>
            <span className="site-context-divider" aria-hidden="true" />
            <div className="site-context-copy">
              <strong className="site-context-title">{contextTitle}</strong>
              <span id={contextMetaId} className="site-context-meta">{contextMeta || 'Saved locally'}</span>
            </div>
          </div>
        ) : null}
      </div>
      <nav className="site-nav" aria-label="Main navigation">
        {navLinks.map(([label, href]) => <Link href={href} key={href}>{label}</Link>)}
      </nav>
    </header>
  );
}
