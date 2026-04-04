import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { createChart, CrosshairMode } from 'lightweight-charts';
import {
  ArrowLeft, Star, StarOff, TrendingUp, TrendingDown,
  Activity, BarChart3, Info, BookOpen, Newspaper,
  Plus, Minus, ChevronDown, Loader2, AlertCircle,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { formatINR, formatPercent, formatVolume, getPnLColor } from '@/utils/formatters';
import Badge   from '@/components/ui/Badge';
import Skeleton from '@/components/ui/Skeleton';
import toast from 'react-hot-toast';

/* ─── Mock stock data map ─────────────────────── */
const STOCK_MAP = {
  RELIANCE:  { name:'Reliance Industries Ltd', sector:'Energy',       exchange:'NSE', price:1285.50, prevClose:1273.15, open:1275.00, high:1298.40, low:1268.90, volume:4520000, marketCap:1735000000000, pe:27.4,  pb:2.8,  eps:46.92, div:0.44, week52H:1608.95, week52L:1115.50, lot:1 },
  TCS:       { name:'Tata Consultancy Services',sector:'IT',          exchange:'NSE', price:3542.80, prevClose:3570.95, open:3565.00, high:3590.20, low:3528.40, volume:980000,  marketCap:1283000000000, pe:31.2,  pb:13.4, eps:113.55,div:1.18, week52H:4255.00, week52L:3141.85, lot:1 },
  HDFCBANK:  { name:'HDFC Bank Ltd',            sector:'Banking',     exchange:'NSE', price:1672.30, prevClose:1656.70, open:1660.00, high:1685.90, low:1655.40, volume:3890000, marketCap:1261000000000, pe:19.8,  pb:2.6,  eps:84.46, div:1.50, week52H:1881.00, week52L:1363.55, lot:1 },
  INFY:      { name:'Infosys Ltd',              sector:'IT',          exchange:'NSE', price:1495.25, prevClose:1486.85, open:1490.00, high:1502.60, low:1484.30, volume:2640000, marketCap:623000000000,  pe:27.1,  pb:8.9,  eps:55.18, div:2.20, week52H:1906.00, week52L:1307.35, lot:1 },
  SBIN:      { name:'State Bank of India',      sector:'Banking',     exchange:'NSE', price:812.40,  prevClose:805.55,  open:808.00,  high:820.50,  low:805.00,  volume:12000000,marketCap:724000000000,  pe:10.2,  pb:1.6,  eps:79.65, div:1.30, week52H:912.00,  week52L:543.35,  lot:1 },
  WIPRO:     { name:'Wipro Ltd',                sector:'IT',          exchange:'NSE', price:472.65,  prevClose:475.75,  open:474.00,  high:476.80,  low:470.10,  volume:3820000, marketCap:245000000000,  pe:21.4,  pb:3.2,  eps:22.09, div:1.00, week52H:593.00,  week52L:415.00,  lot:1 },
};
const FALLBACK = STOCK_MAP.RELIANCE;

/* Generate candlestick data */
const generateCandles = (base, n = 120) => {
  let p = base * 0.88;
  return Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (n - i));
    const o = p + (Math.random() - 0.49) * (p * 0.015);
    const c = o + (Math.random() - 0.48) * (p * 0.012);
    const h = Math.max(o, c) + Math.random() * (p * 0.008);
    const l = Math.min(o, c) - Math.random() * (p * 0.008);
    const v = Math.floor(500000 + Math.random() * 2000000);
    p = c;
    return {
      time: d.toISOString().split('T')[0],
      open: +o.toFixed(2), high: +h.toFixed(2),
      low:  +l.toFixed(2), close: +c.toFixed(2),
      value: v,
    };
  });
};

/* ─── Lightweight Chart wrapper ──────────────── */
const CandlestickChart = ({ stock, interval }) => {
  const containerRef = useRef(null);
  const chartRef     = useRef(null);
  const candleRef    = useRef(null);
  const volRef       = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    /* Create chart */
    const chart = createChart(containerRef.current, {
      layout: {
        background: { color: 'transparent' },
        textColor: 'var(--text-tertiary)',
      },
      grid: {
        vertLines:   { color: 'rgba(255,255,255,0.03)' },
        horzLines:   { color: 'rgba(255,255,255,0.03)' },
      },
      crosshair:    { mode: CrosshairMode.Normal },
      rightPriceScale: { borderColor: 'rgba(255,255,255,0.06)' },
      timeScale: {
        borderColor: 'rgba(255,255,255,0.06)',
        timeVisible: true,
        secondsVisible: false,
      },
      handleScroll:  true,
      handleScale:   true,
    });

    /* Candlestick series */
    const candle = chart.addCandlestickSeries({
      upColor:         'var(--profit)',
      downColor:       'var(--loss)',
      borderUpColor:   'var(--profit)',
      borderDownColor: 'var(--loss)',
      wickUpColor:     'var(--profit)',
      wickDownColor:   'var(--loss)',
    });

    /* Volume series */
    const vol = chart.addHistogramSeries({
      priceFormat:     { type: 'volume' },
      priceScaleId:    'volume',
      scaleMargins:    { top: 0.8, bottom: 0 },
    });

    chart.priceScale('volume').applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });

    const data = generateCandles(stock.price);
    candle.setData(data);
    vol.setData(
      data.map((d) => ({
        time:  d.time,
        value: d.value,
        color: d.close >= d.open
          ? 'rgba(0,230,118,0.4)'
          : 'rgba(255,23,68,0.4)',
      }))
    );

    chart.timeScale().fitContent();

    /* Resize observer */
    const ro = new ResizeObserver(() => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    });
    ro.observe(containerRef.current);

    chartRef.current  = chart;
    candleRef.current = candle;
    volRef.current    = vol;

    return () => {
      ro.disconnect();
      chart.remove();
    };
  }, [stock.symbol, interval]);

  return (
    <div ref={containerRef} className="w-full h-[380px]" />
  );
};

/* ─── Order Form ──────────────────────────────── */
const OrderForm = ({ stock }) => {
  const [side, setSide]     = useState('buy');
  const [oType, setOType]   = useState('market');
  const [pType, setPType]   = useState('CNC');
  const [submitting, setSub] = useState(false);

  const { register, handleSubmit, watch, setValue,
          formState: { errors } } = useForm({
    defaultValues: { quantity: 1, price: stock.price, trigger_price: '' },
  });

  const qty   = watch('quantity')   || 0;
  const price = watch('price')      || stock.price;
  const estValue = qty * (oType === 'market' ? stock.price : price);
  const charges  = +(estValue * 0.0003).toFixed(2); // rough calc

  const onSubmit = async (data) => {
    setSub(true);
    await new Promise((r) => setTimeout(r, 1200));
    toast.success(
      `${side.toUpperCase()} order placed: ${data.quantity} × ${stock.symbol} @ ${
        oType === 'market' ? 'Market' : formatINR(data.price)
      }`
    );
    setSub(false);
  };

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-primary)]
                    rounded-2xl overflow-hidden">
      {/* Buy / Sell Toggle */}
      <div className="grid grid-cols-2">
        <button
          onClick={() => setSide('buy')}
          className={`py-3.5 text-sm font-bold transition-all duration-200
                       ${side === 'buy'
                         ? 'bg-[#0052FF] text-white shadow-[0_0_20px_rgba(0,82,255,0.3)]'
                         : 'bg-[var(--bg-secondary)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'}`}
        >
          <TrendingUp  size={16} className="inline mr-1.5"/> BUY
        </button>
        <button
          onClick={() => setSide('sell')}
          className={`py-3.5 text-sm font-bold transition-all duration-200
                       ${side === 'sell'
                         ? 'bg-[var(--loss)] text-white shadow-[0_0_20px_rgba(255,23,68,0.3)]'
                         : 'bg-[var(--bg-secondary)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'}`}
        >
          <TrendingDown size={16} className="inline mr-1.5"/> SELL
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-3">
        {/* Product type */}
        <div className="flex gap-1.5">
          {['CNC','MIS','NRML'].map((pt) => (
            <button key={pt} type="button"
              onClick={() => setPType(pt)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold
                          border transition-all duration-200
                          ${pType === pt
                            ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border-[var(--accent-primary)]/30'
                            : 'border-[var(--border-primary)] text-[var(--text-tertiary)] hover:border-[var(--border-secondary)]'}`}>
              {pt}
            </button>
          ))}
        </div>

        {/* Order type */}
        <div>
          <label className="text-[10px] font-medium uppercase tracking-wider
                            text-[var(--text-tertiary)] mb-1 block">
            Order Type
          </label>
          <select
            value={oType}
            onChange={(e) => setOType(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl text-sm
                       bg-[var(--bg-input)] border border-[var(--border-primary)]
                       text-[var(--text-primary)]
                       focus:outline-none focus:border-[var(--accent-primary)]"
          >
            <option value="market">Market</option>
            <option value="limit">Limit</option>
            <option value="stop_loss">Stop-Loss</option>
            <option value="stop_limit">Stop-Limit</option>
          </select>
        </div>

        {/* Quantity */}
        <div>
          <label className="text-[10px] font-medium uppercase tracking-wider
                            text-[var(--text-tertiary)] mb-1 block">
            Quantity
          </label>
          <div className="flex items-center">
            <button type="button"
              onClick={() => setValue('quantity', Math.max(1, qty - 1))}
              className="px-3 py-2.5 rounded-l-xl bg-[var(--bg-tertiary)]
                         border border-[var(--border-primary)] border-r-0
                         text-[var(--text-secondary)] hover:text-[var(--text-primary)]
                         transition-colors">
              <Minus size={14}/>
            </button>
            <input
              type="number"
              {...register('quantity', { required:true, min:1, valueAsNumber:true })}
              className="flex-1 px-3 py-2.5 text-center text-sm font-mono
                         bg-[var(--bg-input)] border-y border-[var(--border-primary)]
                         text-[var(--text-primary)]
                         focus:outline-none focus:border-[var(--accent-primary)]
                         [appearance:textfield]"
            />
            <button type="button"
              onClick={() => setValue('quantity', qty + 1)}
              className="px-3 py-2.5 rounded-r-xl bg-[var(--bg-tertiary)]
                         border border-[var(--border-primary)] border-l-0
                         text-[var(--text-secondary)] hover:text-[var(--text-primary)]
                         transition-colors">
              <Plus size={14}/>
            </button>
          </div>
        </div>

        {/* Price (limit / SL) */}
        {oType !== 'market' && (
          <div>
            <label className="text-[10px] font-medium uppercase tracking-wider
                              text-[var(--text-tertiary)] mb-1 block">
              Limit Price (₹)
            </label>
            <input
              type="number"
              step="0.05"
              {...register('price', { required: oType !== 'market', min:0.01, valueAsNumber:true })}
              className="w-full px-3 py-2.5 rounded-xl text-sm font-mono
                         bg-[var(--bg-input)] border border-[var(--border-primary)]
                         text-[var(--text-primary)]
                         focus:outline-none focus:border-[var(--accent-primary)]"
            />
          </div>
        )}

        {/* Trigger (SL) */}
        {(oType === 'stop_loss' || oType === 'stop_limit') && (
          <div>
            <label className="text-[10px] font-medium uppercase tracking-wider
                              text-[var(--text-tertiary)] mb-1 block">
              Trigger Price (₹)
            </label>
            <input
              type="number"
              step="0.05"
              {...register('trigger_price', { required:true, min:0.01, valueAsNumber:true })}
              className="w-full px-3 py-2.5 rounded-xl text-sm font-mono
                         bg-[var(--bg-input)] border border-[var(--border-primary)]
                         text-[var(--text-primary)]
                         focus:outline-none focus:border-[var(--accent-primary)]"
            />
          </div>
        )}

        {/* Value estimate */}
        <div className="p-3 rounded-xl bg-[var(--bg-tertiary)]
                        border border-[var(--border-primary)] space-y-1.5">
          {[
            { label:'Est. Value', value: formatINR(estValue) },
            { label:'Charges',   value: `~${formatINR(charges)}` },
            { label:'Net Amount', value: formatINR(
                side === 'buy' ? estValue + charges : estValue - charges
              )},
          ].map(({ label, value }) => (
            <div key={label}
                 className="flex justify-between text-xs">
              <span className="text-[var(--text-tertiary)]">{label}</span>
              <span className="font-mono font-medium text-[var(--text-primary)]">
                {value}
              </span>
            </div>
          ))}
        </div>

        {/* Submit */}
        <motion.button
          type="submit"
          disabled={submitting}
          whileHover={{ scale: submitting ? 1 : 1.02 }}
          whileTap={{ scale: submitting ? 1 : 0.98 }}
          className={`w-full py-3.5 rounded-xl font-bold text-sm text-white
                       disabled:opacity-60 disabled:cursor-not-allowed
                       flex items-center justify-center gap-2
                       transition-all duration-300
                       ${side === 'buy'
                         ? 'bg-[#0052FF] hover:bg-[#0066FF] shadow-[0_0_20px_rgba(0,82,255,0.25)] hover:shadow-[0_0_30px_rgba(0,82,255,0.4)]'
                         : 'bg-[var(--loss)] hover:bg-red-700 shadow-[0_0_20px_rgba(255,23,68,0.25)]'}`}
        >
          {submitting
            ? <><Loader2 size={18} className="animate-spin"/> Processing...</>
            : <>{side === 'buy' ? <TrendingUp size={18}/> : <TrendingDown size={18}/>}
               Place {side.toUpperCase()} Order</>
          }
        </motion.button>

        <p className="text-[10px] text-center text-[var(--text-tertiary)]">
          📄 Paper Trade — No real money involved
        </p>
      </form>
    </div>
  );
};

/* ══════════════════════════════════════════════
   MAIN STOCK DETAIL PAGE
══════════════════════════════════════════════ */
const StockDetail = () => {
  const { symbol }           = useParams();
  const navigate             = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stock, setStock]     = useState(null);
  const [interval, setInterval] = useState('1D');
  const [watchlisted, setWatchlisted] = useState(false);
  const [infoTab, setInfoTab] = useState('overview');

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      const data = STOCK_MAP[symbol] || { ...FALLBACK, symbol };
      setStock({ ...data, symbol });
      setLoading(false);
    }, 600);
  }, [symbol]);

  const change    = stock ? stock.price - stock.prevClose : 0;
  const changePct = stock ? (change / stock.prevClose) * 100 : 0;
  const isUp      = change >= 0;

  const INFO_TABS = [
    { key:'overview',      label:'Overview'     },
    { key:'fundamentals',  label:'Fundamentals' },
    { key:'depth',         label:'Market Depth' },
    { key:'news',          label:'News'         },
  ];

  const INTERVALS = ['1D','1W','1M','3M','6M','1Y'];

  /* mock market depth */
  const depth = {
    bids: [
      { price:1285.00, qty:500,  orders:12 },
      { price:1284.50, qty:1200, orders:28 },
      { price:1284.00, qty:800,  orders:15 },
      { price:1283.50, qty:2000, orders:42 },
      { price:1283.00, qty:650,  orders:9  },
    ],
    asks: [
      { price:1285.50, qty:400,  orders:8  },
      { price:1286.00, qty:900,  orders:21 },
      { price:1286.50, qty:1500, orders:35 },
      { price:1287.00, qty:600,  orders:11 },
      { price:1287.50, qty:1100, orders:26 },
    ],
  };

  return (
    <div className="space-y-4">

      {/* ── Back & Title ──────────────────────── */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl bg-[var(--bg-card)]
                     border border-[var(--border-primary)]
                     text-[var(--text-secondary)]
                     hover:text-[var(--text-primary)]
                     hover:border-[var(--border-secondary)]
                     transition-all duration-200"
        >
          <ArrowLeft size={18}/>
        </button>

        {loading ? (
          <Skeleton className="h-8 w-64"/>
        ) : (
          <div className="flex items-center gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-heading font-bold
                               text-[var(--text-primary)]">
                  {stock.symbol}
                </h1>
                <Badge variant="NSE" size="sm">{stock.exchange}</Badge>
                <Badge variant="CNC" size="sm">{stock.sector}</Badge>
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                {stock.name}
              </p>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3 ml-2">
              <span className="text-3xl font-mono font-bold
                               text-[var(--text-primary)]">
                {formatINR(stock.price)}
              </span>
              <span className={`flex items-center gap-1 text-sm
                               font-mono font-semibold ${getPnLColor(change)}`}>
                {isUp ? <ArrowUpRight size={16}/> : <ArrowDownRight size={16}/>}
                {change >= 0 ? '+' : ''}{change.toFixed(2)}
                {' '}({formatPercent(changePct)})
              </span>
            </div>

            {/* Watchlist toggle */}
            <button
              onClick={() => {
                setWatchlisted(!watchlisted);
                toast.success(watchlisted
                  ? `${symbol} removed from watchlist`
                  : `${symbol} added to watchlist`);
              }}
              className="ml-auto p-2 rounded-xl bg-[var(--bg-card)]
                         border border-[var(--border-primary)]
                         transition-all duration-200
                         hover:border-amber-500/50"
            >
              {watchlisted
                ? <Star size={18} className="text-amber-400 fill-amber-400"/>
                : <StarOff size={18} className="text-[var(--text-tertiary)]"/>}
            </button>
          </div>
        )}
      </div>

      {/* ── Main Layout ──────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

        {/* ── Chart area (2/3) ──────────────── */}
        <div className="xl:col-span-2 space-y-4">

          {/* Chart card */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-primary)]
                          rounded-2xl overflow-hidden">
            {/* Interval selector */}
            <div className="flex items-center justify-between px-5 py-3
                            border-b border-[var(--border-primary)]">
              <div className="flex gap-1">
                {INTERVALS.map((iv) => (
                  <button key={iv}
                    onClick={() => setInterval(iv)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold
                               transition-all duration-200
                               ${interval === iv
                                 ? 'bg-[var(--accent-primary)] text-white'
                                 : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'}`}>
                    {iv}
                  </button>
                ))}
              </div>

              <div className="hidden sm:flex gap-4 text-xs font-mono
                             text-[var(--text-tertiary)]">
                {stock && [
                  { l:'O', v: stock.open  },
                  { l:'H', v: stock.high  },
                  { l:'L', v: stock.low   },
                  { l:'C', v: stock.price },
                ].map(({ l, v }) => (
                  <span key={l}>
                    <span className="text-[var(--text-tertiary)]">{l}: </span>
                    <span className="text-[var(--text-primary)] font-semibold">
                      {v?.toFixed(2)}
                    </span>
                  </span>
                ))}
              </div>
            </div>

            <div className="p-2">
              {loading
                ? <Skeleton className="h-96 w-full rounded-xl"/>
                : <CandlestickChart stock={stock} interval={interval}/>
              }
            </div>
          </div>

          {/* Info tabs */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-primary)]
                          rounded-2xl overflow-hidden">
            {/* Tab nav */}
            <div className="flex border-b border-[var(--border-primary)]
                            overflow-x-auto scrollbar-none">
              {INFO_TABS.map((tab) => (
                <button key={tab.key}
                  onClick={() => setInfoTab(tab.key)}
                  className={`px-5 py-3 text-sm font-medium whitespace-nowrap
                             border-b-2 transition-all duration-200
                             ${infoTab === tab.key
                               ? 'border-[var(--accent-primary)] text-[var(--accent-primary)]'
                               : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}>
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="p-5">
              {/* Overview */}
              {infoTab === 'overview' && stock && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {[
                    { label:'Previous Close', value: formatINR(stock.prevClose) },
                    { label:'Open',           value: formatINR(stock.open)      },
                    { label:'Day High',       value: formatINR(stock.high),
                      color: 'text-[var(--profit)]' },
                    { label:'Day Low',        value: formatINR(stock.low),
                      color: 'text-[var(--loss)]'   },
                    { label:'Volume',         value: formatVolume(stock.volume) },
                    { label:'52W High',       value: formatINR(stock.week52H),
                      color: 'text-[var(--profit)]' },
                    { label:'52W Low',        value: formatINR(stock.week52L),
                      color: 'text-[var(--loss)]'   },
                    { label:'Lot Size',       value: stock.lot               },
                    { label:'Market Cap',     value: formatINR(stock.marketCap, { compact:true }) },
                  ].map(({ label, value, color }) => (
                    <div key={label}
                         className="p-3 rounded-xl bg-[var(--bg-tertiary)]
                                    border border-[var(--border-primary)]">
                      <p className="text-[10px] text-[var(--text-tertiary)]
                                    uppercase tracking-wider mb-1">{label}</p>
                      <p className={`text-sm font-mono font-semibold
                                     ${color || 'text-[var(--text-primary)]'}`}>
                        {value}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Fundamentals */}
              {infoTab === 'fundamentals' && stock && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label:'P/E Ratio',    value: stock.pe?.toFixed(2)  ?? 'N/A' },
                    { label:'P/B Ratio',    value: stock.pb?.toFixed(2)  ?? 'N/A' },
                    { label:'EPS (₹)',      value: stock.eps?.toFixed(2) ?? 'N/A' },
                    { label:'Div Yield %',  value: stock.div?.toFixed(2) ?? 'N/A' },
                    { label:'Market Cap',   value: formatINR(stock.marketCap, { compact:true }) },
                    { label:'52W Range',    value: `${formatINR(stock.week52L)} – ${formatINR(stock.week52H)}` },
                    { label:'Exchange',     value: stock.exchange },
                    { label:'Sector',       value: stock.sector   },
                  ].map(({ label, value }) => (
                    <div key={label}
                         className="p-3 rounded-xl bg-[var(--bg-tertiary)]
                                    border border-[var(--border-primary)]">
                      <p className="text-[10px] text-[var(--text-tertiary)]
                                    uppercase tracking-wider mb-1">{label}</p>
                      <p className="text-sm font-mono font-semibold
                                    text-[var(--text-primary)]">{value}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Market Depth */}
              {infoTab === 'depth' && (
                <div className="grid grid-cols-2 gap-4">
                  {/* Bids */}
                  <div>
                    <p className="text-xs font-bold text-[var(--profit)]
                                  uppercase tracking-wider mb-2">
                      Bids (Buy)
                    </p>
                    <table className="w-full text-xs font-mono">
                      <thead>
                        <tr>
                          {['Orders','Qty','Price'].map((h) => (
                            <th key={h}
                                className="text-[10px] uppercase tracking-wider
                                           text-[var(--text-tertiary)] pb-1
                                           font-semibold text-right first:text-left">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {depth.bids.map((b, i) => (
                          <tr key={i}
                              className="border-t border-[var(--border-primary)]">
                            <td className="py-1.5 text-[var(--text-tertiary)]">
                              {b.orders}
                            </td>
                            <td className="py-1.5 text-right text-[var(--text-primary)]">
                              {b.qty.toLocaleString('en-IN')}
                            </td>
                            <td className="py-1.5 text-right font-semibold
                                           text-[var(--profit)]">
                              {b.price.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Asks */}
                  <div>
                    <p className="text-xs font-bold text-[var(--loss)]
                                  uppercase tracking-wider mb-2">
                      Asks (Sell)
                    </p>
                    <table className="w-full text-xs font-mono">
                      <thead>
                        <tr>
                          {['Price','Qty','Orders'].map((h) => (
                            <th key={h}
                                className="text-[10px] uppercase tracking-wider
                                           text-[var(--text-tertiary)] pb-1
                                           font-semibold text-left last:text-right">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {depth.asks.map((a, i) => (
                          <tr key={i}
                              className="border-t border-[var(--border-primary)]">
                            <td className="py-1.5 font-semibold text-[var(--loss)]">
                              {a.price.toFixed(2)}
                            </td>
                            <td className="py-1.5 text-center text-[var(--text-primary)]">
                              {a.qty.toLocaleString('en-IN')}
                            </td>
                            <td className="py-1.5 text-right text-[var(--text-tertiary)]">
                              {a.orders}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* News */}
              {infoTab === 'news' && (
                <div className="space-y-3">
                  {[
                    { time:'2h ago',  title:`${symbol} Q4 results beat estimates; revenue up 12% YoY`,
                      source:'Economic Times', tag:'Earnings' },
                    { time:'4h ago',  title:`Analysts upgrade ${symbol} to BUY with target ₹${
                        stock ? Math.round(stock.price * 1.15) : '—'}`,
                      source:'Moneycontrol', tag:'Analyst Call' },
                    { time:'1d ago',  title:`NSE announces changes in F&O margin requirements`,
                      source:'NSE India', tag:'Regulatory' },
                    { time:'2d ago',  title:`${stock?.sector || ''} sector outlook: FY26 growth estimates revised upward`,
                      source:'Bloomberg Quint', tag:'Sector Update' },
                  ].map((news, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity:0, y:10 }}
                      animate={{ opacity:1, y:0 }}
                      transition={{ delay: i * 0.07 }}
                      className="flex gap-3 p-3 rounded-xl
                                 bg-[var(--bg-tertiary)] border border-[var(--border-primary)]
                                 hover:border-[var(--border-secondary)]
                                 cursor-pointer transition-all duration-200"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--text-primary)]
                                      leading-snug mb-1">{news.title}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-[var(--text-tertiary)]">
                            {news.source}
                          </span>
                          <span className="text-[var(--text-tertiary)]">·</span>
                          <span className="text-xs text-[var(--text-tertiary)]">
                            {news.time}
                          </span>
                          <span className="ml-auto px-2 py-0.5 rounded-md
                                           bg-[var(--accent-primary)]/10
                                           text-[var(--accent-primary)] text-[10px]
                                           font-semibold border border-[var(--accent-primary)]/20">
                            {news.tag}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Order Form (1/3) ──────────────── */}
        <div className="space-y-4">
          {loading
            ? <Skeleton className="h-[500px] rounded-2xl"/>
            : <OrderForm stock={stock}/>
          }

          {/* Quick Stats */}
          {!loading && stock && (
            <div className="bg-[var(--bg-card)] border border-[var(--border-primary)]
                            rounded-2xl p-4">
              <h3 className="text-xs font-bold uppercase tracking-wider
                             text-[var(--text-tertiary)] mb-3">
                52-Week Range
              </h3>
              {/* Range bar */}
              <div className="relative h-1.5 bg-[var(--bg-tertiary)]
                              rounded-full mb-2">
                <div
                  className="absolute top-0 left-0 h-full rounded-full
                             bg-gradient-to-r from-[var(--loss)] to-[var(--profit)]"
                  style={{
                    width: `${((stock.price - stock.week52L) /
                               (stock.week52H - stock.week52L)) * 100}%`,
                  }}
                />
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-3 h-3
                             rounded-full bg-white border-2 border-[var(--accent-primary)]
                             shadow-[0_0_6px_rgba(0,82,255,0.5)]"
                  style={{
                    left: `calc(${((stock.price - stock.week52L) /
                              (stock.week52H - stock.week52L)) * 100}% - 6px)`,
                  }}
                />
              </div>
              <div className="flex justify-between text-xs font-mono">
                <span className="text-[var(--loss)]">
                  {formatINR(stock.week52L)}
                </span>
                <span className="text-[var(--text-tertiary)]">LTP</span>
                <span className="text-[var(--profit)]">
                  {formatINR(stock.week52H)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StockDetail;