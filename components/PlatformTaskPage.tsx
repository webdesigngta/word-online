import type { CSSProperties, ReactNode } from 'react';
import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteHeader } from '@/components/SiteHeader';
import { FaqJsonLd, HowToJsonLd } from '@/components/JsonLd';
import { PdfJsWorkerSetup } from '@/components/PdfJsWorkerSetup';
import { ToolViewAnalytics } from '@/components/ToolViewAnalytics';
import { ToolVisual } from '@/components/ToolVisual';
import { ToolSeoContent } from '@/components/ToolSeoContent';
import { UploadButtonNormalizer } from '@/components/UploadButtonNormalizer';
import { directoryGroupId, groupDefinition, relatedToolScore, toolPalette } from '@/lib/toolDesign';
import type { PlatformToolDefinition } from '@/tools/platform/catalog';
import { allLivePlatformTools, getAllPlatformToolByRoute } from '@/tools/platform/allTools';

const fallbackPalette = { familyLabel: 'Document', primary: '#1a73e8', secondary: '#1a73e8', soft: '#e8f0fe', ink: '#174ea6' } as const;

function formatTypes(values: readonly string[]) {
  const ignored = new Set(['blank', 'preview', 'summary']);
  return values
    .map((value) => value.trim())
    .filter((value) => value && !ignored.has(value.toLowerCase()))
    .map((value) => value.toUpperCase())
    .filter((value, index, list) => list.indexOf(value) === index);
}

function howToSteps(tool: PlatformToolDefinition) {
  const inputs = formatTypes(tool.input);
  const outputs = formatTypes(tool.output);
  const inputLabel = inputs.length ? inputs.slice(0, 3).join(', ') : 'your content';
  const outputLabel = outputs.length ? outputs.slice(0, 3).join(', ') : 'your result';

  if (tool.kind === 'converter') {
    return [
      { title: `Add your ${inputLabel} file`, text: 'Choose Files from your device or use the drop area when available.' },
      { title: `Convert with ${tool.name}`, text: tool.primaryIntent },
      { title: `Download ${outputLabel}`, text: 'Review the result, then download it or continue with a related document tool.' },
    ];
  }

  if (tool.kind === 'editor') {
    return [
      { title: 'Open or start your document', text: `Choose Files to load ${inputLabel}, or begin with a blank document when the tool supports it.` },
      { title: 'Make your changes', text: tool.primaryIntent },
      { title: 'Save your finished file', text: `Download or export the result in ${outputLabel}.` },
    ];
  }

  if (tool.kind === 'viewer') {
    return [
      { title: `Choose your ${inputLabel} file`, text: 'Choose Files and open the document directly in the browser workspace.' },
      { title: 'Review the document', text: tool.primaryIntent },
      { title: 'Keep working if needed', text: 'Move into a related edit, convert, organize, or download workflow without hunting for the next tool.' },
    ];
  }

  if (tool.kind === 'creator') {
    return [
      { title: 'Add the information you need', text: 'Enter the details required for the document you want to create.' },
      { title: `Create it with ${tool.name}`, text: tool.primaryIntent },
      { title: `Download ${outputLabel}`, text: 'Review the generated document, then save it to your device.' },
    ];
  }

  if (['text', 'language'].includes(tool.kind)) {
    return [
      { title: 'Paste or type your text', text: 'Start directly in the browser—there is no account setup between you and the task.' },
      { title: `Use ${tool.name}`, text: tool.primaryIntent },
      { title: 'Copy or download the result', text: `Take the finished ${outputLabel.toLowerCase()} wherever you need it next.` },
    ];
  }

  return [
    { title: `Add ${inputLabel}`, text: 'Choose Files or add the content you want to work with.' },
    { title: `Run ${tool.name}`, text: tool.primaryIntent },
    { title: `Use ${outputLabel}`, text: 'Review the result, download it, or continue into a related workflow.' },
  ];
}

export function PlatformTaskPage({
  route,
  title,
  description,
  tool,
  details,
  faq,
}: {
  route: string;
  title: string;
  description: string;
  tool: ReactNode;
  details: Array<{ title: string; text: string }>;
  faq: Array<{ question: string; answer: string }>;
}) {
  const current = getAllPlatformToolByRoute(route);
  const palette = current ? toolPalette(current) : fallbackPalette;
  const group = current ? groupDefinition(directoryGroupId(current)) : groupDefinition('formats');
  const relatedTools = current
    ? allLivePlatformTools
      .filter((item) => item.route !== current.route)
      .sort((left, right) => relatedToolScore(current, right) - relatedToolScore(current, left) || left.name.localeCompare(right.name))
      .slice(0, 8)
    : [];
  const toolId = current?.id ?? route.replace(/^\/|\/$/g, '').replace(/[^a-z0-9]+/g, '-');
  const usesPdf = Boolean(current
    ? [...current.input, ...current.output].some((type) => /pdf/i.test(type)) || /pdf/i.test(current.route)
    : /pdf/i.test(route));
  const steps = current ? howToSteps(current) : [];
  const inputTypes = current ? formatTypes(current.input) : [];
  const outputTypes = current ? formatTypes(current.output) : [];
  const workflowLabel = current && inputTypes.length && outputTypes.length
    ? `${inputTypes[0]} → ${outputTypes[0]}`
    : current ? palette.familyLabel : 'Document workflow';
  const displayName = current?.name ?? title;
  const pageStyle = {
    '--tool-primary': palette.primary,
    '--tool-secondary': palette.secondary,
    '--tool-soft': palette.soft,
    '--tool-ink': palette.ink,
  } as CSSProperties;

  return (
    <>
      <ToolViewAnalytics toolId={toolId} route={current?.route ?? route} />
      {usesPdf ? <PdfJsWorkerSetup /> : null}
      <UploadButtonNormalizer />
      <SiteHeader />
      <main className="platform-task-page" style={pageStyle}>
        <style>{`
          .platform-task-page{background:linear-gradient(180deg,#fff 0,#fff 760px,#f7f9fc 760px,#f7f9fc 100%);color:#202124;min-height:100vh;padding:22px 20px 82px;font-family:Arial,Helvetica,sans-serif}
          .platform-task-wrap{width:min(1180px,100%);margin:0 auto}

          /* Smallpdf-inspired order: breadcrumb → identity → working tool → supporting copy. */
          .platform-task-hero{text-align:center;margin:22px auto 22px;max-width:980px}
          .platform-task-title-row{display:flex;align-items:center;justify-content:center;gap:14px}
          .platform-task-hero h1{margin:0;color:#1f2328;font-size:clamp(38px,4.4vw,54px);line-height:1.04;letter-spacing:-.042em;text-wrap:balance}
          .platform-task-card{position:relative;border:1px solid #dfe3e8;border-radius:18px;background:#fff;box-shadow:0 10px 32px rgba(31,35,41,.075),0 1px 4px rgba(31,35,41,.04);padding:16px;overflow:hidden;isolation:isolate}
          .platform-task-intro{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(300px,.8fr);gap:48px;align-items:start;margin:0 auto;padding:26px 8px 4px;max-width:1140px}
          .platform-task-lead{margin:0;color:#35383d;font-size:16px;line-height:1.68;max-width:720px}
          .platform-task-assurances{display:grid;gap:12px;margin:1px 0 0;color:#3c4043}
          .platform-task-assurance{display:flex;align-items:flex-start;gap:10px;font-size:13px;line-height:1.45}
          .platform-task-assurance svg{flex:0 0 auto;width:18px;height:18px;margin-top:1px;padding:3px;box-sizing:border-box;border-radius:50%;background:#69c85f;color:#fff;stroke-width:3}
          .platform-task-family-link{display:inline-flex;align-items:center;gap:5px;margin-top:14px;color:var(--tool-ink);font-size:12px;font-weight:700;text-decoration:none}.platform-task-family-link:hover{text-decoration:underline}

          /* One upload language and one upload style across every individual tool page. */
          .platform-task-card [data-uniform-file-picker="true"]{min-height:50px!important;min-width:164px!important;padding:0 21px!important;border:1px solid var(--tool-primary)!important;border-radius:10px!important;background:var(--tool-primary)!important;color:#fff!important;box-shadow:0 5px 14px color-mix(in srgb,var(--tool-primary) 22%,transparent)!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;gap:8px!important;font-size:0!important;font-weight:750!important;line-height:1!important;cursor:pointer!important;text-decoration:none!important;transition:transform .15s ease,filter .15s ease,box-shadow .15s ease!important}.platform-task-card [data-uniform-file-picker="true"]:after{content:'Choose Files';font-size:14px!important;line-height:1!important;color:#fff!important;white-space:nowrap}.platform-task-card [data-uniform-file-picker="true"] svg{width:18px!important;height:18px!important;color:#fff!important;stroke:currentColor!important;margin:0!important}.platform-task-card [data-uniform-file-picker="true"]:hover{transform:translateY(-1px);filter:brightness(.96);box-shadow:0 7px 18px color-mix(in srgb,var(--tool-primary) 28%,transparent)!important}.platform-task-card input[type="file"]::file-selector-button{min-height:44px;border:1px solid var(--tool-primary);border-radius:10px;background:var(--tool-primary);color:#fff;padding:0 15px;font-weight:700;cursor:pointer;margin-right:10px}

          .platform-task-section{margin:56px 0 0}.platform-task-section-head{text-align:center;max-width:760px;margin:0 auto 22px}.platform-task-section-kicker{display:block;color:var(--tool-ink);font-size:11px;font-weight:780;letter-spacing:.07em;text-transform:uppercase;margin-bottom:8px}.platform-task-section-head h2{font-size:clamp(26px,3vw,34px);line-height:1.12;letter-spacing:-.035em;margin:0;color:#202124}.platform-task-section-head p{color:#5f6368;font-size:14px;line-height:1.6;margin:10px auto 0;max-width:650px}
          .platform-task-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}.platform-task-detail{position:relative;background:#fff;border:1px solid #e0e3e7;border-radius:18px;padding:22px;box-shadow:0 2px 8px rgba(60,64,67,.04)}.platform-task-detail:before{content:'';display:block;width:34px;height:4px;border-radius:99px;background:linear-gradient(90deg,var(--tool-primary),var(--tool-secondary));margin-bottom:16px}.platform-task-detail h3{margin:0 0 8px;font-size:17px;letter-spacing:-.015em}.platform-task-detail p{margin:0;color:#5f6368;line-height:1.62;font-size:13px}
          .platform-task-how-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}.platform-task-step{background:#fff;border:1px solid #e0e3e7;border-radius:18px;padding:22px;min-height:176px}.platform-task-step-num{width:34px;height:34px;border-radius:11px;display:grid;place-items:center;background:var(--tool-soft);color:var(--tool-ink);font-size:13px;font-weight:800;margin-bottom:18px}.platform-task-step h3{font-size:17px;line-height:1.28;letter-spacing:-.015em;margin:0 0 8px}.platform-task-step p{font-size:13px;line-height:1.62;color:#5f6368;margin:0}
          .platform-task-context{display:grid;grid-template-columns:1.1fr .9fr;gap:16px;margin-top:56px}.platform-task-context-card{border:1px solid #e0e3e7;border-radius:20px;background:#fff;padding:25px}.platform-task-context-card.is-accent{background:linear-gradient(145deg,#fff,var(--tool-soft));border-color:color-mix(in srgb,var(--tool-primary) 22%,#e0e3e7)}.platform-task-context-card h2{font-size:23px;letter-spacing:-.025em;margin:0 0 9px}.platform-task-context-card p{color:#5f6368;font-size:13px;line-height:1.65;margin:0}.platform-task-workflow{display:flex;gap:8px;flex-wrap:wrap;margin-top:16px}.platform-task-chip{display:inline-flex;align-items:center;min-height:30px;border:1px solid #dfe3e8;background:#fff;border-radius:999px;padding:0 10px;font-size:10px;font-weight:750;color:#4f555d}.platform-task-chip.is-primary{background:var(--tool-soft);border-color:transparent;color:var(--tool-ink)}

          /* Long-form page copy: readable editorial depth, not a wall of SEO text. */
          .platform-task-seo{margin:60px auto 0;max-width:1040px;border-top:1px solid #e2e6eb;padding-top:52px}.platform-task-seo-intro{max-width:850px;margin:0 auto 27px;text-align:center}.platform-task-seo-intro h2{font-size:clamp(28px,3vw,38px);line-height:1.12;letter-spacing:-.035em;margin:0 0 14px;color:#202124}.platform-task-seo-intro p{font-size:15px;line-height:1.8;color:#4f555d;margin:0}.platform-task-seo-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}.platform-task-seo-grid article,.platform-task-seo-workflow{background:#fff;border:1px solid #e0e3e7;border-radius:20px;padding:26px}.platform-task-seo-grid h3,.platform-task-seo-workflow h3{font-size:20px;line-height:1.3;letter-spacing:-.02em;margin:0 0 11px}.platform-task-seo-grid p,.platform-task-seo-workflow p{font-size:14px;line-height:1.78;color:#5f6368;margin:0 0 14px}.platform-task-seo-grid p:last-child,.platform-task-seo-workflow p:last-child{margin-bottom:0}.platform-task-seo-workflow{margin-top:16px;background:linear-gradient(145deg,#fff,var(--tool-soft))}.platform-task-seo a{color:var(--tool-ink);font-weight:700;text-decoration:underline;text-decoration-thickness:1px;text-underline-offset:3px}.platform-task-seo a:hover{color:var(--tool-primary)}

          .platform-task-related{margin:56px 0 0}.platform-task-related-head{display:flex;align-items:flex-end;justify-content:space-between;gap:14px;margin:0 0 16px}.platform-task-related h2{font-size:28px;letter-spacing:-.03em;margin:0}.platform-task-related-head p{color:#5f6368;margin:6px 0 0;line-height:1.5;font-size:13px}.platform-task-related-all{display:inline-flex;align-items:center;gap:5px;color:#174ea6;font-size:12px;font-weight:700;text-decoration:none;white-space:nowrap}.platform-task-related-all:hover{text-decoration:underline}
          .platform-task-related-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:11px}.platform-task-related-link{position:relative;display:grid;grid-template-columns:auto 1fr;align-items:center;gap:11px;color:#202124;text-decoration:none;background:#fff;border:1px solid #dde1e7;border-radius:16px;padding:13px;min-height:86px;transition:transform .15s,border-color .15s,box-shadow .15s}.platform-task-related-link:hover{transform:translateY(-2px);border-color:#c8ccd2;box-shadow:0 7px 20px rgba(60,64,67,.09)}.platform-task-related-copy{min-width:0}.platform-task-related-link strong{display:block;font-size:13px;line-height:1.3;margin-bottom:4px}.platform-task-related-link small{display:block;color:#5f6368;font-size:10px;line-height:1.35;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
          .platform-task-faq{margin:58px auto 0;max-width:920px}.platform-task-faq-head{text-align:center;margin-bottom:18px}.platform-task-faq h2{font-size:30px;letter-spacing:-.03em;margin:0}.platform-task-faq-head p{color:#5f6368;font-size:13px;margin:8px 0 0}.platform-task-faq details{background:#fff;border:1px solid #dde1e7;border-radius:15px;padding:0 19px;margin:10px 0;box-shadow:0 1px 3px rgba(60,64,67,.025)}.platform-task-faq summary{cursor:pointer;padding:17px 0;font-weight:700;font-size:14px}.platform-task-faq p{color:#5f6368;line-height:1.65;margin:0 0 17px;font-size:13px}
          .tool-visual{display:inline-flex;align-items:center;justify-content:center;gap:3px;color:#fff;font-weight:800;letter-spacing:-.02em;flex:0 0 auto}.tool-visual span{color:#fff!important;margin:0!important;line-height:1!important}
          @media(max-width:900px){.platform-task-intro{grid-template-columns:1fr;gap:18px;padding-left:4px;padding-right:4px}.platform-task-related-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.platform-task-context{grid-template-columns:1fr}.platform-task-seo-grid{grid-template-columns:1fr}}
          @media(max-width:760px){.platform-task-page{padding:18px 12px 60px;background:linear-gradient(180deg,#fff 0,#fff 700px,#f7f9fc 700px,#f7f9fc 100%)}.platform-task-hero{margin-top:18px;margin-bottom:18px}.platform-task-title-row{gap:10px}.platform-task-hero h1{font-size:36px}.platform-task-card{padding:12px;border-radius:16px}.platform-task-lead{font-size:15px}.platform-task-intro{padding-top:20px}.platform-task-section{margin-top:44px}.platform-task-section-head{text-align:left;margin-left:2px}.platform-task-grid,.platform-task-how-grid{grid-template-columns:1fr}.platform-task-related-head{align-items:flex-start;flex-direction:column}.platform-task-related-all{align-self:flex-start}.platform-task-context{margin-top:44px}.platform-task-seo{margin-top:46px;padding-top:42px}.platform-task-seo-intro{text-align:left}.platform-task-seo-grid article,.platform-task-seo-workflow{padding:21px}.platform-task-card [data-uniform-file-picker="true"]{min-height:46px!important;min-width:150px!important;padding:0 17px!important}}
          @media(max-width:480px){.platform-task-title-row{flex-direction:column}.platform-task-hero h1{font-size:33px}.platform-task-related-grid{grid-template-columns:1fr}.platform-task-context-card{padding:21px}}
        `}</style>
        <div className="platform-task-wrap">
          <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Tools', href: '/tools' }, { label: displayName }]} />

          <section className="platform-task-hero" aria-labelledby="platform-task-title">
            <div className="platform-task-title-row">
              {current ? <ToolVisual tool={current} size="lg" /> : null}
              <h1 id="platform-task-title">{displayName}</h1>
            </div>
          </section>

          <section className="platform-task-card" aria-label={`${displayName} tool`}>{tool}</section>

          <section className="platform-task-intro" aria-label={`${displayName} overview`}>
            <div className="platform-task-intro-copy">
              <p className="platform-task-lead">{description}</p>
              <Link className="platform-task-family-link" href={`/tools#tools-${group.id}`}>Browse {group.label}<ArrowRight size={14}/></Link>
            </div>
            <div className="platform-task-assurances" aria-label="Tool benefits">
              <span className="platform-task-assurance"><Check size={14}/>Free browser tool</span>
              <span className="platform-task-assurance"><Check size={14}/>No account required</span>
              <span className="platform-task-assurance"><Check size={14}/>{workflowLabel}</span>
            </div>
          </section>

          {details.length ? (
            <section className="platform-task-section" aria-labelledby="platform-task-benefits-title">
              <div className="platform-task-section-head">
                <span className="platform-task-section-kicker">Built around the task</span>
                <h2 id="platform-task-benefits-title">Why use {displayName}?</h2>
                <p>The page stays focused on the problem you came to solve, with the useful details directly around the tool instead of getting in your way.</p>
              </div>
              <div className="platform-task-grid">
                {details.map((item) => (
                  <article className="platform-task-detail" key={item.title}>
                    <h3>{item.title}</h3>
                    <p>{item.text}</p>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          {steps.length ? (
            <section className="platform-task-section" aria-labelledby="platform-task-how-title">
              <div className="platform-task-section-head">
                <span className="platform-task-section-kicker">Three simple steps</span>
                <h2 id="platform-task-how-title">How to use {displayName}</h2>
                <p>Start with the document or text you already have, complete the task, and leave with a usable result.</p>
              </div>
              <div className="platform-task-how-grid">
                {steps.map((step, index) => (
                  <article className="platform-task-step" key={step.title}>
                    <span className="platform-task-step-num">{index + 1}</span>
                    <h3>{step.title}</h3>
                    <p>{step.text}</p>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          {current ? (
            <section className="platform-task-context" aria-label={`${displayName} workflow details`}>
              <article className="platform-task-context-card is-accent">
                <span className="platform-task-section-kicker">What this solves</span>
                <h2>{current.primaryIntent}</h2>
                <p>{current.description}</p>
              </article>
              <article className="platform-task-context-card">
                <span className="platform-task-section-kicker">Supported workflow</span>
                <h2>Know what goes in and comes out</h2>
                <p>Clear file and output expectations help you choose the right tool before you start.</p>
                <div className="platform-task-workflow">
                  {inputTypes.map((type) => <span className="platform-task-chip" key={`input-${type}`}>{type} input</span>)}
                  {outputTypes.map((type) => <span className="platform-task-chip is-primary" key={`output-${type}`}>{type} output</span>)}
                </div>
              </article>
            </section>
          ) : null}

          {current ? <ToolSeoContent tool={current} relatedTools={relatedTools} /> : null}

          {relatedTools.length ? (
            <section className="platform-task-related" aria-labelledby="related-platform-tools">
              <div className="platform-task-related-head">
                <div><h2 id="related-platform-tools">Keep working with related tools</h2><p>Useful next steps are selected by file type, task, and document family.</p></div>
                <Link className="platform-task-related-all" href="/tools">Explore all {allLivePlatformTools.length} tools<ArrowRight size={14}/></Link>
              </div>
              <div className="platform-task-related-grid">
                {relatedTools.map((item) => (
                  <Link className="platform-task-related-link" href={item.route} key={item.route}>
                    <ToolVisual tool={item} size="sm" />
                    <span className="platform-task-related-copy"><strong>{item.name}</strong><small>{item.primaryIntent}</small></span>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          <section className="platform-task-faq">
            <div className="platform-task-faq-head"><h2>{displayName} FAQs</h2><p>Quick answers to common questions about this workflow.</p></div>
            {faq.map((item) => (
              <details key={item.question}>
                <summary>{item.question}</summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </section>
        </div>
      </main>
      <SiteFooter />
      <FaqJsonLd items={faq} />
      {current && steps.length ? <HowToJsonLd name={`How to use ${displayName}`} description={description} steps={steps} path={current.route} /> : null}
    </>
  );
}
