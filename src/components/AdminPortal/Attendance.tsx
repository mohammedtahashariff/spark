import React, { useState } from 'react';
import { useDatabase } from '../../context/DatabaseContext';
import { 
  MapPin, Check, X, ShieldAlert, ShieldCheck, 
  ZoomIn, Calendar, Filter, Radio, Eye, Map as MapIcon, 
  List, Navigation, Clock, User, Plus
} from 'lucide-react';
import type { AttendanceRecord } from '../../types';

const Attendance: React.FC = () => {
  const { attendanceRecords, sites, trainers, schedules, reviewAttendance, checkInTrainer } = useDatabase();
  
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [dateFilter, setDateFilterState] = useState<'Today' | 'Yesterday' | 'This Week' | 'This Month' | 'All' | 'Custom'>(() => {
    return (localStorage.getItem('spk_att_date_filter') as any) || 'All';
  });
  const setDateFilter = (filter: 'Today' | 'Yesterday' | 'This Week' | 'This Month' | 'All' | 'Custom') => {
    setDateFilterState(filter);
    localStorage.setItem('spk_att_date_filter', filter);
  };
  const [customDate, setCustomDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(attendanceRecords[0] || null);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  // Quick Record Check-In Modal State (Admin log / simulation)
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTrainerId, setNewTrainerId] = useState(trainers[0]?.id || 't1');
  const [newSiteId, setNewSiteId] = useState(sites[0]?.id || 's1');
  const [newVerificationType, setNewVerificationType] = useState<'Verified' | 'Review'>('Verified');

  // Exception Override Modal State
  const [overrideRecordId, setOverrideRecordId] = useState<string | null>(null);
  const [overrideDecision, setOverrideDecision] = useState<'Corrected' | 'Rejected'>('Corrected');
  const [overrideRemarks, setOverrideRemarks] = useState('');

  // Date Filtering Logic
  const getFilteredRecords = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const currentMonthPrefix = todayStr.substring(0, 7);

    return attendanceRecords.filter(rec => {
      if (dateFilter === 'Today') return rec.date === todayStr;
      if (dateFilter === 'Yesterday') return rec.date === yesterday;
      if (dateFilter === 'This Month') return rec.date.startsWith(currentMonthPrefix);
      if (dateFilter === 'Custom') return rec.date === customDate;
      return true;
    }).sort((a, b) => b.serverTimestamp.localeCompare(a.serverTimestamp));
  };

  const filteredRecords = getFilteredRecords();

  const handleOpenOverride = (recId: string, decisionType: 'Corrected' | 'Rejected') => {
    setOverrideRecordId(recId);
    setOverrideDecision(decisionType);
    setOverrideRemarks('');
  };

  const handleConfirmOverride = (e: React.FormEvent) => {
    e.preventDefault();
    if (!overrideRecordId || !overrideRemarks.trim()) return;
    reviewAttendance(overrideRecordId, overrideDecision, overrideRemarks.trim());
    setOverrideRecordId(null);
  };

  const handleCreateCheckIn = (e: React.FormEvent) => {
    e.preventDefault();
    const trainer = trainers.find(t => t.id === newTrainerId) || trainers[0];
    const site = sites.find(s => s.id === newSiteId) || sites[0];
    if (!trainer || !site) return;

    // Find schedule for trainer or fallback
    const sched = schedules.find(s => s.trainerId === trainer.id && s.siteId === site.id) || schedules.find(s => s.trainerId === trainer.id) || schedules[0] || { id: 'sch1' };

    // Verified: ~15m away (inside geofence); Review: ~450m away (breach)
    const latOffset = newVerificationType === 'Verified' ? 0.0001 : 0.0040;
    const lngOffset = newVerificationType === 'Verified' ? 0.0001 : 0.0040;
    const selfie = trainer.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=60';

    const result = checkInTrainer(
      sched.id,
      site.latitude + latOffset,
      site.longitude + lngOffset,
      8,
      selfie,
      `${site.name} Campus Ground, GPS ±8m`
    );

    if (result && result.record) {
      setSelectedRecord(result.record);
    }
    setShowAddModal(false);
  };

  const getStatusBadge = (status: AttendanceRecord['verificationStatus']) => {
    switch (status) {
      case 'Verified':
        return <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">Verified</span>;
      case 'Corrected':
        return <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">Approved Override</span>;
      case 'Rejected':
        return <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">Rejected</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 animate-pulse">Review Exception</span>;
    }
  };

  const activeRecord = selectedRecord || filteredRecords[0] || null;
  const activeSite = sites.find(s => s.id === activeRecord?.siteId) || sites[0];

  return (
    <div className="space-y-6 text-slate-700 dark:text-slate-350 flex flex-col h-full relative transition-colors duration-200">
      
      {/* Top Header Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-wide">Live Attendance & Geofence Ledger</h2>
            <span className="flex items-center gap-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border border-emerald-500/20">
              <Radio size={10} className="animate-pulse text-emerald-500" /> Real-Time Live Feed
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-450 mt-1 font-medium">
            Audit biometric camera captures, GPS coordinate pins, and geofence compliance in real time.
          </p>
        </div>

        {/* View Switcher & Date Filter Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          
          {/* List vs Map View Switcher */}
          <div className="bg-slate-100 dark:bg-zinc-950 p-1 rounded-xl border border-slate-200 dark:border-zinc-800 flex items-center">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                viewMode === 'list' 
                  ? 'bg-white dark:bg-zinc-850 text-slate-900 dark:text-white shadow-sm' 
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <List size={14} /> List View
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                viewMode === 'map' 
                  ? 'bg-[#E50914] text-white shadow-sm' 
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <MapIcon size={14} /> Map View
            </button>
          </div>

          {/* Date Filter Pills */}
          <div className="flex items-center gap-1 bg-slate-50 dark:bg-zinc-950 p-1 rounded-xl border border-slate-200 dark:border-zinc-800 text-[11px] font-bold">
            {(['All', 'Today', 'Yesterday', 'This Month', 'Custom'] as const).map(df => (
              <button
                key={df}
                onClick={() => setDateFilter(df)}
                className={`px-2.5 py-1 rounded-lg transition ${
                  dateFilter === df 
                    ? 'bg-[#E50914] text-white shadow-sm' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {df}
              </button>
            ))}
          </div>

          {dateFilter === 'Custom' && (
            <input
              type="date"
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              className="bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-1 text-xs font-bold text-slate-800 dark:text-white outline-none"
            />
          )}

          {/* Record Check-In action button */}
          <button
            onClick={() => {
              setNewTrainerId(trainers[0]?.id || 't1');
              setNewSiteId(sites[0]?.id || 's1');
              setNewVerificationType('Verified');
              setShowAddModal(true);
            }}
            className="bg-[#E50914] hover:bg-[#b00610] text-white rounded-xl px-3.5 py-1.5 text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-red-600/20 shrink-0"
          >
            <Plus size={14} /> + Record Check-In
          </button>

        </div>
      </div>

      {/* VIEW MODE: MAP VIEW */}
      {viewMode === 'map' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-grow overflow-hidden">
          
          {/* Left 2 Cols: Interactive Map Visualizer */}
          <div className="lg:col-span-2 bg-slate-950 border border-slate-800 rounded-3xl p-6 shadow-2xl relative flex flex-col justify-between overflow-hidden min-h-[450px]">
            
            {/* Map Background Grid */}
            <div className="absolute inset-0 bg-[radial-gradient(#374151_1px,transparent_1px)] [background-size:20px_20px] opacity-40"></div>
            
            {/* Header overlay */}
            <div className="relative z-10 flex justify-between items-start">
              <div className="bg-black/80 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-800 text-xs space-y-0.5">
                <span className="text-[10px] text-slate-400 uppercase font-black">Visual GPS Boundary Engine</span>
                <p className="font-bold text-white">
                  Site: <span className="text-[#E50914]">{activeSite?.name}</span>
                </p>
              </div>

              {activeRecord && (
                <div className="bg-black/80 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-800 text-xs text-right space-y-0.5 font-semibold">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Trainer Distance</span>
                  <p className={`font-black ${activeRecord.verificationStatus === 'Verified' ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {activeRecord.distanceFromSite} meters away
                  </p>
                </div>
              )}
            </div>

            {/* Center Map Diagram */}
            <div className="relative z-10 my-auto flex items-center justify-center h-64">
              
              {/* Geofence Boundary Circle */}
              <div 
                className="absolute rounded-full border-2 border-dashed border-[#E50914] bg-[#E50914]/10 flex items-center justify-center transition-all duration-500"
                style={{
                  width: `${Math.min(260, Math.max(90, (activeSite?.geofenceRadius || 100) * 1.2))}px`,
                  height: `${Math.min(260, Math.max(90, (activeSite?.geofenceRadius || 100) * 1.2))}px`
                }}
              >
                <span className="absolute -top-3 bg-black/90 text-[#E50914] border border-[#E50914]/40 px-2 py-0.5 rounded text-[8px] font-black uppercase">
                  {activeSite?.geofenceRadius}m Geofence Boundary
                </span>
              </div>

              {/* Marker 1: Assigned Training Site */}
              <div className="absolute flex flex-col items-center z-20">
                <div className="w-10 h-10 rounded-full bg-[#E50914] text-white flex items-center justify-center shadow-lg shadow-red-600/60 border-2 border-white">
                  <MapPin size={20} />
                </div>
                <span className="text-[10px] font-black text-white bg-black/90 px-2.5 py-0.5 rounded mt-1.5 shadow border border-slate-800 whitespace-nowrap">
                  📍 {activeSite?.name}
                </span>
              </div>

              {/* Marker 2: Trainer Location (offset based on breach/verified) */}
              {activeRecord && (
                <div 
                  className="absolute z-20 flex flex-col items-center transition-all duration-500"
                  style={{
                    transform: activeRecord.verificationStatus === 'Verified'
                      ? 'translate(60px, -40px)'
                      : 'translate(140px, 70px)'
                  }}
                >
                  {/* Distance Vector Line */}
                  <div 
                    className={`absolute w-24 h-0.5 border-t-2 border-dashed ${
                      activeRecord.verificationStatus === 'Verified' ? 'border-emerald-400' : 'border-amber-400'
                    }`}
                    style={{
                      transformOrigin: '0 0',
                      transform: activeRecord.verificationStatus === 'Verified'
                        ? 'rotate(145deg) translate(-50px, 0px)'
                        : 'rotate(-135deg) translate(0px, 0px)'
                    }}
                  ></div>

                  <div className="relative">
                    <img
                      src={activeRecord.selfieUrl}
                      alt={activeRecord.trainerName}
                      className="w-11 h-11 rounded-full object-cover border-2 border-emerald-400 shadow-lg shadow-emerald-500/40"
                    />
                    <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-black"></span>
                  </div>
                  <span className="text-[9px] font-black text-white bg-black/90 px-2 py-0.5 rounded mt-1 shadow border border-slate-800 whitespace-nowrap">
                    👤 {activeRecord.trainerName} ({activeRecord.checkInTime})
                  </span>
                </div>
              )}

            </div>

            {/* Bottom GPS status info */}
            <div className="relative z-10 flex justify-between items-center text-[10px] text-slate-400 font-mono bg-black/60 backdrop-blur-md p-2.5 rounded-xl border border-slate-800">
              <span>Site Coordinates: {activeSite?.latitude}, {activeSite?.longitude}</span>
              {activeRecord && <span>Trainer GPS: {activeRecord.latitude}, {activeRecord.longitude} (±{activeRecord.gpsAccuracy}m)</span>}
            </div>

          </div>

          {/* Right 1 Col: Selected Record Details & Exceptions */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-5 shadow-sm flex flex-col justify-between space-y-4">
            {activeRecord ? (
              <div className="space-y-4 text-xs">
                <div className="flex justify-between items-start border-b border-slate-100 dark:border-zinc-800 pb-3">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">{activeRecord.trainerName}</h3>
                    <p className="text-[10px] text-slate-400 font-bold mt-0.5">{activeRecord.date} @ {activeRecord.checkInTime}</p>
                  </div>
                  {getStatusBadge(activeRecord.verificationStatus)}
                </div>

                {/* Selfie preview */}
                <div className="relative w-full h-44 rounded-2xl overflow-hidden bg-black border border-slate-200 dark:border-zinc-800 group">
                  <img src={activeRecord.selfieUrl} alt="Selfie" className="w-full h-full object-cover" />
                  <button
                    onClick={() => setZoomedImage(activeRecord.selfieUrl)}
                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition font-bold text-xs gap-1"
                  >
                    <ZoomIn size={16} /> View Biometric Snapshot
                  </button>
                </div>

                {/* Audit properties */}
                <div className="bg-slate-50 dark:bg-zinc-950 p-3 rounded-xl border border-slate-200 dark:border-zinc-850 space-y-2 font-semibold">
                  <div className="flex justify-between">
                    <span className="text-slate-400 text-[10px] uppercase">Campus:</span>
                    <span className="font-bold text-slate-900 dark:text-white truncate max-w-[150px]">{activeRecord.siteName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 text-[10px] uppercase">Distance:</span>
                    <span className="font-bold text-slate-900 dark:text-white">{activeRecord.distanceFromSite} meters away</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 text-[10px] uppercase">GPS Accuracy:</span>
                    <span className="font-mono text-slate-700 dark:text-slate-300">±{activeRecord.gpsAccuracy} m</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 text-[10px] uppercase">Location:</span>
                    <span className="text-[10px] text-slate-600 dark:text-slate-400 truncate max-w-[160px]">{activeRecord.locationAddress || 'Campus Boundary'}</span>
                  </div>
                </div>

                {/* Review action buttons for exceptions */}
                {activeRecord.verificationStatus === 'Review' && (
                  <div className="pt-2 border-t border-slate-100 dark:border-zinc-800 flex gap-2">
                    <button
                      onClick={() => handleOpenOverride(activeRecord.id, 'Corrected')}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1 shadow"
                    >
                      <Check size={14} /> Approve Exception
                    </button>
                    <button
                      onClick={() => handleOpenOverride(activeRecord.id, 'Rejected')}
                      className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1 shadow"
                    >
                      <X size={14} /> Reject
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-400 text-center py-20">No attendance record selected.</p>
            )}

            {/* Quick selector of other records */}
            <div className="border-t border-slate-100 dark:border-zinc-800 pt-3">
              <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block mb-2">Switch Attendance Record</span>
              <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
                {filteredRecords.map(r => (
                  <button
                    key={r.id}
                    onClick={() => setSelectedRecord(r)}
                    className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold shrink-0 border transition ${
                      selectedRecord?.id === r.id 
                        ? 'bg-[#E50914] text-white border-[#E50914]' 
                        : 'bg-slate-50 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {r.trainerName.split(' ')[0]} ({r.checkInTime})
                  </button>
                ))}
              </div>
            </div>

          </div>

        </div>
      ) : (
        /* VIEW MODE: LIST VIEW */
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm overflow-hidden flex flex-col flex-grow">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-zinc-800 text-[10px] uppercase font-bold text-slate-400 dark:text-zinc-500 tracking-wider">
                  <th className="py-3 px-3">Trainer & Biometric</th>
                  <th className="py-3 px-3">Date & Time</th>
                  <th className="py-3 px-3">Training Site</th>
                  <th className="py-3 px-3">Distance / GPS</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60 font-semibold">
                {filteredRecords.map(rec => {
                  const isBreach = rec.verificationStatus === 'Review';
                  return (
                    <tr 
                      key={rec.id}
                      onClick={() => { setSelectedRecord(rec); }}
                      className={`hover:bg-slate-50/80 dark:hover:bg-zinc-850/40 transition cursor-pointer ${
                        isBreach ? 'bg-amber-50/20 dark:bg-amber-950/10' : ''
                      }`}
                    >
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-3">
                          <div 
                            onClick={(e) => { e.stopPropagation(); setZoomedImage(rec.selfieUrl); }}
                            className="relative w-10 h-10 rounded-xl overflow-hidden bg-black border border-slate-200 dark:border-zinc-700 shrink-0 cursor-pointer shadow-sm hover:scale-105 transition"
                          >
                            <img src={rec.selfieUrl} alt="Trainer selfie" className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white">{rec.trainerName}</p>
                            <p className="text-[10px] text-slate-400 font-normal">ID: {rec.trainerId}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <p className="font-bold text-slate-800 dark:text-slate-200">{rec.date}</p>
                        <p className="text-[10px] text-slate-400 font-normal">{rec.checkInTime}</p>
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                          <MapPin size={13} className="text-slate-400 shrink-0" />
                          <span className="truncate max-w-[180px]">{rec.siteName}</span>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <p className={`font-bold ${isBreach ? 'text-amber-600 dark:text-amber-400' : 'text-slate-700 dark:text-slate-300'}`}>
                          {rec.distanceFromSite} m away
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono">±{rec.gpsAccuracy}m GPS</p>
                      </td>

                      <td className="py-3 px-3">
                        {getStatusBadge(rec.verificationStatus)}
                      </td>

                      <td className="py-3 px-3 text-right">
                        {isBreach ? (
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleOpenOverride(rec.id, 'Corrected'); }}
                              className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-lg text-[10px] font-bold hover:bg-emerald-100 transition"
                            >
                              Approve
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleOpenOverride(rec.id, 'Rejected'); }}
                              className="px-2.5 py-1 bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 border border-rose-500/20 rounded-lg text-[10px] font-bold hover:bg-rose-100 transition"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => { setSelectedRecord(rec); setViewMode('map'); }}
                            className="p-1.5 rounded-lg bg-slate-50 dark:bg-zinc-800 text-slate-600 dark:text-slate-400 hover:text-[#E50914] transition"
                            title="View on Map"
                          >
                            <MapIcon size={14} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredRecords.length === 0 && (
            <p className="text-xs text-slate-400 text-center py-16">No attendance records match the selected date filter.</p>
          )}
        </div>
      )}

      {/* Exception Override Modal */}
      {overrideRecordId && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Attendance Exception Review</h3>
              <button onClick={() => setOverrideRecordId(null)} className="text-slate-400 hover:text-slate-600 font-bold">&times;</button>
            </div>

            <form onSubmit={handleConfirmOverride} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="text-slate-400 font-bold">Review Decision</label>
                <div className="p-2.5 bg-slate-50 dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 font-bold text-slate-800 dark:text-slate-200">
                  {overrideDecision === 'Corrected' ? '✅ Approve Exception (Corrected)' : '❌ Reject Check-in'}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-bold">Audit Remarks / Justification *</label>
                <textarea
                  required
                  rows={3}
                  value={overrideRemarks}
                  onChange={(e) => setOverrideRemarks(e.target.value)}
                  placeholder="e.g. Verified trainer presence on site via college coordinator phone verification..."
                  className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 text-slate-800 dark:text-white outline-none focus:border-[#E50914] resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOverrideRecordId(null)}
                  className="px-4 py-2 rounded-xl text-slate-500 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#E50914] hover:bg-[#b00610] text-white rounded-xl font-bold transition shadow"
                >
                  Confirm Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Record Check-In Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <MapPin size={16} className="text-[#E50914]" /> Record Trainer Attendance
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">&times;</button>
            </div>

            <form onSubmit={handleCreateCheckIn} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="text-slate-500 font-bold">Trainer</label>
                <select
                  value={newTrainerId}
                  onChange={(e) => setNewTrainerId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 text-slate-900 dark:text-white outline-none font-semibold"
                >
                  {trainers.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.individualId})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 font-bold">Authorized Training Site</label>
                <select
                  value={newSiteId}
                  onChange={(e) => setNewSiteId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 text-slate-900 dark:text-white outline-none font-semibold"
                >
                  {sites.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.geofenceRadius}m radius)</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 font-bold">Geofence Compliance Test</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewVerificationType('Verified')}
                    className={`py-2 px-3 rounded-xl font-bold border transition text-center ${
                      newVerificationType === 'Verified'
                        ? 'bg-emerald-500/15 border-emerald-500 text-emerald-600 dark:text-emerald-400'
                        : 'bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-500'
                    }`}
                  >
                    ✓ Inside Geofence (Verified)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewVerificationType('Review')}
                    className={`py-2 px-3 rounded-xl font-bold border transition text-center ${
                      newVerificationType === 'Review'
                        ? 'bg-amber-500/15 border-amber-500 text-amber-600 dark:text-amber-400'
                        : 'bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-500'
                    }`}
                  >
                    ⚠ Outside Geofence (Review)
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#E50914] hover:bg-[#b00610] text-white rounded-xl font-bold transition shadow"
                >
                  Save Check-In Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lightbox Zoom for Biometric Selfies */}
      {zoomedImage && (
        <div 
          className="fixed inset-0 bg-black/90 z-[99] flex items-center justify-center p-4 cursor-pointer backdrop-blur-md"
          onClick={() => setZoomedImage(null)}
        >
          <div className="relative max-w-md w-full aspect-square overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 shadow-2xl">
            <img src={zoomedImage} alt="Biometric zoom" className="w-full h-full object-cover" />
            <button 
              onClick={() => setZoomedImage(null)}
              className="absolute top-4 right-4 bg-black/80 border border-slate-800 p-2 rounded-full text-white text-xs font-bold hover:bg-black"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default Attendance;
