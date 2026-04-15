/* ============================================================
   PREDIKSI TKA 2026 — Logic (Lazy Loading)
   Data soal di-fetch dari JSON saat dibutuhkan, bukan di-bundle.
   ─────────────────────────────────────────────────────────────
   File data yang dibutuhkan (letakkan di /data/):
     tka-index.json       ← metadata ringan, di-load saat init
     tka-sd.json          ← soal SD, di-load saat jenjang SD dipilih
     tka-smp.json         ← soal SMP, di-load saat jenjang SMP dipilih
     tka-sma.json         ← soal SMA, di-load saat jenjang SMA dipilih
   ============================================================ */

window.TKA = (function() {

  // ── Config statis (tidak berubah) ─────────────────────────
  const CONFIG = {
    SD:  { jumlah: 30, durasi: 60, label: 'SD/MI' },
    SMP: { jumlah: 30, durasi: 60, label: 'SMP/MTs' },
    SMA: { jumlah: 50, durasi: 90, label: 'SMA/MA/SMK' },
  };

  const MAPEL_LABEL = {
    matematika:       '📐 Matematika',
    bahasa_indonesia: '📖 Bahasa Indonesia',
    bahasa_inggris:   '🌐 Bahasa Inggris',
  };

  // ── State ───────────────────────────────────────────────────
  let state = {
    jenjang: null,
    allQuestions: [],
    currentIdx: 0,
    answers: [],
    timerInterval: null,
    secondsLeft: 0,
    phase: 'select',  // 'select' | 'quiz' | 'result'
    startTime: null,
  };

  // ══ LAZY LOADER ══════════════════════════════════════════════
  // tka-index.json       → metadata ringan   — di-load saat init
  // tka-{jenjang}.json   → soal per jenjang  — di-load saat mau quiz
  const _cache = {};

  async function _fetchIndex() {
    if (_cache['__index__']) return _cache['__index__'];
    const res = await fetch('/data/tka-index.json');
    if (!res.ok) throw new Error('Gagal memuat index TKA');
    _cache['__index__'] = await res.json();
    return _cache['__index__'];
  }

  async function _fetchJenjang(jenjang) {
    const key = `__data_${jenjang}__`;
    if (_cache[key]) return _cache[key];
    const meta = (_cache['__index__'] || []).find(j => j.key === jenjang);
    if (!meta) throw new Error(`Jenjang ${jenjang} tidak ditemukan di index`);
    // Semua mapel dalam satu jenjang ada di satu file
    const filename = meta.mapel[0].file;
    const res = await fetch(`/data/${filename}`);
    if (!res.ok) throw new Error(`Gagal memuat soal ${jenjang}`);
    _cache[key] = await res.json();
    return _cache[key];
  }

  function _getJenjangMeta(jenjang) {
    return (_cache['__index__'] || []).find(j => j.key === jenjang) || null;
  }
  // ─────────────────────────────────────────────────────────────

  // ── Util ─────────────────────────────────────────────────────
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

  function fmtLoader(msg) {
    return `<div style="text-align:center;padding:60px;opacity:.6">${msg}</div>`;
  }

  function mapelColor(mp) {
    return { matematika:'#1a7a6e', bahasa_indonesia:'#1a5a9a', bahasa_inggris:'#7a3a9a' }[mp] || '#555';
  }

  // ── Init ─────────────────────────────────────────────────────
  async function init() {
    state.phase = 'select';
    const container = document.getElementById('tka-container');
    container.innerHTML = fmtLoader('⏳ Memuat...');
    try {
      await _fetchIndex();
      renderSelectJenjang();
    } catch(e) {
      container.innerHTML = `<div style="text-align:center;padding:40px;color:red">❌ Gagal memuat data TKA. Coba refresh.</div>`;
    }
  }

  // ══════════════════════════════════════════════════════════
  //  PHASE 1: SELECT JENJANG
  // ══════════════════════════════════════════════════════════
  function renderSelectJenjang() {
    state.phase = 'select';
    const index = _cache['__index__'] || [];
    const container = document.getElementById('tka-container');

    container.innerHTML = `
      <div class="tka-select-wrap">
        <div class="tka-hero">
          <div class="tka-hero-badge">🏆 Edisi 2026</div>
          <h2 class="tka-hero-title">Prediksi Tes<br/>Kemampuan Akademik</h2>
          <p class="tka-hero-sub">Uji kemampuanmu dengan soal prediksi TKA 2026 dan lihat posisimu di papan peringkat nasional.</p>
        </div>
        <p class="tka-choose-label">Pilih Jenjangmu</p>
        <div class="tka-jenjang-grid">
          ${index.map(j => {
            const cfg    = CONFIG[j.key] || {};
            const durasi = cfg.durasi || j.durasi || 60;
            const mapelInfo = j.mapel
              .map(m => `${cfg.jumlah || m.count} soal ${MAPEL_LABEL[m.key] || m.key}`)
              .join('<br/>');
            return `
              <button class="tka-jenjang-btn" id="tka-btn-${j.key}" onclick="window.TKA.previewJenjang('${j.key}')">
                <span class="tka-j-icon">${j.icon}</span>
                <span class="tka-j-name">${j.label}</span>
                <span class="tka-j-info">${mapelInfo}</span>
                <span class="tka-j-time">⏱ ${durasi} menit</span>
              </button>`;
          }).join('')}
        </div>

        <!-- Confirm panel — tersembunyi sampai jenjang dipilih -->
        <div class="tka-confirm-panel" id="tka-confirm-panel" style="display:none">
          <div class="tka-confirm-info" id="tka-confirm-info"></div>
          <button class="tka-btn-start" onclick="window.TKA.startJenjang()">
            Mulai Tes ▶
          </button>
        </div>

        <p class="tka-credit-note">⚡ Menggunakan 1 kredit ·
          <button class="tka-lb-link" onclick="window.TKA.showLeaderboardPublic()">Lihat papan peringkat</button>
        </p>
      </div>`;
  }

  // Highlight pilihan + tampilkan confirm panel, belum start quiz
  function previewJenjang(jenjang) {
    const index = _cache['__index__'] || [];
    index.forEach(j => {
      const btn = document.getElementById('tka-btn-' + j.key);
      if (btn) btn.classList.toggle('selected', j.key === jenjang);
    });

    const jMeta  = _getJenjangMeta(jenjang);
    const cfg    = CONFIG[jenjang] || {};
    const durasi = cfg.durasi || jMeta?.durasi || 60;
    const mapelList = (jMeta?.mapel || [])
      .map(m => (cfg.jumlah || m.count) + ' soal ' + (MAPEL_LABEL[m.key] || m.key))
      .join(' · ');

    document.getElementById('tka-confirm-info').innerHTML =
      `<span class="tka-confirm-jenjang">${jMeta?.label || jenjang}</span>` +
      `<span class="tka-confirm-detail">${mapelList} · ⏱ ${durasi} menit</span>`;
    document.getElementById('tka-confirm-panel').style.display = 'flex';
    state.jenjang = jenjang;
  }

  async function showLeaderboardPublic() {
    const jenjang = state.jenjang || 'SMA';
    await showLeaderboard(jenjang);
  }

  // ══════════════════════════════════════════════════════════
  //  PHASE 2: QUIZ
  // ══════════════════════════════════════════════════════════
  async function startJenjang() {
    const jenjang = state.jenjang;
    if (!jenjang) return;

    // Credit check
    const credits   = window._currentCredits ?? 0;
    const isInvited = window._isInvited ?? false;
    if (!isInvited && credits <= 0) {
      window.renderCreditsBanner?.();
      window.showPricingModal?.('pro');
      return;
    }

    // Loading state saat fetch soal
    const container = document.getElementById('tka-container');
    container.innerHTML = fmtLoader('⏳ Memuat soal...');

    try {
      const bank = await _fetchJenjang(jenjang);
      state.allQuestions = _buildQuestions(jenjang, bank);
    } catch(e) {
      container.innerHTML = `<div style="text-align:center;padding:40px;color:red">❌ Gagal memuat soal. Coba lagi.</div>`;
      return;
    }

    state.answers     = new Array(state.allQuestions.length).fill(null);
    state.currentIdx  = 0;
    state.phase       = 'quiz';
    state.startTime   = Date.now();
    state.secondsLeft = (CONFIG[jenjang]?.durasi || 60) * 60;

    renderQuizShell();
    renderQuestion(0);
    startTimer();
  }

  // Build soal dari bank yang sudah di-load
  function _buildQuestions(jenjang, bank) {
    const cfg   = CONFIG[jenjang] || {};
    const jMeta = _getJenjangMeta(jenjang);
    const all   = [];
    (jMeta?.mapel || []).forEach(m => {
      const pool   = bank[m.key] || [];
      const jumlah = cfg.jumlah || m.count;
      const picked = shuffle(pool).slice(0, jumlah);
      picked.forEach(q => all.push({ mapel: m.key, ...q }));
    });
    return all;
  }

  function renderQuizShell() {
    const jenjang = state.jenjang;
    const cfg     = CONFIG[jenjang] || {};
    const jMeta   = _getJenjangMeta(jenjang);
    const total   = state.allQuestions.length;
    const container = document.getElementById('tka-container');

    const mapelTabsHtml = (jMeta?.mapel || []).map(m =>
      `<button class="tka-mapel-tab" id="tka-mtab-${m.key}" onclick="window.TKA.jumpToMapel('${m.key}')">${MAPEL_LABEL[m.key] || m.key}</button>`
    ).join('');

    container.innerHTML = `
      <div class="tka-quiz-shell">
        <div class="tka-quiz-header">
          <div class="tka-quiz-title">
            <span class="tka-quiz-jenjang-badge">${jMeta?.label || jenjang}</span>
            <span class="tka-quiz-progress" id="tka-progress">Soal 1 / ${total}</span>
          </div>
          <div class="tka-timer" id="tka-timer">${String(cfg.durasi || 60).padStart(2,'0')}:00</div>
        </div>

        <div class="tka-mapel-tabs" id="tka-mapel-tabs">${mapelTabsHtml}</div>

        <div class="tka-question-card" id="tka-question-card"></div>

        <div class="tka-nav-row">
          <button class="tka-nav-btn" id="tka-btn-prev" onclick="window.TKA.navigate(-1)">← Sebelumnya</button>
          <div class="tka-nav-dots" id="tka-nav-dots"></div>
          <button class="tka-nav-btn" id="tka-btn-next" onclick="window.TKA.navigate(1)">Berikutnya →</button>
        </div>

        <div class="tka-submit-row">
          <div class="tka-submit-hint" id="tka-submit-hint"></div>
          <button class="tka-btn-submit" id="tka-btn-submit" onclick="window.TKA.confirmSubmit()">
            🏁 Kumpulkan Jawaban
          </button>
        </div>
      </div>`;
  }

  function renderQuestion(idx) {
    state.currentIdx = idx;
    const q      = state.allQuestions[idx];
    const total  = state.allQuestions.length;
    const jMeta  = _getJenjangMeta(state.jenjang);
    const cfg    = CONFIG[state.jenjang] || {};
    const jumlah = cfg.jumlah || 30;

    // Update progress text
    const progEl = document.getElementById('tka-progress');
    if (progEl) progEl.textContent = `Soal ${idx + 1} / ${total}`;

    // Update mapel tab aktif
    (jMeta?.mapel || []).forEach((m, mi) => {
      const start = mi * jumlah;
      const tab = document.getElementById('tka-mtab-' + m.key);
      if (tab) tab.classList.toggle('active', idx >= start && idx < start + jumlah);
    });

    // Image
    const imgHtml = q.imgSrc
      ? `<div class="tka-q-img-wrap"><img src="${escHtml(window.TKA_IMG_BASE || '/assets/soal/')}${escHtml(q.imgSrc)}"
           alt="Gambar soal" class="tka-q-img" loading="lazy" onerror="this.style.display='none'"/></div>`
      : '';

    // Options
    const letters  = ['A','B','C','D','E'];
    const optsHtml = (q.opts || []).map((opt, oi) => {
      const l = letters[oi];
      return `<button class="tka-opt${state.answers[idx] === l ? ' selected' : ''}"
        onclick="window.TKA.selectAnswer(${idx}, '${l}')">${escHtml(opt)}</button>`;
    }).join('');

    document.getElementById('tka-question-card').innerHTML = `
      <div class="tka-q-meta">
        <span class="tka-q-mapel-badge">${MAPEL_LABEL[q.mapel] || q.mapel}</span>
        <span class="tka-q-num">No. ${idx + 1}</span>
      </div>
      <p class="tka-q-text">${escHtml(q.q)}</p>
      ${imgHtml}
      <div class="tka-options" id="tka-options">${optsHtml}</div>`;

    document.getElementById('tka-btn-prev').disabled = idx === 0;
    document.getElementById('tka-btn-next').disabled = idx === total - 1;
    renderNavDots();
  }

  function renderNavDots() {
    const dotsEl = document.getElementById('tka-nav-dots');
    if (!dotsEl) return;
    const total = state.allQuestions.length;
    const start = Math.max(0, state.currentIdx - 10);
    const end   = Math.min(total, start + 22);
    let html = '';
    for (let i = start; i < end; i++) {
      html += `<button class="tka-dot${i === state.currentIdx ? ' current' : ''}${state.answers[i] !== null ? ' answered' : ''}"
        onclick="window.TKA.jumpTo(${i})" title="Soal ${i+1}"></button>`;
    }
    dotsEl.innerHTML = html;
  }

  function selectAnswer(idx, letter) {
    state.answers[idx] = letter;
    document.querySelectorAll('#tka-options .tka-opt').forEach((btn, oi) => {
      btn.classList.toggle('selected', ['A','B','C','D','E'][oi] === letter);
    });
    renderNavDots();
    setTimeout(() => { if (state.currentIdx < state.allQuestions.length - 1) navigate(1); }, 350);
  }

  function navigate(dir) {
    const next = state.currentIdx + dir;
    if (next >= 0 && next < state.allQuestions.length) renderQuestion(next);
  }

  function jumpTo(idx) { renderQuestion(idx); }

  function jumpToMapel(mapelKey) {
    const jMeta  = _getJenjangMeta(state.jenjang);
    const cfg    = CONFIG[state.jenjang] || {};
    const jumlah = cfg.jumlah || 30;
    const mIdx   = (jMeta?.mapel || []).findIndex(m => m.key === mapelKey);
    if (mIdx >= 0) renderQuestion(mIdx * jumlah);
  }

  function startTimer() {
    clearInterval(state.timerInterval);
    state.timerInterval = setInterval(() => {
      state.secondsLeft--;
      const el = document.getElementById('tka-timer');
      if (el) {
        const m = Math.floor(state.secondsLeft / 60);
        const s = state.secondsLeft % 60;
        el.textContent = String(m).padStart(2,'0') + ':' + String(s).padStart(2,'0');
        if (state.secondsLeft <= 300) el.classList.add('urgent');
      }
      if (state.secondsLeft <= 0) { clearInterval(state.timerInterval); submitQuiz(true); }
    }, 1000);
  }

  function _stopTimer() { clearInterval(state.timerInterval); }

  function confirmSubmit() {
    const unanswered = state.answers.filter(a => a === null).length;
    const hint = document.getElementById('tka-submit-hint');
    if (unanswered > 0) {
      hint.textContent = `⚠️ ${unanswered} soal belum dijawab. Kumpulkan tetap?`;
      hint.style.color = 'var(--amber)';
      const btn = document.getElementById('tka-btn-submit');
      btn.textContent = 'Ya, Kumpulkan Tetap 🏁';
      btn.onclick = () => submitQuiz(false);
      return;
    }
    submitQuiz(false);
  }

  async function submitQuiz(isAutoSubmit) {
    clearInterval(state.timerInterval);
    state.phase  = 'result';
    const jenjang = state.jenjang;
    const jMeta   = _getJenjangMeta(jenjang);
    const cfg     = CONFIG[jenjang] || {};
    const jumlah  = cfg.jumlah || 30;
    const elapsed = Math.round((Date.now() - state.startTime) / 1000);

    // Hitung skor per mapel
    const scores = {};
    (jMeta?.mapel || []).forEach((m, mi) => {
      const start = mi * jumlah;
      let correct = 0;
      for (let i = start; i < start + jumlah; i++) {
        if (state.answers[i] === state.allQuestions[i]?.ans) correct++;
      }
      scores[m.key] = { correct, total: jumlah };
    });

    const totalCorrect = Object.values(scores).reduce((s, v) => s + v.correct, 0);
    const totalQs      = state.allQuestions.length;
    const pct          = Math.round((totalCorrect / totalQs) * 100);

    // Submit ke leaderboard (opsional, tidak crash kalau gagal)
    let rank = null;
    try {
      const idToken = await window.getIdToken?.();
      const res = await fetch('/api/tka-submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-id-token': idToken || '' },
        body: JSON.stringify({ jenjang, scores, totalCorrect, totalQuestions: totalQs, pct, elapsed }),
      });
      const data = await res.json();
      rank = data.rank || null;
    } catch(e) { /* tidak wajib berhasil */ }

    renderResult(scores, totalCorrect, totalQs, pct, elapsed, rank, isAutoSubmit);
  }

  // ══════════════════════════════════════════════════════════
  //  PHASE 3: RESULT
  // ══════════════════════════════════════════════════════════
  function renderResult(scores, totalCorrect, totalQs, pct, elapsed, rank, isAutoSubmit) {
    const jenjang = state.jenjang;
    const jMeta   = _getJenjangMeta(jenjang);
    const emoji   = pct >= 85 ? '🏆' : pct >= 70 ? '🥈' : pct >= 55 ? '🥉' : '📚';

    // ── Catat ke Profil ──────────────────────────────────────
    const jenisKey = 'tka_' + (jenjang || 'sma').toLowerCase();
    window.PROFIL_recordSession?.(jenisKey, {
      pct, totalBenar: totalCorrect, totalSoal: totalQs, scores, elapsed,
    });
    const msg     = pct >= 85 ? 'Luar Biasa!' : pct >= 70 ? 'Bagus Sekali!' : pct >= 55 ? 'Cukup Baik' : 'Tetap Semangat!';
    const grade   = pct >= 85 ? 'A' : pct >= 70 ? 'B' : pct >= 55 ? 'C' : pct >= 40 ? 'D' : 'E';
    const minsE   = Math.floor(elapsed / 60);
    const secsE   = elapsed % 60;

    let mapelBreakdown = '';
    Object.entries(scores).forEach(([mp, s]) => {
      const mpPct = Math.round((s.correct / s.total) * 100);
      mapelBreakdown += `
        <div class="tka-breakdown-item">
          <div class="tka-breakdown-label">${MAPEL_LABEL[mp] || mp}</div>
          <div class="tka-breakdown-bar-wrap">
            <div class="tka-breakdown-bar" style="width:${mpPct}%;background:${mapelColor(mp)}"></div>
          </div>
          <div class="tka-breakdown-score">${s.correct}/${s.total} <span class="tka-breakdown-pct">(${mpPct}%)</span></div>
        </div>`;
    });

    const rankHtml = rank
      ? `<div class="tka-rank-box">🏅 Peringkatmu: <strong>#${rank}</strong> dari seluruh peserta ${jMeta?.label || jenjang}</div>`
      : '';

    const container = document.getElementById('tka-container');
    container.innerHTML = `
      <div class="tka-result-wrap">
        ${isAutoSubmit ? '<div class="tka-auto-submit-notice">⏱ Waktu habis — jawaban otomatis dikumpulkan</div>' : ''}
        <div class="tka-score-hero">
          <div class="tka-score-emoji">${emoji}</div>
          <div class="tka-score-grade">${grade}</div>
          <div class="tka-score-num">${totalCorrect} / ${totalQs}</div>
          <div class="tka-score-pct">${pct}% · ${msg}</div>
          <div class="tka-score-time">⏱ Waktu: ${minsE}m ${secsE}s</div>
        </div>
        ${rankHtml}
        <div class="tka-breakdown-section">
          <p class="tka-breakdown-title">Nilai per Mata Pelajaran</p>
          ${mapelBreakdown}
        </div>
        <div class="tka-result-actions">
          <button class="btn-new" onclick="window.TKA.showLeaderboard()">🏅 Lihat Papan Peringkat</button>
          <button class="btn-new" onclick="window.TKA.showReview()">📖 Lihat Pembahasan</button>
          <button class="tka-btn-retry" onclick="window.TKA.init()">↺ Ikut Tes Lagi</button>
        </div>
      </div>`;
  }

  // ══════════════════════════════════════════════════════════
  //  LEADERBOARD
  // ══════════════════════════════════════════════════════════
  async function showLeaderboard(jenjangOverride) {
    const jenjang   = jenjangOverride || state.jenjang;
    const container = document.getElementById('tka-container');
    container.innerHTML = `<div class="tka-loading-wrap"><div class="spinner"></div><p>Memuat papan peringkat…</p></div>`;
    try {
      const idToken = await window.getIdToken?.();
      const res = await fetch(`/api/tka-leaderboard?jenjang=${jenjang}`, {
        headers: { 'x-id-token': idToken || '' }
      });
      const data = await res.json();
      renderLeaderboard(data.entries || [], jenjang);
    } catch(e) {
      container.innerHTML = `<div class="tka-error">Gagal memuat papan peringkat. <button class="btn-new" onclick="window.TKA.init()">Kembali</button></div>`;
    }
  }

  function renderLeaderboard(entries, jenjangOverride) {
    const jenjang = jenjangOverride || state.jenjang;
    const jMeta   = _getJenjangMeta(jenjang);
    const myEmail = window.quizgenUser?.email || '';

    const rows = entries.slice(0, 50).map((e, i) => {
      const rankNum = i + 1;
      const medal   = rankNum === 1 ? '🥇' : rankNum === 2 ? '🥈' : rankNum === 3 ? '🥉' : `#${rankNum}`;
      const isMe    = e.email === myEmail;
      return `<tr class="tka-lb-row${isMe ? ' tka-lb-me' : ''}">
        <td class="tka-lb-rank">${medal}</td>
        <td class="tka-lb-name">${escHtml(e.displayName)}${isMe ? ' <span class="tka-lb-you">(Kamu)</span>' : ''}</td>
        <td class="tka-lb-score">${e.pct}%</td>
        <td class="tka-lb-detail">${e.totalCorrect}/${e.totalQuestions}</td>
      </tr>`;
    }).join('');

    const container = document.getElementById('tka-container');
    container.innerHTML = `
      <div class="tka-lb-wrap">
        <div class="tka-lb-header">
          <h2 class="tka-lb-title">🏅 Papan Peringkat</h2>
          <p class="tka-lb-sub">${jMeta?.label || jenjang} · Top 50 Peserta</p>
        </div>
        <div class="tka-lb-table-wrap">
          <table class="tka-lb-table">
            <thead><tr><th>Rank</th><th>Nama</th><th>Nilai</th><th>Skor</th></tr></thead>
            <tbody>${rows || '<tr><td colspan="4" style="text-align:center;padding:24px;color:var(--ink-muted)">Belum ada peserta</td></tr>'}</tbody>
          </table>
        </div>
        <div class="tka-result-actions" style="margin-top:24px">
          <button class="btn-new" onclick="window.TKA.init()">↺ Ikut Tes Lagi</button>
        </div>
      </div>`;
  }

  // ══════════════════════════════════════════════════════════
  //  REVIEW / PEMBAHASAN
  // ══════════════════════════════════════════════════════════
  function showReview() {
    const jenjang = state.jenjang;
    const jMeta   = _getJenjangMeta(jenjang);
    const cfg     = CONFIG[jenjang] || {};
    const jumlah  = cfg.jumlah || 30;
    const container = document.getElementById('tka-container');

    let html = '<div class="tka-review-wrap">';
    html += `<h2 class="tka-review-title">📖 Pembahasan Lengkap</h2>`;

    (jMeta?.mapel || []).forEach((m, mi) => {
      html += `<div class="tka-review-section">
        <div class="tka-review-mapel-header" style="background:${mapelColor(m.key)}">${MAPEL_LABEL[m.key] || m.key}</div>`;
      const start = mi * jumlah;
      for (let i = start; i < start + jumlah; i++) {
        const q = state.allQuestions[i];
        if (!q) continue;
        const userAns = state.answers[i];
        const correct = userAns === q.ans;
        const imgHtml = q.imgSrc
          ? `<div class="tka-q-img-wrap tka-review-img"><img src="${escHtml(window.TKA_IMG_BASE || '/assets/soal/')}${escHtml(q.imgSrc)}"
               alt="Gambar soal" class="tka-q-img" loading="lazy" onerror="this.style.display='none'"/></div>`
          : '';
        html += `
          <div class="tka-review-item${correct ? ' review-correct' : ' review-wrong'}">
            <div class="tka-review-item-header">
              <span class="tka-review-status">${correct ? '✅' : '❌'}</span>
              <span class="tka-review-qnum">Soal ${i - start + 1}</span>
            </div>
            <p class="tka-review-q">${escHtml(q.q)}</p>
            ${imgHtml}
            <div class="tka-review-opts">
              ${(q.opts || []).map((opt, oi) => {
                const l   = ['A','B','C','D','E'][oi];
                let   cls = 'tka-review-opt';
                if (l === q.ans)        cls += ' review-opt-correct';
                else if (l === userAns) cls += ' review-opt-wrong';
                return `<div class="${cls}">${escHtml(opt)}</div>`;
              }).join('')}
            </div>
            ${!correct ? `<div class="tka-review-user-ans">Jawabanmu: <strong>${userAns || 'Tidak dijawab'}</strong></div>` : ''}
            <div class="tka-review-expl">💡 ${escHtml(q.expl || '')}</div>
          </div>`;
      }
      html += '</div>';
    });

    html += `<div class="tka-result-actions" style="margin-top:32px">
      <button class="btn-new" onclick="window.TKA.init()">↺ Ikut Tes Lagi</button>
    </div></div>`;

    container.innerHTML = html;
  }

  // ── Public API ───────────────────────────────────────────────
  return {
    init,
    previewJenjang,
    startJenjang,
    showLeaderboardPublic,
    navigate,
    jumpTo,
    jumpToMapel,
    selectAnswer,
    confirmSubmit,
    showLeaderboard,
    showReview,
    _stopTimer,
  };
})();
