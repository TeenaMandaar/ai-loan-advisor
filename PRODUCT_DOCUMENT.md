# FinAI — AI Loan Advisor
### Product Document · Version 2.0 · May 2025

---

## Executive Summary

> **FinAI is a free, open-source conversational AI that helps everyday Indians understand, evaluate, and make smarter loan decisions — in plain language, in real time.**

Most Indians take loans without understanding the true cost. FinAI fixes this with a chat-based advisor powered by Groq's Llama 3 LLM, a real EMI calculation engine, and honest risk assessment — no bank commissions, no jargon, no paywall.

---

## 1. The Problem

India's retail lending market crossed **₹40 lakh crore in 2024**, yet financial literacy among borrowers remains critically low.

| Pain Point | Reality |
|---|---|
| Hidden interest burden | Borrowers see EMI, not total interest paid (often 60–80% of principal) |
| Over-borrowing | No tool checks if a loan is actually affordable relative to income |
| Biased advice | Bank advisors are incentivised to sell — not to advise |
| Jargon barrier | Terms like DTI, LTV, moratorium confuse first-time borrowers |
| No free alternative | Every "EMI calculator" app is a lead-gen tool for banks |

**Core gap:** There is no free, unbiased, conversational tool that takes a person's full financial picture and gives a personalised, explainable loan recommendation.

---

## 2. The Solution — FinAI

FinAI is a web-based AI advisor that:

- 💬 **Chats naturally** — understands plain English (and Indian shorthand like "30L loan", "60k salary")
- 🧮 **Calculates precisely** — uses the standard financial EMI formula, not AI guesses
- 📊 **Assesses risk** — computes Debt-to-Income (DTI) ratio and flags affordability issues
- 🛡️ **Never hallucinates numbers** — all financial figures come from the calculation engine, not the LLM
- 📋 **Remembers your session** — SQLite stores chat history for continuity
- 🌗 **Works anywhere** — responsive UI, dark/light mode, no login required

---

## 3. Target Users

| User | Need | How FinAI Helps |
|---|---|---|
| **First-time borrowers** (22–35 yrs) | "Can I afford this loan?" | DTI check + plain-English risk verdict |
| **Salaried professionals** | EMI planning before applying | Accurate EMI + total interest breakdown |
| **Students / freshers** | Understanding loan types | Conversational education, no jargon |
| **Self-employed individuals** | Comparing loan options | Loan type recommendations based on profile |
| **Financial educators / NGOs** | Teaching tool | Embeddable, open-source, customisable |

---

## 4. How It Works

```
User Message (plain English)
        ↓
  Groq Llama 3 LLM
  (extracts intent + structured data)
        ↓
  ┌─────────────────────────────────┐
  │  Does it have amount +          │
  │  tenure + income?               │
  └──────┬──────────────────────────┘
         │ YES                  NO
         ↓                      ↓
  Python EMI Engine         Ask for missing
  • EMI formula             field only
  • DTI calculation
  • Risk assessment
         ↓
  Structured Result
  → EMI, Total Interest, DTI%, Risk Level
  → Plain-English Summary
        ↓
  Frontend Chat Bubble + EMI Card
```

> **Key design principle:** The LLM only extracts intent and converts natural language to numbers. It **never** generates financial figures. All calculations are deterministic Python code.

---

## 5. Tech Stack

| Layer | Technology | Why |
|---|---|---|
| **Frontend** | HTML + CSS + Vanilla JS | Zero build overhead, works in any browser |
| **Backend** | FastAPI (Python) | Async, auto-docs, production-grade |
| **AI / LLM** | Groq API — Llama 3.3-70B | Fastest free LLM inference; JSON-mode output |
| **Database** | SQLite | Zero setup; built into Python |
| **Deployment** | Render.com (free tier) | One-click deploy, free HTTPS |
| **Calculation** | Pure Python math | Deterministic, no ML library needed |

**Total infrastructure cost: ₹0/month at MVP scale.**

---

## 6. Core Features

### Built ✅

| Feature | Description |
|---|---|
| **Conversational Chat** | Natural language input; LLM extracts structured loan data |
| **EMI Calculator** | `P × r × (1+r)ⁿ / ((1+r)ⁿ - 1)` — real formula, not AI estimates |
| **DTI Risk Analysis** | `(New EMI + Existing EMIs) / Monthly Income × 100` |
| **Risk Badge** | 🟢 Low (<30%) · 🟡 Moderate (30–50%) · 🔴 High (>50%) |
| **Anti-Hallucination Engine** | LLM forbidden from inventing financial numbers |
| **Session History** | SQLite stores conversation for scroll-back |
| **Manual EMI Calculator** | Standalone form with pie chart breakdown |
| **Dark / Light Mode** | Persistent theme preference |
| **Mobile Responsive** | Works on all screen sizes |

### Roadmap 🔜

| Feature | Priority |
|---|---|
| Multi-turn conversation memory | Pass last N messages to Groq for context |
| Loan comparison (multiple tenures/rates) | Side-by-side table |
| Hindi / regional language support | Groq multi-language capability |
| PDF report download | Loan summary as shareable document |

---

## 7. Financial Calculations — Accuracy Guarantee

All numbers shown to users come from **verified Python functions**, not the LLM:

```
EMI   = P × r × (1+r)ⁿ / ((1+r)ⁿ - 1)
        where r = annual_rate / 12 / 100
              n = tenure_years × 12

DTI   = (New EMI + Existing EMIs) / Monthly Income × 100

Risk  = Low      if DTI < 30%
        Moderate if 30% ≤ DTI ≤ 50%
        High     if DTI > 50%

Affordable = EMI ≤ 40% of income AND DTI ≤ 50%
```

Default interest rates (sourced from RBI 2024 averages):
- Home Loan: **8.75%** · Car Loan: **9.5%** · Personal Loan: **14.0%**
- Education: **8.5%** · Loan Against Property: **10.0%**

---

## 8. Project Structure

```
ai-loan-advisor/
├── backend/
│   ├── main.py          # FastAPI routes + response schemas
│   ├── emi.py           # EMI formula, DTI, risk logic
│   ├── groq_chat.py     # Groq LLM integration + model fallback
│   ├── database.py      # SQLite chat history
│   └── requirements.txt
├── frontend/
│   ├── index.html       # Single-page app shell
│   ├── style.css        # Design system + responsive layout
│   └── app.js           # Chat UI, API calls, calculator logic
└── README.md
```

---

## 9. API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/chat` | Send a message; returns AI reply or calculation result |
| `POST` | `/calculate` | Direct EMI + DTI calculation (no LLM) |
| `GET` | `/history` | Retrieve full session chat history |
| `DELETE` | `/history` | Clear session history |
| `GET` | `/health` | Health check |
| `GET` | `/docs` | Auto-generated Swagger UI |

---

## 10. Roadmap

```
Phase 1 — MVP (Complete ✅)
  Conversational chat · EMI engine · DTI risk · SQLite history
  Manual calculator · Dark mode · Mobile responsive · Anti-hallucination

Phase 2 — Intelligence (Next 4 weeks)
  Multi-turn memory (pass history to Groq)
  Loan type comparison (home vs. LAP vs. personal)
  PDF report export

Phase 3 — Scale
  User accounts + login (saved loan profiles)
  Real-time interest rate API (RBI data feed)
  Hindi + Tamil language support
  WhatsApp bot integration

Phase 4 — ML Enhancement
  Credit risk scoring (Scikit-learn on anonymised data)
  Personalised loan recommendations
  Bank product matching (affiliate-free, ranked by cost)
```

---

## 11. What Makes FinAI Different

| | FinAI | Bank EMI Calculators | Generic ChatGPT |
|---|---|---|---|
| Unbiased advice | ✅ | ❌ (lead gen) | ✅ |
| Accurate numbers | ✅ (real formula) | ✅ | ❌ (hallucinated) |
| Conversational | ✅ | ❌ | ✅ |
| DTI Risk Check | ✅ | ❌ | ❌ |
| Free forever | ✅ | ✅ | ❌ |
| Open source | ✅ | ❌ | ❌ |
| No login required | ✅ | ✅ | ❌ |

---

## 12. Built With 100% Free & Open-Source Tools

- **FastAPI** — MIT License
- **Groq API** — Free tier (no credit card needed)
- **Llama 3.3-70B** — Meta Open License
- **SQLite** — Public Domain
- **Render.com** — Free hosting tier

**This project can be cloned, deployed, and run at zero cost by anyone.**

---

*FinAI · Built by Teena Mandaar · May 2025 · Open Source*
