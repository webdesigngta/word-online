import { htmlToPdfProcessor } from '@/tools/html/HtmlToPdfProcessor';
import { htmlToDocx } from '@/tools/word/shared/batchHelpers';

export function plainTextFromHtml(html: string) {
  const document = new DOMParser().parseFromString(html, 'text/html');
  return (document.body.textContent ?? '').replace(/\s+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}

export async function creatorDocx(html: string) {
  return htmlToDocx(html);
}

export async function creatorPdf(html: string, filename: string) {
  const styled = `<style>
    body{font-family:Arial,sans-serif;color:#202124;line-height:1.5}
    h1{font-size:26px;margin:0 0 6px} h2{font-size:16px;border-bottom:1px solid #dadce0;padding-bottom:4px;margin-top:24px}
    h3{margin:0 0 8px}.meta{color:#5f6368;font-size:12px}
    table{width:100%;border-collapse:collapse;margin:12px 0} th,td{border:1px solid #dadce0;padding:8px;text-align:left}
    .totals{text-align:right}.checklist{list-style:none;padding:0}.checklist li{padding:5px 0}
  </style>${html}`;
  const result = await htmlToPdfProcessor.process(styled, { filename });
  if (!result.success || !result.output) throw new Error(result.errors?.[0]?.message || 'Could not create PDF');
  return result.output.blob;
}
