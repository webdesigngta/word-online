import { pageMetadata } from '@/lib/seo';
import { getWordInterface } from '@/tools/word/interfaces/config';
import { WordSingleProcessorPage } from '@/components/WordSingleProcessorPage';
const tool = getWordInterface('docx-to-txt');
export const metadata = pageMetadata({ title: tool.title, description: tool.description, path: tool.route });
export default function Page(){return <WordSingleProcessorPage id="docx-to-txt" processorId="docx-to-txt" heading="Convert DOCX to plain text" inputLabel="a DOCX file" accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" actionLabel="Extracting text" downloadLabel="Download TXT" notes={{fidelity:'Plain-text output intentionally removes visual formatting, images, tables and other non-text document structure.'}} />;}
