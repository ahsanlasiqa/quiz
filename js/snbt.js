/* ============================================================
   SIMULASI UTBK SNBT — Logic
   Tes Potensi Skolastik (TPS):
   1. Penalaran Umum (PU)              : 30 soal · 30 menit
   2. Pengetahuan & Pemahaman Umum     : 20 soal · 15 menit
   3. Pemahaman Bacaan & Menulis       : 20 soal · 25 menit
   4. Pengetahuan Kuantitatif          : 20 soal · 20 menit
   Total: 90 soal · 90 menit
   ============================================================ */

window.SNBT = (function() {

  const CONFIG = {
    waktu: 90,
    sections: [
      { key: 'pu',  label: 'PU',  fullLabel: '🧠 Penalaran Umum',                  jumlah: 30, warna: '#1a5a9a' },
      { key: 'ppu', label: 'PPU', fullLabel: '📖 Pengetahuan & Pemahaman Umum',     jumlah: 20, warna: '#1a7a6e' },
      { key: 'pbm', label: 'PBM', fullLabel: '✍️ Pemahaman Bacaan & Menulis',       jumlah: 20, warna: '#c47a1a' },
      { key: 'pk',  label: 'PK',  fullLabel: '🔢 Pengetahuan Kuantitatif',          jumlah: 20, warna: '#8b2a8b' },
    ],
    skorBenar: 1,
    skorSalah: 0,
  };

  let state = {
    paket: null,
    allQuestions: [],
    answers: [],
    currentIdx: 0,
    timerInterval: null,
    secondsLeft: 0,
    phase: 'select',
    startTime: null,
  };

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function buildQuestions(paketKey) {
    const bank = window.SNBT_QUESTIONS[paketKey];
    const all = [];
    CONFIG.sections.forEach(sec => {
      const pool = bank[sec.key] || [];
      const picked = shuffle(pool).slice(0, sec.jumlah);
      picked.forEach((q, i) => all.push({ ...q, section: sec.key, sectionIdx: i }));
    });
    return all;
  }

  function getSectionStart(secKey) {
    let start = 0;
    for (const sec of CONFIG.sections) {
      if (sec.key === secKey) return start;
      start += sec.jumlah;
    }
    return 0;
  }

  function init() { renderSelectPaket(); }

  // ══ PHASE 1: PILIH PAKET ════════════════════════════════════
  function renderSelectPaket() {
    state.phase = 'select';
    const container = document.getElementById('snbt-container');
    const pakets = Object.keys(window.SNBT_QUESTIONS || {});

    const paketCards = pakets.map((key, idx) => {
      const p = window.SNBT_QUESTIONS[key];
      return `
        <button class="cpns-paket-btn" onclick="window.SNBT.previewPaket('${key}')">
          <div class="cpns-paket-num">${p.label}</div>
          <div class="cpns-paket-src">${p.sumber} · ${p.tahun || ''}</div>
          <div class="cpns-paket-meta">
            <span>🧠 30 PU</span>
            <span>📖 20 PPU</span>
            <span>✍️ 20 PBM</span>
            <span>🔢 20 PK</span>
          </div>
        </button>`;
    }).join('');

    container.innerHTML = `
      <div class="cpns-select-wrap">
        <div class="snbt-hero">
          <div class="cpns-hero-badge" style="background:rgba(26,90,154,0.2);color:#6aacff;border-color:rgba(26,90,154,0.3)">📚 Simulasi TPS SNBT</div>
          <h2 class="cpns-hero-title">Try Out<br/>UTBK SNBT</h2>
          <p class="cpns-hero-sub">90 soal · 90 menit · Tes Potensi Skolastik<br/>PU + PPU + PBM + PK sesuai format SNBT resmi</p>
        </div>

        <div class="snbt-info-row">
          <div class="snbt-info-card"><span class="snbt-info-icon">🧠</span><div class="snbt-info-label">Penalaran Umum</div><div class="snbt-info-val">30 soal</div></div>
          <div class="snbt-info-card"><span class="snbt-info-icon">📖</span><div class="snbt-info-label">Peng. & Pemahaman Umum</div><div class="snbt-info-val">20 soal</div></div>
          <div class="snbt-info-card"><span class="snbt-info-icon">✍️</span><div class="snbt-info-label">Pemahaman Bacaan & Menulis</div><div class="snbt-info-val">20 soal</div></div>
          <div class="snbt-info-card"><span class="snbt-info-icon">🔢</span><div class="snbt-info-label">Pengetahuan Kuantitatif</div><div class="snbt-info-val">20 soal</div></div>
        </div>

        <p class="cpns-choose-label">Pilih Paket Latihan</p>
        <div class="cpns-paket-grid">${paketCards}</div>

        <div class="cpns-confirm-panel" id="snbt-confirm-panel" style="display:none;border-color:#1a5a9a">
          <div class="cpns-confirm-info" id="snbt-confirm-info"></div>
          <button class="cpns-btn-start" style="background:#1a5a9a" onclick="window.SNBT.startPaket()">Mulai Try Out ▶</button>
        </div>

        <p class="tka-credit-note">⚡ Menggunakan 1 kredit</p>
      </div>`;
  }

  function previewPaket(paketKey) {
    document.querySelectorAll('#snbt-container .cpns-paket-btn').forEach(btn => btn.classList.remove('selected'));
    const btns = document.querySelectorAll('#snbt-container .cpns-paket-btn');
    const idx = Object.keys(window.SNBT_QUESTIONS).indexOf(paketKey);
    if (btns[idx]) btns[idx].classList.add('selected');

    state.paket = paketKey;
    const p = window.SNBT_QUESTIONS[paketKey];
    document.getElementById('snbt-confirm-info').innerHTML =
      `<span class="tka-confirm-jenjang">${p.label} — ${p.sumber}</span>` +
      `<span class="tka-confirm-detail">90 soal · PU + PPU + PBM + PK · ⏱ 90 menit</span>`;
    document.getElementById('snbt-confirm-panel').style.display = 'flex';
  }

  // ══ PHASE 2: QUIZ ════════════════════════════════════════════
  function startPaket() {
    if (!state.paket) return;
    const credits = window._currentCredits ?? 0;
    const isInvited = window._isInvited ?? false;
    if (!isInvited && credits <= 0) { window.renderCreditsBanner?.(); window.startCheckout?.(); return; }

    state.allQuestions = buildQuestions(state.paket);
    state.answers = new Array(state.allQuestions.length).fill(null);
    state.currentIdx = 0;
    state.phase = 'quiz';
    state.startTime = Date.now();
    state.secondsLeft = CONFIG.waktu * 60;

    renderQuizShell();
    renderQuestion(0);
    startTimer();
  }

  function renderQuizShell() {
    const total = state.allQuestions.length;
    const container = document.getElementById('snbt-container');

    const tabs = CONFIG.sections.map(sec =>
      `<button class="cpns-section-tab" id="snbt-stab-${sec.key}" style="--sec-color:${sec.warna}" onclick="window.SNBT.jumpToSection('${sec.key}')">${sec.label}</button>`
    ).join('');

    container.innerHTML = `
      <div class="cpns-quiz-shell">
        <div class="cpns-quiz-header">
          <div class="cpns-quiz-title">
            <span class="cpns-quiz-badge" style="background:#1a5a9a">TPS SNBT</span>
            <span class="cpns-quiz-progress" id="snbt-progress">Soal 1 / ${total}</span>
          </div>
          <div class="tka-timer" id="snbt-timer">90:00</div>
        </div>

        <div class="cpns-section-tabs" id="snbt-section-tabs">${tabs}</div>
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
    const q = state.allQuestions[idx];
    const total = state.allQuestions.length;
    const sec = CONFIG.sections.find(s => s.key === q.section);
    const secStart = getSectionStart(q.section);
    const qNumInSec = idx - secStart + 1;

    document.getElementById('snbt-progress').textContent = `Soal ${idx + 1} / ${total}`;

    const card = document.getElementById('snbt-question-card');

    // Teks wacana (kalau ada)
    const teksHtml = q.teks
      ? `<div class="snbt-wacana">${escHtml(q.teks)}</div>`
      : '';

    card.innerHTML = `
      <div class="tka-q-meta">
        <span class="tka-q-mapel-badge" style="background:${sec.warna}">${sec.fullLabel}</span>
        <span class="tka-q-num">No. ${qNumInSec}</span>
        ${q.materi ? `<span class="snbt-materi-chip">${escHtml(q.materi)}</span>` : ''}
      </div>
      ${teksHtml}
      <p class="tka-q-text">${escHtml(q.q)}</p>
      <div class="tka-options" id="snbt-options">
        ${q.opts.map((opt, oi) => {
          const letter = ['A','B','C','D','E'][oi];
          const selected = state.answers[idx] === letter;
          return `<button class="tka-opt${selected ? ' selected' : ''}" onclick="window.SNBT.selectAnswer(${idx},'${letter}')">
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
    const sec = CONFIG.sections.find(s => s.key === q.section);
    const start = getSectionStart(q.section);
    let html = '';
    for (let i = start; i < start + sec.jumlah; i++) {
      const answered = state.answers[i] !== null;
      const current = i === state.currentIdx;
      html += `<button class="tka-dot${current ? ' current' : ''}${answered ? ' answered' : ''}"
        onclick="window.SNBT.jumpTo(${i})" title="Soal ${i - start + 1}"></button>`;
    }
    dotsEl.innerHTML = html;
  }

  function updateSectionTabs(activeKey) {
    const key = activeKey || state.allQuestions[state.currentIdx]?.section;
    CONFIG.sections.forEach(sec => {
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
    setTimeout(() => { if (state.currentIdx < state.allQuestions.length - 1) navigate(1); }, 350);
  }

  function navigate(dir) {
    const next = state.currentIdx + dir;
    if (next >= 0 && next < state.allQuestions.length) renderQuestion(next);
  }

  function jumpTo(idx) { renderQuestion(idx); }

  function jumpToSection(secKey) { renderQuestion(getSectionStart(secKey)); }

  // ── Timer ──────────────────────────────────────────────────────
  function startTimer() {
    clearInterval(state.timerInterval);
    state.timerInterval = setInterval(() => {
      state.secondsLeft--;
      const el = document.getElementById('snbt-timer');
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

  // ── Submit ─────────────────────────────────────────────────────
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

    const scores = {};
    CONFIG.sections.forEach(sec => { scores[sec.key] = { benar: 0, salah: 0, total: sec.jumlah }; });
    state.allQuestions.forEach((q, i) => {
      const ans = state.answers[i];
      if (!ans) return;
      if (ans === q.ans) scores[q.section].benar++;
      else scores[q.section].salah++;
    });

    renderResult(scores, elapsed, isAutoSubmit);
  }

  // ══ PHASE 3: RESULT ══════════════════════════════════════════════
  function renderResult(scores, elapsed, isAutoSubmit) {
    const container = document.getElementById('snbt-container');
    const minsElapsed = Math.floor(elapsed / 60);
    const secsElapsed = elapsed % 60;

    const totalBenar = Object.values(scores).reduce((a, s) => a + s.benar, 0);
    const totalSoal = state.allQuestions.length;
    const pct = Math.round((totalBenar / totalSoal) * 100);

    const breakdown = CONFIG.sections.map(sec => {
      const s = scores[sec.key];
      const spct = Math.round((s.benar / s.total) * 100);
      return `
        <div class="tka-breakdown-item">
          <div class="tka-breakdown-label">${sec.fullLabel}</div>
          <div class="tka-breakdown-bar-wrap">
            <div class="tka-breakdown-bar" style="width:${spct}%;background:${sec.warna}"></div>
          </div>
          <div class="tka-breakdown-score">${s.benar}/${s.total} <span class="tka-breakdown-pct">(${spct}%)</span></div>
        </div>`;
    }).join('');

    const emoji = pct >= 80 ? '🏆' : pct >= 65 ? '🥈' : pct >= 50 ? '🥉' : '📚';
    const msg = pct >= 80 ? 'Luar Biasa!' : pct >= 65 ? 'Bagus!' : pct >= 50 ? 'Cukup Baik' : 'Tetap Semangat!';

    container.innerHTML = `
      <div class="tka-result-wrap">
        ${isAutoSubmit ? '<div class="tka-auto-submit-notice">⏱ Waktu habis — jawaban otomatis dikumpulkan</div>' : ''}
        <div class="tka-score-hero">
          <div class="tka-score-emoji">${emoji}</div>
          <div class="tka-score-num">${totalBenar} / ${totalSoal}</div>
          <div class="tka-score-pct">${pct}% · ${msg}</div>
          <div class="tka-score-time">⏱ Waktu: ${minsElapsed}m ${secsElapsed}s</div>
        </div>
        <div class="tka-breakdown-section">
          <p class="tka-breakdown-title">Nilai per Subtes</p>
          ${breakdown}
        </div>
        <div class="tka-result-actions">
          <button class="btn-new" onclick="window.SNBT.showReview()">📖 Lihat Pembahasan</button>
          <button class="tka-btn-retry" onclick="window.SNBT.init()">↺ Ulangi Try Out</button>
        </div>
      </div>`;
  }

  // ══ REVIEW ═══════════════════════════════════════════════════════
  function showReview() {
    const container = document.getElementById('snbt-container');
    let html = '<div class="tka-review-wrap"><h2 class="tka-review-title">📖 Pembahasan Lengkap</h2>';

    CONFIG.sections.forEach(sec => {
      html += `<div class="tka-review-section">
        <div class="tka-review-mapel-header" style="background:${sec.warna}">${sec.fullLabel}</div>`;
      const start = getSectionStart(sec.key);
      for (let i = start; i < start + sec.jumlah; i++) {
        const q = state.allQuestions[i];
        const userAns = state.answers[i];
        const correct = userAns === q.ans;
        html += `
          <div class="tka-review-item${correct ? ' review-correct' : ' review-wrong'}">
            <div class="tka-review-item-header">
              <span class="tka-review-status">${correct ? '✅' : '❌'}</span>
              <span class="tka-review-qnum">Soal ${i - start + 1}</span>
              ${q.materi ? `<span class="snbt-materi-chip">${escHtml(q.materi)}</span>` : ''}
            </div>
            ${q.teks ? `<div class="snbt-wacana snbt-wacana-sm">${escHtml(q.teks)}</div>` : ''}
            <p class="tka-review-q">${escHtml(q.q)}</p>
            <div class="tka-review-opts">
              ${q.opts.map((opt, oi) => {
                const l = ['A','B','C','D','E'][oi];
                let cls = 'tka-review-opt';
                if (l === q.ans) cls += ' review-opt-correct';
                else if (l === userAns) cls += ' review-opt-wrong';
                return `<div class="${cls}">${escHtml(opt)}</div>`;
              }).join('')}
            </div>
            ${!correct ? `<div class="tka-review-user-ans">Jawabanmu: <strong>${userAns || 'Tidak dijawab'}</strong> · Jawaban benar: <strong>${q.ans}</strong></div>` : ''}
            <div class="tka-review-expl">💡 ${escHtml(q.expl || '')}</div>
          </div>`;
      }
      html += '</div>';
    });

    html += `<div class="tka-result-actions" style="margin-top:32px">
      <button class="btn-new" onclick="window.SNBT.init()">↺ Ulangi Try Out</button>
    </div></div>`;
    container.innerHTML = html;
  }

  function escHtml(str) {
    return String(str || '')
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  return { init, previewPaket, startPaket, navigate, jumpTo, jumpToSection, selectAnswer, confirmSubmit, showReview, _stopTimer };
})();
