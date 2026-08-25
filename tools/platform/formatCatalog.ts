import type { PlatformToolDefinition } from './catalog';

export const liveFormatTools: readonly PlatformToolDefinition[] = [
  {
    id: 'jpg-to-pdf', route: '/jpg-to-pdf', name: 'JPG to PDF',
    title: 'JPG to PDF – Convert Images to PDF Online',
    description: 'Convert one or more JPG or JPEG images into a PDF in your browser. Choose page size, orientation, margins, and image fitting before downloading.',
    eyebrow: 'JPG TO PDF', primaryIntent: 'Convert JPG images to a PDF document', kind: 'converter', cluster: 'PDF', priority: 'P1', stage: 'PDF Expansion',
    secondaryKeywords: ['convert jpg to pdf', 'jpeg to pdf', 'image to pdf', 'jpg to pdf converter'],
    input: ['jpg', 'jpeg'], output: ['pdf'], processor: 'jpgToPdfProcessor', launchState: 'live', indexable: true,
  },
  {
    id: 'png-to-pdf', route: '/png-to-pdf', name: 'PNG to PDF',
    title: 'PNG to PDF – Convert PNG Images to PDF Online',
    description: 'Convert one or more PNG images into a PDF directly in your browser, with configurable page size, orientation, margins, and image fitting.',
    eyebrow: 'PNG TO PDF', primaryIntent: 'Convert PNG images to a PDF document', kind: 'converter', cluster: 'PDF', priority: 'P1', stage: 'PDF Expansion',
    secondaryKeywords: ['convert png to pdf', 'png to pdf converter', 'image to pdf'],
    input: ['png'], output: ['pdf'], processor: 'pngToPdfProcessor', launchState: 'live', indexable: true,
  },
  {
    id: 'html-to-pdf', route: '/html-to-pdf', name: 'HTML to PDF',
    title: 'HTML to PDF – Convert HTML to PDF Online',
    description: 'Convert an HTML file or pasted HTML markup to PDF in your browser. Unsafe scripts, embeds, forms, and remote resources are removed before rendering.',
    eyebrow: 'HTML TO PDF', primaryIntent: 'Convert HTML markup or an HTML file to PDF', kind: 'converter', cluster: 'Converter', priority: 'P2', stage: 'After Core',
    secondaryKeywords: ['convert html to pdf', 'html to pdf converter', 'html file to pdf'],
    input: ['html', 'markup'], output: ['pdf'], processor: 'htmlToPdfProcessor', launchState: 'live', indexable: true,
  },
  {
    id: 'excel-to-pdf', route: '/excel-to-pdf', name: 'Excel to PDF',
    title: 'Excel to PDF – Convert XLSX to PDF Online',
    description: 'Convert an XLSX Excel workbook to PDF in your browser. Render all workbook sheets using A4 or Letter pages in portrait or landscape orientation.',
    eyebrow: 'EXCEL TO PDF', primaryIntent: 'Convert an XLSX Excel workbook to PDF', kind: 'converter', cluster: 'Spreadsheet', priority: 'P1', stage: 'PDF Expansion',
    secondaryKeywords: ['convert excel to pdf', 'xlsx to pdf', 'excel pdf converter'],
    input: ['xlsx'], output: ['pdf'], processor: 'excelToPdfProcessor', launchState: 'live', indexable: true,
  },
];
