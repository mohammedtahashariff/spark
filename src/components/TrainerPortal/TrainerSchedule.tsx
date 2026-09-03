import React, { useState } from 'react';
import { useDatabase } from '../../context/DatabaseContext';
import { Calendar, Clock, MapPin, Plus, X } from 'lucide-react';

const TrainerSchedule: React.FC = () => {
  const { currentUser, schedules, changeRequests, trainers, requestScheduleChange } = useDatabase();
  const [showRequest, setShowRequest] = useState(false);

  const trainer = trainers.find(t => t.email === currentUser?.email) || trainers[0];
  const trainerSchedules = schedules.filter(s => s.trainerId === trainer.id);
  const trainerRequests = changeRequests.filter(r => r.trainerId === trainer.id);

  // Form State
  const [scheduleId, setScheduleId] = useState('');
  const [reqDate, setReqDate] = useState('');
  const [reqStart, setReqStart] = useState('09:00');
  const [reqEnd, setReqEnd] = useState('12:00');
  const [reason, setReason] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmitRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleId || !reqDate || !reqStart || !reqEnd || !reason.trim()) {
      setErrorMsg('All fields are required.');
      return;
    }

    const selectedClass = schedules.find(s => s.id === scheduleId);
    if (!selectedClass) return;

    requestScheduleChange({
      scheduleId,
      batchName: selectedClass.batchName,
      courseName: selectedClass.courseName,
      originalDate: selectedClass.date,
      originalStartTime: selectedClass.startTime,
      originalEndTime: selectedClass.endTime,
      requestedDate: reqDate,
      requestedStartTime: reqStart,
      requestedEndTime: reqEnd,
      reason: reason.trim()
    });

    setScheduleId('');
    setReqDate('');
    setReason('');
    setErrorMsg('');
    setShowRequest(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Approved':
        return <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-455 border border-emerald-500/20">Approved</span>;
      case 'Rejected':
        return <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-rose-500/10 text-rose-455 border border-rose-500/20">Rejected</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-455 border border-amber-500/20 animate-pulse">Pending Review</span>;
    }
  };

  return (
    <div className="space-y-6 text-slate-705 dark:text-slate-350 flex flex-col h-full relative transition-colors duration-200">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white tracking-wide">My Training Schedule</h2>
          <p className="text-xs text-slate-500 dark:text-slate-455 mt-0.5 font-medium">Track your upcoming classes, past lectures, and submit calendar adjustment requests.</p>
        </div>

        <button
          onClick={() => setShowRequest(true)}
          className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl px-4 py-2 text-xs font-bold transition flex items-center gap-1.5 shadow"
        >
          <Plus size={16} /> Request Reschedule
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-grow overflow-hidden">
        
        {/* Left 2 Cols: Schedule Calendar List */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800/80 rounded-2xl p-5 flex flex-col h-full shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-4">Class Schedule Feed</h3>
          
          <div className="flex-1 overflow-y-auto space-y-3.5 custom-scrollbar pr-1">
            {trainerSchedules
              .sort((a, b) => a.date.localeCompare(b.date))
              .map(cls => (
                <div key={cls.id} className="bg-slate-50 dark:bg-zinc-950 border border-slate-150 dark:border-zinc-855 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
                  <div className="space-y-2">
                    <div>
                      <h4 className="font-extrabold text-xs text-slate-800 dark:text-slate-200 leading-tight">{cls.courseName}</h4>
                      <p className="text-[10px] text-slate-500 mt-0.5 font-semibold">Batch: {cls.batchName}</p>
                    </div>

                    <div className="flex flex-wrap gap-4 text-[10px] text-slate-600 dark:text-slate-400 font-bold">
                      <span className="flex items-center gap-1"><Calendar size={12} className="text-rose-500" /> {cls.date}</span>
                      <span className="flex items-center gap-1"><Clock size={12} className="text-rose-500" /> {cls.startTime} - {cls.endTime} ({cls.hours} hrs)</span>
                      <span className="flex items-center gap-1"><MapPin size={12} className="text-rose-500" /> {cls.siteName}</span>
                    </div>
                  </div>

                  <div className="shrink-0 font-bold">
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-wide uppercase ${
                      cls.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-650 dark:text-emerald-400 border border-emerald-500/20' :
                      cls.status === 'Cancelled' ? 'bg-rose-500/10 text-rose-650 dark:text-rose-455 border border-rose-500/20' :
                      'bg-rose-500/10 text-rose-600 dark:text-rose-550 border border-rose-500/20'
                    }`}>
                      {cls.status}
                    </span>
                  </div>
                </div>
              ))}

            {trainerSchedules.length === 0 && (
              <p className="text-xs text-slate-500 text-center py-12 font-medium">No classes scheduled under your roster.</p>
            )}
          </div>
        </div>

        {/* Right 1 Col: Change Requests list */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800/80 rounded-2xl p-4 flex flex-col h-full shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-3">Reschedule Requests</h3>
          
          <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-1">
            {trainerRequests
              .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
              .map(req => (
                <div key={req.id} className="bg-slate-50 dark:bg-zinc-950/60 border border-slate-150 dark:border-zinc-855 rounded-xl p-3 space-y-2.5 shadow-sm font-semibold">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200">Ref: #{req.id.substring(0, 5)}</span>
                    {getStatusBadge(req.status)}
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-800 dark:text-slate-350 font-bold truncate">{req.courseName}</p>
                    <p className="text-[9px] text-slate-500 mt-1">Requested date: {req.requestedDate} ({req.requestedStartTime} - {req.requestedEndTime})</p>
                  </div>
                  <p className="text-[10px] text-slate-600 dark:text-slate-450 italic leading-snug">"Reason: {req.reason}"</p>
                </div>
              ))}

            {trainerRequests.length === 0 && (
              <p className="text-xs text-slate-400 dark:text-slate-550 text-center py-12 font-medium">No adjustment requests logged.</p>
            )}
          </div>
        </div>

      </div>

      {/* Reschedule Request Modal */}
      {showRequest && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800 rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-zinc-800 pb-2">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">Request Reschedule</h3>
              <button onClick={() => setShowRequest(false)} className="text-slate-400 dark:text-slate-500 hover:text-slate-950 dark:hover:text-white transition"><X size={18} /></button>
            </div>

            <form onSubmit={handleSubmitRequest} className="space-y-3.5 text-xs text-slate-700 dark:text-slate-300">
              {errorMsg && (
                <div className="bg-rose-500/15 border border-rose-500/30 text-rose-650 dark:text-rose-455 p-2 rounded-lg font-medium">
                  {errorMsg}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[9px]">Select Class *</label>
                <select
                  required
                  value={scheduleId}
                  onChange={(e) => setScheduleId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg p-2.5 text-slate-800 dark:text-white outline-none focus:border-rose-600 font-semibold"
                >
                  <option value="">Select Scheduled Class</option>
                  {trainerSchedules.filter(s => s.status === 'Scheduled').map(s => (
                    <option key={s.id} value={s.id}>{s.courseName} ({s.date})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[9px]">Requested Date *</label>
                <input
                  type="date"
                  required
                  value={reqDate}
                  onChange={(e) => setReqDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg p-2.5 text-slate-800 dark:text-white outline-none focus:border-rose-600 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[9px]">Start Time</label>
                  <input
                    type="time"
                    required
                    value={reqStart}
                    onChange={(e) => setReqStart(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-205 dark:border-zinc-800 rounded-lg p-2 text-slate-800 dark:text-white outline-none focus:border-rose-600 font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[9px]">End Time</label>
                  <input
                    type="time"
                    required
                    value={reqEnd}
                    onChange={(e) => setReqEnd(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-205 dark:border-zinc-800 rounded-lg p-2 text-slate-800 dark:text-white outline-none focus:border-rose-600 font-semibold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[9px]">Reason / Justification *</label>
                <textarea
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Justify rescheduling request..."
                  rows={3}
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg p-2.5 text-slate-800 dark:text-white outline-none focus:border-rose-600 resize-none font-semibold"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-rose-600 hover:bg-rose-700 text-white rounded-xl py-2.5 font-bold transition shadow"
              >
                Submit Adjustment Request
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default TrainerSchedule;
