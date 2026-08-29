'use client';

import { useEffect } from 'react';

const EXTRA_FONTS = [
  'Arial Black',
  'Arial Narrow',
  'Aptos',
  'Book Antiqua',
  'Bookman Old Style',
  'Cambria',
  'Candara',
  'Century Gothic',
  'Comfortaa',
  'Comic Sans MS',
  'Consolas',
  'EB Garamond',
  'Franklin Gothic Medium',
  'Garamond',
  'Gill Sans',
  'Helvetica',
  'Impact',
  'Lexend',
  'Lobster',
  'Lora',
  'Lucida Console',
  'Lucida Sans Unicode',
  'Merriweather',
  'Montserrat',
  'Nunito',
  'Oswald',
  'Pacifico',
  'Palatino Linotype',
  'Playfair Display',
  'Roboto',
  'Segoe UI',
  'Tahoma',
  'Trebuchet MS',
] as const;

function addFontOptions(select: HTMLSelectElement) {
  const existing = new Set(Array.from(select.options).map((option) => option.value));

  EXTRA_FONTS.forEach((font) => {
    if (existing.has(font)) return;
    const option = document.createElement('option');
    option.value = font;
    option.textContent = font;
    select.appendChild(option);
  });
}

export function FontMenuEnhancer() {
  useEffect(() => {
    const select = document.querySelector<HTMLSelectElement>('.docs-font-select');
    if (!select || document.querySelector('.fwo-font-wrap')) return;

    addFontOptions(select);
    select.style.display = 'none';

    const wrap = document.createElement('div');
    wrap.className = 'fwo-font-wrap';

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'fwo-font-trigger';
    trigger.setAttribute('aria-haspopup', 'menu');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.innerHTML = `<span class="fwo-font-label">${select.value || 'Arial'}</span><span class="fwo-font-caret">▾</span>`;

    const menu = document.createElement('div');
    menu.className = 'fwo-font-menu';
    menu.setAttribute('role', 'menu');
    menu.setAttribute('aria-label', 'Font family');
    menu.hidden = true;

    const searchWrap = document.createElement('div');
    searchWrap.className = 'fwo-font-search-wrap';
    const search = document.createElement('input');
    search.className = 'fwo-font-search';
    search.type = 'search';
    search.placeholder = 'Search fonts';
    search.setAttribute('aria-label', 'Search fonts');
    searchWrap.appendChild(search);

    const list = document.createElement('div');
    list.className = 'fwo-font-list';
    menu.appendChild(searchWrap);
    menu.appendChild(list);
    document.body.appendChild(menu);

    const allFonts = () => Array.from(select.options).map((option) => option.value).filter(Boolean);

    const positionMenu = () => {
      const rect = trigger.getBoundingClientRect();
      const gap = 6;
      const edge = 8;
      const preferredWidth = 250;
      const width = Math.min(preferredWidth, Math.max(180, window.innerWidth - edge * 2));
      const left = Math.min(Math.max(edge, rect.left), Math.max(edge, window.innerWidth - width - edge));
      const top = Math.max(edge, rect.bottom + gap);
      const availableHeight = Math.max(150, window.innerHeight - top - edge);

      menu.style.left = `${left}px`;
      menu.style.top = `${top}px`;
      menu.style.width = `${width}px`;
      menu.style.maxHeight = `${Math.min(440, availableHeight)}px`;
    };

    const renderFonts = (query: string) => {
      const clean = query.trim().toLowerCase();
      const fonts = allFonts().filter((font) => !clean || font.toLowerCase().includes(clean));
      list.replaceChildren();

      if (!fonts.length) {
        const empty = document.createElement('div');
        empty.className = 'fwo-font-empty';
        empty.textContent = 'No fonts found';
        list.appendChild(empty);
        return;
      }

      fonts.forEach((font) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'fwo-font-item';
        button.setAttribute('role', 'menuitem');
        button.dataset.selected = String(font === select.value);
        button.innerHTML = `<span class="fwo-font-check">${font === select.value ? '✓' : ''}</span><span class="fwo-font-name"></span>`;
        const name = button.querySelector<HTMLElement>('.fwo-font-name');
        if (name) {
          name.textContent = font;
          name.style.fontFamily = `"${font}", Arial, sans-serif`;
        }
        button.addEventListener('mousedown', (event) => event.preventDefault());
        button.addEventListener('click', () => chooseFont(font));
        list.appendChild(button);
      });
    };

    const closeMenu = () => {
      if (menu.hidden) return;
      menu.hidden = true;
      trigger.setAttribute('aria-expanded', 'false');
      search.value = '';
      renderFonts('');
    };

    const chooseFont = (font: string) => {
      select.value = font;
      select.dispatchEvent(new Event('change', { bubbles: true }));
      (trigger.querySelector('.fwo-font-label') as HTMLElement).textContent = font;
      closeMenu();
      document.querySelector<HTMLElement>('.editor-page')?.focus({ preventScroll: true });
    };

    renderFonts('');

    trigger.addEventListener('mousedown', (event) => event.preventDefault());
    trigger.addEventListener('click', () => {
      const opening = menu.hidden;
      if (!opening) {
        closeMenu();
        return;
      }
      renderFonts('');
      positionMenu();
      menu.hidden = false;
      trigger.setAttribute('aria-expanded', 'true');
      window.setTimeout(() => search.focus({ preventScroll: true }), 0);
    });

    search.addEventListener('input', () => renderFonts(search.value));
    search.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeMenu();
        trigger.focus();
      }
    });

    const onSelectChange = () => {
      (trigger.querySelector('.fwo-font-label') as HTMLElement).textContent = select.value || 'Arial';
      if (!menu.hidden) renderFonts(search.value);
    };

    const closeOutside = (event: MouseEvent) => {
      if (menu.hidden) return;
      const target = event.target as Node;
      if (!wrap.contains(target) && !menu.contains(target)) closeMenu();
    };

    const repositionOpenMenu = () => {
      if (!menu.hidden) positionMenu();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !menu.hidden) {
        event.preventDefault();
        closeMenu();
        trigger.focus();
      }
    };

    select.addEventListener('change', onSelectChange);
    document.addEventListener('mousedown', closeOutside);
    window.addEventListener('resize', repositionOpenMenu);
    window.addEventListener('scroll', repositionOpenMenu, true);
    window.addEventListener('keydown', onKeyDown);

    wrap.appendChild(trigger);
    select.parentElement?.insertBefore(wrap, select);

    const style = document.createElement('style');
    style.dataset.fwoFontMenu = 'true';
    style.textContent = `
      .fwo-font-wrap { position: relative; flex: 0 0 auto; min-width: 0; font-family: Arial, Helvetica, sans-serif; }
      .fwo-font-trigger { height: 28px; min-width: 100px; max-width: 132px; padding: 0 8px 0 10px; border: 0; border-radius: 6px; background: transparent; color: #3c4043; display: flex; align-items: center; justify-content: space-between; gap: 9px; font-size: 13px; cursor: pointer; }
      .fwo-font-trigger:hover, .fwo-font-trigger[aria-expanded='true'] { background: #e8eaed; }
      .fwo-font-label { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .fwo-font-caret { font-size: 10px; color: #5f6368; flex: 0 0 auto; }
      .fwo-font-menu { position: fixed; z-index: 8000; box-sizing: border-box; display: grid; grid-template-rows: auto minmax(0, 1fr); overflow: hidden; background: #fff; border: 1px solid #dadce0; border-radius: 10px; box-shadow: 0 8px 24px rgba(60,64,67,.24), 0 2px 6px rgba(60,64,67,.12); font-family: Arial, Helvetica, sans-serif; }
      .fwo-font-menu[hidden] { display: none !important; }
      .fwo-font-search-wrap { position: sticky; top: 0; z-index: 2; padding: 8px; background: #fff; border-bottom: 1px solid #edf0f2; }
      .fwo-font-search { width: 100%; height: 34px; box-sizing: border-box; border: 1px solid #c9cdd2; border-radius: 8px; outline: 0; padding: 0 10px; background: #f8fafd; color: #202124; font: 400 13px/1 Arial, Helvetica, sans-serif; }
      .fwo-font-search:focus { border-color: #0b57d0; background: #fff; box-shadow: 0 0 0 2px rgba(11,87,208,.12); }
      .fwo-font-list { min-height: 0; overflow-y: auto; overscroll-behavior: contain; scrollbar-gutter: stable; padding: 5px; }
      .fwo-font-item { width: 100%; min-height: 36px; padding: 5px 9px; border: 0; border-radius: 7px; background: transparent; color: #202124; display: grid; grid-template-columns: 18px minmax(0,1fr); align-items: center; gap: 7px; text-align: left; cursor: pointer; }
      .fwo-font-item:hover, .fwo-font-item:focus-visible { background: #f1f3f4; outline: 0; }
      .fwo-font-item[data-selected='true'] { background: #eef3fb; color: #0b57d0; }
      .fwo-font-check { width: 18px; font: 700 13px/1 Arial, Helvetica, sans-serif; }
      .fwo-font-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 15px; }
      .fwo-font-empty { padding: 18px 12px; color: #6b7280; text-align: center; font-size: 12px; }
      .fwo-font-list::-webkit-scrollbar { width: 10px; }
      .fwo-font-list::-webkit-scrollbar-thumb { background: #c4c7c5; border: 3px solid #fff; border-radius: 10px; }
      @media (max-width: 850px) {
        .fwo-font-trigger { min-width: 82px; max-width: 104px; padding-left: 8px; }
        .fwo-font-item { min-height: 40px; }
      }
      @media (max-width: 480px) {
        .fwo-font-trigger { min-width: 72px; max-width: 88px; font-size: 12px; }
        .fwo-font-search { height: 38px; font-size: 16px; }
      }
    `;
    document.head.appendChild(style);

    return () => {
      select.removeEventListener('change', onSelectChange);
      document.removeEventListener('mousedown', closeOutside);
      window.removeEventListener('resize', repositionOpenMenu);
      window.removeEventListener('scroll', repositionOpenMenu, true);
      window.removeEventListener('keydown', onKeyDown);
      wrap.remove();
      menu.remove();
      style.remove();
      select.style.display = '';
    };
  }, []);

  return null;
}
