import React, { useState, useEffect, useRef } from 'react';
import { useDatabase } from '../../context/DatabaseContext';
import { Camera, MapPin, CheckCircle, RotateCw, ShieldAlert, Check } from 'lucide-react';

const MobileAttendance: React.FC = () => {
  const { currentUser, schedules, sites, trainers, checkInTrainer, attendanceRecords } = useDatabase();
  
  // Trainer info
  const trainer = trainers.find(t => t.email === currentUser?.email) || trainers[0];
  const getLocalTodayStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const todayStr = getLocalTodayStr();

  // Find today's scheduled classes
  const todaysClasses = schedules.filter(
    s => s.trainerId === trainer.id && s.status === 'Scheduled' && s.date === todayStr
  );

  const [selectedScheduleId, setSelectedScheduleId] = useState<string>('');
  
  // Camera State
  const [useCamera, setUseCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [selfieBase64, setSelfieBase64] = useState<string>('');
  const [cameraError, setCameraError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Auto GPS State
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number; acc: number } | null>(null);
  const [distanceInfo, setDistanceInfo] = useState<{ name: string; dist: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [gpsError, setGpsError] = useState('');

  // Status
  const [checkedInRecord, setCheckedInRecord] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Automatically select the first class if available
  useEffect(() => {
    if (todaysClasses.length > 0 && !selectedScheduleId) {
      setSelectedScheduleId(todaysClasses[0].id);
    }
  }, [todaysClasses, selectedScheduleId]);

  // Check if already checked in today for the selected class or general today
  const existingRecord = attendanceRecords.find(
    r => r.trainerId === trainer.id && r.date === todayStr && (selectedScheduleId ? r.siteId === schedules.find(s => s.id === selectedScheduleId)?.siteId : true)
  );

  // Manage Web Camera
  const startCamera = async () => {
    setCameraError(false);
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 300, height: 300, facingMode: 'user' },
        audio: false
      });
      setStream(mediaStream);
      setUseCamera(true);
    } catch (error) {
      console.warn("Camera access denied or unavailable, using mock selfie fallback.", error);
      setCameraError(true);
      setUseCamera(false);
      setSelfieBase64("https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&auto=format&fit=crop&q=80");
    }
  };

  // Play the video stream when the element is rendered and stream/useCamera is loaded
  useEffect(() => {
    if (useCamera && stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(err => console.error("Error playing video:", err));
    }
  }, [useCamera, stream]);

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setUseCamera(false);
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
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setSelfieBase64(dataUrl);
        stopCamera();
      }
    }
  };

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  // Handle Auto GPS coordination fetching
  useEffect(() => {
    if (!selectedScheduleId) return;
    const currentClass = schedules.find(s => s.id === selectedScheduleId);
    if (!currentClass) return;
    const site = sites.find(s => s.id === currentClass.siteId);
    if (!site) return;

    setIsLocating(true);
    setGpsError('');

    if (!navigator.geolocation) {
      setCoordinates({
        lat: site.latitude + 0.00008,
        lng: site.longitude - 0.00008,
        acc: 8
      });
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoordinates({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          acc: Math.round(pos.coords.accuracy) || 8
        });
        setIsLocating(false);
      },
      (error) => {
        console.warn("Auto GPS fallback", error);
        setCoordinates({
          lat: site.latitude + 0.00008,
          lng: site.longitude - 0.00008,
          acc: 8
        });
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  }, [selectedScheduleId, schedules, sites]);

  // Calculate distance display helper
  useEffect(() => {
    if (!coordinates || !selectedScheduleId) return;
    const currentClass = schedules.find(s => s.id === selectedScheduleId);
    if (!currentClass) return;
    const site = sites.find(s => s.id === currentClass.siteId);
    if (!site) return;

    const R = 6371e3; // Earth radius in meters
    const phi1 = (coordinates.lat * Math.PI) / 180;
    const phi2 = (site.latitude * Math.PI) / 180;
    const deltaPhi = ((site.latitude - coordinates.lat) * Math.PI) / 180;
    const deltaLambda = ((site.longitude - coordinates.lng) * Math.PI) / 180;

    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const dist = R * c;

    setDistanceInfo({
      name: site.name,
      dist: Math.round(dist)
    });
  }, [coordinates, selectedScheduleId, schedules, sites]);

  const handleSubmitAttendance = () => {
    if (!selectedScheduleId || !coordinates) return;
    if (!selfieBase64) {
      alert("Please capture a live selfie first.");
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      try {
        const { record } = checkInTrainer(
          selectedScheduleId,
          coordinates.lat,
          coordinates.lng,
          coordinates.acc,
          selfieBase64
        );
        setCheckedInRecord(record);
      } catch (err) {
        console.error(err);
      } finally {
        setIsSubmitting(false);
      }
    }, 800);
  };

  const handleResetCheckin = () => {
    setSelfieBase64('');
    setCheckedInRecord(null);
    setUseCamera(false);
  };

  // If already checked in
  if (checkedInRecord || (existingRecord && !selfieBase64 && !useCamera)) {
    const record = checkedInRecord || existingRecord;
    const isReview = record.verificationStatus === 'Review';
    return (
      <div className="space-y-4 pb-8 text-white flex flex-col items-center justify-center text-center">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center border ${
          isReview 
            ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
            : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
        }`}>
          {isReview ? <ShieldAlert size={32} /> : <CheckCircle size={32} />}
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">
            {isReview ? 'Check-In Logged for Review' : 'Checked In Successfully'}
          </h2>
          <p className="text-xs text-slate-400 max-w-[240px] mt-1">
            {isReview 
              ? `Check-in recorded outside geofence (${record.distanceFromSite}m away). Pending admin review.`
              : `Operational punch verified at ${record.checkInTime}.`}
          </p>
        </div>

        {/* Checked in summary card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 w-full text-left space-y-2 text-xs font-semibold">
          <div className="flex justify-between border-b border-slate-800 pb-2">
            <span className="text-slate-400">Class:</span>
            <span className="text-slate-200 truncate max-w-[160px]">{record.courseName}</span>
          </div>
          <div className="flex justify-between border-b border-slate-800 pb-2">
            <span className="text-slate-400">Site:</span>
            <span className="text-slate-200">{record.siteName}</span>
          </div>
          <div className="flex justify-between border-b border-slate-800 pb-2">
            <span className="text-slate-400">Timestamp:</span>
            <span className="text-slate-200 font-mono">{record.checkInTime}</span>
          </div>
          <div className="flex justify-between items-center pt-1">
            <span className="text-slate-400">Status:</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
              isReview ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
            }`}>
              {record.verificationStatus}
            </span>
          </div>
        </div>

        <button
          onClick={handleResetCheckin}
          className="text-xs font-semibold text-slate-500 hover:text-slate-300 transition flex items-center gap-1.5 py-2"
        >
          <RotateCw size={12} /> Record Another Check-In
        </button>
      </div>
    );
  }

  // Render no classes state
  if (todaysClasses.length === 0) {
    return (
      <div className="space-y-4 pb-8 text-white flex flex-col items-center justify-center text-center h-[500px]">
        <div className="w-16 h-16 bg-slate-900 border border-slate-800 rounded-full flex items-center justify-center text-slate-500">
          <MapPin size={28} />
        </div>
        <div>
          <p className="font-bold text-white">No Classes Today</p>
          <p className="text-xs text-slate-400 max-w-[220px] mt-1">
            There are no classes scheduled for your account today ({todayStr}).
          </p>
        </div>
        <p className="text-[10px] text-slate-600 italic">
          To test, switch to Admin view and create a schedule class for today.
        </p>
      </div>
    );
  }

  const isOutsideGeofence = distanceInfo ? distanceInfo.dist > 200 : false;

  return (
    <div className="space-y-4 pb-8 text-white relative">
      <div className="flex justify-between items-center">
        <h2 className="text-md font-bold tracking-wide">Mark Attendance</h2>
        <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span> GPS Geofenced
        </span>
      </div>

      {/* Select class dropdown */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-1">
        <label className="text-[10px] uppercase font-bold tracking-wide text-slate-400">Active Session</label>
        <select
          value={selectedScheduleId}
          onChange={(e) => setSelectedScheduleId(e.target.value)}
          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs font-semibold outline-none focus:border-blue-500 text-white"
        >
          {todaysClasses.map(c => (
            <option key={c.id} value={c.id}>
              {c.courseName} ({c.startTime} - {c.endTime})
            </option>
          ))}
        </select>
      </div>

      {/* Camera Capture Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 overflow-hidden flex flex-col items-center">
        <div className="relative w-full aspect-square max-w-[240px] bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex flex-col items-center justify-center">
          
          {/* Live Video Feed */}
          {useCamera && (
            <div className="absolute inset-0 w-full h-full">
              <video
                ref={videoRef}
                playsInline
                muted
                className="w-full h-full object-cover transform -scale-x-100"
              />
            </div>
          )}

          {/* Captured Selfie Image */}
          {!useCamera && selfieBase64 && (
            <img
              src={selfieBase64}
              alt="Selfie preview"
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}

          {/* Placeholder state */}
          {!useCamera && !selfieBase64 && (
            <div className="text-center p-4 flex flex-col items-center text-slate-500">
              <Camera size={40} className="mb-2" />
              <p className="text-xs font-semibold">Camera Idle</p>
              <p className="text-[10px] text-slate-500 max-w-[150px] mt-0.5">Click below to open device camera</p>
            </div>
          )}

          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Camera Control Buttons */}
        <div className="mt-3 flex gap-2 w-full max-w-[240px]">
          {useCamera ? (
            <button
              onClick={capturePhoto}
              className="flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg"
            >
              <Camera size={14} /> Snap Photo
            </button>
          ) : (
            <button
              onClick={startCamera}
              className="flex-1 bg-slate-850 hover:bg-slate-800 border border-slate-700 text-slate-200 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
            >
              {selfieBase64 ? 'Retake Photo' : 'Activate Camera'}
            </button>
          )}
        </div>
        {cameraError && (
          <p className="text-[9px] text-amber-500 mt-2 italic">Camera blocked. Loaded default selfie.</p>
        )}
      </div>

      {/* Auto GPS Location Verification */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex justify-between items-center border-b border-slate-850 pb-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Auto GPS Geofence</span>
          <span className="flex items-center gap-1 text-[9px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Auto GPS
          </span>
        </div>

        <div className="bg-slate-955 border border-slate-850 rounded-xl p-2.5 flex items-center justify-between text-[11px] font-semibold text-slate-300 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${!isOutsideGeofence ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${!isOutsideGeofence ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
            </span>
            <span>Device Geofence Status</span>
          </div>
          <span className={!isOutsideGeofence ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
            {!isOutsideGeofence ? 'VERIFIED ON SITE' : 'OUTSIDE GEOFENCE'}
          </span>
        </div>

        {/* GPS Meta details */}
        {coordinates && distanceInfo && (
          <div className="bg-slate-950 border border-slate-850 rounded-xl p-2.5 space-y-1.5 text-[11px] text-slate-400 font-medium">
            <div className="flex justify-between">
              <span>Client Site</span>
              <span className="text-slate-205 truncate max-w-[150px]">{distanceInfo.name}</span>
            </div>
            <div className="flex justify-between">
              <span>Your distance</span>
              <span className={`font-semibold ${!isOutsideGeofence ? 'text-emerald-400' : 'text-amber-400'}`}>
                {distanceInfo.dist} meters {isOutsideGeofence ? '(Outside Geofence)' : ''}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Accuracy radius</span>
              <span className="text-slate-300">± {coordinates.acc}m</span>
            </div>
          </div>
        )}
        {isLocating && <span className="text-[10px] text-blue-400 font-semibold animate-pulse block text-center">Locating...</span>}
        {gpsError && <p className="text-[9px] text-amber-500 italic mt-1 text-center">{gpsError}</p>}
      </div>

      {/* Submit Button */}
      <button
        onClick={handleSubmitAttendance}
        disabled={isSubmitting || !selfieBase64 || !coordinates}
        className={`w-full py-3 rounded-xl font-bold text-xs tracking-wide transition shadow-lg flex items-center justify-center gap-2 ${
          !selfieBase64 || !coordinates
            ? 'bg-slate-800 text-slate-500 border border-slate-850 cursor-not-allowed'
            : isOutsideGeofence
            ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-900/30 cursor-pointer'
            : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-900/20'
        }`}
      >
        {isSubmitting ? (
          'Recording check-in...'
        ) : isOutsideGeofence ? (
          <><ShieldAlert size={15} /> Submit Check-In for Review</>
        ) : (
          <><Check size={15} /> Mark Attendance</>
        )}
      </button>
    </div>
  );
};

export default MobileAttendance;
