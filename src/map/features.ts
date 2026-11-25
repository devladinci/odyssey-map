// Turns the content and the current state into the markers, labels and lines the map draws.
import type { Item, LonLat, Scene, Texts } from '../types';
import { DIGS, ITEMS, MODERN, PLACE, PLACES, REGIONS, ROUTES, THEME, itemsOfBook, nameOf } from '../content';
import { C, SIDE_TEXT } from '../theme';

export interface MapState {
  T: Texts;
  book: number | null;       // book shown on the map (null when it is hidden behind the spoiler guard)
  scene: Scene | null;
  theme: string | null;
  sel: string | null;
  canSee: (bookNo: number) => boolean;
}
type Props = Record<string, string | number>;
type Feat = { type: 'Feature'; geometry: { type: 'Point'; coordinates: LonLat } | { type: 'LineString'; coordinates: LonLat[] }; properties: Props };
const fc = (features: Feat[]) => ({ type: 'FeatureCollection' as const, features });

/** Is this item allowed on the map at all, given how far the reader has read? */
export function unlocked(it: Item, canSee: (b: number) => boolean): boolean {
  if (it.reveals) return canSee(it.reveals);
  if (it.kind === 'event' || it.kind === 'route') return !it.books.length || canSee(Math.min(...it.books));
  return true;
}

function look(it: Item): Props {
  const base = { icon: '', isz: 1, tsz: 14, tcol: '#3b3323', font: 'r', pri: 40, trot: 0, irot: 0, sp: 0.01 };
  switch (it.kind) {
    case 'place': {
      const p = PLACE[it.id], f = p.flags || [];
      if (p.side === 'water') return { ...base, tsz: f.includes('sea') ? 15 : 13.5, tcol: SIDE_TEXT.water, font: 'i', pri: 58, trot: p.rotate || 0, sp: 0.08 };
      const key = { home: 'hom', wander: 'wan', story: 'sto' }[p.side];
      const icon = f.includes('peak') ? 'peak' : `${key}-${p.certainty}`;
      if (f.includes('capital')) return { ...base, icon, isz: 1.35, tsz: 20, tcol: SIDE_TEXT[p.side], pri: 100 };
      if (f.includes('major')) return { ...base, icon, isz: 1.12, tsz: 16.5, tcol: SIDE_TEXT[p.side], pri: 90 };
      if (p.side === 'story') return { ...base, icon, isz: 0.95, tsz: 13.5, tcol: SIDE_TEXT.story, pri: 60 - p.minZoom };
      return { ...base, icon, tsz: 14.5, tcol: SIDE_TEXT[p.side], pri: 80 - p.minZoom * 2 + (p.side === 'wander' ? 6 : 0) };
    }
    case 'event': return { ...base, icon: 'evt', isz: 0.9, tsz: 12.5, tcol: C.eventD, pri: 50 };
    case 'alt': return { ...base, icon: 'alt', isz: 0.9, tsz: 11.5, tcol: '#62666f', font: 'i', pri: 12 };
    case 'dig': return { ...base, icon: 'dig', isz: 0.85, tsz: 12.5, tcol: '#5b3a17', pri: 62 };
    case 'titem': {
      const item = THEME[it.theme!].items!.find(x => x.id === it.id)!;
      return { ...base, icon: `th-${it.theme}-${item.icon}`, isz: 0.95, tsz: 13.5, tcol: '#2f2a1e', pri: 64, irot: item.dir != null ? item.dir - 90 : 0 };
    }
    case 'point': return { ...base, icon: 'point', tsz: 13.5, tcol: C.eventD, pri: 70 };
    default: return base;
  }
}

/** Name of the marker picture for an item, for lists and the legend. */
export const iconFor = (it: Item) => String(look(it).icon);

export function buildPoints(s: MapState) {
  const { T, scene, theme, book } = s;
  const strong = new Set(scene?.at), soft = new Set(scene?.mentions);
  const inBook = new Set(book ? itemsOfBook(book) : []);
  const digPlaces = theme === 'arch' ? new Set(Object.keys(T.extra.digNotes)) : new Set<string>();
  const out: Feat[] = [];

  for (const it of Object.values(ITEMS)) {
    if (it.kind === 'route' || it.kind === 'tline') continue;
    if (!unlocked(it, s.canSee)) continue;
    const own = it.theme != null;                                   // belongs to a theme layer
    // 0 faded, 1 normal, 2 highlighted
    let em: 0 | 1 | 2 = 1;
    if (scene) em = strong.has(it.id) ? 2 : soft.has(it.id) ? 1 : 0;
    else if (book) em = inBook.has(it.id) ? 1 : 0;
    else if (theme) em = it.theme === theme || digPlaces.has(it.id) ? 1 : 0;

    if (it.kind === 'point' && !(scene && em > 0)) continue;         // extra places exist only inside their scene
    if (own && em === 0) continue;                                   // theme items show in their theme,
    if (own && !scene && !book && it.theme !== theme) continue;      // or in a book or scene that names them
    if (it.kind === 'alt' && (scene || book || theme)) continue;

    const L = look(it);
    const hot = em === 2;
    const fadedText = it.kind === 'place' ? 0.45 : 0;
    out.push({
      type: 'Feature', geometry: { type: 'Point', coordinates: [it.lon, it.lat] },
      properties: {
        id: it.id, name: theme === 'realms' && em === 0 ? '' : nameOf(it.id, T), anchor: it.anchor || 'right',
        icon: hot && it.kind === 'event' ? 'evt-hot' : L.icon, isz: +L.isz * (hot ? 1.25 : 1), tsz: +L.tsz * (hot ? 1.12 : 1),
        tcol: L.tcol, font: L.font, trot: L.trot, irot: L.irot, sp: L.sp,
        mz: em > 0 && (scene || book || (theme && own)) ? -1 : it.minZoom,   // what the reader asked for is always shown
        op: em === 0 ? 0.3 : 1, top: em === 0 ? fadedText : 1,
        sort: 1000 - +L.pri - em * 300,
      },
    });
  }
  return fc(out);
}

export interface RealmGeo { features: { properties: { id: string; far: boolean; labLat: number; labLon: number } }[] }

export function buildLabels(T: Texts, realms: RealmGeo | null, modern = false) {
  const out: Feat[] = REGIONS.map(r => ({ type: 'Feature', geometry: { type: 'Point', coordinates: [r.lon, r.lat] }, properties: { kind: r.kind, name: T.story.regions[r.id] || '' } }));
  if (modern) for (const m of MODERN) out.push({ type: 'Feature', geometry: { type: 'Point', coordinates: [m.lon, m.lat] }, properties: { kind: m.kind === 'city' ? 'mcity' : 'mcountry', name: T.reader.modern[m.id] || '' } });
  for (const f of realms?.features || []) {
    const p = f.properties, t = T.places[p.id];
    if (!t) continue;
    const king = t.heroes?.[0]?.name.split(/,| и | and /)[0];
    const name = t.name.replace(/ \(.*\)$/, '') + (p.far ? ' ?' : '') + (king ? '\n' + king : '');
    out.push({ type: 'Feature', geometry: { type: 'Point', coordinates: [p.labLon, p.labLat] }, properties: { kind: 'realm', id: p.id, name, sort: PLACE[p.id]?.minZoom ?? 9 } });
  }
  return fc(out);
}

/** Catmull-Rom curve through the points, so routes look drawn by hand and not with a ruler. */
export function smooth(pts: LonLat[], loop = false, steps = 14): LonLat[] {
  if (pts.length < 3) return pts;
  const P = loop ? [pts[pts.length - 1], ...pts, pts[0], pts[1]] : [pts[0], ...pts, pts[pts.length - 1]];
  const out: LonLat[] = [];
  for (let i = 1; i < P.length - 2; i++) {
    const [p0, p1, p2, p3] = [P[i - 1], P[i], P[i + 1], P[i + 2]];
    for (let k = 0; k < steps; k++) {
      const t = k / steps, t2 = t * t, t3 = t2 * t;
      const f = (a: number, b: number, c: number, d: number) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  out.push(loop ? out[0] : pts[pts.length - 1]);
  return out;
}

export function buildLines(s: MapState) {
  const out: Feat[] = [];
  const line = (id: string, pts: LonLat[], color: string, loop: boolean, op: number) =>
    out.push({ type: 'Feature', geometry: { type: 'LineString', coordinates: smooth(pts, loop) }, properties: { id, color, op } });
  if (s.scene) return fc(out);
  if (s.book) for (const r of ROUTES) if (r.books.includes(s.book)) line(r.id, r.pts, r.color, !!r.loop, 1);
  if (s.theme === 'routes') for (const r of ROUTES) if (unlocked(ITEMS[r.id], s.canSee)) line(r.id, r.pts, r.color, !!r.loop, s.sel && ITEMS[s.sel]?.kind === 'route' && s.sel !== r.id ? 0.35 : 1);
  if (s.theme) for (const ln of THEME[s.theme]?.lines || []) if (unlocked(ITEMS[ln.id], s.canSee)) line(ln.id, ln.pts, ln.color, false, 1);
  if (s.sel && ITEMS[s.sel]?.kind === 'route' && !out.some(f => f.properties.id === s.sel)) {
    const r = ROUTES.find(x => x.id === s.sel)!;
    line(r.id, r.pts, r.color, !!r.loop, 1);
  }
  return fc(out);
}

/** Dashed links from a place to its alternative locations, shown while one of them is selected. */
export function buildAltLines(sel: string | null) {
  const it = sel ? ITEMS[sel] : null;
  const place = it?.kind === 'alt' ? PLACE[it.parent!] : it?.kind === 'place' ? PLACE[it.id] : null;
  return fc((place?.alts || []).map(a => ({ type: 'Feature' as const, geometry: { type: 'LineString' as const, coordinates: [[place!.lon, place!.lat], [a.lon, a.lat]] as LonLat[] }, properties: {} })));
}

export const riverNames = (T: Texts): any => ['match', ['get', 'river'], ...Object.entries(T.extra.rivers).flatMap(([id, n]) => [id, n]), ''];
export const counts = { places: PLACES.length, digs: DIGS.length };
