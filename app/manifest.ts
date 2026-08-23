import type { MetadataRoute } from 'next';
import { basePath } from '@/lib/site';

export const dynamic = 'force-static';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Free Word Online',
    short_name: 'Word Online',
    description: 'A free browser-based Word document editor.',
    start_url: `${basePath || ''}/`,
    display: 'standalone',
    background_color: '#f5f7fb',
    theme_color: '#1d9bf0',
    icons: [
      { src: `${basePath || ''}/app-icon.svg`, sizes: 'any', type: 'image/svg+xml' },
    ],
  };
}
