import { ImageToWordPage } from '@/components/ImageToWordPage';
import { pageMetadata } from '@/lib/seo';
import { getAllPlatformToolByRoute } from '@/tools/platform/allTools';
const route = '/png-to-word';
const tool = getAllPlatformToolByRoute(route)!;
export const metadata = pageMetadata({ title: tool.title, description: tool.description, path: tool.route });
export default function Page() { return <ImageToWordPage route={route} mode="png-to-word" />; }
