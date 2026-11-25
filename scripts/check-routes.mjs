// Checks that sea journeys stay on the water: every route and every scene path of kind "sail"
// is drawn the way the map draws it (a smooth curve through the points) and tested against the coastline.
// Usage: node scripts/check-routes.mjs [file with {id: {kind, pts}}]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(import.meta.dirname, '..');
const land = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/geo/land.json'), 'utf8')).geometry.coordinates
  .map(poly => { const r = poly[0]; let a = Infinity, b = Infinity, c = -Infinity, d = -Infinity; for (const [x, y] of r) { if (x < a) a = x; if (x > c) c = x; if (y < b) b = y; if (y > d) d = y; } return { poly, box: [a, b, c, d] }; });

const inRing = (x, y, ring) => { let inside = false; for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) { const [xi, yi] = ring[i], [xj, yj] = ring[j]; if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside; } return inside; };
export const onLand = (x, y) => land.some(({ poly, box }) => x >= box[0] && x <= box[2] && y >= box[1] && y <= box[3] && inRing(x, y, poly[0]) && !poly.slice(1).some(h => inRing(x, y, h)));

// the same curve the map draws (see src/map/features.ts)
export function smooth(pts, steps = 14) {
  if (pts.length < 3) { const out = []; for (let k = 0; k <= steps; k++) out.push([pts[0][0] + ((pts[1][0] - pts[0][0]) * k) / steps, pts[0][1] + ((pts[1][1] - pts[0][1]) * k) / steps]); return out; }
  const P = [pts[0], ...pts, pts[pts.length - 1]], out = [];
  for (let i = 1; i < P.length - 2; i++) {
    const [p0, p1, p2, p3] = [P[i - 1], P[i], P[i + 1], P[i + 2]];
    for (let k = 0; k < steps; k++) {
      const t = k / steps, t2 = t * t, t3 = t2 * t;
      const f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}

/** Stretches of a path that run over land, ignoring the first and last few hundred metres (a ship starts and ends at a shore). */
export function landHits(pts, slack = 0.012) {
  const line = smooth(pts), hits = [];
  const fine = [];
  for (let i = 0; i < line.length - 1; i++) for (let k = 0; k < 6; k++) fine.push([line[i][0] + ((line[i + 1][0] - line[i][0]) * k) / 6, line[i][1] + ((line[i + 1][1] - line[i][1]) * k) / 6]);
  const far = (p, q) => Math.hypot((p[0] - q[0]) * Math.cos((p[1] * Math.PI) / 180), p[1] - q[1]) > slack;
  let run = null;
  for (const p of fine) {
    const bad = far(p, pts[0]) && far(p, pts[pts.length - 1]) && onLand(p[0], p[1]);
    if (bad) { run ??= { from: p, n: 0 }; run.n++; run.to = p; } else if (run) { hits.push(run); run = null; }
  }
  if (run) hits.push(run);
  return hits.filter(h => h.n >= 2);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const DIR = path.join(ROOT, 'content', 'odyssey');
  const jobs = [];
  const extra = process.argv[2];
  if (extra) for (const [id, v] of Object.entries(JSON.parse(fs.readFileSync(extra, 'utf8')))) jobs.push([id, v.kind || 'sail', v.pts]);
  else {
    for (const r of JSON.parse(fs.readFileSync(path.join(DIR, 'routes.json'), 'utf8'))) if (r.sea !== false) jobs.push(['route ' + r.id, r.kind || 'sail', r.pts]);
    if (fs.existsSync(path.join(DIR, 'scenes.json'))) for (const s of JSON.parse(fs.readFileSync(path.join(DIR, 'scenes.json'), 'utf8'))) if (s.path) jobs.push(['scene ' + s.id, s.path.kind, s.path.pts]);
    if (fs.existsSync(path.join(DIR, 'themes.json'))) for (const t of JSON.parse(fs.readFileSync(path.join(DIR, 'themes.json'), 'utf8'))) for (const l of t.lines || []) if (l.sea) jobs.push(['theme line ' + l.id, 'sail', l.pts]);
  }
  let bad = 0;
  for (const [id, kind, pts] of jobs) {
    if (kind !== 'sail') continue;
    const hits = landHits(pts);
    if (hits.length) { bad++; console.log(id + ': crosses land near ' + hits.map(h => `[${h.from[0].toFixed(3)}, ${h.from[1].toFixed(3)}]…[${h.to[0].toFixed(3)}, ${h.to[1].toFixed(3)}] (${h.n})`).join('; ')); }
  }
  console.log(`${jobs.filter(j => j[1] === 'sail').length} sea journeys checked, ${bad} cross land`);
  process.exit(bad ? 1 : 0);
}
