import { useEffect, useRef } from 'react';
import { getSocket } from '@/services/socket';
import useMarketStore from '@/store/marketStore';

const useLiveMarketData = () => {
  const updateTicks = useMarketStore((s) => s.updateTicks);
  const setMarketStatus = useMarketStore((s) => s.setMarketStatus);

  const buffer = useRef([]);

  useEffect(() => {
  const socket = getSocket();

  socket.on('connect', () => {
    console.log('✅ Connected to socket:', socket.id);
  });

  socket.on('ticks', (data) => {
    buffer.current = data;
  });

  socket.on('market_status', (data) => {
    setMarketStatus(data.open);
  });

  return () => {
    socket.off('ticks');
    socket.off('market_status');
  };
}, []);

  return null;
};

export default useLiveMarketData;