import fs from 'node:fs';

const workspacePath = 'components/PdfEditorWorkspace.tsx';
const qaPath = 'qa/check-pdf-editor.mjs';

let source = fs.readFileSync(workspacePath, 'utf8');
let qa = fs.readFileSync(qaPath, 'utf8');

function replaceExact(haystack, before, after, label) {
  if (!haystack.includes(before)) {
    throw new Error(`Could not find ${label}`);
  }
  return haystack.replace(before, after);
}

source = replaceExact(
  source,
  "  else if (value.includes('times') || value.includes('serif')) resolved = 'Times New Roman';\n  else if (value.includes('verdana')) resolved = 'Verdana';\n  else if (value.includes('helvetica')) resolved = 'Helvetica';",
  "  else if (value.includes('verdana')) resolved = 'Verdana';\n  else if (value.includes('helvetica')) resolved = 'Helvetica';\n  else if (value.includes('arial') || value.includes('sans-serif') || value.includes('sans serif')) resolved = 'Arial';\n  else if (value.includes('times') || /(^|[^-])serif/.test(value)) resolved = 'Times New Roman';",
  'sans-serif font classification fix',
);

source = replaceExact(
  source,
  "type OcrWord = {\n  text: string;\n  confidence: number;\n  bbox: { x0: number; y0: number; x1: number; y1: number };\n  fontName: string;\n};",
  "type OcrWord = {\n  text: string;\n  confidence: number;\n  bbox: { x0: number; y0: number; x1: number; y1: number };\n  fontName: string;\n};\n\ntype OcrLine = {\n  text: string;\n  confidence: number;\n  x0: number;\n  y0: number;\n  x1: number;\n  y1: number;\n  glyphHeight: number;\n  fontName: string;\n};",
  'OCR line type',
);

const sampleStart = source.indexOf('function sampleColors(');
const ocrStart = source.indexOf('\n\nfunction extractOcrWords', sampleStart);
if (sampleStart < 0 || ocrStart < 0) throw new Error('Could not locate color sampling block');
const improvedSampleColors = `function sampleColors(canvas: HTMLCanvasElement, x: number, top: number, width: number, height: number, scale: number) {
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return { color: '#202124', background: '#ffffff' };
  const left = clamp(Math.floor(x * scale), 0, Math.max(0, canvas.width - 1));
  const y = clamp(Math.floor(top * scale), 0, Math.max(0, canvas.height - 1));
  const w = clamp(Math.ceil(width * scale), 1, Math.max(1, canvas.width - left));
  const h = clamp(Math.ceil(height * scale), 1, Math.max(1, canvas.height - y));
  const image = context.getImageData(left, y, w, h).data;
  const pixel = (px: number, py: number) => {
    const index = (py * w + px) * 4;
    return [image[index], image[index + 1], image[index + 2]] as [number, number, number];
  };
  const median = (values: number[]) => {
    if (!values.length) return 255;
    const sorted = [...values].sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length / 2)];
  };
  const medianColor = (pixels: Array<[number, number, number]>) => [
    median(pixels.map((item) => item[0])),
    median(pixels.map((item) => item[1])),
    median(pixels.map((item) => item[2])),
  ] as [number, number, number];

  const edges: Array<[number, number, number]> = [];
  const xStep = Math.max(1, Math.floor(w / 14));
  const yStep = Math.max(1, Math.floor(h / 9));
  for (let px = 0; px < w; px += xStep) edges.push(pixel(px, 0), pixel(px, h - 1));
  for (let py = 0; py < h; py += yStep) edges.push(pixel(0, py), pixel(w - 1, py));
  const background = medianColor(edges);

  const samples: Array<{ color: [number, number, number]; distance: number }> = [];
  const sampleX = Math.max(1, Math.floor(w / 28));
  const sampleY = Math.max(1, Math.floor(h / 16));
  for (let py = 0; py < h; py += sampleY) {
    for (let px = 0; px < w; px += sampleX) {
      const candidate = pixel(px, py);
      const distance = Math.hypot(candidate[0] - background[0], candidate[1] - background[1], candidate[2] - background[2]);
      samples.push({ color: candidate, distance });
    }
  }
  const strongest = samples
    .filter((item) => item.distance > 20)
    .sort((a, b) => b.distance - a.distance)
    .slice(0, Math.max(4, Math.ceil(samples.length * 0.16)))
    .map((item) => item.color);
  const foreground = strongest.length ? medianColor(strongest) : [32, 33, 36] as [number, number, number];
  return {
    color: strongest.length ? hex(...foreground) : '#202124',
    background: hex(...background),
  };
}`;
source = `${source.slice(0, sampleStart)}${improvedSampleColors}${source.slice(ocrStart)}`;

const extractStart = source.indexOf('function extractOcrWords(');
const exportStart = source.indexOf('\n\nexport function PdfEditorWorkspace', extractStart);
if (extractStart < 0 || exportStart < 0) throw new Error('Could not locate OCR helper block');
const improvedOcrHelpers = `function toOcrWord(word: any): OcrWord | null {
  if (!word?.bbox || typeof word.text !== 'string') return null;
  const bbox = word.bbox;
  if (![bbox.x0, bbox.y0, bbox.x1, bbox.y1].every(Number.isFinite)) return null;
  if (bbox.x1 <= bbox.x0 || bbox.y1 <= bbox.y0) return null;
  return {
    text: word.text,
    confidence: typeof word.confidence === 'number' ? word.confidence : 0,
    bbox,
    fontName: typeof word.font_name === 'string' ? word.font_name : '',
  };
}

function dominantFontName(words: OcrWord[]) {
  const counts = new Map<string, number>();
  for (const word of words) {
    const name = word.fontName.trim();
    if (!name) continue;
    const weight = Math.max(1, word.text.trim().length);
    counts.set(name, (counts.get(name) || 0) + weight);
  }
  let best = '';
  let bestCount = 0;
  for (const [name, count] of counts) {
    if (count > bestCount) {
      best = name;
      bestCount = count;
    }
  }
  return best;
}

function extractOcrLines(blocks: any[] | null | undefined): OcrLine[] {
  if (!Array.isArray(blocks)) return [];
  const lines: OcrLine[] = [];
  for (const block of blocks) {
    for (const paragraph of block?.paragraphs || []) {
      for (const line of paragraph?.lines || []) {
        const words = (line?.words || [])
          .map((word: any) => toOcrWord(word))
          .filter((word: OcrWord | null): word is OcrWord => Boolean(word && word.text.trim() && word.confidence >= 18));
        if (!words.length) continue;
        words.sort((a, b) => a.bbox.x0 - b.bbox.x0);
        const text = words.map((word) => word.text.trim()).filter(Boolean).join(' ');
        if (!text) continue;
        const weights = words.map((word) => Math.max(1, word.text.trim().length));
        const totalWeight = weights.reduce((sum, value) => sum + value, 0);
        const confidence = words.reduce((sum, word, index) => sum + word.confidence * weights[index], 0) / Math.max(1, totalWeight);
        const heights = words.map((word) => word.bbox.y1 - word.bbox.y0).sort((a, b) => a - b);
        lines.push({
          text,
          confidence,
          x0: Math.min(...words.map((word) => word.bbox.x0)),
          y0: Math.min(...words.map((word) => word.bbox.y0)),
          x1: Math.max(...words.map((word) => word.bbox.x1)),
          y1: Math.max(...words.map((word) => word.bbox.y1)),
          glyphHeight: heights[Math.floor(heights.length / 2)] || 1,
          fontName: dominantFontName(words),
        });
      }
    }
  }
  return lines;
}

function estimateOcrFontSize(line: OcrLine, width: number, family: string, bold: boolean, italic: boolean) {
  const glyphHeight = Math.max(1, line.glyphHeight / OCR_SCALE);
  const heightEstimate = clamp(glyphHeight * 1.08, 6, 72);
  if (typeof window === 'undefined' || !line.text.trim() || width <= 0) return heightEstimate;
  const canvas = window.document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) return heightEstimate;
  context.font = `${italic ? 'italic ' : ''}${bold ? '700 ' : '400 '}100px "${family}", Arial, sans-serif`;
  const measured = context.measureText(line.text.replace(/\\s+/g, ' ')).width;
  canvas.width = 0;
  canvas.height = 0;
  if (!Number.isFinite(measured) || measured <= 0) return heightEstimate;
  const widthEstimate = clamp((width / measured) * 100, 4, 96);
  if (widthEstimate < heightEstimate * 0.58 || widthEstimate > heightEstimate * 1.65) return heightEstimate;
  return clamp(heightEstimate * 0.62 + widthEstimate * 0.38, 6, 72);
}`;
source = `${source.slice(0, extractStart)}${improvedOcrHelpers}${source.slice(exportStart)}`;

source = replaceExact(
  source,
  "function wrapText(text: string, font: any, size: number, maxWidth: number) {\n  const lines: string[] = [];",
  "function fitSingleLineFontSize(text: string, font: any, size: number, maxWidth: number) {\n  if (!text.trim() || text.includes('\\n')) return size;\n  const measured = font.widthOfTextAtSize(text, size);\n  if (!Number.isFinite(measured) || measured <= maxWidth) return size;\n  return clamp(size * (maxWidth / measured) * 0.985, 4, size);\n}\n\nfunction wrapText(text: string, font: any, size: number, maxWidth: number) {\n  const lines: string[] = [];",
  'single-line fit helper',
);

source = replaceExact(
  source,
  "          const lines = groupOcrWords(extractOcrWords(recognized.data.blocks));",
  "          const lines = extractOcrLines(recognized.data.blocks);",
  'block-native OCR line extraction',
);

source = replaceExact(
  source,
  "            const size = clamp(rawHeight * 0.9, 6, 72);\n            const meta = inferFont(line.fontName);",
  "            const meta = inferFont(line.fontName);\n            const size = estimateOcrFontSize(line, width, meta.family, meta.bold, meta.italic);",
  'OCR font-size calibration',
);

source = replaceExact(
  source,
  "        let size = clamp(box.fontSize, 4, 96);\n        let lines = wrapText(box.text, font, size, Math.max(8, box.width));\n        while (size > 5 && lines.length * size * 1.18 > Math.max(box.height * 2.6, size * 1.3)) {\n          size -= 0.5;\n          lines = wrapText(box.text, font, size, Math.max(8, box.width));\n        }\n        const fg = rgb(box.color);\n        const baseline = pageHeight - box.top - size;\n        lines.forEach((line, index) => {\n          if (!line) return;\n          pdfPage.drawText(line, {\n            x: clamp(box.x, 0, pageWidth),\n            y: baseline - index * size * 1.18,",
  "        const maxWidth = Math.max(8, box.width);\n        let size = clamp(box.fontSize, 4, 96);\n        size = fitSingleLineFontSize(box.text, font, size, maxWidth);\n        let lines = box.text.includes('\\n') ? wrapText(box.text, font, size, maxWidth) : [box.text];\n        const lineHeight = box.source === 'ocr' ? size * 1.08 : size * 1.18;\n        while (size > 5 && lines.length * lineHeight > Math.max(box.height * 2.6, size * 1.3)) {\n          size -= 0.5;\n          lines = box.text.includes('\\n') ? wrapText(box.text, font, size, maxWidth) : [box.text];\n        }\n        const fg = rgb(box.color);\n        const baselineOffset = box.source === 'ocr'\n          ? clamp(box.height * 0.82, size * 0.72, size * 1.02)\n          : size;\n        const baseline = pageHeight - box.top - baselineOffset;\n        lines.forEach((line, index) => {\n          if (!line) return;\n          pdfPage.drawText(line, {\n            x: clamp(box.x, 0, pageWidth),\n            y: baseline - index * lineHeight,",
  'export layout fitting',
);

source = replaceExact(
  source,
  "                                fontStyle: box.italic ? 'italic' : 'normal',\n                                color: visible ? box.color : 'transparent',",
  "                                fontStyle: box.italic ? 'italic' : 'normal',\n                                lineHeight: box.source === 'ocr' ? 1.08 : 1.05,\n                                color: visible ? box.color : 'transparent',",
  'OCR preview line-height calibration',
);

qa = replaceExact(
  qa,
  "expect(workspace, 'extractOcrWords(recognized.data.blocks)', 'OCR regions must be rebuilt from the current Tesseract blocks hierarchy.');",
  "expect(workspace, 'extractOcrLines(recognized.data.blocks)', 'OCR regions must preserve Tesseract line boundaries from the current blocks hierarchy.');\nexpect(workspace, 'estimateOcrFontSize(line, width, meta.family, meta.bold, meta.italic)', 'OCR font size must combine glyph-height and rendered-width estimates.');\nexpect(workspace, \"value.includes('sans-serif')\", 'Generic sans-serif PDF fonts must not be misclassified as serif fonts.');\nexpect(workspace, 'fitSingleLineFontSize(box.text, font, size, maxWidth)', 'Edited single-line text should shrink to fit its detected region before wrapping.');\nexpect(workspace, \"box.source === 'ocr' ? 1.08 : 1.05\", 'OCR preview must use calibrated line height.');",
  'PDF editor QA accuracy checks',
);

fs.writeFileSync(workspacePath, source);
fs.writeFileSync(qaPath, qa);
console.log('Applied Edit PDF Phase 2 OCR/style accuracy improvements.');
