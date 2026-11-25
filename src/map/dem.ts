// Elevation tiles are stored only where the map needs them: fine detail on Ithaca, coarser elsewhere.
// This small loader tells MapLibre straight away when a tile does not exist, so it falls back to the
// coarser parent tile without a failed network request.
import { addProtocol } from 'maplibre-gl';

let tiles = new Set<string>();
let ready: Promise<void> | null = null;
const base = () => new URL('terrain/', document.baseURI).href;

export function loadDemManifest(): Promise<void> {
  ready ??= fetch(base() + 'manifest.json')
    .then(r => r.json())
    .then((m: { tiles: string[] }) => { tiles = new Set(m.tiles); })
    .catch(() => { tiles = new Set(); });
  return ready;
}

export function registerDemProtocol() {
  addProtocol('dem', async (params, abort) => {
    const key = params.url.slice('dem://'.length);
    if (!tiles.has(key)) throw new Error('no elevation tile ' + key);
    const res = await fetch(`${base()}${key}.webp`, { signal: abort.signal });
    if (!res.ok) throw new Error('elevation tile failed ' + key);
    return { data: await res.arrayBuffer() };
  });
}

export const DEM_SOURCE = {
  type: 'raster-dem' as const,
  tiles: ['dem://{z}/{x}/{y}'],
  tileSize: 512,
  encoding: 'terrarium' as const,
  minzoom: 2,
  maxzoom: 12,
  bounds: [-11, 27, 39, 48] as [number, number, number, number],
};
