import type { ReactNode } from 'react';
import { PlatformTaskPage } from '@/components/PlatformTaskPage';
import { wordInterfaces } from '@/tools/word/interfaces/config';

export function WordTaskPage({
  eyebrow,
  title,
  description,
  tool,
  details,
  faq,
  customContent,
  customHowToSteps,
}: {
  eyebrow: string;
  title: string;
  description: string;
  tool: ReactNode;
  details: Array<{ title: string; text: string }>;
  faq: Array<{ question: string; answer: string }>;
  customContent?: ReactNode;
  customHowToSteps?: Array<{ title: string; text: string }>;
}) {
  const current = wordInterfaces.find((item) => item.eyebrow === eyebrow);
  const fallbackRoute = `/${eyebrow.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;

  return (
    <PlatformTaskPage
      route={current?.route ?? fallbackRoute}
      title={title}
      description={description}
      tool={tool}
      details={details}
      faq={faq}
      customContent={customContent}
      customHowToSteps={customHowToSteps}
    />
  );
}
