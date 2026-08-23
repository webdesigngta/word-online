import type { Metadata } from 'next';
import { absoluteUrl, allowIndexing, site } from './site';

export function pageMetadata({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  path: string;
}): Metadata {
  return {
    title,
    description,
    alternates: { canonical: absoluteUrl(path) },
    robots: allowIndexing
      ? { index: true, follow: true }
      : { index: false, follow: false, noarchive: true },
    openGraph: {
      type: 'website',
      siteName: site.name,
      title,
      description,
      url: absoluteUrl(path),
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
  };
}
