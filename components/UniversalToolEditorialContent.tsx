import Link from 'next/link';
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Crop,
  Eye,
  FileOutput,
  FileText,
  Files,
  Image as ImageIcon,
  Languages,
  LockKeyhole,
  LockOpen,
  Minimize2,
  Pencil,
  Presentation,
  RefreshCw,
  RotateCw,
  ScanText,
  Scissors,
  ShieldCheck,
  Sparkles,
  SplitSquareVertical,
  Table2,
  Type,
  WandSparkles,
  Workflow,
} from 'lucide-react';
import { ToolVisual } from '@/components/ToolVisual';
import { relatedToolScore } from '@/lib/toolDesign';
import type { PlatformToolDefinition } from '@/tools/platform/catalog';
import { allLivePlatformTools } from '@/tools/platform/allTools';
import styles from './UniversalToolEditorialContent.module.css';

type Detail = { title: string; text: string };
type Faq = { question: string; answer: string };
type Step = { title: string; text: string };
type VisualMode =
  | 'convert'
  | 'merge'
  | 'split'
  | 'compress'
  | 'rotate'
  | 'crop'
  | 'edit'
  | 'view'
  | 'ocr'
  | 'security'
  | 'unlock'
  | 'text'
  | 'language'
  | 'spreadsheet'
  | 'presentation'
  | 'image'
  | 'creator'
  | 'analyze'
  | 'utility';

function unique(values: readonly string[]) {
  return values.filter((value, index, list) => value && list.indexOf(value) === index);
}

function formatTypes(values: readonly string[]) {
  const ignored = new Set(['blank', 'preview', 'summary', 'statistics', 'clipboard']);
  return unique(values
    .map((value) => value.trim())
    .filter((value) => value && !ignored.has(value.toLowerCase()))
    .map((value) => value.replace(/\+$/, '').toUpperCase()));
}

function readableType(value: string) {
  if (!value) return 'file';
  const map: Record<string, string> = {
    'SEARCHABLE-PDF': 'Searchable PDF',
    'PLAIN-TEXT': 'Plain text',
    'TEXT': 'text',
    'IMAGE': 'image',
    'IMAGES': 'images',
    'RESULT': 'result',
  };
  return map[value] ?? value;
}

function naturalList(values: readonly string[]) {
  if (!values.length) return '';
  if (values.length === 1) return values[0];
  if (values.length === 2) return `${values[0]} and ${values[1]}`;
  return `${values.slice(0, -1).join(', ')}, and ${values.at(-1)}`;
}

function choiceList(values: readonly string[]) {
  if (!values.length) return 'file';
  if (values.length === 1) return values[0];
  if (values.length === 2) return `${values[0]} or ${values[1]}`;
  return `${values.slice(0, -1).join(', ')}, or ${values.at(-1)}`;
}

function sentenceIntent(value: string) {
  const text = value.trim().replace(/[.!]+$/, '');
  return text ? `${text.charAt(0).toLowerCase()}${text.slice(1)}` : 'finish the task';
}

function titleIntent(value: string) {
  const text = value.trim().replace(/[.!]+$/, '');
  return text ? `${text.charAt(0).toUpperCase()}${text.slice(1)}` : 'Finish the Task Online';
}

function routeText(tool: PlatformToolDefinition) {
  return `${tool.route} ${tool.name} ${tool.primaryIntent} ${tool.cluster}`.toLowerCase();
}

function visualMode(tool: PlatformToolDefinition): VisualMode {
  const text = routeText(tool);
  if (/merge|combine/.test(text)) return 'merge';
  if (/split|extract pages|separate pages/.test(text)) return 'split';
  if (/compress|reduce.*size|minif/.test(text)) return 'compress';
  if (/rotate/.test(text)) return 'rotate';
  if (/crop/.test(text)) return 'crop';
  if (/ocr|scan.*text|searchable pdf/.test(text)) return 'ocr';
  if (/unlock|remove password/.test(text)) return 'unlock';
  if (/protect|password|encrypt|security|secure/.test(text)) return 'security';
  if (tool.kind === 'editor' || /edit|annotat|redact|watermark|sign/.test(text)) return 'edit';
  if (tool.kind === 'viewer' || /reader|viewer|view /.test(text)) return 'view';
  if (tool.kind === 'language') return 'language';
  if (tool.kind === 'text') return 'text';
  if (tool.kind === 'spreadsheet' || /spreadsheet|excel|xlsx|csv/.test(text)) return 'spreadsheet';
  if (tool.kind === 'presentation' || /ppt|presentation|slide/.test(text)) return 'presentation';
  if (/jpg|jpeg|png|image|photo/.test(text) || tool.kind === 'ocr') return 'image';
  if (tool.kind === 'creator') return 'creator';
  if (tool.kind === 'analyzer' || /count|info|metadata|analy|compare/.test(text)) return 'analyze';
  if (tool.kind === 'converter') return 'convert';
  return 'utility';
}

function actionIcon(mode: VisualMode) {
  if (mode === 'merge') return Files;
  if (mode === 'split') return SplitSquareVertical;
  if (mode === 'compress') return Minimize2;
  if (mode === 'rotate') return RotateCw;
  if (mode === 'crop') return Crop;
  if (mode === 'edit') return Pencil;
  if (mode === 'view') return Eye;
  if (mode === 'ocr') return ScanText;
  if (mode === 'security') return LockKeyhole;
  if (mode === 'unlock') return LockOpen;
  if (mode === 'text') return Type;
  if (mode === 'language') return Languages;
  if (mode === 'spreadsheet') return Table2;
  if (mode === 'presentation') return Presentation;
  if (mode === 'image') return ImageIcon;
  if (mode === 'creator') return WandSparkles;
  if (mode === 'analyze') return BarChart3;
  if (mode === 'convert') return RefreshCw;
  return Workflow;
}

function formatPhrase(values: readonly string[]) {
  const readable = values.map(readableType);
  return choiceList(readable);
}

function introHeading(tool: PlatformToolDefinition, inputTypes: readonly string[], outputTypes: readonly string[]) {
  const input = formatPhrase(inputTypes.length ? inputTypes : ['FILE']);
  const output = formatPhrase(outputTypes.length ? outputTypes : ['RESULT']);
  const mode = visualMode(tool);

  if (tool.kind === 'converter') {
    const converterName = /converter$/i.test(tool.name) ? tool.name : `${tool.name} Converter`;
    return `Free ${converterName}: Convert ${input} to ${output}`;
  }
  if (tool.kind === 'editor') return `Free ${tool.name}: Edit ${input} Online`;
  if (tool.kind === 'viewer') return `Free ${tool.name}: View ${input} Online`;
  if (tool.kind === 'creator') return `Free ${tool.name}: Create ${output} Online`;
  if (mode === 'merge') return `Free ${tool.name}: Combine ${input} Files Online`;
  if (mode === 'split') return `Free ${tool.name}: Split ${input} Files Online`;
  if (mode === 'compress') return `Free ${tool.name}: Reduce ${input} File Size Online`;
  if (mode === 'ocr') return `Free ${tool.name}: Extract Text Online`;
  if (mode === 'security') return `Free ${tool.name}: Protect ${input} Online`;
  if (mode === 'unlock') return `Free ${tool.name}: Remove File Protection Online`;
  return `Free Online ${tool.name}: ${titleIntent(tool.primaryIntent)}`;
}

function normalizeKeywordText(value: string) {
  return value
    .trim()
    .replace(/\b(pdf|docx|doc|jpg|jpeg|png|html|rtf|txt|xlsx|xls|csv|pptx|ppt|odt|epub|ocr)\b/gi, (match) => match.toUpperCase())
    .replace(/\s+/g, ' ');
}

function keywordTask(value: string) {
  const term = normalizeKeywordText(value)
    .replace(/^free\s+/i, '')
    .replace(/^online\s+/i, '')
    .replace(/\s+online$/i, '')
    .replace(/\s+converter$/i, '')
    .trim();

  let match = term.match(/^convert\s+(.+?)\s+to\s+(.+)$/i);
  if (match) return `converting ${match[1]} to ${match[2]}`;
  match = term.match(/^(.+?)\s+to\s+(.+)$/i);
  if (match) return `converting ${match[1]} to ${match[2]}`;
  match = term.match(/^edit\s+(.+)$/i);
  if (match) return `editing ${match[1]}`;
  match = term.match(/^merge\s+(.+)$/i);
  if (match) return `merging ${match[1]}`;
  match = term.match(/^split\s+(.+)$/i);
  if (match) return `splitting ${match[1]}`;
  match = term.match(/^compress\s+(.+)$/i);
  if (match) return `compressing ${match[1]}`;
  match = term.match(/^view\s+(.+)$/i);
  if (match) return `viewing ${match[1]}`;
  match = term.match(/^create\s+(.+)$/i);
  if (match) return `creating ${match[1]}`;
  return '';
}

function keywordContext(tool: PlatformToolDefinition) {
  const tasks = unique(tool.secondaryKeywords.map(keywordTask).filter(Boolean)).slice(0, 3);
  if (!tasks.length) return '';
  return ` It is also useful for ${naturalList(tasks)} when you want the same task handled in one straightforward browser workflow.`;
}

function summaryItems(tool: PlatformToolDefinition, inputTypes: readonly string[], outputTypes: readonly string[]) {
  const input = formatPhrase(inputTypes.length ? inputTypes : ['FILE']);
  const output = formatPhrase(outputTypes.length ? outputTypes : ['RESULT']);
  if (tool.kind === 'converter') return [
    `Free ${tool.name} tool`,
    `Simple ${input} to ${output} workflow`,
    `Upload ${input} and create ${output}`,
  ];
  if (tool.kind === 'editor') return [
    `Edit ${input} in your browser`,
    'Focused document editing workflow',
    `Review and save your ${output}`,
  ];
  if (tool.kind === 'viewer') return [
    `Open ${input} online`,
    'Review the file without editing it',
    'Continue only when another step is needed',
  ];
  if (['text', 'language'].includes(tool.kind)) return [
    `Free ${tool.name}`,
    'Paste or type text directly',
    'Copy or use the result right away',
  ];
  if (tool.kind === 'creator') return [
    `Create ${output} online`,
    'Start from the information you already have',
    'Review the finished document before download',
  ];
  return [
    `Free ${tool.name}`,
    `Works with ${input}`,
    `Get a usable ${output} result`,
  ];
}

function generatedEditorial(tool: PlatformToolDefinition, inputLabel: string, outputLabel: string): Detail[] {
  const input = readableType(inputLabel);
  const output = readableType(outputLabel);
  const intent = sentenceIntent(tool.primaryIntent);
  const mode = visualMode(tool);

  if (tool.kind === 'converter') return [
    {
      title: `${tool.name} With DOC321`,
      text: `${tool.name} is useful when you already have ${input} but the next app, person, upload form, website, or workflow needs ${output}. DOC321 keeps the conversion focused on that format change so you can ${intent} without rebuilding the source by hand.`,
    },
    {
      title: `Move Existing ${input} Content Into ${output}`,
      text: `If the source file already contains the content you need, converting it is usually faster than recreating the same material from the beginning. Upload the ${input}, run the conversion, then review the ${output} result before you use it elsewhere.`,
    },
    {
      title: 'Finish the Format Change Without Extra Software',
      text: `Use the browser workflow when the job is simply to get from ${input} to ${output}. The page keeps the upload, conversion, result, guidance, and nearby next-step tools together so the task stays easy to understand.`,
    },
  ];

  if (mode === 'merge') return [
    { title: 'Combine Files Into One Clean Result', text: `Bring the supported ${input} files together, keep the order clear, and create one ${output} result for sharing, archiving, printing, or the next document step.` },
    { title: 'Keep Multi-File Workflows Organized', text: 'Merging is useful when related pages or documents are scattered across separate files. Putting them into one result can make review, submission, and storage easier.' },
    { title: 'Review the Final Order Before You Move On', text: 'When order matters, quickly check the finished document before you send or archive it. A small review helps catch a misplaced or missing file before the result leaves your browser.' },
  ];

  if (mode === 'split') return [
    { title: 'Separate Only the Pages You Need', text: `Use ${tool.name} when one ${input} contains more material than the next person or workflow needs. Split or extract the relevant pages and keep the rest of the original file separate.` },
    { title: 'Create Smaller, More Focused Files', text: 'Splitting can make long documents easier to email, submit, review, or organize when each part belongs to a different task.' },
    { title: 'Check the Selected Pages Before Download', text: 'Confirm the page range or selection before processing, then review the result so the new file contains exactly the pages you intended to keep.' },
  ];

  if (mode === 'compress') return [
    { title: 'Reduce File Size for Easier Sharing', text: `Use ${tool.name} when the file is too large for email, an upload limit, storage, or a quick handoff. DOC321 focuses on creating a smaller ${output} while keeping the original source separate.` },
    { title: 'Use the Smallest File That Still Works', text: 'Compression is a trade-off between size and document quality. Review the result if images, scanned pages, or visual details matter to the person receiving the file.' },
    { title: 'Keep the Workflow Simple', text: 'Upload, compress, compare the result, and download. If the file still needs another document step, nearby DOC321 tools are available without restarting your search.' },
  ];

  if (tool.kind === 'editor') return [
    { title: `Edit ${input} Without a Full Desktop Workflow`, text: `${tool.name} keeps the document and the controls together in the browser so you can ${intent}. That is useful for corrections, quick updates, shared computers, and one-off edits.` },
    { title: 'Focus on the Change You Came to Make', text: 'A focused tool is easier when you do not need a complete office suite. Open the file, make the necessary change, review it, and save the result.' },
    { title: 'Review Important Formatting Before Saving', text: 'For documents with tables, fonts, images, page breaks, annotations, or other layout details, quickly check the areas that matter before you use the edited file.' },
  ];

  if (tool.kind === 'viewer') return [
    { title: `Open and Review ${input} Online`, text: `${tool.name} is useful when you need to inspect a file before deciding whether it needs editing, conversion, extraction, printing, or another step.` },
    { title: 'View First, Change Only if Necessary', text: 'A viewer keeps the task lightweight. You can check the content without entering a larger editing workflow when all you need is a quick look.' },
    { title: 'Continue Into the Right Next Tool', text: 'After reviewing the file, use a related tool only if you actually need to convert, edit, organize, protect, or download a different result.' },
  ];

  if (tool.kind === 'text' || tool.kind === 'language') return [
    { title: `${tool.name} for Quick Text Work`, text: `${tool.name} keeps one writing task small and direct: paste or type the text, ${intent}, review what changed, and copy or download the result.` },
    { title: 'Useful for Everyday Written Content', text: 'Use the tool for notes, messages, articles, reports, assignments, lists, documentation, drafts, and other text that needs a focused cleanup or transformation.' },
    { title: 'Keep the Result Ready for the Next Document', text: 'Once the text is ready, copy it into your document, website, email, form, spreadsheet, presentation, or another DOC321 workflow.' },
  ];

  if (tool.kind === 'creator') return [
    { title: `Create ${output} From the Information You Have`, text: `${tool.name} reduces blank-page work by helping you turn the details you already know into a usable document or file.` },
    { title: 'Review Before You Use the Generated File', text: 'Check names, dates, numbers, wording, layout, and any other information that matters before you download or share the result.' },
    { title: 'Continue Editing or Converting if Needed', text: 'After creation, you can move the result into a related editor, converter, PDF tool, or document workflow without leaving DOC321.' },
  ];

  return [
    { title: `${tool.name} for One Clear Job`, text: `${tool.name} focuses on one outcome: ${intent}. Bring in ${input}, choose the options that matter, run the task, and review the ${output} result.` },
    { title: 'Use the Tool When the Task Is Small but Necessary', text: 'A focused browser utility can be faster than opening a large desktop application when you only need one document action.' },
    { title: 'Check the Result Before You Rely on It', text: 'For important files, confirm the content, page order, formatting, values, images, and file type before you send, submit, print, or archive the result.' },
  ];
}

function benefits(tool: PlatformToolDefinition, inputLabel: string, outputLabel: string) {
  const input = readableType(inputLabel);
  const output = readableType(outputLabel);
  const mode = visualMode(tool);
  const common = [
    { Icon: Workflow, title: 'Focused workflow', text: `Everything on the page is organized around one job: ${sentenceIntent(tool.primaryIntent)}.` },
    { Icon: ShieldCheck, title: 'Clear source and result', text: `Know what goes in as ${input} and what you should expect back as ${output}.` },
    { Icon: Sparkles, title: 'Built for everyday files', text: 'Use the tool for school, office, personal, client, publishing, and administrative document tasks.' },
    { Icon: CheckCircle2, title: 'Easy to review', text: 'Check the result before you download, share, submit, print, publish, or continue into another tool.' },
  ];

  if (mode === 'ocr') common.unshift({ Icon: ScanText, title: 'Made for scanned content', text: 'Use OCR when readable text is trapped inside a scan or image-based document.' });
  else if (mode === 'security' || mode === 'unlock') common.unshift({ Icon: LockKeyhole, title: 'Security-focused task', text: 'Keep password, protection, and access changes separate from unrelated document edits.' });
  else if (tool.kind === 'converter') common.unshift({ Icon: RefreshCw, title: 'Direct format conversion', text: `Move from ${input} to ${output} without manually recreating the whole file.` });
  else if (tool.kind === 'editor') common.unshift({ Icon: Pencil, title: 'Edit in the browser', text: 'Make the change you need without opening a full desktop document suite.' });
  else if (tool.kind === 'viewer') common.unshift({ Icon: Eye, title: 'Open before you change', text: 'Review the file first and decide whether any further document work is actually necessary.' });
  else common.unshift({ Icon: actionIcon(mode), title: 'Purpose-built action', text: `${tool.name} is designed around the specific task people come to the page to finish.` });

  common.push({ Icon: ArrowRight, title: 'Easy next step', text: 'Related DOC321 tools stay close by when the finished file needs another conversion, edit, or document action.' });
  return common.slice(0, 6);
}

function faqItems(tool: PlatformToolDefinition, supplied: readonly Faq[], inputLabel: string, outputLabel: string) {
  const items = [...supplied];
  const input = readableType(inputLabel);
  const output = readableType(outputLabel);
  const extras: Faq[] = [
    {
      question: `What does ${tool.name} do?`,
      answer: `${tool.name} is designed to ${sentenceIntent(tool.primaryIntent)}. The page keeps that task, the supported ${input} input, and the ${output} result together in one browser workflow.`,
    },
    {
      question: `Can I use ${tool.name} online for free?`,
      answer: `Yes. DOC321 provides ${tool.name} as a free online browser tool so you can start the supported workflow from the page without installing a separate desktop application.`,
    },
  ];
  extras.forEach((item) => {
    if (!items.some((existing) => existing.question.toLowerCase() === item.question.toLowerCase())) items.push(item);
  });
  return items.slice(0, 10);
}

function relatedGroups(tool: PlatformToolDefinition) {
  const candidates = allLivePlatformTools
    .filter((item) => item.route !== tool.route)
    .sort((left, right) => relatedToolScore(tool, right) - relatedToolScore(tool, left) || left.name.localeCompare(right.name));

  const used = new Set<string>();
  const take = (predicate: (item: PlatformToolDefinition) => boolean, count: number) => {
    const items: PlatformToolDefinition[] = [];
    for (const item of candidates) {
      if (items.length >= count) break;
      if (used.has(item.route) || !predicate(item)) continue;
      used.add(item.route);
      items.push(item);
    }
    return items;
  };

  const groups: Array<{ title: string; items: PlatformToolDefinition[] }> = [
    { title: 'Related tools', items: take(() => true, 4) },
    { title: 'Convert', items: take((item) => item.kind === 'converter', 4) },
    { title: 'Edit & organize', items: take((item) => ['editor', 'pdf', 'viewer', 'ocr'].includes(item.kind), 4) },
    { title: 'More document tools', items: take(() => true, 4) },
  ];

  groups.forEach((group) => {
    if (group.items.length >= 4) return;
    group.items.push(...take(() => true, 4 - group.items.length));
  });

  return groups.filter((group) => group.items.length);
}

function ToolScene({ tool, mode, inputLabel, outputLabel }: { tool: PlatformToolDefinition; mode: VisualMode; inputLabel: string; outputLabel: string }) {
  const Icon = actionIcon(mode);
  const input = readableType(inputLabel);
  const output = readableType(outputLabel);

  if (mode === 'merge') {
    return (
      <div className={`${styles.scene} ${styles.sceneMerge}`} aria-hidden="true">
        <span className={styles.shapeOne}/><span className={styles.shapeTwo}/>
        <div className={`${styles.fileCard} ${styles.fileA}`}><span>{input}</span><i/><i/><i/></div>
        <div className={`${styles.fileCard} ${styles.fileB}`}><span>{input}</span><i/><i/><i/></div>
        <span className={styles.actionBubble}><Files/></span>
        <div className={`${styles.fileCard} ${styles.fileOut}`}><span>{output}</span><i/><i/><i/></div>
      </div>
    );
  }

  if (mode === 'split') {
    return (
      <div className={`${styles.scene} ${styles.sceneSplit}`} aria-hidden="true">
        <span className={styles.shapeOne}/><span className={styles.shapeTwo}/>
        <div className={`${styles.fileCard} ${styles.fileCenter}`}><span>{input}</span><i/><i/><i/></div>
        <span className={styles.actionBubble}><Scissors/></span>
        <div className={`${styles.miniFile} ${styles.miniOne}`}><span>1</span></div>
        <div className={`${styles.miniFile} ${styles.miniTwo}`}><span>2</span></div>
      </div>
    );
  }

  if (['text', 'language', 'spreadsheet', 'presentation', 'image', 'edit', 'view', 'ocr', 'security', 'unlock', 'analyze', 'creator', 'compress', 'rotate', 'crop', 'utility'].includes(mode)) {
    return (
      <div className={`${styles.scene} ${styles[`scene_${mode}`]}`} aria-hidden="true">
        <span className={styles.shapeOne}/><span className={styles.shapeTwo}/>
        <div className={styles.featureDocument}>
          <span className={styles.featureLabel}>{input}</span>
          {mode === 'spreadsheet' ? <div className={styles.gridMark}><i/><i/><i/><i/><i/><i/><i/><i/><i/></div> : null}
          {mode === 'presentation' ? <div className={styles.slideMark}><b/><i/><i/></div> : null}
          {mode === 'image' ? <div className={styles.imageMark}><span/><i/></div> : null}
          {!['spreadsheet', 'presentation', 'image'].includes(mode) ? <div className={styles.textMark}><i/><i/><i/><i/><i/></div> : null}
        </div>
        <span className={styles.actionBubble}><Icon/></span>
        <div className={styles.resultPanel}>
          <span>{mode === 'view' ? 'VIEW' : mode === 'analyze' ? 'RESULT' : output}</span>
          <ToolVisual tool={tool} size="sm" />
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.scene} ${styles.sceneConvert}`} aria-hidden="true">
      <span className={styles.shapeOne}/><span className={styles.shapeTwo}/>
      <div className={`${styles.fileCard} ${styles.sourceFile}`}><span>{input}</span><i/><i/><i/><i/></div>
      <span className={styles.actionBubble}><Icon/></span>
      <div className={`${styles.fileCard} ${styles.targetFile}`}><span>{output}</span><i/><i/><i/><i/></div>
    </div>
  );
}

export function UniversalToolEditorialContent({
  tool,
  description,
  details,
  faq,
  steps,
}: {
  tool: PlatformToolDefinition;
  description: string;
  details: readonly Detail[];
  faq: readonly Faq[];
  steps: readonly Step[];
}) {
  const inputTypes = formatTypes(tool.input);
  const outputTypes = formatTypes(tool.output);
  const inputLabel = inputTypes[0] ?? 'FILE';
  const outputLabel = outputTypes[0] ?? 'RESULT';
  const mode = visualMode(tool);
  const sections = [...details, ...generatedEditorial(tool, inputLabel, outputLabel)].slice(0, 3);
  const bullets = summaryItems(tool, inputTypes, outputTypes);
  const benefitItems = benefits(tool, inputLabel, outputLabel);
  const faqList = faqItems(tool, faq, inputLabel, outputLabel);
  const groups = relatedGroups(tool);
  const input = readableType(inputLabel);
  const output = readableType(outputLabel);
  const heading = introHeading(tool, inputTypes, outputTypes);
  const naturalKeywordCopy = keywordContext(tool);

  return (
    <div className={styles.content}>
      <section className={styles.summary} aria-label={`${tool.name} highlights`}>
        <p className={styles.summaryLead}>{description || tool.description}</p>
        <div className={styles.summaryList}>
          {bullets.map((item) => (
            <div className={styles.summaryItem} key={item}><CheckCircle2 aria-hidden="true"/><span>{item}</span></div>
          ))}
        </div>
      </section>

      <section className={styles.intro} aria-labelledby={`${tool.id}-intro`}>
        <h2 id={`${tool.id}-intro`}>{heading}</h2>
        <p>{tool.description}{naturalKeywordCopy}</p>
      </section>

      {sections.map((section, index) => (
        <section className={`${styles.editorialRow} ${index % 2 ? styles.reverse : ''}`} key={section.title}>
          <div className={styles.copy}>
            <h2>{section.title}</h2>
            <p>{section.text}</p>
          </div>
          <div className={styles.visualWrap}>
            <ToolScene tool={tool} mode={index === 0 ? mode : index === 1 && mode === 'convert' ? 'edit' : index === 2 && mode === 'convert' ? 'creator' : mode} inputLabel={inputLabel} outputLabel={outputLabel}/>
          </div>
        </section>
      ))}

      {steps.length ? (
        <section className={styles.howPanel} aria-labelledby={`${tool.id}-how`}>
          <div className={styles.howCopy}>
            <h2 id={`${tool.id}-how`}>How to Use {tool.name}</h2>
            <ol>
              {steps.slice(0, 4).map((step, index) => (
                <li key={step.title}><span>{index + 1}</span><div><strong>{step.title}</strong><p>{step.text}</p></div></li>
              ))}
            </ol>
          </div>
          <div className={styles.howVisual} aria-hidden="true">
            <div className={styles.howSource}><FileText/><span>{input}</span></div>
            <ArrowRight/>
            <div className={styles.howResult}><FileOutput/><span>{output}</span></div>
          </div>
        </section>
      ) : null}

      <section className={styles.anywhere} aria-labelledby={`${tool.id}-benefits`}>
        <h2 id={`${tool.id}-benefits`}>{tool.name} for Everyday Workflows</h2>
        <div className={styles.benefitGrid}>
          {benefitItems.map(({ Icon, title, text }) => (
            <article key={title}>
              <div className={styles.benefitHead}><span><Icon aria-hidden="true"/></span><h3>{title}</h3></div>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.faq} aria-labelledby={`${tool.id}-faq`}>
        <h2 id={`${tool.id}-faq`}>FAQs About {tool.name}</h2>
        {faqList.map((item) => (
          <details key={item.question} open>
            <summary><span>{item.question}</span><i aria-hidden="true"/></summary>
            <p>{item.answer}</p>
          </details>
        ))}
      </section>

      <section className={styles.cta} aria-label="Explore all DOC321 tools">
        <div className={styles.ctaCopy}>
          <h2>Document Work Made Easier</h2>
          <p>Finished with {tool.name}? DOC321 keeps related PDF, Word, image, spreadsheet, presentation, text, and document tools close so you can continue the workflow without starting over.</p>
          <Link href="/tools">Browse all tools <ArrowRight size={17} aria-hidden="true"/></Link>
        </div>
        <div className={styles.ctaArt} aria-hidden="true"><span/><span/><span/><i>+</i></div>
      </section>

      {groups.length ? (
        <section className={styles.related} aria-labelledby={`${tool.id}-related`}>
          <div className={styles.relatedHead}><div><h2 id={`${tool.id}-related`}>Related {tool.cluster} tools</h2><p>Jump straight into a nearby workflow.</p></div></div>
          <div className={styles.directory}>
            {groups.map((group) => (
              <div className={styles.group} key={group.title}>
                <h3>{group.title}</h3>
                <div>
                  {group.items.map((item) => (
                    <Link href={item.route} key={item.route}><ToolVisual tool={item} size="sm"/><span>{item.name}</span></Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
