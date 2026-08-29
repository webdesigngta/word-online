import type { Metadata } from 'next';
import { absoluteUrl, allowIndexing, site } from './site';
import { getAllPlatformToolByRoute } from '@/tools/platform/allTools';

function cleanFreeOnline(value: string) {
  return value
    .replace(/\bfree\b/gi, '')
    .replace(/\bonline\b/gi, '')
    .replace(/\s+/g, ' ')
    .replace(/\s+([–—-])\s+/g, ' $1 ')
    .trim();
}

function truncateMeta(value: string, max = 158) {
  if (value.length <= max) return value;
  const sliced = value.slice(0, max - 1);
  const lastSpace = sliced.lastIndexOf(' ');
  return `${(lastSpace > 110 ? sliced.slice(0, lastSpace) : sliced).trim()}…`;
}

function toolSeoCopy(path: string, title: string, description: string) {
  const tool = getAllPlatformToolByRoute(path);
  if (!tool) return { title, description };

  const cleanTitle = cleanFreeOnline(title) || tool.name;
  const seoTitle = `Free Online ${cleanTitle}`;
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
