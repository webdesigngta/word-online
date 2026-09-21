import type { PlatformToolDefinition } from './catalog';

export const liveImageWordTools: readonly PlatformToolDefinition[] = [
  {
    id: 'image-to-word', route: '/image-to-word', name: 'Image to Word',
    title: 'Image to Word – Convert Images to Editable Word',
    description: 'Convert JPG, JPEG, or PNG images containing text into an editable Word DOCX document with browser-based OCR.',
    eyebrow: 'IMAGE TO WORD', primaryIntent: 'Convert an image containing text to an editable Word document', kind: 'ocr', cluster: 'Image OCR', priority: 'P1', stage: 'Next',
    secondaryKeywords: ['image to word converter', 'convert image to word', 'image to word document', 'image to docx'],
    input: ['jpg', 'jpeg', 'png'], output: ['docx', 'txt'], processor: 'imageToWordProcessor', launchState: 'live', indexable: true,
  },
  {
    id: 'jpg-to-word', route: '/jpg-to-word', name: 'JPG to Word',
    title: 'JPG to Word – Convert JPG to Editable Word',
    description: 'Convert JPG or JPEG images containing text into an editable Word DOCX document using browser-based OCR.',
    eyebrow: 'JPG TO WORD', primaryIntent: 'Convert JPG or JPEG text images to an editable Word document', kind: 'ocr', cluster: 'Image OCR', priority: 'P1', stage: 'Next',
    secondaryKeywords: ['convert jpg to word', 'jpg to word converter', 'convert from jpg to word online', 'jpeg to word'],
    input: ['jpg', 'jpeg'], output: ['docx', 'txt'], processor: 'imageToWordProcessor', launchState: 'live', indexable: true,
  },
  {
    id: 'png-to-word', route: '/png-to-word', name: 'PNG to Word',
    title: 'PNG to Word – Convert PNG to Editable Word',
    description: 'Convert PNG screenshots, scans, or text images into an editable Word DOCX document using browser-based OCR.',
    eyebrow: 'PNG TO WORD', primaryIntent: 'Convert a PNG text image to an editable Word document', kind: 'ocr', cluster: 'Image OCR', priority: 'P1', stage: 'Next',
    secondaryKeywords: ['png to word converter', 'convert png to word', 'convert from png to word', 'png to docx'],
    input: ['png'], output: ['docx', 'txt'], processor: 'imageToWordProcessor', launchState: 'live', indexable: true,
  },
  {
    id: 'image-to-excel', route: '/image-to-excel', name: 'Image to Excel',
    title: 'Image to Excel – Convert Image Tables to XLSX Online',
    description: 'Convert tables in JPG, JPEG, PNG, or WEBP images into editable Excel XLSX or CSV files with browser-based OCR and a cell-by-cell preview.',
    eyebrow: 'IMAGE TO EXCEL', primaryIntent: 'Extract a table from an image and convert it to an editable Excel spreadsheet', kind: 'ocr', cluster: 'Image OCR', priority: 'P0', stage: 'Traffic Expansion',
    secondaryKeywords: ['image to excel', 'image to excel converter', 'convert image to excel', 'jpg to excel', 'jpeg to excel', 'screenshot to excel', 'photo to excel', 'picture to excel', 'table image to excel'],
    input: ['jpg', 'jpeg', 'png', 'webp'], output: ['xlsx', 'csv'], processor: 'imageTableOcr', launchState: 'live', indexable: true,
  },
];
