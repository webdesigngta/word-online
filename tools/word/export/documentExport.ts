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

export async function exportWordDocumentDocx(root: HTMLElement, title: string): Promise<void> {
  const docx = await import('docx');
  const blocks: any[] = [];

  const runsFromNode = (node: Node, inherited: Record<string, unknown> = {}): any[] => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent ?? '';
      return text ? [new docx.TextRun({ text, ...inherited })] : [];
    }
    if (!(node instanceof HTMLElement)) return [];

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

    return Array.from(node.childNodes).flatMap((child) => runsFromNode(child, style));
  };

  const alignmentFrom = (element: HTMLElement) => {
    const alignment = element.style.textAlign;
    if (alignment === 'center') return docx.AlignmentType.CENTER;
    if (alignment === 'right') return docx.AlignmentType.RIGHT;
    if (alignment === 'justify') return docx.AlignmentType.JUSTIFIED;
    return docx.AlignmentType.LEFT;
  };

  Array.from(root.children).forEach((node) => {
    if (!(node instanceof HTMLElement)) return;
    const tag = node.tagName;
    const options: Record<string, unknown> = {
      children: runsFromNode(node),
      alignment: alignmentFrom(node),
      spacing: { after: 120 },
    };

    if (tag === 'H1') options.heading = docx.HeadingLevel.HEADING_1;
    if (tag === 'H2') options.heading = docx.HeadingLevel.HEADING_2;
    if (tag === 'H3') options.heading = docx.HeadingLevel.HEADING_3;
    if (tag === 'LI') options.bullet = { level: 0 };

    if (tag === 'HR') {
      blocks.push(new docx.Paragraph({ text: '────────────────────────', alignment: docx.AlignmentType.CENTER }));
      return;
    }

    if (tag === 'TABLE') {
      const rows = Array.from(node.querySelectorAll('tr')).map((row) =>
        new docx.TableRow({
          children: Array.from(row.querySelectorAll(':scope > td, :scope > th')).map((cell) =>
            new docx.TableCell({ children: [new docx.Paragraph({ children: runsFromNode(cell) })] }),
          ),
        }),
      );
      if (rows.length) {
        blocks.push(new docx.Table({ rows, width: { size: 100, type: docx.WidthType.PERCENTAGE } }));
      }
      return;
    }

    blocks.push(new docx.Paragraph(options as any));
  });

  if (!blocks.length) blocks.push(new docx.Paragraph(''));
  const output = new docx.Document({ sections: [{ properties: {}, children: blocks }] });
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
