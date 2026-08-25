import { PdfUtilityPage } from '@/components/PdfUtilityPage';
import { pageMetadata } from '@/lib/seo';
import { getAllPlatformToolByRoute } from '@/tools/platform/allTools';
const route = '/pdf-to-word';
const tool = getAllPlatformToolByRoute(route)!;
export const metadata = pageMetadata({ title: tool.title, description: tool.description, path: tool.route });
export default function Page(){ return <PdfUtilityPage route={route} mode="pdf-to-word" />; }
