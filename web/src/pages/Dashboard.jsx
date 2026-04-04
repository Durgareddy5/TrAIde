import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  TrendingUp, TrendingDown, Wallet, BarChart3,
  ArrowUpRight, ArrowDownRight, RefreshCw,
  IndianRupee, Activity, Eye, Plus, Minus,
  ChevronRight, Zap, Clock, AlertCircle,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts';
import useAuthStore      from '@/store/authStore';
import tradingService    from '@/services/tradingService';
import { formatINR, formatPercent, formatDate, getPnLColor } from '@/utils/formatters';
import Skeleton, { SkeletonCard } from '@/components/ui/Skeleton';
import Badge from '@/components/ui/Badge';

/* ─── Animated summary card ────────────────── */
const SummaryCard = ({ title, value, change, changeLabel, icon: Icon,
                       color = 'blue', loading, delay = 0 }) => {
  const colorMap = {
    blue:  { bg: 'from-blue-500/10 to-blue-600/5',   icon: 'text-blue-400',  border: 'border-blue-500/20' },
    green: { bg: 'from-green-500/10 to-green-600/5',  icon: 'text-[var(--profit)]', border: 'border-green-500/20' },
    red:   { bg: 'from-red-500/10 to-red-600/5',      icon: 'text-[var(--loss)]',   border: 'border-red-500/20' },
    purple:{ bg: 'from-purple-500/10 to-purple-600/5',icon: 'text-purple-400', border: 'border-purple-500/20' },
  };
  const c = colorMap[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className={`relative rounded-xl p-5 border ${c.border}
                  bg-gradient-to-br ${c.bg}
                  hover:border-opacity-40 transition-all duration-300
                  overflow-hidden group`}
    >
      {/* Glow on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100
                      transition-opacity duration-300 pointer-events-none
                      bg-[var(--gradient-glow)]" />

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-8 w-36" />
          <Skeleton className="h-3 w-24" />
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-medium text-[var(--text-secondary)]
                          uppercase tracking-wider">
              {title}
            </p>
            <div className={`p-2 rounded-lg bg-[var(--bg-tertiary)] ${c.icon}`}>
              <Icon size={18} />
            </div>
          </div>
          <p className="text-2xl font-heading font-bold text-[var(--text-primary)] mb-1">
            {value}
          </p>
          {change !== undefined && (
            <div className={`flex items-center gap-1 text-xs font-mono
                            font-semibold ${getPnLColor(change)}`}>
              {change >= 0
                ? <ArrowUpRight size={14} />
                : <ArrowDownRight size={14} />
              }
              <span>{formatPercent(Math.abs(change))}</span>
              {changeLabel && (
                <span className="text-[var(--text-tertiary)] font-normal ml-1">
                  {changeLabel}
                </span>
              )}
            </div>
          )}
        </>
      )}
    </motion.div>
  );
};

/* ─── Index pill ────────────────────────────── */
const IndexPill = ({ name, value, change, changePercent }) => (
  <div className="flex items-center justify-between px-4 py-3
                  rounded-xl bg-[var(--bg-card)] border border-[var(--border-primary)]
                  hover:border-[var(--border-secondary)] transition-all duration-200
                  cursor-pointer group">
    <div>
      <p className="text-xs text-[var(--text-tertiary)] mb-0.5">{name}</p>
      <p className="font-mono font-semibold text-sm text-[var(--text-primary)]">
        {value?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
      </p>
    </div>
    <div className={`text-right ${getPnLColor(changePercent)}`}>
      <p className="text-xs font-mono font-semibold">
        {changePercent >= 0 ? '+' : ''}{changePercent?.toFixed(2)}%
      </p>
      <p className="text-xs font-mono text-[var(--text-tertiary)]">
        {change >= 0 ? '+' : ''}{change?.toFixed(2)}
      </p>
    </div>
  </div>
);

/* ─── Portfolio chart tooltip ───────────────── */
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[var(--bg-elevated)] border border-[var(--border-primary)]
                    rounded-xl px-4 py-3 shadow-[var(--shadow-lg)]">
      <p className="text-xs text-[var(--text-tertiary)] mb-1">{label}</p>
      <p className="text-sm font-mono font-bold text-[var(--text-primary)]">
        {formatINR(payload[0].value)}
      </p>
    </div>
  );
};

/* ─── Holding row ───────────────────────────── */
const HoldingRow = ({ holding, onClick }) => (
  <motion.tr
    whileHover={{ backgroundColor: 'var(--bg-card-hover)' }}
    onClick={onClick}
    className="border-b border-[var(--border-primary)] cursor-pointer
               transition-colors duration-150"
  >
    <td className="px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-[var(--accent-primary)]/10
                        flex items-center justify-center">
          <span className="text-xs font-bold text-[var(--accent-primary)]">
            {holding.symbol[0]}
          </span>
        </div>
        <div>
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            {holding.symbol}
          </p>
          <p className="text-xs text-[var(--text-tertiary)] truncate max-w-[120px]">
            {holding.stock_name}
          </p>
        </div>
      </div>
    </td>
    <td className="px-4 py-3 text-right font-mono text-sm
                   text-[var(--text-primary)]">
      {holding.quantity}
    </td>
    <td className="px-4 py-3 text-right font-mono text-sm
                   text-[var(--text-primary)]">
      {formatINR(holding.average_price)}
    </td>
    <td className="px-4 py-3 text-right font-mono text-sm
                   text-[var(--text-primary)]">
      {formatINR(holding.current_price || 0)}
    </td>
    <td className="px-4 py-3 text-right">
      <span className={`text-sm font-mono font-semibold
                        ${getPnLColor(holding.pnl)}`}>
        {holding.pnl >= 0 ? '+' : ''}{formatINR(holding.pnl || 0)}
      </span>
      <p className={`text-xs font-mono ${getPnLColor(holding.pnl_percentage)}`}>
        {formatPercent(holding.pnl_percentage || 0)}
      </p>
    </td>
  </motion.tr>
);

/* ────────────────────────────────────────────
   MAIN DASHBOARD COMPONENT
────────────────────────────────────────────── */
const Dashboard = () => {
  const navigate           = useNavigate();
  const { user }           = useAuthStore();
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [funds, setFunds]             = useState(null);
  const [summary, setSummary]         = useState(null);
  const [holdings, setHoldings]       = useState([]);
  const [positions, setPositions]     = useState([]);
  const [indices, setIndices]         = useState([]);
  const [chartData, setChartData]     = useState([]);

  /* ── Mock chart data ── */
  const generateChartData = () =>
    Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 3600 * 1000)
             .toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
      value: 10000000 + Math.random() * 2000000 - 1000000,
    }));

  /* ── Mock indices ── */
  const mockIndices = [
    { name: 'NIFTY 50',    value: 23519.35, change: 142.65,  changePercent:  0.61 },
    { name: 'SENSEX',      value: 77341.08, change: 498.24,  changePercent:  0.65 },
    { name: 'BANK NIFTY',  value: 50892.45, change: -187.30, changePercent: -0.37 },
    { name: 'NIFTY IT',    value: 37284.90, change: 312.50,  changePercent:  0.84 },
    { name: 'INDIA VIX',   value: 13.42,    change: -0.58,   changePercent: -4.14 },
    { name: 'NIFTY PHARMA',value: 18942.30, change: 88.70,   changePercent:  0.47 },
  ];

  /* ── Mock holdings ── */
  const mockHoldings = [
    { symbol: 'RELIANCE',  stock_name: 'Reliance Industries Ltd', quantity: 150,
      average_price: 1250.50, current_price: 1285.50,
      pnl: 5250, pnl_percentage: 2.80 },
    { symbol: 'TCS',       stock_name: 'Tata Consultancy Services Ltd', quantity: 50,
      average_price: 3480.00, current_price: 3542.80,
      pnl: 3140, pnl_percentage: 1.80 },
    { symbol: 'HDFCBANK',  stock_name: 'HDFC Bank Ltd', quantity: 200,
      average_price: 1690.00, current_price: 1672.30,
      pnl: -3540, pnl_percentage: -1.05 },
    { symbol: 'INFY',      stock_name: 'Infosys Ltd', quantity: 100,
      average_price: 1475.00, current_price: 1495.25,
      pnl: 2025, pnl_percentage: 1.37 },
    { symbol: 'WIPRO',     stock_name: 'Wipro Ltd', quantity: 300,
      average_price: 485.00, current_price: 472.65,
      pnl: -3705, pnl_percentage: -2.55 },
  ];

  const fetchData = async () => {
    try {
      setRefreshing(true);
      /* In production replace mocks with real API calls:
         const [fundsRes, summaryRes, holdingsRes] = await Promise.all([
           tradingService.getFunds(),
           tradingService.getPortfolioSummary(),
           tradingService.getHoldings(),
         ]);
      */
      await new Promise((r) => setTimeout(r, 800));
      setFunds({ available_balance: 8542000, total_balance: 10000000 });
      setSummary({
        total_invested: 12680000,
        current_value: 13042500,
        total_pnl: 362500,
        total_pnl_percentage: 2.86,
        day_change: 127800,
        day_change_percentage: 0.99,
      });
      setHoldings(mockHoldings);
      setIndices(mockIndices);
      setChartData(generateChartData());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good Morning' :
    hour < 17 ? 'Good Afternoon' : 'Good Evening';

  return (
    <div className="space-y-6 stagger-children">

      {/* ── Header ──────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-heading font-bold text-[var(--text-primary)]"
          >
            {greeting},{' '}
            <span className="bg-gradient-to-r from-[#0052FF] to-[#7C3AED]
                             bg-clip-text text-transparent">
              {user?.first_name || 'Trader'}
            </span>{' '}
            👋
          </motion.h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            {new Date().toLocaleDateString('en-IN', {
              weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
            })}
          </p>
        </div>

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={fetchData}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 rounded-xl
                     bg-[var(--bg-card)] border border-[var(--border-primary)]
                     text-sm text-[var(--text-secondary)]
                     hover:border-[var(--border-secondary)]
                     hover:text-[var(--text-primary)]
                     disabled:opacity-50 transition-all duration-200"
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          <span className="hidden sm:inline">
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </span>
        </motion.button>
      </div>

      {/* ── Summary Cards ───────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <SummaryCard
          title="Available Funds"
          value={loading ? '—' : formatINR(funds?.available_balance, { compact: true })}
          icon={Wallet}
          color="blue"
          loading={loading}
          delay={0.05}
        />
        <SummaryCard
          title="Portfolio Value"
          value={loading ? '—' : formatINR(summary?.current_value, { compact: true })}
          change={summary?.total_pnl_percentage}
          changeLabel="all time"
          icon={BarChart3}
          color="purple"
          loading={loading}
          delay={0.10}
        />
        <SummaryCard
          title="Total P&L"
          value={loading ? '—' : formatINR(summary?.total_pnl, { compact: true })}
          change={summary?.total_pnl_percentage}
          changeLabel="all time"
          icon={summary?.total_pnl >= 0 ? TrendingUp : TrendingDown}
          color={summary?.total_pnl >= 0 ? 'green' : 'red'}
          loading={loading}
          delay={0.15}
        />
        <SummaryCard
          title="Today's P&L"
          value={loading ? '—' : formatINR(summary?.day_change, { compact: true })}
          change={summary?.day_change_percentage}
          changeLabel="today"
          icon={Activity}
          color={summary?.day_change >= 0 ? 'green' : 'red'}
          loading={loading}
          delay={0.20}
        />
      </div>

      {/* ── Main Content Grid ────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* ── Portfolio Chart (2/3 width) ──────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="xl:col-span-2 bg-[var(--bg-card)]
                     border border-[var(--border-primary)]
                     rounded-2xl p-5"
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-heading font-semibold
                             text-[var(--text-primary)]">
                Portfolio Performance
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                30-day portfolio value trend
              </p>
            </div>
            <div className="flex gap-1.5">
              {['1W', '1M', '3M', '6M', '1Y'].map((t) => (
                <button
                  key={t}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium
                             text-[var(--text-tertiary)]
                             hover:bg-[var(--bg-tertiary)]
                             hover:text-[var(--text-primary)]
                             transition-all duration-200
                             first:bg-[var(--accent-primary)]/10
                             first:text-[var(--accent-primary)]"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <Skeleton className="h-56 w-full rounded-xl" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData}
                margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="portfolioGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"   stopColor="#0052FF" stopOpacity={0.25} />
                    <stop offset="95%"  stopColor="#0052FF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--border-primary)"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: 'var(--text-tertiary)',
                          fontFamily: 'JetBrains Mono' }}
                  axisLine={false} tickLine={false}
                  interval={4}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: 'var(--text-tertiary)',
                          fontFamily: 'JetBrains Mono' }}
                  axisLine={false} tickLine={false}
                  tickFormatter={(v) =>
                    `₹${(v / 10000000).toFixed(1)}Cr`}
                  width={55}
                />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#0052FF"
                  strokeWidth={2}
                  fill="url(#portfolioGrad)"
                  dot={false}
                  activeDot={{ r: 5, fill: '#0052FF',
                               stroke: 'var(--bg-card)', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* ── Market Indices (1/3 width) ───────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-[var(--bg-card)] border border-[var(--border-primary)]
                     rounded-2xl p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-heading font-semibold
                           text-[var(--text-primary)]">
              Market Indices
            </h2>
            <button
              onClick={() => navigate('/markets')}
              className="flex items-center gap-1 text-xs
                         text-[var(--accent-primary)]
                         hover:underline transition-all"
            >
              View all <ChevronRight size={14} />
            </button>
          </div>

          <div className="space-y-2">
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 rounded-xl" />
                ))
              : indices.map((idx) => (
                  <IndexPill key={idx.name} {...idx} />
                ))
            }
          </div>
        </motion.div>
      </div>

      {/* ── Holdings Table + Quick Actions ──────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Holdings table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="xl:col-span-2 bg-[var(--bg-card)]
                     border border-[var(--border-primary)]
                     rounded-2xl overflow-hidden"
        >
          <div className="flex items-center justify-between px-5 py-4
                          border-b border-[var(--border-primary)]">
            <h2 className="text-base font-heading font-semibold
                           text-[var(--text-primary)]">
              Holdings
            </h2>
            <button
              onClick={() => navigate('/portfolio')}
              className="flex items-center gap-1 text-xs
                         text-[var(--accent-primary)] hover:underline"
            >
              View all <ChevronRight size={14} />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[var(--bg-secondary)]
                               border-b border-[var(--border-primary)]">
                  {['Stock', 'Qty', 'Avg Price', 'LTP', 'P&L'].map((h) => (
                    <th key={h}
                        className="px-4 py-3 text-left text-[10px] font-bold
                                   uppercase tracking-[0.08em]
                                   text-[var(--text-tertiary)]">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading
                  ? Array.from({ length: 4 }).map((_, i) => (
                      <tr key={i}
                          className="border-b border-[var(--border-primary)]">
                        {[...Array(5)].map((__, j) => (
                          <td key={j} className="px-4 py-3">
                            <Skeleton className="h-4 w-20" />
                          </td>
                        ))}
                      </tr>
                    ))
                  : holdings.slice(0, 5).map((h) => (
                      <HoldingRow
                        key={h.symbol}
                        holding={h}
                        onClick={() => navigate(`/stock/${h.symbol}`)}
                      />
                    ))
                }
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Quick Actions + Positions */}
        <div className="space-y-4">
          {/* Quick Trade */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.40 }}
            className="bg-[var(--bg-card)] border border-[var(--border-primary)]
                       rounded-2xl p-5"
          >
            <h2 className="text-base font-heading font-semibold
                           text-[var(--text-primary)] mb-4">
              Quick Actions
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Buy Stock',  icon: Plus,    color: 'bg-[#0052FF]',    path: '/markets' },
                { label: 'Sell Stock', icon: Minus,   color: 'bg-[var(--loss)]', path: '/orders' },
                { label: 'Add Funds',  icon: IndianRupee, color: 'bg-[var(--profit)]/80', path: '/funds' },
                { label: 'Watchlist',  icon: Eye,     color: 'bg-purple-600',   path: '/watchlist' },
              ].map((a) => (
                <button
                  key={a.label}
                  onClick={() => navigate(a.path)}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl
                             bg-[var(--bg-tertiary)]
                             border border-[var(--border-primary)]
                             hover:border-[var(--border-secondary)]
                             hover:bg-[var(--bg-card-hover)]
                             transition-all duration-200 group"
                >
                  <div className={`p-2 rounded-lg ${a.color}
                                  group-hover:scale-110 transition-transform`}>
                    <a.icon size={16} className="text-white" />
                  </div>
                  <span className="text-xs font-medium text-[var(--text-secondary)]">
                    {a.label}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>

          {/* Open Positions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="bg-[var(--bg-card)] border border-[var(--border-primary)]
                       rounded-2xl p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-heading font-semibold
                             text-[var(--text-primary)]">
                Open Positions
              </h2>
              <button
                onClick={() => navigate('/positions')}
                className="text-xs text-[var(--accent-primary)]
                           hover:underline flex items-center gap-1"
              >
                View all <ChevronRight size={14} />
              </button>
            </div>

            {positions.length === 0 ? (
              <div className="text-center py-6">
                <Activity size={32} className="text-[var(--text-tertiary)]
                                               mx-auto mb-2" />
                <p className="text-sm text-[var(--text-tertiary)]">
                  No open positions
                </p>
                <p className="text-xs text-[var(--text-tertiary)] mt-1">
                  Place an intraday (MIS) order to see positions here
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {positions.slice(0, 3).map((p) => (
                  <div key={p.id}
                       className="flex items-center justify-between
                                  p-3 rounded-xl bg-[var(--bg-tertiary)]">
                    <div>
                      <p className="text-sm font-semibold
                                    text-[var(--text-primary)]">{p.symbol}</p>
                      <p className="text-xs text-[var(--text-tertiary)]">
                        {p.net_quantity} qty · {p.product_type}
                      </p>
                    </div>
                    <div className={`text-right font-mono text-sm
                                    font-semibold ${getPnLColor(p.unrealized_pnl)}`}>
                      {formatINR(p.unrealized_pnl || 0)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* ── Market Alert Banner ──────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex items-center gap-3 p-4 rounded-xl
                   bg-[var(--warning)]/5
                   border border-[var(--warning)]/20"
      >
        <AlertCircle size={18} className="text-[var(--warning)] flex-shrink-0" />
        <p className="text-sm text-[var(--text-secondary)]">
          <span className="font-semibold text-[var(--warning)]">
            Paper Trading Mode:{' '}
          </span>
          All trades are simulated. No real money is involved.
          Virtual balance: {formatINR(funds?.available_balance || 0)}.
        </p>
        <Clock size={16} className="text-[var(--text-tertiary)]
                                    flex-shrink-0 ml-auto" />
      </motion.div>
    </div>
  );
};

export default Dashboard;