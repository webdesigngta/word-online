'use client';

import { useEffect, useRef, useState } from 'react';
import { FileUp, LoaderCircle } from 'lucide-react';
import { PdfEditorWorkspace } from '@/components/PdfEditorWorkspace';

function workerUrl() {
  const basePath = (process.env.NEXT_PUBLIC_BASE_PATH || '').replace(/\/+$/, '');
  // HostGator/Apache can serve .mjs with a non-JavaScript MIME type. PDF.js
  // creates a module worker only when a document is opened, so that failure
  // looks like the picker worked and then the editor instantly stopped.
  // The build copies the same PDF.js worker bytes to a .js URL, which shared
  // Apache hosting serves as JavaScript reliably.
  const path = `${basePath}/pdf.worker.min.js`;
  return new URL(path, window.location.origin).toString();
}

export function PdfSmartEditLoader({ toolId }: { toolId: string }) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const mounted = useRef(true);
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    mounted.current = true;
    setReady(false);
    setError('');

    void import('pdfjs-dist/legacy/build/pdf.mjs')
      .then((pdfjs) => {
        pdfjs.GlobalWorkerOptions.workerSrc = workerUrl();
        if (mounted.current) setReady(true);
      })
      .catch((caught) => {
        if (!mounted.current) return;
        setError(caught instanceof Error ? caught.message : 'The PDF engine could not be loaded.');
      });

    return () => {
      mounted.current = false;
    };
  }, [attempt]);

  useEffect(() => {
    if (!ready) return;
    const host = hostRef.current;
    if (!host) return;

    const onChoosePdf = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const button = target?.closest<HTMLElement>('.smart-pdf-editor .spe-drop .spe-btn.primary');
      if (!button || !host.contains(button)) return;

      const input = host.querySelector<HTMLInputElement>('input[type="file"][accept*="pdf"]');
      if (!input || input.disabled) return;

      event.preventDefault();
      event.stopPropagation();

      input.value = '';
      input.hidden = false;
      input.style.position = 'fixed';
      input.style.left = '-10000px';
      input.style.top = '0';
      input.style.width = '1px';
      input.style.height = '1px';
      input.style.opacity = '0';
      input.style.pointerEvents = 'none';

      try {
        const picker = input as HTMLInputElement & { showPicker?: () => void };
        if (typeof picker.showPicker === 'function') picker.showPicker();
        else input.click();
      } catch {
        input.click();
      }
    };

    host.addEventListener('click', onChoosePdf, true);
    return () => host.removeEventListener('click', onChoosePdf, true);
  }, [ready]);

  if (error) {
    return (
      <div data-native-upload-ui="true" className="spe-engine-state spe-engine-error" role="alert">
        <FileUp size={34} />
        <strong>Could not start the PDF editor</strong>
        <span>{error}</span>
        <button type="button" onClick={() => setAttempt((value) => value + 1)}>Try again</button>
        <style jsx>{`
          .spe-engine-state{display:grid;justify-items:center;gap:9px;padding:28px 18px;border:2px dashed #d4d9e1;border-radius:18px;background:#f8fafd;text-align:center;color:#202124}
          .spe-engine-state>svg{color:#0b57d0}.spe-engine-state span{max-width:680px;color:#5f6368;font-size:13px;line-height:1.45}
          .spe-engine-state button{border:1px solid #0b57d0;border-radius:999px;background:#0b57d0;color:#fff;padding:9px 16px;font-weight:700;cursor:pointer}
          .spe-engine-error{border-color:#f1c7c3;background:#fff8f7}.spe-engine-error>svg{color:#b3261e}
        `}</style>
      </div>
    );
  }

  if (!ready) {
    return (
      <div data-native-upload-ui="true" className="spe-engine-state" aria-live="polite">
        <LoaderCircle className="spe-engine-spinner" size={34} />
        <strong>Loading PDF editor...</strong>
        <span>Preparing the PDF renderer and OCR engine.</span>
        <style jsx>{`
          .spe-engine-state{display:grid;justify-items:center;gap:9px;padding:28px 18px;border:2px dashed #d4d9e1;border-radius:18px;background:#f8fafd;text-align:center;color:#202124}
          .spe-engine-state>svg{color:#0b57d0}.spe-engine-state span{color:#5f6368;font-size:13px}.spe-engine-spinner{animation:spe-spin .9s linear infinite}@keyframes spe-spin{to{transform:rotate(360deg)}}
        `}</style>
      </div>
    );
  }

  return (
    <div ref={hostRef} data-native-upload-ui="true">
      <PdfEditorWorkspace toolId={toolId} />
    </div>
  );
}
