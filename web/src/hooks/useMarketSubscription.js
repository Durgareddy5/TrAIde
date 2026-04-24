import { useEffect, useMemo } from 'react';
import {
  subscribeMarketData,
  unsubscribeMarketData,
} from '@/services/socket';

const uniq = (items = []) => [...new Set(items.filter(Boolean))];

const useMarketSubscription = ({
  symbols = [],
  keys = [],
  indices = [],
  depthKeys = [],
  enabled = true,
} = {}) => {
  const payload = useMemo(() => ({
    symbols: uniq(symbols),
    keys: uniq(keys),
    indices: uniq(indices),
    depthKeys: uniq(depthKeys),
  }), [symbols, keys, indices, depthKeys]);

  useEffect(() => {
    if (!enabled) return undefined;

    const hasAnything =
      payload.symbols.length ||
      payload.keys.length ||
      payload.indices.length ||
      payload.depthKeys.length;

    if (!hasAnything) return undefined;

    subscribeMarketData(payload);

    return () => {
      unsubscribeMarketData(payload);
    };
  }, [enabled, payload]);
};

export default useMarketSubscription;
