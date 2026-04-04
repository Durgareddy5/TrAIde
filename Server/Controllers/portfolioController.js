// ============================================
// Portfolio Controller
// ============================================
import portfolioService from '../services/portfolioService.js';
import ApiResponse from '../utils/ApiResponse.js';
import logger from '../utils/logger.js';

// ─── GET /portfolio/holdings ───────────────
export const getHoldings = async (req, res) => {
  try {
    const holdings = await portfolioService.getHoldings(req.user.id);
    return ApiResponse.success(res, {
      data: holdings,
      meta: { count: holdings.length },
    });
  } catch (error) {
    logger.error('GetHoldings error:', { error: error.message });
    return ApiResponse.serverError(res);
  }
};

// ─── GET /portfolio/positions ──────────────
export const getPositions = async (req, res) => {
  try {
    const status    = req.query.status || null;
    const positions = await portfolioService.getPositions(req.user.id, status);
    return ApiResponse.success(res, {
      data: positions,
      meta: { count: positions.length },
    });
  } catch (error) {
    logger.error('GetPositions error:', { error: error.message });
    return ApiResponse.serverError(res);
  }
};

// ─── GET /portfolio/summary ────────────────
export const getPortfolioSummary = async (req, res) => {
  try {
    const summary = await portfolioService.getPortfolioSummary(req.user.id);
    return ApiResponse.success(res, { data: summary });
  } catch (error) {
    logger.error('GetPortfolioSummary error:', { error: error.message });
    return ApiResponse.serverError(res);
  }
};

// ─── GET /trades ───────────────────────────
export const getTradeLogs = async (req, res) => {
  try {
    const result = await portfolioService.getTradeLogs(req.user.id, req.query);
    return ApiResponse.success(res, {
      data: result.trades,
      meta: result.pagination,
    });
  } catch (error) {
    logger.error('GetTradeLogs error:', { error: error.message });
    return ApiResponse.serverError(res);
  }
};

export default {
  getHoldings,
  getPositions,
  getPortfolioSummary,
  getTradeLogs,
};