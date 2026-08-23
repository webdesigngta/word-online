import Link from 'next/link';
import { pageMetadata } from '@/lib/seo';
import { SiteHeader } from '@/components/SiteHeader';
import { SoftwareJsonLd } from '@/components/JsonLd';

export const metadata = pageMetadata({
  title: 'Free Word Online – Edit Word Documents Free',
  description: 'A fast, free online Word editor for opening and editing DOCX files without creating an account.',
  path: '/',
});

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="home-hero">
          <div>
            <p className="eyebrow">FREE • NO LOGIN • BROWSER-BASED</p>
            <h1>Edit Word documents online, free.</h1>
            <p className="landing-lead">Open a DOCX file, write and format your document, then export it again. Your basic editing session stays in your browser.</p>
            <div className="hero-actions">
              <Link className="primary-link" href="/word-online">Start editing</Link>
              <Link className="secondary-link" href="/docx-editor-online">Learn about DOCX editing</Link>
            </div>
            <div className="trust-row" aria-label="Product benefits">
              <span>✓ No sign-up</span><span>✓ Local autosave</span><span>✓ DOCX import/export</span><span>✓ Works on modern browsers</span>
            </div>
          </div>
          <div className="editor-preview" aria-hidden="true">
            <div className="preview-titlebar"><span className="brand-mark">W</span><span>Document.docx</span></div>
            <div className="preview-tabs">File&nbsp;&nbsp; Home&nbsp;&nbsp; Insert&nbsp;&nbsp; Layout&nbsp;&nbsp; Review&nbsp;&nbsp; View</div>
            <div className="preview-ribbon"><b>B</b><i>I</i><u>U</u><span>Calibri</span><span>11</span><span>☰</span></div>
            <div className="preview-canvas"><div className="preview-page"><h3>Your document</h3><p>Start writing here. Format text, add lists, links, images and tables.</p></div></div>
          </div>
        </section>
        <section className="home-features">
          <article><h2>Open DOCX files</h2><p>Import standard Word documents directly in the browser and continue editing without installing desktop software.</p></article>
          <article><h2>Familiar editing tools</h2><p>Use common document controls for fonts, text styling, alignment, lists, links, images and tables.</p></article>
          <article><h2>Export when finished</h2><p>Download your document as DOCX or HTML, or print it to PDF using your browser's print dialog.</p></article>
        </section>
      </main>
      <SoftwareJsonLd />
    </>
  );
}
