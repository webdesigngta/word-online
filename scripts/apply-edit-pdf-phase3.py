from pathlib import Path

workspace_path = Path('components/PdfEditorWorkspace.tsx')
qa_path = Path('qa/check-pdf-editor.mjs')
workspace = workspace_path.read_text()
qa = qa_path.read_text()

def replace_exact(source: str, before: str, after: str, label: str) -> str:
    if before not in source:
        raise RuntimeError(f'Could not find {label}')
    return source.replace(before, after, 1)

workspace = replace_exact(
    workspace,
    "const FONT_CHOICES = ['Arial', 'Helvetica', 'Times New Roman', 'Georgia', 'Calibri', 'Verdana', 'Courier New'];",
    "const FONT_CHOICES = ['Arial', 'Helvetica', 'Times New Roman', 'Georgia', 'Calibri', 'Verdana', 'Courier New'];\nconst MAX_CUSTOM_FONT_BYTES = 12 * 1024 * 1024;",
    'custom font size constant',
)

workspace = replace_exact(
    workspace,
    "  originalItalic: boolean;\n  color: string;",
    "  originalItalic: boolean;\n  detectedFontName: string;\n  fontAssetId: string | null;\n  originalFontAssetId: string | null;\n  color: string;",
    'font asset fields',
)

workspace = replace_exact(
    workspace,
    "type OcrLine = {\n  text: string;\n  confidence: number;\n  x0: number;\n  y0: number;\n  x1: number;\n  y1: number;\n  glyphHeight: number;\n  fontName: string;\n};",
    "type OcrLine = {\n  text: string;\n  confidence: number;\n  x0: number;\n  y0: number;\n  x1: number;\n  y1: number;\n  glyphHeight: number;\n  fontName: string;\n};\n\ntype FontAsset = {\n  id: string;\n  kind: 'embedded' | 'custom';\n  family: string;\n  fullName: string;\n  postscriptName: string;\n  subfamilyName: string;\n  previewFamily: string;\n  previewLoaded: boolean;\n  bytes: Uint8Array;\n  characters: Set<number> | null;\n  bold: boolean;\n  italic: boolean;\n  fileName: string | null;\n};",
    'font asset type',
)

marker = "function changed(box: TextBox) {"
helpers = r'''function cleanFontLabel(value = '') {
  return value
    .replace(/^['\"]|['\"]$/g, '')
    .replace(/^[A-Z]{6}\+/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeFontIdentity(value = '') {
  return cleanFontLabel(value)
    .toLowerCase()
    .replace(/(?:regular|normal|roman|book|medium)$/g, '')
    .replace(/[^a-z0-9]+/g, '');
}

function detectedFontName(...values: Array<string | null | undefined>) {
  const generic = new Set(['serif', 'sans-serif', 'sans serif', 'monospace', 'cursive', 'fantasy', 'system-ui']);
  for (const value of values) {
    const cleaned = cleanFontLabel(value || '');
    if (!cleaned || generic.has(cleaned.toLowerCase()) || /^g_d\d+_f\d+$/i.test(cleaned)) continue;
    return cleaned;
  }
  return cleanFontLabel(values.find(Boolean) || '') || 'Unknown font';
}

function toFontBytes(value: unknown): Uint8Array | null {
  if (value instanceof Uint8Array) return new Uint8Array(value);
  if (value instanceof ArrayBuffer) return new Uint8Array(value.slice(0));
  if (ArrayBuffer.isView(value)) {
    const view = value as ArrayBufferView;
    return new Uint8Array(view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength));
  }
  return null;
}

function fontSupportsText(asset: FontAsset, text: string) {
  if (!asset.characters?.size) return true;
  for (const character of text) {
    if (/\s/.test(character)) continue;
    const codePoint = character.codePointAt(0);
    if (codePoint != null && !asset.characters.has(codePoint)) return false;
  }
  return true;
}

async function createFontAsset(
  bytes: Uint8Array,
  kind: FontAsset['kind'],
  id: string,
  hintedName = '',
  fileName: string | null = null,
): Promise<FontAsset | null> {
  try {
    const fontkitModule = await import('@pdf-lib/fontkit');
    const fontkit = fontkitModule.default as any;
    const parsed = fontkit.create(bytes);
    const family = detectedFontName(parsed.familyName, parsed.fullName, parsed.postscriptName, hintedName) || 'Custom font';
    const fullName = cleanFontLabel(parsed.fullName || family);
    const postscriptName = cleanFontLabel(parsed.postscriptName || '');
    const subfamilyName = cleanFontLabel(parsed.subfamilyName || '');
    const styleIdentity = `${fullName} ${postscriptName} ${subfamilyName}`.toLowerCase();
    const previewFamily = `DOC321-${id.replace(/[^a-zA-Z0-9_-]/g, '-')}`;
    let previewLoaded = false;
    try {
      const face = new FontFace(previewFamily, bytes);
      await face.load();
      document.fonts.add(face);
      previewLoaded = true;
    } catch {
      previewLoaded = false;
    }
    return {
      id,
      kind,
      family,
      fullName,
      postscriptName,
      subfamilyName,
      previewFamily,
      previewLoaded,
      bytes,
      characters: Array.isArray(parsed.characterSet) ? new Set<number>(parsed.characterSet) : null,
      bold: /bold|black|heavy|semibold|demi/.test(styleIdentity),
      italic: /italic|oblique/.test(styleIdentity),
      fileName,
    };
  } catch {
    return null;
  }
}

'''
if marker not in workspace:
    raise RuntimeError('Could not locate helper insertion point')
workspace = workspace.replace(marker, helpers + marker, 1)

workspace = replace_exact(
    workspace,
    "    || box.italic !== box.originalItalic\n    || box.color !== box.originalColor",
    "    || box.italic !== box.originalItalic\n    || box.fontAssetId !== box.originalFontAssetId\n    || box.color !== box.originalColor",
    'font asset change tracking',
)

workspace = replace_exact(
    workspace,
    "  const fileInput = useRef<HTMLInputElement>(null);\n  const canvasRef = useRef<HTMLCanvasElement>(null);",
    "  const fileInput = useRef<HTMLInputElement>(null);\n  const fontInput = useRef<HTMLInputElement>(null);\n  const canvasRef = useRef<HTMLCanvasElement>(null);",
    'font input ref',
)

workspace = replace_exact(
    workspace,
    "  const pagesRef = useRef<PageModel[]>([]);\n  const textEditSnapshot = useRef<PageModel[] | null>(null);",
    "  const pagesRef = useRef<PageModel[]>([]);\n  const fontAssetsRef = useRef<Map<string, FontAsset>>(new Map());\n  const textEditSnapshot = useRef<PageModel[] | null>(null);",
    'font asset ref',
)

workspace = replace_exact(
    workspace,
    "  const [redoStack, setRedoStack] = useState<PageModel[][]>([]);\n  const [status, setStatus] = useState('Choose or drop a PDF. DOC321 keeps the original page visible and only redraws regions you actually edit.');",
    "  const [redoStack, setRedoStack] = useState<PageModel[][]>([]);\n  const [customFonts, setCustomFonts] = useState<FontAsset[]>([]);\n  const [status, setStatus] = useState('Choose or drop a PDF. DOC321 keeps the original page visible and only redraws regions you actually edit.');",
    'custom font state',
)

workspace = replace_exact(
    workspace,
    "  const selected = useMemo(() => page?.boxes.find((box) => box.id === selectedId) || null, [page, selectedId]);\n  const editCount = useMemo(() => pages.reduce((total, item) => total + item.boxes.filter(changed).length, 0), [pages]);",
    "  const selected = useMemo(() => page?.boxes.find((box) => box.id === selectedId) || null, [page, selectedId]);\n  const selectedFontAsset = selected?.fontAssetId ? fontAssetsRef.current.get(selected.fontAssetId) || null : null;\n  const originalFontAsset = selected?.originalFontAssetId ? fontAssetsRef.current.get(selected.originalFontAssetId) || null : null;\n  const editCount = useMemo(() => pages.reduce((total, item) => total + item.boxes.filter(changed).length, 0), [pages]);",
    'selected font assets',
)

insertion_point = "  function setPagesNow(next: PageModel[]) {"
font_functions = r'''  async function loadCustomFont(next: File | null) {
    if (!next || busy) return;
    if (!/\.(?:ttf|otf|woff2?)$/i.test(next.name)) {
      setStatus('Choose a TTF, OTF, WOFF, or WOFF2 font file.');
      return;
    }
    if (next.size > MAX_CUSTOM_FONT_BYTES) {
      setStatus('That font is too large. Choose a font file under 12 MB.');
      return;
    }
    const targetId = selected?.id || null;
    try {
      const bytes = new Uint8Array(await next.arrayBuffer());
      const asset = await createFontAsset(bytes, 'custom', `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, next.name.replace(/\.[^.]+$/, ''), next.name);
      if (!asset) throw new Error('DOC321 could not read that font file.');
      fontAssetsRef.current.set(asset.id, asset);
      setCustomFonts((current) => [...current.filter((item) => item.id !== asset.id), asset]);
      if (targetId) {
        patchBox(targetId, {
          fontAssetId: asset.id,
          fontFamily: asset.previewLoaded ? asset.previewFamily : inferFont(asset.fullName, asset.family).family,
          bold: asset.bold,
          italic: asset.italic,
        });
      }
      setStatus(`Loaded ${asset.fullName || asset.family}. It will be embedded directly into edited PDF text${targetId ? ' for the selected region' : ''}.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'DOC321 could not load that font.');
    } finally {
      if (fontInput.current) fontInput.current.value = '';
    }
  }

  function applyFontChoice(value: string) {
    if (!selected) return;
    if (value.startsWith('asset:')) {
      const asset = fontAssetsRef.current.get(value.slice(6));
      if (!asset) return;
      patchBox(selected.id, {
        fontAssetId: asset.id,
        fontFamily: asset.previewLoaded ? asset.previewFamily : inferFont(asset.fullName, asset.family).family,
        bold: asset.bold,
        italic: asset.italic,
      });
      return;
    }
    patchBox(selected.id, { fontAssetId: null, fontFamily: value });
  }

  async function resolveEmbeddedFontAsset(pdfPage: any, pageIndex: number, fontName: string, style: any) {
    const key = `embedded-${fontName}`;
    const cached = fontAssetsRef.current.get(key);
    if (cached) return cached;
    try {
      const fontObject = pdfPage.commonObjs?.get?.(fontName);
      const bytes = toFontBytes(fontObject?.data);
      if (!bytes?.byteLength) return null;
      const hinted = detectedFontName(fontObject?.name, fontObject?.cssFontInfo?.fontFamily, style?.fontFamily, fontName);
      const asset = await createFontAsset(bytes, 'embedded', key, hinted);
      if (!asset) return null;
      fontAssetsRef.current.set(asset.id, asset);
      return asset;
    } catch {
      return null;
    }
  }

'''
if insertion_point not in workspace:
    raise RuntimeError('Could not locate component function insertion point')
workspace = workspace.replace(insertion_point, font_functions + insertion_point, 1)

workspace = replace_exact(
    workspace,
    "      italic: selected.originalItalic,\n      color: selected.originalColor,",
    "      italic: selected.originalItalic,\n      fontAssetId: selected.originalFontAssetId,\n      color: selected.originalColor,",
    'reset font asset',
)

workspace = replace_exact(
    workspace,
    "      italic: false,\n      originalItalic: false,\n      color: '#202124',",
    "      italic: false,\n      originalItalic: false,\n      detectedFontName: 'Arial',\n      fontAssetId: null,\n      originalFontAssetId: null,\n      color: '#202124',",
    'added text font metadata',
)

workspace = replace_exact(
    workspace,
    "        if (hasNativeText) {\n          const boxes: TextBox[] = items.map((item: any, index: number) => {",
    "        if (hasNativeText) {\n          await pdfPage.getOperatorList().catch(() => undefined);\n          const embeddedAssets = new Map<string, FontAsset | null>();\n          for (const fontName of new Set<string>(items.map((item: any) => item.fontName).filter(Boolean))) {\n            const style = (textContent.styles as Record<string, any>)[fontName] || {};\n            embeddedAssets.set(fontName, await resolveEmbeddedFontAsset(pdfPage, pageIndex, fontName, style));\n          }\n          const boxes: TextBox[] = items.map((item: any, index: number) => {",
    'native embedded font resolution',
)

workspace = replace_exact(
    workspace,
    "            const style = (textContent.styles as Record<string, any>)[item.fontName] || {};\n            const meta = inferFont(item.fontName, style.fontFamily);",
    "            const style = (textContent.styles as Record<string, any>)[item.fontName] || {};\n            const embeddedAsset = embeddedAssets.get(item.fontName) || null;\n            const sourceName = detectedFontName(embeddedAsset?.fullName, embeddedAsset?.family, style.fontFamily, item.fontName);\n            const meta = inferFont(sourceName, style.fontFamily);",
    'native source font metadata',
)

workspace = replace_exact(
    workspace,
    "              fontFamily: meta.family,\n              originalFontFamily: meta.family,",
    "              fontFamily: embeddedAsset?.previewLoaded ? embeddedAsset.previewFamily : meta.family,\n              originalFontFamily: embeddedAsset?.previewLoaded ? embeddedAsset.previewFamily : meta.family,",
    'native preview font',
)

workspace = replace_exact(
    workspace,
    "              italic: meta.italic,\n              originalItalic: meta.italic,\n              color: sampled.color,",
    "              italic: embeddedAsset?.italic ?? meta.italic,\n              originalItalic: embeddedAsset?.italic ?? meta.italic,\n              detectedFontName: sourceName,\n              fontAssetId: embeddedAsset?.id || null,\n              originalFontAssetId: embeddedAsset?.id || null,\n              color: sampled.color,",
    'native font asset assignment',
)

workspace = replace_exact(
    workspace,
    "              italic: meta.italic,\n              originalItalic: meta.italic,\n              color: sampled.color,\n              originalColor: sampled.color,\n              background: sampled.background,\n              source: 'ocr' as const,",
    "              italic: meta.italic,\n              originalItalic: meta.italic,\n              detectedFontName: detectedFontName(line.fontName, meta.family),\n              fontAssetId: null,\n              originalFontAssetId: null,\n              color: sampled.color,\n              originalColor: sampled.color,\n              background: sampled.background,\n              source: 'ocr' as const,",
    'OCR font metadata',
)

workspace = replace_exact(
    workspace,
    "    setPagesNow([]);\n    setUndoStack([]);",
    "    setPagesNow([]);\n    fontAssetsRef.current = new Map();\n    setCustomFonts([]);\n    setUndoStack([]);",
    'clear fonts on file change',
)

workspace = replace_exact(
    workspace,
    "      const pdfDocument = await pdfLib.PDFDocument.load(new Uint8Array(await file.arrayBuffer()));\n      const fonts = new Map<string, any>();",
    "      const pdfDocument = await pdfLib.PDFDocument.load(new Uint8Array(await file.arrayBuffer()));\n      const fonts = new Map<string, any>();\n      const needsCustomEmbedding = edits.some((box) => box.fontAssetId && fontAssetsRef.current.has(box.fontAssetId));\n      if (needsCustomEmbedding) {\n        const fontkitModule = await import('@pdf-lib/fontkit');\n        pdfDocument.registerFontkit(fontkitModule.default as any);\n      }\n      let embeddedFontRegions = 0;\n      let fallbackFontRegions = 0;",
    'register fontkit for export',
)

old_font_block = r'''        const key = fontKey(box);
        let font = fonts.get(key);
        if (!font) {
          const standard = pdfLib.StandardFonts as unknown as Record<string, string>;
          font = await pdfDocument.embedFont(standard[key] || standard.Helvetica);
          fonts.set(key, font);
        }'''
new_font_block = r'''        let font: any = null;
        const asset = box.fontAssetId ? fontAssetsRef.current.get(box.fontAssetId) || null : null;
        if (asset && fontSupportsText(asset, box.text)) {
          const assetKey = `asset:${asset.id}`;
          font = fonts.get(assetKey);
          if (!font) {
            try {
              font = await pdfDocument.embedFont(asset.bytes, { subset: true });
              fonts.set(assetKey, font);
            } catch {
              font = null;
            }
          }
          if (font) embeddedFontRegions += 1;
        }
        if (!font) {
          if (asset) fallbackFontRegions += 1;
          const key = fontKey(box);
          font = fonts.get(key);
          if (!font) {
            const standard = pdfLib.StandardFonts as unknown as Record<string, string>;
            font = await pdfDocument.embedFont(standard[key] || standard.Helvetica);
            fonts.set(key, font);
          }
        }'''
workspace = replace_exact(workspace, old_font_block, new_font_block, 'custom font export')

workspace = replace_exact(
    workspace,
    "      setStatus(`Done. Downloaded an edited copy with ${edits.length} changed region${edits.length === 1 ? '' : 's'}.`);",
    "      setStatus(`Done. Downloaded an edited copy with ${edits.length} changed region${edits.length === 1 ? '' : 's'}.${embeddedFontRegions ? ` Embedded original/custom fonts in ${embeddedFontRegions} region${embeddedFontRegions === 1 ? '' : 's'}.` : ''}${fallbackFontRegions ? ` ${fallbackFontRegions} region${fallbackFontRegions === 1 ? '' : 's'} used a safe fallback because the embedded font could not represent the replacement text.` : ''}`);",
    'font export status',
)

workspace = replace_exact(
    workspace,
    "    setFile(null);\n    setPagesNow([]);\n    setPageNumber(1);",
    "    setFile(null);\n    setPagesNow([]);\n    fontAssetsRef.current = new Map();\n    setCustomFonts([]);\n    setPageNumber(1);",
    'clear fonts on reset',
)

workspace = replace_exact(
    workspace,
    "      <input\n        ref={fileInput}\n        hidden\n        type=\"file\"\n        accept=\"application/pdf,.pdf\"\n        onChange={(event) => void chooseFile(event.target.files?.[0] || null)}\n      />",
    "      <input\n        ref={fileInput}\n        hidden\n        type=\"file\"\n        accept=\"application/pdf,.pdf\"\n        onChange={(event) => void chooseFile(event.target.files?.[0] || null)}\n      />\n      <input\n        ref={fontInput}\n        hidden\n        type=\"file\"\n        accept=\".ttf,.otf,.woff,.woff2,font/ttf,font/otf,font/woff,font/woff2\"\n        onChange={(event) => void loadCustomFont(event.target.files?.[0] || null)}\n      />",
    'custom font input',
)

old_select = r'''                <label>Font</label>
                <select className="spe-select" disabled={!selected} value={selected?.fontFamily || 'Arial'} onChange={(event) => selected && patchBox(selected.id, { fontFamily: event.target.value })}>
                  {FONT_CHOICES.map((font) => <option key={font}>{font}</option>)}
                </select>'''
new_select = r'''                <label>Font</label>
                <select
                  className="spe-select"
                  disabled={!selected}
                  value={selected?.fontAssetId ? `asset:${selected.fontAssetId}` : selected?.fontFamily || 'Arial'}
                  onChange={(event) => applyFontChoice(event.target.value)}
                >
                  {originalFontAsset ? <option value={`asset:${originalFontAsset.id}`}>Original · {originalFontAsset.fullName || originalFontAsset.family}</option> : null}
                  {FONT_CHOICES.map((font) => <option key={font} value={font}>{font}</option>)}
                  {customFonts.map((font) => <option key={font.id} value={`asset:${font.id}`}>Embedded · {font.fullName || font.family}</option>)}
                </select>
                <button className="spe-btn" type="button" disabled={busy} onClick={() => { if (fontInput.current) { fontInput.current.value = ''; fontInput.current.click(); } }}><FileUp size={14} />Load font</button>'''
workspace = replace_exact(workspace, old_select, new_select, 'font selector and upload control')

workspace = replace_exact(
    workspace,
    "                <button className={`spe-btn ${selected?.bold ? 'active' : ''}`} type=\"button\" disabled={!selected} onClick={() => selected && patchBox(selected.id, { bold: !selected.bold })}><Bold size={15} /></button>\n                <button className={`spe-btn ${selected?.italic ? 'active' : ''}`} type=\"button\" disabled={!selected} onClick={() => selected && patchBox(selected.id, { italic: !selected.italic })}><Italic size={15} /></button>",
    "                <button className={`spe-btn ${selected?.bold ? 'active' : ''}`} type=\"button\" disabled={!selected || Boolean(selectedFontAsset)} title={selectedFontAsset ? 'Weight comes from the embedded font file.' : undefined} onClick={() => selected && patchBox(selected.id, { bold: !selected.bold })}><Bold size={15} /></button>\n                <button className={`spe-btn ${selected?.italic ? 'active' : ''}`} type=\"button\" disabled={!selected || Boolean(selectedFontAsset)} title={selectedFontAsset ? 'Style comes from the embedded font file.' : undefined} onClick={() => selected && patchBox(selected.id, { italic: !selected.italic })}><Italic size={15} /></button>",
    'disable synthetic custom font styling',
)

workspace = replace_exact(
    workspace,
    "                <span className=\"spe-detail\">{selected ? `${selected.source === 'native' ? 'PDF metadata' : selected.source === 'ocr' ? 'OCR estimate' : 'New text'}${selected.confidence != null ? ` · ${Math.round(selected.confidence)}%` : ''}` : 'Click a text region to edit it'}</span>",
    "                <span className=\"spe-detail\">{selected ? `${selected.source === 'native' ? 'PDF metadata' : selected.source === 'ocr' ? 'OCR estimate' : 'New text'}${selected.confidence != null ? ` · ${Math.round(selected.confidence)}%` : ''} · Detected: ${selected.detectedFontName}${selectedFontAsset ? ` · Embedded: ${selectedFontAsset.fullName || selectedFontAsset.family}` : ''}` : 'Click a text region to edit it'}</span>",
    'font detail status',
)

qa = replace_exact(
    qa,
    "expect(workspace, \"await import('pdf-lib')\", 'Edited PDF export must remain available.');",
    "expect(workspace, \"await import('pdf-lib')\", 'Edited PDF export must remain available.');\nexpect(workspace, \"await import('@pdf-lib/fontkit')\", 'Phase 3 must load fontkit for original/custom font parsing and embedding.');\nexpect(workspace, 'pdfPage.commonObjs?.get?.(fontName)', 'Digital PDFs should attempt to reuse embedded source font bytes when PDF.js exposes them.');\nexpect(workspace, \"pdfDocument.registerFontkit(fontkitModule.default as any)\", 'Custom font embedding must register fontkit with pdf-lib.');\nexpect(workspace, \"pdfDocument.embedFont(asset.bytes, { subset: true })\", 'Original or user-provided fonts must be embedded as subsets in the exported PDF.');\nexpect(workspace, 'fontSupportsText(asset, box.text)', 'Subset fonts must be checked for replacement glyph coverage before export.');\nexpect(workspace, 'accept=\".ttf,.otf,.woff,.woff2,font/ttf,font/otf,font/woff,font/woff2\"', 'Users must be able to load a local custom font without uploading it to a server.');\nexpect(workspace, \"detectedFontName: sourceName\", 'Native PDF regions must retain a human-readable detected font identity.');",
    'phase 3 QA checks',
)

workspace_path.write_text(workspace)
qa_path.write_text(qa)
print('Applied Edit PDF Phase 3 original/custom font embedding changes.')
