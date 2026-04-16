import api from './api';

const tradingService = {
  // Orders
  placeOrder: (data) => api.post('/orders', data),
  getOrders: (params) => api.get('/orders', { params }),
  getOrderById: (id) => api.get(`/orders/${id}`),
  cancelOrder: (id) => api.put(`/orders/${id}/cancel`),
  modifyOrder: (id, data) => api.put(`/orders/${id}`, data),

  // Holdings
  getHoldings: () => api.get('/portfolio/holdings'),

  // Positions
  getPositions: () => api.get('/portfolio/positions'),

  // Portfolio Summary
  getPortfolioSummary: () => api.get('/portfolio/summary'),

  // Trade Logs
  getTradeLogs: (params) => api.get('/trades', { params }),

  // Funds
  getFunds: () => api.get('/funds'),
  addFunds: (amount) => api.post('/funds/deposit', { amount }),
  withdrawFunds: (amount) => api.post('/funds/withdraw', { amount }),
  getFundTransactions: (params) => api.get('/funds/transactions', { params }),

  // Watchlists
  getWatchlists: () => api.get('/watchlists'),
  createWatchlist: (data) => api.post('/watchlists', data),
  deleteWatchlist: (id) => api.delete(`/watchlists/${id}`),
  addToWatchlist: (watchlistId, data) => api.post(`/watchlists/${watchlistId}/items`, data),
  removeFromWatchlist: (watchlistId, itemId) => api.delete(`/watchlists/${watchlistId}/items/${itemId}`),

  // Stock Search
  searchStocks: (query) => api.get('/stocks/search', { params: { q: query } }),
  getStockQuote: (symbol) => api.get(`/stocks/${symbol}/quote`),
  getStockDetails: (symbol) => api.get(`/stocks/${symbol}`),

  // Market Data
  getMarketIndices: () => api.get('/market/indices'),
  getMarketStatus: () => api.get('/market/status'),
  getTopGainers: () => api.get('/market/top-gainers'),
  getTopLosers: () => api.get('/market/top-losers'),
  getMostActive: () => api.get('/market/most-active'),


  // Alerts
  getAlerts: () => api.get('/alerts'),
  createAlert: (data) => api.post('/alerts', data),
  deleteAlert: (id) => api.delete(`/alerts/${id}`),
  toggleAlert: (id) => api.put(`/alerts/${id}/toggle`),
};

export default tradingService;