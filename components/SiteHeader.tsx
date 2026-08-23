import Link from 'next/link';

export function SiteHeader() {
  return (
    <header className="site-header">
      <Link href="/" className="site-brand" aria-label="Free Word Online home">
        <span className="brand-mark" aria-hidden="true">W</span>
        <span>Free Word Online</span>
      </Link>
      <nav className="site-nav" aria-label="Main navigation">
        <Link href="/word-online">Editor</Link>
        <Link href="/docx-editor-online">DOCX Editor</Link>
        <Link href="/free-word-editor">Free Word Editor</Link>
      </nav>
    </header>
  );
}
