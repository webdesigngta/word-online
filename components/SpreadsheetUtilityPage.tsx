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
};

export function SpreadsheetUtilityPage({ route, mode }: { route: string; mode: SpreadsheetUtilityMode }) {
  const tool = getAllPlatformToolByRoute(route);
  if (!tool) throw new Error(`Unknown spreadsheet route: ${route}`);
  const page = content[mode];
  return <PlatformTaskPage route={route} title={tool.title} description={tool.description} tool={<SpreadsheetUtilityInterface mode={mode} />} details={page.details} faq={page.faq} />;
}
