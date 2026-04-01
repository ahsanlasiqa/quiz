/* ============================================================
   PREDIKSI TKA 2026 — Logic
   ============================================================ */

window.TKA = (function() {

  // ── Config ──────────────────────────────────────────────────
  const CONFIG = {
    SD:  { mapel: ['matematika','bahasa_indonesia'], jumlah: 30, durasi: 60, label: 'SD/MI' },
    SMP: { mapel: ['matematika','bahasa_indonesia'], jumlah: 30, durasi: 60, label: 'SMP/MTs' },
    SMA: { mapel: ['matematika','bahasa_indonesia','bahasa_inggris'], jumlah: 50, durasi: 90, label: 'SMA/MA/SMK' }
  };

  const MAPEL_LABEL = {
    matematika: '📐 Matematika',
    bahasa_indonesia: '📖 Bahasa Indonesia',
    bahasa_inggris: '🌐 Bahasa Inggris'
  };

  // ── State ───────────────────────────────────────────────────
  let state = {
    jenjang: null,       // 'SD' | 'SMP' | 'SMA'
    allQuestions: [],    // [{mapel, ...question}]
    currentIdx: 0,
    answers: [],         // user answers indexed by question idx
    timerInterval: null,
    secondsLeft: 0,
    phase: 'select',     // 'select' | 'quiz' | 'result'
    startTime: null,
  };

  // ── Shuffle helper ───────────────────────────────────────────
  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // ── Build all questions for a jenjang ────────────────────────
  function buildQuestions(jenjang) {
    const cfg = CONFIG[jenjang];
    const bank = window.TKA_QUESTIONS[jenjang];
    const all = [];
    cfg.mapel.forEach(mp => {
      const pool = bank[mp] || [];
      const picked = shuffle(pool).slice(0, cfg.jumlah);
      picked.forEach(q => all.push({ mapel: mp, ...q }));
    });
    return all; // ordered by mapel
  }

  // ── Init / Render TKA Section ────────────────────────────────
  function init() {
    renderSelectJenjang();
  }

  // ══════════════════════════════════════════════════════════
  //  PHASE 1: SELECT JENJANG
  // ══════════════════════════════════════════════════════════
  function renderSelectJenjang() {
    state.phase = 'select';
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
          <button class="tka-jenjang-btn" id="tka-btn-SD" onclick="window.TKA.previewJenjang('SD')">
            <span class="tka-j-icon">🎒</span>
            <span class="tka-j-name">SD / MI</span>
            <span class="tka-j-info">30 soal Matematika<br/>30 soal Bahasa Indonesia</span>
            <span class="tka-j-time">⏱ 60 menit</span>
          </button>
          <button class="tka-jenjang-btn" id="tka-btn-SMP" onclick="window.TKA.previewJenjang('SMP')">
            <span class="tka-j-icon">📚</span>
            <span class="tka-j-name">SMP / MTs</span>
            <span class="tka-j-info">30 soal Matematika<br/>30 soal Bahasa Indonesia</span>
            <span class="tka-j-time">⏱ 60 menit</span>
          </button>
          <button class="tka-jenjang-btn" id="tka-btn-SMA" onclick="window.TKA.previewJenjang('SMA')">
            <span class="tka-j-icon">🎓</span>
            <span class="tka-j-name">SMA / MA / SMK</span>
            <span class="tka-j-info">50 soal Matematika<br/>50 soal Bahasa Indonesia<br/>50 soal Bahasa Inggris</span>
            <span class="tka-j-time">⏱ 90 menit</span>
          </button>
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

  // Highlight pilihan + tampilkan tombol Mulai, belum start timer
  function previewJenjang(jenjang) {
    ['SD','SMP','SMA'].forEach(j => {
      const btn = document.getElementById('tka-btn-' + j);
      if (btn) btn.classList.toggle('selected', j === jenjang);
    });

    const cfg = CONFIG[jenjang];
    const mapelList = cfg.mapel.map(mp => cfg.jumlah + ' soal ' + MAPEL_LABEL[mp]).join(' · ');
    document.getElementById('tka-confirm-info').innerHTML =
      `<span class="tka-confirm-jenjang">${cfg.label}</span>` +
      `<span class="tka-confirm-detail">${mapelList} · ⏱ ${cfg.durasi} menit</span>`;
    document.getElementById('tka-confirm-panel').style.display = 'flex';
    state.jenjang = jenjang;
  }

  // Leaderboard dari halaman pilih jenjang (tanpa state.jenjang dari hasil tes)
  async function showLeaderboardPublic() {
    const jenjang = state.jenjang || 'SMA';
    await showLeaderboard(jenjang);
  }

  // ══════════════════════════════════════════════════════════
  //  PHASE 2: QUIZ
  // ══════════════════════════════════════════════════════════
  function startJenjang() {
    const jenjang = state.jenjang;
    if (!jenjang) return;
    // Credit check
    const credits = window._currentCredits ?? 0;
    const isInvited = window._isInvited ?? false;
    if (!isInvited && credits <= 0) {
      window.renderCreditsBanner?.();
      window.startCheckout?.();
      return;
    }

    state.jenjang = jenjang;
    state.allQuestions = buildQuestions(jenjang);
    state.answers = new Array(state.allQuestions.length).fill(null);
    state.currentIdx = 0;
    state.phase = 'quiz';
    state.startTime = Date.now();
    state.secondsLeft = CONFIG[jenjang].durasi * 60;

    renderQuizShell();
    renderQuestion(0);
    startTimer();
  }

  function renderQuizShell() {
    const cfg = CONFIG[state.jenjang];
    const total = state.allQuestions.length;
    const container = document.getElementById('tka-container');

    // Build mapel tabs
    let mapelTabsHtml = '';
    cfg.mapel.forEach((mp, i) => {
      const start = i * cfg.jumlah;
      mapelTabsHtml += `<button class="tka-mapel-tab" id="tka-mtab-${mp}" onclick="window.TKA.jumpToMapel('${mp}')">${MAPEL_LABEL[mp]}</button>`;
    });

    container.innerHTML = `
      <div class="tka-quiz-shell">
        <div class="tka-quiz-header">
          <div class="tka-quiz-title">
            <span class="tka-quiz-jenjang-badge">${cfg.label}</span>
            <span class="tka-quiz-progress" id="tka-progress">Soal 1 / ${total}</span>
          </div>
          <div class="tka-timer" id="tka-timer">60:00</div>
        </div>

        <div class="tka-mapel-tabs" id="tka-mapel-tabs">${mapelTabsHtml}</div>

        <!-- Question area -->
        <div class="tka-question-card" id="tka-question-card"></div>

        <!-- Navigation -->
        <div class="tka-nav-row">
          <button class="tka-nav-btn" id="tka-btn-prev" onclick="window.TKA.navigate(-1)">← Sebelumnya</button>
          <div class="tka-nav-dots" id="tka-nav-dots"></div>
          <button class="tka-nav-btn tka-nav-next" id="tka-btn-next" onclick="window.TKA.navigate(1)">Berikutnya →</button>
        </div>

        <!-- Submit -->
        <div class="tka-submit-wrap">
          <button class="tka-btn-submit" id="tka-btn-submit" onclick="window.TKA.confirmSubmit()">
            Kumpulkan Jawaban 🏁
          </button>
          <p class="tka-submit-hint" id="tka-submit-hint"></p>
        </div>
      </div>`;

    renderNavDots();
    updateMapelTabs();
  }

  function renderQuestion(idx) {
    state.currentIdx = idx;
    const q = state.allQuestions[idx];
    const cfg = CONFIG[state.jenjang];
    const total = state.allQuestions.length;

    document.getElementById('tka-progress').textContent = `Soal ${idx + 1} / ${total}`;

    const card = document.getElementById('tka-question-card');
    const mapelIdx = cfg.mapel.indexOf(q.mapel);
    const qNumInMapel = idx - (mapelIdx * cfg.jumlah) + 1;

    // ── Image block (rendered only if question has imgSrc) ───────
    const imgHtml = q.imgSrc
      ? `<div class="tka-q-img-wrap">
           <img
             src="${escHtml(window.TKA_IMG_BASE || '/assets/soal/')  + escHtml(q.imgSrc)}"
             alt="Gambar soal ${qNumInMapel}"
             class="tka-q-img"
             loading="lazy"
             onerror="this.closest('.tka-q-img-wrap').classList.add('tka-img-error');this.style.display='none';this.nextElementSibling.style.display='flex'"
           />
           <div class="tka-img-fallback" style="display:none">
             <span>🖼️</span><span>Gambar tidak tersedia</span>
           </div>
         </div>`
      : '';

    card.innerHTML = `
      <div class="tka-q-meta">
        <span class="tka-q-mapel-badge" style="background:${mapelColor(q.mapel)}">${MAPEL_LABEL[q.mapel]}</span>
        <span class="tka-q-num">No. ${qNumInMapel}</span>
      </div>
      <p class="tka-q-text">${escHtml(q.q)}</p>
      ${imgHtml}
      <div class="tka-options" id="tka-options">
        ${q.opts.map((opt, oi) => {
          const letter = ['A','B','C','D'][oi];
          const selected = state.answers[idx] === letter;
          return `<button class="tka-opt${selected ? ' selected' : ''}" onclick="window.TKA.selectAnswer(${idx},'${letter}')">
            <span class="tka-opt-letter">${letter}</span>
            <span class="tka-opt-text">${escHtml(opt.replace(/^[A-D]\.\s*/,''))}</span>
          </button>`;
        }).join('')}
      </div>`;

    // Update nav buttons
    document.getElementById('tka-btn-prev').disabled = idx === 0;
    document.getElementById('tka-btn-next').disabled = idx === total - 1;
    renderNavDots();
    updateMapelTabs();
  }

  function mapelColor(mp) {
    const colors = { matematika: '#1a7a6e', bahasa_indonesia: '#e8a020', bahasa_inggris: '#e05c3a' };
    return colors[mp] || '#888';
  }

  function renderNavDots() {
    const dotsEl = document.getElementById('tka-nav-dots');
    if (!dotsEl) return;
    const cfg = CONFIG[state.jenjang];
    const total = state.allQuestions.length;

    // Show only the current mapel's dots (max cfg.jumlah dots at a time)
    const mapelIdx = Math.floor(state.currentIdx / cfg.jumlah);
    const start = mapelIdx * cfg.jumlah;
    const end = Math.min(start + cfg.jumlah, total);

    let html = '';
    for (let i = start; i < end; i++) {
      const answered = state.answers[i] !== null;
      const current = i === state.currentIdx;
      html += `<button class="tka-dot${current ? ' current' : ''}${answered ? ' answered' : ''}"
        onclick="window.TKA.jumpTo(${i})" title="Soal ${i-start+1}"></button>`;
    }
    dotsEl.innerHTML = html;
  }

  function updateMapelTabs() {
    const cfg = CONFIG[state.jenjang];
    cfg.mapel.forEach((mp, i) => {
      const tab = document.getElementById('tka-mtab-' + mp);
      if (!tab) return;
      const start = i * cfg.jumlah;
      const isActive = state.currentIdx >= start && state.currentIdx < start + cfg.jumlah;
      tab.classList.toggle('active', isActive);
    });
  }

  function selectAnswer(idx, letter) {
    state.answers[idx] = letter;
    // Re-render options only
    const q = state.allQuestions[idx];
    const optsEl = document.getElementById('tka-options');
    if (!optsEl) return;
    optsEl.querySelectorAll('.tka-opt').forEach((btn, oi) => {
      const l = ['A','B','C','D'][oi];
      btn.classList.toggle('selected', l === letter);
    });
    renderNavDots();

    // Auto advance after short delay
    setTimeout(() => {
      if (state.currentIdx < state.allQuestions.length - 1) {
        navigate(1);
      }
    }, 350);
  }

  function navigate(dir) {
    const next = state.currentIdx + dir;
    if (next >= 0 && next < state.allQuestions.length) {
      renderQuestion(next);
    }
  }

  function jumpTo(idx) {
    renderQuestion(idx);
  }

  function jumpToMapel(mp) {
    const cfg = CONFIG[state.jenjang];
    const mapelIdx = cfg.mapel.indexOf(mp);
    if (mapelIdx >= 0) renderQuestion(mapelIdx * cfg.jumlah);
  }

  // ── Timer ────────────────────────────────────────────────────
  function startTimer() {
    clearInterval(state.timerInterval);
    state.timerInterval = setInterval(() => {
      state.secondsLeft--;
      updateTimerDisplay();
      if (state.secondsLeft <= 0) {
        clearInterval(state.timerInterval);
        autoSubmit();
      }
    }, 1000);
  }

  function updateTimerDisplay() {
    const el = document.getElementById('tka-timer');
    if (!el) return;
    const m = Math.floor(state.secondsLeft / 60);
    const s = state.secondsLeft % 60;
    el.textContent = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    if (state.secondsLeft <= 300) el.classList.add('urgent');
    else el.classList.remove('urgent');
  }

  function autoSubmit() {
    submitQuiz(true);
  }

  // ── Submit flow ──────────────────────────────────────────────
  function confirmSubmit() {
    const answered = state.answers.filter(a => a !== null).length;
    const total = state.allQuestions.length;
    const unanswered = total - answered;
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
    state.phase = 'result';

    const elapsed = Math.round((Date.now() - state.startTime) / 1000);
    const cfg = CONFIG[state.jenjang];

    // Calculate score per mapel
    const scores = {};
    cfg.mapel.forEach(mp => { scores[mp] = { correct: 0, total: cfg.jumlah }; });

    state.allQuestions.forEach((q, i) => {
      if (state.answers[i] === q.ans) scores[q.mapel].correct++;
    });

    const totalCorrect = Object.values(scores).reduce((s, v) => s + v.correct, 0);
    const totalQs = state.allQuestions.length;
    const pct = Math.round((totalCorrect / totalQs) * 100);

    // Save to Firestore via API
    let rank = null;
    try {
      const idToken = await window.getIdToken();
      const user = window.quizgenUser;
      const scorePayload = {
        jenjang: state.jenjang,
        jenjangLabel: cfg.label,
        totalCorrect,
        totalQuestions: totalQs,
        pct,
        scores,
        elapsedSeconds: elapsed,
        displayName: user?.displayName || user?.email || 'Anonim',
        email: user?.email || '',
        createdAt: new Date().toISOString()
      };

      const res = await fetch('/api/tka-submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-id-token': idToken || '' },
        body: JSON.stringify(scorePayload)
      });
      const data = await res.json();
      if (data._credits !== undefined) {
        window._currentCredits = data._credits;
        window.renderCreditsBanner?.();
      }
      rank = data.rank;
    } catch(e) {
      console.warn('Could not save TKA score:', e.message);
    }

    renderResult(scores, totalCorrect, totalQs, pct, elapsed, rank, isAutoSubmit);
  }

  // ══════════════════════════════════════════════════════════
  //  PHASE 3: RESULT
  // ══════════════════════════════════════════════════════════
  function renderResult(scores, totalCorrect, totalQs, pct, elapsed, rank, isAutoSubmit) {
    const cfg = CONFIG[state.jenjang];
    const emoji = pct >= 85 ? '🏆' : pct >= 70 ? '🥈' : pct >= 55 ? '🥉' : '📚';
    const msg   = pct >= 85 ? 'Luar Biasa!' : pct >= 70 ? 'Bagus Sekali!' : pct >= 55 ? 'Cukup Baik' : 'Tetap Semangat!';
    const grade = pct >= 85 ? 'A' : pct >= 70 ? 'B' : pct >= 55 ? 'C' : pct >= 40 ? 'D' : 'E';
    const minsElapsed = Math.floor(elapsed / 60);
    const secsElapsed = elapsed % 60;

    let mapelBreakdown = '';
    cfg.mapel.forEach(mp => {
      const s = scores[mp];
      const mpPct = Math.round((s.correct / s.total) * 100);
      const barW = mpPct;
      mapelBreakdown += `
        <div class="tka-breakdown-item">
          <div class="tka-breakdown-label">${MAPEL_LABEL[mp]}</div>
          <div class="tka-breakdown-bar-wrap">
            <div class="tka-breakdown-bar" style="width:${barW}%;background:${mapelColor(mp)}"></div>
          </div>
          <div class="tka-breakdown-score">${s.correct}/${s.total} <span class="tka-breakdown-pct">(${mpPct}%)</span></div>
        </div>`;
    });

    const rankHtml = rank
      ? `<div class="tka-rank-box">🏅 Peringkatmu: <strong>#${rank}</strong> dari seluruh peserta ${cfg.label}</div>`
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
          <div class="tka-score-time">⏱ Waktu: ${minsElapsed}m ${secsElapsed}s</div>
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
    const jenjang = jenjangOverride || state.jenjang;
    const container = document.getElementById('tka-container');
    container.innerHTML = `<div class="tka-loading-wrap"><div class="spinner"></div><p>Memuat papan peringkat…</p></div>`;

    try {
      const idToken = await window.getIdToken();
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
    const cfg = CONFIG[jenjangOverride || state.jenjang];
    const myEmail = window.quizgenUser?.email || '';

    const rows = entries.slice(0, 50).map((e, i) => {
      const rankNum = i + 1;
      const medal = rankNum === 1 ? '🥇' : rankNum === 2 ? '🥈' : rankNum === 3 ? '🥉' : `#${rankNum}`;
      const isMe = e.email === myEmail;
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
          <p class="tka-lb-sub">${cfg.label} · Top 50 Peserta</p>
        </div>
        <div class="tka-lb-table-wrap">
          <table class="tka-lb-table">
            <thead><tr>
              <th>Rank</th><th>Nama</th><th>Nilai</th><th>Skor</th>
            </tr></thead>
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
    const cfg = CONFIG[state.jenjang];
    const container = document.getElementById('tka-container');

    let html = '<div class="tka-review-wrap">';
    html += `<h2 class="tka-review-title">📖 Pembahasan Lengkap</h2>`;

    cfg.mapel.forEach((mp, mi) => {
      html += `<div class="tka-review-section">
        <div class="tka-review-mapel-header" style="background:${mapelColor(mp)}">${MAPEL_LABEL[mp]}</div>`;
      const start = mi * cfg.jumlah;
      for (let i = start; i < start + cfg.jumlah; i++) {
        const q = state.allQuestions[i];
        const userAns = state.answers[i];
        const correct = userAns === q.ans;
        html += `
          <div class="tka-review-item${correct ? ' review-correct' : ' review-wrong'}">
            <div class="tka-review-item-header">
              <span class="tka-review-status">${correct ? '✅' : '❌'}</span>
              <span class="tka-review-qnum">Soal ${i - start + 1}</span>
            </div>
            <p class="tka-review-q">${escHtml(q.q)}</p>
            ${q.imgSrc ? `<div class="tka-q-img-wrap tka-review-img"><img src="${escHtml(window.TKA_IMG_BASE || '/assets/soal/') + escHtml(q.imgSrc)}" alt="Gambar soal" class="tka-q-img" loading="lazy" onerror="this.style.display='none'"/></div>` : ''}
            <div class="tka-review-opts">
              ${q.opts.map((opt, oi) => {
                const l = ['A','B','C','D'][oi];
                let cls = 'tka-review-opt';
                if (l === q.ans) cls += ' review-opt-correct';
                else if (l === userAns) cls += ' review-opt-wrong';
                return `<div class="${cls}">${escHtml(opt)}</div>`;
              }).join('')}
            </div>
            ${!correct ? `<div class="tka-review-user-ans">Jawabanmu: <strong>${userAns || 'Tidak dijawab'}</strong></div>` : ''}
            <div class="tka-review-expl">💡 ${escHtml(q.expl)}</div>
          </div>`;
      }
      html += '</div>';
    });

    html += `<div class="tka-result-actions" style="margin-top:32px">
      <button class="btn-new" onclick="window.TKA.init()">↺ Ikut Tes Lagi</button>
    </div></div>`;

    container.innerHTML = html;
  }

  // ── Util ─────────────────────────────────────────────────────
  function escHtml(str) {
    return String(str)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  // ── Public API ───────────────────────────────────────────────
  return {
    init,
    selectJenjang: startJenjang,
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
  };
})();
