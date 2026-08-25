'use client';

import { useEffect } from 'react';
import { loadPdfJs } from '@/lib/pdfjs';

const workerReady = loadPdfJs();

export function PdfJsWorkerSetup() {
  useEffect(() => {
    void workerReady;
  }, []);
  return null;
}
