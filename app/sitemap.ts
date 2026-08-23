import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/site';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ['', '/word-online', '/free-word-editor', '/docx-editor-online', '/edit-docx-online'];
  return routes.map((route, index) => ({
    url: `${siteUrl}${route || '/'}`,
    lastModified: new Date(),
    changeFrequency: index < 2 ? 'weekly' : 'monthly',
    priority: index === 1 ? 1 : index === 0 ? 0.9 : 0.75,
  }));
}
