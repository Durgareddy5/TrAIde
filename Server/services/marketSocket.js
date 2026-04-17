import { Server } from 'socket.io';
import WebSocket from 'ws';

let io;

// ✅ Yahoo symbols
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

  // ✅ Yahoo WebSocket URL
  const ws = new WebSocket('wss://streamer.finance.yahoo.com');

  ws.on('message', (data) => {
  try {
    const message = JSON.parse(data.toString());

    // Yahoo wraps data inside message
    if (!message || !message.data) return;

    const ticks = message.data.map((item) => ({
      symbol: item.id.replace('.NS', ''),
      price: item.price,
      timestamp: Date.now(),
    }));

    console.log('📊 LIVE TICKS:', ticks);

    io.emit('ticks', ticks);

    io.emit('market_status', {
      open: true,
      status: 'open',
      message: 'Live Market (Yahoo)',
    });

  } catch (err) {
    // ignore invalid messages
  }
});

  ws.on('close', () => {
    console.log('❌ Yahoo WebSocket closed');
  });

  ws.on('error', (err) => {
    console.error('❌ WS ERROR:', err.message);
  });
};







// import { Server } from 'socket.io';
// import axios from 'axios';

// const API_KEY = '7bff215496384901aa089ca0c907420c'; // 🔴 replace with real key

// let io;
// let interval;

// // ✅ STORE latest API prices
// let latestPrices = [];

// const SYMBOLS = ['RELIANCE.NSE', 'TCS.NSE', 'INFY.NSE'];

// // 🕒 Market hours (IST)
// const isMarketOpen = () => {
//   const now = new Date();
//   const hours = now.getHours();
//   const minutes = now.getMinutes();

//   const time = hours * 60 + minutes;
//   return time >= (9 * 60 + 15) && time <= (15 * 60 + 30);
// };

// // ✅ FETCH API (ONLY EVERY 5 SECONDS)
// const fetchPrices = async () => {
//   try {
//     const results = await Promise.all(
//       SYMBOLS.map(sym =>
//         axios.get('https://api.twelvedata.com/price', {
//           params: {
//             symbol: sym,
//             apikey: API_KEY,
//           },
//         })
//       )
//     );

//     latestPrices = results.map((res, i) => {
//   const price = parseFloat(res.data.price);

//   if (!price || isNaN(price)) {
//     console.log('⚠️ Skipping invalid price for:', SYMBOLS[i]);

//     // keep old price if exists
//     const existing = latestPrices.find(
//       (s) => s.symbol === SYMBOLS[i].split('.')[0]
//     );

//     return existing || {
//       symbol: SYMBOLS[i].split('.')[0],
//       price: 1000 + Math.random() * 100, // fallback realistic price
//     };
//   }

//   return {
//     symbol: SYMBOLS[i].split('.')[0],
//     price,
//   };
//   });

//     console.log('✅ API prices updated:', latestPrices);

//   } catch (err) {
//     console.error('❌ API ERROR:', err.message);
//   }
// };

// export const initMarketSocket = (server) => {
//   io = new Server(server, {
//     cors: {
//       origin: 'http://localhost:3000',
//       methods: ['GET', 'POST'],
//     },
//   });

//   io.on('connection', (socket) => {
//     console.log('📡 Client connected:', socket.id);

//     // ✅ Send initial market status
//     socket.emit('market_status', {
//       open: isMarketOpen(),
//       status: isMarketOpen() ? 'open' : 'closed',
//       message: isMarketOpen() ? 'Market Open' : 'Market Closed',
//     });

//     socket.on('disconnect', () => {
//       console.log('❌ Client disconnected:', socket.id);
//     });
//   });

//   // ✅ 🔥 CALL API EVERY 5 SECONDS ONLY
//   setInterval(fetchPrices, 5000);

//   // ✅ ⚡ EMIT TICKS EVERY 200ms (SMOOTH UI)
//   interval = setInterval(() => {
//     const marketOpen = isMarketOpen();

//     // ✅ Always send status
//     io.emit('market_status', {
//       open: marketOpen,
//       status: marketOpen ? 'open' : 'closed',
//       message: marketOpen ? 'Market Open' : 'Market Closed',
//     });

//     if (!marketOpen) return;

//     // ❌ if no data yet, skip
//     if (!latestPrices.length) return;

//     // ✅ simulate smooth tick movement
//     const ticks = latestPrices.map((stock) => ({
//       symbol: stock.symbol,
//       price: stock.price + (Math.random() - 0.5) * 2, // small fluctuation
//       timestamp: Date.now(),
//     }));

//     console.log('🚀 Emitting ticks:', ticks);

//     io.emit('ticks', ticks);

//   }, 200);
// };



