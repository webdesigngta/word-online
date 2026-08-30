import { promises as fs } from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.argv[2] || 'out');
const fallbackTitle = 'DOC321 – Free Online Document Tools';
const fallbackDescription = 'Fast, free browser-based tools for Word, PDF, spreadsheets, presentations, images and everyday documents.';

async function collectIndexFiles(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await collectIndexFiles(absolute));
    else if (entry.isFile() && entry.name === 'index.html') files.push(absolute);
  }
  return files;
}

function decode(value = '') {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function tagAttribute(tag, name) {
  const match = tag.match(new RegExp(`${name}=["']([^"']*)["']`, 'i'));
  return decode(match?.[1] || '');
}

function metaContent(html, name) {
  const tags = html.match(/<meta\b[^>]*>/gi) || [];
  for (const tag of tags) {
    if (tagAttribute(tag, 'name').toLowerCase() === name.toLowerCase()) return tagAttribute(tag, 'content');
  }
  return '';
}

function canonicalHref(html) {
  const tags = html.match(/<link\b[^>]*>/gi) || [];
  for (const tag of tags) {
    if (tagAttribute(tag, 'rel').toLowerCase() === 'canonical') return tagAttribute(tag, 'href');
  }
  return '';
}

function routeFor(file) {
  const relative = path.relative(root, path.dirname(file)).replaceAll(path.sep, '/');
  return relative ? `/${relative}/` : '/';
}

const files = await collectIndexFiles(root);
const pages = [];
const errors = [];

for (const file of files) {
  const html = await fs.readFile(file, 'utf8');
  const route = routeFor(file);
  const robots = metaContent(html, 'robots').toLowerCase();
  if (robots.includes('noindex')) continue;

  const title = decode(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '');
  const description = metaContent(html, 'description');
  const canonical = canonicalHref(html);

  if (!title) errors.push(`${route}: missing <title>`);
  if (!description) errors.push(`${route}: missing meta description`);
  if (!canonical) errors.push(`${route}: missing canonical URL`);
  if (route !== '/' && title === fallbackTitle) errors.push(`${route}: inherits generic site title`);
  if (route !== '/' && description === fallbackDescription) errors.push(`${route}: inherits generic site description`);

  pages.push({ route, title, description, canonical });
}

function findDuplicates(field, label) {
  const byValue = new Map();
  for (const page of pages) {
    const value = page[field];
    if (!value) continue;
    const routes = byValue.get(value) || [];
    routes.push(page.route);
    byValue.set(value, routes);
  }
  for (const [value, routes] of byValue) {
    if (routes.length > 1) errors.push(`Duplicate ${label}: ${routes.join(', ')} :: ${value}`);
  }
}

findDuplicates('title', 'SEO title');
findDuplicates('description', 'meta description');

const canonicalMap = new Map();
for (const page of pages) {
  if (!page.canonical) continue;
  const routes = canonicalMap.get(page.canonical) || [];
  routes.push(page.route);
  canonicalMap.set(page.canonical, routes);
}
for (const [canonical, routes] of canonicalMap) {
  if (routes.length > 1) errors.push(`Duplicate canonical: ${routes.join(', ')} :: ${canonical}`);
}

console.log(`SEO audit scanned ${pages.length} indexable page(s).`);
if (errors.length) {
  console.error(`SEO audit found ${errors.length} issue(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log('SEO audit passed: titles, descriptions and canonicals are present and unique.');
