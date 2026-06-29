import { create } from 'zustand';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const getHeaders = () => {
  const token = localStorage.getItem('sb-access-token') || sessionStorage.getItem('sb-access-token') || '';
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

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
        const res = await fetch(`${API_BASE}/api/sandbox/wallet`, { headers: getHeaders() });
        if (res.ok) {
          const data = await res.json();
          set({ wallet: data });
        }
      } catch (e) {
        console.error("Failed to load sandbox wallet", e);
      }
    },
    
    loadHoldings: async () => {
      set({ isLoading: true });
      try {
        const res = await fetch(`${API_BASE}/api/sandbox/holdings`, { headers: getHeaders() });
        if (res.ok) {
          const data = await res.json();
          set({ holdings: data, lastPriceUpdate: new Date().toLocaleTimeString() });
        }
      } catch (e) {
        console.error("Failed to load sandbox holdings", e);
      } finally {
        set({ isLoading: false });
      }
    },

    loadOrders: async () => {
      try {
        const res = await fetch(`${API_BASE}/api/sandbox/orders`, { headers: getHeaders() });
        if (res.ok) {
          const data = await res.json();
          set({ orders: data });
        }
      } catch (e) {
        console.error("Failed to load sandbox orders", e);
      }
    },

    placeEquityOrder: async (ticker, action, quantity) => {
      set({ isLoading: true });
      try {
        const res = await fetch(`${API_BASE}/api/sandbox/order/equity`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({ ticker, action, quantity })
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.detail || "Order failed");
        }
        const data = await res.json();
        await get().actions.loadWallet();
        await get().actions.loadHoldings();
        await get().actions.loadOrders();
        return data;
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
        const res = await fetch(`${API_BASE}/api/sandbox/options/positions`, { headers: getHeaders() });
        if (res.ok) {
          const data = await res.json();
          set({ optionPositions: data });
        }
      } catch (e) {
        console.error("Failed to load option positions", e);
      }
    },
    
    placeOptionOrder: async (params) => {
      set({ isLoading: true });
      try {
        const res = await fetch(`${API_BASE}/api/sandbox/order/option`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(params)
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.detail || "Order failed");
        }
        const data = await res.json();
        await get().actions.loadWallet();
        await get().actions.loadOptionPositions();
        await get().actions.loadOrders();
        return data;
      } finally {
        set({ isLoading: false });
      }
    },
    
    resetSandbox: async () => {
      set({ isLoading: true });
      try {
        const res = await fetch(`${API_BASE}/api/sandbox/wallet/reset`, { method: 'POST', headers: getHeaders() });
        if (res.ok) {
          await get().actions.loadWallet();
          await get().actions.loadHoldings();
          await get().actions.loadOptionPositions();
          await get().actions.loadOrders();
        }
      } catch (e) {
        console.error("Failed to reset sandbox", e);
      } finally {
        set({ isLoading: false });
      }
    }
  }
}));
