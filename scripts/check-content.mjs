// Checks the content pack. Run with: npm run check
// It fails when an id is missing, a language is incomplete, a spoiler tag is broken or a scene does not fit its book.
import fs from 'node:fs';
import path from 'node:path';

const DIR = path.resolve(import.meta.dirname, '..', 'content', 'odyssey');
const json = rel => JSON.parse(fs.readFileSync(path.join(DIR, rel), 'utf8'));
const exists = rel => fs.existsSync(path.join(DIR, rel));
const errors = [], warnings = [];
const err = m => errors.push(m), warn = m => warnings.push(m);
/** Lines in each book of the Odyssey (Greek text, ed. Murray). */
const LINES = [444, 434, 497, 847, 493, 331, 347, 586, 566, 574, 640, 453, 440, 533, 557, 481, 606, 428, 604, 394, 434, 501, 372, 548];

const TAG = /\{\{(\d+)\|([^{}]*)\}\}/g;
function tagsOf(s, where) {
  const nums = [...s.matchAll(TAG)].map(m => +m[1]);
  const rest = s.replace(TAG, '');
  if (/\{\{|\}\}/.test(rest)) err(`${where}: broken spoiler tag`);
  for (const n of nums) if (n < 1 || n > 25) err(`${where}: spoiler book ${n} out of range`);
  return nums;
}
function walk(a, b, where, lang) {
  if (typeof a === 'string') {
    if (typeof b !== 'string') return err(`${where}: missing in ${lang}`);
    const ta = tagsOf(a, 'bg ' + where), tb = tagsOf(b, lang + ' ' + where);
    if (ta.join() !== tb.join()) err(`${where}: spoiler tags differ (bg ${ta.join() || 'none'}, ${lang} ${tb.join() || 'none'})`);
    if (!b.trim() && a.trim()) err(`${where}: empty in ${lang}`);
    if (lang === 'en' && /[а-яА-Я]/.test(b)) warn(`${where}: Cyrillic left in en`);
    return;
  }
  if (Array.isArray(a)) {
    if (!Array.isArray(b) || a.length !== b.length) return err(`${where}: list differs in ${lang}`);
    return a.forEach((x, i) => walk(x, b[i], `${where}[${i}]`, lang));
  }
  if (a && typeof a === 'object') {
    if (!b || typeof b !== 'object') return err(`${where}: missing in ${lang}`);
    for (const k of Object.keys(a)) walk(a[k], b[k], where ? `${where}.${k}` : k, lang);
    for (const k of Object.keys(b)) if (!(k in a)) err(`${where}.${k}: in ${lang} but not in bg`);
  }
}

// 1. every language has the same text as bg
const langs = fs.readdirSync(path.join(DIR, 'text')).filter(l => l !== 'bg' && !l.startsWith('.'));
const files = fs.readdirSync(path.join(DIR, 'text', 'bg')).filter(f => f.endsWith('.json'));
for (const f of files) {
  const bg = json(`text/bg/${f}`);
  walk(bg, bg, f, 'bg');
  for (const lang of langs) {
    if (!exists(`text/${lang}/${f}`)) { err(`text/${lang}/${f} is missing`); continue; }
    walk(bg, json(`text/${lang}/${f}`), f, lang);
  }
}

// 2. ids: data and text agree, and every link points at something real
const T = Object.fromEntries(files.map(f => [f.replace('.json', ''), json(`text/bg/${f}`)]));
const places = json('places.json'), events = json('events.json'), routes = json('routes.json'), digs = json('digs.json');
const themes = json('themes.json'), books = json('books.json');
const ids = new Set();
const add = (list, text, kind) => list.forEach(x => {
  if (ids.has(x.id)) err(`duplicate id ${x.id}`); ids.add(x.id);
  if (text && !(x.id in text)) err(`${kind} ${x.id} has no text`);
});
const unused = (text, list, kind) => { const have = new Set(list.map(x => x.id)); for (const k of Object.keys(text || {})) if (!have.has(k)) err(`${kind} text ${k} has no data`); };
add(places, T.places, 'place'); add(events, T.story.events, 'event'); add(routes, T.story.routes, 'route'); add(digs, T.extra.digs, 'dig');
unused(T.places, places, 'place'); unused(T.story.events, events, 'event'); unused(T.story.routes, routes, 'route'); unused(T.extra.digs, digs, 'dig');
for (const th of themes) {
  if (!T.themes[th.id]) err(`theme ${th.id} has no text`);
  add(th.items || [], T.themes[th.id]?.items, 'theme item'); add(th.lines || [], T.themes[th.id]?.lines, 'theme line');
  unused(T.themes[th.id]?.items, th.items || [], 'theme item'); unused(T.themes[th.id]?.lines, th.lines || [], 'theme line');
}
for (const id of Object.keys(T.extra.digNotes)) if (!places.some(p => p.id === id)) err(`dig note for unknown place ${id}`);
for (const b of books) for (const id of b.at) if (!ids.has(id)) err(`book ${b.book}: unknown id ${id}`);
for (let b = 1; b <= 24; b++) if (!T.story.books[b]) err(`book ${b} has no title and summary`);
for (const o of json('overlays.json')) if (!T.story.overlays[o.id]) err(`overlay ${o.id} has no text`);
for (const r of json('regions.json')) if (!T.story.regions[r.id]) err(`region ${r.id} has no name`);
// the map sheet, with a margin for arrows that point off it
const inRange = (x, where) => { if (!(x.lat > 27 && x.lat < 48 && x.lon > -11 && x.lon < 39)) err(`${where}: coordinates look wrong`); };
[...places, ...events, ...digs].forEach(x => inRange(x, x.id));
for (const th of themes) for (const it of th.items || []) inRange(it, it.id);
for (const p of places) {
  for (const r of p.refs) { if (!(r.b >= 1 && r.b <= 24)) err(`${p.id}: bad book in reference`); else if (!r.il && (r.from > LINES[r.b - 1] || r.to > LINES[r.b - 1] || r.to < r.from)) err(`${p.id}: reference ${r.b}.${r.from}–${r.to} is outside the book`); }
  for (const a of p.alts || []) inRange(a, p.id + ' alt');
  if ((p.alts || []).length !== (T.places[p.id]?.alts || []).length) err(`${p.id}: ${(p.alts || []).length} other locations in the data, ${(T.places[p.id]?.alts || []).length} names in the text`);
  if (p.reveals && !(p.reveals >= 1 && p.reveals <= 25)) err(`${p.id}: bad "reveals"`);
  if (!['home', 'wander', 'story', 'water'].includes(p.side)) err(`${p.id}: unknown side ${p.side}`);
}
for (const e of events) for (const b of e.books) if (!(b >= 1 && b <= 24)) err(`${e.id}: bad book`);
for (const r of routes) { if (!r.books.length) err(`${r.id}: no books`); for (const pt of r.pts) inRange({ lon: pt[0], lat: pt[1] }, r.id); }

// 3. scenes: every book is covered from its first line to its last, with no gaps
const scenes = json('scenes.json');
{
  const seen = new Set();
  for (const s of scenes) {
    const w = `scene ${s.id}`;
    if (seen.has(s.id)) err(`${w}: duplicate`); seen.add(s.id);
    if (!T.scenes?.scenes?.[s.id]) err(`${w}: no text`);
    if (!(s.book >= 1 && s.book <= 24) || !String(s.id).startsWith(s.book + '.')) err(`${w}: id and book disagree`);
    if (!(s.from >= 1 && s.to >= s.from)) err(`${w}: bad line range`);
    const own = new Set((s.points || []).map(p => p.id));
    for (const p of s.points || []) { inRange(p, `${w} point ${p.id}`); if (!T.scenes?.points?.[p.id]) err(`${w}: point ${p.id} has no name`); if (ids.has(p.id)) err(`${w}: point ${p.id} is also a place`); }
    for (const id of [...(s.at || []), ...(s.mentions || [])]) {
      if (!ids.has(id) && !own.has(id)) err(`${w}: unknown id ${id}`);
      // a place that is still hidden in this book must not be listed in the scene
      const p = places.find(x => x.id === id); if (p?.reveals > s.book) err(`${w}: ${id} is hidden until Book ${p.reveals}`);
      const e = events.find(x => x.id === id); if (e && Math.min(...e.books) > s.book) err(`${w}: ${id} is hidden until Book ${Math.min(...e.books)}`);
    }
    if (!s.view || !Array.isArray(s.view.center)) err(`${w}: no view`);
    else inRange({ lon: s.view.center[0], lat: s.view.center[1] }, `${w} view`);
    for (const pt of s.path?.pts || []) inRange({ lon: pt[0], lat: pt[1] }, `${w} path`);
  }
  for (const id of Object.keys(T.scenes?.scenes || {})) if (!seen.has(id)) err(`scene text ${id} has no data`);
  for (let b = 1; b <= 24; b++) {
    const list = scenes.filter(s => s.book === b);
    if (!list.length) { warn(`book ${b}: no scenes yet`); continue; }
    list.forEach((s, i) => { if (s.id !== `${b}.${i + 1}`) err(`book ${b}: scene ${s.id} is out of order`); });
    if (list[0].from !== 1) err(`book ${b}: the first scene does not start at line 1`);
    for (let i = 1; i < list.length; i++) if (list[i].from !== list[i - 1].to + 1) err(`book ${b}: gap or overlap between ${list[i - 1].id} and ${list[i].id}`);
    if (list[list.length - 1].to !== LINES[b - 1]) err(`book ${b}: the last scene does not end at line ${LINES[b - 1]}`);
  }
}

// 4. reading aids
const N = T.reader?.names || {};
const people = json('people.json');
for (const g of people.gods) { if (!N[g.id]) err(`god ${g.id}: no name`); if (!T.reader.gods[g.id]) err(`god ${g.id}: no text`); }
const treeNames = n => [n.n, n.w, ...(n.c || []).flatMap(treeNames)].filter(Boolean);
for (const f of people.families) {
  if (!T.reader.families[f.id]) err(`family ${f.id}: no text`);
  for (const k of treeNames(f.tree)) if (!N[k]) err(`family ${f.id}: no name for ${k}`);
  const ats = n => [n.at, ...(n.c || []).flatMap(ats)].filter(Boolean);
  for (const id of ats(f.tree)) if (!ids.has(id)) err(`family ${f.id}: unknown place ${id}`);
}
for (const h of json('heroes.json')) {
  if (!ids.has(h.home)) err(`person ${h.id}: unknown home ${h.home}`);
  for (const k of [h.id, h.father, h.mother, ...(h.patrons || [])].filter(Boolean)) if (!N[k]) err(`person ${h.id}: no name for ${k}`);
  if (!T.reader?.heroes?.[h.id]) err(`person ${h.id}: no text`);
  if (h.family && !people.families.some(f => f.id === h.family)) err(`person ${h.id}: unknown family ${h.family}`);
}
{
  // the days of the poem: every line of every book belongs to exactly one block of days
  const days = json('days.json');
  for (const d of days) if (!T.reader?.days?.[d.id]) err(`day block ${d.id}: no label`);
  for (let b = 1; b <= 24; b++) {
    const parts = days.flatMap(d => d.parts).filter(p => p[0] === b).sort((x, y) => x[1] - y[1]);
    let at = 1;
    for (const p of parts) { if (p[1] !== at) err(`days: Book ${b} has a gap or an overlap at line ${at}`); at = p[2] + 1; }
    if (at !== LINES[b - 1] + 1) err(`days: Book ${b} is not covered to its last line`);
  }
}
for (const m of json('modern.json')) { inRange(m, 'modern ' + m.id); if (!T.reader?.modern?.[m.id]) err(`modern ${m.id}: no name`); }

for (const w of warnings) console.log('warning:', w);
for (const e of errors) console.log('ERROR:', e);
console.log(`${places.length} places, ${scenes.length} scenes; ${errors.length} errors, ${warnings.length} warnings; languages: bg, ${langs.join(', ') || '(none yet)'}`);
process.exit(errors.length ? 1 : 0);
