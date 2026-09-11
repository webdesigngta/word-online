from pathlib import Path
import re

workspace_path = Path('components/PdfEditorWorkspace.tsx')
qa_path = Path('qa/check-pdf-editor.mjs')
workspace = workspace_path.read_text()
qa = qa_path.read_text()

def replace_exact(source: str, before: str, after: str, label: str) -> str:
    if before not in source:
        raise RuntimeError(f'Could not find {label}')
    return source.replace(before, after, 1)

# --- Richer text layout model -------------------------------------------------
workspace = replace_exact(
    workspace,
    "type SourceKind = 'native' | 'ocr' | 'added';\n\ntype TextBox = {",
    "type SourceKind = 'native' | 'ocr' | 'added';\ntype TextAlign = 'left' | 'center' | 'right' | 'justify';\n\ntype TextBox = {",
    'TextAlign type',
)

workspace = replace_exact(
    workspace,
    "  fontAssetId: string | null;\n  originalFontAssetId: string | null;\n  color: string;",
    "  fontAssetId: string | null;\n  originalFontAssetId: string | null;\n  fontWeight: number;\n  originalFontWeight: number;\n  align: TextAlign;\n  originalAlign: TextAlign;\n  letterSpacing: number;\n  originalLetterSpacing: number;\n  lineHeight: number;\n  originalLineHeight: number;\n  rotation: number;\n  originalRotation: number;\n  baselineOffset: number;\n  originalBaselineOffset: number;\n  color: string;",
    'Phase 4 TextBox layout fields',
)

workspace = replace_exact(
    workspace,
    "  glyphHeight: number;\n  fontName: string;\n};\n\ntype FontAsset = {",
    "  glyphHeight: number;\n  fontName: string;\n  baselineY: number | null;\n};\n\ntype OcrParagraph = {\n  lines: OcrLine[];\n  text: string;\n  confidence: number;\n  x0: number;\n  y0: number;\n  x1: number;\n  y1: number;\n  glyphHeight: number;\n  fontName: string;\n  align: TextAlign;\n  lineHeight: number;\n  baselineOffset: number;\n};\n\ntype FontAsset = {",
    'OCR paragraph model',
)

workspace = replace_exact(
    workspace,
    "  bold: boolean;\n  italic: boolean;\n  fileName: string | null;",
    "  bold: boolean;\n  italic: boolean;\n  weight: number;\n  fileName: string | null;",
    'font asset weight',
)

# --- Weight, rotation and spacing helpers -------------------------------------
workspace = replace_exact(
    workspace,
    "function inferFont(fontName = '', family = '') {\n  const value = `${fontName} ${family}`.toLowerCase();",
    "function detectFontWeight(...values: Array<string | number | null | undefined>) {\n  const numeric = values.find((value) => typeof value === 'number' && Number.isFinite(value)) as number | undefined;\n  if (numeric != null) return clamp(Math.round(numeric / 100) * 100, 100, 900);\n  const value = values.filter(Boolean).join(' ').toLowerCase();\n  if (/thin|hairline/.test(value)) return 100;\n  if (/extralight|ultralight/.test(value)) return 200;\n  if (/light/.test(value)) return 300;\n  if (/semibold|demibold|demi/.test(value)) return 600;\n  if (/extrabold|ultrabold/.test(value)) return 800;\n  if (/black|heavy/.test(value)) return 900;\n  if (/bold/.test(value)) return 700;\n  if (/medium/.test(value)) return 500;\n  return 400;\n}\n\nfunction normalizeRotation(value: number) {\n  if (!Number.isFinite(value)) return 0;\n  let result = ((value + 180) % 360 + 360) % 360 - 180;\n  const snapped = Math.round(result / 90) * 90;\n  if (Math.abs(result - snapped) < 1.2) result = snapped;\n  return Number(result.toFixed(2));\n}\n\nfunction inferFont(fontName = '', family = '') {\n  const value = `${fontName} ${family}`.toLowerCase();",
    'font weight and rotation helpers',
)

workspace = replace_exact(
    workspace,
    "  return {\n    family: resolved,\n    bold: /bold|black|heavy|semibold|demi/.test(value),\n    italic: /italic|oblique/.test(value),\n  };",
    "  const weight = detectFontWeight(value);\n  return {\n    family: resolved,\n    bold: weight >= 600,\n    italic: /italic|oblique/.test(value),\n    weight,\n  };",
    'inferFont weight result',
)

workspace = replace_exact(
    workspace,
    "      bold: /bold|black|heavy|semibold|demi/.test(styleIdentity),\n      italic: /italic|oblique/.test(styleIdentity),\n      fileName,",
    "      bold: detectFontWeight(styleIdentity) >= 600,\n      italic: /italic|oblique/.test(styleIdentity),\n      weight: detectFontWeight(styleIdentity),\n      fileName,",
    'font asset weight metadata',
)

workspace = replace_exact(
    workspace,
    "    || box.fontAssetId !== box.originalFontAssetId\n    || box.color !== box.originalColor",
    "    || box.fontAssetId !== box.originalFontAssetId\n    || box.fontWeight !== box.originalFontWeight\n    || box.align !== box.originalAlign\n    || Math.abs(box.letterSpacing - box.originalLetterSpacing) > 0.02\n    || Math.abs(box.lineHeight - box.originalLineHeight) > 0.02\n    || Math.abs(box.rotation - box.originalRotation) > 0.02\n    || box.color !== box.originalColor",
    'layout change tracking',
)

workspace = replace_exact(
    workspace,
    "  if (family.includes('times') || family.includes('georgia')) return `TimesRoman${box.bold ? 'Bold' : ''}${box.italic ? 'Italic' : ''}`;\n  if (family.includes('courier')) return `Courier${box.bold ? 'Bold' : ''}${box.italic ? 'Oblique' : ''}`;\n  return `Helvetica${box.bold ? 'Bold' : ''}${box.italic ? 'Oblique' : ''}`;",
    "  const bold = box.fontWeight >= 600 || box.bold;\n  if (family.includes('times') || family.includes('georgia')) return `TimesRoman${bold ? 'Bold' : ''}${box.italic ? 'Italic' : ''}`;\n  if (family.includes('courier')) return `Courier${bold ? 'Bold' : ''}${box.italic ? 'Oblique' : ''}`;\n  return `Helvetica${bold ? 'Bold' : ''}${box.italic ? 'Oblique' : ''}`;",
    'standard font weight mapping',
)

old_measure = r'''function fitSingleLineFontSize(text: string, font: any, size: number, maxWidth: number) {
  if (!text.trim() || text.includes('\n')) return size;
  const measured = font.widthOfTextAtSize(text, size);
  if (!Number.isFinite(measured) || measured <= maxWidth) return size;
  return clamp(size * (maxWidth / measured) * 0.985, 4, size);
}

function wrapText(text: string, font: any, size: number, maxWidth: number) {
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
      if (font.widthOfTextAtSize(candidate, size) <= maxWidth) line = candidate;
      else {
        lines.push(line);
        line = words[index];
      }
    }
    lines.push(line);
  }
  return lines;
}
'''
new_measure = r'''function pdfTextWidth(text: string, font: any, size: number, letterSpacing = 0) {
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
'''
if old_measure not in workspace:
    raise RuntimeError('Could not find PDF measurement helpers')
workspace = workspace.replace(old_measure, new_measure, 1)

# --- Background ring sampling -------------------------------------------------
insert_after_colors = """  return {\n    color: strongest.length ? hex(...foreground) : '#202124',\n    background: hex(...background),\n  };\n}\n\nfunction toOcrWord"""
background_helper = r'''  return {
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

function toOcrWord'''
if insert_after_colors not in workspace:
    raise RuntimeError('Could not locate background helper insertion')
workspace = workspace.replace(insert_after_colors, background_helper, 1)

# --- OCR lines -> OCR paragraphs ---------------------------------------------
ocr_block_pattern = re.compile(r"function extractOcrLines\(blocks: any\[\] \| null \| undefined\): OcrLine\[\] \{.*?\n\}\n\nfunction estimateOcrFontSize", re.S)
ocr_match = ocr_block_pattern.search(workspace)
if not ocr_match:
    raise RuntimeError('Could not locate OCR line extraction block')
ocr_replacement = r'''function toOcrLine(line: any): OcrLine | null {
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
      const lines = (paragraph?.lines || []).map((line: any) => toOcrLine(line)).filter((line: OcrLine | null): line is OcrLine => Boolean(line));
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

function estimateOcrFontSize'''
workspace = workspace[:ocr_match.start()] + ocr_replacement + workspace[ocr_match.end():]

# --- Native paragraph grouping / auto sizing ---------------------------------
native_helpers_marker = "export function PdfEditorWorkspace({ toolId }: { toolId: string }) {"
native_helpers = r'''function estimateLetterSpacing(text: string, width: number, fontSize: number, family: string, weight: number, italic: boolean) {
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

'''
if native_helpers_marker not in workspace:
    raise RuntimeError('Could not locate native helper insertion point')
workspace = workspace.replace(native_helpers_marker, native_helpers + native_helpers_marker, 1)

# --- Component behavior -------------------------------------------------------
workspace = replace_exact(
    workspace,
    "          bold: asset.bold,\n          italic: asset.italic,",
    "          bold: asset.weight >= 600,\n          italic: asset.italic,\n          fontWeight: asset.weight,",
    'loaded custom font weight',
)
workspace = replace_exact(
    workspace,
    "        bold: asset.bold,\n        italic: asset.italic,",
    "        bold: asset.weight >= 600,\n        italic: asset.italic,\n        fontWeight: asset.weight,",
    'selected font weight',
)

old_commit = r'''    const currentBox = current.find((item) => item.pageNumber === pageNumber)?.boxes.find((box) => box.id === id);
    if (!currentBox || currentBox.text === text) {
      textEditSnapshot.current = null;
      return;
    }
    const snapshot = textEditSnapshot.current || clonePages(current);
    const next = current.map((item) => item.pageNumber !== pageNumber ? item : {
      ...item,
      boxes: item.boxes.map((box) => box.id === id ? { ...box, text } : box),
    });'''
new_commit = r'''    const pageModel = current.find((item) => item.pageNumber === pageNumber);
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
    });'''
if old_commit not in workspace:
    raise RuntimeError('Could not locate commitText block')
workspace = workspace.replace(old_commit, new_commit, 1)

workspace = replace_exact(
    workspace,
    "      fontAssetId: selected.originalFontAssetId,\n      color: selected.originalColor,",
    "      fontAssetId: selected.originalFontAssetId,\n      fontWeight: selected.originalFontWeight,\n      align: selected.originalAlign,\n      letterSpacing: selected.originalLetterSpacing,\n      lineHeight: selected.originalLineHeight,\n      rotation: selected.originalRotation,\n      baselineOffset: selected.originalBaselineOffset,\n      bold: selected.originalFontWeight >= 600,\n      color: selected.originalColor,",
    'reset Phase 4 layout',
)

workspace = replace_exact(
    workspace,
    "      fontAssetId: null,\n      originalFontAssetId: null,\n      color: '#202124',",
    "      fontAssetId: null,\n      originalFontAssetId: null,\n      fontWeight: 400,\n      originalFontWeight: 400,\n      align: 'left',\n      originalAlign: 'left',\n      letterSpacing: 0,\n      originalLetterSpacing: 0,\n      lineHeight: 1.18,\n      originalLineHeight: 1.18,\n      rotation: 0,\n      originalRotation: 0,\n      baselineOffset: 12,\n      originalBaselineOffset: 12,\n      color: '#202124',",
    'added text Phase 4 defaults',
)

# --- Native analysis ----------------------------------------------------------
workspace = replace_exact(
    workspace,
    "          const boxes: TextBox[] = items.map((item: any, index: number) => {\n            const tx = pdfjs.Util.transform(viewport.transform, item.transform);\n            const fontSize = Math.max(4, Math.hypot(tx[2], tx[3]));",
    "          const rawBoxes: TextBox[] = items.map((item: any, index: number) => {\n            const tx = pdfjs.Util.transform(viewport.transform, item.transform);\n            const fontSize = Math.max(4, Math.hypot(tx[2], tx[3]));\n            const rotation = normalizeRotation(Math.atan2(tx[1], tx[0]) * 180 / Math.PI);",
    'native rotation analysis',
)

workspace = replace_exact(
    workspace,
    "            const meta = inferFont(sourceName, style.fontFamily);\n            const x = clamp(tx[4], 0, viewport.width);",
    "            const meta = inferFont(sourceName, style.fontFamily);\n            const fontWeight = embeddedAsset?.weight ?? meta.weight;\n            const x = clamp(tx[4], 0, viewport.width);",
    'native weight metadata',
)

workspace = replace_exact(
    workspace,
    "            const sampled = sampleColors(sample, x, top, width, height, sampleScale);\n            return {",
    "            const sampled = sampleColors(sample, x, top, width, height, sampleScale);\n            const letterSpacing = estimateLetterSpacing(item.str, width, fontSize, embeddedAsset?.previewLoaded ? embeddedAsset.previewFamily : meta.family, fontWeight, embeddedAsset?.italic ?? meta.italic);\n            return {",
    'native letter spacing',
)

workspace = replace_exact(
    workspace,
    "              fontSize,\n              originalFontSize: fontSize,\n              bold: meta.bold,\n              originalBold: meta.bold,\n              italic: embeddedAsset?.italic ?? meta.italic,\n              originalItalic: embeddedAsset?.italic ?? meta.italic,\n              detectedFontName: sourceName,\n              fontAssetId: embeddedAsset?.id || null,\n              originalFontAssetId: embeddedAsset?.id || null,\n              color: sampled.color,",
    "              fontSize,\n              originalFontSize: fontSize,\n              bold: fontWeight >= 600,\n              originalBold: fontWeight >= 600,\n              italic: embeddedAsset?.italic ?? meta.italic,\n              originalItalic: embeddedAsset?.italic ?? meta.italic,\n              detectedFontName: sourceName,\n              fontAssetId: embeddedAsset?.id || null,\n              originalFontAssetId: embeddedAsset?.id || null,\n              fontWeight,\n              originalFontWeight: fontWeight,\n              align: 'left',\n              originalAlign: 'left',\n              letterSpacing,\n              originalLetterSpacing: letterSpacing,\n              lineHeight: 1.18,\n              originalLineHeight: 1.18,\n              rotation,\n              originalRotation: rotation,\n              baselineOffset: fontSize,\n              originalBaselineOffset: fontSize,\n              color: sampled.color,",
    'native Phase 4 fields',
)

workspace = replace_exact(
    workspace,
    "          });\n          models.push({ pageNumber: pageIndex, width: viewport.width, height: viewport.height, source: 'native', confidence: 100, thumbnail, boxes });",
    "          });\n          const boxes = groupNativeParagraphBoxes(rawBoxes).map((box) => ({\n            ...box,\n            background: sampleBackgroundRing(sample, box.originalX, box.originalTop, box.originalWidth, box.originalHeight, sampleScale),\n          }));\n          models.push({ pageNumber: pageIndex, width: viewport.width, height: viewport.height, source: 'native', confidence: 100, thumbnail, boxes });",
    'native paragraph grouping',
)

# --- OCR paragraph analysis ---------------------------------------------------
old_ocr_analysis = r'''          const recognized = await worker.recognize(sample, {}, { blocks: true });
          const lines = extractOcrLines(recognized.data.blocks);
          const boxes: TextBox[] = lines.map((line, index) => {
            const x = line.x0 / OCR_SCALE;
            const top = line.y0 / OCR_SCALE;
            const width = Math.max(8, (line.x1 - line.x0) / OCR_SCALE);
            const rawHeight = Math.max(6, (line.y1 - line.y0) / OCR_SCALE);
            const height = rawHeight * 1.14;
            const sampled = sampleColors(sample, x, top, width, rawHeight, OCR_SCALE);
            const meta = inferFont(line.fontName);
            const size = estimateOcrFontSize(line, width, meta.family, meta.bold, meta.italic);
            return {
              id: `ocr-${pageIndex}-${index}`,
              page: pageIndex,
              text: line.text,
              originalText: line.text,
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
              bold: meta.bold,
              originalBold: meta.bold,
              italic: meta.italic,
              originalItalic: meta.italic,
              detectedFontName: detectedFontName(line.fontName, meta.family),
              fontAssetId: null,
              originalFontAssetId: null,
              color: sampled.color,
              originalColor: sampled.color,
              background: sampled.background,
              source: 'ocr' as const,
              confidence: line.confidence,
              isNew: false,
            };
          });'''
new_ocr_analysis = r'''          const recognized = await worker.recognize(sample, {}, { blocks: true });
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
          });'''
if old_ocr_analysis not in workspace:
    raise RuntimeError('Could not locate OCR analysis block')
workspace = workspace.replace(old_ocr_analysis, new_ocr_analysis, 1)

# --- Export layout fidelity ---------------------------------------------------
workspace = replace_exact(
    workspace,
    "          const coverX = clamp(box.originalX - 1.5, 0, pageWidth);\n          const coverTop = clamp(box.originalTop - 1.5, 0, pageHeight);\n          const coverWidth = clamp(box.originalWidth + 3, 1, Math.max(1, pageWidth - coverX));\n          const coverHeight = clamp(Math.max(box.originalHeight + 3, box.originalFontSize * 1.25), 1, Math.max(1, pageHeight - coverTop));",
    "          const coverPad = Math.max(1.5, box.originalFontSize * 0.09);\n          const coverX = clamp(box.originalX - coverPad, 0, pageWidth);\n          const coverTop = clamp(box.originalTop - coverPad, 0, pageHeight);\n          const coverWidth = clamp(box.originalWidth + coverPad * 2, 1, Math.max(1, pageWidth - coverX));\n          const coverHeight = clamp(Math.max(box.originalHeight + coverPad * 2, box.originalFontSize * 1.25), 1, Math.max(1, pageHeight - coverTop));",
    'smarter export cover padding',
)

old_export_layout = r'''        const maxWidth = Math.max(8, box.width);
        let size = clamp(box.fontSize, 4, 96);
        size = fitSingleLineFontSize(box.text, font, size, maxWidth);
        let lines = box.text.includes('\n') ? wrapText(box.text, font, size, maxWidth) : [box.text];
        let lineHeight = box.source === 'ocr' ? size * 1.08 : size * 1.18;
        while (size > 5 && lines.length * lineHeight > Math.max(box.height * 2.6, size * 1.3)) {
          size -= 0.5;
          lines = box.text.includes('\n') ? wrapText(box.text, font, size, maxWidth) : [box.text];
          lineHeight = box.source === 'ocr' ? size * 1.08 : size * 1.18;
        }
        const fg = rgb(box.color);
        const baselineOffset = box.source === 'ocr'
          ? clamp(box.height * 0.82, size * 0.72, size * 1.02)
          : size;
        const baseline = pageHeight - box.top - baselineOffset;
        lines.forEach((line, index) => {
          if (!line) return;
          pdfPage.drawText(line, {
            x: clamp(box.x, 0, pageWidth),
            y: baseline - index * lineHeight,
            size,
            font,
            color: pdfLib.rgb(fg.r, fg.g, fg.b),
          });
        });'''
new_export_layout = r'''        const maxWidth = Math.max(8, box.width);
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
        });'''
if old_export_layout not in workspace:
    raise RuntimeError('Could not locate export layout block')
workspace = workspace.replace(old_export_layout, new_export_layout, 1)

# --- Controls ----------------------------------------------------------------
workspace = replace_exact(
    workspace,
    "                <button className={`spe-btn ${selected?.bold ? 'active' : ''}`} type=\"button\" disabled={!selected || Boolean(selectedFontAsset)} title={selectedFontAsset ? 'Weight comes from the embedded font file.' : undefined} onClick={() => selected && patchBox(selected.id, { bold: !selected.bold })}><Bold size={15} /></button>",
    "                <button className={`spe-btn ${selected && selected.fontWeight >= 600 ? 'active' : ''}`} type=\"button\" disabled={!selected || Boolean(selectedFontAsset)} title={selectedFontAsset ? 'Weight comes from the embedded font file.' : undefined} onClick={() => selected && patchBox(selected.id, { fontWeight: selected.fontWeight >= 600 ? 400 : 700, bold: selected.fontWeight < 600 })}><Bold size={15} /></button>",
    'bold weight control',
)

style_anchor = """                <label>Color</label>\n                <input className=\"spe-color\" disabled={!selected} type=\"color\" value={selected?.color || '#202124'} onChange={(event) => selected && patchBox(selected.id, { color: event.target.value })} />"""
style_controls = """                <label>Weight</label>\n                <select className=\"spe-select\" disabled={!selected || Boolean(selectedFontAsset)} value={selected?.fontWeight || 400} onChange={(event) => selected && patchBox(selected.id, { fontWeight: Number(event.target.value), bold: Number(event.target.value) >= 600 })}>\n                  <option value={300}>Light</option><option value={400}>Regular</option><option value={500}>Medium</option><option value={600}>Semibold</option><option value={700}>Bold</option><option value={800}>Heavy</option>\n                </select>\n                <label>Align</label>\n                <select className=\"spe-select\" disabled={!selected} value={selected?.align || 'left'} onChange={(event) => selected && patchBox(selected.id, { align: event.target.value as TextAlign })}>\n                  <option value=\"left\">Left</option><option value=\"center\">Center</option><option value=\"right\">Right</option><option value=\"justify\">Justify</option>\n                </select>\n                <label>Line</label>\n                <input className=\"spe-number small\" disabled={!selected} type=\"number\" min=\"0.8\" max=\"3\" step=\"0.05\" value={numberValue(selected?.lineHeight, 1.18)} onChange={(event) => selected && patchBox(selected.id, { lineHeight: clamp(Number(event.target.value) || selected.lineHeight, 0.8, 3) })} />\n                <label>Spacing</label>\n                <input className=\"spe-number small\" disabled={!selected} type=\"number\" min=\"-3\" max=\"12\" step=\"0.1\" value={numberValue(selected?.letterSpacing, 0)} onChange={(event) => selected && patchBox(selected.id, { letterSpacing: clamp(Number(event.target.value) || 0, -3, 12) })} />\n                <label>Rotate</label>\n                <input className=\"spe-number small\" disabled={!selected} type=\"number\" min=\"-180\" max=\"180\" step=\"1\" value={numberValue(selected?.rotation, 0)} onChange={(event) => selected && patchBox(selected.id, { rotation: normalizeRotation(Number(event.target.value) || 0) })} />\n                <label>Color</label>\n                <input className=\"spe-color\" disabled={!selected} type=\"color\" value={selected?.color || '#202124'} onChange={(event) => selected && patchBox(selected.id, { color: event.target.value })} />"""
if style_anchor not in workspace:
    raise RuntimeError('Could not locate style controls anchor')
workspace = workspace.replace(style_anchor, style_controls, 1)

# --- Preview fidelity ---------------------------------------------------------
workspace = replace_exact(
    workspace,
    "                                fontWeight: box.bold ? 700 : 400,\n                                fontStyle: box.italic ? 'italic' : 'normal',\n                                lineHeight: box.source === 'ocr' ? 1.08 : 1.05,\n                                color: visible ? box.color : 'transparent',",
    "                                fontWeight: box.fontWeight,\n                                fontStyle: box.italic ? 'italic' : 'normal',\n                                lineHeight: box.lineHeight,\n                                letterSpacing: `${box.letterSpacing * cssScale}px`,\n                                textAlign: box.align,\n                                transform: `rotate(${box.rotation}deg)`,\n                                transformOrigin: '0 0',\n                                color: visible ? box.color : 'transparent',",
    'preview layout fidelity styles',
)

workspace = replace_exact(
    workspace,
    "                                  backgroundColor: box.background,\n                                }}",
    "                                  backgroundColor: box.background,\n                                  transform: `rotate(${box.originalRotation}deg)`,\n                                  transformOrigin: '0 0',\n                                }}",
    'rotated erase preview',
)

# --- QA contract --------------------------------------------------------------
qa = replace_exact(
    qa,
    "expect(workspace, 'extractOcrLines(recognized.data.blocks)', 'OCR regions must preserve Tesseract line boundaries from the current blocks hierarchy.');",
    "expect(workspace, 'extractOcrParagraphs(recognized.data.blocks)', 'OCR regions must preserve Tesseract paragraph structure instead of exposing every OCR line as a separate editor box.');",
    'OCR QA paragraph expectation',
)
qa = replace_exact(
    qa,
    "expect(workspace, 'fitSingleLineFontSize(box.text, font, size, maxWidth)', 'Edited single-line text should shrink to fit its detected region before wrapping.');",
    "expect(workspace, 'fitSingleLineFontSize(box.text, font, size, maxWidth, box.letterSpacing)', 'Edited single-line text should shrink to fit its detected region while respecting letter spacing.');",
    'single-line QA spacing expectation',
)
qa = replace_exact(
    qa,
    "expect(workspace, \"box.source === 'ocr' ? 1.08 : 1.05\", 'OCR preview must use calibrated line height.');",
    "expect(workspace, 'lineHeight: box.lineHeight', 'Preview must preserve detected or user-adjusted line spacing.');",
    'line-height QA expectation',
)
qa_anchor = "expect(workspace, \"detectedFontName: sourceName\", 'Native PDF regions must retain a human-readable detected font identity.');\n"
qa_extra = r'''expect(workspace, "detectedFontName: sourceName", 'Native PDF regions must retain a human-readable detected font identity.');
expect(workspace, 'groupNativeParagraphBoxes(rawBoxes)', 'Digital PDF text must be grouped into style-aware, column-aware paragraph regions.');
expect(workspace, 'extractOcrParagraphs(recognized.data.blocks)', 'Scanned PDFs must expose paragraph-level OCR editing regions.');
expect(workspace, 'sampleBackgroundRing(', 'Text removal must sample the surrounding page background instead of relying only on pixels inside the text box.');
expect(workspace, 'fontWeight: number', 'Editable regions must preserve richer font-weight metadata.');
expect(workspace, 'align: TextAlign', 'Editable regions must preserve paragraph alignment.');
expect(workspace, 'letterSpacing: number', 'Editable regions must preserve letter spacing.');
expect(workspace, 'lineHeight: number', 'Editable regions must preserve line spacing.');
expect(workspace, 'rotation: number', 'Editable regions must preserve rotated text geometry.');
expect(workspace, 'estimateEditedBoxSize(currentBox, text, pageModel.width, pageModel.height)', 'Edited paragraph regions must auto-grow to fit replacement text.');
expect(workspace, 'drawAlignedLine(', 'Export must render alignment, justification, letter spacing and rotation through a shared layout renderer.');
expect(workspace, 'pdfLib.degrees', 'Rotated text export must use PDF rotation operators.');
expect(workspace, 'textAlign: box.align', 'On-page preview must show the selected alignment.');
expect(workspace, 'transform: `rotate(${box.rotation}deg)`', 'On-page preview must preserve text rotation.');
'''
if qa_anchor not in qa:
    raise RuntimeError('Could not locate Phase 3 QA anchor')
qa = qa.replace(qa_anchor, qa_extra, 1)

workspace_path.write_text(workspace)
qa_path.write_text(qa)
print('Applied Edit PDF Phase 4 layout fidelity changes.')
