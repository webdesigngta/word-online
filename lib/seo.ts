import type { Metadata } from 'next';
import { absoluteUrl, allowIndexing, site } from './site';
import { getAllPlatformToolByRoute } from '@/tools/platform/allTools';

function cleanFreeOnline(value: string) {
  return value
    .replace(/\bonline\s+for\s+free\b/gi, '')
    .replace(/\bfor\s+free\b/gi, '')
    .replace(/\bfree\s+online\b/gi, '')
    .replace(/\bonline\b/gi, '')
    .replace(/\bfree\b/gi, '')
    .replace(/\s+/g, ' ')
    .replace(/\s+([–—-])\s+/g, ' $1 ')
    .replace(/\bfor\s*$/i, '')
    .trim();
}

function truncateMeta(value: string, max = 158) {
  if (value.length <= max) return value;
  const sliced = value.slice(0, max - 1);
  const lastSpace = sliced.lastIndexOf(' ');
  return `${(lastSpace > 110 ? sliced.slice(0, lastSpace) : sliced).trim()}…`;
}

function truncateTitle(value: string, max = 64) {
  if (value.length <= max) return value;
  const sliced = value.slice(0, max - 1);
  const lastSpace = sliced.lastIndexOf(' ');
  return `${(lastSpace > 42 ? sliced.slice(0, lastSpace) : sliced).trim()}…`;
}

function readableType(value: string) {
  const normalized = value.trim().replace(/\+$/, '').toUpperCase();
  const map: Record<string, string> = {
    'SEARCHABLE-PDF': 'Searchable PDF',
    'PLAIN-TEXT': 'Plain Text',
    'TEXT': 'Text',
    'IMAGE': 'Image',
    'IMAGES': 'Images',
    'RESULT': 'Result',
    'BROWSER-PREVIEW': 'Browser Preview',
  };
  return map[normalized] ?? normalized;
}

function formatTypes(values: readonly string[]) {
  const ignored = new Set(['blank', 'preview', 'summary', 'statistics', 'clipboard', 'templates']);
  return values
    .map((value) => value.trim())
    .filter((value, index, list) => value && !ignored.has(value.toLowerCase()) && list.indexOf(value) === index)
    .map(readableType);
}

function choiceList(values: readonly string[]) {
  if (!values.length) return 'File';
  if (values.length === 1) return values[0];
  if (values.length === 2) return `${values[0]} or ${values[1]}`;
  return `${values.slice(0, -1).join(', ')}, or ${values.at(-1)}`;
}

function toolTitle(path: string, fallbackTitle: string) {
  const tool = getAllPlatformToolByRoute(path);
  if (!tool) return fallbackTitle;

  const inputs = choiceList(formatTypes(tool.input));
  const outputs = choiceList(formatTypes(tool.output));
  const routeText = `${tool.route} ${tool.name} ${tool.primaryIntent}`.toLowerCase();

  if (tool.kind === 'converter') {
    const name = /converter$/i.test(tool.name) ? tool.name : `${tool.name} Converter`;
    return truncateTitle(`Free ${name}: Convert ${inputs} to ${outputs} Online`);
  }
  if (tool.kind === 'editor') return truncateTitle(`Free ${tool.name} Online: Edit ${inputs} in Your Browser`);
  if (tool.kind === 'viewer') return truncateTitle(`Free ${tool.name} Online: View ${inputs} in Your Browser`);
  if (/merge|combine/.test(routeText)) return truncateTitle(`Free ${tool.name} Online: Combine ${inputs} Files`);
  if (/split|extract pages|separate pages/.test(routeText)) return truncateTitle(`Free ${tool.name} Online: Split ${inputs} Files`);
  if (/compress|reduce.*size|minif/.test(routeText)) return truncateTitle(`Free ${tool.name} Online: Reduce ${inputs} File Size`);

  return truncateTitle(`Free Online ${cleanFreeOnline(fallbackTitle) || tool.name}`);
}

function toolSeoCopy(path: string, title: string, description: string) {
  const tool = getAllPlatformToolByRoute(path);
  if (!tool) return { title, description };

  const seoTitle = toolTitle(path, title);
  const intent = tool.primaryIntent.replace(/[.!?]+$/, '').trim();
  const intentSentence = intent ? `${intent.charAt(0).toLowerCase()}${intent.slice(1)}` : '';
  const seoDescription = truncateMeta(
    intentSentence
      ? `Use this free online DOC321 tool to ${intentSentence}. ${description}`
      : `Use this free online DOC321 tool. ${description}`,
  );

  return { title: seoTitle, description: seoDescription };
}

export function pageMetadata({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  path: string;
}): Metadata {
  const seo = toolSeoCopy(path, title, description);

  return {
    title: seo.title,
    description: seo.description,
    alternates: { canonical: absoluteUrl(path) },
    robots: allowIndexing
      ? { index: true, follow: true }
      : { index: false, follow: false, noarchive: true },
    openGraph: {
      type: 'website',
      siteName: site.name,
      title: seo.title,
      description: seo.description,
      url: absoluteUrl(path),
    },
    twitter: {
      card: 'summary',
      title: seo.title,
      description: seo.description,
    },
  };
}
