import type { PlatformToolDefinition } from './catalog';

export const livePdfDocumentTools: readonly PlatformToolDefinition[] = [
  {
    id: 'crop-pdf', route: '/crop-pdf', name: 'Crop PDF',
    title: 'Crop PDF – Crop PDF Pages Online',
    description: 'Crop all or selected PDF pages by setting top, right, bottom, and left margins directly in your browser.',
    eyebrow: 'CROP PDF', primaryIntent: 'Crop PDF pages', kind: 'pdf', cluster: 'PDF', priority: 'P2', stage: 'PDF Expansion',
    secondaryKeywords: ['crop pdf online', 'crop pdf pages', 'trim pdf pages'], input: ['pdf'], output: ['pdf'], processor: 'pdfDocumentUtilityProcessor', launchState: 'live', indexable: true,
  },
  {
    id: 'pdf-form-filler', route: '/pdf-form-filler', name: 'PDF Form Filler',
    title: 'PDF Form Filler – Fill PDF Forms Online',
    description: 'Detect and fill supported interactive PDF form fields in your browser, with optional flattening before download.',
    eyebrow: 'PDF FORM FILLER', primaryIntent: 'Fill interactive PDF form fields', kind: 'pdf', cluster: 'PDF', priority: 'P2', stage: 'PDF Expansion',
    secondaryKeywords: ['fill pdf form online', 'pdf form filler online', 'fill in pdf form'], input: ['pdf'], output: ['pdf'], processor: 'pdfDocumentUtilityProcessor', launchState: 'live', indexable: true,
  },
  {
    id: 'flatten-pdf', route: '/flatten-pdf', name: 'Flatten PDF',
    title: 'Flatten PDF – Flatten PDF Form Fields Online',
    description: 'Flatten interactive AcroForm fields into regular PDF page content so the visible field values are no longer editable controls.',
    eyebrow: 'FLATTEN PDF', primaryIntent: 'Flatten PDF form fields', kind: 'pdf', cluster: 'PDF', priority: 'P2', stage: 'PDF Expansion',
    secondaryKeywords: ['flatten pdf online', 'flatten pdf form', 'make pdf form non editable'], input: ['pdf'], output: ['pdf'], processor: 'pdfDocumentUtilityProcessor', launchState: 'live', indexable: true,
  },
];
