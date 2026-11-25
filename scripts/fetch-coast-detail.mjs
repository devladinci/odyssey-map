// Downloads a finer coastline for the islands where most of the poem happens (Ithaca and Cephalonia)
// and stores it in scripts/detail/coast.json. build-land.mjs uses it in place of the coarser world data.
// Source: OpenStreetMap coastline through the Overpass API (ODbL).
// Usage: node scripts/fetch-coast-detail.mjs
import fs from 'node:fs';
import path from 'node:path';

// [south, west, north, east]: only islands that lie wholly inside a box are taken
const BOXES = [
  { name: 'Ithaca and Cephalonia', box: [38.02, 20.30, 38.53, 20.86] },
];
const API = 'https://overpass-api.de/api/interpreter';
const OUT = path.resolve(import.meta.dirname, 'detail', 'coast.json');

const result = [];
for (const b of BOXES) {
  const [s, w, n, e] = b.box;
  const query = `[out:json][timeout:90];way["natural"="coastline"](${s},${w},${n},${e});out geom;`;
  const res = await fetch(API, { method: 'POST', headers: { 'User-Agent': 'map-build-script' }, body: new URLSearchParams({ data: query }) });
  if (!res.ok) throw new Error(`Overpass answered ${res.status}`);
  const ways = (await res.json()).elements.filter(x => x.type === 'way' && x.geometry?.length > 1);
  // Stitch the ways end to end into closed rings.
  const byStart = new Map(ways.map(wy => [wy.nodes[0], wy]));
  const used = new Set(), rings = [];
  for (const first of ways) {
    if (used.has(first.id)) continue;
    const pts = [];
    let cur = first, closed = false;
    while (cur && !used.has(cur.id)) {
      used.add(cur.id);
      for (const g of cur.geometry.slice(pts.length ? 1 : 0)) pts.push([+g.lon.toFixed(5), +g.lat.toFixed(5)]);
      const end = cur.nodes[cur.nodes.length - 1];
      if (end === first.nodes[0]) { closed = true; break; }
      cur = byStart.get(end);
    }
    if (!closed) continue;                                        // a piece of mainland that leaves the box
    const inside = pts.every(([x, y]) => x >= w && x <= e && y >= s && y <= n);
    if (inside) rings.push(pts);
  }
  rings.sort((a, c) => c.length - a.length);
  console.log(b.name + ':', rings.length, 'islands,', rings.reduce((a, r) => a + r.length, 0), 'points; largest', rings.slice(0, 4).map(r => r.length).join(', '));
  result.push({ name: b.name, box: [w, s, e, n], rings });
}
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(result));
console.log('written', Math.round(fs.statSync(OUT).size / 1024), 'KB');
