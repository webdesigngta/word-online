import type { DocumentProcessor, DocumentRegistry } from '../../../core/document-engine/registry/documentRegistry';
import type { File } from '../../../core/document-engine/types/File';
import { bodyHtml, htmlDocxOutput, mammothHtml, outputDocxName, success } from '../shared/docxPackage';
import { caught, failed } from '../shared/wordErrors';
import { sourceOf, type WordResult } from '../shared';
	export class DocxSplitProcessor implements DocumentProcessor<WordResult> {
	  type = 'docx' as const;
	  async process(input: File | readonly File[], rawOptions: Record<string, unknown> = {}): Promise<WordResult> {
	    const file = 'size' in input ? input : input[0];
	    if (!file) return failed({ name: '', size: 0 }, 'DOCX_FILE_REQUIRED', 'A DOCX file is required');
	    try {
	      const converted = await mammothHtml(file);
	      if ('success' in converted) return converted;
	      const options = rawOptions as { mode?: 'heading' | 'paragraph'; headingLevel?: number; ranges?: Array<{ start: number; end: number; }>; filename?: string };
	      const root = bodyHtml(converted.html);
	      const sections: HTMLElement[] = [];
	      if (options.mode === 'paragraph') {
	        const paragraphs = [...root.querySelectorAll<HTMLElement>('p,h1,h2,h3,h4,h5,h6')];
	        for (const range of options.ranges ?? []) {
	          const wrapper = document.createElement('div');
	          paragraphs.slice(Math.max(0, range.start - 1), range.end).forEach((node) => wrapper.append(node.cloneNode(true)));
	          sections.push(wrapper);
	        }
	      } else {
	        const level = options.headingLevel ?? 1;
	        let current: HTMLElement | undefined;
	        for (const node of [...root.children]) {
	          const heading = /^H([1-6])$/.exec(node.tagName);
	          if (heading && Number(heading[1]) <= level) {
	            current = document.createElement('div');
	            sections.push(current);
	          }
	          if (!current) {
	            current = document.createElement('div');
	            sections.push(current);
	          }
	          current.append(node.cloneNode(true));
	        }
	      }
	      if (!sections.length) return failed(sourceOf(file), 'SPLIT_EMPTY', 'The requested split produced no document sections', converted.warnings);
	      const outputs = [];
	      for (const [index, section] of sections.entries()) {
	        const name = outputDocxName(file.name, `${options.filename ?? file.name.replace(/\.docx$/i, '')}-${index + 1}`);
	        outputs.push((await htmlDocxOutput(section.innerHTML, name)).output);
	      }
	      return success(sourceOf(file), outputs[0], converted.warnings, { outputs, outputCount: outputs.length, splitMode: options.mode ?? 'heading' });
	    } catch (error) {
	      return caught(sourceOf(file), 'DOCX_SPLIT_FAILED', error);
	    }
	  }
	}
export const docxSplitProcessor = new DocxSplitProcessor();
export function registerDocxSplitProcessor(registry: DocumentRegistry): DocxSplitProcessor { if (!registry.getAll(docxSplitProcessor.type).includes(docxSplitProcessor)) registry.register(docxSplitProcessor); return docxSplitProcessor; }