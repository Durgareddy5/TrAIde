// ============================================
// Market Service — Indices, quotes, search
// ============================================
import { StockData, MarketIndex } from '../Models/nosql/index.js';
import { getMarketStatus } from '../utils/helpers.js';
import { MARKET_INDICES, NIFTY_50_STOCKS } from '../utils/constants.js';

// ─── Market status ─────────────────────────
const getStatus = () => getMarketStatus();

// ─── All indices ───────────────────────────
const getAllIndices = async () => {
  try {
    const docs = await MarketIndex.find({}).sort({ symbol: 1 });
    if (docs.length > 0) return docs;
  } catch (_) {}

  // Fallback mock data
  return MARKET_INDICES.map((idx) => ({
    ...idx,
    current_value:  10000 + Math.random() * 30000,
    change:         (Math.random() - 0.5) * 300,
    change_percent: (Math.random() - 0.5) * 2,
    open:  9800 + Math.random() * 29000,
    high:  10200 + Math.random() * 30000,
    low:   9600  + Math.random() * 28000,
    market_status: getMarketStatus().status,
    last_updated:  new Date(),
  }));
};

// ─── Stock search ──────────────────────────
const searchStocks = async (query, limit = 15) => {
  if (!query || query.length < 1) return [];

  try {
    const docs = await StockData.find(
      { $text: { $search: query }, is_active: true },
      { score: { $meta: 'textScore' } }
    )
    .sort({ score: { $meta: 'textScore' } })
    .limit(limit)
    .select('symbol name exchange sector isin quote.price quote.change_percent');

    if (docs.length > 0) return docs;
  } catch (_) {}

  // Fallback: search in NIFTY 50 list
  const q = query.toLowerCase();
  return NIFTY_50_STOCKS
    .filter((s) =>
      s.symbol.toLowerCase().includes(q) ||
      s.name.toLowerCase().includes(q)
    )
    .slice(0, limit)
    .map((s) => ({
      symbol:   s.symbol,
      name:     s.name,
      exchange: 'NSE',
      sector:   s.sector,
      isin:     s.isin,
      price:    1000 + Math.random() * 3000,
      change_percent: (Math.random() - 0.5) * 4,
    }));
};

// ─── Single stock quote ────────────────────
const getStockQuote = async (symbol) => {
  try {
    const doc = await StockData.findOne({ symbol: symbol.toUpperCase() });
    if (doc) return doc;
  } catch (_) {}

  const base  = NIFTY_50_STOCKS.find((s) => s.symbol === symbol.toUpperCase());
  const price = 1000 + Math.random() * 3000;
  const prev  = price * (1 - (Math.random() - 0.5) * 0.03);

  return {
    symbol:   symbol.toUpperCase(),
    name:     base?.name || symbol,
    exchange: 'NSE',
    sector:   base?.sector || 'Equity',
    quote: {
      price,
      previous_close:  +prev.toFixed(2),
      open:            +(price * 0.998).toFixed(2),
      high:            +(price * 1.012).toFixed(2),
      low:             +(price * 0.988).toFixed(2),
      change:          +(price - prev).toFixed(2),
      change_percent:  +((price - prev) / prev * 100).toFixed(2),
      volume:          Math.floor(100000 + Math.random() * 5000000),
      week_52_high:    +(price * 1.35).toFixed(2),
      week_52_low:     +(price * 0.70).toFixed(2),
      upper_circuit:   +(price * 1.20).toFixed(2),
      lower_circuit:   +(price * 0.80).toFixed(2),
      last_updated:    new Date(),
    },
    company_info: {
      market_cap:           Math.floor(price * 100000000),
      market_cap_category:  'large_cap',
      pe_ratio:             +(15 + Math.random() * 25).toFixed(2),
      pb_ratio:             +(1 + Math.random() * 6).toFixed(2),
      eps:                  +(price / (15 + Math.random() * 20)).toFixed(2),
      dividend_yield:       +(Math.random() * 3).toFixed(2),
      face_value:           10,
      lot_size:             1,
    },
  };
};

// ─── Top Gainers ───────────────────────────
const getTopGainers = async (limit = 10) => {
  try {
    return await StockData.find({ 'quote.change_percent': { $gt: 0 } })
      .sort({ 'quote.change_percent': -1 })
      .limit(limit)
      .select('symbol name exchange quote.price quote.change quote.change_percent quote.volume');
  } catch (_) {}

  return NIFTY_50_STOCKS.slice(0, limit).map((s) => ({
    symbol: s.symbol, name: s.name, exchange: 'NSE',
    price: 1000 + Math.random() * 3000,
    change: +(10 + Math.random() * 50).toFixed(2),
    change_percent: +(0.5 + Math.random() * 4).toFixed(2),
    volume: Math.floor(100000 + Math.random() * 5000000),
  }));
};

// ─── Top Losers ────────────────────────────
const getTopLosers = async (limit = 10) => {
  try {
    return await StockData.find({ 'quote.change_percent': { $lt: 0 } })
      .sort({ 'quote.change_percent': 1 })
      .limit(limit)
      .select('symbol name exchange quote.price quote.change quote.change_percent quote.volume');
  } catch (_) {}

  return NIFTY_50_STOCKS.slice(10, 10 + limit).map((s) => ({
    symbol: s.symbol, name: s.name, exchange: 'NSE',
    price: 1000 + Math.random() * 3000,
    change: -(10 + Math.random() * 50).toFixed(2),
    change_percent: -(0.5 + Math.random() * 4).toFixed(2),
    volume: Math.floor(100000 + Math.random() * 5000000),
  }));
};

// ─── Most active ───────────────────────────
const getMostActive = async (limit = 10) => {
  try {
    return await StockData.find({ is_active: true })
      .sort({ 'quote.volume': -1 })
      .limit(limit)
      .select('symbol name exchange quote.price quote.change_percent quote.volume');
  } catch (_) {}

  return NIFTY_50_STOCKS.slice(20, 20 + limit).map((s) => ({
    symbol: s.symbol, name: s.name, exchange: 'NSE',
    price: 1000 + Math.random() * 3000,
    change_percent: (Math.random() - 0.5) * 4,
    volume: Math.floor(1000000 + Math.random() * 20000000),
  }));
};

export { getStatus, getAllIndices, searchStocks, getStockQuote, getTopGainers, getTopLosers, getMostActive };

export default {
  getStatus,
  getAllIndices,
  searchStocks,
  getStockQuote,
  getTopGainers,
  getTopLosers,
  getMostActive,
};