// ============================================
// Market Controller
// ============================================
import marketService from '../services/marketService.js';
import ApiResponse from '../utils/ApiResponse.js';
import logger from '../utils/logger.js';

export const getMarketStatus = async (req, res) => {
  try {
    return ApiResponse.success(res, { data: marketService.getStatus() });
  } catch (error) {
    logger.error('GetMarketStatus error:', { error: error.message });
    return ApiResponse.serverError(res, error.message);
  }
};

export const getAllIndices = async (req, res) => {
  try {
    const indices = await marketService.getAllIndices();
    return ApiResponse.success(res, {
      data: indices,
      meta: {
        count: indices.length,
        market_status: marketService.getStatus(),
      },
    });
  } catch (error) {
    logger.error('GetAllIndices error:', { error: error.message });
    return ApiResponse.serverError(res, error.message);
  }
};

export const searchStocks = async (req, res) => {
  try {
    const { q, limit, exchange } = req.query;

    if (!q || q.trim().length < 1) {
      return ApiResponse.badRequest(res, 'Search query is required');
    }

    const results = await marketService.searchStocks(
      q.trim(),
      Number.parseInt(limit, 10) || 15,
      exchange || undefined
    );

    return ApiResponse.success(res, {
      data: results,
      meta: {
        query: q,
        exchange: exchange || 'all',
        count: results.length,
      },
    });
  } catch (error) {
    logger.error('SearchStocks error:', { error: error.message });
    return ApiResponse.serverError(res, error.message);
  }
};

export const getStockQuote = async (req, res) => {
  try {
    const { symbol } = req.params;
    const quote = await marketService.getStockQuote(symbol);
    return ApiResponse.success(res, { data: quote });
  } catch (error) {
    logger.error('GetStockQuote error:', { error: error.message });
    return ApiResponse.notFound(res, error.message);
  }
};

export const getStockDetails = async (req, res) => {
  try {
    const { symbol } = req.params;
    const data = await marketService.getStockQuote(symbol);
    return ApiResponse.success(res, { data });
  } catch (error) {
    logger.error('GetStockDetails error:', { error: error.message });
    return ApiResponse.notFound(res, error.message);
  }
};

export const getTopGainers = async (req, res) => {
  try {
    const data = await marketService.getTopGainers(
      Number.parseInt(req.query.limit, 10) || 10
    );
    return ApiResponse.success(res, { data });
  } catch (error) {
    logger.error('GetTopGainers error:', { error: error.message });
    return ApiResponse.serverError(res, error.message);
  }
};

export const getTopLosers = async (req, res) => {
  try {
    const data = await marketService.getTopLosers(
      Number.parseInt(req.query.limit, 10) || 10
    );
    return ApiResponse.success(res, { data });
  } catch (error) {
    logger.error('GetTopLosers error:', { error: error.message });
    return ApiResponse.serverError(res, error.message);
  }
};

export const getMostActive = async (req, res) => {
  try {
    const data = await marketService.getMostActive(
      Number.parseInt(req.query.limit, 10) || 10
    );
    return ApiResponse.success(res, { data });
  } catch (error) {
    logger.error('GetMostActive error:', { error: error.message });
    return ApiResponse.serverError(res, error.message);
  }
};

export const refreshInstrumentMaster = async (req, res) => {
  try {
    const result = await marketService.refreshInstrumentMaster();
    return ApiResponse.success(res, {
      data: result,
      message: 'Instrument master refreshed successfully',
    });
  } catch (error) {
    logger.error('RefreshInstrumentMaster error:', { error: error.message });
    return ApiResponse.serverError(res, error.message);
  }
};

export const getInstrumentMasterStats = async (req, res) => {
  try {
    const result = await marketService.getInstrumentMasterStats();
    return ApiResponse.success(res, { data: result });
  } catch (error) {
    logger.error('GetInstrumentMasterStats error:', { error: error.message });
    return ApiResponse.serverError(res, error.message);
  }
};

export default {
  getMarketStatus,
  getAllIndices,
  searchStocks,
  getStockQuote,
  getStockDetails,
  getTopGainers,
  getTopLosers,
  getMostActive,
  refreshInstrumentMaster,
  getInstrumentMasterStats,
};
