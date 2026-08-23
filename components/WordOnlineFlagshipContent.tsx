import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { SiteFooter } from '@/components/SiteFooter';

const features = [
  ['Open and edit DOCX', 'Import a Word document into the browser editor, make common text and layout changes, then export a new DOCX copy.'],
  ['Create from a blank page', 'Start a new document, use familiar formatting controls, insert tables or images, and save the result when finished.'],
  ['Browser-local autosave', 'Draft and rolling version-history data use the current browser localStorage adapter on the device where you are editing.'],
] as const;

export function WordOnlineFlagshipContent() {
  return (
    <>
      <section className="fwo-flagship-info" aria-labelledby="fwo-flagship-title">
        <style>{`
          .fwo-flagship-info{background:#fff;color:#202124;border-top:1px solid #e0e3e7;padding:50px 20px 70px;font-family:Arial,Helvetica,sans-serif}.fwo-flagship-wrap{width:min(1040px,100%);margin:0 auto}.fwo-flagship-intro{max-width:780px;margin:24px 0 28px}.fwo-flagship-intro h2{font-size:clamp(28px,4vw,40px);letter-spacing:-.025em;line-height:1.12;margin:0}.fwo-flagship-intro p{color:#5f6368;font-size:16px;line-height:1.7;margin:13px 0 0}.fwo-flagship-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}.fwo-flagship-card{border:1px solid #e1e5eb;border-radius:15px;background:#f9fbfd;padding:19px}.fwo-flagship-card h3{margin:0 0 7px;font-size:16px}.fwo-flagship-card p{margin:0;color:#5f6368;line-height:1.6;font-size:14px}.fwo-flagship-note{margin-top:24px;border:1px solid #dbe5f4;border-radius:16px;background:#f4f8ff;padding:20px}.fwo-flagship-note h3{margin:0 0 8px;font-size:17px}.fwo-flagship-note p{margin:0;color:#4f5965;line-height:1.65;font-size:14px}.fwo-flagship-links{display:flex;gap:10px;flex-wrap:wrap;margin-top:16px}.fwo-flagship-links a{display:inline-flex;border:1px solid #b9c9df;border-radius:999px;background:#fff;color:#0b57d0;text-decoration:none;font-size:13px;font-weight:600;padding:9px 13px}.fwo-flagship-links a:hover{background:#eef4ff}.fwo-flagship-compat{margin-top:30px}.fwo-flagship-compat h2{font-size:24px;margin:0 0 8px}.fwo-flagship-compat p{margin:0;color:#5f6368;line-height:1.65;font-size:14px}.fwo-flagship-compat ul{margin:14px 0 0;padding-left:21px;color:#444746}.fwo-flagship-compat li{margin:7px 0;line-height:1.55}@media(max-width:760px){.fwo-flagship-info{padding:38px 16px 56px}.fwo-flagship-grid{grid-template-columns:1fr}}
        `}</style>
        <div className="fwo-flagship-wrap">
          <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Word Online' }]} />
          <div className="fwo-flagship-intro">
            <h2 id="fwo-flagship-title">A free browser-based Word editor for everyday DOCX work</h2>
            <p>Word Online is the flagship editor in this document platform. The goal is straightforward: open or create a document, make useful edits with familiar controls, and download the result without requiring a login.</p>
          </div>
          <div className="fwo-flagship-grid">
            {features.map(([title, text]) => <article className="fwo-flagship-card" key={title}><h3>{title}</h3><p>{text}</p></article>)}
          </div>
          <section className="fwo-flagship-compat">
            <h2>Current file compatibility</h2>
            <p>The flagship editor currently treats DOCX as its primary rich-document format, with HTML and TXT import support. PDF is available through the print/save workflow and dedicated converter tools.</p>
            <ul>
              <li>DOCX import limit: 20 MB in the current editor path.</li>
              <li>Common paragraphs, headings, text styling, lists, links, tables and images are handled by the current import/export workflow.</li>
              <li>Advanced Word-only features such as macros, tracked changes, some fields and complex proprietary layout can be simplified during conversion.</li>
            </ul>
          </section>
          <div className="fwo-flagship-note">
            <h3>Privacy and document handling</h3>
            <p>The current editor processes the normal file-open/edit/export workflow in the browser and stores drafts/version history using browser localStorage. This is a description of the current implementation, not a certification or promise of perfect security or fidelity.</p>
            <div className="fwo-flagship-links">
              <Link href="/supported-formats">Supported formats</Link>
              <Link href="/security">Security & privacy</Link>
              <Link href="/docx-editor">DOCX editor</Link>
              <Link href="/word-to-pdf">Word to PDF</Link>
            </div>
          </div>
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
