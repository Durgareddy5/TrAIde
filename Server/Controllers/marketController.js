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
    return ApiResponse.serverError(res);
  }
};

export const getAllIndices = async (req, res) => {
  try {
    const indices = await marketService.getAllIndices();
    return ApiResponse.success(res, {
      data: indices,
      meta: { count: indices.length, market_status: marketService.getStatus() },
    });
  } catch (error) {
    logger.error('GetAllIndices error:', { error: error.message });
    return ApiResponse.serverError(res);
  }
};

export const searchStocks = async (req, res) => {
  try {
    const { q, limit } = req.query;
    if (!q || q.trim().length < 1) {
      return ApiResponse.badRequest(res, 'Search query is required');
    }
    const results = await marketService.searchStocks(q.trim(), parseInt(limit, 10) || 15);
    return ApiResponse.success(res, {
      data: results,
      meta: { query: q, count: results.length },
    });
  } catch (error) {
    return ApiResponse.serverError(res);
  }
};

export const getStockQuote = async (req, res) => {
  try {
    const { symbol } = req.params;
    const quote = await marketService.getStockQuote(symbol);
    return ApiResponse.success(res, { data: quote });
  } catch (error) {
    return ApiResponse.serverError(res);
  }
};

export const getStockDetails = async (req, res) => {
  try {
    const { symbol } = req.params;
    const data = await marketService.getStockQuote(symbol);
    return ApiResponse.success(res, { data });
  } catch (error) {
    return ApiResponse.serverError(res);
  }
};

export const getTopGainers = async (req, res) => {
  try {
    const data = await marketService.getTopGainers(parseInt(req.query.limit, 10) || 10);
    return ApiResponse.success(res, { data });
  } catch (error) {
    return ApiResponse.serverError(res);
  }
};

export const getTopLosers = async (req, res) => {
  try {
    const data = await marketService.getTopLosers(parseInt(req.query.limit, 10) || 10);
    return ApiResponse.success(res, { data });
  } catch (error) {
    return ApiResponse.serverError(res);
  }
};

export const getMostActive = async (req, res) => {
  try {
    const data = await marketService.getMostActive(parseInt(req.query.limit, 10) || 10);
    return ApiResponse.success(res, { data });
  } catch (error) {
    return ApiResponse.serverError(res);
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
};