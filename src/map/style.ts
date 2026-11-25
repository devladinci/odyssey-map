// The map style: what is drawn, in which order, and how it looks.
import type { LayerSpecification, StyleSpecification } from 'maplibre-gl';
import { C, REALM } from '../theme';
import { DEM_SOURCE } from './dem';
import cyr from '@fontsource/cormorant-garamond/files/cormorant-garamond-cyrillic-600-normal.woff2?url';
import lat from '@fontsource/cormorant-garamond/files/cormorant-garamond-latin-600-normal.woff2?url';
import latx from '@fontsource/cormorant-garamond/files/cormorant-garamond-latin-ext-600-normal.woff2?url';
import cyrI from '@fontsource/cormorant-garamond/files/cormorant-garamond-cyrillic-600-italic.woff2?url';
import latI from '@fontsource/cormorant-garamond/files/cormorant-garamond-latin-600-italic.woff2?url';
import latxI from '@fontsource/cormorant-garamond/files/cormorant-garamond-latin-ext-600-italic.woff2?url';

/** The map sheet: west, south, east, north. Beyond it there is no coastline data. */
export const SHEET = [-10, 28, 38, 47] as const;
const abs = (u: string) => new URL(u, document.baseURI).href;
const geo = (name: string) => abs(`geo/${name}.json`);
const empty = { type: 'FeatureCollection' as const, features: [] };
const face = (c: string, l: string, lx: string) => [
  { url: abs(c), 'unicode-range': ['U+0400-052F'] },
  { url: abs(lx), 'unicode-range': ['U+0100-024F', 'U+1E00-1EFF'] },
  { url: abs(l), 'unicode-range': ['U+0000-00FF', 'U+2000-206F'] },
];
export const FONT = ['Cormorant'], FONT_I = ['Cormorant Italic'];

// Height colours, as on a school atlas: green lowlands, then yellow, tan and brown, and pale peaks.
// The green itself is the land colour, so it stays sharp along the coast; the ramp only adds the heights.
const TINT: any = ['interpolate', ['linear'], ['elevation'],
  0, 'rgba(191,211,154,0)',
  70, 'rgba(191,211,154,0)',
  220, 'rgba(216,224,170,0.8)',
  450, 'rgba(234,224,178,0.92)',
  800, 'rgba(224,203,157,0.94)',
  1300, 'rgba(199,172,133,0.95)',
  1900, 'rgba(176,157,137,0.95)',
  2500, 'rgba(214,208,198,0.96)',
  3000, 'rgba(244,242,236,0.97)'];

// The same idea for close views of the Troad, where a ridge of 50 m matters.
const TINT_LOCAL: any = ['interpolate', ['linear'], ['elevation'],
  0, 'rgba(191,211,154,0)',
  10, 'rgba(191,211,154,0)',
  30, 'rgba(210,221,168,0.65)',
  65, 'rgba(230,224,180,0.85)',
  130, 'rgba(227,210,167,0.9)',
  260, 'rgba(208,186,145,0.92)',
  500, 'rgba(186,164,130,0.93)',
  900, 'rgba(170,154,134,0.94)',
  1500, 'rgba(200,192,178,0.95)',
  1800, 'rgba(236,233,226,0.96)'];

const realmFill = (pal: string[]): any => ['match', ['get', 'ci'], ...pal.flatMap((c, i) => [i, c]), pal[0]];
const hidden = { visibility: 'none' as const };

// Label side for each marker. The preferred side comes first; the others are tried when it does not fit.
const R: any = ['left', [0.75, 0]], L: any = ['right', [-0.75, 0]], T: any = ['bottom', [0, -0.7]], B: any = ['top', [0, 0.7]];
const ANCHORS: any = ['match', ['get', 'anchor'],
  'left', ['literal', [...L, ...R, ...T, ...B]],
  'top', ['literal', [...T, ...R, ...L, ...B]],
  'bottom', ['literal', [...B, ...R, ...L, ...T]],
  ['literal', [...R, ...L, ...T, ...B]]];

export function buildStyle(): StyleSpecification {
  const layers: LayerSpecification[] = [
    { id: 'sea', type: 'background', paint: { 'background-color': C.sea } },
    { id: 'coast-glow', type: 'line', source: 'land', paint: { 'line-color': '#7f9fc9', 'line-opacity': 0.22, 'line-width': ['interpolate', ['linear'], ['zoom'], 2.5, 2.5, 4, 5, 9, 12, 13, 22], 'line-blur': ['interpolate', ['linear'], ['zoom'], 2.5, 2.5, 4, 5, 9, 12, 13, 22] } },
    { id: 'land', type: 'fill', source: 'land', paint: { 'fill-color': C.land } },
    { id: 'relief-tint', type: 'color-relief', source: 'dem', maxzoom: 10.5, paint: { 'color-relief-color': TINT, 'color-relief-opacity': ['interpolate', ['linear'], ['zoom'], 9.3, 1, 10.5, 0] } },
    { id: 'relief-tint-local', type: 'color-relief', source: 'dem', minzoom: 9.3, paint: { 'color-relief-color': TINT_LOCAL, 'color-relief-opacity': ['interpolate', ['linear'], ['zoom'], 9.3, 0, 10.5, 1, 12.4, 1, 13.5, 0.6] } },
    { id: 'relief-shade', type: 'hillshade', source: 'dem', paint: {
      'hillshade-method': 'standard', 'hillshade-illumination-direction': 315, 'hillshade-illumination-anchor': 'map',
      'hillshade-exaggeration': ['interpolate', ['linear'], ['zoom'], 2.5, 0.22, 5, 0.38, 8, 0.48, 10, 0.6, 11.5, 0.95, 12.4, 0.8, 13.5, 0.4],
      'hillshade-shadow-color': 'rgba(70,52,34,0.9)', 'hillshade-highlight-color': 'rgba(255,251,240,0.85)', 'hillshade-accent-color': 'rgba(88,68,46,0.9)',
    } },
    { id: 'land-edge', type: 'line', source: 'land', paint: { 'line-color': '#7d7256', 'line-opacity': 0.55, 'line-width': ['interpolate', ['linear'], ['zoom'], 2.5, 0.4, 5, 0.7] } },
    { id: 'borders', type: 'line', source: 'borders', layout: hidden, paint: { 'line-color': '#4b5060', 'line-opacity': 0.6, 'line-width': 1.2, 'line-dasharray': [5, 2, 1, 2] } },

    { id: 'riv', type: 'line', source: 'rivers', filter: ['==', ['get', 'kind'], 'modern'], layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': '#7da2c2', 'line-opacity': 0.9, 'line-width': ['interpolate', ['linear'], ['zoom'], 5, ['*', ['get', 'w'], 0.45], 9, ['*', ['get', 'w'], 0.8], 13, ['*', ['get', 'w'], 1.5]] } },
    // water and shores as they were around 1200 BC
    { id: 'anc-sea', type: 'fill', source: 'ancient', filter: ['==', ['get', 'kind'], 'sea'], paint: { 'fill-color': C.sea, 'fill-antialias': true } },
    { id: 'anc-marsh', type: 'fill', source: 'ancient', filter: ['==', ['get', 'kind'], 'marsh'], paint: { 'fill-color': '#7fb4b8', 'fill-opacity': 0.6, 'fill-outline-color': '#5f9499' } },
    { id: 'anc-lake', type: 'fill', source: 'ancient', filter: ['==', ['get', 'kind'], 'lake'], paint: { 'fill-color': '#7fa3c4', 'fill-opacity': 0.78, 'fill-outline-color': '#5d82a6' } },
    { id: 'anc-shore', type: 'line', source: 'ancient', filter: ['==', ['get', 'kind'], 'shore'], layout: { 'line-cap': 'round' }, paint: { 'line-color': '#dbe4f0', 'line-opacity': 0.85, 'line-width': 1.5, 'line-dasharray': [0.2, 3] } },

    { id: 'riv-anc', type: 'line', source: 'rivers', filter: ['==', ['get', 'kind'], 'ancient'], layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': '#4f7fa8', 'line-opacity': 0.95, 'line-width': 2.6, 'line-dasharray': [0.2, 2.2] } },

    // realms of the kings (theme)
    { id: 'realm-fill', type: 'fill', source: 'realms', layout: hidden, paint: {
      'fill-color': realmFill(REALM),
      'fill-opacity': ['case', ['get', 'far'], 0.2, 0.36] } },
    { id: 'realm-edge', type: 'line', source: 'realms', layout: hidden, filter: ['!', ['get', 'far']], paint: { 'line-color': 'rgba(60,45,25,0.55)', 'line-width': 1 } },
    { id: 'realm-edge-far', type: 'line', source: 'realms', layout: hidden, filter: ['get', 'far'], paint: { 'line-color': 'rgba(60,45,25,0.55)', 'line-width': 1, 'line-dasharray': [3, 3] } },

    // routes and theme lines
    { id: 'ln-halo', type: 'line', source: 'lines', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#fffaf0', 'line-opacity': ['*', 0.6, ['get', 'op']], 'line-width': 7 } },
    { id: 'ln', type: 'line', source: 'lines', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': ['get', 'color'], 'line-opacity': ['get', 'op'], 'line-width': 3, 'line-dasharray': [0.2, 2] } },
    { id: 'altline', type: 'line', source: 'altlines', paint: { 'line-color': C.alt, 'line-width': 1.4, 'line-dasharray': [2, 2] } },

    // the journey of the current scene
    { id: 'path-halo', type: 'line', source: 'path', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#fffaf0', 'line-opacity': 0.75, 'line-width': 7.5 } },
    { id: 'path', type: 'line', source: 'path', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': ['get', 'color'], 'line-width': 3.4 } },

    // names of seas and lands
    { id: 'regions', type: 'symbol', source: 'labels', maxzoom: 7.2, filter: ['in', ['get', 'kind'], ['literal', ['sea', 'land']]], layout: {
      'text-field': ['get', 'name'], 'text-font': ['case', ['==', ['get', 'kind'], 'sea'], ['literal', FONT_I], ['literal', FONT]],
      'text-size': ['interpolate', ['linear'], ['zoom'], 2.5, 11, 4, 13.5, 7, 20], 'text-letter-spacing': ['case', ['==', ['get', 'kind'], 'sea'], 0.08, 0.32],
      'text-transform': ['case', ['==', ['get', 'kind'], 'land'], 'uppercase', 'none'], 'text-max-width': 7 },
      paint: { 'text-color': ['case', ['==', ['get', 'kind'], 'sea'], '#9db4d4', '#8a7a55'], 'text-opacity': 0.8,
        'text-halo-color': ['case', ['==', ['get', 'kind'], 'sea'], 'rgba(37,52,79,0.6)', 'rgba(246,241,226,0.6)'], 'text-halo-width': 1 } },
    { id: 'river-names', type: 'symbol', source: 'rivers', minzoom: 7, layout: {
      'symbol-placement': 'line', 'text-field': '', 'text-font': FONT_I, 'text-size': ['interpolate', ['linear'], ['zoom'], 7, 11.5, 12, 15],
      'symbol-spacing': 420, 'text-offset': [0, -0.7], 'text-max-angle': 35 },
      paint: { 'text-color': '#3f6f97', 'text-halo-color': C.halo, 'text-halo-width': 1.3 } },
    { id: 'realm-names', type: 'symbol', source: 'labels', layout: { ...hidden,
      'text-field': ['get', 'name'], 'text-font': FONT, 'text-size': ['interpolate', ['linear'], ['zoom'], 5, 11.5, 8, 15], 'text-max-width': 7, 'text-line-height': 1.05, 'symbol-sort-key': ['get', 'sort'] },
      filter: ['==', ['get', 'kind'], 'realm'],
      paint: { 'text-color': '#3d2f17', 'text-halo-color': 'rgba(255,250,240,0.85)', 'text-halo-width': 1.4 } },

    // the edge of the map sheet: beyond it there is no data, so it is shown as a dark margin and not as open sea
    { id: 'margin', type: 'fill', source: 'frame', paint: { 'fill-color': '#141b2e' } },
    { id: 'neatline', type: 'line', source: 'frame', paint: { 'line-color': '#c9b98f', 'line-opacity': 0.55, 'line-width': 1.2 } },

    // towns and countries of today, drawn faintly, to answer "where is that now?"
    { id: 'modern', type: 'symbol', source: 'labels', filter: ['in', ['get', 'kind'], ['literal', ['mcity', 'mcountry']]], layout: {
      'icon-image': ['case', ['==', ['get', 'kind'], 'mcity'], 'modern', ''], 'icon-size': 0.8,
      'text-field': ['get', 'name'], 'text-font': FONT,
      'text-size': ['case', ['==', ['get', 'kind'], 'mcity'], 12.5, 14.5], 'text-letter-spacing': ['case', ['==', ['get', 'kind'], 'mcity'], 0.02, 0.22],
      'text-transform': ['case', ['==', ['get', 'kind'], 'mcity'], 'none', 'uppercase'],
      'text-variable-anchor-offset': ['case', ['==', ['get', 'kind'], 'mcity'], ['literal', ['left', [0.6, 0], 'right', [-0.6, 0], 'top', [0, 0.5], 'bottom', [0, -0.5]]], ['literal', ['center', [0, 0]]]] },
      paint: { 'text-color': ['case', ['==', ['get', 'kind'], 'mcity'], '#3f4657', '#5b5f6b'], 'text-halo-color': 'rgba(246,241,226,0.85)', 'text-halo-width': 1.2, 'text-opacity': 0.9, 'icon-opacity': 0.9 } },

    // every marker and its label
    { id: 'pts', type: 'symbol', source: 'points', filter: ['>=', ['zoom'], ['get', 'mz']], layout: {
      'icon-image': ['get', 'icon'], 'icon-size': ['interpolate', ['linear'], ['zoom'], 2.5, ['*', ['get', 'isz'], 0.6], 5, ['*', ['get', 'isz'], 0.74], 9, ['get', 'isz'], 13, ['*', ['get', 'isz'], 1.15]],
      'icon-allow-overlap': true, 'icon-rotate': ['get', 'irot'],
      'text-field': ['get', 'name'], 'text-font': ['case', ['==', ['get', 'font'], 'i'], ['literal', FONT_I], ['literal', FONT]],
      'text-size': ['interpolate', ['linear'], ['zoom'], 2.5, ['*', ['get', 'tsz'], 0.76], 5, ['*', ['get', 'tsz'], 0.84], 9, ['get', 'tsz'], 13, ['*', ['get', 'tsz'], 1.12]],
      'text-variable-anchor-offset': ANCHORS, 'text-justify': 'auto', 'text-optional': true, 'text-max-width': 8, 'text-line-height': 1.05,
      'text-rotate': ['get', 'trot'], 'text-letter-spacing': ['get', 'sp'], 'symbol-sort-key': ['get', 'sort'], 'text-padding': 3 },
      paint: { 'text-color': ['get', 'tcol'], 'text-halo-color': C.halo, 'text-halo-width': 1.5, 'text-halo-blur': 0.3, 'icon-opacity': ['get', 'op'], 'text-opacity': ['get', 'top'] } },
  ];

  return {
    version: 8,
    name: 'Odyssey',
    'font-faces': { Cormorant: face(cyr, lat, latx), 'Cormorant Italic': face(cyrI, latI, latxI) },
    sources: {
      land: { type: 'geojson', data: geo('land') },
      rivers: { type: 'geojson', data: geo('rivers') },
      ancient: { type: 'geojson', data: geo('ancient') },
      realms: { type: 'geojson', data: geo('realms') },
      borders: { type: 'geojson', data: geo('borders') },
      dem: { ...DEM_SOURCE, attribution: '' },
      frame: { type: 'geojson', data: { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [
        [[-70, -20], [100, -20], [100, 75], [-70, 75], [-70, -20]], [[SHEET[0], SHEET[1]], [SHEET[0], SHEET[3]], [SHEET[2], SHEET[3]], [SHEET[2], SHEET[1]], [SHEET[0], SHEET[1]]]] } } },
      points: { type: 'geojson', data: empty },
      labels: { type: 'geojson', data: empty },
      lines: { type: 'geojson', data: empty },
      altlines: { type: 'geojson', data: empty },
      path: { type: 'geojson', data: empty },
    },
    layers,
  };
}
