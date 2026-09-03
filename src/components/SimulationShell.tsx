import React, { useState, useRef, useEffect } from 'react';
import { useDatabase } from '../context/DatabaseContext';
import { Sun, Moon, Search, Bell, Clock, Radio, X, ArrowLeft, RotateCw } from 'lucide-react';
import Sidebar from './AdminPortal/Sidebar';
import Dashboard from './AdminPortal/Dashboard';
import HRDashboard from './AdminPortal/HRDashboard';
import Trainers from './AdminPortal/Trainers';
import TrainingSitesManager from './AdminPortal/TrainingSitesManager';
import Operations from './AdminPortal/Operations';
import Attendance from './AdminPortal/Attendance';
import Finance from './AdminPortal/Finance';
import Payroll from './AdminPortal/Payroll';
import Expenses from './AdminPortal/Expenses';
import Approvals from './AdminPortal/Approvals';
import Settings from './AdminPortal/Settings';
import Audit from './AdminPortal/Audit';

// Trainer Desktop Portal imports
import TrainerDashboard from './TrainerPortal/TrainerDashboard';
import TrainerSchedule from './TrainerPortal/TrainerSchedule';
import TrainerAttendance from './TrainerPortal/TrainerAttendance';
import TrainerReport from './TrainerPortal/TrainerReport';
import TrainerExpenses from './TrainerPortal/TrainerExpenses';
import TrainerSalary from './TrainerPortal/TrainerSalary';
import TrainerProfile from './TrainerPortal/TrainerProfile';
import Login from './Login';
import BrandLogo from './BrandLogo';

const SimulationShell: React.FC = () => {
  const { 
    currentUser, setCurrentUser, users, logout,
    theme, toggleTheme, trainers, sites, schedules, invoices,
    expenses, attendanceRecords, realtimeEvents, 
    latestEvent, showInactivityWarning, inactivitySecondsRemaining, 
    extendSession
  } = useDatabase();

  const [adminActiveTab, setAdminActiveTabState] = useState<string>(() => {
    const saved = localStorage.getItem('spk_active_tab');
    if (saved) return saved;
    return currentUser?.role === 'trainer' ? 't_dashboard' : (currentUser?.role === 'hr' ? 'hr_dashboard' : 'dashboard');
  });

  const [tabHistory, setTabHistory] = useState<string[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshToast, setRefreshToast] = useState(false);

  const setAdminActiveTab = (tab: string) => {
    if (tab !== adminActiveTab) {
      setTabHistory(prev => [...prev, adminActiveTab]);
    }
    setAdminActiveTabState(tab);
    localStorage.setItem('spk_active_tab', tab);
  };

  const handleGoBack = () => {
    if (tabHistory.length > 0) {
      const prevTab = tabHistory[tabHistory.length - 1];
      setTabHistory(prev => prev.slice(0, -1));
      setAdminActiveTabState(prevTab);
      localStorage.setItem('spk_active_tab', prevTab);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setRefreshToast(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
    setTimeout(() => {
      setRefreshToast(false);
    }, 2500);
  };
  
  // Header Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Notifications State
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Live Toast State for Real-Time Events (Requirement 2)
  const [toastEvent, setToastEvent] = useState<typeof latestEvent>(null);

  useEffect(() => {
    if (latestEvent) {
      setToastEvent(latestEvent);
      const timer = window.setTimeout(() => setToastEvent(null), 4500);
      return () => window.clearTimeout(timer);
    }
  }, [latestEvent]);

  // Sync tab navigation on role switch
  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedUser = users.find(u => u.id === e.target.value);
    if (selectedUser) {
      setCurrentUser(selectedUser);
      const nextTab = selectedUser.role === 'trainer' ? 't_dashboard' : (selectedUser.role === 'hr' ? 'hr_dashboard' : 'dashboard');
      setAdminActiveTab(nextTab);
    }
  };

  // Validate tab compatibility when user role changes, without wiping tab on page refresh
  useEffect(() => {
    if (!currentUser) return;
    const isTrainerTab = adminActiveTab.startsWith('t_');
    if (currentUser.role === 'trainer' && !isTrainerTab) {
      setAdminActiveTab('t_dashboard');
    } else if (currentUser.role !== 'trainer' && isTrainerTab) {
      setAdminActiveTab(currentUser.role === 'hr' ? 'hr_dashboard' : 'dashboard');
    }
  }, [currentUser?.role]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearch(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  if (!currentUser) {
    return <Login />;
  }

  // Dynamic real-time notifications list
  const getNotifications = () => {
    const list: any[] = [];

    // Add recent real-time broadcast events
    realtimeEvents.slice(0, 5).forEach(evt => {
      list.push({
        id: evt.id,
        title: evt.title,
        desc: evt.message,
        time: evt.timestamp,
        tab: evt.type.includes('ATTENDANCE') ? 'attendance' : evt.type.includes('EXPENSE') ? 'expenses' : evt.type.includes('INVOICE') ? 'finance' : 'dashboard'
      });
    });

    // Add pending exception alerts
    const exceptions = attendanceRecords.filter(r => r.verificationStatus === 'Review');
    if (exceptions.length > 0) {
      list.push({
        id: 'notif_exc',
        title: 'Geofence Exception Alert',
        desc: `${exceptions.length} trainer check-in(s) flagged outside site boundary`,
        time: 'Active',
        tab: 'attendance'
      });
    }

    // Add pending expense approvals
    expenses.filter(e => e.status === 'Pending').slice(0, 2).forEach(e => {
      list.push({
        id: `notif_exp_${e.id}`,
        title: 'Expense Claim Filed',
        desc: `${e.trainerName} submitted ₹${e.amount} ${e.category} claim`,
        time: 'Pending',
        tab: currentUser?.role === 'trainer' ? 't_expenses' : 'expenses'
      });
    });

    return list;
  };

  const notifications = getNotifications();

  // Search Results Calculator
  const getSearchResults = () => {
    if (!searchQuery.trim()) return null;
    const query = searchQuery.toLowerCase();

    return {
      trainers: trainers.filter(t => t.name.toLowerCase().includes(query) || t.skills.some(s => s.toLowerCase().includes(query))),
      sites: sites.filter(s => s.name.toLowerCase().includes(query) || s.address.toLowerCase().includes(query)),
      invoices: invoices.filter(i => i.invoiceNumber.toLowerCase().includes(query) || i.customerName.toLowerCase().includes(query)),
      schedules: schedules.filter(s => s.courseName.toLowerCase().includes(query) || s.batchName.toLowerCase().includes(query))
    };
  };

  const searchResults = getSearchResults();

  const handleSearchResultClick = (tab: string) => {
    setAdminActiveTab(tab);
    setSearchQuery('');
    setShowSearch(false);
  };

  const renderContent = () => {
    // 1. Trainer Role Desktop Workspace
    if (currentUser?.role === 'trainer') {
      switch (adminActiveTab) {
        case 't_dashboard':
          return <TrainerDashboard setActiveTab={setAdminActiveTab} />;
        case 't_schedule':
          return <TrainerSchedule />;
        case 't_attendance':
          return <TrainerAttendance />;
        case 't_report':
          return <TrainerReport />;
        case 't_expenses':
          return <TrainerExpenses />;
        case 't_salary':
          return <TrainerSalary />;
        case 't_profile':
          return <TrainerProfile />;
        default:
          return <TrainerDashboard setActiveTab={setAdminActiveTab} />;
      }
    }

    // 2. Admin / Administrative Staff Workspace
    switch (adminActiveTab) {
      case 'dashboard':
        return <Dashboard setActiveTab={setAdminActiveTab} />;
      case 'hr_dashboard':
        return <HRDashboard onNavigateToTrainers={() => setAdminActiveTab('trainers')} />;
      case 'trainers':
        return <Trainers />;
      case 'training_sites':
        return <TrainingSitesManager />;
      case 'operations':
        return <Operations />;
      case 'attendance':
        return <Attendance />;
      case 'finance':
        return <Finance />;
      case 'payroll':
        return <Payroll />;
      case 'expenses':
        return <Expenses />;
      case 'approvals':
        return <Approvals />;
      case 'settings':
        return <Settings />;
      case 'audit':
        return <Audit />;
      default:
        return <Dashboard setActiveTab={setAdminActiveTab} />;
    }
  };

  const getBreadcrumb = () => {
    const mapping: { [key: string]: string } = {
      't_dashboard': 'Trainer Dashboard',
      't_schedule': 'My Schedule',
      't_attendance': 'Mark Attendance',
      't_report': 'Class Reports',
      't_expenses': 'My Expenses',
      't_salary': 'Earnings & Payslips',
      't_profile': 'My Profile',
      'dashboard': 'Executive Dashboard',
      'hr_dashboard': 'HR Operations',
      'trainers': 'Trainer Profiles',
      'training_sites': 'Training Sites',
      'operations': 'Training Ops',
      'attendance': 'Attendance Feed',
      'finance': 'Commercial Ledger',
      'payroll': 'Trainer Payroll',
      'expenses': 'Reimbursements',
      'approvals': 'Approval Center',
      'settings': 'System Settings',
      'audit': 'Security Audit'
    };
    return mapping[adminActiveTab] || 'Dashboard';
  };

  return (
    <div className="min-h-screen flex flex-col font-sans select-none antialiased overflow-hidden bg-slate-50 dark:bg-black text-slate-900 dark:text-slate-100 transition-colors duration-200">
      
      {/* Simulation Top Bar */}
      <header className="h-[72px] px-6 border-b z-50 shrink-0 flex items-center justify-between bg-white border-zinc-200 dark:bg-black dark:border-zinc-900">
        
        <BrandLogo size="sm" />

        {/* Global Control Console */}
        <div className="flex items-center gap-4">
          
          {/* Switch User dropdown */}
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-1.5 transition-colors">
            <span className="text-[10px] text-slate-500 dark:text-zinc-500 font-extrabold uppercase tracking-wide">Active Role:</span>
            <select
              value={currentUser?.id || ''}
              onChange={handleRoleChange}
              className="bg-transparent text-xs font-bold text-[#E50914] border-none outline-none cursor-pointer focus:ring-0 max-w-[170px] truncate"
            >
              {users.map(u => (
                <option key={u.id} value={u.id} className="bg-white dark:bg-zinc-950 text-slate-800 dark:text-slate-200">
                  {u.name} ({u.role.replace('_', ' ').toUpperCase()})
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {/* Main Workspace Frame */}
      <div className="flex-grow flex overflow-hidden relative">
        <Sidebar activeTab={adminActiveTab} setActiveTab={setAdminActiveTab} />
        
        {/* Right workspace canvas */}
        <div className="flex-grow flex flex-col overflow-hidden">
          
          {/* Header Panel with Breadcrumbs, Search, Notif, and Theme toggler */}
          <header className="h-14 border-b px-6 flex items-center justify-between bg-white border-slate-150 dark:bg-zinc-950 dark:border-zinc-900 shrink-0 transition-colors">
            {/* Left: Back Button & Breadcrumbs */}
            <div className="flex items-center gap-3">
              {tabHistory.length > 0 && (
                <button
                  onClick={handleGoBack}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-zinc-900 hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-700 dark:text-slate-200 text-xs font-bold transition shadow-sm border border-slate-200 dark:border-zinc-800"
                  title="Go back to previous screen"
                >
                  <ArrowLeft size={13} className="text-[#E50914]" />
                  <span>Back</span>
                </button>
              )}
              <div className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <span>Spark</span>
                <span>/</span>
                <span className="text-slate-800 dark:text-white font-extrabold">{getBreadcrumb()}</span>
              </div>
            </div>

            {/* Right: Search, Notifications & Theme Toggle */}
            <div className="flex items-center gap-4">
              
              {/* 1. Global Search Box */}
              <div className="relative" ref={searchRef}>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setShowSearch(true); }}
                    onFocus={() => setShowSearch(true)}
                    placeholder="Search Spark..."
                    className="w-56 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl py-1.5 pl-8 pr-3 text-xs outline-none focus:border-[#E50914] text-slate-800 dark:text-white font-semibold transition-all"
                  />
                  <Search size={14} className="text-slate-400 absolute top-2.5 left-2.5" />
                </div>

                {/* Search overlay dropdown results */}
                {showSearch && searchResults && (
                  <div className="absolute right-0 top-10 w-72 bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800 rounded-xl shadow-2xl z-50 p-2 text-xs text-slate-800 dark:text-slate-350 max-h-80 overflow-y-auto custom-scrollbar">
                    {searchResults.trainers.length > 0 && (
                      <div className="space-y-1 pb-2 border-b border-slate-100 dark:border-zinc-800">
                        <p className="text-[8px] font-black uppercase text-slate-400 dark:text-zinc-500 tracking-wider px-2 py-1">Trainers</p>
                        {searchResults.trainers.map(t => (
                          <div 
                            key={t.id} 
                            onClick={() => handleSearchResultClick(currentUser?.role === 'trainer' ? 't_profile' : 'trainers')}
                            className="p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-800 cursor-pointer font-bold transition"
                          >
                            {t.name} ({t.status})
                          </div>
                        ))}
                      </div>
                    )}

                    {searchResults.sites.length > 0 && (
                      <div className="space-y-1 py-2 border-b border-slate-100 dark:border-zinc-800">
                        <p className="text-[8px] font-black uppercase text-slate-400 dark:text-zinc-500 tracking-wider px-2 py-1">Colleges / Sites</p>
                        {searchResults.sites.map(s => (
                          <div 
                            key={s.id} 
                            onClick={() => handleSearchResultClick('training_sites')}
                            className="p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-800 cursor-pointer font-bold transition"
                          >
                            {s.name}
                          </div>
                        ))}
                      </div>
                    )}

                    {searchResults.invoices.length > 0 && (
                      <div className="space-y-1 py-2 border-b border-slate-100 dark:border-zinc-800">
                        <p className="text-[8px] font-black uppercase text-slate-400 dark:text-zinc-500 tracking-wider px-2 py-1">Invoices</p>
                        {searchResults.invoices.map(i => (
                          <div 
                            key={i.id} 
                            onClick={() => handleSearchResultClick('finance')}
                            className="p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-800 cursor-pointer font-bold flex justify-between transition"
                          >
                            <span>{i.invoiceNumber}</span>
                            <span className="text-[#E50914] font-extrabold">₹{i.totalAmount.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 2. Notifications Center Bell */}
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-1.5 bg-slate-50 dark:bg-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-slate-400 rounded-xl relative transition"
                >
                  <Bell size={14} />
                  {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#E50914] rounded-full flex items-center justify-center text-[7px] text-white font-black animate-pulse">
                      {notifications.length}
                    </span>
                  )}
                </button>

                {/* Notifications dropdown list */}
                {showNotifications && (
                  <div className="absolute right-0 top-10 w-80 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl z-50 p-3 text-xs space-y-3">
                    <div className="flex justify-between items-center border-b border-slate-100 dark:border-zinc-800 pb-2">
                      <span className="font-extrabold text-slate-900 dark:text-white uppercase tracking-wider text-[10px]">Real-Time Feed</span>
                      <span className="text-[9px] text-[#E50914] font-black">{notifications.length} Alerts</span>
                    </div>

                    <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar pr-1">
                      {notifications.map((n, idx) => (
                        <div 
                          key={idx}
                          onClick={() => { setAdminActiveTab(n.tab); setShowNotifications(false); }}
                          className="p-2.5 bg-slate-50 dark:bg-zinc-950/60 border border-slate-200 dark:border-zinc-800 rounded-xl cursor-pointer hover:border-[#E50914]/40 transition text-left space-y-0.5"
                        >
                          <div className="flex justify-between items-center">
                            <h4 className="font-bold text-slate-900 dark:text-slate-200 text-[11px]">{n.title}</h4>
                            <span className="text-[8px] text-slate-400">{n.time}</span>
                          </div>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-snug">{n.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Refresh Ledger Button */}
              <button
                onClick={handleRefresh}
                className="p-1.5 bg-slate-50 dark:bg-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-slate-400 rounded-xl transition flex items-center justify-center"
                title="Refresh Ledger & Records"
              >
                <RotateCw size={14} className={`${isRefreshing ? 'animate-spin text-[#E50914]' : 'text-slate-600 dark:text-slate-400'}`} />
              </button>

              {/* 4. Dark/Light Theme Switcher Toggle */}
              <button
                onClick={toggleTheme}
                className="p-1.5 bg-slate-50 dark:bg-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-slate-400 rounded-xl transition"
                title="Switch Color Theme"
              >
                {theme === 'dark' ? <Sun size={14} className="text-amber-500" /> : <Moon size={14} className="text-indigo-600" />}
              </button>

            </div>
          </header>

          {/* Tab Content Display Area */}
          <main className="flex-grow p-6 overflow-y-auto bg-slate-50/50 dark:bg-black/20 custom-scrollbar">
            {renderContent()}
          </main>
        </div>

      </div>

      {/* Footer copyright */}
      <footer className="h-8 border-t px-6 flex items-center justify-between text-[10px] font-semibold text-slate-500 bg-white border-slate-150 dark:bg-zinc-950 dark:border-zinc-900 z-50 shrink-0">
        <span>© 2026 DevLustro Technologies Pvt Ltd. All rights reserved.</span>
        <span>Spark Enterprise · Real-Time Operations</span>
      </footer>

      {/* REFRESH TOAST NOTIFICATION */}
      {refreshToast && (
        <div className="fixed bottom-10 left-8 z-[100] bg-slate-900 text-white dark:bg-white dark:text-slate-900 border border-slate-700 dark:border-slate-200 rounded-2xl p-3.5 shadow-2xl flex items-center gap-3 animate-slideIn">
          <div className="p-1.5 bg-[#E50914] text-white rounded-xl">
            <RotateCw size={14} className="animate-spin" />
          </div>
          <div>
            <h4 className="text-xs font-black">Ledger Synchronized</h4>
            <p className="text-[10px] text-slate-300 dark:text-slate-600">Operational records and database feeds refreshed.</p>
          </div>
        </div>
      )}

      {/* LIVE REAL-TIME TOAST NOTIFICATION (Requirement 2) */}
      {toastEvent && (
        <div className="fixed bottom-10 right-8 z-[100] bg-zinc-950 text-white border border-red-500/40 rounded-2xl p-4 shadow-2xl max-w-sm flex items-start gap-3 animate-slideIn">
          <div className="p-2 bg-[#E50914] rounded-xl text-white shrink-0 mt-0.5">
            <Radio size={16} className="animate-pulse" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-black text-white">{toastEvent.title}</h4>
            <p className="text-[11px] text-zinc-300 mt-0.5 leading-snug">{toastEvent.message}</p>
            <span className="text-[9px] text-zinc-500 font-mono mt-1 block">{toastEvent.timestamp}</span>
          </div>
          <button onClick={() => setToastEvent(null)} className="text-zinc-500 hover:text-white">
            <X size={14} />
          </button>
        </div>
      )}

      {/* 15-MINUTE INACTIVITY WARNING MODAL (Requirement 1) */}
      {showInactivityWarning && (
        <div className="fixed inset-0 bg-black/80 z-[999] flex items-center justify-center p-4 backdrop-blur-md animate-fadeIn">
          <div className="bg-white dark:bg-zinc-950 border border-red-500/40 rounded-3xl p-8 max-w-md w-full space-y-5 text-center shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-amber-500/15 text-amber-500 flex items-center justify-center mx-auto border border-amber-500/30">
              <Clock size={32} className="animate-spin" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                “Your session will expire soon due to inactivity.”
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                For enterprise security, you will be automatically logged out in:
              </p>
              <div className="text-3xl font-black text-[#E50914] font-mono py-1">
                {Math.floor(inactivitySecondsRemaining / 60)}:
                {String(inactivitySecondsRemaining % 60).padStart(2, '0')}
              </div>
            </div>

            {/* Buttons: Continue Session & Logout */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={extendSession}
                className="bg-[#E50914] hover:bg-[#b00610] text-white py-3 rounded-xl font-bold text-xs transition shadow-lg shadow-red-600/30"
              >
                Continue Session
              </button>
              <button
                onClick={() => logout('Your session has expired due to inactivity. Please log in again.')}
                className="bg-slate-100 dark:bg-zinc-900 hover:bg-slate-200 text-slate-700 dark:text-slate-300 py-3 rounded-xl font-bold text-xs transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default SimulationShell;
