import type { CSSProperties, ReactNode } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Ban,
  Check,
  Clock,
  Download,
  FileUp,
  Infinity,
  Settings2,
  ShieldCheck,
  Sparkles,
  UserX,
} from 'lucide-react';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteHeader } from '@/components/SiteHeader';
import { FaqJsonLd, HowToJsonLd } from '@/components/JsonLd';
import { PdfJsWorkerSetup } from '@/components/PdfJsWorkerSetup';
import { ToolViewAnalytics } from '@/components/ToolViewAnalytics';
import { ToolVisual } from '@/components/ToolVisual';
import { ToolSeoContent } from '@/components/ToolSeoContent';
import { UploadButtonNormalizer } from '@/components/UploadButtonNormalizer';
import { relatedToolScore, toolPalette } from '@/lib/toolDesign';
import type { PlatformToolDefinition } from '@/tools/platform/catalog';
import { allLivePlatformTools, getAllPlatformToolByRoute } from '@/tools/platform/allTools';

const fallbackPalette = { familyLabel: 'Document', primary: '#006CFD', secondary: '#9A01FA', soft: '#EEF6FF', ink: '#174ea6' } as const;

function formatTypes(values: readonly string[]) {
  const ignored = new Set(['blank', 'preview', 'summary']);
  return values
    .map((value) => value.trim())
    .filter((value) => value && !ignored.has(value.toLowerCase()))
    .map((value) => value.toUpperCase())
    .filter((value, index, list) => list.indexOf(value) === index);
}

function cleanHeading(tool: PlatformToolDefinition | undefined, fallback: string) {
  const name = (tool?.name || fallback).replace(/\s+online$/i, '').trim();
  if (!tool) return name;

  if (tool.kind === 'converter' && /\bto\b/i.test(name) && !/^convert\b/i.test(name)) return `Convert ${name}`;
  if (tool.kind === 'viewer' && /\s+viewer$/i.test(name)) return `View ${name.replace(/\s+viewer$/i, '')}`;
  if (tool.kind === 'editor' && /\s+editor$/i.test(name)) return `Edit ${name.replace(/\s+editor$/i, '')}`;
  return name;
}

function naturalList(values: readonly string[]) {
  if (!values.length) return '';
  if (values.length === 1) return values[0];
  if (values.length === 2) return `${values[0]} or ${values[1]}`;
  return `${values.slice(0, -1).join(', ')}, or ${values.at(-1)}`;
}

function workspaceInstruction(tool: PlatformToolDefinition | undefined, inputs: readonly string[], outputs: readonly string[]) {
  if (!tool) return 'Add your file or content below and follow the simple steps to get your result.';
  const input = naturalList(inputs.slice(0, 3)) || 'file';
  const output = naturalList(outputs.slice(0, 3)) || 'result';

  if (tool.kind === 'converter') return `Add your ${input} file. DOC321 converts it to ${output} and makes it ready to download.`;
  if (tool.kind === 'viewer') return `Add your ${input} file to open and review it directly in your browser.`;
  if (tool.kind === 'editor') return `Open your ${input} file and make your changes directly in the browser.`;
  if (tool.kind === 'creator') return `Enter the information you need below. DOC321 creates the document for you to review and download.`;
  if (['text', 'language'].includes(tool.kind)) return 'Paste or type your text below, choose what you need, and get the result instantly.';
  return `Add your ${input} file, choose any options you need, and DOC321 prepares the ${output} result for you.`;
}

function howToSteps(tool: PlatformToolDefinition) {
  const inputs = formatTypes(tool.input);
  const outputs = formatTypes(tool.output);
  const inputLabel = inputs.length ? inputs.slice(0, 3).join(', ') : 'your content';
  const outputLabel = outputs.length ? outputs.slice(0, 3).join(', ') : 'your result';

  if (tool.kind === 'converter') {
    return [
      { title: `Add your ${inputLabel} file`, text: 'Choose your file from the hero workspace or drag it into the upload area.' },
      { title: 'Choose the settings you need', text: 'Use only the options that matter for your conversion. Defaults are selected to keep the workflow quick.' },
      { title: `Convert with ${tool.name}`, text: tool.primaryIntent },
      { title: `Download ${outputLabel}`, text: 'Review the finished file, download it, or continue with another relevant DOC321 tool.' },
    ];
  }

  if (tool.kind === 'editor') {
    return [
      { title: 'Open or start your document', text: `Load ${inputLabel}, or begin with a blank document when the tool supports it.` },
      { title: 'Make your changes', text: tool.primaryIntent },
      { title: 'Review the result', text: 'Check the content and formatting before you export the finished file.' },
      { title: 'Save and keep working', text: `Download or export in ${outputLabel}, then move into another document task if needed.` },
    ];
  }

  if (tool.kind === 'viewer') {
    return [
      { title: `Open your ${inputLabel} file`, text: 'Choose the file directly in the hero workspace or drag it into the upload area.' },
      { title: 'Review the document', text: tool.primaryIntent },
      { title: 'Inspect what matters', text: 'Move through the content and check the information you came to verify.' },
      { title: 'Continue only if needed', text: 'Use a related edit, convert, organize, or download workflow without starting your search again.' },
    ];
  }

  if (tool.kind === 'creator') {
    return [
      { title: 'Add the information you need', text: 'Enter the details required for the document you want to create.' },
      { title: 'Choose your options', text: 'Adjust the available fields or formatting so the document fits your use case.' },
      { title: `Create it with ${tool.name}`, text: tool.primaryIntent },
      { title: `Download ${outputLabel}`, text: 'Review the generated document, then save it or continue editing it with another DOC321 tool.' },
    ];
  }

  if (['text', 'language'].includes(tool.kind)) {
    return [
      { title: 'Paste or type your text', text: 'Start directly in the hero workspace with no account setup.' },
      { title: 'Choose the change you want', text: 'Use the controls that match your writing or text task.' },
      { title: `Run ${tool.name}`, text: tool.primaryIntent },
      { title: 'Copy or download the result', text: `Take the finished ${outputLabel.toLowerCase()} into the next document, message, or workflow.` },
    ];
  }

  return [
    { title: `Add ${inputLabel}`, text: 'Choose the file or content you want to work with in the hero workspace, or drag it into the upload area.' },
    { title: 'Choose your options', text: 'Set only what is necessary for the result you want.' },
    { title: `Run ${tool.name}`, text: tool.primaryIntent },
    { title: `Use ${outputLabel}`, text: 'Review the result, download it, or continue into a closely related workflow.' },
  ];
}

const featureItems = [
  { title: 'No sign-up', detail: 'Start instantly', Icon: UserX },
  { title: 'No ads', detail: 'Zero distractions', Icon: Ban },
  { title: 'No limits', detail: 'Use tools freely', Icon: Infinity },
  { title: 'Unlimited downloads', detail: 'Save every result', Icon: Download },
  { title: 'Safe & private', detail: 'Your files stay protected', Icon: ShieldCheck },
  { title: 'Deleted after 10 min', detail: 'Temporary files are removed', Icon: Clock },
] as const;

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
  const displayName = cleanHeading(current, title);
  const taskInstruction = workspaceInstruction(current, inputTypes, outputTypes);
  const pageStyle = {
    '--tool-primary': palette.primary,
    '--tool-secondary': palette.secondary,
    '--tool-soft': palette.soft,
    '--tool-ink': palette.ink,
  } as CSSProperties;

  const journeyIcons = [FileUp, Settings2, Sparkles, Download] as const;
  const journeyActions = ['Add file', 'Choose options', 'Process', 'Download'];
  const inputLabel = inputTypes[0] ?? palette.familyLabel.toUpperCase();
  const outputLabel = outputTypes[0] ?? 'RESULT';

  return (
    <>
      <ToolViewAnalytics toolId={toolId} route={current?.route ?? route} />
      {usesPdf ? <PdfJsWorkerSetup /> : null}
      <UploadButtonNormalizer />
      <SiteHeader />
      <main className="platform-task-page" style={pageStyle}>
        <div className="platform-task-wrap">
          <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Tools', href: '/tools' }, { label: displayName }]} />

          <section className="platform-task-hero-shell" aria-labelledby="platform-task-title">
            <div className="platform-task-hero">
              <div className="platform-task-hero-head">
                <div className="platform-task-title-row">
                  {current ? <ToolVisual tool={current} size="md" /> : null}
                  <h1 id="platform-task-title">{displayName}</h1>
                </div>
              </div>
              <div className="platform-task-workspace platform-task-card" aria-label={`${displayName} working area`}>
                <p className="platform-task-workspace-intro">{taskInstruction}</p>
                {tool}
              </div>
            </div>
          </section>

          <section className="platform-task-features" aria-label="DOC321 tool benefits">
            {featureItems.map(({ title: itemTitle, detail, Icon }) => (
              <article className="platform-task-feature" key={itemTitle}>
                <span className="platform-task-feature-icon"><Icon size={19} aria-hidden="true" /></span>
                <span><strong>{itemTitle}</strong><small>{detail}</small></span>
              </article>
            ))}
          </section>

          {details.length ? (
            <section className="platform-task-section" aria-labelledby="platform-task-benefits-title">
              <div className="platform-task-section-head">
                <span className="platform-task-section-kicker">Everything you need</span>
                <h2 id="platform-task-benefits-title">Why use {displayName}?</h2>
                <p>The working tool stays at the top of the page. These details explain what it does well and what to expect before you process an important file.</p>
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
            <section className="platform-task-journey" aria-labelledby="platform-task-how-title">
              <div className="platform-task-section-head">
                <span className="platform-task-section-kicker">Simple from start to finish</span>
                <h2 id="platform-task-how-title">How to use {displayName}</h2>
                <p>Every tool keeps the main job obvious: add what you have, make the needed choice, run the task, and leave with a usable result.</p>
              </div>
              {steps.map((step, index) => {
                const Icon = journeyIcons[index] ?? Sparkles;
                return (
                  <article className="platform-task-journey-row" key={step.title}>
                    <div className="platform-task-journey-copy">
                      <span className="platform-task-journey-num">0{index + 1}</span>
                      <h3>{step.title}</h3>
                      <p>{step.text}</p>
                    </div>
                    <div className="platform-task-journey-visual" aria-hidden="true">
                      <div className="platform-task-journey-window">
                        <div className="platform-task-journey-window-head">
                          <span className="platform-task-journey-badge"><Icon size={15}/>{index === 0 ? inputLabel : index === 3 ? outputLabel : displayName}</span>
                          <Check size={18}/>
                        </div>
                        <div className="platform-task-journey-lines"><span className="platform-task-journey-line"/><span className="platform-task-journey-line"/><span className="platform-task-journey-line"/></div>
                        <div className="platform-task-journey-action"><Icon size={16}/>{journeyActions[index] ?? 'Continue'}</div>
                      </div>
                    </div>
                  </article>
                );
              })}
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
                <p>Clear input and output expectations make it easier to choose the right tool before you begin.</p>
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
                <div><h2 id="related-platform-tools">Related tools for the next step</h2><p>Selected from the same file family and nearby workflows.</p></div>
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
            <div className="platform-task-faq-head"><h2>{displayName} FAQs</h2><p>Answers to common questions before you start.</p></div>
            {faq.map((item) => (
              <details key={item.question}>
                <summary>{item.question}</summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </section>

          <section className="tool-page-bottom-cta" aria-label="Explore more DOC321 tools">
            <div><h2>Get the rest of your document work done here.</h2><p>When this task is finished, DOC321 has the next PDF, Word, image, spreadsheet, presentation, or writing tool ready.</p></div>
            <Link href="/tools">Explore all tools<ArrowRight size={15}/></Link>
          </section>
        </div>
      </main>
      <SiteFooter />
      <FaqJsonLd items={faq} />
      {current && steps.length ? <HowToJsonLd name={`How to use ${displayName}`} description={description} steps={steps} path={current.route} /> : null}
    </>
  );
}
