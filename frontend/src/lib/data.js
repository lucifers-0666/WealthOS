export const KPI = [
  { label:'Portfolio Value',  value:'\u20b924,81,450', delta:'+12.4%', up:true,  sub:'Total current value'   },
  { label:'Total P&L',        value:'+\u20b92,73,200', delta:'+11.4%', up:true,  sub:'Unrealised gain/loss'  },
  { label:'Day Change',       value:'+\u20b914,320',   delta:'+0.58%', up:true,  sub:'Today vs. yesterday'   },
  { label:'Max Drawdown',     value:'-8.2%',            delta:'-2.1%',  up:false, sub:'From 52-week peak'     },
]

export const HOLDINGS = [
  { symbol:'RELIANCE',  name:'Reliance Industries',  qty:50,  avg:2340, ltp:2780, pl:22000,  plp:18.8,  wt:14.2, exch:'NSE'    },
  { symbol:'INFY',      name:'Infosys',               qty:80,  avg:1420, ltp:1680, pl:20800,  plp:18.3,  wt:12.8, exch:'NSE'    },
  { symbol:'HDFCBANK',  name:'HDFC Bank',             qty:60,  avg:1560, ltp:1510, pl:-3000,  plp:-3.2,  wt:10.9, exch:'NSE'    },
  { symbol:'TCS',       name:'Tata Consultancy',      qty:40,  avg:3200, ltp:3980, pl:31200,  plp:24.4,  wt:9.6,  exch:'NSE'    },
  { symbol:'WIPRO',     name:'Wipro',                 qty:120, avg:480,  ltp:420,  pl:-7200,  plp:-12.5, wt:6.1,  exch:'NSE'    },
  { symbol:'VTI',       name:'Vanguard Total Mkt',    qty:15,  avg:220,  ltp:258,  pl:570,    plp:17.3,  wt:4.6,  exch:'NYSE'   },
  { symbol:'QQQ',       name:'Invesco QQQ Trust',     qty:10,  avg:340,  ltp:420,  pl:800,    plp:23.5,  wt:5.0,  exch:'NASDAQ' },
]

const MO = ['May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar','Apr','May']
export const PERF = MO.map((m,i) => ({
  month: m,
  value:     Math.round(1_800_000 + i*62_000 + (i*7777 % 80000) - 20000),
  benchmark: Math.round(1_800_000 + i*45_000 + (i*5555 % 50000) - 10000),
}))

export const ALLOC = [
  { name:'Large Cap', value:38.5, color:'#7DD3FC' },
  { name:'Mid Cap',   value:18.2, color:'#A78BFA' },
  { name:'IT / Tech', value:22.3, color:'#67E8F9' },
  { name:'Intl ETFs', value:9.6,  color:'#86EFAC' },
  { name:'Gold',      value:7.2,  color:'#D6C7A1' },
  { name:'Cash',      value:4.2,  color:'#64748B' },
]

export const TARGET = [
  { name:'Large Cap', target:35, actual:38.5 },
  { name:'Mid Cap',   target:20, actual:18.2 },
  { name:'IT / Tech', target:20, actual:22.3 },
  { name:'Intl ETFs', target:12, actual:9.6  },
  { name:'Gold',      target:8,  actual:7.2  },
  { name:'Cash',      target:5,  actual:4.2  },
]

export const NEWS = [
  { id:1, title:'RBI Holds Rates at 6.25% in April Policy Meet',         source:'Economic Times', time:'2h ago',  cat:'Macro',    summary:'The RBI maintained the repo rate at 6.25%, citing inflation control progress.', sent:'neutral'  },
  { id:2, title:'Infosys Q4 Revenue Beats Estimates, Margin Improves',   source:'Bloomberg',      time:'4h ago',  cat:'Earnings', summary:'Infosys reported Q4 revenue of $4.61B, beating consensus by 1.8%.', sent:'positive' },
  { id:3, title:'HDFC Bank Reports Muted Q4 Loan Growth',                source:'Mint',           time:'6h ago',  cat:'Banking',  summary:'HDFC Bank loan book grew 7.3% YoY, slower than peers.', sent:'negative' },
  { id:4, title:'Nifty 50 Hits New All-Time High, Surpasses 24,500',     source:'NSE',            time:'8h ago',  cat:'Market',   summary:'Nifty 50 touched a fresh record driven by IT and energy.', sent:'positive' },
  { id:5, title:'Wipro to Acquire Finnish IT Firm for $150M',            source:'Reuters',        time:'10h ago', cat:'M&A',      summary:'Wipro announced acquisition of a Nordic IT services firm.', sent:'positive' },
  { id:6, title:'TCS Bags $500M Multi-Year Deal from European Bank',     source:'Moneycontrol',   time:'12h ago', cat:'Earnings', summary:'TCS signed a 5-year digital transformation contract.', sent:'positive' },
  { id:7, title:'FII Net Buyers for 8th Consecutive Session',            source:'SEBI',           time:'1d ago',  cat:'Flows',    summary:'FIIs bought net \u20b93,240 crore in equities.', sent:'positive' },
  { id:8, title:'Gold Prices Ease as Dollar Strengthens Post Fed Notes', source:'Bloomberg',      time:'1d ago',  cat:'Commodity',summary:'Gold spot dipped 0.8% after Fed minutes signalled no rush to cut rates.', sent:'negative' },
]
