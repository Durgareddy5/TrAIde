import { create } from 'zustand';

const useMarketStore = create((set) => ({
  // ✅ MUST HAVE DEFAULT VALUES
  ticks: [],

  marketStatus: {
    open: false,
    status: 'closed',
    message: 'Market Closed',
  },

  // ✅ UPDATE TICKS
  updateTicks: (data) => {
    console.log('🧠 STORE UPDATED:', data);
    set({ ticks: data });
  },

  // ✅ UPDATE STATUS
  setMarketStatus: (status) => {
    set({ marketStatus: status });
  },
}));

export default useMarketStore;