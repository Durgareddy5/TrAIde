import React from 'react';
import { cn } from '@/utils/cn';
import { formatPrice, formatPercent, getPnLColor } from '@/utils/formatters';
import { TrendingUp, TrendingDown } from 'lucide-react';

const MOCK_TICKER_DATA = [
  { symbol: 'NIFTY 50', price: 23519.35, change: 142.65, changePercent: 0.61 },
  { symbol: 'SENSEX', price: 77341.08, change: 498.24, changePercent: 0.65 },
  { symbol: 'BANK NIFTY', price: 50892.45, change: -187.30, changePercent: -0.37 },
  { symbol: 'RELIANCE', price: 1285.50, change: 12.35, changePercent: 0.97 },
  { symbol: 'TCS', price: 3542.80, change: -28.15, changePercent: -0.79 },
  { symbol: 'HDFCBANK', price: 1672.30, change: 15.60, changePercent: 0.94 },
  { symbol: 'INFY', price: 1495.25, change: 8.40, changePercent: 0.56 },
  { symbol: 'ICICIBANK', price: 1289.45, change: -5.20, changePercent: -0.40 },
  { symbol: 'ITC', price: 442.85, change: 3.70, changePercent: 0.84 },
  { symbol: 'TATAMOTORS', price: 738.90, change: -12.55, changePercent: -1.67 },
  { symbol: 'BHARTIARTL', price: 1628.75, change: 22.30, changePercent: 1.39 },
  { symbol: 'SBIN', price: 812.40, change: 6.85, changePercent: 0.85 },
  { symbol: 'WIPRO', price: 472.65, change: -3.10, changePercent: -0.65 },
  { symbol: 'SUNPHARMA', price: 1812.30, change: 24.50, changePercent: 1.37 },
  { symbol: 'LT', price: 3542.15, change: -45.20, changePercent: -1.26 },
  { symbol: 'INDIA VIX', price: 13.42, change: -0.58, changePercent: -4.14 },
];

const TickerItem = ({ data }) => {
  const isPositive = data.change >= 0;

  return (
    <div className="flex items-center gap-2 px-4 py-1 whitespace-nowrap">
      <span className="text-xs font-semibold text-[var(--text-primary)]">
        {data.symbol}
      </span>
      <span className="text-xs font-mono text-[var(--text-primary)]">
        {formatPrice(data.price)}
      </span>
      <span className={cn(
        'flex items-center gap-0.5 text-xs font-mono',
        isPositive ? 'text-[var(--profit)]' : 'text-[var(--loss)]'
      )}>
        {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
        {formatPercent(data.changePercent)}
      </span>
      <span className="text-[var(--border-secondary)] mx-1">│</span>
    </div>
  );
};

const StockTicker = ({ data = MOCK_TICKER_DATA, className }) => {
  // Double the data for seamless loop
  const tickerData = [...data, ...data];

  return (
    <div className={cn(
      'w-full overflow-hidden',
      'bg-[var(--bg-secondary)] border-b border-[var(--border-primary)]',
      className
    )}>
      <div className="ticker-tape py-1">
        <div className="ticker-tape-content">
          {tickerData.map((item, index) => (
            <TickerItem key={`${item.symbol}-${index}`} data={item} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default StockTicker;