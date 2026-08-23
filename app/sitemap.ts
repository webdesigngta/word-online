import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/site';
import { wordInterfaces } from '@/tools/word/interfaces/config';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ['', ...wordInterfaces.filter((tool) => tool.indexable).map((tool) => tool.route)];
  return routes.map((route, index) => ({
    url: `${siteUrl}${route || '/'}`,
    lastModified: new Date(),
    changeFrequency: index <= 2 ? 'weekly' : 'monthly',
    priority: route === '/word-online' ? 1 : index === 0 ? 0.9 : 0.8,
  }));
}
