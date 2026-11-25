// Builds public/geo/rivers.json: the rivers of the Aegean that the sister Iliad Map already draws
// (scripts/detail/rivers-aegean.json: Natural Earth and OpenStreetMap) plus the large rivers of the wider sheet
// from Natural Earth (public domain). Usage: node scripts/fetch-rivers.mjs
import fs from 'node:fs';
import path from 'node:path';
const URL_ = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_rivers_lake_centerlines.geojson';
const [W, S, E, N] = [-10, 28, 38, 47];
// Natural Earth name -> [id on the map, line width]
const WANT = { Nile: ['aigyptos', 2.2], 'Rosetta Branch': ['aigyptos', 1.7], 'Damietta Branch': ['aigyptos', 1.7], Danube: ['danube', 1.9], Po: ['po', 1.6], Tevere: ['tiber', 1.4], 'Rhône': ['rhone', 1.5], Ebro: ['ebro', 1.5] };
const base = JSON.parse(fs.readFileSync(path.resolve(import.meta.dirname, 'detail', 'rivers-aegean.json'), 'utf8'));
const src = await (await fetch(URL_)).json();
const inside = ([x, y]) => x >= W && x <= E && y >= S && y <= N;
const features = [...base.features];
for (const f of src.features) {
  const want = WANT[f.properties.name]; if (!want || !f.geometry || f.properties.featurecla !== 'River') continue;
  const lines = f.geometry.type === 'LineString' ? [f.geometry.coordinates] : f.geometry.coordinates;
  for (const line of lines) {
    let run = [];
    const flush = () => { if (run.length > 1) features.push({ type: 'Feature', properties: { river: want[0], kind: 'modern', w: want[1] }, geometry: { type: 'LineString', coordinates: run } }); run = []; };
    for (const p of line) inside(p) ? run.push([+p[0].toFixed(3), +p[1].toFixed(3)]) : flush();
    flush();
  }
}
const out = path.resolve(import.meta.dirname, '..', 'public', 'geo', 'rivers.json');
fs.writeFileSync(out, JSON.stringify({ type: 'FeatureCollection', features }));
console.log(features.length, 'river lines,', Math.round(fs.statSync(out).size / 1024), 'KB');
