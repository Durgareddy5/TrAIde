import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star, Plus, Search, Trash2, X, MoreVertical,
  TrendingUp, TrendingDown, Edit3, Bell, ChevronRight,
  Eye, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import { formatINR, formatPercent, getPnLColor } from '@/utils/formatters';
import Skeleton from '@/components/ui/Skeleton';
import toast from 'react-hot-toast';

const WLCOLORS = ['#0052FF','#7C3AED','#00E676','#FFB300','#FF6B35','#29B6F6'];

const DEFAULT_WATCHLISTS = [
  {
    id:'wl1', name:'My Portfolio Watchlist', color:'#0052FF',
    items:[
      { symbol:'RELIANCE', name:'Reliance Industries', exchange:'NSE', price:1285.50, change:12.35,  pct:0.97 },
      { symbol:'TCS',      name:'Tata Consultancy',    exchange:'NSE', price:3542.80, change:-28.15, pct:-0.79},
      { symbol:'HDFCBANK', name:'HDFC Bank',           exchange:'NSE', price:1672.30, change:15.60,  pct:0.94 },
      { symbol:'INFY',     name:'Infosys',             exchange:'NSE', price:1495.25, change:8.40,   pct:0.56 },
    ],
  },
  {
    id:'wl2', name:'IT Sector Tracker', color:'#7C3AED',
    items:[
      { symbol:'TCS',      name:'Tata Consultancy',    exchange:'NSE', price:3542.80, change:-28.15, pct:-0.79},
      { symbol:'INFY',     name:'Infosys',             exchange:'NSE', price:1495.25, change:8.40,   pct:0.56 },
      { symbol:'WIPRO',    name:'Wipro Ltd',           exchange:'NSE', price:472.65,  change:-3.10,  pct:-0.65},
      { symbol:'HCLTECH',  name:'HCL Technologies',    exchange:'NSE', price:1638.40, change:10.25,  pct:0.63 },
      { symbol:'TECHM',    name:'Tech Mahindra',       exchange:'NSE', price:1524.60, change:-12.30, pct:-0.80},
    ],
  },
  {
    id:'wl3', name:'Banking Picks', color:'#00E676',
    items:[
      { symbol:'HDFCBANK', name:'HDFC Bank',           exchange:'NSE', price:1672.30, change:15.60,  pct:0.94 },
      { symbol:'ICICIBANK',name:'ICICI Bank',          exchange:'NSE', price:1289.45, change:-5.20,  pct:-0.40},
      { symbol:'SBIN',     name:'State Bank of India', exchange:'NSE', price:812.40,  change:6.85,   pct:0.85 },
      { symbol:'AXISBANK', name:'Axis Bank',           exchange:'NSE', price:1142.75, change:5.35,   pct:0.47 },
    ],
  },
];

const SEARCH_SUGGESTIONS = [
  { symbol:'BHARTIARTL', name:'Bharti Airtel',      exchange:'NSE' },
  { symbol:'SUNPHARMA',  name:'Sun Pharmaceutical', exchange:'NSE' },
  { symbol:'TATAMOTORS', name:'Tata Motors',        exchange:'NSE' },
  { symbol:'NESTLEIND',  name:'Nestle India',       exchange:'NSE' },
  { symbol:'BAJFINANCE', name:'Bajaj Finance',      exchange:'NSE' },
  { symbol:'MARUTI',     name:'Maruti Suzuki',      exchange:'NSE' },
];

const Watchlist = () => {
  const navigate = useNavigate();
  const [watchlists,   setWatchlists]   = useState([]);
  const [activeWl,     setActiveWl]     = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState('');
  const [showCreate,   setShowCreate]   = useState(false);
  const [showAdd,      setShowAdd]      = useState(false);
  const [newWlName,    setNewWlName]    = useState('');
  const [newWlColor,   setNewWlColor]   = useState('#0052FF');
  const [addSearch,    setAddSearch]    = useState('');

  useEffect(() => {
    setTimeout(() => {
      setWatchlists(DEFAULT_WATCHLISTS);
      setActiveWl(DEFAULT_WATCHLISTS[0].id);
      setLoading(false);
    }, 600);
  }, []);

  const currentWl = watchlists.find((w) => w.id === activeWl);

  const filteredItems = currentWl?.items.filter((item) =>
    search
      ? item.symbol.toLowerCase().includes(search.toLowerCase()) ||
        item.name.toLowerCase().includes(search.toLowerCase())
      : true
  ) || [];

  const handleCreateWl = () => {
    if (!newWlName.trim()) { toast.error('Enter a watchlist name'); return; }
    const newWl = {
      id: `wl${Date.now()}`, name: newWlName.trim(),
      color: newWlColor, items: [],
    };
    setWatchlists((prev) => [...prev, newWl]);
    setActiveWl(newWl.id);
    setNewWlName('');
    setShowCreate(false);
    toast.success(`"${newWl.name}" watchlist created!`);
  };

  const handleDeleteWl = (id) => {
    setWatchlists((prev) => prev.filter((w) => w.id !== id));
    if (activeWl === id && watchlists.length > 1) {
      setActiveWl(watchlists.find((w) => w.id !== id)?.id);
    }
    toast.success('Watchlist deleted');
  };

  const handleRemoveItem = (symbol) => {
    setWatchlists((prev) =>
      prev.map((w) =>
        w.id === activeWl
          ? { ...w, items: w.items.filter((i) => i.symbol !== symbol) }
          : w
      )
    );
    toast.success(`${symbol} removed from watchlist`);
  };

  const handleAddStock = (stock) => {
    if (currentWl?.items.find((i) => i.symbol === stock.symbol)) {
      toast.error(`${stock.symbol} is already in this watchlist`);
      return;
    }
    setWatchlists((prev) =>
      prev.map((w) =>
        w.id === activeWl
          ? { ...w, items: [...w.items,
              { ...stock, price: 1000 + Math.random() * 2000,
                change: (Math.random() - 0.5) * 50,
                pct: (Math.random() - 0.5) * 5 }] }
          : w
      )
    );
    toast.success(`${stock.symbol} added to watchlist`);
    setShowAdd(false);
    setAddSearch('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-[var(--text-primary)]">
            Watchlists
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Track your favourite stocks and monitor price movements
          </p>
        </div>
        <motion.button
          whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl
                     bg-gradient-to-r from-[#0052FF] to-[#7C3AED]
                     text-white text-sm font-semibold
                     shadow-[0_0_20px_rgba(0,82,255,0.25)]"
        >
          <Plus size={18}/> New Watchlist
        </motion.button>
      </div>

      {/* Main layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">

        {/* ── Watchlist Sidebar ──────────────── */}
        <div className="lg:col-span-1 space-y-2">
          {loading
            ? Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-xl"/>
              ))
            : watchlists.map((wl) => (
                <motion.button
                  key={wl.id}
                  initial={{ opacity:0, x:-10 }}
                  animate={{ opacity:1, x:0 }}
                  onClick={() => setActiveWl(wl.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl
                               text-left transition-all duration-200 border
                               ${activeWl === wl.id
                                 ? 'bg-[var(--bg-card)] border-[var(--accent-primary)]/30'
                                 : 'bg-[var(--bg-card)] border-[var(--border-primary)] hover:border-[var(--border-secondary)]'}`}
                >
                  <div className="w-3 h-3 rounded-full flex-shrink-0"
                       style={{ background: wl.color,
                                boxShadow: activeWl === wl.id
                                  ? `0 0 8px ${wl.color}` : 'none' }}/>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)]
                                  truncate">{wl.name}</p>
                    <p className="text-xs text-[var(--text-tertiary)]">
                      {wl.items.length} stocks
                    </p>
                  </div>
                  {activeWl === wl.id && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteWl(wl.id); }}
                      className="p-1 rounded-md text-[var(--text-tertiary)]
                                 hover:text-[var(--loss)] hover:bg-[var(--loss-bg)]
                                 transition-all duration-200"
                    >
                      <Trash2 size={14}/>
                    </button>
                  )}
                </motion.button>
              ))
          }

          {/* Create Watchlist inline */}
          <AnimatePresence>
            {showCreate && (
              <motion.div
                initial={{ opacity:0, y:-10, height:0 }}
                animate={{ opacity:1, y:0, height:'auto' }}
                exit={{ opacity:0, y:-10, height:0 }}
                className="overflow-hidden"
              >
                <div className="p-4 rounded-xl bg-[var(--bg-card)]
                                border border-[var(--accent-primary)]/30
                                space-y-3">
                  <input
                    autoFocus
                    value={newWlName}
                    onChange={(e) => setNewWlName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateWl()}
                    placeholder="Watchlist name..."
                    className="w-full px-3 py-2 rounded-lg text-sm
                               bg-[var(--bg-input)] border border-[var(--border-primary)]
                               text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]
                               focus:outline-none focus:border-[var(--accent-primary)]"
                  />
                  <div className="flex gap-1.5 flex-wrap">
                    {WLCOLORS.map((c) => (
                      <button key={c}
                        onClick={() => setNewWlColor(c)}
                        className={`w-6 h-6 rounded-full transition-all duration-200
                                   ${newWlColor === c ? 'ring-2 ring-offset-1 ring-white scale-110' : ''}`}
                        style={{ background: c }}/>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleCreateWl}
                      className="flex-1 py-2 rounded-lg bg-[var(--accent-primary)]
                                 text-white text-xs font-semibold">
                      Create
                    </button>
                    <button onClick={() => setShowCreate(false)}
                      className="px-3 py-2 rounded-lg bg-[var(--bg-tertiary)]
                                 text-[var(--text-secondary)] text-xs">
                      Cancel
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Watchlist Items ──────────────────── */}
        <div className="lg:col-span-3">
          <div className="bg-[var(--bg-card)] border border-[var(--border-primary)]
                          rounded-2xl overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center gap-3 px-5 py-4
                            border-b border-[var(--border-primary)]">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full"
                     style={{ background: currentWl?.color || '#0052FF' }}/>
                <h2 className="text-sm font-heading font-semibold
                               text-[var(--text-primary)]">
                  {currentWl?.name || 'Watchlist'}
                </h2>
                <span className="text-xs text-[var(--text-tertiary)]">
                  ({filteredItems.length})
                </span>
              </div>

              <div className="ml-auto flex items-center gap-2">
                <div className="relative">
                  <Search size={14}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2
                               text-[var(--text-tertiary)]"/>
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Filter stocks..."
                    className="pl-8 pr-3 py-1.5 rounded-lg text-xs
                               bg-[var(--bg-input)] border border-[var(--border-primary)]
                               text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]
                               focus:outline-none focus:border-[var(--accent-primary)] w-36"
                  />
                </div>
                <motion.button
                  whileHover={{ scale:1.04 }} whileTap={{ scale:0.96 }}
                  onClick={() => setShowAdd(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                             bg-[var(--accent-primary)] text-white text-xs font-semibold"
                >
                  <Plus size={14}/> Add Stock
                </motion.button>
              </div>
            </div>

            {/* Add Stock Search */}
            <AnimatePresence>
              {showAdd && (
                <motion.div
                  initial={{ height:0, opacity:0 }}
                  animate={{ height:'auto', opacity:1 }}
                  exit={{ height:0, opacity:0 }}
                  className="overflow-hidden border-b border-[var(--border-primary)]"
                >
                  <div className="p-4 bg-[var(--bg-secondary)]">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="relative flex-1">
                        <Search size={16}
                          className="absolute left-3 top-1/2 -translate-y-1/2
                                     text-[var(--text-tertiary)]"/>
                        <input
                          autoFocus
                          value={addSearch}
                          onChange={(e) => setAddSearch(e.target.value)}
                          placeholder="Search NSE/BSE stocks..."
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm
                                     bg-[var(--bg-input)] border border-[var(--border-primary)]
                                     text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]
                                     focus:outline-none focus:border-[var(--accent-primary)]"
                        />
                      </div>
                      <button onClick={() => { setShowAdd(false); setAddSearch(''); }}
                        className="p-2.5 rounded-xl bg-[var(--bg-tertiary)]
                                   border border-[var(--border-primary)]
                                   text-[var(--text-tertiary)]
                                   hover:text-[var(--text-primary)]">
                        <X size={16}/>
                      </button>
                    </div>

                    <div className="space-y-1 max-h-48 overflow-y-auto scrollbar-thin">
                      {SEARCH_SUGGESTIONS
                        .filter((s) => addSearch
                          ? s.symbol.toLowerCase().includes(addSearch.toLowerCase()) ||
                            s.name.toLowerCase().includes(addSearch.toLowerCase())
                          : true)
                        .map((s) => (
                          <button key={s.symbol}
                            onClick={() => handleAddStock(s)}
                            className="flex items-center justify-between w-full
                                       px-3 py-2.5 rounded-lg
                                       hover:bg-[var(--bg-card)]
                                       text-left transition-all duration-200"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg
                                              bg-[var(--accent-primary)]/10
                                              flex items-center justify-center text-xs
                                              font-bold text-[var(--accent-primary)]">
                                {s.symbol[0]}
                              </div>
                              <div>
                                <p className="text-sm font-semibold
                                              text-[var(--text-primary)]">{s.symbol}</p>
                                <p className="text-xs text-[var(--text-tertiary)]">{s.name}</p>
                              </div>
                            </div>
                            <span className="text-xs text-[var(--text-tertiary)]
                                             font-mono">{s.exchange}</span>
                          </button>
                        ))
                      }
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Items */}
            {loading ? (
              <div className="p-4 space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 rounded-xl"/>
                ))}
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Star size={40} className="text-[var(--text-tertiary)] mb-3"/>
                <p className="text-sm font-medium text-[var(--text-tertiary)]">
                  {search ? 'No matching stocks' : 'Watchlist is empty'}
                </p>
                <p className="text-xs text-[var(--text-tertiary)] mt-1">
                  {!search && 'Click "Add Stock" to add stocks to track'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[var(--border-primary)]">
                {filteredItems.map((item, i) => {
                  const up = item.pct >= 0;
                  return (
                    <motion.div
                      key={item.symbol}
                      initial={{ opacity:0 }}
                      animate={{ opacity:1 }}
                      transition={{ delay: i * 0.04 }}
                      className="flex items-center gap-4 px-5 py-3.5
                                 hover:bg-[var(--bg-card-hover)]
                                 transition-colors duration-150 group"
                    >
                      {/* Stock info */}
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-9 h-9 rounded-xl flex-shrink-0
                                        bg-[var(--accent-primary)]/10
                                        flex items-center justify-center
                                        text-sm font-bold text-[var(--accent-primary)]">
                          {item.symbol[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold
                                        text-[var(--text-primary)]">{item.symbol}</p>
                          <p className="text-xs text-[var(--text-tertiary)]
                                        truncate max-w-[140px]">{item.name}</p>
                        </div>
                      </div>

                      {/* Price */}
                      <div className="text-right">
                        <p className="text-sm font-mono font-semibold
                                      text-[var(--text-primary)]">
                          {formatINR(item.price)}
                        </p>
                        <p className={`text-xs font-mono flex items-center
                                       justify-end gap-0.5 ${getPnLColor(item.pct)}`}>
                          {up ? <ArrowUpRight size={12}/> : <ArrowDownRight size={12}/>}
                          {item.change >= 0 ? '+' : ''}{item.change.toFixed(2)}
                          {' '}({formatPercent(item.pct)})
                        </p>
                      </div>

                      {/* Actions (hover) */}
                      <div className="flex items-center gap-1
                                      opacity-0 group-hover:opacity-100
                                      transition-opacity duration-200">
                        <button
                          onClick={() => navigate(`/stock/${item.symbol}`)}
                          className="p-1.5 rounded-lg text-[var(--text-tertiary)]
                                     hover:text-[var(--accent-primary)]
                                     hover:bg-[var(--accent-primary)]/10
                                     transition-all duration-200"
                        >
                          <Eye size={15}/>
                        </button>
                        <button
                          onClick={() => toast.success(`Alert set for ${item.symbol}`)}
                          className="p-1.5 rounded-lg text-[var(--text-tertiary)]
                                     hover:text-amber-400 hover:bg-amber-400/10
                                     transition-all duration-200"
                        >
                          <Bell size={15}/>
                        </button>
                        <button
                          onClick={() => handleRemoveItem(item.symbol)}
                          className="p-1.5 rounded-lg text-[var(--text-tertiary)]
                                     hover:text-[var(--loss)] hover:bg-[var(--loss-bg)]
                                     transition-all duration-200"
                        >
                          <X size={15}/>
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Watchlist;