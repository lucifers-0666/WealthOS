import { request } from './api.js';

export async function getSandboxWallet() {
  return request('GET', '/api/sandbox/wallet');
}

export async function resetSandboxWallet() {
  return request('POST', '/api/sandbox/wallet/reset');
}

export async function getSandboxHoldings() {
  return request('GET', '/api/sandbox/holdings');
}

export async function placeSandboxEquityOrder(order) {
  return request('POST', '/api/sandbox/order/equity', order);
}

export async function getSandboxOrders() {
  return request('GET', '/api/sandbox/orders');
}

export async function getSandboxOptionsChain(underlying, expiry) {
  return request('GET', `/api/sandbox/options/chain?underlying=${underlying}&expiry=${expiry}`);
}

export async function placeSandboxOptionOrder(order) {
  return request('POST', '/api/sandbox/order/option', order);
}

export async function getSandboxOptionPositions() {
  return request('GET', '/api/sandbox/options/positions');
}

export async function getSandboxFuturesContracts() {
  return request('GET', '/api/sandbox/futures/contracts');
}

export async function placeSandboxFutureOrder(order) {
  return request('POST', '/api/sandbox/order/future', order);
}

export async function getSandboxFuturesPositions() {
  return request('GET', '/api/sandbox/futures/positions');
}

export async function getSandboxPrice(ticker) {
  return request('GET', `/api/sandbox/price?ticker=${ticker}`);
}

export async function getSandboxLeaderboard() {
  return request('GET', '/api/sandbox/leaderboard');
}

export async function getSandboxStrategies() {
  return request('GET', '/api/sandbox/strategies');
}

export async function runSandboxBacktest(strategyName, symbol, parameters) {
  return request('POST', '/api/sandbox/strategies/backtest', {
    strategy_name: strategyName,
    symbol,
    parameters
  });
}

export async function closeSandboxPosition(tradeId) {
  return request('POST', `/api/sandbox/trade/close/${tradeId}`);
}
