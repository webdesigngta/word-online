import JSZip from 'jszip';

export type WordFinishMode = 'page-numbers' | 'signature' | 'watermark' | 'header-footer' | 'redact';

export type WordFinishOptions = {
  alignment?: 'left' | 'center' | 'right';
  headerText?: string;
  footerText?: string;
  watermarkText?: string;
  signatureBytes?: Uint8Array;
  signatureExtension?: 'png' | 'jpg' | 'jpeg';
  signatureWidthMm?: number;
  signatureAspectRatio?: number;
  redactionTerms?: string[];
};

export type WordFinishResult = {
  blob: Blob;
  redactionCount?: number;
};

const DOCX_TYPE = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const R_NS = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const REL_NS = 'http://schemas.openxmlformats.org/package/2006/relationships';
const CT_NS = 'http://schemas.openxmlformats.org/package/2006/content-types';
const HEADER_REL = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/header';
const FOOTER_REL = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer';
const IMAGE_REL = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/image';

function escapeXml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

function parseXml(xml: string, label: string) {
  const document = new DOMParser().parseFromString(xml, 'application/xml');
  if (document.querySelector('parsererror')) throw new Error(`${label} is not valid XML.`);
  return document;
}

function serializeXml(document: Document) {
  return new XMLSerializer().serializeToString(document);
}

function normalizePath(path: string) {
  const output: string[] = [];
  path.split('/').forEach((part) => {
    if (!part || part === '.') return;
    if (part === '..') output.pop();
    else output.push(part);
  });
  return output.join('/');
}

function resolveWordTarget(target: string) {
  if (target.startsWith('/')) return target.slice(1);
  return normalizePath(`word/${target}`);
}

function nextRid(rels: Document) {
  const used = new Set(Array.from(rels.getElementsByTagName('Relationship')).map((node) => node.getAttribute('Id') || ''));
  let index = 1;
  while (used.has(`rId${index}`)) index += 1;
  return `rId${index}`;
}

function relationshipMap(rels: Document) {
  const map = new Map<string, string>();
  Array.from(rels.getElementsByTagName('Relationship')).forEach((node) => {
    const id = node.getAttribute('Id');
    const target = node.getAttribute('Target');
    if (id && target) map.set(id, target);
  });
  return map;
}

function ensureRelationship(rels: Document, type: string, target: string) {
  const root = rels.documentElement;
  const rid = nextRid(rels);
  const relationship = rels.createElementNS(REL_NS, 'Relationship');
  relationship.setAttribute('Id', rid);
  relationship.setAttribute('Type', type);
  relationship.setAttribute('Target', target);
  root.appendChild(relationship);
  return rid;
}

function ensureContentTypeOverride(types: Document, partName: string, contentType: string) {
  const exists = Array.from(types.getElementsByTagName('Override')).some((node) => node.getAttribute('PartName') === partName);
  if (exists) return;
  const override = types.createElementNS(CT_NS, 'Override');
  override.setAttribute('PartName', partName);
  override.setAttribute('ContentType', contentType);
  types.documentElement.appendChild(override);
}

function ensureContentTypeDefault(types: Document, extension: string, contentType: string) {
  const lower = extension.toLowerCase();
  const exists = Array.from(types.getElementsByTagName('Default')).some((node) => (node.getAttribute('Extension') || '').toLowerCase() === lower);
  if (exists) return;
  const entry = types.createElementNS(CT_NS, 'Default');
  entry.setAttribute('Extension', lower);
  entry.setAttribute('ContentType', contentType);
  types.documentElement.appendChild(entry);
}

async function packageDocuments(zip: JSZip) {
  const documentXml = await zip.file('word/document.xml')?.async('string');
  const contentTypesXml = await zip.file('[Content_Types].xml')?.async('string');
  if (!documentXml || !contentTypesXml) throw new Error('This file is not a readable DOCX package.');
  const relsXml = await zip.file('word/_rels/document.xml.rels')?.async('string') ?? `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="${REL_NS}"></Relationships>`;
  return {
    document: parseXml(documentXml, 'word/document.xml'),
    rels: parseXml(relsXml, 'word/_rels/document.xml.rels'),
    contentTypes: parseXml(contentTypesXml, '[Content_Types].xml'),
  };
}

function sections(document: Document) {
  let values = Array.from(document.getElementsByTagNameNS(W_NS, 'sectPr'));
  if (!values.length) values = Array.from(document.getElementsByTagName('w:sectPr'));
  if (values.length) return values;
  const body = document.getElementsByTagNameNS(W_NS, 'body')[0] || document.getElementsByTagName('w:body')[0];
  if (!body) throw new Error('The DOCX document body is missing.');
  const section = document.createElementNS(W_NS, 'w:sectPr');
  body.appendChild(section);
  return [section];
}

function sectionReference(section: Element, kind: 'header' | 'footer') {
  const localName = `${kind}Reference`;
  return Array.from(section.children).find((node) => {
    if (node.localName !== localName && node.tagName !== `w:${localName}`) return false;
    const type = node.getAttributeNS(W_NS, 'type') || node.getAttribute('w:type') || 'default';
    return type === 'default';
  }) ?? null;
}

function alignmentParagraph(text: string, alignment: 'left' | 'center' | 'right' = 'left') {
  return `<w:p><w:pPr><w:jc w:val="${alignment}"/></w:pPr><w:r><w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r></w:p>`;
}

function pageNumberParagraph(alignment: 'left' | 'center' | 'right' = 'center') {
  return `<w:p><w:pPr><w:jc w:val="${alignment}"/></w:pPr><w:r><w:fldChar w:fldCharType="begin"/></w:r><w:r><w:instrText xml:space="preserve"> PAGE </w:instrText></w:r><w:r><w:fldChar w:fldCharType="separate"/></w:r><w:r><w:t>1</w:t></w:r><w:r><w:fldChar w:fldCharType="end"/></w:r></w:p>`;
}

function watermarkParagraph(text: string) {
  const safe = escapeXml(text);
  return `<w:p xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w10="urn:schemas-microsoft-com:office:word"><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:noProof/></w:rPr><w:pict><v:shapetype id="_x0000_t136" coordsize="21600,21600" o:spt="136" adj="10800" path="m@7,l@8,m@5,21600l@6,21600e"><v:formulas><v:f eqn="sum #0 0 10800"/><v:f eqn="prod #0 2 1"/><v:f eqn="sum 21600 0 @1"/><v:f eqn="sum 0 0 @2"/><v:f eqn="sum 21600 0 @3"/><v:f eqn="if @0 @3 0"/><v:f eqn="if @0 21600 @1"/><v:f eqn="if @0 0 @2"/><v:f eqn="if @0 @4 21600"/><v:f eqn="mid @5 @6"/><v:f eqn="mid @8 @5"/><v:f eqn="mid @7 @8"/><v:f eqn="mid @6 @7"/><v:f eqn="sum @6 0 @5"/></v:formulas><v:path textpathok="t" o:connecttype="custom" o:connectlocs="@9,0;@10,10800;@11,21600;@12,10800" o:connectangles="270,180,90,0"/><v:textpath on="t" fitshape="t"/><v:handles><v:h position="#0,bottomRight" xrange="6629,14971"/></v:handles><o:lock v:ext="edit" text="t" shapetype="t"/></v:shapetype><v:shape id="WordOnlineWatermark" type="#_x0000_t136" style="position:absolute;margin-left:0;margin-top:0;width:468pt;height:117pt;rotation:315;z-index:-251654144;mso-wrap-edited:f;mso-position-horizontal:center;mso-position-horizontal-relative:margin;mso-position-vertical:center;mso-position-vertical-relative:margin" fillcolor="silver" stroked="f"><v:fill opacity=".35"/><v:textpath style="font-family:&quot;Arial&quot;;font-size:1pt" string="${safe}"/><w10:wrap anchorx="margin" anchory="margin"/></v:shape></w:pict></w:r></w:p>`;
}

function appendBeforeClose(xml: string, kind: 'header' | 'footer', fragment: string) {
  const close = kind === 'header' ? '</w:hdr>' : '</w:ftr>';
  if (!xml.includes(close)) throw new Error(`The existing ${kind} part is malformed.`);
  return xml.replace(close, `${fragment}${close}`);
}

function emptyPart(kind: 'header' | 'footer', fragment: string) {
  const root = kind === 'header' ? 'hdr' : 'ftr';
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:${root} xmlns:w="${W_NS}" xmlns:r="${R_NS}">${fragment}</w:${root}>`;
}

function nextPartName(zip: JSZip, kind: 'header' | 'footer') {
  let index = 1;
  while (zip.file(`word/${kind}${index}.xml`)) index += 1;
  return `${kind}${index}.xml`;
}

async function appendToSectionPart(zip: JSZip, kind: 'header' | 'footer', fragment: string) {
  const docs = await packageDocuments(zip);
  const relMap = relationshipMap(docs.rels);
  const targets = new Set<string>();
  let sharedTarget: string | null = null;
  let sharedRid: string | null = null;

  for (const section of sections(docs.document)) {
    const reference = sectionReference(section, kind);
    const rid = reference?.getAttributeNS(R_NS, 'id') || reference?.getAttribute('r:id') || '';
    const target = rid ? relMap.get(rid) : undefined;
    if (target) {
      targets.add(resolveWordTarget(target));
      continue;
    }

    if (!sharedTarget || !sharedRid) {
      const partName = nextPartName(zip, kind);
      sharedTarget = `word/${partName}`;
      sharedRid = ensureRelationship(docs.rels, kind === 'header' ? HEADER_REL : FOOTER_REL, partName);
      ensureContentTypeOverride(
        docs.contentTypes,
        `/${sharedTarget}`,
        kind === 'header' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml',
      );
      zip.file(sharedTarget, emptyPart(kind, fragment));
      targets.add(sharedTarget);
    }

    const newReference = docs.document.createElementNS(W_NS, `w:${kind}Reference`);
    newReference.setAttributeNS(W_NS, 'w:type', 'default');
    newReference.setAttributeNS(R_NS, 'r:id', sharedRid);
    section.insertBefore(newReference, section.firstChild);
  }

  for (const target of targets) {
    if (target === sharedTarget) continue;
    const xml = await zip.file(target)?.async('string');
    if (!xml) continue;
    zip.file(target, appendBeforeClose(xml, kind, fragment));
  }

  zip.file('word/document.xml', serializeXml(docs.document));
  zip.file('word/_rels/document.xml.rels', serializeXml(docs.rels));
  zip.file('[Content_Types].xml', serializeXml(docs.contentTypes));
}

function insertionPoint(documentXml: string) {
  const finalSection = documentXml.lastIndexOf('<w:sectPr');
  if (finalSection >= 0) return finalSection;
  const bodyClose = documentXml.lastIndexOf('</w:body>');
  if (bodyClose < 0) throw new Error('The DOCX document body is malformed.');
  return bodyClose;
}

function signatureParagraph(rid: string, widthMm: number, aspectRatio: number, alignment: 'left' | 'center' | 'right') {
  const cx = Math.round(Math.max(10, Math.min(120, widthMm)) * 36000);
  const ratio = Number.isFinite(aspectRatio) && aspectRatio > 0 ? aspectRatio : 2.5;
  const cy = Math.round(cx / ratio);
  return `<w:p><w:pPr><w:jc w:val="${alignment}"/></w:pPr><w:r><w:drawing><wp:inline xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${cx}" cy="${cy}"/><wp:effectExtent l="0" t="0" r="0" b="0"/><wp:docPr id="1001" name="Signature"/><wp:cNvGraphicFramePr><a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/></wp:cNvGraphicFramePr><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="0" name="Signature"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip xmlns:r="${R_NS}" r:embed="${rid}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>`;
}

async function addSignature(zip: JSZip, options: WordFinishOptions) {
  if (!options.signatureBytes?.length) throw new Error('Choose a PNG or JPG signature image.');
  const extension = options.signatureExtension === 'png' ? 'png' : 'jpg';
  const docs = await packageDocuments(zip);
  const rid = ensureRelationship(docs.rels, IMAGE_REL, `media/word-online-signature.${extension}`);
  ensureContentTypeDefault(docs.contentTypes, extension, extension === 'png' ? 'image/png' : 'image/jpeg');
  zip.file(`word/media/word-online-signature.${extension}`, options.signatureBytes);

  const documentXml = serializeXml(docs.document);
  const point = insertionPoint(documentXml);
  const paragraph = signatureParagraph(rid, options.signatureWidthMm ?? 45, options.signatureAspectRatio ?? 2.5, options.alignment ?? 'left');
  zip.file('word/document.xml', `${documentXml.slice(0, point)}${paragraph}${documentXml.slice(point)}`);
  zip.file('word/_rels/document.xml.rels', serializeXml(docs.rels));
  zip.file('[Content_Types].xml', serializeXml(docs.contentTypes));
}

function redactXml(xml: string, terms: string[]) {
  const document = parseXml(xml, 'DOCX text part');
  let paragraphs = Array.from(document.getElementsByTagNameNS(W_NS, 'p'));
  if (!paragraphs.length) paragraphs = Array.from(document.getElementsByTagName('w:p'));
  const normalizedTerms = terms.map((term) => term.trim()).filter(Boolean).sort((a, b) => b.length - a.length);
  let count = 0;

  for (const paragraph of paragraphs) {
    let textNodes = Array.from(paragraph.getElementsByTagNameNS(W_NS, 't'));
    if (!textNodes.length) textNodes = Array.from(paragraph.getElementsByTagName('w:t'));
    if (!textNodes.length) continue;
    const originalSegments = textNodes.map((node) => node.textContent ?? '');
    const original = originalSegments.join('');
    if (!original) continue;
    const lower = original.toLocaleLowerCase();
    const mask = Array(original.length).fill(false) as boolean[];

    normalizedTerms.forEach((term) => {
      const needle = term.toLocaleLowerCase();
      if (!needle) return;
      let from = 0;
      while (from <= lower.length - needle.length) {
        const index = lower.indexOf(needle, from);
        if (index < 0) break;
        for (let offset = 0; offset < needle.length; offset += 1) mask[index + offset] = true;
        count += 1;
        from = index + Math.max(1, needle.length);
      }
    });

    if (!mask.some(Boolean)) continue;
    const transformed = Array.from(original).map((character, index) => mask[index] && !/\s/.test(character) ? '█' : character).join('');
    let cursor = 0;
    textNodes.forEach((node, index) => {
      const length = originalSegments[index].length;
      const value = transformed.slice(cursor, cursor + length);
      node.textContent = value;
      if (/^\s|\s$/.test(value)) node.setAttributeNS('http://www.w3.org/XML/1998/namespace', 'xml:space', 'preserve');
      cursor += length;
    });
  }

  return { xml: serializeXml(document), count };
}

async function redactDocument(zip: JSZip, options: WordFinishOptions) {
  const terms = options.redactionTerms?.map((term) => term.trim()).filter(Boolean) ?? [];
  if (!terms.length) throw new Error('Enter at least one word or phrase to redact.');
  const candidateParts = Object.keys(zip.files).filter((path) => /^word\/(?:document|header\d+|footer\d+|footnotes|endnotes|comments)\.xml$/i.test(path));
  let total = 0;
  for (const path of candidateParts) {
    const xml = await zip.file(path)?.async('string');
    if (!xml) continue;
    const result = redactXml(xml, terms);
    total += result.count;
    if (result.count) zip.file(path, result.xml);
  }
  if (!total) throw new Error('None of the requested redaction terms were found in the document text.');
  return total;
}

async function loadZip(file: File) {
  if (!/\.docx$/i.test(file.name)) throw new Error('Choose a DOCX file.');
  if (file.size <= 0 || file.size > 50 * 1024 * 1024) throw new Error('DOCX files must be between 1 byte and 50 MB.');
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  if (!zip.file('[Content_Types].xml') || !zip.file('word/document.xml')) throw new Error('The selected file is not a valid DOCX package.');
  return zip;
}

export async function finishWordDocument(file: File, mode: WordFinishMode, options: WordFinishOptions = {}): Promise<WordFinishResult> {
  const zip = await loadZip(file);
  let redactionCount: number | undefined;

  if (mode === 'page-numbers') {
    await appendToSectionPart(zip, 'footer', pageNumberParagraph(options.alignment ?? 'center'));
  } else if (mode === 'header-footer') {
    const header = options.headerText?.trim();
    const footer = options.footerText?.trim();
    if (!header && !footer) throw new Error('Enter header text, footer text, or both.');
    if (header) await appendToSectionPart(zip, 'header', alignmentParagraph(header, options.alignment ?? 'left'));
    if (footer) await appendToSectionPart(zip, 'footer', alignmentParagraph(footer, options.alignment ?? 'left'));
  } else if (mode === 'watermark') {
    const text = options.watermarkText?.trim();
    if (!text) throw new Error('Enter watermark text.');
    await appendToSectionPart(zip, 'header', watermarkParagraph(text));
  } else if (mode === 'signature') {
    await addSignature(zip, options);
  } else if (mode === 'redact') {
    redactionCount = await redactDocument(zip, options);
  }

  const blob = await zip.generateAsync({ type: 'blob', mimeType: DOCX_TYPE, compression: 'DEFLATE' });
  return { blob, redactionCount };
}
