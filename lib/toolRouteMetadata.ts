import { pageMetadata } from '@/lib/seo';
import { getAllPlatformToolByRoute } from '@/tools/platform/allTools';

function humanizeRoute(route: string) {
  return route.replace(/^\/+|\/+$/g, '').split('-').filter(Boolean).map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`).join(' ');
}

export function toolRouteMetadata(route: string) {
  const normalized = route === '/' ? route : `/${route.replace(/^\/+|\/+$/g, '')}`;
  const tool = getAllPlatformToolByRoute(normalized);
  const fallbackName = humanizeRoute(normalized) || 'DOC321';
  return pageMetadata({
    title: tool?.title ?? `${fallbackName} Online`,
    description: tool?.description ?? `Use the ${fallbackName} tool on DOC321 to work with your document directly in your browser.`,
    path: tool?.route ?? normalized,
  });
}
