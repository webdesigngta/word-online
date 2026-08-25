import { ScanToWordPage } from '@/components/ScanToWordPage';
import { pageMetadata } from '@/lib/seo';
import { getAllPlatformToolByRoute } from '@/tools/platform/allTools';

const route = '/scan-to-word';
const tool = getAllPlatformToolByRoute(route)!;

export const metadata = pageMetadata({ title: tool.title, description: tool.description, path: tool.route });

export default function Page() {
  return <ScanToWordPage />;
}
