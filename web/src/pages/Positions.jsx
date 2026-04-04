import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Activity, TrendingUp, TrendingDown, RefreshCw,
  Clock, AlertTriangle, ArrowUpRight, ArrowDownRight,
  Square,
} from 'lucide-react';
import { formatINR, formatPercent, getPnLColor } from '@/utils/formatters';
import Skeleton from '@/components/ui/Skeleton';
import Badge from '@/components/ui/Badge';
import toast from 'react-hot-toast';

const MOCK_POSITIONS = [
  { id:'p1', symbol:'RELIANCE',  name:'Reliance Industries', exchange:'NSE',
    product_type:'MIS', position_type:'long',
    buy_qty:100, sell_qty:0,  net_qty:100,
    buy_avg:1280.50, sell_avg:0,    current_price:1285.50,
    buy_value:128050, sell_value:0,
    unrealized_pnl:500,   realized_pnl:0, total_pnl:500,
    opened_at: new Date(Date.now() - 2*3600000).toISOString() },
  { id:'p2', symbol:'HDFCBANK',  name:'HDFC Bank',           exchange:'NSE',
    product_type:'MIS', position_type:'long',
    buy_qty:50,  sell_qty:20, net_qty:30,
    buy_avg:1670.00, sell_avg:1675.50, current_price:1672.30,
    buy_value:83500, sell_value:33510,
    unrealized_pnl:69,  realized_pnl:275, total_pnl:344,
    opened_at: new Date(Date.now() - 1*3600000).toISOString() },
  { id:'p3', symbol:'TATAMOTORS',name:'Tata Motors',         exchange:'NSE',
    product_type:'MIS', position_type:'short',
    buy_qty:0,   sell_qty:200, net_qty:-200,
    buy_avg:0,       sell_avg:742.50, current_price:738.90,
    buy_value:0,     sell_value:148500,
    unrealized_pnl:720,   realized_pnl:0, total_pnl:720,
    opened_at: new Date(Date.now() - 3600000).toISOString() },
];

const PositionRow = ({ pos, onSquareOff, delay }) => {
  const up = pos.total_pnl >= 0;
  return (
    <motion.tr
      initial={{ opacity:0, x:-10 }}
      animate={{ opacity:1, x:0 }}
      transition={{ delay, duration:0.3 }}
      className="border-b border-[var(--border-primary)]
                 hover:bg-[var(--bg-card-hover)] transition-colors"
    >
      {/* Stock */}
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center
                          text-sm font-bold flex-shrink-0
                          ${pos.position_type === 'long'
                            ? 'bg-[#0052FF]/10 text-[#0052FF]'
                            : 'bg-[var(--loss)]/10 text-[var(--loss)]'}`}>
            {pos.symbol[0]}
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              {pos.symbol}
            </p>
            <p className="text-xs text-[var(--text-tertiary)] truncate max-w-[120px]">
              {pos.name}
            </p>
          </div>
        </div>
      </td>

      {/* Product + Type */}
      <td className="px-5 py-4">
        <Badge variant={pos.product_type} size="xs">{pos.product_type}</Badge>
        <p className={`text-xs font-mono mt-1
                       ${pos.position_type === 'long'
                         ? 'text-[#0052FF]' : 'text-[var(--loss)]'}`}>
          {pos.position_type.toUpperCase()}
        </p>
      </td>

      {/* Qty */}
      <td className="px-5 py-4 text-right">
        <p className="text-sm font-mono font-medium text-[var(--text-primary)]">
          {Math.abs(pos.net_qty)}
        </p>
        <p className="text-xs text-[var(--text-tertiary)]">
          B:{pos.buy_qty} / S:{pos.sell_qty}
        </p>
      </td>

      {/* Avg prices */}
      <td className="px-5 py-4 text-right">
        <p className="text-sm font-mono text-[var(--text-primary)]">
          {formatINR(pos.buy_avg || pos.sell_avg)}
        </p>
      </td>

      {/* LTP */}
      <td className="px-5 py-4 text-right">
        <p className="text-sm font-mono font-semibold text-[var(--text-primary)]">
          {formatINR(pos.current_price)}
        </p>
      </td>

      {/* P&L */}
      <td className="px-5 py-4 text-right">
        <p className={`text-sm font-mono font-bold ${getPnLColor(pos.total_pnl)}`}>
          {up ? '+' : ''}{formatINR(pos.total_pnl)}
        </p>
        <p className="text-xs text-[var(--text-tertiary)]">
          R:{formatINR(pos.realized_pnl)} / U:{formatINR(pos.unrealized_pnl)}
        </p>
      </td>

      {/* Square off */}
      <td className="px-5 py-4">
        <motion.button
          whileHover={{ scale:1.04 }} whileTap={{ scale:0.96 }}
          onClick={() => onSquareOff(pos)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                     bg-[var(--bg-tertiary)] border border-[var(--border-primary)]
                     text-xs font-semibold text-[var(--text-secondary)]
                     hover:border-[var(--loss)]/50 hover:text-[var(--loss)]
                     hover:bg-[var(--loss-bg)] transition-all duration-200"
        >
          <Square size={12}/> Square Off
        </motion.button>
      </td>
    </motion.tr>
  );
};

const Positions = () => {
  const navigate = useNavigate();
  const [positions, setPositions] = useState([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    setTimeout(() => { setPositions(MOCK_POSITIONS); setLoading(false); }, 600);
  }, []);

  const totalPnL     = positions.reduce((s, p) => s + p.total_pnl, 0);
  const totalBuyVal  = positions.reduce((s, p) => s + p.buy_value, 0);

  const handleSquareOff = (pos) => {
    setPositions((prev) => prev.filter((p) => p.id !== pos.id));
    toast.success(`${pos.symbol} position squared off! P&L: ${
      pos.total_pnl >= 0 ? '+' : ''
    }${formatINR(pos.total_pnl)}`);
  };

  const handleSquareOffAll = () => {
    const totalPL = positions.reduce((s, p) => s + p.total_pnl, 0);
    setPositions([]);
    toast.success(`All positions squared off! Total P&L: ${
      totalPL >= 0 ? '+' : ''
    }${formatINR(totalPL)}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-[var(--text-primary)]">
            Positions
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Open intraday (MIS) positions — auto square-off at 3:20 PM
          </p>
        </div>

        <div className="flex items-center gap-3">
          {positions.length > 0 && (
            <motion.button
              whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
              onClick={handleSquareOffAll}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl
                         bg-[var(--loss)] text-white text-sm font-semibold
                         shadow-[0_0_15px_rgba(255,23,68,0.2)]"
            >
              <Square size={16}/> Square Off All
            </motion.button>
          )}
          <button
            onClick={() => { setLoading(true);
              setTimeout(() => { setPositions(MOCK_POSITIONS); setLoading(false); }, 600); }}
            className="p-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-primary)]
                       text-[var(--text-secondary)] hover:text-[var(--text-primary)]
                       hover:border-[var(--border-secondary)] transition-all"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''}/>
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label:'Open Positions', value: positions.length,    icon: Activity,  color: 'blue'  },
          { label:'Total P&L',      value: formatINR(totalPnL), icon: totalPnL >= 0 ? TrendingUp : TrendingDown,
            color: totalPnL >= 0 ? 'green' : 'red' },
          { label:'Buy Value',      value: formatINR(totalBuyVal, { compact:true }),
            icon: BarChart3 ?? Activity, color: 'purple' },
        ].map((card, i) => {
          const colorMap = {
            blue:  'from-blue-500/10  border-blue-500/20  text-blue-400',
            green: 'from-green-500/10 border-green-500/20 text-[var(--profit)]',
            red:   'from-red-500/10   border-red-500/20   text-[var(--loss)]',
            purple:'from-purple-500/10 border-purple-500/20 text-purple-400',
          };
          return (
            <motion.div
              key={card.label}
              initial={{ opacity:0, y:20 }}
              animate={{ opacity:1, y:0 }}
              transition={{ delay: i * 0.08 }}
              className={`rounded-xl p-5 border bg-gradient-to-br
                          ${colorMap[card.color]}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <card.icon size={16}/>
                <span className="text-xs font-medium uppercase tracking-wider">
                  {card.label}
                </span>
              </div>
              <p className="text-2xl font-heading font-bold">{card.value}</p>
            </motion.div>
          );
        })}
      </div>

      {/* MIS Warning */}
      <div className="flex items-start gap-3 p-4 rounded-xl
                      bg-amber-500/5 border border-amber-500/20">
        <AlertTriangle size={18} className="text-amber-400 flex-shrink-0 mt-0.5"/>
        <div>
          <p className="text-sm font-semibold text-amber-400">
            MIS Auto Square-Off
          </p>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            All open MIS positions will be automatically squared off at
            <strong className="text-[var(--text-primary)]"> 3:20 PM IST</strong>.
            Please close positions manually before that to avoid square-off charges.
          </p>
        </div>
      </div>

      {/* Positions Table */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-primary)]
                      rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[var(--bg-secondary)]
                             border-b border-[var(--border-primary)]">
                {['Stock','Product/Type','Net Qty','Avg Price',
                  'LTP','P&L','Action'].map((h) => (
                  <th key={h}
                      className={`px-5 py-3 text-[10px] font-bold uppercase
                                 tracking-[0.08em] text-[var(--text-tertiary)]
                                 ${['Net Qty','Avg Price','LTP','P&L'].includes(h)
                                   ? 'text-right' : 'text-left'}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i}
                        className="border-b border-[var(--border-primary)]">
                      {[...Array(7)].map((__, j) => (
                        <td key={j} className="px-5 py-4">
                          <Skeleton className="h-4 w-20"/>
                        </td>
                      ))}
                    </tr>
                  ))
                : positions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-16 text-center">
                      <Activity size={40}
                        className="text-[var(--text-tertiary)] mx-auto mb-3"/>
                      <p className="text-sm text-[var(--text-tertiary)]">
                        No open intraday positions
                      </p>
                      <p className="text-xs text-[var(--text-tertiary)] mt-1">
                        Place a MIS order to see positions here
                      </p>
                    </td>
                  </tr>
                ) : positions.map((pos, i) => (
                    <PositionRow
                      key={pos.id}
                      pos={pos}
                      delay={i * 0.06}
                      onSquareOff={handleSquareOff}
                    />
                  ))
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Positions;