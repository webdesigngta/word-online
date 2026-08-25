'use client';

import { useRef, useState } from 'react';
import { Download, FileSpreadsheet, FolderOpen, Plus, RefreshCw } from 'lucide-react';
import { downloadBlob, readCsv, readXlsx, rowsToCsv, rowsToHtml, rowsToXlsx } from '@/tools/spreadsheet/tabular';

export type SpreadsheetUtilityMode =
  | 'csv-editor'
  | 'csv-viewer'
  | 'csv-to-xlsx'
  | 'xlsx-to-csv'
  | 'xlsx-editor'
  | 'xlsx-viewer'
  | 'xlsx-to-html'
  | 'xls-viewer'
  | 'spreadsheet-online';

const maxRows = 1000;
const maxColumns = 100;

function baseName(name: string) {
  return name.replace(/\.(?:csv|xlsx|xls)$/i, '') || 'spreadsheet';
}

function normalizedRows(rows: string[][]) {
  const width = Math.min(maxColumns, Math.max(1, ...rows.map((row) => row.length)));
  return rows.slice(0, maxRows).map((row) => Array.from({ length: width }, (_, index) => row[index] ?? ''));
}

function blankRows() {
  return Array.from({ length: 20 }, () => Array(10).fill('')) as string[][];
}

function columnLabel(index: number) {
  let value = index + 1;
  let label = '';
  while (value > 0) {
    const remainder = (value - 1) % 26;
    label = String.fromCharCode(65 + remainder) + label;
    value = Math.floor((value - 1) / 26);
  }
  return label;
}

function isXlsxMode(mode: SpreadsheetUtilityMode) {
  return mode === 'xlsx-to-csv' || mode === 'xlsx-editor' || mode === 'xlsx-viewer' || mode === 'xlsx-to-html' || mode === 'xls-viewer';
}

function modeCopy(mode: SpreadsheetUtilityMode) {
  if (mode === 'csv-editor') return { label: 'CSV editor', accept: '.csv,text/csv', action: 'Open CSV' };
  if (mode === 'csv-viewer') return { label: 'CSV viewer', accept: '.csv,text/csv', action: 'Open CSV' };
  if (mode === 'csv-to-xlsx') return { label: 'CSV to XLSX', accept: '.csv,text/csv', action: 'Choose CSV' };
  if (mode === 'xlsx-editor') return { label: 'XLSX editor', accept: '.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', action: 'Open XLSX' };
  if (mode === 'xlsx-viewer') return { label: 'XLSX viewer', accept: '.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', action: 'Open XLSX' };
  if (mode === 'xls-viewer') return { label: 'XLS viewer', accept: '.xls,application/vnd.ms-excel', action: 'Open XLS' };
  if (mode === 'xlsx-to-html') return { label: 'XLSX to HTML', accept: '.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', action: 'Choose XLSX' };
  if (mode === 'spreadsheet-online') return { label: 'Spreadsheet Online', accept: '.csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', action: 'Open CSV/XLSX' };
  return { label: 'XLSX to CSV', accept: '.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', action: 'Choose XLSX' };
}

export function SpreadsheetUtilityInterface({ mode }: { mode: SpreadsheetUtilityMode }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const startsBlank = mode === 'spreadsheet-online';
  const [rows, setRows] = useState<string[][]>(() => startsBlank ? blankRows() : []);
  const [fileName, setFileName] = useState(startsBlank ? 'Untitled spreadsheet' : '');
  const [sheetName, setSheetName] = useState('Sheet1');
  const [status, setStatus] = useState(startsBlank ? 'Start typing in the grid or open a CSV/XLSX file.' : 'Choose a file to begin.');
  const [busy, setBusy] = useState(false);
  const copy = modeCopy(mode);
  const editable = mode === 'csv-editor' || mode === 'xlsx-editor' || mode === 'spreadsheet-online';
  const tableMode = editable || mode === 'csv-viewer' || mode === 'xlsx-viewer' || mode === 'xls-viewer';

  async function open(file?: File) {
    if (!file) return;
    setBusy(true);
    setStatus(`Opening ${file.name}…`);
    try {
      let xlsx = isXlsxMode(mode);
      if (mode === 'spreadsheet-online') {
        if (/\.csv$/i.test(file.name)) xlsx = false;
        else if (/\.xlsx$/i.test(file.name)) xlsx = true;
        else throw new Error('Choose a CSV or XLSX file.');
      } else if (mode === 'xls-viewer') {
        if (!/\.xls$/i.test(file.name)) throw new Error('Choose an XLS file.');
      } else if (xlsx && !/\.xlsx$/i.test(file.name)) throw new Error('Choose an XLSX file.');
      else if (!xlsx && !/\.csv$/i.test(file.name)) throw new Error('Choose a CSV file.');
      if (file.size <= 0 || file.size > 20 * 1024 * 1024) throw new Error('Files must be between 1 byte and 20 MB.');
      const data = xlsx ? await readXlsx(file) : await readCsv(file);
      const next = normalizedRows(data.rows);
      setRows(next.length ? next : [['']]);
      setSheetName(data.sheetName || 'Sheet1');
      setFileName(file.name);
      const baseStatus = `${next.length || 1} row${next.length === 1 ? '' : 's'} loaded`;
      setStatus(xlsx ? `${baseStatus} from ${data.sheetName || 'the first worksheet'}.` : `${baseStatus}.`);
    } catch (error) {
      if (!startsBlank) {
        setRows([]);
        setFileName('');
      }
      setStatus(error instanceof Error ? error.message : 'Could not open this file.');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  function setCell(rowIndex: number, columnIndex: number, value: string) {
    setRows((current) => current.map((row, r) => r === rowIndex ? row.map((cell, c) => c === columnIndex ? value : cell) : row));
  }

  function addRow() {
    setRows((current) => current.length >= maxRows ? current : [...current, Array(current[0]?.length || 1).fill('')]);
  }

  function addColumn() {
    setRows((current) => {
      const width = current[0]?.length || 1;
      if (width >= maxColumns) return current;
      return (current.length ? current : [['']]).map((row) => [...row, '']);
    });
  }

  function downloadCsv() {
    if (!rows.length) return;
    const csv = rowsToCsv(rows);
    downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), `${baseName(fileName)}.csv`);
  }

  function downloadXlsx() {
    if (!rows.length) return;
    downloadBlob(rowsToXlsx(rows, sheetName), `${baseName(fileName)}.xlsx`);
  }

  function downloadHtml() {
    if (!rows.length) return;
    const html = rowsToHtml(rows, `${baseName(fileName)} - ${sheetName}`);
    downloadBlob(new Blob([html], { type: 'text/html;charset=utf-8' }), `${baseName(fileName)}.html`);
  }

  function convert() {
    if (mode === 'csv-to-xlsx') downloadXlsx();
    else if (mode === 'xlsx-to-csv') downloadCsv();
    else if (mode === 'xlsx-to-html') downloadHtml();
  }

  function resetBlank() {
    setRows(blankRows());
    setFileName('Untitled spreadsheet');
    setSheetName('Sheet1');
    setStatus('Blank spreadsheet ready.');
  }

  const columnCount = rows[0]?.length || 0;
  const convertLabel = mode === 'csv-to-xlsx' ? 'Download XLSX' : mode === 'xlsx-to-html' ? 'Download HTML' : 'Download CSV';

  return (
    <div className="fwo-sheet-tool">
      <style>{`
        .fwo-sheet-tool{display:grid;gap:16px}.fwo-sheet-top{display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap}.fwo-sheet-file{display:flex;align-items:center;gap:10px;min-width:0}.fwo-sheet-icon{width:42px;height:42px;border-radius:12px;background:#e6f4ea;color:#137333;display:grid;place-items:center}.fwo-sheet-icon svg{width:21px}.fwo-sheet-copy{min-width:0}.fwo-sheet-copy strong{display:block;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:520px}.fwo-sheet-copy span{display:block;color:#5f6368;font-size:12px;margin-top:3px}.fwo-sheet-actions{display:flex;gap:8px;flex-wrap:wrap}.fwo-sheet-btn{border:1px solid #dadce0;border-radius:20px;background:#fff;color:#202124;padding:9px 14px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:7px}.fwo-sheet-btn.primary{background:#0b57d0;color:#fff;border-color:#0b57d0}.fwo-sheet-btn:disabled{opacity:.55;cursor:not-allowed}.fwo-sheet-btn svg{width:16px}.fwo-sheet-empty{min-height:320px;border:2px dashed #d5dae2;border-radius:16px;background:#fbfcfe;display:grid;place-items:center;text-align:center;padding:32px;color:#5f6368}.fwo-sheet-empty svg{width:42px;height:42px;color:#137333;margin-bottom:10px}.fwo-sheet-wrap{border:1px solid #dadce0;border-radius:14px;overflow:auto;max-height:62vh;background:#fff}.fwo-sheet-table{border-collapse:separate;border-spacing:0;min-width:100%;font-size:13px}.fwo-sheet-table th,.fwo-sheet-table td{border-right:1px solid #e0e3e7;border-bottom:1px solid #e0e3e7;min-width:120px;padding:0}.fwo-sheet-table th{position:sticky;top:0;background:#f1f3f4;color:#5f6368;padding:8px;text-align:center;z-index:2;min-width:48px}.fwo-sheet-table th:first-child{left:0;z-index:3}.fwo-sheet-rowhead{position:sticky;left:0;background:#f1f3f4!important;color:#5f6368;text-align:center!important;min-width:48px!important;width:48px;padding:8px!important;z-index:1}.fwo-sheet-cell{width:100%;border:0;background:transparent;padding:8px 10px;font:inherit;color:#202124;outline:none;min-width:120px}.fwo-sheet-cell:focus{box-shadow:inset 0 0 0 2px #0b57d0}.fwo-sheet-read{padding:8px 10px;white-space:pre-wrap;min-height:34px}.fwo-sheet-summary{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;color:#5f6368;font-size:12px}.fwo-sheet-warning{padding:10px 12px;border-radius:10px;background:#fef7e0;color:#5f4b00;font-size:12px}.fwo-sheet-convert{padding:28px;border:1px solid #e0e3e7;border-radius:14px;background:#f8fafd;text-align:center}.fwo-sheet-convert strong{display:block;font-size:18px;margin-bottom:6px}.fwo-sheet-convert p{margin:0 0 16px;color:#5f6368}@media(max-width:700px){.fwo-sheet-copy strong{max-width:240px}.fwo-sheet-btn{padding:8px 11px}.fwo-sheet-wrap{max-height:56vh}}
      `}</style>
      <input ref={inputRef} type="file" accept={copy.accept} hidden onChange={(event) => void open(event.target.files?.[0])} />
      <div className="fwo-sheet-top">
        <div className="fwo-sheet-file">
          <div className="fwo-sheet-icon"><FileSpreadsheet /></div>
          <div className="fwo-sheet-copy"><strong>{fileName || copy.label}</strong><span>{status}</span></div>
        </div>
        <div className="fwo-sheet-actions">
          {editable && rows.length ? <><button className="fwo-sheet-btn" type="button" onClick={addRow}><Plus />Row</button><button className="fwo-sheet-btn" type="button" onClick={addColumn}><Plus />Column</button></> : null}
          {mode === 'spreadsheet-online' ? <button className="fwo-sheet-btn" type="button" onClick={resetBlank} disabled={busy}>New blank</button> : null}
          <button className="fwo-sheet-btn primary" type="button" disabled={busy} onClick={() => inputRef.current?.click()}>{busy ? <RefreshCw /> : <FolderOpen />}{busy ? 'Opening…' : fileName && mode !== 'spreadsheet-online' ? 'Open another' : copy.action}</button>
        </div>
      </div>

      {!rows.length ? (
        <div className="fwo-sheet-empty"><div><FileSpreadsheet /><strong>{copy.label}</strong><div>{tableMode ? 'Open a spreadsheet to view it in this browser.' : 'Choose a file and convert it locally in your browser.'}</div></div></div>
      ) : tableMode ? (
        <>
          {mode === 'xlsx-editor' ? <div className="fwo-sheet-warning">This lightweight editor works with displayed values from the first worksheet. Complex formulas, charts, workbook styling, macros, and additional sheets are not preserved in the rebuilt download.</div> : null}
          {mode === 'spreadsheet-online' ? <div className="fwo-sheet-warning">This lightweight spreadsheet focuses on cell values. It does not provide Excel formulas, charts, macros, or advanced workbook formatting.</div> : null}
          <div className="fwo-sheet-wrap">
            <table className="fwo-sheet-table">
              <thead><tr><th>#</th>{Array.from({ length: columnCount }, (_, index) => <th key={index}>{columnLabel(index)}</th>)}</tr></thead>
              <tbody>{rows.map((row, rowIndex) => <tr key={rowIndex}><td className="fwo-sheet-rowhead">{rowIndex + 1}</td>{row.map((cell, columnIndex) => <td key={columnIndex}>{editable ? <input className="fwo-sheet-cell" value={cell} onChange={(event) => setCell(rowIndex, columnIndex, event.target.value)} /> : <div className="fwo-sheet-read">{cell}</div>}</td>)}</tr>)}</tbody>
            </table>
          </div>
          <div className="fwo-sheet-summary"><span>{rows.length} rows · {columnCount} columns · {sheetName}</span>{editable ? <span className="fwo-sheet-actions"><button className="fwo-sheet-btn" type="button" onClick={downloadCsv}><Download />Download CSV</button><button className="fwo-sheet-btn" type="button" onClick={downloadXlsx}><Download />Download XLSX</button></span> : null}</div>
        </>
      ) : (
        <div className="fwo-sheet-convert"><strong>{rows.length} rows ready</strong><p>{columnCount} columns detected in {sheetName}.</p><button className="fwo-sheet-btn primary" type="button" onClick={convert}><Download />{convertLabel}</button></div>
      )}
    </div>
  );
}
