import sys
import os
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from backend.services.live_market_engine import LiveMarketEngine
from backend.services.market_service import MarketService
from core.data_loader import parse_holdings_csv
import io

path='D:/wealthOS/WealthOS/data/sample_holdings.csv'
with open(path,'rb') as f:
    holdings = parse_holdings_csv(io.BytesIO(f.read()))

mkt = MarketService()
engine = LiveMarketEngine(market_service=mkt)
# build symbols
symbols = [{'ticker': h['ticker'], 'exchange': h.get('exchange','NSE'), 'currency': h.get('currency','INR')} for h in holdings]
quotes = mkt.fetch_prices(symbols)
merged = engine._merge_quotes_into_holdings([], holdings, quotes)
import json
print(json.dumps(merged, indent=2))
