import { chromium } from 'playwright';

const url = process.env.WORD_COMPATIBILITY_URL || 'http://127.0.0.1:4173/word-online/qa/word-compatibility/';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

try {
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  const runButton = page.getByRole('button', { name: /Run 20-case compatibility suite/i });
  await runButton.click();

  await page.waitForFunction(() => {
    const rows = document.querySelectorAll('.fwo-qa-table tbody tr');
    const button = document.querySelector('.fwo-qa-actions button');
    return rows.length === 20 && button && !button.hasAttribute('disabled');
  }, { timeout: 180000 });

  const summary = (await page.locator('.fwo-qa-summary').textContent())?.trim() || '';
  const rows = await page.locator('.fwo-qa-table tbody tr').evaluateAll((elements) => elements.map((row) => {
    const cells = Array.from(row.querySelectorAll('td')).map((cell) => cell.textContent?.trim() || '');
    return { case: cells[0], scenario: cells[1], result: cells[2], details: cells[3] };
  }));

  console.log(`Word compatibility gate: ${summary}`);
  for (const row of rows) console.log(`${row.case} ${row.result} ${row.scenario} — ${row.details}`);

  const match = summary.match(/(\d+)\/(\d+) passed · (\d+)%/);
  if (!match) throw new Error(`Could not parse QA summary: ${summary}`);

  const passed = Number(match[1]);
  const total = Number(match[2]);
  const rate = Number(match[3]);
  if (total !== 20) throw new Error(`Expected 20 QA cases, received ${total}`);
  if (rate < 95) {
    const failures = rows.filter((row) => row.result !== 'PASS');
    throw new Error(`Compatibility gate failed at ${passed}/${total} (${rate}%). Failures: ${failures.map((row) => `${row.case} ${row.scenario}`).join(', ')}`);
  }
} finally {
  await browser.close();
}
