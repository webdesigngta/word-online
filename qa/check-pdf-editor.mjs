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
expect(workspace, "worker.recognize(sample, {}, { blocks: true })", 'Tesseract.js 6+ must explicitly request structured blocks for editable OCR geometry.');
expect(workspace, 'extractOcrParagraphs(recognized.data.blocks)', 'OCR regions must preserve Tesseract paragraph structure instead of exposing every OCR line as a separate editor box.');
expect(workspace, 'estimateOcrFontSize(representative, Math.max(8, (representative.x1 - representative.x0) / OCR_SCALE), meta.family, meta.bold, meta.italic)', 'OCR paragraph font size must still combine glyph-height and rendered-width estimates.');
expect(workspace, "value.includes('sans-serif')", 'Generic sans-serif PDF fonts must not be misclassified as serif fonts.');
expect(workspace, 'fitSingleLineFontSize(box.text, font, size, maxWidth, box.letterSpacing)', 'Edited single-line text should shrink to fit its detected region while respecting letter spacing.');
expect(workspace, 'lineHeight: box.lineHeight', 'Preview must preserve detected or user-adjusted line spacing.');
expect(workspace, 'font_name', 'OCR font metadata should be retained when Tesseract provides it.');
reject(workspace, 'recognized.data.words || []', 'Do not use the pre-v6 Tesseract data.words output; it is no longer returned by default.');
expect(workspace, "await import('pdf-lib')", 'Edited PDF export must remain available.');
expect(workspace, "await import('@pdf-lib/fontkit')", 'Phase 3 must load fontkit for original/custom font parsing and embedding.');
expect(workspace, 'pdfPage.commonObjs?.get?.(fontName)', 'Digital PDFs should attempt to reuse embedded source font bytes when PDF.js exposes them.');
expect(workspace, "pdfDocument.registerFontkit(fontkitModule.default as any)", 'Custom font embedding must register fontkit with pdf-lib.');
expect(workspace, "pdfDocument.embedFont(asset.bytes, { subset: true })", 'Original or user-provided fonts must be embedded as subsets in the exported PDF.');
expect(workspace, 'fontSupportsText(asset, box.text)', 'Subset fonts must be checked for replacement glyph coverage before export.');
expect(workspace, 'accept=".ttf,.otf,.woff,.woff2,font/ttf,font/otf,font/woff,font/woff2"', 'Users must be able to load a local custom font without uploading it to a server.');
expect(workspace, "detectedFontName: sourceName", 'Native PDF regions must retain a human-readable detected font identity.');
expect(workspace, 'groupNativeParagraphBoxes(rawBoxes)', 'Digital PDF text must be grouped into style-aware, column-aware paragraph regions.');
expect(workspace, 'extractOcrParagraphs(recognized.data.blocks)', 'Scanned PDFs must expose paragraph-level OCR editing regions.');
expect(workspace, 'sampleBackgroundRing(', 'Text removal must sample the surrounding page background instead of relying only on pixels inside the text box.');
expect(workspace, 'fontWeight: number', 'Editable regions must preserve richer font-weight metadata.');
expect(workspace, 'align: TextAlign', 'Editable regions must preserve paragraph alignment.');
expect(workspace, 'letterSpacing: number', 'Editable regions must preserve letter spacing.');
expect(workspace, 'lineHeight: number', 'Editable regions must preserve line spacing.');
expect(workspace, 'rotation: number', 'Editable regions must preserve rotated text geometry.');
expect(workspace, 'estimateEditedBoxSize(currentBox, text, pageModel.width, pageModel.height)', 'Edited paragraph regions must auto-grow to fit replacement text.');
expect(workspace, 'drawAlignedLine(', 'Export must render alignment, justification, letter spacing and rotation through a shared layout renderer.');
expect(workspace, 'pdfLib.degrees', 'Rotated text export must use PDF rotation operators.');
expect(workspace, 'textAlign: box.align', 'On-page preview must show the selected alignment.');
expect(workspace, 'transform: `rotate(${box.rotation}deg)`', 'On-page preview must preserve text rotation.');

// The build must continue copying the PDF.js module worker to a .js filename
// because the production Apache host may serve .mjs with the wrong MIME type.
expect(copyWorker, 'pdf.worker.min.js', 'Build must publish the Apache-safe PDF worker.');

console.log('PDF editor reliability checks passed.');
