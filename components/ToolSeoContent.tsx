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
  if (tool.kind === 'converter') return `${tool.name} is useful when the file you already have is not in the format required by the person, app, website, printer, or workflow receiving it. Instead of rebuilding the content by hand, the tool gives you a direct path from ${inputLabel} to ${outputLabel}. A good conversion workflow should keep the format change obvious, avoid unrelated settings, and make the finished file easy to check before you download it. That is the approach here: add the source, choose only the options that matter, process it, then review the result before you move on.`;
  if (tool.kind === 'editor') return `${tool.name} is designed for the moments when you need to make practical changes without installing a separate desktop application. The document and the controls stay in one browser workspace, so the job remains focused on the edit itself instead of the software around it. That can be especially useful for corrections, last-minute updates, shared computers, school or office work, and situations where you only need to open a file, change what matters, and leave with a usable result.`;
  if (tool.kind === 'viewer') return `${tool.name} makes the first step simple: open the document and inspect it before deciding whether anything else needs to happen. A viewer should not force you into an editing workflow when all you want is to check content, pages, layout, or data. Once you have reviewed the file, you can stop there or continue into conversion, editing, organizing, or another related task only when it is actually necessary.`;
  if (tool.kind === 'creator') return `${tool.name} is built to reduce blank-page friction. Instead of starting with an empty document and wondering what belongs in it, the page guides you toward the information needed for the finished result. You can concentrate on the content, review what has been created, then continue with editing, conversion, or sharing only if the document needs another step. That makes the workflow useful for quick business, school, personal, and administrative documents.`;
  if (['text', 'language'].includes(tool.kind)) return `${tool.name} focuses on one writing or text task so the interface can stay small and understandable. Paste or type the content, make the change you came for, review the result, and take it into the next document or message. That is useful for quick cleanup, rewriting, counting, formatting, language work, and other small text jobs that do not need a full word processor or a large editing suite.`;
  return `${tool.name} focuses on one document job instead of surrounding it with unrelated controls. That matters when the task is small but necessary and you want to finish it quickly. Bring in the supported file or content, choose the settings that affect your result, run the task, and review what changed before you download it. The page is structured so the main action remains clear from the moment you arrive.`;
}

function inputAdvice(inputs: string[]) {
  const joined = inputs.join(' ');
  if (/PDF/.test(joined)) return 'For PDF files, start with the cleanest source you have. Password protection, damaged files, unusual embedded fonts, very large scans, or image-only pages can affect what any browser-based PDF workflow can read or change. If the document is a scan and you need selectable text, OCR may be the better first step. If exact page appearance matters, review every important page after processing before you send, print, archive, or upload the result.';
  if (/DOCX|DOC|ODT|RTF/.test(joined)) return 'For Word and document files, use the original editable file when possible rather than a screenshot or flattened copy. Complex page layouts, uncommon fonts, floating objects, tracked changes, and application-specific features can behave differently outside the program that created them. Check headings, tables, page breaks, images, and any formatting that is important to the final document before you share it.';
  if (/JPG|JPEG|PNG|IMG|SCAN/.test(joined)) return 'For images and scans, source quality matters. Straight pages, readable contrast, sharp text, and enough resolution usually produce a better result, especially when OCR or document reconstruction is involved. Cropping away unnecessary background can make the intended content easier to recognize. If the source is a phone photo, try to avoid glare, blur, shadows, and extreme perspective before processing it.';
  if (/XLSX|XLS|CSV/.test(joined)) return 'For spreadsheets, make sure the workbook opens normally and that the sheet, rows, columns, dates, formulas, and values you care about are present before processing. Conversion can change pagination or visual layout, so inspect the generated result when exact printing or presentation matters. If you are working with CSV, remember that formatting and formulas are not stored in the same way as a workbook.';
  if (/PPTX|PPT/.test(joined)) return 'For presentations, start with the original deck whenever possible. Custom fonts, animations, media, and complex slide elements may not behave the same in every browser or exported format. Review important slides after processing, especially if the file will be presented publicly, printed, or shared with a client or team.';
  return 'For the best result, start with complete source content and review the output before using it in an important workflow. If the file is damaged, incomplete, password protected, or in a different format from the one this tool expects, a related repair, unlock, OCR, or conversion tool may be a better first step.';
}

function useCaseCopy(tool: PlatformToolDefinition) {
  if (/resume|cv/i.test(tool.name)) return 'Typical uses include preparing a job application, updating an existing résumé, creating a cleaner version for a recruiter, or converting the finished document into the format requested by an employer or application portal.';
  if (/invoice|receipt|proposal|memo|agenda|minutes|business/i.test(tool.name)) return 'Typical uses include everyday business administration, client communication, internal documentation, record keeping, and preparing files that need to be shared with coworkers, customers, or vendors in a predictable format.';
  if (/pdf/i.test(`${tool.name} ${tool.route} ${tool.cluster}`)) return 'Typical uses include preparing PDFs for email, forms, school or office submissions, document archives, client handoffs, printing, and workflows where a PDF needs to be edited, organized, converted, reduced, protected, or made easier to share.';
  if (/word|docx|document/i.test(`${tool.name} ${tool.route} ${tool.cluster}`)) return 'Typical uses include school assignments, reports, letters, forms, office documents, client files, and shared drafts where you need to open, edit, inspect, convert, or prepare a Word document for the next person in the workflow.';
  return 'Typical uses range from school and office work to personal documents and quick one-off tasks. The important part is choosing the tool that matches the job you actually need to complete instead of forcing the file through a larger application with controls you do not need.';
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
  const links = relatedTools.slice(0, 6);

  return (
    <section className="platform-task-seo" aria-labelledby="platform-task-seo-title">
      <div className="platform-task-seo-intro">
        <span className="platform-task-section-kicker">A simpler way to finish the job</span>
        <h2 id="platform-task-seo-title">About {tool.name}</h2>
        <p><strong>{tool.name}</strong> is built around one clear outcome: {lowerFirst(tool.primaryIntent)}. If you already have {inputLabel} and need {outputLabel}, this page keeps the working tool, the explanation, and the useful next steps together. You do not have to dig through a large software menu just to find the feature you came for. Start with the workspace above, complete the task, review the result, and continue only if your document actually needs another step. {links[0] ? <>If the file needs preparation first, <Link href={links[0].route}>{links[0].name}</Link> may be a useful companion because it helps you {lowerFirst(links[0].primaryIntent)}.</> : null}</p>
      </div>

      <div className="platform-task-seo-grid">
        <article>
          <h3>When {tool.name} is useful</h3>
          <p>{kindExplanation(tool, inputLabel, outputLabel)}</p>
          <p>{useCaseCopy(tool)} {links[1] ? <>For another common route in the same workflow, <Link href={links[1].route}>{links[1].name}</Link> can help you {lowerFirst(links[1].primaryIntent)} without leaving DOC321.</> : null}</p>
        </article>

        <article>
          <h3>Prepare the source for a better result</h3>
          <p>{inputAdvice(inputs)}</p>
          <p>Before you process anything important, make sure you selected the correct version of the source file. Check the file name, page count, visible content, and whether the document opens normally. If the source is protected, damaged, scanned, or simply the wrong format, fixing that first usually saves time. {links[2] ? <>A tool such as <Link href={links[2].route}>{links[2].name}</Link> can be the better first step when you need to {lowerFirst(links[2].primaryIntent)}.</> : null}</p>
        </article>
      </div>

      <article className="platform-task-seo-wide">
        <h3>Review the output before you rely on it</h3>
        <p>Browser tools can make document work much faster, but the final review still matters. After processing, check the parts of the file that affect your real task: page order, text, images, spacing, file size, formulas, slide layout, links, or whatever else is important for the document type. If you are sending the result to a school, employer, customer, government service, printer, or another application, confirm that the file opens correctly and contains the expected information before you submit it.</p>
        <p>That quick check is especially useful when a document contains unusual formatting or was originally created in another application. The goal is not just to produce a download; it is to produce a result you can actually use. {links[3] ? <>If the result needs one more adjustment, <Link href={links[3].route}>{links[3].name}</Link> is available to help you {lowerFirst(links[3].primaryIntent)}.</> : null}</p>
      </article>

      <article className="platform-task-seo-workflow">
        <h3>Continue the workflow without starting over</h3>
        <p>Document work rarely ends with one action. After you {lowerFirst(tool.primaryIntent)}, you may need to make the file smaller, convert it again, combine it with another document, extract text, edit content, protect it, or prepare it for sharing. DOC321 keeps related tools connected so the next step is easy to find without returning to a search engine or opening a different service.</p>
        <p>{links[4] ? <>For example, <Link href={links[4].route}>{links[4].name}</Link> helps you {lowerFirst(links[4].primaryIntent)}.</> : null} {links[5] ? <>You can also use <Link href={links[5].route}>{links[5].name}</Link> when the next job is to {lowerFirst(links[5].primaryIntent)}.</> : null} If neither matches what you need, browse the <Link href={`/tools#tools-${group.id}`}>{group.label}</Link> section for tools from the same document family, or open the <Link href="/tools">complete tools directory</Link> to see every live DOC321 workflow on one page.</p>
      </article>

      <article className="platform-task-seo-wide">
        <h3>Designed for quick, private document work</h3>
        <p>DOC321 is designed around practical browser tasks rather than account creation, advertising, or unnecessary setup. The most important action stays near the top of the page, while supporting information sits below it for people who want to understand the workflow in more detail. That means a first-time visitor can begin immediately, while someone handling a more important document can read the guidance, check supported inputs and outputs, compare related tools, and review common questions before processing anything.</p>
        <p>The same page structure is used across PDF, Word, image, spreadsheet, presentation, text, and document-creation tools so the site feels familiar after the first visit. Individual tools still keep their own color and workflow, but the interaction pattern stays predictable: understand the task, work in the hero, see the result, and move to the next relevant step only when you need it. This consistency is meant to reduce mistakes and make repeated document work faster over time.</p>
      </article>
    </section>
  );
}
