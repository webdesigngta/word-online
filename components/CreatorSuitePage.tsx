import { PlatformTaskPage } from '@/components/PlatformTaskPage';
import { CreatorStudioInterface } from '@/components/CreatorStudioInterface';
import { creatorDefinitions, type CreatorMode } from '@/tools/creator/creatorDefinitions';
import { getAllPlatformToolByRoute } from '@/tools/platform/allTools';

export function CreatorSuitePage({ route, mode }: { route: string; mode: CreatorMode }) {
  const tool = getAllPlatformToolByRoute(route);
  if (!tool) throw new Error(`Unknown creator route: ${route}`);
  const definition = creatorDefinitions[mode];
  return (
    <PlatformTaskPage
      route={route}
      title={tool.title}
      description={tool.description}
      tool={<CreatorStudioInterface mode={mode} />}
      details={[
        { title: 'Purpose-built document fields', text: `${definition.name} uses a dedicated form instead of a generic blank page, so the live preview follows the structure expected for this document type.` },
        { title: 'Live document preview', text: 'Your content updates immediately in a printable document-style preview before you export anything.' },
        { title: 'DOCX, PDF, and TXT downloads', text: 'Export a Word-compatible DOCX, a browser-rendered PDF, or a plain-text copy from the same document content.' },
      ]}
      faq={[
        { question: `Is the ${definition.name} free to use?`, answer: 'The tool runs in your browser and does not require an account to fill the document or use the available export buttons.' },
        { question: 'Can I edit the exported Word file later?', answer: 'Yes. DOCX output can be opened and edited further in compatible word-processing software.' },
        { question: 'Does the tool write the content for me automatically?', answer: 'No. It structures and formats the information you enter. It does not invent claims, experience, prices, meeting decisions, or other source content.' },
      ]}
    />
  );
}
