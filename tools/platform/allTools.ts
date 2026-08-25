import { livePlatformTools, type PlatformToolDefinition } from './catalog';
import { liveFormatTools } from './formatCatalog';
import { liveImageWordTools } from './imageWordCatalog';
import { livePdfTools } from './pdfCatalog';
import { livePdfPageTools } from './pdfPageCatalog';
import { liveScanTools } from './scanCatalog';

export const allLivePlatformTools: readonly PlatformToolDefinition[] = [
  ...livePlatformTools,
  ...livePdfTools,
  ...liveFormatTools,
  ...livePdfPageTools,
  ...liveImageWordTools,
  ...liveScanTools,
];

export function getAllPlatformToolByRoute(route: string) {
  const normalized = route !== '/' ? route.replace(/\/$/, '') : route;
  return allLivePlatformTools.find((tool) => tool.route === normalized);
}

export function getAllPlatformTool(id: string) {
  return allLivePlatformTools.find((tool) => tool.id === id);
}
