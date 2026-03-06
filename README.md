# ✦ QuizGen — Smart Quiz Maker for Kids

Turn textbook photos into ready-to-print quizzes using AI. Built for parents and teachers.

## Features

- 📷 Upload unlimited textbook/worksheet photos per session
- 🎒 Two difficulty modes: **Elementary** and **Junior High**
- 🧠 Four question types: Multiple Choice, True/False, Fill in the Blank, Short Answer
- 🌐 Auto-detects language from material (English or Bahasa Indonesia)
- 🔢 Choose any number of questions (1–50)
- 📄 Download a clean, print-ready **PDF** with answer key on the last page
- 🔑 Uses your own Anthropic API key (stored locally in browser)

## Getting Started

### 1. Clone the repo
```bash
git clone https://github.com/YOUR_USERNAME/quizgen.git
cd quizgen
```

### 2. Deploy to Vercel

Option A — Vercel CLI:
```bash
npm i -g vercel
vercel
```

Option B — Vercel Dashboard:
1. Push to GitHub
2. Go to [vercel.com](https://vercel.com), click **New Project**
3. Import your GitHub repo
4. Click **Deploy** — no build settings needed, it's pure HTML/JS

### 3. Get an Anthropic API Key
- Sign up at [console.anthropic.com](https://console.anthropic.com)
- Create an API key
- Paste it into the app when prompted (stored only in your browser)

## Project Structure

```
quizgen/
├── index.html          # Main app
├── css/
│   └── style.css       # All styles
├── js/
│   └── app.js          # App logic + API calls
├── vercel.json         # Vercel deployment config
└── README.md
```

## How to Use

1. Open the app and enter your Anthropic API key
2. Choose student level (Elementary / Junior High)
3. Set number of questions and question types
4. Upload photos of textbook pages
5. Click **Generate Quiz**
6. Download the PDF and print!

## Tech Stack

- Pure HTML + CSS + JavaScript (no framework needed)
- [Anthropic Claude API](https://docs.anthropic.com) for AI question generation
- [jsPDF](https://github.com/parallax/jsPDF) for PDF generation
- Google Fonts (Sora + DM Serif Display)

## Notes

- Your API key is stored in `localStorage` and never sent anywhere except Anthropic's API directly from your browser.
- Claude reads the images and generates questions in the same language as the material.
- Costs are minimal — each quiz session uses roughly 1,000–4,000 tokens.

---

Made with ❤️ for parents who want to help their kids learn without spending hours writing questions.
