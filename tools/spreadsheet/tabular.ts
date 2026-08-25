import * as XLSX from 'xlsx';

export type TabularData = { rows: string[][]; sheetName?: string };

function normalize(value: unknown) {
  if (value == null) return '';
  if (value instanceof Date) return value.toISOString();
  return String(value);
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
