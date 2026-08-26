import React, { useState, useRef, useEffect } from 'react';
import { useDatabase } from '../context/DatabaseContext';
import { RefreshCw, Sun, Moon, Search, Bell } from 'lucide-react';
import Sidebar from './AdminPortal/Sidebar';
import Dashboard from './AdminPortal/Dashboard';
import Trainers from './AdminPortal/Trainers';
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
    currentUser, setCurrentUser, users, resetDatabase, 
    theme, toggleTheme, trainers, sites, schedules, invoices,
    changeRequests, expenses, payrollRuns
  } = useDatabase();

  const [adminActiveTab, setAdminActiveTab] = useState<string>('t_dashboard');
  
  // Header Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Notifications State
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Sync tab navigation on role switch
  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedUser = users.find(u => u.id === e.target.value);
    if (selectedUser) {
      setCurrentUser(selectedUser);
    }
  };

  // Sync tab navigation on user role change or fresh login
  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'trainer') {
        setAdminActiveTab('t_dashboard');
      } else {
        setAdminActiveTab('dashboard');
      }
    }
  }, [currentUser]);

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

  // Compute dynamic mock notifications based on DB state
  const getNotifications = () => {
    const list: any[] = [];
    
    // Add pending schedule adjustments
    changeRequests.filter(r => r.status === 'Pending').forEach(r => {
      list.push({
        id: `notif_sc_${r.id}`,
        title: 'Schedule Change Pending',
        desc: `${r.trainerName} requested a reschedule for ${r.courseName}`,
        time: 'Just now',
        tab: 'approvals'
      });
    });

    // Add pending attendance alerts
    schedules.filter(s => s.status === 'Scheduled').slice(0, 1).forEach(s => {
      list.push({
        id: `notif_att_${s.id}`,
        title: 'Upcoming Session Alert',
        desc: `${s.courseName} scheduled today at ${s.startTime}`,
        time: 'Today',
        tab: currentUser?.role === 'trainer' ? 't_schedule' : 'operations'
      });
    });

    // Add pending expense approvals
    expenses.filter(e => e.status === 'Pending').forEach(e => {
      list.push({
        id: `notif_exp_${e.id}`,
        title: 'Expense Claim Filed',
        desc: `${e.trainerName} submitted ₹${e.amount} Travel claim`,
        time: '1h ago',
        tab: 'approvals'
      });
    });

    // Add draft payroll notifications
    payrollRuns.filter(p => p.status === 'Draft').forEach(p => {
      list.push({
        id: `notif_pay_${p.id}`,
        title: 'Payroll snapshot compiled',
        desc: `August 2026 Draft cycle run compiled`,
        time: '3h ago',
        tab: 'approvals'
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
      case 'trainers':
        return <Trainers />;
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

  // Convert tab ID to breadcrumb label
  const getBreadcrumb = () => {
    const mapping: { [key: string]: string } = {
      't_dashboard': 'Trainer Dashboard',
      't_schedule': 'My Calendar',
      't_attendance': 'Mark Attendance',
      't_report': 'Class Logs & Reports',
      't_expenses': 'My Expenses',
      't_salary': 'Earnings ledger',
      't_profile': 'My Profile',
      'dashboard': 'Executive KPIs',
      'trainers': 'Trainer Profiles',
      'operations': 'Training Schedules',
      'attendance': 'Attendance Records',
      'finance': 'Commercial Ledger',
      'payroll': 'Trainer Payroll Runs',
      'expenses': 'Reimbursements Claims',
      'approvals': 'Approvals Hub',
      'settings': 'System Settings',
      'audit': 'Audit Ledger'
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
              className="bg-transparent text-xs font-bold text-rose-600 border-none outline-none cursor-pointer focus:ring-0 max-w-[160px] truncate"
            >
              {users.map(u => (
                <option key={u.id} value={u.id} className="bg-white dark:bg-zinc-950 text-slate-800 dark:text-slate-200">
                  {u.name} ({u.role.replace('_', ' ').toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          {/* Reset database */}
          <button
            onClick={resetDatabase}
            className="flex items-center gap-1.5 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-850 hover:bg-slate-100 dark:hover:bg-zinc-800/80 hover:border-slate-350 dark:hover:border-zinc-700 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-slate-200 transition rounded-xl px-3 py-1.5 text-xs font-bold shrink-0 shadow-sm"
            title="Reset demo seeding data"
          >
            <RefreshCw size={12} className="text-amber-500" />
            <span>Reset Demo DB</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Frame */}
      <div className="flex-grow flex overflow-hidden relative">
        <Sidebar activeTab={adminActiveTab} setActiveTab={setAdminActiveTab} />
        
        {/* Right workspace canvas */}
        <div className="flex-grow flex flex-col overflow-hidden">
          
          {/* Header Panel with Breadcrumbs, Search, Notif, and Theme toggler */}
          <header className="h-14 border-b px-6 flex items-center justify-between bg-white border-slate-150 dark:bg-zinc-950 dark:border-zinc-900 shrink-0 transition-colors">
            {/* Left: Breadcrumbs */}
            <div className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Spark / <span className="text-slate-800 dark:text-white font-extrabold">{getBreadcrumb()}</span>
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
                    className="w-56 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl py-1.5 pl-8 pr-3 text-xs outline-none focus:border-rose-600 dark:focus:border-rose-600 text-slate-800 dark:text-white font-semibold transition-all"
                  />
                  <Search size={14} className="text-slate-400 dark:text-zinc-555 absolute top-2.5 left-2.5" />
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
                            {t.name}
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
                            onClick={() => handleSearchResultClick(currentUser?.role === 'trainer' ? 't_dashboard' : 'operations')}
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
                            onClick={() => handleSearchResultClick(currentUser?.role === 'trainer' ? 't_salary' : 'finance')}
                            className="p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-800 cursor-pointer font-bold flex justify-between transition"
                          >
                            <span>{i.invoiceNumber}</span>
                            <span className="text-rose-500 font-extrabold">₹{i.totalAmount.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {searchResults.schedules.length > 0 && (
                      <div className="space-y-1 pt-2">
                        <p className="text-[8px] font-black uppercase text-slate-400 dark:text-zinc-500 tracking-wider px-2 py-1">Schedules</p>
                        {searchResults.schedules.map(s => (
                          <div 
                            key={s.id} 
                            onClick={() => handleSearchResultClick(currentUser?.role === 'trainer' ? 't_schedule' : 'operations')}
                            className="p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-800 cursor-pointer font-bold transition"
                          >
                            {s.courseName}
                          </div>
                        ))}
                      </div>
                    )}

                    {searchResults.trainers.length === 0 && 
                     searchResults.sites.length === 0 && 
                     searchResults.invoices.length === 0 && 
                     searchResults.schedules.length === 0 && (
                      <p className="text-center py-4 text-slate-400 dark:text-slate-500 font-semibold">No records match your query.</p>
                    )}
                  </div>
                )}
              </div>

              {/* 2. Notifications Center Bell */}
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-1.5 bg-slate-50 dark:bg-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-850 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 rounded-xl relative transition"
                >
                  <Bell size={14} />
                  {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-600 rounded-full flex items-center justify-center text-[7px] text-white font-black">
                      {notifications.length}
                    </span>
                  )}
                </button>

                {/* Notifications dropdown list */}
                {showNotifications && (
                  <div className="absolute right-0 top-10 w-80 bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800 rounded-xl shadow-2xl z-50 p-3 text-xs space-y-3">
                    <div className="flex justify-between items-center border-b border-slate-100 dark:border-zinc-800 pb-2">
                      <span className="font-extrabold text-slate-800 dark:text-white uppercase tracking-wider text-[10px]">Recent Alerts</span>
                      <span className="text-[9px] text-rose-500 font-black">{notifications.length} Unread</span>
                    </div>

                    <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                      {notifications.map((n, idx) => (
                        <div 
                          key={idx}
                          onClick={() => { setAdminActiveTab(n.tab); setShowNotifications(false); }}
                          className="p-2 bg-slate-50 dark:bg-zinc-950/40 border border-slate-150 dark:border-zinc-850/50 rounded-lg cursor-pointer hover:border-rose-500/40 transition text-left"
                        >
                          <div className="flex justify-between items-center">
                            <h4 className="font-bold text-slate-800 dark:text-slate-200 text-[10px]">{n.title}</h4>
                            <span className="text-[8px] text-slate-400 dark:text-slate-500">{n.time}</span>
                          </div>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">{n.desc}</p>
                        </div>
                      ))}

                      {notifications.length === 0 && (
                        <p className="text-center py-6 text-slate-400 dark:text-slate-500 font-semibold">No new notifications in feed.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Dark/Light Theme Switcher Toggle */}
              <button
                onClick={toggleTheme}
                className="p-1.5 bg-slate-50 dark:bg-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-850 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 rounded-xl transition"
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
      <footer className="h-8 border-t px-6 flex items-center justify-between text-[10px] font-semibold text-slate-450 dark:text-slate-500 bg-white border-slate-150 dark:bg-zinc-950 dark:border-zinc-900 z-50 shrink-0">
        <span>© 2026 DevLustro technologies pvt ltd. All rights reserved.</span>
        <span>Spark · Trainer Management</span>
      </footer>

    </div>
  );
};

export default SimulationShell;
