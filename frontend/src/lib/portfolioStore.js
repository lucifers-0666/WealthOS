import { HOLDINGS } from './data'

const KEY = 'wealthos:recognized-portfolio'

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
  window.dispatchEvent(new CustomEvent('wealthos:portfolio-updated', { detail: holdings }))
}

export function clearPortfolioHoldings() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(KEY)
  window.dispatchEvent(new CustomEvent('wealthos:portfolio-updated', { detail: HOLDINGS }))
}
