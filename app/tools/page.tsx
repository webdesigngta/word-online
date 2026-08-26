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
          .tools-page-shell{min-height:100vh;background:linear-gradient(180deg,#fff 0,#fff 410px,#f8fafd 410px,#f8fafd 100%);color:#202124;padding:24px 20px 82px;font-family:Arial,Helvetica,sans-serif}
          .tools-page-wrap{width:min(1200px,100%);margin:0 auto}
          .tools-page-hero{max-width:900px;margin:46px auto 36px;text-align:center}
          .tools-page-kicker{display:inline-flex;align-items:center;min-height:30px;padding:0 11px;border-radius:999px;background:#e8f0fe;color:#174ea6;font-size:11px;font-weight:780;letter-spacing:.065em;text-transform:uppercase;margin:0 0 14px;border:1px solid #d2e3fc}
          .tools-page-hero h1{font-size:clamp(40px,5.4vw,62px);line-height:1.02;letter-spacing:-.045em;margin:0;color:#1f2328;text-wrap:balance}
          .tools-page-hero p{max-width:760px;color:#5f6368;font-size:18px;line-height:1.62;margin:16px auto 0;text-wrap:balance}
          .tools-page-trust{display:flex;align-items:center;justify-content:center;gap:8px;flex-wrap:wrap;margin-top:19px}.tools-page-trust span{border:1px solid #dde1e7;border-radius:999px;background:#fff;padding:7px 11px;color:#5f6368;font-size:11px;font-weight:650;box-shadow:0 1px 2px rgba(60,64,67,.03)}
          @media(max-width:620px){.tools-page-shell{padding:20px 12px 60px;background:linear-gradient(180deg,#fff 0,#fff 380px,#f8fafd 380px,#f8fafd 100%)}.tools-page-hero{margin:30px 2px 28px}.tools-page-hero h1{font-size:40px}.tools-page-hero p{font-size:15px}.tools-page-trust{gap:6px}}
        `}</style>
        <div className="tools-page-wrap">
          <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Tools' }]} />
          <section className="tools-page-hero">
            <p className="tools-page-kicker">{allLivePlatformTools.length} live document tools</p>
            <h1>Every document tool, organized around the problem.</h1>
            <p>Choose the job you need to finish—not a confusing product menu. Word, PDF, spreadsheets, presentations, images, OCR and writing tools each have a clear visual identity, purpose, and next step.</p>
            <div className="tools-page-trust"><span>Free browser tools</span><span>No account required</span><span>Search by task</span><span>Clear file workflows</span></div>
          </section>
          <ToolsDirectory tools={allLivePlatformTools} />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
