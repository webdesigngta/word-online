import { getWordInterface, type WordInterfaceId } from '@/tools/word/interfaces/config';
import { WordTaskPage } from '@/components/WordTaskPage';
import { WordSingleFileProcessorInterface } from '@/components/WordSingleFileProcessorInterface';

type ProcessorId =
  | 'docx-to-html'
  | 'html-to-docx'
  | 'docx-to-txt'
  | 'txt-to-docx'
  | 'docx-to-rtf'
  | 'rtf-to-docx'
  | 'docx-to-odt'
  | 'odt-to-docx'
  | 'compress-docx'
  | 'repair-docx';

export function WordSingleProcessorPage({
  id,
  processorId,
  heading,
  inputLabel,
  accept,
  actionLabel,
  downloadLabel,
  notes,
}: {
  id: WordInterfaceId;
  processorId: ProcessorId;
  heading: string;
  inputLabel: string;
  accept: string;
  actionLabel: string;
  downloadLabel: string;
  notes?: { fidelity?: string; output?: string };
}) {
  const tool = getWordInterface(id);
  const fidelity = notes?.fidelity || 'The processor focuses on common document content. Very advanced format-specific features may be simplified during conversion.';
  const output = notes?.output || `When processing succeeds, download the generated ${tool.output.join('/').toUpperCase()} file directly from the browser.`;
  const faq = [
    { question: `How do I use the ${tool.name} tool?`, answer: `Choose ${inputLabel}, let the browser process it, then download the generated output file.` },
    { question: 'Do I need to install desktop software?', answer: 'No. The existing document processor runs through the browser-based tool interface.' },
    { question: 'Will every advanced formatting feature be preserved?', answer: fidelity },
  ];

  return (
    <WordTaskPage
      eyebrow={tool.eyebrow}
      title={heading}
      description={tool.description}
      tool={
        <WordSingleFileProcessorInterface
          processorId={processorId}
          title={tool.name}
          description={`Choose ${inputLabel} to start. This interface calls the shared ${tool.processor || 'document'} processor rather than a separate conversion app.`}
          accept={accept}
          inputLabel={inputLabel}
          actionLabel={actionLabel}
          downloadLabel={downloadLabel}
        />
      }
      details={[
        { title: 'Task-specific input', text: `This route is configured specifically for ${tool.primaryIntent.toLowerCase()}.` },
        { title: 'Shared document engine', text: `The interface reuses ${tool.processor || 'the Word engine'}, keeping validation and processing logic centralized.` },
        { title: 'Download the result', text: output },
      ]}
      faq={faq}
    />
  );
}
