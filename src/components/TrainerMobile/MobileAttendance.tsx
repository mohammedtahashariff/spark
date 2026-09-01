import React, { useState, useEffect, useRef } from 'react';
import { useDatabase } from '../../context/DatabaseContext';
import { Camera, MapPin, CheckCircle, RotateCw } from 'lucide-react';


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

  // GPS Simulation State
  const [gpsMode, setGpsMode] = useState<'real' | 'simulate_in' | 'simulate_out'>('real');
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number; acc: number } | null>(null);
  const [distanceInfo, setDistanceInfo] = useState<{ name: string; dist: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [gpsError, setGpsError] = useState('');
  const [showSimulatorControls, setShowSimulatorControls] = useState(false);

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
      // Set a default mock selfie
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
        const dataUrl = canvas.toDataURL('image/jpeg');
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

  // Handle GPS coordination fetching/simulating
  useEffect(() => {
    if (!selectedScheduleId) return;
    const currentClass = schedules.find(s => s.id === selectedScheduleId);
    if (!currentClass) return;
    const site = sites.find(s => s.id === currentClass.siteId);
    if (!site) return;

    if (gpsMode === 'simulate_in') {
      // Simulate location extremely close to the site (e.g. within 15 meters)
      // Add very tiny offset to coordinates
      setCoordinates({
        lat: site.latitude + 0.00008,
        lng: site.longitude - 0.00008,
        acc: 8
      });
      setGpsError('');
    } else if (gpsMode === 'simulate_out') {
      // Simulate location far from the site (e.g. ~1.2 km away)
      setCoordinates({
        lat: site.latitude + 0.012,
        lng: site.longitude - 0.012,
        acc: 15
      });
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
          setCoordinates({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            acc: Math.round(pos.coords.accuracy)
          });
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
    // Add tiny delay for premium feedback feel
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
    }, 1200);
  };

  const handleResetCheckin = () => {
    setSelfieBase64('');
    setCheckedInRecord(null);
    setUseCamera(false);
  };

  // Render checked-in screen
  if (existingRecord || checkedInRecord) {
    const record = existingRecord || checkedInRecord;
    return (
      <div className="space-y-6 pb-8 text-white flex flex-col items-center text-center pt-4">
        <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500 border border-emerald-500/30 scale-105 transition-all">
          <CheckCircle size={36} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">Attendance Marked!</h2>
          <p className="text-xs text-slate-400 mt-1">Your check-in has been stored securely on the server.</p>
        </div>

        {/* Selfie preview */}
        <div className="relative w-36 h-36 rounded-2xl overflow-hidden border-2 border-slate-800 shadow-lg">
          <img
            src={record.selfieUrl}
            alt="Check-in Selfie"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Verification Summary */}
        <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 text-xs text-left space-y-2.5">
          <div className="flex justify-between border-b border-slate-850 pb-1.5">
            <span className="text-slate-400">Status</span>
            <span className={`font-bold ${record.verificationStatus === 'Verified' ? 'text-emerald-400' : 'text-amber-400'}`}>
              {record.verificationStatus === 'Verified' ? 'Verified (OK)' : 'Pending HR Review'}
            </span>
          </div>
          <div className="flex justify-between border-b border-slate-850 pb-1.5">
            <span className="text-slate-400">Check-in Time</span>
            <span className="font-semibold text-slate-200">{record.checkInTime}</span>
          </div>
          <div className="flex justify-between border-b border-slate-850 pb-1.5">
            <span className="text-slate-400">Class Site</span>
            <span className="font-semibold text-slate-200 text-right truncate max-w-[160px]">{record.siteName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Distance</span>
            <span className="font-semibold text-slate-200">
              {record.distanceFromSite}m {record.verificationStatus === 'Verified' ? ' (Inside Geofence)' : ' (Outside Geofence)'}
            </span>
          </div>
        </div>

        <button
          onClick={handleResetCheckin}
          className="text-xs font-semibold text-slate-500 hover:text-slate-300 transition flex items-center gap-1.5 py-2"
        >
          <RotateCw size={12} /> Test New Check-in Simulation
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
            <video
              ref={videoRef}
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover transform -scale-x-100"
            />
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
        <div className="mt-4 flex gap-2 w-full max-w-[240px]">
          {useCamera ? (
            <button
              onClick={capturePhoto}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
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
          <p className="text-[9px] text-amber-500 mt-2 italic">Camera blocked. Loaded default simulator selfie.</p>
        )}
      </div>

      {/* GPS Location Verification */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex justify-between items-center border-b border-slate-850 pb-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">GPS Position</span>
          <button
            type="button"
            onClick={() => setShowSimulatorControls(prev => !prev)}
            className="text-[10px] text-blue-400 hover:text-blue-300 font-bold underline transition"
          >
            {showSimulatorControls ? "Hide Simulator" : "Simulate Location"}
          </button>
        </div>

        {showSimulatorControls ? (
          <div className="grid grid-cols-3 gap-2 animate-fadeIn">
            <button
              onClick={() => setGpsMode('simulate_in')}
              className={`py-1.5 rounded-lg text-[10px] font-bold border transition ${
                gpsMode === 'simulate_in'
                  ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                  : 'bg-slate-950 border-slate-850 text-slate-400'
              }`}
            >
              At Site
            </button>
            <button
              onClick={() => setGpsMode('simulate_out')}
              className={`py-1.5 rounded-lg text-[10px] font-bold border transition ${
                gpsMode === 'simulate_out'
                  ? 'bg-amber-600/20 border-amber-500 text-amber-400'
                  : 'bg-slate-950 border-slate-850 text-slate-400'
              }`}
            >
              Breach GPS
            </button>
            <button
              onClick={() => setGpsMode('real')}
              className={`py-1.5 rounded-lg text-[10px] font-bold border transition ${
                gpsMode === 'real'
                  ? 'bg-purple-600/20 border-purple-500 text-purple-400'
                  : 'bg-slate-950 border-slate-850 text-slate-400'
              }`}
            >
              Real Device
            </button>
          </div>
        ) : (
          <div className="bg-slate-955 border border-slate-850 rounded-xl p-2.5 flex items-center justify-between text-[11px] font-semibold text-slate-300 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${distanceInfo && distanceInfo.dist <= 200 ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${distanceInfo && distanceInfo.dist <= 200 ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
              </span>
              <span>{gpsMode === 'real' ? 'Real Device Location' : 'Automatic Geo-Location'}</span>
            </div>
            <span className={distanceInfo && distanceInfo.dist <= 200 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
              {distanceInfo && distanceInfo.dist <= 200 ? 'DETECTED' : 'OUTSIDE SITE'}
            </span>
          </div>
        )}

        {/* GPS Meta details */}
        {coordinates && distanceInfo && (
          <div className="bg-slate-950 border border-slate-850 rounded-xl p-2.5 space-y-1.5 text-[11px] text-slate-400 font-medium">
            <div className="flex justify-between">
              <span>Client Site</span>
              <span className="text-slate-205 truncate max-w-[150px]">{distanceInfo.name}</span>
            </div>
            <div className="flex justify-between">
              <span>Your distance</span>
              <span className={`font-semibold ${distanceInfo.dist <= 200 ? 'text-emerald-400' : 'text-red-400'}`}>
                {distanceInfo.dist} meters
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
            : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-900/20'
        }`}
      >
        {isSubmitting ? 'Verifying check-in data...' : 'Mark Attendance'}
      </button>
    </div>
  );
};

export default MobileAttendance;
