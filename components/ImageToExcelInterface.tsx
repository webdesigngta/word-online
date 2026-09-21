'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ClipboardPaste, Download, FileSpreadsheet, FileUp, Plus, RefreshCw, Sparkles } from 'lucide-react';
import { trackToolEvent } from '@/lib/toolAnalytics';

type OcrWord = {
  text: string;
  confidence: number;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
};

type OcrRow = {
  words: OcrWord[];
  centerY: number;
};

type Segment = {
  text: string;
  x0: number;
  x1: number;
  rowIndex: number;
};

function formatBytes(value: number) {
  if (value < 1024) return value + ' B';
  if (value < 1024 * 1024) return (value / 1024).toFixed(1) + ' KB';
  return (value / (1024 * 1024)).toFixed(1) + ' MB';
}

function median(values: number[]) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function sanitizeBaseName(name: string) {
  const base = name.replace(/\.(?:jpe?g|png|webp)$/i, '').replace(/[\\/:*?"<>|]+/g, '').trim();
  return base || 'image-table';
}

function isAcceptedImage(file: File) {
  const type = file.type.toLowerCase();
  return type === 'image/jpeg' || type === 'image/png' || type === 'image/webp' || /\.(?:jpe?g|png|webp)$/i.test(file.name);
}

async function renderImage(file: File) {
  const objectUrl = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.decoding = 'async';
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('The image could not be decoded.'));
      image.src = objectUrl;
    });
    if (!image.naturalWidth || !image.naturalHeight) throw new Error('The image has invalid dimensions.');
    const maxDimension = 5200;
    const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) throw new Error('Could not create an OCR canvas.');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function collectWords(blocks: any[] | null | undefined): OcrWord[] {
  if (!Array.isArray(blocks)) return [];
  const words: OcrWord[] = [];
  for (const block of blocks) {
    for (const paragraph of block?.paragraphs || []) {
      for (const line of paragraph?.lines || []) {
        for (const word of line?.words || []) {
          const text = typeof word?.text === 'string' ? word.text.trim() : '';
          const bbox = word?.bbox;
          const confidence = Number(word?.confidence ?? 0);
          if (!text || !bbox) continue;
          if (![bbox.x0, bbox.y0, bbox.x1, bbox.y1].every(Number.isFinite)) continue;
          if (confidence < 15) continue;
          words.push({
            text,
            confidence,
            x0: bbox.x0,
            y0: bbox.y0,
            x1: bbox.x1,
            y1: bbox.y1,
          });
        }
      }
    }
  }
  return words;
}

function groupRows(words: OcrWord[]) {
  const heights = words.map((word) => Math.max(1, word.y1 - word.y0));
  const typicalHeight = Math.max(8, median(heights));
  const tolerance = Math.max(6, typicalHeight * 0.62);
  const sorted = [...words].sort((a, b) => ((a.y0 + a.y1) / 2) - ((b.y0 + b.y1) / 2) || a.x0 - b.x0);
  const rows: OcrRow[] = [];

  for (const word of sorted) {
    const centerY = (word.y0 + word.y1) / 2;
    let best: OcrRow | undefined;
    let bestDistance = Infinity;
    for (const row of rows) {
      const distance = Math.abs(row.centerY - centerY);
      if (distance <= tolerance && distance < bestDistance) {
        best = row;
        bestDistance = distance;
      }
    }
    if (!best) {
      rows.push({ words: [word], centerY });
      continue;
    }
    best.words.push(word);
    best.centerY = best.words.reduce((sum, item) => sum + ((item.y0 + item.y1) / 2), 0) / best.words.length;
  }

  return rows
    .sort((a, b) => a.centerY - b.centerY)
    .map((row) => ({ ...row, words: row.words.sort((a, b) => a.x0 - b.x0) }));
}

function splitRowsIntoSegments(rows: OcrRow[], imageWidth: number) {
  const allGaps: number[] = [];
  const heights: number[] = [];
  rows.forEach((row) => {
    row.words.forEach((word) => heights.push(Math.max(1, word.y1 - word.y0)));
    for (let index = 1; index < row.words.length; index += 1) {
      const gap = row.words[index].x0 - row.words[index - 1].x1;
      if (gap > 0) allGaps.push(gap);
    }
  });

  const typicalHeight = Math.max(8, median(heights));
  const typicalGap = Math.max(2, median(allGaps));
  const splitThreshold = Math.max(typicalHeight * 0.9, typicalGap * 2.4, imageWidth * 0.009);
  const segments: Segment[] = [];

  rows.forEach((row, rowIndex) => {
    if (!row.words.length) return;
    let group: OcrWord[] = [row.words[0]];

    const flush = () => {
      if (!group.length) return;
      segments.push({
        text: group.map((word) => word.text).join(' ').replace(/\s+/g, ' ').trim(),
        x0: Math.min(...group.map((word) => word.x0)),
        x1: Math.max(...group.map((word) => word.x1)),
        rowIndex,
      });
      group = [];
    };

    for (let index = 1; index < row.words.length; index += 1) {
      const previous = row.words[index - 1];
      const current = row.words[index];
      const gap = current.x0 - previous.x1;
      if (gap > splitThreshold) flush();
      group.push(current);
    }
    flush();
  });

  return { segments, typicalHeight };
}

function inferColumnAnchors(segments: Segment[], typicalHeight: number, imageWidth: number) {
  if (!segments.length) return [0];
  const tolerance = Math.max(14, typicalHeight * 1.2, imageWidth * 0.018);
  const starts = segments.map((segment) => segment.x0).sort((a, b) => a - b);
  const clusters: number[][] = [];

  for (const start of starts) {
    const cluster = clusters.find((items) => Math.abs(median(items) - start) <= tolerance);
    if (cluster) cluster.push(start);
    else clusters.push([start]);
  }

  let anchors = clusters.map((items) => median(items)).sort((a, b) => a - b);

  const segmentCounts = new Map<number, number>();
  segments.forEach((segment) => segmentCounts.set(segment.rowIndex, (segmentCounts.get(segment.rowIndex) || 0) + 1));
  const maxSegmentsInRow = Math.max(1, ...segmentCounts.values());

  if (anchors.length < maxSegmentsInRow) {
    const longestRow = [...segmentCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
    const rowStarts = segments.filter((segment) => segment.rowIndex === longestRow).map((segment) => segment.x0);
    anchors = [...new Set([...anchors, ...rowStarts])].sort((a, b) => a - b);
  }

  if (anchors.length > 16) anchors = anchors.slice(0, 16);
  return anchors;
}

function toGrid(words: OcrWord[], imageWidth: number) {
  const grouped = groupRows(words);
  const { segments, typicalHeight } = splitRowsIntoSegments(grouped, imageWidth);
  const anchors = inferColumnAnchors(segments, typicalHeight, imageWidth);
  const rows: string[][] = grouped.map(() => Array.from({ length: anchors.length }, () => ''));

  segments.forEach((segment) => {
    let bestIndex = 0;
    let bestDistance = Infinity;
    anchors.forEach((anchor, index) => {
      const distance = Math.abs(anchor - segment.x0);
      if (distance < bestDistance) {
        bestIndex = index;
        bestDistance = distance;
      }
    });
    const existing = rows[segment.rowIndex][bestIndex];
    rows[segment.rowIndex][bestIndex] = existing ? existing + ' ' + segment.text : segment.text;
  });

  const cleaned = rows
    .map((row) => row.map((cell) => cell.trim()))
    .filter((row) => row.some(Boolean));

  let lastColumn = 0;
  cleaned.forEach((row) => {
    row.forEach((cell, index) => {
      if (cell) lastColumn = Math.max(lastColumn, index);
    });
  });

  return cleaned.map((row) => row.slice(0, lastColumn + 1));
}

function fallbackTextGrid(text: string) {
  return text
    .replace(/\r/g, '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.split(/\t+|\s{2,}/).map((cell) => cell.trim()).filter(Boolean))
    .filter((row) => row.length);
}

function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function ImageToExcelInterface({ toolId }: { toolId: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [rows, setRows] = useState<string[][]>([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [status, setStatus] = useState('Choose an image, drop it here, or paste a screenshot.');
  const columnCount = useMemo(() => Math.max(1, ...rows.map((row) => row.length)), [rows]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    const onPaste = (event: ClipboardEvent) => {
      const item = Array.from(event.clipboardData?.items || []).find((entry) => entry.type.startsWith('image/'));
      const pasted = item?.getAsFile();
      if (!pasted) return;
      event.preventDefault();
      chooseFile(new File([pasted], 'pasted-screenshot.png', { type: pasted.type || 'image/png' }));
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  });

  function chooseFile(next: File | null) {
    if (!next) return;
    if (!isAcceptedImage(next)) {
      setStatus('Choose a JPG, JPEG, PNG, or WEBP image.');
      return;
    }
    if (next.size > 20 * 1024 * 1024) {
      setStatus('Choose an image smaller than 20 MB.');
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(next));
    setFile(next);
    setRows([]);
    setConfidence(null);
    setProgress(0);
    setStatus('Ready to detect the table and build an editable spreadsheet.');
    trackToolEvent('tool_start', { toolId, fileType: next.type || 'image', metadata: { size: next.size } });
  }

  async function extract() {
    if (!file || busy) return;
    setBusy(true);
    setRows([]);
    setConfidence(null);
    setProgress(1);
    setStatus('Reading the image and detecting table cells...');
    let worker: any;
    let canvas: HTMLCanvasElement | undefined;

    try {
      canvas = await renderImage(file);
      const tesseract = await import('tesseract.js');
      worker = await tesseract.createWorker('eng', 1, {
        logger: (message: { status?: string; progress?: number }) => {
          if (message.status?.includes('recognizing') && typeof message.progress === 'number') {
            setProgress(Math.max(1, Math.min(99, Math.round(message.progress * 100))));
          }
        },
      } as any);
      const recognized: any = await worker.recognize(canvas, {}, { blocks: true } as any);
      const words = collectWords(recognized.data?.blocks);
      let grid = words.length ? toGrid(words, canvas.width) : fallbackTextGrid(recognized.data?.text || '');
      if (!grid.length) throw new Error('No readable table text was detected. Try a clearer, straighter image with larger text.');

      const maxColumns = Math.max(...grid.map((row) => row.length));
      grid = grid.map((row) => [...row, ...Array.from({ length: maxColumns - row.length }, () => '')]);
      setRows(grid);
      setConfidence(Number.isFinite(recognized.data?.confidence) ? recognized.data.confidence : null);
      setProgress(100);
      setStatus('Table detected. Review or edit any cell, then download Excel or CSV.');
      trackToolEvent('tool_success', {
        toolId,
        fileType: file.type || 'image',
        outputType: 'xlsx',
        metadata: { rows: grid.length, columns: maxColumns, confidence: recognized.data?.confidence || 0 },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'The table could not be extracted.';
      setStatus(message);
      setProgress(0);
      trackToolEvent('tool_error', { toolId, fileType: file?.type || 'image', metadata: { message } });
    } finally {
      if (canvas) {
        canvas.width = 0;
        canvas.height = 0;
      }
      await worker?.terminate?.().catch(() => undefined);
      setBusy(false);
    }
  }

  function updateCell(rowIndex: number, columnIndex: number, value: string) {
    setRows((current) => current.map((row, r) => {
      if (r !== rowIndex) return row;
      const next = [...row];
      while (next.length < columnCount) next.push('');
      next[columnIndex] = value;
      return next;
    }));
  }

  function addRow() {
    setRows((current) => [...current, Array.from({ length: columnCount }, () => '')]);
  }

  function addColumn() {
    setRows((current) => current.map((row) => [...row, '']));
  }

  function trimEmpty() {
    setRows((current) => {
      const nonEmptyRows = current.filter((row) => row.some((cell) => cell.trim()));
      if (!nonEmptyRows.length) return current;
      let last = 0;
      nonEmptyRows.forEach((row) => row.forEach((cell, index) => {
        if (cell.trim()) last = Math.max(last, index);
      }));
      return nonEmptyRows.map((row) => row.slice(0, last + 1));
    });
  }

  async function downloadXlsx() {
    if (!rows.length || !file) return;
    const XLSX = await import('xlsx');
    const sheet = XLSX.utils.aoa_to_sheet(rows);
    sheet['!cols'] = Array.from({ length: columnCount }, (_, columnIndex) => ({
      wch: Math.min(40, Math.max(10, ...rows.map((row) => (row[columnIndex] || '').length + 2))),
    }));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, 'Extracted Table');
    const bytes = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    downloadBlob(
      new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
      sanitizeBaseName(file.name) + '.xlsx',
    );
    trackToolEvent('tool_download', { toolId, outputType: 'xlsx' });
  }

  async function downloadCsv() {
    if (!rows.length || !file) return;
    const XLSX = await import('xlsx');
    const csv = XLSX.utils.sheet_to_csv(XLSX.utils.aoa_to_sheet(rows));
    downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), sanitizeBaseName(file.name) + '.csv');
    trackToolEvent('tool_download', { toolId, outputType: 'csv' });
  }

  function reset() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl('');
    setFile(null);
    setRows([]);
    setConfidence(null);
    setProgress(0);
    setStatus('Choose an image, drop it here, or paste a screenshot.');
    if (inputRef.current) inputRef.current.value = '';
  }

  const css = '.ite-tool{display:grid;gap:16px}.ite-drop{border:2px dashed #cfd8e6;border-radius:18px;background:linear-gradient(180deg,#fbfdff,#f5f9ff);padding:26px;text-align:center;transition:.15s}.ite-drop.drag{border-color:#0b57d0;background:#eef5ff}.ite-drop svg{width:44px;height:44px;color:#0b57d0;margin-bottom:10px}.ite-drop h2{font-size:22px;margin:0}.ite-drop p{color:#5f6368;line-height:1.55;margin:8px auto 16px;max-width:680px}.ite-btn{border:1px solid #d7dce5;background:#fff;color:#202124;border-radius:22px;padding:10px 15px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:7px}.ite-btn.primary{background:#0b57d0;border-color:#0b57d0;color:#fff}.ite-btn.success{background:#137333;border-color:#137333;color:#fff}.ite-btn:disabled{opacity:.45;cursor:not-allowed}.ite-file{display:grid;grid-template-columns:86px 1fr auto;gap:12px;align-items:center;border:1px solid #e0e3e7;border-radius:14px;padding:10px;background:#fff}.ite-preview{width:86px;height:64px;border-radius:9px;object-fit:cover;background:#f1f3f4}.ite-file strong{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.ite-meta{color:#5f6368;font-size:12px;margin-top:3px}.ite-actions{display:flex;gap:8px;flex-wrap:wrap}.ite-status{font-size:13px;line-height:1.5;color:#5f6368}.ite-progress{height:7px;background:#eef1f5;border-radius:999px;overflow:hidden}.ite-progress span{display:block;height:100%;background:#0b57d0;transition:width .2s}.ite-result{border:1px solid #dfe3e9;border-radius:16px;background:#fff;overflow:hidden}.ite-result-head{display:flex;justify-content:space-between;gap:12px;align-items:center;padding:13px 14px;border-bottom:1px solid #eceff3}.ite-result-head h3{margin:0;font-size:16px}.ite-result-head p{margin:3px 0 0;color:#5f6368;font-size:12px}.ite-grid-wrap{overflow:auto;max-height:520px}.ite-grid{border-collapse:collapse;min-width:100%;width:max-content}.ite-grid th{position:sticky;top:0;z-index:2;background:#f8f9fa;color:#5f6368;font-size:11px;font-weight:700;text-align:center;border:1px solid #e4e7eb;padding:6px 8px;min-width:120px}.ite-grid th:first-child{left:0;z-index:3;min-width:46px}.ite-grid td{border:1px solid #e4e7eb;padding:0;background:#fff}.ite-row-num{position:sticky;left:0;z-index:1;background:#f8f9fa!important;color:#5f6368;text-align:center;font-size:11px;width:46px;min-width:46px}.ite-cell{border:0;outline:0;width:100%;min-width:120px;padding:9px 10px;font:13px/1.35 Arial,sans-serif;background:transparent;box-sizing:border-box}.ite-cell:focus{box-shadow:inset 0 0 0 2px #0b57d0;background:#f8fbff}.ite-result-actions{display:flex;gap:8px;flex-wrap:wrap;padding:12px 14px;border-top:1px solid #eceff3;background:#fbfcfe}@media(max-width:680px){.ite-file{grid-template-columns:64px 1fr}.ite-preview{width:64px;height:52px}.ite-file>.ite-btn{grid-column:1/-1}.ite-result-head{align-items:flex-start;flex-direction:column}}';

  return (
    <div className="ite-tool">
      <style>{css}</style>
      <input
        ref={inputRef}
        hidden
        type="file"
        accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
        onChange={(event) => chooseFile(event.target.files?.[0] || null)}
      />

      <div
        className="ite-drop"
        onDragOver={(event) => {
          event.preventDefault();
          event.currentTarget.classList.add('drag');
        }}
        onDragLeave={(event) => event.currentTarget.classList.remove('drag')}
        onDrop={(event) => {
          event.preventDefault();
          event.currentTarget.classList.remove('drag');
          chooseFile(event.dataTransfer.files?.[0] || null);
        }}
      >
        <FileSpreadsheet />
        <h2>Turn an image table into Excel</h2>
        <p>Upload a photo, scan, or screenshot of a table. DOC321 detects rows and columns, lets you fix the cells, and exports a real XLSX or CSV file.</p>
        <div className="ite-actions" style={{ justifyContent: 'center' }}>
          <button className="ite-btn primary" type="button" onClick={() => inputRef.current?.click()} disabled={busy}>
            <FileUp size={17} />{file ? 'Choose another image' : 'Choose image'}
          </button>
          <span className="ite-btn" aria-hidden="true"><ClipboardPaste size={17} />Ctrl+V screenshot</span>
        </div>
      </div>

      {file ? (
        <div className="ite-file">
          {previewUrl ? <img className="ite-preview" src={previewUrl} alt="Selected table preview" /> : <div className="ite-preview" />}
          <div>
            <strong>{file.name}</strong>
            <div className="ite-meta">{formatBytes(file.size)} · JPG, PNG, or WEBP</div>
          </div>
          <button className="ite-btn" type="button" onClick={reset} disabled={busy}><RefreshCw size={15} />Reset</button>
        </div>
      ) : null}

      {file ? (
        <div className="ite-actions">
          <button className="ite-btn primary" type="button" onClick={extract} disabled={busy}>
            <Sparkles size={16} />{busy ? 'Detecting table...' : 'Convert image to Excel'}
          </button>
        </div>
      ) : null}

      {busy || progress > 0 ? <div className="ite-progress" aria-label={'OCR progress ' + progress + '%'}><span style={{ width: progress + '%' }} /></div> : null}
      <div className="ite-status" role="status">{status}</div>

      {rows.length ? (
        <div className="ite-result">
          <div className="ite-result-head">
            <div>
              <h3>Editable table preview</h3>
              <p>{rows.length} rows × {columnCount} columns{confidence !== null ? ' · OCR confidence ' + confidence.toFixed(0) + '%' : ''}</p>
            </div>
            <div className="ite-actions">
              <button className="ite-btn success" type="button" onClick={downloadXlsx}><Download size={16} />Download XLSX</button>
              <button className="ite-btn" type="button" onClick={downloadCsv}><Download size={16} />Download CSV</button>
            </div>
          </div>

          <div className="ite-grid-wrap">
            <table className="ite-grid">
              <thead>
                <tr>
                  <th>#</th>
                  {Array.from({ length: columnCount }, (_, index) => <th key={index}>{String.fromCharCode(65 + (index % 26))}{index >= 26 ? Math.floor(index / 26) : ''}</th>)}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    <td className="ite-row-num">{rowIndex + 1}</td>
                    {Array.from({ length: columnCount }, (_, columnIndex) => (
                      <td key={columnIndex}>
                        <input
                          className="ite-cell"
                          value={row[columnIndex] || ''}
                          aria-label={'Row ' + (rowIndex + 1) + ', column ' + (columnIndex + 1)}
                          onChange={(event) => updateCell(rowIndex, columnIndex, event.target.value)}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="ite-result-actions">
            <button className="ite-btn" type="button" onClick={addRow}><Plus size={15} />Add row</button>
            <button className="ite-btn" type="button" onClick={addColumn}><Plus size={15} />Add column</button>
            <button className="ite-btn" type="button" onClick={trimEmpty}>Remove empty edges</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
