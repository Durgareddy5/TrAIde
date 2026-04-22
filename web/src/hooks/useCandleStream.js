import { useEffect, useRef } from 'react';
import useMarketStore from '@/store/marketStore';
import { OHLCAggregator } from '@/utils/ohlcAggregator';

const useCandleStream = (marketKey) => {
  const tick = useMarketStore((s) => (marketKey ? s.ticksByKey[marketKey] : null));
  const candlesByKey = useMarketStore((s) => s.candlesByKey);
  const setCandlesForKey = useMarketStore((s) => s.setCandlesForKey);

  const aggregatorRef = useRef(null);
  const candlesRef = useRef([]);

  useEffect(() => {
    if (!marketKey) return;

    aggregatorRef.current = new OHLCAggregator(60000);
    candlesRef.current = candlesByKey[marketKey] || [];
  }, [marketKey, candlesByKey]);

  useEffect(() => {
    if (!marketKey || !tick || !aggregatorRef.current) return;

    const result = aggregatorRef.current.processTick({
      price: tick.price,
      timestamp: tick.timestamp,
    });

    if (result.type === 'new') {
      candlesRef.current.push(result.candle);
    }

    if (result.type === 'close') {
      candlesRef.current[candlesRef.current.length - 1] = result.closed;
      candlesRef.current.push(result.new);
    }

    if (result.type === 'update') {
      candlesRef.current[candlesRef.current.length - 1] = result.candle;
    }

    setCandlesForKey(marketKey, [...candlesRef.current]);
  }, [marketKey, tick, setCandlesForKey]);
};

export default useCandleStream;
