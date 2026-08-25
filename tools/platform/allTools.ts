import { livePlatformTools, type PlatformToolDefinition } from './catalog';
import { liveFormatTools } from './formatCatalog';
import { livePdfTools } from './pdfCatalog';

export const allLivePlatformTools: readonly PlatformToolDefinition[] = [
  ...livePlatformTools,
  ...livePdfTools,
  ...liveFormatTools,
];

export function getAllPlatformToolByRoute(route: string) {
  const normalized = route !== '/' ? route.replace(/\/$/, '') : route;
  return allLivePlatformTools.find((tool) => tool.route === normalized);
}

export function getAllPlatformTool(id: string) {
  return allLivePlatformTools.find((tool) => tool.id === id);
}
