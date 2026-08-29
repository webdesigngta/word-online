import { CheckCircle2 } from 'lucide-react';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteHeader } from '@/components/SiteHeader';
import { ToolsDirectory } from '@/components/ToolsDirectory';
import { pageMetadata } from '@/lib/seo';
import { allLivePlatformTools } from '@/tools/platform/allTools';

export const metadata = pageMetadata({
  title: '100% Free PDF, Word & OCR Tools | DOC321',
  description: 'Browse every free DOC321 PDF, Word, OCR, spreadsheet, presentation, image and document tool in one clean directory. No sign-up, no ads and no limits.',
  path: '/tools',
});

const trustPoints = ['No sign-up', 'No ads', 'Unlimited use', 'Files deleted after 10 min'] as const;

export default function ToolsPage() {
  return (
    <>
      <SiteHeader />
      <main className="tools-page-shell">
        <style>{`
          .tools-page-shell{min-height:100vh;color:var(--doc-ink);background:#fff;font-family:Arial,Helvetica,sans-serif}
          .tools-page-top{padding:20px 20px 56px;border-bottom:1px solid #EEF0F3;background:linear-gradient(180deg,#F7F9FC 0%,#FBFCFE 100%)}
          .tools-page-wrap{width:min(1200px,100%);margin:0 auto}
          .tools-page-hero{max-width:980px;margin:54px auto 0;text-align:center}
          .tools-page-hero h1{margin:0 auto;max-width:980px;color:#151E30;font-size:clamp(40px,4.7vw,58px);line-height:1.05;letter-spacing:-.045em;text-wrap:balance}
          .tools-page-hero p{max-width:720px;margin:18px auto 0;color:#5F6C7F;font-size:18px;line-height:1.58;text-wrap:balance}
          .tools-page-trust{display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:10px 22px;margin:24px auto 0;color:#45546B;font-size:13px;font-weight:700}
          .tools-page-trust span{display:inline-flex;align-items:center;gap:7px}.tools-page-trust svg{color:#3478E5}
          .tools-page-directory{padding:42px 20px 86px;background:#fff}
          @media(max-width:680px){.tools-page-top{padding:16px 12px 38px}.tools-page-hero{margin-top:34px}.tools-page-hero h1{font-size:clamp(34px,10vw,46px);line-height:1.08}.tools-page-hero p{font-size:16px;line-height:1.55}.tools-page-trust{gap:9px 14px;margin-top:20px;font-size:12px}.tools-page-directory{padding:30px 12px 64px}}
        `}</style>

        <section className="tools-page-top">
          <div className="tools-page-wrap">
            <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Tools' }]} />
            <div className="tools-page-hero">
              <h1>100% Free PDF, Word &amp; OCR Tools: Fast, Private &amp; Unlimited</h1>
              <p>Find the right document tool in seconds. Search or browse {allLivePlatformTools.length} tools for PDF, Word, OCR, images, spreadsheets, presentations and more.</p>
              <div className="tools-page-trust" aria-label="DOC321 tool benefits">
                {trustPoints.map((point) => <span key={point}><CheckCircle2 size={15} aria-hidden="true" />{point}</span>)}
              </div>
            </div>
          </div>
        </section>

        <section className="tools-page-directory" aria-label="All DOC321 document tools">
          <div className="tools-page-wrap"><ToolsDirectory tools={allLivePlatformTools} /></div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
