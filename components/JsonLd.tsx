import { absoluteUrl } from '@/lib/site';

export function SoftwareJsonLd() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Free Word Online',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Any',
    url: absoluteUrl('/word-online'),
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    featureList: [
      'Open DOCX files',
      'Edit rich text in the browser',
      'Insert links, images, lists and tables',
      'Local autosave',
      'Export to DOCX and HTML',
      'Print or save as PDF',
    ],
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />;
}

export function FaqJsonLd({ items }: { items: Array<{ question: string; answer: string }> }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />;
}

export function HowToJsonLd({
  name,
  description,
  steps,
  path,
}: {
  name: string;
  description: string;
  steps: Array<{ title: string; text: string }>;
  path: string;
}) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name,
    description,
    url: absoluteUrl(path),
    step: steps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step.title,
      text: step.text,
    })),
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />;
}
