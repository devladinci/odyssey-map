// Walks through every scene of every book in both languages, opens every card, theme and panel,
// tries the search, and fails on any page error or empty panel.
// Needs the dev server running. Usage: node scripts/smoke.mjs
import puppeteer from 'puppeteer-core';
const base = process.env.SHOT_URL || 'http://localhost:5173/';
const browser = await puppeteer.launch({ executablePath: process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args: ['--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] });
const problems = [];
for (const lang of ['bg', 'en']) {
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.evaluateOnNewDocument(() => { localStorage.setItem('odyssey.progress', '25'); });
  page.on('pageerror', e => problems.push(`${lang}: ${e}`));
  page.on('console', m => { if (m.type() === 'error') problems.push(`${lang} console: ${m.text()}`); });
  await page.goto(`${base}#l=${lang}&b=1&s=1`, { waitUntil: 'networkidle0' });
  await page.waitForFunction(() => window.odysseyMap && document.querySelector('.stepper'), { timeout: 20000 });
  let steps = 0, empty = 0, lastHash = '';
  for (;;) {
    const state = await page.evaluate(() => ({ hash: location.hash, title: document.querySelector('.scene h3')?.textContent || '', text: document.querySelector('.scene p')?.textContent || '', next: !!document.querySelector('.stepper .btn.primary') }));
    if (!state.title || state.text.length < 40) { empty++; problems.push(`${lang}: thin scene at ${state.hash}`); }
    steps++;
    if (state.hash === lastHash && /b=24/.test(state.hash)) break;       // the last scene of Book 24 has no next one
    lastHash = state.hash;
    if (steps > 320) break;
    await page.evaluate(() => { const b = document.querySelector('.stepper .btn.primary'); b && b.click(); });
    await new Promise(r => setTimeout(r, 60));
    // moving on to the next book lands on its overview: start its first scene
    await page.evaluate(() => { if (!document.querySelector('.scene')) { const s = document.querySelector('.actions .btn.primary'); s && s.click(); } });
    await new Promise(r => setTimeout(r, 60));
  }
  console.log(lang, 'scenes visited:', steps, 'thin:', empty, 'ended at', await page.evaluate(() => location.hash));

  // Every card, theme and panel must open without an error and with something in it.
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const filled = () => page.evaluate(() => (document.querySelector('.sheet-body')?.textContent || '').trim().length > 20);
  const ids = await page.evaluate(() => { const A = window.odysseyApp; return { items: [...Object.keys(A.ITEMS), ...A.HEROES.map(h => 'hero:' + h.id)], themes: A.THEMES.map(t => t.id) }; });
  await page.evaluate(() => window.odysseyApp.S.closeBook());
  for (const id of ids.items) {
    await page.evaluate(i => window.odysseyApp.S.openItem(i), id); await sleep(12);
    if (!(await filled())) problems.push(`${lang}: empty card for ${id}`);
  }
  for (const id of ids.themes) {
    await page.evaluate(i => window.odysseyApp.S.openTheme(i), id); await sleep(40);
    if (!(await filled())) problems.push(`${lang}: empty theme ${id}`);
    for (let n = 0; n < 12; n++) {                                  // a tour: step through its stops
      const more = await page.evaluate(() => { const b = document.querySelector('.scene .stepper .btn.primary'); if (!b || b.disabled) return false; b.click(); return true; });
      if (!more) break; await sleep(25);
    }
  }
  for (const name of ['heroes', 'legend', 'themes', 'books', 'intro']) {
    await page.evaluate(n => { const A = window.odysseyApp.S; A.closeTheme(); A.sel.value = null; A.panel.value = n; }, name); await sleep(40);
    if (!(await filled())) problems.push(`${lang}: empty panel ${name}`);
    if (name === 'heroes') for (const tab of [1, 2, 0]) { await page.evaluate(k => document.querySelectorAll('.seg button')[k]?.click(), tab); await sleep(30); if (!(await filled())) problems.push(`${lang}: empty people tab ${tab}`); }
  }
  await page.evaluate(() => { window.odysseyApp.S.searchOpen.value = true; }); await sleep(600);
  let found = 0;
  for (const q of ['Odysseus', 'Одисей', 'Circe', 'Кирка', 'Итака']) {
    await page.evaluate(v => { const i = document.querySelector('.search input'); if (!i) return; Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(i, v); i.dispatchEvent(new Event('input', { bubbles: true })); }, q);
    await sleep(120); found += await page.evaluate(() => document.querySelectorAll('.search-res .row').length);
  }
  if (!found) problems.push(`${lang}: search finds nothing`);
  console.log(lang, 'cards opened:', ids.items.length, 'themes:', ids.themes.length, 'search results:', found);
  await page.close();
}
await browser.close();
for (const p of problems.slice(0, 20)) console.log('PROBLEM', p);
console.log(problems.length ? `${problems.length} problems` : 'no problems');
process.exit(problems.length ? 1 : 0);
