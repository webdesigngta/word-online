import { pageMetadata } from '@/lib/seo';
import { getWordInterface } from '@/tools/word/interfaces/config';
import { WordSingleProcessorPage } from '@/components/WordSingleProcessorPage';
const tool = getWordInterface('html-to-docx');
export const metadata = pageMetadata({ title: tool.title, description: tool.description, path: tool.route });
export default function Page(){return <WordSingleProcessorPage id="html-to-docx" processorId="html-to-docx" heading="Convert HTML to DOCX online" inputLabel="an HTML file" accept=".html,.htm,text/html" actionLabel="Converting to DOCX" downloadLabel="Download DOCX" />;}
