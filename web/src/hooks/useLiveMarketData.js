import { useEffect, useRef } from 'react';
import { getSocket } from '@/services/socket';
import useMarketStore from '@/store/marketStore';

const useLiveMarketData = () => {
  const updateTicks = useMarketStore((s) => s.updateTicks);
  const setMarketStatus = useMarketStore((s) => s.setMarketStatus);

  const buffer = useRef([]);

  useEffect(() => {
    const socket = getSocket();

    // ✅ CONNECT
    socket.on('connect', () => {
      console.log('✅ Connected to socket:', socket.id);
    });

    // ✅ RECEIVE TICKS (ONLY ONCE)
    socket.on('ticks', (data) => {
      console.log('📥 RECEIVED TICKS:', data);

      if (!data || !Array.isArray(data)) {
        console.log('⚠️ Invalid ticks received');
        return;
      }

      buffer.current = data;
    });

    // ✅ RECEIVE MARKET STATUS (FIXED)
    socket.on('market_status', (data) => {
      console.log('📡 MARKET STATUS:', data);

      if (!data) return;

      setMarketStatus(data); // ✅ FIX: send full object, not data.open
    });

    // ✅ THROTTLE UI UPDATES
    const interval = setInterval(() => {
      if (buffer.current && buffer.current.length > 0) {
        console.log('🚀 SENDING TO STORE:', buffer.current);

        updateTicks(buffer.current);

        buffer.current = [];
      }
    }, 150);

    // ✅ CLEANUP
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