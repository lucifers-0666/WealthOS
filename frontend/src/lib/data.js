export const kpis = [
  { label: 'Portfolio Value',  value: '\u20b924,81,450', delta: '+12.4%', up: true,  sub: 'vs last month' },
  { label: 'Total Gain / Loss', value: '+\u20b92,73,200', delta: '+11.4%', up: true,  sub: 'unrealised P&L' },
  { label: 'Day Change',       value: '+\u20b914,320',    delta: '+0.58%', up: true,  sub: 'today' },
  { label: 'Max Drawdown',     value: '-8.2%',            delta: '-2.1%',  up: false, sub: '52-week peak' },
]

const M = ['May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar','Apr','May']
export const perfData = M.map((m, i) => ({
  month: m,
  portfolio: Math.round(1800000 + i * 62000 + (i * 7919) % 80000 - 40000),
  benchmark:  Math.round(1800000 + i * 45000 + (i * 5231) % 50000 - 25000),
}))

export const allocData = [
  { name: 'Large Cap',   value: 38.5, color: '#3B82F6' },
  { name: 'IT / Tech',   value: 22.3, color: '#22D3EE' },
  { name: 'Mid Cap',     value: 18.2, color: '#8B5CF6' },
  { name: 'Intl ETFs',   value:  9.6, color: '#34D399' },
  { name: 'Gold',        value:  7.2, color: '#FBBF24' },
  { name: 'Cash',        value:  4.2, color: '#475569' },
]

export const targetData = [
  { name: 'Large Cap', target: 35, actual: 38.5 },
  { name: 'IT / Tech', target: 20, actual: 22.3 },
  { name: 'Mid Cap',   target: 20, actual: 18.2 },
  { name: 'Intl ETFs', target: 12, actual:  9.6 },
  { name: 'Gold',      target:  8, actual:  7.2 },
  { name: 'Cash',      target:  5, actual:  4.2 },
]

export const holdings = [
  { symbol:'RELIANCE',  name:'Reliance Industries',    qty:50,  avg:2340, ltp:2780,  pl:22000,  plp: 18.8, w:14.2, ex:'NSE' },
  { symbol:'INFY',      name:'Infosys',                qty:80,  avg:1420, ltp:1680,  pl:20800,  plp: 18.3, w:12.8, ex:'NSE' },
  { symbol:'HDFCBANK',  name:'HDFC Bank',              qty:60,  avg:1560, ltp:1510,  pl:-3000,  plp: -3.2, w:10.9, ex:'NSE' },
  { symbol:'TCS',       name:'Tata Consultancy',       qty:40,  avg:3200, ltp:3980,  pl:31200,  plp: 24.4, w: 9.6, ex:'NSE' },
  { symbol:'WIPRO',     name:'Wipro',                  qty:120, avg:480,  ltp:420,   pl:-7200,  plp:-12.5, w: 6.1, ex:'NSE' },
  { symbol:'VTI',       name:'Vanguard Total Market',  qty:15,  avg:220,  ltp:258,   pl:570,    plp: 17.3, w: 4.6, ex:'NYSE' },
  { symbol:'QQQ',       name:'Invesco QQQ Trust',      qty:10,  avg:340,  ltp:420,   pl:800,    plp: 23.5, w: 5.0, ex:'NASDAQ' },
]

export const news = [
  { id:1, title:'RBI Holds Rates at 6.25% in April Policy Meet', source:'Economic Times', time:'2h ago', cat:'Macro',    sentiment:'neutral',  summary:'The Reserve Bank of India maintained the benchmark repo rate at 6.25%, citing inflation control progress.' },
  { id:2, title:'Infosys Q4 Revenue Beats Estimates, Margin Improves', source:'Bloomberg', time:'4h ago', cat:'Earnings',  sentiment:'positive', summary:'Infosys reported Q4 revenue of $4.61B, beating consensus by 1.8%. FY26 guidance raised to 4.5-6.5% growth.' },
  { id:3, title:'HDFC Bank Reports Muted Q4 Loan Growth', source:'Mint', time:'6h ago', cat:'Banking',   sentiment:'negative', summary:'HDFC Bank loan book grew 7.3% YoY, slower than peers, as the bank manages deposit-loan ratio post merger.' },
  { id:4, title:'Nifty 50 Hits New All-Time High, Surpasses 24,500', source:'NSE', time:'8h ago', cat:'Market',   sentiment:'positive', summary:'Nifty 50 touched a fresh record high driven by IT and energy sector outperformance amid positive FII flows.' },
  { id:5, title:'Wipro to Acquire Finnish IT Firm for $150M', source:'Reuters', time:'10h ago', cat:'M&A', sentiment:'positive', summary:'Wipro announced acquisition of a Nordic IT services firm to expand European enterprise client base.' },
  { id:6, title:'TCS Bags $500M Multi-Year Deal from European Bank', source:'Moneycontrol', time:'12h ago', cat:'Earnings', sentiment:'positive', summary:'Tata Consultancy Services signed a 5-year digital transformation contract with a top-5 European bank.' },
  { id:7, title:'FII Net Buyers for 8th Consecutive Session', source:'SEBI Data', time:'1d ago', cat:'Flows', sentiment:'positive', summary:'FIIs bought net Rs 3,240 crore in equities, signalling strong confidence in India growth story.' },
  { id:8, title:'Gold Prices Ease as Dollar Strengthens Post Fed Minutes', source:'Bloomberg', time:'1d ago', cat:'Commodity', sentiment:'negative', summary:'Gold spot dipped 0.8% after Fed minutes revealed officials are in no rush to cut rates further.' },
]
