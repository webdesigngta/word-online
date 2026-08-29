import type { CSSProperties } from 'react';
import {
  ArrowDown,
  ArrowRight,
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
  Presentation,
  RefreshCw,
  RotateCw,
  ScanLine,
  Scissors,
  Search,
  Settings,
  Shield,
  Stamp,
  Table2,
  Trash2,
  Type,
  Unlock,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import type { PlatformToolDefinition } from '@/tools/platform/catalog';

type IconMeta = {
  Icon: LucideIcon;
  color: string;
};

const FORMAT_COLORS = {
  pdf: '#EB4D4B',
  word: '#3478E5',
  sheet: '#34A853',
  slides: '#F08A32',
  image: '#E8A22F',
  text: '#43A6B8',
  code: '#6269D9',
  archive: '#8264D4',
  generic: '#5F6F86',
} as const;

function formatMeta(value: string): IconMeta {
  const format = value.toLowerCase();

  if (/pdf/.test(format)) return { Icon: FileText, color: FORMAT_COLORS.pdf };
  if (/docx|doc\b|word|rtf|odt/.test(format)) return { Icon: FileText, color: FORMAT_COLORS.word };
  if (/xlsx|xls\b|csv|spreadsheet|sheet/.test(format)) return { Icon: Table2, color: FORMAT_COLORS.sheet };
  if (/pptx|ppt\b|powerpoint|presentation|slides?/.test(format)) return { Icon: Presentation, color: FORMAT_COLORS.slides };
  if (/jpg|jpeg|png|gif|bmp|tiff|webp|heic|image/.test(format)) return { Icon: Image, color: FORMAT_COLORS.image };
  if (/html|markdown|md\b|xml|code/.test(format)) return { Icon: Code2, color: FORMAT_COLORS.code };
  if (/txt|text|plain/.test(format)) return { Icon: Type, color: FORMAT_COLORS.text };
  if (/zip|archive/.test(format)) return { Icon: Files, color: FORMAT_COLORS.archive };

  return { Icon: FileText, color: FORMAT_COLORS.generic };
}

function operationMeta(tool: PlatformToolDefinition): IconMeta {
  const value = `${tool.id} ${tool.route} ${tool.name} ${tool.kind} ${tool.primaryIntent}`.toLowerCase();

  if (/compress|shrink|reduce file/.test(value)) return { Icon: Minimize2, color: '#13A36B' };
  if (/merge|combine/.test(value)) return { Icon: Files, color: '#8A57D5' };
  if (/split|extract page/.test(value)) return { Icon: Scissors, color: '#F08A32' };
  if (/crop/.test(value)) return { Icon: Crop, color: '#159A8C' };
  if (/rotate/.test(value)) return { Icon: RotateCw, color: '#7457D6' };
  if (/watermark|stamp/.test(value)) return { Icon: Stamp, color: '#D84C84' };
  if (/sign|signature/.test(value)) return { Icon: PenLine, color: '#8D54D1' };
  if (/protect|encrypt|password/.test(value) && !/unlock|decrypt|remove/.test(value)) return { Icon: Lock, color: '#D9534F' };
  if (/unlock|decrypt/.test(value)) return { Icon: Unlock, color: '#68778C' };
  if (/repair|recover|fix document/.test(value)) return { Icon: Wrench, color: '#DA8A23' };
  if (/redact/.test(value)) return { Icon: Shield, color: '#C74C52' };
  if (/ocr|scan/.test(value)) return { Icon: ScanLine, color: '#2B9FB0' };
  if (/compare/.test(value)) return { Icon: RefreshCw, color: '#7457D6' };
  if (/find/.test(value)) return { Icon: Search, color: '#D99921' };
  if (/replace/.test(value)) return { Icon: RefreshCw, color: '#E1792D' };
  if (/remove formatting|clear formatting/.test(value)) return { Icon: Eraser, color: '#7C62C8' };
  if (/remove|delete/.test(value)) return { Icon: Trash2, color: '#D9534F' };
  if (/sort/.test(value)) return { Icon: ArrowDown, color: '#36915B' };
  if (/character count|word count|count/.test(value)) return { Icon: Hash, color: '#2A9B89' };
  if (/case|uppercase|lowercase/.test(value)) return { Icon: Type, color: '#5C68CC' };
  if (/notepad|write notes/.test(value)) return { Icon: Pencil, color: '#7C5CE0' };
  if (/speech|voice|dictat/.test(value)) return { Icon: Mic, color: '#249B8D' };
  if (/translate|language/.test(value)) return { Icon: Languages, color: '#7158C8' };
  if (/metadata|properties|info/.test(value)) return { Icon: Settings, color: '#68778C' };
  if (/flatten|layer/.test(value)) return { Icon: Layers3, color: '#8B6A58' };
  if (/create|maker|generator|invoice|proposal|resume|memo|agenda|minutes/.test(value)) return { Icon: FilePlus2, color: '#3478E5' };
  if (/view|reader|preview/.test(value)) return { Icon: Eye, color: '#3478E5' };
  if (/edit|annotat|fill/.test(value)) return { Icon: Pencil, color: '#3D86D7' };
  if (/search|inspect|analy/.test(value)) return { Icon: FileSearch, color: '#2B9B88' };
  if (/copy/.test(value)) return { Icon: Copy, color: '#68778C' };

  return formatMeta(`${tool.output.join(' ')} ${tool.input.join(' ')}`);
}

function isConverter(tool: PlatformToolDefinition) {
  const value = `${tool.id} ${tool.route} ${tool.name} ${tool.kind}`.toLowerCase();
  return tool.kind === 'converter' || /\bto\b|convert/.test(value);
}

export function DirectoryToolIcon({ tool }: { tool: PlatformToolDefinition }) {
  const converter = isConverter(tool);

  if (converter && tool.input.length && tool.output.length) {
    const source = formatMeta(tool.input[0]);
    const target = formatMeta(tool.output[0]);
    const SourceIcon = source.Icon;
    const TargetIcon = target.Icon;

    return (
      <span
        className="directory-tool-icon directory-tool-icon--convert"
        aria-hidden="true"
        style={{
          '--directory-icon-source': source.color,
          '--directory-icon-target': target.color,
        } as CSSProperties}
      >
        <SourceIcon className="directory-format-icon directory-format-icon--source" />
        <ArrowRight className="directory-convert-arrow" />
        <TargetIcon className="directory-format-icon directory-format-icon--target" />
      </span>
    );
  }

  const meta = operationMeta(tool);
  const Icon = meta.Icon;

  return (
    <span
      className="directory-tool-icon"
      aria-hidden="true"
      style={{ '--directory-icon-color': meta.color } as CSSProperties}
    >
      <Icon className="directory-operation-icon" />
    </span>
  );
}
