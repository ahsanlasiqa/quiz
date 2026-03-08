/* ============================================
   QUIZGEN — APP LOGIC v6
   Fixes: 504 timeout, diagrams, PDF upload
   ============================================ */

// ── State ──────────────────────────────────
const state = {
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
    setTimeout(() => generateHint.textContent = '🎉 Payment successful! Your generations have been added.', 800);
  } else if (params.get('payment') === 'pending') {
    window.history.replaceState({}, '', window.location.pathname);
    setTimeout(() => generateHint.textContent = '⏳ Payment pending. Generations will be added once confirmed.', 800);
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

  if (credits > 0) {
    banner.className = 'subscription-banner trial';
    banner.innerHTML = `
      <span>⚡ <strong>${credits} generation${credits !== 1 ? 's' : ''}</strong> remaining</span>
      <button class="btn-subscribe" onclick="window.startCheckout()">+ Buy 60 more — Rp 47.000</button>
    `;
  } else {
    banner.className = 'subscription-banner expired';
    banner.innerHTML = `
      <span>🪫 You've used all your generations.</span>
      <button class="btn-subscribe" onclick="window.startCheckout()">Buy 60 generations — Rp 47.000</button>
    `;
  }
  banner.classList.remove('hidden');
};

window.startCheckout = async function() {
  try {
    const idToken = await window.getIdToken();
    const res = await fetch('/api/create-transaction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-id-token': idToken }
    });
    const data = await res.json();
    if (!data.token) {
      alert('Could not start payment: ' + (data.error || 'Unknown error'));
      return;
    }
    // Open Midtrans Snap payment popup
    window.snap.pay(data.token, {
      onSuccess: function(result) {
        window._currentCredits += 60;
        window.renderCreditsBanner();
        generateHint.textContent = '🎉 Payment successful! 60 generations added to your account.';
      },
      onPending: function(result) {
        generateHint.textContent = '⏳ Payment pending. Your access will be activated once confirmed.';
      },
      onError: function(result) {
        generateHint.textContent = '❌ Payment failed. Please try again.';
      },
      onClose: function() {
        // User closed popup without paying — do nothing
      }
    });
  } catch (err) {
    alert('Payment error: ' + err.message);
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
numMinus.addEventListener('click', () => {
  const v = parseInt(numQuestionsInput.value);
  if (v > 1) numQuestionsInput.value = v - 1;
});
numPlus.addEventListener('click', () => {
  const v = parseInt(numQuestionsInput.value);
  if (v < 50) numQuestionsInput.value = v + 1;
});
numQuestionsInput.addEventListener('change', () => {
  let v = parseInt(numQuestionsInput.value);
  if (isNaN(v) || v < 1) v = 1;
  if (v > 50) v = 50;
  numQuestionsInput.value = v;
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
  pdfProgressText.textContent = `Loading ${file.name}…`;
  pdfProgressFill.style.width = '0%';

  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const totalPages = pdf.numPages;

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      pdfProgressText.textContent = `Converting page ${pageNum} of ${totalPages}…`;
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
function renderPreviews() {
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
  state.settings.level = levelToggle.querySelector('.level-btn.active').dataset.value;
  const activePill = gradePills.querySelector('.grade-pill.active');
  state.settings.grade = activePill ? parseInt(activePill.dataset.value) : GRADE_CONFIG[state.settings.level].grades[0].value;
  state.settings.numQuestions = parseInt(numQuestionsInput.value) || 10;
  state.settings.types = Array.from(document.querySelectorAll('input[name="qtype"]:checked')).map(c => c.value);
  state.settings.studentName = studentNameInput.value.trim();
  state.settings.date = quizDateInput.value;
}

// ── Generate Quiz ──────────────────────────
btnGenerate.addEventListener('click', generateQuiz);
btnRegenerate.addEventListener('click', generateQuiz);

async function generateQuiz() {
  collectSettings();
  if (state.images.length === 0) {
    generateHint.textContent = 'Please upload at least one photo or PDF page.';
    return;
  }
  if (state.settings.types.length === 0) {
    generateHint.textContent = 'Please select at least one question type.';
    return;
  }
  generateHint.textContent = '';
  const n = state.settings.numQuestions;
  const estimatedSecs = Math.max(20, n * 3);
  showLoading('Analyzing your material…', `Generating ${n} questions — may take up to ${estimatedSecs}s`);
  try {
    const quiz = await callClaude();
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
      generateHint.textContent = 'Error: ' + (err.message || 'Could not generate quiz.');
    }
  } finally {
    hideLoading();
  }
}

// ── Claude API Call ────────────────────────
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

  const prompt = `You are an expert teacher creating quiz questions from provided textbook/learning material images.

STUDENT LEVEL: ${levelLabel}
NUMBER OF QUESTIONS: ${state.settings.numQuestions}
QUESTION TYPES TO USE: ${selectedTypes}

INSTRUCTIONS:
1. Carefully read ALL the text and content in the provided images.
2. Generate exactly ${state.settings.numQuestions} questions based ONLY on the material shown.
3. Distribute question types as evenly as possible across: ${selectedTypes}
4. Match the language used in the material (Bahasa Indonesia or English).
5. Adjust difficulty appropriately for: ${levelLabel}
6. For multiple choice: exactly 4 options labeled A, B, C, D.
7. For fill in blank: replace key terms with ___.
8. For short answer: ask open-ended questions about main concepts.

DIAGRAM INSTRUCTIONS (very important):
- For any question involving shapes, geometry, measurement, graphs, diagrams, or visual concepts, you MUST include an SVG diagram.
- The SVG should be simple, clean, and directly illustrate the question (e.g. a square with labeled sides for a perimeter question).
- Use stroke="#1a7a6e" fill="none" or fill="#fef3d0" for shapes. Use font-size="12" for labels.
- Keep SVG width="200" height="150" viewBox="0 0 200 150".
- If no diagram is needed, set "svg" to null.

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
      "explanation": "Brief explanation of why this answer is correct (1-2 sentences).",
      "svg": null
    },
    {
      "number": 2,
      "type": "multiple_choice",
      "question": "What is the perimeter of the square below?",
      "options": ["A. 16 cm", "B. 20 cm", "C. 24 cm", "D. 12 cm"],
      "answer": "A. 16 cm",
      "svg": "<svg width='200' height='150' viewBox='0 0 200 150' xmlns='http://www.w3.org/2000/svg'><rect x='50' y='25' width='100' height='100' stroke='#1a7a6e' stroke-width='2' fill='#fef3d0'/><text x='95' y='18' font-size='12' fill='#1a1208'>4 cm</text><text x='160' y='80' font-size='12' fill='#1a1208'>4 cm</text></svg>"
    },
    {
      "number": 3,
      "type": "true_false",
      "question": "statement",
      "options": [],
      "answer": "True",
      "explanation": "Brief explanation.",
      "svg": null
    },
    {
      "number": 4,
      "type": "fill_blank",
      "question": "The ___ of a square is calculated by adding all four sides.",
      "options": [],
      "answer": "perimeter",
      "explanation": "Brief explanation.",
      "svg": null
    },
    {
      "number": 5,
      "type": "short_answer",
      "question": "Explain...",
      "options": [],
      "answer": "Model answer: ...",
      "explanation": "Key points to look for in the answer.",
      "svg": null
    }
  ]
}`;

  const contentParts = [{ type: 'text', text: prompt }];
  state.images.forEach(img => {
    contentParts.push({
      type: 'image',
      source: { type: 'base64', media_type: img.mimeType, data: img.base64 }
    });
  });

  loadingText.textContent = 'Generating questions…';

  const idToken = await window.getIdToken();
  const response = await fetch('/api/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-id-token': idToken || '',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5',
      max_tokens: 8000,
      messages: [{ role: 'user', content: contentParts }]
    })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    if (response.status === 403 && err?.error === 'no_credits') {
      throw new Error('no_credits');
    }
    throw new Error(err?.error?.message || err?.error || `API error ${response.status}`);
  }

  const data = await response.json();

  // Update credit counter if server returned it
  if (typeof data._credits === 'number') {
    window._currentCredits = data._credits;
    window.renderCreditsBanner();
  }

  const rawText = data.content.map(b => b.text || '').join('');
  const clean = rawText.replace(/```json|```/g, '').trim();
  const parsed = JSON.parse(clean);
  return parsed;
}

// ── Render Quiz ────────────────────────────
function renderQuiz(quiz) {
  const config = GRADE_CONFIG[state.settings.level];
  const gradeLabel = `${config.emoji} ${config.label} · Grade ${state.settings.grade}`;
  quizMetaText.textContent = `${quiz.subject || 'Quiz'} · ${gradeLabel} · ${quiz.questions.length} questions · ${quiz.language || ''}`;

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
      body = `<p class="q-text">${q.question}</p>${svgBlock}<p class="q-essay-hint">Answer in 2–4 sentences.</p>`;
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
    doc.text('QuizGen', margin, 8);
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
  doc.text(`${quiz.subject || 'Quiz'} - for teacher use only`, pageW - margin, 12, { align: 'right' });

  y = 26;
  setFont(9, 'normal', colors.muted);
  doc.text(`Generated by QuizGen  -  ${new Date().toLocaleDateString()}`, margin, y);
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
      <button class="iq-btn-submit" id="iq-submit">Submit Quiz ⚡</button>
      <p class="iq-submit-hint" id="iq-submit-hint"></p>
    </div>`;

  container.innerHTML = html;

  // Submit handler
  document.getElementById('iq-submit').addEventListener('click', () => {
    submitInteractiveQuiz(quiz);
  });

  // Close button
  document.getElementById('iq-close').addEventListener('click', closeInteractiveQuiz);
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
    inputHtml = `<p class="iq-fill-label">Your answer:</p>
      <input type="text" class="iq-text-input" data-qi="${i}" placeholder="Type your answer…" />`;
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
    inputHtml = `<p class="iq-fill-label">Your answer:</p>
      <textarea class="iq-textarea" data-qi="${i}" placeholder="Write your answer here…" rows="3"></textarea>`;
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
    hint.textContent = `⚠️ ${unanswered.length} question(s) unanswered (Q${unanswered.join(', Q')}). Submit anyway?`;
    hint.style.color = 'var(--amber)';
    // Change button to confirm
    const btn = document.getElementById('iq-submit');
    btn.textContent = 'Yes, Submit Anyway ⚡';
    btn.onclick = () => showInteractiveResults(quiz, answers);
    return;
  }

  showInteractiveResults(quiz, answers);
}

function isCorrect(q, userAnswer) {
  if (!userAnswer) return false;
  const correct = (q.answer || '').toString().trim().toLowerCase();
  const user = userAnswer.toString().trim().toLowerCase();

  // For multiple choice — check if answer starts with or contains the correct letter/text
  if (q.type === 'multiple_choice') {
    // answer might be "A. Paris" or just "A" or "Paris"
    const correctLetter = correct.charAt(0);
    const userLetter = user.charAt(0);
    if (correctLetter === userLetter) return true;
    return user.includes(correct) || correct.includes(user);
  }
  if (q.type === 'true_false') {
    return correct.startsWith(user) || user.startsWith(correct);
  }
  // Fill blank — loose match
  return correct.includes(user) || user.includes(correct);
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

    let userAnswerDisplay = userAnswer || '<em>No answer</em>';
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
          <span class="iq-result-verdict">${correct ? 'Correct!' : 'Incorrect'}</span>
        </div>
        <p class="iq-result-question">${q.question}</p>
        ${q.svg ? `<div class="q-diagram">${q.svg}</div>` : ''}
        ${optionsReview}
        <div class="iq-result-answers">
          ${!correct ? `<div class="iq-your-answer">Your answer: <strong>${userAnswerDisplay}</strong></div>` : ''}
          <div class="iq-correct-answer">Correct answer: <strong>${q.answer}</strong></div>
        </div>
        ${q.explanation ? `<div class="iq-explanation">💡 <strong>Explanation:</strong> ${q.explanation}</div>` : ''}
      </div>`;
  });

  const pct = Math.round((score / quiz.questions.length) * 100);
  const emoji = pct >= 80 ? '🏆' : pct >= 60 ? '👍' : pct >= 40 ? '📚' : '💪';
  const msg = pct >= 80 ? 'Excellent work!' : pct >= 60 ? 'Good job!' : pct >= 40 ? 'Keep studying!' : 'Don\'t give up!';

  container.innerHTML = `
    <div class="iq-score-banner">
      <div class="iq-score-emoji">${emoji}</div>
      <div class="iq-score-number">${score} / ${quiz.questions.length}</div>
      <div class="iq-score-pct">${pct}% · ${msg}</div>
    </div>
    <div class="iq-results-list">${resultsHtml}</div>
    <div class="iq-done-wrap">
      <button class="iq-btn-done" onclick="closeInteractiveQuiz()">✓ Done</button>
    </div>`;
}

function closeInteractiveQuiz() {
  document.getElementById('interactive-overlay').classList.add('hidden');
  document.body.style.overflow = '';
}
