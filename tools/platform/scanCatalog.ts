import type { PlatformToolDefinition } from './catalog';

export const liveScanTools: readonly PlatformToolDefinition[] = [
  {
    id: 'scan-to-word',
    route: '/scan-to-word',
    name: 'Scan to Word',
    title: 'Scan to Word – Convert Scanned Documents to Word',
    description: 'Convert scanned PDFs, JPGs, JPEGs, and PNGs into editable Word DOCX files with browser-based OCR.',
    eyebrow: 'SCAN TO WORD',
    primaryIntent: 'Convert a scanned PDF or image to an editable Word document',
    kind: 'ocr',
    cluster: 'OCR',
    priority: 'P1',
    stage: 'Next',
    secondaryKeywords: ['convert scanned pdf to word', 'scanned pdf to word', 'scan text to word', 'scan document to word', 'ocr pdf to word'],
    input: ['pdf', 'jpg', 'jpeg', 'png'],
    output: ['docx', 'txt'],
    processor: 'scanToWordProcessor',
    launchState: 'live',
    indexable: true,
  },
];
