import { chromium } from 'playwright';

const url = process.env.WORD_EDITOR_QA_URL || 'http://127.0.0.1:4173/word-online/word-online/';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });

try {
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForSelector('.editor-page[contenteditable="true"]');
  await page.waitForSelector('.fwo-color-button[data-kind="text"] > .fwo-color-indicator');
  await page.waitForSelector('.fwo-color-button[data-kind="highlight"] > .fwo-color-indicator');

  const visualState = await page.evaluate(() => Array.from(document.querySelectorAll('.fwo-color-button')).map((button) => {
    const glyph = button.querySelector(':scope > .fwo-color-glyph');
    const indicator = button.querySelector(':scope > .fwo-color-indicator');
    const rect = indicator?.getBoundingClientRect();
    const buttonRect = button.getBoundingClientRect();
    const glyphStyle = glyph ? getComputedStyle(glyph) : null;
    return {
      kind: button.dataset.kind,
      glyphs: button.querySelectorAll(':scope > .fwo-color-glyph').length,
      indicators: button.querySelectorAll(':scope > .fwo-color-indicator').length,
      beforeContent: getComputedStyle(button, '::before').content,
      afterContent: getComputedStyle(button, '::after').content,
      indicatorWidth: rect?.width || 0,
      indicatorHeight: rect?.height || 0,
      indicatorBottom: rect ? Math.round((buttonRect.bottom - rect.bottom) * 10) / 10 : -1,
      glyphColor: glyphStyle?.color || '',
      glyphOpacity: glyphStyle?.opacity || '',
    };
  }));

  if (visualState.length !== 2) throw new Error(`Expected two color toolbar buttons: ${JSON.stringify(visualState)}`);
  if (visualState.some((item) => item.glyphs !== 1 || item.indicators !== 1)) {
    throw new Error(`Color controls contain duplicate visual layers: ${JSON.stringify(visualState)}`);
  }
  if (visualState.some((item) => item.beforeContent !== 'none' || item.afterContent !== 'none')) {
    throw new Error(`Legacy pseudo-element color layers are still visible: ${JSON.stringify(visualState)}`);
  }
  if (visualState.some((item) => Math.abs(item.indicatorHeight - 3) > 0.2 || Math.abs(item.indicatorWidth - 18) > 0.5 || Math.abs(item.indicatorBottom - 2) > 0.5)) {
    throw new Error(`Color swatch bars are not consistently aligned: ${JSON.stringify(visualState)}`);
  }
  if (visualState.some((item) => item.glyphColor !== 'rgb(60, 64, 67)' || item.glyphOpacity !== '1')) {
    throw new Error(`Color toolbar glyph is faint or incorrectly colored: ${JSON.stringify(visualState)}`);
  }

  await page.evaluate(() => {
    const editor = document.querySelector('.editor-page[contenteditable="true"]');
    editor.innerHTML = '<p id="qa-line">Color smoke test</p>';
    const text = document.querySelector('#qa-line').firstChild;
    const range = document.createRange();
    range.setStart(text, 0);
    range.setEnd(text, 5);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    editor.dispatchEvent(new Event('input', { bubbles: true }));

    document.querySelectorAll('.docs-toolbar input[type="color"]').forEach((input) => {
      input.dataset.qaNativeClicks = '0';
      input.addEventListener('click', () => {
        input.dataset.qaNativeClicks = String(Number(input.dataset.qaNativeClicks || '0') + 1);
      });
    });
  });

  const nativeState = await page.evaluate(() => Array.from(document.querySelectorAll('.docs-toolbar input[type="color"]')).map((input) => ({
    label: input.getAttribute('aria-label'),
    disabled: input.disabled,
    tabIndex: input.tabIndex,
    display: getComputedStyle(input).display,
  })));
  if (nativeState.length !== 2 || nativeState.some((item) => !item.disabled || item.tabIndex !== -1 || item.display !== 'none')) {
    throw new Error(`Native toolbar color controls are still active: ${JSON.stringify(nativeState)}`);
  }

  await page.locator('.fwo-color-button[data-kind="text"]').click();
  await page.waitForSelector('.fwo-color-palette');

  const textOpenState = await page.evaluate(() => ({
    palettes: document.querySelectorAll('.fwo-color-palette').length,
    nativeClicks: Array.from(document.querySelectorAll('.docs-toolbar input[type="color"]')).map((input) => Number(input.dataset.qaNativeClicks || '0')),
  }));
  if (textOpenState.palettes !== 1 || textOpenState.nativeClicks.some((count) => count !== 0)) {
    throw new Error(`Text color opened duplicate/native UI: ${JSON.stringify(textOpenState)}`);
  }

  await page.locator('.fwo-color-swatch[title="#d93025"]').click();

  const textResult = await page.evaluate(() => {
    const line = document.querySelector('#qa-line');
    const fragment = line?.querySelector('[data-fwo-color-fragment="true"]');
    if (!fragment) return { ok: false, reason: 'no text color fragment', html: line?.innerHTML || '' };
    const style = getComputedStyle(fragment);
    return { ok: style.color === 'rgb(217, 48, 37)', color: style.color, html: line.innerHTML };
  });
  if (!textResult.ok) throw new Error(`Text color failed: ${JSON.stringify(textResult)}`);

  await page.locator('.fwo-color-button[data-kind="highlight"]').click();
  await page.waitForSelector('.fwo-color-palette');

  const highlightOpenState = await page.evaluate(() => ({
    palettes: document.querySelectorAll('.fwo-color-palette').length,
    nativeClicks: Array.from(document.querySelectorAll('.docs-toolbar input[type="color"]')).map((input) => Number(input.dataset.qaNativeClicks || '0')),
  }));
  if (highlightOpenState.palettes !== 1 || highlightOpenState.nativeClicks.some((count) => count !== 0)) {
    throw new Error(`Highlight opened duplicate/native UI: ${JSON.stringify(highlightOpenState)}`);
  }

  await page.locator('.fwo-color-swatch[title="#fff475"]').click();

  const highlightResult = await page.evaluate(() => {
    const line = document.querySelector('#qa-line');
    const fragments = Array.from(line?.querySelectorAll('[data-fwo-color-fragment="true"]') || []);
    const hit = fragments.find((fragment) => getComputedStyle(fragment).backgroundColor !== 'rgba(0, 0, 0, 0)');
    if (!hit) return { ok: false, reason: 'no highlighted fragment', html: line?.innerHTML || '' };
    const style = getComputedStyle(hit);
    return { ok: style.backgroundColor === 'rgb(255, 244, 117)', backgroundColor: style.backgroundColor, html: line.innerHTML };
  });
  if (!highlightResult.ok) throw new Error(`Highlight failed: ${JSON.stringify(highlightResult)}`);

  await page.waitForSelector('button.fwo-clear-document-button');
  const clearButtonCount = await page.locator('button.fwo-clear-document-button').count();
  if (clearButtonCount !== 1) throw new Error(`Expected one Clear document button, found ${clearButtonCount}`);

  await page.evaluate(() => {
    const editor = document.querySelector('.editor-page[contenteditable="true"]');
    editor.innerHTML = '<p id="qa-indent-one">Indented paragraph</p><p id="qa-indent-two">Second paragraph</p>';
    const text = document.querySelector('#qa-indent-one').firstChild;
    const range = document.createRange();
    range.setStart(text, 0);
    range.setEnd(text, text.textContent.length);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    editor.dispatchEvent(new Event('input', { bubbles: true }));
  });

  await page.locator('.docs-toolbar button[aria-label="Increase indent"]').click();
  const increasedIndent = await page.evaluate(() => Number.parseFloat(getComputedStyle(document.querySelector('#qa-indent-one')).marginLeft) || 0);
  if (increasedIndent < 35 || increasedIndent > 37) {
    throw new Error(`Increase indent failed: ${increasedIndent}px`);
  }

  await page.locator('.docs-toolbar button[aria-label="Decrease indent"]').click();
  const decreasedIndent = await page.evaluate(() => Number.parseFloat(getComputedStyle(document.querySelector('#qa-indent-one')).marginLeft) || 0);
  if (decreasedIndent > 0.5) {
    throw new Error(`Decrease indent failed: ${decreasedIndent}px`);
  }

  page.once('dialog', async (dialog) => {
    if (dialog.type() !== 'confirm') throw new Error(`Unexpected clear document dialog type: ${dialog.type()}`);
    await dialog.accept();
  });
  await page.locator('button.fwo-clear-document-button').click();

  const clearResult = await page.evaluate(() => {
    const editor = document.querySelector('.editor-page[contenteditable="true"]');
    return {
      text: editor.innerText.trim(),
      paragraphs: editor.querySelectorAll(':scope > p').length,
      html: editor.innerHTML,
    };
  });
  if (clearResult.text !== '' || clearResult.paragraphs !== 1) {
    throw new Error(`Clear document failed: ${JSON.stringify(clearResult)}`);
  }

  console.log('Word editor smoke passed', {
    visualState,
    nativeState,
    textOpenState,
    highlightOpenState,
    textResult,
    highlightResult,
    increasedIndent,
    decreasedIndent,
    clearResult,
  });
} finally {
  await browser.close();
}
