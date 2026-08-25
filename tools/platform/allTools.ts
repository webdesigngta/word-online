import { livePlatformTools, type PlatformToolDefinition } from './catalog';
import { liveFormatTools } from './formatCatalog';
import { liveImageWordTools } from './imageWordCatalog';
import { livePdfTools } from './pdfCatalog';
import { livePdfDocumentTools } from './pdfDocumentCatalog';
import { livePdfMarkupTools } from './pdfMarkupCatalog';
import { livePdfPageTools } from './pdfPageCatalog';
import { livePdfSecurityTools } from './pdfSecurityCatalog';
import { livePdfStampTools } from './pdfStampCatalog';
import { liveScanTools } from './scanCatalog';

export const allLivePlatformTools: readonly PlatformToolDefinition[] = [
  ...livePlatformTools,
  ...livePdfTools,
  ...liveFormatTools,
  ...livePdfPageTools,
  ...liveImageWordTools,
  ...liveScanTools,
  ...livePdfStampTools,
  ...livePdfSecurityTools,
  ...livePdfMarkupTools,
  ...livePdfDocumentTools,
];

export function getAllPlatformToolByRoute(route: string) {
  const normalized = route !== '/' ? route.replace(/\/$/, '') : route;
  return allLivePlatformTools.find((tool) => tool.route === normalized);
}

export function getAllPlatformTool(id: string) {
  return allLivePlatformTools.find((tool) => tool.id === id);
}
