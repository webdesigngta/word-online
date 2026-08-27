export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com').replace(/\/$/, '');
export const allowIndexing = process.env.NEXT_PUBLIC_ALLOW_INDEXING === 'true';
export const basePath = (process.env.NEXT_PUBLIC_BASE_PATH || '').replace(/\/$/, '');

export const site = {
  name: 'DOC321',
  shortName: 'DOC321',
  description:
    'Fast, free browser-based tools for Word, PDF, spreadsheets, presentations, images and everyday documents.',
};

export function absoluteUrl(path = '/') {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${siteUrl}${normalized}`;
}
