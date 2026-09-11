import fs from 'node:fs';

const loaderPath = 'components/PdfSmartEditLoader.tsx';
const workspacePath = 'components/PdfEditorWorkspace.tsx';

const loader = fs.readFileSync(loaderPath, 'utf8');
const workspace = fs.readFileSync(workspacePath, 'utf8');

const checks = [
  [loader.includes('const MAX_PDF_BYTES = 50 * 1024 * 1024;'), '50 MB browser safety limit is present'],
  [loader.includes("return 'Please choose a PDF file.';"), 'non-PDF validation is present'],
  [loader.includes('onChangeCapture={onFileChangeCapture}'), 'file picker validation runs before workspace handling'],
  [loader.includes('input.value = \'\';'), 'rejected picker selections are cleared before workspace processing'],
  [loader.includes('role="alert"'), 'file errors are exposed accessibly'],
  [!loader.includes('showPicker'), 'loader no longer owns a competing file picker'],
  [!loader.includes('event.stopPropagation()'), 'loader does not cancel the workspace picker event'],
  [workspace.includes("accept=\"application/pdf,.pdf\""), 'workspace still restricts the native picker to PDF files'],
  [workspace.includes("pdfjs.getDocument({ data: new Uint8Array(await next.arrayBuffer()) })"), 'accepted PDFs still reach PDF.js'],
];

const failed = checks.filter(([ok]) => !ok);
for (const [ok, label] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'}: ${label}`);
}

if (failed.length) {
  process.exitCode = 1;
}
