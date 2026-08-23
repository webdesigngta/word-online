'use client';

import { useMemo, useState } from 'react';
import { buildWordDocumentDocxBlob } from '@/tools/word/export/documentExport';
import { openWordDocument } from '@/tools/word/import/openDocument';

type QaResult = {
  id: string;
  name: string;
  passed: boolean;
  detail: string;
};

type QaCase = {
  id: string;
  name: string;
  build: (docx: any, token: string) => any[];
  section?: (docx: any, children: any[]) => Record<string, unknown>;
};

const cases: QaCase[] = [
  { id: '01', name: 'Simple paragraphs', build: (d, t) => [new d.Paragraph(`${t} Simple paragraph`), new d.Paragraph('Second paragraph')] },
  { id: '02', name: 'Heading hierarchy', build: (d, t) => [new d.Paragraph({ text: `${t} Heading`, heading: d.HeadingLevel.HEADING_1 }), new d.Paragraph({ text: 'Subheading', heading: d.HeadingLevel.HEADING_2 }), new d.Paragraph('Body')] },
  { id: '03', name: 'Bold text', build: (d, t) => [new d.Paragraph({ children: [new d.TextRun({ text: t, bold: true }), new d.TextRun(' bold content')] })] },
  { id: '04', name: 'Italic and underline', build: (d, t) => [new d.Paragraph({ children: [new d.TextRun({ text: `${t} italic`, italics: true }), new d.TextRun({ text: ' underline', underline: {} })] })] },
  { id: '05', name: 'Multiple paragraphs', build: (d, t) => Array.from({ length: 8 }, (_, i) => new d.Paragraph(i === 0 ? `${t} Paragraph ${i + 1}` : `Paragraph ${i + 1}`)) },
  { id: '06', name: 'Bullet list', build: (d, t) => [new d.Paragraph(`${t} List intro`), new d.Paragraph({ text: 'Item one', bullet: { level: 0 } }), new d.Paragraph({ text: 'Item two', bullet: { level: 0 } })] },
  { id: '07', name: 'Table content', build: (d, t) => [new d.Paragraph(`${t} Table`), new d.Table({ rows: [new d.TableRow({ children: [new d.TableCell({ children: [new d.Paragraph('A1')] }), new d.TableCell({ children: [new d.Paragraph('B1')] })] }), new d.TableRow({ children: [new d.TableCell({ children: [new d.Paragraph('A2')] }), new d.TableCell({ children: [new d.Paragraph('B2')] })] })] })] },
  { id: '08', name: 'External hyperlink', build: (d, t) => [new d.Paragraph({ children: [new d.TextRun(`${t} `), new d.ExternalHyperlink({ children: [new d.TextRun({ text: 'Example link', style: 'Hyperlink' })], link: 'https://example.com' })] })] },
  { id: '09', name: 'Unicode text', build: (d, t) => [new d.Paragraph(`${t} café résumé Ελληνικά हिंदी ગુજરાતી 日本語 😀`)] },
  { id: '10', name: 'Special characters', build: (d, t) => [new d.Paragraph(`${t} & < > “quotes” 'apostrophe' © ® ™ — – …`)] },
  { id: '11', name: 'Long paragraph', build: (d, t) => [new d.Paragraph(`${t} ${'Compatibility testing sentence. '.repeat(120)}`)] },
  { id: '12', name: 'Centered paragraph', build: (d, t) => [new d.Paragraph({ text: `${t} Centered`, alignment: d.AlignmentType.CENTER })] },
  { id: '13', name: 'Right aligned paragraph', build: (d, t) => [new d.Paragraph({ text: `${t} Right aligned`, alignment: d.AlignmentType.RIGHT })] },
  { id: '14', name: 'Colored and sized text', build: (d, t) => [new d.Paragraph({ children: [new d.TextRun({ text: `${t} Colored`, color: '0B57D0', size: 32 })] })] },
  { id: '15', name: 'Mixed inline formatting', build: (d, t) => [new d.Paragraph({ children: [new d.TextRun(t), new d.TextRun({ text: ' bold', bold: true }), new d.TextRun({ text: ' italic', italics: true }), new d.TextRun({ text: ' underlined', underline: {} })] })] },
  { id: '16', name: 'Page break', build: (d, t) => [new d.Paragraph(`${t} Page one`), new d.Paragraph({ children: [new d.PageBreak()] }), new d.Paragraph('Page two')] },
  { id: '17', name: 'Header and footer', build: (d, t) => [new d.Paragraph(`${t} Main body`)], section: (d, children) => ({ children, headers: { default: new d.Header({ children: [new d.Paragraph('Header text')] }) }, footers: { default: new d.Footer({ children: [new d.Paragraph('Footer text')] }) } }) },
  { id: '18', name: 'Many headings and body blocks', build: (d, t) => [new d.Paragraph({ text: `${t} Report`, heading: d.HeadingLevel.HEADING_1 }), ...Array.from({ length: 5 }, (_, i) => [new d.Paragraph({ text: `Section ${i + 1}`, heading: d.HeadingLevel.HEADING_2 }), new d.Paragraph(`Section ${i + 1} content`)]).flat()] },
  { id: '19', name: 'Table plus formatted text', build: (d, t) => [new d.Paragraph({ children: [new d.TextRun({ text: t, bold: true }), new d.TextRun(' invoice')] }), new d.Table({ rows: [new d.TableRow({ children: [new d.TableCell({ children: [new d.Paragraph('Description')] }), new d.TableCell({ children: [new d.Paragraph('Amount')] })] }), new d.TableRow({ children: [new d.TableCell({ children: [new d.Paragraph('Service')] }), new d.TableCell({ children: [new d.Paragraph('$100')] })] })] })] },
  { id: '20', name: 'Mixed realistic document', build: (d, t) => [new d.Paragraph({ text: `${t} Project Update`, heading: d.HeadingLevel.HEADING_1 }), new d.Paragraph({ children: [new d.TextRun({ text: 'Status: ', bold: true }), new d.TextRun('On track')] }), new d.Paragraph({ text: 'Highlights', heading: d.HeadingLevel.HEADING_2 }), new d.Paragraph({ text: 'Completed milestone one', bullet: { level: 0 } }), new d.Paragraph({ text: 'Completed milestone two', bullet: { level: 0 } }), new d.Paragraph('Next steps and notes for the project team.')] },
];

async function createSourceFile(testCase: QaCase) {
  const docx = await import('docx');
  const token = `FWO-QA-${testCase.id}`;
  const children = testCase.build(docx, token);
  const section = testCase.section ? testCase.section(docx, children) : { children };
  const document = new docx.Document({ sections: [section as any] });
  const blob = await docx.Packer.toBlob(document);
  return { file: new File([blob], `fwo-qa-${testCase.id}.docx`, { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }), token };
}

async function runCase(testCase: QaCase): Promise<QaResult> {
  try {
    const { file, token } = await createSourceFile(testCase);
    const imported = await openWordDocument(file);
    if (!imported.html.includes(token)) {
      return { id: testCase.id, name: testCase.name, passed: false, detail: 'Source DOCX opened, but the case token was lost during import.' };
    }

    const root = document.createElement('div');
    root.innerHTML = imported.html;
    const editMarker = `FWO-EDIT-${testCase.id}`;
    const marker = document.createElement('p');
    marker.textContent = editMarker;
    root.appendChild(marker);

    const exported = await buildWordDocumentDocxBlob(root);
    if (exported.size < 100) {
      return { id: testCase.id, name: testCase.name, passed: false, detail: 'Exported DOCX was unexpectedly small.' };
    }

    const roundTrip = await openWordDocument(new File([exported], `roundtrip-${testCase.id}.docx`, { type: file.type }));
    const passed = roundTrip.html.includes(token) && roundTrip.html.includes(editMarker);
    return {
      id: testCase.id,
      name: testCase.name,
      passed,
      detail: passed ? `Open → edit → DOCX export → reopen succeeded (${Math.round(exported.size / 1024)} KB).` : 'Round-trip DOCX reopened, but original or edited text was lost.',
    };
  } catch (error) {
    return { id: testCase.id, name: testCase.name, passed: false, detail: error instanceof Error ? error.message : 'Unknown QA failure.' };
  }
}

export function WordCompatibilityQa() {
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<QaResult[]>([]);
  const summary = useMemo(() => {
    const passed = results.filter((result) => result.passed).length;
    const total = results.length;
    return { passed, total, rate: total ? Math.round((passed / total) * 100) : 0 };
  }, [results]);

  async function runAll() {
    setRunning(true);
    setResults([]);
    const next: QaResult[] = [];
    for (const testCase of cases) {
      const result = await runCase(testCase);
      next.push(result);
      setResults([...next]);
    }
    setRunning(false);
  }

  return (
    <section className="fwo-qa">
      <style>{`
        .fwo-qa{font-family:Arial,Helvetica,sans-serif;color:#202124}.fwo-qa-actions{display:flex;align-items:center;gap:14px;flex-wrap:wrap;margin:18px 0}.fwo-qa button{border:0;border-radius:999px;background:#0b57d0;color:#fff;padding:11px 17px;font-weight:700;cursor:pointer}.fwo-qa button:disabled{opacity:.55;cursor:wait}.fwo-qa-summary{font-weight:700}.fwo-qa-summary.pass{color:#137333}.fwo-qa-summary.fail{color:#b3261e}.fwo-qa-table{width:100%;border-collapse:collapse;background:#fff;border:1px solid #e0e3e7}.fwo-qa-table th,.fwo-qa-table td{text-align:left;padding:10px 12px;border-bottom:1px solid #e7e9ed;font-size:12px;vertical-align:top}.fwo-qa-table th{background:#f7f9fc;font-size:11px}.fwo-qa-pass{color:#137333;font-weight:700}.fwo-qa-fail{color:#b3261e;font-weight:700}@media(max-width:700px){.fwo-qa-table{display:block;overflow:auto}}
      `}</style>
      <p>This browser-only suite generates 20 independent DOCX files, imports each through the production Word importer, appends an edit marker, exports through the production DOCX exporter, then reopens the result.</p>
      <div className="fwo-qa-actions">
        <button type="button" disabled={running} onClick={() => void runAll()}>{running ? `Running ${results.length}/20…` : 'Run 20-case compatibility suite'}</button>
        {summary.total ? <span className={`fwo-qa-summary ${summary.rate >= 95 ? 'pass' : 'fail'}`}>{summary.passed}/{summary.total} passed · {summary.rate}%</span> : null}
      </div>
      {results.length ? (
        <table className="fwo-qa-table">
          <thead><tr><th>Case</th><th>Scenario</th><th>Result</th><th>Details</th></tr></thead>
          <tbody>{results.map((result) => <tr key={result.id}><td>{result.id}</td><td>{result.name}</td><td className={result.passed ? 'fwo-qa-pass' : 'fwo-qa-fail'}>{result.passed ? 'PASS' : 'FAIL'}</td><td>{result.detail}</td></tr>)}</tbody>
        </table>
      ) : null}
    </section>
  );
}
