'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Search, X } from 'lucide-react';
import type { PlatformToolDefinition } from '@/tools/platform/catalog';
import { DIRECTORY_GROUPS, directoryGroupId, familyTheme, toolPalette } from '@/lib/toolDesign';
import { ToolVisual } from '@/components/ToolVisual';

const priorityRank = { P0: 0, P1: 1, P2: 2, P3: 3 } as const;

function searchable(tool: PlatformToolDefinition) {
  return [tool.name, tool.primaryIntent, tool.description, tool.cluster, ...tool.input, ...tool.output, ...tool.secondaryKeywords].join(' ').toLowerCase();
}

function workflowLabel(tool: PlatformToolDefinition) {
  const source = tool.input.find((value) => !['blank', 'preview', 'summary'].includes(value.toLowerCase()));
  const target = tool.output.find((value) => !['blank', 'preview', 'summary'].includes(value.toLowerCase()));
  if (source && target && source.toLowerCase() !== target.toLowerCase()) return `${source.toUpperCase()} → ${target.toUpperCase()}`;
  if (source) return source.toUpperCase();
  return tool.kind.toUpperCase();
}

export function ToolsDirectory({ tools }: { tools: readonly PlatformToolDefinition[] }) {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState('all');
  const normalizedQuery = query.trim().toLowerCase();

  const filtered = useMemo(() => tools.filter((tool) => {
    if (active !== 'all' && directoryGroupId(tool) !== active) return false;
    if (normalizedQuery && !searchable(tool).includes(normalizedQuery)) return false;
    return true;
  }), [active, normalizedQuery, tools]);

  const popular = useMemo(() => [...tools]
    .sort((left, right) => priorityRank[left.priority] - priorityRank[right.priority] || left.name.localeCompare(right.name))
    .slice(0, 8), [tools]);

  const groups = useMemo(() => DIRECTORY_GROUPS.map((group) => ({
    ...group,
    tools: filtered.filter((tool) => directoryGroupId(tool) === group.id),
  })).filter((group) => group.tools.length), [filtered]);

  function chooseGroup(id: string) {
    setActive(id);
    requestAnimationFrame(() => document.getElementById('tool-directory-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }

  return (
    <div className="tools-directory">
      <style>{`
        .tools-directory{--g-text:#202124;--g-muted:#5f6368;--g-line:#dde1e7;--g-surface:#fff;--g-bg:#f8fafd;--g-blue:#1a73e8;color:var(--g-text)}
        .td-search-shell{position:sticky;top:76px;z-index:8;margin:0 0 34px;padding:10px;background:rgba(248,250,253,.91);backdrop-filter:blur(18px);border:1px solid rgba(218,220,224,.75);border-radius:22px;box-shadow:0 10px 30px rgba(60,64,67,.07)}
        .td-search-row{display:flex;align-items:center;gap:11px;background:#fff;border:1px solid var(--g-line);border-radius:15px;padding:0 15px;min-height:56px;transition:border-color .15s,box-shadow .15s}.td-search-row:focus-within{border-color:#8ab4f8;box-shadow:0 0 0 4px rgba(26,115,232,.11)}.td-search-row svg{color:#5f6368;flex:0 0 auto}.td-search-row input{border:0;outline:0;min-width:0;flex:1;font-size:16px;background:transparent;color:var(--g-text)}
        .td-clear{border:0;background:transparent;color:#5f6368;width:36px;height:36px;border-radius:50%;display:grid;place-items:center;cursor:pointer}.td-clear:hover{background:#f1f3f4}
        .td-filters{display:flex;gap:8px;overflow-x:auto;padding:10px 2px 1px;scrollbar-width:none}.td-filters::-webkit-scrollbar{display:none}.td-filter{white-space:nowrap;border:1px solid var(--g-line);background:#fff;color:#3c4043;border-radius:999px;min-height:35px;padding:0 13px;font-size:12px;font-weight:680;cursor:pointer}.td-filter:hover{background:#f8fafd}.td-filter.active{background:#e8f0fe;border-color:#aecbfa;color:#174ea6;box-shadow:inset 0 0 0 1px rgba(26,115,232,.03)}
        .td-popular{margin:0 0 46px}.td-section-kicker{font-size:11px;font-weight:780;letter-spacing:.075em;text-transform:uppercase;color:#5f6368;margin:0 0 13px}.td-popular-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}
        .td-popular-card{position:relative;display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:12px;min-width:0;border:1px solid var(--g-line);border-radius:18px;background:linear-gradient(145deg,#fff 0%,#fff 72%,var(--card-soft) 145%);padding:14px;color:var(--g-text);text-decoration:none;min-height:92px;transition:background .15s,border-color .15s,transform .15s,box-shadow .15s}.td-popular-card:hover{border-color:#c7cbd1;transform:translateY(-2px);box-shadow:0 8px 22px rgba(60,64,67,.09)}.td-popular-copy{min-width:0}.td-popular-card strong{display:block;font-size:14px;line-height:1.25;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.td-popular-card small{display:block;color:#5f6368;font-size:10px;margin-top:5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.td-popular-arrow{color:#a2a7ae}.td-popular-card:hover .td-popular-arrow{color:var(--card-accent);transform:translateX(2px)}
        .td-results{scroll-margin-top:176px}.td-result-count{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:24px;color:#5f6368;font-size:13px}.td-result-count strong{color:#202124}
        .td-group{margin:0 0 52px;scroll-margin-top:176px}.td-group-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin:0 0 16px}.td-group-title{display:flex;gap:13px;align-items:flex-start}.td-group-mark{width:13px;height:40px;border-radius:99px;background:var(--family-color);margin-top:1px;box-shadow:0 5px 12px color-mix(in srgb,var(--family-color) 24%,transparent)}.td-group-head h2{font-size:25px;line-height:1.18;letter-spacing:-.03em;margin:0}.td-group-head p{color:#5f6368;line-height:1.5;font-size:13px;margin:6px 0 0}.td-group-count{color:#5f6368;font-size:11px;white-space:nowrap;padding:6px 9px;border:1px solid #e2e5e9;border-radius:999px;background:#fff}
        .td-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:13px}.td-card{position:relative;display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:14px;min-height:118px;border:1px solid var(--g-line);border-radius:19px;background:linear-gradient(145deg,#fff 0%,#fff 74%,var(--card-soft) 150%);padding:16px;color:var(--g-text);text-decoration:none;transition:box-shadow .16s,border-color .16s,transform .16s;overflow:hidden}.td-card:before{content:'';position:absolute;left:0;top:19px;bottom:19px;width:4px;border-radius:0 4px 4px 0;background:var(--card-accent)}.td-card:hover{transform:translateY(-3px);border-color:#c8ccd2;box-shadow:0 10px 28px rgba(60,64,67,.10)}.td-card-copy{min-width:0}.td-card strong{display:block;font-size:15px;line-height:1.28;margin-bottom:5px}.td-card p{color:#5f6368;font-size:12px;line-height:1.45;margin:0;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.td-card-meta{display:flex;align-items:center;gap:5px;margin-top:8px;color:var(--card-ink);font-size:9px;font-weight:760;letter-spacing:.02em;text-transform:uppercase}.td-card-meta i{width:3px;height:3px;border-radius:50%;background:currentColor;opacity:.45}.td-card-arrow{color:#a2a7ae;transition:transform .15s,color .15s}.td-card:hover .td-card-arrow{transform:translateX(3px);color:var(--card-accent)}
        .td-empty{border:1px solid var(--g-line);border-radius:20px;background:#fff;text-align:center;padding:54px 20px}.td-empty h2{font-size:22px;margin:0 0 7px}.td-empty p{color:#5f6368;margin:0 0 18px}.td-empty button{border:1px solid #aecbfa;background:#e8f0fe;color:#174ea6;border-radius:999px;padding:9px 15px;font-weight:680;cursor:pointer}
        .tool-visual{display:inline-flex;align-items:center;justify-content:center;gap:3px;color:#fff;font-weight:800;letter-spacing:-.02em;flex:0 0 auto}.tool-visual span{color:#fff!important;margin:0!important;line-height:1!important}
        @media(max-width:940px){.td-popular-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.td-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
        @media(max-width:620px){.td-search-shell{top:68px;margin-left:-2px;margin-right:-2px}.td-popular-grid{grid-template-columns:1fr}.td-popular-card{padding:12px;min-height:84px}.td-grid{grid-template-columns:1fr}.td-group{margin-bottom:40px}.td-group-head h2{font-size:21px}.td-card{min-height:106px}.td-result-count{align-items:flex-start;flex-direction:column}.td-group-count{display:none}}
      `}</style>

      <div className="td-search-shell" role="search">
        <div className="td-search-row">
          <Search size={20} aria-hidden="true" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${tools.length} tools — PDF, Word, convert, sign, OCR…`} aria-label="Search document tools" />
          {query ? <button className="td-clear" type="button" onClick={() => setQuery('')} aria-label="Clear search"><X size={18}/></button> : null}
        </div>
        <div className="td-filters" aria-label="Tool categories">
          <button className={`td-filter ${active === 'all' ? 'active' : ''}`} type="button" onClick={() => chooseGroup('all')}>All tools</button>
          {DIRECTORY_GROUPS.map((group) => <button className={`td-filter ${active === group.id ? 'active' : ''}`} type="button" key={group.id} onClick={() => chooseGroup(group.id)}>{group.label}</button>)}
        </div>
      </div>

      {!normalizedQuery && active === 'all' ? <section className="td-popular" aria-labelledby="popular-tools-title">
        <p className="td-section-kicker" id="popular-tools-title">Most useful starting points</p>
        <div className="td-popular-grid">
          {popular.map((tool) => {
            const palette = toolPalette(tool);
            return <Link className="td-popular-card" href={tool.route} key={tool.id} style={{ '--card-soft': palette.soft, '--card-accent': palette.primary } as React.CSSProperties}>
              <ToolVisual tool={tool} size="md" />
              <span className="td-popular-copy"><strong>{tool.name}</strong><small>{tool.primaryIntent}</small></span>
              <ArrowRight className="td-popular-arrow" size={17} aria-hidden="true"/>
            </Link>;
          })}
        </div>
      </section> : null}

      <div className="td-results" id="tool-directory-results">
        <div className="td-result-count"><span><strong>{filtered.length}</strong> {filtered.length === 1 ? 'tool' : 'tools'} {normalizedQuery ? `matching “${query.trim()}”` : active === 'all' ? 'organized by the job you need to do' : 'in this category'}</span>{active !== 'all' || query ? <button className="td-filter" type="button" onClick={() => { setActive('all'); setQuery(''); }}>Reset filters</button> : null}</div>
        {groups.length ? groups.map((group) => {
          const theme = familyTheme(group.family);
          return <section className="td-group" id={`tools-${group.id}`} key={group.id} style={{ '--family-color': theme.primary } as React.CSSProperties}>
            <div className="td-group-head"><div className="td-group-title"><span className="td-group-mark"/><div><h2>{group.label}</h2><p>{group.description}</p></div></div><span className="td-group-count">{group.tools.length} tools</span></div>
            <div className="td-grid">
              {group.tools.map((tool) => {
                const palette = toolPalette(tool);
                return <Link className="td-card" href={tool.route} key={tool.id} style={{ '--card-accent': palette.primary, '--card-soft': palette.soft, '--card-ink': palette.ink } as React.CSSProperties}>
                  <ToolVisual tool={tool} size="md"/>
                  <span className="td-card-copy"><strong>{tool.name}</strong><p>{tool.primaryIntent}</p><span className="td-card-meta">{palette.familyLabel}<i/>{workflowLabel(tool)}</span></span>
                  <ArrowRight className="td-card-arrow" size={18} aria-hidden="true"/>
                </Link>;
              })}
            </div>
          </section>;
        }) : <div className="td-empty"><h2>No tools found</h2><p>Try a broader search or return to all document tools.</p><button type="button" onClick={() => { setQuery(''); setActive('all'); }}>Show all tools</button></div>}
      </div>
    </div>
  );
}
