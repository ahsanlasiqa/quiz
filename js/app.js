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
})();

// ── Credits UI ────────────────────────────
window._currentCredits = 0;
window._isInvited = false;

window.updateSubscriptionUI = function(accessData) {
  window._isInvited = accessData.isInvited || false;
  window._currentCredits = accessData.credits ?? 0;
  window.renderCreditsBanner();
};

window.renderCreditsBanner = function() {
  const banner = document.getElementById('subscription-banner');
  if (!banner) return;

  // Invited (family) — no banner needed
  if (window._isInvited) {
    banner.classList.add('hidden');
    return;
  }

  const credits = window._currentCredits;

  const statusText = credits > 0
    ? `⚡ <strong>${credits} credits</strong> tersisa`
    : `🪫 Credits Anda habis.`;
  banner.className = credits > 0 ? 'subscription-banner trial' : 'subscription-banner expired';
  banner.innerHTML = `
    <span>${statusText}</span>
    <a href="/payment-status.html" class="banner-status-link">Cek status pembayaran →</a>
    <div class="banner-buy-btns">
      <button class="btn-subscribe btn-subscribe-sm" onclick="window.startCheckout(30)">30 Credits — Rp 29.900</button>
      <button class="btn-subscribe btn-subscribe-hot" onclick="window.startCheckout(60)">🔥 60 Credits — Rp 49.900</button>
    </div>
  `;
  banner.classList.remove('hidden');
};

window.startCheckout = async function(pack) {
  try {
    const idToken = await window.getIdToken();
    const res = await fetch('/api/create-transaction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-id-token': idToken },
      body: JSON.stringify({ pack: pack || 60 })
    });
    const data = await res.json();
    if (!data.token) {
      alert('Gagal memulai pembayaran: ' + (data.error || 'Error tidak diketahui'));
      return;
    }
    // Open Midtrans Snap payment popup
    window.snap.pay(data.token, {
      onSuccess: function(result) {
        window._currentCredits += (pack === 30 ? 30 : 60);
        window.renderCreditsBanner();
        generateHint.textContent = '🎉 Pembayaran berhasil! Kredit ditambahkan.';
      },
      onPending: function(result) {
        generateHint.textContent = '⏳ Pembayaran pending. Kredit aktif setelah dikonfirmasi.';
      },
      onError: function(result) {
        generateHint.textContent = '❌ Pembayaran gagal. Silakan coba lagi.';
      },
      onClose: function() {
        // User closed popup without paying — do nothing
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
    window.startCheckout();
    return;
  }

  generateHint.textContent = '';
  if (state.mode === 'topic') {
    showLoading('Membuat soal…', `${state.topic.mapel} — ${state.topic.topik}`);
  } else {
    showLoading('Langkah 1/2: Membaca materi…', `Menganalisis ${state.images.length} gambar…`);
  }
  try {
    const quiz = state.mode === 'topic' ? await callClaudeTopic() : await callClaude();
    state.quizData = quiz;
    renderQuiz(quiz);
    // Hide quiz content initially — show only action buttons
    document.getElementById('quiz-output').classList.add('hidden');
    document.getElementById('quiz-meta-bar').classList.add('hidden');
    stepResults.classList.remove('hidden');
    stepResults.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (err) {
    console.error(err);
    if (err.message === 'no_credits' || (err.message && err.message.includes('no_credits'))) {
      generateHint.textContent = '';
      window.renderCreditsBanner();
      window.startCheckout();
    } else {
      generateHint.textContent = 'Error: ' + (err.message || 'Gagal membuat soal.');
    }
  } finally {
    hideLoading();
  }
}

// ── Claude API Call (2 steps) ──────────────
async function callClaude() {
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
  const BATCH_SIZE = 5;
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

    const extractRes = await fetch('/api/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-id-token': idToken || '' },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1200,
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

  // ── STEP 2: Generate quiz from summary ───
  // Decide mode: variasi soal (jika mayoritas foto berisi soal) atau buat soal baru (jika materi)
  const totalImages = state.images.length;
  const isQuestionMode = questionSheetCount > materialCount;

  let step2Label, quizPrompt;

  if (isQuestionMode) {
    step2Label = `Membuat variasi soal… (${questionSheetCount} dari ${totalImages} foto terdeteksi sebagai lembar soal)`;
    showLoading('Langkah 2/2: Membuat variasi soal…', step2Label);

    const existingQList = existingQuestions.length > 0
      ? '\n\nSOAL ASLI YANG TERDETEKSI:\n' + existingQuestions.map((q, i) => `${i+1}. ${q}`).join('\n')
      : '';

    quizPrompt = `You are an expert teacher. The student has uploaded images of an exam or exercise sheet containing questions. Your task is NOT to create new questions about the topic — instead, create VARIATIONS of the existing questions with changed values, names, or contexts, keeping the same concepts and difficulty.

EXTRACTED CONTENT FROM QUESTION SHEET:
${materialSummary}${existingQList}

STUDENT LEVEL: ${levelLabel}
NUMBER OF VARIATION QUESTIONS: ${state.settings.numQuestions}
QUESTION TYPES TO USE: ${selectedTypes}

INSTRUCTIONS FOR VARIATION MODE:
1. Generate exactly ${state.settings.numQuestions} variation questions.
2. Each variation must test the SAME concept/skill as the original questions but with DIFFERENT values, numbers, names, or contexts. Examples:
   - Math: same equation type but different numbers (e.g. "2x+3=7" → "3x+5=14")
   - Word problems: same structure but different names, objects, or quantities
   - Science: same concept but different examples or scenarios
   - Language: same grammar structure but different sentences
3. Do NOT copy the original questions. Do NOT simply restate them.
4. Distribute question types as evenly as possible: ${selectedTypes}
5. Use the SAME LANGUAGE as the original questions (Bahasa Indonesia or English).
   - For true_false in Bahasa Indonesia: answer must be exactly "Benar" or "Salah"
   - For true_false in English: answer must be exactly "True" or "False"
6. Adjust difficulty appropriately for: ${levelLabel}
7. For multiple choice: exactly 4 options labeled A, B, C, D.
8. EXPLANATION: Write 2-4 sentences explaining the solution method, referencing the concept being tested.
9. Set imageCrop to null and svg to null for all questions.

Respond ONLY with valid JSON, no markdown:
{"subject":"...","language":"...","mode":"variation","questions":[{"number":1,"type":"multiple_choice","question":"...","options":["A. ...","B. ...","C. ...","D. ..."],"answer":"A. ...","explanation":"...","svg":null,"imageCrop":null}]}`;

  } else {
    showLoading('Langkah 2/2: Membuat soal…', `Membuat ${state.settings.numQuestions} soal dari konten yang diekstrak…`);

    quizPrompt = `You are an expert teacher creating quiz questions from the following learning material summary.

MATERIAL SUMMARY:
${materialSummary}

STUDENT LEVEL: ${levelLabel}
NUMBER OF QUESTIONS: ${state.settings.numQuestions}
QUESTION TYPES TO USE: ${selectedTypes}

INSTRUCTIONS:
1. Generate exactly ${state.settings.numQuestions} questions based ONLY on the material above.
2. Distribute question types as evenly as possible across: ${selectedTypes}
3. Detect the language from the BODY TEXT of the material (not the title). Use that language for all questions and answers. If body text is Bahasa Indonesia, use Bahasa Indonesia. If English, use English.
   - For true_false in Bahasa Indonesia: answer must be exactly "Benar" or "Salah"
   - For true_false in English: answer must be exactly "True" or "False"
4. Adjust difficulty appropriately for: ${levelLabel}
5. For multiple choice: exactly 4 options labeled A, B, C, D.
6. For fill in blank: replace key terms with ___.
7. For short answer: ask open-ended questions about main concepts.
8. EXPLANATION (very important): Write a comprehensive 2-4 sentence explanation for every question that:
   - Directly references the specific content, concept, or fact from the uploaded material
   - Explains WHY the answer is correct with reasoning or context from the material
   - For wrong answers in multiple choice, briefly clarifies why they are incorrect
   - Uses the same language as the question
   - Is detailed enough that a student can understand without re-reading the material

IMAGE CROP INSTRUCTIONS:
- The VISUAL MAP above lists all figures detected in the uploaded images with their exact positions.
- For up to 3 questions, set "imageCrop" by matching the question to the most relevant figure in the VISUAL MAP.
- Match by figureId (e.g. question mentions "Gambar 2.7" → use the entry with figureId "Gambar 2.7") OR by description keyword match.
- Copy x, y, w, h values exactly from the matching VISUAL MAP entry. Use the img index as-is.
- Format: {"img": <img>, "x": <x>, "y": <y>, "w": <w>, "h": <h>}
- Set imageCrop to null if no matching visual exists in the VISUAL MAP.
- Set svg to null for all questions.

Respond ONLY with valid JSON, no markdown:
{"subject":"...","language":"...","questions":[{"number":1,"type":"multiple_choice","question":"...","options":["A. ...","B. ...","C. ...","D. ..."],"answer":"A. ...","explanation":"...","svg":null,"imageCrop":{"img":0,"x":0.0,"y":0.1,"w":1.0,"h":0.4}},{"number":2,"type":"true_false","question":"...","options":[],"answer":"Benar","explanation":"...","svg":null,"imageCrop":null}]}`;
  }

  const dynamicTokensUpload = Math.min(8000, Math.max(3000, state.settings.numQuestions * 320));
  const generateRes = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-id-token': idToken || '' },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: dynamicTokensUpload,
      messages: [{ role: 'user', content: quizPrompt }]
    })
  });

  if (!generateRes.ok) {
    const err = await generateRes.json().catch(() => ({}));
    if (generateRes.status === 403 && err?.error === 'no_credits') {
      throw new Error('no_credits');
    }
    throw new Error(err?.error?.message || err?.error || `Generate error ${generateRes.status}`);
  }

  const data = await generateRes.json();

  // Update credit counter if server returned it
  // Sanitize svg and imageCrop fields
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
  } catch (e) {
    // Try to recover truncated JSON by closing open structures
    const truncated = clean.replace(/,\s*$/, '');
    const recovered = truncated
      .replace(/("(?:explanation|answer|question|svg)"\s*:\s*)"[^"]*$/, '$1""')
      .replace(/,?\s*\{[^}]*$/, '')  // remove last incomplete question object
      + (truncated.match(/\[/) && !truncated.match(/\]$/) ? ']}' : '');
    try {
      const parsed = JSON.parse(recovered);
      if (parsed.questions && parsed.questions.length > 0) {
        console.warn('JSON was truncated — recovered ' + parsed.questions.length + ' questions');
        return parsed;
      }
    } catch (_) {}
    throw new Error('Respons terpotong — coba lagi dengan lebih sedikit gambar.');
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
   - State WHY the answer is correct with key reasoning
   - For multiple choice: mention why the correct option is right
9. Adjust difficulty for ${levelLabel} students studying ${topik}.

Set "imageCrop" to null for all questions (no uploaded images in this mode).
Set "svg" to null for all questions.

Respond ONLY with valid JSON, no markdown:
{"subject":"${mapel} — ${topik}","language":"id","questions":[{"number":1,"type":"multiple_choice","question":"...","options":["A. ...","B. ...","C. ...","D. ..."],"answer":"A. ...","explanation":"...","svg":null,"imageCrop":null}]}`;

  // Dynamic max_tokens: ~300 tokens per question, min 3000, max 8000
  const dynamicTokens = Math.min(8000, Math.max(3000, numQuestions * 320));

  const res = await fetch('/api/generate', {
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

window.switchAppMode = function(mode) {
  const sections = {
    drill:  document.getElementById('drill-soal-section'),
    bantai: document.getElementById('bantai-soal-section'),
    tka:    document.getElementById('tka-soal-section'),
  };
  const tabs = {
    drill:  document.getElementById('tab-drill'),
    bantai: document.getElementById('tab-bantai'),
    tka:    document.getElementById('tab-tka'),
  };

  Object.keys(sections).forEach(k => {
    sections[k]?.classList.toggle('hidden', k !== mode);
    tabs[k]?.classList.toggle('active', k === mode);
  });

  // Init TKA when switching to it
  if (mode === 'tka' && window.TKA) {
    window.TKA.init();
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// ══════════════════════════════════════════════════════════════
//  BANTAI SOAL — Logic
// ══════════════════════════════════════════════════════════════

const bantaiState = {
  image: null   // { dataUrl, base64, mimeType }
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
  bantaiPreviewImg.src = '';
  bantaiPreviewWrap.classList.add('hidden');
  bantaiHint.textContent = '';
  stepBantaiResult.classList.add('hidden');
});

// ── Handle file ───────────────────────────────────────────────
function handleBantaiFile(file) {
  if (!file.type.startsWith('image/')) {
    bantaiHint.textContent = 'Hanya file gambar (JPG, PNG, WEBP) yang didukung.';
    return;
  }
  bantaiHint.textContent = '';
  const reader = new FileReader();
  reader.onload = e => {
    const img = new Image();
    img.onload = () => {
      const dataUrl = compressCanvas(imageToCanvas(img));
      const base64 = dataUrl.split(',')[1];
      bantaiState.image = { dataUrl, base64, mimeType: 'image/jpeg' };
      bantaiPreviewImg.src = dataUrl;
      bantaiPreviewWrap.classList.remove('hidden');
      // Hide any previous result
      stepBantaiResult.classList.add('hidden');
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

// ── Solve button ──────────────────────────────────────────────
btnBantai.addEventListener('click', solveBantaiSoal);

async function solveBantaiSoal() {
  if (!bantaiState.image) {
    bantaiHint.textContent = 'Upload foto soal terlebih dahulu.';
    return;
  }

  // Credit check
  const credits = window._currentCredits ?? 0;
  const isInvited = window._isInvited ?? false;
  if (!isInvited && credits <= 0) {
    bantaiHint.textContent = '';
    window.renderCreditsBanner?.();
    window.startCheckout?.();
    return;
  }

  bantaiHint.textContent = '';
  showBantaiLoading('Membaca soalmu…');

  try {
    const idToken = await window.getIdToken();

    const prompt = `Kamu adalah guru ahli yang sangat sabar dan berpengalaman. Seorang siswa mengirimkan foto yang mungkin berisi SATU atau BEBERAPA soal sekaligus.

Tugasmu:
1. Identifikasi dan baca SEMUA soal yang ada di foto ini — bisa 1 soal, bisa 5 soal, bisa lebih.
2. Selesaikan SETIAP soal secara SANGAT DETAIL, langkah demi langkah.

INSTRUKSI FORMAT RESPONS:
Jawab HANYA dalam JSON valid (tanpa markdown), dengan struktur berikut (SELALU berupa array, bahkan jika hanya 1 soal):

[
  {
    "question_number": 1,
    "question_text": "Teks soal nomor ini (tulis ulang dengan lengkap, termasuk nomor aslinya jika ada)",
    "subject": "Mata pelajaran soal ini (misal: Matematika, IPA, Bahasa Indonesia, dll)",
    "difficulty": "Mudah / Sedang / Sulit",
    "answer": "Jawaban akhir yang singkat dan jelas",
    "steps": [
      {
        "label": "Judul singkat langkah ini (maks 5 kata)",
        "content": "Penjelasan detail langkah ini. Gunakan kalimat lengkap, jelaskan MENGAPA langkah ini dilakukan, tulis rumus atau konsep yang dipakai, dan tunjukkan perhitungan/logika secara eksplisit."
      }
    ],
    "key_concepts": [
      "Konsep kunci #1 (kalimat singkat)",
      "Konsep kunci #2"
    ],
    "tips": "Tips atau trik untuk soal tipe ini. 2-3 kalimat praktis.",
    "language": "id"
  }
]

ATURAN PENTING:
- Output SELALU berupa JSON array (dalam tanda [ ]), bahkan jika hanya ada 1 soal.
- Identifikasi semua soal yang ada, jangan lewatkan satu pun.
- Gunakan bahasa yang SAMA dengan soal (Indonesia atau Inggris).
- Jumlah steps minimal 3, idealnya 4-6 langkah yang logis dan mengalir.
- Setiap step harus cukup detail: jangan hanya "substitusi nilai" tapi jelaskan nilai apa, dari mana, dan hasilnya berapa.
- Jika ada pilihan ganda, jelaskan mengapa pilihan benar itu benar DAN mengapa pilihan lain salah.
- Untuk soal hitungan: tunjukkan semua angka dan operasi matematika secara eksplisit.
- key_concepts harus berisi nama konsep/rumus/teori yang relevan.
- Output harus berupa JSON yang valid dan lengkap, tanpa karakter tambahan di luar JSON.`;

    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-id-token': idToken || '' },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 6000,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: bantaiState.image.mimeType, data: bantaiState.image.base64 } },
            { type: 'text', text: prompt }
          ]
        }]
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      if (res.status === 403 && err?.error === 'no_credits') {
        window.renderCreditsBanner?.();
        window.startCheckout?.();
        return;
      }
      throw new Error(err?.error?.message || err?.error || `Error ${res.status}`);
    }

    const data = await res.json();

    // Update credit counter
    if (typeof data._credits === 'number') {
      window._currentCredits = data._credits;
      window.renderCreditsBanner?.();
    }

    // Parse response
    const rawText = (data.content || []).map(b => b.text || '').join('');
    const clean = rawText.replace(/```json|```/g, '').trim();
    let result;
    try {
      const parsed = JSON.parse(clean);
      // Normalise: always an array
      result = Array.isArray(parsed) ? parsed : [parsed];
    } catch(e) {
      throw new Error('Format respons tidak valid. Coba lagi.');
    }

    renderBantaiResult(result);

  } catch(err) {
    console.error('Bantai error:', err);
    bantaiHint.textContent = 'Error: ' + (err.message || 'Gagal menyelesaikan soal. Coba lagi.');
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
  bantaiPreviewImg.src = '';
  bantaiPreviewWrap.classList.add('hidden');
  bantaiResultContent.innerHTML = '';
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
