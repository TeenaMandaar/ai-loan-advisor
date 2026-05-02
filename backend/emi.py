"""
emi.py — EMI & DTI Calculation Logic
AI Loan Advisor | Part 2
"""

from dataclasses import dataclass
from typing import Optional


# ── Data Models ──────────────────────────────────────────────────────────────

@dataclass
class LoanInput:
    principal: float          # Loan amount in ₹
    annual_rate: float        # Annual interest rate (%)
    tenure_years: float       # Loan tenure in years
    monthly_income: float     # Monthly take-home income in ₹
    existing_emi: float = 0.0 # Existing monthly EMI obligations in ₹


@dataclass
class LoanResult:
    emi: float                # Monthly EMI in ₹
    total_payment: float      # Total amount paid over tenure
    total_interest: float     # Total interest paid
    principal: float          # Original principal
    annual_rate: float        # Annual interest rate
    tenure_years: float       # Tenure in years
    tenure_months: int        # Tenure in months
    dti_ratio: float          # Debt-to-Income ratio (%)
    risk_level: str           # "Low" | "Moderate" | "High"
    risk_color: str           # "green" | "orange" | "red"
    affordable: bool          # True if loan is within safe limits
    monthly_income: float     # Monthly income provided
    existing_emi: float       # Existing EMI obligations


# ── Core EMI Formula ─────────────────────────────────────────────────────────

def calculate_emi(principal: float, annual_rate: float, tenure_years: float) -> float:
    """
    Standard EMI formula:
        EMI = P × r × (1+r)^n / ((1+r)^n - 1)

    Where:
        P = Principal (loan amount)
        r = Monthly interest rate = annual_rate / 12 / 100
        n = Total months = tenure_years * 12
    """
    if principal <= 0 or annual_rate <= 0 or tenure_years <= 0:
        raise ValueError("Principal, interest rate, and tenure must be positive numbers.")

    r = annual_rate / 12 / 100        # monthly rate as decimal
    n = int(tenure_years * 12)        # total months

    if r == 0:
        # Zero-interest edge case
        return round(principal / n, 2)

    emi = principal * r * (1 + r) ** n / ((1 + r) ** n - 1)
    return round(emi, 2)


# ── DTI Calculation ───────────────────────────────────────────────────────────

def calculate_dti(emi: float, existing_emi: float, monthly_income: float) -> float:
    """
    Debt-to-Income Ratio:
        DTI = (New EMI + Existing EMIs) / Monthly Income × 100

    Industry thresholds:
        < 30%  → Low Risk
        30-50% → Moderate Risk
        > 50%  → High Risk
    """
    if monthly_income <= 0:
        raise ValueError("Monthly income must be a positive number.")

    total_debt = emi + existing_emi
    dti = (total_debt / monthly_income) * 100
    return round(dti, 2)


# ── Risk Assessment ───────────────────────────────────────────────────────────

def assess_risk(dti: float) -> tuple[str, str]:
    """
    Returns (risk_level, risk_color) based on DTI ratio.
    """
    if dti < 30:
        return "Low", "green"
    elif dti <= 50:
        return "Moderate", "orange"
    else:
        return "High", "red"


# ── Main Calculation Function ─────────────────────────────────────────────────

def process_loan(input_data: LoanInput) -> LoanResult:
    """
    Full loan analysis:
    1. Calculate EMI
    2. Compute total payment & interest
    3. Calculate DTI ratio
    4. Assess risk level
    5. Determine affordability
    """
    # 1. EMI
    emi = calculate_emi(
        input_data.principal,
        input_data.annual_rate,
        input_data.tenure_years
    )

    # 2. Totals
    tenure_months = int(input_data.tenure_years * 12)
    total_payment = round(emi * tenure_months, 2)
    total_interest = round(total_payment - input_data.principal, 2)

    # 3. DTI
    dti = calculate_dti(emi, input_data.existing_emi, input_data.monthly_income)

    # 4. Risk
    risk_level, risk_color = assess_risk(dti)

    # 5. Affordability (safe = EMI <= 40% of income AND DTI <= 50%)
    safe_emi_limit = input_data.monthly_income * 0.40
    affordable = (emi <= safe_emi_limit) and (dti <= 50)

    return LoanResult(
        emi=emi,
        total_payment=total_payment,
        total_interest=total_interest,
        principal=input_data.principal,
        annual_rate=input_data.annual_rate,
        tenure_years=input_data.tenure_years,
        tenure_months=tenure_months,
        dti_ratio=dti,
        risk_level=risk_level,
        risk_color=risk_color,
        affordable=affordable,
        monthly_income=input_data.monthly_income,
        existing_emi=input_data.existing_emi,
    )


# ── Quick standalone test ─────────────────────────────────────────────────────
if __name__ == "__main__":
    sample = LoanInput(
        principal=1_000_000,   # ₹10 Lakh
        annual_rate=12.0,      # 12% p.a.
        tenure_years=5,        # 5 years
        monthly_income=60_000, # ₹60,000/month
        existing_emi=5_000,    # ₹5,000 existing EMI
    )
    result = process_loan(sample)
    print("=" * 45)
    print("  AI Loan Advisor -- EMI Calculation Test")
    print("=" * 45)
    print(f"  Loan Amount   : INR {result.principal:,.0f}")
    print(f"  Interest Rate : {result.annual_rate}% p.a.")
    print(f"  Tenure        : {result.tenure_years} years ({result.tenure_months} months)")
    print(f"  Monthly EMI   : INR {result.emi:,.2f}")
    print(f"  Total Payment : INR {result.total_payment:,.2f}")
    print(f"  Total Interest: INR {result.total_interest:,.2f}")
    print(f"  DTI Ratio     : {result.dti_ratio}%")
    print(f"  Risk Level    : {result.risk_level} ({result.risk_color})")
    print(f"  Affordable?   : {'YES' if result.affordable else 'NO - consider smaller loan'}")
    print("=" * 45)
