# AI Loan Advisor — Complete Study Guide
### How We Built It, Why We Used Each Tool, and How Everything Connects

---

## 📌 Table of Contents
1. [Project Vision](#1-project-vision)
2. [Tech Stack — Why Each Tool Was Chosen](#2-tech-stack--why-each-tool-was-chosen)
3. [Project Folder Structure](#3-project-folder-structure)
4. [Part 1 — The Chat UI (Frontend)](#4-part-1--the-chat-ui-frontend)
5. [Part 2 — The Backend + EMI Formula](#5-part-2--the-backend--emi-formula)
6. [Part 3 — Connecting Frontend to Backend](#6-part-3--connecting-frontend-to-backend)
7. [Part 4 — Groq AI Integration](#7-part-4--groq-ai-integration)
8. [Part 5 — SQLite Chat History](#8-part-5--sqlite-chat-history)
9. [Part 6 — Risk Engine](#9-part-6--risk-engine)
10. [Part 7 — Deployment on Render.com](#10-part-7--deployment-on-rendercom)
11. [How All Pieces Connect — Full Workflow Diagram](#11-how-all-pieces-connect--full-workflow-diagram)
12. [Key Concepts to Study](#12-key-concepts-to-study)

---

## 1. Project Vision

**The Problem:** Most people in India take loans without understanding the real cost — the EMI, the total interest paid, or whether the loan is actually affordable for their income. Banks are incentivised to sell loans, not give honest advice.

**The Solution:** An AI chatbot that:
- Understands what you type in plain English (e.g. *"I earn ₹50k and want a ₹10 lakh loan"*)
- Automatically extracts the numbers
- Calculates your exact EMI and total interest
- Tells you honestly if the loan is risky for you
- Explains everything in simple language

**The Goal:** 100% free, open-source, runs in any browser.

---

## 2. Tech Stack — Why Each Tool Was Chosen

| Layer | Tool | Why This and Not Alternatives |
|-------|------|-------------------------------|
| **Frontend** | HTML + CSS + Vanilla JS | No framework needed for a chat UI. Loads faster, easier to debug, zero dependencies. React/Vue would be overkill here. |
| **Backend** | FastAPI (Python) | Automatically generates API docs (`/docs`). Much faster than Flask. Uses Python which is familiar for data/AI work. Async-ready. |
| **AI / LLM** | Groq API — Llama 3 | Groq is the **fastest** free AI inference available. OpenAI is paid. Llama 3 is open-source. Groq runs it for free (with rate limits). |
| **Database** | SQLite | Built into Python — no server, no setup. Perfect for MVP. Just a single `.db` file. |
| **Deployment** | Render.com | Has a genuine **free tier** with HTTPS. Heroku removed their free tier. Railway is limited. Render reads `render.yaml` automatically. |
| **Env Secrets** | python-dotenv | Standard way to load API keys from a `.env` file without hardcoding secrets in code. |

---

## 3. Project Folder Structure

```
ai-loan-advisor/
│
├── backend/                  ← All Python server code lives here
│   ├── main.py               ← FastAPI app: routes (/chat, /calculate, /history)
│   ├── emi.py                ← Pure math: EMI formula + DTI ratio + risk
│   ├── groq_chat.py          ← Talks to Groq API, parses AI response
│   ├── database.py           ← SQLite: save, load, clear chat messages
│   ├── requirements.txt      ← List of Python packages to install
│   └── .env                  ← Your secret API key (NOT pushed to GitHub)
│
├── frontend/                 ← All HTML/CSS/JS lives here
│   ├── index.html            ← The full chat page structure
│   ├── style.css             ← Dark theme, animations, responsive layout
│   └── app.js                ← All interactivity: send message, fetch API, render bubbles
│
├── render.yaml               ← Tells Render.com how to deploy the app
├── .gitignore                ← Tells Git to ignore .env and .db files
└── README.md                 ← Project documentation for GitHub
```

> **Key Insight:** FastAPI serves BOTH the API endpoints AND the frontend HTML files. This is why you can open `http://127.0.0.1:8000` and see the chat UI — the same Python server handles everything.

---

## 4. Part 1 — The Chat UI (Frontend)

**Goal:** Build a beautiful chat interface that looks like WhatsApp/ChatGPT. No backend yet — just static HTML.

### Files Created:
- `frontend/index.html`
- `frontend/style.css`
- `frontend/app.js`

### index.html — What Each Section Does

```html
<!-- The sidebar on the left -->
<aside class="sidebar">
  Logo + Navigation (Chat, EMI Calculator, History)
  Info cards (Unbiased, Private, AI-Powered)
</aside>

<!-- The main chat area on the right -->
<main class="main-content">
  <header>  ← Top bar: advisor name, online status, theme toggle
  <section class="chat-window">  ← Where messages appear
    <div class="welcome-banner">  ← Shown when no messages yet
    <div class="messages-container">  ← Messages injected here by JS
  </section>
  <div class="typing-indicator">  ← "Advisor is thinking..." animation
  <div class="quick-suggestions">  ← Shortcut buttons
  <footer class="input-bar">  ← Textarea + Send button
</main>
```

### style.css — Key Design Decisions

**CSS Variables (Design Tokens):**
```css
:root {
  --primary: #6c63ff;      /* Purple — main brand colour */
  --accent: #00d4aa;       /* Teal — for highlights */
  --bg-main: #0f0f1a;      /* Very dark navy — main background */
}
```
We define colours once as variables so changing the theme is easy. This is professional CSS practice.

**Dark/Light Theme Toggle:**
```css
[data-theme="light"] {
  --bg-main: #f0f0ff;   /* Override variables for light mode */
}
```
JavaScript adds `data-theme="light"` to `<html>` to switch themes instantly.

**Animations used:**
- `fadeInUp` — messages slide up when they appear
- `dot-bounce` — the three typing dots bounce in sequence
- `pulse-avatar` — the robot avatar glows
- `float` — background particles drift slowly

### app.js — Key Functions Explained

```javascript
// Auto-resize textarea as user types
userInput.addEventListener('input', () => {
  userInput.style.height = 'auto';
  userInput.style.height = Math.min(userInput.scrollHeight, 120) + 'px';
});
```

```javascript
// appendMessage() — creates a chat bubble
function appendMessage(role, content, extraHTML = '') {
  // role = 'user' or 'bot'
  // content = the text
  // extraHTML = optional HTML like the EMI card
  
  const row = document.createElement('div');
  row.className = `message-row ${role}`;  // CSS positions user right, bot left
  // ... builds avatar + bubble + timestamp
  messagesContainer.appendChild(row);
  scrollToBottom();
}
```

```javascript
// showTyping() / hideTyping() — controls the "..." animation
function showTyping() {
  isTyping = true;
  typingIndicator.hidden = false;
}
```

**Welcome banner logic (important):** The banner only hides when the USER sends their first message, not when the bot says hello. This was a specific bug we fixed by tracking `userMessageCount` separately from `messageCount`.

---

## 5. Part 2 — The Backend + EMI Formula

**Goal:** Build a Python server with a `/calculate` endpoint. Pure math, no AI yet.

### emi.py — The Core Math

**EMI Formula:**
```
EMI = P × r × (1+r)^n / ((1+r)^n - 1)

Where:
  P = Principal (loan amount in ₹)
  r = Monthly interest rate = Annual Rate ÷ 12 ÷ 100
  n = Total months = Years × 12
```

**Example:** ₹10 Lakh @ 12% for 5 years:
```
r = 12 / 12 / 100 = 0.01
n = 5 × 12 = 60
EMI = 1000000 × 0.01 × (1.01)^60 / ((1.01)^60 - 1)
EMI = ₹22,244.45 per month ✅
```

**DTI Formula:**
```
DTI = (New EMI + Existing EMIs) / Monthly Income × 100

< 30%  → Low Risk (safe)
30-50% → Moderate Risk (manageable)
> 50%  → High Risk (dangerous — lenders will likely reject)
```

**Python code structure in emi.py:**
```python
@dataclass
class LoanInput:     # Input: what the user provides
class LoanResult:    # Output: everything calculated

def calculate_emi()  # Pure EMI math
def calculate_dti()  # DTI ratio
def assess_risk()    # Returns "Low"/"Moderate"/"High"
def process_loan()   # Orchestrates all of the above
```

### main.py — FastAPI Routes

```python
app = FastAPI()  # Creates the web server

@app.get("/health")         # Returns {"status": "ok"} — used to check if server is alive
@app.post("/calculate")     # Takes loan details, returns EMI + analysis
@app.post("/chat")          # Takes a text message, uses Groq AI, returns response
@app.get("/history")        # Returns saved chat messages
@app.delete("/history")     # Clears all chat messages
```

**Pydantic Models** — FastAPI uses these to validate inputs automatically:
```python
class CalculateRequest(BaseModel):
    principal: float = Field(..., gt=0)  # Must be > 0
    annual_rate: float = Field(..., gt=0, le=100)  # Must be 0-100
    tenure_years: float = Field(..., gt=0, le=50)
    monthly_income: float = Field(..., gt=0)
    existing_emi: float = Field(default=0.0, ge=0)
```
If the user sends invalid data, FastAPI automatically returns a `422 Unprocessable Entity` error. You don't have to write validation code yourself.

**How to start the server:**
```bash
cd backend
uvicorn main:app --reload --port 8000
# --reload means it auto-restarts when you change code
```

---

## 6. Part 3 — Connecting Frontend to Backend

**Goal:** Make the chat UI call the real FastAPI backend instead of fake static responses.

### The Fetch API (JavaScript)

```javascript
async function callChatAPI(messageText) {
  const response = await fetch('http://127.0.0.1:8000/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: messageText })
  });
  return await response.json();
}
```

**What `async/await` means:**
- `async` means the function is asynchronous — it doesn't block the page
- `await` means "wait for this to finish before continuing"
- Without `async/await`, the browser would freeze while waiting for the server

**What CORS is and why we need it:**
CORS (Cross-Origin Resource Sharing) is a browser security rule. When your frontend on port 5500 tries to call the backend on port 8000, the browser blocks it by default because they are "different origins".

We fixed this in `main.py`:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins (okay for MVP)
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**Smart API_BASE detection:**
```javascript
// Dev mode (Live Server on port 5500) → use full URL
// Production (FastAPI serves everything on same port) → use relative URL
const API_BASE = (window.location.port === '5500')
  ? 'http://127.0.0.1:8000'
  : '';  // Empty string = same server, same port
```

---

## 7. Part 4 — Groq AI Integration

**Goal:** Use Llama 3 to understand plain English and extract loan details.

### How Groq Works

1. You send a **system prompt** (instructions for the AI) + **user message**
2. Groq runs Llama 3 and returns a response
3. We told Llama 3 to ALWAYS respond in JSON format

### groq_chat.py — The Prompt Engineering

The **system prompt** is the most important part:
```
You are a friendly AI Loan Advisor. Always respond in strictly valid JSON.

If the user provides enough loan details:
{ "action": "calculate", "principal": 1000000, "annual_rate": 10.5, ... }

If the user is just chatting:
{ "action": "chat", "reply": "Your friendly response here." }
```

**Why JSON output?** Because our Python code needs to read the AI's decision. If the AI just wrote a paragraph, we couldn't reliably extract the numbers. By forcing JSON, we get a structured, parseable response every time.

```python
chat_completion = client.chat.completions.create(
    messages=[
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": user_message}
    ],
    model="llama3-8b-8192",          # Free Llama 3 model on Groq
    response_format={"type": "json_object"},  # Force JSON output
    temperature=0.1,                 # Low = more predictable, less creative
)
```

### The /chat Flow in main.py

```
User types: "I earn ₹60k and want ₹10L loan for 5 years"
     ↓
main.py /chat endpoint receives it
     ↓
groq_chat.py sends it to Llama 3
     ↓
Llama 3 returns:
  { "action": "calculate", "principal": 1000000,
    "tenure_years": 5, "monthly_income": 60000 }
     ↓
main.py calls process_loan() with these values
     ↓
Returns EMI, DTI, risk level, summary back to the browser
```

---

## 8. Part 5 — SQLite Chat History

**Goal:** Save every message so the user can scroll back and see their full conversation — even after refreshing the page.

### database.py — How SQLite Works

```python
import sqlite3

# Connect to the database file (creates it if it doesn't exist)
conn = sqlite3.connect("loan_advisor.db")

# Create the messages table (like a spreadsheet)
conn.execute('''
    CREATE TABLE IF NOT EXISTS messages (
        id        INTEGER PRIMARY KEY AUTOINCREMENT,
        role      TEXT,      -- 'user' or 'bot'
        content   TEXT,      -- The message text
        extra_html TEXT,     -- The EMI card HTML (optional)
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
''')
```

**Four functions:**
```python
init_db()           # Creates the table on startup (called once)
save_message()      # Saves one message row
get_chat_history()  # Returns all rows in order
clear_chat_history()# Deletes all rows
```

### Lifespan Event in FastAPI

```python
@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()   # ← Runs ONCE when server starts
    yield       # ← Server runs here
    # Cleanup code would go here (runs on shutdown)

app = FastAPI(lifespan=lifespan)
```

### Loading History in the Browser

When the page loads, `app.js` fetches all past messages:
```javascript
window.addEventListener('DOMContentLoaded', async () => {
  await loadHistory();       // Fetch from /history
  if (messageCount === 0) {  // Only show greeting if no history
    showGreeting();
  }
});
```

> **⚠️ Important Note:** On Render's free tier, the filesystem is **ephemeral** — meaning the `.db` file gets wiped when the server restarts or redeploys. For permanent storage in production, you would switch to PostgreSQL.

---

## 9. Part 6 — Risk Engine

This was actually built inside `emi.py` from the very beginning (Part 2). No separate file was needed because the logic is simple rule-based Python.

```python
def assess_risk(dti: float) -> tuple[str, str]:
    if dti < 30:
        return "Low", "green"     # Safe to proceed
    elif dti <= 50:
        return "Moderate", "orange"  # Proceed with caution
    else:
        return "High", "red"      # Strongly reconsider

def process_loan(input_data):
    emi = calculate_emi(...)
    dti = calculate_dti(emi, existing_emi, monthly_income)
    risk_level, risk_color = assess_risk(dti)
    affordable = (emi <= monthly_income * 0.40) and (dti <= 50)
```

**The EMI card rendered in the chat:**
```html
<div class="emi-card">
  <div class="emi-row">
    <span class="emi-label">Monthly EMI</span>
    <span class="emi-value">₹22,244</span>
  </div>
  <div class="emi-row">
    <span class="emi-label">Risk Level</span>
    <span class="risk-badge risk-moderate">Moderate</span>
  </div>
</div>
```

The CSS classes `risk-low`, `risk-moderate`, `risk-high` apply green/orange/red colours.

---

## 10. Part 7 — Deployment on Render.com

### render.yaml — The Blueprint

```yaml
services:
  - type: web           # A web server (not a background worker)
    name: ai-loan-advisor
    env: python
    region: singapore   # Closest to India for low latency
    plan: free
    rootDir: backend    # Run commands from inside the backend folder
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn main:app --host 0.0.0.0 --port $PORT
    envVars:
      - key: GROQ_API_KEY
        sync: false     # You paste this value manually in Render UI
```

**Key points:**
- `--host 0.0.0.0` means "accept connections from anywhere" (required for cloud hosting — `127.0.0.1` would only accept local connections)
- `$PORT` — Render assigns a port number automatically and passes it as an environment variable
- `rootDir: backend` means Render `cd`s into the `backend` folder before running commands

### .gitignore — What We Excluded

```gitignore
.env            # API keys must NEVER go to GitHub
*.db            # SQLite database is local only
__pycache__/    # Python compiled files (not needed)
```

**Why .env must not go to GitHub:** Anyone who finds your `.env` on GitHub can use your Groq API key, which could exhaust your free quota.

### Deployment Flow

```
You write code locally
    ↓
git push to GitHub
    ↓
Render detects the push (auto-deploy)
    ↓
Render runs: pip install -r requirements.txt
    ↓
Render runs: uvicorn main:app --host 0.0.0.0 --port $PORT
    ↓
App is live at https://ai-loan-advisor.onrender.com
```

---

## 11. How All Pieces Connect — Full Workflow Diagram

```
USER BROWSER
│
│  Types: "I want 10L loan for 5 years, I earn 60k"
│
│── app.js (JavaScript)
│   ├── Detects Enter key press → calls sendMessage()
│   ├── Appends user bubble to DOM
│   ├── Shows typing indicator
│   └── Calls fetch('/chat', { body: { message: "..." } })
│
│                    HTTP POST /chat
│──────────────────────────────────────────────────────▶  FASTAPI SERVER (main.py)
│                                                          │
│                                                          ├── Saves user msg to SQLite (database.py)
│                                                          │
│                                                          ├── Calls analyze_user_message() (groq_chat.py)
│                                                          │     └── Sends to Groq Llama 3 API
│                                                          │         └── Returns JSON: { action: "calculate", principal: 1000000, ... }
│                                                          │
│                                                          ├── Calls process_loan() (emi.py)
│                                                          │     ├── calculate_emi() → ₹22,244
│                                                          │     ├── calculate_dti() → 45.4%
│                                                          │     ├── assess_risk()   → "Moderate"
│                                                          │     └── Returns LoanResult object
│                                                          │
│                                                          ├── Saves bot result to SQLite (database.py)
│                                                          │
│                                                          └── Returns JSON response to browser
│
│◀──────────────────────────────────────────────────────
│   { type: "calculate", calculation_result: { emi: 22244, risk_level: "Moderate", summary: "..." } }
│
│── app.js receives response
│   ├── hideTyping()
│   ├── appendMessage('bot', result.summary, emiCardHTML)
│   └── Renders EMI card with risk badge in chat window
│
USER SEES: Beautiful chat bubble with EMI card ✅
```

---

## 12. Key Concepts to Study

### Python Concepts Used
| Concept | Where Used | What to Study |
|---------|-----------|---------------|
| `@dataclass` | emi.py | Python dataclasses for clean data models |
| `async/await` | main.py | Asynchronous programming in Python |
| `f-strings` | Throughout | Python string formatting |
| `try/except` | main.py, groq_chat.py | Error handling |
| `os.environ` | groq_chat.py | Reading environment variables |

### Web Concepts Used
| Concept | Where Used | What to Study |
|---------|-----------|---------------|
| `fetch()` | app.js | JavaScript Fetch API (HTTP requests) |
| `async/await` | app.js | Async JavaScript |
| `DOM manipulation` | app.js | `createElement`, `appendChild`, `classList` |
| `CSS Variables` | style.css | Custom properties (`--primary`, `--bg-main`) |
| `CSS Grid/Flexbox` | style.css | Modern CSS layout |
| `@keyframes` | style.css | CSS animations |

### API / Backend Concepts
| Concept | Where Used | What to Study |
|---------|-----------|---------------|
| `REST API` | main.py | GET, POST, DELETE methods |
| `Pydantic models` | main.py | Data validation with Python types |
| `CORS` | main.py | Browser security cross-origin rules |
| `JSON` | Throughout | Data exchange format |
| `HTTP status codes` | main.py | 200 OK, 422 Unprocessable, 500 Error |

### AI / LLM Concepts
| Concept | Where Used | What to Study |
|---------|-----------|---------------|
| `System prompt` | groq_chat.py | How to give instructions to an LLM |
| `Temperature` | groq_chat.py | Controls randomness (0=precise, 1=creative) |
| `Prompt engineering` | groq_chat.py | Crafting prompts to get reliable outputs |
| `JSON mode` | groq_chat.py | Forcing structured output from LLMs |

---

## 🎓 Recommended Next Steps to Study

1. **Understand the EMI formula deeply** — try calculating it by hand with a calculator
2. **Learn Pydantic** — it's used everywhere in Python APIs
3. **Study async Python** — essential for any backend work
4. **Read the FastAPI docs** — the best framework documentation available
5. **Learn about prompt engineering** — how to write better AI prompts
6. **Study SQLite** — understand SQL SELECT, INSERT, DELETE
7. **Read about REST APIs** — understand the conventions of GET/POST/PUT/DELETE

---

*AI Loan Advisor | MVP v1.0 | Built with FastAPI + Groq Llama 3 + SQLite + HTML/CSS/JS*
*GitHub: github.com/TeenaMandaar/ai-loan-advisor*
