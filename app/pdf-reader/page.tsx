import { PdfReadImagePage } from '@/components/PdfReadImagePage';
import { pageMetadata } from '@/lib/seo';
import { getAllPlatformToolByRoute } from '@/tools/platform/allTools';

const route = '/pdf-reader';
const tool = getAllPlatformToolByRoute(route)!;

export const metadata = pageMetadata({ title: tool.title, description: tool.description, path: tool.route });

export default function Page() {
  return <PdfReadImagePage route={route} mode="pdf-reader" />;
}
