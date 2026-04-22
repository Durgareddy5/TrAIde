import { Server } from 'socket.io';

import env from '../config/environment.js';
import instrumentService from './kotakInstrumentService.js';
import kotakWebSocketService from './kotakWebSocketService.js';

let io;
let bridgeWired = false;

const clientSubscriptions = new Map();

const ensureClientState = (socketId) => {
  if (!clientSubscriptions.has(socketId)) {
    clientSubscriptions.set(socketId, {
      scrips: new Set(),
      indices: new Set(),
      depth: new Set(),
    });
  }

  return clientSubscriptions.get(socketId);
};

const toKey = (exchangeSegment, exchangeIdentifier) =>
  `${exchangeSegment}|${exchangeIdentifier}`;

const resolveSymbolKeys = async (symbols = []) => {
  const keys = [];

  for (const symbol of symbols) {
    const instrument = await instrumentService.findByAnySymbol(symbol);
    if (instrument) {
      keys.push(toKey(instrument.exchangeSegment, instrument.exchangeIdentifier));
    }
  }

  return keys;
};

const uniq = (items = []) => [...new Set(items.filter(Boolean))];

const recomputeUnion = (bucket) => {
  const out = new Set();

  for (const subscription of clientSubscriptions.values()) {
    subscription[bucket].forEach((item) => out.add(item));
  }

  return [...out];
};

const syncProviderSubscriptions = async () => {
  const scrips = recomputeUnion('scrips');
  const indices = recomputeUnion('indices');
  const depth = recomputeUnion('depth');

  await kotakWebSocketService.subscribeScrips(scrips);
  await kotakWebSocketService.subscribeIndices(indices);
  await kotakWebSocketService.subscribeDepth(depth);
};

const emitStatus = (status) => {
  if (!io) return;
  io.emit('market:status', status);
};

const wireBridge = () => {
  if (bridgeWired) return;
  bridgeWired = true;

  kotakWebSocketService.onTick((tick) => {
    if (!io) return;
    io.emit('market:tick', tick);
  });

  kotakWebSocketService.onDepth((depth) => {
    if (!io) return;
    io.emit('market:depth', depth);
  });

  kotakWebSocketService.onStatus((status) => {
    emitStatus(status);
  });

  kotakWebSocketService.onError((error) => {
    if (!io) return;
    io.emit('market:error', {
      ...error,
      timestamp: new Date().toISOString(),
    });
  });
};

const subscribeForSocket = async (socket, payload = {}) => {
  const state = ensureClientState(socket.id);

  const symbolKeys = await resolveSymbolKeys(payload.symbols || []);
  const scripKeys = uniq([...(payload.keys || []), ...symbolKeys]);
  const indexKeys = uniq(payload.indices || []);
  const depthKeys = uniq(payload.depthKeys || []);

  scripKeys.forEach((key) => state.scrips.add(key));
  indexKeys.forEach((key) => state.indices.add(key));
  depthKeys.forEach((key) => state.depth.add(key));

  await syncProviderSubscriptions();

  socket.emit('market:subscribed', {
    scrips: [...state.scrips],
    indices: [...state.indices],
    depth: [...state.depth],
  });
};

const unsubscribeForSocket = async (socket, payload = {}) => {
  const state = ensureClientState(socket.id);

  const symbolKeys = await resolveSymbolKeys(payload.symbols || []);
  const scripKeys = uniq([...(payload.keys || []), ...symbolKeys]);
  const indexKeys = uniq(payload.indices || []);
  const depthKeys = uniq(payload.depthKeys || []);

  scripKeys.forEach((key) => state.scrips.delete(key));
  indexKeys.forEach((key) => state.indices.delete(key));
  depthKeys.forEach((key) => state.depth.delete(key));

  await syncProviderSubscriptions();

  socket.emit('market:subscribed', {
    scrips: [...state.scrips],
    indices: [...state.indices],
    depth: [...state.depth],
  });
};

export const initMarketSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: env.CORS_ORIGIN,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  wireBridge();

  io.on('connection', (socket) => {
    ensureClientState(socket.id);

    socket.emit('market:status', {
      connected: false,
      provider: 'kotak',
      status: 'idle',
      message: 'Socket connected. Waiting for market subscriptions.',
      timestamp: new Date().toISOString(),
    });

    socket.on('market:subscribe', async (payload = {}) => {
      try {
        await subscribeForSocket(socket, payload);
      } catch (error) {
        socket.emit('market:error', {
          type: 'subscribe_failed',
          message: error.message,
          timestamp: new Date().toISOString(),
        });
      }
    });

    socket.on('market:unsubscribe', async (payload = {}) => {
      try {
        await unsubscribeForSocket(socket, payload);
      } catch (error) {
        socket.emit('market:error', {
          type: 'unsubscribe_failed',
          message: error.message,
          timestamp: new Date().toISOString(),
        });
      }
    });

    socket.on('disconnect', async () => {
      clientSubscriptions.delete(socket.id);
      await syncProviderSubscriptions().catch(() => {});
    });
  });

  return io;
};

export default {
  initMarketSocket,
};
