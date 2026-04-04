/**
 * split-osn.js — Jalankan setiap kali menambah/update soal OSN
 *
 * Cara pakai:
 *   node split-osn.js
 *
 * Input : js/osn-questions.js  (format window.OSN_QUESTIONS = { ... })
 * Output: data/osn-index.json, data/osn-sd_ipa.json, data/osn-smp_ipa.json, dst.
 *
 * Naming convention: osn-{bankKey}.json  (contoh: osn-sd_ipa.json, osn-sma_biologi.json)
 * agar tidak bentrok dengan file SNBT/CPNS/TKA di folder data/ yang sama.
 *
 * Mendukung DUA struktur level:
 *   1. Flat  : { label, sumber, soal: [...] }
 *   2. Paket : { paket1: { label, sumber, soal: [...] }, paket2: {...}, ... }
 */

const fs   = require('fs');
const path = require('path');

const INPUT  = path.join(__dirname, 'js', 'osn-questions.js');
const OUTDIR = path.join(__dirname, 'data');

const src   = fs.readFileSync(INPUT, 'utf8');
const match = src.match(/window\.OSN_QUESTIONS\s*=\s*(\{[\s\S]*\});?\s*$/);
if (!match) { console.error('❌ window.OSN_QUESTIONS tidak ditemukan'); process.exit(1); }

const all  = eval('(' + match[1] + ')');
const keys = Object.keys(all);

fs.mkdirSync(OUTDIR, { recursive: true });

/**
 * Hitung total soal dari satu level — mendukung flat & multi-paket.
 *   Flat   : ld.soal adalah array langsung
 *   Paket  : ld adalah { paket1: { soal: [...] }, paket2: { soal: [...] } }
 */
function countSoal(ld) {
  if (!ld) return 0;
  if (Array.isArray(ld.soal)) return ld.soal.length;
  return Object.values(ld)
    .filter(v => v && Array.isArray(v.soal))
    .reduce((sum, v) => sum + v.soal.length, 0);
}

// Tulis setiap bank sebagai file JSON terpisah
keys.forEach(key => {
  const out = path.join(OUTDIR, `osn-${key}.json`);
  fs.writeFileSync(out, JSON.stringify(all[key]));
  const kb    = (fs.statSync(out).size / 1024).toFixed(1);
  const total = ['kabupaten','provinsi','semifinal','final']
    .reduce((s, lv) => s + countSoal(all[key][lv]), 0);
  console.log(`✓ osn-${key}.json  (${kb} KB, ${total} soal)`);
});

// Tulis osn-index.json: metadata ringan TANPA data soal
const index = keys.map(key => {
  const val    = all[key];
  const levels = {};
  ['kabupaten','provinsi','semifinal','final'].forEach(lv => {
    levels[lv] = countSoal(val[lv]);
  });
  return { key, label: val.label, jenjang: val.jenjang, mapel: val.mapel, icon: val.icon, levels };
});

fs.writeFileSync(path.join(OUTDIR, 'osn-index.json'), JSON.stringify(index, null, 2));
console.log(`\n✅ ${keys.length} bank + osn-index.json → ${OUTDIR}`);
