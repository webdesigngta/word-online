import { pageMetadata } from '@/lib/seo';
import { getWordInterface } from '@/tools/word/interfaces/config';
import { WordSingleProcessorPage } from '@/components/WordSingleProcessorPage';
const tool = getWordInterface('compress-docx');
export const metadata = pageMetadata({ title: tool.title, description: tool.description, path: tool.route });
export default function Page(){return <WordSingleProcessorPage id="compress-docx" processorId="compress-docx" heading="Compress DOCX files online" inputLabel="a DOCX file" accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" actionLabel="Compressing DOCX" downloadLabel="Download compressed DOCX" notes={{fidelity:'Compression preserves the Word document package where possible, but the amount saved depends on the original file contents.'}} />;}
