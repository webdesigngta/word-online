import { pageMetadata } from '@/lib/seo';
import { getWordInterface } from '@/tools/word/interfaces/config';
import { WordSingleProcessorPage } from '@/components/WordSingleProcessorPage';
const tool = getWordInterface('txt-to-docx');
export const metadata = pageMetadata({ title: tool.title, description: tool.description, path: tool.route });
export default function Page(){return <WordSingleProcessorPage id="txt-to-docx" processorId="txt-to-docx" heading="Convert TXT to DOCX online" inputLabel="a TXT file" accept=".txt,text/plain" actionLabel="Creating DOCX" downloadLabel="Download DOCX" notes={{fidelity:'Plain text has no original fonts, layout or rich formatting, so the generated DOCX starts with a simple editable document structure.'}} />;}
