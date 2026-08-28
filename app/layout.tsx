import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import './globals.css';
import './google-style.css';
import './material-icons.css';
import './docs-editor.css';
import './doc321-brand.css';
import './tool-pages.css';
import './tool-pages-special.css';
import './tool-interface-uniformity.css';
import './tool-pages-readability.css';
import './home-typography.css';
import { ScrollToTop } from '@/components/ScrollToTop';
import { absoluteUrl, allowIndexing, site, siteUrl } from '@/lib/site';

const criticalEditorCss = `
  html:not(.fwo-ui-ready) .editor-route .word-app.docs-word-app {
    visibility: hidden !important;
  }
`;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: 'DOC321 – Free Online Document Tools', template: '%s | DOC321' },
  description: site.description,
  applicationName: site.name,
  category: 'productivity',
  keywords: ['word online','free word editor','docx editor online','edit docx online','pdf tools','document tools','online document editor'],
  authors: [{ name: 'DOC321' }],
  creator: 'DOC321',
  publisher: 'DOC321',
  referrer: 'origin-when-cross-origin',
  robots: allowIndexing ? { index: true, follow: true } : { index: false, follow: false, noarchive: true },
  icons: { icon: absoluteUrl('/favicon.svg'), apple: absoluteUrl('/app-icon.svg') },
  manifest: absoluteUrl('/manifest.webmanifest'),
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0B66E6',
  colorScheme: 'light',
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,300..700,0..1,0" rel="stylesheet" />
        <style dangerouslySetInnerHTML={{ __html: criticalEditorCss }} />
      </head>
      <body>
        {children}
        <ScrollToTop />
      </body>
    </html>
  );
}
