import type { PlatformToolDefinition } from '@/tools/platform/catalog';

export type ProductFamily = 'word' | 'pdf' | 'sheet' | 'slides' | 'image' | 'text' | 'create' | 'other';

export type ToolPalette = {
  family: ProductFamily;
  familyLabel: string;
  sourceLabel: string;
  targetLabel?: string;
  primary: string;
  secondary: string;
  soft: string;
  ink: string;
};

export type ToolDirectoryGroup = {
  id: string;
  label: string;
  description: string;
  family: ProductFamily;
};

export const DIRECTORY_GROUPS: readonly ToolDirectoryGroup[] = [
  { id: 'word', label: 'Word & DOCX', description: 'Create, edit, view, protect and manage Word documents.', family: 'word' },
  { id: 'pdf', label: 'PDF tools', description: 'Edit, organize, sign, protect, read and work directly with PDFs.', family: 'pdf' },
  { id: 'pdf-convert', label: 'PDF converters', description: 'Convert between PDF and Word, images, spreadsheets, presentations and more.', family: 'pdf' },
  { id: 'spreadsheets', label: 'Spreadsheets', description: 'Open, edit and convert XLSX, XLS and CSV files.', family: 'sheet' },
  { id: 'presentations', label: 'Presentations', description: 'Create, view, edit and convert PowerPoint presentations.', family: 'slides' },
  { id: 'images-ocr', label: 'Images & OCR', description: 'Turn images and scans into editable documents and searchable text.', family: 'image' },
  { id: 'writing', label: 'Text & writing', description: 'Write, clean, check, count, summarize and transform text.', family: 'text' },
  { id: 'create', label: 'Create documents', description: 'Make practical business and personal documents from guided forms.', family: 'create' },
  { id: 'formats', label: 'More document formats', description: 'Work with ODT, RTF, Markdown, HTML, EPUB and accessibility tools.', family: 'other' },
] as const;

const FAMILY_THEME: Record<ProductFamily, { primary: string; soft: string; ink: string; label: string }> = {
  word: { primary: '#1a73e8', soft: '#e8f0fe', ink: '#174ea6', label: 'Word' },
  pdf: { primary: '#d93025', soft: '#fce8e6', ink: '#a50e0e', label: 'PDF' },
  sheet: { primary: '#188038', soft: '#e6f4ea', ink: '#137333', label: 'Spreadsheet' },
  slides: { primary: '#f29900', soft: '#fef7e0', ink: '#8a4b00', label: 'Presentation' },
  image: { primary: '#9334e6', soft: '#f3e8fd', ink: '#681da8', label: 'Image' },
  text: { primary: '#007b83', soft: '#e4f7f8', ink: '#006065', label: 'Text' },
  create: { primary: '#5f6368', soft: '#f1f3f4', ink: '#3c4043', label: 'Create' },
  other: { primary: '#5f6368', soft: '#f1f3f4', ink: '#3c4043', label: 'Document' },
};

const TYPE_ALIASES: Record<string, string> = {
  WORD: 'DOCX',
  DOCUMENT: 'DOCX',
  EXCEL: 'XLSX',
  POWERPOINT: 'PPTX',
  IMAGE: 'IMG',
  MICROPHONE: 'VOICE',
  SPEECH: 'VOICE',
  MARKDOWN: 'MD',
  'TEXT OUTLINE': 'TEXT',
};

function cleanType(value?: string) {
  if (!value) return '';
  const upper = value.trim().toUpperCase();
  return TYPE_ALIASES[upper] ?? upper;
}

function meaningfulType(values: readonly string[], fallback = '') {
  const ignored = new Set(['PREVIEW', 'SUMMARY', 'SPEECH', 'BLANK']);
  return cleanType(values.map(cleanType).find((value) => value && !ignored.has(value)) ?? fallback);
}

export function familyForType(value?: string): ProductFamily {
  const type = cleanType(value);
  if (['DOCX', 'DOC', 'RTF', 'ODT'].includes(type)) return 'word';
  if (type === 'PDF' || type === 'PDF/A') return 'pdf';
  if (['XLSX', 'XLS', 'CSV'].includes(type)) return 'sheet';
  if (['PPTX', 'PPT'].includes(type)) return 'slides';
  if (['JPG', 'JPEG', 'PNG', 'IMG', 'SCAN'].includes(type)) return 'image';
  if (['TXT', 'TEXT', 'MD', 'HTML', 'VOICE'].includes(type)) return 'text';
  return 'other';
}

function fallbackFamily(tool: Pick<PlatformToolDefinition, 'cluster' | 'kind' | 'route' | 'name'>): ProductFamily {
  const value = `${tool.cluster} ${tool.kind} ${tool.route} ${tool.name}`.toLowerCase();
  if (tool.kind === 'creator' || /maker|create|writer|invoice|proposal|memo|resume|agenda|minutes|checklist|business plan/.test(value)) return 'create';
  if (/pdf/.test(value)) return 'pdf';
  if (/word|docx|doc\b|rtf|odt/.test(value)) return 'word';
  if (/spreadsheet|xlsx|xls\b|csv/.test(value)) return 'sheet';
  if (/presentation|powerpoint|pptx|ppt\b/.test(value)) return 'slides';
  if (/image|jpg|jpeg|png|ocr|scan/.test(value)) return 'image';
  if (/text|writing|spell|grammar|markdown|character|notepad/.test(value)) return 'text';
  return 'other';
}

export function toolPalette(tool: Pick<PlatformToolDefinition, 'input' | 'output' | 'cluster' | 'kind' | 'route' | 'name'>): ToolPalette {
  const sourceLabel = meaningfulType(tool.input, 'DOC');
  const targetLabel = meaningfulType(tool.output);
  const sourceFamily = familyForType(sourceLabel);
  const targetFamily = familyForType(targetLabel);
  const family = sourceFamily !== 'other' ? sourceFamily : targetFamily !== 'other' ? targetFamily : fallbackFamily(tool);
  const primaryTheme = FAMILY_THEME[family];
  const secondaryTheme = targetLabel && targetFamily !== 'other' && targetFamily !== family ? FAMILY_THEME[targetFamily] : primaryTheme;
  return {
    family,
    familyLabel: primaryTheme.label,
    sourceLabel: sourceLabel || primaryTheme.label.toUpperCase(),
    targetLabel: targetLabel && targetLabel !== sourceLabel ? targetLabel : undefined,
    primary: primaryTheme.primary,
    secondary: secondaryTheme.primary,
    soft: primaryTheme.soft,
    ink: primaryTheme.ink,
  };
}

export function directoryGroupId(tool: PlatformToolDefinition) {
  const palette = toolPalette(tool);
  const isConverter = tool.kind === 'converter';
  const hasPdf = [...tool.input, ...tool.output].some((type) => familyForType(type) === 'pdf') || /pdf/.test(tool.route);
  if (tool.kind === 'creator' || palette.family === 'create') return 'create';
  if (isConverter && hasPdf) return 'pdf-convert';
  if (palette.family === 'pdf') return 'pdf';
  if (palette.family === 'word') return 'word';
  if (palette.family === 'sheet') return 'spreadsheets';
  if (palette.family === 'slides') return 'presentations';
  if (palette.family === 'image' || tool.kind === 'ocr') return 'images-ocr';
  if (palette.family === 'text' || ['text', 'language', 'accessibility'].includes(tool.kind)) return 'writing';
  return 'formats';
}

function normalizedTypes(tool: PlatformToolDefinition) {
  return new Set([...tool.input, ...tool.output].map(cleanType).filter(Boolean));
}

export function relatedToolScore(current: PlatformToolDefinition, candidate: PlatformToolDefinition) {
  if (current.route === candidate.route) return -Infinity;
  let score = 0;
  if (current.cluster === candidate.cluster) score += 120;
  if (directoryGroupId(current) === directoryGroupId(candidate)) score += 80;
  if (current.kind === candidate.kind) score += 18;
  const currentTypes = normalizedTypes(current);
  const candidateTypes = normalizedTypes(candidate);
  let shared = 0;
  currentTypes.forEach((type) => { if (candidateTypes.has(type)) shared += 1; });
  score += shared * 32;
  const currentInput = new Set(current.input.map(cleanType));
  const currentOutput = new Set(current.output.map(cleanType));
  const candidateInput = new Set(candidate.input.map(cleanType));
  const candidateOutput = new Set(candidate.output.map(cleanType));
  if ([...currentInput].some((type) => candidateOutput.has(type)) && [...currentOutput].some((type) => candidateInput.has(type))) score += 52;
  score += ({ P0: 24, P1: 18, P2: 10, P3: 4 } as const)[candidate.priority];
  return score;
}

export function groupDefinition(id: string) {
  return DIRECTORY_GROUPS.find((group) => group.id === id) ?? DIRECTORY_GROUPS[DIRECTORY_GROUPS.length - 1];
}

export function familyTheme(family: ProductFamily) {
  return FAMILY_THEME[family];
}
