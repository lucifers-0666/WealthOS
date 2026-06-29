import { create } from 'zustand';

import {
  getSandboxWallet,
  getSandboxHoldings,
  getSandboxOrders,
  getSandboxOptionPositions,
  placeSandboxEquityOrder,
  placeSandboxOptionOrder,
  resetSandboxWallet
} from '../services/sandbox.js';

export const useSandboxStore = create((set, get) => ({
  wallet: { balance: 0, initial_balance: 500000, portfolio_value: 0, total_pnl: 0, total_pnl_percent: 0 },
  holdings: [],
  orders: [],
  optionPositions: [],
  selectedTicker: null,
  selectedContract: null,
  activeTab: 'equity', // "equity" | "options" | "futures"
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
        const res = await fetch(`${API_BASE}/api/sandbox/options/chain?underlying=${underlying}&expiry=${expiry}`, { headers: getHeaders() });
        if (res.ok) {
          return await res.json();
        }
        return [];
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
    
    resetSandbox: async () => {
      set({ isLoading: true });
      try {
        await resetSandboxWallet();
        await get().actions.loadWallet();
        await get().actions.loadHoldings();
        await get().actions.loadOptionPositions();
        await get().actions.loadOrders();
      } catch (e) {
        console.error("Failed to reset sandbox", e);
      } finally {
        set({ isLoading: false });
      }
    }
  }
}));
