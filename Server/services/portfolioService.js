// ============================================
// Portfolio Service — Holdings, Positions, P&L
// ============================================
import { Holding, Position, TradeLog, Fund } from '../Models/sql/index.js';
import { Op } from 'sequelize';
import { getStockPrice } from './orderService.js';
import logger from '../utils/logger.js';

// ─── Get all holdings with live P&L ───────
const getHoldings = async (userId) => {
  const holdings = await Holding.findAll({
    where:   { user_id: userId, quantity: { [Op.gt]: 0 } },
    order:   [['current_value', 'DESC']],
  });

  // Update current prices and P&L
  const updated = await Promise.all(
    holdings.map(async (h) => {
      try {
        const livePrice = await getStockPrice(h.symbol);
        const currValue = +(h.quantity * livePrice).toFixed(2);
        const pnl       = +(currValue - +h.total_invested).toFixed(2);
        const pnlPct    = +h.total_invested > 0
          ? +((pnl / +h.total_invested) * 100).toFixed(4)
          : 0;

        await h.update({
          current_price:     livePrice,
          current_value:     currValue,
          pnl,
          pnl_percentage:    pnlPct,
        });
        return h;
      } catch (_) { return h; }
    })
  );

  return updated;
};

// ─── Portfolio Summary ─────────────────────
const getPortfolioSummary = async (userId) => {
  const [holdings, fund, positions] = await Promise.all([
    Holding.findAll({
      where: { user_id: userId, quantity: { [Op.gt]: 0 } },
    }),
    Fund.findOne({ where: { user_id: userId } }),
    Position.findAll({ where: { user_id: userId, status: 'open' } }),
  ]);

  const totalInvested    = holdings.reduce((s, h) => s + +h.total_invested, 0);
  const totalCurrentVal  = holdings.reduce((s, h) => s + +h.current_value,  0);
  const totalPnL         = totalCurrentVal - totalInvested;
  const totalPnLPct      = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;
  const dayChange        = holdings.reduce((s, h) => s + +h.day_change, 0);
  const unrealizedPos    = positions.reduce((s, p) => s + +p.unrealized_pnl, 0);

  return {
    total_invested:           +totalInvested.toFixed(2),
    current_value:            +totalCurrentVal.toFixed(2),
    total_pnl:                +totalPnL.toFixed(2),
    total_pnl_percentage:     +totalPnLPct.toFixed(4),
    day_change:               +dayChange.toFixed(2),
    day_change_percentage:    totalInvested > 0
      ? +((dayChange / totalInvested) * 100).toFixed(4) : 0,
    available_balance:        fund ? +fund.available_balance : 0,
    total_balance:            fund ? +fund.total_balance     : 0,
    used_margin:              fund ? +fund.used_margin       : 0,
    realized_pnl:             fund ? +fund.realized_pnl      : 0,
    unrealized_pnl_positions: +unrealizedPos.toFixed(2),
    open_positions_count:     positions.length,
    holdings_count:           holdings.length,
  };
};

// ─── Get positions ─────────────────────────
const getPositions = async (userId, status = null) => {
  const where = { user_id: userId };
  if (status) where.status = status;

  const positions = await Position.findAll({
    where,
    order: [['opened_at', 'DESC']],
  });

  // Update unrealized P&L
  const updated = await Promise.all(
    positions.map(async (p) => {
      try {
        const livePrice     = await getStockPrice(p.symbol);
        let unrealized      = 0;

        if (p.net_quantity > 0) {
          unrealized = (livePrice - +p.buy_average_price) * p.net_quantity;
        } else if (p.net_quantity < 0) {
          unrealized = (+p.sell_average_price - livePrice) * Math.abs(p.net_quantity);
        }

        await p.update({
          current_price:    livePrice,
          unrealized_pnl:   +unrealized.toFixed(2),
          total_pnl:        +(+p.realized_pnl + unrealized).toFixed(2),
        });
        return p;
      } catch (_) { return p; }
    })
  );

  return updated;
};

// ─── Trade logs ────────────────────────────
const getTradeLogs = async (userId, filters = {}) => {
  const where  = { user_id: userId };
  const page   = parseInt(filters.page,  10) || 1;
  const limit  = Math.min(parseInt(filters.limit, 10) || 20, 100);
  const offset = (page - 1) * limit;

  if (filters.symbol) where.symbol = filters.symbol.toUpperCase();
  if (filters.type)   where.transaction_type = filters.type;

  const { count, rows } = await TradeLog.findAndCountAll({
    where,
    order:   [['executed_at', 'DESC']],
    limit,
    offset,
  });

  return {
    trades: rows,
    pagination: {
      total:       count,
      page,
      limit,
      total_pages: Math.ceil(count / limit),
    },
  };
};

export { getHoldings, getPortfolioSummary, getPositions, getTradeLogs };

export default {
  getHoldings,
  getPortfolioSummary,
  getPositions,
  getTradeLogs,
};