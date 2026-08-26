import React, { useState } from 'react';
import { Layout, Calendar, MapPin, User } from 'lucide-react';

import MobileDashboard from './MobileDashboard';
import MobileSchedule from './MobileSchedule';
import MobileAttendance from './MobileAttendance';
import MobileProfile from './MobileProfile';
import MobileExpenses from './MobileExpenses';
import MobileSalary from './MobileSalary';
import MobileReport from './MobileReport';
import { useDatabase } from '../../context/DatabaseContext';

const MobileFrame: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'schedule' | 'attendance' | 'profile' | 'expenses' | 'salary' | 'report'>('dashboard');
  const { currentUser } = useDatabase();

  // Get current clock time for simulator
  const [time, setTime] = useState(new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: false }));
  React.useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: false }));
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'dashboard':
        return <MobileDashboard setActiveTab={setActiveTab} />;
      case 'schedule':
        return <MobileSchedule />;
      case 'attendance':
        return <MobileAttendance />;
      case 'report':
        return <MobileReport />;
      case 'expenses':
        return <MobileExpenses />;
      case 'salary':
        return <MobileSalary />;
      case 'profile':
        return <MobileProfile setActiveTab={setActiveTab} />;
      default:
        return <MobileDashboard setActiveTab={setActiveTab} />;
    }
  };

  const getTabClass = (tab: 'dashboard' | 'schedule' | 'attendance' | 'profile') => {
    const base = "flex flex-col items-center justify-center w-full h-full py-1 text-xs font-medium transition-all duration-200";
    if (activeTab === tab || (tab === 'profile' && ['expenses', 'salary', 'report'].includes(activeTab))) {
      return `${base} text-rose-500 scale-105`;
    }
    return `${base} text-slate-400 hover:text-slate-200`;
  };

  if (!currentUser || currentUser.role !== 'trainer') {

    return (
      <div className="flex flex-col items-center justify-center h-full bg-slate-900 text-slate-400 p-6 text-center">
        <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4 text-blue-500 border border-slate-700 animate-pulse">
          <User size={32} />
        </div>
        <p className="font-semibold text-white mb-1">Trainer View Locked</p>
        <p className="text-xs max-w-[240px]">
          Please use the quick switcher at the top to select the <strong>Trainer</strong> role to interact with the mobile app.
        </p>
      </div>
    );
  }



  return (
    <div className="relative mx-auto w-[370px] h-[750px] bg-black rounded-[48px] p-3 shadow-2xl border-4 border-slate-800 ring-1 ring-slate-700 flex flex-col overflow-hidden select-none">
      {/* Speaker Grill & Camera (Dynamic Island Notch) */}

      <div className="absolute top-5 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-full z-50 flex items-center justify-between px-3 border border-slate-900 shadow-inner">
        <div className="w-3 h-3 bg-slate-950 rounded-full border border-slate-900 flex items-center justify-center">
          <div className="w-1 h-1 bg-blue-900 rounded-full"></div>
        </div>
        <div className="w-14 h-1 bg-slate-850 rounded-full"></div>
      </div>

      {/* Screen Area */}
      <div className="flex-1 bg-slate-950 rounded-[38px] overflow-hidden flex flex-col border border-slate-900 relative">
        
        {/* Device Status Bar */}
        <div className="h-10 px-6 pt-3 flex justify-between items-center text-xs text-white z-40 bg-gradient-to-b from-slate-950 to-transparent font-medium shrink-0">
          <span>{time}</span>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] tracking-wide font-bold">5G</span>
            <div className="w-4.5 h-2.5 border border-white rounded-[3px] p-[1px] flex items-center">
              <div className="h-full w-4 bg-white rounded-[1px]"></div>
            </div>
          </div>
        </div>

        {/* Screen Content Wrapper */}
        <div className="flex-1 overflow-y-auto px-4 pb-20 pt-2 custom-scrollbar">
          {renderActiveScreen()}
        </div>

        {/* Bottom Tab Bar (iOS style) */}
        <div className="absolute bottom-0 inset-x-0 bg-slate-900/90 backdrop-blur-md border-t border-slate-800 h-16 px-4 pb-2 pt-1 flex justify-around items-center z-40">
          <button className={getTabClass('dashboard')} onClick={() => setActiveTab('dashboard')}>
            <Layout size={20} />
            <span className="mt-1">Home</span>
          </button>
          
          <button className={getTabClass('schedule')} onClick={() => setActiveTab('schedule')}>
            <Calendar size={20} />
            <span className="mt-1">Schedule</span>
          </button>
          
          <button className={getTabClass('attendance')} onClick={() => setActiveTab('attendance')}>
            <div className="relative">
              <MapPin size={20} />
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full ring-2 ring-slate-900"></div>
            </div>
            <span className="mt-1">Check-in</span>
          </button>
          
          <button className={getTabClass('profile')} onClick={() => setActiveTab('profile')}>
            <User size={20} />
            <span className="mt-1">Profile</span>
          </button>
        </div>

        {/* Home Screen Pill Indicator */}
        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-28 h-1 bg-white/40 rounded-full z-50"></div>
      </div>
    </div>
  );
};

export default MobileFrame;
