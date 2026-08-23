import { pageMetadata } from '@/lib/seo';
import { getWordInterface } from '@/tools/word/interfaces/config';
import { WordSingleProcessorPage } from '@/components/WordSingleProcessorPage';
const tool = getWordInterface('odt-to-docx');
export const metadata = pageMetadata({ title: tool.title, description: tool.description, path: tool.route });
export default function Page(){return <WordSingleProcessorPage id="odt-to-docx" processorId="odt-to-docx" heading="Convert ODT to DOCX online" inputLabel="an ODT file" accept=".odt,application/vnd.oasis.opendocument.text" actionLabel="Creating DOCX" downloadLabel="Download DOCX" />;}
