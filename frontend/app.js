'use strict';

const userInput       = document.getElementById('user-input');
const btnSend         = document.getElementById('btn-send');
const messagesContainer = document.getElementById('messages');
const btnClear        = document.getElementById('btn-clear');

// Ledger Elements
const ledgPrincipal   = document.getElementById('ledg-principal');
const ledgTenure      = document.getElementById('ledg-tenure');
const ledgEmi         = document.getElementById('ledg-emi');
const ledgDti         = document.getElementById('ledg-dti');
const ledgRiskText    = document.getElementById('ledg-risk-text');
const ledgRiskDot     = document.getElementById('ledg-risk-dot');
const sparkP          = document.getElementById('spark-p');
const sparkI          = document.getElementById('spark-i');

// Scenario Elements
const ledgerScenarios = document.getElementById('ledger-scenarios');
const scenAggEmi      = document.getElementById('scen-agg-emi');
const scenAggTen      = document.getElementById('scen-agg-ten');
const scenBalEmi      = document.getElementById('scen-bal-emi');
const scenBalTen      = document.getElementById('scen-bal-ten');
const scenRelEmi      = document.getElementById('scen-rel-emi');
const scenRelTen      = document.getElementById('scen-rel-ten');

const API_BASE = window.location.origin;
let isTyping = false;

// ─── Formatters ───────────────────────────────────────────────────────────────
const fmt = new Intl.NumberFormat('en-IN', {
  style: 'currency', currency: 'INR', maximumFractionDigits: 0
});

// ─── Auto-resize textarea ─────────────────────────────────────────────────────
userInput.addEventListener('input', () => {
  userInput.style.height = '22px';
  userInput.style.height = Math.min(userInput.scrollHeight, 140) + 'px';
  btnSend.disabled = userInput.value.trim().length === 0 || isTyping;
});

// ─── Send on Enter (Shift+Enter = new line) ───────────────────────────────────
userInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    if (!btnSend.disabled) sendMessage();
  }
});

// ─── Keep keyboard visible on mobile ─────────────────────────────────────────
btnSend.addEventListener('mousedown', (e) => e.preventDefault());
btnSend.addEventListener('touchstart', (e) => {
  e.preventDefault();
  if (!btnSend.disabled) { sendMessage(); userInput.focus(); }
});
btnSend.addEventListener('click', () => {
  if (!btnSend.disabled) { sendMessage(); userInput.focus(); }
});

// ─── Append a message row ─────────────────────────────────────────────────────
function appendMessage(role, content) {
  const row = document.createElement('div');
  row.className = `message-row ${role}`;

  const avatar = document.createElement('div');
  avatar.className = 'msg-avatar';
  avatar.textContent = role === 'user' ? 'U' : 'AI';

  const bubble = document.createElement('div');
  bubble.className = 'message-bubble';

  // Safely render multi-line text (no innerHTML = no XSS)
  const p = document.createElement('p');
  String(content).split('\n').forEach((line, i, arr) => {
    p.appendChild(document.createTextNode(line));
    if (i < arr.length - 1) p.appendChild(document.createElement('br'));
  });
  bubble.appendChild(p);

  row.appendChild(avatar);
  row.appendChild(bubble);
  messagesContainer.appendChild(row);
  // Auto-scroll to latest message
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// ─── Dynamic DTI colour ───────────────────────────────────────────────────────
function applyDtiColour(dtiValue) {
  ledgDti.className = 'stat-value dti-value';   // reset
  if      (dtiValue < 40) ledgDti.classList.add('dti-low');
  else if (dtiValue < 60) ledgDti.classList.add('dti-moderate');
  else                     ledgDti.classList.add('dti-high');
}

// ─── Update Live Ledger ───────────────────────────────────────────────────────
function updateLedger(data) {
  if (!data) return;

  // Guard: only update if DOM elements exist
  if (ledgPrincipal) ledgPrincipal.textContent  = fmt.format(data.principal);
  if (ledgTenure)    ledgTenure.textContent      = `${data.tenure_years} yrs`;
  if (ledgEmi)       ledgEmi.textContent         = data.emi_formatted;

  const dtiVal = parseFloat(data.dti_ratio);
  if (ledgDti) {
    ledgDti.textContent = `${data.dti_ratio}%`;
    applyDtiColour(dtiVal);
  }

  // Risk pill
  if (ledgRiskText) ledgRiskText.textContent = data.risk_level;
  if (ledgRiskDot) {
    ledgRiskDot.className = `risk-dot ${data.risk_level.toLowerCase()}`;
  }

  // Sparkline
  const total = data.total_payment || 1;
  const pPct  = ((data.principal    / total) * 100).toFixed(1);
  const iPct  = ((data.total_interest / total) * 100).toFixed(1);
  // Animate width (correct for side-by-side flex bar chart)
  if (sparkP) sparkP.style.width = `${pPct}%`;
  if (sparkI) sparkI.style.width = `${iPct}%`;

  // Scenarios
  if (data.scenarios && ledgerScenarios) {
    ledgerScenarios.style.display = 'block';
    if (scenAggEmi) scenAggEmi.textContent = data.scenarios.aggressive.emi_formatted;
    if (scenAggTen) scenAggTen.textContent = `${Number(data.scenarios.aggressive.tenure_years).toFixed(1)} yrs`;
    if (scenBalEmi) scenBalEmi.textContent = data.scenarios.balanced.emi_formatted;
    if (scenBalTen) scenBalTen.textContent = `${Number(data.scenarios.balanced.tenure_years).toFixed(1)} yrs`;
    if (scenRelEmi) scenRelEmi.textContent = data.scenarios.relaxed.emi_formatted;
    if (scenRelTen) scenRelTen.textContent = `${Number(data.scenarios.relaxed.tenure_years).toFixed(1)} yrs`;
  }
}

// ─── Send message ─────────────────────────────────────────────────────────────
async function sendMessage() {
  const text = userInput.value.trim();
  if (!text) return;

  appendMessage('user', text);
  userInput.value = '';
  userInput.style.height = '22px';
  btnSend.disabled = true;
  isTyping = true;

  // Typing indicator
  const typingRow = document.createElement('div');
  typingRow.className = 'message-row bot';
  typingRow.id = 'typing-indicator';
  typingRow.innerHTML = `
    <div class="msg-avatar">AI</div>
    <div class="message-bubble typing-pulse">
      <span></span><span></span><span></span>
    </div>`;
  messagesContainer.appendChild(typingRow);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;

  try {
    const res = await fetch(`${API_BASE}/chat`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ message: text })
    });

    if (!res.ok) {
      // Surface HTTP error details for debugging
      const errBody = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status}: ${errBody}`);
    }

    // Safe JSON parse — catch malformed responses
    let data;
    try {
      data = await res.json();
    } catch {
      throw new Error('Server returned non-JSON response');
    }

    document.getElementById('typing-indicator')?.remove();
    isTyping = false;

    // Validate expected shape
    if (typeof data !== 'object' || data === null) {
      throw new Error('Unexpected response format');
    }

    if (data.type === 'calculate' && data.calculation_result) {
      updateLedger(data.calculation_result);
      appendMessage('bot', data.reply || data.calculation_result.summary || 'Calculation complete.');
    } else {
      appendMessage('bot', data.reply || "I didn't quite catch that. Could you rephrase?");
    }

    // Persist last successful chat to localStorage as fallback
    try {
      const stored = JSON.parse(localStorage.getItem('finai_history') || '[]');
      stored.push({ role: 'user', content: text });
      stored.push({ role: 'bot',  content: data.reply || '' });
      // Keep only last 40 messages (20 pairs) in localStorage
      localStorage.setItem('finai_history', JSON.stringify(stored.slice(-40)));
    } catch { /* localStorage not available */ }

  } catch (err) {
    document.getElementById('typing-indicator')?.remove();
    isTyping = false;
    console.error('[FinAI] sendMessage error:', err);
    appendMessage('bot', `⚠️ Error: ${err.message || 'Connection failed. Please try again.'}`);
  } finally {
    // Always re-enable the button
    isTyping = false;
    btnSend.disabled = userInput.value.trim().length === 0;
  }
}

// ─── Load history on start ────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', async () => {
  // Try server-side history first (SQLite)
  try {
    const res  = await fetch(`${API_BASE}/history`);
    if (!res.ok) throw new Error('history fetch failed');
    const data = await res.json();

    if (data.messages && data.messages.length > 0) {
      data.messages.forEach(m => appendMessage(m.role, m.content));
      return; // server history loaded — done
    }
  } catch (e) {
    console.warn('[FinAI] Server history unavailable, trying localStorage...', e);
  }

  // Fallback: localStorage history (works even when backend is cold-starting)
  try {
    const stored = JSON.parse(localStorage.getItem('finai_history') || '[]');
    if (stored.length > 0) {
      stored.forEach(m => appendMessage(m.role, m.content));
      return;
    }
  } catch { /* ignore parse errors */ }

  // Default welcome message
  setTimeout(() => appendMessage('bot', 'System online. Enter loan parameters to begin analysis.'), 400);
});

// ─── Clear session ────────────────────────────────────────────────────────────
btnClear.addEventListener('click', async () => {
  if (!confirm('Clear session?')) return;
  try {
    await fetch(`${API_BASE}/history`, { method: 'DELETE' });
  } catch { /* ignore if backend is down */ }
  localStorage.removeItem('finai_history');
  messagesContainer.innerHTML = '';
  appendMessage('bot', 'System online. Enter loan parameters to begin analysis.');
});
