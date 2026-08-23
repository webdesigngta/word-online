'use client';

import { Check, SpellCheck2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

type SpellMenuState = {
  x: number;
  y: number;
  word: string;
  range: Range;
  suggestions: string[];
};

const PERSONAL_KEY = 'free-word-online:personal-dictionary:v1';
const IGNORED_KEY = 'free-word-online:ignored-spelling:v1';
const AUTOCORRECT_KEY = 'free-word-online:autocorrect:v1';

const COMMON_WORDS = `
a about above accept access account across action active add address after again against age ago agree align alignment all allow almost already also always am among an and another answer any anyone anything app appear application apply are area around arrow as ask at auto available away back background basic be because become been before begin behind being below best better between big black block blue body bold book border both box browser build business but button by cache call can canvas center change character check child choose city class clean clear click client close cloud code collapse color column come comment common company complete computer content copy correct could country create current custom data day decide default delete device dialog different direct display do document does done double down download draft dropdown each early edit editor effect email end enough enter even every example export extension eye face fact family far feel few field file find finish first fix focus follow font footer for foreground form format found free from full function get give go good grace grammar great group grow had hand happen has have he heading help her here high highlight him his history home horizontal host how however html i icon if image import in include increase indent information input insert inside install internet into is it italic its item just keep key keyboard know label landscape language large last later layout learn left less let level life like line link list little loading local login long look made main make many material may me mean menu might mobile modern more most mouse move much must my name near need network never new next no normal note now number of off offline often old on once one online only open option or order other our out over own page paragraph part paste pdf people personal picker place plain point popup possible preview print privacy program project put question quick read ready real redo remove replace responsive review right ruler run same save saved saving say screen search see select selected selection sentence service set setting several share shortcut should show side sidebar simple since single small so some something space spacing spell spelling standard start state status still storage style such suggestion support system tab table take terms text than that the their them then there these they thing think this those through time title to today together tool toolbar top try turn two type under underline undo up update upload url use user value vertical very view visible want was way we web website well were what when where which while who why width will window with without word work would write writing year you your zoom
`.trim().split(/\s+/);

const COMMON_CORRECTIONS: Record<string, string[]> = {
  teh: ['the'], hte: ['the'], taht: ['that'], adn: ['and'], wrod: ['word'],
  recieve: ['receive'], recieved: ['received'], seperate: ['separate'], occured: ['occurred'],
  definately: ['definitely'], accomodate: ['accommodate'], untill: ['until'], wierd: ['weird'],
  thier: ['their'], becuase: ['because'], goverment: ['government'], enviroment: ['environment'],
  adress: ['address'], begining: ['beginning'], sucessful: ['successful'], calender: ['calendar'],
  grammer: ['grammar'], tommorow: ['tomorrow'], writting: ['writing'], runing: ['running'],
  documant: ['document'], langauge: ['language'], sentance: ['sentence'], responsiv: ['responsive'],
  dowload: ['download'], becouse: ['because'], freind: ['friend'], recieveing: ['receiving'],
};

function getEditor() {
  return document.querySelector<HTMLElement>('.editor-page[contenteditable]');
}

function readSet(key: string) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || '[]');
    return new Set<string>(Array.isArray(parsed) ? parsed.map((item) => String(item).toLowerCase()) : []);
  } catch {
    return new Set<string>();
  }
}

function writeSet(key: string, set: Set<string>) {
  try { localStorage.setItem(key, JSON.stringify(Array.from(set).slice(-1000))); } catch {}
}

function readCorrections() {
  try {
    const parsed = JSON.parse(localStorage.getItem(AUTOCORRECT_KEY) || '{}');
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as Record<string, string> : {};
  } catch {
    return {} as Record<string, string>;
  }
}

function writeCorrections(value: Record<string, string>) {
  try { localStorage.setItem(AUTOCORRECT_KEY, JSON.stringify(value)); } catch {}
}

function pointRange(x: number, y: number) {
  const doc = document as Document & {
    caretRangeFromPoint?: (x: number, y: number) => Range | null;
    caretPositionFromPoint?: (x: number, y: number) => { offsetNode: Node; offset: number } | null;
  };
  if (doc.caretRangeFromPoint) return doc.caretRangeFromPoint(x, y);
  const point = doc.caretPositionFromPoint?.(x, y);
  if (!point) return null;
  const range = document.createRange();
  range.setStart(point.offsetNode, point.offset);
  range.collapse(true);
  return range;
}

function wordRangeAtPoint(editor: HTMLElement, x: number, y: number) {
  const caret = pointRange(x, y);
  if (!caret || !editor.contains(caret.startContainer)) return null;

  let node: Node = caret.startContainer;
  let offset = caret.startOffset;
  if (node.nodeType !== Node.TEXT_NODE) {
    const element = node instanceof HTMLElement ? node : node.parentElement;
    const textNode = Array.from(element?.childNodes || []).find((child) => child.nodeType === Node.TEXT_NODE && child.textContent?.trim());
    if (!textNode) return null;
    node = textNode;
    offset = Math.min(offset, textNode.textContent?.length || 0);
  }

  const value = node.textContent || '';
  const isLetter = (char: string) => /[\p{L}'’-]/u.test(char);
  let start = Math.min(offset, value.length);
  if (start === value.length && start > 0) start -= 1;
  if (!isLetter(value[start] || '')) {
    if (start > 0 && isLetter(value[start - 1] || '')) start -= 1;
    else return null;
  }
  let end = start + 1;
  while (start > 0 && isLetter(value[start - 1])) start -= 1;
  while (end < value.length && isLetter(value[end])) end += 1;

  const range = document.createRange();
  range.setStart(node, start);
  range.setEnd(node, end);
  return range;
}

function distance(a: string, b: string) {
  const d = Array.from({ length: a.length + 1 }, () => Array<number>(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) d[i][0] = i;
  for (let j = 0; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
  }
  return d[a.length][b.length];
}

function preserveCase(source: string, replacement: string) {
  if (source.toUpperCase() === source) return replacement.toUpperCase();
  if (source[0]?.toUpperCase() === source[0]) return replacement.charAt(0).toUpperCase() + replacement.slice(1);
  return replacement;
}

function suggestionsFor(word: string, dictionary: Set<string>, personal: Set<string>, ignored: Set<string>, autocorrect: Record<string, string>) {
  const normalized = word.toLowerCase();
  if (normalized.length < 3 || dictionary.has(normalized) || personal.has(normalized) || ignored.has(normalized)) return [];
  if (autocorrect[normalized]) return [preserveCase(word, autocorrect[normalized])];
  if (COMMON_CORRECTIONS[normalized]) return COMMON_CORRECTIONS[normalized].map((item) => preserveCase(word, item));

  const max = normalized.length <= 4 ? 1 : 2;
  return COMMON_WORDS
    .filter((candidate) => Math.abs(candidate.length - normalized.length) <= max)
    .map((candidate) => ({ candidate, score: distance(normalized, candidate) }))
    .filter(({ score }) => score <= max)
    .sort((a, b) => a.score - b.score || a.candidate.localeCompare(b.candidate))
    .slice(0, 3)
    .map(({ candidate }) => preserveCase(word, candidate));
}

function replaceRange(range: Range, replacement: string) {
  const editor = getEditor();
  if (!editor) return;
  range.deleteContents();
  const node = document.createTextNode(replacement);
  range.insertNode(node);
  range.setStartAfter(node);
  range.collapse(true);
  const selection = window.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);
  editor.dispatchEvent(new Event('input', { bubbles: true }));
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function SpellingContextMenu() {
  const [menu, setMenu] = useState<SpellMenuState | null>(null);
  const [personal, setPersonal] = useState<Set<string>>(new Set());
  const [ignored, setIgnored] = useState<Set<string>>(new Set());
  const [autocorrect, setAutocorrect] = useState<Record<string, string>>({});
  const menuRef = useRef<HTMLDivElement>(null);
  const dictionary = useMemo(() => new Set(COMMON_WORDS.map((word) => word.toLowerCase())), []);

  useEffect(() => {
    setPersonal(readSet(PERSONAL_KEY));
    setIgnored(readSet(IGNORED_KEY));
    setAutocorrect(readCorrections());
  }, []);

  useEffect(() => {
    const editor = getEditor();
    if (!editor) return;
    const onContextMenu = (event: MouseEvent) => {
      const range = wordRangeAtPoint(editor, event.clientX, event.clientY);
      if (!range) return;
      const word = range.toString().trim();
      const suggestions = suggestionsFor(word, dictionary, personal, ignored, autocorrect);
      if (!suggestions.length) return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
      setMenu({ x: event.clientX, y: event.clientY, word, range: range.cloneRange(), suggestions });
    };
    editor.addEventListener('contextmenu', onContextMenu, true);
    return () => editor.removeEventListener('contextmenu', onContextMenu, true);
  }, [dictionary, personal, ignored, autocorrect]);

  useEffect(() => {
    if (!menu) return;
    const outside = (event: MouseEvent) => { if (!menuRef.current?.contains(event.target as Node)) setMenu(null); };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') setMenu(null); };
    document.addEventListener('mousedown', outside);
    window.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('mousedown', outside);
      window.removeEventListener('keydown', escape);
    };
  }, [menu]);

  useEffect(() => {
    const editor = getEditor();
    if (!editor) return;
    const onInput = (event: Event) => {
      const input = event as InputEvent;
      const boundary = input.inputType === 'insertFromPaste' || input.inputType === 'insertParagraph' || (input.inputType === 'insertText' && Boolean(input.data && /[\s.,!?;:)]/.test(input.data)));
      if (!boundary) return;
      const rules = readCorrections();
      const keys = Object.keys(rules);
      if (!keys.length) return;
      const matcher = new RegExp(`\\b(${keys.map(escapeRegex).join('|')})\\b`, 'gi');
      const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT);
      let node: Node | null;
      while ((node = walker.nextNode())) {
        const textNode = node as Text;
        const current = textNode.nodeValue || '';
        textNode.nodeValue = current.replace(matcher, (match) => preserveCase(match, rules[match.toLowerCase()] || match));
      }
    };
    editor.addEventListener('input', onInput);
    return () => editor.removeEventListener('input', onInput);
  }, []);

  function choose(suggestion: string) {
    if (!menu) return;
    replaceRange(menu.range, suggestion);
    setMenu(null);
  }

  function ignoreAll() {
    if (!menu) return;
    const next = new Set(ignored);
    next.add(menu.word.toLowerCase());
    setIgnored(next);
    writeSet(IGNORED_KEY, next);
    setMenu(null);
  }

  function addToDictionary() {
    if (!menu) return;
    const next = new Set(personal);
    next.add(menu.word.toLowerCase());
    setPersonal(next);
    writeSet(PERSONAL_KEY, next);
    setMenu(null);
  }

  function alwaysCorrect() {
    if (!menu?.suggestions[0]) return;
    const preferred = menu.suggestions[0];
    const next = { ...autocorrect, [menu.word.toLowerCase()]: preferred.toLowerCase() };
    setAutocorrect(next);
    writeCorrections(next);
    replaceRange(menu.range, preferred);
    setMenu(null);
  }

  function openCheck() {
    setMenu(null);
    window.setTimeout(() => {
      const button = Array.from(document.querySelectorAll<HTMLButtonElement>('.docs-toolbar button')).find((item) => (item.getAttribute('aria-label') || '').startsWith('Spelling'));
      button?.click();
    }, 0);
  }

  if (!menu) return null;
  const width = Math.min(350, window.innerWidth - 16);
  const left = Math.max(8, Math.min(menu.x, window.innerWidth - width - 8));
  const top = Math.max(8, Math.min(menu.y, window.innerHeight - 330));
  const preferred = menu.suggestions[0];

  return (
    <>
      <div ref={menuRef} className="fwo-spell-menu" role="menu" style={{ left, top, width }} onMouseDown={(event) => event.preventDefault()}>
        <div className="fwo-spell-title">Did you mean:</div>
        {menu.suggestions.map((suggestion, index) => (
          <button className="fwo-spell-suggestion" type="button" role="menuitem" key={suggestion} onClick={() => choose(suggestion)}>
            {index === 0 ? <Check /> : <span />}
            <strong>{suggestion}</strong>
          </button>
        ))}
        <div className="fwo-spell-divider" />
        <button className="fwo-spell-item" type="button" role="menuitem" onClick={ignoreAll}><span />Ignore all</button>
        <button className="fwo-spell-item" type="button" role="menuitem" onClick={alwaysCorrect}><span />Always correct to “{preferred}”</button>
        <button className="fwo-spell-item" type="button" role="menuitem" onClick={addToDictionary}><span />Add to personal dictionary</button>
        <div className="fwo-spell-divider" />
        <button className="fwo-spell-item" type="button" role="menuitem" onClick={openCheck}><SpellCheck2 /><span>Spelling and grammar check</span></button>
      </div>
      <style jsx global>{`
        .fwo-spell-menu { position:fixed; z-index:7000; max-height:calc(100dvh - 16px); overflow-y:auto; padding:8px 0; border:1px solid #e0e3e7; border-radius:9px; background:#fff; color:#303134; box-shadow:0 8px 24px rgba(60,64,67,.24),0 1px 4px rgba(60,64,67,.16); font:400 14px/1.25 Arial,Helvetica,sans-serif; }
        .fwo-spell-title { padding:8px 40px 7px; color:#5f6368; font-size:13px; font-style:italic; }
        .fwo-spell-suggestion,.fwo-spell-item { width:100%; min-height:35px; border:0; background:transparent; color:#303134; padding:0 14px; display:grid; grid-template-columns:26px minmax(0,1fr); align-items:center; gap:8px; text-align:left; cursor:pointer; }
        .fwo-spell-suggestion:hover,.fwo-spell-item:hover,.fwo-spell-suggestion:focus-visible,.fwo-spell-item:focus-visible { background:#f1f3f4; outline:0; }
        .fwo-spell-suggestion svg,.fwo-spell-item svg { width:17px; height:17px; stroke-width:1.8; color:#5f6368; }
        .fwo-spell-suggestion strong { font-weight:600; color:#202124; }
        .fwo-spell-divider { height:1px; margin:7px 0; background:#dadce0; }
        @media(max-width:560px){ .fwo-spell-menu{font-size:13px}.fwo-spell-suggestion,.fwo-spell-item{min-height:42px;padding:0 12px}.fwo-spell-title{padding-left:46px} }
        @media print{ .fwo-spell-menu{display:none!important} }
      `}</style>
    </>
  );
}
