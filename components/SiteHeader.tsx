import Link from 'next/link';

// DOC321 primary brand lockup: document + 3-2-1 speed motif.
const navLinks = [
  ['Tools', '/tools'],
  ['Edit', '/edit'],
  ['View', '/view'],
  ['Convert', '/convert'],
  ['Create', '/create'],
] as const;

function Doc321Mark({ size = 38 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <rect x="10" y="5" width="42" height="54" rx="12" fill="#0B66E6" />
      <path d="M38 5h4a10 10 0 0 1 10 10v7H38z" fill="#28B8F7" />
      <rect x="17" y="19" width="27" height="7" rx="3.5" fill="#22D07D" />
      <rect x="17" y="29" width="31" height="7" rx="3.5" fill="#FFC107" />
      <rect x="17" y="39" width="35" height="7" rx="3.5" fill="#23B8F5" />
      <circle cx="18" cy="22.5" r="6.25" fill="#22D07D" /><text x="18" y="25.4" textAnchor="middle" fontSize="8.5" fontWeight="800" fill="#fff">3</text>
      <circle cx="18" cy="32.5" r="6.25" fill="#FFC107" /><text x="18" y="35.4" textAnchor="middle" fontSize="8.5" fontWeight="800" fill="#fff">2</text>
      <circle cx="18" cy="42.5" r="6.25" fill="#23B8F5" /><text x="18" y="45.4" textAnchor="middle" fontSize="8.5" fontWeight="800" fill="#fff">1</text>
      <rect x="4" y="20" width="8" height="5" rx="2.5" fill="#22D07D" />
      <rect x="2" y="30" width="10" height="5" rx="2.5" fill="#FFC107" />
      <rect x="0" y="40" width="12" height="5" rx="2.5" fill="#23B8F5" />
    </svg>
  );
}

function Doc321Wordmark() {
  return <span className="doc321-wordmark"><span>DOC</span><b className="n3">3</b><b className="n2">2</b><b className="n1">1</b></span>;
}

export function SiteHeader() {
  return (
    <header className="site-header product-site-header">
      <style>{`
        .product-site-header{height:68px;display:flex;align-items:center;justify-content:space-between;gap:18px;padding:0 clamp(18px,4vw,60px);background:rgba(255,255,255,.96);border-bottom:1px solid #e3e6ea;position:sticky;top:0;z-index:40;backdrop-filter:blur(16px);font-family:Arial,Helvetica,sans-serif}
        .product-site-header .site-brand{display:flex;align-items:center;gap:8px;text-decoration:none;white-space:nowrap;min-width:max-content}
        .product-site-header .doc321-wordmark{font-size:21px;line-height:1;font-weight:900;letter-spacing:-.055em;color:#0B66E6}.product-site-header .doc321-wordmark b{font:inherit}.product-site-header .doc321-wordmark .n3{color:#22D07D}.product-site-header .doc321-wordmark .n2{color:#F4B400}.product-site-header .doc321-wordmark .n1{color:#23B8F5}
        .product-site-header .site-nav{display:flex;align-items:center;gap:4px;overflow-x:auto;scrollbar-width:none}.product-site-header .site-nav::-webkit-scrollbar{display:none}
        .product-site-header .site-nav a{display:inline-flex;align-items:center;justify-content:center;min-height:36px;padding:0 12px;border-radius:999px;color:#4b5560;text-decoration:none;font-size:13px;font-weight:650;white-space:nowrap;transition:background .15s,color .15s}
        .product-site-header .site-nav a:hover{background:#f1f3f4;color:#174ea6}.product-site-header .site-nav a:first-child{background:#e8f0fe;color:#174ea6}
        @media(max-width:640px){.product-site-header{height:64px;padding:0 12px;gap:8px}.product-site-header .site-brand{gap:5px}.product-site-header .site-brand svg{width:33px;height:33px}.product-site-header .doc321-wordmark{font-size:17px}.product-site-header .site-nav{gap:1px}.product-site-header .site-nav a{padding:0 8px;font-size:12px}.product-site-header .site-nav a:nth-child(3),.product-site-header .site-nav a:nth-child(5){display:none}}
      `}</style>
      <Link href="/" className="site-brand" aria-label="DOC321 home">
        <Doc321Mark />
        <Doc321Wordmark />
      </Link>
      <nav className="site-nav" aria-label="Main navigation">
        {navLinks.map(([label, href]) => <Link href={href} key={href}>{label}</Link>)}
      </nav>
    </header>
  );
}
