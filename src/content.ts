// Loads the Odyssey content pack and builds one registry of everything that can be selected.
import type { BookInfo, DayBlock, Dig, EventSite, HeroInfo, Item, Lang, ModernPlace, Overlay, People, Place, Region, Route, Scene, Texts, Theme } from './types';
import peopleJson from '../content/odyssey/people.json';
import daysJson from '../content/odyssey/days.json';
import modernJson from '../content/odyssey/modern.json';
import heroesJson from '../content/odyssey/heroes.json';
import placesJson from '../content/odyssey/places.json';
import eventsJson from '../content/odyssey/events.json';
import routesJson from '../content/odyssey/routes.json';
import digsJson from '../content/odyssey/digs.json';
import themesJson from '../content/odyssey/themes.json';
import booksJson from '../content/odyssey/books.json';
import regionsJson from '../content/odyssey/regions.json';
import overlaysJson from '../content/odyssey/overlays.json';
import scenesJson from '../content/odyssey/scenes.json';

export const PLACES = placesJson as unknown as Place[];
export const EVENTS = eventsJson as unknown as EventSite[];
export const ROUTES = routesJson as unknown as Route[];
export const DIGS = digsJson as unknown as Dig[];
export const THEMES = themesJson as unknown as Theme[];
export const BOOKS = booksJson as unknown as BookInfo[];
export const REGIONS = regionsJson as unknown as Region[];
export const OVERLAYS = overlaysJson as unknown as Overlay[];
export const SCENES = scenesJson as unknown as Scene[];
export const PEOPLE = peopleJson as unknown as People;
export const DAYS = daysJson as unknown as DayBlock[];
/** How many days the action of the poem takes. */
export const DAY_COUNT = DAYS.reduce((n, d) => n + d.days, 0);
export const MODERN = modernJson as unknown as ModernPlace[];
export const HEROES = heroesJson as unknown as HeroInfo[];
export const HERO: Record<string, HeroInfo> = Object.fromEntries(HEROES.map(h => [h.id, h]));
/** The place a selection points at: an item itself, or the home of a hero. */
export const placeOfSel = (id: string | null): string | null => (id?.startsWith('hero:') ? HERO[id.slice(5)]?.home ?? null : id);

export const PLACE: Record<string, Place> = Object.fromEntries(PLACES.map(p => [p.id, p]));
export const THEME: Record<string, Theme> = Object.fromEntries(THEMES.map(t => [t.id, t]));
export const scenesOf = (book: number) => SCENES.filter(s => s.book === book);
export const LAST_BOOK = 24;

const uniq = (a: number[]) => [...new Set(a)].sort((x, y) => x - y);
const mid = (pts: [number, number][]) => pts[Math.floor(pts.length / 2)];

export const ITEMS: Record<string, Item> = {};
const add = (it: Item) => { ITEMS[it.id] = it; };

for (const p of PLACES) {
  add({ id: p.id, kind: 'place', lat: p.lat, lon: p.lon, side: p.side, certainty: p.certainty, minZoom: p.minZoom, anchor: p.anchor, reveals: p.reveals, books: uniq(p.refs.filter(r => !r.il).map(r => r.b)) });
  (p.alts || []).forEach((a, i) => add({ id: `${p.id}~${i}`, kind: 'alt', lat: a.lat, lon: a.lon, parent: p.id, altIndex: i, side: p.side, certainty: 3, minZoom: Math.max(p.minZoom, 5), reveals: p.reveals, books: [] }));
}
for (const e of EVENTS) add({ id: e.id, kind: 'event', lat: e.lat, lon: e.lon, certainty: e.certainty, minZoom: e.minZoom, anchor: e.anchor, books: e.books });
for (const r of ROUTES) { const [lon, lat] = mid(r.pts); add({ id: r.id, kind: 'route', lat, lon, certainty: r.certainty, minZoom: 0, books: r.books, pts: r.pts, color: r.color }); }
for (const d of DIGS) add({ id: d.id, kind: 'dig', lat: d.lat, lon: d.lon, minZoom: d.minZoom, anchor: d.anchor, theme: 'arch', reveals: d.reveals, books: [] });
for (const th of THEMES) {
  for (const it of th.items || []) add({ id: it.id, kind: 'titem', lat: it.lat, lon: it.lon, anchor: it.anchor, minZoom: 0, theme: th.id, books: it.books || [], color: th.color, reveals: it.reveals });
  for (const ln of th.lines || []) { const [lon, lat] = mid(ln.pts); add({ id: ln.id, kind: 'tline', lat, lon, minZoom: 0, theme: th.id, books: [], pts: ln.pts, color: ln.color, reveals: ln.reveals }); }
}
for (const s of SCENES) for (const p of s.points || []) if (!ITEMS[p.id]) add({ id: p.id, kind: 'point', lat: p.lat, lon: p.lon, certainty: p.certainty, minZoom: 0, books: [s.book] });

/** Everything tied to a given book: places named in it, events, routes, theme items. */
export const itemsOfBook = (book: number): string[] => {
  const first = BOOKS.find(b => b.book === book)?.at || [];
  const rest = Object.values(ITEMS).filter(it => it.books.includes(book) && it.kind !== 'point' && !first.includes(it.id)).map(it => it.id);
  return [...first.filter(id => ITEMS[id]), ...rest];
};

// ---- text
const files = import.meta.glob('../content/odyssey/text/*/*.json') as Record<string, () => Promise<{ default: unknown }>>;
const cache: Partial<Record<Lang, Texts>> = {};

export async function loadTexts(lang: Lang): Promise<Texts> {
  if (cache[lang]) return cache[lang]!;
  const part = async (l: Lang, name: string) => {
    const f = files[`../content/odyssey/text/${l}/${name}.json`];
    return f ? (await f()).default : null;
  };
  const out: Record<string, unknown> = {};
  for (const name of ['places', 'story', 'extra', 'themes', 'scenes', 'reader']) {
    // A language that is not finished yet falls back to Bulgarian for the missing file.
    out[name] = (await part(lang, name)) ?? (await part('bg', name));
  }
  return (cache[lang] = out as unknown as Texts);
}

/** Display name of any item. */
export function nameOf(id: string, T: Texts): string {
  const it = ITEMS[id];
  if (!it) return T.scenes.points[id] || id;
  switch (it.kind) {
    case 'place': return T.places[id]?.name ?? id;
    case 'alt': return T.places[it.parent!]?.alts?.[it.altIndex!] ?? id;
    case 'event': return T.story.events[id]?.name ?? id;
    case 'route': return T.story.routes[id]?.name ?? id;
    case 'dig': return T.extra.digs[id]?.name ?? id;
    case 'titem': return T.themes[it.theme!]?.items?.[id]?.name ?? id;
    case 'tline': return T.themes[it.theme!]?.lines?.[id]?.name ?? id;
    case 'point': return T.scenes.points[id] ?? id;
    default: return id;
  }
}
