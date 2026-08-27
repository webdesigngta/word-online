'use client';

import { FormEvent, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Search, X } from 'lucide-react';

export type HomeSearchTool = {
  route: string;
  name: string;
  primaryIntent: string;
  searchText: string;
};

const quickLinks = [
  ['PDF to Word', '/pdf-to-word'],
  ['Compress PDF', '/compress-pdf'],
  ['Merge PDF', '/merge-pdf'],
  ['Edit Word', '/word-online'],
  ['Word to PDF', '/word-to-pdf'],
] as const;

function scoreTool(tool: HomeSearchTool, query: string) {
  const name = tool.name.toLowerCase();
  const intent = tool.primaryIntent.toLowerCase();
  const haystack = tool.searchText.toLowerCase();
  if (name === query) return 120;
  if (name.startsWith(query)) return 100;
  if (name.includes(query)) return 80;
  if (intent.includes(query)) return 60;
  if (haystack.includes(query)) return 40;

  const tokens = query.split(/\s+/).filter(Boolean);
  const matched = tokens.filter((token) => haystack.includes(token)).length;
  return matched ? (matched / tokens.length) * 30 : 0;
}

export function HomeToolSearch({ tools }: { tools: readonly HomeSearchTool[] }) {
  const [query, setQuery] = useState('');
  const normalized = query.trim().toLowerCase();

  const matches = useMemo(() => {
    if (!normalized) return [];
    return tools
      .map((tool) => ({ tool, score: scoreTool(tool, normalized) }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score || a.tool.name.localeCompare(b.tool.name))
      .slice(0, 6)
      .map((entry) => entry.tool);
  }, [normalized, tools]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const first = matches[0];
    window.location.assign(first?.route ?? '/tools');
  }

  return (
    <div className="home-tool-search">
      <form className="hts-form" onSubmit={submit} role="search">
        <Search size={21} aria-hidden="true" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search tools — PDF to Word, compress PDF, edit Word…"
          aria-label="Search DOC321 tools"
          autoComplete="off"
        />
        {query ? (
          <button type="button" className="hts-clear" onClick={() => setQuery('')} aria-label="Clear tool search">
            <X size={18} />
          </button>
        ) : null}
      </form>

      {normalized ? (
        <div className="hts-results" aria-live="polite">
          {matches.length ? matches.map((tool) => (
            <Link className="hts-result" href={tool.route} key={tool.route}>
              <span><strong>{tool.name}</strong><small>{tool.primaryIntent}</small></span>
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          )) : (
            <Link className="hts-result hts-no-result" href="/tools">
              <span><strong>Browse all tools</strong><small>No exact match yet — open the full directory.</small></span>
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          )}
        </div>
      ) : null}

      <div className="hts-quick" aria-label="Popular tool searches">
        <span>Popular:</span>
        {quickLinks.map(([label, href]) => <Link href={href} key={href}>{label}</Link>)}
      </div>
    </div>
  );
}
