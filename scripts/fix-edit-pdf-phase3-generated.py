from pathlib import Path

path = Path('components/PdfEditorWorkspace.tsx')
source = path.read_text()
before = "      const face = new FontFace(previewFamily, bytes);"
after = "      const faceBytes = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;\n      const face = new FontFace(previewFamily, faceBytes);"
if before not in source:
    raise RuntimeError('Could not find FontFace byte source')
path.write_text(source.replace(before, after, 1))
print('Fixed Phase 3 FontFace buffer typing.')
