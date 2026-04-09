/**
 * split-paket.js — Jalankan setiap kali menambah/update paket soal
 * 
 * Cara pakai:
 *   node split-paket.js
 *
 * Input : js/snbt-questions.js  (format window.SNBT_QUESTIONS = { ... })
 * Output: data/paket1.json, paket2.json, ..., index.json
 */

const fs   = require('fs');
const path = require('path');

const INPUT  = path.join(__dirname, 'js', 'snbt-questions.js');
const OUTDIR = path.join(__dirname, 'data', 'snbt');

const src   = fs.readFileSync(INPUT, 'utf8');
const match = src.match(/window\.SNBT_QUESTIONS\s*=\s*(\{[\s\S]*\});?\s*$/);
if (!match) { console.error('❌ window.SNBT_QUESTIONS tidak ditemukan'); process.exit(1); }

const all  = eval('(' + match[1] + ')');
const keys = Object.keys(all);

fs.mkdirSync(OUTDIR, { recursive: true });

keys.forEach(key => {
  const out = path.join(OUTDIR, `${key}.json`);
  fs.writeFileSync(out, JSON.stringify(all[key]));   // minified = lebih kecil
  const kb = (fs.statSync(out).size / 1024).toFixed(1);
  console.log(`✓ ${key}.json  (${kb} KB)`);
});

const index = keys.map(key => ({
  id:     key,
  label:  all[key].label,
  sumber: all[key].sumber,
  tahun:  all[key].tahun,
}));
fs.writeFileSync(path.join(OUTDIR, 'index.json'), JSON.stringify(index, null, 2));

console.log(`\n✅ ${keys.length} paket + index.json → ${OUTDIR}`);
