function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function sanitizeWordFilename(value: string): string {
  const clean = value.replace(/[\\/:*?"<>|]+/g, '').trim();
  return clean || 'Untitled document';
}

function imageTypeFromSource(src: string): string {
  const dataMatch = src.match(/^data:image\/([a-zA-Z0-9+.-]+);/);
  const raw = (dataMatch?.[1] || src.split('?')[0].split('.').pop() || 'png').toLowerCase();
  if (raw === 'jpeg') return 'jpg';
  if (['png', 'jpg', 'gif', 'bmp', 'svg'].includes(raw)) return raw;
  return 'png';
}

async function imageBytes(src: string): Promise<Uint8Array | null> {
  try {
    if (src.startsWith('data:')) {
      const comma = src.indexOf(',');
      if (comma < 0) return null;
      const meta = src.slice(0, comma);
      const payload = src.slice(comma + 1);
      if (meta.includes(';base64')) {
        const binary = atob(payload);
        const bytes = new Uint8Array(binary.length);
        for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
        return bytes;
      }
      return new TextEncoder().encode(decodeURIComponent(payload));
    }

    const response = await fetch(src);
    if (!response.ok) return null;
    return new Uint8Array(await response.arrayBuffer());
  } catch {
    return null;
  }
}

export async function exportWordDocumentDocx(root: HTMLElement, title: string): Promise<void> {
  const docx = await import('docx');
  const blocks: any[] = [];

  const runsFromNode = async (node: Node, inherited: Record<string, unknown> = {}): Promise<any[]> => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent ?? '';
      return text ? [new docx.TextRun({ text, ...inherited })] : [];
    }
    if (!(node instanceof HTMLElement)) return [];
    if (node.hasAttribute('data-fwo-page-break')) return [];

    const style: Record<string, unknown> = { ...inherited };
    const tag = node.tagName;
    if (tag === 'B' || tag === 'STRONG') style.bold = true;
    if (tag === 'I' || tag === 'EM') style.italics = true;
    if (tag === 'U') style.underline = {};
    if (tag === 'S' || tag === 'STRIKE') style.strike = true;
    if (tag === 'SUP') style.superScript = true;
    if (tag === 'SUB') style.subScript = true;

    const color = node.style.color || (tag === 'FONT' ? node.getAttribute('color') ?? '' : '');
    if (color && /^#[0-9a-f]{6}$/i.test(color)) style.color = color.slice(1);

    const face = node.style.fontFamily || (tag === 'FONT' ? node.getAttribute('face') ?? '' : '');
    if (face) style.font = face.replace(/["']/g, '').split(',')[0];

    const size = node.style.fontSize;
    if (size.endsWith('pt')) style.size = Math.round(parseFloat(size) * 2);
    if (tag === 'BR') return [new docx.TextRun({ break: 1 })];

    if (tag === 'IMG') {
      const src = node.getAttribute('src') || '';
      const data = src ? await imageBytes(src) : null;
      if (!data) return [];
      const image = node as HTMLImageElement;
      const naturalWidth = image.naturalWidth || Number(image.getAttribute('width')) || 480;
      const naturalHeight = image.naturalHeight || Number(image.getAttribute('height')) || 320;
      const maxWidth = 600;
      const ratio = naturalWidth > maxWidth ? maxWidth / naturalWidth : 1;
      const width = Math.max(24, Math.round(naturalWidth * ratio));
      const height = Math.max(24, Math.round(naturalHeight * ratio));
      return [new docx.ImageRun({
        data,
        type: imageTypeFromSource(src),
        transformation: { width, height },
      } as any)];
    }

    if (tag === 'A') {
      const href = node.getAttribute('href') || '';
      const childRuns = (await Promise.all(Array.from(node.childNodes).map((child) => runsFromNode(child, style)))).flat();
      if (!href) return childRuns;
      return [new docx.ExternalHyperlink({ children: childRuns, link: href } as any)];
    }

    return (await Promise.all(Array.from(node.childNodes).map((child) => runsFromNode(child, style)))).flat();
  };

  const alignmentFrom = (element: HTMLElement) => {
    const alignment = element.style.textAlign;
    if (alignment === 'center') return docx.AlignmentType.CENTER;
    if (alignment === 'right') return docx.AlignmentType.RIGHT;
    if (alignment === 'justify') return docx.AlignmentType.JUSTIFIED;
    return docx.AlignmentType.LEFT;
  };

  const paragraphOptions = async (node: HTMLElement) => {
    const options: Record<string, unknown> = {
      children: await runsFromNode(node),
      alignment: alignmentFrom(node),
      spacing: { after: 120 },
    };

    const lineHeight = parseFloat(node.style.lineHeight);
    if (Number.isFinite(lineHeight) && lineHeight > 0) {
      options.spacing = { after: 120, line: Math.round(240 * lineHeight) };
    }

    if (node.tagName === 'H1') options.heading = docx.HeadingLevel.HEADING_1;
    if (node.tagName === 'H2') options.heading = docx.HeadingLevel.HEADING_2;
    if (node.tagName === 'H3') options.heading = docx.HeadingLevel.HEADING_3;
    if (node.tagName === 'LI') options.bullet = { level: 0 };
    return options;
  };

  const headerNode = root.querySelector<HTMLElement>(':scope > [data-fwo-header]');
  const footerNode = root.querySelector<HTMLElement>(':scope > [data-fwo-footer]');

  for (const child of Array.from(root.children)) {
    if (!(child instanceof HTMLElement)) continue;
    if (child === headerNode || child === footerNode) continue;

    if (child.hasAttribute('data-fwo-page-break')) {
      blocks.push(new docx.Paragraph({ children: [new docx.PageBreak()] }));
      continue;
    }

    const tag = child.tagName;
    if (tag === 'HR') {
      blocks.push(new docx.Paragraph({ text: '────────────────────────', alignment: docx.AlignmentType.CENTER }));
      continue;
    }

    if (tag === 'TABLE') {
      const rows = [] as any[];
      for (const row of Array.from(child.querySelectorAll('tr'))) {
        const cells = [] as any[];
        for (const cell of Array.from(row.querySelectorAll(':scope > td, :scope > th'))) {
          cells.push(new docx.TableCell({
            children: [new docx.Paragraph({ children: await runsFromNode(cell) })],
          }));
        }
        rows.push(new docx.TableRow({ children: cells }));
      }
      if (rows.length) blocks.push(new docx.Table({ rows, width: { size: 100, type: docx.WidthType.PERCENTAGE } }));
      continue;
    }

    if (tag === 'UL' || tag === 'OL') {
      const items = Array.from(child.querySelectorAll<HTMLElement>(':scope > li'));
      for (const item of items) {
        const options = await paragraphOptions(item);
        options.bullet = { level: 0 };
        blocks.push(new docx.Paragraph(options as any));
      }
      continue;
    }

    blocks.push(new docx.Paragraph((await paragraphOptions(child)) as any));
  }

  if (!blocks.length) blocks.push(new docx.Paragraph(''));

  const section: any = { properties: {}, children: blocks };
  if (headerNode) {
    section.headers = {
      default: new docx.Header({
        children: [new docx.Paragraph({ children: await runsFromNode(headerNode), alignment: alignmentFrom(headerNode) })],
      } as any),
    };
  }
  if (footerNode) {
    section.footers = {
      default: new docx.Footer({
        children: [new docx.Paragraph({ children: await runsFromNode(footerNode), alignment: alignmentFrom(footerNode) })],
      } as any),
    };
  }

  const output = new docx.Document({ sections: [section] });
  const blob = await docx.Packer.toBlob(output);
  downloadBlob(blob, `${sanitizeWordFilename(title)}.docx`);
}

export function exportWordDocumentHtml(html: string, title: string): void {
  const safeTitle = sanitizeWordFilename(title);
  const documentHtml = `<!doctype html><html><head><meta charset="utf-8"><title>${safeTitle}</title></head><body>${html}</body></html>`;
  downloadBlob(
    new Blob([documentHtml], { type: 'text/html;charset=utf-8' }),
    `${safeTitle}.html`,
  );
}
