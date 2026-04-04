/**
 * split-osn.js — Jalankan setiap kali menambah/update soal OSN
 *
 * Cara pakai:
 *   node split-osn.js
 *
 * Input : js/osn-questions.js  (format window.OSN_QUESTIONS = { ... })
 * Output: data/osn-index.json + file JSON per bank/level/paket
 *
 * ── NAMING CONVENTION FILE OUTPUT ──────────────────────────────────────────
 *
 * Level FLAT (soal langsung, tidak berpaking):
 *   data/osn-{bankKey}--{level}.json
 *   contoh: osn-sd_ipa--kabupaten.json
 *           osn-smp_ipa--provinsi.json
 *
 * Level MULTI-PAKET (berisi paket1, paket2, ...):
 *   data/osn-{bankKey}--{level}--{paketKey}.json
 *   contoh: osn-smp_ipa--kabupaten--paket1.json
 *           osn-smp_ipa--kabupaten--paket2.json
 *
 * Prefix "osn-" dan separator "--" memastikan tidak bentrok dengan
 * file SNBT/CPNS/TKA di folder data/ yang sama.
 *
 * ── osn-index.json ─────────────────────────────────────────────────────────
 * Berisi metadata ringan TANPA soal, dipakai osn.js untuk:
 *   - Menampilkan UI pilih mapel/level (tersedia / segera hadir)
 *   - Mengetahui path file yang harus di-fetch (flat vs multi-paket)
 *
 * Format levels per bank:
 *   "kabupaten": {
 *     "type": "flat",            // atau "paket"
 *     "count": 43,               // total soal
 *     "file": "osn-sd_ipa--kabupaten.json"   // jika flat
 *   }
 *   "kabupaten": {
 *     "type": "paket",
 *     "count": 80,
 *     "pakets": [
 *       { "key": "paket1", "label": "Paket 1", "count": 40, "file": "osn-smp_ipa--kabupaten--paket1.json" },
 *       { "key": "paket2", "label": "Paket 2", "count": 40, "file": "osn-smp_ipa--kabupaten--paket2.json" }
 *     ]
 *   }
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
const LEVELS = ['kabupaten', 'provinsi', 'semifinal', 'final'];

fs.mkdirSync(OUTDIR, { recursive: true });

// ── Helpers ────────────────────────────────────────────────────────────────

function isMultiPaket(ld) {
  if (!ld) return false;
  if (Array.isArray(ld.soal)) return false;
  return Object.values(ld).some(v => v && Array.isArray(v.soal));
}

function countFlat(ld) {
  if (!ld) return 0;
  if (Array.isArray(ld.soal)) return ld.soal.length;
  return 0;
}

function countAll(ld) {
  if (!ld) return 0;
  if (Array.isArray(ld.soal)) return ld.soal.length;
  return Object.values(ld)
    .filter(v => v && Array.isArray(v.soal))
    .reduce((s, v) => s + v.soal.length, 0);
}

function write(filename, data) {
  const outPath = path.join(OUTDIR, filename);
  fs.writeFileSync(outPath, JSON.stringify(data));
  const kb = (fs.statSync(outPath).size / 1024).toFixed(1);
  return kb;
}

// ── Proses setiap bank ─────────────────────────────────────────────────────

const index = [];

keys.forEach(bankKey => {
  const bank    = all[bankKey];
  const levelsMeta = {};
  let   totalSoal  = 0;

  console.log(`\n📦 ${bankKey} (${bank.label})`);

  LEVELS.forEach(lv => {
    const ld = bank[lv];

    if (isMultiPaket(ld)) {
      // ── Multi-paket: tulis satu file per paket ──────────────────────────
      const paketKeys  = Object.keys(ld);
      const paketsMeta = [];
      let   lvTotal    = 0;

      paketKeys.forEach(pk => {
        const pd       = ld[pk];
        const count    = pd?.soal?.length || 0;
        const filename = `osn-${bankKey}--${lv}--${pk}.json`;
        const kb       = write(filename, pd);
        lvTotal       += count;
        paketsMeta.push({ key: pk, label: pd.label || pk, count, file: filename });
        console.log(`  ✓ ${filename}  (${kb} KB, ${count} soal)`);
      });

      levelsMeta[lv] = { type: 'paket', count: lvTotal, pakets: paketsMeta };
      totalSoal     += lvTotal;

    } else {
      // ── Flat: satu file per level ───────────────────────────────────────
      const count    = countFlat(ld);
      const filename = `osn-${bankKey}--${lv}.json`;
      const kb       = write(filename, ld || { label: '', sumber: '', soal: [] });

      levelsMeta[lv] = { type: 'flat', count, file: filename };
      totalSoal     += count;
      console.log(`  ✓ ${filename}  (${kb} KB, ${count} soal)`);
    }
  });

  index.push({
    key:     bankKey,
    label:   bank.label,
    jenjang: bank.jenjang,
    mapel:   bank.mapel,
    icon:    bank.icon,
    levels:  levelsMeta,
    total:   totalSoal,
  });
});

// ── Tulis index ────────────────────────────────────────────────────────────
fs.writeFileSync(path.join(OUTDIR, 'osn-index.json'), JSON.stringify(index, null, 2));
console.log(`\n✅ osn-index.json + ${keys.length} bank → ${OUTDIR}`);
