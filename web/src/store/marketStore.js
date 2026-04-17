import { create } from 'zustand';

const useMarketStore = create((set) => ({
  // ================================
  // STATE
  // ================================

  ticks: [],         // raw tick data
  candles: [],       // OHLC data

  marketStatus: {
    open: false,
    status: 'closed',
    message: 'Market Closed',
  },

  // ================================
  // ACTIONS
  // ================================

  // 🔥 Update ticks (stream)
  updateTicks: (data) => {
    console.log('🧠 STORE UPDATED (ticks):', data);
    set({ ticks: data });
  },

  // 🔥 Update candles (aggregated)
  setCandles: (data) => {
    console.log('📊 STORE UPDATED (candles):', data.length);
    set({ candles: data });
  },

  // 🔥 FIXED: Accept FULL OBJECT
  setMarketStatus: (statusObj) => {
    console.log('📡 MARKET STATUS:', statusObj);
    set({ marketStatus: statusObj });
  },

}));

export default useMarketStore;