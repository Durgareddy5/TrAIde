import { getMarketStatus } from '../utils/helpers.js';
import instrumentService from './kotakInstrumentService.js';
import quoteService from './kotakQuoteService.js';

const DEFAULT_INDEXES = [
  { exchangeSegment: 'nse_cm', query: 'Nifty 50', symbol: 'NIFTY 50' },
  { exchangeSegment: 'nse_cm', query: 'Nifty Bank', symbol: 'NIFTY BANK' },
  { exchangeSegment: 'bse_cm', query: 'SENSEX', symbol: 'SENSEX' },
  { exchangeSegment: 'bse_cm', query: 'BANKEX', symbol: 'BANKEX' },
  { exchangeSegment: 'bse_cm', query: 'SENSEX50', symbol: 'SENSEX50' },

  { exchangeSegment: 'nse_cm', query: 'Nifty IT', symbol: 'NIFTY IT' },
  { exchangeSegment: 'nse_cm', query: 'Nifty Pharma', symbol: 'NIFTY PHARMA' },
  { exchangeSegment: 'nse_cm', query: 'Nifty Auto', symbol: 'NIFTY AUTO' },
  { exchangeSegment: 'nse_cm', query: 'Nifty FMCG', symbol: 'NIFTY FMCG' },
  { exchangeSegment: 'nse_cm', query: 'Nifty Metal', symbol: 'NIFTY METAL' },
  { exchangeSegment: 'nse_cm', query: 'Nifty Realty', symbol: 'NIFTY REALTY' },
  { exchangeSegment: 'nse_cm', query: 'India VIX', symbol: 'INDIA VIX' },
  { exchangeSegment: 'nse_cm', query: 'Nifty PSU Bank', symbol: 'NIFTY PSU BANK' },
  { exchangeSegment: 'nse_cm', query: 'Nifty Midcap 50', symbol: 'NIFTY MIDCAP 50' },
  { exchangeSegment: 'nse_cm', query: 'Nifty Next 50', symbol: 'NIFTY NEXT 50' },
  { exchangeSegment: 'nse_cm', query: 'Nifty Smallcap 100', symbol: 'NIFTY SMALLCAP 100' },
  { exchangeSegment: 'nse_cm', query: 'Nifty Financial Services', symbol: 'NIFTY FIN SERVICE' },
  { exchangeSegment: 'nse_cm', query: 'Nifty Healthcare', symbol: 'NIFTY HEALTHCARE' },
  { exchangeSegment: 'nse_cm', query: 'Nifty Consumer Durables', symbol: 'NIFTY CONSUMER DURABLES' },
  { exchangeSegment: 'nse_cm', query: 'Nifty Oil & Gas', symbol: 'NIFTY OIL & GAS' },
];



const getStatus = () => getMarketStatus();

const toIsoTime = (quote) => {
  const ts = Number(quote?.lstup_time || 0);
  return ts > 0 ? new Date(ts * 1000).toISOString() : new Date().toISOString();
};

const getAllIndices = async () => {
  const indexLikeInstruments = DEFAULT_INDEXES.map((item) => ({
    exchangeSegment: item.exchangeSegment,
    exchangeIdentifier: item.query,
    symbol: item.symbol,
    displaySymbol: item.symbol,
    tradingSymbol: item.symbol,
    instrumentName: item.symbol,
  }));

  const quotes = await quoteService.getQuotes({
    instruments: indexLikeInstruments,
    filter: 'all',
  });

  return quotes.map((quote) => ({
    symbol: quote.display_symbol || quote.exchange_token,
    name: quote.display_symbol || quote.exchange_token,
    exchange: quote.exchange,
    current_value: Number(quote.ltp || 0),
    change: Number(quote.change || 0),
    change_percent: Number(quote.per_change || 0),
    open: Number(quote?.ohlc?.open || 0),
    high: Number(quote?.ohlc?.high || 0),
    low: Number(quote?.ohlc?.low || 0),
    previous_close: Number(quote?.ohlc?.close || 0),
    volume: Number(quote.last_volume || 0),
    market_status: getMarketStatus().status,
    last_updated: toIsoTime(quote),
  }));
};



const searchStocks = async (query, limit = 15, exchangeSegment) => {
  const results = await instrumentService.searchInstruments({
    query,
    exchangeSegment,
    limit,
  });

  return results.map((item) => ({
    symbol: item.symbol,
    name: item.instrumentName,
    exchange: item.exchangeSegment,
    display_symbol: item.displaySymbol,
    trading_symbol: item.tradingSymbol,
    exchange_identifier: item.exchangeIdentifier,
    lot_size: item.lotSize,
  }));
};

const getStockQuote = async (symbol) => {
  const { instrument, quote } = await quoteService.getQuoteBySymbol(symbol, 'all');

  if (!quote) {
    throw new Error(`No quote found for symbol: ${symbol}`);
  }

  return {
    symbol: instrument.symbol,
    name: instrument.instrumentName,
    exchange: instrument.exchangeSegment,
    exchange_identifier: instrument.exchangeIdentifier,
    display_symbol: instrument.displaySymbol,
    trading_symbol: instrument.tradingSymbol,
    quote: {
      price: Number(quote.ltp || 0),
      previous_close: Number(quote?.ohlc?.close || 0),
      open: Number(quote?.ohlc?.open || 0),
      high: Number(quote?.ohlc?.high || 0),
      low: Number(quote?.ohlc?.low || 0),
      change: Number(quote.change || 0),
      change_percent: Number(quote.per_change || 0),
      volume: Number(quote.last_volume || 0),
      last_traded_quantity: Number(quote.last_traded_quantity || 0),
      total_buy: Number(quote.total_buy || 0),
      total_sell: Number(quote.total_sell || 0),
      week_52_high: Number(quote.year_high || 0),
      week_52_low: Number(quote.year_low || 0),
      last_updated: toIsoTime(quote),
    },
    market_depth: quote.depth || null,
    company_info: {
      lot_size: instrument.lotSize,
    },
  };
};

const sortByField = (quotes, field, direction = 'desc', limit = 10) => {
  const sorted = [...quotes].sort((a, b) => {
    const av = Number(a[field] || 0);
    const bv = Number(b[field] || 0);
    return direction === 'desc' ? bv - av : av - bv;
  });

  return sorted.slice(0, limit);
};

const toMoverShape = (quote) => ({
  symbol: quote.display_symbol || quote.exchange_token,
  name: quote.display_symbol || quote.exchange_token,
  exchange: quote.exchange,
  price: Number(quote.ltp || 0),
  change: Number(quote.change || 0),
  change_percent: Number(quote.per_change || 0),
  volume: Number(quote.last_volume || 0),
});

const getTopGainers = async (limit = 10) => {
  const quotes = await quoteService.getQuotesForUniverse({ limit: 50, filter: 'all' });
  return sortByField(quotes, 'per_change', 'desc', limit).map(toMoverShape);
};

const getTopLosers = async (limit = 10) => {
  const quotes = await quoteService.getQuotesForUniverse({ limit: 50, filter: 'all' });
  return sortByField(quotes, 'per_change', 'asc', limit).map(toMoverShape);
};

const getMostActive = async (limit = 10) => {
  const quotes = await quoteService.getQuotesForUniverse({ limit: 50, filter: 'all' });
  return sortByField(quotes, 'last_volume', 'desc', limit).map(toMoverShape);
};

const refreshInstrumentMaster = async () => {
  const instruments = await instrumentService.refreshScripMaster();
  return {
    count: instruments.length,
    loaded_at: new Date().toISOString(),
  };
};

const getInstrumentMasterStats = async () => {
  const count = await instrumentService.getInstrumentCount();
  return {
    count,
    status: count > 0 ? 'ready' : 'empty',
  };
};

export {
  getStatus,
  getAllIndices,
  searchStocks,
  getStockQuote,
  getTopGainers,
  getTopLosers,
  getMostActive,
  refreshInstrumentMaster,
  getInstrumentMasterStats,
};

export default {
  getStatus,
  getAllIndices,
  searchStocks,
  getStockQuote,
  getTopGainers,
  getTopLosers,
  getMostActive,
  refreshInstrumentMaster,
  getInstrumentMasterStats,
};
