import { copyFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = resolve(root, 'node_modules/pdfjs-dist/legacy/build/pdf.worker.min.mjs');
const moduleDestination = resolve(root, 'public/pdf.worker.min.mjs');
const javascriptDestination = resolve(root, 'public/pdf.worker.min.js');

await mkdir(dirname(moduleDestination), { recursive: true });
await copyFile(source, moduleDestination);
await copyFile(source, javascriptDestination);
console.log('Copied PDF.js worker to public/pdf.worker.min.mjs and public/pdf.worker.min.js');
