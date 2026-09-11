import { readFileSync } from 'node:fs';

function read(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
}

function expect(source, needle, message) {
  if (!source.includes(needle)) {
    throw new Error(`${message}\nMissing: ${needle}`);
  }
}

function reject(source, needle, message) {
  if (source.includes(needle)) {
    throw new Error(`${message}\nUnexpected: ${needle}`);
  }
}

const loader = read('components/PdfSmartEditLoader.tsx');
const workspace = read('components/PdfEditorWorkspace.tsx');
const copyWorker = read('scripts/copy-pdf-worker.mjs');

// One layer owns the file chooser. The loader may prepare PDF.js, but it must
// not capture/cancel clicks from the workspace or maintain a second picker.
expect(loader, '<PdfEditorWorkspace toolId={toolId} />', 'Edit PDF must render the shared workspace.');
expect(loader, 'pdfjs.GlobalWorkerOptions.workerSrc = workerUrl();', 'PDF.js worker must be configured before the workspace is enabled.');
expect(loader, '/pdf.worker.min.js', 'The Apache-safe .js PDF worker URL must remain configured.');
reject(loader, 'showPicker', 'The loader must not own a second file picker.');
reject(loader, "addEventListener('click'", 'The loader must not intercept the workspace Choose PDF click.');
reject(loader, 'event.stopPropagation()', 'The loader must not cancel the workspace Choose PDF click.');

// The workspace is the single picker owner and must support same-file reselect,
// drag/drop, digital PDFs, scanned PDFs, and edited-PDF export.
expect(workspace, 'accept="application/pdf,.pdf"', 'The workspace file input must accept PDF files.');
expect(workspace, 'onChange={(event) => void chooseFile(event.target.files?.[0] || null)}', 'Selected files must flow directly into chooseFile.');
expect(workspace, "fileInput.current.value = ''; fileInput.current.click();", 'Choose PDF must clear the input before opening so the same file can be selected again.');
expect(workspace, 'event.dataTransfer.files?.[0] || null', 'Drag and drop PDF opening must remain supported.');
expect(workspace, "pdfjs.getDocument({ data: new Uint8Array(await next.arrayBuffer()) }).promise", 'Selected PDFs must be opened through PDF.js.');
expect(workspace, "await import('tesseract.js')", 'Scanned PDFs must retain OCR fallback.');
expect(workspace, "await import('pdf-lib')", 'Edited PDF export must remain available.');

// The build must continue copying the PDF.js module worker to a .js filename
// because the production Apache host may serve .mjs with the wrong MIME type.
expect(copyWorker, 'pdf.worker.min.js', 'Build must publish the Apache-safe PDF worker.');

console.log('PDF editor reliability checks passed.');
