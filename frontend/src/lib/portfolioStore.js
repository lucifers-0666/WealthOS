import { HOLDINGS } from './data'

const KEY = 'arca:recognized-portfolio'

export function getPortfolioHoldings() {
  if (typeof window === 'undefined') return HOLDINGS

  try {
    const raw = window.localStorage.getItem(KEY)
    const parsed = raw ? JSON.parse(raw) : null
    if (Array.isArray(parsed) && parsed.length) return parsed
  } catch {
    window.localStorage.removeItem(KEY)
  }

  return HOLDINGS
}

export function savePortfolioHoldings(holdings) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(KEY, JSON.stringify(holdings))
  window.dispatchEvent(new CustomEvent('arca:portfolio-updated', { detail: holdings }))
}

export function removePortfolioHolding(idOrTicker) {
  if (typeof window === 'undefined') return []
  const next = getPortfolioHoldings().filter((holding) => {
    const id = holding.id ?? holding.holding_id ?? holding.ticker
    return String(id) !== String(idOrTicker) && String(holding.ticker) !== String(idOrTicker)
  })
  window.localStorage.setItem(KEY, JSON.stringify(next))
  window.dispatchEvent(new CustomEvent('arca:portfolio-updated', { detail: next }))
  return next
}

export function upsertPortfolioHolding(holding) {
  if (typeof window === 'undefined') return []
  const current = getPortfolioHoldings()
  const key = String(holding.id ?? holding.holding_id ?? holding.ticker)
  const next = current.filter((item) => String(item.id ?? item.holding_id ?? item.ticker) !== key && String(item.ticker) !== String(holding.ticker))
  next.unshift(holding)
  window.localStorage.setItem(KEY, JSON.stringify(next))
  window.dispatchEvent(new CustomEvent('arca:portfolio-updated', { detail: next }))
  return next
}

export function clearPortfolioHoldings() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(KEY)
  window.dispatchEvent(new CustomEvent('arca:portfolio-updated', { detail: HOLDINGS }))
}
