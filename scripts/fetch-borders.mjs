// Downloads modern land borders (Natural Earth, public domain) and keeps the part inside the map sheet.
// They are shown only in the "Today" layer. Usage: node scripts/fetch-borders.mjs
import fs from 'node:fs';
import path from 'node:path';
const URL_ = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_boundary_lines_land.geojson';
const [W, S, E, N] = [-10, 28, 38, 47];
const src = await (await fetch(URL_)).json();
const inside = ([x, y]) => x >= W && x <= E && y >= S && y <= N;
const features = [];
for (const f of src.features) {
  const lines = f.geometry.type === 'LineString' ? [f.geometry.coordinates] : f.geometry.coordinates;
  for (const line of lines) {
    let run = [];
    const flush = () => { if (run.length > 1) features.push({ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: run } }); run = []; };
    for (const p of line) inside(p) ? run.push([+p[0].toFixed(3), +p[1].toFixed(3)]) : flush();
    flush();
  }
}
const out = path.resolve(import.meta.dirname, '..', 'public', 'geo', 'borders.json');
fs.writeFileSync(out, JSON.stringify({ type: 'FeatureCollection', features }));
console.log(features.length, 'border lines,', Math.round(fs.statSync(out).size / 1024), 'KB');
