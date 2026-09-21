import { ImageToExcelPage } from '@/components/ImageToExcelPage';
import { pageMetadata } from '@/lib/seo';
import { getAllPlatformToolByRoute } from '@/tools/platform/allTools';

const route = '/image-to-excel';
const tool = getAllPlatformToolByRoute(route)!;

export const metadata = pageMetadata({
  title: tool.title,
  description: tool.description,
  path: tool.route,
});

export default function Page() {
  return <ImageToExcelPage route={route} />;
}
