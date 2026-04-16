import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RefreshCw, Search, ChevronDown,
  TrendingUp, TrendingDown,
} from 'lucide-react';

import tradingService from '@/services/tradingService';
import { formatINR, formatDate, getPnLColor } from '@/utils/formatters';
import Badge from '@/components/ui/Badge';
import Skeleton from '@/components/ui/Skeleton';

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'buy', label: 'Buy' },
  { key: 'sell', label: 'Sell' },
];

const TradeRow = ({ trade }) => {
  const [open, setOpen] = useState(false);
  const isBuy = trade.transaction_type === 'buy';

  return (
    <>
      <motion.tr
        layout
        onClick={() => setOpen(!open)}
        className="border-b border-[var(--border-primary)] cursor-pointer
                   hover:bg-[var(--bg-card-hover)] transition"
      >
        {/* Symbol */}
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold
              ${isBuy ? 'bg-blue-500/10 text-blue-400' : 'bg-red-500/10 text-red-400'}`}>
              {trade.symbol?.[0]}
            </div>
            <div>
              <p className="text-sm font-semibold">{trade.symbol}</p>
              <p className="text-xs text-[var(--text-tertiary)]">{trade.exchange}</p>
            </div>
          </div>
        </td>

        {/* Type */}
        <td className="px-4 py-3">
          <Badge variant={isBuy ? 'buy' : 'sell'} size="xs">
            {trade.transaction_type}
          </Badge>
        </td>

        {/* Qty */}
        <td className="px-4 py-3 text-right font-mono">
          {trade.quantity}
        </td>

        {/* Price */}
        <td className="px-4 py-3 text-right font-mono">
          {formatINR(trade.price)}
        </td>

        {/* Total */}
        <td className="px-4 py-3 text-right font-mono">
          {formatINR(trade.total_value)}
        </td>

        {/* Charges */}
        <td className="px-4 py-3 text-right font-mono text-[var(--loss)]">
          {formatINR(trade.total_charges)}
        </td>

        {/* Net */}
        <td className="px-4 py-3 text-right font-mono font-bold">
          {formatINR(trade.net_value)}
        </td>

        {/* Expand */}
        <td className="px-4 py-3 text-center">
          <ChevronDown className={`${open ? 'rotate-180' : ''}`} size={16} />
        </td>
      </motion.tr>

      <AnimatePresence>
        {open && (
          <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <td colSpan={8} className="px-6 py-4 bg-[var(--bg-secondary)]">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-[var(--text-tertiary)]">Trade ID</p>
                  <p className="font-mono text-sm">{trade.trade_number}</p>
                </div>
                <div>
                  <p className="text-xs text-[var(--text-tertiary)]">Order ID</p>
                  <p className="font-mono text-sm">{trade.order_id}</p>
                </div>
                <div>
                  <p className="text-xs text-[var(--text-tertiary)]">Executed</p>
                  <p className="font-mono text-sm">
                    {formatDate(trade.executed_at, 'datetime')}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[var(--text-tertiary)]">Product</p>
                  <p className="font-mono text-sm">{trade.product_type}</p>
                </div>
              </div>
            </td>
          </motion.tr>
        )}
      </AnimatePresence>
    </>
  );
};

const Trades = () => {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');

  const fetchTrades = async () => {
    try {
      setLoading(true);

      const res = await tradingService.getTradeLogs();

      console.log("TRADES:", res);

      const data = res.data?.trades || [];

      setTrades(data);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrades();
  }, []);

  const filtered = trades.filter((t) => {
    const matchTab = tab === 'all' || t.transaction_type === tab;
    const matchSearch = t.symbol?.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex justify-between">
        <h1 className="text-2xl font-bold">Trades</h1>

        <button onClick={fetchTrades} className="flex gap-2 items-center">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Tabs + Search */}
      <div className="flex items-center gap-3">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3 py-1 rounded-lg text-sm
              ${tab === t.key ? 'bg-blue-500/20 text-blue-400' : ''}`}
          >
            {t.label}
          </button>
        ))}

        <div className="ml-auto relative">
          <Search size={14} className="absolute left-2 top-2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-7 pr-3 py-1 text-sm rounded bg-[var(--bg-input)]"
            placeholder="Search"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-[var(--bg-card)] rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="text-xs text-[var(--text-tertiary)]">
              {['Symbol','Type','Qty','Price','Value','Charges','Net',''].map(h => (
                <th key={h} className="px-4 py-3 text-left">{h}</th>
              ))}
            </tr>
          </thead>

          <tbody>
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}><td colSpan={8}><Skeleton className="h-6 w-full" /></td></tr>
                ))
              : filtered.map((t) => <TradeRow key={t.id} trade={t} />)
            }
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Trades;