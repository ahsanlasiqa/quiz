/* ============================================
   QUIZGEN — APP LOGIC
   ============================================ */

// ── State ──────────────────────────────────
const state = {
  apiKey: localStorage.getItem('quizgen_api_key') || '',
  images: [],        // { file, dataUrl, base64, mimeType }
  quizData: null,    // parsed quiz JSON
  settings: {
    level: 'elementary',
    numQuestions: 10,
    types: ['multiple_choice', 'true_false', 'fill_blank', 'short_answer'],
    studentName: '',
    date: ''
  }
};

// ── DOM Refs ───────────────────────────────
const modalOverlay       = document.getElementById('modal-overlay');
const apiKeyInput        = document.getElementById('api-key-input');
const btnModalSave       = document.getElementById('btn-modal-save');
const uploadZone         = document.getElementById('upload-zone');
const fileInput          = document.getElementById('file-input');
const imagePreviewGrid   = document.getElementById('image-preview-grid');
const btnGenerate        = document.getElementById('btn-generate');
const generateHint       = document.getElementById('generate-hint');
const loadingOverlay     = document.getElementById('loading-overlay');
const loadingText        = document.getElementById('loading-text');
const stepResults        = document.getElementById('step-results');
const quizOutput         = document.getElementById('quiz-output');
const quizMetaText       = document.getElementById('quiz-meta-text');
const btnPdf             = document.getElementById('btn-pdf');
const btnNew             = document.getElementById('btn-new');
const btnRegenerate      = document.getElementById('btn-regenerate');
const numQuestionsInput  = document.getElementById('num-questions');
const numMinus           = document.getElementById('num-minus');
const numPlus            = document.getElementById('num-plus');
const levelToggle        = document.getElementById('level-toggle');
const studentNameInput   = document.getElementById('student-name');
const quizDateInput      = document.getElementById('quiz-date');

// ── Init ───────────────────────────────────
(function init() {
  if (!state.apiKey) {
    modalOverlay.classList.remove('hidden');
  } else {
    modalOverlay.classList.add('hidden');
  }
  quizDateInput.valueAsDate = new Date();
})();

// ── API Key Modal ──────────────────────────
document.getElementById('btn-change-key').addEventListener('click', () => {
  apiKeyInput.value = '';
  modalOverlay.classList.remove('hidden');
});

btnModalSave.addEventListener('click', () => {
  const key = apiKeyInput.value.trim();
  if (!key.startsWith('sk-ant-')) {
    apiKeyInput.style.borderColor = '#e05c3a';
    apiKeyInput.placeholder = 'Key must start with sk-ant-...';
    return;
  }
  state.apiKey = key;
  localStorage.setItem('quizgen_api_key', key);
  modalOverlay.classList.add('hidden');
});

// ── Level Toggle ───────────────────────────
levelToggle.querySelectorAll('.toggle-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    levelToggle.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.settings.level = btn.dataset.value;
  });
});

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
fileInput.addEventListener('change', () => {
  handleFiles(Array.from(fileInput.files));
  fileInput.value = '';
});

function handleFiles(files) {
  const imageFiles = files.filter(f => f.type.startsWith('image/'));
  imageFiles.forEach(file => {
    const reader = new FileReader();
    reader.onload = e => {
      const dataUrl = e.target.result;
      const base64 = dataUrl.split(',')[1];
      state.images.push({ file, dataUrl, base64, mimeType: file.type });
      renderPreviews();
    };
    reader.readAsDataURL(file);
  });
}

function renderPreviews() {
  imagePreviewGrid.innerHTML = '';
  state.images.forEach((img, i) => {
    const div = document.createElement('div');
    div.className = 'preview-item';
    div.innerHTML = `
      <img src="${img.dataUrl}" alt="Page ${i+1}" />
      <button class="preview-remove" data-idx="${i}" title="Remove">✕</button>
      <span class="preview-num">Page ${i+1}</span>
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
  state.settings.level = levelToggle.querySelector('.toggle-btn.active').dataset.value;
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

  // Validation
  if (state.images.length === 0) {
    generateHint.textContent = '⚠ Please upload at least one photo of the learning material.';
    return;
  }
  if (state.settings.types.length === 0) {
    generateHint.textContent = '⚠ Please select at least one question type.';
    return;
  }
  generateHint.textContent = '';

  showLoading('Reading your material…');

  try {
    const quiz = await callClaude();
    state.quizData = quiz;
    renderQuiz(quiz);
    stepResults.classList.remove('hidden');
    stepResults.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (err) {
    console.error(err);
    generateHint.textContent = '⚠ Error: ' + (err.message || 'Could not generate quiz. Check your API key.');
  } finally {
    hideLoading();
  }
}

// ── Claude API Call ────────────────────────
async function callClaude() {
  loadingText.textContent = 'Analyzing content…';

  const levelLabel = state.settings.level === 'elementary'
    ? 'Elementary School (ages 7–12, simple vocabulary, fun tone)'
    : 'Junior High School (ages 12–15, moderate complexity, clear academic tone)';

  const typeNames = {
    multiple_choice: 'Multiple Choice (4 options labeled A–D)',
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
4. Match the language used in the material (if material is in Bahasa Indonesia, write questions in Bahasa Indonesia; if English, write in English).
5. Adjust difficulty and vocabulary appropriately for: ${levelLabel}
6. For multiple choice: provide exactly 4 options labeled A, B, C, D with only one correct answer.
7. For fill in blank: replace key terms with ___ in a sentence from the material.
8. For short answer: ask open-ended questions about main concepts.

Respond ONLY with a valid JSON object in this exact format (no markdown, no extra text):
{
  "subject": "detected subject name",
  "language": "detected language (English or Bahasa Indonesia)",
  "questions": [
    {
      "number": 1,
      "type": "multiple_choice",
      "question": "question text",
      "options": ["A. option1", "B. option2", "C. option3", "D. option4"],
      "answer": "A. option1"
    },
    {
      "number": 2,
      "type": "true_false",
      "question": "statement to judge as true or false",
      "options": ["True", "False"],
      "answer": "True"
    },
    {
      "number": 3,
      "type": "fill_blank",
      "question": "The ___ is the powerhouse of the cell.",
      "options": [],
      "answer": "mitochondria"
    },
    {
      "number": 4,
      "type": "short_answer",
      "question": "Explain in your own words...",
      "options": [],
      "answer": "Model answer: ..."
    }
  ]
}`;

  // Build content array with all images
  const contentParts = [{ type: 'text', text: prompt }];
  state.images.forEach(img => {
    contentParts.push({
      type: 'image',
      source: { type: 'base64', media_type: img.mimeType, data: img.base64 }
    });
  });

  loadingText.textContent = 'Generating questions…';

  const response = await fetch('/api/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': state.apiKey,
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5',
      max_tokens: 4000,
      messages: [{ role: 'user', content: contentParts }]
    })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || `API error ${response.status}`);
  }

  const data = await response.json();
  const rawText = data.content.map(b => b.text || '').join('');

  // Strip any markdown fences
  const clean = rawText.replace(/```json|```/g, '').trim();
  const parsed = JSON.parse(clean);
  return parsed;
}

// ── Render Quiz ────────────────────────────
function renderQuiz(quiz) {
  const levelLabel = state.settings.level === 'elementary' ? '🎒 Elementary' : '📚 Junior High';
  quizMetaText.textContent = `${quiz.subject || 'Quiz'} · ${levelLabel} · ${quiz.questions.length} questions · ${quiz.language || ''}`;

  let html = '';
  quiz.questions.forEach((q, i) => {
    const typeLabelMap = {
      multiple_choice: 'Multiple Choice',
      true_false: 'True / False',
      fill_blank: 'Fill in the Blank',
      short_answer: 'Short Answer'
    };
    const typeLabel = typeLabelMap[q.type] || q.type;

    let body = '';
    if (q.type === 'multiple_choice' && q.options.length) {
      const optHtml = q.options.map(o => `<li>${o}</li>`).join('');
      body = `<p class="q-text">${q.question}</p><ul class="q-options">${optHtml}</ul>`;
    } else if (q.type === 'true_false') {
      body = `<p class="q-text">${q.question}</p><ul class="q-options"><li>A. True</li><li>B. False</li></ul>`;
    } else if (q.type === 'fill_blank') {
      const rendered = q.question.replace(/___/g, '<span class="q-blank-line"></span>');
      body = `<p class="q-text">${rendered}</p>`;
    } else {
      body = `<p class="q-text">${q.question}</p><p class="q-essay-hint">Answer in 2–4 sentences.</p>`;
    }

    html += `
      <div class="quiz-question" style="animation-delay:${i * 0.05}s">
        <div>
          <span class="q-number">Question ${q.number}</span>
          <span class="q-type-badge">${typeLabel}</span>
        </div>
        ${body}
      </div>`;
  });

  // Answer Key
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
  generatePDF(state.quizData);
});

function generatePDF(quiz) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const pageW = 210;
  const pageH = 297;
  const margin = 18;
  const contentW = pageW - margin * 2;
  let y = margin;

  const colors = {
    ink: [26, 18, 8],
    teal: [26, 122, 110],
    amber: [232, 160, 32],
    muted: [138, 122, 104],
    lightBg: [253, 248, 240],
    lineBg: [212, 201, 184]
  };

  function setFont(size, style = 'normal', color = colors.ink) {
    doc.setFontSize(size);
    doc.setFont('helvetica', style);
    doc.setTextColor(...color);
  }

  function checkPageBreak(needed = 20) {
    if (y + needed > pageH - margin) {
      doc.addPage();
      y = margin;
      drawPageHeader();
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

  // ─ COVER HEADER ─
  // Decorative top strip
  doc.setFillColor(...colors.teal);
  doc.rect(0, 0, pageW, 18, 'F');
  doc.setFillColor(...colors.amber);
  doc.rect(0, 16, pageW, 3, 'F');

  y = 26;
  setFont(20, 'bold', colors.ink);
  doc.text(quiz.subject || 'Quiz', margin, y);
  y += 8;

  const levelLabel = state.settings.level === 'elementary' ? 'Elementary School' : 'Junior High School';
  setFont(10, 'normal', colors.muted);
  doc.text(`${levelLabel} · ${quiz.questions.length} Questions · ${quiz.language || ''}`, margin, y);
  y += 10;

  // Student Name & Date fields
  if (state.settings.studentName || state.settings.date) {
    doc.setFillColor(245, 240, 232);
    doc.roundedRect(margin, y, contentW, 16, 3, 3, 'F');
    y += 5;
    setFont(9, 'normal', colors.muted);

    if (state.settings.studentName) {
      doc.text(`Name: ${state.settings.studentName}`, margin + 6, y + 2);
    } else {
      doc.text('Name: ___________________________', margin + 6, y + 2);
    }

    const dateStr = state.settings.date
      ? new Date(state.settings.date + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
      : '___________________';
    doc.text(`Date: ${dateStr}`, pageW / 2, y + 2);
    y += 16;
  } else {
    // blank fields
    doc.setFillColor(245, 240, 232);
    doc.roundedRect(margin, y, contentW, 16, 3, 3, 'F');
    y += 5;
    setFont(9, 'normal', colors.muted);
    doc.text('Name: ___________________________', margin + 6, y + 2);
    doc.text('Date: ___________________', pageW / 2, y + 2);
    y += 16;
  }

  // Separator
  doc.setDrawColor(...colors.lineBg);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageW - margin, y);
  y += 8;

  const typeLabelMap = {
    multiple_choice: 'Multiple Choice',
    true_false: 'True / False',
    fill_blank: 'Fill in the Blank',
    short_answer: 'Short Answer'
  };

  // ─ QUESTIONS ─
  quiz.questions.forEach((q, i) => {
    checkPageBreak(30);

    // Question number pill background
    doc.setFillColor(i % 2 === 0 ? 232 : 26, i % 2 === 0 ? 160 : 122, i % 2 === 0 ? 32 : 110);
    doc.roundedRect(margin, y, 18, 6, 2, 2, 'F');

    // Question number
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(`Q${q.number}`, margin + 9, y + 4.2, { align: 'center' });

    // Type badge
    const typeLabel = typeLabelMap[q.type] || q.type;
    setFont(7, 'normal', colors.muted);
    doc.text(typeLabel, margin + 22, y + 4);
    y += 9;

    // Question text
    setFont(10, 'bold', colors.ink);
    const qLines = doc.splitTextToSize(q.question, contentW);
    checkPageBreak(qLines.length * 5 + 12);
    doc.text(qLines, margin, y);
    y += qLines.length * 5 + 3;

    // Options
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
    } else if (q.type === 'fill_blank') {
      // already rendered in question text with ___
      y += 2;
    } else if (q.type === 'short_answer') {
      // answer lines
      checkPageBreak(22);
      for (let l = 0; l < 3; l++) {
        doc.setDrawColor(...colors.lineBg);
        doc.setLineWidth(0.4);
        doc.line(margin, y + 4, pageW - margin, y + 4);
        y += 7;
      }
      y += 2;
    }

    // Bottom spacing
    y += 4;

    // Light separator between questions
    if (i < quiz.questions.length - 1) {
      doc.setDrawColor(225, 215, 200);
      doc.setLineWidth(0.3);
      doc.line(margin + 10, y, pageW - margin - 10, y);
      y += 5;
    }
  });

  // ─ ANSWER KEY (last page) ─
  doc.addPage();
  y = margin;

  // Header strip
  doc.setFillColor(...colors.ink);
  doc.rect(0, 0, pageW, 18, 'F');
  setFont(13, 'bold', [255, 255, 255]);
  doc.text('Answer Key', margin, 12);
  setFont(8, 'normal', [180, 170, 160]);
  doc.text(`${quiz.subject || 'Quiz'} — for teacher use only`, pageW - margin, 12, { align: 'right' });

  y = 26;

  setFont(9, 'normal', colors.muted);
  doc.text(`Generated by QuizGen  ·  ${new Date().toLocaleDateString()}`, margin, y);
  y += 8;

  doc.setDrawColor(...colors.lineBg);
  doc.setLineWidth(0.5);
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

  // Footer
  const totalPages = doc.internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    setFont(7, 'normal', colors.muted);
    doc.text(`${p} / ${totalPages}`, pageW - margin, pageH - 8, { align: 'right' });
  }

  const filename = `${(quiz.subject || 'quiz').replace(/\s+/g, '_').toLowerCase()}_quiz.pdf`;
  doc.save(filename);
}

// ── New Quiz ───────────────────────────────
btnNew.addEventListener('click', () => {
  state.images = [];
  state.quizData = null;
  imagePreviewGrid.innerHTML = '';
  quizOutput.innerHTML = '';
  stepResults.classList.add('hidden');
  generateHint.textContent = '';
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// ── Loading Helpers ────────────────────────
function showLoading(msg = 'Generating…') {
  loadingText.textContent = msg;
  loadingOverlay.classList.remove('hidden');
  btnGenerate.disabled = true;
}
function hideLoading() {
  loadingOverlay.classList.add('hidden');
  btnGenerate.disabled = false;
}
