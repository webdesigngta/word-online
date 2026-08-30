import type { ReactNode } from 'react';
import { toolRouteMetadata } from '@/lib/toolRouteMetadata';
export const metadata = toolRouteMetadata('/text-to-speech-document');
export default function ToolSeoLayout({ children }: { children: ReactNode }) { return children; }
