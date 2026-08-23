export interface PdfOcrOptions {
  language?: string;
  pages?: readonly number[];
  allPages?: boolean;
  confidenceThreshold?: number;
  renderScale?: number;
  searchablePdf?: boolean;
}