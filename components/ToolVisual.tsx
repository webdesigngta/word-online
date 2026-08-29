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
};

function visualMeta(tool: PlatformToolDefinition): VisualMeta {
  const value = `${tool.id} ${tool.route} ${tool.name} ${tool.kind} ${tool.primaryIntent}`.toLowerCase();

  if (/compress|shrink|reduce file/.test(value)) return { icon: Minimize2, accent: '#0f9d58' };
  if (/merge|combine/.test(value)) return { icon: Files, accent: '#8e24aa' };
  if (/split|extract page/.test(value)) return { icon: Scissors, accent: '#ef6c00' };
  if (/crop/.test(value)) return { icon: Crop, accent: '#00897b' };
  if (/rotate/.test(value)) return { icon: RotateCw, accent: '#5e35b1' };
  if (/watermark|stamp/.test(value)) return { icon: Stamp, accent: '#c2185b' };
  if (/sign|signature/.test(value)) return { icon: PenLine, accent: '#7b1fa2' };
  if (/protect|encrypt|password/.test(value) && !/unlock|decrypt|remove/.test(value)) return { icon: Lock, accent: '#d93025' };
  if (/unlock|decrypt/.test(value)) return { icon: Unlock, accent: '#5f6368' };
  if (/repair|fix document|recover/.test(value)) return { icon: Wrench, accent: '#f29900' };
  if (/redact/.test(value)) return { icon: Shield, accent: '#c5221f' };
  if (/ocr|scan/.test(value)) return { icon: ScanLine, accent: '#0097a7' };
  if (/compare/.test(value)) return { icon: RefreshCw, accent: '#5e35b1' };
  if (/find/.test(value)) return { icon: Search, accent: '#f9ab00' };
  if (/replace/.test(value)) return { icon: RefreshCw, accent: '#f57c00' };
  if (/remove formatting|clear formatting/.test(value)) return { icon: Eraser, accent: '#7e57c2' };
  if (/remove.*metadata/.test(value)) return { icon: Trash2, accent: '#d93025' };
  if (/metadata|properties|info/.test(value)) return { icon: Settings, accent: '#546e7a' };
  if (/remove|delete/.test(value)) return { icon: Trash2, accent: '#d93025' };
  if (/sort/.test(value)) return { icon: ArrowDown, accent: '#188038' };
  if (/character count|word count|count/.test(value)) return { icon: Hash, accent: '#00897b' };
  if (/case|uppercase|lowercase/.test(value)) return { icon: Type, accent: '#3949ab' };
  if (/notepad|write notes/.test(value)) return { icon: Pencil, accent: '#7c4dff' };
  if (/speech|voice|dictat/.test(value)) return { icon: Mic, accent: '#00897b' };
  if (/translate|language/.test(value)) return { icon: Languages, accent: '#5e35b1' };
  if (/accessib/.test(value)) return { icon: Accessibility, accent: '#00796b' };
  if (/html|markdown|code/.test(value)) return { icon: Code2, accent: '#546e7a' };
  if (/flatten|layer/.test(value)) return { icon: Layers3, accent: '#6d4c41' };
  if (/image|jpg|jpeg|png/.test(value)) return { icon: Image, accent: '#9334e6' };
  if (/spreadsheet|xlsx|xls\b|csv/.test(value)) return { icon: Table2, accent: '#188038' };
  if (/presentation|powerpoint|pptx|ppt\b/.test(value)) return { icon: Presentation, accent: '#f29900' };
  if (/create|maker|generator|invoice|proposal|resume|memo|agenda|minutes/.test(value)) return { icon: FilePlus2, accent: '#1a73e8' };
  if (/view|reader|preview/.test(value)) return { icon: Eye, accent: '#1a73e8' };
  if (/edit|annotat|fill/.test(value)) return { icon: Pencil, accent: '#1a73e8' };
  if (/txt|plain text|text file/.test(value)) return { icon: Type, accent: '#007b83' };
  if (/search|inspect|analy/.test(value)) return { icon: FileSearch, accent: '#00897b' };
  if (/copy/.test(value)) return { icon: Copy, accent: '#546e7a' };
  if (/convert|\bto\b/.test(value) || tool.kind === 'converter') return { icon: ArrowRightLeft, accent: '#673ab7' };
  if (/text|writing/.test(value)) return { icon: Type, accent: '#007b83' };

  return { icon: FileText, accent: '#1a73e8' };
}

const sizeMap = {
  sm: { box: 38, icon: 18, radius: 11 },
  md: { box: 50, icon: 24, radius: 14 },
  lg: { box: 66, icon: 32, radius: 18 },
} as const;

export function ToolVisual({ tool, size = 'md' }: { tool: PlatformToolDefinition; size?: 'sm' | 'md' | 'lg' }) {
  const palette = toolPalette(tool);
  const meta = visualMeta(tool);
  const dimensions = sizeMap[size];
  const Icon = meta.icon;

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
    boxShadow: '0 7px 18px rgba(32,33,36,.13), inset 0 0 0 1px rgba(255,255,255,.20)',
    flex: '0 0 auto',
  } as CSSProperties;

  return (
    <span className={`tool-visual tool-visual-${size}`} style={style} aria-hidden="true">
      <span
        style={{
          position: 'absolute',
          width: dimensions.box * 0.92,
          height: dimensions.box * 0.92,
          borderRadius: '50%',
          background: 'rgba(255,255,255,.12)',
          left: '22%',
          top: '18%',
          transform: 'translate(-50%,-50%)',
          pointerEvents: 'none',
        }}
      />
      <span
        style={{
          position: 'absolute',
          inset: dimensions.box * 0.12,
          borderRadius: dimensions.radius * 0.72,
          border: '1px solid rgba(255,255,255,.12)',
        }}
      />
      <Icon
        style={{
          width: dimensions.icon,
          height: dimensions.icon,
          color: '#fff',
          strokeWidth: 2.15,
          position: 'absolute',
          zIndex: 2,
          left: '50%',
          top: '50%',
          transform: 'translate(-50%,-50%)',
          filter: 'drop-shadow(0 1px 1px rgba(0,0,0,.10))',
        }}
      />
    </span>
  );
}
