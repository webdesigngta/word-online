'use client';

import { useMemo, useState } from 'react';
import { Download, Plus, Presentation, Trash2 } from 'lucide-react';
import { trackToolEvent } from '@/lib/toolAnalytics';
import { buildSimplePptx, downloadPptx, type TextSlide } from '@/tools/presentation/simplePptx';

export type PresentationBuilderMode = 'presentation-maker' | 'powerpoint-online';

type EditableSlide = { id: number; title: string; body: string };

const starterSlides: EditableSlide[] = [
  { id: 1, title: 'Presentation title', body: 'Subtitle or opening point' },
  { id: 2, title: 'Key idea', body: 'First point\nSecond point\nThird point' },
];

function parseOutline(value: string): TextSlide[] {
  return value.split(/\n\s*(?:---|\n)\s*\n/g).map((block) => block.trim()).filter(Boolean).map((block) => {
    const lines = block.split('\n').map((line) => line.trim()).filter(Boolean);
    return { title: (lines.shift() || 'Untitled slide').replace(/^#+\s*/, ''), body: lines.map((line) => line.replace(/^[-*•]\s*/, '')) };
  });
}

function filename(value: string) {
  const cleaned = value.replace(/[\\/:*?"<>|]+/g, '').trim().replace(/\s+/g, '-').toLowerCase();
  return `${cleaned || 'presentation'}.pptx`;
}

export function PresentationBuilderInterface({ mode, toolId }: { mode: PresentationBuilderMode; toolId: string }) {
  const [outline, setOutline] = useState('Project Update\nWhat changed this week\nWhat we learned\n\n---\n\nNext Steps\nConfirm owners\nSet deadlines\nShare the final plan');
  const [slides, setSlides] = useState<EditableSlide[]>(starterSlides);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(mode === 'presentation-maker' ? 'Write one slide per block, separated with ---.': 'Edit slide titles and bullet lines below.');
  const parsed = useMemo(() => mode === 'presentation-maker' ? parseOutline(outline) : slides.map((slide) => ({ title: slide.title.trim() || 'Untitled slide', body: slide.body.split('\n').map((line) => line.trim()).filter(Boolean) })), [mode, outline, slides]);

  function updateSlide(id: number, key: 'title' | 'body', value: string) {
    setSlides((current) => current.map((slide) => slide.id === id ? { ...slide, [key]: value } : slide));
  }

  function addSlide() {
    setSlides((current) => [...current, { id: Math.max(0, ...current.map((slide) => slide.id)) + 1, title: 'New slide', body: 'Add a point' }]);
  }

  function removeSlide(id: number) {
    setSlides((current) => current.length <= 1 ? current : current.filter((slide) => slide.id !== id));
  }

  async function exportPptx() {
    if (!parsed.length || busy) return;
    setBusy(true);
    setStatus('Building your PowerPoint file in the browser…');
    try {
      const blob = await buildSimplePptx(parsed, parsed[0]?.title || 'Presentation');
      downloadPptx(blob, filename(parsed[0]?.title || 'presentation'));
      setStatus(`Created ${parsed.length} slide${parsed.length === 1 ? '' : 's'} as PPTX.`);
      trackToolEvent('tool_success', { toolId, outputType: 'pptx', metadata: { slideCount: parsed.length } });
      trackToolEvent('tool_download', { toolId, outputType: 'pptx' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not create the presentation.';
      setStatus(message);
      trackToolEvent('tool_error', { toolId, metadata: { message } });
    } finally {
      setBusy(false);
    }
  }

  return <div className="fwo-present-tool">
    <style>{`.fwo-present-tool{display:grid;gap:16px}.fpt-top{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}.fpt-title{display:flex;align-items:center;gap:10px}.fpt-icon{width:42px;height:42px;border-radius:12px;background:#fce8e6;color:#c5221f;display:grid;place-items:center}.fpt-icon svg{width:21px}.fpt-btn{border:1px solid #dadce0;border-radius:20px;background:#fff;color:#202124;padding:9px 14px;font-weight:650;cursor:pointer;display:inline-flex;align-items:center;gap:7px}.fpt-btn.primary{background:#0b57d0;color:#fff;border-color:#0b57d0}.fpt-btn:disabled{opacity:.5;cursor:not-allowed}.fpt-grid{display:grid;grid-template-columns:minmax(280px,1fr) minmax(320px,1fr);gap:16px;align-items:start}.fpt-panel{border:1px solid #dadce0;border-radius:14px;background:#fff;padding:14px;display:grid;gap:12px}.fpt-panel h3{margin:0;font-size:15px}.fpt-outline{width:100%;min-height:420px;resize:vertical;border:1px solid #dadce0;border-radius:12px;padding:14px;font:14px/1.55 ui-monospace,SFMono-Regular,Menlo,monospace;color:#202124;outline:none}.fpt-outline:focus,.fpt-input:focus,.fpt-body:focus{border-color:#0b57d0;box-shadow:0 0 0 1px #0b57d0}.fpt-edit-list{display:grid;gap:12px;max-height:62vh;overflow:auto;padding-right:3px}.fpt-edit-card{border:1px solid #e0e3e7;border-radius:12px;padding:12px;display:grid;gap:9px}.fpt-edit-head{display:flex;align-items:center;justify-content:space-between;gap:8px}.fpt-edit-head strong{font-size:12px;color:#5f6368}.fpt-delete{border:0;background:transparent;color:#5f6368;cursor:pointer;padding:4px}.fpt-input,.fpt-body{width:100%;border:1px solid #dadce0;border-radius:9px;padding:9px 10px;font:inherit;outline:none}.fpt-body{min-height:90px;resize:vertical;line-height:1.45}.fpt-previews{display:grid;gap:12px;max-height:68vh;overflow:auto;padding:4px}.fpt-slide{aspect-ratio:16/9;background:#fff;border:1px solid #d5dae2;border-radius:8px;box-shadow:0 3px 12px rgba(60,64,67,.14);padding:7% 8%;overflow:hidden}.fpt-slide h4{font-size:clamp(18px,2.3vw,30px);margin:0 0 6%;line-height:1.15}.fpt-slide ul{margin:0;padding-left:1.3em;display:grid;gap:.45em;color:#3c4043;font-size:clamp(11px,1.45vw,18px);line-height:1.3}.fpt-slide-index{font-size:11px;color:#80868b;margin-bottom:5px}.fpt-status{font-size:12px;color:#5f6368}.fpt-note{padding:10px 12px;border-radius:10px;background:#fef7e0;color:#5f4b00;font-size:12px;line-height:1.45}@media(max-width:850px){.fpt-grid{grid-template-columns:1fr}.fpt-outline{min-height:300px}.fpt-previews,.fpt-edit-list{max-height:none}}`}</style>
    <div className="fpt-top"><div className="fpt-title"><div className="fpt-icon"><Presentation /></div><div><strong>{mode === 'presentation-maker' ? 'Presentation Maker' : 'PowerPoint Online'}</strong><div className="fpt-status">{status}</div></div></div><button className="fpt-btn primary" type="button" onClick={exportPptx} disabled={busy || !parsed.length}><Download size={16}/>{busy ? 'Building…' : 'Download PPTX'}</button></div>
    <div className="fpt-note">This lightweight browser tool creates clean title-and-bullet PowerPoint slides. It does not claim desktop PowerPoint features such as animations, SmartArt, charts, speaker notes, or advanced theme editing.</div>
    <div className="fpt-grid">
      <div className="fpt-panel">
        {mode === 'presentation-maker' ? <><h3>Presentation outline</h3><textarea className="fpt-outline" value={outline} onChange={(event) => setOutline(event.target.value)} aria-label="Presentation outline"/><div className="fpt-status">Use a blank line plus <strong>---</strong> plus a blank line between slides. The first line becomes the title; following lines become bullet points.</div></> : <><div className="fpt-top"><h3>Slides</h3><button className="fpt-btn" type="button" onClick={addSlide}><Plus size={15}/>Add slide</button></div><div className="fpt-edit-list">{slides.map((slide, index) => <div className="fpt-edit-card" key={slide.id}><div className="fpt-edit-head"><strong>Slide {index + 1}</strong><button className="fpt-delete" type="button" onClick={() => removeSlide(slide.id)} aria-label={`Delete slide ${index + 1}`}><Trash2 size={16}/></button></div><input className="fpt-input" value={slide.title} onChange={(event) => updateSlide(slide.id, 'title', event.target.value)} placeholder="Slide title"/><textarea className="fpt-body" value={slide.body} onChange={(event) => updateSlide(slide.id, 'body', event.target.value)} placeholder="One bullet per line"/></div>)}</div></>}
      </div>
      <div className="fpt-panel"><h3>Slide preview</h3><div className="fpt-previews">{parsed.map((slide, index) => <div key={`${index}-${slide.title}`}><div className="fpt-slide-index">Slide {index + 1}</div><div className="fpt-slide"><h4>{slide.title}</h4>{slide.body.length ? <ul>{slide.body.map((line, itemIndex) => <li key={itemIndex}>{line}</li>)}</ul> : null}</div></div>)}</div></div>
    </div>
  </div>;
}
