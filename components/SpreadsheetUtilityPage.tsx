import { PlatformTaskPage } from '@/components/PlatformTaskPage';
import { SpreadsheetUtilityInterface, type SpreadsheetUtilityMode } from '@/components/SpreadsheetUtilityInterface';
import { getAllPlatformToolByRoute } from '@/tools/platform/allTools';

const content: Record<SpreadsheetUtilityMode, { details: Array<{ title: string; text: string }>; faq: Array<{ question: string; answer: string }> }> = {
  'csv-editor': {
    details: [
      { title: 'Spreadsheet-style editing', text: 'Edit individual cells directly in a browser grid and add rows or columns without installing spreadsheet software.' },
      { title: 'Export in two formats', text: 'Save your edited table back to CSV or download it as an XLSX workbook.' },
      { title: 'Browser-side workflow', text: 'The file is parsed and rebuilt locally in your browser for a fast lightweight workflow.' },
    ],
    faq: [
      { question: 'Can I edit CSV files online?', answer: 'Yes. Open a CSV file, edit cells in the grid, add rows or columns, and download the result.' },
      { question: 'Can I save the edited CSV as Excel?', answer: 'Yes. The editor can export the current table as either CSV or XLSX.' },
      { question: 'Does this preserve Excel formulas?', answer: 'CSV files do not contain Excel formulas or workbook formatting. This editor focuses on tabular values.' },
    ],
  },
  'csv-viewer': {
    details: [
      { title: 'Read-only by design', text: 'Inspect rows and columns without exposing editing controls or changing the original CSV file.' },
      { title: 'Large-table friendly', text: 'The viewer uses a scrollable grid and supports up to 1,000 rows and 100 columns per preview.' },
      { title: 'No spreadsheet app required', text: 'Open common CSV exports directly in the browser.' },
    ],
    faq: [
      { question: 'Can I view a CSV file without Excel?', answer: 'Yes. Choose a CSV file and its values appear in a read-only browser table.' },
      { question: 'Does the CSV viewer edit my file?', answer: 'No. Use the CSV Editor if you want to change values.' },
      { question: 'How much data can the viewer show?', answer: 'The current browser preview is capped at 1,000 rows and 100 columns to keep the interface responsive.' },
    ],
  },
  'csv-to-xlsx': {
    details: [
      { title: 'Real XLSX output', text: 'The CSV rows are converted into an actual XLSX workbook rather than renamed or wrapped as text.' },
      { title: 'Simple first-sheet workbook', text: 'The result is a clean workbook containing one worksheet built from the CSV values.' },
      { title: 'Local conversion', text: 'Parsing and workbook generation happen in the browser.' },
    ],
    faq: [
      { question: 'Can I convert CSV to Excel?', answer: 'Yes. The tool converts CSV values into an XLSX workbook that can be opened in Excel and compatible spreadsheet apps.' },
      { question: 'Will CSV formatting become Excel formatting?', answer: 'CSV stores values only, so there is no original workbook formatting to preserve.' },
      { question: 'Are formulas created automatically?', answer: 'No. Values are transferred as table content; the tool does not invent formulas.' },
    ],
  },
  'xlsx-to-csv': {
    details: [
      { title: 'First worksheet export', text: 'The first worksheet in the XLSX workbook is converted into a standard CSV file.' },
      { title: 'Values-focused output', text: 'CSV contains tabular values and does not preserve workbook styling, multiple sheets, charts, or formulas as workbook objects.' },
      { title: 'Runs in your browser', text: 'The XLSX workbook is read locally and the CSV download is generated on your device.' },
    ],
    faq: [
      { question: 'Can I convert Excel to CSV online?', answer: 'Yes. Upload an XLSX file and download the first worksheet as CSV.' },
      { question: 'What happens to multiple sheets?', answer: 'The current converter exports the first worksheet only.' },
      { question: 'Will Excel formatting be preserved?', answer: 'No. CSV stores plain tabular values, not workbook formatting, charts, or multiple worksheets.' },
    ],
  },
  'xlsx-editor': {
    details: [
      { title: 'Edit workbook values', text: 'Open the first worksheet in a spreadsheet-style grid, change cell values, and add rows or columns.' },
      { title: 'Clear preservation limits', text: 'This lightweight editor rebuilds a value-focused workbook. Complex formulas, macros, charts, styles, and additional worksheets are not preserved.' },
      { title: 'Download XLSX or CSV', text: 'Export the edited table as a fresh XLSX workbook or a CSV file.' },
    ],
    faq: [
      { question: 'Can I edit an XLSX file online?', answer: 'Yes. This tool lets you edit displayed cell values from the first worksheet directly in the browser.' },
      { question: 'Will formulas and formatting stay intact?', answer: 'No. The editor is designed for simple value editing and rebuilds the output from the displayed table.' },
      { question: 'What happens to other worksheets?', answer: 'The current editor works with the first worksheet only. Additional sheets are not included in the rebuilt download.' },
    ],
  },
  'xlsx-viewer': {
    details: [
      { title: 'Read XLSX without editing', text: 'Open the first worksheet in a clean read-only browser grid without changing the original workbook.' },
      { title: 'Values-first preview', text: 'The viewer focuses on displayed cell values and does not attempt to reproduce Excel charts or complex workbook layout.' },
      { title: 'Responsive table view', text: 'Preview up to 1,000 rows and 100 columns with horizontal and vertical scrolling.' },
    ],
    faq: [
      { question: 'Can I view an XLSX file without Excel?', answer: 'Yes. Choose an XLSX workbook and the first worksheet appears as a read-only table.' },
      { question: 'Does the viewer change my workbook?', answer: 'No. The XLSX Viewer does not edit or overwrite your original file.' },
      { question: 'Can I see every worksheet?', answer: 'The current viewer displays the first worksheet only.' },
    ],
  },
  'xlsx-to-html': {
    details: [
      { title: 'Standalone HTML table', text: 'Convert the first worksheet into a portable HTML document containing a clean table of displayed values.' },
      { title: 'Safe text output', text: 'Cell values are HTML-escaped before export so spreadsheet text is not treated as executable markup.' },
      { title: 'Value-focused conversion', text: 'The HTML output does not reproduce Excel formulas, charts, macros, workbook styling, or additional sheets.' },
    ],
    faq: [
      { question: 'Can I convert Excel to HTML?', answer: 'Yes. The tool converts the first XLSX worksheet into a standalone HTML table you can download.' },
      { question: 'Will Excel formatting be preserved?', answer: 'No. The current converter creates a clean table from displayed cell values rather than reproducing workbook styling.' },
      { question: 'Are spreadsheet cells safely escaped?', answer: 'Yes. Cell text is escaped before it is written into the HTML document.' },
    ],
  },
};

export function SpreadsheetUtilityPage({ route, mode }: { route: string; mode: SpreadsheetUtilityMode }) {
  const tool = getAllPlatformToolByRoute(route);
  if (!tool) throw new Error(`Unknown spreadsheet route: ${route}`);
  const page = content[mode];
  return <PlatformTaskPage route={route} title={tool.title} description={tool.description} tool={<SpreadsheetUtilityInterface mode={mode} />} details={page.details} faq={page.faq} />;
}
