import React, { useState } from 'react';
import { useDatabase } from '../../context/DatabaseContext';
import { Calendar, MapPin, AlertCircle } from 'lucide-react';


const MobileSchedule: React.FC = () => {
  const { currentUser, schedules, trainers, changeRequests, requestScheduleChange } = useDatabase();
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(null);
  
  // Form State
  const [reqDate, setReqDate] = useState('');
  const [reqStart, setReqStart] = useState('');
  const [reqEnd, setReqEnd] = useState('');
  const [reason, setReason] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Find trainer info
  const trainer = trainers.find(t => t.email === currentUser?.email) || trainers[0];
  const trainerSchedules = schedules.filter(s => s.trainerId === trainer.id);

  // Find change requests for this trainer
  const trainerRequests = changeRequests.filter(r => r.trainerId === trainer.id);

  const handleOpenRequestModal = (schId: string) => {
    const sch = schedules.find(s => s.id === schId);
    if (sch) {
      setSelectedScheduleId(schId);
      setReqDate(sch.date);
      setReqStart(sch.startTime);
      setReqEnd(sch.endTime);
      setReason('');
      setErrorMsg('');
    }
  };

  const handleSubmitRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedScheduleId) return;

    if (!reqDate || !reqStart || !reqEnd || !reason.trim()) {
      setErrorMsg('All fields are required.');
      return;
    }

    // Call request action
    requestScheduleChange({
      scheduleId: selectedScheduleId,
      batchName: schedules.find(s => s.id === selectedScheduleId)?.batchName || '',
      courseName: schedules.find(s => s.id === selectedScheduleId)?.courseName || '',
      originalDate: schedules.find(s => s.id === selectedScheduleId)?.date || '',
      originalStartTime: schedules.find(s => s.id === selectedScheduleId)?.startTime || '',
      originalEndTime: schedules.find(s => s.id === selectedScheduleId)?.endTime || '',
      requestedDate: reqDate,
      requestedStartTime: reqStart,
      requestedEndTime: reqEnd,
      reason: reason.trim()
    });

    // Close Modal
    setSelectedScheduleId(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Completed':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Completed</span>;
      case 'Cancelled':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20">Cancelled</span>;
      case 'Rescheduled':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">Rescheduled</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">Scheduled</span>;
    }
  };

  return (
    <div className="space-y-4 pb-8 text-white relative">
      <div className="flex justify-between items-center">
        <h2 className="text-md font-bold tracking-wide">My Classes</h2>
        <span className="text-[10px] text-slate-400 font-semibold">{trainerSchedules.length} Classes Assigned</span>
      </div>

      {/* Classes list */}
      <div className="space-y-3.5">
        {trainerSchedules
          .sort((a, b) => b.date.localeCompare(a.date)) // newest date first
          .map(sch => {
            const hasPendingRequest = trainerRequests.some(r => r.scheduleId === sch.id && r.status === 'Pending');
            
            return (
              <div key={sch.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-md hover:border-slate-700 transition">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <h4 className="text-sm font-bold text-white leading-snug">{sch.courseName}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">{sch.batchName}</p>
                  </div>
                  {getStatusBadge(sch.status)}
                </div>

                <div className="space-y-1.5 text-xs text-slate-300 font-medium">
                  <div className="flex items-center gap-2">
                    <Calendar size={13} className="text-slate-500 shrink-0" />
                    <span>{sch.date} • {sch.startTime} - {sch.endTime} ({sch.hours} hours)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin size={13} className="text-slate-500 shrink-0 mt-0.5" />
                    <span className="text-slate-400 leading-tight">{sch.siteName}</span>
                  </div>
                </div>

                {sch.status === 'Scheduled' && (
                  <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
                    {hasPendingRequest ? (
                      <span className="text-[10px] text-amber-400 font-semibold flex items-center gap-1">
                        <AlertCircle size={12} /> Change request pending
                      </span>
                    ) : (
                      <>
                        <span></span>
                        <button
                          onClick={() => handleOpenRequestModal(sch.id)}
                          className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition"
                        >
                          Request Reschedule
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
      </div>

      {/* Change Requests Section */}
      {trainerRequests.length > 0 && (
        <div className="mt-6 space-y-3">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Change Requests</h3>
          <div className="space-y-2">
            {trainerRequests.map(req => (
              <div key={req.id} className="bg-slate-900/50 border border-slate-800/80 rounded-xl p-3 text-xs space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-300">{req.courseName}</span>
                  <span className={`px-2 py-0.5 rounded-[4px] text-[9px] font-bold ${
                    req.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                    req.status === 'Rejected' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                    'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}>
                    {req.status}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 space-y-0.5">
                  <p>Proposed: <span className="text-slate-200 font-semibold">{req.requestedDate} @ {req.requestedStartTime}-{req.requestedEndTime}</span></p>
                  <p className="italic">Reason: "{req.reason}"</p>
                  {req.reviewRemarks && <p className="text-blue-400 font-medium">Remarks: "{req.reviewRemarks}"</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {selectedScheduleId && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 w-full max-w-sm space-y-4 shadow-2xl">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-white">Reschedule Request</h3>
              <button 
                onClick={() => setSelectedScheduleId(null)}
                className="text-slate-400 hover:text-white text-xs font-semibold"
              >
                Cancel
              </button>
            </div>
            
            <form onSubmit={handleSubmitRequest} className="space-y-3.5 text-xs text-slate-300">
              {errorMsg && (
                <div className="bg-red-500/15 border border-red-500/30 rounded-lg p-2.5 text-[11px] text-red-400 font-medium">
                  {errorMsg}
                </div>
              )}
              
              <div className="space-y-1">
                <label className="text-slate-400 font-semibold">New Date</label>
                <input 
                  type="date"
                  value={reqDate}
                  onChange={(e) => setReqDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold">Start Time</label>
                  <input 
                    type="time"
                    value={reqStart}
                    onChange={(e) => setReqStart(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white outline-none focus:border-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold">End Time</label>
                  <input 
                    type="time"
                    value={reqEnd}
                    onChange={(e) => setReqEnd(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-semibold">Reason for Request</label>
                <textarea 
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Doctor appointment, severe weather, travel delays..."
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2.5 font-bold transition shadow-lg shadow-blue-900/30"
              >
                Submit Request
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileSchedule;
