// Builds public/geo/land.json: the coastline of the map sheet, cut out of a world coastline
// and simplified. Detail is kept where the story needs it (Ithaca above all) and dropped elsewhere.
// Sources: @geo-maps/earth-lands-100m (OpenStreetMap coastline, ODbL) for the whole sheet, and the finer
// OpenStreetMap coastline saved by fetch-coast-detail.mjs for Ithaca and Cephalonia.
// Usage: node --max-old-space-size=6000 scripts/build-land.mjs <path to map.geo.json>
import fs from 'node:fs';
import path from 'node:path';

const SRC = process.argv[2];
if (!SRC) { console.error('usage: node scripts/build-land.mjs <map.geo.json>'); process.exit(1); }
const OUT = path.resolve(import.meta.dirname, '..', 'public', 'geo', 'land.json');

// The data is cut one degree beyond the map sheet, so the cut itself hides under the margin.
const [W, S, E, N] = [-11, 27, 39, 48];

// [west, south, east, north, tolerance in degrees, smallest island kept (degrees across)]
// A point takes the finest tolerance of all the boxes it falls in.
const DETAIL = [
  [-180, -90, 180, 90, 0.008, 0.03],          // everything
  [11.5, 34.3, 30.5, 42.0, 0.0025, 0.006],    // Greece, the Aegean, southern Italy, Sicily
  [19.5, 37.5, 21.6, 39.9, 0.0008, 0.002],    // the Ionian islands and the coast opposite
  [20.30, 38.02, 20.86, 38.53, 0.0005, 0.0012],  // Cephalonia
  [20.45, 38.25, 20.86, 38.53, 0.00018, 0.0006], // Ithaca and the strait
  [21.0, 36.6, 22.7, 37.3, 0.001, 0.003],     // Pylos, Pherae, Sparta
  [12.9, 40.4, 15.1, 41.4, 0.001, 0.002],     // Circeo to the Sorrento peninsula
  [14.2, 37.9, 16.0, 38.9, 0.001, 0.002],     // the Aeolian islands and the Strait of Messina
  [14.1, 35.7, 14.7, 36.15, 0.001, 0.002],    // Malta and Gozo
  [10.6, 33.5, 11.3, 34.0, 0.0015, 0.004],    // Djerba
  [22.8, 34.7, 23.3, 36.5, 0.0015, 0.004],    // Cape Malea and Cythera
  [25.9, 39.7, 26.6, 40.2, 0.0012, 0.003],    // the Troad
];
const rule = (x, y, k) => { let v = Infinity; for (const d of DETAIL) if (x >= d[0] && x <= d[2] && y >= d[1] && y <= d[3]) v = Math.min(v, d[k]); return v; };

// ---- cut a ring to the box
// The pieces of the ring that lie inside the box are joined along the edge of the box, so the result is
// one or more plain rings. (A simpler cut leaves zero-width bridges along the edge, and the map draws
// those as stray wedges of land.)
const inBox = p => p[0] >= W && p[0] <= E && p[1] >= S && p[1] <= N;
/** The part of segment a–b inside the box, as [t0, t1] with 0 ≤ t0 < t1 ≤ 1, or null. */
function within(a, b) {
  let t0 = 0, t1 = 1;
  const dx = b[0] - a[0], dy = b[1] - a[1];
  for (const [p, q] of [[-dx, a[0] - W], [dx, E - a[0]], [-dy, a[1] - S], [dy, N - a[1]]]) {
    if (p === 0) { if (q < 0) return null; continue; }
    const r = q / p;
    if (p < 0) { if (r > t1) return null; if (r > t0) t0 = r; } else { if (r < t0) return null; if (r < t1) t1 = r; }
  }
  return t1 > t0 ? [t0, t1] : null;
}
/** Position of a point on the edge of the box, counter-clockwise from the south-west corner, 0 to 4. */
function along(p) {
  const d = [Math.abs(p[1] - S), Math.abs(p[0] - E), Math.abs(p[1] - N), Math.abs(p[0] - W)], k = d.indexOf(Math.min(...d));
  return k === 0 ? (p[0] - W) / (E - W) : k === 1 ? 1 + (p[1] - S) / (N - S) : k === 2 ? 2 + (E - p[0]) / (E - W) : 3 + (N - p[1]) / (N - S);
}
const CORNERS = [[W, S], [E, S], [E, N], [W, N]];
const inRingPt = (x, y, ring) => { let c = false; for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) { const [xi, yi] = ring[i], [xj, yj] = ring[j]; if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; } return c; };

function clip(ring) {
  const n = ring.length - 1;
  const start = ring.findIndex((p, i) => i < n && !inBox(p));
  if (start < 0) return [ring];                                   // wholly inside
  let area = 0;
  for (let i = 0; i < n; i++) area += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1];
  const dir = area > 0 ? 1 : -1;                                  // counter-clockwise rings walk the box edge counter-clockwise
  const pieces = [];
  let cur = null;
  for (let s = 0; s < n; s++) {
    const a = ring[(start + s) % n], b = ring[(start + s + 1) % n];
    const t = within(a, b);
    if (!t) continue;
    const at = k => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
    if (t[0] > 0 || !cur) cur = [t[0] > 0 ? at(t[0]) : a];
    cur.push(t[1] < 1 ? at(t[1]) : b);
    if (t[1] < 1) { pieces.push(cur); cur = null; }
  }
  if (!pieces.length) return inRingPt(W, S, ring) ? [[...CORNERS, CORNERS[0]]] : [];
  const entry = pieces.map((p, k) => ({ k, t: along(p[0]) }));
  const used = new Set(), out = [];
  for (let k0 = 0; k0 < pieces.length; k0++) {
    if (used.has(k0)) continue;
    const res = [];
    let k = k0;
    while (!used.has(k)) {
      used.add(k);
      res.push(...pieces[k]);
      const from = along(pieces[k][pieces[k].length - 1]);
      // the next piece is the one whose entry comes first along the edge of the box
      let best = null, gap = Infinity;
      for (const e of entry) { let g = (dir * (e.t - from)) % 4; if (g < 0) g += 4; if (g < gap) { gap = g; best = e; } }
      for (let c = 1; c <= 4; c++) {                              // corners passed on the way
        const corner = dir > 0 ? Math.floor(from) + c : Math.ceil(from) - c;
        let g = (dir * (corner - from)) % 4; if (g < 0) g += 4;
        if (g > 0 && g < gap) res.push(CORNERS[((corner % 4) + 4) % 4]); else if (g >= gap) break;
      }
      k = best.k;
    }
    res.push(res[0]);
    out.push(res);
  }
  return out;
}

// ---- Douglas–Peucker with a tolerance that depends on where the point is
function simplify(ring) {
  const n = ring.length - 1;                                   // the last point repeats the first
  if (n < 4) return ring;
  const keep = new Uint8Array(n + 1);
  // split the ring at its first point and at the point farthest from it
  let far = 0, best = -1;
  for (let i = 1; i < n; i++) { const d = (ring[i][0] - ring[0][0]) ** 2 + (ring[i][1] - ring[0][1]) ** 2; if (d > best) { best = d; far = i; } }
  keep[0] = keep[far] = keep[n] = 1;
  const stack = [[0, far], [far, n]];
  while (stack.length) {
    const [a, b] = stack.pop();
    if (b - a < 2) continue;
    const [ax, ay] = ring[a], [bx, by] = ring[b];
    const k = Math.cos((((ay + by) / 2) * Math.PI) / 180);       // a degree of longitude is shorter than one of latitude
    const dx = (bx - ax) * k, dy = by - ay, len2 = dx * dx + dy * dy;
    let worst = 0, at = -1;
    for (let i = a + 1; i < b; i++) {
      const px = (ring[i][0] - ax) * k, py = ring[i][1] - ay;
      let t = len2 ? (px * dx + py * dy) / len2 : 0; t = Math.max(0, Math.min(1, t));
      const d = Math.hypot(px - t * dx, py - t * dy) / rule(ring[i][0], ring[i][1], 4);   // distance in units of the local tolerance
      if (d > worst) { worst = d; at = i; }
    }
    if (worst > 1) { keep[at] = 1; stack.push([a, at], [at, b]); }
  }
  const out = [];
  for (let i = 0; i <= n; i++) if (keep[i]) out.push(ring[i]);
  return out;
}

const round = ring => {
  const out = [];
  for (const [x, y] of ring) { const p = [+x.toFixed(4), +y.toFixed(4)]; const q = out[out.length - 1]; if (!q || q[0] !== p[0] || q[1] !== p[1]) out.push(p); }
  return out;
};
const boxOf = ring => { let a = Infinity, b = Infinity, c = -Infinity, d = -Infinity; for (const [x, y] of ring) { if (x < a) a = x; if (x > c) c = x; if (y < b) b = y; if (y > d) d = y; } return [a, b, c, d]; };

console.log('reading', SRC);
const src = JSON.parse(fs.readFileSync(SRC, 'utf8'));
const polys = src.geometries ? src.geometries.flatMap(g => (g.type === 'Polygon' ? [g.coordinates] : g.coordinates)) : src.coordinates;
console.log(polys.length, 'polygons in the source');

// Finer coastline for a few islands: it replaces the islands of the world data that lie inside the same box.
const DETAIL_FILE = path.resolve(import.meta.dirname, 'detail', 'coast.json');
const fine = fs.existsSync(DETAIL_FILE) ? JSON.parse(fs.readFileSync(DETAIL_FILE, 'utf8')) : [];
const replaced = ([a, b, c, d]) => fine.some(f => a >= f.box[0] && c <= f.box[2] && b >= f.box[1] && d <= f.box[3]);
for (const f of fine) for (const ring of f.rings) polys.push([ring]);
const fineStart = polys.length - fine.reduce((n, f) => n + f.rings.length, 0);

// Lakes: the source also holds modern reservoirs and desert salt pans. Only large natural lakes are kept.
const lake = ([a, b, c, d]) => {
  const x = (a + c) / 2, y = (b + d) / 2, size = Math.hypot(c - a, d - b);
  if (size < 0.2) return false;
  return (y >= 36.5 && x >= 5 && x <= 33.6) || (x >= 34.8 && x <= 36 && y >= 30.5 && y <= 33.5) || (x >= 30.3 && x <= 31 && y >= 29.2 && y <= 29.7);
};

const out = [];
let pointsIn = 0, pointsOut = 0, dropped = 0;
const finish = ring => {
  const [x0, y0, x1, y1] = boxOf(ring);
  const size = Math.hypot((x1 - x0) * Math.cos((y0 * Math.PI) / 180), y1 - y0);
  if (size < rule((x0 + x1) / 2, (y0 + y1) / 2, 5)) { dropped++; return null; }
  const r = round(simplify(ring));
  if (r.length < 4) { dropped++; return null; }
  pointsOut += r.length;
  return r;
};
for (let pi = 0; pi < polys.length; pi++) {
  const poly = polys[pi];
  const [a, b, c, d] = boxOf(poly[0]);
  if (c < W || a > E || d < S || b > N) continue;
  if (pi < fineStart && replaced([a, b, c, d])) continue;
  for (const ring of poly) pointsIn += ring.length;
  const shells = clip(poly[0]).map(finish).filter(Boolean).map(r => [r]);
  // lakes that lie wholly inside the sheet go to the piece of land that holds them
  for (const hole of poly.slice(1)) {
    const hb = boxOf(hole);
    if (!lake(hb) || hb[0] < W || hb[2] > E || hb[1] < S || hb[3] > N) continue;
    const home = shells.find(sh => inRingPt(hole[0][0], hole[0][1], sh[0]));
    const r = home && finish(hole);
    if (r) home.push(r);
  }
  out.push(...shells);
}
fs.writeFileSync(OUT, JSON.stringify({ type: 'Feature', properties: {}, geometry: { type: 'MultiPolygon', coordinates: out } }));
console.log(`${out.length} polygons kept, ${dropped} small ones dropped; ${pointsIn} points in, ${pointsOut} out; ${Math.round(fs.statSync(OUT).size / 1024)} KB`);
