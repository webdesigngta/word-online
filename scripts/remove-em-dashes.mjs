import { promises as fs } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SOURCE_DIRS = ['app', 'components', 'tools', 'lib'];
const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.json', '.css', '.md']);
const EM_DASH = String.fromCodePoint(0x2014);
const SEO_DASH_CLASS = `[–${EM_DASH}-]`;

async function collectFiles(directory) {
  const absolute = path.join(ROOT, directory);
  let entries;

  try {
    entries = await fs.readdir(absolute, { withFileTypes: true });
  } catch (error) {
    if (error?.code === 'ENOENT') return [];
    throw error;
  }

  const files = [];
  for (const entry of entries) {
    const relative = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await collectFiles(relative));
      continue;
    }
    if (entry.isFile() && SOURCE_EXTENSIONS.has(path.extname(entry.name))) files.push(relative);
  }
  return files;
}

const files = (await Promise.all(SOURCE_DIRS.map(collectFiles))).flat();
let changedFiles = 0;
let replacements = 0;

for (const relative of files) {
  const absolute = path.join(ROOT, relative);
  const original = await fs.readFile(absolute, 'utf8');
  if (!original.includes(EM_DASH)) continue;

  const exactCount = original.split(EM_DASH).length - 1;
  let cleaned = original.replaceAll(SEO_DASH_CLASS, '[–-]');
  cleaned = cleaned.replace(new RegExp(`\\s*${EM_DASH}\\s*`, 'g'), ' - ');

  if (cleaned !== original) {
    await fs.writeFile(absolute, cleaned, 'utf8');
    changedFiles += 1;
    replacements += exactCount;
  }
}

const remaining = [];
for (const relative of files) {
  const content = await fs.readFile(path.join(ROOT, relative), 'utf8');
  if (content.includes(EM_DASH)) remaining.push(relative);
}

if (remaining.length) {
  throw new Error(`Em dash sanitizer failed for: ${remaining.join(', ')}`);
}

console.log(`Em dash sanitizer: removed ${replacements} occurrence(s) from ${changedFiles} source file(s).`);
