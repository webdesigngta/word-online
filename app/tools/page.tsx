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
  title: 'Free Online Document Tools – PDF, Word, Excel, OCR & More',
  description: 'Browse all free online DOC321 document tools in one place. Use PDF, Word, spreadsheet, presentation, image, OCR, text and document creation tools directly in your browser.',
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
            padding:22px 20px 52px;
            background:
              radial-gradient(circle at 14% 32%,rgba(0,167,232,.13),transparent 25%),
              radial-gradient(circle at 86% 18%,rgba(124,53,242,.10),transparent 23%),
              linear-gradient(135deg,#F4FBFF 0%,#F9F7FF 48%,#FFF9F3 100%);
            border-bottom:1px solid rgba(1,24,85,.07);
          }
          .tools-page-top:before{
            content:'';
            position:absolute;
            width:420px;
            height:180px;
            left:-125px;
            bottom:-105px;
            border:1px solid rgba(0,108,253,.08);
            border-radius:80px;
            background:rgba(255,255,255,.34);
            transform:rotate(-11deg);
            z-index:-1;
          }
          .tools-page-top:after{
            content:'';
            position:absolute;
            width:260px;
            height:260px;
            right:-95px;
            top:-125px;
            border-radius:50%;
            border:38px solid rgba(154,1,250,.035);
            z-index:-1;
          }
          .tools-page-wrap{width:min(1200px,100%);margin:0 auto}
          .tools-page-hero{max-width:1040px;margin:54px auto 18px;text-align:center}
          .tools-page-kicker{
            display:inline-flex;
            align-items:center;
            min-height:34px;
            padding:0 13px;
            margin:0 0 18px;
            border:1px solid rgba(0,108,253,.14);
            border-radius:999px;
            background:rgba(255,255,255,.78);
            color:#1643A7;
            box-shadow:0 8px 22px rgba(0,83,215,.05);
            font-size:12px;
            font-weight:800;
            letter-spacing:.075em;
            text-transform:uppercase;
          }
          .tools-page-hero h1{
            max-width:1030px;
            margin:0 auto;
            color:var(--doc-navy);
            font-size:clamp(42px,5vw,64px);
            line-height:1.03;
            letter-spacing:-.048em;
            text-wrap:balance;
          }
          .tools-page-hero p{
            max-width:760px;
            margin:20px auto 0;
            color:#59677F;
            font-size:19px;
            line-height:1.62;
            text-wrap:balance;
          }
          .tools-page-hero strong{color:#233766}
          .tools-page-directory{
            padding:42px 20px 88px;
            background:#fff;
          }
          .tools-page-assurance{
            margin:0;
            padding:0 20px 86px;
            background:#fff;
          }
          .tools-assurance-card{
            position:relative;
            overflow:hidden;
            width:min(1200px,100%);
            margin:0 auto;
            padding:32px;
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
          .tools-assurance-head{position:relative;z-index:1;text-align:center;margin-bottom:24px}
          .tools-assurance-head h2{margin:0;color:var(--doc-navy);font-size:clamp(28px,3vw,37px);letter-spacing:-.035em}
          .tools-assurance-head p{margin:9px auto 0;max-width:700px;color:#60708A;font-size:16px;line-height:1.6}
          .tools-assurance-grid{position:relative;z-index:1;display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:10px}
          .tools-assurance-item{
            min-width:0;
            min-height:100px;
            padding:14px 12px;
            border:1px solid rgba(1,24,85,.08);
            border-radius:15px;
            background:rgba(255,255,255,.84);
            box-shadow:0 6px 18px rgba(1,24,85,.035);
            text-align:center;
          }
          .tools-assurance-icon{width:36px;height:36px;display:grid;place-items:center;margin:0 auto 9px;border-radius:10px;background:#EDF7FF;color:var(--doc-blue)}
          .tools-assurance-item:nth-child(2) .tools-assurance-icon{background:#F5EEFF;color:var(--doc-purple)}
          .tools-assurance-item:nth-child(3) .tools-assurance-icon{background:#FFF3E7;color:#E86500}
          .tools-assurance-item:nth-child(4) .tools-assurance-icon{background:#EAFBFF;color:#008ECB}
          .tools-assurance-item:nth-child(5) .tools-assurance-icon{background:#F3F1FF;color:#6E32E8}
          .tools-assurance-item:nth-child(6) .tools-assurance-icon{background:#EEF6FF;color:#005FE8}
          .tools-assurance-item strong{display:block;color:#17244A;font-size:14px;line-height:1.3}
          .tools-assurance-item small{display:block;margin-top:4px;color:#66748D;font-size:12px;line-height:1.35}
          @media(max-width:980px){
            .tools-assurance-grid{grid-template-columns:repeat(3,minmax(0,1fr))}
          }
          @media(max-width:680px){
            .tools-page-top{padding:18px 12px 38px}
            .tools-page-top:before{width:280px;height:120px;left:-120px;bottom:-72px}
            .tools-page-top:after{width:190px;height:190px;right:-92px;top:-96px;border-width:30px}
            .tools-page-hero{margin:36px auto 16px}
            .tools-page-kicker{font-size:10px;min-height:30px;margin-bottom:14px}
            .tools-page-hero h1{font-size:clamp(36px,10.2vw,48px);line-height:1.06}
            .tools-page-hero p{font-size:17px;line-height:1.58}
            .tools-page-directory{padding:28px 12px 64px}
            .tools-page-assurance{padding:0 12px 62px}
            .tools-assurance-card{padding:24px 14px;border-radius:18px}
            .tools-assurance-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
            .tools-assurance-item{min-height:92px;padding:12px 8px}
          }
        `}</style>

        <section className="tools-page-top">
          <div className="tools-page-wrap">
            <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Tools' }]} />
            <div className="tools-page-hero">
              <span className="tools-page-kicker">All {allLivePlatformTools.length} live document tools</span>
              <h1>100% Free PDF, Word &amp; OCR Tools: Fast, Private &amp; Unlimited</h1>
              <p>Find the tool you need, finish the task, and download the result. PDF, Word, OCR, image, spreadsheet and document utilities are all here. <strong>No sign-up. No ads. No limits.</strong></p>
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
                  <span className="tools-assurance-icon"><Icon size={18} aria-hidden="true" /></span>
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
