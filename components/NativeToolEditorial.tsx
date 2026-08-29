import { FaqJsonLd, HowToJsonLd } from '@/components/JsonLd';
import { ToolFeatureStrip } from '@/components/ToolFeatureStrip';
import { UniversalToolEditorialContent } from '@/components/UniversalToolEditorialContent';
import { getAllPlatformToolByRoute } from '@/tools/platform/allTools';

export function NativeToolEditorial({
  route,
  description,
  details,
  faq,
  steps,
}: {
  route: string;
  description: string;
  details: Array<{ title: string; text: string }>;
  faq: Array<{ question: string; answer: string }>;
  steps: Array<{ title: string; text: string }>;
}) {
  const tool = getAllPlatformToolByRoute(route);
  if (!tool) return null;

  return (
    <>
      <div className="platform-task-page native-tool-editorial">
        <div className="platform-task-wrap">
          <ToolFeatureStrip storageMode="local" />
          <UniversalToolEditorialContent
            tool={tool}
            description={description}
            details={details}
            faq={faq}
            steps={steps}
          />
        </div>
      </div>
      <FaqJsonLd items={faq} />
      <HowToJsonLd name={`How to use ${tool.name}`} description={description} steps={steps} path={tool.route} />
    </>
  );
}
