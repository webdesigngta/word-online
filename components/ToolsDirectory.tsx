'use client';

import type { CSSProperties } from 'react';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ArrowRightLeft, FilePlus2, FileText, Files, Layers3, Presentation, ScanLine, Search, Table2, Type, X, type LucideIcon } from 'lucide-react';
import type { PlatformToolDefinition } from '@/tools/platform/catalog';
import { DIRECTORY_GROUPS, directoryGroupId } from '@/lib/toolDesign';
import { DirectoryToolIcon } from '@/components/DirectoryToolIcon';

const GROUPS: Record<string, { primary: string; soft: string; Icon: LucideIcon }> = {
  word: { primary: '#3478E5', soft: '#EEF5FF', Icon: FileText },
  pdf: { primary: '#E65353', soft: '#FFF0F0', Icon: Files },
  'pdf-convert': { primary: '#F08A32', soft: '#FFF4E9', Icon: ArrowRightLeft },
  spreadsheets: { primary: '#34A853', soft: '#EDF8F0', Icon: Table2 },
  presentations: { primary: '#F08A32', soft: '#FFF3E8', Icon: Presentation },
  'images-ocr': { primary: '#2B9FB0', soft: '#EBF8FA', Icon: ScanLine },
  writing: { primary: '#5E6BD8', soft: '#F0F1FF', Icon: Type },
  create: { primary: '#8A57D5', soft: '#F5F0FC', Icon: FilePlus2 },
  formats: { primary: '#60738A', soft: '#F1F4F7', Icon: Layers3 },
};

function searchable(tool: PlatformToolDefinition) {
  return [tool.name, tool.primaryIntent, tool.description, tool.cluster, ...tool.input, ...tool.output, ...tool.secondaryKeywords].join(' ').toLowerCase();
}

export function ToolsDirectory({ tools }: { tools: readonly PlatformToolDefinition[] }) {
  const [query, setQuery] = useState('');
  const normalized = query.trim().toLowerCase();
  const filtered = useMemo(() => tools.filter((tool) => !normalized || searchable(tool).includes(normalized)), [normalized, tools]);
  const groups = useMemo(() => DIRECTORY_GROUPS.map((group) => ({ ...group, tools: filtered.filter((tool) => directoryGroupId(tool) === group.id) })).filter((group) => group.tools.length), [filtered]);

  function jumpToGroup(id: string) {
    if (query) setQuery('');
    requestAnimationFrame(() => {
      const target = id === 'all' ? document.getElementById('tool-directory-results') : document.getElementById(`tools-${id}`);
      target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  return (
    <div className="tools-directory">
      <style>{`
        .tools-directory{color:var(--doc-ink)}
        .td-find{width:min(900px,100%);margin:0 auto 46px}
        .td-search-row{display:flex;align-items:center;gap:12px;min-height:58px;padding:0 16px;border:1px solid #DDE2E8;border-radius:12px;background:#fff;box-shadow:0 4px 14px rgba(24,39,75,.045);transition:.15s}
        .td-search-row:focus-within{border-color:#7D9CF5;box-shadow:0 0 0 4px rgba(52,120,229,.10)}
        .td-search-row>svg{color:#6C7788;flex:0 0 auto}.td-search-row input{min-width:0;flex:1;border:0;outline:0;background:transparent;color:#17223A;font-size:16px}.td-search-row input::placeholder{color:#8A93A2}
        .td-clear{width:38px;height:38px;display:grid;place-items:center;border:0;border-radius:9px;background:transparent;color:#6D7889;cursor:pointer}.td-clear:hover{background:#F3F5F8;color:#22304A}
        .td-category-nav{display:flex;align-items:center;justify-content:center;gap:8px;overflow-x:auto;padding:12px 2px 1px;scrollbar-width:none}.td-category-nav::-webkit-scrollbar{display:none}
        .td-category-chip{display:inline-flex;align-items:center;gap:7px;min-height:34px;padding:0 12px;white-space:nowrap;border:1px solid #E1E5EA;border-radius:9px;background:#fff;color:#49566C;font-size:12px;font-weight:750;cursor:pointer;transition:.14s}
        .td-category-chip:before{content:'';width:7px;height:7px;border-radius:2px;background:var(--chip-accent,#3478E5)}.td-category-chip:first-child:before{border-radius:50%;background:#3478E5}.td-category-chip:hover{transform:translateY(-1px);background:var(--chip-soft,#F6F8FB);color:#1E2B43}
        .td-category-chip:focus-visible,.td-reset:focus-visible,.td-clear:focus-visible{outline:3px solid rgba(52,120,229,.18);outline-offset:2px}
        .td-results{scroll-margin-top:90px}.td-result-summary{display:flex;align-items:center;justify-content:space-between;gap:14px;margin:0 0 26px;color:#667386;font-size:14px}.td-result-summary strong{color:#1C2940;font-size:15px}
        .td-reset{min-height:36px;padding:0 13px;border:1px solid #D9E1EC;border-radius:9px;background:#fff;color:#285FB4;font-size:13px;font-weight:750;cursor:pointer}
        .td-group{margin:0;padding:44px 0 50px;scroll-margin-top:88px;border-top:1px solid #EEF0F3}.td-group:first-of-type{padding-top:8px;border-top:0}
        .td-group-head{display:flex;align-items:center;justify-content:space-between;gap:18px;margin:0 0 20px}.td-group-title{display:flex;align-items:center;gap:12px;min-width:0}
        .td-group-icon{width:40px;height:40px;display:grid;place-items:center;flex:0 0 auto;border-radius:10px;background:var(--group-soft);color:var(--group-accent)}
        .td-group-head h2{margin:0;color:#17223A;font-size:24px;line-height:1.2;letter-spacing:-.025em}.td-group-head p{margin:5px 0 0;max-width:780px;color:#667386;font-size:15px;line-height:1.5}.td-group-count{flex:0 0 auto;color:#7A8596;font-size:13px;font-weight:700}
        .td-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
        .td-card{display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:13px;min-height:108px;padding:16px;border:1px solid #E3E6EA;border-radius:10px;background:#FBFBFC;color:var(--doc-ink);text-decoration:none;transition:.15s}
        .td-card:hover{transform:translateY(-1px);border-color:#CBD3DE;background:#fff;box-shadow:0 8px 22px rgba(23,34,58,.07)}.td-card:focus-visible{outline:3px solid rgba(52,120,229,.17);outline-offset:3px}
        .td-card-copy{min-width:0}.td-card strong{display:block;color:#17223A;font-size:15px;line-height:1.3;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.td-card p{margin:6px 0 0;color:#5F6C7F;font-size:13.5px;line-height:1.42;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.td-card-arrow{color:#6F7988;transition:.15s}.td-card:hover .td-card-arrow{transform:translateX(2px);color:#233552}
        .directory-tool-icon{--directory-icon-color:#60738A;width:44px;height:44px;position:relative;display:grid;place-items:center;flex:0 0 auto;border-radius:10px;background:var(--directory-icon-color);color:#fff;box-shadow:inset 0 0 0 1px rgba(255,255,255,.16)}
        .directory-operation-icon{width:22px;height:22px;stroke-width:2.15}.directory-tool-icon--convert{grid-template-columns:1fr auto 1fr;gap:1px;padding:0 5px;background:linear-gradient(135deg,var(--directory-icon-source) 0 48%,var(--directory-icon-target) 52% 100%)}.directory-format-icon{width:14px;height:14px;stroke-width:2.25;position:relative;z-index:2}.directory-convert-arrow{width:10px;height:10px;stroke-width:2.5;position:relative;z-index:2}
        .td-empty{padding:54px 22px;border:1px solid #E3E6EA;border-radius:12px;background:#FBFBFC;text-align:center}.td-empty h2{margin:0;color:#17223A;font-size:26px}.td-empty p{margin:9px 0 20px;color:#667386;font-size:15px}.td-empty button{min-height:42px;padding:0 17px;border:1px solid #D4DCE8;border-radius:9px;background:#fff;color:#285FB4;font-size:14px;font-weight:800;cursor:pointer}
        @media(max-width:940px){.td-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
        @media(max-width:680px){.td-find{margin-bottom:34px}.td-category-nav{justify-content:flex-start}.td-result-summary{align-items:flex-start;flex-direction:column}.td-group{padding:34px 0 38px}.td-group:first-of-type{padding-top:4px}.td-group-head{align-items:flex-start;margin-bottom:16px}.td-group-title{align-items:flex-start;gap:10px}.td-group-head h2{font-size:21px}.td-group-head p{font-size:14px}.td-group-count{display:none}.td-grid{grid-template-columns:1fr;gap:9px}.td-card{min-height:98px;padding:14px}.directory-tool-icon{width:42px;height:42px}}
      `}</style>

      <div className="td-find" role="search" aria-label="Find a DOC321 tool">
        <div className="td-search-row">
          <Search size={20} aria-hidden="true" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${tools.length} tools — PDF, Word, OCR, convert, edit…`} aria-label="Search all document tools" />
          {query ? <button className="td-clear" type="button" onClick={() => setQuery('')} aria-label="Clear search"><X size={18} /></button> : null}
        </div>
        <nav className="td-category-nav" aria-label="Jump to a tool category">
          <button className="td-category-chip" type="button" onClick={() => jumpToGroup('all')}>All tools</button>
          {DIRECTORY_GROUPS.map((group) => {
            const accent = GROUPS[group.id] ?? GROUPS.word;
            return <button className="td-category-chip" type="button" key={group.id} onClick={() => jumpToGroup(group.id)} style={{ '--chip-accent': accent.primary, '--chip-soft': accent.soft } as CSSProperties}>{group.label}</button>;
          })}
        </nav>
      </div>

      <div className="td-results" id="tool-directory-results">
        <div className="td-result-summary">
          <span><strong>{filtered.length}</strong> {filtered.length === 1 ? 'tool' : 'tools'} {normalized ? `matching “${query.trim()}”` : 'available across every category'}</span>
          {query ? <button className="td-reset" type="button" onClick={() => setQuery('')}>Show all tools</button> : null}
        </div>

        {groups.length ? groups.map((group) => {
          const accent = GROUPS[group.id] ?? GROUPS.word;
          const GroupIcon = accent.Icon;
          return (
            <section className="td-group" id={`tools-${group.id}`} key={group.id} style={{ '--group-accent': accent.primary, '--group-soft': accent.soft } as CSSProperties}>
              <div className="td-group-head">
                <div className="td-group-title"><span className="td-group-icon" aria-hidden="true"><GroupIcon size={20} /></span><div><h2>{group.label}</h2><p>{group.description}</p></div></div>
                <span className="td-group-count">{group.tools.length} {group.tools.length === 1 ? 'tool' : 'tools'}</span>
              </div>
              <div className="td-grid">
                {group.tools.map((tool) => <Link className="td-card" href={tool.route} key={tool.id}><DirectoryToolIcon tool={tool} /><span className="td-card-copy"><strong>{tool.name}</strong><p>{tool.primaryIntent}</p></span><ArrowRight className="td-card-arrow" size={17} aria-hidden="true" /></Link>)}
              </div>
            </section>
          );
        }) : <div className="td-empty"><h2>No matching tools</h2><p>Try a broader search such as PDF, Word, convert, OCR or image.</p><button type="button" onClick={() => setQuery('')}>Show all tools</button></div>}
      </div>
    </div>
  );
}
