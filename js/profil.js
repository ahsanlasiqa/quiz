/* ============================================================
   PROFIL USER — DrillSoal
   Fitur: Data user, Rencana Studi, Analitik Progress
   ============================================================ */

window.PROFIL = (function () {

  // ── Konstanta ujian yang tersedia ─────────────────────────────
  const UJIAN_OPTIONS = [
    { key: 'tka_sd',   label: 'TKA SD/MI 2026',   icon: '🎒', color: '#e8a020' },
    { key: 'tka_smp',  label: 'TKA SMP/MTs 2026',  icon: '📚', color: '#1a7a6e' },
    { key: 'tka_sma',  label: 'TKA SMA/MA 2026',   icon: '🎓', color: '#e05c3a' },
    { key: 'cpns_skd', label: 'CPNS SKD',           icon: '📋', color: '#8b2a8b' },
    { key: 'snbt',     label: 'UTBK SNBT',          icon: '🎯', color: '#1a5a9a' },
    { key: 'osn',      label: 'OSN',                icon: '🔬', color: '#2a7a3a' },
    { key: 'other',    label: 'Ujian Lainnya',      icon: '📝', color: '#6a6a6a' },
  ];

  const MAPEL_OPTIONS = [
    'Matematika', 'Bahasa Indonesia', 'Bahasa Inggris',
    'Fisika', 'Kimia', 'Biologi', 'Sejarah', 'IPS',
    'Ekonomi', 'Geografi', 'TWK', 'TIU', 'TKP',
    'Penalaran Umum', 'Kuantitatif', 'Literasi',
  ];

  // ── State lokal ───────────────────────────────────────────────
  let profile = {
    displayName: '',
    email: '',
    photoURL: '',
    bio: '',
    targetUjian: [],       // array of ujian keys
    targetMapel: [],       // array of mapel string
    targetTanggal: '',     // ISO date string
    studyHariPerMinggu: 5, // 1–7
    studyMenitPerHari: 60, // menit
    catatan: '',
  };

  // ── Data sesi yang tersimpan di localStorage ──────────────────
  // Format: { tka_sd: [{date, skor, pct, subtes}], cpns_skd: [...], ... }
  let sessionHistory = {};

  // ── DOM container ─────────────────────────────────────────────
  function el(id) { return document.getElementById(id); }
  function container() { return el('profil-container'); }

  function escHtml(str) {
    return String(str || '')
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  // ── Flag sync ─────────────────────────────────────────────────
  let _cloudSynced = false;  // sudah fetch dari Firestore?
  let _saveTimeout = null;   // debounce save ke cloud

  // ── Init ──────────────────────────────────────────────────────
  function init() {
    loadFromStorage();      // tampilkan data lokal dulu (cepat)
    syncFromFirebase();     // isi nama/foto dari Auth
    render();
    _ensureCloudSync();     // lalu fetch dari Firestore (async, re-render jika ada data baru)
  }

  // ── Load/Save lokal (localStorage) ────────────────────────────
  function loadFromStorage() {
    try {
      const saved = localStorage.getItem('drillsoal_profile');
      if (saved) Object.assign(profile, JSON.parse(saved));
      const hist = localStorage.getItem('drillsoal_sessions');
      if (hist) sessionHistory = JSON.parse(hist);
    } catch (e) { console.warn('Profile load error:', e); }
  }

  function saveToStorage() {
    try {
      localStorage.setItem('drillsoal_profile', JSON.stringify(profile));
    } catch (e) {}
    _saveToCloud();
  }

  // ── Sinkron nama/email/foto dari Firebase Auth ─────────────────
  function syncFromFirebase() {
    const user = window.quizgenUser;
    if (!user) return;
    if (!profile.displayName) profile.displayName = user.displayName || '';
    if (!profile.email)       profile.email       = user.email || '';
    if (!profile.photoURL)    profile.photoURL    = user.photoURL || '';
  }

  // ── Firestore helpers ──────────────────────────────────────────
  function _getUserId() {
    return window.quizgenUser?.uid || null;
  }

  function _db() {
    // Firestore tersedia via compat SDK.
    // FIX #1: Cek apps.length terlebih dahulu — window.firebase.firestore adalah fungsi
    // (selalu truthy), tapi akan throw "No Firebase App" jika belum ada app aktif.
    try {
      if (window.firebase?.apps?.length > 0) return window.firebase.firestore();
    } catch (e) {
      console.warn('Profil _db() error:', e);
    }
    return null;
  }

  // Fetch profil + riwayat dari Firestore (saat init / re-login)
  async function _ensureCloudSync() {
    if (_cloudSynced) return;
    const uid = _getUserId();
    const db  = _db();
    if (!uid || !db) {
      // FIX #3: Jika firebase sudah ada tapi user belum login, tidak perlu pasang listener.
      // Hanya pasang listener jika firebase-nya sendiri yang belum siap.
      if (window.firebase?.apps?.length > 0) return; // firebase siap, tapi belum login — tunggu auth
      window.addEventListener('firebase-ready', () => _ensureCloudSync(), { once: true });
      return;
    }
    // FIX #2 (bagian 1): Set flag SEBELUM await agar tidak ada dua fetch berjalan paralel
    // jika init() dipanggil dua kali cepat (misal: switch tab cepat-cepat).
    _cloudSynced = true;
    try {
      const docRef  = db.collection('profiles').doc(uid);
      const snap    = await docRef.get();
      if (snap.exists) {
        const data = snap.data();
        // Merge: cloud wins untuk profil, merge sesi (gabung & dedup)
        if (data.profile)  Object.assign(profile, data.profile);
        if (data.sessions) {
          // Gabungkan sesi cloud dengan sesi lokal, dedup by date
          Object.entries(data.sessions).forEach(([jenis, sesiCloud]) => {
            const sesiLokal = sessionHistory[jenis] || [];
            const merged = [...sesiLokal, ...sesiCloud];
            // Dedup berdasarkan date
            const seen = new Set();
            sessionHistory[jenis] = merged
              .filter(s => { const k = s.date; if (seen.has(k)) return false; seen.add(k); return true; })
              .sort((a, b) => new Date(b.date) - new Date(a.date))
              .slice(0, 50);
          });
        }
        // FIX #2 (bagian 2): Simpan hasil merge ke lokal SAJA — JANGAN panggil saveToStorage()
        // karena saveToStorage() juga memanggil _saveToCloud(), yang menyebabkan kita langsung
        // write balik ke Firestore data yang baru saja kita baca (race condition + loop).
        try { localStorage.setItem('drillsoal_profile', JSON.stringify(profile)); } catch(e) {}
        try { localStorage.setItem('drillsoal_sessions', JSON.stringify(sessionHistory)); } catch(e) {}
      }
      // Re-render dengan data terbaru dari cloud
      syncFromFirebase();
      render();
    } catch (e) {
      // Reset flag agar bisa dicoba lagi di lain waktu
      _cloudSynced = false;
      console.warn('Profil cloud sync error:', e);
    }
  }

  // Simpan profil + sesi ke Firestore (debounced 1,5 detik)
  function _saveToCloud() {
    clearTimeout(_saveTimeout);
    _saveTimeout = setTimeout(async () => {
      const uid = _getUserId();
      const db  = _db();
      if (!uid || !db) return;
      try {
        // FIX #4: Gunakan serverTimestamp() agar timestamp konsisten di semua timezone
        // dan bisa di-query/sort dengan benar di Firestore.
        const serverTs = window.firebase.firestore.FieldValue.serverTimestamp();
        await db.collection('profiles').doc(uid).set({
          profile,
          sessions: sessionHistory,
          updatedAt: serverTs,
        }, { merge: true });
      } catch (e) {
        console.warn('Profil cloud save error:', e);
      }
    }, 1500);
  }

  // ── Catat sesi try out (dipanggil dari modul quiz saat selesai) ─
  window.PROFIL_recordSession = function(jenis, data) {
    if (!sessionHistory[jenis]) sessionHistory[jenis] = [];
    sessionHistory[jenis].unshift({
      date:       new Date().toISOString(),
      pct:        data.pct        || 0,
      totalBenar: data.totalBenar || 0,
      totalSoal:  data.totalSoal  || 0,
      scores:     data.scores     || {},
      elapsed:    data.elapsed    || 0,
    });
    // Maks 50 sesi per jenis
    if (sessionHistory[jenis].length > 50) sessionHistory[jenis] = sessionHistory[jenis].slice(0, 50);
    // Simpan lokal (cepat)
    try { localStorage.setItem('drillsoal_sessions', JSON.stringify(sessionHistory)); } catch(e) {}
    // Simpan ke cloud (debounced)
    _saveToCloud();
  };

  // ── Hitung statistik ──────────────────────────────────────────
  function computeStats() {
    const allSessions = Object.values(sessionHistory).flat();
    const totalSesi   = allSessions.length;
    const totalSoal   = allSessions.reduce((s, x) => s + (x.totalSoal || 0), 0);
    const totalBenar  = allSessions.reduce((s, x) => s + (x.totalBenar || 0), 0);
    const avgPct      = totalSesi > 0
      ? Math.round(allSessions.reduce((s, x) => s + x.pct, 0) / totalSesi)
      : 0;

    // Tren 7 sesi terakhir
    const last7 = allSessions
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 7)
      .reverse();

    // Streak hari berturut-turut
    const streak = computeStreak(allSessions);

    // Per jenis ujian
    const perJenis = {};
    UJIAN_OPTIONS.forEach(u => {
      const sesi = sessionHistory[u.key] || [];
      if (sesi.length === 0) return;
      perJenis[u.key] = {
        label: u.label, icon: u.icon, color: u.color,
        sesi: sesi.length,
        avgPct: Math.round(sesi.reduce((s, x) => s + x.pct, 0) / sesi.length),
        best:   Math.max(...sesi.map(x => x.pct)),
        last:   sesi[0],
      };
    });

    return { totalSesi, totalSoal, totalBenar, avgPct, last7, streak, perJenis };
  }

  function computeStreak(sessions) {
    if (!sessions.length) return 0;
    const dates = [...new Set(
      sessions.map(s => new Date(s.date).toDateString())
    )].sort((a, b) => new Date(b) - new Date(a));

    let streak = 0;
    let cur = new Date();
    for (const d of dates) {
      const diff = Math.floor((cur - new Date(d)) / 86400000);
      if (diff <= 1) { streak++; cur = new Date(d); }
      else break;
    }
    return streak;
  }

  // ── Hitung estimasi kesiapan ───────────────────────────────────
  function computeReadiness() {
    const stats = computeStats();
    if (stats.totalSesi === 0) return 0;
    // Bobot: rata-rata skor (60%) + jumlah sesi (40% capped at 20 sesi)
    const skorFactor = stats.avgPct / 100;
    const sesiFactor = Math.min(stats.totalSesi, 20) / 20;
    return Math.round((skorFactor * 0.6 + sesiFactor * 0.4) * 100);
  }

  // ── Hari sampai target ─────────────────────────────────────────
  function daysToTarget() {
    if (!profile.targetTanggal) return null;
    const diff = Math.ceil((new Date(profile.targetTanggal) - new Date()) / 86400000);
    return diff;
  }

  // ══════════════════════════════════════════════════════════════
  //  RENDER UTAMA
  // ══════════════════════════════════════════════════════════════
  function render() {
    const stats    = computeStats();
    const readiness = computeReadiness();
    const days     = daysToTarget();
    const c        = container();
    if (!c) return;

    c.innerHTML = `
      <div class="profil-wrap">

        <!-- ── HERO / IDENTITAS ── -->
        <div class="profil-hero">
          <div class="profil-avatar-wrap">
            ${profile.photoURL
              ? `<img src="${escHtml(profile.photoURL)}" alt="Foto profil" class="profil-avatar-img" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
              : ''}
            <div class="profil-avatar-fallback" style="${profile.photoURL ? 'display:none' : ''}">
              ${profile.displayName ? escHtml(profile.displayName[0].toUpperCase()) : '?'}
            </div>
            <button class="profil-avatar-edit" onclick="window.PROFIL.openEditModal()" title="Edit profil">✏️</button>
          </div>
          <div class="profil-hero-info">
            <h1 class="profil-name">${escHtml(profile.displayName || 'Pengguna DrillSoal')}</h1>
            <p class="profil-email">${escHtml(profile.email)}</p>
            ${profile.bio
              ? `<p class="profil-bio">${escHtml(profile.bio)}</p>`
              : `<p class="profil-bio profil-bio-empty" onclick="window.PROFIL.openEditModal()">+ Tambahkan bio singkat…</p>`}
          </div>
          <button class="profil-edit-btn" onclick="window.PROFIL.openEditModal()">✏️ Edit Profil</button>
        </div>

        <!-- ── STATISTIK KILAT ── -->
        <div class="profil-stats-grid">
          <div class="profil-stat-card">
            <div class="profil-stat-num">${stats.totalSesi}</div>
            <div class="profil-stat-label">Sesi Try Out</div>
          </div>
          <div class="profil-stat-card">
            <div class="profil-stat-num">${stats.totalSoal.toLocaleString('id-ID')}</div>
            <div class="profil-stat-label">Soal Dikerjakan</div>
          </div>
          <div class="profil-stat-card">
            <div class="profil-stat-num">${stats.avgPct}%</div>
            <div class="profil-stat-label">Rata-rata Skor</div>
          </div>
          <div class="profil-stat-card profil-stat-streak">
            <div class="profil-stat-num">🔥 ${stats.streak}</div>
            <div class="profil-stat-label">Hari Berturut</div>
          </div>
        </div>

        <!-- ── RENCANA STUDI ── -->
        <div class="profil-section-card" id="profil-rencana">
          <div class="profil-section-hdr">
            <span class="profil-section-icon">🗓️</span>
            <h2 class="profil-section-title">Rencana Studi</h2>
            <button class="profil-section-edit" onclick="window.PROFIL.openStudyPlanModal()">Edit →</button>
          </div>

          ${profile.targetUjian.length === 0
            ? `<div class="profil-empty-state" onclick="window.PROFIL.openStudyPlanModal()">
                <div class="profil-empty-icon">📌</div>
                <p>Belum ada target ujian. <strong>Atur rencana studimu sekarang →</strong></p>
               </div>`
            : renderStudyPlanContent(days, stats.totalSesi)
          }
        </div>

        <!-- ── KESIAPAN UJIAN ── -->
        ${profile.targetUjian.length > 0 ? renderReadinessCard(readiness) : ''}

        <!-- ── ANALITIK PROGRESS ── -->
        <div class="profil-section-card">
          <div class="profil-section-hdr">
            <span class="profil-section-icon">📊</span>
            <h2 class="profil-section-title">Analitik Progress</h2>
          </div>
          ${renderAnalitik(stats)}
        </div>

        <!-- ── HISTORY PER UJIAN ── -->
        ${Object.keys(stats.perJenis).length > 0 ? renderPerJenis(stats.perJenis) : ''}

        <!-- ── RIWAYAT SESI ── -->
        <div class="profil-section-card">
          <div class="profil-section-hdr">
            <span class="profil-section-icon">📋</span>
            <h2 class="profil-section-title">Riwayat Sesi</h2>
          </div>
          ${renderRiwayat()}
        </div>

      </div>

      <!-- ── MODAL EDIT PROFIL ── -->
      <div class="profil-modal-backdrop hidden" id="profil-modal-backdrop" onclick="window.PROFIL.closeModals()"></div>
      <div class="profil-modal hidden" id="profil-modal-edit">
        ${renderEditModal()}
      </div>

      <!-- ── MODAL RENCANA STUDI ── -->
      <div class="profil-modal hidden" id="profil-modal-studyplan">
        ${renderStudyPlanModal()}
      </div>
    `;
  }

  // ── Render: Konten Rencana Studi ─────────────────────────────
  function renderStudyPlanContent(days, totalSesi) {
    const ujianChips = profile.targetUjian.map(key => {
      const u = UJIAN_OPTIONS.find(x => x.key === key);
      if (!u) return '';
      return `<span class="profil-ujian-chip" style="background:${u.color}20;color:${u.color};border-color:${u.color}40">
        ${u.icon} ${u.label}
      </span>`;
    }).join('');

    const mapelChips = profile.targetMapel.slice(0, 6).map(m =>
      `<span class="profil-mapel-chip">${escHtml(m)}</span>`
    ).join('') + (profile.targetMapel.length > 6
      ? `<span class="profil-mapel-chip profil-mapel-more">+${profile.targetMapel.length - 6} lagi</span>`
      : '');

    const targetInfo = days !== null
      ? days > 0
        ? `<div class="profil-target-date">
             <span class="profil-target-icon">⏳</span>
             <div>
               <div class="profil-target-label">Hari Ujian</div>
               <div class="profil-target-val">${new Date(profile.targetTanggal).toLocaleDateString('id-ID', {day:'numeric',month:'long',year:'numeric'})}</div>
             </div>
             <div class="profil-target-countdown">
               <span class="profil-countdown-num">${days}</span>
               <span class="profil-countdown-label">hari lagi</span>
             </div>
           </div>`
        : `<div class="profil-target-date profil-target-past">⚠️ Tanggal ujian sudah terlewat.</div>`
      : '';

    const sessionTarget = profile.studyHariPerMinggu * profile.studyMenitPerHari;
    const mingguan = `${profile.studyHariPerMinggu}×/minggu · ${profile.studyMenitPerHari} menit/hari`;

    return `
      <div class="profil-studyplan-body">
        <div class="profil-studyplan-row">
          <span class="profil-sp-label">Target Ujian</span>
          <div class="profil-sp-chips">${ujianChips}</div>
        </div>
        ${profile.targetMapel.length > 0 ? `
        <div class="profil-studyplan-row">
          <span class="profil-sp-label">Fokus Materi</span>
          <div class="profil-sp-chips">${mapelChips}</div>
        </div>` : ''}
        <div class="profil-studyplan-row">
          <span class="profil-sp-label">Jadwal Belajar</span>
          <span class="profil-sp-val">📅 ${mingguan}</span>
        </div>
        ${targetInfo}
        ${profile.catatan ? `
        <div class="profil-studyplan-row">
          <span class="profil-sp-label">Catatan</span>
          <span class="profil-sp-val profil-catatan">${escHtml(profile.catatan)}</span>
        </div>` : ''}
      </div>`;
  }

  // ── Render: Kesiapan Ujian ────────────────────────────────────
  function renderReadinessCard(readiness) {
    const color = readiness >= 75 ? '#1a7a6e' : readiness >= 50 ? '#e8a020' : '#e05c3a';
    const msg   = readiness >= 75 ? 'Siap!' : readiness >= 50 ? 'Cukup baik' : 'Perlu lebih banyak latihan';
    const emoji = readiness >= 75 ? '🏆' : readiness >= 50 ? '📈' : '💪';
    return `
      <div class="profil-section-card profil-readiness-card" style="border-color:${color}30;background:${color}08">
        <div class="profil-readiness-inner">
          <div class="profil-readiness-left">
            <div class="profil-readiness-label">Estimasi Kesiapan Ujian</div>
            <div class="profil-readiness-msg">${emoji} ${msg}</div>
            <div class="profil-readiness-hint">Berdasarkan rata-rata skor dan jumlah latihan</div>
          </div>
          <div class="profil-readiness-ring" style="--ring-color:${color};--ring-pct:${readiness}">
            <svg viewBox="0 0 80 80" class="profil-ring-svg">
              <circle cx="40" cy="40" r="34" class="profil-ring-bg"/>
              <circle cx="40" cy="40" r="34" class="profil-ring-fill"
                stroke="${color}"
                stroke-dasharray="${Math.round(2*Math.PI*34 * readiness/100)} ${Math.round(2*Math.PI*34)}"
                stroke-dashoffset="${Math.round(2*Math.PI*34 * 0.25)}"
              />
            </svg>
            <div class="profil-ring-label">
              <span class="profil-ring-num">${readiness}</span>
              <span class="profil-ring-pct">%</span>
            </div>
          </div>
        </div>
      </div>`;
  }

  // ── Render: Analitik ──────────────────────────────────────────
  function renderAnalitik(stats) {
    if (stats.totalSesi === 0) {
      return `<div class="profil-empty-state" onclick="window.switchAppMode('tryout')">
        <div class="profil-empty-icon">📊</div>
        <p>Belum ada data. <strong>Mulai Try Out untuk melihat analitik →</strong></p>
      </div>`;
    }

    // Mini bar chart (last 7 sesi)
    const barChart = stats.last7.length > 0 ? renderBarChart(stats.last7) : '';

    // Distribusi skor
    const allPct = Object.values(sessionHistory).flat().map(s => s.pct);
    const dist = { '<50': 0, '50–69': 0, '70–84': 0, '≥85': 0 };
    allPct.forEach(p => {
      if (p < 50) dist['<50']++;
      else if (p < 70) dist['50–69']++;
      else if (p < 85) dist['70–84']++;
      else dist['≥85']++;
    });
    const maxDist = Math.max(...Object.values(dist), 1);

    return `
      <div class="profil-analitik-body">

        <!-- Mini bar chart -->
        ${barChart}

        <!-- Distribusi skor -->
        <div class="profil-analitik-sub">Distribusi Skor</div>
        <div class="profil-dist-chart">
          ${Object.entries(dist).map(([label, count]) => {
            const pct = Math.round((count / maxDist) * 100);
            const c = label === '≥85' ? '#1a7a6e' : label === '70–84' ? '#e8a020' : label === '50–69' ? '#e05c3a' : '#aaa';
            return `
              <div class="profil-dist-row">
                <span class="profil-dist-label">${label}%</span>
                <div class="profil-dist-bar-wrap">
                  <div class="profil-dist-bar" style="width:${pct}%;background:${c}"></div>
                </div>
                <span class="profil-dist-count">${count}</span>
              </div>`;
          }).join('')}
        </div>

        <!-- Quick stats row -->
        <div class="profil-quick-stats">
          <div class="profil-qs-item">
            <span class="profil-qs-icon">✅</span>
            <span class="profil-qs-val">${stats.totalBenar.toLocaleString('id-ID')}</span>
            <span class="profil-qs-label">Soal Benar</span>
          </div>
          <div class="profil-qs-item">
            <span class="profil-qs-icon">❌</span>
            <span class="profil-qs-val">${(stats.totalSoal - stats.totalBenar).toLocaleString('id-ID')}</span>
            <span class="profil-qs-label">Soal Salah</span>
          </div>
          <div class="profil-qs-item">
            <span class="profil-qs-icon">🎯</span>
            <span class="profil-qs-val">${stats.totalSoal > 0 ? Math.round(stats.totalBenar/stats.totalSoal*100) : 0}%</span>
            <span class="profil-qs-label">Akurasi Total</span>
          </div>
        </div>
      </div>`;
  }

  function renderBarChart(sessions) {
    const maxPct = 100;
    return `
      <div class="profil-analitik-sub">Skor 7 Sesi Terakhir</div>
      <div class="profil-bar-chart">
        ${sessions.map((s, i) => {
          const h = Math.round((s.pct / maxPct) * 100);
          const c = s.pct >= 75 ? '#1a7a6e' : s.pct >= 50 ? '#e8a020' : '#e05c3a';
          const date = new Date(s.date).toLocaleDateString('id-ID', {day:'2-digit',month:'short'});
          return `
            <div class="profil-bar-col">
              <div class="profil-bar-pct">${s.pct}%</div>
              <div class="profil-bar-body">
                <div class="profil-bar-fill" style="height:${h}%;background:${c}"></div>
              </div>
              <div class="profil-bar-date">${date}</div>
            </div>`;
        }).join('')}
      </div>`;
  }

  // ── Render: Per Jenis Ujian ───────────────────────────────────
  function renderPerJenis(perJenis) {
    const cards = Object.entries(perJenis).map(([key, data]) => `
      <div class="profil-jenis-card">
        <div class="profil-jenis-hdr" style="background:${data.color}15;border-color:${data.color}30">
          <span class="profil-jenis-icon">${data.icon}</span>
          <span class="profil-jenis-label" style="color:${data.color}">${data.label}</span>
          <span class="profil-jenis-sesi">${data.sesi} sesi</span>
        </div>
        <div class="profil-jenis-body">
          <div class="profil-jenis-row">
            <span>Rata-rata</span>
            <span class="profil-jenis-val">${data.avgPct}%</span>
          </div>
          <div class="profil-jenis-row">
            <span>Terbaik</span>
            <span class="profil-jenis-val profil-best">${data.best}%</span>
          </div>
          <div class="profil-jenis-bar-wrap">
            <div class="profil-jenis-bar" style="width:${data.avgPct}%;background:${data.color}"></div>
          </div>
        </div>
      </div>`
    ).join('');

    return `
      <div class="profil-section-card">
        <div class="profil-section-hdr">
          <span class="profil-section-icon">🏅</span>
          <h2 class="profil-section-title">Progress per Ujian</h2>
        </div>
        <div class="profil-jenis-grid">${cards}</div>
      </div>`;
  }

  // ── Render: Riwayat Sesi ──────────────────────────────────────
  function renderRiwayat() {
    const all = Object.entries(sessionHistory)
      .flatMap(([jenis, sesi]) => sesi.map(s => ({ ...s, jenis })))
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10);

    if (all.length === 0) {
      return `<div class="profil-empty-state"><div class="profil-empty-icon">📭</div><p>Belum ada riwayat sesi.</p></div>`;
    }

    return `<div class="profil-riwayat-list">
      ${all.map(s => {
        const u = UJIAN_OPTIONS.find(x => x.key === s.jenis) || { icon: '📝', color: '#888', label: s.jenis };
        const date = new Date(s.date).toLocaleDateString('id-ID', {day:'numeric',month:'short',year:'numeric'});
        const time = new Date(s.date).toLocaleTimeString('id-ID', {hour:'2-digit',minute:'2-digit'});
        const pctColor = s.pct >= 75 ? '#1a7a6e' : s.pct >= 50 ? '#e8a020' : '#e05c3a';
        const m = Math.floor((s.elapsed || 0) / 60), sec = (s.elapsed || 0) % 60;
        return `
          <div class="profil-riwayat-item">
            <div class="profil-riwayat-icon" style="background:${u.color}15;color:${u.color}">${u.icon}</div>
            <div class="profil-riwayat-info">
              <div class="profil-riwayat-jenis">${u.label}</div>
              <div class="profil-riwayat-meta">${date} · ${time}${s.elapsed ? ` · ${m}m${sec}s` : ''}</div>
            </div>
            <div class="profil-riwayat-skor" style="color:${pctColor}">
              <span class="profil-riwayat-pct">${s.pct}%</span>
              <span class="profil-riwayat-detail">${s.totalBenar}/${s.totalSoal}</span>
            </div>
          </div>`;
      }).join('')}
    </div>`;
  }

  // ── Render: Modal Edit Profil ─────────────────────────────────
  function renderEditModal() {
    return `
      <div class="profil-modal-inner">
        <div class="profil-modal-hdr">
          <h3>Edit Profil</h3>
          <button class="profil-modal-close" onclick="window.PROFIL.closeModals()">✕</button>
        </div>
        <div class="profil-modal-body">
          <div class="profil-form-group">
            <label>Nama Tampilan</label>
            <input type="text" id="pm-name" value="${escHtml(profile.displayName)}" placeholder="Nama kamu" maxlength="50"/>
          </div>
          <div class="profil-form-group">
            <label>Bio Singkat</label>
            <textarea id="pm-bio" placeholder="Ceritakan sedikit tentang kamu…" maxlength="160" rows="3">${escHtml(profile.bio)}</textarea>
            <span class="profil-char-count" id="pm-bio-count">${(profile.bio||'').length}/160</span>
          </div>
        </div>
        <div class="profil-modal-footer">
          <button class="profil-btn-cancel" onclick="window.PROFIL.closeModals()">Batal</button>
          <button class="profil-btn-save" onclick="window.PROFIL.saveEditProfile()">Simpan ✓</button>
        </div>
      </div>`;
  }

  // ── Render: Modal Rencana Studi ───────────────────────────────
  function renderStudyPlanModal() {
    const ujianChips = UJIAN_OPTIONS.map(u => {
      const active = profile.targetUjian.includes(u.key);
      return `<button class="profil-ujian-toggle${active ? ' active' : ''}"
        style="${active ? `background:${u.color};border-color:${u.color};color:white` : ''}"
        onclick="window.PROFIL.toggleUjian('${u.key}', this)" data-color="${u.color}">
        ${u.icon} ${u.label}
      </button>`;
    }).join('');

    const mapelChips = MAPEL_OPTIONS.map(m => {
      const active = profile.targetMapel.includes(m);
      return `<button class="profil-mapel-toggle${active ? ' active' : ''}"
        onclick="window.PROFIL.toggleMapel('${escHtml(m)}', this)">
        ${escHtml(m)}
      </button>`;
    }).join('');

    return `
      <div class="profil-modal-inner profil-modal-wide">
        <div class="profil-modal-hdr">
          <h3>🗓️ Rencana Studi</h3>
          <button class="profil-modal-close" onclick="window.PROFIL.closeModals()">✕</button>
        </div>
        <div class="profil-modal-body profil-studyplan-modal-body">

          <div class="profil-form-group">
            <label>Target Ujian <span class="profil-form-sub">Pilih satu atau lebih</span></label>
            <div class="profil-ujian-grid">${ujianChips}</div>
          </div>

          <div class="profil-form-group">
            <label>Fokus Mata Pelajaran <span class="profil-form-sub">Opsional</span></label>
            <div class="profil-mapel-grid">${mapelChips}</div>
          </div>

          <div class="profil-form-group">
            <label>Tanggal Ujian <span class="profil-form-sub">Opsional</span></label>
            <input type="date" id="pm-tanggal" value="${escHtml(profile.targetTanggal)}"
              min="${new Date().toISOString().split('T')[0]}"/>
          </div>

          <div class="profil-form-row">
            <div class="profil-form-group">
              <label>Hari Belajar / Minggu</label>
              <div class="profil-range-wrap">
                <input type="range" id="pm-hari" min="1" max="7" value="${profile.studyHariPerMinggu}"
                  oninput="document.getElementById('pm-hari-val').textContent=this.value"/>
                <span class="profil-range-val" id="pm-hari-val">${profile.studyHariPerMinggu}</span>
                <span class="profil-range-unit">hari</span>
              </div>
            </div>
            <div class="profil-form-group">
              <label>Durasi / Hari</label>
              <div class="profil-range-wrap">
                <input type="range" id="pm-menit" min="15" max="180" step="15" value="${profile.studyMenitPerHari}"
                  oninput="document.getElementById('pm-menit-val').textContent=this.value"/>
                <span class="profil-range-val" id="pm-menit-val">${profile.studyMenitPerHari}</span>
                <span class="profil-range-unit">menit</span>
              </div>
            </div>
          </div>

          <div class="profil-form-group">
            <label>Catatan / Target Nilai <span class="profil-form-sub">Opsional</span></label>
            <textarea id="pm-catatan" placeholder="cth. Target nilai TWK ≥ 70, fokus materi Pancasila…" rows="2" maxlength="300">${escHtml(profile.catatan)}</textarea>
          </div>

        </div>
        <div class="profil-modal-footer">
          <button class="profil-btn-cancel" onclick="window.PROFIL.closeModals()">Batal</button>
          <button class="profil-btn-save" onclick="window.PROFIL.saveStudyPlan()">Simpan Rencana ✓</button>
        </div>
      </div>`;
  }

  // ══════════════════════════════════════════════════════════════
  //  MODAL ACTIONS
  // ══════════════════════════════════════════════════════════════
  function openEditModal() {
    el('profil-modal-backdrop').classList.remove('hidden');
    el('profil-modal-edit').classList.remove('hidden');
    // Attach bio counter
    const bio = el('pm-bio');
    if (bio) bio.addEventListener('input', () => {
      const c = el('pm-bio-count');
      if (c) c.textContent = bio.value.length + '/160';
    });
  }

  function openStudyPlanModal() {
    el('profil-modal-backdrop').classList.remove('hidden');
    el('profil-modal-studyplan').classList.remove('hidden');
  }

  function closeModals() {
    ['profil-modal-backdrop','profil-modal-edit','profil-modal-studyplan']
      .forEach(id => el(id)?.classList.add('hidden'));
  }

  function saveEditProfile() {
    profile.displayName = (el('pm-name')?.value || '').trim();
    profile.bio         = (el('pm-bio')?.value  || '').trim();
    saveToStorage();
    closeModals();
    render();
  }

  function saveStudyPlan() {
    profile.targetTanggal      = el('pm-tanggal')?.value || '';
    profile.studyHariPerMinggu = parseInt(el('pm-hari')?.value  || '5');
    profile.studyMenitPerHari  = parseInt(el('pm-menit')?.value || '60');
    profile.catatan            = (el('pm-catatan')?.value || '').trim();
    saveToStorage();
    closeModals();
    render();
  }

  function toggleUjian(key, btn) {
    const idx = profile.targetUjian.indexOf(key);
    const u   = UJIAN_OPTIONS.find(x => x.key === key);
    if (idx === -1) {
      profile.targetUjian.push(key);
      btn.classList.add('active');
      btn.style.cssText = `background:${u.color};border-color:${u.color};color:white`;
    } else {
      profile.targetUjian.splice(idx, 1);
      btn.classList.remove('active');
      btn.style.cssText = '';
    }
    saveToStorage();
  }

  function toggleMapel(m, btn) {
    const idx = profile.targetMapel.indexOf(m);
    if (idx === -1) { profile.targetMapel.push(m); btn.classList.add('active'); }
    else            { profile.targetMapel.splice(idx, 1); btn.classList.remove('active'); }
    saveToStorage();
  }

  // ── Public API ────────────────────────────────────────────────
  // ── Reset state saat logout ────────────────────────────────────
  function resetOnLogout() {
    // 1. Batalkan debounced save yang mungkin masih pending —
    //    setelah user logout, uid sudah null sehingga cloud save gagal
    //    dan data akan hilang. Cancel dulu agar tidak ada race condition.
    clearTimeout(_saveTimeout);
    _saveTimeout = null;

    // 2. Reset in-memory state
    profile = {
      displayName: '', email: '', photoURL: '', bio: '',
      targetUjian: [], targetMapel: [], targetTanggal: '',
      studyHariPerMinggu: 5, studyMenitPerHari: 60, catatan: '',
    };
    sessionHistory = {};
    _cloudSynced   = false;

    // 3. Bersihkan localStorage — pastikan user berikutnya tidak
    //    melihat data user sebelumnya saat loadFromStorage() dijalankan
    try {
      localStorage.removeItem('drillsoal_profile');
      localStorage.removeItem('drillsoal_sessions');
    } catch(e) {}
  }

  return {
    init,
    render,
    openEditModal,
    openStudyPlanModal,
    closeModals,
    saveEditProfile,
    saveStudyPlan,
    toggleUjian,
    toggleMapel,
    resetOnLogout,
    // Diakses dari app.js untuk paksa re-sync setelah login
    get _cloudSynced()    { return _cloudSynced; },
    set _cloudSynced(val) { _cloudSynced = val;  },
  };
})();
