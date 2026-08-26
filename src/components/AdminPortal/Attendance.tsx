import React, { useState } from 'react';
import { useDatabase } from '../../context/DatabaseContext';
import { Check, X, ShieldAlert, ShieldCheck, MapPin, ZoomIn } from 'lucide-react';


const Attendance: React.FC = () => {
  const { attendanceRecords, reviewAttendance } = useDatabase();
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  
  // Correction override form
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [decision, setDecision] = useState<'Corrected' | 'Rejected'>('Corrected');
  const [remarks, setRemarks] = useState('');

  const handleOpenOverride = (recId: string, type: 'Corrected' | 'Rejected') => {
    setSelectedRecordId(recId);
    setDecision(type);
    setRemarks('');
  };

  const handleSubmitOverride = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecordId || !remarks.trim()) return;

    reviewAttendance(selectedRecordId, decision, remarks.trim());
    setSelectedRecordId(null);
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'Verified':
        return <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Verified</span>;
      case 'Corrected':
        return <span className="px-2 py-0.5 rounded text-[10px] font-black bg-blue-500/10 text-blue-400 border border-blue-500/20">Corrected</span>;
      case 'Rejected':
        return <span className="px-2 py-0.5 rounded text-[10px] font-black bg-red-500/10 text-red-400 border border-red-500/20">Rejected</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse">Review Exception</span>;
    }
  };

  return (
    <div className="space-y-5 text-slate-700 dark:text-slate-350 relative h-full flex flex-col transition-colors duration-200">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-white tracking-wide font-sans">Attendance Exceptions (HR Feed)</h2>
        <p className="text-xs text-slate-500 dark:text-slate-450 mt-0.5 font-medium">Audit live selfies, GPS geofencing, and approve/correct attendance checks.</p>
      </div>

      {/* Grid of records */}
      <div className="flex-grow overflow-y-auto space-y-4 pr-1 custom-scrollbar">
        {attendanceRecords.length > 0 ? (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {attendanceRecords
              .sort((a, b) => b.serverTimestamp.localeCompare(a.serverTimestamp)) // newest first
              .map(record => {
                const isBreach = record.verificationStatus === 'Review';
                return (
                  <div 
                    key={record.id} 
                    className={`bg-white dark:bg-zinc-900 border rounded-2xl p-5 shadow-sm hover:shadow-md flex gap-4 transition duration-200 ${
                      isBreach 
                        ? 'border-amber-400/40 dark:border-amber-500/30' 
                        : 'border-slate-150 dark:border-zinc-800/80'
                    }`}
                  >
                    {/* Selfie Preview with Hover zoom */}
                    <div className="relative w-24 h-28 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 shrink-0 shadow-inner group">
                      <img 
                        src={record.selfieUrl} 
                        alt="Trainer Selfie" 
                        className="w-full h-full object-cover" 
                      />
                      <button 
                        onClick={() => setZoomedImage(record.selfieUrl)}
                        className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition duration-200"
                        title="Zoom Image"
                      >
                        <ZoomIn size={18} />
                      </button>
                    </div>

                    {/* Metadata & Actions */}
                    <div className="flex-1 min-w-0 space-y-3">
                      
                      {/* Name & status */}
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">{record.trainerName}</h4>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 font-bold">{record.date} @ {record.checkInTime}</p>
                        </div>
                        {getStatusLabel(record.verificationStatus)}
                      </div>

                      {/* Site & Distance */}
                      <div className="space-y-1.5 text-xs font-semibold">
                        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                          <MapPin size={13} className="text-slate-400 dark:text-slate-600 shrink-0" />
                          <span className="truncate" title={record.siteName}>{record.siteName}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {isBreach ? (
                            <ShieldAlert size={13} className="text-amber-500 shrink-0" />
                          ) : (
                            <ShieldCheck size={13} className="text-emerald-500 shrink-0" />
                          )}
                          <span className={`font-bold ${isBreach ? 'text-amber-600 dark:text-amber-400' : 'text-slate-600 dark:text-slate-350'}`}>
                            {record.distanceFromSite} meters away {isBreach ? '(Geofence Breach)' : '(Within Geofence)'}
                          </span>
                        </div>
                      </div>

                      {/* Admin remarks / review info */}
                      {record.adminRemarks && (
                        <div className="bg-slate-50 dark:bg-zinc-950 border border-slate-150 dark:border-zinc-850 rounded-xl p-2.5 text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                          <p className="font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide text-[9px] mb-0.5">Admin Remarks</p>
                          <p className="italic leading-normal">"{record.adminRemarks}"</p>
                          {record.reviewedBy && (
                            <p className="text-[9px] text-rose-500 font-bold mt-1">Reviewed by: {record.reviewedBy}</p>
                          )}
                        </div>
                      )}

                      {/* Action buttons for pending Review exceptions */}
                      {record.verificationStatus === 'Review' && (
                        <div className="pt-2 border-t border-slate-100 dark:border-zinc-800 flex gap-2">
                          <button
                            onClick={() => handleOpenOverride(record.id, 'Corrected')}
                            className="bg-rose-50 dark:bg-rose-950 hover:bg-rose-100 dark:hover:bg-rose-900 border border-rose-200 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 rounded-lg px-2.5 py-1 text-[11px] font-bold transition flex items-center gap-1"
                          >
                            <Check size={12} /> Approve Exception
                          </button>
                          <button
                            onClick={() => handleOpenOverride(record.id, 'Rejected')}
                            className="bg-red-50 dark:bg-red-950 hover:bg-red-100 dark:hover:bg-red-900 border border-red-200 dark:border-red-900/30 text-red-650 dark:text-red-400 rounded-lg px-2.5 py-1 text-[11px] font-bold transition flex items-center gap-1"
                          >
                            <X size={12} /> Reject Check-in
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        ) : (
          <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-16 font-medium">No check-in records captured in the database yet.</p>
        )}
      </div>

      {/* Zoomed Image Lightbox */}
      {zoomedImage && (
        <div 
          className="fixed inset-0 bg-black/90 z-[99] flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setZoomedImage(null)}
        >
          <div className="relative max-w-md w-full aspect-square overflow-hidden rounded-2xl border border-slate-800 bg-slate-950">
            <img 
              src={zoomedImage} 
              alt="Selfie Zoomed" 
              className="w-full h-full object-cover"
            />
            <button 
              onClick={() => setZoomedImage(null)}
              className="absolute top-4 right-4 bg-slate-900/80 border border-slate-800 p-1.5 rounded-full text-white text-xs font-bold hover:bg-slate-800"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Exception Override Modal */}
      {selectedRecordId && (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 w-full max-w-sm space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-850 pb-2">
              <h3 className="text-sm font-bold text-white">Attendance Verification Override</h3>
              <button onClick={() => setSelectedRecordId(null)} className="text-slate-400 hover:text-white"><X size={18} /></button>
            </div>

            <form onSubmit={handleSubmitOverride} className="space-y-4 text-xs text-slate-350">
              <div className="space-y-1">
                <label className="text-slate-400 font-semibold">Decision</label>
                <div className="p-2 bg-slate-950 rounded-lg border border-slate-850 font-bold text-slate-200">
                  {decision === 'Corrected' ? '✅ Approve Exception (Corrected)' : '❌ Reject Attendance'}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-semibold">Audit Remarks / Rationale *</label>
                <textarea
                  required
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g. Verified trainer arrival via client phone confirmation, correcting GPS mismatch..."
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2.5 text-white outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <button
                type="submit"
                className={`w-full py-2.5 rounded-xl font-bold transition text-white shadow-lg ${
                  decision === 'Corrected' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-750'
                }`}
              >
                Confirm Verification override
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Attendance;
