import { InformationPage } from '@/components/InformationPage';
import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'Security & Privacy – How Word Online Handles Documents',
  description: 'Understand the current Word Online security and privacy model: browser-side document processing, local browser storage, import sanitization and present limitations.',
  path: '/security',
});

export default function SecurityPage() {
  return (
    <InformationPage
      eyebrow="SECURITY & PRIVACY"
      title="How the Word editor handles your documents"
      description="These statements describe the current implementation in this application. They are intentionally limited to controls that exist in the code today and should not be read as a certification, compliance claim or guarantee."
      sections={[
        {
          title: 'Editing is browser-based',
          body: 'The current Word editor opens local files through browser File APIs and performs the primary DOCX import, editing and DOCX/HTML export workflow in the browser.',
          items: [
            'The editor does not require an account to create or edit a document.',
            'The current editor code does not intentionally upload document contents to an application document-storage server as part of the normal editing workflow.',
          ],
        },
        {
          title: 'Autosave and version history are local',
          body: 'The current storage adapter saves drafts and rolling version-history data in browser localStorage on the device where you are editing.',
          items: [
            'Local data can remain in that browser until it is overwritten, cleared by the application, or removed through browser/site-data controls.',
            'Local browser storage is not the same as an encrypted cloud backup and should not be treated as one.',
          ],
        },
        {
          title: 'Imported HTML is sanitized',
          body: 'Before imported HTML is placed into the editor, the import path removes active or potentially unsafe elements and attributes.',
          items: [
            'Scripts, iframes, forms, embedded objects, metadata and similar active elements are removed.',
            'Inline event handlers and javascript: links are removed.',
            'External image sources are removed from imported HTML unless they use browser-local data or blob URLs.',
          ],
        },
        {
          title: 'File-size and compatibility limits',
          body: 'The current flagship import path rejects files larger than 20 MB. Complex DOCX features can be simplified because browser conversion does not reproduce every Microsoft Word feature.',
          items: ['Do not rely on the browser editor as the only copy of an important source document. Keep your original file until you have checked the downloaded result.'],
        },
        {
          title: 'Claims we are not making',
          body: 'The current product does not claim ISO certification, SOC 2 certification, HIPAA compliance, a guaranteed server-side deletion period, end-to-end encryption, or perfect DOCX fidelity unless those controls are implemented and independently supportable in the future.',
        },
      ]}
      related={[
        { label: 'Word Online', href: '/word-online' },
        { label: 'Supported Formats', href: '/supported-formats' },
        { label: 'All tools', href: '/tools' },
      ]}
    />
  );
}
