import { pageMetadata } from '@/lib/seo';
import { getWordInterface } from '@/tools/word/interfaces/config';
import { WordSingleProcessorPage } from '@/components/WordSingleProcessorPage';
const tool = getWordInterface('rtf-to-docx');
export const metadata = pageMetadata({ title: tool.title, description: tool.description, path: tool.route });
export default function Page(){return <WordSingleProcessorPage id="rtf-to-docx" processorId="rtf-to-docx" heading="Convert RTF to DOCX online" inputLabel="an RTF file" accept=".rtf,application/rtf,text/rtf" actionLabel="Creating DOCX" downloadLabel="Download DOCX" />;}
