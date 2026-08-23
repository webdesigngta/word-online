export interface PdfSplitOptions {
  mode?: 'pages' | 'range' | 'every-page';
  pages?: readonly number[];
  range?: string;
  ranges?: readonly string[];
  everyPage?: boolean;
  wasmUrl?: string;
}