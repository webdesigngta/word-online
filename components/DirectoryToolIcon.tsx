import type { CSSProperties, ReactNode } from 'react';
import {
  Accessibility,
  ArrowDown,
  Code2,
  Copy,
  Crop,
  Eraser,
  Eye,
  FilePlus2,
  FileSearch,
  FileText,
  Files,
  Hash,
  Image,
  Languages,
  Layers3,
  Lock,
  Mic,
  Minimize2,
  Pencil,
  PenLine,
  RotateCw,
  ScanLine,
  Scissors,
  Search,
  Settings,
  Shield,
  Stamp,
  Trash2,
  Type,
  Unlock,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import type { PlatformToolDefinition } from '@/tools/platform/catalog';

type IconMeta = {
  Icon?: LucideIcon;
  mark?: string;
  color: string;
};

const COLORS = {
  pdf: '#ED5A5A',
  word: '#4A90E2',
  sheet: '#5CB85C',
  slides: '#F08A47',
  image: '#F0AD4E',
  text: '#43A6B8',
  code: '#5E6BD8',
  archive: '#7867D6',
  generic: '#66788F',
  teal: '#45AEB8',
  violet: '#7964D8',
  pink: '#E35D83',
  green: '#28A66F',
  orange: '#E98A35',
} as const;

function formatMeta(value: string): IconMeta {
  const format = value.toLowerCase();

  if (/\bpdf\b/.test(format)) return { mark: 'PDF', color: COLORS.pdf };
  if (/\bdocx?\b|\bword\b/.test(format)) return { mark: 'W', color: COLORS.word };
  if (/\bodt\b/.test(format)) return { mark: 'ODT', color: '#5B83D6' };
  if (/\brtf\b/.test(format)) return { mark: 'RTF', color: '#5A8DDE' };
  if (/\bxlsx?\b|\bexcel\b/.test(format)) return { mark: 'X', color: COLORS.sheet };
  if (/\bcsv\b/.test(format)) return { mark: 'CSV', color: '#4DAA57' };
  if (/\bpptx?\b|\bpowerpoint\b|\bpresentation\b|\bslides?\b/.test(format)) return { mark: 'P', color: COLORS.slides };
  if (/\bjpg\b|\bjpeg\b|\bpng\b|\bgif\b|\bbmp\b|\btiff\b|\bwebp\b|\bheic\b|\bimage\b/.test(format)) return { Icon: Image, color: COLORS.image };
  if (/\bhtml?\b/.test(format)) return { mark: 'HTML', color: '#4F8ED8' };
  if (/\bmarkdown\b|\bmd\b/.test(format)) return { mark: 'MD', color: COLORS.code };
  if (/\bxml\b/.test(format)) return { mark: 'XML', color: COLORS.code };
  if (/\bjson\b/.test(format)) return { mark: 'JSON', color: COLORS.code };
  if (/\bepub\b/.test(format)) return { mark: 'EPUB', color: '#548ADA' };
  if (/\btxt\b|\btext\b|\bplain\b/.test(format)) return { mark: 'TXT', color: COLORS.text };
  if (/\bzip\b|\barchive\b/.test(format)) return { mark: 'ZIP', color: COLORS.archive };

  return { Icon: FileText, color: COLORS.generic };
}

function operationMeta(tool: PlatformToolDefinition): IconMeta {
  const value = `${tool.id} ${tool.route} ${tool.name} ${tool.kind} ${tool.primaryIntent}`.toLowerCase();

  if (/word online|docx editor|docx viewer|create word document/.test(value)) return { mark: 'W', color: COLORS.word };
  if (/compress|shrink|reduce file/.test(value)) return { Icon: Minimize2, color: COLORS.green };
  if (/merge|combine/.test(value)) return { Icon: Files, color: COLORS.violet };
  if (/split|extract page/.test(value)) return { Icon: Scissors, color: '#8A67D9' };
  if (/crop/.test(value)) return { Icon: Crop, color: COLORS.teal };
  if (/rotate/.test(value)) return { Icon: RotateCw, color: COLORS.violet };
  if (/watermark|stamp/.test(value)) return { Icon: Stamp, color: '#D76094' };
  if (/sign|signature/.test(value)) return { Icon: PenLine, color: '#D45F9A' };
  if (/protect|encrypt|password/.test(value) && !/unlock|decrypt|remove/.test(value)) return { Icon: Lock, color: COLORS.pink };
  if (/unlock|decrypt/.test(value)) return { Icon: Unlock, color: '#6C7B8F' };
  if (/repair|recover|fix document/.test(value)) return { Icon: Wrench, color: COLORS.orange };
  if (/redact/.test(value)) return { Icon: Shield, color: '#CF5962' };
  if (/ocr|scan/.test(value)) return { Icon: ScanLine, color: COLORS.teal };
  if (/compare/.test(value)) return { Icon: Layers3, color: '#7465D6' };
  if (/find/.test(value)) return { Icon: Search, color: '#D79A31' };
  if (/replace/.test(value)) return { Icon: Type, color: COLORS.orange };
  if (/remove formatting|clear formatting/.test(value)) return { Icon: Eraser, color: '#7B68D1' };
  if (/remove|delete/.test(value)) return { Icon: Trash2, color: '#D95B5B' };
  if (/sort/.test(value)) return { Icon: ArrowDown, color: '#43985D' };
  if (/character count|word count|count/.test(value)) return { Icon: Hash, color: '#349C8A' };
  if (/case|uppercase|lowercase/.test(value)) return { Icon: Type, color: '#5E6BD8' };
  if (/notepad|write notes/.test(value)) return { Icon: Pencil, color: '#7B63D9' };
  if (/speech|voice|dictat/.test(value)) return { Icon: Mic, color: '#379B91' };
  if (/translate|language/.test(value)) return { Icon: Languages, color: '#715ECB' };
  if (/accessib/.test(value)) return { Icon: Accessibility, color: '#329887' };
  if (/metadata|properties|info/.test(value)) return { Icon: Settings, color: '#6B7A8D' };
  if (/flatten|layer/.test(value)) return { Icon: Layers3, color: '#86705F' };
  if (/create|maker|generator|invoice|proposal|resume|memo|agenda|minutes/.test(value)) return { Icon: FilePlus2, color: '#4A90E2' };
  if (/view|reader|preview/.test(value)) return { Icon: Eye, color: '#4A90E2' };
  if (/edit|annotat|fill/.test(value)) return { Icon: Pencil, color: '#45A6B5' };
  if (/search|inspect|analy/.test(value)) return { Icon: FileSearch, color: '#3A9A89' };
  if (/copy/.test(value)) return { Icon: Copy, color: '#6A7A8E' };
  if (/html|markdown|code/.test(value)) return { Icon: Code2, color: COLORS.code };

  return formatMeta(`${tool.output.join(' ')} ${tool.input.join(' ')}`);
}

function isConverter(tool: PlatformToolDefinition) {
  const value = `${tool.id} ${tool.route} ${tool.name} ${tool.kind}`.toLowerCase();
  return tool.kind === 'converter' || /\bto\b|convert/.test(value);
}

function isPdfMeta(meta: IconMeta) {
  return meta.mark === 'PDF';
}

function converterMeta(tool: PlatformToolDefinition) {
  const source = formatMeta(tool.input[0] ?? '');
  const target = formatMeta(tool.output[0] ?? '');

  // When converting to or from PDF, show the other format. This matches the
  // fastest-recognition pattern users already know from document tool suites:
  // Word↔PDF = W, Excel↔PDF = X, PowerPoint↔PDF = P, image↔PDF = image.
  if (isPdfMeta(source) && !isPdfMeta(target)) return target;
  if (isPdfMeta(target) && !isPdfMeta(source)) return source;

  // For non-PDF conversions, the source format is the quickest visual cue.
  return source;
}

function glyph(meta: IconMeta): ReactNode {
  if (meta.mark) {
    const length = meta.mark.length;
    return (
      <span
        style={{
          color: '#fff',
          fontFamily: 'Arial, Helvetica, sans-serif',
          fontSize: length >= 4 ? 10 : length === 3 ? 11 : 20,
          fontWeight: 900,
          lineHeight: 1,
          letterSpacing: length >= 3 ? '-.04em' : '-.02em',
        }}
      >
        {meta.mark}
      </span>
    );
  }

  const Icon = meta.Icon ?? FileText;
  return <Icon className="directory-operation-icon" />;
}

export function DirectoryToolIcon({ tool }: { tool: PlatformToolDefinition }) {
  const meta = isConverter(tool) && tool.input.length && tool.output.length ? converterMeta(tool) : operationMeta(tool);

  return (
    <span
      className="directory-tool-icon"
      aria-hidden="true"
      style={{ '--directory-icon-color': meta.color } as CSSProperties}
    >
      {glyph(meta)}
    </span>
  );
}
