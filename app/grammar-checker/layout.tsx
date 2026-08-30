import type { ReactNode } from 'react';
import { toolRouteMetadata } from '@/lib/toolRouteMetadata';
export const metadata = toolRouteMetadata('/grammar-checker');
export default function ToolSeoLayout({ children }: { children: ReactNode }) { return children; }
