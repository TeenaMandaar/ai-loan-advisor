'use strict';

// DOM Elements
const body = document.documentElement;
const btnTheme = document.getElementById('btn-theme');
const iconMoon = document.getElementById('theme-icon-moon');
const iconSun = document.getElementById('theme-icon-sun');
const hamburger = document.getElementById('hamburger');
const sidebar = document.getElementById('sidebar');
const sidebarClose = document.getElementById('sidebar-close');
const navBtns = document.querySelectorAll('.nav-btn');
const views = document.querySelectorAll('.view');
const btnClear = document.getElementById('btn-clear');

// Chat UI
const chatView = document.getElementById('view-chat');
const messagesContainer = document.getElementById('messages');
const hero = document.getElementById('hero');
const userInput = document.getElementById('user-input');
const btnSend = document.getElementById('btn-send');
const charCount = document.getElementById('char-count');
const typingBar = document.getElementById('typing-bar');
const pills = document.querySelectorAll('.pill');
const qCards = document.querySelectorAll('.q-card');

// Calculator UI
const calcPrincipal = document.getElementById('calc-principal');
const calcRate = document.getElementById('calc-rate');
const calcTenure = document.getElementById('calc-tenure');
const calcIncome = document.getElementById('calc-income');
const calcExisting = document.getElementById('calc-existing');
const calcSubmit = document.getElementById('calc-submit');
const calcResults = document.getElementById('calc-results');
const principalLabel = document.getElementById('principal-label');
const piePrincipal = document.getElementById('pie-principal');

// History UI
const historyList = document.getElementById('history-list');

// API
// Smart API base URL:
// - Dev (served via Live Server / http.server on port 5500): use explicit FastAPI URL
// - Production (served directly by FastAPI on port 8000 or Render): use relative URLs
const API_BASE = (window.location.port === '5500' || window.location.port === '3000')
  ? 'http://127.0.0.1:8000'
  : '';

let isTyping = false;
let messageCount = 0;

// Theme
function toggleTheme() {
  const current = body.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  body.setAttribute('data-theme', next);
  localStorage.setItem('finai_theme', next);
  updateThemeIcon(next);
}

function updateThemeIcon(theme) {
  if (theme === 'dark') {
    iconMoon.style.display = 'none';
    iconSun.style.display = 'block';
  } else {
    iconMoon.style.display = 'block';
    iconSun.style.display = 'none';
  }
}

const savedTheme = localStorage.getItem('finai_theme') || 'dark';
body.setAttribute('data-theme', savedTheme);
updateThemeIcon(savedTheme);
btnTheme.addEventListener('click', toggleTheme);

// Navigation
function switchView(viewId) {
  navBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === viewId);
  });
  views.forEach(v => {
    v.classList.toggle('hidden', v.id !== `view-${viewId}`);
  });
  if (viewId === 'history') loadHistory();
  if (window.innerWidth <= 768) sidebar.classList.remove('open');
}

navBtns.forEach(btn => {
  btn.addEventListener('click', () => switchView(btn.dataset.view));
});

hamburger.addEventListener('click', () => sidebar.classList.add('open'));
sidebarClose.addEventListener('click', () => sidebar.classList.remove('open'));

// Formatters
const fmt = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

// Chat Input
userInput.addEventListener('input', () => {
  userInput.style.height = 'auto';
  userInput.style.height = Math.min(userInput.scrollHeight, 150) + 'px';
  const len = userInput.value.length;
  charCount.textContent = `${len}/600`;
  btnSend.disabled = len === 0 || isTyping;
});

userInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    if (!btnSend.disabled) sendMessage();
  }
});

btnSend.addEventListener('click', () => {
  if (!btnSend.disabled) sendMessage();
});

[...pills, ...qCards].forEach(el => {
  el.addEventListener('click', () => {
    userInput.value = el.dataset.message;
    userInput.dispatchEvent(new Event('input'));
    sendMessage();
  });
});

// Calculate Number Hints
calcPrincipal.addEventListener('input', (e) => {
  const val = Number(e.target.value);
  if (val) principalLabel.textContent = fmt.format(val);
  else principalLabel.textContent = '₹0';
});

// Chat Logic
function appendMessage(role, content, extraHtml = '') {
  messageCount++;
  if (hero) hero.style.display = 'none';

  const row = document.createElement('div');
  row.className = `message-row ${role}`;
  
  const avatar = document.createElement('div');
  avatar.className = 'msg-avatar';
  avatar.textContent = role === 'user' ? '👤' : '🤖';

  const bubble = document.createElement('div');
  bubble.className = 'message-bubble';

  // Safe text rendering — split on newlines
  const p = document.createElement('p');
  content.split('\n').forEach((line, i, arr) => {
    p.appendChild(document.createTextNode(line));
    if (i < arr.length - 1) p.appendChild(document.createElement('br'));
  });
  bubble.appendChild(p);

  if (extraHtml) {
    const extra = document.createElement('div');
    extra.innerHTML = extraHtml;
    bubble.appendChild(extra);
  }

  const time = document.createElement('span');
  time.className = 'message-time';
  time.textContent = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  bubble.appendChild(time);

  row.appendChild(avatar);
  row.appendChild(bubble);
  messagesContainer.appendChild(row);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

async function sendMessage() {
  const text = userInput.value.trim();
  if (!text) return;

  appendMessage('user', text);
  userInput.value = '';
  userInput.style.height = 'auto';
  charCount.textContent = '0/600';
  btnSend.disabled = true;

  typingBar.hidden = false;
  isTyping = true;
  messagesContainer.scrollTop = messagesContainer.scrollHeight;

  try {
    const res = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text })
    });
    
    if (!res.ok) throw new Error('API Error');
    const data = await res.json();
    
    typingBar.hidden = true;
    isTyping = false;

    if (data.type === 'calculate' && data.calculation_result) {
      const cr = data.calculation_result;
      const html = `
        <div class="emi-card">
          <div class="emi-row">
            <span class="emi-label">Monthly EMI</span>
            <span class="emi-value">${cr.emi_formatted}</span>
          </div>
          <div class="emi-row">
            <span class="emi-label">Risk Level</span>
            <span class="risk-badge risk-${cr.risk_level.toLowerCase()}">${cr.risk_level}</span>
          </div>
        </div>
      `;
      appendMessage('bot', cr.summary, html);
    } else {
      appendMessage('bot', data.reply || "I didn't quite catch that. Could you rephrase?");
    }
  } catch (err) {
    typingBar.hidden = true;
    isTyping = false;
    appendMessage('bot', "⚠️ Sorry, I'm having trouble connecting right now.");
  }
}

// History Logic
async function loadHistory() {
  try {
    const res = await fetch(`${API_BASE}/history`);
    if (!res.ok) return;
    const data = await res.json();
    
    historyList.innerHTML = '';
    if (data.messages && data.messages.length > 0) {
      data.messages.forEach(m => {
        const div = document.createElement('div');
        div.style.padding = '12px';
        div.style.borderBottom = '1px solid var(--border)';
        div.style.background = 'var(--bg-card)';
        div.innerHTML = `<strong>${m.role === 'user' ? 'You' : 'FinAI'}</strong><br><p style="font-size:0.85rem;margin-top:4px;color:var(--text-muted)">${m.content}</p>`;
        historyList.appendChild(div);
      });
    } else {
      historyList.innerHTML = `<div class="empty-state"><div class="empty-icon">💬</div><p>No history yet.</p></div>`;
    }
  } catch (e) {
    console.error(e);
  }
}

btnClear.addEventListener('click', async () => {
  if (confirm("Clear all history?")) {
    await fetch(`${API_BASE}/history`, { method: 'DELETE' });
    messagesContainer.innerHTML = '';
    hero.style.display = 'block';
    messageCount = 0;
    if (navBtns[2].classList.contains('active')) loadHistory();
  }
});

// Manual Calculator
calcSubmit.addEventListener('click', async () => {
  const p = Number(calcPrincipal.value);
  const r = Number(calcRate.value);
  const t = Number(calcTenure.value);
  const i = Number(calcIncome.value);
  const e = Number(calcExisting.value || 0);

  if (!p || !r || !t || !i) return alert('Please fill all required fields');

  try {
    const res = await fetch(`${API_BASE}/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ principal: p, annual_rate: r, tenure_years: t, monthly_income: i, existing_emi: e })
    });
    if (!res.ok) throw new Error();
    const data = await res.json();
    
    document.getElementById('res-emi').textContent = data.emi_formatted;
    document.getElementById('res-principal').textContent = fmt.format(data.principal);
    document.getElementById('res-interest').textContent = data.total_interest_formatted;
    document.getElementById('res-total').textContent = data.total_payment_formatted;
    document.getElementById('res-dti').textContent = data.dti_ratio + '%';
    
    const riskEl = document.getElementById('res-risk');
    riskEl.textContent = data.risk_level;
    riskEl.className = `risk-pill risk-${data.risk_level.toLowerCase()}`;

    const verdictEl = document.getElementById('res-verdict');
    if (data.affordable) {
      verdictEl.textContent = '✅ This loan looks affordable based on your income limits.';
      verdictEl.className = 'result-verdict verdict-safe';
    } else {
      verdictEl.textContent = '⚠️ High risk! This EMI might strain your monthly budget.';
      verdictEl.className = 'result-verdict verdict-warn';
    }

    // Update pie chart
    const total = data.total_payment;
    const pPer = data.principal / total;
    const dashVal = pPer * 339.3;
    piePrincipal.setAttribute('stroke-dasharray', `${dashVal} 339.3`);

    calcResults.style.display = 'block';
  } catch (err) {
    alert("Error calculating EMI.");
  }
});

// Load history into chat on start
window.addEventListener('DOMContentLoaded', async () => {
  try {
    const res = await fetch(`${API_BASE}/history`);
    const data = await res.json();
    if (data.messages && data.messages.length > 0) {
      hero.style.display = 'none';
      data.messages.forEach(m => appendMessage(m.role, m.content, m.extra_html));
    } else {
      setTimeout(() => appendMessage('bot', "👋 Hello! I'm FinAI. How can I help you with your loan today?"), 500);
    }
  } catch (e) {}
});
