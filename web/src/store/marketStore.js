import { create } from 'zustand';

const useMarketStore = create((set) => ({
  prices: {},
  marketOpen: false,

  updateTicks: (ticks) =>
    set((state) => {
      const updated = { ...state.prices };

      ticks.forEach((t) => {
        updated[t.symbol] = t;
      });

      return { prices: updated };
    }),

  setMarketStatus: (status) =>
    set({ marketOpen: status }),
}));

export default useMarketStore;