import { livePlatformTools, type PlatformToolDefinition } from './catalog';
import { liveCreatorTools } from './creatorCatalog';
import { liveDocumentFormatTools } from './documentFormatCatalog';
import { liveDocumentSuiteTools } from './documentSuiteCatalog';
import { liveFormatTools } from './formatCatalog';
import { liveImageWordTools } from './imageWordCatalog';
import { liveOfficeExpansionTools } from './officeExpansionCatalog';
import { livePdfTools } from './pdfCatalog';
import { livePdfDocumentTools } from './pdfDocumentCatalog';
import { livePdfMarkupTools } from './pdfMarkupCatalog';
import { livePdfPageTools } from './pdfPageCatalog';
import { livePdfSecurityTools } from './pdfSecurityCatalog';
import { livePdfStampTools } from './pdfStampCatalog';
import { liveScanTools } from './scanCatalog';
import { liveSpreadsheetTools } from './spreadsheetCatalog';
import { liveUniversalConverterTools } from './universalConverterCatalog';
import { liveWordImageTools } from './wordImageCatalog';

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
  ...liveWordImageTools,
  ...liveUniversalConverterTools,
  ...liveDocumentFormatTools,
  ...liveSpreadsheetTools,
  ...liveDocumentSuiteTools,
  ...liveCreatorTools,
  ...liveOfficeExpansionTools,
];

export function getAllPlatformToolByRoute(route: string) {
  const normalized = route !== '/' ? route.replace(/\/$/, '') : route;
  return allLivePlatformTools.find((tool) => tool.route === normalized);
}

export function getAllPlatformTool(id: string) {
  return allLivePlatformTools.find((tool) => tool.id === id);
}
