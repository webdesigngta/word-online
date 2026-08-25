import { PdfStampPage } from '@/components/PdfStampPage';
import { pageMetadata } from '@/lib/seo';
import { getAllPlatformToolByRoute } from '@/tools/platform/allTools';
const route = '/number-pdf-pages';
const tool = getAllPlatformToolByRoute(route)!;
export const metadata = pageMetadata({ title: tool.title, description: tool.description, path: tool.route });
export default function Page() { return <PdfStampPage route={route} mode="number-pdf-pages" />; }
