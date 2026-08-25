import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/site';
import { livePlatformTools } from '@/tools/platform/catalog';

export const dynamic = 'force-static';

const foundationRoutes = ['/tools', '/edit', '/view', '/convert', '/create'];
const referenceRoutes = ['/supported-formats', '/security'];

export default function sitemap(): MetadataRoute.Sitemap {
  const toolRoutes = livePlatformTools.map((tool) => tool.route);
  const routes = ['', ...foundationRoutes, ...referenceRoutes, ...toolRoutes];

  return routes.map((route, index) => ({
    url: `${siteUrl}${route || '/'}`,
    changeFrequency: index <= foundationRoutes.length + referenceRoutes.length ? 'weekly' : 'monthly',
    priority: route === '/word-online' ? 1 : index === 0 ? 0.9 : foundationRoutes.includes(route) ? 0.85 : referenceRoutes.includes(route) ? 0.75 : 0.8,
  }));
}
