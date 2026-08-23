import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteHeader } from '@/components/SiteHeader';
import { WordCompatibilityQa } from '@/components/WordCompatibilityQa';

export const metadata: Metadata = {
  title: 'Word Compatibility QA',
  description: 'Internal Word Online compatibility test harness.',
  robots: { index: false, follow: false, noarchive: true },
};

export default function WordCompatibilityQaPage() {
  return (
    <>
      <SiteHeader />
      <main style={{ background: '#f8fafd', minHeight: 'calc(100vh - 160px)', padding: '34px 20px 72px' }}>
        <div style={{ width: 'min(1040px, 100%)', margin: '0 auto' }}>
          <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Word Compatibility QA' }]} />
          <section style={{ margin: '34px 0 24px', maxWidth: 780 }}>
            <p style={{ color: '#0b57d0', fontSize: 12, fontWeight: 700, letterSpacing: '.08em', margin: '0 0 10px' }}>INTERNAL QA · NOINDEX</p>
            <h1 style={{ fontFamily: 'Arial, Helvetica, sans-serif', fontSize: 'clamp(32px, 5vw, 50px)', letterSpacing: '-.03em', margin: 0 }}>Word Online compatibility gate</h1>
            <p style={{ fontFamily: 'Arial, Helvetica, sans-serif', color: '#5f6368', fontSize: 16, lineHeight: 1.65 }}>Week 3 requires at least 95% success across 20 DOCX upload → edit → download round trips. This page runs that gate against the production importer and exporter in the browser.</p>
          </section>
          <WordCompatibilityQa />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
