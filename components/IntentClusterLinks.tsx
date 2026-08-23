import Link from 'next/link';

const cluster = [
  { route: '/docx-editor', label: 'DOCX Editor', text: 'Open and edit an existing DOCX file.' },
  { route: '/docx-viewer', label: 'DOCX Viewer', text: 'Read a DOCX file without editing it.' },
  { route: '/docx-to-pdf', label: 'DOCX to PDF', text: 'Convert the DOCX file format directly to PDF.' },
  { route: '/word-to-pdf', label: 'Word to PDF', text: 'Convert a Word document to a downloadable PDF.' },
  { route: '/create-word-document', label: 'Create Word Document', text: 'Start a new Word document from blank or a template.' },
] as const;

export function IntentClusterLinks({ current }: { current: string }) {
  const links = cluster.filter((item) => item.route !== current);
  return (
    <nav className="fwo-intent-cluster" aria-label="Related Word document tasks">
      <style>{`
        .fwo-intent-cluster{background:#f8fafd;border-top:1px solid #e5e8ed;padding:34px 20px 46px;font-family:Arial,Helvetica,sans-serif}.fwo-intent-cluster-inner{width:min(1040px,100%);margin:0 auto}.fwo-intent-cluster h2{margin:0 0 6px;font-size:22px;color:#202124}.fwo-intent-cluster p{margin:0 0 16px;color:#5f6368;font-size:13px;line-height:1.55}.fwo-intent-cluster-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.fwo-intent-cluster a{display:block;text-decoration:none;color:#202124;background:#fff;border:1px solid #e0e3e7;border-radius:13px;padding:14px}.fwo-intent-cluster a:hover{border-color:#a8b9d3;box-shadow:0 5px 14px rgba(60,64,67,.07)}.fwo-intent-cluster strong{display:block;font-size:13px;margin-bottom:5px}.fwo-intent-cluster span{display:block;color:#5f6368;font-size:11px;line-height:1.45}@media(max-width:820px){.fwo-intent-cluster-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:520px){.fwo-intent-cluster-grid{grid-template-columns:1fr}}
      `}</style>
      <div className="fwo-intent-cluster-inner">
        <h2>Related Word document tasks</h2>
        <p>Choose the interface that matches what you actually want to do.</p>
        <div className="fwo-intent-cluster-grid">
          {links.map((item) => <Link href={item.route} key={item.route}><strong>{item.label}</strong><span>{item.text}</span></Link>)}
        </div>
      </div>
    </nav>
  );
}
