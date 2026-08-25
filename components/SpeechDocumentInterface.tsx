'use client';

import { useEffect, useRef, useState } from 'react';
import { Copy, Download, Mic, Pause, Play, RotateCcw, Square } from 'lucide-react';
import { downloadDocumentBlob } from '@/tools/document/formatHelpers';

export type SpeechDocumentMode = 'speech-to-text-document' | 'text-to-speech-document';

type RecognitionResultLike = { isFinal: boolean; 0: { transcript: string } };
type RecognitionEventLike = { resultIndex: number; results: ArrayLike<RecognitionResultLike> };
type RecognitionErrorLike = { error?: string; message?: string };
type RecognitionInstance = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: RecognitionEventLike) => void) | null;
  onerror: ((event: RecognitionErrorLike) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
};
type RecognitionConstructor = new () => RecognitionInstance;

type SpeechWindow = Window & typeof globalThis & {
  SpeechRecognition?: RecognitionConstructor;
  webkitSpeechRecognition?: RecognitionConstructor;
};

function getRecognitionConstructor() {
  if (typeof window === 'undefined') return undefined;
  const speechWindow = window as SpeechWindow;
  return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
}

function words(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

export function SpeechDocumentInterface({ mode }: { mode: SpeechDocumentMode }) {
  const recognitionRef = useRef<RecognitionInstance | null>(null);
  const finalTextRef = useRef('');
  const [text, setText] = useState('');
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);
  const [rate, setRate] = useState(1);
  const [status, setStatus] = useState(mode === 'speech-to-text-document' ? 'Use your microphone to dictate a document.' : 'Paste or type text, then listen to it in your browser.');

  useEffect(() => () => {
    recognitionRef.current?.abort();
    if (typeof window !== 'undefined') window.speechSynthesis?.cancel();
  }, []);

  function startListening() {
    const Recognition = getRecognitionConstructor();
    if (!Recognition) {
      setStatus('Speech recognition is not supported by this browser. Try a current Chromium-based browser with microphone access.');
      return;
    }
    recognitionRef.current?.abort();
    const recognition = new Recognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = navigator.language || 'en-US';
    finalTextRef.current = text.trim() ? `${text.trim()} ` : '';
    recognition.onresult = (event) => {
      let interim = '';
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        const transcript = result[0]?.transcript ?? '';
        if (result.isFinal) finalTextRef.current += `${transcript.trim()} `;
        else interim += transcript;
      }
      setText(`${finalTextRef.current}${interim}`.trimStart());
    };
    recognition.onerror = (event) => {
      setListening(false);
      setStatus(event.error ? `Microphone error: ${event.error}.` : event.message || 'Speech recognition stopped with an error.');
    };
    recognition.onend = () => {
      setListening(false);
      setText((current) => current.trimEnd());
      setStatus('Dictation stopped. You can edit, copy, or download the transcript.');
    };
    recognitionRef.current = recognition;
    try {
      recognition.start();
      setListening(true);
      setStatus('Listening… Speak naturally. Interim words appear as you talk.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not start speech recognition.');
    }
  }

  function stopListening() {
    recognitionRef.current?.stop();
    setListening(false);
  }

  function speak() {
    if (!text.trim()) return;
    if (!('speechSynthesis' in window)) {
      setStatus('Text-to-speech is not supported by this browser.');
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = rate;
    utterance.lang = navigator.language || 'en-US';
    utterance.onstart = () => { setSpeaking(true); setPaused(false); setStatus('Reading document aloud…'); };
    utterance.onend = () => { setSpeaking(false); setPaused(false); setStatus('Finished reading.'); };
    utterance.onerror = () => { setSpeaking(false); setPaused(false); setStatus('Text-to-speech stopped with an error.'); };
    window.speechSynthesis.speak(utterance);
  }

  function pauseResume() {
    if (!speaking) return;
    if (paused) {
      window.speechSynthesis.resume();
      setPaused(false);
      setStatus('Reading resumed.');
    } else {
      window.speechSynthesis.pause();
      setPaused(true);
      setStatus('Reading paused.');
    }
  }

  function stopSpeaking() {
    window.speechSynthesis.cancel();
    setSpeaking(false);
    setPaused(false);
    setStatus('Reading stopped.');
  }

  async function copyText() {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setStatus('Copied to clipboard.');
    } catch {
      setStatus('Clipboard access is unavailable in this browser.');
    }
  }

  function downloadText() {
    if (!text.trim()) return;
    downloadDocumentBlob(new Blob([text], { type: 'text/plain;charset=utf-8' }), 'document.txt');
    setStatus('TXT downloaded.');
  }

  function clear() {
    if (listening) recognitionRef.current?.stop();
    if (speaking) window.speechSynthesis.cancel();
    finalTextRef.current = '';
    setText('');
    setListening(false);
    setSpeaking(false);
    setPaused(false);
    setStatus(mode === 'speech-to-text-document' ? 'Transcript cleared.' : 'Text cleared.');
  }

  const speechToText = mode === 'speech-to-text-document';

  return (
    <div className="fwo-speech-tool">
      <style>{`
        .fwo-speech-tool{display:grid;gap:16px}.fwo-speech-toolbar{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}.fwo-speech-status{color:#5f6368;font-size:13px}.fwo-speech-actions{display:flex;gap:8px;flex-wrap:wrap}.fwo-speech-btn{border:1px solid #dadce0;border-radius:20px;background:#fff;color:#202124;padding:9px 14px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:7px}.fwo-speech-btn.primary{background:#0b57d0;color:#fff;border-color:#0b57d0}.fwo-speech-btn.live{background:#c5221f;color:#fff;border-color:#c5221f}.fwo-speech-btn:disabled{opacity:.5;cursor:not-allowed}.fwo-speech-btn svg{width:16px}.fwo-speech-editor{width:100%;min-height:390px;border:1px solid #dadce0;border-radius:14px;background:#fff;padding:24px;font:15px/1.6 Arial,sans-serif;color:#202124;resize:vertical;outline:none}.fwo-speech-editor:focus{box-shadow:inset 0 0 0 2px #0b57d0}.fwo-speech-meta{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;color:#5f6368;font-size:12px}.fwo-speech-rate{display:flex;align-items:center;gap:8px}.fwo-speech-rate input{width:140px}.fwo-speech-note{font-size:12px;color:#5f6368;background:#f8fafd;border-radius:10px;padding:10px 12px}@media(max-width:700px){.fwo-speech-btn{padding:8px 11px}.fwo-speech-editor{min-height:330px;padding:18px}}
      `}</style>
      <div className="fwo-speech-toolbar">
        <div className="fwo-speech-status">{status}</div>
        <div className="fwo-speech-actions">
          {speechToText ? (
            listening ? <button type="button" className="fwo-speech-btn live" onClick={stopListening}><Square />Stop listening</button> : <button type="button" className="fwo-speech-btn primary" onClick={startListening}><Mic />Start dictation</button>
          ) : (
            <>
              {!speaking ? <button type="button" className="fwo-speech-btn primary" disabled={!text.trim()} onClick={speak}><Play />Read aloud</button> : <button type="button" className="fwo-speech-btn" onClick={pauseResume}>{paused ? <Play /> : <Pause />}{paused ? 'Resume' : 'Pause'}</button>}
              {speaking ? <button type="button" className="fwo-speech-btn" onClick={stopSpeaking}><Square />Stop</button> : null}
            </>
          )}
          <button type="button" className="fwo-speech-btn" disabled={!text} onClick={() => void copyText()}><Copy />Copy</button>
          <button type="button" className="fwo-speech-btn" disabled={!text.trim()} onClick={downloadText}><Download />TXT</button>
          <button type="button" className="fwo-speech-btn" disabled={!text && !listening && !speaking} onClick={clear}><RotateCcw />Clear</button>
        </div>
      </div>
      <textarea className="fwo-speech-editor" value={text} onChange={(event) => setText(event.target.value)} placeholder={speechToText ? 'Your dictated text will appear here…' : 'Paste or type the document you want the browser to read aloud…'} />
      <div className="fwo-speech-meta">
        <span>{words(text)} words · {text.length} characters</span>
        {!speechToText ? <label className="fwo-speech-rate">Speed <input type="range" min="0.5" max="2" step="0.1" value={rate} disabled={speaking} onChange={(event) => setRate(Number(event.target.value))} /><strong>{rate.toFixed(1)}×</strong></label> : null}
      </div>
      <div className="fwo-speech-note">{speechToText ? 'Speech recognition uses your browser’s speech service and requires microphone permission. Availability and processing behavior depend on the browser and device.' : 'Text-to-speech uses voices available through your browser or operating system. Voice quality and language support depend on the device.'}</div>
    </div>
  );
}
