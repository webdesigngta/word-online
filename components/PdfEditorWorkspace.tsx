'use client';

import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { Bold, ChevronLeft, ChevronRight, Download, FileSearch, FileUp, Italic, LoaderCircle, RotateCcw, ScanText, Trash2 } from 'lucide-react';
import { trackToolEvent } from '@/lib/toolAnalytics';

const BASE_SCALE = 1.22;
const OCR_SCALE = 3;
const SAMPLE_SCALE = 1.75;
const HISTORY_LIMIT = 24;
const FONT_CHOICES = ['Arial', 'Helvetica', 'Times New Roman', 'Georgia', 'Calibri', 'Verdana', 'Courier New'];
const MAX_CUSTOM_FONT_BYTES = 12 * 1024 * 1024;

type SourceKind = 'native' | 'ocr' | 'added';
type TextAlign = 'left' | 'center' | 'right' | 'justify';

type TextBox = {
  id: string;
  page: number;
  text: string;
  originalText: string;
  x: number;
  top: number;
  width: number;
  height: number;
  originalX: number;
  originalTop: number;
  originalWidth: number;
  originalHeight: number;
  fontFamily: string;
  originalFontFamily: string;
  fontSize: number;
  originalFontSize: number;
  bold: boolean;
  originalBold: boolean;
  italic: boolean;
  originalItalic: boolean;
  detectedFontName: string;
  fontAssetId: string | null;
  originalFontAssetId: string | null;
  fontWeight: number;
  originalFontWeight: number;
  align: TextAlign;
  originalAlign: TextAlign;
  letterSpacing: number;
  originalLetterSpacing: number;
  lineHeight: number;
  originalLineHeight: number;
  rotation: number;
  originalRotation: number;
  baselineOffset: number;
  originalBaselineOffset: number;
  color: string;
  originalColor: string;
  background: string;
  source: SourceKind;
  confidence: number | null;
  isNew: boolean;
};

type PageModel = {
  pageNumber: number;
  width: number;
  height: number;
  source: Exclude<SourceKind, 'added'>;
  confidence: number | null;
  thumbnail: string;
  boxes: TextBox[];
};

type OcrWord = {
  text: string;
  confidence: number;
  bbox: { x0: number; y0: number; x1: number; y1: number };
  fontName: string;
};

type OcrLine = {
  text: string;
  confidence: number;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  glyphHeight: number;
  fontName: string;
  baselineY: number | null;
};

type OcrParagraph = {
  lines: OcrLine[];
  text: string;
  confidence: number;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  glyphHeight: number;
  fontName: string;
  align: TextAlign;
  lineHeight: number;
  baselineOffset: number;
};

type FontAsset = {
  id: string;
  kind: 'embedded' | 'custom';
  family: string;
  fullName: string;
  postscriptName: string;
  subfamilyName: string;
  previewFamily: string;
  previewLoaded: boolean;
  bytes: Uint8Array;
  characters: Set<number> | null;
  bold: boolean;
  italic: boolean;
  weight: number;
  fileName: string | null;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function formatBytes(value: number) {
  return value < 1024 * 1024 ? `${(value / 1024).toFixed(1)} KB` : `${(value / 1024 / 1024).toFixed(1)} MB`;
}

function hex(r: number, g: number, b: number) {
  return `#${[r, g, b].map((v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('')}`;
}

function rgb(hexColor: string) {
  const value = hexColor.replace('#', '').padEnd(6, '0').slice(0, 6);
  return {
    r: parseInt(value.slice(0, 2), 16) / 255,
    g: parseInt(value.slice(2, 4), 16) / 255,
    b: parseInt(value.slice(4, 6), 16) / 255,
  };
}

function detectFontWeight(...values: Array<string | number | null | undefined>) {
  const numeric = values.find((value) => typeof value === 'number' && Number.isFinite(value)) as number | undefined;
  if (numeric != null) return clamp(Math.round(numeric / 100) * 100, 100, 900);
  const value = values.filter(Boolean).join(' ').toLowerCase();
  if (/thin|hairline/.test(value)) return 100;
  if (/extralight|ultralight/.test(value)) return 200;
  if (/light/.test(value)) return 300;
  if (/semibold|demibold|demi/.test(value)) return 600;
  if (/extrabold|ultrabold/.test(value)) return 800;
  if (/black|heavy/.test(value)) return 900;
  if (/bold/.test(value)) return 700;
  if (/medium/.test(value)) return 500;
  return 400;
}

function normalizeRotation(value: number) {
  if (!Number.isFinite(value)) return 0;
  let result = ((value + 180) % 360 + 360) % 360 - 180;
  const snapped = Math.round(result / 90) * 90;
  if (Math.abs(result - snapped) < 1.2) result = snapped;
  return Number(result.toFixed(2));
}

function inferFont(fontName = '', family = '') {
  const value = `${fontName} ${family}`.toLowerCase();
  let resolved = 'Arial';
  if (value.includes('calibri')) resolved = 'Calibri';
  else if (value.includes('georgia')) resolved = 'Georgia';
  else if (value.includes('courier') || value.includes('mono')) resolved = 'Courier New';
  else if (value.includes('verdana')) resolved = 'Verdana';
  else if (value.includes('helvetica')) resolved = 'Helvetica';
  else if (value.includes('arial') || value.includes('sans-serif') || value.includes('sans serif')) resolved = 'Arial';
  else if (value.includes('times') || /(^|[^-])serif/.test(value)) resolved = 'Times New Roman';
  const weight = detectFontWeight(value);
  return {
    family: resolved,
    bold: weight >= 600,
    italic: /italic|oblique/.test(value),
    weight,
  };
}

function cleanFontLabel(value = '') {
  return value
    .replace(/^['\"]|['\"]$/g, '')
    .replace(/^[A-Z]{6}\+/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeFontIdentity(value = '') {
  return cleanFontLabel(value)
    .toLowerCase()
    .replace(/(?:regular|normal|roman|book|medium)$/g, '')
    .replace(/[^a-z0-9]+/g, '');
}

function detectedFontName(...values: Array<string | null | undefined>) {
  const generic = new Set(['serif', 'sans-serif', 'sans serif', 'monospace', 'cursive', 'fantasy', 'system-ui']);
  for (const value of values) {
    const cleaned = cleanFontLabel(value || '');
    if (!cleaned || generic.has(cleaned.toLowerCase()) || /^g_d\d+_f\d+$/i.test(cleaned)) continue;
    return cleaned;
  }
  return cleanFontLabel(values.find(Boolean) || '') || 'Unknown font';
}

function toFontBytes(value: unknown): Uint8Array | null {
  if (value instanceof Uint8Array) return new Uint8Array(value);
  if (value instanceof ArrayBuffer) return new Uint8Array(value.slice(0));
  if (ArrayBuffer.isView(value)) {
    const view = value as ArrayBufferView;
    return new Uint8Array(view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength));
  }
  return null;
}

function fontSupportsText(asset: FontAsset, text: string) {
  if (!asset.characters?.size) return true;
  for (const character of text) {
    if (/\s/.test(character)) continue;
    const codePoint = character.codePointAt(0);
    if (codePoint != null && !asset.characters.has(codePoint)) return false;
  }
  return true;
}

async function createFontAsset(
  bytes: Uint8Array,
  kind: FontAsset['kind'],
  id: string,
  hintedName = '',
  fileName: string | null = null,
): Promise<FontAsset | null> {
  try {
    const fontkitModule = await import('@pdf-lib/fontkit');
    const fontkit = fontkitModule.default as any;
    const parsed = fontkit.create(bytes);
    const family = detectedFontName(parsed.familyName, parsed.fullName, parsed.postscriptName, hintedName) || 'Custom font';
    const fullName = cleanFontLabel(parsed.fullName || family);
    const postscriptName = cleanFontLabel(parsed.postscriptName || '');
    const subfamilyName = cleanFontLabel(parsed.subfamilyName || '');
    const styleIdentity = `${fullName} ${postscriptName} ${subfamilyName}`.toLowerCase();
    const previewFamily = `DOC321-${id.replace(/[^a-zA-Z0-9_-]/g, '-')}`;
    let previewLoaded = false;
    try {
      const faceBytes = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
      const face = new FontFace(previewFamily, faceBytes);
      await face.load();
      document.fonts.add(face);
      previewLoaded = true;
    } catch {
      previewLoaded = false;
    }
    return {
      id,
      kind,
      family,
      fullName,
      postscriptName,
      subfamilyName,
      previewFamily,
      previewLoaded,
      bytes,
      characters: Array.isArray(parsed.characterSet) ? new Set<number>(parsed.characterSet) : null,
      bold: detectFontWeight(styleIdentity) >= 600,
      italic: /italic|oblique/.test(styleIdentity),
      weight: detectFontWeight(styleIdentity),
      fileName,
    };
  } catch {
    return null;
  }
}

function changed(box: TextBox) {
  return box.isNew
    || box.text !== box.originalText
    || box.fontFamily !== box.originalFontFamily
    || Math.abs(box.fontSize - box.originalFontSize) > 0.05
    || box.bold !== box.originalBold
    || box.italic !== box.originalItalic
    || box.fontAssetId !== box.originalFontAssetId
    || box.fontWeight !== box.originalFontWeight
    || box.align !== box.originalAlign
    || Math.abs(box.letterSpacing - box.originalLetterSpacing) > 0.02
    || Math.abs(box.lineHeight - box.originalLineHeight) > 0.02
    || Math.abs(box.rotation - box.originalRotation) > 0.02
    || box.color !== box.originalColor
    || Math.abs(box.x - box.originalX) > 0.05
    || Math.abs(box.top - box.originalTop) > 0.05
    || Math.abs(box.width - box.originalWidth) > 0.05
    || Math.abs(box.height - box.originalHeight) > 0.05;
}

function clonePages(pages: PageModel[]) {
  return pages.map((page) => ({ ...page, boxes: page.boxes.map((box) => ({ ...box })) }));
}

function fontKey(box: TextBox) {
  const family = box.fontFamily.toLowerCase();
  const bold = box.fontWeight >= 600 || box.bold;
  if (family.includes('times') || family.includes('georgia')) return `TimesRoman${bold ? 'Bold' : ''}${box.italic ? 'Italic' : ''}`;
  if (family.includes('courier')) return `Courier${bold ? 'Bold' : ''}${box.italic ? 'Oblique' : ''}`;
  return `Helvetica${bold ? 'Bold' : ''}${box.italic ? 'Oblique' : ''}`;
}

function pdfTextWidth(text: string, font: any, size: number, letterSpacing = 0) {
  const glyphWidth = font.widthOfTextAtSize(text, size);
  const gaps = Math.max(0, Array.from(text).length - 1);
  return glyphWidth + gaps * letterSpacing;
}

function fitSingleLineFontSize(text: string, font: any, size: number, maxWidth: number, letterSpacing = 0) {
  if (!text.trim() || text.includes('\n')) return size;
  const measured = pdfTextWidth(text, font, size, letterSpacing);
  if (!Number.isFinite(measured) || measured <= maxWidth) return size;
  const spacingWidth = Math.max(0, Array.from(text).length - 1) * letterSpacing;
  const glyphWidth = Math.max(1, measured - spacingWidth);
  const targetGlyphWidth = Math.max(1, maxWidth - spacingWidth);
  return clamp(size * (targetGlyphWidth / glyphWidth) * 0.985, 4, size);
}

function wrapText(text: string, font: any, size: number, maxWidth: number, letterSpacing = 0) {
  const lines: string[] = [];
  for (const raw of text.replace(/\r/g, '').split('\n')) {
    const words = raw.split(/\s+/).filter(Boolean);
    if (!words.length) {
      lines.push('');
      continue;
    }
    let line = words[0];
    for (let index = 1; index < words.length; index += 1) {
      const candidate = `${line} ${words[index]}`;
      if (pdfTextWidth(candidate, font, size, letterSpacing) <= maxWidth) line = candidate;
      else {
        lines.push(line);
        line = words[index];
      }
    }
    lines.push(line);
  }
  return lines;
}

function alignedOffset(align: TextAlign, maxWidth: number, lineWidth: number, isLastLine: boolean) {
  if (align === 'center') return Math.max(0, (maxWidth - lineWidth) / 2);
  if (align === 'right') return Math.max(0, maxWidth - lineWidth);
  if (align === 'justify' && !isLastLine) return 0;
  return 0;
}

function drawAlignedLine(
  pdfPage: any,
  line: string,
  font: any,
  size: number,
  originX: number,
  originY: number,
  maxWidth: number,
  align: TextAlign,
  letterSpacing: number,
  color: any,
  rotation: number,
  isLastLine: boolean,
  degrees: (angle: number) => any,
) {
  if (!line) return;
  const characters = Array.from(line);
  const baseWidth = pdfTextWidth(line, font, size, letterSpacing);
  const spaceCount = characters.filter((character) => character === ' ').length;
  const justifyExtra = align === 'justify' && !isLastLine && spaceCount > 0 && baseWidth < maxWidth
    ? (maxWidth - baseWidth) / spaceCount
    : 0;
  const effectiveWidth = justifyExtra ? maxWidth : baseWidth;
  const offset = alignedOffset(align, maxWidth, effectiveWidth, isLastLine);
  const pdfAngle = -rotation;
  const radians = pdfAngle * Math.PI / 180;
  const directionX = Math.cos(radians);
  const directionY = Math.sin(radians);
  let cursorX = originX + offset * directionX;
  let cursorY = originY + offset * directionY;

  if (Math.abs(letterSpacing) < 0.01 && justifyExtra === 0) {
    pdfPage.drawText(line, { x: cursorX, y: cursorY, size, font, color, rotate: degrees(pdfAngle) });
    return;
  }

  characters.forEach((character, index) => {
    pdfPage.drawText(character, { x: cursorX, y: cursorY, size, font, color, rotate: degrees(pdfAngle) });
    const advance = font.widthOfTextAtSize(character, size)
      + (index < characters.length - 1 ? letterSpacing : 0)
      + (character === ' ' ? justifyExtra : 0);
    cursorX += advance * directionX;
    cursorY += advance * directionY;
  });
}

async function renderCanvas(page: any, scale: number) {
  const viewport = page.getViewport({ scale });
  const canvas = window.document.createElement('canvas');
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  const context = canvas.getContext('2d', { alpha: false });
  if (!context) throw new Error('Could not create a PDF canvas.');
  context.fillStyle = '#fff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvasContext: context, viewport }).promise;
  return canvas;
}

function makeThumbnail(source: HTMLCanvasElement) {
  const width = 108;
  const height = Math.max(60, Math.round(source.height * (width / source.width)));
  const canvas = window.document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d', { alpha: false });
  if (!context) return '';
  context.fillStyle = '#fff';
  context.fillRect(0, 0, width, height);
  context.drawImage(source, 0, 0, width, height);
  const result = canvas.toDataURL('image/jpeg', 0.72);
  canvas.width = 0;
  canvas.height = 0;
  return result;
}

function sampleColors(canvas: HTMLCanvasElement, x: number, top: number, width: number, height: number, scale: number) {
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
}

function sampleBackgroundRing(canvas: HTMLCanvasElement, x: number, top: number, width: number, height: number, scale: number) {
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return '#ffffff';
  const innerLeft = clamp(Math.floor(x * scale), 0, canvas.width - 1);
  const innerTop = clamp(Math.floor(top * scale), 0, canvas.height - 1);
  const innerRight = clamp(Math.ceil((x + width) * scale), innerLeft + 1, canvas.width);
  const innerBottom = clamp(Math.ceil((top + height) * scale), innerTop + 1, canvas.height);
  const pad = Math.max(3, Math.round(scale * 3));
  const left = clamp(innerLeft - pad, 0, canvas.width - 1);
  const y = clamp(innerTop - pad, 0, canvas.height - 1);
  const right = clamp(innerRight + pad, left + 1, canvas.width);
  const bottom = clamp(innerBottom + pad, y + 1, canvas.height);
  const image = context.getImageData(left, y, right - left, bottom - y).data;
  const pixels: Array<[number, number, number]> = [];
  const w = right - left;
  const h = bottom - y;
  const step = Math.max(1, Math.floor(Math.min(w, h) / 12));
  for (let py = 0; py < h; py += step) {
    for (let px = 0; px < w; px += step) {
      const absoluteX = left + px;
      const absoluteY = y + py;
      if (absoluteX >= innerLeft && absoluteX < innerRight && absoluteY >= innerTop && absoluteY < innerBottom) continue;
      const index = (py * w + px) * 4;
      pixels.push([image[index], image[index + 1], image[index + 2]]);
    }
  }
  if (!pixels.length) return '#ffffff';
  const channelMedian = (channel: 0 | 1 | 2) => {
    const values = pixels.map((pixel) => pixel[channel]).sort((a, b) => a - b);
    return values[Math.floor(values.length / 2)];
  };
  return hex(channelMedian(0), channelMedian(1), channelMedian(2));
}

function toOcrWord(word: any): OcrWord | null {
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

function toOcrLine(line: any): OcrLine | null {
  const words: OcrWord[] = (line?.words || [])
    .map((word: any) => toOcrWord(word))
    .filter((word: OcrWord | null): word is OcrWord => Boolean(word && word.text.trim() && word.confidence >= 18));
  if (!words.length) return null;
  words.sort((a, b) => a.bbox.x0 - b.bbox.x0);
  const text = words.map((word) => word.text.trim()).filter(Boolean).join(' ');
  if (!text) return null;
  const weights = words.map((word) => Math.max(1, word.text.trim().length));
  const totalWeight = weights.reduce((sum, value) => sum + value, 0);
  const confidence = words.reduce((sum, word, index) => sum + word.confidence * weights[index], 0) / Math.max(1, totalWeight);
  const heights = words.map((word) => word.bbox.y1 - word.bbox.y0).sort((a, b) => a - b);
  const baseline = line?.baseline;
  const baselineY = Number.isFinite(baseline?.y0) ? baseline.y0 : Number.isFinite(baseline?.y1) ? baseline.y1 : null;
  return {
    text,
    confidence,
    x0: Math.min(...words.map((word) => word.bbox.x0)),
    y0: Math.min(...words.map((word) => word.bbox.y0)),
    x1: Math.max(...words.map((word) => word.bbox.x1)),
    y1: Math.max(...words.map((word) => word.bbox.y1)),
    glyphHeight: heights[Math.floor(heights.length / 2)] || 1,
    fontName: dominantFontName(words),
    baselineY,
  };
}

function extractOcrLines(blocks: any[] | null | undefined): OcrLine[] {
  if (!Array.isArray(blocks)) return [];
  const lines: OcrLine[] = [];
  for (const block of blocks) {
    for (const paragraph of block?.paragraphs || []) {
      for (const line of paragraph?.lines || []) {
        const parsed = toOcrLine(line);
        if (parsed) lines.push(parsed);
      }
    }
  }
  return lines;
}

function detectParagraphAlignment(lines: Array<{ x0: number; x1: number }>): TextAlign {
  if (lines.length < 2) return 'left';
  const left = Math.min(...lines.map((line) => line.x0));
  const right = Math.max(...lines.map((line) => line.x1));
  const width = Math.max(1, right - left);
  const leftMargins = lines.map((line) => line.x0 - left);
  const rightMargins = lines.map((line) => right - line.x1);
  const mean = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length);
  const meanLeft = mean(leftMargins);
  const meanRight = mean(rightMargins);
  const fillRatios = lines.slice(0, -1).map((line) => (line.x1 - line.x0) / width);
  if (fillRatios.length && mean(fillRatios) > 0.88 && lines[lines.length - 1].x1 - lines[lines.length - 1].x0 < width * 0.82) return 'justify';
  if (Math.abs(meanLeft - meanRight) < width * 0.05 && meanLeft > width * 0.04) return 'center';
  if (meanRight < width * 0.035 && meanLeft > width * 0.06) return 'right';
  return 'left';
}

function extractOcrParagraphs(blocks: any[] | null | undefined): OcrParagraph[] {
  if (!Array.isArray(blocks)) return [];
  const paragraphs: OcrParagraph[] = [];
  for (const block of blocks) {
    for (const paragraph of block?.paragraphs || []) {
      const lines: OcrLine[] = (paragraph?.lines || []).map((line: any) => toOcrLine(line)).filter((line: OcrLine | null): line is OcrLine => Boolean(line));
      if (!lines.length) continue;
      lines.sort((a, b) => a.y0 - b.y0 || a.x0 - b.x0);
      const text = lines.map((line) => line.text).join('\n');
      const weights = lines.map((line) => Math.max(1, line.text.length));
      const totalWeight = weights.reduce((sum, value) => sum + value, 0);
      const confidence = lines.reduce((sum, line, index) => sum + line.confidence * weights[index], 0) / Math.max(1, totalWeight);
      const glyphHeights = lines.map((line) => line.glyphHeight).sort((a, b) => a - b);
      const glyphHeight = glyphHeights[Math.floor(glyphHeights.length / 2)] || 1;
      const lineGaps = lines.slice(1).map((line, index) => Math.max(1, line.y0 - lines[index].y0)).sort((a, b) => a - b);
      const lineHeight = lineGaps.length ? clamp((lineGaps[Math.floor(lineGaps.length / 2)] || glyphHeight * 1.18) / glyphHeight, 0.85, 2.5) : 1.08;
      const first = lines[0];
      const baselineOffset = first.baselineY != null ? clamp(first.baselineY - first.y0, glyphHeight * 0.55, glyphHeight * 1.35) : glyphHeight * 0.82;
      const fontCounts = new Map<string, number>();
      lines.forEach((line) => {
        if (!line.fontName) return;
        fontCounts.set(line.fontName, (fontCounts.get(line.fontName) || 0) + line.text.length);
      });
      const fontName = [...fontCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || '';
      paragraphs.push({
        lines,
        text,
        confidence,
        x0: Math.min(...lines.map((line) => line.x0)),
        y0: Math.min(...lines.map((line) => line.y0)),
        x1: Math.max(...lines.map((line) => line.x1)),
        y1: Math.max(...lines.map((line) => line.y1)),
        glyphHeight,
        fontName,
        align: detectParagraphAlignment(lines),
        lineHeight,
        baselineOffset,
      });
    }
  }
  return paragraphs;
}

function estimateOcrFontSize(line: OcrLine, width: number, family: string, bold: boolean, italic: boolean) {
  const glyphHeight = Math.max(1, line.glyphHeight / OCR_SCALE);
  const heightEstimate = clamp(glyphHeight * 1.08, 6, 72);
  if (typeof window === 'undefined' || !line.text.trim() || width <= 0) return heightEstimate;
  const canvas = window.document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) return heightEstimate;
  context.font = (italic ? 'italic ' : '') + (bold ? '700 ' : '400 ') + '100px "' + family + '", Arial, sans-serif';
  const measured = context.measureText(line.text.replace(/\s+/g, ' ')).width;
  canvas.width = 0;
  canvas.height = 0;
  if (!Number.isFinite(measured) || measured <= 0) return heightEstimate;
  const widthEstimate = clamp((width / measured) * 100, 4, 96);
  if (widthEstimate < heightEstimate * 0.58 || widthEstimate > heightEstimate * 1.65) return heightEstimate;
  return clamp(heightEstimate * 0.62 + widthEstimate * 0.38, 6, 72);
}

function estimateLetterSpacing(text: string, width: number, fontSize: number, family: string, weight: number, italic: boolean) {
  const characters = Array.from(text.replace(/\s+/g, ' ').trim());
  if (typeof window === 'undefined' || characters.length < 2 || width <= 0) return 0;
  const canvas = window.document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) return 0;
  context.font = `${italic ? 'italic ' : ''}${weight} ${fontSize}px "${family}", Arial, sans-serif`;
  const measured = context.measureText(characters.join('')).width;
  canvas.width = 0;
  canvas.height = 0;
  if (!Number.isFinite(measured)) return 0;
  return clamp((width - measured) / Math.max(1, characters.length - 1), -2.5, 8);
}

function compatibleNativeStyle(a: TextBox, b: TextBox) {
  return a.fontAssetId === b.fontAssetId
    && normalizeFontIdentity(a.detectedFontName) === normalizeFontIdentity(b.detectedFontName)
    && Math.abs(a.fontSize - b.fontSize) <= Math.max(0.8, Math.min(a.fontSize, b.fontSize) * 0.12)
    && Math.abs(a.fontWeight - b.fontWeight) <= 100
    && a.italic === b.italic
    && Math.abs(a.rotation - b.rotation) < 1.5;
}

function mergeNativeLine(parts: TextBox[]) {
  const sorted = [...parts].sort((a, b) => a.x - b.x);
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  let text = first.text;
  for (let index = 1; index < sorted.length; index += 1) {
    const previous = sorted[index - 1];
    const current = sorted[index];
    const gap = current.x - (previous.x + previous.width);
    const needsSpace = gap > Math.max(0.7, first.fontSize * 0.18) && !/\s$/.test(text) && !/^\s/.test(current.text);
    text += `${needsSpace ? ' ' : ''}${current.text}`;
  }
  const x = first.x;
  const top = Math.min(...sorted.map((box) => box.top));
  const right = Math.max(...sorted.map((box) => box.x + box.width));
  const bottom = Math.max(...sorted.map((box) => box.top + box.height));
  const totalChars = sorted.reduce((sum, box) => sum + Math.max(1, box.text.length), 0);
  const letterSpacing = sorted.reduce((sum, box) => sum + box.letterSpacing * Math.max(1, box.text.length), 0) / Math.max(1, totalChars);
  return {
    ...first,
    id: `${first.id}-line`,
    text,
    originalText: text,
    x,
    top,
    width: Math.max(8, right - x),
    height: Math.max(6, bottom - top),
    originalX: x,
    originalTop: top,
    originalWidth: Math.max(8, right - x),
    originalHeight: Math.max(6, bottom - top),
    letterSpacing,
    originalLetterSpacing: letterSpacing,
    baselineOffset: first.baselineOffset + (first.top - top),
    originalBaselineOffset: first.baselineOffset + (first.top - top),
  } satisfies TextBox;
}

function mergeNativeParagraph(lines: TextBox[]) {
  const sorted = [...lines].sort((a, b) => a.top - b.top || a.x - b.x);
  const first = sorted[0];
  const x = Math.min(...sorted.map((line) => line.x));
  const top = Math.min(...sorted.map((line) => line.top));
  const right = Math.max(...sorted.map((line) => line.x + line.width));
  const bottom = Math.max(...sorted.map((line) => line.top + line.height));
  const lineSteps = sorted.slice(1).map((line, index) => line.top - sorted[index].top).filter((value) => value > 1).sort((a, b) => a - b);
  const lineHeight = lineSteps.length ? clamp((lineSteps[Math.floor(lineSteps.length / 2)] || first.fontSize * 1.18) / first.fontSize, 0.85, 2.5) : first.lineHeight;
  const geometry = sorted.map((line) => ({ x0: line.x, x1: line.x + line.width }));
  const align = detectParagraphAlignment(geometry);
  const totalChars = sorted.reduce((sum, line) => sum + Math.max(1, line.text.length), 0);
  const letterSpacing = sorted.reduce((sum, line) => sum + line.letterSpacing * Math.max(1, line.text.length), 0) / Math.max(1, totalChars);
  const text = sorted.map((line) => line.text).join('\n');
  return {
    ...first,
    id: `${first.id}-paragraph`,
    text,
    originalText: text,
    x,
    top,
    width: Math.max(8, right - x),
    height: Math.max(6, bottom - top),
    originalX: x,
    originalTop: top,
    originalWidth: Math.max(8, right - x),
    originalHeight: Math.max(6, bottom - top),
    align,
    originalAlign: align,
    letterSpacing,
    originalLetterSpacing: letterSpacing,
    lineHeight,
    originalLineHeight: lineHeight,
    baselineOffset: first.baselineOffset + (first.top - top),
    originalBaselineOffset: first.baselineOffset + (first.top - top),
  } satisfies TextBox;
}

function groupNativeParagraphBoxes(boxes: TextBox[]) {
  const rotated = boxes.filter((box) => Math.abs(box.rotation) > 3);
  const horizontal = boxes.filter((box) => Math.abs(box.rotation) <= 3).sort((a, b) => a.top - b.top || a.x - b.x);
  const rawLines: TextBox[][] = [];
  for (const box of horizontal) {
    const current = rawLines[rawLines.length - 1];
    const reference = current?.[0];
    if (current && reference && compatibleNativeStyle(reference, box) && Math.abs(reference.top - box.top) <= Math.max(2, reference.fontSize * 0.42)) {
      current.push(box);
    } else {
      rawLines.push([box]);
    }
  }

  const lineBoxes: TextBox[] = [];
  rawLines.forEach((parts) => {
    const sorted = [...parts].sort((a, b) => a.x - b.x);
    let segment: TextBox[] = [];
    const flush = () => {
      if (segment.length) lineBoxes.push(mergeNativeLine(segment));
      segment = [];
    };
    sorted.forEach((part) => {
      const previous = segment[segment.length - 1];
      const gap = previous ? part.x - (previous.x + previous.width) : 0;
      if (previous && gap > Math.max(28, previous.fontSize * 3.2)) flush();
      segment.push(part);
    });
    flush();
  });

  const paragraphGroups: TextBox[][] = [];
  for (const line of lineBoxes.sort((a, b) => a.top - b.top || a.x - b.x)) {
    let target: TextBox[] | null = null;
    for (let index = paragraphGroups.length - 1; index >= 0; index -= 1) {
      const group = paragraphGroups[index];
      const last = group[group.length - 1];
      const verticalGap = line.top - (last.top + last.height);
      if (verticalGap > Math.max(last.fontSize * 2.1, 22)) break;
      const overlap = Math.max(0, Math.min(line.x + line.width, last.x + last.width) - Math.max(line.x, last.x));
      const overlapRatio = overlap / Math.max(1, Math.min(line.width, last.width));
      const sameColumn = overlapRatio > 0.24 || Math.abs(line.x - last.x) <= Math.max(12, last.fontSize * 1.7);
      if (verticalGap >= -3 && sameColumn && compatibleNativeStyle(last, line)) {
        target = group;
        break;
      }
    }
    if (target) target.push(line);
    else paragraphGroups.push([line]);
  }

  return [...paragraphGroups.map((group) => mergeNativeParagraph(group)), ...rotated].sort((a, b) => a.top - b.top || a.x - b.x);
}

function estimateEditedBoxSize(box: TextBox, text: string, pageWidth: number, pageHeight: number) {
  const canvas = typeof window !== 'undefined' ? window.document.createElement('canvas') : null;
  const context = canvas?.getContext('2d') || null;
  if (context) context.font = `${box.italic ? 'italic ' : ''}${box.fontWeight} ${box.fontSize}px "${box.fontFamily}", Arial, sans-serif`;
  const measure = (value: string) => context ? context.measureText(value).width + Math.max(0, Array.from(value).length - 1) * box.letterSpacing : value.length * box.fontSize * 0.55;
  const explicit = text.replace(/\r/g, '').split('\n');
  let visualLines = 0;
  let widest = 0;
  explicit.forEach((line) => {
    const measured = measure(line || ' ');
    widest = Math.max(widest, measured);
    visualLines += Math.max(1, Math.ceil(measured / Math.max(12, box.width)));
  });
  if (canvas) { canvas.width = 0; canvas.height = 0; }
  const desiredHeight = clamp(Math.max(box.originalHeight, visualLines * box.fontSize * box.lineHeight + 3), 8, Math.max(8, pageHeight - box.top));
  const desiredWidth = box.isNew && explicit.length === 1
    ? clamp(Math.max(box.width, widest + 6), 12, Math.max(12, pageWidth - box.x))
    : box.width;
  return { width: desiredWidth, height: desiredHeight };
}

export function PdfEditorWorkspace({ toolId }: { toolId: string }) {
  const fileInput = useRef<HTMLInputElement>(null);
  const fontInput = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pdfRef = useRef<any>(null);
  const renderToken = useRef(0);
  const pagesRef = useRef<PageModel[]>([]);
  const fontAssetsRef = useRef<Map<string, FontAsset>>(new Map());
  const textEditSnapshot = useRef<PageModel[] | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PageModel[]>([]);
  const [pageNumber, setPageNumber] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [language, setLanguage] = useState('eng');
  const [zoom, setZoom] = useState(1);
  const [dragging, setDragging] = useState(false);
  const [undoStack, setUndoStack] = useState<PageModel[][]>([]);
  const [redoStack, setRedoStack] = useState<PageModel[][]>([]);
  const [customFonts, setCustomFonts] = useState<FontAsset[]>([]);
  const [status, setStatus] = useState('Choose or drop a PDF. DOC321 keeps the original page visible and only redraws regions you actually edit.');

  const page = pages.find((item) => item.pageNumber === pageNumber) || null;
  const selected = useMemo(() => page?.boxes.find((box) => box.id === selectedId) || null, [page, selectedId]);
  const selectedFontAsset = selected?.fontAssetId ? fontAssetsRef.current.get(selected.fontAssetId) || null : null;
  const originalFontAsset = selected?.originalFontAssetId ? fontAssetsRef.current.get(selected.originalFontAssetId) || null : null;
  const editCount = useMemo(() => pages.reduce((total, item) => total + item.boxes.filter(changed).length, 0), [pages]);
  const regionCount = useMemo(() => pages.reduce((total, item) => total + item.boxes.length, 0), [pages]);
  const cssScale = BASE_SCALE * zoom;

  async function loadCustomFont(next: File | null) {
    if (!next || busy) return;
    if (!/\.(?:ttf|otf|woff2?)$/i.test(next.name)) {
      setStatus('Choose a TTF, OTF, WOFF, or WOFF2 font file.');
      return;
    }
    if (next.size > MAX_CUSTOM_FONT_BYTES) {
      setStatus('That font is too large. Choose a font file under 12 MB.');
      return;
    }
    const targetId = selected?.id || null;
    try {
      const bytes = new Uint8Array(await next.arrayBuffer());
      const asset = await createFontAsset(bytes, 'custom', `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, next.name.replace(/\.[^.]+$/, ''), next.name);
      if (!asset) throw new Error('DOC321 could not read that font file.');
      fontAssetsRef.current.set(asset.id, asset);
      setCustomFonts((current) => [...current.filter((item) => item.id !== asset.id), asset]);
      if (targetId) {
        patchBox(targetId, {
          fontAssetId: asset.id,
          fontFamily: asset.previewLoaded ? asset.previewFamily : inferFont(asset.fullName, asset.family).family,
          bold: asset.weight >= 600,
          italic: asset.italic,
          fontWeight: asset.weight,
        });
      }
      setStatus(`Loaded ${asset.fullName || asset.family}. It will be embedded directly into edited PDF text${targetId ? ' for the selected region' : ''}.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'DOC321 could not load that font.');
    } finally {
      if (fontInput.current) fontInput.current.value = '';
    }
  }

  function applyFontChoice(value: string) {
    if (!selected) return;
    if (value.startsWith('asset:')) {
      const asset = fontAssetsRef.current.get(value.slice(6));
      if (!asset) return;
      patchBox(selected.id, {
        fontAssetId: asset.id,
        fontFamily: asset.previewLoaded ? asset.previewFamily : inferFont(asset.fullName, asset.family).family,
        bold: asset.weight >= 600,
        italic: asset.italic,
        fontWeight: asset.weight,
      });
      return;
    }
    patchBox(selected.id, { fontAssetId: null, fontFamily: value });
  }

  async function resolveEmbeddedFontAsset(pdfPage: any, pageIndex: number, fontName: string, style: any) {
    const key = `embedded-${fontName}`;
    const cached = fontAssetsRef.current.get(key);
    if (cached) return cached;
    try {
      const fontObject = pdfPage.commonObjs?.get?.(fontName);
      const bytes = toFontBytes(fontObject?.data);
      if (!bytes?.byteLength) return null;
      const hinted = detectedFontName(fontObject?.name, fontObject?.cssFontInfo?.fontFamily, style?.fontFamily, fontName);
      const asset = await createFontAsset(bytes, 'embedded', key, hinted);
      if (!asset) return null;
      fontAssetsRef.current.set(asset.id, asset);
      return asset;
    } catch {
      return null;
    }
  }

  function setPagesNow(next: PageModel[]) {
    pagesRef.current = next;
    setPages(next);
  }

  function remember(snapshot: PageModel[]) {
    setUndoStack((current) => [...current.slice(-(HISTORY_LIMIT - 1)), clonePages(snapshot)]);
    setRedoStack([]);
  }

  function replacePages(next: PageModel[], withHistory = true) {
    if (withHistory) remember(pagesRef.current);
    setPagesNow(next);
  }

  function patchBox(id: string, patch: Partial<TextBox>) {
    const current = pagesRef.current;
    const next = current.map((item) => item.pageNumber !== pageNumber ? item : {
      ...item,
      boxes: item.boxes.map((box) => box.id === id ? { ...box, ...patch } : box),
    });
    replacePages(next);
  }

  function commitText(id: string, text: string) {
    const current = pagesRef.current;
    const pageModel = current.find((item) => item.pageNumber === pageNumber);
    const currentBox = pageModel?.boxes.find((box) => box.id === id);
    if (!currentBox || currentBox.text === text || !pageModel) {
      textEditSnapshot.current = null;
      return;
    }
    const fitted = estimateEditedBoxSize(currentBox, text, pageModel.width, pageModel.height);
    const snapshot = textEditSnapshot.current || clonePages(current);
    const next = current.map((item) => item.pageNumber !== pageNumber ? item : {
      ...item,
      boxes: item.boxes.map((box) => box.id === id ? { ...box, text, ...fitted } : box),
    });
    setUndoStack((history) => [...history.slice(-(HISTORY_LIMIT - 1)), clonePages(snapshot)]);
    setRedoStack([]);
    setPagesNow(next);
    textEditSnapshot.current = null;
  }

  function undo() {
    const previous = undoStack[undoStack.length - 1];
    if (!previous) return;
    setRedoStack((current) => [...current.slice(-(HISTORY_LIMIT - 1)), clonePages(pagesRef.current)]);
    setUndoStack((current) => current.slice(0, -1));
    setPagesNow(clonePages(previous));
    setSelectedId(null);
    setStatus('Undid the last edit.');
  }

  function redo() {
    const nextState = redoStack[redoStack.length - 1];
    if (!nextState) return;
    setUndoStack((current) => [...current.slice(-(HISTORY_LIMIT - 1)), clonePages(pagesRef.current)]);
    setRedoStack((current) => current.slice(0, -1));
    setPagesNow(clonePages(nextState));
    setSelectedId(null);
    setStatus('Redid the edit.');
  }

  function resetSelected() {
    if (!selected) return;
    if (selected.isNew) {
      const next = pagesRef.current.map((item) => item.pageNumber !== pageNumber ? item : { ...item, boxes: item.boxes.filter((box) => box.id !== selected.id) });
      replacePages(next);
      setSelectedId(null);
      return;
    }
    patchBox(selected.id, {
      text: selected.originalText,
      x: selected.originalX,
      top: selected.originalTop,
      width: selected.originalWidth,
      height: selected.originalHeight,
      fontFamily: selected.originalFontFamily,
      fontSize: selected.originalFontSize,
      bold: selected.originalBold,
      italic: selected.originalItalic,
      fontAssetId: selected.originalFontAssetId,
      fontWeight: selected.originalFontWeight,
      align: selected.originalAlign,
      letterSpacing: selected.originalLetterSpacing,
      lineHeight: selected.originalLineHeight,
      rotation: selected.originalRotation,
      baselineOffset: selected.originalBaselineOffset,
      color: selected.originalColor,
    });
  }

  function addText() {
    if (!page || busy) return;
    const id = `added-${pageNumber}-${Date.now()}`;
    const x = Math.min(56, Math.max(18, page.width * 0.08));
    const top = Math.min(70, Math.max(18, page.height * 0.08));
    const box: TextBox = {
      id,
      page: pageNumber,
      text: 'Type text',
      originalText: '',
      x,
      top,
      width: Math.min(220, Math.max(120, page.width - x - 24)),
      height: 24,
      originalX: x,
      originalTop: top,
      originalWidth: Math.min(220, Math.max(120, page.width - x - 24)),
      originalHeight: 24,
      fontFamily: 'Arial',
      originalFontFamily: 'Arial',
      fontSize: 12,
      originalFontSize: 12,
      bold: false,
      originalBold: false,
      italic: false,
      originalItalic: false,
      detectedFontName: 'Arial',
      fontAssetId: null,
      originalFontAssetId: null,
      fontWeight: 400,
      originalFontWeight: 400,
      align: 'left',
      originalAlign: 'left',
      letterSpacing: 0,
      originalLetterSpacing: 0,
      lineHeight: 1.18,
      originalLineHeight: 1.18,
      rotation: 0,
      originalRotation: 0,
      baselineOffset: 12,
      originalBaselineOffset: 12,
      color: '#202124',
      originalColor: '#202124',
      background: '#ffffff',
      source: 'added',
      confidence: null,
      isNew: true,
    };
    const next = pagesRef.current.map((item) => item.pageNumber !== pageNumber ? item : { ...item, boxes: [...item.boxes, box] });
    replacePages(next);
    setSelectedId(id);
    setStatus('Added a new text region. Edit the text and position controls, then export the PDF.');
  }

  function deleteSelected() {
    if (!selected) return;
    if (selected.isNew) {
      const next = pagesRef.current.map((item) => item.pageNumber !== pageNumber ? item : { ...item, boxes: item.boxes.filter((box) => box.id !== selected.id) });
      replacePages(next);
      setSelectedId(null);
    } else {
      patchBox(selected.id, { text: '' });
    }
  }

  useEffect(() => () => {
    pdfRef.current?.destroy?.();
  }, []);

  async function drawPage(pageNo: number) {
    const pdf = pdfRef.current;
    const canvas = canvasRef.current;
    const model = pagesRef.current.find((item) => item.pageNumber === pageNo);
    if (!pdf || !canvas || !model) return;
    const token = ++renderToken.current;
    const pdfPage = await pdf.getPage(pageNo);
    const dpr = Math.min(2, Math.max(1, window.devicePixelRatio || 1));
    const viewport = pdfPage.getViewport({ scale: cssScale * dpr });
    if (token !== renderToken.current) return;
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    canvas.style.width = `${model.width * cssScale}px`;
    canvas.style.height = `${model.height * cssScale}px`;
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) return;
    context.fillStyle = '#fff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    await pdfPage.render({ canvasContext: context, viewport }).promise;
  }

  useEffect(() => {
    if (file && page) void drawPage(pageNumber);
  }, [file, pageNumber, zoom, pages.length]);

  async function analyze(pdf: any) {
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
    const models: PageModel[] = [];
    let worker: any = null;
    try {
      for (let pageIndex = 1; pageIndex <= pdf.numPages; pageIndex += 1) {
        setStatus(`Analyzing page ${pageIndex} of ${pdf.numPages}...`);
        setProgress(Math.round(((pageIndex - 1) / pdf.numPages) * 100));
        const pdfPage = await pdf.getPage(pageIndex);
        const viewport = pdfPage.getViewport({ scale: 1 });
        const textContent: any = await pdfPage.getTextContent();
        const items = textContent.items.filter((item: any) => typeof item.str === 'string' && item.str.trim());
        const charCount = items.reduce((sum: number, item: any) => sum + item.str.trim().length, 0);
        const hasNativeText = items.length > 0 && charCount >= 3;
        const sampleScale = hasNativeText ? SAMPLE_SCALE : OCR_SCALE;
        const sample = await renderCanvas(pdfPage, sampleScale);
        const thumbnail = makeThumbnail(sample);

        if (hasNativeText) {
          await pdfPage.getOperatorList().catch(() => undefined);
          const embeddedAssets = new Map<string, FontAsset | null>();
          for (const fontName of new Set<string>(items.map((item: any) => item.fontName).filter(Boolean))) {
            const style = (textContent.styles as Record<string, any>)[fontName] || {};
            embeddedAssets.set(fontName, await resolveEmbeddedFontAsset(pdfPage, pageIndex, fontName, style));
          }
          const rawBoxes: TextBox[] = items.map((item: any, index: number) => {
            const tx = pdfjs.Util.transform(viewport.transform, item.transform);
            const fontSize = Math.max(4, Math.hypot(tx[2], tx[3]));
            const rotation = normalizeRotation(Math.atan2(tx[1], tx[0]) * 180 / Math.PI);
            const style = (textContent.styles as Record<string, any>)[item.fontName] || {};
            const embeddedAsset = embeddedAssets.get(item.fontName) || null;
            const sourceName = detectedFontName(embeddedAsset?.fullName, embeddedAsset?.family, style.fontFamily, item.fontName);
            const meta = inferFont(sourceName, style.fontFamily);
            const fontWeight = embeddedAsset?.weight ?? meta.weight;
            const x = clamp(tx[4], 0, viewport.width);
            const top = clamp(tx[5] - fontSize, 0, viewport.height);
            const width = clamp(Math.max(Math.abs(item.width || 0), fontSize * 0.45), 6, Math.max(6, viewport.width - x));
            const height = clamp(fontSize * 1.12, 6, Math.max(6, viewport.height - top));
            const sampled = sampleColors(sample, x, top, width, height, sampleScale);
            const letterSpacing = estimateLetterSpacing(item.str, width, fontSize, embeddedAsset?.previewLoaded ? embeddedAsset.previewFamily : meta.family, fontWeight, embeddedAsset?.italic ?? meta.italic);
            return {
              id: `native-${pageIndex}-${index}`,
              page: pageIndex,
              text: item.str,
              originalText: item.str,
              x,
              top,
              width,
              height,
              originalX: x,
              originalTop: top,
              originalWidth: width,
              originalHeight: height,
              fontFamily: embeddedAsset?.previewLoaded ? embeddedAsset.previewFamily : meta.family,
              originalFontFamily: embeddedAsset?.previewLoaded ? embeddedAsset.previewFamily : meta.family,
              fontSize,
              originalFontSize: fontSize,
              bold: fontWeight >= 600,
              originalBold: fontWeight >= 600,
              italic: embeddedAsset?.italic ?? meta.italic,
              originalItalic: embeddedAsset?.italic ?? meta.italic,
              detectedFontName: sourceName,
              fontAssetId: embeddedAsset?.id || null,
              originalFontAssetId: embeddedAsset?.id || null,
              fontWeight,
              originalFontWeight: fontWeight,
              align: 'left',
              originalAlign: 'left',
              letterSpacing,
              originalLetterSpacing: letterSpacing,
              lineHeight: 1.18,
              originalLineHeight: 1.18,
              rotation,
              originalRotation: rotation,
              baselineOffset: fontSize,
              originalBaselineOffset: fontSize,
              color: sampled.color,
              originalColor: sampled.color,
              background: sampled.background,
              source: 'native' as const,
              confidence: 100,
              isNew: false,
            };
          });
          const boxes = groupNativeParagraphBoxes(rawBoxes).map((box) => ({
            ...box,
            background: sampleBackgroundRing(sample, box.originalX, box.originalTop, box.originalWidth, box.originalHeight, sampleScale),
          }));
          models.push({ pageNumber: pageIndex, width: viewport.width, height: viewport.height, source: 'native', confidence: 100, thumbnail, boxes });
        } else {
          if (!worker) {
            const tesseract = await import('tesseract.js');
            worker = await tesseract.createWorker(language, 1, {
              logger: (message: { status?: string; progress?: number }) => {
                if (message.status?.includes('recognizing') && typeof message.progress === 'number') {
                  setProgress(Math.min(99, Math.round((((pageIndex - 1) + message.progress) / pdf.numPages) * 100)));
                }
              },
            });
            await worker.setParameters?.({ preserve_interword_spaces: '1' });
          }
          // Tesseract.js 6+ returns only plain text by default. Request the
          // structured blocks output explicitly so scanned PDFs keep word
          // boxes, confidence values and font metadata for editable regions.
          const recognized = await worker.recognize(sample, {}, { blocks: true });
          const paragraphs = extractOcrParagraphs(recognized.data.blocks);
          const boxes: TextBox[] = paragraphs.map((paragraph, index) => {
            const x = paragraph.x0 / OCR_SCALE;
            const top = paragraph.y0 / OCR_SCALE;
            const width = Math.max(8, (paragraph.x1 - paragraph.x0) / OCR_SCALE);
            const rawHeight = Math.max(6, (paragraph.y1 - paragraph.y0) / OCR_SCALE);
            const representative = paragraph.lines[0];
            const meta = inferFont(paragraph.fontName);
            const size = estimateOcrFontSize(representative, Math.max(8, (representative.x1 - representative.x0) / OCR_SCALE), meta.family, meta.bold, meta.italic);
            const height = Math.max(rawHeight * 1.08, paragraph.lines.length * size * paragraph.lineHeight);
            const sampled = sampleColors(sample, x, top, width, rawHeight, OCR_SCALE);
            const background = sampleBackgroundRing(sample, x, top, width, rawHeight, OCR_SCALE);
            return {
              id: `ocr-${pageIndex}-${index}`,
              page: pageIndex,
              text: paragraph.text,
              originalText: paragraph.text,
              x,
              top,
              width,
              height,
              originalX: x,
              originalTop: top,
              originalWidth: width,
              originalHeight: height,
              fontFamily: meta.family,
              originalFontFamily: meta.family,
              fontSize: size,
              originalFontSize: size,
              bold: meta.weight >= 600,
              originalBold: meta.weight >= 600,
              italic: meta.italic,
              originalItalic: meta.italic,
              detectedFontName: detectedFontName(paragraph.fontName, meta.family),
              fontAssetId: null,
              originalFontAssetId: null,
              fontWeight: meta.weight,
              originalFontWeight: meta.weight,
              align: paragraph.align,
              originalAlign: paragraph.align,
              letterSpacing: 0,
              originalLetterSpacing: 0,
              lineHeight: paragraph.lineHeight,
              originalLineHeight: paragraph.lineHeight,
              rotation: 0,
              originalRotation: 0,
              baselineOffset: paragraph.baselineOffset / OCR_SCALE,
              originalBaselineOffset: paragraph.baselineOffset / OCR_SCALE,
              color: sampled.color,
              originalColor: sampled.color,
              background,
              source: 'ocr' as const,
              confidence: paragraph.confidence,
              isNew: false,
            };
          });
          models.push({
            pageNumber: pageIndex,
            width: viewport.width,
            height: viewport.height,
            source: 'ocr',
            confidence: typeof recognized.data.confidence === 'number' ? recognized.data.confidence : null,
            thumbnail,
            boxes,
          });
        }
        sample.width = 0;
        sample.height = 0;
      }
      setProgress(100);
      return models;
    } finally {
      await worker?.terminate?.().catch(() => undefined);
    }
  }

  async function chooseFile(next: File | null) {
    if (!next || busy) return;
    if (!(next.type === 'application/pdf' || /\.pdf$/i.test(next.name))) {
      setStatus('Please choose a PDF file.');
      return;
    }
    setBusy(true);
    setPagesNow([]);
    fontAssetsRef.current = new Map();
    setCustomFonts([]);
    setUndoStack([]);
    setRedoStack([]);
    setSelectedId(null);
    setPageNumber(1);
    setZoom(1);
    setProgress(0);
    setStatus('Opening PDF...');
    try {
      pdfRef.current?.destroy?.();
      const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
      const pdf = await pdfjs.getDocument({ data: new Uint8Array(await next.arrayBuffer()) }).promise;
      pdfRef.current = pdf;
      setFile(next);
      const models = await analyze(pdf);
      setPagesNow(models);
      const nativePages = models.filter((item) => item.source === 'native').length;
      const ocrPages = models.length - nativePages;
      const regions = models.reduce((total, item) => total + item.boxes.length, 0);
      setStatus(`Ready. ${nativePages} page${nativePages === 1 ? '' : 's'} used embedded PDF text, ${ocrPages} used OCR, and ${regions} editable text region${regions === 1 ? '' : 's'} were found.`);
      trackToolEvent('tool_start', {
        toolId,
        fileType: 'pdf',
        metadata: { mode: 'source-preserving-smart-edit', pageCount: pdf.numPages, nativePages, ocrPages, regions },
      });
    } catch (error) {
      pdfRef.current?.destroy?.();
      pdfRef.current = null;
      setFile(null);
      setPagesNow([]);
      setStatus(error instanceof Error ? error.message : 'Could not analyze this PDF.');
    } finally {
      setBusy(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  }

  async function exportPdf() {
    if (!file || busy) return;
    const currentPages = pagesRef.current;
    const edits = currentPages.flatMap((item) => item.boxes.filter(changed));
    if (!edits.length) {
      setStatus('Make a text edit or add text first.');
      return;
    }
    setBusy(true);
    setStatus(`Applying ${edits.length} edited region${edits.length === 1 ? '' : 's'}...`);
    try {
      const pdfLib = await import('pdf-lib');
      const pdfDocument = await pdfLib.PDFDocument.load(new Uint8Array(await file.arrayBuffer()));
      const fonts = new Map<string, any>();
      const needsCustomEmbedding = edits.some((box) => box.fontAssetId && fontAssetsRef.current.has(box.fontAssetId));
      if (needsCustomEmbedding) {
        const fontkitModule = await import('@pdf-lib/fontkit');
        pdfDocument.registerFontkit(fontkitModule.default as any);
      }
      let embeddedFontRegions = 0;
      let fallbackFontRegions = 0;
      for (const box of edits) {
        const pdfPage = pdfDocument.getPage(box.page - 1);
        const pageWidth = pdfPage.getWidth();
        const pageHeight = pdfPage.getHeight();

        if (!box.isNew) {
          const coverPad = Math.max(1.5, box.originalFontSize * 0.09);
          const coverX = clamp(box.originalX - coverPad, 0, pageWidth);
          const coverTop = clamp(box.originalTop - coverPad, 0, pageHeight);
          const coverWidth = clamp(box.originalWidth + coverPad * 2, 1, Math.max(1, pageWidth - coverX));
          const coverHeight = clamp(Math.max(box.originalHeight + coverPad * 2, box.originalFontSize * 1.25), 1, Math.max(1, pageHeight - coverTop));
          const bg = rgb(box.background);
          pdfPage.drawRectangle({
            x: coverX,
            y: pageHeight - coverTop - coverHeight,
            width: coverWidth,
            height: coverHeight,
            color: pdfLib.rgb(bg.r, bg.g, bg.b),
            borderWidth: 0,
          });
        }

        if (!box.text.trim()) continue;
        let font: any = null;
        const asset = box.fontAssetId ? fontAssetsRef.current.get(box.fontAssetId) || null : null;
        if (asset && fontSupportsText(asset, box.text)) {
          const assetKey = `asset:${asset.id}`;
          font = fonts.get(assetKey);
          if (!font) {
            try {
              font = await pdfDocument.embedFont(asset.bytes, { subset: true });
              fonts.set(assetKey, font);
            } catch {
              font = null;
            }
          }
          if (font) embeddedFontRegions += 1;
        }
        if (!font) {
          if (asset) fallbackFontRegions += 1;
          const key = fontKey(box);
          font = fonts.get(key);
          if (!font) {
            const standard = pdfLib.StandardFonts as unknown as Record<string, string>;
            font = await pdfDocument.embedFont(standard[key] || standard.Helvetica);
            fonts.set(key, font);
          }
        }
        const maxWidth = Math.max(8, box.width);
        let size = clamp(box.fontSize, 4, 96);
        const singleLineRegion = !box.originalText.includes('\n') && box.originalHeight <= box.originalFontSize * 1.7;
        if (singleLineRegion) size = fitSingleLineFontSize(box.text, font, size, maxWidth, box.letterSpacing);
        let lines = singleLineRegion && !box.text.includes('\n') ? [box.text] : wrapText(box.text, font, size, maxWidth, box.letterSpacing);
        let lineHeight = size * box.lineHeight;
        while (size > 5 && lines.length * lineHeight > Math.max(box.height, size * 1.2)) {
          size -= 0.5;
          lines = singleLineRegion && !box.text.includes('\n') ? [box.text] : wrapText(box.text, font, size, maxWidth, box.letterSpacing);
          lineHeight = size * box.lineHeight;
        }
        const fg = rgb(box.color);
        const scaleRatio = size / Math.max(1, box.fontSize);
        const baselineOffset = clamp(box.baselineOffset * scaleRatio, size * 0.62, size * 1.35);
        const baseline = pageHeight - box.top - baselineOffset;
        lines.forEach((line, index) => {
          if (!line) return;
          drawAlignedLine(
            pdfPage,
            line,
            font,
            size,
            clamp(box.x, 0, pageWidth),
            baseline - index * lineHeight,
            maxWidth,
            box.align,
            box.letterSpacing,
            pdfLib.rgb(fg.r, fg.g, fg.b),
            box.rotation,
            index === lines.length - 1,
            pdfLib.degrees,
          );
        });
      }
      const bytes = await pdfDocument.save();
      const buffer = new ArrayBuffer(bytes.byteLength);
      new Uint8Array(buffer).set(bytes);
      const url = URL.createObjectURL(new Blob([buffer], { type: 'application/pdf' }));
      const anchor = window.document.createElement('a');
      anchor.href = url;
      anchor.download = `${file.name.replace(/\.pdf$/i, '') || 'document'}-edited.pdf`;
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 2500);
      setStatus(`Done. Downloaded an edited copy with ${edits.length} changed region${edits.length === 1 ? '' : 's'}.${embeddedFontRegions ? ` Embedded original/custom fonts in ${embeddedFontRegions} region${embeddedFontRegions === 1 ? '' : 's'}.` : ''}${fallbackFontRegions ? ` ${fallbackFontRegions} region${fallbackFontRegions === 1 ? '' : 's'} used a safe fallback because the embedded font could not represent the replacement text.` : ''}`);
      trackToolEvent('tool_success', {
        toolId,
        fileType: 'pdf',
        outputType: 'pdf',
        metadata: { mode: 'source-preserving-smart-edit', edits: edits.length },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not create the edited PDF.';
      setStatus(message);
      trackToolEvent('tool_error', { toolId, fileType: 'pdf', metadata: { mode: 'source-preserving-smart-edit', message } });
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    pdfRef.current?.destroy?.();
    pdfRef.current = null;
    setFile(null);
    setPagesNow([]);
    fontAssetsRef.current = new Map();
    setCustomFonts([]);
    setPageNumber(1);
    setSelectedId(null);
    setUndoStack([]);
    setRedoStack([]);
    setProgress(0);
    setZoom(1);
    setStatus('Choose or drop a PDF. DOC321 keeps the original page visible and only redraws regions you actually edit.');
    if (fileInput.current) fileInput.current.value = '';
  }

  const numberValue = (value: number | undefined, fallback: number) => Number((value ?? fallback).toFixed(1));

  return (
    <div className="pdf-editor-workspace smart-pdf-editor" data-pdf-editor-workspace="true">
      <style>{`
        .pdf-editor-workspace{display:grid;gap:12px;color:#202124}.spe-drop{border:2px dashed #cbd2dc;border-radius:18px;padding:22px;text-align:center;background:#f8fafd;transition:.15s border-color,.15s background}.spe-drop.dragging{border-color:#0b57d0;background:#eef4ff}.spe-drop>svg{width:42px;height:42px;color:#0b57d0}.spe-drop h2{margin:7px 0 4px;font-size:20px}.spe-drop p{margin:0 auto 13px;color:#5f6368;max-width:760px;line-height:1.45}.spe-note{font-size:11px;color:#6b7280;margin-top:10px}.spe-actions{display:flex;align-items:center;justify-content:center;gap:7px;flex-wrap:wrap}.spe-btn{border:1px solid #d4d9e1;background:#fff;border-radius:9px;padding:8px 11px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:6px;color:#202124;white-space:nowrap}.spe-btn.primary{background:#0b57d0;color:#fff;border-color:#0b57d0}.spe-btn.success{background:#137333;color:#fff;border-color:#137333}.spe-btn.active{background:#e8f0fe;border-color:#8ab4f8;color:#174ea6}.spe-btn.danger{color:#b3261e}.spe-btn:disabled{opacity:.42;cursor:not-allowed}.spe-select,.spe-number,.spe-color{height:34px;border:1px solid #cfd5dd;border-radius:8px;background:#fff;padding:0 8px;color:#202124}.spe-number{width:66px}.spe-number.small{width:58px}.spe-color{width:40px;padding:3px}.spe-file,.spe-nav,.spe-style,.spe-status,.spe-commandbar{display:flex;align-items:center;gap:8px;flex-wrap:wrap;border:1px solid #e0e3e7;border-radius:12px;padding:9px 11px;background:#fff}.spe-file,.spe-nav,.spe-commandbar{justify-content:space-between}.spe-file small{display:block;color:#5f6368;margin-top:2px}.spe-style label{font-size:10px;font-weight:800;color:#5f6368;text-transform:uppercase;letter-spacing:.04em}.spe-detail{margin-left:auto;color:#5f6368;font-size:11px}.spe-badge{display:inline-flex;align-items:center;gap:5px;padding:5px 8px;border-radius:999px;background:#f1f3f4;font-size:11px;font-weight:700}.spe-editor-shell{display:grid;grid-template-columns:132px minmax(0,1fr);gap:10px;min-height:520px}.spe-sidebar{overflow:auto;max-height:76vh;border:1px solid #dfe3e8;border-radius:12px;background:#f6f8fb;padding:8px;display:grid;align-content:start;gap:8px}.spe-thumb{border:1px solid transparent;border-radius:9px;background:transparent;padding:6px;cursor:pointer;text-align:center;color:#5f6368;font-size:11px}.spe-thumb img{display:block;width:100%;height:auto;border:1px solid #d6dbe2;background:#fff;box-shadow:0 1px 3px rgba(60,64,67,.12);margin-bottom:4px}.spe-thumb.active{border-color:#8ab4f8;background:#e8f0fe;color:#174ea6;font-weight:800}.spe-workspace{overflow:auto;max-height:76vh;background:#e9edf3;border:1px solid #dfe3e8;border-radius:12px;padding:20px}.spe-page{position:relative;margin:auto;background:#fff;box-shadow:0 5px 24px rgba(60,64,67,.22);transform-origin:top left}.spe-page canvas,.spe-layer{position:absolute;inset:0}.spe-erase{position:absolute;pointer-events:none;box-sizing:border-box}.spe-box{position:absolute;box-sizing:border-box;padding:0 1px;border:1px solid transparent;outline:0;white-space:pre-wrap;line-height:1.05;cursor:text;overflow:visible;caret-color:#0b57d0}.spe-box:hover{border-color:rgba(11,87,208,.5)}.spe-box[data-selected='true']{border:1.5px solid #0b57d0;box-shadow:0 0 0 2px rgba(11,87,208,.12);z-index:3}.spe-box[data-changed='true']:not([data-selected='true']){border-color:rgba(19,115,51,.45)}.spe-status{font-size:12px;color:#5f6368}.spe-progress{height:7px;border-radius:999px;background:#e8eaed;overflow:hidden;flex:1;min-width:180px}.spe-progress span{display:block;height:100%;background:#0b57d0}.spe-zoom{font-size:11px;font-weight:800;color:#5f6368;min-width:42px;text-align:center}@media(max-width:850px){.spe-editor-shell{grid-template-columns:96px minmax(0,1fr)}.spe-workspace{padding:10px}.spe-style{overflow-x:auto;flex-wrap:nowrap}.spe-detail{display:none}}@media(max-width:620px){.spe-drop{padding:17px 10px}.spe-file,.spe-nav,.spe-commandbar{align-items:flex-start;flex-direction:column}.spe-editor-shell{grid-template-columns:1fr}.spe-sidebar{display:flex;max-height:none;overflow-x:auto}.spe-thumb{min-width:76px;width:76px}.spe-workspace{max-height:68vh;padding:7px}.spe-style{border-radius:10px}.spe-status{align-items:flex-start}.spe-progress{min-width:120px}}
      `}</style>

      <input
        ref={fileInput}
        hidden
        type="file"
        accept="application/pdf,.pdf"
        onChange={(event) => void chooseFile(event.target.files?.[0] || null)}
      />
      <input
        ref={fontInput}
        hidden
        type="file"
        accept=".ttf,.otf,.woff,.woff2,font/ttf,font/otf,font/woff,font/woff2"
        onChange={(event) => void loadCustomFont(event.target.files?.[0] || null)}
      />

      <div
        className={`spe-drop ${dragging ? 'dragging' : ''}`}
        onDragEnter={(event) => { event.preventDefault(); setDragging(true); }}
        onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
        onDragLeave={(event) => { event.preventDefault(); if (event.currentTarget === event.target) setDragging(false); }}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          void chooseFile(event.dataTransfer.files?.[0] || null);
        }}
      >
        <ScanText />
        <h2>Edit PDF text accurately</h2>
        <p>Open a digital or scanned PDF. DOC321 reads embedded text first, falls back to high-resolution OCR when needed, and keeps the original page rendering untouched until you edit a specific text region.</p>
        <div className="spe-actions">
          <select className="spe-select" value={language} disabled={busy || Boolean(file)} onChange={(event) => setLanguage(event.target.value)}>
            <option value="eng">English OCR</option>
            <option value="fra">French OCR</option>
            <option value="spa">Spanish OCR</option>
            <option value="deu">German OCR</option>
            <option value="hin">Hindi OCR</option>
          </select>
          <button className="spe-btn primary" type="button" disabled={busy} onClick={() => { if (fileInput.current) { fileInput.current.value = ''; fileInput.current.click(); } }}>
            <FileUp size={16} />{file ? 'Choose another PDF' : 'Choose PDF'}
          </button>
        </div>
        <div className="spe-note">You can also drag and drop a PDF here. Scanned pages use OCR; digital pages use their embedded text geometry for better placement and sizing.</div>
      </div>

      {busy && progress < 100 ? (
        <div className="spe-status" aria-live="polite">
          <LoaderCircle size={16} />
          <span>{status}</span>
          <div className="spe-progress"><span style={{ width: `${progress}%` }} /></div>
          <strong>{progress}%</strong>
        </div>
      ) : null}

      {file ? (
        <>
          <div className="spe-file">
            <div>
              <strong>{file.name}</strong>
              <small>{formatBytes(file.size)} · {pages.length || '...'} pages · {regionCount} detected regions · {editCount} changed</small>
            </div>
            <div className="spe-actions">
              <button className="spe-btn" type="button" onClick={reset} disabled={busy}><Trash2 size={15} />Close PDF</button>
              <button className="spe-btn success" type="button" onClick={() => void exportPdf()} disabled={busy || editCount === 0}><Download size={15} />Download edited PDF</button>
            </div>
          </div>

          {page ? (
            <>
              <div className="spe-commandbar">
                <div className="spe-actions">
                  <button className="spe-btn" type="button" disabled={busy || undoStack.length === 0} onClick={undo}>Undo</button>
                  <button className="spe-btn" type="button" disabled={busy || redoStack.length === 0} onClick={redo}>Redo</button>
                  <button className="spe-btn" type="button" disabled={busy} onClick={addText}>Add text</button>
                  <button className="spe-btn danger" type="button" disabled={busy || !selected} onClick={deleteSelected}>Delete text</button>
                </div>
                <div className="spe-actions">
                  <button className="spe-btn" type="button" disabled={busy || zoom <= 0.6} onClick={() => setZoom((value) => clamp(Number((value - 0.1).toFixed(1)), 0.6, 2))}>−</button>
                  <span className="spe-zoom">{Math.round(zoom * 100)}%</span>
                  <button className="spe-btn" type="button" disabled={busy || zoom >= 2} onClick={() => setZoom((value) => clamp(Number((value + 0.1).toFixed(1)), 0.6, 2))}>+</button>
                </div>
              </div>

              <div className="spe-nav">
                <div className="spe-actions">
                  <button className="spe-btn" type="button" disabled={busy || pageNumber <= 1} onClick={() => { setSelectedId(null); setPageNumber((value) => value - 1); }}><ChevronLeft size={15} />Previous</button>
                  <strong>Page {pageNumber} of {pages.length}</strong>
                  <button className="spe-btn" type="button" disabled={busy || pageNumber >= pages.length} onClick={() => { setSelectedId(null); setPageNumber((value) => value + 1); }}>Next<ChevronRight size={15} /></button>
                </div>
                <span className="spe-badge"><FileSearch size={14} />{page.source === 'native' ? 'Embedded PDF text' : 'OCR'}{page.confidence != null ? ` · ${Math.round(page.confidence)}%` : ''}</span>
              </div>

              <div className="spe-style">
                <label>Font</label>
                <select
                  className="spe-select"
                  disabled={!selected}
                  value={selected?.fontAssetId ? `asset:${selected.fontAssetId}` : selected?.fontFamily || 'Arial'}
                  onChange={(event) => applyFontChoice(event.target.value)}
                >
                  {originalFontAsset ? <option value={`asset:${originalFontAsset.id}`}>Original · {originalFontAsset.fullName || originalFontAsset.family}</option> : null}
                  {FONT_CHOICES.map((font) => <option key={font} value={font}>{font}</option>)}
                  {customFonts.map((font) => <option key={font.id} value={`asset:${font.id}`}>Embedded · {font.fullName || font.family}</option>)}
                </select>
                <button className="spe-btn" type="button" disabled={busy} onClick={() => { if (fontInput.current) { fontInput.current.value = ''; fontInput.current.click(); } }}><FileUp size={14} />Load font</button>
                <label>Size</label>
                <input className="spe-number small" disabled={!selected} type="number" min="4" max="96" step="0.5" value={numberValue(selected?.fontSize, 12)} onChange={(event) => selected && patchBox(selected.id, { fontSize: clamp(Number(event.target.value) || selected.fontSize, 4, 96) })} />
                <button className={`spe-btn ${selected && selected.fontWeight >= 600 ? 'active' : ''}`} type="button" disabled={!selected || Boolean(selectedFontAsset)} title={selectedFontAsset ? 'Weight comes from the embedded font file.' : undefined} onClick={() => selected && patchBox(selected.id, { fontWeight: selected.fontWeight >= 600 ? 400 : 700, bold: selected.fontWeight < 600 })}><Bold size={15} /></button>
                <button className={`spe-btn ${selected?.italic ? 'active' : ''}`} type="button" disabled={!selected || Boolean(selectedFontAsset)} title={selectedFontAsset ? 'Style comes from the embedded font file.' : undefined} onClick={() => selected && patchBox(selected.id, { italic: !selected.italic })}><Italic size={15} /></button>
                <label>Weight</label>
                <select className="spe-select" disabled={!selected || Boolean(selectedFontAsset)} value={selected?.fontWeight || 400} onChange={(event) => selected && patchBox(selected.id, { fontWeight: Number(event.target.value), bold: Number(event.target.value) >= 600 })}>
                  <option value={300}>Light</option><option value={400}>Regular</option><option value={500}>Medium</option><option value={600}>Semibold</option><option value={700}>Bold</option><option value={800}>Heavy</option>
                </select>
                <label>Align</label>
                <select className="spe-select" disabled={!selected} value={selected?.align || 'left'} onChange={(event) => selected && patchBox(selected.id, { align: event.target.value as TextAlign })}>
                  <option value="left">Left</option><option value="center">Center</option><option value="right">Right</option><option value="justify">Justify</option>
                </select>
                <label>Line</label>
                <input className="spe-number small" disabled={!selected} type="number" min="0.8" max="3" step="0.05" value={numberValue(selected?.lineHeight, 1.18)} onChange={(event) => selected && patchBox(selected.id, { lineHeight: clamp(Number(event.target.value) || selected.lineHeight, 0.8, 3) })} />
                <label>Spacing</label>
                <input className="spe-number small" disabled={!selected} type="number" min="-3" max="12" step="0.1" value={numberValue(selected?.letterSpacing, 0)} onChange={(event) => selected && patchBox(selected.id, { letterSpacing: clamp(Number(event.target.value) || 0, -3, 12) })} />
                <label>Rotate</label>
                <input className="spe-number small" disabled={!selected} type="number" min="-180" max="180" step="1" value={numberValue(selected?.rotation, 0)} onChange={(event) => selected && patchBox(selected.id, { rotation: normalizeRotation(Number(event.target.value) || 0) })} />
                <label>Color</label>
                <input className="spe-color" disabled={!selected} type="color" value={selected?.color || '#202124'} onChange={(event) => selected && patchBox(selected.id, { color: event.target.value })} />
                <label>X</label>
                <input className="spe-number small" disabled={!selected} type="number" min="0" step="1" value={numberValue(selected?.x, 0)} onChange={(event) => selected && patchBox(selected.id, { x: clamp(Number(event.target.value) || 0, 0, page.width) })} />
                <label>Y</label>
                <input className="spe-number small" disabled={!selected} type="number" min="0" step="1" value={numberValue(selected?.top, 0)} onChange={(event) => selected && patchBox(selected.id, { top: clamp(Number(event.target.value) || 0, 0, page.height) })} />
                <label>W</label>
                <input className="spe-number small" disabled={!selected} type="number" min="8" step="1" value={numberValue(selected?.width, 80)} onChange={(event) => selected && patchBox(selected.id, { width: clamp(Number(event.target.value) || selected.width, 8, page.width) })} />
                <label>H</label>
                <input className="spe-number small" disabled={!selected} type="number" min="8" step="1" value={numberValue(selected?.height, 20)} onChange={(event) => selected && patchBox(selected.id, { height: clamp(Number(event.target.value) || selected.height, 8, page.height) })} />
                <button className="spe-btn" type="button" disabled={!selected || (!changed(selected) && !selected.isNew)} onClick={resetSelected}><RotateCcw size={15} />Reset region</button>
                <span className="spe-detail">{selected ? `${selected.source === 'native' ? 'PDF metadata' : selected.source === 'ocr' ? 'OCR estimate' : 'New text'}${selected.confidence != null ? ` · ${Math.round(selected.confidence)}%` : ''} · Detected: ${selected.detectedFontName}${selectedFontAsset ? ` · Embedded: ${selectedFontAsset.fullName || selectedFontAsset.family}` : ''}` : 'Click a text region to edit it'}</span>
              </div>

              <div className="spe-editor-shell">
                <aside className="spe-sidebar" aria-label="PDF pages">
                  {pages.map((item) => (
                    <button key={item.pageNumber} className={`spe-thumb ${item.pageNumber === pageNumber ? 'active' : ''}`} type="button" onClick={() => { setSelectedId(null); setPageNumber(item.pageNumber); }}>
                      {item.thumbnail ? <img src={item.thumbnail} alt="" /> : null}
                      Page {item.pageNumber}
                    </button>
                  ))}
                </aside>

                <div className="spe-workspace" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedId(null); }}>
                  <div className="spe-page" style={{ width: page.width * cssScale, height: page.height * cssScale }}>
                    <canvas ref={canvasRef} />
                    <div className="spe-layer">
                      {page.boxes.map((box) => {
                        const isSelected = selectedId === box.id;
                        const isChanged = changed(box);
                        const visible = isSelected || isChanged || box.isNew;
                        return (
                          <Fragment key={box.id}>
                            {visible && !box.isNew ? (
                              <div
                                className="spe-erase"
                                style={{
                                  left: (box.originalX - 1.5) * cssScale,
                                  top: (box.originalTop - 1.5) * cssScale,
                                  width: (box.originalWidth + 3) * cssScale,
                                  height: Math.max(box.originalHeight + 3, box.originalFontSize * 1.25) * cssScale,
                                  backgroundColor: box.background,
                                  transform: `rotate(${box.originalRotation}deg)`,
                                  transformOrigin: '0 0',
                                }}
                              />
                            ) : null}
                            <div
                              className="spe-box"
                              data-selected={isSelected ? 'true' : 'false'}
                              data-changed={isChanged ? 'true' : 'false'}
                              contentEditable
                              suppressContentEditableWarning
                              spellCheck
                              onFocus={() => {
                                setSelectedId(box.id);
                                textEditSnapshot.current = clonePages(pagesRef.current);
                              }}
                              onMouseDown={(event) => {
                                event.stopPropagation();
                                setSelectedId(box.id);
                              }}
                              onBlur={(event) => commitText(box.id, event.currentTarget.innerText.replace(/\n$/, ''))}
                              style={{
                                left: box.x * cssScale,
                                top: box.top * cssScale,
                                width: Math.max(12, box.width * cssScale),
                                minHeight: Math.max(8, box.height * cssScale),
                                fontFamily: `${box.fontFamily}, Arial, sans-serif`,
                                fontSize: box.fontSize * cssScale,
                                fontWeight: box.fontWeight,
                                fontStyle: box.italic ? 'italic' : 'normal',
                                lineHeight: box.lineHeight,
                                letterSpacing: `${box.letterSpacing * cssScale}px`,
                                textAlign: box.align,
                                transform: `rotate(${box.rotation}deg)`,
                                transformOrigin: '0 0',
                                color: visible ? box.color : 'transparent',
                                backgroundColor: visible ? box.background : 'transparent',
                              }}
                            >{box.text}</div>
                          </Fragment>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : null}

          <div className="spe-status"><span>{status}</span></div>
        </>
      ) : null}
    </div>
  );
}
