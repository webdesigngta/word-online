'use client';

import { type FormEvent, useEffect, useRef, useState } from 'react';
import { FileUp, LoaderCircle } from 'lucide-react';
import { PdfEditorWorkspace } from '@/components/PdfEditorWorkspace';

const MAX_PDF_BYTES = 50 * 1024 * 1024;

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

function validatePdf(file: File | null) {
  if (!file) return '';
  if (!(file.type === 'application/pdf' || /\.pdf$/i.test(file.name))) {
    return 'Please choose a PDF file.';
  }
  if (file.size > MAX_PDF_BYTES) {
    return 'This PDF is larger than 50 MB. Choose a smaller file so the browser editor can process it reliably.';
  }
  return '';
}

export function PdfSmartEditLoader({ toolId }: { toolId: string }) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [fileError, setFileError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    setReady(false);
    setError('');

    void import('pdfjs-dist/legacy/build/pdf.mjs')
      .then((pdfjs) => {
        // Keep PDF engine initialization here, but let PdfEditorWorkspace own
        // the actual file input and user click. Having the loader intercept
        // the Choose PDF button created two competing picker implementations
        // and could leave users with a selected file that never reached the
        // workspace change handler.
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

  function onFileChangeCapture(event: FormEvent<HTMLDivElement>) {
    const input = event.target as HTMLInputElement | null;
    if (!input || input.type !== 'file') return;
    const message = validatePdf(input.files?.[0] || null);
    setFileError(message);
    if (!message) return;

    // Clear the invalid selection before PdfEditorWorkspace receives the same
    // change event. That keeps the workspace as the single event owner while
    // preventing an oversized/non-PDF file from reaching PDF.js or OCR.
    input.value = '';
  }

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
    <div data-native-upload-ui="true" onChangeCapture={onFileChangeCapture}>
      {fileError ? (
        <div className="spe-file-error" role="alert">
          <FileUp size={18} />
          <span>{fileError}</span>
          <style jsx>{`
            .spe-file-error{display:flex;align-items:center;gap:8px;margin-bottom:10px;padding:10px 12px;border:1px solid #f1c7c3;border-radius:10px;background:#fff8f7;color:#8c1d18;font-size:12px;font-weight:700}
            .spe-file-error>svg{flex:0 0 auto;color:#b3261e}
          `}</style>
        </div>
      ) : null}
      <PdfEditorWorkspace toolId={toolId} />
    </div>
  );
}
