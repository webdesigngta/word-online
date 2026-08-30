import type { ReactNode } from 'react';
import { toolRouteMetadata } from '@/lib/toolRouteMetadata';
export const metadata = toolRouteMetadata('/edit-pdf');
export default function ToolSeoLayout({ children }: { children: ReactNode }) { return children; }
