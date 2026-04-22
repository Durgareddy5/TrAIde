import { create } from 'zustand';

const useMarketStore = create((set) => ({
  ticks: [],
  ticksByKey: {},
  prices: {},
  depthByKey: {},
  candlesByKey: {},

  marketStatus: {
    open: false,
    status: 'closed',
    message: 'Market Closed',
  },

  updateTick: (tick) => {
    if (!tick?.key) return;

    set((state) => {
      const ticksByKey = {
        ...state.ticksByKey,
        [tick.key]: tick,
      };

      const prices = {
        ...state.prices,
        [tick.key]: {
          symbol: tick.symbol,
          displaySymbol: tick.displaySymbol || tick.symbol,
          price: tick.price,
          change: tick.change ?? 0,
          changePercent: tick.changePercent ?? 0,
          timestamp: tick.timestamp,
        },
      };

      return {
        ticksByKey,
        prices,
        ticks: Object.values(ticksByKey),
      };
    });
  },

  updateTicks: (ticks) => {
    if (!Array.isArray(ticks) || ticks.length === 0) return;

    set((state) => {
      const ticksByKey = { ...state.ticksByKey };
      const prices = { ...state.prices };

      ticks.forEach((tick) => {
        if (!tick?.key) return;

        ticksByKey[tick.key] = tick;
        prices[tick.key] = {
          symbol: tick.symbol,
          displaySymbol: tick.displaySymbol || tick.symbol,
          price: tick.price,
          change: tick.change ?? 0,
          changePercent: tick.changePercent ?? 0,
          timestamp: tick.timestamp,
        };
      });

      return {
        ticksByKey,
        prices,
        ticks: Object.values(ticksByKey),
      };
    });
  },

  updateDepth: (depth) => {
    if (!depth?.key) return;

    set((state) => ({
      depthByKey: {
        ...state.depthByKey,
        [depth.key]: depth,
      },
    }));
  },

  setCandlesForKey: (key, candles) => {
    if (!key) return;

    set((state) => ({
      candlesByKey: {
        ...state.candlesByKey,
        [key]: candles,
      },
    }));
  },

  setMarketStatus: (statusObj) => {
    set({
      marketStatus: {
        open: Boolean(statusObj?.connected),
        status: statusObj?.status || 'closed',
        message: statusObj?.message || 'Market Closed',
        ...statusObj,
      },
    });
  },

  resetMarketData: () => {
    set({
      ticks: [],
      ticksByKey: {},
      prices: {},
      depthByKey: {},
      candlesByKey: {},
      marketStatus: {
        open: false,
        status: 'closed',
        message: 'Market Closed',
      },
    });
  },
}));

export default useMarketStore;
