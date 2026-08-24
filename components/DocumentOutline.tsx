'use client';

import { useEffect, useState } from 'react';

type OutlineItem = {
  id: string;
  text: string;
  level: number;
};

export function DocumentOutline() {
  const [title, setTitle] = useState('Untitled document');
  const [items, setItems] = useState<OutlineItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const editor = document.querySelector<HTMLElement>('.editor-page');
    const titleInput = document.querySelector<HTMLInputElement>('.docs-document-title');

    if (!editor) return;

    const refresh = () => {
      const headings = Array.from(editor.querySelectorAll<HTMLElement>('p[data-fwo-paragraph-style="title"],h1,h2,h3,h4,h5,h6'));
      const nextItems = headings
        .map((heading, index) => {
          const text = heading.innerText.trim();
          const level = heading.matches('p[data-fwo-paragraph-style="title"]') ? 0 : Number(heading.tagName.slice(1));
          const id = `fwo-outline-${index}`;
          heading.dataset.fwoOutlineId = id;
          return text ? { id, text, level } : null;
        })
        .filter((item): item is OutlineItem => Boolean(item));

      setItems(nextItems);
      setTitle(titleInput?.value.trim() || 'Untitled document');
    };

    refresh();

    const observer = new MutationObserver(refresh);
    observer.observe(editor, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['data-fwo-paragraph-style'],
    });

    const onTitleInput = () => setTitle(titleInput?.value.trim() || 'Untitled document');
    titleInput?.addEventListener('input', onTitleInput);

    const workspace = document.querySelector<HTMLElement>('.docs-editor-workspace');
    const updateActive = () => {
      const headings = Array.from(editor.querySelectorAll<HTMLElement>('[data-fwo-outline-id]'));
      const anchor = (workspace?.getBoundingClientRect().top || 0) + 120;
      const current = headings.reduce<HTMLElement | null>((closest, heading) =>
        heading.getBoundingClientRect().top <= anchor ? heading : closest, headings[0] || null);
      setActiveId(current?.dataset.fwoOutlineId || null);
    };
    workspace?.addEventListener('scroll', updateActive, { passive: true });
    updateActive();

    return () => {
      observer.disconnect();
      titleInput?.removeEventListener('input', onTitleInput);
      workspace?.removeEventListener('scroll', updateActive);
    };
  }, []);

  function jumpToHeading(id: string) {
    const heading = document.querySelector<HTMLElement>(`[data-fwo-outline-id="${id}"]`);
    if (!heading) return;
    setActiveId(id);
    heading.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  return (
    <aside className="fwo-outline" aria-label="Document outline">
      <div className="fwo-outline-heading">
        <span>Document outline</span>
      </div>

      <div className="fwo-outline-tab" title={title}>
        <span>{title}</span>
      </div>

      <div className="fwo-outline-tree">
        {items.length ? items.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`fwo-outline-item${activeId === item.id ? ' is-active' : ''}`}
            style={{ '--outline-level': Math.max(0, item.level - 1) } as React.CSSProperties}
            onClick={() => jumpToHeading(item.id)}
            title={item.text}
          >
            {item.text}
          </button>
        )) : (
          <p className="fwo-outline-empty">Headings you add to the document will appear here.</p>
        )}
      </div>

      <style jsx global>{`
        .fwo-outline {
          position: absolute;
          top: 94px;
          left: 0;
          bottom: 0;
          z-index: 22;
          width: 236px;
          padding: 18px 10px 16px;
          background: #f8fafd;
          color: #3c4043;
          font-family: Arial, Helvetica, sans-serif;
          overflow-y: auto;
          border: 0 !important;
        }

        .fwo-outline-heading {
          height: 34px;
          padding: 0 8px 0 10px;
          display: flex;
          align-items: center;
          font-size: 13px;
          font-weight: 600;
          color: #5f6368;
        }

        .fwo-outline-tab {
          min-height: 40px;
          margin-top: 4px;
          padding: 0 12px;
          border-radius: 6px;
          background: #e8f0fe;
          color: #185abc;
          display: block;
          line-height: 40px;
          align-items: center;
          gap: 10px;
          font-size: 14px;
        }

        .fwo-outline-tab span {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .fwo-outline-tree {
          position: relative;
          margin: 12px 0 0;
          padding: 0 0 8px;
          border: 0 !important;
        }

        .fwo-outline-item {
          width: 100%;
          min-height: 34px;
          border: 0;
          background: transparent;
          color: #4a4d51;
          padding-left: calc(14px + var(--outline-level) * 16px);
          padding-top: 5px;
          padding-right: 6px;
          padding-bottom: 5px;
          border-radius: 4px;
          display: block;
          text-align: left;
          font: 400 14px/1.35 Arial, Helvetica, sans-serif;
          cursor: pointer;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .fwo-outline-item.is-active {
          color: #0b57d0;
          font-weight: 500;
          background: #e8f0fe;
          box-shadow: inset 3px 0 #0b57d0;
        }

        .fwo-outline-item:hover {
          background: #eef3fb;
          color: #0b57d0;
        }

        .fwo-outline-empty {
          margin: 8px 8px 0 -26px;
          color: #5f6368;
          font-size: 12px;
          font-style: italic;
          line-height: 1.35;
        }

        @media (max-width: 1120px) {
          .fwo-outline {
            display: none;
          }
        }

        @media print {
          .fwo-outline {
            display: none !important;
          }
        }
      `}</style>
    </aside>
  );
}
