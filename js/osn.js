/* ============================================================
   SIMULASI OSN — Logic
   Olimpiade Sains Nasional
   SD / SMP / SMA × Kabupaten / Provinsi / Semifinal / Final
   ============================================================ */

window.OSN = (function() {

  const LEVEL_CONFIG = {
    kabupaten: { label: 'Kabupaten',  icon: '🏘️', warna: '#1a7a6e', jumlah: 40, waktu: 90  },
    provinsi:  { label: 'Provinsi',   icon: '🏛️', warna: '#1a5a9a', jumlah: 40, waktu: 90  },
    semifinal: { label: 'Semifinal',  icon: '🥈', warna: '#c47a1a', jumlah: 40, waktu: 120 },
    final:     { label: 'Final',      icon: '🏆', warna: '#c41a5a', jumlah: 40, waktu: 120 },
  };

  const JENJANG_CONFIG = [
    { key: 'sd',  label: 'SD',  icon: '🎒', mapel: ['ipa'] },
    { key: 'smp', label: 'SMP', icon: '📚', mapel: ['ipa'] },
    { key: 'sma', label: 'SMA', icon: '🎓', mapel: ['biologi','fisika','kimia','mat','informatika'] },
  ];

  let state = {
    phase: 'select_jenjang',
    jenjang: null, mapelKey: null, levelKey: null, paketKey: null,
    allQuestions: [], answers: [],
    currentIdx: 0, timerInterval: null, secondsLeft: 0, startTime: null,
  };

  // ══ LAZY LOADER ══════════════════════════════════════════════
  // osn-index.json           → metadata ringan — di-load saat init
  // osn-{bank}--{lv}.json   → soal flat level  — di-load saat mau quiz
  // osn-{bank}--{lv}--{pk}.json → soal per paket — di-load saat mau quiz
  const _cache = {};

  async function _fetchIndex() {
    if (_cache['__index__']) return _cache['__index__'];
    const res = await fetch('/data/osn/index.json');
    if (!res.ok) throw new Error('Gagal memuat index OSN');
    _cache['__index__'] = await res.json();
    return _cache['__index__'];
  }

  async function _fetchFile(filename) {
    if (_cache[filename]) return _cache[filename];
    const res = await fetch(`/data/osn/${filename}`);
    if (!res.ok) throw new Error(`Gagal memuat ${filename}`);
    _cache[filename] = await res.json();
    return _cache[filename];
  }

  function _getBankMeta(bankKey) {
    return (_cache['__index__'] || []).find(b => b.key === bankKey) || null;
  }

  function getBankKey() { return `${state.jenjang}_${state.mapelKey}`; }
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
    return String(str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function fmtLoader(msg) {
    return `<div style="text-align:center;padding:60px;opacity:.6">${msg}</div>`;
  }

  // ── init ─────────────────────────────────────────────────────
  async function init() {
    state.phase = 'select_jenjang';
    const container = document.getElementById('osn-container');
    container.innerHTML = fmtLoader('⏳ Memuat...');
    try {
      await _fetchIndex();
      renderSelectJenjang();
    } catch(e) {
      container.innerHTML = `<div style="text-align:center;padding:40px;color:red">❌ Gagal memuat data OSN. Coba refresh.</div>`;
    }
  }

  // ══ PHASE 1: PILIH JENJANG ════════════════════════════════════
  function renderSelectJenjang() {
    const container = document.getElementById('osn-container');
    const cards = JENJANG_CONFIG.map(j => `
      <button class="osn-jenjang-btn" onclick="window.OSN.selectJenjang('${j.key}')">
        <span class="osn-jenjang-icon">${j.icon}</span>
        <span class="osn-jenjang-label">${j.label}</span>
      </button>`).join('');

    container.innerHTML = `
      <div class="osn-select-wrap">
        <div class="osn-hero">
          <div class="osn-hero-badge">🏅 Olimpiade Sains Nasional</div>
          <h2 class="osn-hero-title">Simulasi Try Out<br/>OSN</h2>
          <p class="osn-hero-sub">Latihan soal OSN dari level Kabupaten hingga Final<br/>SD · SMP · SMA</p>
        </div>
        <div class="osn-steps-row">
          <div class="osn-step osn-step-active">1. Jenjang</div>
          <div class="osn-step-arrow">›</div>
          <div class="osn-step">2. Mata Pelajaran</div>
          <div class="osn-step-arrow">›</div>
          <div class="osn-step">3. Level</div>
        </div>
        <p class="cpns-choose-label">Pilih Jenjang</p>
        <div class="osn-jenjang-grid">${cards}</div>
      </div>`;
  }

  function selectJenjang(jenjangKey) {
    state.jenjang = jenjangKey;
    renderSelectMapel(JENJANG_CONFIG.find(j => j.key === jenjangKey));
  }

  // ══ PHASE 2: PILIH MATA PELAJARAN ════════════════════════════════
  function renderSelectMapel(jConf) {
    state.phase = 'select_mapel';
    const container = document.getElementById('osn-container');
    const index     = _cache['__index__'] || [];

    const mapelMeta = {
      ipa:         { label: 'IPA',         icon: '🔬', desc: 'Ilmu Pengetahuan Alam' },
      biologi:     { label: 'Biologi',     icon: '🧬', desc: 'Biologi' },
      fisika:      { label: 'Fisika',      icon: '⚛️', desc: 'Fisika' },
      kimia:       { label: 'Kimia',       icon: '⚗️', desc: 'Kimia' },
      mat:         { label: 'Matematika',  icon: '📐', desc: 'Matematika' },
      informatika: { label: 'Informatika', icon: '💻', desc: 'Informatika' },
    };

    const cards = jConf.mapel.map(mk => {
      const bankMeta = index.find(b => b.key === `${jConf.key}_${mk}`);
      // Cek ada soal di level kabupaten (apapun tipenya)
      const hasKab = (bankMeta?.levels?.kabupaten?.count || 0) > 0;
      const mm     = mapelMeta[mk] || { label: mk, icon: '📖', desc: mk };
      return `
        <button class="osn-mapel-btn${hasKab ? '' : ' osn-soon'}"
          onclick="${hasKab ? `window.OSN.selectMapel('${mk}')` : 'void(0)'}">
          <span class="osn-mapel-icon">${mm.icon}</span>
          <div class="osn-mapel-body">
            <div class="osn-mapel-label">${mm.label}</div>
            <div class="osn-mapel-desc">${mm.desc}</div>
            ${!hasKab ? '<div class="osn-soon-badge">Segera Hadir</div>' : ''}
          </div>
        </button>`;
    }).join('');

    container.innerHTML = `
      <div class="osn-select-wrap">
        <button class="tryout-back-btn" onclick="window.OSN.init()">← Ganti Jenjang</button>
        <div class="osn-steps-row">
          <div class="osn-step osn-step-done" onclick="window.OSN.init()">1. Jenjang <span class="osn-step-val">${jConf.icon} ${jConf.label}</span></div>
          <div class="osn-step-arrow">›</div>
          <div class="osn-step osn-step-active">2. Mata Pelajaran</div>
          <div class="osn-step-arrow">›</div>
          <div class="osn-step">3. Level</div>
        </div>
        <p class="cpns-choose-label">Pilih Mata Pelajaran</p>
        <div class="osn-mapel-grid">${cards}</div>
      </div>`;
  }

  function selectMapel(mapelKey) {
    state.mapelKey = mapelKey;
    state.paketKey = null;
    renderSelectLevel();
  }

  // ══ PHASE 3: PILIH LEVEL ═════════════════════════════════════════
  function renderSelectLevel() {
    state.phase = 'select_level';
    const container = document.getElementById('osn-container');
    const bankMeta  = _getBankMeta(getBankKey());

    const levelCards = Object.keys(LEVEL_CONFIG).map(lk => {
      const lc      = LEVEL_CONFIG[lk];
      const lvMeta  = bankMeta?.levels?.[lk];
      const count   = lvMeta?.count || 0;
      const hasData = count > 0;
      const isPaket = lvMeta?.type === 'paket';

      // Label tambahan: jika multi-paket, tampilkan jumlah paket
      const paketInfo = isPaket ? ` · ${lvMeta.pakets.length} paket` : '';

      return `
        <button class="osn-level-btn${hasData ? '' : ' osn-soon'}"
          style="--lv-color:${lc.warna}"
          onclick="${hasData ? `window.OSN.selectLevel('${lk}')` : 'void(0)'}">
          <span class="osn-level-icon">${lc.icon}</span>
          <div class="osn-level-body">
            <div class="osn-level-label">${lc.label}</div>
            <div class="osn-level-meta">${hasData ? `${count} soal tersedia · ${lc.waktu} menit${paketInfo}` : 'Segera hadir'}</div>
          </div>
          ${!hasData ? '<span class="osn-soon-badge">🔒</span>' : `<span class="osn-level-arrow" style="color:${lc.warna}">→</span>`}
        </button>`;
    }).join('');

    container.innerHTML = `
      <div class="osn-select-wrap">
        <button class="tryout-back-btn" onclick="window.OSN.selectJenjang('${state.jenjang}')">← Ganti Mapel</button>
        <div class="osn-steps-row">
          <div class="osn-step osn-step-done" onclick="window.OSN.init()">1. ${bankMeta?.jenjang || state.jenjang.toUpperCase()}</div>
          <div class="osn-step-arrow">›</div>
          <div class="osn-step osn-step-done" onclick="window.OSN.selectJenjang('${state.jenjang}')">2. ${bankMeta?.mapel || state.mapelKey}</div>
          <div class="osn-step-arrow">›</div>
          <div class="osn-step osn-step-active">3. Level</div>
        </div>
        <p class="cpns-choose-label">Pilih Level OSN</p>
        <div class="osn-level-grid">${levelCards}</div>
      </div>`;
  }

  function selectLevel(levelKey) {
    state.levelKey = levelKey;
    state.paketKey = null;
    const bankMeta = _getBankMeta(getBankKey());
    const lvMeta   = bankMeta?.levels?.[levelKey];

    // Jika level multi-paket → tampilkan pilih paket dulu
    if (lvMeta?.type === 'paket') {
      renderSelectPaket();
    } else {
      renderConfirm();
    }
  }

  // ══ PHASE 3b: PILIH PAKET (hanya untuk level multi-paket) ════════
  function renderSelectPaket() {
    state.phase = 'select_paket';
    const container = document.getElementById('osn-container');
    const bankMeta  = _getBankMeta(getBankKey());
    const lvMeta    = bankMeta?.levels?.[state.levelKey];
    const lc        = LEVEL_CONFIG[state.levelKey];

    const paketCards = lvMeta.pakets.map(p => `
      <button class="osn-level-btn" style="--lv-color:${lc.warna}"
        onclick="window.OSN.selectPaket('${p.key}')">
        <span class="osn-level-icon">${lc.icon}</span>
        <div class="osn-level-body">
          <div class="osn-level-label">${p.label}</div>
          <div class="osn-level-meta">${p.count} soal · ${lc.waktu} menit</div>
        </div>
        <span class="osn-level-arrow" style="color:${lc.warna}">→</span>
      </button>`).join('');

    container.innerHTML = `
      <div class="osn-select-wrap">
        <button class="tryout-back-btn" onclick="window.OSN.renderSelectLevel()">← Ganti Level</button>
        <div class="osn-steps-row">
          <div class="osn-step osn-step-done" onclick="window.OSN.init()">1. ${bankMeta?.jenjang || ''}</div>
          <div class="osn-step-arrow">›</div>
          <div class="osn-step osn-step-done" onclick="window.OSN.selectJenjang('${state.jenjang}')">2. ${bankMeta?.mapel || ''}</div>
          <div class="osn-step-arrow">›</div>
          <div class="osn-step osn-step-done" onclick="window.OSN.renderSelectLevel()">3. ${lc.icon} ${lc.label}</div>
          <div class="osn-step-arrow">›</div>
          <div class="osn-step osn-step-active">4. Paket</div>
        </div>
        <p class="cpns-choose-label">Pilih Paket Soal</p>
        <div class="osn-level-grid">${paketCards}</div>
      </div>`;
  }

  function selectPaket(paketKey) {
    state.paketKey = paketKey;
    renderConfirm();
  }

  // ══ PHASE 4: KONFIRMASI ═══════════════════════════════════════════
  function renderConfirm() {
    state.phase = 'confirm';
    const container = document.getElementById('osn-container');
    const bankMeta  = _getBankMeta(getBankKey());
    const lvMeta    = bankMeta?.levels?.[state.levelKey];
    const lc        = LEVEL_CONFIG[state.levelKey];
    const isPaket   = lvMeta?.type === 'paket';

    // Info soal tergantung tipe level
    let count, confirmLabel, sumber, backFn;
    if (isPaket) {
      const pd      = lvMeta.pakets.find(p => p.key === state.paketKey);
      count         = pd?.count || 0;
      confirmLabel  = `${bankMeta?.label} · ${lc.icon} ${lc.label} · ${pd?.label || state.paketKey}`;
      sumber        = 'Kumpulan Soal OSN — Kemendikdasmen';
      backFn        = `window.OSN.renderSelectPaket()`;
    } else {
      count         = lvMeta?.count || 0;
      confirmLabel  = `${bankMeta?.label} · ${lc.icon} ${lc.label}`;
      sumber        = 'Kumpulan Soal OSN — Kemendikdasmen';
      backFn        = `window.OSN.selectMapel('${state.mapelKey}')`;
    }

    container.innerHTML = `
      <div class="osn-select-wrap">
        <button class="tryout-back-btn" onclick="${backFn}">← Ganti ${isPaket ? 'Paket' : 'Level'}</button>
        <div class="osn-confirm-card" style="border-color:${lc.warna}">
          <div class="osn-confirm-header" style="background:${lc.warna}">
            <span class="osn-confirm-icon">${bankMeta?.icon || '📖'}</span>
            <div>
              <div class="osn-confirm-title">${confirmLabel}</div>
              <div class="osn-confirm-sub">${sumber}</div>
            </div>
          </div>
          <div class="osn-confirm-stats">
            <div class="osn-cs"><span class="osn-cs-num">${count}</span><span class="osn-cs-label">Soal</span></div>
            <div class="osn-cs"><span class="osn-cs-num">${lc.waktu}</span><span class="osn-cs-label">Menit</span></div>
            <div class="osn-cs"><span class="osn-cs-num">4</span><span class="osn-cs-label">Pilihan</span></div>
            <div class="osn-cs"><span class="osn-cs-num">1</span><span class="osn-cs-label">Kredit</span></div>
          </div>
          <div class="osn-confirm-rules">
            <p>📋 Pilihan ganda — pilih satu jawaban terbaik.</p>
            <p>⏱ Waktu berjalan otomatis saat soal pertama tampil.</p>
            <p>✅ Jawab semua soal sebelum waktu habis.</p>
          </div>
          <button class="osn-btn-start" style="background:${lc.warna}" onclick="window.OSN.startQuiz()">
            Mulai Simulasi ${lc.icon} ▶
          </button>
        </div>
        <p class="tka-credit-note">${window._isPremium?.() ? '✅ Gratis untuk subscriber' : window._currentCredits > 0 ? '⚡ Menggunakan 1 kredit' : '🔓 Berlangganan untuk akses semua paket'}</p>
      </div>`;
  }

  // ══ PHASE 5: QUIZ ════════════════════════════════════════════════
  // BARU di sini soal di-fetch (lazy) — pilih file yang tepat
  async function startQuiz() {
    const credits   = window._currentCredits ?? 0;
    const isInvited = window._isInvited ?? false;
    if (!isInvited && credits <= 0) { window.renderCreditsBanner?.(); window.startCheckout?.(); return; }

    const container = document.getElementById('osn-container');
    const lc        = LEVEL_CONFIG[state.levelKey];
    const bankMeta  = _getBankMeta(getBankKey());
    const lvMeta    = bankMeta?.levels?.[state.levelKey];
    container.innerHTML = fmtLoader('⏳ Memuat soal...');

    let soalData;
    try {
      if (lvMeta?.type === 'paket') {
        // Multi-paket: fetch file paket yang dipilih
        const pd = lvMeta.pakets.find(p => p.key === state.paketKey);
        if (!pd) throw new Error('Paket tidak ditemukan');
        soalData = await _fetchFile(pd.file);
      } else {
        // Flat: fetch file level langsung
        soalData = await _fetchFile(lvMeta.file);
      }
    } catch(e) {
      container.innerHTML = `<div style="text-align:center;padding:40px;color:red">❌ Gagal memuat soal. Coba lagi.</div>`;
      return;
    }

    const soal = soalData?.soal || [];
    if (!soal.length) {
      container.innerHTML = fmtLoader('⚠️ Soal belum tersedia untuk level ini.');
      return;
    }

    const jumlah = lvMeta?.count || lc.jumlah;
    state.allQuestions = shuffle(soal).slice(0, jumlah);
    state.answers      = new Array(state.allQuestions.length).fill(null);
    state.currentIdx   = 0;
    state.phase        = 'quiz';
    state.startTime    = Date.now();
    state.secondsLeft  = lc.waktu * 60;

    renderQuizShell();
    renderQuestion(0);
    startTimer();
  }

  function renderQuizShell() {
    const total     = state.allQuestions.length;
    const bankMeta  = _getBankMeta(getBankKey());
    const lc        = LEVEL_CONFIG[state.levelKey];
    const container = document.getElementById('osn-container');

    // Label header quiz: sertakan nama paket jika ada
    const lvMeta    = bankMeta?.levels?.[state.levelKey];
    const paketLabel = (lvMeta?.type === 'paket' && state.paketKey)
      ? ' · ' + (lvMeta.pakets.find(p => p.key === state.paketKey)?.label || state.paketKey)
      : '';

    container.innerHTML = `
      <div class="cpns-quiz-shell">
        <div class="cpns-quiz-header">
          <div class="cpns-quiz-title">
            <span class="cpns-quiz-badge" style="background:${lc.warna}">${bankMeta?.icon || '📖'} OSN ${bankMeta?.jenjang || ''} · ${lc.label}${paketLabel}</span>
            <span class="cpns-quiz-progress" id="osn-progress">Soal 1 / ${total}</span>
          </div>
          <div class="tka-timer" id="osn-timer">${String(Math.floor(lc.waktu)).padStart(2,'0')}:00</div>
        </div>
        <div class="tka-question-card" id="osn-question-card"></div>
        <div class="tka-nav-row">
          <button class="tka-nav-btn" id="osn-btn-prev" onclick="window.OSN.navigate(-1)">← Sebelumnya</button>
          <div class="tka-nav-dots" id="osn-nav-dots"></div>
          <button class="tka-nav-btn tka-nav-next" id="osn-btn-next" onclick="window.OSN.navigate(1)">Berikutnya →</button>
        </div>
        <div class="tka-submit-wrap">
          <button class="tka-btn-submit" id="osn-btn-submit" style="background:${lc.warna}" onclick="window.OSN.confirmSubmit()">
            Kumpulkan Jawaban 🏁
          </button>
          <p class="tka-submit-hint" id="osn-submit-hint"></p>
        </div>
      </div>`;

    renderNavDots();
  }

  function renderQuestion(idx) {
    state.currentIdx = idx;
    const q        = state.allQuestions[idx];
    const total    = state.allQuestions.length;
    const lc       = LEVEL_CONFIG[state.levelKey];
    const bankMeta = _getBankMeta(getBankKey());

    document.getElementById('osn-progress').textContent = `Soal ${idx + 1} / ${total}`;

    document.getElementById('osn-question-card').innerHTML = `
      <div class="tka-q-meta">
        <span class="tka-q-mapel-badge" style="background:${lc.warna}">${bankMeta?.icon || '📖'} ${bankMeta?.mapel || ''} · ${lc.label}</span>
        <span class="tka-q-num">No. ${idx + 1}</span>
      </div>
      <p class="tka-q-text">${escHtml(q.q)}</p>
      <div class="tka-options" id="osn-options">
        ${(q.opts || []).map((opt, oi) => {
          const letter   = ['A','B','C','D','E'][oi];
          const selected = state.answers[idx] === letter;
          return `<button class="tka-opt${selected ? ' selected' : ''}" onclick="window.OSN.selectAnswer(${idx},'${letter}')">
            <span class="tka-opt-letter">${letter}</span>
            <span class="tka-opt-text">${escHtml(opt.replace(/^[A-E]\.\s*/,''))}</span>
          </button>`;
        }).join('')}
      </div>`;

    document.getElementById('osn-btn-prev').disabled = idx === 0;
    document.getElementById('osn-btn-next').disabled = idx === total - 1;
    renderNavDots();
  }

  function renderNavDots() {
    const dotsEl = document.getElementById('osn-nav-dots');
    if (!dotsEl) return;
    const total = state.allQuestions.length;
    const start = Math.max(0, state.currentIdx - 10);
    const end   = Math.min(total, start + 22);
    let html = '';
    for (let i = start; i < end; i++) {
      html += `<button class="tka-dot${i === state.currentIdx ? ' current' : ''}${state.answers[i] !== null ? ' answered' : ''}"
        onclick="window.OSN.jumpTo(${i})" title="Soal ${i+1}"></button>`;
    }
    dotsEl.innerHTML = html;
  }

  function selectAnswer(idx, letter) {
    state.answers[idx] = letter;
    document.querySelectorAll('#osn-options .tka-opt').forEach((btn, oi) => {
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

  function startTimer() {
    clearInterval(state.timerInterval);
    state.timerInterval = setInterval(() => {
      state.secondsLeft--;
      const el = document.getElementById('osn-timer');
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
    const hint       = document.getElementById('osn-submit-hint');
    if (unanswered > 0) {
      hint.textContent = `⚠️ ${unanswered} soal belum dijawab. Kumpulkan tetap?`;
      hint.style.color = 'var(--amber)';
      const btn        = document.getElementById('osn-btn-submit');
      btn.textContent  = 'Ya, Kumpulkan Tetap 🏁';
      btn.onclick      = () => submitQuiz(false);
      return;
    }
    submitQuiz(false);
  }

  function submitQuiz(isAutoSubmit) {
    clearInterval(state.timerInterval);
    state.phase   = 'result';
    const elapsed = Math.round((Date.now() - state.startTime) / 1000);
    let benar = 0, salah = 0;
    state.allQuestions.forEach((q, i) => {
      const a = state.answers[i];
      if (!a) return;
      if (a === q.ans) benar++; else salah++;
    });
    renderResult(benar, salah, elapsed, isAutoSubmit);
  }

  // ══ PHASE 6: RESULT ══════════════════════════════════════════════
  function renderResult(benar, salah, elapsed, isAutoSubmit) {
    const container = document.getElementById('osn-container');
    const total     = state.allQuestions.length;
    const pct       = Math.round((benar / total) * 100);

    // ── Catat ke Profil ──────────────────────────────────────
    window.PROFIL_recordSession?.('osn', {
      pct, totalBenar: benar, totalSoal: total,
      scores: { bankKey: getBankKey(), level: state.levelKey },
      elapsed,
    });
    const lc        = LEVEL_CONFIG[state.levelKey];
    const bankMeta  = _getBankMeta(getBankKey());
    const minsE     = Math.floor(elapsed / 60), secsE = elapsed % 60;
    const emoji     = pct >= 90 ? '🏆' : pct >= 75 ? '🥇' : pct >= 60 ? '🥈' : pct >= 45 ? '🥉' : '📚';
    const msg       = pct >= 90 ? 'Luar Biasa!' : pct >= 75 ? 'Sangat Bagus!' : pct >= 60 ? 'Bagus!' : pct >= 45 ? 'Cukup' : 'Terus Berlatih!';

    // Tombol ulangi kembali ke pilih paket jika ada
    const lvMeta     = bankMeta?.levels?.[state.levelKey];
    const repeatBtn  = lvMeta?.type === 'paket'
      ? `<button class="tka-btn-retry" onclick="window.OSN.startQuiz()">↺ Ulangi Paket Ini</button>
         <button class="tka-nav-btn" onclick="window.OSN.renderSelectPaket()">🔄 Ganti Paket</button>`
      : `<button class="tka-btn-retry" onclick="window.OSN.startQuiz()">↺ Ulangi Level Ini</button>`;

    container.innerHTML = `
      <div class="tka-result-wrap">
        ${isAutoSubmit ? '<div class="tka-auto-submit-notice">⏱ Waktu habis — jawaban otomatis dikumpulkan</div>' : ''}
        <div class="tka-score-hero">
          <div class="tka-score-emoji">${emoji}</div>
          <div class="tka-score-num">${benar} / ${total}</div>
          <div class="tka-score-pct">${pct}% · ${msg}</div>
          <div class="tka-score-time">⏱ ${minsE}m ${secsE}s</div>
        </div>
        <div class="osn-result-tags">
          <span class="osn-result-tag" style="background:rgba(26,122,110,0.1);color:var(--teal)">✅ Benar: ${benar}</span>
          <span class="osn-result-tag" style="background:rgba(224,92,58,0.1);color:#e05c3a">❌ Salah: ${salah}</span>
          <span class="osn-result-tag" style="background:rgba(26,18,8,0.06);color:var(--ink-muted)">— Kosong: ${total - benar - salah}</span>
        </div>
        <div class="osn-level-progress">
          <p class="tka-breakdown-title">Perjalanan Level OSN</p>
          <div class="osn-lv-track">
            ${Object.keys(LEVEL_CONFIG).map(lk => {
              const lcI    = LEVEL_CONFIG[lk];
              const isDone = lk === state.levelKey;
              return `<div class="osn-lv-node${isDone ? ' osn-lv-current' : ''}" style="--lc:${lcI.warna}">
                <div class="osn-lv-icon">${lcI.icon}</div>
                <div class="osn-lv-name">${lcI.label}</div>
              </div>`;
            }).join('<div class="osn-lv-line"></div>')}
          </div>
        </div>
        <div class="tka-result-actions">
          <button class="btn-new" onclick="window.OSN.showReview()">📖 Lihat Pembahasan</button>
          ${repeatBtn}
          <button class="tka-nav-btn" onclick="window.OSN.renderSelectLevel()">🔼 Coba Level Lain</button>
        </div>
      </div>`;
  }

  // ══ REVIEW ═══════════════════════════════════════════════════════
  function showReview() {
    const container = document.getElementById('osn-container');
    const lc        = LEVEL_CONFIG[state.levelKey];
    const bankMeta  = _getBankMeta(getBankKey());
    const lvMeta    = bankMeta?.levels?.[state.levelKey];
    const paketLabel = (lvMeta?.type === 'paket' && state.paketKey)
      ? ' · ' + (lvMeta.pakets.find(p => p.key === state.paketKey)?.label || '')
      : '';

    let html = `<div class="tka-review-wrap">
      <h2 class="tka-review-title">📖 Pembahasan Soal</h2>
      <div class="tka-review-mapel-header" style="background:${lc.warna}">${bankMeta?.icon || ''} ${bankMeta?.label || ''} · ${lc.icon} ${lc.label}${paketLabel}</div>`;

    state.allQuestions.forEach((q, i) => {
      const userAns = state.answers[i];
      const correct = userAns === q.ans;
      html += `
        <div class="tka-review-item${correct ? ' review-correct' : ' review-wrong'}">
          <div class="tka-review-item-header">
            <span class="tka-review-status">${correct ? '✅' : '❌'}</span>
            <span class="tka-review-qnum">Soal ${i + 1}</span>
          </div>
          <p class="tka-review-q">${escHtml(q.q)}</p>
          <div class="tka-review-opts">
            ${(q.opts || []).map((opt, oi) => {
              const l   = ['A','B','C','D','E'][oi];
              let   cls = 'tka-review-opt';
              if (l === q.ans)        cls += ' review-opt-correct';
              else if (l === userAns) cls += ' review-opt-wrong';
              return `<div class="${cls}">${escHtml(opt)}</div>`;
            }).join('')}
          </div>
          ${!correct ? `<div class="tka-review-user-ans">Jawabanmu: <strong>${userAns||'Kosong'}</strong> · Benar: <strong>${q.ans}</strong></div>` : ''}
          <div class="tka-review-expl">💡 ${escHtml(q.expl||'')}</div>
        </div>`;
    });

    html += `<div class="tka-result-actions" style="margin-top:32px">
      <button class="btn-new" onclick="window.OSN.startQuiz()">↺ Ulangi</button>
      <button class="tka-nav-btn" onclick="window.OSN.init()">🏠 Kembali ke Hub</button>
    </div></div>`;
    container.innerHTML = html;
  }

  return {
    init, selectJenjang, selectMapel, selectLevel, renderSelectLevel,
    renderSelectPaket, selectPaket,
    startQuiz, navigate, jumpTo, selectAnswer, confirmSubmit,
    showReview, _stopTimer
  };
})();
