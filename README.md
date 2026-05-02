# AI Loan Advisor 🏦

> **An AI-powered loan advisor that chats with users, understands their finances, calculates EMI, assesses risk, and delivers clear, explainable recommendations — built entirely with free and open-source tools.**

![Version](https://img.shields.io/badge/version-1.0-blue) ![License](https://img.shields.io/badge/license-MIT-green) ![Stack](https://img.shields.io/badge/stack-FastAPI%20%2B%20Groq%20%2B%20SQLite-purple)

---

## 🚀 Tech Stack

| Layer | Tool | Why |
|-------|------|-----|
| Frontend | HTML + CSS + Vanilla JS | Zero framework overhead |
| Backend | FastAPI (Python) | Fast, async, auto docs |
| AI / LLM | Groq API — Llama 3 (free tier) | Fastest free LLM inference |
| Database | SQLite | Built into Python |
| Deployment | Render.com (free tier) | Free HTTPS subdomain |

---

## 📁 Project Structure

```
ai-loan-advisor/
├── backend/
│   ├── main.py          # FastAPI app entry point + all routes
│   ├── emi.py           # EMI + DTI calculation logic
│   ├── groq_chat.py     # Groq LLM (Llama 3) integration
│   ├── database.py      # SQLite chat history
│   └── requirements.txt
├── frontend/
│   ├── index.html       # Main chat interface
│   ├── style.css        # Dark theme + animations
│   └── app.js           # Fetch calls + UI logic
├── render.yaml          # Render.com deployment config
├── .gitignore
└── README.md
```

---

## 🏗️ Development Parts — All Complete ✅

| Part | Feature | Status |
|------|---------|--------|
| Part 1 | Basic HTML Chat UI | ✅ Done |
| Part 2 | FastAPI Backend + EMI Logic | ✅ Done |
| Part 3 | Connect Frontend to Backend | ✅ Done |
| Part 4 | Groq LLM Integration | ✅ Done |
| Part 5 | SQLite Chat History | ✅ Done |
| Part 6 | Risk Engine + Recommendations | ✅ Done |
| Part 7 | Polish + Deploy on Render.com | ✅ Done |

---

## ▶️ Running Locally

### 1. Clone the repo
```bash
git clone https://github.com/YOUR_USERNAME/ai-loan-advisor.git
cd ai-loan-advisor
```

### 2. Set up your Groq API Key
Create a file `backend/.env`:
```env
GROQ_API_KEY=gsk_your_key_here
```
Get a free key at [console.groq.com](https://console.groq.com)

### 3. Install dependencies & start the backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 4. Open in browser
Navigate to: **http://127.0.0.1:8000**

> The FastAPI server serves both the API *and* the frontend from one port.

---

## 🌐 Deploying to Render.com (Free)

### Step 1 — Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit — AI Loan Advisor MVP"
git remote add origin https://github.com/YOUR_USERNAME/ai-loan-advisor.git
git push -u origin main
```

### Step 2 — Connect to Render
1. Go to [dashboard.render.com](https://dashboard.render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub account and select this repository
4. Render will auto-detect the `render.yaml` — click **"Apply"**

### Step 3 — Add your Groq API Key
In the Render dashboard for your service:
1. Go to **"Environment"** tab
2. Add a new variable: `GROQ_API_KEY` = `gsk_your_actual_key`
3. Click **"Save Changes"**

### Step 4 — Deploy!
Render will build and deploy automatically. Your live URL will be:
```
https://ai-loan-advisor.onrender.com
```

> ⚠️ **Note:** Render's free tier spins down after 15 minutes of inactivity. The first request may take ~30 seconds to wake up. This is normal.

> ⚠️ **SQLite on free tier:** Render's filesystem is ephemeral — chat history resets on each redeploy. For persistent history, upgrade to a paid tier or switch to PostgreSQL.

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Server health check |
| `POST` | `/calculate` | Direct EMI + DTI calculation |
| `POST` | `/chat` | AI chat (Groq Llama 3 powered) |
| `GET` | `/history` | Retrieve chat history |
| `DELETE` | `/history` | Clear chat history |
| `GET` | `/docs` | Swagger API documentation |

---

*Built with FastAPI, Groq API (Llama 3), SQLite, HTML/CSS/JS | All tools free & open-source*
