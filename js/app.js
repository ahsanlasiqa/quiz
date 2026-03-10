/* ============================================
   QUIZGEN — APP LOGIC v6
   Fixes: 504 timeout, diagrams, PDF upload
   ============================================ */

// ── Limits ─────────────────────────────────
const LIMITS = {
  maxImages: 15,
  maxQuestions: 18,
  warnImages: 12,
  warnQuestions: 15,
};

// ── State ──────────────────────────────────
const state = {
  gambars: [],
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
const gambarPreviewGrid  = document.getElementById('gambar-preview-grid');
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
    setTimeout(() => generateHint.textContent = '🎉 Payment successful! Your generasis have been added.', 800);
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

  if (window._isInvited) {
    banner.classList.add('hidden');
    return;
  }

  const credits = window._currentCredits;
  const statusText = credits > 0
    ? `⚡ <strong>${credits} generasi</strong> tersisa`
    : `🪫 Kredit Anda habis.`;

  banner.className = credits > 0 ? 'subscription-banner trial' : 'subscription-banner expired';
  banner.innerHTML = `
    <span>${statusText}</span>
    <div class="banner-buy-btns">
      <button class="btn-subscribe btn-subscribe-sm" onclick="window.startCheckout(30)">Beli 30 Soal — Rp 29.900</button>
      <button class="btn-subscribe btn-subscribe-hot" onclick="window.startCheckout(60)">🔥 60 Soal — Rp 49.900</button>
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
        generateHint.textContent = '🎉 Pembayaran berhasil! Kredit telah ditambahkan.';
      },
      onPending: function(result) {
        generateHint.textContent = '⏳ Pembayaran pending. Kredit akan aktif setelah dikonfirmasi.';
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

// ── Number dari Questions ────────────────────
function updateQuestionsCounter(v) {
  const counter = document.getElementById('questions-counter');
  if (!counter) return;
  if (v >= LIMITS.maxQuestions) {
    counter.textContent = `${v} / ${LIMITS.maxQuestions} soal · Maximum reached`;
    counter.className = 'questions-counter warn';
  } else if (v >= LIMITS.warnQuestions) {
    counter.textContent = `${v} / ${LIMITS.maxQuestions} soal · Getting close to the limit`;
    counter.className = 'questions-counter warn-soft';
  } else {
    counter.textContent = `${v} / ${LIMITS.maxQuestions} questions`;
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
  for (const file dari files) {
    if (state.gambars.length >= LIMITS.maxImages) {
      generateHint.textContent = `Maximum ${LIMITS.maxImages} gambars reached. Remove some before adding more.`;
      break;
    }
    if (file.type === 'application/pdf') {
      await handlePDF(file);
    } else if (file.type.startsWith('gambar/')) {
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
      if (state.gambars.length >= LIMITS.maxImages) {
        pdfProgressText.textContent = `Berhenti di halaman ${pageNum - 1} — maksimum ${LIMITS.maxImages} gambars reached.`;
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

      // Compress to JPEG like we do for gambars
      const dataUrl = compressCanvas(canvas);
      const base64 = dataUrl.split(',')[1];
      state.gambars.push({
        file: { name: `${file.name} p.${pageNum}` },
        dataUrl,
        base64,
        mimeType: 'gambar/jpeg',
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
        const dataUrl = compressCanvas(gambarToCanvas(img));
        const base64 = dataUrl.split(',')[1];
        state.gambars.push({ file, dataUrl, base64, mimeType: 'gambar/jpeg' });
        renderPreviews();
        resolve();
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

function gambarToCanvas(img) {
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
    return c2.toDataURL('gambar/jpeg', 0.82);
  }
  return canvas.toDataURL('gambar/jpeg', 0.82);
}

// ── Previews ───────────────────────────────
function updateImageCounter() {
  const counter = document.getElementById('gambar-counter');
  if (!counter) return;
  const count = state.gambars.length;
  if (count === 0) {
    counter.textContent = '';
    counter.className = 'gambar-counter';
  } else if (count >= LIMITS.maxImages) {
    counter.textContent = `${count} / ${LIMITS.maxImages} gambars · Maximum reached`;
    counter.className = 'gambar-counter warn';
  } else if (count >= LIMITS.warnImages) {
    counter.textContent = `${count} / ${LIMITS.maxImages} gambars · Getting close to the limit`;
    counter.className = 'gambar-counter warn-soft';
  } else {
    counter.textContent = `${count} / ${LIMITS.maxImages} gambars`;
    counter.className = 'gambar-counter';
  }
}

function renderPreviews() {
  updateImageCounter();
  gambarPreviewGrid.innerHTML = '';
  state.gambars.forEach((img, i) => {
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
    gambarPreviewGrid.appendChild(div);
  });
  gambarPreviewGrid.querySelectorAll('.preview-remove').forEach(btn => {
    btn.addEventListener('click', () => {
      state.gambars.splice(parseInt(btn.dataset.idx), 1);
      renderPreviews();
    });
  });
}

// ── Collect Settings ───────────────────────
function collectSettings() {
  state.settings.level = levelToggle.querySelector('.level-btn.active').dataset.value;
  const activePill = gradePills.querySelector('.grade-pill.active');
  state.settings.grade = activePill ? parseInt(activePill.dataset.value) : GRADE_CONFIG[state.settings.level].grades[0].value;
  state.settings.numQuestions = parseInt(numQuestionsInput.value) || 10;
  state.settings.types = Array.from(document.querySelectorAll('input[name="qtype"]:checked')).map(c => c.value);
  state.settings.studentName = studentNameInput.value.trim();
  state.settings.date = quizDateInput.value;
}

// ── Generate Soal ──────────────────────────
btnGenerate.addEventListener('click', generateSoal);
btnRegenerate.addEventListener('click', generateSoal);

async function generateSoal() {
  collectSettings();
  if (state.gambars.length === 0) {
    generateHint.textContent = 'Upload minimal satu foto atau halaman PDF.';
    return;
  }
  if (state.settings.types.length === 0) {
    generateHint.textContent = 'Pilih minimal satu jenis soal.';
    return;
  }
  generateHint.textContent = '';
  showLoading('Langkah 1/2: Membaca materi…', `Menganalisis ${state.gambars.length} gambar${state.gambars.length !== 1 ? 's' : ''}…`);
  try {
    const quiz = await callClaude();
    state.quizData = quiz;
    renderSoal(quiz);
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
  const config = GRADE_CONFIG[state.settings.level];
  const levelLabel = `${config.label}, Grade ${state.settings.grade}`;
  const typeNames = {
    multiple_choice: 'Multiple Choice (4 options labeled A-D)',
    true_false: 'True / False',
    fill_blank: 'Fill in the Blank (use ___ for the blank)',
    short_answer: 'Short Answer / Essay'
  };
  const selectedTypes = state.settings.types.map(t => typeNames[t]).join(', ');
  const idToken = await window.getIdToken();

  // ── STEP 1: Extract content from gambars (batched) ──
  const BATCH_SIZE = 5;
  const batches = [];
  for (let i = 0; i < state.gambars.length; i += BATCH_SIZE) {
    batches.push(state.gambars.slice(i, i + BATCH_SIZE));
  }

  const extractPromptText = (batchNum, total) =>
    `You are a teacher's assistant. Carefully read ALL the content in these gambars (batch ${batchNum} dari ${total}).

Extract a concise but complete summary including:
1. Subject/topic name and language (Bahasa Indonesia or English)
2. ALL key concepts, facts, definitions, formulas
3. Important terms, names, dates, numbers
4. Any diagrams or visual content described briefly

Be thorough but concise — max 800 words. This will be used to generate quiz questions.`;

  const summaries = [];
  for (let b = 0; b < batches.length; b++) {
    showLoading(
      `Step 1/2: Reading gambars… (batch ${b + 1}/${batches.length})`,
      `Processing gambars ${b * BATCH_SIZE + 1}–${Math.min((b + 1) * BATCH_SIZE, state.gambars.length)} dari ${state.gambars.length}`
    );

    const parts = [{ type: 'text', text: extractPromptText(b + 1, batches.length) }];
    batches[b].forEach(img => {
      parts.push({ type: 'gambar', source: { type: 'base64', media_type: img.mimeType, data: img.base64 } });
    });

    const extractRes = await fetch('/api/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-id-token': idToken || '' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 2000,
        messages: [{ role: 'user', content: parts }]
      })
    });

    if (!extractRes.ok) {
      const err = await extractRes.json().catch(() => ({}));
      throw new Error(err?.error?.message || err?.error || `Extract error ${extractRes.status}`);
    }

    const extractData = await extractRes.json();
    summaries.push(extractData.content.map(b => b.text || '').join(''));
  }

  const materialSummary = summaries.join('\n\n---\n\n');

  // ── STEP 2: Generate quiz from summary ───
  showLoading('Langkah 2/2: Membuat soal…', `Membuat ${state.settings.numQuestions} soal dari konten yang diekstrak…`);

  const quizPrompt = `You are an expert teacher creating quiz questions from the following learning material summary.

MATERIAL SUMMARY:
${materialSummary}

STUDENT LEVEL: ${levelLabel}
NUMBER OF QUESTIONS: ${state.settings.numQuestions}
QUESTION TYPES TO USE: ${selectedTypes}

INSTRUCTIONS:
1. Generate exactly ${state.settings.numQuestions} questions based ONLY on the material above.
2. Distribute question types as evenly as possible across: ${selectedTypes}
3. Match the language used in the material (Bahasa Indonesia or English).
4. Adjust difficulty appropriately for: ${levelLabel}
5. For multiple choice: exactly 4 options labeled A, B, C, D.
6. For fill in blank: replace key terms with ___.
7. For short answer: ask open-ended questions about main concepts.

DIAGRAM INSTRUCTIONS (very important):
- Whenever a diagram, illustration, or visual would help clarify or enrich a question, you MUST include an SVG. This applies to ALL subjects, not just math. Examples:
  * Science: food chain, water cycle, plant cell, animal body part, circuit
  * Biology: leaf, food web arrows, heart diagram
  * Geography: simple map, compass rose, landform cross-section
  * History: simple timeline with labeled events
  * Math: shapes, graphs, number lines, measurements
  * Language: a simple scene to describe (e.g. a house, a person, objects)
- Aim to include SVG diagrams in at least 30% dari questions across any subject.
- The SVG should be simple, clean, labeled, and directly relevant to the question.
- Use stroke="#1a7a6e" fill="none" or fill="#fef3d0" for shapes. Use fill="#1a1208" font-size="11" for text labels.
- Keep SVG width="200" height="150" viewBox="0 0 200 150".
- Only set "svg" to null if no visual would add any value to the question.

Respond ONLY with valid JSON, no markdown, no extra text:
{
  "subject": "detected subject name",
  "language": "detected language",
  "questions": [
    {
      "number": 1,
      "type": "multiple_choice",
      "question": "question text",
      "options": ["A. option1", "B. option2", "C. option3", "D. option4"],
      "answer": "A. option1",
      "explanation": "Brief explanation dari why this answer is correct (1-2 sentences).",
      "svg": null
    },
    {
      "number": 2,
      "type": "true_false",
      "question": "statement",
      "options": [],
      "answer": "True",
      "explanation": "Brief explanation.",
      "svg": null
    },
    {
      "number": 3,
      "type": "fill_blank",
      "question": "The ___ dari a square is calculated by adding all four sides.",
      "options": [],
      "answer": "perimeter",
      "explanation": "Brief explanation.",
      "svg": null
    },
    {
      "number": 4,
      "type": "short_answer",
      "question": "Explain...",
      "options": [],
      "answer": "Model answer: ...",
      "explanation": "Key points to look for in the answer.",
      "svg": null
    }
  ]
}`;

  const generateRes = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-id-token': idToken || '' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5',
      max_tokens: 5000,
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
  if (typedari data._credits === 'number') {
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
    throw new Error('Response was cut off — please try again with fewer gambars or a fresh upload.');
  }
}

// ── Render Soal ────────────────────────────
function renderSoal(quiz) {
  const config = GRADE_CONFIG[state.settings.level];
  const gradeLabel = `${config.emoji} ${config.label} · Grade ${state.settings.grade}`;
  quizMetaText.textContent = `${quiz.subject || 'Soal'} · ${gradeLabel} · ${quiz.questions.length} soal · ${quiz.language || ''}`;

  let html = '';
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
      body = `<p class="q-text">${q.question}</p>${svgBlock}<ul class="q-options"><li>A. True</li><li>B. False</li></ul>`;
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

// ── Interactive Soal ────────────────────────
btnInteractive.addEventListener('click', () => {
  if (!state.quizData) return;
  startInteractiveSoal(state.quizData);
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
    doc.text('SoalGen', margin, 8);
    doc.text(`${quiz.subject || 'Soal'} · ${quiz.language || ''}`, pageW - margin, 8, { align: 'right' });
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
  doc.text(quiz.subject || 'Soal', margin, y);
  y += 8;

  const config = GRADE_CONFIG[state.settings.level];
  const gradeLabel = `${config.label} · Grade ${state.settings.grade}`;
  setFont(10, 'normal', colors.muted);
  doc.text(`${gradeLabel} · ${quiz.questions.length} Questions · ${quiz.language || ''}`, margin, y);
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

    // Embed SVG diagram as rendered gambar in PDF
    if (q.svg) {
      try {
        const svgBlob = new Blob([q.svg], { type: 'gambar/svg+xml' });
        const url = URL.createObjectURL(svgBlob);
        // Render SVG to canvas synchronously via a pre-drawn gambar
        // We'll add a placeholder note since async isn't ideal in sync PDF generasi
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
      doc.text('A. True          B. False', margin + 6, y);
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
  doc.text(`${quiz.subject || 'Soal'} - for teacher use only`, pageW - margin, 12, { align: 'right' });

  y = 26;
  setFont(9, 'normal', colors.muted);
  doc.text(`Generated by SoalGen  -  ${new Date().toLocaleDateString()}`, margin, y);
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
    const svgDoc = parser.parseFromString(svgStr, 'gambar/svg+xml');
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

// ── New Soal ───────────────────────────────
btnNew.addEventListener('click', () => {
  // Reset quiz output visibility for next generasi
  document.getElementById('quiz-output').classList.add('hidden');
  document.getElementById('quiz-meta-bar').classList.add('hidden');
  state.gambars = [];
  state.quizData = null;
  gambarPreviewGrid.innerHTML = '';
  quizOutput.innerHTML = '';
  stepResults.classList.add('hidden');
  generateHint.textContent = '';
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// ── Memuat Helpers ────────────────────────
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

function startInteractiveSoal(quiz) {
  const overlay = document.getElementById('interactive-overlay');
  const container = document.getElementById('interactive-container');
  overlay.classList.remove('hidden');
  document.body.style.overflow = 'hidden';

  // Render all questions interactively
  let html = `
    <div class="iq-header">
      <div class="iq-title">📝 ${quiz.subject || 'Interactive Soal'}</div>
      <div class="iq-meta">${quiz.questions.length} soal · Jawab semua lalu kumpulkan</div>
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

  // Submit handler
  document.getElementById('iq-submit').addEventListener('click', () => {
    submitInteractiveSoal(quiz);
  });

  // Close button
  document.getElementById('iq-close').addEventListener('click', closeInteractiveSoal);
}

function renderInteractiveQuestion(q, i) {
  const typeLabelMap = {
    multiple_choice: 'Multiple Choice',
    true_false: 'True / False',
    fill_blank: 'Fill in the Blank',
    short_answer: 'Short Answer'
  };
  const typeLabel = typeLabelMap[q.type] || q.type;
  const svgBlock = q.svg ? `<div class="q-diagram">${q.svg}</div>` : '';

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
      ['True', 'False'].map(opt => `
        <label class="iq-option" data-qi="${i}">
          <input type="radio" name="q${i}" value="${opt}" />
          <span class="iq-option-box"></span>
          <span class="iq-option-text">${opt}</span>
        </label>`).join('') +
      '</div>';
  } else if (q.type === 'fill_blank') {
    const rendered = q.question.replace(/___/g, '<span class="q-blank-line"></span>');
    // Count blanks to hint format
    const blankCount = (q.question.match(/___/g) || []).length;
    const hint = blankCount > 1
      ? `Type ${blankCount} answers separated by commas (e.g. answer1, answer2)`
      : 'Tulis jawabanmu';
    inputHtml = `<p class="iq-fill-label">Jawaban kamu: <span class="iq-format-hint">${hint}</span></p>
      <input type="text" class="iq-text-input" data-qi="${i}" placeholder="${hint}…" />`;
    return `
      <div class="iq-question" id="iq-q${i}">
        <div class="iq-q-header">
          <span class="q-number">Question ${q.number}</span>
          <span class="q-type-badge">${typeLabel}</span>
        </div>
        <p class="q-text">${rendered}</p>
        ${svgBlock}
        ${inputHtml}
      </div>`;
  } else {
    // Short answer / essay
    inputHtml = `<p class="iq-fill-label">Jawaban kamu: <span class="iq-format-hint">Tulis 2–4 kalimat</span></p>
      <textarea class="iq-textarea" data-qi="${i}" placeholder="Tulis jawaban di sini…" rows="3"></textarea>`;
  }

  return `
    <div class="iq-question" id="iq-q${i}">
      <div class="iq-q-header">
        <span class="q-number">Question ${q.number}</span>
        <span class="q-type-badge">${typeLabel}</span>
      </div>
      <p class="q-text">${q.type !== 'fill_blank' ? q.question : ''}</p>
      ${svgBlock}
      ${inputHtml}
    </div>`;
}

function submitInteractiveSoal(quiz) {
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
    hint.textContent = `⚠️ ${unanswered.length} question(s) belum dijawab (Q${unanswered.join(', Q')}). Kumpulkan tetap?`;
    hint.style.color = 'var(--amber)';
    // Change button to confirm
    const btn = document.getElementById('iq-submit');
    btn.textContent = 'Ya, Kumpulkan Sekarang ⚡';
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
    const cFirst = correct.charAt(0);
    const uFirst = user.charAt(0);
    return cFirst === uFirst; // t/f match
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
        ${q.svg ? `<div class="q-diagram">${q.svg}</div>` : ''}
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
  const msg = pct >= 80 ? 'Luar biasa!' : pct >= 60 ? 'Bagus!' : pct >= 40 ? 'Terus belajar!' : 'Don\'t give up!';

  container.innerHTML = `
    <div class="iq-score-banner">
      <div class="iq-score-emoji">${emoji}</div>
      <div class="iq-score-number">${score} / ${quiz.questions.length}</div>
      <div class="iq-score-pct">${pct}% · ${msg}</div>
    </div>
    <div class="iq-results-list">${resultsHtml}</div>
    <div class="iq-done-wrap">
      <button class="iq-btn-done" onclick="closeInteractiveSoal()">✓ Selesai</button>
    </div>`;
}

function closeInteractiveSoal() {
  document.getElementById('interactive-overlay').classList.add('hidden');
  document.body.style.overflow = '';
}
