import { useEffect, useRef } from 'react';
import { getSocket } from '@/services/socket';
import useMarketStore from '@/store/marketStore';

const useLiveMarketData = () => {
  const updateTicks = useMarketStore((s) => s.updateTicks);
  const setMarketStatus = useMarketStore((s) => s.setMarketStatus);

  // 🔥 Buffer for throttling
  const buffer = useRef({});
  const lastUpdate = useRef(0);

  useEffect(() => {
    const socket = getSocket();

    // ================================
    // CONNECT
    // ================================
    socket.on('connect', () => {
      console.log('✅ Connected to socket:', socket.id);
    });

    // ================================
    // RECEIVE TICKS
    // ================================
    socket.on('ticks', (data) => {
      if (!data || !Array.isArray(data)) {
        console.log('⚠️ Invalid ticks received');
        return;
      }

      console.log('📥 RAW TICKS:', data);

      // 🔥 Normalize & merge ticks
      data.forEach((tick) => {
        if (!tick.symbol || tick.price == null) return;

        buffer.current[tick.symbol] = {
          symbol: tick.symbol,
          price: Number(tick.price),
          timestamp: tick.timestamp || Date.now(),
        };
      });
    });

    // ================================
    // MARKET STATUS
    // ================================
    socket.on('market_status', (data) => {
      if (!data) return;

      console.log('📡 MARKET STATUS:', data);
      setMarketStatus(data);
    });

    // ================================
    // THROTTLED STORE UPDATE
    // ================================
    const interval = setInterval(() => {
      const now = Date.now();

      // ⚡ Avoid unnecessary updates
      if (Object.keys(buffer.current).length === 0) return;
      if (now - lastUpdate.current < 100) return;

      const ticksArray = Object.values(buffer.current);

      console.log('🚀 PUSHING TO STORE:', ticksArray);

      updateTicks(ticksArray);

      buffer.current = {};
      lastUpdate.current = now;

    }, 100); // 🔥 smoother updates

    // ================================
    // CLEANUP
    // ================================
    return () => {
      socket.off('connect');
      socket.off('ticks');
      socket.off('market_status');
      clearInterval(interval);
    };
  }, []);

  return null;
};

export default useLiveMarketData;