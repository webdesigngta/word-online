import { bodyHtml, xmlText, type ZipArchive } from './docxPackage';

export interface DocumentStatistics {
  paragraphCount: number;
  headingCount: number;
  tableCount: number;
  imageCount: number;
  wordCount: number;
  characterCount: number;
  characterCountExcludingSpaces: number;
  sentenceEstimate: number;
  readingTimeMinutes: number;
}

export function documentStatistics(html: string): DocumentStatistics {
  const root = bodyHtml(html);
  const text = (root.textContent ?? '').replace(/\s+/g, ' ').trim();
  const words = text ? text.split(/\s+/).length : 0;
  return {
    paragraphCount: root.querySelectorAll('p,h1,h2,h3,h4,h5,h6').length,
    headingCount: root.querySelectorAll('h1,h2,h3,h4,h5,h6').length,
    tableCount: root.querySelectorAll('table').length,
    imageCount: root.querySelectorAll('img').length,
    wordCount: words,
    characterCount: text.length,
    characterCountExcludingSpaces: text.replace(/\s/g, '').length,
    sentenceEstimate: text ? Math.max(1, text.split(/[.!?]+/).filter(Boolean).length) : 0,
    readingTimeMinutes: words ? Math.max(1, Math.ceil(words / 200)) : 0,
  };
}

export async function packageMetadata(zip: ZipArchive): Promise<Record<string, string | null>> {
  const core = await zip.file('docProps/core.xml')?.async('string');
  const app = await zip.file('docProps/app.xml')?.async('string');
  return {
    title: core ? xmlText(core, 'title') : null,
    subject: core ? xmlText(core, 'subject') : null,
    creator: core ? xmlText(core, 'creator') : null,
    lastModifiedBy: core ? xmlText(core, 'lastModifiedBy') : null,
    description: core ? xmlText(core, 'description') : null,
    keywords: core ? xmlText(core, 'keywords') : null,
    created: core ? xmlText(core, 'created') : null,
    modified: core ? xmlText(core, 'modified') : null,
    application: app ? xmlText(app, 'Application') : null,
  };
}