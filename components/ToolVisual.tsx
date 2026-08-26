import type { CSSProperties } from 'react';
import {
  Accessibility,
  ArrowDown,
  ArrowRightLeft,
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
import { toolPalette } from '@/lib/toolDesign';

type VisualMeta = {
  icon: LucideIcon;
  accent: string;
  label: string;
};

function visualMeta(tool: PlatformToolDefinition): VisualMeta {
  const value = `${tool.id} ${tool.route} ${tool.name} ${tool.kind} ${tool.primaryIntent}`.toLowerCase();

  if (/compress|shrink|reduce file/.test(value)) return { icon: Minimize2, accent: '#0f9d58', label: 'Compress' };
  if (/merge|combine/.test(value)) return { icon: Files, accent: '#8e24aa', label: 'Merge' };
  if (/split|extract page/.test(value)) return { icon: Scissors, accent: '#ef6c00', label: 'Split' };
  if (/crop/.test(value)) return { icon: Crop, accent: '#00897b', label: 'Crop' };
  if (/rotate/.test(value)) return { icon: RotateCw, accent: '#5e35b1', label: 'Rotate' };
  if (/watermark|stamp/.test(value)) return { icon: Stamp, accent: '#c2185b', label: 'Mark' };
  if (/sign|signature/.test(value)) return { icon: PenLine, accent: '#7b1fa2', label: 'Sign' };
  if (/protect|encrypt|password/.test(value) && !/unlock|decrypt|remove/.test(value)) return { icon: Lock, accent: '#d93025', label: 'Protect' };
  if (/unlock|decrypt/.test(value)) return { icon: Unlock, accent: '#5f6368', label: 'Unlock' };
  if (/repair|fix document|recover/.test(value)) return { icon: Wrench, accent: '#f29900', label: 'Repair' };
  if (/redact/.test(value)) return { icon: Shield, accent: '#c5221f', label: 'Redact' };
  if (/ocr|scan/.test(value)) return { icon: ScanLine, accent: '#0097a7', label: 'OCR' };
  if (/compare/.test(value)) return { icon: RefreshCw, accent: '#5e35b1', label: 'Compare' };
  if (/find/.test(value)) return { icon: Search, accent: '#f9ab00', label: 'Find' };
  if (/replace/.test(value)) return { icon: RefreshCw, accent: '#f57c00', label: 'Replace' };
  if (/remove formatting|clear formatting/.test(value)) return { icon: Eraser, accent: '#7e57c2', label: 'Clean' };
  if (/remove|delete/.test(value)) return { icon: Trash2, accent: '#d93025', label: 'Remove' };
  if (/sort/.test(value)) return { icon: ArrowDown, accent: '#188038', label: 'Sort' };
  if (/character count|word count|count/.test(value)) return { icon: Hash, accent: '#00897b', label: 'Count' };
  if (/case|uppercase|lowercase/.test(value)) return { icon: Type, accent: '#3949ab', label: 'Case' };
  if (/notepad|write notes/.test(value)) return { icon: Pencil, accent: '#7c4dff', label: 'Write' };
  if (/speech|voice|dictat/.test(value)) return { icon: Mic, accent: '#00897b', label: 'Voice' };
  if (/translate|language/.test(value)) return { icon: Languages, accent: '#5e35b1', label: 'Language' };
  if (/accessib/.test(value)) return { icon: Accessibility, accent: '#00796b', label: 'Access' };
  if (/html|markdown|code/.test(value)) return { icon: Code2, accent: '#546e7a', label: 'Code' };
  if (/metadata|properties|info/.test(value)) return { icon: Settings, accent: '#546e7a', label: 'Info' };
  if (/flatten|layer/.test(value)) return { icon: Layers3, accent: '#6d4c41', label: 'Flatten' };
  if (/image|jpg|jpeg|png/.test(value)) return { icon: Image, accent: '#9334e6', label: 'Image' };
  if (/spreadsheet|xlsx|xls\b|csv/.test(value)) return { icon: Table2, accent: '#188038', label: 'Sheet' };
  if (/presentation|powerpoint|pptx|ppt\b/.test(value)) return { icon: Presentation, accent: '#f29900', label: 'Slides' };
  if (/create|maker|generator|invoice|proposal|resume|memo|agenda|minutes/.test(value)) return { icon: FilePlus2, accent: '#1a73e8', label: 'Create' };
  if (/view|reader|preview/.test(value)) return { icon: Eye, accent: '#1a73e8', label: 'View' };
  if (/edit|annotat|fill/.test(value)) return { icon: Pencil, accent: '#1a73e8', label: 'Edit' };
  if (/convert|\bto\b/.test(value) || tool.kind === 'converter') return { icon: ArrowRightLeft, accent: '#673ab7', label: 'Convert' };
  if (/search|inspect|analy/.test(value)) return { icon: FileSearch, accent: '#00897b', label: 'Analyze' };
  if (/copy/.test(value)) return { icon: Copy, accent: '#546e7a', label: 'Copy' };
  if (/text|writing/.test(value)) return { icon: Type, accent: '#007b83', label: 'Text' };

  return { icon: FileText, accent: '#1a73e8', label: 'Document' };
}

const sizeMap = {
  sm: { box: 38, icon: 18, radius: 11, badge: 6 },
  md: { box: 50, icon: 23, radius: 14, badge: 7 },
  lg: { box: 66, icon: 30, radius: 18, badge: 8 },
} as const;

export function ToolVisual({ tool, size = 'md' }: { tool: PlatformToolDefinition; size?: 'sm' | 'md' | 'lg' }) {
  const palette = toolPalette(tool);
  const meta = visualMeta(tool);
  const dimensions = sizeMap[size];
  const Icon = meta.icon;
  const formatLabel = palette.targetLabel ? `${palette.sourceLabel}→${palette.targetLabel}` : meta.label;

  const style = {
    '--tool-primary': palette.primary,
    '--tool-secondary': palette.secondary,
    '--tool-soft': palette.soft,
    '--tool-ink': palette.ink,
    width: dimensions.box,
    height: dimensions.box,
    borderRadius: dimensions.radius,
    background: `linear-gradient(145deg, ${palette.primary} 0%, ${meta.accent} 100%)`,
    position: 'relative',
    overflow: 'hidden',
    boxShadow: '0 6px 16px rgba(32,33,36,.12), inset 0 0 0 1px rgba(255,255,255,.16)',
  } as CSSProperties;

  return (
    <span className={`tool-visual tool-visual-${size}`} style={style} aria-hidden="true">
      <span
        style={{
          position: 'absolute',
          width: dimensions.box * 0.7,
          height: dimensions.box * 0.7,
          borderRadius: '50%',
          background: 'rgba(255,255,255,.14)',
          right: -dimensions.box * 0.2,
          top: -dimensions.box * 0.24,
          pointerEvents: 'none',
        }}
      />
      <Icon
        style={{
          width: dimensions.icon,
          height: dimensions.icon,
          color: '#fff',
          strokeWidth: 2,
          position: 'relative',
          zIndex: 1,
          transform: size === 'sm' ? 'translateY(-1px)' : 'translateY(-2px)',
        }}
      />
      <span
        style={{
          position: 'absolute',
          zIndex: 2,
          left: '50%',
          bottom: size === 'sm' ? 3 : 5,
          transform: 'translateX(-50%)',
          maxWidth: '88%',
          padding: size === 'sm' ? '1px 3px' : '2px 4px',
          borderRadius: 999,
          background: 'rgba(17,24,39,.26)',
          color: '#fff',
          fontSize: dimensions.badge,
          fontWeight: 800,
          lineHeight: 1.15,
          letterSpacing: '.01em',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          textTransform: 'uppercase',
        }}
      >
        {formatLabel}
      </span>
    </span>
  );
}
