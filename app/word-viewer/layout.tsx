import type { ReactNode } from 'react';
import { toolRouteMetadata } from '@/lib/toolRouteMetadata';
export const metadata = toolRouteMetadata('/word-viewer');
export default function ToolSeoLayout({ children }: { children: ReactNode }) { return children; }
