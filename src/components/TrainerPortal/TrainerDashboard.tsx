import React from 'react';
import { useDatabase } from '../../context/DatabaseContext';
import { 
  Calendar, Clock, MapPin, CheckCircle, AlertCircle, 
  ArrowRight, MessageSquarePlus, FileText, Landmark, 
  Radio, ShieldAlert
} from 'lucide-react';

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

  const formattedLastLogin = trainer.lastLoginAt 
    ? new Date(trainer.lastLoginAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })
    : '01 Sep 2026, 09:31 AM';

  // Determine real-time check-in status (Requirement 19)
  const getTrainerOperationalStatus = () => {
    if (trainer.status === 'Suspended') return { label: 'Inactive', color: 'bg-rose-500/10 text-rose-500 border-rose-500/20' };
    if (!todayRecord) return { label: 'Not Checked In', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' };
    if (todayRecord.verificationStatus === 'Review') return { label: 'Review Required', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' };
    return { label: 'Checked In', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' };
  };

  const currentStatus = getTrainerOperationalStatus();

  return (
    <div className="space-y-6 text-slate-700 dark:text-slate-350 transition-colors duration-200">
      
      {/* Top Banner Greeting */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-wide">Welcome Back, {trainer.name}</h2>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${currentStatus.color}`}>
              {currentStatus.label}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-450 mt-1 font-medium">
            Here is the real-time summary of your assigned training sessions, hourly delivery, and campus check-ins.
          </p>
        </div>
        
        {/* Last Login display (Requirement 4) */}
        <div className="bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-4 py-2.5 rounded-xl text-left sm:text-right">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Last Login</p>
          <p className="text-xs font-black text-[#E50914] mt-0.5 whitespace-nowrap">
            {formattedLastLogin}
          </p>
        </div>
      </div>

      {/* Grid: 3 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Col 1 & 2: Stats & Today's Attendance Checklist */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Quick Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
              <div className="flex justify-between items-center text-slate-400 mb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider">Today's Hours</span>
                <Clock size={16} className="text-[#E50914]" />
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white">{todayHours}h</p>
              <p className="text-[10px] text-slate-500 mt-1 font-medium">Delivered lecture hours</p>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
              <div className="flex justify-between items-center text-slate-400 mb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider">Accumulated MTD</span>
                <Clock size={16} className="text-[#E50914]" />
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white">{mtdHours}h</p>
              <p className="text-[10px] text-slate-500 mt-1 font-medium">Total hours delivered in cycle</p>
            </div>

            <div 
              className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 cursor-pointer hover:border-red-500/40 transition shadow-sm" 
              onClick={() => setActiveTab('t_salary')}
            >
              <div className="flex justify-between items-center text-slate-400 mb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider">Earnings Rate</span>
                <Landmark size={16} className="text-[#E50914]" />
              </div>
              <p className="text-2xl font-black text-[#E50914] whitespace-nowrap">
                {trainer.rate > 0 ? `₹${trainer.rate}/hr` : `₹${trainer.fixedSalary.toLocaleString()}/mo`}
              </p>
              <p className="text-[10px] text-slate-400 mt-1 font-medium">Click to view earnings ledger</p>
            </div>
          </div>

          {/* Quick Action Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div 
              onClick={() => setActiveTab('t_report')}
              className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:border-red-500/40 rounded-2xl p-5 flex items-center gap-4 cursor-pointer transition shadow-sm"
            >
              <div className="p-3 bg-red-500/10 rounded-xl text-[#E50914] border border-[#E50914]/20">
                <MessageSquarePlus size={20} />
              </div>
              <div>
                <h4 className="font-bold text-xs text-slate-900 dark:text-white">Class Report</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">Submit topic logs</p>
              </div>
            </div>

            <div 
              onClick={() => setActiveTab('t_expenses')}
              className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:border-red-500/40 rounded-2xl p-5 flex items-center gap-4 cursor-pointer transition shadow-sm"
            >
              <div className="p-3 bg-red-500/10 rounded-xl text-[#E50914] border border-[#E50914]/20">
                <FileText size={20} />
              </div>
              <div>
                <h4 className="font-bold text-xs text-slate-900 dark:text-white">Reimbursements</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">Track payment status</p>
              </div>
            </div>

            <div 
              onClick={() => setActiveTab('t_profile')}
              className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:border-red-500/40 rounded-2xl p-5 flex items-center gap-4 cursor-pointer transition shadow-sm"
            >
              <div className="p-3 bg-red-500/10 rounded-xl text-[#E50914] border border-[#E50914]/20">
                <Landmark size={20} />
              </div>
              <div>
                <h4 className="font-bold text-xs text-slate-900 dark:text-white">Resume & Profile</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">Manage digital CV</p>
              </div>
            </div>
          </div>

          {/* Today's Shift Attendance Card */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-4">Today's Shift Attendance</h3>
            {todayRecord ? (
              <div className="flex items-start gap-4">
                <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500 border border-emerald-500/20">
                  <CheckCircle size={22} />
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-sm text-slate-900 dark:text-white">Checked In at {todayRecord.checkInTime}</p>
                  <p className="text-xs text-slate-500 font-medium">Campus Site: <span className="font-bold text-slate-800 dark:text-slate-200">{todayRecord.siteName}</span> ({todayRecord.distanceFromSite}m away)</p>
                  <div className="pt-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                      todayRecord.verificationStatus === 'Verified' 
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                        : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                    }`}>
                      {todayRecord.verificationStatus === 'Verified' ? '✓ Location verified within geofence' : `Flagged: ${todayRecord.verificationStatus}`}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm">
                <div className="flex gap-3">
                  <div className="p-2 bg-red-500/10 rounded-xl text-[#E50914] border border-[#E50914]/20 animate-pulse shrink-0">
                    <AlertCircle size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-900 dark:text-white">Check-in Required</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5">Please check in with live selfie & GPS before beginning training lecture.</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('t_attendance')}
                  className="bg-[#E50914] hover:bg-[#b00610] text-white rounded-xl px-4 py-2.5 text-xs font-bold transition flex items-center gap-1.5 shadow-md shrink-0"
                >
                  MARK ATTENDANCE <ArrowRight size={14} />
                </button>
              </div>
            )}
          </div>

        </div>

        {/* Col 3: Next Assigned Class */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-zinc-800 pb-3 mb-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Next Assigned Class</h3>
              <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-red-500/10 text-[#E50914] border border-[#E50914]/20">Active Schedule</span>
            </div>

            {nextClass ? (
              <div className="space-y-4">
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white leading-tight">{nextClass.courseName}</h4>
                  <p className="text-xs text-slate-500 mt-1 font-semibold">Batch: {nextClass.batchName}</p>
                </div>
                
                <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-350 font-medium">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-slate-400 shrink-0" />
                    <span>{nextClass.date === todayStr ? 'Today' : nextClass.date} • {nextClass.startTime} - {nextClass.endTime} ({nextClass.hours} hrs)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin size={14} className="text-slate-400 shrink-0 mt-0.5" />
                    <span className="leading-tight text-slate-500">{nextClass.siteName}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400 space-y-2">
                <Calendar size={28} className="text-slate-300 dark:text-zinc-700 mx-auto" />
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">No sessions scheduled</p>
                <p className="text-[10px] text-slate-400 mt-0.5 font-medium">All upcoming lectures have been delivered.</p>
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 dark:border-zinc-800 pt-4 mt-6">
            <button
              onClick={() => setActiveTab('t_schedule')}
              className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 text-xs font-bold text-slate-700 dark:text-slate-300 py-2.5 rounded-xl transition"
            >
              View Complete Schedule
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default TrainerDashboard;
