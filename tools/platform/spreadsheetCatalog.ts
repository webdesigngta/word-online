import type { PlatformToolDefinition } from './catalog';

const spreadsheetTools: readonly PlatformToolDefinition[] = [
  {
    id: 'csv-editor', route: '/csv-editor', name: 'CSV Editor', title: 'CSV Editor Online',
    description: 'Open and edit CSV files in a spreadsheet-style grid, then download the updated file as CSV or XLSX.',
    eyebrow: 'SPREADSHEET TOOL', primaryIntent: 'Edit CSV files online', kind: 'editor', cluster: 'Spreadsheet', priority: 'P1', stage: 'Spreadsheet expansion',
    secondaryKeywords: ['edit csv online', 'online csv editor', 'csv spreadsheet editor'], input: ['CSV'], output: ['CSV', 'XLSX'], processor: 'shared-xlsx-tabular', launchState: 'live', indexable: true,
  },
  {
    id: 'csv-viewer', route: '/csv-viewer', name: 'CSV Viewer', title: 'CSV Viewer Online',
    description: 'Open CSV files in a clean read-only table directly in your browser without changing the source file.',
    eyebrow: 'SPREADSHEET TOOL', primaryIntent: 'View CSV files online', kind: 'viewer', cluster: 'Spreadsheet', priority: 'P1', stage: 'Spreadsheet expansion',
    secondaryKeywords: ['view csv online', 'online csv viewer', 'csv reader online'], input: ['CSV'], output: ['Preview'], processor: 'shared-xlsx-tabular', launchState: 'live', indexable: true,
  },
  {
    id: 'csv-to-xlsx', route: '/csv-to-xlsx', name: 'CSV to XLSX', title: 'Convert CSV to XLSX Online',
    description: 'Convert a CSV file into an XLSX workbook locally in your browser and download the spreadsheet immediately.',
    eyebrow: 'SPREADSHEET CONVERTER', primaryIntent: 'Convert CSV to XLSX', kind: 'converter', cluster: 'Spreadsheet', priority: 'P1', stage: 'Spreadsheet expansion',
    secondaryKeywords: ['csv to excel', 'convert csv to xlsx', 'csv to excel converter'], input: ['CSV'], output: ['XLSX'], processor: 'shared-xlsx-tabular', launchState: 'live', indexable: true,
  },
  {
    id: 'xlsx-to-csv', route: '/xlsx-to-csv', name: 'XLSX to CSV', title: 'Convert XLSX to CSV Online',
    description: 'Convert the first worksheet in an XLSX workbook to CSV in your browser with no server-side upload required.',
    eyebrow: 'SPREADSHEET CONVERTER', primaryIntent: 'Convert XLSX to CSV', kind: 'converter', cluster: 'Spreadsheet', priority: 'P1', stage: 'Spreadsheet expansion',
    secondaryKeywords: ['excel to csv', 'xlsx to csv converter', 'convert excel to csv'], input: ['XLSX'], output: ['CSV'], processor: 'shared-xlsx-tabular', launchState: 'live', indexable: true,
  },
  {
    id: 'xlsx-editor', route: '/xlsx-editor', name: 'XLSX Editor', title: 'XLSX Editor Online',
    description: 'Edit displayed values from the first worksheet of an XLSX file in a browser grid, then download a rebuilt XLSX or CSV file.',
    eyebrow: 'SPREADSHEET TOOL', primaryIntent: 'Edit XLSX files online', kind: 'editor', cluster: 'Spreadsheet', priority: 'P1', stage: 'Spreadsheet expansion',
    secondaryKeywords: ['excel editor online', 'edit xlsx online', 'online excel editor'], input: ['XLSX'], output: ['XLSX', 'CSV'], processor: 'shared-xlsx-tabular', launchState: 'live', indexable: true,
  },
  {
    id: 'xlsx-viewer', route: '/xlsx-viewer', name: 'XLSX Viewer', title: 'XLSX Viewer Online',
    description: 'Open the first worksheet of an XLSX workbook in a clean read-only browser table without changing the source file.',
    eyebrow: 'SPREADSHEET TOOL', primaryIntent: 'View XLSX files online', kind: 'viewer', cluster: 'Spreadsheet', priority: 'P1', stage: 'Spreadsheet expansion',
    secondaryKeywords: ['excel viewer online', 'view xlsx online', 'xlsx reader online'], input: ['XLSX'], output: ['Preview'], processor: 'shared-xlsx-tabular', launchState: 'live', indexable: true,
  },
  {
    id: 'xlsx-to-html', route: '/xlsx-to-html', name: 'XLSX to HTML', title: 'Convert XLSX to HTML Online',
    description: 'Convert displayed values from the first XLSX worksheet into a standalone HTML table directly in your browser.',
    eyebrow: 'SPREADSHEET CONVERTER', primaryIntent: 'Convert XLSX to HTML', kind: 'converter', cluster: 'Spreadsheet', priority: 'P2', stage: 'Spreadsheet expansion',
    secondaryKeywords: ['excel to html', 'xlsx to html converter', 'convert excel to html'], input: ['XLSX'], output: ['HTML'], processor: 'shared-xlsx-tabular', launchState: 'live', indexable: true,
  },
];

export const liveSpreadsheetTools = spreadsheetTools.filter((tool) => tool.launchState === 'live');
