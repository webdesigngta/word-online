import {
  Ban,
  Clock3,
  Download,
  Infinity,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteHeader } from '@/components/SiteHeader';
import { ToolsDirectory } from '@/components/ToolsDirectory';
import { pageMetadata } from '@/lib/seo';
import { allLivePlatformTools } from '@/tools/platform/allTools';

export const metadata = pageMetadata({
  title: 'All Document Tools – PDF, Word, Excel, OCR & More',
  description: 'Browse every free DOC321 document tool in one place. Search PDF, Word, spreadsheet, presentation, image, OCR, text and document creation tools by task.',
  path: '/tools',
});

const assurances = [
  { title: 'No sign-up', detail: 'Start instantly', Icon: UserCheck },
  { title: 'No ads', detail: 'Zero distractions', Icon: Ban },
  { title: 'No limits', detail: 'Use tools as needed', Icon: Infinity },
  { title: 'Unlimited downloads', detail: 'Keep every result', Icon: Download },
  { title: 'Safe & private', detail: 'Files stay protected', Icon: ShieldCheck },
  { title: 'Deleted after 10 min', detail: 'Permanently removed', Icon: Clock3 },
] as const;

export default function ToolsPage() {
  return (
    <>
      <SiteHeader />
      <main className="tools-page-shell">
        <style>{`
          .tools-page-shell{
            min-height:100vh;
            color:var(--doc-ink);
            background:#fff;
            font-family:Arial,Helvetica,sans-serif;
          }
          .tools-page-top{
            position:relative;
            isolation:isolate;
            overflow:hidden;
            padding:22px 20px 46px;
            background-image:
              url('/home-hero-vectors.svg'),
              radial-gradient(circle at 12% 8%,rgba(0,180,252,.13),transparent 28%),
              radial-gradient(circle at 88% 10%,rgba(154,1,250,.10),transparent 28%),
              radial-gradient(circle at 58% 96%,rgba(255,114,0,.07),transparent 26%),
              linear-gradient(180deg,#FBFDFF 0%,#FFFFFF 100%);
            background-repeat:no-repeat;
            background-position:center top,center,center,center,center;
            background-size:min(1440px,100%) auto,auto,auto,auto,auto;
            border-bottom:1px solid rgba(1,24,85,.06);
          }
          .tools-page-wrap{width:min(1200px,100%);margin:0 auto}
          .tools-page-hero{max-width:900px;margin:58px auto 24px;text-align:center}
          .tools-page-kicker{
            display:inline-flex;
            align-items:center;
            min-height:32px;
            padding:0 12px;
            margin:0 0 16px;
            border:1px solid rgba(0,108,253,.17);
            border-radius:999px;
            background:rgba(255,255,255,.84);
            color:#1643A7;
            box-shadow:0 8px 24px rgba(0,83,215,.06);
            backdrop-filter:blur(8px);
            font-size:12px;
            font-weight:800;
            letter-spacing:.075em;
            text-transform:uppercase;
          }
          .tools-page-hero h1{
            max-width:830px;
            margin:0 auto;
            color:var(--doc-navy);
            font-size:clamp(46px,5.6vw,68px);
            line-height:1;
            letter-spacing:-.052em;
            text-wrap:balance;
          }
          .tools-page-hero p{
            max-width:740px;
            margin:18px auto 0;
            color:var(--doc-muted);
            font-size:19px;
            line-height:1.58;
            text-wrap:balance;
          }
          .tools-page-hero strong{color:#29395F}
          .tools-page-directory{
            padding:38px 20px 86px;
            background:
              radial-gradient(circle at 0 14%,rgba(0,180,252,.055),transparent 20%),
              radial-gradient(circle at 100% 72%,rgba(154,1,250,.045),transparent 22%),
              #fff;
          }
          .tools-page-assurance{
            margin:4px 0 0;
            padding:0 20px 86px;
            background:#fff;
          }
          .tools-assurance-card{
            position:relative;
            overflow:hidden;
            width:min(1200px,100%);
            margin:0 auto;
            padding:30px;
            border:1px solid var(--doc-line);
            border-radius:22px;
            background:var(--doc-soft-gradient);
            box-shadow:var(--doc-shadow-sm);
          }
          .tools-assurance-card:after{
            content:'';
            position:absolute;
            width:230px;
            height:230px;
            right:-100px;
            top:-130px;
            border-radius:50%;
            background:linear-gradient(135deg,rgba(0,180,252,.16),rgba(154,1,250,.10));
          }
          .tools-assurance-head{position:relative;z-index:1;text-align:center;margin-bottom:22px}
          .tools-assurance-head h2{margin:0;color:var(--doc-navy);font-size:clamp(27px,3vw,36px);letter-spacing:-.035em}
          .tools-assurance-head p{margin:8px auto 0;max-width:670px;color:var(--doc-muted);font-size:15px;line-height:1.55}
          .tools-assurance-grid{position:relative;z-index:1;display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:10px}
          .tools-assurance-item{
            min-width:0;
            min-height:94px;
            padding:13px 12px;
            border:1px solid rgba(1,24,85,.08);
            border-radius:15px;
            background:rgba(255,255,255,.82);
            box-shadow:0 6px 18px rgba(1,24,85,.035);
            text-align:center;
          }
          .tools-assurance-icon{width:34px;height:34px;display:grid;place-items:center;margin:0 auto 9px;border-radius:10px;background:#EDF7FF;color:var(--doc-blue)}
          .tools-assurance-item:nth-child(2) .tools-assurance-icon{background:#F5EEFF;color:var(--doc-purple)}
          .tools-assurance-item:nth-child(3) .tools-assurance-icon{background:#FFF3E7;color:#E86500}
          .tools-assurance-item:nth-child(4) .tools-assurance-icon{background:#EAFBFF;color:#008ECB}
          .tools-assurance-item:nth-child(5) .tools-assurance-icon{background:#F3F1FF;color:#6E32E8}
          .tools-assurance-item:nth-child(6) .tools-assurance-icon{background:#EEF6FF;color:#005FE8}
          .tools-assurance-item strong{display:block;color:#17244A;font-size:13px;line-height:1.25}
          .tools-assurance-item small{display:block;margin-top:3px;color:#758096;font-size:11px;line-height:1.3}
          @media(max-width:980px){
            .tools-assurance-grid{grid-template-columns:repeat(3,minmax(0,1fr))}
          }
          @media(max-width:680px){
            .tools-page-top{padding:18px 12px 34px;background-image:radial-gradient(circle at 12% 8%,rgba(0,180,252,.11),transparent 28%),radial-gradient(circle at 88% 10%,rgba(154,1,250,.08),transparent 28%),linear-gradient(180deg,#FBFDFF 0%,#FFFFFF 100%)}
            .tools-page-hero{margin:38px auto 18px}
            .tools-page-kicker{font-size:10px;min-height:29px;margin-bottom:13px}
            .tools-page-hero h1{font-size:clamp(40px,11vw,52px)}
            .tools-page-hero p{font-size:16px;line-height:1.55}
            .tools-page-directory{padding:26px 12px 62px}
            .tools-page-assurance{padding:0 12px 62px}
            .tools-assurance-card{padding:24px 14px;border-radius:18px}
            .tools-assurance-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
            .tools-assurance-item{min-height:88px;padding:11px 8px}
          }
        `}</style>

        <section className="tools-page-top">
          <div className="tools-page-wrap">
            <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Tools' }]} />
            <div className="tools-page-hero">
              <span className="tools-page-kicker">All {allLivePlatformTools.length} live document tools</span>
              <h1>Every document tool. One easy place.</h1>
              <p>Search or browse every DOC321 tool for PDF, Word, spreadsheets, presentations, images, OCR, text and more. <strong>No sign-up. No ads. No limits.</strong></p>
            </div>
          </div>
        </section>

        <section className="tools-page-directory" aria-label="All DOC321 document tools">
          <div className="tools-page-wrap">
            <ToolsDirectory tools={allLivePlatformTools} />
          </div>
        </section>

        <section className="tools-page-assurance" aria-labelledby="tools-assurance-title">
          <div className="tools-assurance-card">
            <div className="tools-assurance-head">
              <h2 id="tools-assurance-title">Simple. Fast. Actually free.</h2>
              <p>DOC321 is designed to help you finish the job without accounts, paywalls, distractions or unnecessary steps.</p>
            </div>
            <div className="tools-assurance-grid">
              {assurances.map(({ title, detail, Icon }) => (
                <div className="tools-assurance-item" key={title}>
                  <span className="tools-assurance-icon"><Icon size={17} aria-hidden="true" /></span>
                  <strong>{title}</strong>
                  <small>{detail}</small>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
