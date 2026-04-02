/* ============================================================
   SIMULASI SKD CPNS — Logic
   TWK: 30 soal | TIU: 35 soal | TKP: 35 soal
   Total: 100 soal | Waktu: 90 menit
   ============================================================ */

window.CPNS = (function() {

  // ── Konfigurasi SKD ──────────────────────────────────────────
  const CONFIG = {
    waktu: 90,   // menit
    sections: [
      { key: 'twk', label: 'TWK', fullLabel: '📜 Tes Wawasan Kebangsaan', jumlah: 30, passingGrade: 65 },
      { key: 'tiu', label: 'TIU', fullLabel: '🧮 Tes Intelegensia Umum',  jumlah: 35, passingGrade: 80 },
      { key: 'tkp', label: 'TKP', fullLabel: '🧠 Tes Karakteristik Pribadi', jumlah: 35, passingGrade: 166 },
    ],
    skorBenar: { twk: 5, tiu: 5, tkp: 0 },   // TKP: tiap opsi punya skor berbeda
    skorSalah: { twk: 0, tiu: 0, tkp: 0 },
    // Skor TKP: A=1,B=2,C=3,D=4,E=5 (urutan opsi A..E)
    tkpScores: [1, 2, 3, 4, 5],
    totalPassingGrade: 311,
  };

  // ── State ────────────────────────────────────────────────────
  let state = {
    paket: null,
    allQuestions: [],   // [{section, sectionIdx, ...q}]
    answers: [],        // null | 'A'..'E'
    currentIdx: 0,
    currentSection: 'twk',
    timerInterval: null,
    secondsLeft: 0,
    phase: 'select',    // 'select' | 'quiz' | 'result'
    startTime: null,
  };

  // ── Shuffle ──────────────────────────────────────────────────
  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // ── Build questions ──────────────────────────────────────────
  function buildQuestions(paketKey) {
    const bank = window.CPNS_QUESTIONS[paketKey];
    const all = [];
    CONFIG.sections.forEach(sec => {
      const pool = bank[sec.key] || [];
      const picked = shuffle(pool).slice(0, sec.jumlah);
      picked.forEach((q, i) => all.push({ ...q, section: sec.key, sectionIdx: i }));
    });
    return all;
  }

  // ── Init ─────────────────────────────────────────────────────
  function init() {
    renderSelectPaket();
  }

  // ══════════════════════════════════════════════════════════
  //  PHASE 1: PILIH PAKET
  // ══════════════════════════════════════════════════════════
  function renderSelectPaket() {
    state.phase = 'select';
    const container = document.getElementById('cpns-container');

    const pakets = Object.keys(window.CPNS_QUESTIONS || {});
    const paketCards = pakets.map(key => {
      const p = window.CPNS_QUESTIONS[key];
      return `
        <button class="cpns-paket-btn" onclick="window.CPNS.previewPaket('${key}')">
          <div class="cpns-paket-num">${p.label}</div>
          <div class="cpns-paket-src">${p.sumber}</div>
          <div class="cpns-paket-meta">
            <span>📜 30 TWK</span>
            <span>🧮 35 TIU</span>
            <span>🧠 35 TKP</span>
          </div>
        </button>`;
    }).join('');

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

        <p class="tka-credit-note">⚡ Menggunakan 1 kredit</p>
      </div>`;
  }

  function previewPaket(paketKey) {
    document.querySelectorAll('.cpns-paket-btn').forEach(btn => btn.classList.remove('selected'));
    const btns = document.querySelectorAll('.cpns-paket-btn');
    const idx = Object.keys(window.CPNS_QUESTIONS).indexOf(paketKey);
    if (btns[idx]) btns[idx].classList.add('selected');

    state.paket = paketKey;
    const p = window.CPNS_QUESTIONS[paketKey];
    document.getElementById('cpns-confirm-info').innerHTML =
      `<span class="tka-confirm-jenjang">${p.label} — ${p.sumber}</span>` +
      `<span class="tka-confirm-detail">100 soal · TWK + TIU + TKP · ⏱ 90 menit</span>`;
    document.getElementById('cpns-confirm-panel').style.display = 'flex';
  }

  // ══════════════════════════════════════════════════════════
  //  PHASE 2: QUIZ
  // ══════════════════════════════════════════════════════════
  function startPaket() {
    if (!state.paket) return;

    const credits = window._currentCredits ?? 0;
    const isInvited = window._isInvited ?? false;
    if (!isInvited && credits <= 0) {
      window.renderCreditsBanner?.();
      window.startCheckout?.();
      return;
    }

    state.allQuestions = buildQuestions(state.paket);
    state.answers = new Array(state.allQuestions.length).fill(null);
    state.currentIdx = 0;
    state.currentSection = 'twk';
    state.phase = 'quiz';
    state.startTime = Date.now();
    state.secondsLeft = CONFIG.waktu * 60;

    renderQuizShell();
    renderQuestion(0);
    startTimer();
  }

  function getSectionStart(secKey) {
    let start = 0;
    for (const sec of CONFIG.sections) {
      if (sec.key === secKey) return start;
      start += sec.jumlah;
    }
    return 0;
  }

  function renderQuizShell() {
    const total = state.allQuestions.length;
    const container = document.getElementById('cpns-container');

    const sectionTabs = CONFIG.sections.map(sec =>
      `<button class="cpns-section-tab" id="cpns-stab-${sec.key}" onclick="window.CPNS.jumpToSection('${sec.key}')">${sec.label}</button>`
    ).join('');

    container.innerHTML = `
      <div class="cpns-quiz-shell">
        <div class="cpns-quiz-header">
          <div class="cpns-quiz-title">
            <span class="cpns-quiz-badge">SKD CPNS</span>
            <span class="cpns-quiz-progress" id="cpns-progress">Soal 1 / ${total}</span>
          </div>
          <div class="tka-timer" id="cpns-timer">90:00</div>
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
    const q = state.allQuestions[idx];
    const total = state.allQuestions.length;
    const sec = CONFIG.sections.find(s => s.key === q.section);

    document.getElementById('cpns-progress').textContent = `Soal ${idx + 1} / ${total}`;

    const secStart = getSectionStart(q.section);
    const qNumInSec = idx - secStart + 1;
    const secColor = { twk: '#1a5a9a', tiu: '#1a7a6e', tkp: '#8b2a8b' }[q.section] || '#666';

    const card = document.getElementById('cpns-question-card');
    card.innerHTML = `
      <div class="tka-q-meta">
        <span class="tka-q-mapel-badge" style="background:${secColor}">${sec.fullLabel}</span>
        <span class="tka-q-num">No. ${qNumInSec}</span>
      </div>
      <p class="tka-q-text">${escHtml(q.q)}</p>
      <div class="tka-options" id="cpns-options">
        ${q.opts.map((opt, oi) => {
          const letter = ['A','B','C','D','E'][oi];
          const selected = state.answers[idx] === letter;
          return `<button class="tka-opt${selected ? ' selected' : ''}" onclick="window.CPNS.selectAnswer(${idx},'${letter}')">
            <span class="tka-opt-letter">${letter}</span>
            <span class="tka-opt-text">${escHtml(opt.replace(/^[A-E]\.\s*/,''))}</span>
          </button>`;
        }).join('')}
      </div>`;

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
    const sec = CONFIG.sections.find(s => s.key === q.section);
    const start = getSectionStart(q.section);
    const end = start + sec.jumlah;
    let html = '';
    for (let i = start; i < end; i++) {
      const answered = state.answers[i] !== null;
      const current = i === state.currentIdx;
      html += `<button class="tka-dot${current ? ' current' : ''}${answered ? ' answered' : ''}"
        onclick="window.CPNS.jumpTo(${i})" title="Soal ${i - start + 1}"></button>`;
    }
    dotsEl.innerHTML = html;
  }

  function updateSectionTabs() {
    CONFIG.sections.forEach(sec => {
      const tab = document.getElementById('cpns-stab-' + sec.key);
      if (!tab) return;
      tab.classList.toggle('active', sec.key === state.currentSection);
    });
  }

  function selectAnswer(idx, letter) {
    state.answers[idx] = letter;
    const optsEl = document.getElementById('cpns-options');
    if (!optsEl) return;
    optsEl.querySelectorAll('.tka-opt').forEach((btn, oi) => {
      const l = ['A','B','C','D','E'][oi];
      btn.classList.toggle('selected', l === letter);
    });
    renderNavDots();
    setTimeout(() => {
      if (state.currentIdx < state.allQuestions.length - 1) navigate(1);
    }, 350);
  }

  function navigate(dir) {
    const next = state.currentIdx + dir;
    if (next >= 0 && next < state.allQuestions.length) renderQuestion(next);
  }

  function jumpTo(idx) { renderQuestion(idx); }

  function jumpToSection(secKey) {
    renderQuestion(getSectionStart(secKey));
  }

  // ── Timer ─────────────────────────────────────────────────────
  function startTimer() {
    clearInterval(state.timerInterval);
    state.timerInterval = setInterval(() => {
      state.secondsLeft--;
      const el = document.getElementById('cpns-timer');
      if (el) {
        const m = Math.floor(state.secondsLeft / 60);
        const s = state.secondsLeft % 60;
        el.textContent = String(m).padStart(2,'0') + ':' + String(s).padStart(2,'0');
        if (state.secondsLeft <= 300) el.classList.add('urgent');
      }
      if (state.secondsLeft <= 0) {
        clearInterval(state.timerInterval);
        submitQuiz(true);
      }
    }, 1000);
  }

  function _stopTimer() { clearInterval(state.timerInterval); }

  // ── Submit ────────────────────────────────────────────────────
  function confirmSubmit() {
    const answered = state.answers.filter(a => a !== null).length;
    const unanswered = state.allQuestions.length - answered;
    const hint = document.getElementById('cpns-submit-hint');
    if (unanswered > 0) {
      hint.textContent = `⚠️ ${unanswered} soal belum dijawab. Kumpulkan tetap?`;
      hint.style.color = 'var(--amber)';
      document.getElementById('cpns-btn-submit').textContent = 'Ya, Kumpulkan Tetap 🏁';
      document.getElementById('cpns-btn-submit').onclick = () => submitQuiz(false);
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
        // TKP: skor berdasarkan urutan opsi (A=1..E=5 untuk soal standar)
        // Tapi beberapa soal punya bobot berbeda — pakai skor sesuai kunci jika sama
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
    const scores = hitungSkor();
    const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
    renderResult(scores, totalScore, elapsed, isAutoSubmit);
  }

  // ══════════════════════════════════════════════════════════
  //  PHASE 3: RESULT
  // ══════════════════════════════════════════════════════════
  function renderResult(scores, totalScore, elapsed, isAutoSubmit) {
    const container = document.getElementById('cpns-container');
    const minsElapsed = Math.floor(elapsed / 60);
    const secsElapsed = elapsed % 60;

    // Cek passing grade per seksi
    const pg = { twk: 65, tiu: 80, tkp: 166 };
    const lulus = CONFIG.sections.every(sec => scores[sec.key] >= pg[sec.key]);
    const lulusTotal = totalScore >= CONFIG.totalPassingGrade;

    const emoji = lulus && lulusTotal ? '🏆' : '📚';
    const statusMsg = lulus && lulusTotal
      ? '<span style="color:var(--teal)">✅ Lulus Passing Grade</span>'
      : '<span style="color:#e05c3a">❌ Belum Lulus Passing Grade</span>';

    const sectionBreakdown = CONFIG.sections.map(sec => {
      const skor = scores[sec.key];
      const lulusSec = skor >= pg[sec.key];
      const maxSkor = sec.key === 'tkp' ? sec.jumlah * 5 : sec.jumlah * 5;
      const pct = Math.round((skor / maxSkor) * 100);
      return `
        <div class="tka-breakdown-item">
          <div class="tka-breakdown-label">
            ${sec.fullLabel}
            <span style="font-size:0.75rem;font-weight:600;color:${lulusSec ? 'var(--teal)' : '#e05c3a'}">
              ${lulusSec ? '✅' : '❌'} PG: ${pg[sec.key]}
            </span>
          </div>
          <div class="tka-breakdown-bar-wrap">
            <div class="tka-breakdown-bar" style="width:${pct}%;background:${{twk:'#1a5a9a',tiu:'var(--teal)',tkp:'#8b2a8b'}[sec.key]}"></div>
          </div>
          <div class="tka-breakdown-score">${skor} <span class="tka-breakdown-pct">/ maks ${maxSkor}</span></div>
        </div>`;
    }).join('');

    container.innerHTML = `
      <div class="tka-result-wrap">
        ${isAutoSubmit ? '<div class="tka-auto-submit-notice">⏱ Waktu habis — jawaban otomatis dikumpulkan</div>' : ''}

        <div class="tka-score-hero">
          <div class="tka-score-emoji">${emoji}</div>
          <div class="tka-score-num" style="font-size:2.2rem">${totalScore}</div>
          <div class="tka-score-pct">Total Nilai SKD · ${statusMsg}</div>
          <div class="tka-score-time">⏱ Waktu: ${minsElapsed}m ${secsElapsed}s</div>
        </div>

        <div class="cpns-pg-banner${lulus && lulusTotal ? ' cpns-pg-lulus' : ' cpns-pg-gagal'}">
          ${lulus && lulusTotal
            ? '🎉 Selamat! Nilai kamu memenuhi passing grade SKD CPNS. Terus tingkatkan!'
            : `📖 Terus berlatih! Passing grade total yang dibutuhkan: ${CONFIG.totalPassingGrade}.`}
        </div>

        <div class="tka-breakdown-section">
          <p class="tka-breakdown-title">Nilai per Seksi</p>
          ${sectionBreakdown}
        </div>

        <div class="tka-result-actions">
          <button class="btn-new" onclick="window.CPNS.showReview()">📖 Lihat Pembahasan</button>
          <button class="tka-btn-retry" onclick="window.CPNS.init()">↺ Ulangi Simulasi</button>
        </div>
      </div>`;
  }

  // ══════════════════════════════════════════════════════════
  //  REVIEW
  // ══════════════════════════════════════════════════════════
  function showReview() {
    const container = document.getElementById('cpns-container');
    let html = '<div class="tka-review-wrap"><h2 class="tka-review-title">📖 Pembahasan Lengkap</h2>';

    CONFIG.sections.forEach(sec => {
      const secColor = { twk: '#1a5a9a', tiu: '#1a7a6e', tkp: '#8b2a8b' }[sec.key];
      html += `<div class="tka-review-section">
        <div class="tka-review-mapel-header" style="background:${secColor}">${sec.fullLabel}</div>`;

      const start = getSectionStart(sec.key);
      for (let i = start; i < start + sec.jumlah; i++) {
        const q = state.allQuestions[i];
        const userAns = state.answers[i];
        const correct = sec.key === 'tkp'
          ? (userAns === q.ans || true)  // TKP tidak ada benar/salah, tampilkan saja
          : userAns === q.ans;

        html += `
          <div class="tka-review-item${sec.key === 'tkp' ? '' : correct ? ' review-correct' : ' review-wrong'}">
            <div class="tka-review-item-header">
              <span class="tka-review-status">${sec.key === 'tkp' ? '📋' : correct ? '✅' : '❌'}</span>
              <span class="tka-review-qnum">Soal ${i - start + 1}</span>
            </div>
            <p class="tka-review-q">${escHtml(q.q)}</p>
            <div class="tka-review-opts">
              ${q.opts.map((opt, oi) => {
                const l = ['A','B','C','D','E'][oi];
                let cls = 'tka-review-opt';
                if (sec.key !== 'tkp' && l === q.ans) cls += ' review-opt-correct';
                else if (l === userAns) cls += ' review-opt-selected';
                return `<div class="${cls}">${escHtml(opt)}</div>`;
              }).join('')}
            </div>
            ${sec.key !== 'tkp' && !correct
              ? `<div class="tka-review-user-ans">Jawabanmu: <strong>${userAns || 'Tidak dijawab'}</strong> · Jawaban benar: <strong>${q.ans}</strong></div>`
              : ''}
            <div class="tka-review-expl">💡 ${escHtml(q.expl)}</div>
          </div>`;
      }
      html += '</div>';
    });

    html += `<div class="tka-result-actions" style="margin-top:32px">
      <button class="btn-new" onclick="window.CPNS.init()">↺ Ulangi Simulasi</button>
    </div></div>`;

    container.innerHTML = html;
  }

  // ── Util ──────────────────────────────────────────────────────
  function escHtml(str) {
    return String(str)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  // ── Public API ────────────────────────────────────────────────
  return {
    init,
    previewPaket,
    startPaket,
    navigate,
    jumpTo,
    jumpToSection,
    selectAnswer,
    confirmSubmit,
    showReview,
    _stopTimer,
  };
})();
