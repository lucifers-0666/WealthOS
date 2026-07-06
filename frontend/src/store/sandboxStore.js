import { create } from 'zustand';

import {
  getSandboxWallet,
  getSandboxHoldings,
  getSandboxOrders,
  getSandboxOptionPositions,
  placeSandboxEquityOrder,
  placeSandboxOptionOrder,
  resetSandboxWallet,
  getSandboxOptionsChain,
  getSandboxFuturesContracts,
  placeSandboxFutureOrder,
  getSandboxFuturesPositions,
  getSandboxLeaderboard,
  getSandboxStrategies,
  runSandboxBacktest,
  closeSandboxPosition
} from '../services/sandbox.js';

export const useSandboxStore = create((set, get) => ({
  wallet: { balance: 0, initial_balance: 1000000, portfolio_value: 0, total_pnl: 0, total_pnl_percent: 0, realized_pnl: 0, blocked_margin: 0 },
  holdings: [],
  orders: [],
  optionPositions: [],
  futuresPositions: [],
  futuresContracts: [],
  leaderboard: [],
  strategies: [],
  backtestResults: null,
  selectedTicker: null,
  selectedContract: null,
  activeTab: 'equity', // "equity" | "options" | "futures" | "strategies" | "leaderboard"
  isLoading: false,
  lastPriceUpdate: null,
  
  setActiveTab: (tab) => set({ activeTab: tab }),
  setSelectedTicker: (ticker) => set({ selectedTicker: ticker }),
  setSelectedContract: (contract) => set({ selectedContract: contract }),

  actions: {
    loadWallet: async () => {
      try {
        const data = await getSandboxWallet();
        set({ wallet: data });
      } catch (e) {
        console.error("Failed to load sandbox wallet", e);
      }
    },
    
    loadHoldings: async () => {
      set({ isLoading: true });
      try {
        const data = await getSandboxHoldings();
        set({ holdings: data, lastPriceUpdate: new Date().toLocaleTimeString() });
      } catch (e) {
        console.error("Failed to load sandbox holdings", e);
      } finally {
        set({ isLoading: false });
      }
    },

    loadOrders: async () => {
      try {
        const data = await getSandboxOrders();
        set({ orders: data });
      } catch (e) {
        console.error("Failed to load sandbox orders", e);
      }
    },

    placeEquityOrder: async (ticker, action, quantity) => {
      set({ isLoading: true });
      try {
        const data = await placeSandboxEquityOrder({ ticker, action, quantity });
        await get().actions.loadWallet();
        await get().actions.loadHoldings();
        await get().actions.loadOrders();
        return data;
      } catch (err) {
        throw new Error(err.message || "Order failed");
      } finally {
        set({ isLoading: false });
      }
    },
    
    loadOptionChain: async (underlying, expiry) => {
      set({ isLoading: true });
      try {
        const data = await getSandboxOptionsChain(underlying, expiry);
        return data || [];
      } catch (e) {
        console.error("Failed to load options chain", e);
        return [];
      } finally {
        set({ isLoading: false });
      }
    },

    loadOptionPositions: async () => {
      try {
        const data = await getSandboxOptionPositions();
        set({ optionPositions: data });
      } catch (e) {
        console.error("Failed to load option positions", e);
      }
    },
    
    placeOptionOrder: async (params) => {
      set({ isLoading: true });
      try {
        const data = await placeSandboxOptionOrder(params);
        await get().actions.loadWallet();
        await get().actions.loadOptionPositions();
        await get().actions.loadOrders();
        return data;
      } catch (err) {
        throw new Error(err.message || "Order failed");
      } finally {
        set({ isLoading: false });
      }
    },

    loadFuturesPositions: async () => {
      try {
        const data = await getSandboxFuturesPositions();
        set({ futuresPositions: data });
      } catch (e) {
        console.error("Failed to load futures positions", e);
      }
    },

    loadFuturesContracts: async () => {
      try {
        const data = await getSandboxFuturesContracts();
        set({ futuresContracts: data });
      } catch (e) {
        console.error("Failed to load futures contracts", e);
      }
    },

    placeFutureOrder: async (params) => {
      set({ isLoading: true });
      try {
        const data = await placeSandboxFutureOrder(params);
        await get().actions.loadWallet();
        await get().actions.loadFuturesPositions();
        await get().actions.loadOrders();
        return data;
      } catch (err) {
        throw new Error(err.message || "Order failed");
      } finally {
        set({ isLoading: false });
      }
    },
    
    resetSandbox: async () => {
      set({ isLoading: true });
      try {
        await resetSandboxWallet();
        await get().actions.loadWallet();
        await get().actions.loadHoldings();
        await get().actions.loadOptionPositions();
        await get().actions.loadFuturesPositions();
        await get().actions.loadOrders();
      } catch (e) {
        console.error("Failed to reset sandbox", e);
      } finally {
        set({ isLoading: false });
      }
    },

    loadLeaderboard: async () => {
      try {
        const data = await getSandboxLeaderboard();
        set({ leaderboard: data });
      } catch (e) {
        console.error("Failed to load leaderboard", e);
      }
    },

    loadStrategies: async () => {
      try {
        const data = await getSandboxStrategies();
        set({ strategies: data });
      } catch (e) {
        console.error("Failed to load strategies", e);
      }
    },

    runBacktest: async (strategyName, symbol, parameters) => {
      set({ isLoading: true });
      try {
        const data = await runSandboxBacktest(strategyName, symbol, parameters);
        set({ backtestResults: data });
        return data;
      } catch (e) {
        console.error("Backtest failed", e);
        throw e;
      } finally {
        set({ isLoading: false });
      }
    },

    closePosition: async (tradeId, type) => {
      set({ isLoading: true });
      try {
        const data = await closeSandboxPosition(tradeId);
        await get().actions.loadWallet();
        if (type === 'equity') await get().actions.loadHoldings();
        if (type === 'option') await get().actions.loadOptionPositions();
        if (type === 'future') await get().actions.loadFuturesPositions();
        await get().actions.loadOrders();
        return data;
      } catch (e) {
        console.error("Close position failed", e);
        throw e;
      } finally {
        set({ isLoading: false });
      }
    }
  }
}));
