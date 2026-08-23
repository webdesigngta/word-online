export interface PdfOcrWord {
  text: string;
  confidence: number;
  bbox: {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
  };
}

export interface PdfOcrPageResult {
  pageNumber: number;
  text: string;
  confidence: number | null;
  words: readonly PdfOcrWord[];
}