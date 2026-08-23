import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const routes = [
  { route: 'docx-editor', marker: 'Edit DOCX files directly in the browser' },
  { route: 'docx-viewer', marker: 'Read-only by design' },
  { route: 'docx-to-pdf', marker: 'DOCX-specific workflow' },
  { route: 'word-to-pdf', marker: 'Browser conversion' },
  { route: 'create-word-document', marker: 'Start a new Word document in your browser' },
];

const titles = new Set();

for (const item of routes) {
  const file = join(process.cwd(), 'out', item.route, 'index.html');
  const html = await readFile(file, 'utf8');

  if (!html.includes(item.marker)) {
    throw new Error(`Week 4 route /${item.route}/ is missing its intent-specific content marker: ${item.marker}`);
  }

  const title = html.match(/<title>([^<]+)<\/title>/i)?.[1]?.trim();
  if (!title) throw new Error(`Week 4 route /${item.route}/ has no HTML title.`);
  if (titles.has(title)) throw new Error(`Week 4 route /${item.route}/ duplicates another page title: ${title}`);
  titles.add(title);

  const canonical = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i)?.[1]
    || html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["']/i)?.[1];
  if (!canonical) throw new Error(`Week 4 route /${item.route}/ has no canonical link.`);
  const canonicalPath = new URL(canonical).pathname.replace(/\/$/, '');
  if (!canonicalPath.endsWith(`/${item.route}`)) {
    throw new Error(`Week 4 route /${item.route}/ canonical points elsewhere: ${canonical}`);
  }

  if (!/<h1\b/i.test(html)) throw new Error(`Week 4 route /${item.route}/ has no H1.`);
  console.log(`PASS /${item.route}/ — ${title} — ${canonical}`);
}

console.log(`Week 4 intent cluster gate passed: ${routes.length}/${routes.length} distinct routes.`);
