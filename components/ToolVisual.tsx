import type { CSSProperties } from 'react';
import type { PlatformToolDefinition } from '@/tools/platform/catalog';
import { toolPalette } from '@/lib/toolDesign';

export function ToolVisual({ tool, size = 'md' }: { tool: PlatformToolDefinition; size?: 'sm' | 'md' | 'lg' }) {
  const palette = toolPalette(tool);
  const mixed = palette.secondary !== palette.primary;
  const style = {
    '--tool-primary': palette.primary,
    '--tool-secondary': palette.secondary,
    '--tool-soft': palette.soft,
    '--tool-ink': palette.ink,
    background: mixed
      ? `linear-gradient(135deg, ${palette.primary} 0 47%, ${palette.secondary} 53% 100%)`
      : palette.primary,
  } as CSSProperties;

  return (
    <span className={`tool-visual tool-visual-${size}`} style={style} aria-hidden="true">
      <span>{palette.sourceLabel.slice(0, 4)}</span>
      {palette.targetLabel ? <><b>→</b><span>{palette.targetLabel.slice(0, 4)}</span></> : null}
    </span>
  );
}
