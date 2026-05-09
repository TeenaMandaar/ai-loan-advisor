"""
main.py — FastAPI Application Entry Point
AI Loan Advisor | Part 2
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field, field_validator
import os
from contextlib import asynccontextmanager

from emi import LoanInput, LoanResult, process_loan
from groq_chat import analyze_user_message
from database import init_db, save_message, get_chat_history, clear_chat_history

# ── App Setup ─────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield

app = FastAPI(
    title="AI Loan Advisor API",
    description="EMI calculation, DTI analysis, and AI-powered loan recommendations",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — allow frontend (file:// and localhost) to call the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],       # Restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Request / Response Schemas ────────────────────────────────────────────────

class CalculateRequest(BaseModel):
    principal: float = Field(..., gt=0, description="Loan amount in ₹")
    annual_rate: float = Field(..., gt=0, le=100, description="Annual interest rate (%)")
    tenure_years: float = Field(..., gt=0, le=50, description="Loan tenure in years")
    monthly_income: float = Field(..., gt=0, description="Monthly take-home income in ₹")
    existing_emi: float = Field(default=0.0, ge=0, description="Existing monthly EMI in ₹")

    @field_validator("principal")
    @classmethod
    def principal_max(cls, v):
        if v > 100_000_000:   # ₹10 Crore max for MVP
            raise ValueError("Loan amount cannot exceed ₹10 Crore for this tool.")
        return v

    @field_validator("existing_emi")
    @classmethod
    def existing_emi_check(cls, v, info):
        # existing_emi must not exceed monthly income
        return v


class CalculateResponse(BaseModel):
    emi: float
    total_payment: float
    total_interest: float
    principal: float
    annual_rate: float
    tenure_years: float
    tenure_months: int
    dti_ratio: float
    risk_level: str
    risk_color: str
    affordable: bool
    monthly_income: float
    existing_emi: float
    # Formatted strings for frontend display
    emi_formatted: str
    total_payment_formatted: str
    total_interest_formatted: str
    summary: str


def format_inr(amount: float) -> str:
    """Format a number in Indian Rupee style (e.g. ₹10,22,244)"""
    # Use Python's built-in formatting then convert to Indian system
    s = f"{amount:,.2f}"
    return f"₹{s}"


def build_summary(result: LoanResult) -> str:
    """Generate a plain-English summary of the loan analysis."""
    lines = [
        f"For a ₹{result.principal:,.0f} loan at {result.annual_rate}% p.a. over {result.tenure_years:.0f} years:",
        f"• Your monthly EMI will be {format_inr(result.emi)}",
        f"• You will pay {format_inr(result.total_interest)} in interest (total: {format_inr(result.total_payment)})",
        f"• Your Debt-to-Income ratio is {result.dti_ratio}% — {result.risk_level} Risk",
    ]
    if result.affordable:
        lines.append("✅ This loan appears affordable based on your income.")
    else:
        lines.append("⚠️ This loan may be a stretch. Consider a smaller amount or longer tenure.")
    return "\n".join(lines)


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=1000, description="User's text message")

class ChatResponse(BaseModel):
    type: str # "chat" or "calculate"
    reply: str = "" # Present if type is chat or error
    calculation_result: CalculateResponse = None # Present if type is calculate


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/", include_in_schema=False)
async def root():
    """Serve the frontend index.html"""
    frontend_path = os.path.join(os.path.dirname(__file__), "..", "frontend", "index.html")
    if os.path.exists(frontend_path):
        return FileResponse(frontend_path)
    return {"message": "AI Loan Advisor API is running. Visit /docs for the API documentation."}


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok", "service": "AI Loan Advisor API", "version": "1.0.0"}


@app.post("/calculate", response_model=CalculateResponse)
async def calculate_loan(req: CalculateRequest):
    """
    Calculate EMI, total interest, and DTI ratio for a given loan.

    - **principal**: Loan amount in ₹
    - **annual_rate**: Annual interest rate (%)
    - **tenure_years**: Loan tenure in years
    - **monthly_income**: Monthly take-home income in ₹
    - **existing_emi**: Existing monthly EMI obligations in ₹ (default: 0)
    """
    try:
        loan_input = LoanInput(
            principal=req.principal,
            annual_rate=req.annual_rate,
            tenure_years=req.tenure_years,
            monthly_income=req.monthly_income,
            existing_emi=req.existing_emi,
        )
        result = process_loan(loan_input)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Calculation error: {str(e)}")

    return CalculateResponse(
        emi=result.emi,
        total_payment=result.total_payment,
        total_interest=result.total_interest,
        principal=result.principal,
        annual_rate=result.annual_rate,
        tenure_years=result.tenure_years,
        tenure_months=result.tenure_months,
        dti_ratio=result.dti_ratio,
        risk_level=result.risk_level,
        risk_color=result.risk_color,
        affordable=result.affordable,
        monthly_income=result.monthly_income,
        existing_emi=result.existing_emi,
        emi_formatted=format_inr(result.emi),
        total_payment_formatted=format_inr(result.total_payment),
        total_interest_formatted=format_inr(result.total_interest),
        summary=build_summary(result),
    )

@app.post("/chat", response_model=ChatResponse)
async def chat_with_advisor(req: ChatRequest):
    """
    Send a natural language message to the AI Loan Advisor.
    It will either reply conversationally or perform a calculation if enough details are provided.
    """
    # 0. Save user message to DB
    save_message("user", req.message)

    # 1. Fetch last 6 messages from DB to give Groq conversation context
    recent = get_chat_history()[-6:]  # last 6 entries (3 turns)
    history = []
    for msg in recent:
        # Map DB roles to Groq roles; skip the message we just saved (last one)
        if msg["role"] == "user":
            history.append({"role": "user", "content": msg["content"]})
        elif msg["role"] == "bot":
            history.append({"role": "assistant", "content": msg["content"]})
    # Remove the last item — it's the user message we just saved (already added as current)
    if history and history[-1]["role"] == "user":
        history = history[:-1]

    # 2. Ask Groq to extract intent — with conversation memory
    analysis = analyze_user_message(req.message, history=history)

    # 3. If it's just a chat response
    if analysis.get("action") != "calculate":
        reply_text = analysis.get("reply", "I'm not sure how to respond to that.")
        save_message("bot", reply_text)
        return ChatResponse(
            type="chat",
            reply=reply_text
        )
    
    # 3. If Groq detected a calculation request
    try:
        loan_input = LoanInput(
            principal=float(analysis.get("principal", 0)),
            annual_rate=float(analysis.get("annual_rate", 10.5)),
            tenure_years=float(analysis.get("tenure_years", 0)),
            monthly_income=float(analysis.get("monthly_income", 0)),
            existing_emi=float(analysis.get("existing_emi", 0)),
        )
        
        if loan_input.principal <= 0 or loan_input.tenure_years <= 0 or loan_input.monthly_income <= 0:
            reply_text = "I almost have enough details! Could you please specify the loan amount, tenure (years), and your monthly income?"
            save_message("bot", reply_text)
            return ChatResponse(
                type="chat",
                reply=reply_text
            )
            
        result = process_loan(loan_input)
        
        calc_response = CalculateResponse(
            emi=result.emi,
            total_payment=result.total_payment,
            total_interest=result.total_interest,
            principal=result.principal,
            annual_rate=result.annual_rate,
            tenure_years=result.tenure_years,
            tenure_months=result.tenure_months,
            dti_ratio=result.dti_ratio,
            risk_level=result.risk_level,
            risk_color=result.risk_color,
            affordable=result.affordable,
            monthly_income=result.monthly_income,
            existing_emi=result.existing_emi,
            emi_formatted=format_inr(result.emi),
            total_payment_formatted=format_inr(result.total_payment),
            total_interest_formatted=format_inr(result.total_interest),
            summary=build_summary(result),
        )
        
        summary_text = build_summary(result)
        emi_html = f"""
        <div class="emi-card">
          <div class="emi-row">
            <span class="emi-label">Monthly EMI</span>
            <span class="emi-value">{calc_response.emi_formatted}</span>
          </div>
          <div class="emi-row">
            <span class="emi-label">Risk Level</span>
            <span class="risk-badge risk-{result.risk_level.lower()}">{result.risk_level}</span>
          </div>
        </div>
        """
        
        # Save bot response with HTML to DB
        save_message("bot", summary_text, emi_html)

        return ChatResponse(
            type="calculate",
            calculation_result=calc_response
        )
        
    except Exception as e:
        reply_text = f"I tried to calculate that, but ran into an issue: {str(e)}"
        save_message("bot", reply_text)
        return ChatResponse(
            type="chat",
            reply=reply_text
        )

@app.get("/history")
async def get_history():
    """Returns the stored chat history."""
    return {"messages": get_chat_history()}

@app.delete("/history")
async def clear_history():
    """Clears the stored chat history."""
    clear_chat_history()
    return {"status": "cleared"}


# ── Serve frontend static files ───────────────────────────────────────────────
frontend_dir = os.path.join(os.path.dirname(__file__), "..", "frontend")
if os.path.isdir(frontend_dir):
    app.mount("/", StaticFiles(directory=frontend_dir, html=True), name="frontend")
