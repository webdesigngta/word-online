import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import './globals.css';
import './docs-editor.css';
import './docs-body.css';
import './editor-responsive-fixes.css';
import { absoluteUrl, allowIndexing, site, siteUrl } from '@/lib/site';

const criticalEditorCss = `
  html:not(.fwo-ui-ready) .editor-route .word-app.docs-word-app {
    visibility: hidden !important;
  }

  .editor-route .docs-menu-row,
  .editor-route .docs-pdf-button,
  .editor-route .docs-right > .docs-top-icon,
  .editor-route .docs-right > .docs-share-button,
  .editor-route .docs-right > .docs-upgrade-button,
  .editor-route .docs-right > .docs-gem,
  .editor-route .docs-right > .docs-avatar,
  .editor-route .docs-title-icon[aria-label='Star document'],
  .editor-route .fwo-top-actions {
    display: none !important;
    visibility: hidden !important;
    pointer-events: none !important;
  }
`;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Free Word Online – Edit DOCX Files Free',
    template: '%s | Free Word Online',
  },
  description: site.description,
  applicationName: site.name,
  category: 'productivity',
  keywords: [
    'word online',
    'free word editor',
    'docx editor online',
    'edit docx online',
    'word document editor',
    'online document editor',
  ],
  authors: [{ name: 'Free Word Online' }],
  creator: 'Free Word Online',
  publisher: 'Free Word Online',
  referrer: 'origin-when-cross-origin',
  robots: allowIndexing
    ? { index: true, follow: true }
    : { index: false, follow: false, noarchive: true },
  icons: {
    icon: absoluteUrl('/favicon.svg'),
    apple: absoluteUrl('/app-icon.svg'),
  },
  manifest: absoluteUrl('/manifest.webmanifest'),
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#f8fafd',
  colorScheme: 'light',
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <style dangerouslySetInnerHTML={{ __html: criticalEditorCss }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
