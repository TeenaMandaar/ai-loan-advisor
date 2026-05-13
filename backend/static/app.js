'use strict';

const userInput = document.getElementById('user-input');
const btnSend = document.getElementById('btn-send');
const messagesContainer = document.getElementById('messages');
const btnClear = document.getElementById('btn-clear');

// Ledger Elements
const ledgPrincipal = document.getElementById('ledg-principal');
const ledgTenure = document.getElementById('ledg-tenure');
const ledgRate = document.getElementById('ledg-rate');
const ledgEmi = document.getElementById('ledg-emi');
const ledgInterest = document.getElementById('ledg-interest');
const ledgDti = document.getElementById('ledg-dti');
const ledgRiskText = document.getElementById('ledg-risk-text');
const ledgRiskDot = document.getElementById('ledg-risk-dot');
const sparkP = document.getElementById('spark-p');
const sparkI = document.getElementById('spark-i');

const API_BASE = 'http://127.0.0.1:8000';
let isTyping = false;

// Formatters
const fmt = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

userInput.addEventListener('input', () => {
  userInput.style.height = '20px';
  userInput.style.height = Math.min(userInput.scrollHeight, 120) + 'px';
  btnSend.disabled = userInput.value.trim().length === 0 || isTyping;
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

function appendMessage(role, content) {
  const row = document.createElement('div');
  row.className = `message-row ${role}`;
  
  const avatar = document.createElement('div');
  avatar.className = 'msg-avatar';
  avatar.textContent = role === 'user' ? 'U' : 'AI';

  const bubble = document.createElement('div');
  bubble.className = 'message-bubble';

  const p = document.createElement('p');
  content.split('\n').forEach((line, i, arr) => {
    p.appendChild(document.createTextNode(line));
    if (i < arr.length - 1) p.appendChild(document.createElement('br'));
  });
  bubble.appendChild(p);

  row.appendChild(avatar);
  row.appendChild(bubble);
  messagesContainer.appendChild(row);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function updateLedger(data) {
  if (!data) return;
  ledgPrincipal.textContent = fmt.format(data.principal);
  ledgTenure.textContent = `${data.tenure_years} yrs`;
  ledgRate.textContent = `${data.annual_rate}%`;
  ledgEmi.textContent = data.emi_formatted;
  ledgInterest.textContent = data.total_interest_formatted;
  
  ledgDti.textContent = `${data.dti_ratio}%`;
  
  // Update Risk Pill
  ledgRiskText.textContent = data.risk_level;
  const riskClass = data.risk_level.toLowerCase();
  ledgRiskDot.className = `risk-dot ${riskClass}`;

  // Draw Sparkline
  const total = data.total_payment;
  const pPercent = (data.principal / total) * 100;
  const iPercent = (data.total_interest / total) * 100;
  
  sparkP.style.width = `${pPercent}%`;
  sparkI.style.width = `${iPercent}%`;
}

async function sendMessage() {
  const text = userInput.value.trim();
  if (!text) return;

  appendMessage('user', text);
  userInput.value = '';
  userInput.style.height = '24px';
  btnSend.disabled = true;
  isTyping = true;

  // Add a temporary typing indicator
  const typingRow = document.createElement('div');
  typingRow.className = 'message-row bot';
  typingRow.id = 'typing-indicator';
  typingRow.innerHTML = `<div class="msg-avatar">AI</div><div class="message-bubble" style="color:var(--text-muted)">Processing...</div>`;
  messagesContainer.appendChild(typingRow);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;

  try {
    const res = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text })
    });
    
    if (!res.ok) throw new Error('API Error');
    const data = await res.json();
    
    document.getElementById('typing-indicator').remove();
    isTyping = false;

    if (data.type === 'calculate' && data.calculation_result) {
      updateLedger(data.calculation_result);
      // The AI only speaks insights now
      appendMessage('bot', data.reply || data.calculation_result.summary);
    } else {
      appendMessage('bot', data.reply || "I didn't quite catch that.");
    }
  } catch (err) {
    document.getElementById('typing-indicator')?.remove();
    isTyping = false;
    appendMessage('bot', "⚠️ Connection error.");
  }
}

// Load history into chat on start
window.addEventListener('DOMContentLoaded', async () => {
  try {
    const res = await fetch(`${API_BASE}/history`);
    const data = await res.json();
    if (data.messages && data.messages.length > 0) {
      data.messages.forEach(m => appendMessage(m.role, m.content));
    } else {
      setTimeout(() => appendMessage('bot', "System online. Enter loan parameters to begin analysis."), 500);
    }
  } catch (e) {}
});

btnClear.addEventListener('click', async () => {
  if (confirm("Clear session?")) {
    await fetch(`${API_BASE}/history`, { method: 'DELETE' });
    messagesContainer.innerHTML = '';
    appendMessage('bot', "System online. Enter loan parameters to begin analysis.");
  }
});
