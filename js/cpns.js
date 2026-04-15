/* ============================================================
   SIMULASI SKD CPNS — Logic  (lazy-load edition)
   Data diambil dari /data/cpns-index.json + /data/cpns-paketN.json
   TWK: 30 soal · 5 poin  | passing ≥ 65
   TIU: 35 soal · 5 poin  | passing ≥ 80
   TKP: 35 soal · 1-5 poin| passing ≥ 166
   Total 100 soal · 90 menit · passing total ≥ 311
   ============================================================ */

window.CPNS = (function () {

  // ── Konfigurasi SKD ─────────────────────────────────────────
  const CONFIG = {
    waktu: 90,
    sections: [
      { key: 'twk', label: 'TWK', fullLabel: '📜 Tes Wawasan Kebangsaan',    jumlah: 30, passingGrade: 65  },
      { key: 'tiu', label: 'TIU', fullLabel: '🧮 Tes Intelegensia Umum',     jumlah: 35, passingGrade: 80  },
      { key: 'tkp', label: 'TKP', fullLabel: '🧠 Tes Karakteristik Pribadi', jumlah: 35, passingGrade: 166 },
    ],
    skorBenar:  { twk: 5, tiu: 5, tkp: 0 },
    tkpScores:  [1, 2, 3, 4, 5],          // A=1 … E=5
    totalPG: 311,
  };

  // ── State ────────────────────────────────────────────────────
  let state = {
    paket: null,
    allQuestions: [],
    answers: [],
    currentIdx: 0,
    currentSection: 'twk',
    timerInterval: null,
    secondsLeft: 0,
    phase: 'select',
    startTime: null,
    _index: [],         // index.json cache
  };

  // ── Lazy loader ──────────────────────────────────────────────
  const _cache = {};

  async function _fetchIndex() {
    if (_cache['__idx__']) return _cache['__idx__'];
    const r = await fetch('/data/cpns/index.json');
    if (!r.ok) throw new Error('Gagal memuat daftar paket CPNS');
    _cache['__idx__'] = await r.json();
    return _cache['__idx__'];
  }

  async function _fetchPaket(paketId) {
    if (_cache[paketId]) return _cache[paketId];
    const r = await fetch('/data/cpns/' + paketId + '.json');
    if (!r.ok) throw new Error('Paket "' + paketId + '" tidak ditemukan');
    _cache[paketId] = await r.json();
    return _cache[paketId];
  }

  // ── Helpers ──────────────────────────────────────────────────
  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function fmtTime(s) {
    return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
  }

  function escHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function loading(msg) {
    document.getElementById('cpns-container').innerHTML =
      '<div style="text-align:center;padding:50px;opacity:.6">' + msg + '</div>';
  }

  function getSectionStart(secKey) {
    let start = 0;
    for (const sec of CONFIG.sections) {
      if (sec.key === secKey) return start;
      start += sec.jumlah;
    }
    return 0;
  }

  function buildQuestions(bank) {
    const all = [];
    CONFIG.sections.forEach(sec => {
      shuffle(bank[sec.key] || []).slice(0, sec.jumlah)
        .forEach((q, i) => all.push({ ...q, section: sec.key, sectionIdx: i }));
    });
    return all;
  }

  // ══════════════════════════════════════════════════════════
  //  PHASE 1 — PILIH PAKET
  // ══════════════════════════════════════════════════════════
  async function init() {
    state.phase = 'select';
    loading('⏳ Memuat daftar paket…');
    try {
      state._index = await _fetchIndex();
      renderSelectPaket();
    } catch (e) {
      document.getElementById('cpns-container').innerHTML =
        '<div style="text-align:center;padding:40px;color:#c41a1a">❌ Gagal memuat paket. Coba refresh halaman.</div>';
    }
  }

  function renderSelectPaket() {
    const container = document.getElementById('cpns-container');

    const paketCards = state._index.map(p => `
      <button class="cpns-paket-btn" onclick="window.CPNS.previewPaket('${p.id}')">
        <div class="cpns-paket-num">${p.label}</div>
        <div class="cpns-paket-src">${p.sumber}</div>
        <div class="cpns-paket-meta">
          <span>📜 30 TWK</span>
          <span>🧮 35 TIU</span>
          <span>🧠 35 TKP</span>
        </div>
      </button>`).join('');

    container.innerHTML = `
      <div class="cpns-select-wrap">
        <div class="cpns-hero">
          <div class="cpns-hero-badge">🆕 Simulasi SKD</div>
          <h2 class="cpns-hero-title">Simulasi Seleksi<br/>Kompetensi Dasar</h2>
          <p class="cpns-hero-sub">100 soal · 90 menit · TWK + TIU + TKP<br/>Sesuai format ujian CAT BKN resmi</p>
        </div>

        <div class="cpns-passing-info">
          <div class="cpns-pg-item"><span class="cpns-pg-label">📜 TWK</span><span class="cpns-pg-val">≥ 65</span></div>
          <div class="cpns-pg-item"><span class="cpns-pg-label">🧮 TIU</span><span class="cpns-pg-val">≥ 80</span></div>
          <div class="cpns-pg-item"><span class="cpns-pg-label">🧠 TKP</span><span class="cpns-pg-val">≥ 166</span></div>
          <div class="cpns-pg-item cpns-pg-total"><span class="cpns-pg-label">Total</span><span class="cpns-pg-val">≥ 311</span></div>
        </div>

        <p class="cpns-choose-label">Pilih Paket Latihan</p>
        <div class="cpns-paket-grid">${paketCards}</div>

        <div class="cpns-confirm-panel" id="cpns-confirm-panel" style="display:none">
          <div class="cpns-confirm-info" id="cpns-confirm-info"></div>
          <button class="cpns-btn-start" onclick="window.CPNS.startPaket()">Mulai Simulasi ▶</button>
        </div>
        <p class="tka-credit-note">${window._isPremium?.() ? '✅ Gratis untuk subscriber' : window._currentCredits > 0 ? '⚡ Menggunakan 1 kredit' : '🔓 Berlangganan untuk akses semua paket'}</p>
      </div>`;
  }

  function previewPaket(paketId) {
    document.querySelectorAll('#cpns-container .cpns-paket-btn').forEach(btn => {
      const lbl = btn.querySelector('.cpns-paket-num')?.textContent;
      const p = state._index.find(x => x.id === paketId);
      btn.classList.toggle('selected', lbl === p?.label);
    });

    state.paket = paketId;
    const p = state._index.find(x => x.id === paketId) || {};
    document.getElementById('cpns-confirm-info').innerHTML =
      '<span class="tka-confirm-jenjang">' + (p.label || '') + ' — ' + (p.sumber || '') + '</span>' +
      '<span class="tka-confirm-detail">100 soal · TWK + TIU + TKP · ⏱ 90 menit</span>';
    document.getElementById('cpns-confirm-panel').style.display = 'flex';
  }

  // ══════════════════════════════════════════════════════════
  //  PHASE 2 — QUIZ  (fetch soal di sini)
  // ══════════════════════════════════════════════════════════
  async function startPaket() {
    if (!state.paket) return;
    const credits   = window._currentCredits ?? 0;
    const isInvited = window._isInvited ?? false;
    if (!isInvited && credits <= 0) { window.renderCreditsBanner?.(); window.startCheckout?.(); return; }

    loading('⏳ Memuat soal…');

    let bank;
    try {
      bank = await _fetchPaket(state.paket);
    } catch (e) {
      document.getElementById('cpns-container').innerHTML =
        '<div style="text-align:center;padding:40px;color:#c41a1a">❌ Gagal memuat soal. Coba lagi.</div>';
      return;
    }

    state.allQuestions  = buildQuestions(bank);
    state.answers       = new Array(state.allQuestions.length).fill(null);
    state.currentIdx    = 0;
    state.currentSection = 'twk';
    state.phase         = 'quiz';
    state.startTime     = Date.now();
    state.secondsLeft   = CONFIG.waktu * 60;

    renderQuizShell();
    renderQuestion(0);
    startTimer();
  }

  function renderQuizShell() {
    const total = state.allQuestions.length;
    const container = document.getElementById('cpns-container');

    const sectionTabs = CONFIG.sections.map(sec =>
      '<button class="cpns-section-tab" id="cpns-stab-' + sec.key +
      '" onclick="window.CPNS.jumpToSection(\'' + sec.key + '\')">' + sec.label + '</button>'
    ).join('');

    container.innerHTML = `
      <div class="cpns-quiz-shell">
        <div class="cpns-quiz-header">
          <div class="cpns-quiz-title">
            <span class="cpns-quiz-badge">SKD CPNS</span>
            <span class="cpns-quiz-progress" id="cpns-progress">Soal 1 / ${total}</span>
          </div>
          <div class="tka-timer" id="cpns-timer">${fmtTime(state.secondsLeft)}</div>
        </div>
        <div class="cpns-section-tabs" id="cpns-section-tabs">${sectionTabs}</div>
        <div class="tka-question-card" id="cpns-question-card"></div>
        <div class="tka-nav-row">
          <button class="tka-nav-btn" id="cpns-btn-prev" onclick="window.CPNS.navigate(-1)">← Sebelumnya</button>
          <div class="tka-nav-dots" id="cpns-nav-dots"></div>
          <button class="tka-nav-btn tka-nav-next" id="cpns-btn-next" onclick="window.CPNS.navigate(1)">Berikutnya →</button>
        </div>
        <div class="tka-submit-wrap">
          <button class="tka-btn-submit" id="cpns-btn-submit" onclick="window.CPNS.confirmSubmit()">
            Kumpulkan Jawaban 🏁
          </button>
          <p class="tka-submit-hint" id="cpns-submit-hint"></p>
        </div>
      </div>`;

    renderNavDots();
    updateSectionTabs();
  }

  function renderQuestion(idx) {
    state.currentIdx = idx;
    const q     = state.allQuestions[idx];
    const total = state.allQuestions.length;
    const sec   = CONFIG.sections.find(s => s.key === q.section);
    const secStart  = getSectionStart(q.section);
    const qNumInSec = idx - secStart + 1;

    document.getElementById('cpns-progress').textContent = 'Soal ' + (idx + 1) + ' / ' + total;

    const secColor = { twk: '#1a5a9a', tiu: '#1a7a6e', tkp: '#8b2a8b' }[q.section] || '#666';

    document.getElementById('cpns-question-card').innerHTML =
      '<div class="tka-q-meta">' +
        '<span class="tka-q-mapel-badge" style="background:' + secColor + '">' + sec.fullLabel + '</span>' +
        '<span class="tka-q-num">No. ' + qNumInSec + '</span>' +
      '</div>' +
      '<p class="tka-q-text">' + escHtml(q.q) + '</p>' +
      '<div class="tka-options" id="cpns-options">' +
        q.opts.map((opt, oi) => {
          const letter   = ['A','B','C','D','E'][oi];
          const selected = state.answers[idx] === letter;
          return '<button class="tka-opt' + (selected ? ' selected' : '') +
            '" onclick="window.CPNS.selectAnswer(' + idx + ',\'' + letter + '\')">' +
            '<span class="tka-opt-letter">' + letter + '</span>' +
            '<span class="tka-opt-text">' + escHtml(opt.replace(/^[A-E]\.\s*/, '')) + '</span>' +
            '</button>';
        }).join('') +
      '</div>';

    document.getElementById('cpns-btn-prev').disabled = idx === 0;
    document.getElementById('cpns-btn-next').disabled = idx === total - 1;
    state.currentSection = q.section;
    renderNavDots();
    updateSectionTabs();
  }

  function renderNavDots() {
    const dotsEl = document.getElementById('cpns-nav-dots');
    if (!dotsEl) return;
    const q = state.allQuestions[state.currentIdx];
    if (!q) return;
    const sec   = CONFIG.sections.find(s => s.key === q.section);
    const start = getSectionStart(q.section);
    let html = '';
    for (let i = start; i < start + sec.jumlah; i++) {
      html += '<button class="tka-dot' +
        (i === state.currentIdx ? ' current' : '') +
        (state.answers[i] !== null ? ' answered' : '') +
        '" onclick="window.CPNS.jumpTo(' + i + ')" title="Soal ' + (i - start + 1) + '"></button>';
    }
    dotsEl.innerHTML = html;
  }

  function updateSectionTabs() {
    CONFIG.sections.forEach(sec => {
      const tab = document.getElementById('cpns-stab-' + sec.key);
      if (tab) tab.classList.toggle('active', sec.key === state.currentSection);
    });
  }

  function selectAnswer(idx, letter) {
    state.answers[idx] = letter;
    document.querySelectorAll('#cpns-options .tka-opt').forEach((btn, oi) => {
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

  function jumpToSection(secKey) { renderQuestion(getSectionStart(secKey)); }

  // ── Timer ─────────────────────────────────────────────────────
  function startTimer() {
    clearInterval(state.timerInterval);
    state.timerInterval = setInterval(() => {
      state.secondsLeft--;
      const el = document.getElementById('cpns-timer');
      if (el) {
        el.textContent = fmtTime(state.secondsLeft);
        if (state.secondsLeft <= 300) el.classList.add('urgent');
      }
      if (state.secondsLeft <= 0) { clearInterval(state.timerInterval); submitQuiz(true); }
    }, 1000);
  }

  function _stopTimer() { clearInterval(state.timerInterval); }

  // ── Submit ────────────────────────────────────────────────────
  function confirmSubmit() {
    const unanswered = state.answers.filter(a => a === null).length;
    const hint = document.getElementById('cpns-submit-hint');
    if (unanswered > 0) {
      hint.textContent = '⚠️ ' + unanswered + ' soal belum dijawab. Kumpulkan tetap?';
      hint.style.color = 'var(--amber)';
      const btn = document.getElementById('cpns-btn-submit');
      btn.textContent = 'Ya, Kumpulkan Tetap 🏁';
      btn.onclick = () => submitQuiz(false);
      return;
    }
    submitQuiz(false);
  }

  function hitungSkor() {
    const scores = {};
    CONFIG.sections.forEach(sec => { scores[sec.key] = 0; });
    state.allQuestions.forEach((q, i) => {
      const ans = state.answers[i];
      if (!ans) return;
      const optIdx = ['A','B','C','D','E'].indexOf(ans);
      if (q.section === 'tkp') {
        scores.tkp += CONFIG.tkpScores[optIdx] || 0;
      } else {
        if (ans === q.ans) scores[q.section] += CONFIG.skorBenar[q.section];
      }
    });
    return scores;
  }

  function submitQuiz(isAutoSubmit) {
    clearInterval(state.timerInterval);
    state.phase = 'result';
    const elapsed = Math.round((Date.now() - state.startTime) / 1000);
    renderResult(hitungSkor(), elapsed, isAutoSubmit);
  }

  // ══════════════════════════════════════════════════════════
  //  PHASE 3 — RESULT
  // ══════════════════════════════════════════════════════════
  function renderResult(scores, elapsed, isAutoSubmit) {
    const container = document.getElementById('cpns-container');
    const minsE = Math.floor(elapsed / 60), secsE = elapsed % 60;
    const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);

    // ── Catat ke Profil ──────────────────────────────────────
    const maxSkorTotal = CONFIG.sections.reduce((s, sec) => s + sec.jumlah * 5, 0);
    window.PROFIL_recordSession?.('cpns_skd', {
      pct:        Math.round(totalScore / maxSkorTotal * 100),
      totalBenar: totalScore,
      totalSoal:  maxSkorTotal,
      scores,
      elapsed,
    });

    const pg = { twk: 65, tiu: 80, tkp: 166 };
    const lulusSemua = CONFIG.sections.every(sec => scores[sec.key] >= pg[sec.key]);
    const lulusTotal = totalScore >= CONFIG.totalPG;
    const lulus = lulusSemua && lulusTotal;

    const emoji = lulus ? '🏆' : '📚';
    const statusHtml = lulus
      ? '<span style="color:var(--teal)">✅ Lulus Passing Grade</span>'
      : '<span style="color:#e05c3a">❌ Belum Lulus Passing Grade</span>';

    const breakdown = CONFIG.sections.map(sec => {
      const skor = scores[sec.key];
      const maxSkor = sec.key === 'tkp' ? sec.jumlah * 5 : sec.jumlah * 5;
      const pct = Math.round(skor / maxSkor * 100);
      const lulusSec = skor >= pg[sec.key];
      const secColor = { twk: '#1a5a9a', tiu: '#1a7a6e', tkp: '#8b2a8b' }[sec.key];
      return '<div class="tka-breakdown-item">' +
        '<div class="tka-breakdown-label">' + sec.fullLabel +
          '<span style="font-size:.75rem;font-weight:600;color:' + (lulusSec ? 'var(--teal)' : '#e05c3a') + ';margin-left:8px">' +
            (lulusSec ? '✅' : '❌') + ' PG: ' + pg[sec.key] +
          '</span>' +
        '</div>' +
        '<div class="tka-breakdown-bar-wrap"><div class="tka-breakdown-bar" style="width:' + pct + '%;background:' + secColor + '"></div></div>' +
        '<div class="tka-breakdown-score">' + skor + ' <span class="tka-breakdown-pct">/ maks ' + maxSkor + '</span></div>' +
        '</div>';
    }).join('');

    container.innerHTML =
      '<div class="tka-result-wrap">' +
        (isAutoSubmit ? '<div class="tka-auto-submit-notice">⏱ Waktu habis — jawaban otomatis dikumpulkan</div>' : '') +
        '<div class="tka-score-hero">' +
          '<div class="tka-score-emoji">' + emoji + '</div>' +
          '<div class="tka-score-num" style="font-size:2.2rem">' + totalScore + '</div>' +
          '<div class="tka-score-pct">Total Nilai SKD · ' + statusHtml + '</div>' +
          '<div class="tka-score-time">⏱ ' + minsE + 'm ' + secsE + 's</div>' +
        '</div>' +
        '<div class="cpns-pg-banner ' + (lulus ? 'cpns-pg-lulus' : 'cpns-pg-gagal') + '">' +
          (lulus
            ? '🎉 Selamat! Nilai kamu memenuhi passing grade SKD CPNS. Terus tingkatkan!'
            : '📖 Terus berlatih! Passing grade total yang dibutuhkan: ' + CONFIG.totalPG + '.') +
        '</div>' +
        '<div class="tka-breakdown-section"><p class="tka-breakdown-title">Nilai per Seksi</p>' + breakdown + '</div>' +
        '<div class="tka-result-actions">' +
          '<button class="btn-new" onclick="window.CPNS.showReview()">📖 Lihat Pembahasan</button>' +
          '<button class="tka-btn-retry" onclick="window.CPNS.init()">↺ Ulangi Simulasi</button>' +
        '</div>' +
      '</div>';
  }

  // ══════════════════════════════════════════════════════════
  //  REVIEW
  // ══════════════════════════════════════════════════════════
  function showReview() {
    const container = document.getElementById('cpns-container');
    let html = '<div class="tka-review-wrap"><h2 class="tka-review-title">📖 Pembahasan Lengkap</h2>';

    CONFIG.sections.forEach(sec => {
      const secColor = { twk: '#1a5a9a', tiu: '#1a7a6e', tkp: '#8b2a8b' }[sec.key];
      html += '<div class="tka-review-section"><div class="tka-review-mapel-header" style="background:' + secColor + '">' + sec.fullLabel + '</div>';
      const start = getSectionStart(sec.key);
      for (let i = start; i < start + sec.jumlah; i++) {
        const q = state.allQuestions[i];
        const userAns = state.answers[i];
        const correct = sec.key === 'tkp' ? true : userAns === q.ans;
        html +=
          '<div class="tka-review-item' + (sec.key === 'tkp' ? '' : correct ? ' review-correct' : ' review-wrong') + '">' +
            '<div class="tka-review-item-header">' +
              '<span class="tka-review-status">' + (sec.key === 'tkp' ? '📋' : correct ? '✅' : '❌') + '</span>' +
              '<span class="tka-review-qnum">Soal ' + (i - start + 1) + '</span>' +
            '</div>' +
            '<p class="tka-review-q">' + escHtml(q.q) + '</p>' +
            '<div class="tka-review-opts">' +
              q.opts.map((opt, oi) => {
                const l = ['A','B','C','D','E'][oi];
                let cls = 'tka-review-opt';
                if (sec.key !== 'tkp' && l === q.ans) cls += ' review-opt-correct';
                else if (l === userAns) cls += ' review-opt-selected';
                return '<div class="' + cls + '">' + escHtml(opt) + '</div>';
              }).join('') +
            '</div>' +
            (sec.key !== 'tkp' && !correct
              ? '<div class="tka-review-user-ans">Jawabanmu: <strong>' + (userAns || 'Tidak dijawab') + '</strong> · Jawaban benar: <strong>' + q.ans + '</strong></div>'
              : '') +
            '<div class="tka-review-expl">💡 ' + escHtml(q.expl) + '</div>' +
          '</div>';
      }
      html += '</div>';
    });

    html += '<div class="tka-result-actions" style="margin-top:32px">' +
      '<button class="btn-new" onclick="window.CPNS.init()">↺ Ulangi Simulasi</button>' +
      '</div></div>';
    container.innerHTML = html;
  }

  // ── Public API ────────────────────────────────────────────────
  return {
    init, previewPaket, startPaket,
    navigate, jumpTo, jumpToSection,
    selectAnswer, confirmSubmit, showReview,
    _stopTimer,
  };
})();
