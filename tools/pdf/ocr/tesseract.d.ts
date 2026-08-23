declare module 'tesseract.js' {
  interface TesseractWord {
    text: string;
    confidence: number;
    bbox: { x0: number; y0: number; x1: number; y1: number };
  }

  interface TesseractData {
    text: string;
    confidence: number;
    words: TesseractWord[];
  }

  interface TesseractWorker {
    recognize(image: HTMLCanvasElement): Promise<{ data: TesseractData }>;
    terminate(): Promise<void>;
  }

  interface TesseractWorkerOptions {
    logger?: (message: { status?: string; progress?: number }) => void;
  }

  function createWorker(
    language?: string,
    oem?: number,
    options?: TesseractWorkerOptions,
  ): Promise<TesseractWorker>;

  export { createWorker };
}