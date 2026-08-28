'use client';

import type { CSSProperties } from 'react';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Search, X } from 'lucide-react';
import type { PlatformToolDefinition } from '@/tools/platform/catalog';
import { DIRECTORY_GROUPS, directoryGroupId } from '@/lib/toolDesign';
import { ToolVisual } from '@/components/ToolVisual';

const GROUP_ACCENTS: Record<string, { primary: string; soft: string }> = {
  word: { primary: '#006CFD', soft: '#EEF6FF' },
  pdf: { primary: '#9A01FA', soft: '#F8EEFF' },
  'pdf-convert': { primary: '#FF7200', soft: '#FFF4E9' },
  spreadsheets: { primary: '#00A7E8', soft: '#EAFBFF' },
  presentations: { primary: '#7C35F2', soft: '#F3F1FF' },
  'images-ocr': { primary: '#F06A00', soft: '#FFF3E7' },
  writing: { primary: '#005FE8', soft: '#EEF6FF' },
  create: { primary: '#9201F6', soft: '#F6EEFF' },
  formats: { primary: '#008ECB', soft: '#EAFBFF' },
};

function searchable(tool: PlatformToolDefinition) {
  return [
    tool.name,
    tool.primaryIntent,
    tool.description,
    tool.cluster,
    ...tool.input,
    ...tool.output,
    ...tool.secondaryKeywords,
  ].join(' ').toLowerCase();
}

export function ToolsDirectory({ tools }: { tools: readonly PlatformToolDefinition[] }) {
  const [query, setQuery] = useState('');
  const normalizedQuery = query.trim().toLowerCase();

  const filtered = useMemo(
    () => tools.filter((tool) => !normalizedQuery || searchable(tool).includes(normalizedQuery)),
    [normalizedQuery, tools],
  );

  const groups = useMemo(
    () => DIRECTORY_GROUPS.map((group) => ({
      ...group,
      tools: filtered.filter((tool) => directoryGroupId(tool) === group.id),
    })).filter((group) => group.tools.length),
    [filtered],
  );

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
        .td-search-shell{
          position:sticky;
          top:74px;
          z-index:8;
          margin:0 0 42px;
          padding:13px;
          border:1px solid rgba(1,24,85,.10);
          border-radius:22px;
          background:rgba(255,255,255,.93);
          box-shadow:0 16px 42px rgba(1,24,85,.085);
          backdrop-filter:blur(18px);
        }
        .td-search-row{
          display:flex;
          align-items:center;
          gap:12px;
          min-height:64px;
          padding:0 18px;
          border:2px solid rgba(0,108,253,.12);
          border-radius:16px;
          background:#fff;
          transition:border-color .15s,box-shadow .15s;
        }
        .td-search-row:focus-within{border-color:#6386FF;box-shadow:0 0 0 4px rgba(0,108,253,.09)}
        .td-search-row>svg{color:#4660A0;flex:0 0 auto}
        .td-search-row input{min-width:0;flex:1;border:0;outline:0;background:transparent;color:#14224B;font-size:17px}
        .td-search-row input::placeholder{color:#7A8499}
        .td-clear{width:38px;height:38px;display:grid;place-items:center;border:0;border-radius:50%;background:transparent;color:#69758B;cursor:pointer}
        .td-clear:hover{background:#F2F6FC;color:#24375F}
        .td-category-nav{display:flex;align-items:center;gap:8px;overflow-x:auto;padding:11px 2px 1px;scrollbar-width:none}
        .td-category-nav::-webkit-scrollbar{display:none}
        .td-category-chip{
          display:inline-flex;
          align-items:center;
          gap:7px;
          min-height:35px;
          padding:0 13px;
          white-space:nowrap;
          border:1px solid rgba(1,24,85,.10);
          border-radius:999px;
          background:#fff;
          color:#344262;
          font-size:12px;
          font-weight:750;
          cursor:pointer;
          transition:transform .14s,border-color .14s,background .14s,color .14s;
        }
        .td-category-chip:before{content:'';width:7px;height:7px;border-radius:50%;background:var(--chip-accent,#006CFD)}
        .td-category-chip:first-child:before{background:linear-gradient(180deg,#00B4FC,#006CFD)}
        .td-category-chip:hover{transform:translateY(-1px);border-color:color-mix(in srgb,var(--chip-accent,#006CFD) 30%,transparent);background:var(--chip-soft,#F4F8FF);color:#17244A}
        .td-results{scroll-margin-top:188px}
        .td-result-summary{display:flex;align-items:center;justify-content:space-between;gap:14px;margin:0 0 26px;padding:0 2px;color:var(--doc-muted);font-size:14px}
        .td-result-summary strong{color:var(--doc-navy)}
        .td-reset{min-height:35px;padding:0 13px;border:1px solid rgba(0,108,253,.18);border-radius:999px;background:#fff;color:#1647B9;font-size:12px;font-weight:750;cursor:pointer}
        .td-reset:hover{background:#F4F8FF}
        .td-group{
          position:relative;
          margin:0 0 58px;
          padding:26px;
          scroll-margin-top:188px;
          border:1px solid rgba(1,24,85,.075);
          border-radius:22px;
          background:linear-gradient(145deg,#fff 0%,#fff 72%,var(--group-soft) 150%);
          box-shadow:0 8px 24px rgba(1,24,85,.03);
        }
        .td-group:before{content:'';position:absolute;left:0;top:26px;bottom:26px;width:4px;border-radius:0 6px 6px 0;background:linear-gradient(180deg,var(--group-accent),color-mix(in srgb,var(--group-accent) 60%,#9A01FA))}
        .td-group-head{display:flex;align-items:flex-start;justify-content:space-between;gap:18px;margin:0 0 19px}
        .td-group-title{display:flex;gap:13px;align-items:flex-start}
        .td-group-icon{
          width:42px;
          height:42px;
          display:grid;
          place-items:center;
          flex:0 0 auto;
          border-radius:13px;
          background:var(--group-soft);
          box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--group-accent) 12%,transparent);
        }
        .td-group-icon:before{content:'';width:16px;height:20px;border:2px solid var(--group-accent);border-radius:4px;background:#fff;box-shadow:5px 5px 0 -3px var(--group-accent)}
        .td-group-head h2{margin:0;color:var(--doc-navy);font-size:25px;line-height:1.16;letter-spacing:-.03em}
        .td-group-head p{margin:6px 0 0;color:var(--doc-muted);font-size:13px;line-height:1.5}
        .td-group-count{flex:0 0 auto;padding:7px 10px;border:1px solid rgba(1,24,85,.09);border-radius:999px;background:rgba(255,255,255,.88);color:#66728A;font-size:11px;font-weight:700}
        .td-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
        .td-card{
          position:relative;
          display:grid;
          grid-template-columns:auto minmax(0,1fr) auto;
          align-items:center;
          gap:13px;
          min-height:98px;
          padding:15px;
          overflow:hidden;
          border:1px solid rgba(1,24,85,.10);
          border-radius:16px;
          background:rgba(255,255,255,.93);
          color:var(--doc-ink);
          text-decoration:none;
          box-shadow:0 5px 16px rgba(1,24,85,.025);
          transition:transform .15s,border-color .15s,box-shadow .15s,background .15s;
        }
        .td-card:after{content:'';position:absolute;left:0;right:0;top:0;height:3px;background:linear-gradient(90deg,var(--group-accent),color-mix(in srgb,var(--group-accent) 40%,#9A01FA));opacity:.78}
        .td-card:hover{transform:translateY(-2px);border-color:color-mix(in srgb,var(--group-accent) 27%,transparent);background:#fff;box-shadow:0 13px 30px rgba(1,24,85,.075)}
        .td-card .tool-visual{transform:scale(.88);transform-origin:center;box-shadow:0 6px 14px rgba(32,33,36,.11)!important}
        .td-card-copy{min-width:0}
        .td-card strong{display:block;color:#17244A;font-size:14px;line-height:1.28;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .td-card p{margin:5px 0 0;color:#6A768D;font-size:11px;line-height:1.42;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
        .td-card-arrow{color:#8B94A7;transition:transform .15s,color .15s}
        .td-card:hover .td-card-arrow{transform:translateX(3px);color:var(--group-accent)}
        .td-empty{padding:56px 22px;border:1px solid rgba(1,24,85,.10);border-radius:22px;background:var(--doc-soft-gradient);text-align:center}
        .td-empty h2{margin:0;color:var(--doc-navy);font-size:25px;letter-spacing:-.025em}
        .td-empty p{margin:8px 0 20px;color:var(--doc-muted);font-size:14px}
        .td-empty button{min-height:42px;padding:0 17px;border:1px solid rgba(0,108,253,.20);border-radius:11px;background:#fff;color:#1647B9;font-weight:800;cursor:pointer}
        .tool-visual{display:inline-flex;align-items:center;justify-content:center;gap:3px;color:#fff;font-weight:800;letter-spacing:-.02em;flex:0 0 auto}
        .tool-visual span{color:#fff!important;margin:0!important;line-height:1!important}
        @media(max-width:940px){
          .td-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
        }
        @media(max-width:680px){
          .td-search-shell{position:relative;top:auto;margin-bottom:32px;padding:10px;border-radius:18px}
          .td-search-row{min-height:58px;padding:0 14px;border-radius:14px}
          .td-search-row input{font-size:16px}
          .td-category-nav{padding-top:9px}
          .td-category-chip{min-height:33px;padding:0 11px;font-size:11px}
          .td-result-summary{align-items:flex-start;flex-direction:column;margin-bottom:20px}
          .td-group{margin-bottom:36px;padding:20px 14px 18px;border-radius:18px}
          .td-group:before{top:20px;bottom:20px;width:3px}
          .td-group-head{gap:12px;margin-bottom:15px;padding-left:3px}
          .td-group-title{gap:10px}
          .td-group-icon{width:38px;height:38px;border-radius:11px}
          .td-group-head h2{font-size:21px}
          .td-group-head p{font-size:12px}
          .td-group-count{display:none}
          .td-grid{grid-template-columns:1fr;gap:9px}
          .td-card{min-height:88px;padding:12px;border-radius:14px}
          .td-card strong{font-size:14px}
          .td-card p{font-size:11px}
        }
      `}</style>

      <div className="td-search-shell" role="search" aria-label="Find a DOC321 tool">
        <div className="td-search-row">
          <Search size={21} aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={`Search all ${tools.length} tools — PDF, Word, convert, edit, OCR…`}
            aria-label="Search all document tools"
          />
          {query ? <button className="td-clear" type="button" onClick={() => setQuery('')} aria-label="Clear search"><X size={18} /></button> : null}
        </div>
        <nav className="td-category-nav" aria-label="Jump to a tool category">
          <button className="td-category-chip" type="button" onClick={() => jumpToGroup('all')}>All tools</button>
          {DIRECTORY_GROUPS.map((group) => {
            const accent = GROUP_ACCENTS[group.id] ?? GROUP_ACCENTS.word;
            return (
              <button
                className="td-category-chip"
                type="button"
                key={group.id}
                onClick={() => jumpToGroup(group.id)}
                style={{ '--chip-accent': accent.primary, '--chip-soft': accent.soft } as CSSProperties}
              >
                {group.label}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="td-results" id="tool-directory-results">
        <div className="td-result-summary">
          <span>
            <strong>{filtered.length}</strong> {filtered.length === 1 ? 'tool' : 'tools'} {normalizedQuery ? `matching “${query.trim()}”` : 'shown below across every category'}
          </span>
          {query ? <button className="td-reset" type="button" onClick={() => setQuery('')}>Show all tools</button> : null}
        </div>

        {groups.length ? groups.map((group) => {
          const accent = GROUP_ACCENTS[group.id] ?? GROUP_ACCENTS.word;
          return (
            <section
              className="td-group"
              id={`tools-${group.id}`}
              key={group.id}
              style={{ '--group-accent': accent.primary, '--group-soft': accent.soft } as CSSProperties}
            >
              <div className="td-group-head">
                <div className="td-group-title">
                  <span className="td-group-icon" aria-hidden="true" />
                  <div>
                    <h2>{group.label}</h2>
                    <p>{group.description}</p>
                  </div>
                </div>
                <span className="td-group-count">{group.tools.length} {group.tools.length === 1 ? 'tool' : 'tools'}</span>
              </div>

              <div className="td-grid">
                {group.tools.map((tool) => (
                  <Link className="td-card" href={tool.route} key={tool.id}>
                    <ToolVisual tool={tool} size="md" />
                    <span className="td-card-copy">
                      <strong>{tool.name}</strong>
                      <p>{tool.primaryIntent}</p>
                    </span>
                    <ArrowRight className="td-card-arrow" size={17} aria-hidden="true" />
                  </Link>
                ))}
              </div>
            </section>
          );
        }) : (
          <div className="td-empty">
            <h2>No matching tools</h2>
            <p>Try a broader search, such as “PDF”, “convert”, “Word”, “OCR” or “image”.</p>
            <button type="button" onClick={() => setQuery('')}>Show all tools</button>
          </div>
        )}
      </div>
    </div>
  );
}
