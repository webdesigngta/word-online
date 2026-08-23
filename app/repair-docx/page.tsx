import { pageMetadata } from '@/lib/seo';
import { getWordInterface } from '@/tools/word/interfaces/config';
import { WordSingleProcessorPage } from '@/components/WordSingleProcessorPage';
const tool = getWordInterface('repair-docx');
export const metadata = pageMetadata({ title: tool.title, description: tool.description, path: tool.route });
export default function Page(){return <WordSingleProcessorPage id="repair-docx" processorId="repair-docx" heading="Repair a DOCX file online" inputLabel="a DOCX file" accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" actionLabel="Repairing DOCX" downloadLabel="Download repaired DOCX" notes={{fidelity:'Repair is best-effort. Severely corrupted files or unsupported package damage may not be recoverable.'}} />;}
