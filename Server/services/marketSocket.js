import { Server } from 'socket.io';
import YahooFinance from 'yahoo-finance2';
const yahooFinance = new YahooFinance();

let io;

const SYMBOLS = ['RELIANCE.NS', 'TCS.NS', 'INFY.NS'];

export const initMarketSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: 'http://localhost:3000',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log('📡 Client connected:', socket.id);
  });

  // 🔥 Fetch real prices every 3 sec
  setInterval(async () => {
    try {
      const results = await Promise.all(
        SYMBOLS.map((sym) => yahooFinance.quote(sym))
      );

      const ticks = results.map((res) => ({
        symbol: res.symbol.replace('.NS', ''),
        price: res.regularMarketPrice,
        timestamp: Date.now(),
      }));

      console.log('📊 REAL TICKS:', ticks);

      io.emit('ticks', ticks);

      io.emit('market_status', {
        open: true,
        status: 'open',
        message: 'Live Market (Yahoo)',
      });

    } catch (err) {
      console.error('❌ Yahoo fetch error:', err.message);
    }
  }, 3000);
};