import { useEffect, useRef } from 'react';
import useMarketStore from '@/store/marketStore';
import { OHLCAggregator } from '@/utils/ohlcAggregator';

const useCandleStream = () => {
  const ticks = useMarketStore((s) => s.ticks);
  const setCandles = useMarketStore((s) => s.setCandles);

  const aggregatorRef = useRef(new OHLCAggregator(60000)); // 1 min
  const candlesRef = useRef([]);

  useEffect(() => {
    if (!ticks || ticks.length === 0) return;

    ticks.forEach((tick) => {
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
    });

    // ✅ Throttle UI updates
    setCandles([...candlesRef.current]);

  }, [ticks]);

};

export default useCandleStream;