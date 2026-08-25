'use client';

import { useEffect } from 'react';

const workerReady = import('pdfjs-dist/legacy/build/pdf.mjs').then((pdfjs) => {
  if (!pdfjs.GlobalWorkerOptions.workerSrc) {
    pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@6.2.108/legacy/build/pdf.worker.min.mjs';
  }
});

export function PdfJsWorkerSetup() {
  useEffect(() => {
    void workerReady;
  }, []);
  return null;
}
