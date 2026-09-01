import React, { useState } from 'react';
import { useDatabase } from '../../context/DatabaseContext';
import { Plus, Check, X, MapPin, Calendar, BookOpen } from 'lucide-react';


const Operations: React.FC = () => {
  const { 
    schedules, sites, trainers, changeRequests, 
    addSite, addSchedule, reviewScheduleChange 
  } = useDatabase();

  const [activeSubTab, setActiveSubTab] = useState<'schedules' | 'sites' | 'change_requests'>('schedules');
  
  // Modals
  const [showAddSite, setShowAddSite] = useState(false);
  const [showAddClass, setShowAddClass] = useState(false);
  const [reviewRequestId, setReviewRequestId] = useState<string | null>(null);
  const [reviewStatus, setReviewStatus] = useState<'Approved' | 'Rejected'>('Approved');
  const [reviewRemarks, setReviewRemarks] = useState('');

  // Add Site Form State
  const [siteName, setSiteName] = useState('');
  const [siteLat, setSiteLat] = useState('');
  const [siteLng, setSiteLng] = useState('');
  const [siteRadius, setSiteRadius] = useState('200');
  const [siteAddress, setSiteAddress] = useState('');

  // Add Class Form State
  const [classSiteId, setClassSiteId] = useState('');
  const [classBatch, setClassBatch] = useState('');
  const [classCourse, setClassCourse] = useState('');
  const [classTrainerId, setClassTrainerId] = useState('');
  const [classDate, setClassDate] = useState('');
  const [classStart, setClassStart] = useState('');
  const [classEnd, setClassEnd] = useState('');
  const [classHours, setClassHours] = useState('3');

  const handleAddSite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!siteName || !siteLat || !siteLng || !siteRadius) return;

    addSite({
      name: siteName,
      latitude: Number(siteLat),
      longitude: Number(siteLng),
      geofenceRadius: Number(siteRadius),
      address: siteAddress
    });

    setSiteName('');
    setSiteLat('');
    setSiteLng('');
    setSiteRadius('200');
    setSiteAddress('');
    setShowAddSite(false);
  };

  const handleAddClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!classSiteId || !classBatch || !classCourse || !classTrainerId || !classDate || !classStart || !classEnd) return;

    const trainer = trainers.find(t => t.id === classTrainerId);
    const site = sites.find(s => s.id === classSiteId);

    if (!trainer || !site) return;

    addSchedule({
      siteId: classSiteId,
      siteName: site.name,
      batchName: classBatch,
      courseName: classCourse,
      trainerId: classTrainerId,
      trainerName: trainer.name,
      date: classDate,
      startTime: classStart,
      endTime: classEnd,
      status: 'Scheduled',
      hours: Number(classHours)
    });

    setClassSiteId('');
    setClassBatch('');
    setClassCourse('');
    setClassTrainerId('');
    setClassDate('');
    setClassStart('');
    setClassEnd('');
    setClassHours('3');
    setShowAddClass(false);
  };

  const handleOpenReview = (reqId: string, status: 'Approved' | 'Rejected') => {
    setReviewRequestId(reqId);
    setReviewStatus(status);
    setReviewRemarks('');
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewRequestId) return;

    reviewScheduleChange(reviewRequestId, reviewStatus, reviewRemarks.trim());
    setReviewRequestId(null);
  };

  const pendingRequests = changeRequests.filter(r => r.status === 'Pending');

  return (
    <div className="space-y-5 text-slate-700 dark:text-slate-350 relative h-full flex flex-col transition-colors duration-200">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 dark:border-zinc-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white tracking-wide font-sans">Training Operations</h2>
          <p className="text-xs text-slate-550 mt-0.5 font-medium">Manage client sites, class bookings, trainer assignments, and reschedule requests.</p>
        </div>
        
        {/* Sub-tab navigation */}
        <div className="flex bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 rounded-xl p-1 gap-1 shrink-0">
          <button
            onClick={() => setActiveSubTab('schedules')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'schedules' ? 'bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-sm' : 'text-slate-550 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Schedules
          </button>
          <button
            onClick={() => setActiveSubTab('sites')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'sites' ? 'bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-sm' : 'text-slate-550 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Client Sites
          </button>
          <button
            onClick={() => setActiveSubTab('change_requests')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'change_requests' ? 'bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-sm' : 'text-slate-550 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Requests
            {pendingRequests.length > 0 && (
              <span className="bg-amber-500 text-slate-950 text-[9px] font-black rounded-full px-1.5 py-0.5">
                {pendingRequests.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-grow overflow-y-auto">
        
        {/* 1. Schedule view */}
        {activeSubTab === 'schedules' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500">{schedules.length} Sessions Total</span>
              <button
                onClick={() => setShowAddClass(true)}
                className="bg-rose-600 hover:bg-rose-755 text-white rounded-xl px-4 py-2 text-xs font-bold transition flex items-center gap-1.5 shadow"
              >
                <Plus size={16} /> Schedule Class
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {schedules.map(sch => (
                <div key={sch.id} className="bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800/80 rounded-2xl p-5 space-y-3.5 shadow-sm hover:shadow-md hover:border-slate-350 dark:hover:border-zinc-700 transition">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-800 dark:text-white leading-tight">{sch.courseName}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">{sch.batchName}</p>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase shrink-0 ${
                      sch.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' :
                      sch.status === 'Cancelled' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20' :
                      sch.status === 'Rescheduled' ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20' :
                      'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                    }`}>
                      {sch.status}
                    </span>
                  </div>

                  <div className="space-y-2 border-t border-slate-100 dark:border-zinc-800 pt-3 text-xs text-slate-600 dark:text-slate-400 font-medium">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-slate-400 dark:text-slate-550 shrink-0" />
                      <span>{sch.date} • {sch.startTime} - {sch.endTime} ({sch.hours} hours)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-slate-400 dark:text-slate-550 shrink-0" />
                      <span className="truncate max-w-[220px]">{sch.siteName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <BookOpen size={14} className="text-slate-400 dark:text-slate-550 shrink-0" />
                      <span>Trainer: <strong className="text-slate-800 dark:text-slate-200">{sch.trainerName}</strong></span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 2. Client Sites view */}
        {activeSubTab === 'sites' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500">{sites.length} Active Training Sites</span>
              <button
                onClick={() => setShowAddSite(true)}
                className="bg-rose-600 hover:bg-rose-755 text-white rounded-xl px-4 py-2 text-xs font-bold transition flex items-center gap-1.5 shadow"
              >
                <Plus size={16} /> Add Training Site
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sites.map(site => (
                <div key={site.id} className="bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800/80 rounded-2xl p-5 shadow-sm hover:shadow-md flex gap-4 transition duration-200">
                  <div className="p-3 bg-rose-500/10 rounded-2xl text-rose-500 border border-rose-500/20 self-start shrink-0">
                    <MapPin size={22} />
                  </div>
                  <div className="space-y-2.5 flex-1 min-w-0">
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-800 dark:text-white truncate">{site.name}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-normal font-medium">{site.address}</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-zinc-950 border border-slate-150 dark:border-zinc-850 rounded-xl p-3 grid grid-cols-2 gap-2 text-xs font-semibold">
                      <div>
                        <span className="text-slate-450 dark:text-slate-500 block text-[9px] uppercase tracking-wide">Coordinates</span>
                        <span className="font-bold text-slate-700 dark:text-slate-350">{site.latitude.toFixed(6)}, {site.longitude.toFixed(6)}</span>
                      </div>
                      <div>
                        <span className="text-slate-455 dark:text-slate-500 block text-[9px] uppercase tracking-wide">Geofence Radius</span>
                        <span className="font-extrabold text-emerald-600 dark:text-emerald-400">{site.geofenceRadius} meters</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. Schedule Change Requests view */}
        {activeSubTab === 'change_requests' && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Schedule Change Requests Log</h3>
            {changeRequests.length > 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-950 border-b border-slate-800 text-slate-450 uppercase font-black tracking-wider">
                      <th className="p-4">Trainer & Class</th>
                      <th className="p-4">Original Schedule</th>
                      <th className="p-4">Proposed Schedule</th>
                      <th className="p-4">Reason</th>
                      <th className="p-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850">
                    {changeRequests.map(req => (
                      <tr key={req.id} className="hover:bg-slate-900/60 transition">
                        <td className="p-4">
                          <p className="font-bold text-white">{req.trainerName}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">{req.courseName} ({req.batchName})</p>
                        </td>
                        <td className="p-4 text-slate-400">
                          <p>{req.originalDate}</p>
                          <p className="text-[10px] text-slate-500 font-bold mt-0.5">{req.originalStartTime} - {req.originalEndTime}</p>
                        </td>
                        <td className="p-4 text-slate-200">
                          <p className="font-bold">{req.requestedDate}</p>
                          <p className="text-[10px] text-blue-400 font-bold mt-0.5">{req.requestedStartTime} - {req.requestedEndTime}</p>
                        </td>
                        <td className="p-4 text-slate-450 italic max-w-xs truncate leading-normal" title={req.reason}>
                          "{req.reason}"
                        </td>
                        <td className="p-4 text-center">
                          {req.status === 'Pending' ? (
                            <div className="flex gap-2 justify-center">
                              <button
                                onClick={() => handleOpenReview(req.id, 'Approved')}
                                className="bg-emerald-650 hover:bg-emerald-600 border border-emerald-500/20 text-emerald-100 rounded-lg p-1.5 transition"
                                title="Approve Request"
                              >
                                <Check size={14} />
                              </button>
                              <button
                                onClick={() => handleOpenReview(req.id, 'Rejected')}
                                className="bg-red-650 hover:bg-red-600 border border-red-500/20 text-red-100 rounded-lg p-1.5 transition"
                                title="Reject Request"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ) : (
                            <div className="inline-flex flex-col items-center">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                req.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                              }`}>
                                {req.status}
                              </span>
                              {req.reviewRemarks && (
                                <span className="text-[9px] text-slate-500 mt-1 italic max-w-[100px] truncate" title={req.reviewRemarks}>"{req.reviewRemarks}"</span>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-slate-500 text-center py-12">No schedule change requests logged in the system.</p>
            )}
          </div>
        )}
      </div>

      {/* Add Site Modal */}
      {showAddSite && (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-850 pb-2">
              <h3 className="text-sm font-bold text-white">Register Training Site</h3>
              <button onClick={() => setShowAddSite(false)} className="text-slate-400 hover:text-white"><X size={18} /></button>
            </div>
            
            <form onSubmit={handleAddSite} className="space-y-3.5 text-xs text-slate-355">
              <div className="space-y-1">
                <label className="text-slate-400 font-semibold">Site Name *</label>
                <input
                  type="text"
                  required
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  placeholder="e.g. ABC Engineering College"
                  className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2 text-white outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold">Latitude *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={siteLat}
                    onChange={(e) => setSiteLat(e.target.value)}
                    placeholder="12.971598"
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2 text-white outline-none focus:border-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold">Longitude *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={siteLng}
                    onChange={(e) => setSiteLng(e.target.value)}
                    placeholder="77.594562"
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2 text-white outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-semibold">Geofence Radius (meters) *</label>
                <input
                  type="number"
                  required
                  value={siteRadius}
                  onChange={(e) => setSiteRadius(e.target.value)}
                  placeholder="200"
                  className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2 text-white outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-semibold">Postal Address</label>
                <textarea
                  value={siteAddress}
                  onChange={(e) => setSiteAddress(e.target.value)}
                  placeholder="Street, City, State..."
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-855 rounded-lg p-2 text-white outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2.5 font-bold transition shadow-lg shadow-blue-900/10"
              >
                Register Location
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Class Modal */}
      {showAddClass && (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-850 pb-2">
              <h3 className="text-sm font-bold text-white">Schedule Training Session</h3>
              <button onClick={() => setShowAddClass(false)} className="text-slate-400 hover:text-white"><X size={18} /></button>
            </div>

            <form onSubmit={handleAddClass} className="space-y-3.5 text-xs text-slate-355">
              <div className="space-y-1">
                <label className="text-slate-400 font-semibold">Training Site *</label>
                <select
                  required
                  value={classSiteId}
                  onChange={(e) => setClassSiteId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2 text-white outline-none focus:border-blue-500"
                >
                  <option value="">Select Site Location</option>
                  {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold">Batch Name *</label>
                  <input
                    type="text"
                    required
                    value={classBatch}
                    onChange={(e) => setClassBatch(e.target.value)}
                    placeholder="Java Batch A"
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2 text-white outline-none focus:border-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold">Trainer *</label>
                  <select
                    required
                    value={classTrainerId}
                    onChange={(e) => setClassTrainerId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2 text-white outline-none focus:border-blue-500"
                  >
                    <option value="">Select Trainer</option>
                    {trainers.filter(t => t.status === 'Active').map(t => (
                      <option key={t.id} value={t.id}>{t.name} ({t.individualId || t.id})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-semibold">Course Topic *</label>
                <input
                  type="text"
                  required
                  value={classCourse}
                  onChange={(e) => setClassCourse(e.target.value)}
                  placeholder="OOP - Polymorphism"
                  className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2 text-white outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-semibold">Date *</label>
                <input
                  type="date"
                  required
                  value={classDate}
                  onChange={(e) => setClassDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2 text-white outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold">Start *</label>
                  <input
                    type="time"
                    required
                    value={classStart}
                    onChange={(e) => setClassStart(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg p-1.5 text-white outline-none focus:border-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold">End *</label>
                  <input
                    type="time"
                    required
                    value={classEnd}
                    onChange={(e) => setClassEnd(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg p-1.5 text-white outline-none focus:border-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold">Hours *</label>
                  <input
                    type="number"
                    required
                    value={classHours}
                    onChange={(e) => setClassHours(e.target.value)}
                    placeholder="3"
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg p-1.5 text-white outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2.5 font-bold transition shadow-lg shadow-blue-900/10"
              >
                Create Assignment
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Review Request Modal */}
      {reviewRequestId && (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 w-full max-w-sm space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-850 pb-2">
              <h3 className="text-sm font-bold text-white">Review Request Remarks</h3>
              <button onClick={() => setReviewRequestId(null)} className="text-slate-400 hover:text-white"><X size={18} /></button>
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-4 text-xs text-slate-350">
              <div className="space-y-1">
                <label className="text-slate-400 font-semibold">Review Decision</label>
                <div className="p-2 bg-slate-950 rounded-lg border border-slate-850 font-bold text-slate-200">
                  {reviewStatus === 'Approved' ? '✅ Approve Reschedule' : '❌ Reject Reschedule'}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-semibold">Approver Remarks *</label>
                <textarea
                  required
                  value={reviewRemarks}
                  onChange={(e) => setReviewRemarks(e.target.value)}
                  placeholder="Provide review reasoning..."
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2.5 text-white outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <button
                type="submit"
                className={`w-full py-2.5 rounded-xl font-bold transition text-white shadow-lg ${
                  reviewStatus === 'Approved' ? 'bg-emerald-650 hover:bg-emerald-600' : 'bg-red-650 hover:bg-red-600'
                }`}
              >
                Submit Decision
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Operations;
