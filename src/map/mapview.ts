// Creates the map and keeps it in step with the app state.
import { AttributionControl, LngLat, LngLatBounds, Map as MlMap, Marker, ScaleControl, setWorkerUrl } from 'maplibre-gl';
import type { GeoJSONSource } from 'maplibre-gl';
import type * as GeoJSON from 'geojson';
import 'maplibre-gl/dist/maplibre-gl.css';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';
import { effect } from '@preact/signals';
import { BOOKS, ITEMS, PLACE, THEME, itemsOfBook, placeOfSel, scenesOf } from '../content';
import type { LonLat, Scene } from '../types';
import * as S from '../state';
import { DEM_SOURCE, loadDemManifest, registerDemProtocol } from './dem';
import { addIcons } from './icons';
import { buildAltLines, buildLabels, buildLines, buildPoints, riverNames, smooth, unlocked } from './features';
import type { RealmGeo } from './features';
import { buildStyle } from './style';
import { C } from '../theme';

/** The three standing views: the island, the Greek world of the poem, and the whole sea of the wanderings. */
export const VIEWS: Record<S.ViewName, { bounds: [LonLat, LonLat]; max: number }> = {
  ithaca: { bounds: [[20.585, 38.295], [20.79, 38.51]], max: 11.5 },
  greece: { bounds: [[19.4, 34.9], [26.9, 40.5]], max: 7 },
  all: { bounds: [[-9.2, 29.6], [37.2, 45.6]], max: 6 },
};
const RELIEF = 1.8;                                          // how much the 3D view stretches heights
const calm = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
let map: MlMap;
export const getMap = () => map;

/** Space covered by the header and by the open panel, so the camera centres on what is still visible. */
function padding(): { top: number; left: number; right: number; bottom: number } {
  const open = S.panel.value !== 'none';
  const mobile = S.isMobile();
  return { top: mobile ? 104 : 96, left: 24, right: !mobile && open ? 404 : 24, bottom: mobile && open ? Math.round(window.innerHeight * 0.46) + 8 : 28 };
}
/** Where the middle of the free part of the screen is, relative to the middle of the whole screen. */
function offset(): [number, number] { const p = padding(); return [(p.left - p.right) / 2, (p.top - p.bottom) / 2]; }
function onScreen(p: LonLat): boolean {
  const q = map.project(p), pad = padding(), c = map.getContainer();
  return q.x > pad.left + 20 && q.x < c.clientWidth - pad.right - 20 && q.y > pad.top + 20 && q.y < c.clientHeight - pad.bottom - 20;
}
function fly(center: LonLat, zoom: number) {
  const o = { center, zoom, offset: offset() };
  calm() ? map.easeTo({ ...o, duration: 0 }) : map.flyTo({ ...o, duration: 1400, essential: true });
}
function fit(points: LonLat[], maxZoom = 11.5, margin = 40) {
  if (!points.length) return;
  if (points.length === 1) return fly(points[0], Math.min(maxZoom, Math.max(map.getZoom(), 8)));
  const b = points.reduce((acc, p) => acc.extend(p), new LngLatBounds(points[0], points[0]));
  const p = padding();
  map.fitBounds(b, { padding: { top: p.top + margin - 10, left: p.left + margin, right: p.right + margin, bottom: p.bottom + margin }, maxZoom, duration: calm() ? 0 : 1400 });
}
/** A scene view is written for a phone-sized window. Fitting that same area keeps it right on any screen. */
function fitView(v: { center: LonLat; zoom: number }) {
  const dx = (190 / (512 * 2 ** v.zoom)) * 360, dy = dx * Math.cos((v.center[1] * Math.PI) / 180);
  fit([[v.center[0] - dx, v.center[1] - dy], [v.center[0] + dx, v.center[1] + dy]], v.zoom + 1.6);
}
const at = (ids: string[]) => ids.map(id => ITEMS[id]).filter(Boolean).flatMap(it => (it.pts ? it.pts : [[it.lon, it.lat] as LonLat]));

// ---- the journey of a scene or a route: the line draws itself and a dot travels along it
let stopPlay: (() => void) | null = null;
function play(pts: LonLat[], color: string, loop = false) {
  stopPlay?.();
  const src = map.getSource('path') as GeoJSONSource;
  const line = smooth(pts, loop);
  const feature = (coords: LonLat[]) => ({ type: 'FeatureCollection' as const, features: coords.length > 1 ? [{ type: 'Feature' as const, geometry: { type: 'LineString' as const, coordinates: coords }, properties: { color } }] : [] });
  const el = document.createElement('div'); el.className = 'traveller'; el.style.setProperty('--c', color);
  const head = new Marker({ element: el }).setLngLat(line[0]).addTo(map);
  let raf = 0, done = false;
  stopPlay = () => { cancelAnimationFrame(raf); head.remove(); if (!done) src.setData(feature([])); stopPlay = null; };
  if (calm()) { src.setData(feature(line)); head.setLngLat(line[line.length - 1]); done = true; return; }
  const total = Math.min(6500, 1800 + line.length * 22), start = performance.now() + 700;
  const step = (now: number) => {
    const t = Math.min(1, Math.max(0, (now - start) / total)), e = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
    const f = e * (line.length - 1), i = Math.floor(f), frac = f - i;
    const a = line[i], b = line[Math.min(i + 1, line.length - 1)];
    const tip: LonLat = [a[0] + (b[0] - a[0]) * frac, a[1] + (b[1] - a[1]) * frac];
    src.setData(feature([...line.slice(0, i + 1), tip]));
    head.setLngLat(tip);
    if (t < 1) raf = requestAnimationFrame(step); else { done = true; el.classList.add('arrived'); }
  };
  raf = requestAnimationFrame(step);
}
function clearPlay() { stopPlay?.(); (map.getSource('path') as GeoJSONSource | undefined)?.setData({ type: 'FeatureCollection', features: [] }); }

export async function initMap(): Promise<MlMap> {
  setWorkerUrl(new URL(workerUrl, document.baseURI).href);
  registerDemProtocol();
  await loadDemManifest();
  const style = buildStyle();
  style.sources.dem3d = { ...DEM_SOURCE, maxzoom: 10 };
  style.sky = { 'sky-color': '#9db7d6', 'horizon-color': '#dfe6ee', 'fog-color': '#dfe6ee', 'sky-horizon-blend': 0.6, 'horizon-fog-blend': 0.7, 'fog-ground-blend': 0.6 };
  map = new MlMap({
    container: 'map', style, center: [22.6, 37.9], zoom: 5,
    minZoom: 2.2, maxZoom: 14.5, maxPitch: 84, maxBounds: [[-48, 6], [76, 62]],
    attributionControl: false, renderWorldCopies: false, fadeDuration: 180, dragRotate: true, touchPitch: true,
  });
  map.addControl(new ScaleControl({ maxWidth: 110, unit: 'metric' }), 'bottom-left');
  map.addControl(new AttributionControl({ compact: true, customAttribution: [
      '<a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">© OpenStreetMap contributors</a>',
      '<a href="https://mapterhorn.com/attribution" target="_blank" rel="noopener">© Mapterhorn</a>, Copernicus DEM © DLR, Airbus, EU and ESA',
      '<a href="https://pleiades.stoa.org" target="_blank" rel="noopener">Pleiades</a>',
      '<a href="https://www.naturalearthdata.com" target="_blank" rel="noopener">Natural Earth</a>',
    ].join(' · ') }), 'bottom-right');
  // Missing elevation tiles are expected (see dem.ts); anything else is worth seeing in the console.
  map.on('error', e => { if (!/elevation tile/.test(String(e.error?.message))) console.warn(e.error); });
  // The credits start folded on every screen size; one tap opens them.
  const credits = document.querySelector('.maplibregl-ctrl-attrib');
  credits?.classList.remove('maplibregl-compact-show'); credits?.removeAttribute('open');
  if (S.view.value) { const p = padding(); map.fitBounds(VIEWS[S.view.value].bounds, { padding: { top: p.top + 10, left: p.left, right: p.right, bottom: p.bottom + 10 }, maxZoom: VIEWS[S.view.value].max, duration: 0 }); }
  await new Promise<void>(res => map.once('load', () => res()));
  await addIcons(map);
  const realms: RealmGeo = await fetch(new URL('geo/realms.json', document.baseURI)).then(r => r.json()).catch(() => ({ features: [] }));

  const set = (id: string, data: unknown) => (map.getSource(id) as GeoJSONSource).setData(data as GeoJSON.FeatureCollection);
  const show = (ids: string[], on: boolean) => ids.forEach(id => map.setLayoutProperty(id, 'visibility', on ? 'visible' : 'none'));
  const currentScene = (): Scene | null => (S.book.value && S.sceneIx.value >= 0 ? scenesOf(S.book.value)[S.sceneIx.value] ?? null : null);
  const canSee = (b: number) => S.seen(b) || S.peek.value === b;
  /** The book the map follows. A book past the bookmark stays off the map until the reader asks for it. */
  const shownBook = () => (S.book.value && canSee(S.book.value) ? S.book.value : null);

  // selection ring
  let ringMarker: Marker | null = null;
  function ring(id: string | null) {
    ringMarker?.remove(); ringMarker = null;
    const it = id ? ITEMS[id] : null;
    if (!it || it.pts) return;
    const el = document.createElement('div'); el.className = 'sel-ring';
    ringMarker = new Marker({ element: el }).setLngLat([it.lon, it.lat]).addTo(map);
  }

  // markers, lines and labels
  effect(() => {
    const T = S.texts.value; if (!T) return;
    const book = shownBook();
    const state = { T, book, scene: book ? currentScene() : null, theme: S.theme.value, sel: S.sel.value, canSee };
    set('points', buildPoints(state));
    set('lines', buildLines(state));
    set('altlines', buildAltLines(S.sel.value));
  });
  effect(() => {
    const T = S.texts.value; if (!T) return;
    set('labels', buildLabels(T, realms, S.modern.value));
    map.setLayoutProperty('river-names', 'text-field', riverNames(T));
  });
  effect(() => { show(['realm-fill', 'realm-edge', 'realm-edge-far', 'realm-names'], S.theme.value === 'realms'); });
  effect(() => { show(['borders'], S.modern.value); });
  effect(() => {
    const v = S.coast.value / 100;                             // 1 = the coast of about 1200 BC, 0 = today
    show(['anc-sea', 'anc-marsh', 'anc-lake', 'anc-shore', 'riv-anc'], v > 0);
    map.setPaintProperty('anc-sea', 'fill-opacity', v);
    map.setPaintProperty('anc-marsh', 'fill-opacity', 0.55 * v);
    map.setPaintProperty('anc-lake', 'fill-opacity', 0.78 * v);
    map.setPaintProperty('anc-shore', 'line-opacity', 0.85 * v);
    map.setPaintProperty('riv-anc', 'line-opacity', 0.95 * v);
  });

  // camera
  let first = true;
  effect(() => {
    const v = S.view.value; if (!v) return;
    if (first) return;                                         // the opening view is already set
    fit(VIEWS[v].bounds, VIEWS[v].max, 10);
  });
  effect(() => {                                           // a selected item
    const id = placeOfSel(S.sel.value); void S.replay.value; ring(id);
    const it = id ? ITEMS[id] : null; if (!it) return;
    if (it.kind === 'route') { const r = it; fit(r.pts!, 10); play(r.pts!, r.color || C.event, false); return; }
    if (it.pts) return fit(it.pts, 10);
    if (first) return fly([it.lon, it.lat], Math.max(it.kind === 'place' && it.minZoom < 6 ? 6.5 : 8, it.minZoom + 1));
    const zoomOk = map.getZoom() >= it.minZoom + 0.3;
    if (!zoomOk || !map.getBounds().contains([it.lon, it.lat])) fly([it.lon, it.lat], Math.max(map.getZoom(), it.minZoom + 1, 6.5));
    else if (!onScreen([it.lon, it.lat])) map.easeTo({ center: [it.lon, it.lat], offset: offset(), duration: calm() ? 0 : 600 });
  });
  effect(() => {                                           // reader mode: a book or one of its scenes
    const b = shownBook(), ix = S.sceneIx.value; S.replay.value;
    if (S.sel.value) return;
    clearPlay();
    if (!b) return;
    const sc = currentScene();
    if (!sc) {
      // The overview frames the main places of the book; far-off places that are only named stay out of the frame.
      const main = BOOKS.find(x => x.book === b)?.at.filter(id => ITEMS[id] && unlocked(ITEMS[id], canSee)) || [];
      return fit(at(main.length ? main : itemsOfBook(b).filter(id => unlocked(ITEMS[id], canSee))), 10.5);
    }
    void ix;
    if (sc.path) { fit([...sc.path.pts, ...at(sc.at || [])], sc.view.zoom + 0.6); play(sc.path.pts, sc.path.kind === 'tale' ? '#8a6fc9' : C.crimson); }
    else fitView(sc.view);
  });
  effect(() => {                                           // a theme, or one stop of a theme tour
    const id = S.theme.value; if (!id || S.sel.value) return;
    const th = THEME[id], T = S.tourIx.value;
    if (th.tour && th.items) {
      const open = th.items.filter(x => unlocked(ITEMS[x.id], canSee)); if (!open.length) return;
      const it = open[Math.min(T, open.length - 1)]; return fly([it.lon, it.lat], it.zoom || 9);
    }
    if (th.builtin === 'realms') return fit(VIEWS.greece.bounds, 8);
    const ids = Object.values(ITEMS).filter(it => it.theme === id || (th.builtin === 'routes' && it.kind === 'route')).filter(it => unlocked(it, canSee)).map(it => it.id);
    if (ids.length) fit(at(ids), 9);
  });
  effect(() => {                                           // 3D
    const on = S.tilt.value;
    if (first && !on) return;
    map.setTerrain(on ? { source: 'dem3d', exaggeration: RELIEF } : null);
    map.easeTo({ pitch: on ? 58 : 0, bearing: on ? map.getBearing() : 0, duration: calm() ? 0 : 900 });
  });
  first = false;

  // clicks
  const near = (p: { x: number; y: number }, r: number): [[number, number], [number, number]] => [[p.x - r, p.y - r], [p.x + r, p.y + r]];
  function hit(p: { x: number; y: number }): string | null {
    const pts = map.queryRenderedFeatures(near(p, 13), { layers: ['pts'] }).filter(f => f.properties.icon || f.properties.name);
    if (pts.length) {
      const d = (f: (typeof pts)[number]) => { const q = map.project((f.geometry as GeoJSON.Point).coordinates as LonLat); return (q.x - p.x) ** 2 + (q.y - p.y) ** 2 - (f.properties.op === 1 ? 60 : 0); };
      return pts.sort((a, b) => d(a) - d(b))[0].properties.id as string;
    }
    const ln = map.queryRenderedFeatures(near(p, 8), { layers: ['ln-halo'] })[0];
    if (ln) return ln.properties.id as string;
    if (S.theme.value === 'realms') { const r = map.queryRenderedFeatures([p.x, p.y], { layers: ['realm-fill'] })[0]; if (r) return r.properties.id as string; }
    if (S.coast.value > 50) { const w = map.queryRenderedFeatures([p.x, p.y], { layers: ['anc-sea', 'anc-marsh', 'anc-lake'] })[0]; if (w) return 'ov:' + w.properties.id; }
    return null;
  }
  map.on('click', e => { const id = hit(e.point); if (id && (ITEMS[id] || id.includes(':'))) S.openItem(id); });
  map.on('mousemove', e => { map.getCanvas().style.cursor = hit(e.point) ? 'pointer' : ''; });
  map.on('dragstart', () => { if (S.view.value) S.view.value = null; });

  return map;
}

export function zoomBy(d: number) { map?.easeTo({ zoom: map.getZoom() + d, duration: 250 }); }
export function resetNorth() { map?.easeTo({ bearing: 0, duration: 400 }); }

/** Puts the eye on a peak and looks towards the palace of Odysseus. */
export function lookFrom(lon: number, lat: number, height: number) {
  if (!map) return;
  const target = PLACE.palace;
  S.sel.value = null; S.panel.value = 'none'; S.view.value = null;
  if (!S.tilt.value) S.tilt.value = true;
  setTimeout(() => {
    const cam = map.calculateCameraOptionsFromTo(new LngLat(lon, lat), height * RELIEF + 400, new LngLat(target.lon, target.lat), 0);
    calm() ? map.jumpTo(cam) : map.flyTo({ ...cam, duration: 3200, essential: true });
  }, calm() ? 0 : 950);
}
