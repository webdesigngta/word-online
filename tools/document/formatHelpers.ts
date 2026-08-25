import { htmlToPdfProcessor } from '@/tools/html/HtmlToPdfProcessor';
import { docxHtml, htmlToDocx, htmlToOdt, htmlToRtf, odtHtml, rtfToHtml } from '@/tools/word/shared/batchHelpers';

export function baseDocumentName(name: string, fallback = 'document') {
  return name.replace(/\.(?:docx|odt|rtf|md|markdown|txt)$/i, '').replace(/[\\/:*?"<>|]+/g, '').trim() || fallback;
}

export function downloadDocumentBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function firstError(result: { errors?: readonly { message: string }[] }, fallback: string) {
  return result.errors?.[0]?.message || fallback;
}

export async function loadOdtHtml(file: File) {
  const result = await odtHtml(file);
  if ('success' in result) throw new Error(firstError(result, 'Could not read this ODT file.'));
  return result;
}

export async function loadRtfHtml(file: File) {
  const text = await file.text();
  return rtfToHtml(text);
}

export async function saveHtmlAsOdt(html: string, sourceName: string) {
  const result = await htmlToOdt(html);
  return { blob: result.blob, name: `${baseDocumentName(sourceName)}.odt`, warnings: result.warnings };
}

export function saveHtmlAsRtf(html: string, sourceName: string) {
  const result = htmlToRtf(html);
  return {
    blob: new Blob([result.text], { type: 'application/rtf' }),
    name: `${baseDocumentName(sourceName)}.rtf`,
    warnings: result.warnings,
  };
}

export async function saveHtmlAsPdf(html: string, sourceName: string) {
  const result = await htmlToPdfProcessor.process(html, { filename: baseDocumentName(sourceName) });
  if (!result.success || !result.output) throw new Error(firstError(result, 'Could not create the PDF.'));
  return { blob: result.output.blob, name: result.output.name, warnings: result.warnings };
}

function escapeHtml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function inlineMarkdown(value: string) {
  let text = escapeHtml(value);
  text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
  text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/__([^_]+)__/g, '<strong>$1</strong>');
  text = text.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  text = text.replace(/_([^_]+)_/g, '<em>$1</em>');
  text = text.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+|mailto:[^\s)]+)\)/g, '<a href="$2" rel="noreferrer">$1</a>');
  return text;
}

export function markdownToHtml(markdown: string) {
  const lines = markdown.replace(/\r\n?/g, '\n').split('\n');
  const html: string[] = [];
  let list: 'ul' | 'ol' | null = null;
  let code = false;
  const closeList = () => { if (list) { html.push(`</${list}>`); list = null; } };

  for (const line of lines) {
    if (/^```/.test(line)) {
      closeList();
      html.push(code ? '</code></pre>' : '<pre><code>');
      code = !code;
      continue;
    }
    if (code) { html.push(`${escapeHtml(line)}\n`); continue; }
    const heading = /^(#{1,6})\s+(.+)$/.exec(line);
    if (heading) { closeList(); const level = heading[1].length; html.push(`<h${level}>${inlineMarkdown(heading[2])}</h${level}>`); continue; }
    const unordered = /^\s*[-*+]\s+(.+)$/.exec(line);
    const ordered = /^\s*\d+[.)]\s+(.+)$/.exec(line);
    if (unordered || ordered) {
      const next = unordered ? 'ul' : 'ol';
      if (list !== next) { closeList(); list = next; html.push(`<${next}>`); }
      html.push(`<li>${inlineMarkdown((unordered ?? ordered)![1])}</li>`);
      continue;
    }
    closeList();
    if (!line.trim()) continue;
    const quote = /^>\s?(.*)$/.exec(line);
    if (quote) html.push(`<blockquote>${inlineMarkdown(quote[1])}</blockquote>`);
    else html.push(`<p>${inlineMarkdown(line)}</p>`);
  }
  closeList();
  if (code) html.push('</code></pre>');
  return html.join('');
}

function nodeMarkdown(node: Node, listDepth = 0): string {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? '';
  if (node.nodeType !== Node.ELEMENT_NODE) return '';
  const element = node as Element;
  const tag = element.tagName.toLowerCase();
  const children = Array.from(element.childNodes).map((child) => nodeMarkdown(child, listDepth)).join('');
  if (/^h[1-6]$/.test(tag)) return `${'#'.repeat(Number(tag[1]))} ${children.trim()}\n\n`;
  if (tag === 'p' || tag === 'div') return `${children.trim()}\n\n`;
  if (tag === 'br') return '\n';
  if (tag === 'strong' || tag === 'b') return `**${children}**`;
  if (tag === 'em' || tag === 'i') return `*${children}*`;
  if (tag === 'code' && element.parentElement?.tagName.toLowerCase() !== 'pre') return `\`${children}\``;
  if (tag === 'pre') return `\`\`\`\n${element.textContent ?? ''}\n\`\`\`\n\n`;
  if (tag === 'blockquote') return `${children.split('\n').filter(Boolean).map((line) => `> ${line}`).join('\n')}\n\n`;
  if (tag === 'a') {
    const href = element.getAttribute('href');
    return href && /^(https?:|mailto:)/i.test(href) ? `[${children}](${href})` : children;
  }
  if (tag === 'ul' || tag === 'ol') return `${Array.from(element.children).map((child, index) => {
    const prefix = tag === 'ol' ? `${index + 1}. ` : '- ';
    return `${'  '.repeat(listDepth)}${prefix}${nodeMarkdown(child, listDepth + 1).trim()}`;
  }).join('\n')}\n\n`;
  if (tag === 'li') return children;
  if (tag === 'table') {
    const rows = Array.from(element.querySelectorAll('tr')).map((row) => Array.from(row.children).map((cell) => (cell.textContent ?? '').trim()));
    if (!rows.length) return '';
    const width = Math.max(...rows.map((row) => row.length));
    const normalized = rows.map((row) => Array.from({ length: width }, (_, index) => row[index] ?? ''));
    const head = `| ${normalized[0].join(' | ')} |`;
    const rule = `| ${Array.from({ length: width }, () => '---').join(' | ')} |`;
    return `${head}\n${rule}\n${normalized.slice(1).map((row) => `| ${row.join(' | ')} |`).join('\n')}\n\n`;
  }
  return children;
}

export function htmlToMarkdown(html: string) {
  const body = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html').body;
  return Array.from(body.childNodes).map((node) => nodeMarkdown(node)).join('').replace(/\n{3,}/g, '\n\n').trim();
}

export async function saveMarkdownAsDocx(markdown: string, sourceName: string) {
  const blob = await htmlToDocx(markdownToHtml(markdown));
  return { blob, name: `${baseDocumentName(sourceName)}.docx` };
}

export async function loadDocxMarkdown(file: File) {
  const result = await docxHtml(file);
  if ('success' in result) throw new Error(firstError(result, 'Could not read this DOCX file.'));
  return { markdown: htmlToMarkdown(result.html), warnings: result.warnings };
}
