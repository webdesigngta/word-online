import { TextUtilityPage } from '@/components/TextUtilityPage';
import { pageMetadata } from '@/lib/seo';
import { getPlatformToolByRoute } from '@/tools/platform/catalog';

const route = '/online-notepad';
const tool = getPlatformToolByRoute(route)!;

export const metadata = pageMetadata({
  title: tool.title,
  description: tool.description,
  path: tool.route,
});

export default function Page() {
  return <TextUtilityPage route={route} mode="notepad" />;
}
