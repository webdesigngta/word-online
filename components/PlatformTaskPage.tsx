import type { CSSProperties, ReactNode } from 'react';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteHeader } from '@/components/SiteHeader';
import { FaqJsonLd, HowToJsonLd } from '@/components/JsonLd';
import { PdfJsWorkerSetup } from '@/components/PdfJsWorkerSetup';
import { ToolFeatureStrip } from '@/components/ToolFeatureStrip';
import { ToolViewAnalytics } from '@/components/ToolViewAnalytics';
import { ToolVisual } from '@/components/ToolVisual';
import { UniversalToolEditorialContent } from '@/components/UniversalToolEditorialContent';
import { UploadButtonNormalizer } from '@/components/UploadButtonNormalizer';
import { toolPalette } from '@/lib/toolDesign';
import type { PlatformToolDefinition } from '@/tools/platform/catalog';
import { getAllPlatformToolByRoute } from '@/tools/platform/allTools';

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

export function PlatformTaskPage({
  route,
  title,
  description,
  tool,
  details,
  faq,
  customContent,
  customHowToSteps,
}: {
  route: string;
  title: string;
  description: string;
  tool: ReactNode;
  details: Array<{ title: string; text: string }>;
  faq: Array<{ question: string; answer: string }>;
  customContent?: ReactNode;
  customHowToSteps?: Array<{ title: string; text: string }>;
}) {
  const current = getAllPlatformToolByRoute(route);
  const palette = current ? toolPalette(current) : fallbackPalette;
  const toolId = current?.id ?? route.replace(/^\/|\/$/g, '').replace(/[^a-z0-9]+/g, '-');
  const usesPdf = Boolean(current
    ? [...current.input, ...current.output].some((type) => /pdf/i.test(type)) || /pdf/i.test(current.route)
    : /pdf/i.test(route));
  const steps = current ? howToSteps(current) : [];
  const structuredSteps = customHowToSteps ?? steps;
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

          <ToolFeatureStrip />

          {customContent ?? (current ? (
            <UniversalToolEditorialContent
              tool={current}
              description={description}
              details={details}
              faq={faq}
              steps={steps}
            />
          ) : (
            <section className="platform-task-section">
              <div className="platform-task-section-head">
                <h2>{displayName}</h2>
                <p>{description}</p>
              </div>
            </section>
          ))}
        </div>
      </main>
      <SiteFooter />
      <FaqJsonLd items={faq} />
      {current && structuredSteps.length ? <HowToJsonLd name={`How to use ${displayName}`} description={description} steps={structuredSteps} path={current.route} /> : null}
    </>
  );
}
