import fs from 'node:fs';

const path = 'components/PdfEditorWorkspace.tsx';
let source = fs.readFileSync(path, 'utf8');

function replaceExact(before, after, label) {
  if (!source.includes(before)) throw new Error(`Could not find ${label}`);
  source = source.replace(before, after);
}

replaceExact(
  "        const words = (line?.words || [])\n          .map((word: any) => toOcrWord(word))",
  "        const words: OcrWord[] = (line?.words || [])\n          .map((word: any) => toOcrWord(word))",
  'typed OCR words array',
);

replaceExact(
  "        const lineHeight = box.source === 'ocr' ? size * 1.08 : size * 1.18;\n        while (size > 5 && lines.length * lineHeight > Math.max(box.height * 2.6, size * 1.3)) {\n          size -= 0.5;\n          lines = box.text.includes('\\n') ? wrapText(box.text, font, size, maxWidth) : [box.text];\n        }",
  "        let lineHeight = box.source === 'ocr' ? size * 1.08 : size * 1.18;\n        while (size > 5 && lines.length * lineHeight > Math.max(box.height * 2.6, size * 1.3)) {\n          size -= 0.5;\n          lines = box.text.includes('\\n') ? wrapText(box.text, font, size, maxWidth) : [box.text];\n          lineHeight = box.source === 'ocr' ? size * 1.08 : size * 1.18;\n        }",
  'dynamic line-height fitting',
);

fs.writeFileSync(path, source);
console.log('Fixed generated Phase 2 TypeScript details.');
