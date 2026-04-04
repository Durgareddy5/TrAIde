// Zustand Store for Market Data
import { create } from 'zustand';

const useMarketStore = create((set, get) => ({
  // Market Indices
  indices: [],
  indicesLoading: true,

  // Selected Stock
  selectedStock: null,

  // Market Status
  marketStatus: {
    status: 'closed',
    message: 'Market Closed',
  },

  // Watchlist
  watchlists: [],
  activeWatchlist: null,

  // Search
  searchResults: [],
  searchLoading: false,

  // Actions
  setIndices: (indices) => set({ indices, indicesLoading: false }),
  setSelectedStock: (stock) => set({ selectedStock: stock }),
  setMarketStatus: (status) => set({ marketStatus: status }),
  setWatchlists: (watchlists) => set({ watchlists }),
  setActiveWatchlist: (watchlist) => set({ activeWatchlist: watchlist }),
  setSearchResults: (results) => set({ searchResults: results }),
  setSearchLoading: (loading) => set({ searchLoading: loading }),

  // Update single index
  updateIndex: (symbol, data) =>
    set((state) => ({
      indices: state.indices.map((idx) =>
        idx.symbol === symbol ? { ...idx, ...data } : idx
      ),
    })),
}));

export default useMarketStore;