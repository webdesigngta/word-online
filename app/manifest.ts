import type { MetadataRoute } from 'next';
import { basePath } from '@/lib/site';

export const dynamic = 'force-static';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'DOC321',
    short_name: 'DOC321',
    description: 'Fast, free browser-based tools for everyday documents.',
    start_url: `${basePath || ''}/`,
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#0B66E6',
    icons: [
      { src: `${basePath || ''}/app-icon.svg`, sizes: 'any', type: 'image/svg+xml' },
    ],
  };
}
