import Link from 'next/link';

const navLinks = [
  ['Tools', '/tools'],
  ['Edit', '/edit'],
  ['View', '/view'],
  ['Convert', '/convert'],
  ['Create', '/create'],
] as const;

export function SiteHeader() {
  return (
    <header className="site-header product-site-header">
      <style>{`
        .product-site-header{height:74px;display:flex;align-items:center;justify-content:space-between;gap:18px;padding:0 clamp(18px,4vw,60px);background:rgba(255,255,255,.96);border-bottom:1px solid #e3e6ea;position:sticky;top:0;z-index:40;backdrop-filter:blur(16px);font-family:Arial,Helvetica,sans-serif}
        .product-site-header .site-brand{display:flex;align-items:center;min-height:44px;text-decoration:none;white-space:nowrap;min-width:max-content;line-height:0}
        .product-site-header .site-logo{display:block;width:auto;height:42px;max-width:none}
        .product-site-header .site-nav{display:flex;align-items:center;gap:4px;overflow-x:auto;scrollbar-width:none}.product-site-header .site-nav::-webkit-scrollbar{display:none}
        .product-site-header .site-nav a{display:inline-flex;align-items:center;justify-content:center;min-height:36px;padding:0 12px;border-radius:999px;color:#4b5560;text-decoration:none;font-size:13px;font-weight:650;white-space:nowrap;transition:background .15s,color .15s}
        .product-site-header .site-nav a:hover{background:#f1f3f4;color:#174ea6}.product-site-header .site-nav a:first-child{background:#e8f0fe;color:#174ea6}
        @media(max-width:640px){.product-site-header{height:68px;padding:0 12px;gap:8px}.product-site-header .site-logo{height:35px}.product-site-header .site-nav{gap:1px}.product-site-header .site-nav a{padding:0 8px;font-size:12px}.product-site-header .site-nav a:nth-child(3),.product-site-header .site-nav a:nth-child(5){display:none}}
        @media(max-width:390px){.product-site-header .site-logo{height:32px}.product-site-header .site-nav a{padding:0 7px}}
      `}</style>
      <Link href="/" className="site-brand" aria-label="DOC321 home">
        <img className="site-logo" src="/doc321-logo.svg" width="244" height="52" alt="DOC321" decoding="async" fetchPriority="high" />
      </Link>
      <nav className="site-nav" aria-label="Main navigation">
        {navLinks.map(([label, href]) => <Link href={href} key={href}>{label}</Link>)}
      </nav>
    </header>
  );
}
