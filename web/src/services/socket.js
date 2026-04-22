let socketInstance = null;
let ws = null;

// ==========================
// 🔌 INIT SOCKET
// ==========================
export const getSocket = () => {
  if (socketInstance) return socketInstance;

  socketInstance = new EventTarget();

  const authToken = localStorage.getItem("authToken");
  const sid = localStorage.getItem("sid");

  if (!authToken || !sid) {
    console.error("❌ Missing authToken or sid");
    return {
      on: () => {},
      off: () => {},
      emit: () => {},
    };
  }

  ws = new window.HSWebSocket("wss://mlhsm.kotaksecurities.com");

  // ==========================
  // 🔐 CONNECT
  // ==========================
  ws.onopen = () => {
    console.log("✅ Kotak WS Connected");

    ws.send(
      JSON.stringify({
        type: "cn",
        Authorization: authToken,
        Sid: sid,
      })
    );
  };

  // ==========================
  // 📊 RECEIVE DATA
  // ==========================
  ws.onmessage = (msg) => {
    let parsed;

    try {
      parsed = JSON.parse(msg.data);
    } catch {
      return;
    }

    // console.log("📡 RAW WS:", parsed);

    if (parsed[0]?.ltp) {
      const raw = parsed[0];

      const tick = {
        key: raw.tk,              // ✅ IMPORTANT (UNIQUE ID)
        symbol: raw.ts,           // display
        token: raw.tk,
        price: parseFloat(raw.ltp),
        change: parseFloat(raw.cng),
        changePercent: parseFloat(raw.nc),
        timestamp: Date.now(),
      };

      socketInstance.dispatchEvent(
        new CustomEvent("market:tick", { detail: tick })
      );
    }
  };

  // ==========================
  // ❌ ERROR
  // ==========================
  ws.onerror = (err) => {
    console.error("❌ WS Error:", err);

    socketInstance.dispatchEvent(
      new CustomEvent("market:error", { detail: err })
    );
  };

  // ==========================
  // 🔌 CLOSE
  // ==========================
  ws.onclose = () => {
    console.warn("⚠️ WS Disconnected");

    socketInstance.dispatchEvent(
      new CustomEvent("market:status", { detail: "disconnected" })
    );
  };

  // ==========================
  // 🎧 API
  // ==========================
  return {
    on: (event, cb) =>
      socketInstance.addEventListener(event, (e) => cb(e.detail)),

    off: (event, cb) =>
      socketInstance.removeEventListener(event, cb),
  };
};

// ==========================
// 📡 SUBSCRIBE
// ==========================
export const subscribeMarketData = (payload) => {
  if (!ws || ws.readyState !== 1) {
    console.warn("⚠️ WS not ready for subscribe");
    return;
  }

  const { symbols = [], indices = [] } = payload || {};

  const all = [...symbols, ...indices];

  if (!all.length) return;

  const formatted = all.join("&") + "&";

  ws.send(
    JSON.stringify({
      type: "mws",
      scrips: formatted,
      channelnum: 1,
    })
  );

  console.log("📡 Subscribed:", formatted);
};

// ==========================
// 🛑 UNSUBSCRIBE
// ==========================
export const unsubscribeMarketData = (payload) => {
  if (!ws || ws.readyState !== 1) return;

  const { symbols = [], indices = [] } = payload || {};

  const all = [...symbols, ...indices];

  if (!all.length) return;

  const formatted = all.join("&") + "&";

  ws.send(
    JSON.stringify({
      type: "uws",
      scrips: formatted,
      channelnum: 1,
    })
  );

  console.log("🛑 Unsubscribed:", formatted);
};

export default {
  getSocket,
  subscribeMarketData,
  unsubscribeMarketData,
};