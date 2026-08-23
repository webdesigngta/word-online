'use client';

import { useMemo, useRef, useState } from 'react';
import { FileText, Upload } from 'lucide-react';
import { wordStatisticsProcessor } from '@/tools/word';

function statisticsForText(text: string) {
  const normalized = text.replace(/\s+/g, ' ').trim();
  const words = normalized ? normalized.split(/\s+/).length : 0;
  return {
    wordCount: words,
    characterCount: text.length,
    characterCountExcludingSpaces: text.replace(/\s/g, '').length,
    sentenceEstimate: normalized ? normalized.split(/[.!?]+/).filter(Boolean).length : 0,
    paragraphCount: text.trim() ? text.split(/\n\s*\n/).filter((item) => item.trim()).length : 0,
    readingTimeMinutes: words ? Math.max(1, Math.ceil(words / 200)) : 0,
  };
}

function numberFrom(metadata: Record<string, unknown> | undefined, key: string) {
  const value = metadata?.[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

export function WordCountInterface() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState('');
  const [docxName, setDocxName] = useState('');
  const [docxStats, setDocxStats] = useState<Record<string, number> | null>(null);
  const [status, setStatus] = useState('Paste or type text below, or analyze a DOCX file.');
  const [busy, setBusy] = useState(false);
  const textStats = useMemo(() => statisticsForText(text), [text]);
  const stats = docxStats ?? textStats;

  async function analyze(file?: File) {
    if (!file) return;
    setBusy(true);
    setStatus(`Analyzing ${file.name}…`);
    try {
      const result = await wordStatisticsProcessor.process(file);
      if (!result.success) {
        setDocxStats(null);
        setDocxName('');
        setStatus(result.errors[0]?.message || 'Could not analyze this DOCX file.');
        return;
      }
      const metadata = result.metadata;
      setDocxName(file.name);
      setDocxStats({
        wordCount: numberFrom(metadata, 'wordCount'),
        characterCount: numberFrom(metadata, 'characterCount'),
        characterCountExcludingSpaces: numberFrom(metadata, 'characterCountExcludingSpaces'),
        sentenceEstimate: numberFrom(metadata, 'sentenceEstimate'),
        paragraphCount: numberFrom(metadata, 'paragraphCount'),
        readingTimeMinutes: numberFrom(metadata, 'readingTimeMinutes'),
        headingCount: numberFrom(metadata, 'headingCount'),
        tableCount: numberFrom(metadata, 'tableCount'),
        imageCount: numberFrom(metadata, 'imageCount'),
      });
      setStatus('DOCX statistics are ready. Start typing to switch back to live text counting.');
    } catch {
      setDocxStats(null);
      setDocxName('');
      setStatus('Could not analyze this DOCX file.');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  const cards = [
    ['Words', stats.wordCount],
    ['Characters', stats.characterCount],
    ['No spaces', stats.characterCountExcludingSpaces],
    ['Sentences', stats.sentenceEstimate],
    ['Paragraphs', stats.paragraphCount],
    ['Reading time', `${stats.readingTimeMinutes} min`],
  ];

  return (
    <div className="fwo-count-tool">
      <style>{`
        .fwo-count-tool{display:grid;gap:16px}.fwo-count-actions{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}.fwo-count-status{font-size:13px;color:#5f6368}.fwo-count-status strong{color:#202124}.fwo-count-upload{border:1px solid #c7d0dd;border-radius:20px;background:#fff;color:#0b57d0;padding:9px 14px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:8px}.fwo-count-upload svg{width:17px}.fwo-count-upload:disabled{opacity:.55}.fwo-count-cards{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:10px}.fwo-count-card{background:#f7f9fc;border:1px solid #e3e7ed;border-radius:14px;padding:14px}.fwo-count-card span{display:block;color:#5f6368;font-size:11px;margin-bottom:5px}.fwo-count-card strong{font-size:21px}.fwo-count-textarea{width:100%;min-height:330px;resize:vertical;border:1px solid #d9dee6;border-radius:14px;padding:18px;font:15px/1.65 Arial,Helvetica,sans-serif;color:#202124;outline:none;box-sizing:border-box}.fwo-count-textarea:focus{border-color:#0b57d0;box-shadow:0 0 0 3px rgba(11,87,208,.08)}.fwo-docx-extra{display:flex;gap:10px;flex-wrap:wrap}.fwo-docx-chip{background:#e8f0fe;color:#174ea6;border-radius:16px;padding:7px 10px;font-size:12px}@media(max-width:900px){.fwo-count-cards{grid-template-columns:repeat(3,1fr)}}@media(max-width:520px){.fwo-count-cards{grid-template-columns:repeat(2,1fr)}}
      `}</style>
      <input ref={inputRef} hidden type="file" accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={(event) => void analyze(event.target.files?.[0])} />
      <div className="fwo-count-actions">
        <div className="fwo-count-status">{docxName ? <><strong>{docxName}</strong> · </> : null}{status}</div>
        <button type="button" className="fwo-count-upload" disabled={busy} onClick={() => inputRef.current?.click()}><Upload />{busy ? 'Analyzing…' : 'Analyze DOCX'}</button>
      </div>
      <div className="fwo-count-cards">
        {cards.map(([label, value]) => <div className="fwo-count-card" key={String(label)}><span>{label}</span><strong>{value}</strong></div>)}
      </div>
      {docxStats ? (
        <div className="fwo-docx-extra">
          <span className="fwo-docx-chip"><FileText /> {docxStats.headingCount} headings</span>
          <span className="fwo-docx-chip">{docxStats.tableCount} tables</span>
          <span className="fwo-docx-chip">{docxStats.imageCount} images</span>
          <button type="button" className="fwo-count-upload" onClick={() => { setDocxStats(null); setDocxName(''); setStatus('Live text counting active.'); }}>Count typed text</button>
        </div>
      ) : (
        <textarea className="fwo-count-textarea" value={text} placeholder="Start typing or paste text here…" onChange={(event) => { setText(event.target.value); setStatus('Live text counting active.'); }} />
      )}
    </div>
  );
}
