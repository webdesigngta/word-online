import { InformationPage } from '@/components/InformationPage';
import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'Supported Formats – Word Online File Compatibility',
  description: 'See which file formats the Word Online editor can open and export today, plus current compatibility limits for DOCX, HTML, TXT and PDF workflows.',
  path: '/supported-formats',
});

export default function SupportedFormatsPage() {
  return (
    <InformationPage
      eyebrow="SUPPORTED FORMATS"
      title="Supported formats"
      description="This page documents what the current Word Online editor actually accepts and produces. It separates the flagship editor from the wider converter tools so compatibility claims stay precise."
      sections={[
        {
          title: 'DOCX — primary editing format',
          body: 'DOCX is the main Word format supported by the editor. The browser imports DOCX content into the editing canvas and can export a new DOCX copy after editing.',
          items: [
            'Open DOCX files up to 20 MB in the current editor import path.',
            'Common paragraphs, headings, bold, italic, underline, lists, links, tables and images are supported by the current workflow.',
            'Complex Word-only layout, macros, advanced fields, tracked changes and some proprietary formatting can be simplified during browser conversion.',
          ],
        },
        {
          title: 'HTML — open and export',
          body: 'The editor can open local HTML files and export the edited document as HTML. Imported HTML is sanitized before it is placed into the editor.',
          items: [
            'Scripts, iframes, embedded forms and other active elements are removed from imported HTML.',
            'javascript: links and unsafe remote image sources are removed by the import sanitizer.',
          ],
        },
        {
          title: 'TXT — plain text import',
          body: 'Plain TXT files can be opened in the editor. Text is escaped and converted into editable paragraphs and line breaks.',
          items: ['TXT does not contain rich formatting, so fonts, tables, images and layout are not preserved on import.'],
        },
        {
          title: 'PDF — print/save workflow',
          body: 'The flagship editor can use the browser print workflow to save the current document as PDF. Dedicated Word-to-PDF and DOCX-to-PDF tools are also available separately.',
          items: ['PDF is an export/conversion target, not an editable source format inside the flagship Word editor.'],
        },
        {
          title: 'Other document formats',
          body: 'RTF and ODT are handled by dedicated converter routes rather than being treated as native flagship-editor imports today.',
          items: ['Use RTF to DOCX or ODT to DOCX first, then continue editing the resulting DOCX file in Word Online.'],
        },
      ]}
      related={[
        { label: 'Open Word Online', href: '/word-online' },
        { label: 'DOCX Editor', href: '/docx-editor' },
        { label: 'Word to PDF', href: '/word-to-pdf' },
        { label: 'Security & Privacy', href: '/security' },
      ]}
    />
  );
}
