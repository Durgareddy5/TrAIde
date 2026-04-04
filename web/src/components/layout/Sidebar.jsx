import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';
import {
  LayoutDashboard, TrendingUp, ShoppingCart, Briefcase,
  Star, Wallet, BarChart3, Settings, LogOut, ChevronLeft,
  ChevronRight, Activity, Bell, FileText, Shield,
  Zap, IndianRupee, PieChart, LineChart, Target,
} from 'lucide-react';
import useAuthStore from '@/store/authStore';

const navItems = [
  {
    section: 'MAIN',
    items: [
      { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { path: '/markets', label: 'Markets', icon: TrendingUp },
      { path: '/orders', label: 'Orders', icon: ShoppingCart },
    ],
  },
  {
    section: 'PORTFOLIO',
    items: [
      { path: '/portfolio', label: 'Holdings', icon: Briefcase },
      { path: '/positions', label: 'Positions', icon: Activity },
      { path: '/watchlist', label: 'Watchlist', icon: Star },
    ],
  },
  {
    section: 'FINANCE',
    items: [
      { path: '/funds', label: 'Funds', icon: Wallet },
      { path: '/trades', label: 'Trade Log', icon: FileText },
      { path: '/analytics', label: 'Analytics', icon: PieChart },
    ],
  },
  {
    section: 'SYSTEM',
    items: [
      { path: '/alerts', label: 'Price Alerts', icon: Bell },
      { path: '/settings', label: 'Settings', icon: Settings },
    ],
  },
];

const Sidebar = ({ collapsed, setCollapsed }) => {
  const location = useLocation();
  const { user, logout } = useAuthStore();

  return (
    <motion.aside
      className={cn(
        'fixed left-0 top-0 h-screen z-40',
        'bg-[var(--bg-secondary)] border-r border-[var(--border-primary)]',
        'flex flex-col',
        'transition-all duration-300 ease-out',
      )}
      animate={{ width: collapsed ? 72 : 256 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
    >
      {/* ─── Logo Area ─────────────────── */}
      <div className={cn(
        'flex items-center h-16 px-4 border-b border-[var(--border-primary)]',
        collapsed ? 'justify-center' : 'gap-3'
      )}>
        <div className="relative">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#0052FF] to-[#7C3AED] flex items-center justify-center shadow-[0_0_20px_rgba(0,82,255,0.3)]">
            <Zap size={20} className="text-white" />
          </div>
          {/* Live Market Indicator */}
          <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[var(--profit)] pulse-dot" />
        </div>

        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <h1 className="text-lg font-heading font-bold gradient-text whitespace-nowrap">
                ProTrade
              </h1>
              <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-widest -mt-0.5 whitespace-nowrap">
                Institutional
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ─── Navigation ────────────────── */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-2">
        {navItems.map((section) => (
          <div key={section.section} className="mb-4">
            {/* Section Label */}
            <AnimatePresence>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="px-3 mb-2"
                >
                  <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--text-tertiary)]">
                    {section.section}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Nav Items */}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={cn(
                      'relative flex items-center gap-3 px-3 py-2.5 rounded-lg',
                      'text-sm font-medium',
                      'transition-all duration-200',
                      'group',
                      collapsed && 'justify-center',
                      isActive
                        ? 'bg-[var(--accent-primary-light)] text-[var(--accent-primary)]'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
                    )}
                  >
                    {/* Active Indicator Bar */}
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-[var(--accent-primary)]"
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    )}

                    <Icon size={20} className={cn(
                      'flex-shrink-0 transition-colors',
                      isActive && 'text-[var(--accent-primary)]'
                    )} />

                    <AnimatePresence>
                      {!collapsed && (
                        <motion.span
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: 'auto' }}
                          exit={{ opacity: 0, width: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden whitespace-nowrap"
                        >
                          {item.label}
                        </motion.span>
                      )}
                    </AnimatePresence>

                    {/* Tooltip for collapsed mode */}
                    {collapsed && (
                      <div className="absolute left-full ml-2 px-2.5 py-1.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-primary)] text-xs font-medium text-[var(--text-primary)] shadow-lg whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                        {item.label}
                      </div>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* ─── User Profile / Collapse ──── */}
      <div className="border-t border-[var(--border-primary)] p-3">
        {/* Collapse Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'flex items-center gap-3 w-full px-3 py-2 rounded-lg mb-2',
            'text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
            'hover:bg-[var(--bg-tertiary)] transition-all duration-200',
            collapsed && 'justify-center'
          )}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="whitespace-nowrap"
              >
                Collapse
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        {/* User Profile */}
        <div className={cn(
          'flex items-center gap-3 px-3 py-2 rounded-lg',
          'bg-[var(--bg-tertiary)]',
          collapsed && 'justify-center'
        )}>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0052FF] to-[#7C3AED] flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">
              {user?.first_name?.[0] || 'P'}{user?.last_name?.[0] || 'T'}
            </span>
          </div>

          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="flex-1 overflow-hidden min-w-0"
              >
                <p className="text-xs font-semibold text-[var(--text-primary)] truncate">
                  {user?.first_name || 'ProTrade'} {user?.last_name || 'User'}
                </p>
                <p className="text-[10px] text-[var(--text-tertiary)] truncate">
                  {user?.email || 'user@protrade.in'}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.aside>
  );
};

export default Sidebar;