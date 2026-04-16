import { Server } from 'socket.io';
import axios from 'axios';

let io;
let interval;

const SYMBOLS = ['RELIANCE', 'TCS', 'INFY']; // extend later

// 🕒 Market hours (IST)
const isMarketOpen = () => {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();

  const time = hours * 60 + minutes;
  return time >= (9 * 60 + 15) && time <= (15 * 60 + 30);
};

// 🔥 Fetch live price (replace with Polygon later)
const fetchPrices = async () => {
  try {
    // TEMP MOCK → replace with real API
    return SYMBOLS.map(sym => ({
      symbol: sym,
      price: 1000 + Math.random() * 100,
      timestamp: Date.now(),
    }));
  } catch (err) {
    console.error("PRICE FETCH ERROR:", err.message);
    return [];
  }
};

export const initMarketSocket = (server) => {
  io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000', // ✅ frontend URL
    methods: ['GET', 'POST'],
  },
  });

  io.on('connection', (socket) => {
    console.log('📡 Client connected:', socket.id);

    // ✅ send initial state
    socket.emit('market_status', {
      open: isMarketOpen(),
      status: isMarketOpen() ? 'open' : 'closed',
      message: isMarketOpen() ? 'Market Open' : 'Market Closed',
    });

    socket.on('disconnect', () => {
      console.log('❌ Client disconnected:', socket.id);
    });
  });

  // 🔁 Tick loop (throttled)
  interval = setInterval(async () => {
  const marketOpen = isMarketOpen();

  // ✅ ALWAYS send status
  io.emit('market_status', {
    open: marketOpen,
    status: marketOpen ? 'open' : 'closed',
    message: marketOpen ? 'Market Open' : 'Market Closed',
  });

  if (!marketOpen) return;

  const ticks = await fetchPrices();

  io.emit('ticks', ticks);
  }, 200);
};