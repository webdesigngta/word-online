import * as XLSX from 'xlsx';

export type TabularData = { rows: string[][]; sheetName?: string };

function normalize(value: unknown) {
  if (value == null) return '';
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char] ?? char));
}

export async function readCsv(file: File): Promise<TabularData> {
  const text = await file.text();
  const workbook = XLSX.read(text, { type: 'string', raw: false });
  const sheetName = workbook.SheetNames[0] || 'Sheet1';
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) return { rows: [], sheetName };
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: false, defval: '' }).map((row) => row.map(normalize));
  return { rows, sheetName };
}

export async function readXlsx(file: File): Promise<TabularData> {
  const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array', cellDates: true });
  const sheetName = workbook.SheetNames[0] || 'Sheet1';
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) return { rows: [], sheetName };
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: false, defval: '' }).map((row) => row.map(normalize));
  return { rows, sheetName };
}

export function rowsToCsv(rows: string[][]) {
  return XLSX.utils.sheet_to_csv(XLSX.utils.aoa_to_sheet(rows));
}

export function rowsToXlsx(rows: string[][], sheetName = 'Sheet1') {
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(rows), sheetName.slice(0, 31) || 'Sheet1');
  const bytes = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  return new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

export function rowsToHtml(rows: string[][], title = 'Spreadsheet') {
  const safeTitle = escapeHtml(title || 'Spreadsheet');
  const body = rows
    .map((row, rowIndex) => `<tr>${row.map((cell) => `<${rowIndex === 0 ? 'th' : 'td'}>${escapeHtml(cell)}</${rowIndex === 0 ? 'th' : 'td'}>`).join('')}</tr>`)
    .join('');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${safeTitle}</title><style>body{font-family:Arial,sans-serif;margin:24px;color:#202124}table{border-collapse:collapse;width:100%;max-width:100%;overflow:auto}th,td{border:1px solid #dadce0;padding:8px 10px;text-align:left;vertical-align:top}th{background:#f1f3f4;font-weight:600}</style></head><body><table>${body}</table></body></html>`;
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
