import React, { useState, useEffect } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { cn } from '@/utils/cn';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import StockTicker from '@/components/ui/StockTicker';
import useAuthStore from '@/store/authStore';
import useThemeStore from '@/store/themeStore';

const DashboardLayout = () => {
  const { isAuthenticated } = useAuthStore();
  const { initTheme } = useThemeStore();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    initTheme();
  }, []);

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] noise-overlay">
      {/* Sidebar */}
      <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />

      {/* Main Area */}
      <div
        className={cn(
          'transition-all duration-300',
          sidebarCollapsed ? 'ml-[72px]' : 'ml-[256px]'
        )}
      >
        {/* Topbar */}
        <Topbar sidebarCollapsed={sidebarCollapsed} />

        {/* Stock Ticker */}
        <div className={cn(
          'fixed z-20 right-0 top-16',
          'transition-all duration-300',
          sidebarCollapsed ? 'left-[72px]' : 'left-[256px]'
        )}>
          <StockTicker />
        </div>

        {/* Page Content */}
        <main className="pt-[calc(4rem+2rem)] pb-8 px-6 min-h-screen">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;