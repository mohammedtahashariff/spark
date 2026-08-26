import React from 'react';
import { useDatabase } from '../../context/DatabaseContext';
import { Calendar, Clock, MapPin, CheckCircle, AlertCircle, ArrowRight, MessageSquarePlus, FileText, Landmark } from 'lucide-react';

interface TrainerDashboardProps {
  setActiveTab: (tab: string) => void;
}

const TrainerDashboard: React.FC<TrainerDashboardProps> = ({ setActiveTab }) => {
  const { currentUser, schedules, attendanceRecords, trainers } = useDatabase();

  const trainer = trainers.find(t => t.email === currentUser?.email) || trainers[0];
  const todayStr = new Date().toISOString().split('T')[0];

  const todayRecord = attendanceRecords.find(
    r => r.trainerId === trainer.id && r.date === todayStr
  );

  const trainerCompletedClasses = schedules.filter(
    s => s.trainerId === trainer.id && s.status === 'Completed'
  );
  
  const todayHours = trainerCompletedClasses
    .filter(s => s.date === todayStr)
    .reduce((sum, s) => sum + s.hours, 0);

  const mtdHours = trainerCompletedClasses
    .filter(s => s.date.startsWith(todayStr.substring(0, 7)))
    .reduce((sum, s) => sum + s.hours, 0);

  const upcomingClasses = schedules
    .filter(s => s.trainerId === trainer.id && s.status === 'Scheduled' && s.date >= todayStr)
    .sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.startTime.localeCompare(b.startTime);
    });
  const nextClass = upcomingClasses[0];

  return (
    <div className="space-y-6 text-slate-700 dark:text-slate-350 transition-colors duration-200">
      {/* Top Banner Greeting */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800/80 rounded-2xl p-6 gap-4 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-850 dark:text-white tracking-wide">Welcome Back, {trainer.name}</h2>
          <p className="text-xs text-slate-500 dark:text-slate-450 mt-1 font-medium">Here is the summary of your training sessions and deliverables for this cycle.</p>
        </div>
        
        <div className="bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-850 px-4 py-2.5 rounded-xl text-right">
          <p className="text-[10px] text-slate-455 dark:text-slate-500 font-bold uppercase tracking-wider">Contract Profile</p>
          <p className="text-xs font-black text-rose-600 dark:text-rose-500 mt-0.5 whitespace-nowrap">
            {trainer.rate > 0 ? `₹${trainer.rate}/hour (Hourly)` : `₹${trainer.fixedSalary.toLocaleString()}/mo (Fixed)`}
          </p>
        </div>
      </div>

      {/* Grid: 3 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Col 1 & 2: Stats & Today's Checklist */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Quick Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800/80 rounded-2xl p-5 shadow-sm">
              <div className="flex justify-between items-center text-slate-400 dark:text-slate-500 mb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider">Today's Hours</span>
                <Clock size={16} className="text-rose-500" />
              </div>
              <p className="text-2xl font-black text-slate-850 dark:text-white">{todayHours}h</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-medium">Class log duration completed</p>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800/80 rounded-2xl p-5 shadow-sm">
              <div className="flex justify-between items-center text-slate-400 dark:text-slate-500 mb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider">Accumulated MTD</span>
                <Clock size={16} className="text-rose-500" />
              </div>
              <p className="text-2xl font-black text-slate-850 dark:text-white">{mtdHours}h</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-medium">Hours delivered in August</p>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800/80 rounded-2xl p-5 cursor-pointer hover:border-rose-500/40 dark:hover:border-rose-900/40 transition shadow-sm" onClick={() => setActiveTab('t_salary')}>
              <div className="flex justify-between items-center text-slate-400 dark:text-slate-500 mb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider">Estimated Pay</span>
                <Landmark size={16} className="text-rose-500" />
              </div>
              <p className="text-2xl font-black text-rose-600 dark:text-rose-500 whitespace-nowrap">
                ₹{trainer.rate > 0 ? (mtdHours * trainer.rate).toLocaleString() : trainer.fixedSalary.toLocaleString()}
              </p>
              <p className="text-[10px] text-slate-455 dark:text-slate-500 mt-1 font-medium">Click to view payouts terms</p>
            </div>
          </div>

          {/* Quick Action Navigation Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div 
              onClick={() => setActiveTab('t_report')}
              className="bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800/80 hover:border-rose-500/40 dark:hover:border-rose-900/40 rounded-2xl p-5 flex items-center gap-4 cursor-pointer transition shadow-sm"
            >
              <div className="p-3 bg-rose-500/10 rounded-xl text-rose-500 border border-rose-500/20">
                <MessageSquarePlus size={20} />
              </div>
              <div>
                <h4 className="font-bold text-xs text-slate-850 dark:text-white">File Class Report</h4>
                <p className="text-[10px] text-slate-455 dark:text-slate-500 mt-0.5 font-semibold">Submit delivered topics</p>
              </div>
            </div>

            <div 
              onClick={() => setActiveTab('t_expenses')}
              className="bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800/80 hover:border-rose-500/40 dark:hover:border-rose-900/40 rounded-2xl p-5 flex items-center gap-4 cursor-pointer transition shadow-sm"
            >
              <div className="p-3 bg-rose-500/10 rounded-xl text-rose-500 border border-rose-500/20">
                <FileText size={20} />
              </div>
              <div>
                <h4 className="font-bold text-xs text-slate-850 dark:text-white">Claim Reimburse</h4>
                <p className="text-[10px] text-slate-455 dark:text-slate-500 mt-0.5 font-semibold">Submit cab fare & meals</p>
              </div>
            </div>

            <div 
              onClick={() => setActiveTab('t_salary')}
              className="bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800/80 hover:border-rose-500/40 dark:hover:border-rose-900/40 rounded-2xl p-5 flex items-center gap-4 cursor-pointer transition shadow-sm"
            >
              <div className="p-3 bg-rose-500/10 rounded-xl text-rose-500 border border-rose-500/20">
                <Landmark size={20} />
              </div>
              <div>
                <h4 className="font-bold text-xs text-slate-855 dark:text-white">Earnings & Payslips</h4>
                <p className="text-[10px] text-slate-455 dark:text-slate-500 mt-0.5 font-semibold">View payouts ledger</p>
              </div>
            </div>
          </div>

          {/* Today's Attendance card */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800/80 rounded-2xl p-5 shadow-sm">
            <h3 className="text-xs font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider mb-4">Today's Shift Attendance</h3>
            {todayRecord ? (
              <div className="flex items-start gap-4">
                <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500 border border-emerald-500/20">
                  <CheckCircle size={22} />
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-sm text-slate-850 dark:text-slate-200">Attendance marked successfully.</p>
                  <p className="text-xs text-slate-500 dark:text-slate-450 font-medium">Checked in at {todayRecord.checkInTime} for site: <span className="font-semibold text-slate-800 dark:text-slate-300">{todayRecord.siteName}</span></p>
                  <div className="pt-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                      todayRecord.verificationStatus === 'Verified' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/15 text-rose-600 dark:text-rose-455 border border-rose-500/20'
                    }`}>
                      {todayRecord.verificationStatus === 'Verified' ? 'Location verified within geofence' : `Flagged exception: ${todayRecord.verificationStatus}`}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 dark:bg-zinc-950 border border-slate-150 dark:border-zinc-855 rounded-xl p-4 shadow-sm">
                <div className="flex gap-3">
                  <div className="p-2 bg-rose-500/10 rounded-xl text-rose-500 border border-rose-500/20 animate-pulse shrink-0">
                    <AlertCircle size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-850 dark:text-slate-100">Check-in Required</h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">Please check in with camera and geofence verification before beginning session.</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('t_attendance')}
                  className="bg-rose-600 hover:bg-rose-700 text-white rounded-lg px-4 py-2 text-xs font-bold transition flex items-center gap-1 shadow shrink-0"
                >
                  Go to Check-in <ArrowRight size={14} />
                </button>
              </div>
            )}
          </div>

        </div>

        {/* Col 3: Next Session Details */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800/80 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-zinc-800 pb-3 mb-4">
              <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Next Assigned Class</h3>
              <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-rose-500/10 text-rose-600 dark:text-rose-455 border border-rose-500/20">Active Schedule</span>
            </div>

            {nextClass ? (
              <div className="space-y-4">
                <div>
                  <h4 className="font-extrabold text-sm text-slate-800 dark:text-white leading-tight">{nextClass.courseName}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-450 mt-1 font-semibold">Batch: {nextClass.batchName}</p>
                </div>
                
                <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-350 font-medium">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-slate-400 dark:text-slate-550 shrink-0" />
                    <span>{nextClass.date === todayStr ? 'Today' : nextClass.date} • {nextClass.startTime} - {nextClass.endTime} ({nextClass.hours} hrs)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin size={14} className="text-slate-400 dark:text-slate-550 shrink-0 mt-0.5" />
                    <span className="leading-tight text-slate-500 dark:text-slate-400">{nextClass.siteName}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400 dark:text-slate-500 space-y-2">
                <Calendar size={28} className="text-slate-300 dark:text-zinc-700 mx-auto" />
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">No sessions scheduled</p>
                <p className="text-[10px] text-slate-450 dark:text-slate-550 mt-0.5 font-medium">All classes for today and subsequent dates are complete.</p>
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 dark:border-zinc-800 pt-4 mt-6">
            <button
              onClick={() => setActiveTab('t_schedule')}
              className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-900 text-xs font-bold text-slate-700 dark:text-slate-300 py-2.5 rounded-xl transition"
            >
              View Complete Calendar
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default TrainerDashboard;
