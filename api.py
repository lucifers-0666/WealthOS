from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from PIL import Image
import io
import os

load_dotenv()

app = FastAPI(title="WealthOS API", version="2.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)


class AdvisorRequest(BaseModel):
    query: str


PORTFOLIO_CONTEXT = """
Portfolio summary (live demo data):
- Total value: INR 24,81,450 | P&L: +INR 2,73,200 (+11.4%)
- Holdings: RELIANCE (14.2%), INFY (12.8%), HDFCBANK (10.9%), TCS (9.6%), WIPRO (6.1%), VTI (4.6%), QQQ (5.0%)
- Best performer: TCS +24.4% | Worst: WIPRO -12.5%
- Allocation: LargeCap 38.5%, IT 22.3%, MidCap 18.2%, IntlETF 9.6%, Gold 7.2%, Cash 4.2%
- Target deviation: LargeCap +3.5% overweight, IntlETF -2.4% underweight
"""


@app.post("/api/advisor")
async def advisor(req: AdvisorRequest):
    api_key = os.getenv("GOOGLE_API_KEY", "")
    if not api_key:
        return {"response": "GOOGLE_API_KEY is not set in .env. Add it and restart uvicorn."}

    try:
        import google.generativeai as genai

        model_name = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel(model_name)
        system = f"""You are WealthOS CFO Advisor - a senior Indian portfolio strategist.
You know NSE/BSE, SEBI rules, LTCG/STCG tax, SIP strategies, and global ETF allocation for Indian investors.
Always give specific, actionable advice. Format Indian currency as INR. Be concise, with a maximum of 200 words.

Live portfolio data:
{PORTFOLIO_CONTEXT}"""
        response = model.generate_content(f"{system}\n\nUser: {req.query}")
        return {"response": response.text}
    except Exception as exc:
        return {"response": f"Error: {exc}"}


@app.post("/api/portfolio/image")
async def extract_portfolio_image(file: UploadFile = File(...)):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Upload a PNG, JPG, or JPEG portfolio screenshot.")

    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert("RGB")
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Could not read image: {exc}") from exc

    try:
        from core.image_ocr import extract_holdings_from_image

        df = extract_holdings_from_image(image)
        if df is None or df.empty:
            return {
                "holdings": [],
                "message": "No holdings were recognized. Try a sharper screenshot with visible symbol, quantity, and price columns.",
            }

        normalized = []
        for _, row in df.iterrows():
            symbol = str(row.get("Symbol", "")).strip().upper()
            if not symbol or symbol == "NAN":
                continue

            quantity = _num(row.get("Quantity", 0))
            avg_price = _num(row.get("Avg_Buy_Price", 0))
            current_price = _num(row.get("Current_Price", avg_price)) or avg_price

            invested = quantity * avg_price
            current_value = quantity * current_price
            pnl = current_value - invested
            pnl_pct = (pnl / invested * 100) if invested else 0

            normalized.append({
                "symbol": symbol,
                "name": str(row.get("Name", "") or symbol).strip(),
                "qty": quantity,
                "avg": avg_price,
                "ltp": current_price,
                "pl": round(pnl, 2),
                "plp": round(pnl_pct, 2),
                "wt": 0,
                "exch": str(row.get("Exchange", "") or "NSE").strip().upper(),
                "assetType": str(row.get("Asset_Type", "") or "Equity").strip(),
            })

        total_value = sum(item["qty"] * item["ltp"] for item in normalized)
        if total_value:
            for item in normalized:
                item["wt"] = round((item["qty"] * item["ltp"] / total_value) * 100, 1)

        return {
            "holdings": normalized,
            "message": f"Recognized {len(normalized)} holdings from the uploaded image.",
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Image recognition failed: {exc}") from exc


@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "version": "2.1.0",
        "gemini_configured": bool(os.getenv("GOOGLE_API_KEY", "")),
        "news_configured": bool(os.getenv("NEWSAPI_KEY", "")),
        "alpha_vantage_configured": bool(os.getenv("ALPHA_VANTAGE_KEY", "")),
    }


@app.get("/api/portfolio")
def portfolio():
    return {
        "total_value": 2481450,
        "total_pl": 273200,
        "pl_pct": 11.4,
        "day_change": 14320,
        "day_change_pct": 0.58,
        "max_drawdown": -8.2,
        "holdings_count": 7,
    }


def _num(value):
    try:
        if value is None:
            return 0
        return float(value)
    except (TypeError, ValueError):
        return 0
