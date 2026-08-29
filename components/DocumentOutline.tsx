'use client';

import { useEffect, useRef, useState } from 'react';

type OutlineKind = 'title' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

type OutlineItem = {
  id: string;
  text: string;
  level: number;
  kind: OutlineKind;
};

const OUTLINE_SELECTOR = '[data-fwo-paragraph-style="title"],h1,h2,h3,h4,h5,h6';

let nextHeadingId = 0;

function headingId(heading: HTMLElement) {
  if (!heading.dataset.fwoOutlineId) {
    nextHeadingId += 1;
    heading.dataset.fwoOutlineId = `fwo-outline-${nextHeadingId}`;
  }
  return heading.dataset.fwoOutlineId;
}

function outlineKind(element: HTMLElement): OutlineKind {
  if (element.dataset.fwoParagraphStyle === 'title') return 'title';
  const tag = element.tagName.toLowerCase();
  if (tag === 'h1' || tag === 'h2' || tag === 'h3' || tag === 'h4' || tag === 'h5' || tag === 'h6') return tag;
  return 'h6';
}

function outlineLevel(kind: OutlineKind) {
  if (kind === 'title') return 0;
  return Number(kind.slice(1));
}

export function DocumentOutline() {
  const [items, setItems] = useState<OutlineItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const activeIdRef = useRef<string | null>(null);

  useEffect(() => {
    const editor = document.querySelector<HTMLElement>('.editor-page');
    const workspace = document.querySelector<HTMLElement>('.docs-editor-workspace');
    if (!editor) return;

    let intersectionObserver: IntersectionObserver | null = null;
    let refreshFrame = 0;
    const visible = new Map<string, IntersectionObserverEntry>();

    const activate = (id: string | null) => {
      if (activeIdRef.current === id) return;
      activeIdRef.current = id;
      setActiveId(id);
    };

    const observeHeadings = (headings: HTMLElement[]) => {
      intersectionObserver?.disconnect();
      visible.clear();
      if (!('IntersectionObserver' in window)) return;
      intersectionObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          const id = (entry.target as HTMLElement).dataset.fwoOutlineId;
          if (!id) return;
          if (entry.isIntersecting) visible.set(id, entry);
          else visible.delete(id);
        });
        const current = Array.from(visible.entries())
          .sort((a, b) => Math.abs(a[1].boundingClientRect.top - 126) - Math.abs(b[1].boundingClientRect.top - 126))[0];
        if (current) activate(current[0]);
      }, { root: workspace, rootMargin: '-104px 0px -55% 0px', threshold: [0, 1] });
      headings.forEach((heading) => intersectionObserver?.observe(heading));
    };

    const refresh = () => {
      cancelAnimationFrame(refreshFrame);
      refreshFrame = requestAnimationFrame(() => {
        const headings = Array.from(editor.querySelectorAll<HTMLElement>(OUTLINE_SELECTOR))
          .filter((heading) => heading.isConnected);
        const nextItems = headings.flatMap((heading) => {
          const text = heading.innerText.replace(/\s+/g, ' ').trim();
          if (!text) return [];
          const kind = outlineKind(heading);
          return [{ id: headingId(heading), text, level: outlineLevel(kind), kind }];
        });
        setItems(nextItems);
        observeHeadings(headings);
        if (activeIdRef.current && !nextItems.some((item) => item.id === activeIdRef.current)) activate(null);
      });
    };

    const onSelectionChange = () => {
      const selection = window.getSelection();
      let node = selection?.anchorNode ?? null;
      if (node?.nodeType === Node.TEXT_NODE) node = node.parentElement;
      const heading = node instanceof Element ? node.closest<HTMLElement>(OUTLINE_SELECTOR) : null;
      if (heading && editor.contains(heading)) activate(headingId(heading));
    };

    refresh();
    const mutationObserver = new MutationObserver(refresh);
    mutationObserver.observe(editor, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['data-fwo-paragraph-style'] });
    editor.addEventListener('input', refresh);
    editor.addEventListener('fwo:pages', refresh);
    document.addEventListener('selectionchange', onSelectionChange);

    return () => {
      cancelAnimationFrame(refreshFrame);
      mutationObserver.disconnect();
      intersectionObserver?.disconnect();
      editor.removeEventListener('input', refresh);
      editor.removeEventListener('fwo:pages', refresh);
      document.removeEventListener('selectionchange', onSelectionChange);
    };
  }, []);

  function jumpToHeading(id: string) {
    const heading = document.querySelector<HTMLElement>(`[data-fwo-outline-id="${id}"]`);
    if (!heading) return;
    activeIdRef.current = id;
    setActiveId(id);
    heading.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <aside className="fwo-outline" aria-label="Document outline">
      <div className="fwo-outline-label">Outline</div>
      <div className="fwo-outline-tree">
        {items.length ? items.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`fwo-outline-item fwo-outline-${item.kind}${activeId === item.id ? ' is-active' : ''}`}
            style={{ paddingLeft: `${8 + item.level * 12}px` }}
            onClick={() => jumpToHeading(item.id)}
            aria-current={activeId === item.id ? 'location' : undefined}
            title={item.text}
          >
            <span className="fwo-outline-item-text">{item.text}</span>
          </button>
        )) : <p className="fwo-outline-empty">Add a Title or headings to your document<br />to build an outline.</p>}
      </div>
      <style jsx global>{`
        .fwo-outline { position:absolute; top:94px; left:0; bottom:0; z-index:22; width:236px; box-sizing:border-box; padding:16px 10px; background:#f8fafd; color:#3c4043; font-family:Arial,Helvetica,sans-serif; overflow-y:auto; overflow-x:hidden; border:0; }
        .fwo-outline-label { margin:0 10px 7px; color:#3c4043; font-size:12px; font-weight:600; }
        .fwo-outline-tree { position:relative; margin:0 4px; padding:0 0 8px; border:0; min-width:0; }
        .fwo-outline-item { position:relative; width:100%; min-width:0; min-height:30px; border:0; background:transparent; color:#4a4d51; padding-top:4px; padding-right:8px; padding-bottom:4px; border-radius:4px; display:block; text-align:left; font:400 13px/1.35 Arial,Helvetica,sans-serif; cursor:pointer; overflow:hidden; }
        .fwo-outline-item-text { display:block; width:100%; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .fwo-outline-title { font-weight:700; color:#202124; }
        .fwo-outline-h1 { font-weight:600; }
        .fwo-outline-h2 { font-weight:550; }
        .fwo-outline-h3,.fwo-outline-h4,.fwo-outline-h5,.fwo-outline-h6 { font-weight:400; }
        .fwo-outline-item:hover { background:#eef3fb; color:#174ea6; }
        .fwo-outline-item.is-active { color:#0b57d0; font-weight:600; }
        .fwo-outline-item.is-active::before { content:''; position:absolute; left:0; top:6px; bottom:6px; width:2px; border-radius:2px; background:#0b57d0; }
        .fwo-outline-empty { margin:8px 10px; color:#5f6368; font-size:12px; line-height:1.35; }
        @media(max-width:1120px) { .fwo-outline { display:none; } }
        @media print { .fwo-outline { display:none!important; } }
      `}</style>
    </aside>
  );
}
