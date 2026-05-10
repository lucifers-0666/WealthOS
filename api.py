from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os, json

app = FastAPI(title="WealthOS API", version="2.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:3000"], allow_methods=["*"], allow_headers=["*"])

class AdvisorRequest(BaseModel):
    query: str

PORTFOLIO_CONTEXT = """
Portfolio summary (live demo data):
- Total value: ₹24,81,450 | P&L: +₹2,73,200 (+11.4%)
- Holdings: RELIANCE (14.2%), INFY (12.8%), HDFCBANK (10.9%), TCS (9.6%), WIPRO (6.1%), VTI (4.6%), QQQ (5.0%)
- Best performer: TCS +24.4% | Worst: WIPRO -12.5%
- Allocation: LargeCap 38.5%, IT 22.3%, MidCap 18.2%, IntlETF 9.6%, Gold 7.2%, Cash 4.2%
- Target deviation: LargeCap +3.5% overweight, IntlETF -2.4% underweight
"""

@app.post("/api/advisor")
async def advisor(req: AdvisorRequest):
    api_key = os.getenv("GOOGLE_API_KEY", "")
    if not api_key:
        return {"response": "⚠️ GOOGLE_API_KEY not set in .env. Add it and restart uvicorn."}
    try:
        import google.generativeai as genai
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-1.5-pro-latest")
        system = f"""You are WealthOS CFO Advisor — a senior Indian portfolio strategist.
You know NSE/BSE, SEBI rules, LTCG/STCG tax (equity LTCG >1L taxed at 10%, STCG at 15%),
SIP strategies, and global ETF allocation for Indian investors.
Always give specific, actionable advice. Format with ₹ symbol. Be concise (200 words max).

Live portfolio data:\n{PORTFOLIO_CONTEXT}"""
        response = model.generate_content(f"{system}\n\nUser: {req.query}")
        return {"response": response.text}
    except Exception as e:
        return {"response": f"⚠️ Error: {str(e)}"}

@app.get("/api/health")
def health():
    return {"status": "ok", "version": "2.0.0"}

@app.get("/api/portfolio")
def portfolio():
    return {
        "total_value": 2481450, "total_pl": 273200, "pl_pct": 11.4,
        "day_change": 14320, "day_change_pct": 0.58, "max_drawdown": -8.2,
        "holdings_count": 7
    }
