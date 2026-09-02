import React from 'react';
import { useDatabase } from '../../context/DatabaseContext';
import { Users, Calendar, ShieldAlert, Award, Clock, ArrowUpRight, Radio, Landmark } from 'lucide-react';

interface DashboardProps {
  setActiveTab: (tab: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ setActiveTab }) => {
  const { trainers, schedules, attendanceRecords, changeRequests, invoices, expenses } = useDatabase();

  const activeTrainers = trainers.filter(t => t.status === 'Active');
  const reviewAttendance = attendanceRecords.filter(r => r.verificationStatus === 'Review');

  // Today's classes count
  const todayStr = new Date().toISOString().split('T')[0];
  const todayClasses = schedules.filter(s => s.date === todayStr);

  // Compute compliance rate (verified / total today and past check-ins)
  const pastCheckins = attendanceRecords.length;
  const verifiedCheckins = attendanceRecords.filter(r => r.verificationStatus === 'Verified' || r.verificationStatus === 'Corrected').length;
  const complianceRate = pastCheckins > 0 ? Math.round((verifiedCheckins / pastCheckins) * 100) : 100;

  // Commercial summary
  const totalRevenue = invoices.reduce((sum, i) => sum + i.totalAmount, 0);
  const totalCollections = invoices.reduce((sum, i) => sum + i.amountPaid, 0);
  const outstandingAmount = invoices.reduce((sum, i) => sum + i.outstandingBalance, 0);

  return (
    <div className="space-y-6 text-slate-700 dark:text-slate-350 transition-colors duration-200">
      
      {/* Top Banner Greeting */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-wide">Executive Operations Dashboard</h2>
          <p className="text-xs text-slate-500 dark:text-slate-450 mt-0.5 font-medium">Real-time trainer activities, compliance tracking, and revenue ledger.</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20 shadow-sm">
          <Radio size={12} className="animate-pulse text-emerald-500" />
          <span>Real-Time Engine Active</span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* 1. ACTIVE TRAINERS KPI (Requirement 9) */}
        <div 
          onClick={() => setActiveTab('trainers')}
          className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm hover:border-[#E50914] cursor-pointer transition flex justify-between items-start group"
        >
          <div className="space-y-2">
            <span className="text-[11px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Active Trainers</span>
            <p className="text-3xl font-black text-slate-900 dark:text-white group-hover:text-[#E50914] transition">{activeTrainers.length}</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Of {trainers.length} registered roster (Click to view)</p>
          </div>
          <div className="p-3 bg-red-500/10 rounded-xl text-[#E50914] border border-[#E50914]/20 group-hover:scale-110 transition">
            <Users size={20} />
          </div>
        </div>

        {/* 2. Today's Sessions */}
        <div 
          onClick={() => setActiveTab('operations')}
          className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm hover:border-indigo-500 cursor-pointer transition flex justify-between items-start"
        >
          <div className="space-y-2">
            <span className="text-[11px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Today's Sessions</span>
            <p className="text-3xl font-black text-slate-900 dark:text-white">{todayClasses.length}</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-450 font-medium">Scheduled for {todayStr}</p>
          </div>
          <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-500 border border-indigo-500/20">
            <Calendar size={20} />
          </div>
        </div>

        {/* 3. Attendance Compliance */}
        <div 
          onClick={() => setActiveTab('attendance')}
          className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm hover:border-emerald-500 cursor-pointer transition flex justify-between items-start"
        >
          <div className="space-y-2">
            <span className="text-[11px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Attendance Compliance</span>
            <p className="text-3xl font-black text-slate-900 dark:text-white">{complianceRate}%</p>
            <div className="w-24 bg-slate-100 dark:bg-zinc-800 rounded-full h-1.5 mt-1 overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${complianceRate}%` }}></div>
            </div>
          </div>
          <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500 border border-emerald-500/20">
            <Award size={20} />
          </div>
        </div>

        {/* 4. Commercial Revenue */}
        <div 
          onClick={() => setActiveTab('finance')}
          className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm hover:border-amber-500 cursor-pointer transition flex justify-between items-start"
        >
          <div className="space-y-2">
            <span className="text-[11px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Billed Revenue</span>
            <p className="text-3xl font-black text-slate-900 dark:text-white">₹{(totalRevenue / 1000).toFixed(0)}k</p>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">₹{(totalCollections / 1000).toFixed(0)}k Collected</p>
          </div>
          <div className="p-3 bg-amber-500/10 rounded-xl text-amber-500 border border-amber-500/20">
            <Landmark size={20} />
          </div>
        </div>

      </div>

      {/* Main split grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Left 2 cols: Today's Classes Status */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4 border-b border-slate-100 dark:border-zinc-800 pb-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-wide">Today's Class Schedule & Live Check-ins</h3>
              <button
                onClick={() => setActiveTab('operations')}
                className="text-xs text-[#E50914] hover:underline font-bold flex items-center gap-1.5 transition"
              >
                Manage Classes <ArrowUpRight size={14} />
              </button>
            </div>

            {todayClasses.length > 0 ? (
              <div className="divide-y divide-slate-100 dark:divide-zinc-800">
                {todayClasses.map(c => {
                  const checkin = attendanceRecords.find(r => r.trainerId === c.trainerId && r.date === c.date);
                  return (
                    <div key={c.id} className="py-3.5 flex justify-between items-center text-xs">
                      <div>
                        <p className="font-bold text-slate-900 dark:text-slate-100">{c.courseName}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">{c.batchName} • {c.trainerName}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="font-semibold text-slate-700 dark:text-slate-300">{c.startTime} - {c.endTime}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{c.hours} hrs</p>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          checkin 
                            ? checkin.verificationStatus === 'Verified' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                            : 'bg-slate-100 dark:bg-zinc-800 text-slate-500 border border-slate-200 dark:border-zinc-700'
                        }`}>
                          {checkin ? checkin.verificationStatus === 'Verified' ? 'Checked In ✓' : 'Review Required' : 'Pending Check-in'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-400 text-center py-10 font-medium">No sessions scheduled for today.</p>
            )}
          </div>
        </div>

        {/* Right 1 col: Alerts & Exceptions */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-wide border-b border-slate-100 dark:border-zinc-800 pb-2">Operational Alerts</h3>
          
          <div className="space-y-3">
            {/* Geofence Breach Alert */}
            {reviewAttendance.length > 0 ? (
              <div 
                onClick={() => setActiveTab('attendance')}
                className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex gap-3 cursor-pointer hover:bg-amber-500/15 transition shadow-sm"
              >
                <ShieldAlert size={18} className="text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-amber-600 dark:text-amber-400">Geofence Exceptions ({reviewAttendance.length})</h4>
                  <p className="text-[10px] text-slate-500 mt-1 leading-snug font-medium">Trainers checked in outside the site geofence radius.</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400">
                <Award size={28} className="text-emerald-500 mb-2" />
                <p className="text-xs font-bold text-slate-900 dark:text-white">All Clear</p>
                <p className="text-[10px] text-slate-400 mt-0.5">All campus check-ins are verified within geofence boundaries.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
