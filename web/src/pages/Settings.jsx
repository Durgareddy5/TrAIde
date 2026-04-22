import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import {
  User, Mail, Phone, Building2, Lock, Bell,
  Moon, Sun, Globe, Shield, Save, Eye, EyeOff,
  CheckCircle2, Camera, Radio, RefreshCw, LogOut, KeyRound,
} from 'lucide-react';
import useAuthStore from '@/store/authStore';
import useThemeStore from '@/store/themeStore';
import ThemeToggle from '@/components/ui/ThemeToggle';
import kotakAdminService from '@/services/kotakAdminService';
import toast from 'react-hot-toast';


const SETTING_TABS = [
  { key: 'profile',       label: 'Profile',        icon: User },
  { key: 'notifications', label: 'Notifications',  icon: Bell },
  { key: 'security',      label: 'Security',       icon: Shield },
  { key: 'preferences',   label: 'Preferences',    icon: Globe },
  { key: 'kotak',         label: 'Kotak API',      icon: Radio },
];


const SectionTitle = ({ title, subtitle }) => (
  <div className="mb-6">
    <h3 className="text-base font-heading font-semibold
                   text-[var(--text-primary)]">{title}</h3>
    {subtitle && (
      <p className="text-xs text-[var(--text-secondary)] mt-0.5">{subtitle}</p>
    )}
  </div>
);

const FieldGroup = ({ label, children }) => (
  <div>
    <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
      {label}
    </label>
    {children}
  </div>
);

const inp =
  'w-full px-4 py-2.5 rounded-xl text-sm ' +
  'bg-[var(--bg-input)] border border-[var(--border-primary)] ' +
  'text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] ' +
  'focus:outline-none focus:border-[var(--accent-primary)] ' +
  'focus:ring-2 focus:ring-[var(--accent-primary)]/20 ' +
  'transition-all duration-200';

const Settings = () => {
  const { user, updateUser }  = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const [activeTab, setActiveTab] = useState('profile');
  const [saving,    setSaving]    = useState(false);
  const [showPwd,   setShowPwd]   = useState({});

  const [kotakStatus, setKotakStatus] = useState(null);
  const [kotakLoading, setKotakLoading] = useState(false);
  const [totp, setTotp] = useState('');

  useEffect(() => {
    if (activeTab === 'kotak') {
      loadKotakStatus();
    }
  }, [activeTab]);



  const { register, handleSubmit } = useForm({
    defaultValues: {
      first_name:        user?.first_name || '',
      last_name:         user?.last_name  || '',
      email:             user?.email      || '',
      phone:             user?.phone      || '',
      organization_name: user?.organization_name || '',
      designation:       user?.designation       || '',
    },
  });

    const loadKotakStatus = async () => {
    try {
      const res = await kotakAdminService.getSessionStatus();
      setKotakStatus(res.data || null);
    } catch (error) {
      console.error('Kotak status error:', error);
      setKotakStatus(null);
    }
  };

  const handleKotakLogin = async () => {
    if (!totp.trim()) {
      toast.error('Enter the 6-digit TOTP first');
      return;
    }

    try {
      setKotakLoading(true);
      const res = await kotakAdminService.loginWithTotp(totp.trim(), true);
      
      // 🔥 ADD THESE 3 LINES (VERY IMPORTANT)
      const data = res.data;
      localStorage.setItem("authToken", data.authToken);
      localStorage.setItem("sid", data.sid);
      
      console.log("✅ Kotak tokens stored:", data);
      
      toast.success('Kotak session created successfully');
      setTotp('');
      await loadKotakStatus();
    } catch (error) {
      toast.error(error.message || 'Kotak login failed');
    } finally {
      setKotakLoading(false);
    }
  };

  const handleKotakAutoLogin = async () => {
    try {
      setKotakLoading(true);
      await kotakAdminService.autoLogin();
      toast.success('Kotak auto-login completed');
      await loadKotakStatus();
    } catch (error) {
      toast.error(error.message || 'Kotak auto-login failed');
    } finally {
      setKotakLoading(false);
    }
  };

  const handleRefreshInstrumentMaster = async () => {
    try {
      setKotakLoading(true);
      await kotakAdminService.refreshInstrumentMaster();
      toast.success('Instrument master refreshed');
      await loadKotakStatus();
    } catch (error) {
      toast.error(error.message || 'Refresh failed');
    } finally {
      setKotakLoading(false);
    }
  };

  const handleKotakLogout = async () => {
    try {
      setKotakLoading(true);
      await kotakAdminService.logout();
      toast.success('Kotak session cleared');
      await loadKotakStatus();
    } catch (error) {
      toast.error(error.message || 'Kotak logout failed');
    } finally {
      setKotakLoading(false);
    }
  };


  const onSaveProfile = async (data) => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 900));
    updateUser(data);
    toast.success('Profile updated successfully!');
    setSaving(false);
  };

  const toggleShowPwd = (field) =>
    setShowPwd((prev) => ({ ...prev, [field]: !prev[field] }));

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div style={{marginBottom: '0.5rem'}}>
        <h1 className="text-2xl font-heading font-bold text-[var(--text-primary)]">
          Settings
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Manage your account preferences and security settings
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Tabs */}
        <div className="lg:w-56 flex-shrink-0">
          <div className="bg-[var(--bg-card)] border border-[var(--border-primary)]
                          rounded-md p-2" style={{padding: '0.25rem'}}>
            {SETTING_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-lg
                           text-sm font-medium transition-all duration-200 mb-0.5
                           ${activeTab === tab.key
                             ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]'
                             : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]'
                           }`}
                style={{marginBottom: '0.25rem',padding: '0.25rem'}}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 bg-[var(--bg-card)]
                        border border-[var(--border-primary)]
                        rounded-md p-6" style={{padding: '0.25rem'}}>

          {/* ── Profile ── */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSubmit(onSaveProfile)} className="space-y-5">
              <SectionTitle
                title="Personal Information"
                subtitle="Update your personal and organization details"
              />

              {/* Avatar */}
              <div className="flex items-center gap-4 mb-6">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full
                                  bg-gradient-to-br from-[#0052FF] to-[#7C3AED]
                                  flex items-center justify-center text-white
                                  text-xl font-bold shadow-[0_0_20px_rgba(0,82,255,0.3)]">
                    {user?.first_name?.[0]}{user?.last_name?.[0]}
                  </div>
                  <button type="button"
                    className="absolute bottom-0 right-0 w-6 h-6 rounded-full
                               bg-[var(--accent-primary)] flex items-center justify-center
                               border-2 border-[var(--bg-card)]">
                    <Camera size={12} className="text-white" />
                  </button>
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">
                    {user?.first_name} {user?.last_name}
                  </p>
                  <p className="text-xs text-[var(--text-secondary)]">
                    {user?.designation || 'Trader'} · {user?.organization_name || 'ProTrade'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FieldGroup label="First Name">
                  <input {...register('first_name')}
                    className={inp} placeholder="Arjun" />
                </FieldGroup>
                <FieldGroup label="Last Name">
                  <input {...register('last_name')}
                    className={inp} placeholder="Sharma" />
                </FieldGroup>
              </div>

              <FieldGroup label="Email Address">
                <div className="relative">
                  <Mail size={16}
                    className="absolute left-2 top-1/2 -translate-y-1/2
                               text-[var(--text-tertiary)]" />
                  <input {...register('email')} type="email"
                    className={`${inp} pl-9`} 
                    style={{marginLeft: '0', width:'100%', paddingLeft: '2rem', paddingRight: '2rem'}}/>
                </div>
              </FieldGroup>

              <FieldGroup label="Phone Number">
                <div className="relative">
                  <Phone size={16}
                    className="absolute left-2 top-1/2 -translate-y-1/2
                               text-[var(--text-tertiary)]" />
                  <input {...register('phone')}
                    className={`${inp} pl-9`} placeholder="+91 98765 43210"
                    style={{marginLeft: '0', width:'100%', paddingLeft: '2rem', paddingRight: '2rem'}} />
                </div>
              </FieldGroup>

              <FieldGroup label="Organization Name">
                <div className="relative">
                  <Building2 size={16}
                    className="absolute left-2 top-1/2 -translate-y-1/2
                               text-[var(--text-tertiary)]" />
                  <input {...register('organization_name')}
                    className={`${inp} pl-9`}
                    style={{marginLeft: '0', width:'100%', paddingLeft: '2rem', paddingRight: '2rem'}} />
                </div>
              </FieldGroup>

              <FieldGroup label="Designation">
                <input {...register('designation')}
                  className={inp} placeholder="Chief Investment Officer" />
              </FieldGroup>

              <div className="flex justify-end pt-2">
                <motion.button
                  type="submit"
                  disabled={saving}
                  whileHover={{ scale: saving ? 1 : 1.02 }}
                  whileTap={{ scale: saving ? 1 : 0.98 }}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-lg
                             text-sm font-semibold text-white
                             bg-gradient-to-r from-[#0052FF] to-[#7C3AED]
                             disabled:opacity-60 disabled:cursor-not-allowed
                             shadow-[0_0_20px_rgba(0,82,255,0.2)]
                             transition-all duration-200"
                  style={{padding: '0.25rem'}}
                >
                  <Save size={16} />
                  {saving ? 'Saving...' : 'Save Changes'}
                </motion.button>
              </div>
            </form>
          )}

          {/* ── Notifications ── */}
          {activeTab === 'notifications' && (
            <div className="space-y-5">
              <SectionTitle
                title="Notification Preferences"
                subtitle="Choose what alerts and updates you want to receive"
              />
              {[
                { key: 'order_fills',    label: 'Order Fills & Executions',
                  desc: 'Get notified when your orders are executed', default: true },
                { key: 'price_alerts',   label: 'Price Alerts',
                  desc: 'Alert when stocks hit your target prices',    default: true },
                { key: 'portfolio',      label: 'Portfolio Updates',
                  desc: 'Daily P&L and portfolio value summaries',     default: true },
                { key: 'market_news',    label: 'Market News',
                  desc: 'Important NSE/BSE announcements and news',    default: false },
                { key: 'margin_calls',   label: 'Margin & Fund Alerts',
                  desc: 'Low balance and margin utilization alerts',   default: true },
                { key: 'login_activity', label: 'Login Activity',
                  desc: 'Security alerts for new login sessions',      default: true },
              ].map((item, i) => (
                <motion.div
                  key={item.key}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="flex items-start justify-between p-4 rounded-md
                             bg-[var(--bg-tertiary)] border border-[var(--border-primary)]"
                  style={{padding: '0.25rem'}}
                >
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      {item.label}
                    </p>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                      {item.desc}
                    </p>
                  </div>
                  <button
                    onClick={() => toast.success('Preference saved!')}
                    className={`relative w-11 h-6 rounded-full transition-all duration-300
                               flex-shrink-0
                               ${item.default
                                 ? 'bg-[var(--accent-primary)]'
                                 : 'bg-[var(--bg-secondary)] border border-[var(--border-secondary)]'}`}
                  >
                    <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white
                                     shadow-sm transition-all duration-300
                                     ${item.default ? 'left-5' : 'left-0.5'}`} />
                  </button>
                </motion.div>
              ))}
            </div>
          )}

          {/* ── Security ── */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <SectionTitle
                title="Security Settings"
                subtitle="Keep your account and funds secure"
              />

              {/* Change Password */}
              <div className="p-5 rounded-lg bg-[var(--bg-tertiary)]
                              border border-[var(--border-primary)]" style={{padding: '0.25rem',marginBottom: '0.25rem'}}>
                <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-4
                               flex items-center gap-2">
                  <Lock size={16} className="text-[var(--accent-primary)]" />
                  Change Password
                </h4>
                <div className="space-y-3">
                  {['current_password', 'new_password', 'confirm_password'].map((field) => (
                    <div key={field} className="relative">
                      <input
                        type={showPwd[field] ? 'text' : 'password'}
                        placeholder={
                          field === 'current_password' ? 'Current password'
                          : field === 'new_password'   ? 'New password'
                          : 'Confirm new password'
                        }
                        className={`${inp} pr-10`}
                        style={{marginLeft: '0', width:'100%', paddingLeft: '1rem', paddingRight: '2.5rem',marginBottom: '0.25rem'}}
                      />
                      <button
                        type="button"
                        onClick={() => toggleShowPwd(field)}
                        className="absolute right-3 top-1/2 -translate-y-1/2
                                   text-[var(--text-tertiary)]
                                   hover:text-[var(--text-primary)] transition-colors"
                      >
                        {showPwd[field]
                          ? <EyeOff size={16} />
                          : <Eye size={16} />}
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => toast.success('Password updated successfully!')}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg
                               text-sm font-semibold text-white
                               bg-[var(--accent-primary)]
                               hover:bg-[var(--accent-primary-hover)]
                               transition-all duration-200"
                    style={{padding: '0.25rem',marginTop: '0.25rem'}}
                  >
                    <Save size={16} /> Update Password
                  </button>
                </div>
              </div>

              {/* Security info */}
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { icon: CheckCircle2, color: 'text-[var(--profit)]',
                    label: 'Email Verified',
                    value: user?.email || 'Not provided' },
                  { icon: Shield, color: 'text-[var(--accent-primary)]',
                    label: 'Account Status',
                    value: 'Active & Secure' },
                ].map((item) => (
                  <div key={item.label}
                       className="p-4 rounded-md bg-[var(--bg-tertiary)]
                                  border border-[var(--border-primary)]" style={{padding: '0.25rem'}}>
                    <div className={`flex items-center gap-2 ${item.color} mb-2`}>
                      <item.icon size={16} />
                      <span className="text-xs font-semibold uppercase tracking-wider">
                        {item.label}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--text-primary)]">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Preferences ── */}
          {activeTab === 'preferences' && (
            <div className="space-y-6">
              <SectionTitle
                title="Application Preferences"
                subtitle="Customize your ProTrade experience"
              />

              {/* Theme */}
              <div className="flex items-center justify-between p-4 rounded-lg
                              bg-[var(--bg-tertiary)] border border-[var(--border-primary)]" style={{padding: '0.25rem',marginBottom: '0.25rem'}}>
                <div className="flex items-center gap-3">
                  {theme === 'dark'
                    ? <Moon size={20} className="text-[var(--accent-primary)]" />
                    : <Sun size={20} className="text-amber-400" />}
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      App Theme
                    </p>
                    <p className="text-xs text-[var(--text-secondary)]">
                      Currently: {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                    </p>
                  </div>
                </div>
                <ThemeToggle />
              </div>

              {/* Exchange */}
              <div className="p-4 rounded-lg bg-[var(--bg-tertiary)]
                              border border-[var(--border-primary)]" style={{padding: '0.25rem',marginBottom: '0.25rem'}}>
                <p className="text-sm font-medium text-[var(--text-primary)] mb-2">
                  Default Exchange
                </p>
                <div className="flex gap-2">
                  {['NSE', 'BSE'].map((ex) => (
                    <button
                      key={ex}
                      onClick={() => toast.success(`Default exchange set to ${ex}`)}
                      className={`px-4 py-2 rounded-lg text-sm font-semibold
                                 border transition-all duration-200
                                 ${ex === 'NSE'
                                   ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border-[var(--accent-primary)]/30'
                                   : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-[var(--border-primary)] hover:border-[var(--border-secondary)]'}`}
                      style={{padding: '0.25rem'}}
                    >
                      {ex}
                    </button>
                  ))}
                </div>
              </div>

              {/* Product type */}
              <div className="p-4 rounded-md bg-[var(--bg-tertiary)]
                              border border-[var(--border-primary)]" style={{padding: '0.25rem'}}>
                <p className="text-sm font-medium text-[var(--text-primary)] mb-2">
                  Default Product Type
                </p>
                <div className="flex gap-2">
                  {['CNC', 'MIS', 'NRML'].map((pt) => (
                    <button
                      key={pt}
                      onClick={() => toast.success(`Default product set to ${pt}`)}
                      className={`px-4 py-2 rounded-lg text-sm font-semibold
                                 border transition-all duration-200
                                 ${pt === 'CNC'
                                   ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                                   : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-[var(--border-primary)] hover:border-[var(--border-secondary)]'}`}
                      style={{padding: '0.25rem'}}
                    >
                      {pt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
         
            {activeTab === 'kotak' && (
            <div className="space-y-6">
              <SectionTitle
                title="Kotak Trade API"
                subtitle="Manage Kotak session, TOTP login, and instrument master refresh"
              />

              <div className="p-5 rounded-xl bg-[var(--bg-tertiary)]
                              border border-[var(--border-primary)] space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      Session Status
                    </p>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                      {kotakStatus?.ready
                        ? 'Kotak market session is ready'
                        : 'No active Kotak session'}
                    </p>
                  </div>

                  <div className={`px-3 py-1.5 rounded-lg text-xs font-semibold border
                    ${kotakStatus?.ready
                      ? 'bg-[var(--profit-bg)] text-[var(--profit)] border-[var(--profit-border)]'
                      : 'bg-[var(--bg-secondary)] text-[var(--text-tertiary)] border-[var(--border-primary)]'}`}>
                    {kotakStatus?.ready ? 'Connected' : 'Disconnected'}
                  </div>
                </div>

                {kotakStatus?.session && (
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-primary)]">
                      <p className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] mb-1">
                        Base URL
                      </p>
                      <p className="text-xs text-[var(--text-primary)] break-all">
                        {kotakStatus.session.baseUrl}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-primary)]">
                      <p className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] mb-1">
                        Data Center
                      </p>
                      <p className="text-xs text-[var(--text-primary)]">
                        {kotakStatus.session.dataCenter || '—'}
                      </p>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                      Manual TOTP Login
                    </label>
                    <div className="flex gap-2">
                      <input
                        value={totp}
                        onChange={(e) => setTotp(e.target.value)}
                        placeholder="Enter 6-digit TOTP"
                        className={inp}
                      />
                      <button
                        onClick={handleKotakLogin}
                        disabled={kotakLoading}
                        className="px-4 py-2.5 rounded-xl bg-[var(--accent-primary)]
                                   text-white text-sm font-semibold disabled:opacity-60
                                   flex items-center gap-2"
                      >
                        <KeyRound size={16} />
                        Login
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={handleKotakAutoLogin}
                      disabled={kotakLoading}
                      className="px-4 py-2.5 rounded-xl bg-purple-600 text-white
                                 text-sm font-semibold disabled:opacity-60
                                 flex items-center gap-2"
                    >
                      <Radio size={16} />
                      Auto Login
                    </button>

                    <button
                      onClick={handleRefreshInstrumentMaster}
                      disabled={kotakLoading}
                      className="px-4 py-2.5 rounded-xl bg-[var(--bg-card)]
                                 border border-[var(--border-primary)]
                                 text-sm font-semibold text-[var(--text-primary)]
                                 disabled:opacity-60 flex items-center gap-2"
                    >
                      <RefreshCw size={16} className={kotakLoading ? 'animate-spin' : ''} />
                      Refresh Scrip Master
                    </button>

                    <button
                      onClick={loadKotakStatus}
                      disabled={kotakLoading}
                      className="px-4 py-2.5 rounded-xl bg-[var(--bg-card)]
                                 border border-[var(--border-primary)]
                                 text-sm font-semibold text-[var(--text-primary)]
                                 disabled:opacity-60 flex items-center gap-2"
                    >
                      <RefreshCw size={16} />
                      Reload Status
                    </button>

                    <button
                      onClick={handleKotakLogout}
                      disabled={kotakLoading}
                      className="px-4 py-2.5 rounded-xl bg-[var(--loss)]
                                 text-white text-sm font-semibold disabled:opacity-60
                                 flex items-center gap-2"
                    >
                      <LogOut size={16} />
                      Clear Session
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;