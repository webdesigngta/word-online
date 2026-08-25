import { PlatformTaskPage } from '@/components/PlatformTaskPage';
import { PresentationBuilderInterface, type PresentationBuilderMode } from '@/components/PresentationBuilderInterface';
import { getAllPlatformToolByRoute } from '@/tools/platform/allTools';

const content: Record<PresentationBuilderMode, { details: Array<{ title: string; text: string }>; faq: Array<{ question: string; answer: string }> }> = {
  'presentation-maker': {
    details: [
      { title: 'Outline to slides', text: 'Write one slide block at a time. The first line becomes the slide title and following lines become bullet points.' },
      { title: 'Live deck preview', text: 'Review every generated 16:9 slide before downloading the presentation.' },
      { title: 'Real PowerPoint file', text: 'The browser creates a standard PPTX package using a lightweight built-in presentation writer.' },
    ],
    faq: [
      { question: 'Can I create a presentation online?', answer: 'Yes. Enter a structured outline, preview the resulting slides, and download the deck as PPTX.' },
      { question: 'Does the presentation maker use AI?', answer: 'No. It structures the text you provide; it does not invent or generate presentation content.' },
      { question: 'Can I open the file in PowerPoint?', answer: 'The tool exports a standard PPTX package designed for PowerPoint and compatible presentation software.' },
    ],
  },
  'powerpoint-online': {
    details: [
      { title: 'Manual slide editing', text: 'Add slides and edit each title and bullet list directly in the browser.' },
      { title: 'Simple focused editor', text: 'The tool focuses on clean text slides rather than pretending to reproduce every desktop PowerPoint feature.' },
      { title: 'PPTX export', text: 'Download the current deck as a real PowerPoint PPTX file whenever you are ready.' },
    ],
    faq: [
      { question: 'Can I make PowerPoint slides online?', answer: 'Yes. Add and edit simple title-and-bullet slides, preview them, and export the presentation as PPTX.' },
      { question: 'Can I upload and fully edit an existing PPTX?', answer: 'Not in this version. PowerPoint Online currently creates and edits new lightweight slides rather than importing existing decks.' },
      { question: 'Does it support animations and charts?', answer: 'No. The current editor intentionally focuses on text slides and does not claim advanced desktop PowerPoint features.' },
    ],
  },
};

export function PresentationBuilderPage({ route, mode }: { route: string; mode: PresentationBuilderMode }) {
  const tool = getAllPlatformToolByRoute(route);
  if (!tool) throw new Error(`Unknown presentation route: ${route}`);
  const page = content[mode];
  return <PlatformTaskPage route={route} title={tool.title} description={tool.description} tool={<PresentationBuilderInterface mode={mode} toolId={tool.id} />} details={page.details} faq={page.faq} />;
}
