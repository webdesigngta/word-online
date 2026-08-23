import Link from 'next/link';
import { pageMetadata } from '@/lib/seo';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteHeader } from '@/components/SiteHeader';
import { SoftwareJsonLd } from '@/components/JsonLd';
import { wordInterfaces } from '@/tools/word/interfaces/config';

export const metadata = pageMetadata({
  title: 'Free Word Online – Edit Word Documents Free',
  description: 'A fast, free online Word editor for opening and editing DOCX files without creating an account.',
  path: '/',
});

const tools = wordInterfaces.filter((tool) => tool.id !== 'word-online' && tool.indexable);

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
              <Link className="secondary-link" href="/docx-editor">Open DOCX editor</Link>
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
          <article><h2>One engine, many tools</h2><p>Editing, viewing, conversion and document utilities share the same underlying document-processing architecture.</p></article>
        </section>
        <section className="fwo-tool-directory" aria-labelledby="fwo-tool-directory-title">
          <style>{`
            .fwo-tool-directory{width:min(1120px,calc(100% - 32px));margin:54px auto 76px}.fwo-tool-directory h2{font-size:30px;margin:0 0 8px}.fwo-tool-directory>p{margin:0 0 22px;color:#5f6368}.fwo-tool-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}.fwo-tool-card{display:block;text-decoration:none;color:#202124;border:1px solid #e0e3e7;border-radius:16px;background:#fff;padding:18px;transition:transform .15s ease,box-shadow .15s ease,border-color .15s ease}.fwo-tool-card:hover{transform:translateY(-2px);border-color:#b8c6db;box-shadow:0 8px 22px rgba(60,64,67,.09)}.fwo-tool-card strong{display:block;font-size:16px;margin-bottom:6px}.fwo-tool-card span{color:#5f6368;line-height:1.5;font-size:13px}@media(max-width:760px){.fwo-tool-grid{grid-template-columns:1fr}.fwo-tool-directory{margin-top:38px}}
          `}</style>
          <h2 id="fwo-tool-directory-title">Word document tools</h2>
          <p>One document engine, configured for different real document tasks.</p>
          <div className="fwo-tool-grid">
            {tools.map((tool) => <Link className="fwo-tool-card" href={tool.route} key={tool.id}><strong>{tool.name}</strong><span>{tool.primaryIntent}</span></Link>)}
          </div>
        </section>
      </main>
      <SiteFooter />
      <SoftwareJsonLd />
    </>
  );
}
