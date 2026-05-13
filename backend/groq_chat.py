"""
groq_chat.py — Groq LLM Integration (Agentic Terminal Version)
"""

import os
import json
from dotenv import load_dotenv
from groq import Groq

load_dotenv()
client = Groq(api_key=os.environ.get("GROQ_API_KEY", ""))

SYSTEM_PROMPT = """
You are FinAI, an elite, agentic Financial Analysis Terminal. 
Your tone is highly professional, concise, and analytical — like a Bloomberg terminal or a senior Stripe engineer.
You process natural language into strict JSON parameters for the backend execution engine.

== SCENARIO A: General Chat / Missing Data ==
{ 
  "action": "chat", 
  "reply": "Brief, analytical response. Acknowledge missing parameters (Principal, Tenure, or Income) if required for modeling." 
}

== SCENARIO B: Execute Calculation ==
If the conversation history contains Principal (Amount) and Monthly Income, trigger the calculation engine immediately.
If Tenure is missing, ASSUME A DEFAULT (Home: 20 yrs, Personal: 5 yrs, Car: 5 yrs, others: 5 yrs).
{ 
  "action": "calculate", 
  "principal": 3000000, 
  "annual_rate": 8.75, 
  "tenure_years": 20, 
  "monthly_income": 60000, 
  "existing_emi": 0, 
  "reply": "I have modeled your loan assuming a 20-year tenure. [Provide 1 sentence of risk/strategy insight here]. DO NOT state EMI or Interest numbers in this reply." 
}

== NUMBER CONVERSION ==
1 Lakh = 100000 | 1 Crore = 10000000 | "60k" = 60000 | "2L" = 200000

== DEFAULT RATES ==
Home: 8.75% | Car: 9.5% | Personal: 14.0% | Education: 8.5% | LAP: 10.0%

== CRITICAL RULES ==
1. The UI has a "Live Ledger" panel that shows exact EMI, DTI, and Interest numbers. Therefore, NEVER state EMI or total interest in your `reply`.
2. Extract parameters from the ENTIRE conversation history.
3. NEVER ask the user for the tenure. If they don't provide it, assume a default and calculate immediately so the dashboard populates.
4. ONLY output valid JSON. Zero text outside the JSON object.
"""

MODELS = [
    "llama-3.3-70b-versatile",
    "llama-3.1-70b-versatile",
    "llama3-70b-8192",
    "mixtral-8x7b-32768",
]

def analyze_user_message(user_message: str, history: list[dict] | None = None) -> dict:
    if not os.environ.get("GROQ_API_KEY"):
        return {"action": "chat", "reply": "System Error: GROQ_API_KEY missing."}

    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    if history:
        messages.extend(history)
    messages.append({"role": "user", "content": user_message})

    for model in MODELS:
        try:
            chat_completion = client.chat.completions.create(
                messages=messages,
                model=model,
                response_format={"type": "json_object"},
                temperature=0.1,  # Lower temperature for more analytical/precise output
                max_tokens=512,
            )
            response_text = chat_completion.choices[0].message.content
            print(f"[FinAI Agent] Model used: {model}")
            return json.loads(response_text)

        except Exception as e:
            err_str = str(e)
            if "decommissioned" in err_str or "not found" in err_str.lower():
                continue
            break

    return {"action": "chat", "reply": "Connection to inference engine failed. Retrying..."}
