'use client';

import { FileText, MoreVertical, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';

type OutlineItem = {
  id: string;
  text: string;
  level: number;
};

export function DocumentOutline() {
  const [title, setTitle] = useState('Untitled document');
  const [items, setItems] = useState<OutlineItem[]>([]);

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

    return () => {
      observer.disconnect();
      titleInput?.removeEventListener('input', onTitleInput);
    };
  }, []);

  function jumpToHeading(id: string) {
    const heading = document.querySelector<HTMLElement>(`[data-fwo-outline-id="${id}"]`);
    if (!heading) return;
    heading.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  return (
    <aside className="fwo-outline" aria-label="Document outline">
      <div className="fwo-outline-heading">
        <span>Document tabs</span>
        <button type="button" aria-label="Add document tab" title="Add document tab"><Plus /></button>
      </div>

      <div className="fwo-outline-tab" title={title}>
        <FileText aria-hidden="true" />
        <span>{title}</span>
        <MoreVertical aria-hidden="true" />
      </div>

      <div className="fwo-outline-tree">
        {items.length ? items.map((item) => (
          <button
            key={item.id}
            type="button"
            className="fwo-outline-item"
            style={{ paddingLeft: `${12 + Math.max(0, item.level) * 12}px` }}
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
          justify-content: space-between;
          font-size: 14px;
        }

        .fwo-outline-heading button {
          width: 28px;
          height: 28px;
          border: 0;
          border-radius: 14px;
          background: transparent;
          color: #444746;
          display: grid;
          place-items: center;
          cursor: pointer;
        }

        .fwo-outline-heading button:hover {
          background: #e9eef6;
        }

        .fwo-outline-heading svg {
          width: 17px;
          height: 17px;
        }

        .fwo-outline-tab {
          min-height: 40px;
          margin-top: 4px;
          padding: 0 10px 0 14px;
          border-radius: 20px;
          background: #d3e3fd;
          color: #174ea6;
          display: grid;
          grid-template-columns: 18px minmax(0, 1fr) 18px;
          align-items: center;
          gap: 10px;
          font-size: 14px;
        }

        .fwo-outline-tab span {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .fwo-outline-tab svg {
          width: 17px;
          height: 17px;
        }

        .fwo-outline-tree {
          position: relative;
          margin: 10px 0 0 31px;
          padding: 0 0 8px 12px;
          border: 0 !important;
        }

        .fwo-outline-item {
          width: 100%;
          min-height: 34px;
          border: 0;
          background: transparent;
          color: #4a4d51;
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
