import { getFileExtension } from '@/core/files/fileTypes';

export type WordImportFormat = 'docx' | 'html' | 'txt';

export interface WordImportResult {
  html: string;
  title: string;
  format: WordImportFormat;
  warnings: string[];
}

export const MAX_WORD_FILE_BYTES = 20 * 1024 * 1024;

function sanitizeImportedHtml(html: string): string {
  const template = document.createElement('template');
  template.innerHTML = html;
  template.content
    .querySelectorAll('script,style,iframe,object,embed,form,input,button,textarea,select,meta,link,base')
    .forEach((node) => node.remove());

  template.content.querySelectorAll<HTMLElement>('*').forEach((element) => {
    Array.from(element.attributes).forEach((attribute) => {
      const name = attribute.name.toLowerCase();
      const value = attribute.value.trim().toLowerCase();
      if (name.startsWith('on')) element.removeAttribute(attribute.name);
      if ((name === 'href' || name === 'src') && value.startsWith('javascript:')) {
        element.removeAttribute(attribute.name);
      }
      if (name === 'style' && /(url\s*\(|expression\s*\()/i.test(attribute.value)) {
        element.removeAttribute('style');
      }
    });

    if (element instanceof HTMLImageElement) {
      const src = element.getAttribute('src') || '';
      if (src && !/^(data:image\/|blob:)/i.test(src)) element.removeAttribute('src');
    }
  });

  return template.innerHTML;
}

function textToHtml(text: string): string {
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return `<p>${escaped.replace(/\r?\n/g, '<br>')}</p>`;
}

function getTitle(name: string): string {
  return name.replace(/\.[^.]+$/, '') || 'Untitled document';
}

export async function openWordDocument(file: File): Promise<WordImportResult> {
  if (file.size > MAX_WORD_FILE_BYTES) {
    throw new Error('Please choose a file smaller than 20 MB');
  }

  const extension = getFileExtension(file.name);
  const title = getTitle(file.name);

  if (extension === 'docx') {
    const mammoth = await import('mammoth');
    const result = await mammoth.convertToHtml({ arrayBuffer: await file.arrayBuffer() });
    return {
      html: sanitizeImportedHtml(result.value || '<p></p>'),
      title,
      format: 'docx',
      warnings: result.messages.map((message) => message.message),
    };
  }

  if (extension === 'html' || extension === 'htm') {
    return {
      html: sanitizeImportedHtml(await file.text()),
      title,
      format: 'html',
      warnings: [],
    };
  }

  if (extension === 'txt') {
    return {
      html: textToHtml(await file.text()),
      title,
      format: 'txt',
      warnings: [],
    };
  }

  throw new Error('Unsupported file type');
}
