import React from 'react';
import { useDatabase } from '../../context/DatabaseContext';
import { Users, Calendar, ShieldAlert, Award, Clock, ArrowUpRight } from 'lucide-react';


interface DashboardProps {
  setActiveTab: (tab: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ setActiveTab }) => {
  const { trainers, schedules, attendanceRecords, changeRequests } = useDatabase();

  const activeTrainers = trainers.filter(t => t.status === 'Active');
  const pendingRequests = changeRequests.filter(r => r.status === 'Pending');
  const reviewAttendance = attendanceRecords.filter(r => r.verificationStatus === 'Review');

  // Today's classes count
  const todayStr = new Date().toISOString().split('T')[0];
  const todayClasses = schedules.filter(s => s.date === todayStr);

  // Compute compliance rate (verified / total today and past check-ins)
  const pastCheckins = attendanceRecords.length;
  const verifiedCheckins = attendanceRecords.filter(r => r.verificationStatus === 'Verified' || r.verificationStatus === 'Corrected').length;
  const complianceRate = pastCheckins > 0 ? Math.round((verifiedCheckins / pastCheckins) * 100) : 100;

  return (
    <div className="space-y-6 text-slate-700 dark:text-slate-300 transition-colors duration-200">
      {/* Top Banner Greeting */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white tracking-wide">Operational Dashboard</h2>
          <p className="text-xs text-slate-500 dark:text-slate-450 mt-0.5 font-medium">Real-time trainer activities and compliance tracking.</p>
        </div>
        <div className="text-xs text-slate-600 dark:text-slate-400 font-bold bg-white dark:bg-zinc-900 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 shadow-sm">
          Last Updated: Just Now
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Trainers */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition flex justify-between items-start">
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Active Trainers</span>
            <p className="text-2xl font-black text-slate-850 dark:text-white">{activeTrainers.length}</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Of {trainers.length} total registered</p>
          </div>
          <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500 border border-blue-500/20">
            <Users size={18} />
          </div>
        </div>

        {/* Today's Classes */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition flex justify-between items-start">
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Today's Sessions</span>
            <p className="text-2xl font-black text-slate-855 dark:text-white">{todayClasses.length}</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Scheduled for {todayStr}</p>
          </div>
          <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-550 dark:text-indigo-400 border border-indigo-500/20">
            <Calendar size={18} />
          </div>
        </div>

        {/* Compliance Rate */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition flex justify-between items-start">
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Attendance Compliance</span>
            <p className="text-2xl font-black text-slate-855 dark:text-white">{complianceRate}%</p>
            <div className="w-24 bg-slate-100 dark:bg-zinc-800 rounded-full h-1.5 mt-1 overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${complianceRate}%` }}></div>
            </div>
          </div>
          <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500 border border-emerald-500/20">
            <Award size={18} />
          </div>
        </div>

        {/* Geofence Exceptions */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition flex justify-between items-start">
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Geofence Alerts</span>
            <p className="text-2xl font-black text-slate-855 dark:text-white">{reviewAttendance.length}</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Require HR/Admin approval</p>
          </div>
          <div className="p-3 bg-amber-500/10 rounded-xl text-amber-500 border border-amber-500/20">
            <ShieldAlert size={18} />
          </div>
        </div>
      </div>

      {/* Main split grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left 2 cols: Today's Classes Status */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800/80 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4 border-b border-slate-100 dark:border-zinc-800 pb-2">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white tracking-wide">Today's Class Schedule</h3>
              <button
                onClick={() => setActiveTab('operations')}
                className="text-xs text-rose-500 hover:text-rose-600 font-bold flex items-center gap-1.5 transition"
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
                        <p className="font-bold text-slate-800 dark:text-slate-200">{c.courseName}</p>
                        <p className="text-[10px] text-slate-450 dark:text-slate-500 mt-0.5">{c.batchName} • {c.trainerName}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="font-semibold text-slate-700 dark:text-slate-350">{c.startTime} - {c.endTime}</p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{c.hours} hrs</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded-[4px] text-[10px] font-bold ${
                          checkin 
                            ? checkin.verificationStatus === 'Verified' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                            : 'bg-slate-50 dark:bg-zinc-800 text-slate-400 dark:text-slate-550 border border-slate-200 dark:border-zinc-700'
                        }`}>
                          {checkin ? checkin.verificationStatus === 'Verified' ? 'Attended' : 'Review Exception' : 'Pending Checkin'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-10 font-medium">No sessions scheduled for today.</p>
            )}
          </div>
        </div>

        {/* Right 1 col: Alerts & Notifications */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800/80 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white tracking-wide border-b border-slate-100 dark:border-zinc-800 pb-2">Tasks Requiring Attention</h3>
          
          <div className="space-y-3">
            {/* Geofence Breach Alert */}
            {reviewAttendance.length > 0 ? (
              <div 
                onClick={() => setActiveTab('attendance')}
                className="bg-amber-500/5 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl p-3 flex gap-3 cursor-pointer hover:bg-amber-500/10 dark:hover:bg-amber-500/15 transition shadow-sm"
              >
                <ShieldAlert size={18} className="text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-amber-600 dark:text-amber-400">Geofence Breaches ({reviewAttendance.length})</h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-450 mt-1 leading-snug font-medium">Trainers checked in outside the site boundary.</p>
                </div>
              </div>
            ) : null}

            {/* Schedule change request Alert */}
            {pendingRequests.length > 0 ? (
              <div 
                onClick={() => setActiveTab('operations')}
                className="bg-blue-500/5 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-xl p-3 flex gap-3 cursor-pointer hover:bg-blue-500/10 dark:hover:bg-blue-500/15 transition shadow-sm"
              >
                <Clock size={18} className="text-blue-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-blue-500">Reschedule Requests ({pendingRequests.length})</h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-450 mt-1 leading-snug font-medium">Trainers requested schedule updates.</p>
                </div>
              </div>
            ) : null}

            {reviewAttendance.length === 0 && pendingRequests.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400 dark:text-slate-500">
                <ShieldAlert size={28} className="text-slate-300 dark:text-zinc-700 mb-2" />
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">All Clear</p>
                <p className="text-[10px] text-slate-450 dark:text-slate-500 max-w-[160px] mt-0.5">No pending exceptions or schedule changes.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
