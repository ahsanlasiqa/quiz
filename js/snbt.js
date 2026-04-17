/* ============================================================
   SIMULASI UTBK SNBT — Logic
   Mode Try Out Lengkap:
   ─ Tes Potensi Skolastik (TPS) — 90 soal · 90 menit
     1. Penalaran Umum (PU)            : 30 soal
     2. Pengetahuan & Pemahaman Umum   : 20 soal
     3. Pemahaman Bacaan & Menulis     : 20 soal
     4. Pengetahuan Kuantitatif        : 20 soal
   ─ Tes Literasi — 70 soal · 90 menit
     5. Literasi Bahasa Indonesia      : 30 soal
     6. Literasi Bahasa Inggris        : 20 soal
     7. Penalaran Matematika           : 20 soal
   ─ Paket Lengkap (TPS + Literasi)   — 160 soal · 195 menit
   ============================================================ */

window.SNBT = (function() {

  const SEMUA_SEKSI = [
    { key: 'pu',           label: 'PU',    fullLabel: '🧠 Penalaran Umum',                jumlah: 30, warna: '#1a5a9a', tes: 'tps'      },
    { key: 'ppu',          label: 'PPU',   fullLabel: '📖 Peng. & Pemahaman Umum',         jumlah: 20, warna: '#1a7a6e', tes: 'tps'      },
    { key: 'pbm',          label: 'PBM',   fullLabel: '✍️ Pemahaman Bacaan & Menulis',     jumlah: 20, warna: '#c47a1a', tes: 'tps'      },
    { key: 'pk',           label: 'PK',    fullLabel: '🔢 Pengetahuan Kuantitatif',        jumlah: 20, warna: '#8b2a8b', tes: 'tps'      },
    { key: 'literasi_bi',  label: 'L.BI',  fullLabel: '🇮🇩 Literasi Bahasa Indonesia',     jumlah: 30, warna: '#c41a1a', tes: 'literasi' },
    { key: 'literasi_ing', label: 'L.ING', fullLabel: '🇬🇧 Literasi Bahasa Inggris',       jumlah: 20, warna: '#1a6ac4', tes: 'literasi' },
    { key: 'literasi_mat', label: 'L.MAT', fullLabel: '📐 Penalaran Matematika',           jumlah: 20, warna: '#6a1ac4', tes: 'literasi' },
  ];

  const MODES = {
    tps: {
      label: 'Tes Potensi Skolastik',
      icon: '🧠', desc: 'PU · PPU · PBM · PK',
      detail: '90 soal · 90 menit', waktu: 90,
      seksi: ['pu', 'ppu', 'pbm', 'pk'],
    },
    literasi: {
      label: 'Tes Literasi',
      icon: '📚', desc: 'Literasi BI · Literasi ING · Penalaran Mat',
      detail: '70 soal · 90 menit', waktu: 90,
      seksi: ['literasi_bi', 'literasi_ing', 'literasi_mat'],
    },
    lengkap: {
      label: 'Try Out Lengkap',
      icon: '🎯', desc: 'TPS + Literasi — Simulasi Penuh',
      detail: '160 soal · 195 menit', waktu: 195,
      seksi: ['pu','ppu','pbm','pk','literasi_bi','literasi_ing','literasi_mat'],
    },
  };

  let state = {
    paket: null, mode: null,
    activeSections: [], allQuestions: [], answers: [],
    currentIdx: 0, timerInterval: null, secondsLeft: 0,
    phase: 'select', startTime: null,
  };

  // ══ LAZY LOADER ══════════════════════════════════════════════
  // Menggantikan window.SNBT_QUESTIONS yang dulu di-load sekaligus.
  // index.json  = daftar paket ringan (label, sumber, tahun) — di-load saat init
  // paketX.json = soal lengkap — di-load hanya saat user mau mulai quiz
  const _cache = {};  // in-memory cache: tidak fetch ulang paket yang sama

  async function _fetchIndex() {
    if (_cache['__index__']) return _cache['__index__'];
    const res = await fetch('/data/snbt/index.json');
    if (!res.ok) throw new Error('Gagal memuat daftar paket');
    _cache['__index__'] = await res.json();
    return _cache['__index__'];
  }

  async function _fetchPaket(paketId) {
    if (_cache[paketId]) return _cache[paketId];
    const res = await fetch(`/data/snbt/${paketId}.json`);
    if (!res.ok) throw new Error(`Paket "${paketId}" tidak ditemukan`);
    _cache[paketId] = await res.json();
    return _cache[paketId];
  }
  // ─────────────────────────────────────────────────────────────

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function escHtml(str) {
    return String(str || '')
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function fmtTime(s) {
    return String(Math.floor(s/60)).padStart(2,'0') + ':' + String(s%60).padStart(2,'0');
  }

  function getSectionStart(secKey) {
    let start = 0;
    for (const sec of state.activeSections) {
      if (sec.key === secKey) return start;
      start += sec.jumlah;
    }
    return 0;
  }

  function buildQuestions(bank, sections) {
    // bank = data paket yang sudah di-fetch (bukan window.SNBT_QUESTIONS[key])
    const all = [];
    sections.forEach(sec => {
      shuffle(bank[sec.key] || []).slice(0, sec.jumlah)
        .forEach((q, i) => all.push({ ...q, section: sec.key, sectionIdx: i }));
    });
    return all;
  }

  // ── init: load index dulu, lalu render pilih paket ───────────
  async function init() {
    state.phase = 'select';
    const container = document.getElementById('snbt-container');
    container.innerHTML = `<div style="text-align:center;padding:40px;opacity:.6">⏳ Memuat daftar paket…</div>`;
    try {
      const index = await _fetchIndex();
      renderSelectPaket(index);
    } catch(e) {
      container.innerHTML = `<div style="text-align:center;padding:40px;color:red">❌ Gagal memuat paket. Coba refresh halaman.</div>`;
    }
  }

  // ══ PHASE 1: PILIH PAKET & MODE ══════════════════════════════
  function renderSelectPaket(index) {
    // index = array { id, label, sumber, tahun } dari index.json
    const container = document.getElementById('snbt-container');
    const isPremium = window._isPremium?.() || false;

    const paketCards = index.map((p, idx) => {
      const isLocked = idx > 0 && !isPremium;
      return `
        <button class="cpns-paket-btn${isLocked ? ' cpns-paket-locked' : ''}"
          onclick="${isLocked ? `window._requirePremium()` : `window.SNBT.previewPaket('${p.id}')`}">
          <div class="cpns-paket-num">${p.label}${isLocked ? ' 🔒' : ''}</div>
          <div class="cpns-paket-src">${p.sumber}${p.tahun ? ' · '+p.tahun : ''}</div>
          <div class="cpns-paket-meta">
            <span>🧠 TPS (90 soal)</span>
            <span>📚 Literasi (70 soal)</span>
            ${isLocked ? '<span class="paket-lock-badge">Premium</span>' : ''}
          </div>
        </button>`;}).join('');

    container.innerHTML = `
      <div class="cpns-select-wrap">
        <div class="snbt-hero">
          <div class="cpns-hero-badge" style="background:rgba(26,90,154,0.2);color:#6aacff;border-color:rgba(26,90,154,0.3)">
            🎓 Try Out UTBK SNBT
          </div>
          <h2 class="cpns-hero-title">Simulasi<br/>UTBK SNBT</h2>
          <p class="cpns-hero-sub">TPS + Literasi · Format resmi SNBT<br/>Pilih paket, pilih mode, mulai berlatih</p>
        </div>

        <p class="cpns-choose-label">Pilih Paket Soal</p>
        <div class="cpns-paket-grid">${paketCards}</div>

        <div id="snbt-mode-wrap" style="display:none">
          <p class="cpns-choose-label" style="margin-top:20px">Pilih Mode Try Out</p>
          <div class="snbt-mode-grid" id="snbt-mode-grid"></div>
        </div>

        <div class="cpns-confirm-panel" id="snbt-confirm-panel" style="display:none;border-color:#1a5a9a">
          <div class="cpns-confirm-info" id="snbt-confirm-info"></div>
          <button class="cpns-btn-start" style="background:#1a5a9a" onclick="window.SNBT.startPaket()">
            Mulai Try Out ▶
          </button>
        </div>
        <p class="tka-credit-note">${window._isPremium?.() ? '✅ Gratis untuk subscriber' : '🔓 Paket 1 gratis · Berlangganan untuk semua paket'}</p>
      </div>`;

    // Simpan index ke state agar previewPaket bisa pakai
    state._index = index;
  }

  // previewPaket: gunakan data index (ringan), tidak perlu fetch soal
  function previewPaket(paketId) {
    // Guard: paket 2+ hanya untuk premium
    const idx = (state._index || []).findIndex(x => x.id === paketId);
    if (idx > 0 && window._requirePremium?.()) return;

    document.querySelectorAll('#snbt-container .cpns-paket-btn').forEach(btn => {
      const key = btn.querySelector('.cpns-paket-num')?.textContent;
      const p   = (state._index || []).find(x => x.id === paketId);
      btn.classList.toggle('selected', btn.querySelector('.cpns-paket-num')?.textContent === p?.label);
    });
    state.paket = paketId;
    state.mode  = null;
    document.getElementById('snbt-confirm-panel').style.display = 'none';

    // Untuk preview mode, kita tidak tahu persis seksi apa yang ada
    // tanpa fetch soal. Tampilkan semua mode sebagai tersedia.
    // Jika paket ternyata tidak punya seksi tertentu, buildQuestions akan menghasilkan array kosong.
    const modeCards = Object.entries(MODES).map(([mk, mc]) => `
        <button class="snbt-mode-btn" id="snbt-mode-${mk}"
          onclick="window.SNBT.selectMode('${mk}')">
          <div class="snbt-mode-icon">${mc.icon}</div>
          <div class="snbt-mode-body">
            <div class="snbt-mode-label">${mc.label}</div>
            <div class="snbt-mode-desc">${mc.desc}</div>
            <div class="snbt-mode-detail">${mc.detail}</div>
          </div>
        </button>`).join('');

    document.getElementById('snbt-mode-grid').innerHTML = modeCards;
    document.getElementById('snbt-mode-wrap').style.display = 'block';
  }

  function selectMode(modeKey) {
    state.mode = modeKey;
    document.querySelectorAll('.snbt-mode-btn').forEach(b => b.classList.remove('selected'));
    document.getElementById('snbt-mode-' + modeKey)?.classList.add('selected');
    const mc = MODES[modeKey];
    const p  = (state._index || []).find(x => x.id === state.paket) || {};
    document.getElementById('snbt-confirm-info').innerHTML =
      `<span class="tka-confirm-jenjang">${mc.icon} ${mc.label} · ${p.label || ''}</span>` +
      `<span class="tka-confirm-detail">${mc.detail} · ${mc.desc}</span>`;
    document.getElementById('snbt-confirm-panel').style.display = 'flex';
  }

  // ══ PHASE 2: QUIZ ════════════════════════════════════════════
  // startPaket: BARU di sini fetch soal lengkap (lazy)
  async function startPaket() {
    if (!state.paket || !state.mode) return;
    const isPremium = window._isPremium?.() || false;
    if (!isPremium && (window._currentCredits ?? 0) <= 0) {
      window.renderCreditsBanner?.(); window.showPricingModal?.('pro'); return;
    }

    // Tampilkan loading sebelum fetch
    const container = document.getElementById('snbt-container');
    container.innerHTML = `<div style="text-align:center;padding:60px;opacity:.6">⏳ Memuat soal…</div>`;

    let bank;
    try {
      bank = await _fetchPaket(state.paket);
    } catch(e) {
      container.innerHTML = `<div style="text-align:center;padding:40px;color:red">❌ Gagal memuat soal. Coba lagi.</div>`;
      return;
    }

    const mc = MODES[state.mode];
    state.activeSections = SEMUA_SEKSI.filter(s => mc.seksi.includes(s.key));
    state.allQuestions   = buildQuestions(bank, state.activeSections);
    state.answers        = new Array(state.allQuestions.length).fill(null);
    state.currentIdx     = 0;
    state.phase          = 'quiz';
    state.startTime      = Date.now();
    state.secondsLeft    = mc.waktu * 60;

    renderQuizShell();
    renderQuestion(0);
    startTimer();
  }

  function tabBtn(sec) {
    return `<button class="cpns-section-tab" id="snbt-stab-${sec.key}"
      style="--sec-color:${sec.warna}" onclick="window.SNBT.jumpToSection('${sec.key}')">${sec.label}</button>`;
  }

  function renderQuizShell() {
    const total = state.allQuestions.length;
    const mc    = MODES[state.mode];

    let tabsHtml = '';
    if (state.mode === 'lengkap') {
      const tpsSecs = state.activeSections.filter(s => s.tes === 'tps');
      const litSecs = state.activeSections.filter(s => s.tes === 'literasi');
      tabsHtml = `
        <div class="snbt-tab-group">
          <span class="snbt-tab-group-label">🧠 TPS</span>
          ${tpsSecs.map(tabBtn).join('')}
        </div>
        <div class="snbt-tab-group">
          <span class="snbt-tab-group-label">📚 Literasi</span>
          ${litSecs.map(tabBtn).join('')}
        </div>`;
    } else {
      tabsHtml = state.activeSections.map(tabBtn).join('');
    }

    document.getElementById('snbt-container').innerHTML = `
      <div class="cpns-quiz-shell">
        <div class="cpns-quiz-header">
          <div class="cpns-quiz-title">
            <span class="cpns-quiz-badge" style="background:#1a5a9a">${mc.icon} SNBT</span>
            <span class="cpns-quiz-progress" id="snbt-progress">Soal 1 / ${total}</span>
          </div>
          <div class="tka-timer" id="snbt-timer">${fmtTime(state.secondsLeft)}</div>
        </div>
        <div class="snbt-tabs-wrap" id="snbt-tabs-wrap">${tabsHtml}</div>
        <div class="tka-question-card" id="snbt-question-card"></div>
        <div class="tka-nav-row">
          <button class="tka-nav-btn" id="snbt-btn-prev" onclick="window.SNBT.navigate(-1)">← Sebelumnya</button>
          <div class="tka-nav-dots" id="snbt-nav-dots"></div>
          <button class="tka-nav-btn tka-nav-next" id="snbt-btn-next" onclick="window.SNBT.navigate(1)">Berikutnya →</button>
        </div>
        <div class="tka-submit-wrap">
          <button class="tka-btn-submit" id="snbt-btn-submit" onclick="window.SNBT.confirmSubmit()">Kumpulkan Jawaban 🏁</button>
          <p class="tka-submit-hint" id="snbt-submit-hint"></p>
        </div>
      </div>`;

    renderNavDots();
    updateSectionTabs();
  }

  function renderQuestion(idx) {
    state.currentIdx = idx;
    const q          = state.allQuestions[idx];
    const total      = state.allQuestions.length;
    const sec        = state.activeSections.find(s => s.key === q.section);
    const secStart   = getSectionStart(q.section);
    const qNumInSec  = idx - secStart + 1;

    document.getElementById('snbt-progress').textContent = `Soal ${idx + 1} / ${total}`;

    document.getElementById('snbt-question-card').innerHTML = `
      <div class="tka-q-meta">
        <span class="tka-q-mapel-badge" style="background:${sec.warna}">${sec.fullLabel}</span>
        <span class="tka-q-num">No. ${qNumInSec}</span>
        ${q.materi ? `<span class="snbt-materi-chip">${escHtml(q.materi)}</span>` : ''}
      </div>
      ${q.teks ? `<div class="snbt-wacana">${escHtml(q.teks)}</div>` : ''}
      <p class="tka-q-text">${escHtml(q.q)}</p>
      <div class="tka-options" id="snbt-options">
        ${q.opts.map((opt, oi) => {
          const letter   = ['A','B','C','D','E'][oi];
          const selected = state.answers[idx] === letter;
          return `<button class="tka-opt${selected ? ' selected' : ''}"
            onclick="window.SNBT.selectAnswer(${idx},'${letter}')">
            <span class="tka-opt-letter">${letter}</span>
            <span class="tka-opt-text">${escHtml(opt.replace(/^[A-E]\.\s*/,''))}</span>
          </button>`;
        }).join('')}
      </div>`;

    document.getElementById('snbt-btn-prev').disabled = idx === 0;
    document.getElementById('snbt-btn-next').disabled = idx === total - 1;
    updateSectionTabs(q.section);
    renderNavDots();
  }

  function renderNavDots() {
    const dotsEl = document.getElementById('snbt-nav-dots');
    if (!dotsEl) return;
    const q = state.allQuestions[state.currentIdx];
    if (!q) return;
    const sec   = state.activeSections.find(s => s.key === q.section);
    const start = getSectionStart(q.section);
    let html = '';
    for (let i = start; i < start + sec.jumlah; i++) {
      html += `<button class="tka-dot${i===state.currentIdx?' current':''}${state.answers[i]!==null?' answered':''}"
        onclick="window.SNBT.jumpTo(${i})" title="Soal ${i-start+1}"></button>`;
    }
    dotsEl.innerHTML = html;
  }

  function updateSectionTabs(activeKey) {
    const key = activeKey || state.allQuestions[state.currentIdx]?.section;
    state.activeSections.forEach(sec => {
      const tab = document.getElementById('snbt-stab-' + sec.key);
      if (!tab) return;
      tab.classList.toggle('active', sec.key === key);
      tab.style.setProperty('--sec-color', sec.warna);
    });
  }

  function selectAnswer(idx, letter) {
    state.answers[idx] = letter;
    document.querySelectorAll('#snbt-options .tka-opt').forEach((btn, oi) => {
      btn.classList.toggle('selected', ['A','B','C','D','E'][oi] === letter);
    });
    renderNavDots();
    setTimeout(() => { if (state.currentIdx < state.allQuestions.length-1) navigate(1); }, 350);
  }

  function navigate(dir) {
    const next = state.currentIdx + dir;
    if (next >= 0 && next < state.allQuestions.length) renderQuestion(next);
  }
  function jumpTo(idx)      { renderQuestion(idx); }
  function jumpToSection(k) { renderQuestion(getSectionStart(k)); }

  function startTimer() {
    clearInterval(state.timerInterval);
    state.timerInterval = setInterval(() => {
      state.secondsLeft--;
      const el = document.getElementById('snbt-timer');
      if (el) {
        el.textContent = fmtTime(state.secondsLeft);
        if (state.secondsLeft <= 300) el.classList.add('urgent');
      }
      if (state.secondsLeft <= 0) { clearInterval(state.timerInterval); submitQuiz(true); }
    }, 1000);
  }
  function _stopTimer() { clearInterval(state.timerInterval); }

  function confirmSubmit() {
    const unanswered = state.answers.filter(a => a === null).length;
    const hint = document.getElementById('snbt-submit-hint');
    if (unanswered > 0) {
      hint.textContent = `⚠️ ${unanswered} soal belum dijawab. Kumpulkan tetap?`;
      hint.style.color = 'var(--amber)';
      const btn = document.getElementById('snbt-btn-submit');
      btn.textContent = 'Ya, Kumpulkan Tetap 🏁';
      btn.onclick = () => submitQuiz(false);
      return;
    }
    submitQuiz(false);
  }

  function submitQuiz(isAutoSubmit) {
    clearInterval(state.timerInterval);
    state.phase = 'result';
    const elapsed = Math.round((Date.now() - state.startTime) / 1000);
    const scores  = {};
    state.activeSections.forEach(sec => { scores[sec.key] = { benar:0, salah:0, total:sec.jumlah }; });
    state.allQuestions.forEach((q, i) => {
      const ans = state.answers[i]; if (!ans) return;
      if (ans === q.ans) scores[q.section].benar++; else scores[q.section].salah++;
    });
    renderResult(scores, elapsed, isAutoSubmit);
  }

  // ══ PHASE 3: RESULT ═══════════════════════════════════════════
  function renderResult(scores, elapsed, isAutoSubmit) {
    const container  = document.getElementById('snbt-container');
    const minsE      = Math.floor(elapsed/60), secsE = elapsed%60;
    const totalBenar = Object.values(scores).reduce((a,s) => a+s.benar, 0);
    const totalSoal  = state.allQuestions.length;
    const pct        = Math.round(totalBenar/totalSoal*100);

    // ── Catat ke Profil ──────────────────────────────────────
    window.PROFIL_recordSession?.('snbt', {
      pct, totalBenar, totalSoal, scores, elapsed,
    });

    const mc         = MODES[state.mode];
    const emoji      = pct>=80?'🏆':pct>=65?'🥈':pct>=50?'🥉':'📚';
    const msg        = pct>=80?'Luar Biasa!':pct>=65?'Bagus!':pct>=50?'Cukup Baik':'Tetap Semangat!';

    const renderGroup = (secs, groupLabel) => {
      const rows = secs.map(sec => {
        const s = scores[sec.key];
        const spct = Math.round(s.benar/s.total*100);
        return `<div class="tka-breakdown-item">
          <div class="tka-breakdown-label">${sec.fullLabel}</div>
          <div class="tka-breakdown-bar-wrap">
            <div class="tka-breakdown-bar" style="width:${spct}%;background:${sec.warna}"></div>
          </div>
          <div class="tka-breakdown-score">${s.benar}/${s.total} <span class="tka-breakdown-pct">(${spct}%)</span></div>
        </div>`;
      }).join('');
      if (!groupLabel) return rows;
      return `<div class="snbt-result-group">
        <div class="snbt-result-group-label">${groupLabel}</div>${rows}</div>`;
    };

    let breakdownHtml = '';
    if (state.mode === 'lengkap') {
      const tpsSecs = state.activeSections.filter(s => s.tes==='tps');
      const litSecs = state.activeSections.filter(s => s.tes==='literasi');
      const tpsB = tpsSecs.reduce((a,s)=>a+scores[s.key].benar,0), tpsT = tpsSecs.reduce((a,s)=>a+s.jumlah,0);
      const litB = litSecs.reduce((a,s)=>a+scores[s.key].benar,0), litT = litSecs.reduce((a,s)=>a+s.jumlah,0);
      breakdownHtml = `
        <div class="snbt-subtotal-row">
          <div class="snbt-subtotal"><div class="snbt-st-label">🧠 TPS</div><div class="snbt-st-val">${tpsB}/${tpsT} <span>(${Math.round(tpsB/tpsT*100)}%)</span></div></div>
          <div class="snbt-subtotal"><div class="snbt-st-label">📚 Literasi</div><div class="snbt-st-val">${litB}/${litT} <span>(${Math.round(litB/litT*100)}%)</span></div></div>
        </div>
        ${renderGroup(tpsSecs,'🧠 Tes Potensi Skolastik')}
        ${renderGroup(litSecs,'📚 Tes Literasi')}`;
    } else {
      breakdownHtml = renderGroup(state.activeSections, null);
    }

    container.innerHTML = `
      <div class="tka-result-wrap">
        ${isAutoSubmit ? '<div class="tka-auto-submit-notice">⏱ Waktu habis — jawaban otomatis dikumpulkan</div>' : ''}
        <div class="tka-score-hero">
          <div class="tka-score-emoji">${emoji}</div>
          <div class="tka-score-num">${totalBenar} / ${totalSoal}</div>
          <div class="tka-score-pct">${pct}% · ${msg}</div>
          <div class="tka-score-time">⏱ ${minsE}m ${secsE}s · ${mc.icon} ${mc.label}</div>
        </div>
        <div class="tka-breakdown-section">
          <p class="tka-breakdown-title">Nilai per Subtes</p>
          ${breakdownHtml}
        </div>
        <div class="tka-result-actions">
          <button class="btn-new" onclick="window.SNBT.showReview()">📖 Lihat Pembahasan</button>
          <button class="tka-btn-retry" onclick="window.SNBT.init()">↺ Ulangi / Ganti Mode</button>
        </div>
      </div>`;
  }

  // ══ REVIEW ═══════════════════════════════════════════════════
  function showReview() {
    const container = document.getElementById('snbt-container');
    let html = '<div class="tka-review-wrap"><h2 class="tka-review-title">📖 Pembahasan Lengkap</h2>';

    state.activeSections.forEach(sec => {
      html += `<div class="tka-review-section">
        <div class="tka-review-mapel-header" style="background:${sec.warna}">${sec.fullLabel}</div>`;
      const start = getSectionStart(sec.key);
      for (let i = start; i < start + sec.jumlah; i++) {
        const q = state.allQuestions[i], userAns = state.answers[i], correct = userAns === q.ans;
        html += `
          <div class="tka-review-item${correct?' review-correct':' review-wrong'}">
            <div class="tka-review-item-header">
              <span class="tka-review-status">${correct?'✅':'❌'}</span>
              <span class="tka-review-qnum">Soal ${i-start+1}</span>
              ${q.materi?`<span class="snbt-materi-chip">${escHtml(q.materi)}</span>`:''}
            </div>
            ${q.teks?`<div class="snbt-wacana snbt-wacana-sm">${escHtml(q.teks)}</div>`:''}
            <p class="tka-review-q">${escHtml(q.q)}</p>
            <div class="tka-review-opts">
              ${q.opts.map((opt,oi)=>{
                const l=['A','B','C','D','E'][oi]; let cls='tka-review-opt';
                if(l===q.ans) cls+=' review-opt-correct'; else if(l===userAns) cls+=' review-opt-wrong';
                return `<div class="${cls}">${escHtml(opt)}</div>`;
              }).join('')}
            </div>
            ${!correct?`<div class="tka-review-user-ans">Jawabanmu: <strong>${userAns||'Tidak dijawab'}</strong> · Benar: <strong>${q.ans}</strong></div>`:''}
            <div class="tka-review-expl">💡 ${escHtml(q.expl||'')}</div>
          </div>`;
      }
      html += '</div>';
    });

    html += `<div class="tka-result-actions" style="margin-top:32px">
      <button class="btn-new" onclick="window.SNBT.init()">↺ Ulangi / Ganti Mode</button>
    </div></div>`;
    container.innerHTML = html;
  }

  return { init, previewPaket, selectMode, startPaket, navigate, jumpTo, jumpToSection, selectAnswer, confirmSubmit, showReview, _stopTimer };
})();
