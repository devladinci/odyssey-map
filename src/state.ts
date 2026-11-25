// Everything the app remembers: language, reading progress, what is open. Kept in the address and in local storage.
import { effect, signal } from '@preact/signals';
import type { Lang, Texts } from './types';
import { ITEMS, THEME, loadTexts, scenesOf } from './content';

export type Panel = 'none' | 'intro' | 'onboard' | 'item' | 'book' | 'books' | 'themes' | 'theme' | 'heroes' | 'legend';
export type ViewName = 'ithaca' | 'greece' | 'all';
export const WHOLE_POEM = 25;

const store = {
  get(k: string): string | null { try { return localStorage.getItem('odyssey.' + k); } catch { return null; } },
  set(k: string, v: string | null) { try { v === null ? localStorage.removeItem('odyssey.' + k) : localStorage.setItem('odyssey.' + k, v); } catch { /* private mode */ } },
};
const hash = new URLSearchParams(location.hash.slice(1));
const num = (s: string | null) => (s && /^\d+$/.test(s) ? +s : null);

function firstLang(): Lang {
  const h = hash.get('l') || store.get('lang');
  return h === 'bg' || h === 'en' ? h : 'en';
}
const firstProgress = () => { const p = num(store.get('progress')); return p && p >= 1 && p <= WHOLE_POEM ? p : null; };
const firstBook = () => { const b = num(hash.get('b')); return b && b >= 1 && b <= 24 ? b : null; };
const firstTheme = () => { const t = hash.get('t'); return t && THEME[t] ? t : null; };
const firstSel = () => { const i = hash.get('i'); return i && (ITEMS[i] || /^(ov|plan|hero):/.test(i)) ? i : null; };

export const lang = signal<Lang>(firstLang());
export const texts = signal<Texts | null>(null);
/** How far the reader has read: 1–24, or 25 for the whole poem. null until they say. */
export const progress = signal<number | null>(firstProgress());
export const book = signal<number | null>(firstBook());
/** Index of the open scene in the open book. -1 shows the book overview. */
export const sceneIx = signal<number>(firstBook() ? Math.max(-1, (num(hash.get('s')) ?? 0) - 1) : -1);
export const theme = signal<string | null>(firstBook() ? null : firstTheme());
export const sel = signal<string | null>(firstSel());
export const panel = signal<Panel>(sel.value ? 'item' : book.value ? 'book' : theme.value ? 'theme' : progress.value === null ? 'onboard' : 'intro');
/** How much of the coast of about 1200 BC is shown: 100 = then, 0 = today. */
export const coast = signal<number>((() => { const v = store.get('coast'); return v === 'modern' ? 0 : v && /^\d+$/.test(v) ? Math.min(100, +v) : 100; })());
/** Faint modern towns and countries, to answer "where is that today?" */
export const modern = signal<boolean>(store.get('modern') === '1');
export const tilt = signal(false);
export const view = signal<ViewName | null>(sel.value || book.value || theme.value ? null : 'greece');
export const searchOpen = signal(false);
/** Step in a theme tour (coastlines). */
export const tourIx = signal(0);
/** For each book, the furthest scene the reader has opened. Later scene titles stay hidden until then. */
export const reached = signal<Record<number, number>>((() => { try { return JSON.parse(store.get('reached') || '{}'); } catch { return {}; } })());
/** Has the reader finished this book? Its title and summary are shown only then. */
export const bookDone = (b: number) => b < (progress.value ?? 0) || (reached.value[b] ?? -1) >= scenesOf(b).length - 1;
/** Has the reader got as far as this scene? */
export const sceneSeen = (b: number, ix: number) => b < (progress.value ?? 0) || ((seen(b) || peek.value === b) && ix <= (reached.value[b] ?? -1));
/** A book past the bookmark that the reader chose to look at anyway. */
export const peek = signal<number | null>(null);
/** Bumped to replay the journey of the current scene or route. */
export const replay = signal(0);

/** May the reader see something that happens in book n? */
export const seen = (n: number) => n <= (progress.value ?? 0);
export const isMobile = () => window.innerWidth < 760;

// ---- actions
export function openItem(id: string) {
  const it = ITEMS[id];
  // A theme marker is only drawn inside its theme, so switch to it when needed.
  if (it?.theme && theme.value !== it.theme && !(book.value && it.books.includes(book.value))) { book.value = null; sceneIx.value = -1; theme.value = it.theme; }
  sel.value = id; panel.value = 'item'; view.value = null;
}
export function openBook(b: number, scene = -1) {
  theme.value = null; sel.value = null; book.value = b; view.value = null;
  sceneIx.value = Math.min(scene, scenesOf(b).length - 1);
  panel.value = 'book';
}
export function closeBook() {
  if (sel.value && ITEMS[sel.value]?.kind === 'point') sel.value = null;        // extra places exist only inside a scene
  book.value = null; sceneIx.value = -1; peek.value = null;
  if (panel.value === 'book' || panel.value === 'books' || (panel.value === 'item' && !sel.value)) panel.value = 'none';
}
export function openTheme(id: string) { book.value = null; sceneIx.value = -1; sel.value = null; theme.value = id; tourIx.value = 0; panel.value = 'theme'; view.value = null; }
export function closeTheme() {
  if (sel.value && ITEMS[sel.value]?.theme) sel.value = null;                    // theme markers leave with their theme
  theme.value = null;
  if (panel.value === 'theme' || (panel.value === 'item' && !sel.value)) panel.value = 'none';
}
export function closePanel() { panel.value = 'none'; sel.value = null; }
/** Back from an item card to the list it was opened from. */
export function backFromItem() { sel.value = null; panel.value = book.value ? 'book' : theme.value ? 'theme' : 'none'; }
export function setProgress(p: number) { progress.value = p; }
export function setView(v: ViewName) { sel.value = null; view.value = v; if (panel.value === 'item' || panel.value === 'intro') panel.value = 'none'; }

// ---- keep things in sync
effect(() => { store.set('lang', lang.value); document.documentElement.lang = lang.value; });
effect(() => { store.set('progress', progress.value === null ? null : String(progress.value)); });
effect(() => { store.set('coast', String(coast.value)); });
effect(() => { store.set('modern', modern.value ? '1' : null); });
effect(() => { store.set('reached', JSON.stringify(reached.value)); });
effect(() => {
  const b = book.value, i = sceneIx.value;
  if (b && i >= 0 && (seen(b) || peek.value === b) && i > (reached.peek()[b] ?? -1)) reached.value = { ...reached.peek(), [b]: i };
});
effect(() => {
  const l = lang.value;
  loadTexts(l).then(t => { if (lang.value === l) texts.value = t; });
});
effect(() => {
  const q = new URLSearchParams();
  q.set('l', lang.value);
  if (book.value) { q.set('b', String(book.value)); if (sceneIx.value >= 0) q.set('s', String(sceneIx.value + 1)); }
  if (theme.value) q.set('t', theme.value);
  if (sel.value) q.set('i', sel.value);
  history.replaceState(null, '', '#' + q.toString());
});
