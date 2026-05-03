# FinAI — AI Loan Advisor 🏦

> Free, open-source conversational AI that helps Indians make smarter loan decisions — no jargon, no commissions.

![Stack](https://img.shields.io/badge/Backend-FastAPI-009688?style=flat-square)
![Stack](https://img.shields.io/badge/AI-Groq%20Llama%203-7C3AED?style=flat-square)
![Stack](https://img.shields.io/badge/DB-SQLite-003B57?style=flat-square)
![Stack](https://img.shields.io/badge/Cost-₹0%2Fmonth-22C55E?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)

---

## What It Does

Type your loan need in plain English — FinAI understands, calculates, and advises:

```
"I earn ₹60,000/month and want a home loan of ₹30 lakhs for 20 years"
    → EMI: ₹26,218/month
    → Total Interest: ₹32,92,299
    → DTI: 43.7% — Moderate Risk ⚠️
```

**Key guarantee:** All financial numbers come from real Python math — the LLM never invents figures.

---

## Features

| Feature | Status |
|---|---|
| Conversational AI chat (Groq Llama 3.3-70B) | ✅ |
| Real EMI calculation (standard formula) | ✅ |
| Debt-to-Income (DTI) risk assessment | ✅ |
| Risk badge: Low / Moderate / High | ✅ |
| Manual EMI calculator with pie chart | ✅ |
| Session history (SQLite) | ✅ |
| Dark / Light mode | ✅ |
| Mobile responsive | ✅ |
| Anti-hallucination engine | ✅ |

---

## Quick Start

### 1. Clone & install

```bash
git clone https://github.com/TeenaMandaar/ai-loan-advisor.git
cd ai-loan-advisor/backend
pip install -r requirements.txt
```

### 2. Add your Groq API key

Create `backend/.env`:
```
GROQ_API_KEY=your_key_here
```

Get a free key at [console.groq.com](https://console.groq.com) — no credit card needed.

### 3. Run

```bash
cd backend
uvicorn main:app --reload
```

Open [http://127.0.0.1:8000](http://127.0.0.1:8000) in your browser.

---

## Project Structure

```
ai-loan-advisor/
├── backend/
│   ├── main.py          # FastAPI app + API routes
│   ├── emi.py           # EMI formula, DTI, risk engine
│   ├── groq_chat.py     # Groq LLM + model fallback chain
│   ├── database.py      # SQLite chat history
│   └── requirements.txt
├── frontend/
│   ├── index.html       # Single-page app
│   ├── style.css        # Design system
│   └── app.js           # UI logic + API calls
├── PRODUCT_DOCUMENT.md  # Full product spec
└── README.md
```

---

## Tech Stack

| Layer | Tool | Cost |
|---|---|---|
| Frontend | HTML + CSS + Vanilla JS | Free |
| Backend | FastAPI + Python | Free |
| AI | Groq Llama 3.3-70B | Free tier |
| Database | SQLite | Free |
| Hosting | Render.com | Free tier |

---

## API

| Endpoint | Method | Description |
|---|---|---|
| `/chat` | POST | AI chat with EMI calculation |
| `/calculate` | POST | Direct EMI + DTI (no LLM) |
| `/history` | GET | Fetch session history |
| `/history` | DELETE | Clear session |
| `/docs` | GET | Swagger UI |

---

## Built By

**Teena Mandaar** · May 2025  
[GitHub](https://github.com/TeenaMandaar) · Open Source · MIT License
