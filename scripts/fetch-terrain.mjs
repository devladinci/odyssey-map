// Downloads the elevation tiles the map needs and stores them in public/terrain/.
// Source: Mapterhorn (https://mapterhorn.com), built mostly from Copernicus GLO-30 for this area.
// The tiles are 512 px WebP images in Terrarium encoding.
// Detail is kept only where the map needs it: fine on Ithaca, coarser further away.
// Usage: node scripts/fetch-terrain.mjs
import fs from 'node:fs';
import path from 'node:path';
import { PMTiles } from 'pmtiles';

const ARCHIVE = 'https://download.mapterhorn.com/planet.pmtiles';
const OUT = path.resolve(import.meta.dirname, '..', 'public', 'terrain');

// [west, south, east, north] and the zoom levels to keep for that box
const AREAS = [
  { name: 'whole map', box: [-10, 28, 38, 47], zooms: [2, 3, 4, 5, 6] },
  { name: 'central and eastern Mediterranean', box: [8, 30, 36, 44], zooms: [7] },
  { name: 'southern Italy, Sicily, Greece and the Aegean', box: [12, 34.5, 29, 42], zooms: [8] },
  { name: 'Ionian islands, Epirus and the Peloponnese', box: [19.3, 36.0, 23.3, 39.9], zooms: [9] },
  { name: 'Aeolian islands and the Strait of Messina', box: [14.2, 37.9, 16.0, 38.9], zooms: [9] },
  { name: 'Circeo to the Sorrento peninsula', box: [12.9, 40.4, 15.1, 41.4], zooms: [9] },
  { name: 'Malta and Gozo', box: [14.1, 35.75, 14.65, 36.12], zooms: [9] },
  { name: 'Djerba', box: [10.65, 33.6, 11.2, 33.95], zooms: [9] },
  { name: 'Troad', box: [25.9, 39.7, 26.6, 40.2], zooms: [9] },
  { name: 'Ithaca and Cephalonia', box: [20.3, 38.02, 20.95, 38.6], zooms: [10, 11] },
  { name: 'Pylos', box: [21.55, 36.85, 21.8, 37.1], zooms: [10] },
  { name: 'Ithaca', box: [20.56, 38.29, 20.78, 38.51], zooms: [12] },
];

const tx = (lon, z) => Math.floor(((lon + 180) / 360) * 2 ** z);
const ty = (lat, z) => { const r = (lat * Math.PI) / 180; return Math.floor(((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * 2 ** z); };

const jobs = [];
for (const a of AREAS) for (const z of a.zooms) {
  const [w, s, e, n] = a.box;
  for (let x = tx(w, z); x <= tx(e, z); x++) for (let y = ty(n, z); y <= ty(s, z); y++) jobs.push([z, x, y]);
}
console.log(jobs.length, 'tiles to fetch');

const archive = new PMTiles(ARCHIVE);
const have = [];
let bytes = 0, done = 0;
async function worker() {
  for (;;) {
    const job = jobs.pop(); if (!job) return;
    const [z, x, y] = job;
    const file = path.join(OUT, String(z), String(x), y + '.webp');
    if (!fs.existsSync(file)) {
      let tile = null;
      for (let attempt = 0; attempt < 4 && !tile; attempt++) {
        try { tile = (await archive.getZxy(z, x, y)) || 'none'; } catch (err) { if (attempt === 3) throw err; await new Promise(r => setTimeout(r, 800 * (attempt + 1))); }
      }
      if (tile === 'none' || !tile.data) { done++; continue; }
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, Buffer.from(tile.data));
    }
    bytes += fs.statSync(file).size; have.push(`${z}/${x}/${y}`); done++;
    if (done % 50 === 0) console.log(done, 'done,', (bytes / 1e6).toFixed(1), 'MB');
  }
}
await Promise.all(Array.from({ length: 6 }, worker));
have.sort();
fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify({ format: 'webp', encoding: 'terrarium', tileSize: 512, minzoom: 2, maxzoom: 12, tiles: have }));
console.log('finished:', have.length, 'tiles,', (bytes / 1e6).toFixed(1), 'MB');
