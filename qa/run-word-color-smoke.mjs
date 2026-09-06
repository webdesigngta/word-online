import { chromium } from 'playwright';

const url = process.env.WORD_EDITOR_QA_URL || 'http://127.0.0.1:4173/word-online/word-online/';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });

try {
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForSelector('.editor-page[contenteditable="true"]');

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
  });

  await page.locator('.fwo-color-button[data-kind="text"]').click();
  await page.waitForSelector('.fwo-color-palette');
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

  console.log('Word color smoke passed', { textResult, highlightResult });
} finally {
  await browser.close();
}
