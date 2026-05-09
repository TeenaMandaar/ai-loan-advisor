"""
groq_chat.py — Groq LLM Integration
AI Loan Advisor | Part 4
"""

import os
import json
from dotenv import load_dotenv
from groq import Groq

# Load environment variables (e.g. GROQ_API_KEY)
load_dotenv()

# Initialize Groq client
client = Groq(api_key=os.environ.get("GROQ_API_KEY", ""))

SYSTEM_PROMPT = """
You are FinAI, a precise AI Loan Advisor for Indian users.
Always respond in strictly valid JSON — no text outside the JSON object.

== SCENARIO A: General / greeting / missing info ==
{ "action": "chat", "reply": "2-3 sentence helpful response. Never invent numbers." }

== SCENARIO B: User gives loan amount + tenure + monthly income ==
{ "action": "calculate", "principal": 3000000, "annual_rate": 8.75, "tenure_years": 20, "monthly_income": 60000, "existing_emi": 0, "reply": "One sentence intro." }

== NUMBER CONVERSION ==
1 Lakh=100000 | 1 Crore=10000000 | "60k"=60000 | "2L"=200000

== DEFAULT RATES (use if user doesn't specify) ==
Home Loan: 8.75% | Car Loan: 9.5% | Personal Loan: 14.0% | Education: 8.5% | LAP: 10.0%

== CRITICAL ANTI-HALLUCINATION RULES — NEVER BREAK ==
1. NEVER state any EMI figure, total interest, or DTI % in a chat reply. Numbers come ONLY from action=calculate.
2. NEVER invent bank names, scheme names, or specific rates beyond the defaults above.
3. You MUST extract loan details (amount, tenure, income) from the ENTIRE conversation history, not just the user's latest message.
4. If any of amount/tenure/income is missing (even after checking history) → action=chat, ask only for the missing field.
5. Only discuss loan and personal finance topics. Redirect everything else politely.
6. ONLY output valid JSON. Zero text outside the JSON.
"""

# Models to try in order of preference (all free tier)
MODELS = [
    "llama-3.3-70b-versatile",
    "llama-3.1-70b-versatile",
    "llama3-70b-8192",
    "mixtral-8x7b-32768",
]

def analyze_user_message(user_message: str, history: list[dict] | None = None) -> dict:
    """
    Sends the user message to Groq with conversation history for multi-turn context.
    history: list of {"role": "user"|"assistant", "content": str} dicts (most recent last).
    Automatically falls back to next model if one is unavailable.
    """
    if not os.environ.get("GROQ_API_KEY"):
        return {
            "action": "chat",
            "reply": "⚠️ Groq API key is missing. Please set GROQ_API_KEY in your .env file to enable AI chat."
        }

    # Build messages: system + history + current user message
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    if history:
        messages.extend(history)
    messages.append({"role": "user", "content": user_message})

    last_error = None
    for model in MODELS:
        try:
            chat_completion = client.chat.completions.create(
                messages=messages,
                model=model,
                response_format={"type": "json_object"},
                temperature=0.15,
                max_tokens=512,
            )
            response_text = chat_completion.choices[0].message.content
            print(f"[Groq] Used model: {model}")
            return json.loads(response_text)

        except Exception as e:
            err_str = str(e)
            print(f"[Groq] Model {model} failed: {err_str}")
            last_error = err_str
            if "decommissioned" in err_str or "not found" in err_str.lower() or "deprecated" in err_str.lower():
                continue
            break

    return {
        "action": "chat",
        "reply": "I'm having a little trouble connecting right now. Please try again in a moment! 🙏"
    }
