import React from 'react';
import { useDatabase } from '../../context/DatabaseContext';
import { Calendar, Clock, MapPin, CheckCircle, AlertCircle, ArrowRight, FileText, Landmark, MessageSquarePlus } from 'lucide-react';

interface MobileDashboardProps {
  setActiveTab: (tab: 'dashboard' | 'schedule' | 'attendance' | 'profile' | 'expenses' | 'salary' | 'report') => void;
}

const MobileDashboard: React.FC<MobileDashboardProps> = ({ setActiveTab }) => {
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
    <div className="space-y-4 pb-6 text-white">
      {/* Header Profile Greeting */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Spark Operations</p>
          <h2 className="text-md font-bold text-white tracking-wide">{trainer.name}</h2>
        </div>
        <img
          src={currentUser?.avatar || "https://via.placeholder.com/150"}
          alt="profile"
          className="w-9 h-9 rounded-full border border-rose-600 shadow-md object-cover"
        />
      </div>

      {/* Attendance Status Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">Today's Attendance</h3>
        {todayRecord ? (
          <div className="flex items-start gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-500 border border-emerald-500/20">
              <CheckCircle size={20} />
            </div>
            <div>
              <p className="font-bold text-xs text-slate-100">Checked-in Successfully</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Time: {todayRecord.checkInTime} at {todayRecord.siteName}</p>
              <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                {todayRecord.verificationStatus === 'Verified' ? 'Within Geofence' : `Flagged: ${todayRecord.verificationStatus}`}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-start justify-between gap-3">
            <div className="flex gap-3">
              <div className="p-2 bg-rose-500/10 rounded-xl text-rose-500 border border-rose-500/20 animate-pulse">
                <AlertCircle size={20} />
              </div>
              <div>
                <p className="font-bold text-xs text-slate-100">Attendance Pending</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Please check in before class begins.</p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('attendance')}
              className="bg-rose-650 hover:bg-rose-600 text-white rounded-lg px-2.5 py-1.5 text-[10px] font-bold transition flex items-center gap-1 shadow-md shadow-rose-900/30 shrink-0"
            >
              Mark <ArrowRight size={12} />
            </button>
          </div>
        )}
      </div>

      {/* Quick Action Hub */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => setActiveTab('report')}
          className="bg-slate-900 hover:border-rose-900/50 border border-slate-800 rounded-xl p-2.5 flex flex-col items-center text-center gap-1.5 transition"
        >
          <MessageSquarePlus size={16} className="text-rose-500" />
          <span className="text-[9px] font-bold text-slate-350">File Report</span>
        </button>
        <button
          onClick={() => setActiveTab('expenses')}
          className="bg-slate-900 hover:border-rose-900/50 border border-slate-800 rounded-xl p-2.5 flex flex-col items-center text-center gap-1.5 transition"
        >
          <FileText size={16} className="text-rose-500" />
          <span className="text-[9px] font-bold text-slate-350">Expenses</span>
        </button>
        <button
          onClick={() => setActiveTab('salary')}
          className="bg-slate-900 hover:border-rose-900/50 border border-slate-800 rounded-xl p-2.5 flex flex-col items-center text-center gap-1.5 transition"
        >
          <Landmark size={16} className="text-rose-500" />
          <span className="text-[9px] font-bold text-slate-350">Earnings</span>
        </button>
      </div>

      {/* Hours Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Today's Hours</span>
            <Clock size={14} className="text-rose-500" />
          </div>
          <div>
            <p className="text-xl font-black text-white">{todayHours}h</p>
            <p className="text-[8px] text-slate-500 mt-0.5">Approved duration</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">MTD Hours</span>
            <Clock size={14} className="text-rose-500" />
          </div>
          <div>
            <p className="text-xl font-black text-white">{mtdHours}h</p>
            <p className="text-[8px] text-slate-500 mt-0.5">Accumulated MTD</p>
          </div>
        </div>
      </div>

      {/* Next Session Details */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3 border-b border-slate-850 pb-2">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Next Session</span>
          <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-rose-500/10 text-rose-455 border border-rose-500/20">Upcoming</span>
        </div>
        {nextClass ? (
          <div className="space-y-3">
            <div>
              <p className="text-xs font-bold text-white leading-tight">{nextClass.courseName}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">{nextClass.batchName}</p>
            </div>
            
            <div className="space-y-1.5 text-[11px] text-slate-300 font-medium">
              <div className="flex items-center gap-2">
                <Calendar size={12} className="text-slate-550 shrink-0" />
                <span>{nextClass.date === todayStr ? 'Today' : nextClass.date} • {nextClass.startTime} - {nextClass.endTime}</span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin size={12} className="text-slate-550 shrink-0 mt-0.5" />
                <span className="leading-tight text-slate-400">{nextClass.siteName}</span>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-[11px] text-slate-500 text-center py-4">No scheduled sessions remaining for today.</p>
        )}
      </div>

      {/* Quick Pay Estimate Widget */}
      <div 
        onClick={() => setActiveTab('salary')}
        className="bg-gradient-to-r from-rose-950/20 to-slate-900 border border-rose-900/15 rounded-xl p-4 flex items-center justify-between cursor-pointer hover:border-rose-900/40 transition"
      >
        <div>
          <p className="text-[9px] text-rose-455 font-bold uppercase tracking-wider">Estimated Pay (MTD)</p>
          <p className="text-lg font-black text-rose-455 mt-0.5">
            ₹{trainer.rate > 0 ? (mtdHours * trainer.rate).toLocaleString() : trainer.fixedSalary.toLocaleString()}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[9px] text-slate-500">Contract Rate</p>
          <p className="text-[11px] font-bold text-slate-300 mt-0.5">
            {trainer.rate > 0 ? `₹${trainer.rate}/hr` : `Fixed: ₹${trainer.fixedSalary}/mo`}
          </p>
        </div>
      </div>
    </div>
  );
};

export default MobileDashboard;
