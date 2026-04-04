import { create } from 'zustand';

const useMarketStore = create((set) => ({
  // Market Status
  marketStatus: {
    status: 'closed',
    message: 'Market is Closed',
  },
  setMarketStatus: (status) => set({ marketStatus: status }),

  // Selected Stock (for detail page / order form)
  selectedStock: null,
  setSelectedStock: (stock) => set({ selectedStock: stock }),

  // Market Indices
  indices: [],
  setIndices: (indices) => set({ indices }),

  // Global Search
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),
  isSearchOpen: false,
  setSearchOpen: (open) => set({ isSearchOpen: open }),
}));

export default useMarketStore;