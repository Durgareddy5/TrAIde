import { io } from 'socket.io-client';

let socketInstance = null;

const resolveSocketUrl = () => {
  if (import.meta.env.VITE_SOCKET_URL) {
    return import.meta.env.VITE_SOCKET_URL;
  }

  if (import.meta.env.VITE_API_URL) {
    try {
      return new URL(import.meta.env.VITE_API_URL, window.location.origin).origin;
    } catch (_) {
      return 'http://localhost:5001';
    }
  }

  if (typeof window !== 'undefined') {
    const { origin, port } = window.location;

    if (port === '3000' || port === '5173') {
      return 'http://localhost:5001';
    }

    return origin;
  }

  return 'http://localhost:5001';
};

export const getSocket = () => {
  if (socketInstance) return socketInstance;

  socketInstance = io(resolveSocketUrl(), {
    transports: ['websocket'],
    reconnection: true,
    withCredentials: true,
    autoConnect: true,
  });

  socketInstance.on('connect_error', (error) => {
    console.error('Socket connection error:', error?.message || error);
  });

  return socketInstance;
};

export const subscribeMarketData = (payload = {}) => {
  const socket = getSocket();
  socket.emit('market:subscribe', payload);
};

export const unsubscribeMarketData = (payload = {}) => {
  const socket = getSocket();
  socket.emit('market:unsubscribe', payload);
};
