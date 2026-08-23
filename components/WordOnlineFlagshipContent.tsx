import Link from 'next/link';
import { ArrowRight, CheckCircle2, FileText, LockKeyhole, MonitorDown, Sparkles } from 'lucide-react';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { SiteFooter } from '@/components/SiteFooter';

const features = [
  {
    icon: FileText,
    title: 'Edit DOCX files',
    text: 'Open a Word document, make everyday edits, then download a fresh DOCX copy.',
  },
  {
    icon: Sparkles,
    title: 'Create from scratch',
    text: 'Start with a blank page or a starter template for resumes, letters, notes, reports and invoices.',
  },
  {
    icon: MonitorDown,
    title: 'Work in your browser',
    text: 'The normal open, edit and export workflow runs in the browser with no account required.',
  },
] as const;

const relatedTools = [
  ['DOCX Editor', '/docx-editor', 'Open a Word file and edit it directly.'],
  ['DOCX Viewer', '/docx-viewer', 'Read a DOCX without editing controls.'],
  ['Word to PDF', '/word-to-pdf', 'Turn a Word document into a PDF.'],
  ['Create Word Document', '/create-word-document', 'Start with a blank page or template.'],
] as const;

export function WordOnlineFlagshipContent() {
  return (
    <>
      <section className="fwo-flagship-info" aria-labelledby="fwo-flagship-title">
        <style>{`
          .fwo-flagship-info{background:linear-gradient(180deg,#f8faff 0,#fff 42%);color:#202124;border-top:1px solid #e8ecf2;padding:32px 20px 68px;font-family:Arial,Helvetica,sans-serif}.fwo-flagship-wrap{width:min(1080px,100%);margin:0 auto}.fwo-flagship-breadcrumbs{margin-bottom:26px}.fwo-flagship-hero{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(280px,.65fr);gap:32px;align-items:end;padding:28px 0 34px}.fwo-flagship-kicker{display:inline-flex;align-items:center;gap:7px;margin:0 0 12px;color:#0b57d0;font-size:12px;font-weight:700;letter-spacing:.07em;text-transform:uppercase}.fwo-flagship-kicker svg{width:15px;height:15px}.fwo-flagship-hero h2{max-width:760px;font-size:clamp(30px,4vw,46px);letter-spacing:-.035em;line-height:1.08;margin:0}.fwo-flagship-hero-copy{max-width:700px;color:#5f6368;font-size:16px;line-height:1.7;margin:15px 0 0}.fwo-flagship-trust{display:flex;flex-wrap:wrap;gap:8px;justify-content:flex-end}.fwo-flagship-pill{display:inline-flex;align-items:center;gap:7px;border:1px solid #d7e1ee;border-radius:999px;background:#fff;padding:8px 11px;color:#394457;font-size:12px;font-weight:600;box-shadow:0 1px 2px rgba(60,64,67,.04)}.fwo-flagship-pill svg{width:14px;height:14px;color:#137333}.fwo-flagship-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}.fwo-flagship-card{border:1px solid #e3e8ef;border-radius:18px;background:#fff;padding:22px;box-shadow:0 8px 28px rgba(60,64,67,.055)}.fwo-flagship-card-icon{width:38px;height:38px;display:grid;place-items:center;border-radius:12px;background:#edf4ff;color:#0b57d0;margin-bottom:16px}.fwo-flagship-card-icon svg{width:19px;height:19px}.fwo-flagship-card h3{margin:0 0 7px;font-size:17px;letter-spacing:-.01em}.fwo-flagship-card p{margin:0;color:#5f6368;line-height:1.6;font-size:13px}.fwo-flagship-details{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:16px}.fwo-flagship-panel{border:1px solid #e3e8ef;border-radius:18px;background:#fff;padding:22px}.fwo-flagship-panel-head{display:flex;align-items:center;gap:10px;margin-bottom:12px}.fwo-flagship-panel-head span{width:34px;height:34px;display:grid;place-items:center;border-radius:11px;background:#f2f6fb;color:#0b57d0}.fwo-flagship-panel-head svg{width:18px;height:18px}.fwo-flagship-panel h3{margin:0;font-size:17px}.fwo-flagship-panel p{margin:0;color:#5f6368;line-height:1.65;font-size:13px}.fwo-flagship-panel ul{display:grid;gap:8px;margin:15px 0 0;padding:0;list-style:none}.fwo-flagship-panel li{position:relative;padding-left:20px;color:#444746;font-size:13px;line-height:1.5}.fwo-flagship-panel li:before{content:'✓';position:absolute;left:0;color:#137333;font-weight:700}.fwo-flagship-inline-links{display:flex;gap:9px;flex-wrap:wrap;margin-top:16px}.fwo-flagship-inline-links a{display:inline-flex;align-items:center;gap:6px;color:#0b57d0;text-decoration:none;font-size:12px;font-weight:700}.fwo-flagship-inline-links a:hover{text-decoration:underline}.fwo-flagship-related{margin-top:42px;padding-top:32px;border-top:1px solid #e7ebf1}.fwo-flagship-related-head{display:flex;align-items:end;justify-content:space-between;gap:20px;margin-bottom:16px}.fwo-flagship-related h2{margin:0;font-size:24px;letter-spacing:-.02em}.fwo-flagship-related-head p{margin:0;color:#6a7078;font-size:13px}.fwo-flagship-tool-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}.fwo-flagship-tool{display:block;border:1px solid #e2e7ee;border-radius:15px;background:#fff;padding:16px;color:#202124;text-decoration:none;transition:border-color .16s ease,transform .16s ease,box-shadow .16s ease}.fwo-flagship-tool:hover{transform:translateY(-2px);border-color:#b8c9e3;box-shadow:0 8px 22px rgba(60,64,67,.07)}.fwo-flagship-tool strong{display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:14px}.fwo-flagship-tool strong svg{width:15px;height:15px;color:#0b57d0}.fwo-flagship-tool span{display:block;margin-top:7px;color:#6a7078;font-size:12px;line-height:1.5}@media(max-width:820px){.fwo-flagship-hero{grid-template-columns:1fr;gap:18px}.fwo-flagship-trust{justify-content:flex-start}.fwo-flagship-tool-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:700px){.fwo-flagship-info{padding:24px 16px 52px}.fwo-flagship-hero{padding:20px 0 26px}.fwo-flagship-grid,.fwo-flagship-details{grid-template-columns:1fr}.fwo-flagship-related-head{align-items:flex-start;flex-direction:column}.fwo-flagship-tool-grid{grid-template-columns:1fr}}
        `}</style>
        <div className="fwo-flagship-wrap">
          <div className="fwo-flagship-breadcrumbs">
            <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Word Online' }]} />
          </div>

          <div className="fwo-flagship-hero">
            <div>
              <p className="fwo-flagship-kicker"><Sparkles /> Free Word Online</p>
              <h2 id="fwo-flagship-title">A simple Word editor for everyday document work</h2>
              <p className="fwo-flagship-hero-copy">Open a DOCX, make useful edits with familiar controls, or start a new document from scratch. The core editor works without requiring an account.</p>
            </div>
            <div className="fwo-flagship-trust" aria-label="Product highlights">
              <span className="fwo-flagship-pill"><CheckCircle2 /> No login</span>
              <span className="fwo-flagship-pill"><CheckCircle2 /> DOCX in & out</span>
              <span className="fwo-flagship-pill"><CheckCircle2 /> Local autosave</span>
            </div>
          </div>

          <div className="fwo-flagship-grid">
            {features.map(({ icon: Icon, title, text }) => (
              <article className="fwo-flagship-card" key={title}>
                <span className="fwo-flagship-card-icon"><Icon /></span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>

          <div className="fwo-flagship-details">
            <section className="fwo-flagship-panel">
              <div className="fwo-flagship-panel-head"><span><FileText /></span><h3>Supported today</h3></div>
              <p>DOCX is the primary rich-document format. HTML and TXT can also be opened in the editor, while PDF output is available through the print/save flow and dedicated converter.</p>
              <ul>
                <li>DOCX files up to 20 MB in the current editor path</li>
                <li>Paragraphs, headings, lists, links, tables and images</li>
                <li>Page breaks plus basic headers and footers</li>
              </ul>
              <div className="fwo-flagship-inline-links"><Link href="/supported-formats">See supported formats <ArrowRight /></Link></div>
            </section>

            <section className="fwo-flagship-panel">
              <div className="fwo-flagship-panel-head"><span><LockKeyhole /></span><h3>Document handling</h3></div>
              <p>The current normal open, edit and export flow is browser-based. Drafts and rolling version history use browser localStorage on the device where you are editing.</p>
              <ul>
                <li>No account required for the core editor</li>
                <li>Browser-local draft and version-history storage</li>
                <li>No unsupported security certifications claimed</li>
              </ul>
              <div className="fwo-flagship-inline-links"><Link href="/security">Security & privacy details <ArrowRight /></Link></div>
            </section>
          </div>

          <section className="fwo-flagship-related" aria-labelledby="fwo-related-title">
            <div className="fwo-flagship-related-head">
              <h2 id="fwo-related-title">More document tools</h2>
              <p>Use the same document engine for a more specific task.</p>
            </div>
            <div className="fwo-flagship-tool-grid">
              {relatedTools.map(([title, href, text]) => (
                <Link className="fwo-flagship-tool" href={href} key={href}>
                  <strong>{title}<ArrowRight /></strong>
                  <span>{text}</span>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
