import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/site';
import { wordInterfaces } from '@/tools/word/interfaces/config';

export const dynamic = 'force-static';

const foundationRoutes = ['/tools', '/edit', '/view', '/convert', '/create'];

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ['', ...foundationRoutes, ...wordInterfaces.filter((tool) => tool.indexable).map((tool) => tool.route)];
  return routes.map((route, index) => ({
    url: `${siteUrl}${route || '/'}`,
    lastModified: new Date(),
    changeFrequency: index <= foundationRoutes.length ? 'weekly' : 'monthly',
    priority: route === '/word-online' ? 1 : index === 0 ? 0.9 : foundationRoutes.includes(route) ? 0.85 : 0.8,
  }));
}
