export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com').replace(/\/$/, '');
export const allowIndexing = process.env.NEXT_PUBLIC_ALLOW_INDEXING === 'true';
export const basePath = (process.env.NEXT_PUBLIC_BASE_PATH || '').replace(/\/$/, '');

export const site = {
  name: 'Free Word Online',
  shortName: 'Word Online',
  description:
    'Edit Word documents online for free. Open DOCX files, format text, insert tables and images, autosave locally, and export your work without creating an account.',
};

export function absoluteUrl(path = '/') {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${siteUrl}${normalized}`;
}
