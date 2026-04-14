/* ============================================
   QUIZGEN — APP LOGIC v6
   Fixes: 504 timeout, diagrams, PDF upload
   ============================================ */

// ── Limits ─────────────────────────────────
const LIMITS = {
  maxImages: 10,
  maxQuestions: 20,
  warnImages: 8,
  warnQuestions: 17,
};

// ── State ──────────────────────────────────
const state = {
  mode: 'upload',   // 'upload' | 'topic'
  topic: { jenjang: '', mapel: '', topik: '' },
  images: [],
  quizData: null,
  settings: {
    level: 'elementary',
    grade: 1,
    numQuestions: 10,
    types: ['multiple_choice', 'true_false', 'fill_blank', 'short_answer'],
    studentName: '',
    date: ''
  }
};

// ── Grade Config ───────────────────────────
const GRADE_CONFIG = {
  elementary: {
    label: 'Elementary School', emoji: '🎒',
    grades: [
      { value: 1, label: 'Grade 1' }, { value: 2, label: 'Grade 2' },
      { value: 3, label: 'Grade 3' }, { value: 4, label: 'Grade 4' },
      { value: 5, label: 'Grade 5' }, { value: 6, label: 'Grade 6' },
    ]
  },
  junior_high: {
    label: 'Junior High School', emoji: '📚',
    grades: [
      { value: 7, label: 'Grade 7' }, { value: 8, label: 'Grade 8' },
      { value: 9, label: 'Grade 9' },
    ]
  },
  high_school: {
    label: 'High School', emoji: '🎓',
    grades: [
      { value: 10, label: 'Grade 10' }, { value: 11, label: 'Grade 11' },
      { value: 12, label: 'Grade 12' },
    ]
  }
};

// ── DOM Refs ───────────────────────────────

const uploadZone        = document.getElementById('upload-zone');
const fileInput         = document.getElementById('file-input');
const imagePreviewGrid  = document.getElementById('image-preview-grid');
const btnGenerate       = document.getElementById('btn-generate');
const generateHint      = document.getElementById('generate-hint');
const loadingOverlay    = document.getElementById('loading-overlay');
const loadingText       = document.getElementById('loading-text');
const loadingSub        = document.getElementById('loading-sub');
const stepResults       = document.getElementById('step-results');
const quizOutput        = document.getElementById('quiz-output');
const quizMetaText      = document.getElementById('quiz-meta-text');
const btnPdf            = document.getElementById('btn-pdf');
const btnNew            = document.getElementById('btn-new');
const btnRegenerate     = document.getElementById('btn-regenerate');
const btnInteractive    = document.getElementById('btn-interactive');
const numQuestionsInput = document.getElementById('num-questions');
const numMinus          = document.getElementById('num-minus');
const numPlus           = document.getElementById('num-plus');
const levelToggle       = document.getElementById('level-toggle');
const gradeSelector     = document.getElementById('grade-selector');
const gradePills        = document.getElementById('grade-pills');
const studentNameInput  = document.getElementById('student-name');
const quizDateInput     = document.getElementById('quiz-date');
const pdfProgress       = document.getElementById('pdf-progress');
const pdfProgressFill   = document.getElementById('pdf-progress-fill');
const pdfProgressText   = document.getElementById('pdf-progress-text');

// ── PDF.js setup ───────────────────────────
if (window.pdfjsLib) {
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

// ── Init ───────────────────────────────────
(function init() {
  // Auth is handled by auth.js waiting for firebase-ready event
  quizDateInput.valueAsDate = new Date();
  renderGrades('elementary');

  // Handle post-payment redirect
  const params = new URLSearchParams(window.location.search);
  if (params.get('payment') === 'finish') {
    window.history.replaceState({}, '', window.location.pathname);
    setTimeout(() => generateHint.textContent = '🎉 Pembayaran berhasil! Kredit telah ditambahkan.', 800);
  } else if (params.get('payment') === 'pending') {
    window.history.replaceState({}, '', window.location.pathname);
    setTimeout(() => generateHint.textContent = '⏳ Pembayaran pending. Kredit aktif setelah dikonfirmasi.', 800);
  }

  // Logout ditangani sepenuhnya oleh onAuthStateChanged(null) di auth.js
  // — tidak perlu listener duplikat di sini
})();

// ── Credits UI ────────────────────────────
window._currentCredits       = 0;
window._isInvited            = false;
window._subscriptionStatus   = 'free';   // 'free' | 'active' | 'expired'
window._subscriptionPackId   = null;
window._subscriptionPackLabel= null;
window._subscriptionExpiresAt= null;

window.updateSubscriptionUI = function(accessData) {
  window._isInvited             = accessData.isInvited             || false;
  window._currentCredits        = accessData.credits               ?? 0;
  window._subscriptionStatus    = accessData.subscriptionStatus    || 'free';
  window._subscriptionPackId    = accessData.subscriptionPackId    || null;
  window._subscriptionPackLabel = accessData.subscriptionPackLabel || null;
  window._subscriptionExpiresAt = accessData.subscriptionExpiresAt || null;
  window.renderCreditsBanner();
  // Setelah login & auth siap → sync profil dari cloud
  if (window.PROFIL) {
    window.PROFIL._cloudSynced = false;
    window.PROFIL.init();
  }
};

window.renderCreditsBanner = function() {
  const banner = document.getElementById('subscription-banner');
  if (!banner) return;

  if (window._isInvited) { banner.classList.add('hidden'); return; }

  const credits = window._currentCredits;
  const status  = window._subscriptionStatus;
  const label   = window._subscriptionPackLabel;
  const exp     = window._subscriptionExpiresAt;

  // Format tanggal berakhir
  let expStr = '';
  if (exp) {
    const d = new Date(exp);
    expStr = d.toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' });
  }

  let statusHtml, bannerClass;

  if (status === 'active') {
    bannerClass = 'subscription-banner trial';
    statusHtml  = `
      <span>
        ⚡ <strong>${credits} kredit</strong> tersisa
        ${label ? `· <span class="banner-plan-label">${label}</span>` : ''}
        ${expStr ? `· Aktif hingga ${expStr}` : ''}
      </span>`;
  } else if (status === 'expired') {
    bannerClass = 'subscription-banner expired';
    statusHtml  = `<span>⏰ Langganan berakhir ${expStr || ''}. Perpanjang untuk lanjutkan.</span>`;
  } else {
    // free
    bannerClass = credits > 0
      ? 'subscription-banner trial'
      : 'subscription-banner expired';
    statusHtml = credits > 0
      ? `<span>⚡ <strong>${credits} kredit</strong> percobaan tersisa</span>`
      : `<span>🪫 Kredit habis — pilih paket untuk lanjutkan.</span>`;
  }

  banner.className = bannerClass;
  banner.innerHTML = `
    ${statusHtml}
    <a href="/payment-status.html" class="banner-status-link">Riwayat →</a>
    <div class="banner-buy-btns">
      <button class="btn-subscribe btn-subscribe-sm"  onclick="window.showPricingModal('starter')">Starter</button>
      <button class="btn-subscribe btn-subscribe-hot" onclick="window.showPricingModal('pro')">🔥 Pro</button>
    </div>
  `;
  banner.classList.remove('hidden');
};

// ── Pricing Modal ─────────────────────────────────────────────────────────────
// Dipanggil dari banner: showPricingModal('starter') atau showPricingModal('pro')
window.showPricingModal = function(tier) {
  // Hapus modal lama jika ada
  document.getElementById('pricing-modal-overlay')?.remove();

  const packs = {
    starter: {
      label:   'Starter',
      monthly: { id: 'starter_monthly', price: 'Rp 19.900 / bulan', credits: '5 kredit',  billingNote: 'per bulan' },
      yearly:  { id: 'starter_yearly',  price: 'Rp 200.000 / tahun', credits: '60 kredit', billingNote: 'per tahun · hemat 16%' },
    },
    pro: {
      label:   'Pro',
      monthly: { id: 'pro_monthly', price: 'Rp 49.900 / bulan',  credits: '40 kredit',  billingNote: 'per bulan' },
      yearly:  { id: 'pro_yearly',  price: 'Rp 500.000 / tahun', credits: '480 kredit', billingNote: 'per tahun · hemat 17%' },
    },
  };

  const p = packs[tier];
  if (!p) return;

  const overlay = document.createElement('div');
  overlay.id = 'pricing-modal-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px';

  overlay.innerHTML = `
    <div style="background:var(--warm-white,#fff);border-radius:16px;padding:28px 24px;max-width:360px;width:100%;box-shadow:0 8px 40px rgba(0,0,0,0.18);position:relative">
      <button onclick="document.getElementById('pricing-modal-overlay').remove()"
        style="position:absolute;top:12px;right:14px;background:none;border:none;font-size:20px;cursor:pointer;color:#888">✕</button>
      <h3 style="margin:0 0 4px;font-size:1.15rem">Paket ${p.label}</h3>
      <p style="margin:0 0 20px;color:#666;font-size:.85rem">Pilih periode langganan</p>

      <div style="display:flex;flex-direction:column;gap:12px">
        <!-- Bulanan -->
        <button onclick="window._doCheckout('${p.monthly.id}')"
          style="text-align:left;border:2px solid #e0d5c8;border-radius:12px;padding:14px 16px;background:#fff;cursor:pointer;transition:border-color .15s"
          onmouseover="this.style.borderColor='#c8a96e'" onmouseout="this.style.borderColor='#e0d5c8'">
          <div style="font-weight:600;font-size:.95rem">${p.monthly.price}</div>
          <div style="font-size:.82rem;color:#888;margin-top:2px">${p.monthly.credits} · ${p.monthly.billingNote}</div>
        </button>
        <!-- Tahunan -->
        <button onclick="window._doCheckout('${p.yearly.id}')"
          style="text-align:left;border:2px solid #c8a96e;border-radius:12px;padding:14px 16px;background:linear-gradient(135deg,#fffaf3,#fff8ec);cursor:pointer;transition:border-color .15s;position:relative"
          onmouseover="this.style.borderColor='#a07840'" onmouseout="this.style.borderColor='#c8a96e'">
          <span style="position:absolute;top:-10px;right:12px;background:#c8a96e;color:#fff;font-size:.7rem;font-weight:700;padding:2px 8px;border-radius:20px">HEMAT</span>
          <div style="font-weight:600;font-size:.95rem">${p.yearly.price}</div>
          <div style="font-size:.82rem;color:#888;margin-top:2px">${p.yearly.credits} · ${p.yearly.billingNote}</div>
        </button>
      </div>
    </div>`;

  // Tutup jika klik overlay
  overlay.addEventListener('click', function(e) {
    if (e.target === overlay) overlay.remove();
  });

  document.body.appendChild(overlay);
};

// Internal: panggil setelah user pilih pack dari modal
window._doCheckout = async function(packId) {
  document.getElementById('pricing-modal-overlay')?.remove();
  await window.startCheckout(packId);
};

// ── startCheckout ─────────────────────────────────────────────────────────────
// packId: string seperti 'starter_monthly', 'pro_yearly', dll
window.startCheckout = async function(packId) {
  if (!packId || typeof packId !== 'string') {
    alert('Pack tidak valid. Silakan pilih paket terlebih dahulu.');
    return;
  }
  try {
    const idToken = await window.getIdToken();
    const res = await fetch('/api/create-transaction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-id-token': idToken },
      body: JSON.stringify({ pack: packId })
    });
    const data = await res.json();
    if (!data.token) {
      alert('Gagal memulai pembayaran: ' + (data.error || 'Error tidak diketahui'));
      return;
    }
    window.snap.pay(data.token, {
      onSuccess: async function(result) {
        // Refresh kredit dari server (jangan update manual)
        try {
          const freshToken = await window.getIdToken();
          const authRes = await fetch('/api/check-auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken: freshToken })
          });
          const authData = await authRes.json();
          if (authData.ok) window.updateSubscriptionUI(authData);
        } catch(e) { /* silent */ }
      },
      onPending: function(result) {
        // Webhook akan update ketika payment dikonfirmasi
      },
      onError: function(result) {
        alert('❌ Pembayaran gagal. Silakan coba lagi.');
      },
      onClose: function() {
        // User tutup popup tanpa bayar — tidak perlu action
      }
    });
  } catch (err) {
    alert('Error pembayaran: ' + err.message);
  }
};

// ── Level Toggle ───────────────────────────
levelToggle.querySelectorAll('.level-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    levelToggle.querySelectorAll('.level-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.settings.level = btn.dataset.value;
    renderGrades(btn.dataset.value);
  });
});

function renderGrades(level) {
  const config = GRADE_CONFIG[level];
  gradePills.innerHTML = '';
  config.grades.forEach((g, i) => {
    const pill = document.createElement('button');
    pill.className = 'grade-pill' + (i === 0 ? ' active' : '');
    pill.textContent = g.label;
    pill.dataset.value = g.value;
    pill.addEventListener('click', () => {
      gradePills.querySelectorAll('.grade-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      state.settings.grade = parseInt(g.value);
    });
    gradePills.appendChild(pill);
  });
  state.settings.grade = config.grades[0].value;
  gradeSelector.classList.add('visible');
}

// ── Number of Questions ────────────────────
function updateQuestionsCounter(v) {
  const counter = document.getElementById('questions-counter');
  if (!counter) return;
  if (v >= LIMITS.maxQuestions) {
    counter.textContent = `${v} / ${LIMITS.maxQuestions} soal · Batas tercapai`;
    counter.className = 'questions-counter warn';
  } else if (v >= LIMITS.warnQuestions) {
    counter.textContent = `${v} / ${LIMITS.maxQuestions} soal · Mendekati batas`;
    counter.className = 'questions-counter warn-soft';
  } else {
    counter.textContent = `${v} / ${LIMITS.maxQuestions} soal`;
    counter.className = 'questions-counter';
  }
}

numMinus.addEventListener('click', () => {
  const v = parseInt(numQuestionsInput.value);
  if (v > 1) { numQuestionsInput.value = v - 1; updateQuestionsCounter(v - 1); }
});
numPlus.addEventListener('click', () => {
  const v = parseInt(numQuestionsInput.value);
  if (v < LIMITS.maxQuestions) { numQuestionsInput.value = v + 1; updateQuestionsCounter(v + 1); }
});
numQuestionsInput.addEventListener('change', () => {
  let v = parseInt(numQuestionsInput.value);
  if (isNaN(v) || v < 1) v = 1;
  if (v > LIMITS.maxQuestions) v = LIMITS.maxQuestions;
  numQuestionsInput.value = v;
  updateQuestionsCounter(v);
});

// ── Upload Zone ────────────────────────────
const cameraInput = document.getElementById('camera-input');

// Drag and drop (desktop)
uploadZone.addEventListener('dragover', e => {
  e.preventDefault();
  uploadZone.classList.add('dragover');
});
uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('dragover'));
uploadZone.addEventListener('drop', e => {
  e.preventDefault();
  uploadZone.classList.remove('dragover');
  handleFiles(Array.from(e.dataTransfer.files));
});

// Browse button — triggers hidden file input
document.getElementById('btn-browse-files').addEventListener('click', () => {
  fileInput.click();
});

// Camera button — triggers camera input (mobile uses rear camera)
document.getElementById('btn-camera').addEventListener('click', () => {
  cameraInput.click();
});

// Also allow clicking the upload zone itself on desktop
uploadZone.addEventListener('click', () => {
  fileInput.click();
});

fileInput.addEventListener('change', () => {
  if (fileInput.files.length) {
    handleFiles(Array.from(fileInput.files));
    fileInput.value = '';
  }
});

cameraInput.addEventListener('change', () => {
  if (cameraInput.files.length) {
    handleFiles(Array.from(cameraInput.files));
    cameraInput.value = '';
  }
});

async function handleFiles(files) {
  for (const file of files) {
    if (state.images.length >= LIMITS.maxImages) {
      generateHint.textContent = `Maksimum ${LIMITS.maxImages} gambar tercapai. Hapus beberapa sebelum menambah lagi.`;
      break;
    }
    if (file.type === 'application/pdf') {
      await handlePDF(file);
    } else if (file.type.startsWith('image/')) {
      await handleImage(file);
    }
  }
}

// ── PDF → Images ───────────────────────────
async function handlePDF(file) {
  pdfProgress.classList.remove('hidden');
  pdfProgressText.textContent = `Memuat ${file.name}…`;
  pdfProgressFill.style.width = '0%';

  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const totalPages = pdf.numPages;

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      if (state.images.length >= LIMITS.maxImages) {
        pdfProgressText.textContent = `Stopped at page ${pageNum - 1} — maksimum ${LIMITS.maxImages} gambar tercapai.`;
        break;
      }
      pdfProgressText.textContent = `Mengonversi halaman ${pageNum} dari ${totalPages}…`;
      pdfProgressFill.style.width = `${(pageNum / totalPages) * 100}%`;

      const page = await pdf.getPage(pageNum);
      const scale = 1.5; // Good balance: readable but not too large
      const viewport = page.getViewport({ scale });

      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d');

      await page.render({ canvasContext: ctx, viewport }).promise;

      // Compress to JPEG like we do for images
      const dataUrl = compressCanvas(canvas);
      const base64 = dataUrl.split(',')[1];
      state.images.push({
        file: { name: `${file.name} p.${pageNum}` },
        dataUrl,
        base64,
        mimeType: 'image/jpeg',
        fromPDF: true,
        pdfName: file.name
      });
    }
    renderPreviews();
  } catch (err) {
    console.error('PDF error:', err);
    generateHint.textContent = `Could not read PDF: ${err.message}`;
  } finally {
    pdfProgress.classList.add('hidden');
  }
}

// ── Image handler ──────────────────────────
function handleImage(file) {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        const dataUrl = compressCanvas(imageToCanvas(img));
        const base64 = dataUrl.split(',')[1];
        state.images.push({ file, dataUrl, base64, mimeType: 'image/jpeg' });
        renderPreviews();
        resolve();
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

function imageToCanvas(img) {
  const MAX = 1600;
  let { width, height } = img;
  if (width > MAX || height > MAX) {
    if (width >= height) { height = Math.round(height * MAX / width); width = MAX; }
    else { width = Math.round(width * MAX / height); height = MAX; }
  }
  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = height;
  canvas.getContext('2d').drawImage(img, 0, 0, width, height);
  return canvas;
}

function compressCanvas(canvas) {
  // If still too large, scale down further
  const MAX = 1600;
  if (canvas.width > MAX || canvas.height > MAX) {
    const ratio = Math.min(MAX / canvas.width, MAX / canvas.height);
    const c2 = document.createElement('canvas');
    c2.width = Math.round(canvas.width * ratio);
    c2.height = Math.round(canvas.height * ratio);
    c2.getContext('2d').drawImage(canvas, 0, 0, c2.width, c2.height);
    return c2.toDataURL('image/jpeg', 0.82);
  }
  return canvas.toDataURL('image/jpeg', 0.82);
}

// ── Previews ───────────────────────────────
function updateImageCounter() {
  const counter = document.getElementById('image-counter');
  if (!counter) return;
  const count = state.images.length;
  if (count === 0) {
    counter.textContent = '';
    counter.className = 'image-counter';
  } else if (count >= LIMITS.maxImages) {
    counter.textContent = `${count} / ${LIMITS.maxImages} gambar · Batas tercapai`;
    counter.className = 'image-counter warn';
  } else if (count >= LIMITS.warnImages) {
    counter.textContent = `${count} / ${LIMITS.maxImages} gambar · Mendekati batas`;
    counter.className = 'image-counter warn-soft';
  } else {
    counter.textContent = `${count} / ${LIMITS.maxImages} gambar`;
    counter.className = 'image-counter';
  }
}

function renderPreviews() {
  updateImageCounter();
  imagePreviewGrid.innerHTML = '';
  state.images.forEach((img, i) => {
    const div = document.createElement('div');
    div.className = 'preview-item';
    const label = img.fromPDF
      ? `<span class="preview-pdf-badge">PDF</span><span class="preview-num">p.${i+1}</span>`
      : `<span class="preview-num">Page ${i+1}</span>`;
    div.innerHTML = `
      <img src="${img.dataUrl}" alt="Page ${i+1}" />
      <button class="preview-remove" data-idx="${i}" title="Remove">✕</button>
      ${label}
    `;
    imagePreviewGrid.appendChild(div);
  });
  imagePreviewGrid.querySelectorAll('.preview-remove').forEach(btn => {
    btn.addEventListener('click', () => {
      state.images.splice(parseInt(btn.dataset.idx), 1);
      renderPreviews();
    });
  });
}

// ── Collect Settings ───────────────────────
function collectSettings() {
  try {
    const activeLevel = levelToggle?.querySelector('.level-btn.active');
    if (activeLevel) state.settings.level = activeLevel.dataset.value;
  } catch(e) {}
  try {
    const activePill = gradePills?.querySelector('.grade-pill.active');
    if (activePill) state.settings.grade = parseInt(activePill.dataset.value);
  } catch(e) {}
  try {
    state.settings.numQuestions = parseInt(numQuestionsInput?.value) || 10;
  } catch(e) {}
  try {
    const checked = document.querySelectorAll('input[name="qtype"]:checked');
    const types = Array.from(checked).map(c => c.value);
    // Fallback to all types if none checked (e.g. DOM not ready)
    state.settings.types = types.length > 0 ? types : ['multiple_choice', 'true_false', 'fill_blank', 'short_answer'];
  } catch(e) {
    state.settings.types = ['multiple_choice', 'true_false', 'fill_blank', 'short_answer'];
  }
  try {
    state.settings.studentName = studentNameInput?.value.trim() || '';
    state.settings.date = quizDateInput?.value || '';
  } catch(e) {}
}

// ── Generate Quiz ──────────────────────────
btnGenerate.addEventListener('click', generateQuiz);
btnRegenerate.addEventListener('click', generateQuiz);

async function generateQuiz() {
  collectSettings();

  // Validate based on mode
  if (state.mode === 'topic') {
    const { jenjang, mapel, topik } = state.topic;
    if (!jenjang || !mapel || !topik) {
      generateHint.textContent = 'Pilih kelas, mata pelajaran, dan topik terlebih dahulu.';
      return;
    }
  } else {
    if (state.images.length === 0) {
      generateHint.textContent = 'Upload minimal satu foto atau halaman PDF.';
      return;
    }
  }
  if (state.settings.types.length === 0) {
    generateHint.textContent = 'Pilih minimal satu jenis soal.';
    return;
  }

  // ── Credit check BEFORE sending anything to Claude ──
  const credits = window._currentCredits ?? 0;
  const isInvited = window._isInvited ?? false;
  if (!isInvited && credits <= 0) {
    generateHint.textContent = '';
    window.renderCreditsBanner();
    window.showPricingModal('pro');
    return;
  }

  generateHint.textContent = '';

  // Reset detection state
  document.getElementById('step-detect').classList.add('hidden');
  document.getElementById('step-detect-bantai').classList.add('hidden');

  if (state.mode === 'topic') {
    // Topic mode: langsung generate tanpa deteksi
    showLoading('Membuat soal…', state.topic.mapel + ' — ' + state.topic.topik);
    try {
      const quiz = await callClaudeTopic();
      finishGenerate(quiz);
    } catch (err) {
      handleGenerateError(err);
    } finally {
      hideLoading();
    }
    return;
  }

  // Upload mode: Step 1 extract + deteksi dulu
  showLoading('Langkah 1/2: Membaca materi…', 'Menganalisis ' + state.images.length + ' gambar…');
  try {
    await extractAndDetect();
  } catch (err) {
    handleGenerateError(err);
    hideLoading();
  }
}

function finishGenerate(quiz) {
  state.quizData = quiz;
  renderQuiz(quiz);
  document.getElementById('quiz-output').classList.add('hidden');
  document.getElementById('quiz-meta-bar').classList.add('hidden');
  stepResults.classList.remove('hidden');
  stepResults.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function handleGenerateError(err) {
  console.error(err);
  if (err.message === 'no_credits' || (err.message && err.message.includes('no_credits'))) {
    generateHint.textContent = '';
    window.renderCreditsBanner();
    window.showPricingModal('pro');
  } else if (err.status === 529 || err.status === 503 ||
             (err.message && err.message.includes('kelebihan beban'))) {
    generateHint.textContent = '⚠️ API Anthropic sedang sibuk. Tunggu 30 detik lalu coba lagi.';
  } else {
    generateHint.textContent = 'Error: ' + (err.message || 'Gagal membuat soal.');
  }
}

// ── State untuk deteksi soal di drill ──────────────────────────
const drillDetectState = {
  materialSummary: '',
  visualMapText: '',
  isQuestionMode: false,
  detectedQuestions: [],   // [{number, text, subject}]
  existingQuestions: [],
};

// ── Step 1 extract + deteksi ───────────────────────────────────
async function extractAndDetect() {
  const config = GRADE_CONFIG[state.settings.level] || GRADE_CONFIG['junior_high'];
  const levelLabel = `${config.label}, Grade ${state.settings.grade}`;
  const typeNames = {
    multiple_choice: 'Multiple Choice (4 options labeled A-D)',
    true_false: 'True / False',
    fill_blank: 'Fill in the Blank (use ___ for the blank)',
    short_answer: 'Short Answer / Essay'
  };
  const selectedTypes = state.settings.types.map(t => typeNames[t]).join(', ');
  const idToken = await window.getIdToken();

  // ── STEP 1: Extract content from images (batched) ──
  const BATCH_SIZE = 3;
  const batches = [];
  for (let i = 0; i < state.images.length; i += BATCH_SIZE) {
    batches.push(state.images.slice(i, i + BATCH_SIZE));
  }

  const extractPromptText = (batchNum, total) =>
    `Analyze these ${total > 1 ? `images (batch ${batchNum}/${total})` : 'images'} and output a JSON object per image.

For each image (index starting at 0 within this batch), output:
{
  "imageIndex": 0,
  "language": "id",
  "is_question_sheet": false,
  "existing_questions": [],
  "concepts": "key facts, terms, formulas from this page (max 200 words)",
  "visuals": [
    {
      "figureId": "Gambar 2.7",
      "description": "boy pushing container, arrows showing force directions",
      "x": 0.0, "y": 0.35, "w": 1.0, "h": 0.45
    }
  ]
}

Rules:
- is_question_sheet: set to TRUE if the image primarily contains exam/exercise questions (numbered questions, answer choices, fill-in-the-blank, essay prompts). Set FALSE if it is learning material, textbook content, notes, or explanatory text.
- existing_questions: if is_question_sheet is TRUE, extract each question you see as a brief string (e.g. ["2x + 3 = 7, find x", "What is photosynthesis?"]). Max 20 items. Empty array if is_question_sheet is FALSE.
- figureId: use the figure label if visible (e.g. "Gambar 2.7", "Figure 3"), else describe briefly
- x,y,w,h: fractions of image dimensions where the visual element is located (0.0–1.0). Be precise.
- Include ALL visible figures, photos, diagrams, illustrations, tables
- Output only valid JSON array, no markdown`;

  const summaries = [];
  const visualMap = []; // [{imageIndex (global), figureId, description, x, y, w, h}]
  let globalImageOffset = 0;
  let questionSheetCount = 0;
  let materialCount = 0;
  const existingQuestions = [];

  for (let b = 0; b < batches.length; b++) {
    showLoading(
      `Step 1/2: Reading images… (batch ${b + 1}/${batches.length})`,
      `Processing images ${b * BATCH_SIZE + 1}–${Math.min((b + 1) * BATCH_SIZE, state.images.length)} of ${state.images.length}`
    );

    const parts = [{ type: 'text', text: extractPromptText(b + 1, batches.length) }];
    batches[b].forEach(img => {
      parts.push({ type: 'image', source: { type: 'base64', media_type: img.mimeType, data: img.base64 } });
    });

    const extractRes = await fetchWithRetry('/api/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-id-token': idToken || '' },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2000,
        messages: [{ role: 'user', content: parts }]
      })
    });

    if (!extractRes.ok) {
      const err = await extractRes.json().catch(() => ({}));
      throw new Error(err?.error?.message || err?.error || `Extract error ${extractRes.status}`);
    }

    const extractData = await extractRes.json();
    const rawText = extractData.content.map(b => b.text || '').join('');

    // Try to parse structured JSON from extract
    try {
      const clean = rawText.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(clean);
      const arr = Array.isArray(parsed) ? parsed : [parsed];
      arr.forEach(imgData => {
        const globalIdx = globalImageOffset + (imgData.imageIndex || 0);
        summaries.push(`[Image ${globalIdx}] ${imgData.concepts || ''}`);
        // Track question sheet detection
        if (imgData.is_question_sheet) {
          questionSheetCount++;
          (imgData.existing_questions || []).forEach(q => existingQuestions.push(q));
        } else {
          materialCount++;
        }
        (imgData.visuals || []).forEach(v => {
          visualMap.push({
            img: globalIdx,
            figureId: v.figureId || '',
            description: v.description || '',
            x: v.x ?? 0, y: v.y ?? 0,
            w: v.w ?? 1, h: v.h ?? 0.5
          });
        });
      });
    } catch(e) {
      // Fallback: treat as plain text
      summaries.push(rawText);
    }
    globalImageOffset += batches[b].length;
  }

  // Build visual map string for generate prompt
  const visualMapText = visualMap.length > 0
    ? '\nVISUAL MAP (use these for imageCrop):\n' +
      visualMap.map((v, i) =>
        `  [${i}] img:${v.img} figureId:"${v.figureId}" desc:"${v.description}" x:${v.x} y:${v.y} w:${v.w} h:${v.h}`
      ).join('\n')
    : '';

  const materialSummary = summaries.join('\n\n') + visualMapText;

  // ── Simpan hasil extract ke drillDetectState ───
  const totalImages = state.images.length;
  const isQuestionMode = questionSheetCount > materialCount;

  drillDetectState.materialSummary = materialSummary;
  drillDetectState.visualMapText = visualMapText;
  drillDetectState.isQuestionMode = isQuestionMode;
  drillDetectState.existingQuestions = existingQuestions;

  // ── Kalau terdeteksi soal: tampilkan detection card, bukan langsung generate ───
  if (isQuestionMode) {
    hideLoading();
    showDetectCard(questionSheetCount, totalImages, existingQuestions);
    return;
  }

  // ── Materi biasa: langsung ke Step 2 generate ───
  showLoading('Langkah 2/2: Membuat soal…', 'Membuat ' + state.settings.numQuestions + ' soal dari konten yang diekstrak…');
  try {
    const quiz = await generateFromExtracted();
    finishGenerate(quiz);
  } catch(err) {
    handleGenerateError(err);
  } finally {
    hideLoading();
  }
}

// ── Tampilkan detection card ───────────────────────────────────
function showDetectCard(questionSheetCount, totalImages, existingQuestions) {
  const desc = questionSheetCount === totalImages
    ? `AI mendeteksi ${totalImages} foto berisi kumpulan soal. Pilih apa yang ingin kamu lakukan:`
    : `AI mendeteksi ${questionSheetCount} dari ${totalImages} foto berisi kumpulan soal. Pilih apa yang ingin kamu lakukan:`;
  document.getElementById('detect-desc').textContent = desc;
  document.getElementById('step-detect').classList.remove('hidden');
  document.getElementById('step-detect').scrollIntoView({ behavior: 'smooth', block: 'start' });
  document.getElementById('step-detect-bantai').classList.add('hidden');
}

// ── Handler tombol Variasi Soal ────────────────────────────────
document.getElementById('detect-btn-variasi').addEventListener('click', async () => {
  document.getElementById('step-detect').classList.add('hidden');
  document.getElementById('step-detect-bantai').classList.add('hidden');
  // Force variation mode then generate
  drillDetectState.isQuestionMode = true;
  showLoading('Membuat variasi soal…', 'Menghasilkan soal dengan konsep serupa…');
  try {
    const quiz = await generateVariasiSoal();
    finishGenerate(quiz);
  } catch(err) {
    handleGenerateError(err);
  } finally {
    hideLoading();
  }
});

// ── Handler tombol Bantai dari Drill ──────────────────────────
document.getElementById('detect-btn-bantai').addEventListener('click', () => {
  document.getElementById('step-detect').classList.add('hidden');
  // Ambil daftar soal dari drillDetectState.existingQuestions
  const qs = drillDetectState.existingQuestions.map((text, i) => ({
    number: i + 1,
    text,
    subject: ''
  }));
  if (qs.length === 0) {
    // Kalau tidak ada soal terdetail, fallback ke bantai manual
    document.getElementById('detect-bantai-desc').textContent =
      'Tidak ada soal spesifik terdeteksi. Gunakan fitur Bantai Soal di tab terpisah.';
    document.getElementById('step-detect-bantai').classList.remove('hidden');
    document.getElementById('detect-bantai-list').innerHTML =
      '<p style="color:var(--ink-muted);font-size:0.9rem;padding:16px 0">Pindah ke tab <strong>Bantai Soal</strong> dan upload foto yang sama untuk pembahasan detail.</p>';
    return;
  }
  renderDetectBantaiPick(qs);
});

// ── Handler tombol Ignore (generate biasa) ─────────────────────
document.getElementById('detect-btn-ignore').addEventListener('click', async () => {
  document.getElementById('step-detect').classList.add('hidden');
  document.getElementById('step-detect-bantai').classList.add('hidden');
  // Force material mode
  drillDetectState.isQuestionMode = false;
  showLoading('Langkah 2/2: Membuat soal…', 'Membuat soal dari konten yang diekstrak…');
  try {
    const quiz = await generateFromExtracted();
    finishGenerate(quiz);
  } catch(err) {
    handleGenerateError(err);
  } finally {
    hideLoading();
  }
});

// ── Render daftar soal untuk bantai inline ─────────────────────
function renderDetectBantaiPick(questions) {
  const MAX_PICK = 3;
  let html = '';
  questions.forEach((q, i) => {
    html += `
      <label class="bantai-pick-item" id="detect-pick-wrap-${i}">
        <input type="checkbox" class="detect-pick-cb" value="${i}"
          onchange="window.updateDetectPickCount()"
          ${questions.length === 1 ? 'checked' : ''} />
        <div class="bantai-pick-body">
          <span class="bantai-pick-num">Soal ${q.number}</span>
          ${q.subject ? '<span class="bantai-pick-subject">' + escapeHtml(q.subject) + '</span>' : ''}
          <p class="bantai-pick-text">${escapeHtml(q.text)}</p>
        </div>
      </label>`;
  });
  document.getElementById('detect-bantai-list').innerHTML = html;
  document.getElementById('detect-bantai-desc').textContent =
    questions.length === 1
      ? '1 soal ditemukan. Langsung klik Bantai!'
      : questions.length + ' soal ditemukan. Pilih maks. ' + MAX_PICK + ' soal yang ingin dibantai.';
  document.getElementById('step-detect-bantai').classList.remove('hidden');
  document.getElementById('step-detect-bantai').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

window.updateDetectPickCount = function() {
  const MAX_PICK = 3;
  const cbs = [...document.querySelectorAll('.detect-pick-cb')];
  const count = cbs.filter(cb => cb.checked).length;
  cbs.forEach(cb => {
    if (!cb.checked) {
      cb.disabled = count >= MAX_PICK;
      cb.closest('label').classList.toggle('bantai-pick-disabled', count >= MAX_PICK);
    } else {
      cb.disabled = false;
      cb.closest('label').classList.remove('bantai-pick-disabled');
    }
  });
  const hint = document.getElementById('detect-bantai-hint');
  hint.textContent = count >= MAX_PICK ? 'Maksimal ' + MAX_PICK + ' soal sudah dipilih.' : '';
};

// ── Bantai soal yang dipilih dari drill detect ─────────────────
document.getElementById('detect-btn-bantai-solve').addEventListener('click', async () => {
  const cbs = [...document.querySelectorAll('.detect-pick-cb:checked')];
  if (cbs.length === 0) {
    document.getElementById('detect-bantai-hint').textContent = 'Pilih minimal 1 soal.';
    return;
  }

  const credits = window._currentCredits ?? 0;
  const isInvited = window._isInvited ?? false;
  if (!isInvited && credits <= 0) {
    window.renderCreditsBanner?.();
    window.showPricingModal?.('pro');
    return;
  }

  const allQs = drillDetectState.existingQuestions.map((text, i) => ({ number: i+1, text, subject: '' }));
  const selectedQs = cbs.map(cb => allQs[parseInt(cb.value)]);

  document.getElementById('detect-bantai-hint').textContent = '';
  showLoading('Membantai ' + selectedQs.length + ' soal…', 'AI sedang mengerjakan pembahasan…');

  try {
    const idToken = await window.getIdToken();
    const qListText = selectedQs.map(q => 'Soal ' + q.number + ': "' + q.text + '"').join('\n');

    const solvePrompt = `Kamu adalah guru ahli yang sangat teliti. Seorang siswa meminta pembahasan untuk soal-soal berikut yang diambil dari lembar soal yang dilampirkan.

SOAL YANG PERLU DIBANTAI (${selectedQs.length} soal):
${qListText}

PERINGATAN KERAS:
1. JANGAN menebak jawaban dari pilihan yang tersedia. Hitung dari awal menggunakan rumus dan logika yang benar.
2. WAJIB tulis setiap langkah perhitungan secara eksplisit — tidak boleh ada lompatan langkah.
3. Untuk soal dengan sistem pertidaksamaan atau irisan himpunan: tentukan irisan dengan benar.

Jawab HANYA dalam JSON valid (tanpa markdown), berupa array:
[
  {
    "question_number": 1,
    "question_text": "Teks lengkap soal (salin dari foto secara lengkap)",
    "subject": "Mata pelajaran",
    "difficulty": "Mudah / Sedang / Sulit",
    "answer": "Jawaban akhir: tulis opsi HURUF + nilainya jika ada pilihan",
    "steps": [{"label": "Judul langkah", "content": "Penjelasan detail dengan perhitungan eksplisit"}],
    "key_concepts": ["Konsep kunci 1", "Konsep kunci 2"],
    "tips": "2-3 tips praktis.",
    "language": "id"
  }
]

ATURAN: Steps minimal 4. Untuk pilihan ganda: verifikasi dan jelaskan mengapa pilihan lain salah. Output hanya JSON array.`;

    const maxTok = Math.min(4500, selectedQs.length * 1400 + 400);

    // Gunakan gambar dari state.images (foto yang diupload user)
    const imgParts = state.images.slice(0, 3).map(img => ({
      type: 'image',
      source: { type: 'base64', media_type: img.mimeType, data: img.base64 }
    }));

    const res = await fetchWithRetry('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-id-token': idToken || '' },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: maxTok,
        messages: [{ role: 'user', content: [...imgParts, { type: 'text', text: solvePrompt }] }]
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      if (res.status === 403 && err?.error === 'no_credits') { window.renderCreditsBanner?.(); window.showPricingModal?.('pro'); return; }
      throw new Error(err?.error?.message || err?.error || 'Error ' + res.status);
    }

    const data = await res.json();
    if (typeof data._credits === 'number') { window._currentCredits = data._credits; window.renderCreditsBanner?.(); }

    const rawText = (data.content || []).map(b => b.text || '').join('');
    const clean = rawText.replace(/\`\`\`json|\`\`\`/g, '').trim();
    let result;
    try { const p = JSON.parse(clean); result = Array.isArray(p) ? p : [p]; }
    catch(e) { throw new Error('Format respons tidak valid. Coba lagi.'); }

    // Tampilkan hasil di bantai soal section
    document.getElementById('step-detect-bantai').classList.add('hidden');

    // Switch ke tab bantai dan render hasilnya
    window.switchAppMode('bantai');
    bantaiState.image = state.images[0] || null;
    if (bantaiState.image && bantaiPreviewImg) {
      bantaiPreviewImg.src = bantaiState.image.dataUrl;
      bantaiPreviewWrap.classList.remove('hidden');
    }
    renderBantaiResult(result);

  } catch(err) {
    console.error('Detect bantai error:', err);
    document.getElementById('detect-bantai-hint').textContent = 'Error: ' + (err.message || 'Gagal. Coba lagi.');
  } finally {
    hideLoading();
  }
});

// ── Generate variasi soal (dipanggil dari detect card) ─────────
async function generateVariasiSoal() {
  const { materialSummary, existingQuestions } = drillDetectState;
  const config = GRADE_CONFIG[state.settings.level] || GRADE_CONFIG['junior_high'];
  const levelLabel = config.label + ', Grade ' + state.settings.grade;
  const typeNames = {
    multiple_choice: 'Multiple Choice (4 options labeled A-D)',
    true_false: 'True / False',
    fill_blank: 'Fill in the Blank (use ___ for the blank)',
    short_answer: 'Short Answer / Essay'
  };
  const selectedTypes = state.settings.types.map(t => typeNames[t]).join(', ');
  const idToken = await window.getIdToken();

  const existingQList = existingQuestions.length > 0
    ? '\n\nSOAL ASLI YANG TERDETEKSI:\n' + existingQuestions.map((q, i) => (i+1) + '. ' + q).join('\n')
    : '';

  const quizPrompt = `You are an expert teacher. The student has uploaded images of an exam or exercise sheet containing questions. Your task is NOT to create new questions about the topic — instead, create VARIATIONS of the existing questions with changed values, names, or contexts, keeping the same concepts and difficulty.

EXTRACTED CONTENT FROM QUESTION SHEET:
${materialSummary}${existingQList}

STUDENT LEVEL: ${levelLabel}
NUMBER OF VARIATION QUESTIONS: ${state.settings.numQuestions}
QUESTION TYPES TO USE: ${selectedTypes}

INSTRUCTIONS FOR VARIATION MODE:
1. Generate exactly ${state.settings.numQuestions} variation questions.
2. Each variation must test the SAME concept/skill as the original questions but with DIFFERENT values, numbers, names, or contexts.
3. Do NOT copy the original questions. Do NOT simply restate them.
4. Distribute question types as evenly as possible: ${selectedTypes}
5. Use the SAME LANGUAGE as the original questions (Bahasa Indonesia or English).
   - For true_false in Bahasa Indonesia: answer must be exactly "Benar" or "Salah"
   - For true_false in English: answer must be exactly "True" or "False"
6. Adjust difficulty appropriately for: ${levelLabel}
7. For multiple choice: exactly 4 options labeled A, B, C, D.
8. EXPLANATION: Write 2-4 sentences explaining the solution method. Start by stating the correct answer value, then explain how to get there.
9. Set imageCrop to null and svg to null for all questions.

CRITICAL — ANSWER VERIFICATION (wajib sebelum output):
For EVERY multiple choice question, before writing the JSON:
1. Solve the question yourself from scratch using the correct method.
2. Confirm which option (A/B/C/D) matches your calculated answer.
3. If your answer does not match any option, fix either the question or the options so the correct answer is included.
4. NEVER set "answer" to an option that is mathematically or factually wrong.
5. For math/algebra: show your working mentally — if the result is a constant (no variable), make sure the correct option is a constant, not an expression with a variable.

Respond ONLY with valid JSON, no markdown:
{"subject":"...","language":"...","mode":"variation","questions":[{"number":1,"type":"multiple_choice","question":"...","options":["A. ...","B. ...","C. ...","D. ..."],"answer":"A. ...","explanation":"...","svg":null,"imageCrop":null}]}`;

  const dynamicTokens = Math.min(12000, Math.max(4000, state.settings.numQuestions * 450));
  const generateRes = await fetchWithRetry('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-id-token': idToken || '' },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: dynamicTokens,
      messages: [{ role: 'user', content: quizPrompt }]
    })
  });

  if (!generateRes.ok) {
    const err = await generateRes.json().catch(() => ({}));
    if (generateRes.status === 403 && err?.error === 'no_credits') throw new Error('no_credits');
    throw new Error(err?.error?.message || err?.error || 'Generate error ' + generateRes.status);
  }

  const data = await generateRes.json();
  if (data.questions) {
    data.questions = data.questions.map(q => ({ ...q, svg: null, imageCrop: null }));
  }
  if (typeof data._credits === 'number') {
    window._currentCredits = data._credits;
    window.renderCreditsBanner();
  }

  const rawText = data.content.map(b => b.text || '').join('');
  const clean = rawText.replace(/```json|```/g, '').trim();
  return JSON.parse(clean);
}

// ── Generate dari materi (non-soal) ───────────────────────────
async function generateFromExtracted() {
  const { materialSummary } = drillDetectState;
  const config = GRADE_CONFIG[state.settings.level] || GRADE_CONFIG['junior_high'];
  const levelLabel = config.label + ', Grade ' + state.settings.grade;
  const typeNames = {
    multiple_choice: 'Multiple Choice (4 options labeled A-D)',
    true_false: 'True / False',
    fill_blank: 'Fill in the Blank (use ___ for the blank)',
    short_answer: 'Short Answer / Essay'
  };
  const selectedTypes = state.settings.types.map(t => typeNames[t]).join(', ');
  const idToken = await window.getIdToken();

  const quizPrompt = `You are an expert teacher creating quiz questions from the following learning material summary.

MATERIAL SUMMARY:
${materialSummary}

STUDENT LEVEL: ${levelLabel}
NUMBER OF QUESTIONS: ${state.settings.numQuestions}
QUESTION TYPES TO USE: ${selectedTypes}

INSTRUCTIONS:
1. Generate exactly ${state.settings.numQuestions} questions based ONLY on the material above.
2. Distribute question types as evenly as possible across: ${selectedTypes}
3. Detect the language from the BODY TEXT of the material (not the title). Use that language for all questions and answers.
   - For true_false in Bahasa Indonesia: answer must be exactly "Benar" or "Salah"
   - For true_false in English: answer must be exactly "True" or "False"
4. Adjust difficulty appropriately for: ${levelLabel}
5. For multiple choice: exactly 4 options labeled A, B, C, D.
6. For fill in blank: replace key terms with ___.
7. For short answer: ask open-ended questions about main concepts.
8. EXPLANATION: Write a comprehensive 2-4 sentence explanation for every question. Begin by stating the correct answer explicitly, then explain the reasoning step by step.

CRITICAL — ANSWER VERIFICATION (wajib sebelum output):
For EVERY multiple choice question, before writing the JSON:
1. Solve the question yourself from scratch using the correct method.
2. Confirm which option (A/B/C/D) matches your calculated answer.
3. If your answer does not match any option, fix either the question or the options so the correct answer is included.
4. NEVER set "answer" to an option that is mathematically or factually wrong.
5. For math/algebra: show your working mentally — if the result is a constant (no variable), make sure the correct option is a constant, not an expression with a variable.

IMAGE CROP INSTRUCTIONS:
- The VISUAL MAP above lists all figures detected in the uploaded images with their exact positions.
- For up to 3 questions, set "imageCrop" by matching the question to the most relevant figure in the VISUAL MAP.
- Copy x, y, w, h values exactly from the matching VISUAL MAP entry. Use the img index as-is.
- Format: {"img": <img>, "x": <x>, "y": <y>, "w": <w>, "h": <h>}
- Set imageCrop to null if no matching visual exists. Set svg to null for all questions.

Respond ONLY with valid JSON, no markdown:
{"subject":"...","language":"...","questions":[{"number":1,"type":"multiple_choice","question":"...","options":["A. ...","B. ...","C. ...","D. ..."],"answer":"A. ...","explanation":"...","svg":null,"imageCrop":{"img":0,"x":0.0,"y":0.1,"w":1.0,"h":0.4}}]}`;

  const dynamicTokens = Math.min(12000, Math.max(4000, state.settings.numQuestions * 450));
  const generateRes = await fetchWithRetry('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-id-token': idToken || '' },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: dynamicTokens,
      messages: [{ role: 'user', content: quizPrompt }]
    })
  });

  if (!generateRes.ok) {
    const err = await generateRes.json().catch(() => ({}));
    if (generateRes.status === 403 && err?.error === 'no_credits') throw new Error('no_credits');
    throw new Error(err?.error?.message || err?.error || 'Generate error ' + generateRes.status);
  }

  const data = await generateRes.json();
  if (data.questions) {
    data.questions = data.questions.map(q => ({
      ...q,
      svg: (q.svg && typeof q.svg === 'string' && q.svg.trim().startsWith('<')) ? q.svg : null,
      imageCrop: (q.imageCrop && typeof q.imageCrop === 'object' && typeof q.imageCrop.img === 'number') ? q.imageCrop : null
    }));
  }
  if (typeof data._credits === 'number') {
    window._currentCredits = data._credits;
    window.renderCreditsBanner();
  }

  const rawText = data.content.map(b => b.text || '').join('');
  const clean = rawText.replace(/```json|```/g, '').trim();
  try {
    return JSON.parse(clean);
  } catch(e) {
    // Coba recovery: tutup struktur JSON yang terpotong
    try {
      let attempt = clean.replace(/,\s*$/, '');
      // Tutup string yang terbuka
      attempt = attempt.replace(/"([^"\\]|\\.)*$/, '"');
      // Hitung kurung yang belum ditutup
      const opens = (attempt.match(/\[/g)||[]).length - (attempt.match(/\]/g)||[]).length;
      const openB = (attempt.match(/\{/g)||[]).length - (attempt.match(/\}/g)||[]).length;
      attempt += ']'.repeat(Math.max(0, opens)) + '}'.repeat(Math.max(0, openB));
      const recovered = JSON.parse(attempt);
      // Pastikan ada soal yang berhasil di-recover
      if (recovered?.questions?.length > 0) return recovered;
    } catch(_) {}
    throw new Error('Respons terpotong — coba kurangi jumlah soal atau upload lebih sedikit gambar.');
  }
}


// ── Render Quiz ────────────────────────────
function renderQuiz(quiz) {
  const config = GRADE_CONFIG[state.settings.level] || GRADE_CONFIG['junior_high'];
  const gradeLabel = state.mode === 'topic'
    ? `📚 ${state.topic.jenjang} · ${state.topic.mapel}`
    : `${config.emoji} ${config.label} · Grade ${state.settings.grade}`;
  const variationLabel = quiz.mode === 'variation' ? ' · 🔀 Variasi Soal' : '';
  quizMetaText.textContent = `${quiz.subject || 'Quiz'} · ${gradeLabel} · ${quiz.questions?.length || 0} soal${variationLabel}`;

  let html = '';
  if (!quiz.questions || !Array.isArray(quiz.questions)) {
    throw new Error('Data soal tidak valid.');
  }
  quiz.questions.forEach((q, i) => {
    const typeLabelMap = {
      multiple_choice: 'Multiple Choice',
      true_false: 'True / False',
      fill_blank: 'Fill in the Blank',
      short_answer: 'Short Answer'
    };
    const typeLabel = typeLabelMap[q.type] || q.type;

    // SVG diagram block
    const svgBlock = q.svg
      ? `<div class="q-diagram">${q.svg}</div>`
      : '';

    let body = '';
    if (q.type === 'multiple_choice' && q.options.length) {
      const optHtml = q.options.map(o => `<li>${o}</li>`).join('');
      body = `<p class="q-text">${q.question}</p>${svgBlock}<ul class="q-options">${optHtml}</ul>`;
    } else if (q.type === 'true_false') {
      const tfA = (q.answer || '').toLowerCase();
      const tfOpts = (tfA === 'benar' || tfA === 'salah') ? ['Benar', 'Salah'] : ['True', 'False'];
      body = `<p class="q-text">${q.question}</p>${svgBlock}<ul class="q-options"><li>A. ${tfOpts[0]}</li><li>B. ${tfOpts[1]}</li></ul>`;
    } else if (q.type === 'fill_blank') {
      const rendered = q.question.replace(/___/g, '<span class="q-blank-line"></span>');
      body = `<p class="q-text">${rendered}</p>${svgBlock}`;
    } else {
      body = `<p class="q-text">${q.question}</p>${svgBlock}<p class="q-essay-hint">Jawab dalam 2–4 kalimat.</p>`;
    }

    html += `
      <div class="quiz-question" style="animation-delay:${i * 0.04}s">
        <div>
          <span class="q-number">Question ${q.number}</span>
          <span class="q-type-badge">${typeLabel}</span>
        </div>
        ${body}
      </div>`;
  });

  let akHtml = `
    <div class="answer-key-section">
      <div class="answer-key-title">🗝 Answer Key</div>
      <ul class="answer-key-list">`;
  quiz.questions.forEach(q => {
    akHtml += `<li><strong>Q${q.number}.</strong> ${q.answer}</li>`;
  });
  akHtml += '</ul></div>';

  quizOutput.innerHTML = html + akHtml;
}

// ── PDF Download ───────────────────────────
btnPdf.addEventListener('click', () => {
  if (!state.quizData) return;
  // Reveal quiz preview before downloading
  document.getElementById('quiz-output').classList.remove('hidden');
  document.getElementById('quiz-meta-bar').classList.remove('hidden');
  generatePDF(state.quizData);
});

// ── Interactive Quiz ────────────────────────
btnInteractive.addEventListener('click', () => {
  if (!state.quizData) return;
  startInteractiveQuiz(state.quizData);
});

function generatePDF(quiz) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const pageW = 210, pageH = 297, margin = 18;
  const contentW = pageW - margin * 2;
  let y = margin;

  const colors = {
    ink: [26, 18, 8], teal: [26, 122, 110], amber: [232, 160, 32],
    muted: [138, 122, 104], lineBg: [212, 201, 184]
  };

  function setFont(size, style = 'normal', color = colors.ink) {
    doc.setFontSize(size);
    doc.setFont('helvetica', style);
    doc.setTextColor(...color);
  }

  function checkPageBreak(needed = 20) {
    if (y + needed > pageH - margin) {
      doc.addPage(); y = margin; drawPageHeader();
    }
  }

  function drawPageHeader() {
    doc.setFillColor(253, 248, 240);
    doc.rect(0, 0, pageW, 12, 'F');
    setFont(7, 'bold', colors.muted);
    doc.text('DrillSoal', margin, 8);
    doc.text(`${quiz.subject || 'Quiz'} · ${quiz.language || ''}`, pageW - margin, 8, { align: 'right' });
    doc.setDrawColor(...colors.lineBg);
    doc.setLineWidth(0.4);
    doc.line(margin, 10, pageW - margin, 10);
  }

  // Cover header
  doc.setFillColor(...colors.teal);
  doc.rect(0, 0, pageW, 18, 'F');
  doc.setFillColor(...colors.amber);
  doc.rect(0, 16, pageW, 3, 'F');

  y = 26;
  setFont(20, 'bold', colors.ink);
  doc.text(quiz.subject || 'Quiz', margin, y);
  y += 8;

  const config = GRADE_CONFIG[state.settings.level] || GRADE_CONFIG['junior_high'];
  const gradeLabel = state.mode === 'topic'
    ? `${state.topic.jenjang} · ${state.topic.mapel}`
    : `${config.label} · Grade ${state.settings.grade}`;
  setFont(10, 'normal', colors.muted);
  doc.text(`${gradeLabel} · ${quiz.questions?.length || 0} Questions · ${quiz.language || ''}`, margin, y);
  y += 10;

  // Student info box
  doc.setFillColor(245, 240, 232);
  doc.roundedRect(margin, y, contentW, 16, 3, 3, 'F');
  y += 5;
  setFont(9, 'normal', colors.muted);
  const nameText = state.settings.studentName ? `Name: ${state.settings.studentName}` : 'Name: ___________________________';
  const dateStr = state.settings.date
    ? new Date(state.settings.date + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
    : '___________________';
  doc.text(nameText, margin + 6, y + 2);
  doc.text(`Date: ${dateStr}`, pageW / 2, y + 2);
  y += 16;

  doc.setDrawColor(...colors.lineBg);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageW - margin, y);
  y += 8;

  const typeLabelMap = {
    multiple_choice: 'Multiple Choice', true_false: 'True / False',
    fill_blank: 'Fill in the Blank', short_answer: 'Short Answer'
  };

  // Questions
  quiz.questions.forEach((q, i) => {
    checkPageBreak(30);
    doc.setFillColor(i % 2 === 0 ? 232 : 26, i % 2 === 0 ? 160 : 122, i % 2 === 0 ? 32 : 110);
    doc.roundedRect(margin, y, 18, 6, 2, 2, 'F');
    doc.setFontSize(7); doc.setFont('helvetica', 'bold'); doc.setTextColor(255, 255, 255);
    doc.text(`Q${q.number}`, margin + 9, y + 4.2, { align: 'center' });

    const typeLabel = typeLabelMap[q.type] || q.type;
    setFont(7, 'normal', colors.muted);
    doc.text(typeLabel, margin + 22, y + 4);
    y += 9;

    setFont(10, 'bold', colors.ink);
    const qLines = doc.splitTextToSize(q.question, contentW);
    checkPageBreak(qLines.length * 5 + 12);
    doc.text(qLines, margin, y);
    y += qLines.length * 5 + 3;

    // Embed SVG diagram as rendered image in PDF
    if (q.svg) {
      try {
        const svgBlob = new Blob([q.svg], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(svgBlob);
        // Render SVG to canvas synchronously via a pre-drawn image
        // We'll add a placeholder note since async isn't ideal in sync PDF generation
        // Instead, draw a simple inline representation using jsPDF shapes
        drawSVGShapesPDF(doc, q.svg, margin, y, contentW, colors);
        y += 46;
        URL.revokeObjectURL(url);
      } catch(e) {
        // Skip diagram on error
      }
    }

    if (q.type === 'multiple_choice' && q.options.length) {
      q.options.forEach(opt => {
        checkPageBreak(8);
        setFont(9.5, 'normal', [60, 50, 38]);
        const oLines = doc.splitTextToSize(opt, contentW - 8);
        doc.text(oLines, margin + 6, y);
        y += oLines.length * 5 + 1;
      });
      y += 2;
    } else if (q.type === 'true_false') {
      setFont(9.5, 'normal', [60, 50, 38]);
      const tfAns = (q.answer || '').toLowerCase();
      const tfLabel = (tfAns === 'benar' || tfAns === 'salah') ? 'A. Benar          B. Salah' : 'A. True          B. False';
      doc.text(tfLabel, margin + 6, y);
      y += 7;
    } else if (q.type === 'short_answer') {
      checkPageBreak(22);
      for (let l = 0; l < 3; l++) {
        doc.setDrawColor(...colors.lineBg); doc.setLineWidth(0.4);
        doc.line(margin, y + 4, pageW - margin, y + 4);
        y += 7;
      }
      y += 2;
    }
    y += 4;
    if (i < quiz.questions.length - 1) {
      doc.setDrawColor(225, 215, 200); doc.setLineWidth(0.3);
      doc.line(margin + 10, y, pageW - margin - 10, y);
      y += 5;
    }
  });

  // Answer Key page
  doc.addPage(); y = margin;
  doc.setFillColor(...colors.ink);
  doc.rect(0, 0, pageW, 18, 'F');
  setFont(13, 'bold', [255, 255, 255]);
  doc.text('Answer Key', margin, 12);
  setFont(8, 'normal', [180, 170, 160]);
  doc.text(`${quiz.subject || 'Quiz'} - for teacher use only`, pageW - margin, 12, { align: 'right' });

  y = 26;
  setFont(9, 'normal', colors.muted);
  doc.text(`Generated by DrillSoal  -  ${new Date().toLocaleDateString()}`, margin, y);
  y += 8;
  doc.setDrawColor(...colors.lineBg); doc.setLineWidth(0.5);
  doc.line(margin, y, pageW - margin, y);
  y += 6;

  quiz.questions.forEach((q, i) => {
    checkPageBreak(14);
    doc.setFillColor(i % 2 === 0 ? 245 : 250, i % 2 === 0 ? 240 : 248, i % 2 === 0 ? 232 : 244);
    doc.roundedRect(margin, y - 1, contentW, 10, 2, 2, 'F');
    setFont(9, 'bold', colors.teal);
    doc.text(`Q${q.number}.`, margin + 4, y + 6);
    setFont(9, 'normal', colors.ink);
    const ansLines = doc.splitTextToSize(q.answer, contentW - 20);
    doc.text(ansLines, margin + 14, y + 6);
    y += Math.max(ansLines.length * 5.5, 12) + 2;
  });

  const totalPages = doc.internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    setFont(7, 'normal', colors.muted);
    doc.text(`${p} / ${totalPages}`, pageW - margin, pageH - 8, { align: 'right' });
  }

  const filename = `${(quiz.subject || 'quiz').replace(/\s+/g, '_').toLowerCase()}_grade${state.settings.grade}_quiz.pdf`;
  doc.save(filename);
}

// ── SVG → PDF shapes (basic parser) ────────
function drawSVGShapesPDF(doc, svgStr, x, y, maxW, colors) {
  // Draw a light box as diagram placeholder with note
  doc.setFillColor(240, 248, 245);
  doc.setDrawColor(...colors.teal);
  doc.setLineWidth(0.5);
  doc.roundedRect(x, y, maxW, 40, 3, 3, 'FD');

  // Parse and draw basic SVG shapes
  try {
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgStr, 'image/svg+xml');
    const svgEl = svgDoc.querySelector('svg');
    if (!svgEl) return;

    const vbW = 200, vbH = 150;
    const scaleX = (maxW - 10) / vbW;
    const scaleY = 38 / vbH;
    const sc = Math.min(scaleX, scaleY);
    const offX = x + 5;
    const offY = y + 1;

    svgEl.querySelectorAll('rect').forEach(el => {
      const rx = parseFloat(el.getAttribute('x') || 0) * sc + offX;
      const ry = parseFloat(el.getAttribute('y') || 0) * sc + offY;
      const rw = parseFloat(el.getAttribute('width') || 0) * sc;
      const rh = parseFloat(el.getAttribute('height') || 0) * sc;
      const fill = el.getAttribute('fill');
      if (fill && fill !== 'none') doc.setFillColor(254, 243, 208);
      doc.setDrawColor(...colors.teal);
      doc.setLineWidth(0.6);
      doc.rect(rx, ry, rw, rh, fill && fill !== 'none' ? 'FD' : 'D');
    });

    svgEl.querySelectorAll('circle').forEach(el => {
      const cx = parseFloat(el.getAttribute('cx') || 0) * sc + offX;
      const cy = parseFloat(el.getAttribute('cy') || 0) * sc + offY;
      const r = parseFloat(el.getAttribute('r') || 0) * sc;
      doc.setDrawColor(...colors.teal);
      doc.circle(cx, cy, r, 'D');
    });

    svgEl.querySelectorAll('line').forEach(el => {
      const x1 = parseFloat(el.getAttribute('x1') || 0) * sc + offX;
      const y1 = parseFloat(el.getAttribute('y1') || 0) * sc + offY;
      const x2 = parseFloat(el.getAttribute('x2') || 0) * sc + offX;
      const y2 = parseFloat(el.getAttribute('y2') || 0) * sc + offY;
      doc.setDrawColor(...colors.teal);
      doc.line(x1, y1, x2, y2);
    });

    svgEl.querySelectorAll('text').forEach(el => {
      const tx = parseFloat(el.getAttribute('x') || 0) * sc + offX;
      const ty = parseFloat(el.getAttribute('y') || 0) * sc + offY;
      doc.setFontSize(6); doc.setFont('helvetica', 'normal');
      doc.setTextColor(...colors.ink);
      doc.text(el.textContent || '', tx, ty);
    });

    svgEl.querySelectorAll('polygon').forEach(el => {
      const pts = (el.getAttribute('points') || '').trim().split(/\s+|,/).map(Number);
      if (pts.length >= 4) {
        const coords = [];
        for (let i = 0; i < pts.length - 1; i += 2) {
          coords.push([pts[i] * sc + offX, pts[i+1] * sc + offY]);
        }
        doc.setDrawColor(...colors.teal); doc.setLineWidth(0.6);
        for (let i = 0; i < coords.length; i++) {
          const next = coords[(i + 1) % coords.length];
          doc.line(coords[i][0], coords[i][1], next[0], next[1]);
        }
      }
    });
  } catch(e) { /* silently skip */ }
}

// ── New Quiz ───────────────────────────────
btnNew.addEventListener('click', () => {
  // Reset quiz output visibility for next generation
  document.getElementById('quiz-output').classList.add('hidden');
  document.getElementById('quiz-meta-bar').classList.add('hidden');
  state.images = [];
  state.quizData = null;
  imagePreviewGrid.innerHTML = '';
  quizOutput.innerHTML = '';
  stepResults.classList.add('hidden');
  generateHint.textContent = '';
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// ── Loading Helpers ────────────────────────
function showLoading(msg = 'Generating…', sub = 'This may take a few seconds') {
  loadingText.textContent = msg;
  loadingSub.textContent = sub;
  loadingOverlay.classList.remove('hidden');
  btnGenerate.disabled = true;
}
function hideLoading() {
  loadingOverlay.classList.add('hidden');
  btnGenerate.disabled = false;
}

// ══════════════════════════════════════════════
//  INTERACTIVE QUIZ MODE
// ══════════════════════════════════════════════

function startInteractiveQuiz(quiz) {
  const overlay = document.getElementById('interactive-overlay');
  const container = document.getElementById('interactive-container');
  overlay.classList.remove('hidden');
  document.body.style.overflow = 'hidden';

  // Render all questions interactively
  let html = `
    <div class="iq-header">
      <div class="iq-title">📝 ${quiz.subject || 'Interactive Quiz'}</div>
      <div class="iq-meta">${quiz.questions.length} questions · Answer all then submit</div>
    </div>
    <div class="iq-questions">`;

  quiz.questions.forEach((q, i) => {
    html += renderInteractiveQuestion(q, i);
  });

  html += `</div>
    <div class="iq-submit-wrap">
      <button class="iq-btn-submit" id="iq-submit">Kumpulkan Soal ⚡</button>
      <p class="iq-submit-hint" id="iq-submit-hint"></p>
    </div>`;

  container.innerHTML = html;

  // Async-load all cropped image placeholders
  quiz.questions.forEach((q, i) => {
    if (q.imageCrop && typeof q.imageCrop === 'object' && typeof q.imageCrop.img === 'number') {
      const el = document.getElementById('crop-' + i);
      if (el) {
        cropImageFromState(q.imageCrop, function(dataUrl) {
          el.innerHTML = dataUrl
            ? '<img src="' + dataUrl + '" alt="Referensi materi" />'
            : '';
        });
      }
    }
  });

  // Submit handler
  document.getElementById('iq-submit').addEventListener('click', () => {
    submitInteractiveQuiz(quiz);
  });

  // Close button
  document.getElementById('iq-close').addEventListener('click', closeInteractiveQuiz);
}

// ── Crop image using Canvas API ───────────────
function cropImageFromState(imageCrop, callback) {
  try {
    const { img, x, y, w, h } = imageCrop;
    const src = state.images[img]?.dataUrl;
    if (!src) { callback(null); return; }

    const image = new Image();
    image.onload = function() {
      try {
        const canvas = document.createElement('canvas');
        const displayW = 360;
        const displayH = Math.round(displayW * (h / w));
        canvas.width = displayW;
        canvas.height = Math.max(displayH, 20);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(image,
          x * image.naturalWidth,
          y * image.naturalHeight,
          w * image.naturalWidth,
          h * image.naturalHeight,
          0, 0, displayW, Math.max(displayH, 20)
        );
        callback(canvas.toDataURL('image/jpeg', 0.85));
      } catch(e) { callback(null); }
    };
    image.onerror = () => callback(null);
    image.src = src;
  } catch(e) {
    callback(null);
  }
}

function renderInteractiveQuestion(q, i) {
  const typeLabelMap = {
    multiple_choice: 'Multiple Choice',
    true_false: 'True / False',
    fill_blank: 'Fill in the Blank',
    short_answer: 'Short Answer'
  };
  const typeLabel = typeLabelMap[q.type] || q.type;
  const svgStr = (q.svg && typeof q.svg === 'string' && q.svg.trim().startsWith('<')) ? q.svg : '';
  const svgBlock = svgStr ? `<div class="q-diagram">${svgStr}</div>` : '';
  // Show cropped image region if imageCrop is set — async via placeholder
  let imgBlock = '';
  const hasCrop = q.imageCrop && typeof q.imageCrop === 'object' && typeof q.imageCrop.img === 'number';
  const cropId = hasCrop ? `crop-${i}-${Date.now()}` : null;
  if (hasCrop) {
    imgBlock = `<div class="q-img-ref" id="crop-${i}"><div class="q-img-loading">📸 Memuat gambar…</div></div>`;
  }

  let inputHtml = '';

  if (q.type === 'multiple_choice') {
    inputHtml = '<div class="iq-options">' +
      q.options.map((opt, oi) => `
        <label class="iq-option" data-qi="${i}" data-oi="${oi}">
          <input type="radio" name="q${i}" value="${opt}" />
          <span class="iq-option-box"></span>
          <span class="iq-option-text">${opt}</span>
        </label>`).join('') +
      '</div>';
  } else if (q.type === 'true_false') {
    inputHtml = '<div class="iq-options">' +
      (() => {
        // Detect language of answer to show matching labels
        const ans = (q.answer || '').toLowerCase();
        const useID = ans === 'benar' || ans === 'salah';
        const opts = useID ? ['Benar', 'Salah'] : ['True', 'False'];
        return opts.map(opt => `
          <label class="iq-option" data-qi="${i}">
            <input type="radio" name="q${i}" value="${opt}" />
            <span class="iq-option-box"></span>
            <span class="iq-option-text">${opt}</span>
          </label>`).join('');
      })() +
      '</div>';
  } else if (q.type === 'fill_blank') {
    const rendered = q.question.replace(/___/g, '<span class="q-blank-line"></span>');
    // Count blanks to hint format
    const blankCount = (q.question.match(/___/g) || []).length;
    const hint = blankCount > 1
      ? `Type ${blankCount} answers separated by commas (e.g. answer1, answer2)`
      : 'Type your answer';
    inputHtml = `<p class="iq-fill-label">Jawaban kamu: <span class="iq-format-hint">${hint}</span></p>
      <input type="text" class="iq-text-input" data-qi="${i}" placeholder="${hint}…" />`;
    return `
      <div class="iq-question" id="iq-q${i}">
        <div class="iq-q-header">
          <span class="q-number">Question ${q.number}</span>
          <span class="q-type-badge">${typeLabel}</span>
        </div>
        <p class="q-text">${rendered}</p>
        ${imgBlock}
        ${svgBlock}
        ${inputHtml}
      </div>`;
  } else {
    // Short answer / essay
    inputHtml = `<p class="iq-fill-label">Jawaban kamu: <span class="iq-format-hint">Write 2–4 sentences</span></p>
      <textarea class="iq-textarea" data-qi="${i}" placeholder="Write your answer here…" rows="3"></textarea>`;
  }

  return `
    <div class="iq-question" id="iq-q${i}">
      <div class="iq-q-header">
        <span class="q-number">Question ${q.number}</span>
        <span class="q-type-badge">${typeLabel}</span>
      </div>
      <p class="q-text">${q.type !== 'fill_blank' ? q.question : ''}</p>
      ${imgBlock}
      ${svgBlock}
      ${inputHtml}
    </div>`;
}

function submitInteractiveQuiz(quiz) {
  const hint = document.getElementById('iq-submit-hint');
  const container = document.getElementById('interactive-container');

  // Collect answers
  const answers = [];
  let unanswered = [];

  quiz.questions.forEach((q, i) => {
    let userAnswer = null;
    if (q.type === 'multiple_choice' || q.type === 'true_false') {
      const selected = document.querySelector(`input[name="q${i}"]:checked`);
      userAnswer = selected ? selected.value : null;
    } else {
      const input = document.querySelector(`[data-qi="${i}"]`);
      userAnswer = input ? input.value.trim() : null;
    }
    answers.push(userAnswer);
    if (!userAnswer) unanswered.push(q.number);
  });

  // Warn if unanswered (but allow submit anyway)
  if (unanswered.length > 0) {
    hint.textContent = `⚠️ ${unanswered.length} soal belum dijawab (Q${unanswered.join(', Q')}). Kumpulkan tetap?`;
    hint.style.color = 'var(--amber)';
    // Change button to confirm
    const btn = document.getElementById('iq-submit');
    btn.textContent = 'Ya, Kumpulkan Tetap ⚡';
    btn.onclick = () => showInteractiveResults(quiz, answers);
    return;
  }

  showInteractiveResults(quiz, answers);
}

function normalizeAnswer(str) {
  return str.toString().trim().toLowerCase()
    .replace(/[.,;:!?]/g, '')      // remove punctuation
    .replace(/\s+/g, ' ')          // normalize spaces
    .replace(/,\s*/g, ' ')         // normalize commas to spaces
    .replace(/\s*dan\s*/g, ' ')    // normalize "dan" (Indonesian "and")
    .replace(/\s*and\s*/g, ' ')    // normalize "and"
    .trim();
}

function isCorrect(q, userAnswer) {
  if (!userAnswer) return false;
  const correct = normalizeAnswer(q.answer || '');
  const user = normalizeAnswer(userAnswer);

  if (q.type === 'multiple_choice') {
    // Match by first letter (A/B/C/D) or full text
    const correctLetter = correct.charAt(0);
    const userLetter = user.charAt(0);
    if (correctLetter === userLetter && /[a-d]/.test(correctLetter)) return true;
    return user === correct || user.includes(correct) || correct.includes(user);
  }

  if (q.type === 'true_false') {
    // Normalize both EN and ID: true/benar → true, false/salah → false
    const normTF = s => {
      const v = s.trim().toLowerCase();
      if (v === 'true' || v === 'benar' || v === 'ya' || v === 'b' || v === 't') return 'true';
      if (v === 'false' || v === 'salah' || v === 'tidak' || v === 's' || v === 'f') return 'false';
      return v.charAt(0); // fallback to first char
    };
    return normTF(q.answer || '') === normTF(userAnswer || '');
  }

  // Fill blank & short answer — normalize then compare
  if (user === correct) return true;
  // Allow partial match only if user answer is reasonably long
  if (user.length >= 3 && correct.includes(user)) return true;
  if (user.length >= 3 && user.includes(correct)) return true;
  return false;
}

function showInteractiveResults(quiz, answers) {
  const container = document.getElementById('interactive-container');
  let score = 0;
  let resultsHtml = '';

  quiz.questions.forEach((q, i) => {
    const userAnswer = answers[i];
    const correct = isCorrect(q, userAnswer);
    if (correct) score++;

    const statusIcon = correct ? '✅' : '❌';
    const statusClass = correct ? 'iq-correct' : 'iq-incorrect';

    let userAnswerDisplay = userAnswer || '<em>Tidak ada jawaban</em>';
    let optionsReview = '';

    if (q.type === 'multiple_choice') {
      optionsReview = '<div class="iq-review-options">' +
        q.options.map(opt => {
          const isCorrectOpt = (opt.trim().toLowerCase().charAt(0) === q.answer.trim().toLowerCase().charAt(0)) ||
                               opt.trim().toLowerCase().includes(q.answer.trim().toLowerCase()) ||
                               q.answer.trim().toLowerCase().includes(opt.trim().toLowerCase().substring(0, 3));
          const isUserOpt = userAnswer && opt.trim().toLowerCase().charAt(0) === userAnswer.trim().toLowerCase().charAt(0);
          let cls = 'iq-review-opt';
          if (isCorrectOpt) cls += ' iq-opt-correct';
          if (isUserOpt && !isCorrectOpt) cls += ' iq-opt-wrong';
          return `<div class="${cls}">${opt}${isCorrectOpt ? ' ✓' : ''}${isUserOpt && !isCorrectOpt ? ' ✗' : ''}</div>`;
        }).join('') +
      '</div>';
    }

    resultsHtml += `
      <div class="iq-result-item ${statusClass}">
        <div class="iq-result-header">
          <span class="iq-result-status">${statusIcon}</span>
          <span class="q-number">Question ${q.number}</span>
          <span class="iq-result-verdict">${correct ? 'Benar!' : 'Salah'}</span>
        </div>
        <p class="iq-result-question">${q.question}</p>
        ${(q.imageCrop && typeof q.imageCrop === 'object' && typeof q.imageCrop.img === 'number') ? `<div class="q-img-ref" id="result-crop-${i}"><div class="q-img-loading">📸 Memuat gambar…</div></div>` : ''}
        ${(q.svg && typeof q.svg === 'string' && q.svg.trim().startsWith('<')) ? `<div class="q-diagram">${q.svg}</div>` : ''}
        ${optionsReview}
        <div class="iq-result-answers">
          ${!correct ? `<div class="iq-your-answer">Jawaban kamu: <strong>${userAnswerDisplay}</strong></div>` : ''}
          <div class="iq-correct-answer">Jawaban benar: <strong>${q.answer}</strong></div>
        </div>
        ${q.explanation ? `<div class="iq-explanation">💡 <strong>Penjelasan:</strong> ${q.explanation}</div>` : ''}
      </div>`;
  });

  const pct = Math.round((score / quiz.questions.length) * 100);
  const emoji = pct >= 80 ? '🏆' : pct >= 60 ? '👍' : pct >= 40 ? '📚' : '💪';
  const msg = pct >= 80 ? 'Luar biasa!' : pct >= 60 ? 'Bagus!' : pct >= 40 ? 'Terus belajar!' : 'Jangan menyerah!';

  // Catat sesi ke profil
  window.PROFIL_recordSession?.('other', {
    pct,
    totalBenar: score,
    totalSoal:  quiz.questions.length,
    scores: {},
    elapsed: 0,
  });

  container.innerHTML = `
    <div class="iq-score-banner">
      <div class="iq-score-emoji">${emoji}</div>
      <div class="iq-score-number">${score} / ${quiz.questions.length}</div>
      <div class="iq-score-pct">${pct}% · ${msg}</div>
    </div>
    <div class="iq-results-list">${resultsHtml}</div>
    <div class="iq-done-wrap">
      <button class="iq-btn-done" onclick="closeInteractiveQuiz()">✓ Selesai</button>
    </div>`;

  // Async load crops in results
  quiz.questions.forEach((q, i) => {
    if (q.imageCrop && typeof q.imageCrop === 'object' && typeof q.imageCrop.img === 'number') {
      const el = document.getElementById('result-crop-' + i);
      if (el) {
        cropImageFromState(q.imageCrop, function(dataUrl) {
          el.innerHTML = dataUrl ? '<img src="' + dataUrl + '" alt="Referensi materi" />' : '';
        });
      }
    }
  });
}

function closeInteractiveQuiz() {
  document.getElementById('interactive-overlay').classList.add('hidden');
  document.body.style.overflow = '';
}

// ── Mode Switcher ──────────────────────────────────────────────
function switchMode(mode) {
  state.mode = mode;
  document.getElementById('mode-upload').classList.toggle('hidden', mode !== 'upload');
  document.getElementById('mode-topic').classList.toggle('hidden', mode !== 'topic');
  document.getElementById('tab-upload').classList.toggle('active', mode === 'upload');
  document.getElementById('tab-topic').classList.toggle('active', mode === 'topic');
  generateHint.textContent = '';
}

// ── Curriculum Selectors ───────────────────────────────────────
(function initCurriculumSelectors() {
  const selJenjang = document.getElementById('sel-jenjang');
  if (!selJenjang) return;
  getCurriculumJenjang().forEach(j => {
    const opt = document.createElement('option');
    opt.value = j; opt.textContent = j;
    selJenjang.appendChild(opt);
  });
})();

function onJenjangChange() {
  const jenjang = document.getElementById('sel-jenjang').value;
  state.topic.jenjang = jenjang;
  state.topic.mapel = '';
  state.topic.topik = '';

  const selMapel = document.getElementById('sel-mapel');
  const selTopik = document.getElementById('sel-topik');
  selMapel.innerHTML = '<option value="">— Pilih Mapel —</option>';
  selTopik.innerHTML = '<option value="">— Pilih Topik —</option>';
  selTopik.disabled = true;

  if (!jenjang) { selMapel.disabled = true; return; }
  getMapelForJenjang(jenjang).forEach(m => {
    const opt = document.createElement('option');
    opt.value = m; opt.textContent = m;
    selMapel.appendChild(opt);
  });
  selMapel.disabled = false;
}

function onMapelChange() {
  const jenjang = document.getElementById('sel-jenjang').value;
  const mapel   = document.getElementById('sel-mapel').value;
  state.topic.mapel = mapel;
  state.topic.topik = '';

  const selTopik = document.getElementById('sel-topik');
  selTopik.innerHTML = '<option value="">— Pilih Topik —</option>';

  if (!mapel) { selTopik.disabled = true; return; }
  getTopikForMapel(jenjang, mapel).forEach(t => {
    const opt = document.createElement('option');
    opt.value = t; opt.textContent = t;
    selTopik.appendChild(opt);
  });
  selTopik.disabled = false;
  selTopik.onchange = () => { state.topic.topik = selTopik.value; };
}

// ── Topic Mode: Generate from Claude's knowledge ───────────────
async function callClaudeTopic() {
  const { jenjang, mapel, topik } = state.topic;

  // Safe-read settings with fallbacks
  const numQuestions = state.settings?.numQuestions || 10;
  const types = state.settings?.types?.length > 0
    ? state.settings.types
    : ['multiple_choice', 'true_false', 'fill_blank', 'short_answer'];
  const level = state.settings?.level || 'junior_high';
  const levelLabel = level === 'elementary' ? 'SD'
    : level === 'junior_high' ? 'SMP'
    : level === 'high_school' ? 'SMA'
    : level === 'sd' ? 'SD'
    : level === 'smp' ? 'SMP' : 'SMA';

  const typeNames = {
    multiple_choice: 'Pilihan Ganda',
    true_false: 'Benar / Salah',
    fill_blank: 'Isian Singkat',
    short_answer: 'Uraian'
  };
  const selectedTypes = types.map(t => typeNames[t] || t).join(', ');

  const idToken = await window.getIdToken?.() || await firebase.auth().currentUser?.getIdToken(true);

  const prompt = `You are an expert Indonesian curriculum teacher. Generate a quiz based on the following:

KELAS: ${jenjang}
MATA PELAJARAN: ${mapel}
TOPIK / BAB: ${topik}
JUMLAH SOAL: ${numQuestions}
TIPE SOAL: ${selectedTypes}
TINGKAT: ${levelLabel}

INSTRUCTIONS:
1. Generate exactly ${numQuestions} questions strictly about the topic "${topik}" for ${mapel}, ${jenjang}.
2. Follow the Indonesian ${jenjang.includes('Merdeka') ? 'Kurikulum Merdeka' : 'K13 Revisi'} curriculum standard.
3. Use Bahasa Indonesia for all questions and answers.
   - For true_false questions: answer must be exactly "Benar" or "Salah" (never "True" or "False")
4. Distribute types evenly across: ${selectedTypes}
5. For multiple choice: exactly 4 options labeled A, B, C, D.
6. For fill in blank: replace key terms with ___.
7. For short answer: open-ended questions about main concepts.
8. EXPLANATION: Write a concise 1–2 sentence explanation per question (keep it short to fit all ${numQuestions} questions).
   - State the correct answer value first, then explain why.
   - For multiple choice: confirm your calculated answer matches the correct option.
9. Adjust difficulty for ${levelLabel} students studying ${topik}.

CRITICAL — ANSWER VERIFICATION (wajib sebelum output):
For EVERY multiple choice question, before writing the JSON:
1. Solve the question yourself from scratch using the correct method.
2. Confirm which option (A/B/C/D) matches your calculated answer.
3. If your answer does not match any option, fix either the question or the options so the correct answer is included.
4. NEVER set "answer" to an option that is mathematically or factually wrong.
5. For math/algebra: show your working mentally — if the result is a constant (no variable), make sure the correct option is a constant, not an expression with a variable.

Set "imageCrop" to null for all questions (no uploaded images in this mode).
Set "svg" to null for all questions.

Respond ONLY with valid JSON, no markdown:
{"subject":"${mapel} — ${topik}","language":"id","questions":[{"number":1,"type":"multiple_choice","question":"...","options":["A. ...","B. ...","C. ...","D. ..."],"answer":"A. ...","explanation":"...","svg":null,"imageCrop":null}]}`;

  // Dynamic max_tokens: ~300 tokens per question, min 3000, max 8000
  const dynamicTokens = Math.min(12000, Math.max(4000, numQuestions * 450));

  const res = await fetchWithRetry('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-id-token': idToken || '' },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: dynamicTokens,
      messages: [{ role: 'user', content: prompt }]
    })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Generate gagal (${res.status})`);
  }

  const raw = await res.json();

  // Robust parsing — same as callClaude
  let data = raw;
  if (!data.questions) {
    // Try to extract JSON from text content blocks
    const textContent = (raw.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
    if (textContent) {
      try {
        const clean = textContent.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(clean);
        if (parsed.questions) data = parsed;
      } catch(e) {
        // Try partial recovery
        try {
          const match = textContent.match(/\{[\s\S]*"questions"\s*:\s*\[[\s\S]*/);
          if (match) {
            let attempt = match[0];
            // Close unclosed JSON
            const opens = (attempt.match(/\[/g)||[]).length - (attempt.match(/\]/g)||[]).length;
            const openB = (attempt.match(/\{/g)||[]).length - (attempt.match(/\}/g)||[]).length;
            attempt += ']'.repeat(Math.max(0,opens)) + '}'.repeat(Math.max(0,openB));
            const recovered = JSON.parse(attempt);
            if (recovered.questions?.length > 0) data = recovered;
          }
        } catch(e2) {}
      }
    }
  }

  if (!data.questions || !Array.isArray(data.questions)) {
    throw new Error('Format soal tidak valid. Coba lagi.');
  }

  data.questions = data.questions.map(q => ({ ...q, svg: null, imageCrop: null }));

  if (typeof data._credits === 'number') {
    window._currentCredits = data._credits;
    window.renderCreditsBanner?.();
  }
  if (typeof raw._credits === 'number') {
    window._currentCredits = raw._credits;
    window.renderCreditsBanner?.();
  }
  return data;
}

// ══════════════════════════════════════════════════════════════
//  APP MODE SWITCHER (Drill Soal / Bantai Soal)
// ══════════════════════════════════════════════════════════════

// ── Fetch with retry for 529 Overloaded ──────────────────────
async function fetchWithRetry(url, options, maxRetries = 2) {
  let lastErr;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (attempt > 0) {
      const delay = attempt * 4000; // 4s, 8s
      showLoading(
        'API sedang sibuk — mencoba lagi…',
        'Percobaan ' + (attempt + 1) + ' dari ' + (maxRetries + 1) + ' dalam ' + (delay/1000) + ' detik…'
      );
      await new Promise(r => setTimeout(r, delay));
    }
    const res = await fetch(url, options);
    if (res.status !== 529 && res.status !== 503) return res;
    // 529/503 = overloaded, retry
    const errData = await res.json().catch(() => ({}));
    lastErr = new Error(
      'API Anthropic sedang kelebihan beban. Coba lagi dalam beberapa saat.' +
      (errData?.error?.message ? ' (' + errData.error.message + ')' : '')
    );
    lastErr.status = res.status;
    console.warn('Attempt ' + (attempt + 1) + ' got ' + res.status + ', retrying…');
  }
  throw lastErr;
}

window.switchAppMode = function(mode) {
  const sections = {
    drill:   document.getElementById('drill-soal-section'),
    bantai:  document.getElementById('bantai-soal-section'),
    tryout:  document.getElementById('tryout-soal-section'),
    profil:  document.getElementById('profil-section'),
  };
  const tabs = {
    drill:   document.getElementById('tab-drill'),
    bantai:  document.getElementById('tab-bantai'),
    tryout:  document.getElementById('tab-tryout'),
    profil:  document.getElementById('tab-profil'),
  };

  Object.keys(sections).forEach(k => {
    sections[k]?.classList.toggle('hidden', k !== mode);
    tabs[k]?.classList.toggle('active', k === mode);
  });

  // When switching to tryout, always show hub first
  if (mode === 'tryout') {
    const hub = document.getElementById('tryout-hub');
    if (hub) hub.classList.remove('hidden');
    ['tka-soal-inner','cpns-soal-inner','snbt-soal-inner','osn-soal-inner','evaluasi-soal-inner'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.add('hidden');
    });
  }

  // When switching to profil, init/re-render
  if (mode === 'profil') {
    window.PROFIL?.init();
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// ── Mulai tryout tertentu ──────────────────────────────────────
window.startTryout = function(type) {
  document.getElementById('tryout-hub').classList.add('hidden');
  // Hide all inner panels first
  ['tka-soal-inner','cpns-soal-inner','snbt-soal-inner','osn-soal-inner','evaluasi-soal-inner'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
  });

  if (type === 'tka') {
    document.getElementById('tka-soal-inner').classList.remove('hidden');
    if (window.TKA) window.TKA.init();
  } else if (type === 'cpns') {
    document.getElementById('cpns-soal-inner').classList.remove('hidden');
    if (window.CPNS) window.CPNS.init();
  } else if (type === 'snbt') {
    document.getElementById('snbt-soal-inner').classList.remove('hidden');
    if (window.SNBT) window.SNBT.init();
  } else if (type === 'osn') {
    document.getElementById('osn-soal-inner').classList.remove('hidden');
    if (window.OSN) window.OSN.init();
  } else if (type === 'evaluasi') {
    document.getElementById('evaluasi-soal-inner').classList.remove('hidden');
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// ── Kembali ke hub dari dalam tryout ─────────────────────────
window.backToTryoutHub = function() {
  ['tka-soal-inner','cpns-soal-inner','snbt-soal-inner','osn-soal-inner','evaluasi-soal-inner'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
  });
  document.getElementById('tryout-hub').classList.remove('hidden');
  if (window.TKA && window.TKA._stopTimer) window.TKA._stopTimer();
  if (window.CPNS && window.CPNS._stopTimer) window.CPNS._stopTimer();
  if (window.SNBT && window.SNBT._stopTimer) window.SNBT._stopTimer();
  if (window.OSN && window.OSN._stopTimer) window.OSN._stopTimer();
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// ── Jembatan: modul tryout memanggil ini saat quiz selesai ───
// (Backup hook — modul kini memanggil PROFIL_recordSession langsung)
window._onTryoutResult = function(jenis, pct, totalBenar, totalSoal, scores, elapsed) {
  window.PROFIL_recordSession?.(jenis, { pct, totalBenar, totalSoal, scores: scores || {}, elapsed: elapsed || 0 });
};

// ══════════════════════════════════════════════════════════════
//  EVALUASI HARIAN — Generate soal dari topik kurikulum
//  Hidup di dalam tryout-soal-section → evaluasi-soal-inner
// ══════════════════════════════════════════════════════════════

// ── State evaluasi (terpisah dari state drill) ─────────────────
const evaluasiState = {
  settings: {
    level: 'elementary',
    grade: 1,
    numQuestions: 10,
    types: ['multiple_choice', 'true_false', 'fill_blank', 'short_answer'],
    studentName: '',
    date: '',
  },
  topic:    { jenjang: '', mapel: '', topik: '' },
  quizData: null,
};

// ── DOM refs evaluasi ──────────────────────────────────────────
const evalLevelToggle      = document.getElementById('evaluasi-level-toggle');
const evalGradePills       = document.getElementById('evaluasi-grade-pills');
const evalGradeSelector    = document.getElementById('evaluasi-grade-selector');
const evalNumInput         = document.getElementById('evaluasi-num-questions');
const evalNumMinus         = document.getElementById('evaluasi-num-minus');
const evalNumPlus          = document.getElementById('evaluasi-num-plus');
const evalCounter          = document.getElementById('evaluasi-questions-counter');
const evalBtnGenerate      = document.getElementById('evaluasi-btn-generate');
const evalGenerateHint     = document.getElementById('evaluasi-generate-hint');
const evalStepResults      = document.getElementById('evaluasi-step-results');
const evalQuizOutput       = document.getElementById('evaluasi-quiz-output');
const evalQuizMetaBar      = document.getElementById('evaluasi-quiz-meta-bar');
const evalQuizMetaText     = document.getElementById('evaluasi-quiz-meta-text');
const evalBtnPdf           = document.getElementById('evaluasi-btn-pdf');
const evalBtnInteractive   = document.getElementById('evaluasi-btn-interactive');
const evalBtnNew           = document.getElementById('evaluasi-btn-new');
const evalBtnRegenerate    = document.getElementById('evaluasi-btn-regenerate');
const evalSelJenjang       = document.getElementById('evaluasi-sel-jenjang');
const evalSelMapel         = document.getElementById('evaluasi-sel-mapel');
const evalSelTopik         = document.getElementById('evaluasi-sel-topik');
const evalTopicHint        = document.getElementById('evaluasi-topic-hint');

// ── Init evaluasi UI ───────────────────────────────────────────
(function initEvaluasi() {
  if (!evalBtnGenerate) return; // guard: DOM belum ada

  // Tanggal default hari ini
  const evalDateInput = document.getElementById('evaluasi-quiz-date');
  if (evalDateInput) evalDateInput.valueAsDate = new Date();

  // Level toggle (SD/SMP/SMA)
  if (evalLevelToggle) {
    evalLevelToggle.querySelectorAll('.level-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        evalLevelToggle.querySelectorAll('.level-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        evaluasiState.settings.level = btn.dataset.value;
        evalRenderGrades(btn.dataset.value);
      });
    });
    evalRenderGrades('elementary');
  }

  // Jumlah soal ±
  if (evalNumMinus) evalNumMinus.addEventListener('click', () => evalChangeNum(-1));
  if (evalNumPlus)  evalNumPlus.addEventListener('click',  () => evalChangeNum(+1));
  if (evalNumInput) evalNumInput.addEventListener('input',  () => {
    let v = parseInt(evalNumInput.value) || 10;
    v = Math.max(1, Math.min(LIMITS.maxQuestions, v));
    evalNumInput.value = v;
    evaluasiState.settings.numQuestions = v;
    evalUpdateCounter(v);
  });

  // Curriculum dropdown — isi jenjang
  if (evalSelJenjang) {
    getCurriculumJenjang().forEach(j => {
      const opt = document.createElement('option');
      opt.value = j; opt.textContent = j;
      evalSelJenjang.appendChild(opt);
    });
  }

  // Tombol generate
  evalBtnGenerate.addEventListener('click', evaluasiGenerateQuiz);
  if (evalBtnRegenerate) evalBtnRegenerate.addEventListener('click', evaluasiGenerateQuiz);

  // Tombol PDF
  if (evalBtnPdf) evalBtnPdf.addEventListener('click', () => {
    if (!evaluasiState.quizData) return;
    evalQuizOutput?.classList.remove('hidden');
    evalQuizMetaBar?.classList.remove('hidden');
    // generatePDF membaca state drill — pinjam sementara
    const _mode = state.mode, _topic = state.topic, _settings = state.settings;
    state.mode     = 'topic';
    state.topic    = { ...evaluasiState.topic };
    state.settings = { ...evaluasiState.settings };
    generatePDF(evaluasiState.quizData);
    state.mode     = _mode;
    state.topic    = _topic;
    state.settings = _settings;
  });

  // Tombol Interaktif
  if (evalBtnInteractive) evalBtnInteractive.addEventListener('click', () => {
    if (!evaluasiState.quizData) return;
    startInteractiveQuiz(evaluasiState.quizData);
  });

  // Tombol Soal Baru
  if (evalBtnNew) evalBtnNew.addEventListener('click', () => {
    evaluasiState.quizData = null;
    if (evalQuizOutput)   { evalQuizOutput.innerHTML = ''; evalQuizOutput.classList.add('hidden'); }
    if (evalQuizMetaBar)  evalQuizMetaBar.classList.add('hidden');
    if (evalStepResults)  evalStepResults.classList.add('hidden');
    if (evalGenerateHint) evalGenerateHint.textContent = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();

// ── Grade pills evaluasi ───────────────────────────────────────
function evalRenderGrades(level) {
  if (!evalGradePills) return;
  const config = GRADE_CONFIG[level];
  if (!config) return;
  evalGradePills.innerHTML = '';
  config.grades.forEach((g, i) => {
    const pill = document.createElement('button');
    pill.className = 'grade-pill' + (i === 0 ? ' active' : '');
    pill.textContent = g.label;
    pill.dataset.value = g.value;
    pill.addEventListener('click', () => {
      evalGradePills.querySelectorAll('.grade-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      evaluasiState.settings.grade = parseInt(g.value);
    });
    evalGradePills.appendChild(pill);
  });
  evaluasiState.settings.grade = config.grades[0].value;
  if (evalGradeSelector) evalGradeSelector.classList.add('visible');
}

function evalChangeNum(delta) {
  if (!evalNumInput) return;
  let v = (parseInt(evalNumInput.value) || 10) + delta;
  v = Math.max(1, Math.min(LIMITS.maxQuestions, v));
  evalNumInput.value = v;
  evaluasiState.settings.numQuestions = v;
  evalUpdateCounter(v);
}

function evalUpdateCounter(v) {
  if (!evalCounter) return;
  if (v >= LIMITS.maxQuestions) {
    evalCounter.textContent = `${v} / ${LIMITS.maxQuestions} soal · Batas tercapai`;
    evalCounter.className = 'questions-counter warn';
  } else if (v >= LIMITS.warnQuestions) {
    evalCounter.textContent = `${v} / ${LIMITS.maxQuestions} soal · Mendekati batas`;
    evalCounter.className = 'questions-counter warn-soft';
  } else {
    evalCounter.textContent = `${v} / ${LIMITS.maxQuestions} soal`;
    evalCounter.className = 'questions-counter';
  }
}

// ── Curriculum dropdowns evaluasi ──────────────────────────────
window.evaluasiOnJenjangChange = function() {
  if (!evalSelJenjang || !evalSelMapel || !evalSelTopik) return;
  const jenjang = evalSelJenjang.value;
  evaluasiState.topic.jenjang = jenjang;
  evaluasiState.topic.mapel   = '';
  evaluasiState.topic.topik   = '';

  evalSelMapel.innerHTML = '<option value="">— Pilih Mapel —</option>';
  evalSelTopik.innerHTML = '<option value="">— Pilih Topik —</option>';
  evalSelTopik.disabled  = true;

  if (!jenjang) { evalSelMapel.disabled = true; return; }
  getMapelForJenjang(jenjang).forEach(m => {
    const opt = document.createElement('option');
    opt.value = m; opt.textContent = m;
    evalSelMapel.appendChild(opt);
  });
  evalSelMapel.disabled = false;
  if (evalTopicHint) evalTopicHint.textContent = '';
};

window.evaluasiOnMapelChange = function() {
  if (!evalSelJenjang || !evalSelMapel || !evalSelTopik) return;
  const jenjang = evalSelJenjang.value;
  const mapel   = evalSelMapel.value;
  evaluasiState.topic.mapel = mapel;
  evaluasiState.topic.topik = '';

  evalSelTopik.innerHTML = '<option value="">— Pilih Topik —</option>';

  if (!mapel) { evalSelTopik.disabled = true; return; }
  getTopikForMapel(jenjang, mapel).forEach(t => {
    const opt = document.createElement('option');
    opt.value = t; opt.textContent = t;
    evalSelTopik.appendChild(opt);
  });
  evalSelTopik.disabled = false;
  evalSelTopik.onchange = () => {
    evaluasiState.topic.topik = evalSelTopik.value;
    if (evalTopicHint) evalTopicHint.textContent = evalSelTopik.value
      ? `✅ Topik dipilih: ${evalSelTopik.value}`
      : '';
  };
};

// ── Collect settings evaluasi ──────────────────────────────────
function evalCollectSettings() {
  try {
    const activeLevel = evalLevelToggle?.querySelector('.level-btn.active');
    if (activeLevel) evaluasiState.settings.level = activeLevel.dataset.value;
  } catch(e) {}
  try {
    const activePill = evalGradePills?.querySelector('.grade-pill.active');
    if (activePill) evaluasiState.settings.grade = parseInt(activePill.dataset.value);
  } catch(e) {}
  try {
    evaluasiState.settings.numQuestions = parseInt(evalNumInput?.value) || 10;
  } catch(e) {}
  try {
    const checked = document.querySelectorAll('input[name="evaluasi-qtype"]:checked');
    const types = Array.from(checked).map(c => c.value);
    evaluasiState.settings.types = types.length > 0
      ? types
      : ['multiple_choice', 'true_false', 'fill_blank', 'short_answer'];
  } catch(e) {
    evaluasiState.settings.types = ['multiple_choice', 'true_false', 'fill_blank', 'short_answer'];
  }
  try {
    const nameEl = document.getElementById('evaluasi-student-name');
    const dateEl = document.getElementById('evaluasi-quiz-date');
    evaluasiState.settings.studentName = nameEl?.value.trim() || '';
    evaluasiState.settings.date        = dateEl?.value || '';
  } catch(e) {}
}

// ── Main generate evaluasi ─────────────────────────────────────
async function evaluasiGenerateQuiz() {
  evalCollectSettings();

  const { jenjang, mapel, topik } = evaluasiState.topic;
  if (!jenjang || !mapel || !topik) {
    if (evalGenerateHint) evalGenerateHint.textContent = 'Pilih kelas, mata pelajaran, dan topik terlebih dahulu.';
    return;
  }
  if (evaluasiState.settings.types.length === 0) {
    if (evalGenerateHint) evalGenerateHint.textContent = 'Pilih minimal satu jenis soal.';
    return;
  }

  // Credit check
  const credits   = window._currentCredits ?? 0;
  const isInvited = window._isInvited ?? false;
  if (!isInvited && credits <= 0) {
    if (evalGenerateHint) evalGenerateHint.textContent = '';
    window.renderCreditsBanner?.();
    window.showPricingModal?.('pro');
    return;
  }

  if (evalGenerateHint) evalGenerateHint.textContent = '';

  // Tampilkan loading
  evalShowLoading('Membuat soal evaluasi…', `${mapel} — ${topik}`);

  try {
    const quiz = await evalCallClaudeTopic();
    evalFinishGenerate(quiz);
  } catch (err) {
    evalHandleError(err);
  } finally {
    evalHideLoading();
  }
}

// ── Panggil Claude untuk evaluasi ─────────────────────────────
async function evalCallClaudeTopic() {
  const { jenjang, mapel, topik } = evaluasiState.topic;
  const { numQuestions, types, level } = evaluasiState.settings;

  const levelLabel = level === 'elementary' ? 'SD'
    : level === 'junior_high' ? 'SMP' : 'SMA';

  const typeNames = {
    multiple_choice: 'Pilihan Ganda',
    true_false:      'Benar / Salah',
    fill_blank:      'Isian Singkat',
    short_answer:    'Uraian',
  };
  const selectedTypes = types.map(t => typeNames[t] || t).join(', ');

  const idToken = await window.getIdToken?.() || await firebase.auth().currentUser?.getIdToken(true);

  const prompt = `You are an expert Indonesian curriculum teacher. Generate a quiz based on the following:

KELAS: ${jenjang}
MATA PELAJARAN: ${mapel}
TOPIK / BAB: ${topik}
JUMLAH SOAL: ${numQuestions}
TIPE SOAL: ${selectedTypes}
TINGKAT: ${levelLabel}

INSTRUCTIONS:
1. Generate exactly ${numQuestions} questions strictly about the topic "${topik}" for ${mapel}, ${jenjang}.
2. Follow the Indonesian ${jenjang.includes('Merdeka') ? 'Kurikulum Merdeka' : 'K13 Revisi'} curriculum standard.
3. Use Bahasa Indonesia for all questions and answers.
   - For true_false questions: answer must be exactly "Benar" or "Salah"
4. Distribute types evenly across: ${selectedTypes}
5. For multiple choice: exactly 4 options labeled A, B, C, D.
6. For fill in blank: replace key terms with ___.
7. For short answer: open-ended questions about main concepts.
8. EXPLANATION: Write a concise 1–2 sentence explanation per question.
   - State the correct answer value first, then explain why.
9. Adjust difficulty for ${levelLabel} students studying ${topik}.

CRITICAL — ANSWER VERIFICATION:
For EVERY multiple choice question, before writing the JSON:
1. Solve the question yourself from scratch using the correct method.
2. Confirm which option (A/B/C/D) matches your calculated answer.
3. NEVER set "answer" to an option that is mathematically or factually wrong.

Set "imageCrop" to null and "svg" to null for all questions.

Respond ONLY with valid JSON, no markdown:
{"subject":"${mapel} — ${topik}","language":"id","questions":[{"number":1,"type":"multiple_choice","question":"...","options":["A. ...","B. ...","C. ...","D. ..."],"answer":"A. ...","explanation":"...","svg":null,"imageCrop":null}]}`;

  const dynamicTokens = Math.min(12000, Math.max(4000, numQuestions * 450));

  const res = await fetchWithRetry('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-id-token': idToken || '' },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: dynamicTokens,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    if (res.status === 403 && err?.error === 'no_credits') throw new Error('no_credits');
    throw new Error(err.error || `Generate gagal (${res.status})`);
  }

  const raw = await res.json();

  if (typeof raw._credits === 'number') {
    window._currentCredits = raw._credits;
    window.renderCreditsBanner?.();
  }

  // Parse JSON dari response
  let data = raw;
  if (!data.questions) {
    const textContent = (raw.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
    if (textContent) {
      try {
        const clean = textContent.replace(/```json|```/g, '').trim();
        data = JSON.parse(clean);
      } catch(e) {
        try {
          const match = textContent.match(/\{[\s\S]*"questions"\s*:\s*\[[\s\S]*/);
          if (match) {
            let attempt = match[0];
            const opens = (attempt.match(/\[/g)||[]).length - (attempt.match(/\]/g)||[]).length;
            const openB = (attempt.match(/\{/g)||[]).length - (attempt.match(/\}/g)||[]).length;
            attempt += ']'.repeat(Math.max(0,opens)) + '}'.repeat(Math.max(0,openB));
            data = JSON.parse(attempt);
          }
        } catch(e2) {}
      }
    }
  }

  if (!data.questions || !Array.isArray(data.questions)) {
    throw new Error('Format soal tidak valid. Coba lagi.');
  }

  data.questions = data.questions.map(q => ({ ...q, svg: null, imageCrop: null }));

  // Sisipkan metadata settings ke quiz agar PDF/renderQuiz bisa pakai
  data._evalSettings = { ...evaluasiState.settings };

  return data;
}

// ── Setelah soal berhasil dibuat ───────────────────────────────
function evalFinishGenerate(quiz) {
  evaluasiState.quizData = quiz;
  evalRenderQuiz(quiz);
  if (evalStepResults) {
    evalStepResults.classList.remove('hidden');
    evalStepResults.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

// ── Render soal evaluasi ke DOM-nya sendiri ────────────────────
function evalRenderQuiz(quiz) {
  if (!evalQuizOutput) return;

  const { jenjang, mapel, topik } = evaluasiState.topic;

  // Meta bar
  if (evalQuizMetaText) {
    evalQuizMetaText.textContent =
      `${quiz.subject || mapel + ' — ' + topik} · 📚 ${jenjang} · ${quiz.questions?.length || 0} soal`;
  }

  if (!quiz.questions || !Array.isArray(quiz.questions)) return;

  const typeLabelMap = {
    multiple_choice: 'Pilihan Ganda',
    true_false:      'Benar / Salah',
    fill_blank:      'Isian',
    short_answer:    'Uraian',
  };

  let html = '';
  quiz.questions.forEach((q, i) => {
    const typeLabel = typeLabelMap[q.type] || q.type;

    let body = '';
    if (q.type === 'multiple_choice' && q.options?.length) {
      const optHtml = q.options.map(o => `<li>${o}</li>`).join('');
      body = `<p class="q-text">${q.question}</p><ul class="q-options">${optHtml}</ul>`;
    } else if (q.type === 'true_false') {
      const tfA = (q.answer || '').toLowerCase();
      const tfOpts = (tfA === 'benar' || tfA === 'salah') ? ['Benar', 'Salah'] : ['True', 'False'];
      body = `<p class="q-text">${q.question}</p><ul class="q-options"><li>A. ${tfOpts[0]}</li><li>B. ${tfOpts[1]}</li></ul>`;
    } else if (q.type === 'fill_blank') {
      const rendered = q.question.replace(/___/g, '<span class="q-blank-line"></span>');
      body = `<p class="q-text">${rendered}</p>`;
    } else {
      body = `<p class="q-text">${q.question}</p><p class="q-essay-hint">Jawab dalam 2–4 kalimat.</p>`;
    }

    html += `
      <div class="quiz-question" style="animation-delay:${i * 0.04}s">
        <div>
          <span class="q-number">Soal ${q.number}</span>
          <span class="q-type-badge">${typeLabel}</span>
        </div>
        ${body}
      </div>`;
  });

  // Kunci jawaban
  html += `
    <div class="answer-key-section">
      <div class="answer-key-title">🗝 Kunci Jawaban</div>
      <ul class="answer-key-list">
        ${quiz.questions.map(q => `<li><strong>No ${q.number}.</strong> ${q.answer}</li>`).join('')}
      </ul>
    </div>`;

  evalQuizOutput.innerHTML = html;
  evalQuizOutput.classList.remove('hidden');
  if (evalQuizMetaBar) evalQuizMetaBar.classList.remove('hidden');
}

// ── Loading helpers evaluasi ───────────────────────────────────
function evalShowLoading(msg, sub) {
  if (loadingText) loadingText.textContent = msg || 'Membuat soal…';
  if (loadingSub)  loadingSub.textContent  = sub  || '';
  if (loadingOverlay) loadingOverlay.classList.remove('hidden');
  if (evalBtnGenerate) evalBtnGenerate.disabled = true;
}
function evalHideLoading() {
  if (loadingOverlay) loadingOverlay.classList.add('hidden');
  if (evalBtnGenerate) evalBtnGenerate.disabled = false;
}
function evalHandleError(err) {
  console.error('Evaluasi error:', err);
  if (!evalGenerateHint) return;
  if (err.message === 'no_credits' || err.message?.includes('no_credits')) {
    evalGenerateHint.textContent = '';
    window.renderCreditsBanner?.();
    window.showPricingModal?.('pro');
  } else if (err.status === 529 || err.status === 503 || err.message?.includes('kelebihan beban')) {
    evalGenerateHint.textContent = '⚠️ API Anthropic sedang sibuk. Tunggu 30 detik lalu coba lagi.';
  } else {
    evalGenerateHint.textContent = 'Error: ' + (err.message || 'Gagal membuat soal.');
  }
}

// ══════════════════════════════════════════════════════════════
//  BANTAI SOAL — Logic
// ══════════════════════════════════════════════════════════════

const bantaiState = {
  image: null,          // { dataUrl, base64, mimeType }
  detectedQuestions: [] // [{number, text, subject}] dari step identifikasi
};

// ── DOM refs ──────────────────────────────────────────────────
const bantaiUploadZone   = document.getElementById('bantai-upload-zone');
const bantaiFileInput    = document.getElementById('bantai-file-input');
const bantaiCameraInput  = document.getElementById('bantai-camera-input');
const bantaiPreviewWrap  = document.getElementById('bantai-preview-wrap');
const bantaiPreviewImg   = document.getElementById('bantai-preview-img');
const bantaiRemoveBtn    = document.getElementById('bantai-remove-btn');
const btnBantai          = document.getElementById('btn-bantai');
const bantaiHint         = document.getElementById('bantai-hint');
const stepBantaiPick     = document.getElementById('step-bantai-pick');
const bantaiPickList     = document.getElementById('bantai-pick-list');
const bantaiPickHint     = document.getElementById('bantai-pick-hint');
const stepBantaiResult   = document.getElementById('step-bantai-result');
const bantaiResultContent= document.getElementById('bantai-result-content');
const bantaiLoadingOverlay = document.getElementById('bantai-loading-overlay');
const bantaiLoadingText  = document.getElementById('bantai-loading-text');

// ── Upload zone events ────────────────────────────────────────
bantaiUploadZone.addEventListener('dragover', e => {
  e.preventDefault();
  bantaiUploadZone.classList.add('dragover');
});
bantaiUploadZone.addEventListener('dragleave', () => bantaiUploadZone.classList.remove('dragover'));
bantaiUploadZone.addEventListener('drop', e => {
  e.preventDefault();
  bantaiUploadZone.classList.remove('dragover');
  const files = Array.from(e.dataTransfer.files);
  if (files.length) handleBantaiFile(files[0]);
});
bantaiUploadZone.addEventListener('click', () => bantaiFileInput.click());

document.getElementById('bantai-btn-browse').addEventListener('click', e => {
  e.stopPropagation();
  bantaiFileInput.click();
});
document.getElementById('bantai-btn-camera').addEventListener('click', e => {
  e.stopPropagation();
  bantaiCameraInput.click();
});

bantaiFileInput.addEventListener('change', () => {
  if (bantaiFileInput.files[0]) {
    handleBantaiFile(bantaiFileInput.files[0]);
    bantaiFileInput.value = '';
  }
});
bantaiCameraInput.addEventListener('change', () => {
  if (bantaiCameraInput.files[0]) {
    handleBantaiFile(bantaiCameraInput.files[0]);
    bantaiCameraInput.value = '';
  }
});

bantaiRemoveBtn.addEventListener('click', () => {
  bantaiState.image = null;
  bantaiState.detectedQuestions = [];
  bantaiPreviewImg.src = '';
  bantaiPreviewWrap.classList.add('hidden');
  bantaiHint.textContent = '';
  stepBantaiPick.classList.add('hidden');
  stepBantaiResult.classList.add('hidden');
});

// ── Handle file ───────────────────────────────────────────────
async function handleBantaiFile(file) {
  bantaiHint.textContent = '';

  if (file.type === 'application/pdf') {
    await handleBantaiPDF(file);
    return;
  }

  if (!file.type.startsWith('image/')) {
    bantaiHint.textContent = 'Hanya file gambar (JPG, PNG, WEBP) atau PDF yang didukung.';
    return;
  }

  // Handle image
  const reader = new FileReader();
  reader.onload = e => {
    const img = new Image();
    img.onload = () => {
      const dataUrl = compressCanvas(imageToCanvas(img));
      const base64 = dataUrl.split(',')[1];
      bantaiState.image = { dataUrl, base64, mimeType: 'image/jpeg' };
      bantaiPreviewImg.src = dataUrl;
      bantaiPreviewWrap.classList.remove('hidden');
      // Reset previous steps
      bantaiState.detectedQuestions = [];
      stepBantaiPick.classList.add('hidden');
      stepBantaiResult.classList.add('hidden');
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

// ── PDF → 1 halaman pertama saja (untuk bantai soal) ──────────
async function handleBantaiPDF(file) {
  if (!window.pdfjsLib) {
    bantaiHint.textContent = 'PDF.js belum siap. Coba refresh halaman.';
    return;
  }

  bantaiHint.textContent = 'Memuat PDF…';
  btnBantai.disabled = true;

  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    if (pdf.numPages > 1) {
      bantaiHint.textContent = `PDF memiliki ${pdf.numPages} halaman — hanya halaman pertama yang digunakan.`;
    } else {
      bantaiHint.textContent = '';
    }

    const page = await pdf.getPage(1);
    const scale = 1.5;
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;

    const dataUrl = compressCanvas(canvas);
    const base64 = dataUrl.split(',')[1];

    bantaiState.image = { dataUrl, base64, mimeType: 'image/jpeg', fromPDF: true, pdfName: file.name };
    bantaiPreviewImg.src = dataUrl;
    bantaiPreviewWrap.classList.remove('hidden');

    // Reset previous steps
    bantaiState.detectedQuestions = [];
    stepBantaiPick.classList.add('hidden');
    stepBantaiResult.classList.add('hidden');

    if (pdf.numPages === 1) bantaiHint.textContent = '';

  } catch (err) {
    console.error('Bantai PDF error:', err);
    bantaiHint.textContent = 'Gagal membaca PDF: ' + err.message;
  } finally {
    btnBantai.disabled = false;
  }
}

// ── STEP 1: Tombol "Identifikasi Soal" ───────────────────────
btnBantai.addEventListener('click', identifyBantaiSoal);

async function identifyBantaiSoal() {
  if (!bantaiState.image) {
    bantaiHint.textContent = 'Upload foto soal terlebih dahulu.';
    return;
  }
  bantaiHint.textContent = '';
  showBantaiLoading('Membaca soal di foto…');

  try {
    const idToken = await window.getIdToken();

    const identifyPrompt = `Kamu adalah asisten yang bertugas mengidentifikasi soal-soal ujian/latihan dari foto.

Lihat foto ini dan identifikasi SEMUA soal yang ada. Untuk setiap soal, tulis:
- Nomor soal (sesuai yang tertera di foto, atau urutan jika tidak ada nomor)
- Teks soal secara ringkas (maks 120 karakter — cukup untuk user mengenali soalnya)
- Mata pelajaran (Matematika, IPA, Bahasa Indonesia, Bahasa Inggris, dll)

Jawab HANYA dalam JSON valid (tanpa markdown):
[
  {"number": 1, "text": "Ringkasan teks soal nomor 1...", "subject": "Matematika"},
  {"number": 2, "text": "Ringkasan teks soal nomor 2...", "subject": "IPA"}
]

ATURAN:
- Identifikasi semua soal, jangan lewatkan satu pun.
- "text" harus cukup deskriptif agar user bisa mengenali soalnya (bisa potong jika terlalu panjang).
- Jika hanya ada 1 soal, tetap keluarkan array dengan 1 elemen.
- Output hanya JSON array, tanpa teks lain.`;

    const res = await fetchWithRetry('/api/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-id-token': idToken || '' },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 800,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: bantaiState.image.mimeType, data: bantaiState.image.base64 } },
            { type: 'text', text: identifyPrompt }
          ]
        }]
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || err?.error || `Error ${res.status}`);
    }

    const data = await res.json();
    const rawText = (data.content || []).map(b => b.text || '').join('');
    const clean = rawText.replace(/```json|```/g, '').trim();

    let detected;
    try {
      const parsed = JSON.parse(clean);
      detected = Array.isArray(parsed) ? parsed : [parsed];
    } catch(e) {
      throw new Error('Tidak bisa membaca soal dari foto. Pastikan foto jelas dan berisi soal.');
    }

    bantaiState.detectedQuestions = detected;
    renderBantaiPick(detected);

  } catch(err) {
    console.error('Identify error:', err);
    bantaiHint.textContent = 'Error: ' + (err.message || 'Gagal membaca foto. Coba lagi.');
  } finally {
    hideBantaiLoading();
  }
}

// ── Render daftar soal untuk dipilih ─────────────────────────
function renderBantaiPick(questions) {
  const MAX_PICK = 3;

  let html = '';
  questions.forEach((q, i) => {
    html += `
      <label class="bantai-pick-item" id="bantai-pick-wrap-${i}">
        <input type="checkbox" class="bantai-pick-cb" value="${i}"
          onchange="window.updateBantaiPickCount()"
          ${questions.length === 1 ? 'checked' : ''} />
        <div class="bantai-pick-body">
          <span class="bantai-pick-num">Soal ${q.number}</span>
          <span class="bantai-pick-subject">${escapeHtml(q.subject || '')}</span>
          <p class="bantai-pick-text">${escapeHtml(q.text || '')}</p>
        </div>
      </label>`;
  });

  bantaiPickList.innerHTML = html;

  const desc = questions.length === 1
    ? '1 soal ditemukan. Langsung klik Bantai!'
    : `${questions.length} soal ditemukan. Pilih maks. ${MAX_PICK} soal yang ingin dibantai.`;
  document.getElementById('bantai-pick-desc').textContent = desc;

  stepBantaiPick.classList.remove('hidden');
  stepBantaiPick.scrollIntoView({ behavior: 'smooth', block: 'start' });

  // Auto-check jika hanya 1 soal, langsung lanjut
  if (questions.length === 1) {
    const cb = bantaiPickList.querySelector('.bantai-pick-cb');
    if (cb) cb.checked = true;
  }
}

// ── Update count & disable kalau sudah 3 ─────────────────────
window.updateBantaiPickCount = function() {
  const MAX_PICK = 3;
  const cbs = [...bantaiPickList.querySelectorAll('.bantai-pick-cb')];
  const checked = cbs.filter(cb => cb.checked);
  const count = checked.length;

  // Disable unchecked kalau sudah capai limit
  cbs.forEach(cb => {
    if (!cb.checked) {
      cb.disabled = count >= MAX_PICK;
      cb.closest('label').classList.toggle('bantai-pick-disabled', count >= MAX_PICK);
    } else {
      cb.disabled = false;
      cb.closest('label').classList.remove('bantai-pick-disabled');
    }
  });

  const hint = document.getElementById('bantai-pick-hint');
  if (count === 0) {
    hint.textContent = 'Pilih minimal 1 soal.';
  } else if (count >= MAX_PICK) {
    hint.textContent = `Maksimal ${MAX_PICK} soal sudah dipilih.`;
  } else {
    hint.textContent = '';
  }
};

// ── STEP 2: Bantai soal yang dipilih ─────────────────────────
document.getElementById('btn-bantai-solve').addEventListener('click', solveBantaiSoal);

async function solveBantaiSoal() {
  const cbs = [...bantaiPickList.querySelectorAll('.bantai-pick-cb:checked')];
  if (cbs.length === 0) {
    document.getElementById('bantai-pick-hint').textContent = 'Pilih minimal 1 soal.';
    return;
  }

  // Credit check — 1 kredit per sesi bantai (bukan per soal)
  const credits = window._currentCredits ?? 0;
  const isInvited = window._isInvited ?? false;
  if (!isInvited && credits <= 0) {
    window.renderCreditsBanner?.();
    window.showPricingModal?.('pro');
    return;
  }

  const selectedIndices = cbs.map(cb => parseInt(cb.value));
  const selectedQs = selectedIndices.map(i => bantaiState.detectedQuestions[i]);

  document.getElementById('bantai-pick-hint').textContent = '';
  showBantaiLoading(`Membantai ${selectedQs.length} soal…`);

  try {
    const idToken = await window.getIdToken();

    // Bangun daftar soal terpilih untuk disertakan di prompt
    const qList = selectedQs.map((q, i) =>
      'Soal ' + q.number + ': "' + q.text + '"'
    ).join('\n');

    const solvePrompt = `Kamu adalah guru matematika dan sains yang sangat teliti dan tidak pernah menebak jawaban. Seorang siswa meminta pembahasan untuk soal-soal berikut dari foto yang dilampirkan.

SOAL YANG PERLU DIBANTAI (${selectedQs.length} soal):
${qList}

PERINGATAN KERAS — BACA SEBELUM MENGERJAKAN:
1. JANGAN pernah menebak jawaban dari pilihan yang tersedia (A/B/C/D/E). Pilihan jawaban sering dibuat untuk menjebak.
2. WAJIB hitung/kerjakan dari awal menggunakan rumus dan logika yang benar.
3. Tentukan jawaban dari HASIL PERHITUNGAN, bukan dari pilihan yang terlihat "masuk akal".
4. Setelah mendapat jawaban, barulah cocokkan dengan pilihan yang ada.
5. Untuk soal matematika: HARUS tulis setiap langkah aritmetika secara eksplisit — jangan lewati satu langkah pun.
6. Untuk soal dengan SISTEM PERTIDAKSAMAAN atau IRISAN HIMPUNAN: gambarkan garis bilangan, tentukan irisan dengan benar.

Jawab HANYA dalam JSON valid (tanpa markdown), berupa array:
[
  {
    "question_number": 1,
    "question_text": "Teks lengkap soal ini (salin dari foto secara lengkap)",
    "subject": "Mata pelajaran",
    "difficulty": "Mudah / Sedang / Sulit",
    "answer": "Jawaban akhir: tulis opsi HURUF + nilainya, misal: C. a < -2",
    "steps": [
      {
        "label": "Judul langkah (maks 5 kata)",
        "content": "Penjelasan detail: tulis rumus, substitusi angka, dan hasil perhitungan secara eksplisit step by step. Jangan hanya menulis hasil akhir."
      }
    ],
    "key_concepts": ["Konsep kunci 1", "Konsep kunci 2"],
    "tips": "2-3 tips praktis untuk soal tipe ini.",
    "language": "id"
  }
]

ATURAN OUTPUT:
- Selesaikan tepat ${selectedQs.length} soal sesuai daftar di atas.
- Gunakan bahasa yang sama dengan soal (Indonesia atau Inggris).
- Steps: minimal 4, idealnya 5-6 langkah yang mengalir logis.
- Untuk pilihan ganda: di step terakhir, verifikasi jawaban dengan mencocokkan hasil perhitungan ke pilihan yang ada, dan jelaskan mengapa pilihan lain SALAH.
- Untuk soal hitungan: tunjukkan SEMUA angka dan operasi — tidak boleh ada lompatan langkah.
- Output hanya JSON array, tanpa teks tambahan.`;

    // Token: ~1400 per soal + buffer, maks 4500
    const maxTok = Math.min(4500, selectedQs.length * 1400 + 400);

    const res = await fetchWithRetry('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-id-token': idToken || '' },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: maxTok,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: bantaiState.image.mimeType, data: bantaiState.image.base64 } },
            { type: 'text', text: solvePrompt }
          ]
        }]
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      if (res.status === 403 && err?.error === 'no_credits') {
        window.renderCreditsBanner?.();
        window.showPricingModal?.('pro');
        return;
      }
      throw new Error(err?.error?.message || err?.error || `Error ${res.status}`);
    }

    const data = await res.json();
    if (typeof data._credits === 'number') {
      window._currentCredits = data._credits;
      window.renderCreditsBanner?.();
    }

    const rawText = (data.content || []).map(b => b.text || '').join('');
    const clean = rawText.replace(/```json|```/g, '').trim();
    let result;
    try {
      const parsed = JSON.parse(clean);
      result = Array.isArray(parsed) ? parsed : [parsed];
    } catch(e) {
      throw new Error('Format respons tidak valid. Coba lagi.');
    }

    renderBantaiResult(result);

  } catch(err) {
    console.error('Bantai error:', err);
    const msg = (err.status === 529 || err.status === 503 || (err.message && err.message.includes('kelebihan beban')))
      ? '⚠️ API Anthropic sedang sibuk. Tunggu 30 detik lalu coba lagi.'
      : 'Error: ' + (err.message || 'Gagal. Coba lagi.');
    document.getElementById('bantai-pick-hint').textContent = msg;
  } finally {
    hideBantaiLoading();
  }
}

// ── Render result ─────────────────────────────────────────────
function renderBantaiResult(results) {
  // results is always an array
  const total = results.length;
  let html = '';

  // Show the question image
  if (bantaiState.image) {
    html += `
      <div class="bantai-soal-img-wrap">
        <img src="${bantaiState.image.dataUrl}" alt="Soal" />
      </div>`;
  }

  // Summary header if multiple questions
  if (total > 1) {
    html += `<div class="bantai-multi-header">
      <span class="bantai-multi-count">🔍 ${total} soal ditemukan di foto ini</span>
      <div class="bantai-q-tabs" id="bantai-q-tabs">
        ${results.map((r, i) => `
          <button class="bantai-q-tab${i === 0 ? ' active' : ''}" onclick="window.switchBantaiTab(${i})">
            Soal ${r.question_number || (i + 1)}
          </button>`).join('')}
      </div>
    </div>`;
  }

  // Render each question in a panel
  results.forEach((result, i) => {
    const isHidden = total > 1 && i !== 0;
    html += `<div class="bantai-q-panel${isHidden ? ' hidden' : ''}" id="bantai-panel-${i}">`;

    // Question text
    if (result.question_text) {
      html += `<div class="bantai-q-text-box">
        <div class="bantai-q-text-label">📝 Soal</div>
        <div class="bantai-q-text">${escapeHtml(result.question_text)}</div>
      </div>`;
    }

    // Meta info (subject + difficulty)
    if (result.subject || result.difficulty) {
      html += `<p class="bantai-meta">
        ${result.subject ? `📚 <strong>${result.subject}</strong>` : ''}
        ${result.subject && result.difficulty ? ' · ' : ''}
        ${result.difficulty ? `🎯 <strong>${result.difficulty}</strong>` : ''}
      </p>`;
    }

    // Answer box
    html += `
      <div class="bantai-answer-box">
        <div class="bantai-answer-text">${escapeHtml(result.answer || '—')}</div>
      </div>`;

    // Step-by-step pembahasan
    if (result.steps && result.steps.length > 0) {
      html += `<p class="bantai-steps-title">📖 Pembahasan Langkah demi Langkah</p>`;
      result.steps.forEach((step, si) => {
        html += `
          <div class="bantai-step-item" style="animation-delay:${si * 0.07}s">
            <div class="bantai-step-num">${si + 1}</div>
            <div class="bantai-step-body">
              <div class="bantai-step-label">${escapeHtml(step.label || `Langkah ${si+1}`)}</div>
              <div class="bantai-step-content">${formatBantaiContent(step.content || '')}</div>
            </div>
          </div>`;
      });
    }

    // Key concepts
    if (result.key_concepts && result.key_concepts.length > 0) {
      html += `
        <div class="bantai-concept-box">
          <div class="bantai-concept-title">💡 Konsep Kunci</div>
          <ul class="bantai-concept-list">
            ${result.key_concepts.map(c => `<li>${escapeHtml(c)}</li>`).join('')}
          </ul>
        </div>`;
    }

    // Tips
    if (result.tips) {
      html += `
        <div class="bantai-tips-box">
          <div class="bantai-tips-title">🚀 Tips & Trik</div>
          <div class="bantai-tips-text">${formatBantaiContent(result.tips)}</div>
        </div>`;
    }

    html += `</div>`; // close bantai-q-panel
  });

  bantaiResultContent.innerHTML = html;
  stepBantaiResult.classList.remove('hidden');
  stepBantaiResult.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ── Tab switcher for multi-question bantai ────────────────────
window.switchBantaiTab = function(idx) {
  document.querySelectorAll('.bantai-q-tab').forEach((btn, i) => {
    btn.classList.toggle('active', i === idx);
  });
  document.querySelectorAll('.bantai-q-panel').forEach((panel, i) => {
    panel.classList.toggle('hidden', i !== idx);
  });
};

// ── Helper: escape HTML ───────────────────────────────────────
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Helper: format content (bold **text**, newlines) ──────────
function formatBantaiContent(text) {
  return escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>');
}

// ── Reset Bantai ──────────────────────────────────────────────
document.getElementById('bantai-btn-new').addEventListener('click', () => {
  bantaiState.image = null;
  bantaiState.detectedQuestions = [];
  bantaiPreviewImg.src = '';
  bantaiPreviewWrap.classList.add('hidden');
  bantaiResultContent.innerHTML = '';
  bantaiPickList.innerHTML = '';
  stepBantaiPick.classList.add('hidden');
  stepBantaiResult.classList.add('hidden');
  bantaiHint.textContent = '';
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// ── Loading helpers ───────────────────────────────────────────
function showBantaiLoading(msg) {
  bantaiLoadingText.textContent = msg || 'Menganalisis soal…';
  bantaiLoadingOverlay.classList.remove('hidden');
  btnBantai.disabled = true;
}
function hideBantaiLoading() {
  bantaiLoadingOverlay.classList.add('hidden');
  btnBantai.disabled = false;
}
