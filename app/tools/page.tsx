import { Breadcrumbs } from '@/components/Breadcrumbs';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteHeader } from '@/components/SiteHeader';
import { ToolsDirectory } from '@/components/ToolsDirectory';
import { pageMetadata } from '@/lib/seo';
import { allLivePlatformTools } from '@/tools/platform/allTools';

export const metadata = pageMetadata({
  title: 'All Document Tools – Word, PDF, Excel & More',
  description: 'Find free online Word, PDF, spreadsheet, PowerPoint, image, OCR, writing and document creation tools organized by task.',
  path: '/tools',
});

export default function ToolsPage() {
  return (
    <>
      <SiteHeader />
      <main className="tools-page-shell">
        <style>{`
          .tools-page-shell{min-height:100vh;background:#f8fafd;color:#202124;padding:28px 20px 76px;font-family:Arial,Helvetica,sans-serif}
          .tools-page-wrap{width:min(1180px,100%);margin:0 auto}
          .tools-page-hero{max-width:820px;margin:34px 0 30px}
          .tools-page-kicker{display:inline-flex;align-items:center;min-height:28px;padding:0 10px;border-radius:999px;background:#e8f0fe;color:#174ea6;font-size:11px;font-weight:750;letter-spacing:.06em;text-transform:uppercase;margin:0 0 13px}
          .tools-page-hero h1{font-size:clamp(36px,5vw,56px);line-height:1.06;letter-spacing:-.04em;margin:0;color:#202124}
          .tools-page-hero p{max-width:720px;color:#5f6368;font-size:17px;line-height:1.65;margin:15px 0 0}
          .tools-page-trust{display:flex;gap:8px;flex-wrap:wrap;margin-top:18px}.tools-page-trust span{border:1px solid #dadce0;border-radius:999px;background:#fff;padding:6px 10px;color:#5f6368;font-size:11px;font-weight:600}
          @media(max-width:620px){.tools-page-shell{padding:22px 12px 56px}.tools-page-hero{margin:24px 2px 24px}.tools-page-hero p{font-size:15px}.tools-page-trust{gap:6px}}
        `}</style>
        <div className="tools-page-wrap">
          <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Tools' }]} />
          <section className="tools-page-hero">
            <p className="tools-page-kicker">126 live document tools</p>
            <h1>Find the right tool, fast.</h1>
            <p>Word, PDF, spreadsheets, presentations, images and writing tools are grouped by what you are trying to do. Search by task or jump straight to a product family.</p>
            <div className="tools-page-trust"><span>Browser-first</span><span>No account required</span><span>Real functional tools</span><span>Clear format limits</span></div>
          </section>
          <ToolsDirectory tools={allLivePlatformTools} />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
