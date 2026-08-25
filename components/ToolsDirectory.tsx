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
        .tools-directory{--g-text:#202124;--g-muted:#5f6368;--g-line:#dadce0;--g-surface:#fff;--g-bg:#f8fafd;--g-blue:#1a73e8;color:var(--g-text)}
        .td-search-shell{position:sticky;top:76px;z-index:8;margin:0 0 28px;padding:10px;background:rgba(248,250,253,.92);backdrop-filter:blur(16px);border:1px solid rgba(218,220,224,.72);border-radius:20px;box-shadow:0 4px 18px rgba(60,64,67,.06)}
        .td-search-row{display:flex;align-items:center;gap:10px;background:#fff;border:1px solid var(--g-line);border-radius:14px;padding:0 14px;min-height:52px;transition:border-color .15s,box-shadow .15s}
        .td-search-row:focus-within{border-color:#8ab4f8;box-shadow:0 0 0 3px rgba(26,115,232,.12)}
        .td-search-row svg{color:#5f6368;flex:0 0 auto}.td-search-row input{border:0;outline:0;min-width:0;flex:1;font-size:16px;background:transparent;color:var(--g-text)}
        .td-clear{border:0;background:transparent;color:#5f6368;width:34px;height:34px;border-radius:50%;display:grid;place-items:center;cursor:pointer}.td-clear:hover{background:#f1f3f4}
        .td-filters{display:flex;gap:8px;overflow-x:auto;padding:10px 2px 1px;scrollbar-width:none}.td-filters::-webkit-scrollbar{display:none}
        .td-filter{white-space:nowrap;border:1px solid var(--g-line);background:#fff;color:#3c4043;border-radius:999px;min-height:34px;padding:0 13px;font-size:12px;font-weight:650;cursor:pointer}.td-filter:hover{background:#f8fafd}.td-filter.active{background:#e8f0fe;border-color:#aecbfa;color:#174ea6}
        .td-popular{margin:0 0 38px}.td-section-kicker{font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#5f6368;margin:0 0 12px}
        .td-popular-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}
        .td-popular-card{display:flex;align-items:center;gap:11px;min-width:0;border:1px solid var(--g-line);border-radius:14px;background:#fff;padding:12px;color:var(--g-text);text-decoration:none;transition:background .15s,border-color .15s,transform .15s}
        .td-popular-card:hover{background:#f8fafd;border-color:#bdc1c6;transform:translateY(-1px)}.td-popular-card strong{font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.td-popular-card span:not(.tool-visual){display:block;color:#5f6368;font-size:11px;margin-top:3px}
        .td-results{scroll-margin-top:170px}.td-result-count{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:22px;color:#5f6368;font-size:13px}.td-result-count strong{color:#202124}
        .td-group{margin:0 0 44px;scroll-margin-top:170px}.td-group-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin:0 0 14px}.td-group-title{display:flex;gap:12px;align-items:flex-start}.td-group-mark{width:12px;height:36px;border-radius:99px;background:var(--family-color);margin-top:2px}.td-group-head h2{font-size:23px;line-height:1.2;letter-spacing:-.02em;margin:0}.td-group-head p{color:#5f6368;line-height:1.5;font-size:13px;margin:5px 0 0}.td-group-count{color:#5f6368;font-size:12px;white-space:nowrap;padding-top:5px}
        .td-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.td-card{position:relative;display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:13px;min-height:102px;border:1px solid var(--g-line);border-radius:16px;background:#fff;padding:15px;color:var(--g-text);text-decoration:none;transition:box-shadow .16s,border-color .16s,transform .16s,background .16s;overflow:hidden}.td-card:before{content:'';position:absolute;left:0;top:17px;bottom:17px;width:3px;border-radius:0 3px 3px 0;background:var(--card-accent)}.td-card:hover{transform:translateY(-2px);border-color:#bdc1c6;box-shadow:0 5px 18px rgba(60,64,67,.10);background:#fff}.td-card-copy{min-width:0}.td-card strong{display:block;font-size:15px;line-height:1.3;margin-bottom:5px}.td-card p{color:#5f6368;font-size:12px;line-height:1.45;margin:0;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.td-card-arrow{color:#9aa0a6;transition:transform .15s,color .15s}.td-card:hover .td-card-arrow{transform:translateX(2px);color:var(--card-accent)}
        .td-empty{border:1px solid var(--g-line);border-radius:18px;background:#fff;text-align:center;padding:48px 20px}.td-empty h2{font-size:20px;margin:0 0 7px}.td-empty p{color:#5f6368;margin:0 0 18px}.td-empty button{border:1px solid #aecbfa;background:#e8f0fe;color:#174ea6;border-radius:999px;padding:9px 15px;font-weight:650;cursor:pointer}
        .tool-visual{display:inline-flex;align-items:center;justify-content:center;gap:3px;color:#fff;font-weight:800;letter-spacing:-.02em;box-shadow:inset 0 -1px 0 rgba(0,0,0,.12);flex:0 0 auto}.tool-visual span{color:#fff!important;margin:0!important;line-height:1!important}.tool-visual b{font-size:.75em;opacity:.88}.tool-visual-sm{width:34px;height:34px;border-radius:10px;font-size:7px}.tool-visual-md{width:46px;height:46px;border-radius:13px;font-size:8px}.tool-visual-lg{width:58px;height:58px;border-radius:16px;font-size:9px}
        @media(max-width:900px){.td-popular-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.td-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
        @media(max-width:620px){.td-search-shell{top:68px;margin-left:-2px;margin-right:-2px}.td-popular-grid{grid-template-columns:1fr 1fr}.td-popular-card{padding:10px}.td-popular-card span:not(.tool-visual){display:none}.td-grid{grid-template-columns:1fr}.td-group{margin-bottom:36px}.td-group-head h2{font-size:20px}.td-card{min-height:92px}.td-result-count{align-items:flex-start;flex-direction:column}}
      `}</style>

      <div className="td-search-shell" role="search">
        <div className="td-search-row">
          <Search size={20} aria-hidden="true" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search 126 tools — PDF, Word, convert, sign, OCR…" aria-label="Search document tools" />
          {query ? <button className="td-clear" type="button" onClick={() => setQuery('')} aria-label="Clear search"><X size={18}/></button> : null}
        </div>
        <div className="td-filters" aria-label="Tool categories">
          <button className={`td-filter ${active === 'all' ? 'active' : ''}`} type="button" onClick={() => chooseGroup('all')}>All tools</button>
          {DIRECTORY_GROUPS.map((group) => <button className={`td-filter ${active === group.id ? 'active' : ''}`} type="button" key={group.id} onClick={() => chooseGroup(group.id)}>{group.label}</button>)}
        </div>
      </div>

      {!normalizedQuery && active === 'all' ? <section className="td-popular" aria-labelledby="popular-tools-title">
        <p className="td-section-kicker" id="popular-tools-title">Popular tools</p>
        <div className="td-popular-grid">
          {popular.map((tool) => <Link className="td-popular-card" href={tool.route} key={tool.id}>
            <ToolVisual tool={tool} size="sm" />
            <span style={{ minWidth: 0 }}><strong>{tool.name}</strong><span>{toolPalette(tool).familyLabel}</span></span>
          </Link>)}
        </div>
      </section> : null}

      <div className="td-results" id="tool-directory-results">
        <div className="td-result-count"><span><strong>{filtered.length}</strong> {filtered.length === 1 ? 'tool' : 'tools'} {normalizedQuery ? `matching “${query.trim()}”` : active === 'all' ? 'organized by task' : 'in this category'}</span>{active !== 'all' || query ? <button className="td-filter" type="button" onClick={() => { setActive('all'); setQuery(''); }}>Reset filters</button> : null}</div>
        {groups.length ? groups.map((group) => {
          const theme = familyTheme(group.family);
          return <section className="td-group" id={`tools-${group.id}`} key={group.id} style={{ '--family-color': theme.primary } as React.CSSProperties}>
            <div className="td-group-head"><div className="td-group-title"><span className="td-group-mark"/><div><h2>{group.label}</h2><p>{group.description}</p></div></div><span className="td-group-count">{group.tools.length} tools</span></div>
            <div className="td-grid">
              {group.tools.map((tool) => {
                const palette = toolPalette(tool);
                return <Link className="td-card" href={tool.route} key={tool.id} style={{ '--card-accent': palette.primary } as React.CSSProperties}>
                  <ToolVisual tool={tool}/>
                  <span className="td-card-copy"><strong>{tool.name}</strong><p>{tool.primaryIntent}</p></span>
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
