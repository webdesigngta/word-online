import type { ReactNode } from 'react';
import { toolRouteMetadata } from '@/lib/toolRouteMetadata';
export const metadata = toolRouteMetadata('/speech-to-text-document');
export default function ToolSeoLayout({ children }: { children: ReactNode }) { return children; }
