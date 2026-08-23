import { pageMetadata } from '@/lib/seo';
import { getWordInterface } from '@/tools/word/interfaces/config';
import { WordSingleProcessorPage } from '@/components/WordSingleProcessorPage';
const tool = getWordInterface('docx-to-html');
export const metadata = pageMetadata({ title: tool.title, description: tool.description, path: tool.route });
export default function Page(){return <WordSingleProcessorPage id="docx-to-html" processorId="docx-to-html" heading="Convert DOCX to HTML online" inputLabel="a DOCX file" accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" actionLabel="Converting to HTML" downloadLabel="Download HTML" />;}
