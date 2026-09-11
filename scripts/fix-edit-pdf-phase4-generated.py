from pathlib import Path

workspace_path = Path('components/PdfEditorWorkspace.tsx')
qa_path = Path('qa/check-pdf-editor.mjs')
source = workspace_path.read_text()
qa = qa_path.read_text()

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

before = "expect(workspace, 'estimateOcrFontSize(line, width, meta.family, meta.bold, meta.italic)', 'OCR font size must combine glyph-height and rendered-width estimates.');"
after = "expect(workspace, 'estimateOcrFontSize(representative, Math.max(8, (representative.x1 - representative.x0) / OCR_SCALE), meta.family, meta.bold, meta.italic)', 'OCR paragraph font size must still combine glyph-height and rendered-width estimates.');"
if before not in qa:
    raise RuntimeError('Could not find OCR font-size regression assertion')
qa = qa.replace(before, after, 1)

workspace_path.write_text(source)
qa_path.write_text(qa)
print('Fixed Phase 4 generated TypeScript and regression-contract details.')
