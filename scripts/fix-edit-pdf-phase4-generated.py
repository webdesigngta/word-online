from pathlib import Path

path = Path('components/PdfEditorWorkspace.tsx')
source = path.read_text()

before = "      const lines = (paragraph?.lines || []).map((line: any) => toOcrLine(line)).filter((line: OcrLine | null): line is OcrLine => Boolean(line));"
after = "      const lines: OcrLine[] = (paragraph?.lines || []).map((line: any) => toOcrLine(line)).filter((line: OcrLine | null): line is OcrLine => Boolean(line));"
if before not in source:
    raise RuntimeError('Could not find OCR paragraph lines declaration')
source = source.replace(before, after, 1)

before = "      baselineOffset: selected.originalBaselineOffset,\n      bold: selected.originalFontWeight >= 600,\n      color: selected.originalColor,"
after = "      baselineOffset: selected.originalBaselineOffset,\n      color: selected.originalColor,"
if before not in source:
    raise RuntimeError('Could not find duplicate reset bold property')
source = source.replace(before, after, 1)

path.write_text(source)
print('Fixed Phase 4 generated strict TypeScript details.')
