// Marker pictures, drawn as small SVGs and handed to the map.
// Shape tells the kind of place, colour the side, and the filling how sure the location is:
// full = certain, half = approximate, hollow with "?" = disputed.
import type { Map as MlMap } from 'maplibre-gl';
import { C } from '../theme';
import { THEMES } from '../content';

const W = '#fffaf0';
type Shape = 'circle' | 'square';

function body(shape: Shape, r: number, attrs: string) {
  return shape === 'circle'
    ? `<circle cx="16" cy="16" r="${r}" ${attrs}/>`
    : `<rect x="${16 - r}" y="${16 - r}" width="${2 * r}" height="${2 * r}" rx="${r * 0.3}" ${attrs}/>`;
}
function marker(shape: Shape, col: string, cert: number, r = 9): string {
  if (cert === 1) return body(shape, r, `fill="${col}" stroke="${W}" stroke-width="2.4"`);
  if (cert === 2) {
    return `<defs><clipPath id="h"><rect x="0" y="0" width="16" height="32"/></clipPath></defs>`
      + body(shape, r, `fill="${W}" stroke="${col}" stroke-width="2.4"`)
      + `<g clip-path="url(#h)">${body(shape, r - 2.6, `fill="${col}"`)}</g>`;
  }
  return body(shape, r, `fill="${W}" stroke="${col}" stroke-width="2.2" stroke-dasharray="3.2 2.4"`)
    + `<text x="16" y="20.6" text-anchor="middle" font-family="Georgia,serif" font-weight="700" font-size="12.5" fill="${col}">?</text>`;
}
const disc = (col: string, inner: string) => `<circle cx="16" cy="16" r="11" fill="${col}" stroke="${W}" stroke-width="2"/>${inner}`;

// Small white pictures for theme markers.
const GLYPH: Record<string, string> = {
  fire: `<path d="M16 8c1 3 5 5 5 9.5a5 5 0 0 1-10 0c0-2 1-3 2-4 0 1.500 1 2.200 1.800 2.200C15 13 14.500 10.500 16 8z" fill="${W}"/>`,
  temple: `<path d="M9 13.500 16 9l7 4.500v1.300H9zM10.500 16h1.900v5h-1.900zm4.550 0h1.900v5h-1.900zm4.550 0h1.900v5h-1.900zM9 22h14v1.800H9z" fill="${W}"/>`,
  tablet: `<rect x="10.500" y="9" width="11" height="14" rx="1.800" fill="${W}"/><path d="M12.500 12.500h7M12.500 15.500h7M12.500 18.500h4.500" stroke="#444" stroke-width="1.100"/>`,
  res: `<path d="M16 9l6 5-6 9-6-9z" fill="${W}"/>`,
  tomb: `<path d="M9 22.500c0-6 3-10 7-10s7 4 7 10z" fill="${W}"/>`,
  edge: `<path d="M16 9v11m0 0-4.500-4.500M16 20l4.500-4.500M10 23.500h12" stroke="${W}" stroke-width="2.200" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
  hub: `<circle cx="16" cy="16" r="3.200" fill="${W}"/><path d="M16 8.500v3.500m0 8v3.500M8.500 16H12m8 0h3.500" stroke="${W}" stroke-width="2" stroke-linecap="round"/>`,
  rose: `<path d="M16 7.500l2.200 6.300 6.300 2.200-6.300 2.200L16 24.500l-2.200-6.300L7.500 16l6.300-2.200z" fill="${W}"/>`,
  coast: `<path d="M8.500 14c2.500-2.500 5-2.500 7.500 0s5 2.500 7.500 0M8.500 19c2.500-2.500 5-2.500 7.500 0s5 2.500 7.500 0" stroke="${W}" stroke-width="2.200" fill="none" stroke-linecap="round"/>`,
  ship: `<path d="M9 18.500h14l-2.200 4.300h-9.600zM15.300 8.500v8.700h-5zM16.700 10.500l5 6.700h-5z" fill="${W}"/>`,
  eye: `<path d="M7.500 16c2.300-3.700 5.100-5.500 8.500-5.500s6.200 1.800 8.500 5.500c-2.300 3.700-5.100 5.500-8.500 5.500S9.800 19.700 7.500 16z" fill="${W}"/><circle cx="16" cy="16" r="2.600" fill="#444"/>`,
  crowd: `<circle cx="12" cy="12.500" r="2.600" fill="${W}"/><circle cx="20" cy="12.500" r="2.600" fill="${W}"/><path d="M7.500 22.500c0-3.300 2-5.300 4.500-5.300s4.500 2 4.500 5.300zM15.500 22.500c0-3.300 2-5.300 4.500-5.300s4.500 2 4.500 5.300z" fill="${W}"/>`,
  scroll: `<path d="M10 9.500h10.500a2 2 0 0 1 2 2v11H12a2 2 0 0 1-2-2z" fill="${W}"/><path d="M13 13.500h6.500M13 16.500h6.500M13 19.500h4" stroke="#444" stroke-width="1.100"/>`,
  q: `<text x="16" y="21.500" text-anchor="middle" font-family="Georgia,serif" font-weight="700" font-size="15" fill="${W}">?</text>`,
};

let memo: Record<string, string> | null = null;
function all(): Record<string, string> {
  if (memo) return memo;
  const out: Record<string, string> = {};
  const sides: [string, Shape, string][] = [['hom', 'circle', C.bronze], ['wan', 'square', C.crimson], ['sto', 'circle', C.olive]];
  for (const [key, shape, col] of sides) for (const c of [1, 2, 3]) out[`${key}-${c}`] = marker(shape, col, c, key === 'sto' ? 7.5 : 9);
  out['evt'] = `<rect x="9.200" y="9.200" width="13.600" height="13.600" rx="1.600" transform="rotate(45 16 16)" fill="${C.event}" stroke="${W}" stroke-width="2.200"/>`;
  out['evt-hot'] = `<rect x="7.700" y="7.700" width="16.600" height="16.600" rx="2" transform="rotate(45 16 16)" fill="${C.eventD}" stroke="${W}" stroke-width="2.600"/>`;
  out['peak'] = `<path d="M16 6.500 26 24.500H6z" fill="${C.olive}" stroke="${W}" stroke-width="2.200" stroke-linejoin="round"/>`;
  out['dig'] = `<rect x="9" y="9" width="14" height="14" rx="2" fill="${C.dig}" stroke="${W}" stroke-width="2.200"/><path d="M12.500 19.500l7-7m-4.500-.500 5 5" stroke="${W}" stroke-width="1.700" stroke-linecap="round"/>`;
  out['alt'] = `<circle cx="16" cy="16" r="8" fill="rgba(255,250,240,.75)" stroke="${C.alt}" stroke-width="2.200" stroke-dasharray="3 2.400"/>`;
  out['modern'] = `<rect x="11" y="11" width="10" height="10" fill="#f6f1e2" stroke="#3f4657" stroke-width="2"/>`;
  out['point'] = `<circle cx="16" cy="16" r="6.500" fill="${W}" stroke="${C.event}" stroke-width="2.600"/>`;
  for (const th of THEMES) for (const ic of new Set((th.items || []).map(i => i.icon))) out[`th-${th.id}-${ic}`] = disc(th.color, GLYPH[ic] || '');
  return (memo = out);
}

function load(svgBody: string): Promise<HTMLImageElement> {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 32 32">${svgBody}</svg>`;
  return new Promise((resolve, reject) => {
    const img = new Image(64, 64);
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  });
}

export async function addIcons(map: MlMap) {
  const icons = all();
  await Promise.all(Object.entries(icons).map(async ([name, svg]) => {
    const img = await load(svg);
    if (!map.hasImage(name)) map.addImage(name, img, { pixelRatio: 2 });
  }));
}

/** The same pictures for use in panels and the legend. */
export function iconSvg(name: string, size = 20): string {
  const svg = all()[name] || '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 32 32" aria-hidden="true">${svg}</svg>`;
}
