import { useEffect, useRef } from 'react';
import { getSocket } from '@/services/socket';
import useMarketStore from '@/store/marketStore';

const useLiveMarketData = () => {
  const updateTicks = useMarketStore((s) => s.updateTicks);
  const updateDepth = useMarketStore((s) => s.updateDepth);
  const setMarketStatus = useMarketStore((s) => s.setMarketStatus);

  const tickBuffer = useRef({});
  const lastFlush = useRef(0);

  useEffect(() => {
    const socket = getSocket();
    if (!socket?.on) return;

    const handleTick = (tick) => {
      if (!tick?.key) return;
      tickBuffer.current[tick.key] = tick;
    };

    const handleDepth = (depth) => {
      if (!depth?.key) return;
      updateDepth(depth);
    };

    const handleStatus = (status) => {
      if (!status) return;
      setMarketStatus(status);
    };

    const handleError = (error) => {
      console.error('Market stream error:', error?.message || error);
    };

    const tickListener = (e) => handleTick(e);
    const depthListener = (e) => handleDepth(e);
    const statusListener = (e) => handleStatus(e);
    const errorListener = (e) => handleError(e);

    socket.on('market:tick', tickListener);
    socket.on('market:depth', depthListener);
    socket.on('market:status', statusListener);
    socket.on('market:error', errorListener);

    const interval = setInterval(() => {
      const bufferedTicks = Object.values(tickBuffer.current);

      if (!bufferedTicks.length) return;

      updateTicks(bufferedTicks);
      tickBuffer.current = {};
      lastFlush.current = Date.now();
    }, 100);

    return () => {
      socket.off('market:tick', tickListener);
      socket.off('market:depth', depthListener);
      socket.off('market:status', statusListener);
      socket.off('market:error', errorListener);
      clearInterval(interval);
    };
  }, [setMarketStatus, updateDepth, updateTicks]);

  return null;
};

export default useLiveMarketData;
