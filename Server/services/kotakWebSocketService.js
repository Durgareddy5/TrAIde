import fs from 'fs';
import path from 'path';
import vm from 'vm';
import { EventEmitter } from 'events';
import NodeWebSocket from 'ws';

import authService from './kotakAuthService.js';

const HSM_URL = 'wss://mlhsm.kotaksecurities.com';
const CHANNEL_NUMBER = 1;

let runtime = null;

const state = {
  socket: null,
  connected: false,
  connecting: false,
  subscriptions: {
    scrips: new Set(),
    indices: new Set(),
    depth: new Set(),
  },
  reconnectTimer: null,
};

const emitter = new EventEmitter();

const toArrayBuffer = (buffer) => {
  if (buffer instanceof ArrayBuffer) return buffer;
  const view = buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength
  );
  return view;
};

const buildBrowserLikeRuntime = () => {
  if (runtime) return runtime;

  class BrowserWebSocket {
    constructor(url) {
      this.url = url;
      this.binaryType = 'arraybuffer';
      this.readyState = 0;
      this.ws = new NodeWebSocket(url);

      this.ws.on('open', () => {
        this.readyState = 1;
        if (typeof this.onopen === 'function') {
          this.onopen();
        }
      });

      this.ws.on('message', (data, isBinary) => {
        let payload = data;

        if (isBinary || Buffer.isBuffer(data)) {
          payload = toArrayBuffer(Buffer.from(data));
        } else if (typeof data !== 'string') {
          payload = String(data);
        }

        if (typeof this.onmessage === 'function') {
          this.onmessage({ data: payload });
        }
      });

      this.ws.on('close', () => {
        this.readyState = 3;
        if (typeof this.onclose === 'function') {
          this.onclose();
        }
      });

      this.ws.on('error', (error) => {
        if (typeof this.onerror === 'function') {
          this.onerror(error);
        }
      });
    }

    send(data) {
      this.ws.send(data);
    }

    close() {
      this.ws.close();
    }
  }

  const sandbox = {
    console,
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    Uint8Array,
    ArrayBuffer,
    DataView,
    Buffer,
    WebSocket: BrowserWebSocket,
    MozWebSocket: BrowserWebSocket,
    window: {
      WebSocket: BrowserWebSocket,
      MozWebSocket: BrowserWebSocket,
      btoa: (value) => Buffer.from(String(value), 'binary').toString('base64'),
      atob: (value) => Buffer.from(String(value), 'base64').toString('binary'),
    },
    document: {
      getElementsByTagName: () => [
        {
          appendChild: () => {},
        },
      ],
      createElement: () => ({
        set src(_) {},
        set type(_) {},
        onload: null,
        onreadystatechange: null,
      }),
    },
  };

  sandbox.window.window = sandbox.window;
  sandbox.window.document = sandbox.document;

  const vendorPath = path.resolve(
    process.cwd(),
    'Server/vendors/kotak-hslib.js'
  );
  const vendorCode = fs.readFileSync(vendorPath, 'utf8');

  vm.createContext(sandbox);
  vm.runInContext(vendorCode, sandbox, {
    filename: 'kotak-hslib.js',
  });

  runtime = {
    HSWebSocket: sandbox.HSWebSocket,
    enableLog: sandbox.enableLog,
  };

  runtime.enableLog(false);

  return runtime;
};

const getTickTimestamp = (raw) => {
  const candidate =
    raw.ft ||
    raw.fdtm ||
    raw.ltt ||
    raw.ltqTime ||
    raw.dt ||
    raw.t;

  const numeric = Number(candidate || 0);

  if (numeric > 0) {
    if (numeric > 9999999999) return numeric;
    return numeric * 1000;
  }

  return Date.now();
};


const getDisplaySymbol = (raw) => {
  return raw.ts || raw.name || raw.tk || '';
};




const normalizeScripTick = (raw) => ({
  feedType: 'scrip',
  key: `${raw.e}|${raw.tk}`,
  exchangeSegment: raw.e || '',
  exchange: raw.e || '',
  symbol: raw.ts || raw.tk || '',
  displaySymbol: getDisplaySymbol(raw),
  exchangeIdentifier: raw.tk || '',
  tradingSymbol: raw.ts || '',
  name: raw.name || raw.ts || raw.tk || '',
  price: Number(raw.ltp || 0),
  change: Number(raw.cng || 0),
  changePercent: Number(raw.nc || 0),
  open: Number(raw.op || 0),
  high: Number(raw.h || 0),
  low: Number(raw.lo || 0),
  close: Number(raw.c || 0),
  volume: Number(raw.v || 0),
  lastTradedQuantity: Number(raw.ltq || 0),
  totalBuyQty: Number(raw.tbq || 0),
  totalSellQty: Number(raw.tsq || 0),
  bestBidPrice: Number(raw.bp || 0),
  bestAskPrice: Number(raw.sp || 0),
  bestBidQty: Number(raw.bq || 0),
  bestAskQty: Number(raw.bs || 0),
  turnover: Number(raw.to || 0),
  oi: Number(raw.oi || 0),
  timestamp: getTickTimestamp(raw),
  raw,
});


const normalizeIndexTick = (raw) => ({
  feedType: 'index',
  key: `${raw.e}|${raw.tk}`,
  exchangeSegment: raw.e || '',
  exchange: raw.e || '',
  symbol: raw.ts || raw.tk || '',
  displaySymbol: getDisplaySymbol(raw),
  exchangeIdentifier: raw.tk || '',
  tradingSymbol: raw.ts || '',
  name: raw.name || raw.ts || raw.tk || '',
  price: Number(raw.iv || 0),
  change: Number(raw.cng || 0),
  changePercent: Number(raw.nc || 0),
  open: Number(raw.openingPrice || 0),
  high: Number(raw.highPrice || 0),
  low: Number(raw.lowPrice || 0),
  close: Number(raw.ic || 0),
  volume: 0,
  timestamp: getTickTimestamp(raw),
  raw,
});

const normalizeDepth = (raw) => ({
  key: `${raw.e}|${raw.tk}`,
  exchangeSegment: raw.e || '',
  exchange: raw.e || '',
  symbol: raw.ts || raw.tk || '',
  displaySymbol: getDisplaySymbol(raw),
  exchangeIdentifier: raw.tk || '',
  tradingSymbol: raw.ts || '',
  name: raw.name || raw.ts || raw.tk || '',
  buy: [
    { price: Number(raw.bp || 0), quantity: Number(raw.bq || 0), orders: Number(raw.bno1 || 0) },
    { price: Number(raw.bp1 || 0), quantity: Number(raw.bq1 || 0), orders: Number(raw.bno2 || 0) },
    { price: Number(raw.bp2 || 0), quantity: Number(raw.bq2 || 0), orders: Number(raw.bno3 || 0) },
    { price: Number(raw.bp3 || 0), quantity: Number(raw.bq3 || 0), orders: Number(raw.bno4 || 0) },
    { price: Number(raw.bp4 || 0), quantity: Number(raw.bq4 || 0), orders: Number(raw.bno5 || 0) },
  ],
  sell: [
    { price: Number(raw.sp || 0), quantity: Number(raw.bs || 0), orders: Number(raw.sno1 || 0) },
    { price: Number(raw.sp1 || 0), quantity: Number(raw.bs1 || 0), orders: Number(raw.sno2 || 0) },
    { price: Number(raw.sp2 || 0), quantity: Number(raw.bs2 || 0), orders: Number(raw.sno3 || 0) },
    { price: Number(raw.sp3 || 0), quantity: Number(raw.bs3 || 0), orders: Number(raw.sno4 || 0) },
    { price: Number(raw.sp4 || 0), quantity: Number(raw.bs4 || 0), orders: Number(raw.sno5 || 0) },
  ],
  timestamp: getTickTimestamp(raw),
  raw,
});

const parseDecodedMessage = (payload) => {
  try {
    const parsed = JSON.parse(payload);
    if (Array.isArray(parsed)) return parsed;
    return [parsed];
  } catch {
    return [];
  }
};

const classifyAndEmit = (message) => {
  if (!message || typeof message !== 'object') return;

  if (message.stat === 'NotOk' || message.stat === 'Not_Ok') {
    emitter.emit('error', {
      type: 'provider_error',
      message: message.msg || message.emsg || 'Kotak websocket error',
      raw: message,
    });
    return;
  }

  if (message.type === 'cn') {
    emitter.emit('status', {
      connected: true,
      provider: 'kotak',
      status: 'connected',
      message: 'Kotak market feed connected',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  if (message.bp !== undefined || message.sp !== undefined) {
    emitter.emit('depth', normalizeDepth(message));
    return;
  }

  if (message.iv !== undefined || message.openingPrice !== undefined) {
    emitter.emit('tick', normalizeIndexTick(message));
    return;
  }

  if (message.ltp !== undefined || message.v !== undefined || message.ltq !== undefined) {
    emitter.emit('tick', normalizeScripTick(message));
  }
};

const send = (payload) => {
  if (!state.socket || !state.connected) return;
  state.socket.send(JSON.stringify(payload));
};

const replaySubscriptions = () => {
  if (state.subscriptions.scrips.size > 0) {
    send({
      type: 'mws',
      scrips: [...state.subscriptions.scrips].join('&'),
      channelnum: CHANNEL_NUMBER,
    });
  }

  if (state.subscriptions.indices.size > 0) {
    send({
      type: 'ifs',
      scrips: [...state.subscriptions.indices].join('&'),
      channelnum: CHANNEL_NUMBER,
    });
  }

  if (state.subscriptions.depth.size > 0) {
    send({
      type: 'dps',
      scrips: [...state.subscriptions.depth].join('&'),
      channelnum: CHANNEL_NUMBER,
    });
  }
};

const scheduleReconnect = () => {
  if (state.reconnectTimer) return;

  state.reconnectTimer = setTimeout(async () => {
    state.reconnectTimer = null;
    try {
      await connect();
    } catch (error) {
      emitter.emit('error', {
        type: 'reconnect_failed',
        message: error.message,
      });
    }
  }, 5000);
};

const connect = async () => {
  if (state.connected || state.connecting) return;
  const session = authService.requireSession();
  const { HSWebSocket } = buildBrowserLikeRuntime();

  state.connecting = true;

  await new Promise((resolve, reject) => {
    const socket = new HSWebSocket(HSM_URL);

    socket.onopen = () => {
      state.socket = socket;
      state.connected = true;
      state.connecting = false;

      send({
        type: 'cn',
        Authorization: session.tradeToken,
        Sid: session.tradeSid,
      });

      replaySubscriptions();
      resolve();
    };

    socket.onmessage = (payload) => {
      const messages = parseDecodedMessage(payload);
      messages.forEach(classifyAndEmit);
    };

    socket.onclose = () => {
      state.connected = false;
      state.connecting = false;
      state.socket = null;

      emitter.emit('status', {
        connected: false,
        provider: 'kotak',
        status: 'disconnected',
        message: 'Kotak market feed disconnected',
        timestamp: new Date().toISOString(),
      });

      scheduleReconnect();
    };

    socket.onerror = (error) => {
      state.connected = false;
      state.connecting = false;

      emitter.emit('error', {
        type: 'socket_error',
        message: error?.message || 'Kotak websocket error',
      });

      reject(error);
    };
  });
};

const disconnect = () => {
  if (state.reconnectTimer) {
    clearTimeout(state.reconnectTimer);
    state.reconnectTimer = null;
  }

  if (state.socket) {
    state.socket.close();
  }

  state.socket = null;
  state.connected = false;
  state.connecting = false;
};

const uniq = (items = []) => [...new Set(items.filter(Boolean))];

const subscribeScrips = async (keys = []) => {
  uniq(keys).forEach((key) => state.subscriptions.scrips.add(key));
  await connect();

  send({
    type: 'mws',
    scrips: uniq(keys).join('&'),
    channelnum: CHANNEL_NUMBER,
  });
};

const unsubscribeScrips = (keys = []) => {
  uniq(keys).forEach((key) => state.subscriptions.scrips.delete(key));

  send({
    type: 'mwu',
    scrips: uniq(keys).join('&'),
    channelnum: CHANNEL_NUMBER,
  });
};

const subscribeIndices = async (keys = []) => {
  uniq(keys).forEach((key) => state.subscriptions.indices.add(key));
  await connect();

  send({
    type: 'ifs',
    scrips: uniq(keys).join('&'),
    channelnum: CHANNEL_NUMBER,
  });
};

const unsubscribeIndices = (keys = []) => {
  uniq(keys).forEach((key) => state.subscriptions.indices.delete(key));

  send({
    type: 'ifu',
    scrips: uniq(keys).join('&'),
    channelnum: CHANNEL_NUMBER,
  });
};

const subscribeDepth = async (keys = []) => {
  uniq(keys).forEach((key) => state.subscriptions.depth.add(key));
  await connect();

  send({
    type: 'dps',
    scrips: uniq(keys).join('&'),
    channelnum: CHANNEL_NUMBER,
  });
};

const unsubscribeDepth = (keys = []) => {
  uniq(keys).forEach((key) => state.subscriptions.depth.delete(key));

  send({
    type: 'dpu',
    scrips: uniq(keys).join('&'),
    channelnum: CHANNEL_NUMBER,
  });
};

const pauseChannel = () => {
  send({
    type: 'cp',
    channelnums: [CHANNEL_NUMBER],
  });
};

const resumeChannel = () => {
  send({
    type: 'cr',
    channelnums: [CHANNEL_NUMBER],
  });
};

const onTick = (handler) => emitter.on('tick', handler);
const onDepth = (handler) => emitter.on('depth', handler);
const onStatus = (handler) => emitter.on('status', handler);
const onError = (handler) => emitter.on('error', handler);

const offTick = (handler) => emitter.off('tick', handler);
const offDepth = (handler) => emitter.off('depth', handler);
const offStatus = (handler) => emitter.off('status', handler);
const offError = (handler) => emitter.off('error', handler);

export {
  connect,
  disconnect,
  subscribeScrips,
  unsubscribeScrips,
  subscribeIndices,
  unsubscribeIndices,
  subscribeDepth,
  unsubscribeDepth,
  pauseChannel,
  resumeChannel,
  onTick,
  onDepth,
  onStatus,
  onError,
  offTick,
  offDepth,
  offStatus,
  offError,
};

export default {
  connect,
  disconnect,
  subscribeScrips,
  unsubscribeScrips,
  subscribeIndices,
  unsubscribeIndices,
  subscribeDepth,
  unsubscribeDepth,
  pauseChannel,
  resumeChannel,
  onTick,
  onDepth,
  onStatus,
  onError,
  offTick,
  offDepth,
  offStatus,
  offError,
};
