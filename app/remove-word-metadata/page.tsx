import { pageMetadata } from '@/lib/seo';
import { getWordInterface } from '@/tools/word/interfaces/config';
import { WordSingleProcessorPage } from '@/components/WordSingleProcessorPage';

const tool = getWordInterface('remove-word-metadata');
export const metadata = pageMetadata({ title: tool.title, description: tool.description, path: tool.route });

export default function RemoveWordMetadataPage() {
  return <WordSingleProcessorPage id="remove-word-metadata" processorId="remove-word-metadata" heading="Remove metadata from a Word document" inputLabel="a DOCX file" accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" actionLabel="Removing metadata" downloadLabel="Download cleaned DOCX" notes={{ fidelity: 'The processor clears common core, extended and custom DOCX properties while preserving the main document content. It does not claim to remove every possible hidden artifact in every Word file.', output: 'Download a rebuilt DOCX with common document properties removed while the main document package is otherwise preserved.' }} />;
}
