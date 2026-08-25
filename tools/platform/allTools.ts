import { livePlatformTools, type PlatformToolDefinition } from './catalog';
import { liveFormatTools } from './formatCatalog';
import { liveImageWordTools } from './imageWordCatalog';
import { livePdfTools } from './pdfCatalog';
import { livePdfPageTools } from './pdfPageCatalog';

export const allLivePlatformTools: readonly PlatformToolDefinition[] = [
  ...livePlatformTools,
  ...livePdfTools,
  ...liveFormatTools,
  ...livePdfPageTools,
  ...liveImageWordTools,
];

export function getAllPlatformToolByRoute(route: string) {
  const normalized = route !== '/' ? route.replace(/\/$/, '') : route;
  return allLivePlatformTools.find((tool) => tool.route === normalized);
}

export function getAllPlatformTool(id: string) {
  return allLivePlatformTools.find((tool) => tool.id === id);
}
