'use client';

import { useEffect, useState } from 'react';
import { listWordHistory, type WordHistorySnapshot } from '@/tools/word/state/wordHistory';

function formatSnapshotTime(createdAt: number) {
  try {
    return new Date(createdAt).toLocaleString([], {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return new Date(createdAt).toLocaleString();
  }
}

function updateControlledTitle(title: string) {
  const input = document.querySelector<HTMLInputElement>('.docs-document-title');
  if (!input) return;

  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
  if (setter) setter.call(input, title);
  else input.value = title;
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

function restoreSnapshot(snapshot: WordHistorySnapshot) {
  const editor = document.querySelector<HTMLElement>('.editor-page');
  if (!editor) return false;

  editor.innerHTML = snapshot.html;
  updateControlledTitle(snapshot.title);
  editor.dispatchEvent(new Event('input', { bubbles: true }));
  editor.focus({ preventScroll: true });
  return true;
}

export function LocalVersionHistory() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [snapshots, setSnapshots] = useState<WordHistorySnapshot[]>([]);
  const [notice, setNotice] = useState('');

  async function refreshHistory() {
    setLoading(true);
    setNotice('');
    try {
      setSnapshots(await listWordHistory());
    } catch {
      setSnapshots([]);
      setNotice('Version history could not be loaded in this browser.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const onVersionHistoryClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const button = target?.closest<HTMLButtonElement>('button[aria-label="Version history"]');
      if (!button) return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      setOpen(true);
      void refreshHistory();
    };

    document.addEventListener('click', onVersionHistoryClick, true);
    return () => document.removeEventListener('click', onVersionHistoryClick, true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  if (!open) return null;

  return (
    <div className="fwo-history-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) setOpen(false);
    }}>
      <aside className="fwo-history-panel" role="dialog" aria-modal="true" aria-labelledby="fwo-history-title">
        <div className="fwo-history-header">
          <div>
            <h2 id="fwo-history-title">Version history</h2>
            <p>Recent local autosave snapshots from this browser.</p>
          </div>
          <button type="button" className="fwo-history-close" aria-label="Close version history" onClick={() => setOpen(false)}>×</button>
        </div>

        <div className="fwo-history-body">
          {loading ? <p className="fwo-history-empty">Loading versions…</p> : null}
          {!loading && notice ? <p className="fwo-history-empty">{notice}</p> : null}
          {!loading && !notice && snapshots.length === 0 ? (
            <p className="fwo-history-empty">No previous local versions yet. Keep editing and autosave will build a rolling history.</p>
          ) : null}

          {!loading && snapshots.map((snapshot, index) => (
            <button
              type="button"
              className="fwo-history-item"
              key={snapshot.id}
              onClick={() => {
                if (restoreSnapshot(snapshot)) {
                  setNotice(index === 0 ? 'Latest local version restored.' : 'Earlier local version restored.');
                  setOpen(false);
                } else {
                  setNotice('The editor is not ready yet.');
                }
              }}
            >
              <span className="fwo-history-item-main">
                <strong>{snapshot.title || 'Untitled document'}</strong>
                <span>{formatSnapshotTime(snapshot.createdAt)}</span>
              </span>
              <span className="fwo-history-restore">Restore</span>
            </button>
          ))}
        </div>

        <div className="fwo-history-footer">
          <span>Stored locally on this device</span>
          <button type="button" onClick={() => void refreshHistory()}>Refresh</button>
        </div>
      </aside>

      <style>{`
        .fwo-history-backdrop {
          position: fixed;
          inset: 0;
          z-index: 260;
          background: rgba(32, 33, 36, .28);
          display: flex;
          justify-content: flex-end;
          align-items: stretch;
        }

        .fwo-history-panel {
          width: min(410px, 94vw);
          height: 100%;
          background: #fff;
          color: #202124;
          box-shadow: -8px 0 30px rgba(60, 64, 67, .22);
          display: grid;
          grid-template-rows: auto minmax(0, 1fr) auto;
          font-family: Arial, Helvetica, sans-serif;
        }

        .fwo-history-header {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          padding: 22px 20px 16px;
          border-bottom: 1px solid #e0e3e7;
        }

        .fwo-history-header h2 {
          margin: 0;
          font-size: 20px;
          line-height: 1.3;
          font-weight: 500;
        }

        .fwo-history-header p {
          margin: 5px 0 0;
          color: #5f6368;
          font-size: 12px;
          line-height: 1.45;
        }

        .fwo-history-close {
          width: 36px;
          height: 36px;
          border: 0;
          border-radius: 18px;
          background: transparent;
          color: #444746;
          font-size: 26px;
          line-height: 1;
          cursor: pointer;
        }

        .fwo-history-close:hover,
        .fwo-history-footer button:hover {
          background: #f1f3f4;
        }

        .fwo-history-body {
          overflow: auto;
          padding: 12px;
        }

        .fwo-history-empty {
          margin: 8px;
          padding: 18px;
          border-radius: 12px;
          background: #f8fafd;
          color: #5f6368;
          font-size: 13px;
          line-height: 1.5;
        }

        .fwo-history-item {
          width: 100%;
          border: 0;
          border-radius: 12px;
          background: transparent;
          padding: 12px 10px 12px 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          text-align: left;
          cursor: pointer;
          color: #202124;
        }

        .fwo-history-item:hover,
        .fwo-history-item:focus-visible {
          background: #eef3fb;
          outline: none;
        }

        .fwo-history-item-main {
          min-width: 0;
          display: grid;
          gap: 4px;
        }

        .fwo-history-item-main strong {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-size: 13px;
          font-weight: 500;
        }

        .fwo-history-item-main span {
          color: #5f6368;
          font-size: 11px;
        }

        .fwo-history-restore {
          flex: 0 0 auto;
          color: #0b57d0;
          font-size: 12px;
          font-weight: 500;
        }

        .fwo-history-footer {
          min-height: 54px;
          border-top: 1px solid #e0e3e7;
          padding: 8px 14px 8px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          color: #5f6368;
          font-size: 11px;
        }

        .fwo-history-footer button {
          border: 0;
          border-radius: 18px;
          background: transparent;
          color: #0b57d0;
          padding: 8px 12px;
          cursor: pointer;
          font-weight: 500;
        }

        @media (max-width: 600px) {
          .fwo-history-panel {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
