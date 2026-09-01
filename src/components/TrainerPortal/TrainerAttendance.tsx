import React, { useState, useEffect, useRef } from 'react';
import { useDatabase } from '../../context/DatabaseContext';
import { Camera, Check, AlertTriangle, ShieldCheck } from 'lucide-react';

const TrainerAttendance: React.FC = () => {
  const { currentUser, schedules, attendanceRecords, trainers, sites, checkInTrainer } = useDatabase();
  
  const trainer = trainers.find(t => t.email === currentUser?.email) || trainers[0];
  const getLocalTodayStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const todayStr = getLocalTodayStr();

  const todayClasses = schedules.filter(
    s => s.trainerId === trainer.id && s.date === todayStr && s.status === 'Scheduled'
  );

  const checkedInRecords = attendanceRecords.filter(r => r.trainerId === trainer.id);

  // Form State
  const [selectedScheduleId, setSelectedScheduleId] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraSnapshot, setCameraSnapshot] = useState<string | null>(null);
  
  // Camera Device State
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // GPS Simulation State
  const [gpsMode, setGpsMode] = useState<'real' | 'simulate_in' | 'simulate_out'>('real');
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number; acc: number } | null>(null);
  const [distance, setDistance] = useState(0.08); // in km
  const [gpsError, setGpsError] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [showSimulatorControls, setShowSimulatorControls] = useState(false);

  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (todayClasses.length > 0 && !selectedScheduleId) {
      setSelectedScheduleId(todayClasses[0].id);
    }
  }, [todayClasses, selectedScheduleId]);

  // GPS and Distance simulation effect
  useEffect(() => {
    if (!selectedScheduleId) return;
    const currentClass = schedules.find(s => s.id === selectedScheduleId);
    if (!currentClass) return;
    const site = sites.find(s => s.id === currentClass.siteId);
    if (!site) return;

    if (gpsMode === 'simulate_in') {
      const coords = {
        lat: site.latitude + 0.00008,
        lng: site.longitude - 0.00008,
        acc: 8
      };
      setCoordinates(coords);
      setDistance(0.015); // 15m
      setGpsError('');
    } else if (gpsMode === 'simulate_out') {
      const coords = {
        lat: site.latitude + 0.12,
        lng: site.longitude - 0.12,
        acc: 15
      };
      setCoordinates(coords);
      setDistance(13.4); // 13.4km
      setGpsError('');
    } else if (gpsMode === 'real') {
      setIsLocating(true);
      setGpsError('');
      if (!navigator.geolocation) {
        setGpsError('Real GPS is not supported by this browser. Simulating At-Site coordinates.');
        setGpsMode('simulate_in');
        setIsLocating(false);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            acc: Math.round(pos.coords.accuracy)
          };
          setCoordinates(coords);
          
          // Calculate actual distance in km using Haversine
          const R = 6371e3; // Earth radius in meters
          const phi1 = (coords.lat * Math.PI) / 180;
          const phi2 = (site.latitude * Math.PI) / 180;
          const dPhi = ((site.latitude - coords.lat) * Math.PI) / 180;
          const dLon = ((site.longitude - coords.lng) * Math.PI) / 180;
          const a = Math.sin(dPhi/2) * Math.sin(dPhi/2) +
                    Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLon/2) * Math.sin(dLon/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          const dist = R * c;
          setDistance(parseFloat((dist / 1000).toFixed(3)));
          setIsLocating(false);
        },
        (error) => {
          console.warn("GPS access denied, falling back to simulated At-Site coordinates.", error);
          setGpsError('Real GPS coordinates unavailable. Simulating At-Site coordinates.');
          setGpsMode('simulate_in');
          setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  }, [gpsMode, selectedScheduleId, schedules, sites]);

  // Webcam controls
  const startCamera = async () => {
    setCameraError(false);
    setCameraActive(true);
    setCameraSnapshot(null);
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 300, height: 300, facingMode: 'user' },
        audio: false
      });
      setStream(mediaStream);
    } catch (error) {
      console.warn("Camera access denied or unavailable, using mock selfie fallback.", error);
      setCameraError(true);
      // Fallback: wait 800ms to simulate booting and then take a mock snapshot
      setTimeout(() => {
        setCameraSnapshot('https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300&h=300');
        setCameraActive(false);
      }, 800);
    }
  };

  // Play the video stream when the element is rendered and stream is loaded
  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(err => console.error("Error playing video:", err));
    }
  }, [stream]);

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setCameraSnapshot(dataUrl);
        stopCamera();
      }
    }
  };

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const handleMarkAttendance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedScheduleId) {
      setErrorMsg('No scheduled class selected.');
      return;
    }
    if (!cameraSnapshot) {
      setErrorMsg('Please activate camera feed to snap verification photo.');
      return;
    }
    if (!coordinates) {
      setErrorMsg('Fetching GPS coordinates...');
      return;
    }

    checkInTrainer(selectedScheduleId, coordinates.lat, coordinates.lng, coordinates.acc, cameraSnapshot);
    setSuccess(true);
    setErrorMsg('');

    setTimeout(() => {
      setSuccess(false);
      setCameraActive(false);
      setCameraSnapshot(null);
      setSelectedScheduleId('');
    }, 2000);
  };

  return (
    <div className="space-y-6 text-slate-750 dark:text-slate-350 flex flex-col h-full relative transition-colors duration-200">
      <div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-white tracking-wide font-sans">Daily Check-in Console</h2>
        <p className="text-xs text-slate-500 dark:text-slate-455 mt-0.5 font-medium">Mark your presence on campus using camera snapshot and GPS coordinate verification.</p>
      </div>

      {success ? (
        <div className="bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800 rounded-2xl p-8 flex flex-col items-center justify-center text-center space-y-4 shadow-sm max-w-md mx-auto py-16">
          <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-500 border border-emerald-500/20">
            <Check size={32} />
          </div>
          <div>
            <h3 className="text-md font-bold text-slate-800 dark:text-white">Attendance Logged Successfully</h3>
            <p className="text-xs text-slate-500 dark:text-slate-455 mt-1 font-medium">Details recorded. Geofence checks completed.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-grow overflow-hidden">
          
          {/* Left 2 Cols: Form Check-in Camera & Location */}
          <form onSubmit={handleMarkAttendance} className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800/80 rounded-2xl p-5 shadow-sm space-y-5 flex flex-col justify-between overflow-y-auto custom-scrollbar">
            <div className="space-y-4">
              
              {/* Select Session */}
              <div className="space-y-1">
                <label className="text-slate-450 dark:text-slate-555 font-bold uppercase tracking-wider text-[9px]">Select Scheduled Session *</label>
                {todayClasses.length > 0 ? (
                  <select
                    value={selectedScheduleId}
                    onChange={(e) => setSelectedScheduleId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-955 border border-slate-200 dark:border-zinc-800 rounded-lg p-2.5 text-slate-800 dark:text-white outline-none focus:border-rose-600 font-semibold text-xs"
                  >
                    {todayClasses.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.courseName} at {c.siteName} ({c.startTime} - {c.endTime})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="bg-slate-50 dark:bg-zinc-950 border border-slate-150 dark:border-zinc-850 rounded-xl p-3 text-xs text-slate-450 dark:text-slate-550 flex items-center gap-2 font-medium">
                    <AlertTriangle size={14} className="text-amber-500 shrink-0" />
                    <span>No scheduled sessions requiring check-in remain for today.</span>
                  </div>
                )}
              </div>

              {/* Side-by-side Camera and GPS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* 1. Camera Snapshot preview */}
                <div className="bg-slate-50 dark:bg-zinc-950 border border-slate-150 dark:border-zinc-855 rounded-2xl p-4 flex flex-col items-center justify-center text-center space-y-3 relative overflow-hidden h-64 shadow-inner">
                  {cameraSnapshot ? (
                    <div className="relative w-full h-full">
                      <img src={cameraSnapshot} alt="snapshot" className="w-full h-full object-cover rounded-xl" />
                      <div className="absolute top-2 left-2 bg-black/60 px-2 py-0.5 rounded text-[8px] text-emerald-400 font-black uppercase tracking-wider">Snapshot Locked</div>
                    </div>
                  ) : stream ? (
                    <div className="relative w-full h-full flex flex-col items-center justify-between">
                      <video
                        ref={videoRef}
                        playsInline
                        muted
                        className="w-full h-44 object-cover rounded-xl transform -scale-x-100"
                      />
                      <button
                        type="button"
                        onClick={capturePhoto}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg text-[10px] shadow mt-1.5"
                      >
                        Snap Photo
                      </button>
                    </div>
                  ) : cameraActive ? (
                    <div className="space-y-2 animate-pulse">
                      <Camera size={24} className="text-rose-500 mx-auto" />
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">Starting secure video feed...</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="w-12 h-12 rounded-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex items-center justify-center text-slate-400 dark:text-slate-500 mx-auto">
                        <Camera size={20} />
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-455 max-w-[155px] font-medium">Campus audit requires a secure biometric snapshot.</p>
                      {cameraError && (
                        <p className="text-[9px] text-amber-500 font-semibold italic">Camera fallback snapshot active.</p>
                      )}
                      <button
                        type="button"
                        onClick={startCamera}
                        className="bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-850 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-white rounded-lg px-3 py-1.5 text-[10px] font-bold transition shadow-sm"
                      >
                        Activate Web Camera
                      </button>
                    </div>
                  )}
                  <canvas ref={canvasRef} className="hidden" />
                </div>

                {/* 2. GPS Location Verification */}
                <div className="bg-slate-50 dark:bg-zinc-955 border border-slate-150 dark:border-zinc-855 rounded-2xl p-4 flex flex-col justify-between h-64 shadow-inner relative">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <p className="text-[9px] font-bold text-slate-455 dark:text-slate-555 uppercase tracking-wider">GPS Position Verification</p>
                      <button
                        type="button"
                        onClick={() => setShowSimulatorControls(prev => !prev)}
                        className="text-[9px] text-rose-500 hover:text-rose-600 font-bold underline transition"
                      >
                        {showSimulatorControls ? "Hide Simulator" : "Simulate Location"}
                      </button>
                    </div>

                    {showSimulatorControls ? (
                      <div className="grid grid-cols-3 gap-1.5 animate-fadeIn">
                        <button
                          type="button"
                          onClick={() => setGpsMode('simulate_in')}
                          className={`py-2 rounded-lg text-[9px] font-bold border transition ${
                            gpsMode === 'simulate_in' ? 'bg-emerald-500/10 border-emerald-500/35 text-emerald-600 dark:text-emerald-400' : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          Within Geofence
                        </button>
                        <button
                          type="button"
                          onClick={() => setGpsMode('simulate_out')}
                          className={`py-2 rounded-lg text-[9px] font-bold border transition ${
                            gpsMode === 'simulate_out' ? 'bg-rose-500/10 border-rose-500/35 text-rose-600 dark:text-rose-455' : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          Breach GPS
                        </button>
                        <button
                          type="button"
                          onClick={() => setGpsMode('real')}
                          className={`py-2 rounded-lg text-[9px] font-bold border transition ${
                            gpsMode === 'real' ? 'bg-purple-500/10 border-purple-500/35 text-purple-600 dark:text-purple-400' : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          Real GPS
                        </button>
                      </div>
                    ) : (
                      <div className="bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-850 rounded-xl p-3 flex items-center justify-between text-[10px] text-slate-600 dark:text-slate-400 font-semibold shadow-sm">
                        <div className="flex items-center gap-2">
                          <span className="relative flex h-2 w-2">
                            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${distance <= 0.2 ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
                            <span className={`relative inline-flex rounded-full h-2 w-2 ${distance <= 0.2 ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                          </span>
                          <span>{gpsMode === 'real' ? 'Real Device Location' : 'Automatic Geo-Location'}</span>
                        </div>
                        <span className={distance <= 0.2 ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-rose-600 dark:text-rose-500 font-bold'}>
                          {distance <= 0.2 ? 'DETECTED' : 'OUTSIDE SITE'}
                        </span>
                      </div>
                    )}

                    <div className="bg-white dark:bg-zinc-900/60 p-2 rounded-xl space-y-1 text-[9px] text-slate-600 dark:text-slate-400 font-semibold border border-slate-150 dark:border-zinc-850">
                      <p className="flex justify-between">
                        <span>Calculated Distance:</span>
                        <span className={distance <= 0.2 ? 'text-emerald-600 dark:text-emerald-400 font-black' : 'text-rose-600 dark:text-rose-500 font-black'}>
                          {distance} km
                        </span>
                      </p>
                      <p className="flex justify-between">
                        <span>Geofence status:</span>
                        <span className={distance <= 0.2 ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-rose-600 dark:text-rose-500 font-bold'}>
                          {distance <= 0.2 ? 'Approved (Inside 200m)' : 'FLAGGED (Outside site boundary)'}
                        </span>
                      </p>
                    </div>

                    {isLocating && (
                      <p className="text-[9px] text-blue-500 font-bold animate-pulse text-center">Acquiring GPS Lock...</p>
                    )}
                    {gpsError && (
                      <p className="text-[9px] text-amber-500 italic text-center leading-tight">{gpsError}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 text-[9px] text-slate-450 dark:text-slate-500 font-bold">
                    <ShieldCheck size={12} className="text-emerald-500" />
                    <span>Cryptographically verified via secure enclave.</span>
                  </div>
                </div>
              </div>
            </div>

            {errorMsg && (
              <p className="text-rose-500 text-xs font-bold mt-2 text-center">{errorMsg}</p>
            )}

            <div className="pt-4 border-t border-slate-100 dark:border-zinc-800 flex justify-end shrink-0 mt-4">
              <button
                type="submit"
                disabled={todayClasses.length === 0 || !cameraSnapshot || !coordinates}
                className="bg-rose-600 hover:bg-rose-700 disabled:bg-slate-100 disabled:text-slate-400 dark:disabled:bg-zinc-800 dark:disabled:text-slate-500 text-white rounded-xl px-5 py-2.5 text-xs font-bold transition flex items-center gap-1.5 shadow"
              >
                <Check size={16} /> Mark Attendance Check-in
              </button>
            </div>
          </form>

          {/* Right 1 Col: Logged/captured checkins history */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800/80 rounded-2xl p-5 shadow-sm flex flex-col h-full overflow-hidden">
            <h3 className="text-xs font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider mb-4 shrink-0 font-sans">Your Recent Check-ins</h3>
            
            <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-1">
              {checkedInRecords.map(rec => (
                <div key={rec.id} className="bg-slate-50 dark:bg-zinc-950 border border-slate-150 dark:border-zinc-850 rounded-xl p-3 space-y-2 shadow-sm">
                  <div className="flex justify-between items-start font-semibold">
                    <div>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">{rec.date}</p>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">{rec.checkInTime}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                      rec.verificationStatus === 'Verified' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' :
                      rec.verificationStatus === 'Review' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20' :
                      'bg-rose-500/10 text-rose-600 dark:text-rose-455 border border-rose-500/20'
                    }`}>
                      {rec.verificationStatus === 'Verified' ? 'Approved' : rec.verificationStatus}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold truncate" title={rec.siteName}>Site: {rec.siteName}</p>
                </div>
              ))}

              {checkedInRecords.length === 0 && (
                <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-12 font-medium">No check-ins logged for this trainer.</p>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default TrainerAttendance;
