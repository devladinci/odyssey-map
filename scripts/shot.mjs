// Takes a screenshot of the running dev server with the installed Chrome. For checking the look by eye.
// Usage: node scripts/shot.mjs <out.png> [hash] [width] [height] [scale] [js to run after load] [localStorage as JSON]
import puppeteer from 'puppeteer-core';
const [out, hash = '', w = '1280', h = '800', scale = '1', js = '', ls = '{"odyssey.progress":"25"}'] = process.argv.slice(2);
const base = process.env.SHOT_URL || 'http://localhost:5173/';
const browser = await puppeteer.launch({
  executablePath: process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true, args: ['--ignore-gpu-blocklist', '--enable-unsafe-swiftshader', '--hide-scrollbars'],
});
const page = await browser.newPage();
await page.setViewport({ width: +w, height: +h, deviceScaleFactor: +scale, isMobile: +w < 760, hasTouch: +w < 760 });
await page.evaluateOnNewDocument(v => { for (const [k, x] of Object.entries(JSON.parse(v))) localStorage.setItem(k, x); }, ls);
page.on('console', m => { if (m.type() === 'error' || m.type() === 'warn') console.log('[' + m.type() + ']', m.text().slice(0, 300)); });
page.on('pageerror', e => console.log('[pageerror]', String(e).slice(0, 300)));
await page.goto(base + hash, { waitUntil: 'networkidle0', timeout: 30000 });
const idle = () => page.evaluate(() => new Promise(res => {
  const m = window.odysseyMap; if (!m) return setTimeout(() => res('no map'), 3000);
  const done = () => res('idle'); if (m.loaded() && !m.isMoving()) setTimeout(done, 600); else m.once('idle', () => setTimeout(done, 400));
  setTimeout(() => res('timeout'), 12000);
}));
await new Promise(r => setTimeout(r, 1200));
console.log('map:', await idle());
if (js) { console.log('js:', JSON.stringify(await page.evaluate(js))); await new Promise(r => setTimeout(r, 2600)); console.log('map:', await idle()); }
await page.screenshot({ path: out });
await browser.close();
