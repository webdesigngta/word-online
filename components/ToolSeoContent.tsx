import Link from 'next/link';
import type { PlatformToolDefinition } from '@/tools/platform/catalog';
import { directoryGroupId, groupDefinition } from '@/lib/toolDesign';

function formatTypes(values: readonly string[]) {
  const ignored = new Set(['blank', 'preview', 'summary']);
  return values
    .map((value) => value.trim())
    .filter((value) => value && !ignored.has(value.toLowerCase()))
    .map((value) => value.toUpperCase())
    .filter((value, index, list) => list.indexOf(value) === index);
}

function lowerFirst(value: string) {
  if (!value) return value;
  return `${value.charAt(0).toLowerCase()}${value.slice(1)}`;
}

function kindExplanation(tool: PlatformToolDefinition, inputLabel: string, outputLabel: string) {
  if (tool.kind === 'converter') {
    return `File conversion is most useful when the document you already have is not in the format required by the person, app, website, or workflow receiving it. Instead of rebuilding the content manually, ${tool.name} gives you a focused path from ${inputLabel} to ${outputLabel}. The goal is not to add unnecessary controls; it is to help you complete the format change, check the result, and move on to the next step with less friction.`;
  }
  if (tool.kind === 'editor') {
    return `An online editor is useful when you need to make practical changes without first installing a separate desktop application. ${tool.name} keeps the document and the editing controls in the same workspace so you can concentrate on the change itself. That is especially helpful for quick corrections, last-minute updates, shared computers, or situations where you simply want to open a file, work on it, and export a usable result.`;
  }
  if (tool.kind === 'viewer') {
    return `A viewer should make it easy to inspect a document before you decide what to do next. ${tool.name} is built for that first step: open the file, review the content, and then move into editing, conversion, printing, or another document task only if you need it. This keeps a simple viewing job from turning into a complicated workflow and makes the page useful even when you do not need to change the original file.`;
  }
  if (tool.kind === 'creator') {
    return `Creating a document from scratch is easier when the page guides you toward the information that actually belongs in the finished file. ${tool.name} is designed to reduce blank-page friction and turn the details you provide into a practical document workflow. You can focus on the content, review what you have created, and then continue with related editing, conversion, or sharing tools when the document needs another step.`;
  }
  if (['text', 'language'].includes(tool.kind)) {
    return `Text utilities work best when they stay out of the way. ${tool.name} is designed for a specific writing task, so you can paste or type content, make the change you came for, and take the result into your next document or message. This is useful for quick cleanup, rewriting, counting, formatting, or other small text jobs that do not need a full word processor.`;
  }
  return `${tool.name} focuses on one document job rather than surrounding it with unrelated features. That matters when you are trying to finish a small but necessary step quickly. Bring in the supported file or content, complete the task, review what changed, and then download the result or continue into a related workflow. The page is structured so the main action remains obvious from the moment you arrive.`;
}

function inputAdvice(inputs: string[]) {
  const joined = inputs.join(' ');
  if (/PDF/.test(joined)) {
    return 'For PDF files, start with the cleanest source you have. Password protection, damaged files, unusual embedded fonts, very large scans, or image-only pages can affect what any browser-based PDF workflow can read or change. If the document is a scan and you need selectable text, an OCR step may be more appropriate before editing or converting.';
  }
  if (/DOCX|DOC|ODT|RTF/.test(joined)) {
    return 'For Word and document files, use the original editable file when possible rather than a screenshot or flattened copy. Complex page layouts, uncommon fonts, floating objects, tracked changes, or application-specific features can behave differently outside the program that created them, so review the result before sending or publishing it.';
  }
  if (/JPG|JPEG|PNG|IMG|SCAN/.test(joined)) {
    return 'For images and scans, clearer source quality usually produces a better result. Straight pages, readable contrast, sharp text, and sufficient resolution are especially important when OCR or document reconstruction is involved. Cropping away unnecessary background before processing can also make the intended content easier to recognize.';
  }
  if (/XLSX|XLS|CSV/.test(joined)) {
    return 'For spreadsheet files, check that the workbook opens normally and that the sheet, rows, columns, dates, and formulas you care about are present before processing. Conversion can change pagination or visual layout, so inspect the generated result when exact printing or presentation is important.';
  }
  if (/PPTX|PPT/.test(joined)) {
    return 'For presentations, start with the original deck whenever possible. Custom fonts, animations, media, and complex slide elements may not behave the same in every browser or exported format, so review important slides after processing before you share the final file.';
  }
  return 'For the best result, start with complete source content and review the output before using it in an important workflow. If the file is damaged, incomplete, password protected, or in a different format from the one this tool expects, a related repair, unlock, OCR, or conversion tool may be a better first step.';
}

function useCaseCopy(tool: PlatformToolDefinition) {
  if (/resume|cv/i.test(tool.name)) return 'Typical uses include preparing a job application, updating an existing résumé, creating a cleaner version for a recruiter, or converting the finished document into the format requested by an employer or application portal.';
  if (/invoice|receipt|proposal|memo|agenda|minutes|business/i.test(tool.name)) return 'Typical uses include everyday business administration, client communication, internal documentation, record keeping, and preparing files that need to be shared with coworkers, customers, or vendors in a predictable format.';
  if (/pdf/i.test(`${tool.name} ${tool.route} ${tool.cluster}`)) return 'Typical uses include preparing PDFs for email, forms, school or office submissions, document archives, client handoffs, printing, and workflows where a PDF needs to be edited, organized, converted, reduced, protected, or made easier to share.';
  if (/word|docx|document/i.test(`${tool.name} ${tool.route} ${tool.cluster}`)) return 'Typical uses include school assignments, reports, letters, forms, office documents, client files, and shared drafts where you need to open, edit, inspect, convert, or prepare a Word document for the next person in the workflow.';
  return 'Typical uses range from school and office work to personal documents and quick one-off tasks. The important part is choosing the tool that matches the job you actually need to complete, rather than forcing the file through a larger application with controls you do not need.';
}

export function ToolSeoContent({
  tool,
  relatedTools,
}: {
  tool: PlatformToolDefinition;
  relatedTools: readonly PlatformToolDefinition[];
}) {
  const inputs = formatTypes(tool.input);
  const outputs = formatTypes(tool.output);
  const inputLabel = inputs.length ? inputs.slice(0, 3).join(', ') : 'your source content';
  const outputLabel = outputs.length ? outputs.slice(0, 3).join(', ') : 'a usable result';
  const group = groupDefinition(directoryGroupId(tool));
  const links = relatedTools.slice(0, 5);

  return (
    <section className="platform-task-seo" aria-labelledby="platform-task-seo-title">
      <div className="platform-task-seo-intro">
        <span className="platform-task-section-kicker">A simpler way to finish the job</span>
        <h2 id="platform-task-seo-title">About {tool.name}</h2>
        <p><strong>{tool.name}</strong> is built around one clear outcome: {lowerFirst(tool.primaryIntent)}. If you already have {inputLabel} and need {outputLabel}, this page keeps the action, the explanation, and the next useful steps together. You do not have to dig through a large software menu just to find the feature you came for. Start with the tool above, complete the task, review the result, and continue only when your document actually needs another step.</p>
      </div>

      <div className="platform-task-seo-grid">
        <article>
          <h3>When {tool.name} is useful</h3>
          <p>{kindExplanation(tool, inputLabel, outputLabel)}</p>
          <p>{useCaseCopy(tool)}</p>
        </article>

        <article>
          <h3>Tips for better results</h3>
          <p>{inputAdvice(inputs)}</p>
          <p>Before downloading or sharing the finished file, give the result a quick review. Check the pages, text, images, order, formatting, or file size that matter for your task. If the output is not what you expected, go back to the source file and make sure it is the right version and format before trying again.</p>
        </article>
      </div>

      <article className="platform-task-seo-workflow">
        <h3>Continue the workflow without starting over</h3>
        <p>
          Document work rarely ends with one action. After {lowerFirst(tool.primaryIntent)}, you may need another closely related step.
          {links[0] ? <> You can use <Link href={links[0].route}>{links[0].name}</Link> when you need to {lowerFirst(links[0].primaryIntent)}.</> : null}
          {links[1] ? <> For a different next step, <Link href={links[1].route}>{links[1].name}</Link> helps you {lowerFirst(links[1].primaryIntent)}.</> : null}
          {links[2] ? <> You can also move to <Link href={links[2].route}>{links[2].name}</Link> to {lowerFirst(links[2].primaryIntent)}.</> : null}
          {links[3] ? <> If your goal changes, <Link href={links[3].route}>{links[3].name}</Link> is available for {lowerFirst(links[3].primaryIntent)}.</> : null}
        </p>
        <p>If none of those matches what you need, browse the <Link href={`/tools#tools-${group.id}`}>{group.label}</Link> collection for tools that work with the same document family, or open the <Link href="/tools">complete document tools directory</Link> to find another workflow by task or file type. These contextual links are intentionally placed around the current job so every tool page can act as both a useful destination and a sensible next step in the wider document workflow.</p>
      </article>
    </section>
  );
}
