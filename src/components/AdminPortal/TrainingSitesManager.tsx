import React, { useState } from 'react';
import { useDatabase } from '../../context/DatabaseContext';
import { 
  MapPin, Plus, Navigation, ShieldCheck, Phone, User, 
  Trash2, Edit3, X, Check, AlertCircle, Compass, Radio
} from 'lucide-react';
import type { ClientSite } from '../../types';

const TrainingSitesManager: React.FC = () => {
  const { sites, addSite, updateSite, deleteSite, attendanceRecords } = useDatabase();

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSite, setEditingSite] = useState<ClientSite | null>(null);

  // Form State
  const [siteName, setSiteName] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState<number | ''>(12.9716);
  const [longitude, setLongitude] = useState<number | ''>(77.5946);
  const [geofenceRadius, setGeofenceRadius] = useState<number>(100);
  const [contactPerson, setContactPerson] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');

  // Location fetching states
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationSuccess, setLocationSuccess] = useState(false);

  // Use My Current Location Handler
  const handleFetchCurrentLocation = () => {
    setLocationError(null);
    setLocationSuccess(false);

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = parseFloat(position.coords.latitude.toFixed(6));
        const lng = parseFloat(position.coords.longitude.toFixed(6));
        setLatitude(lat);
        setLongitude(lng);
        setIsLocating(false);
        setLocationSuccess(true);
      },
      (error) => {
        setIsLocating(false);
        if (error.code === error.PERMISSION_DENIED) {
          setLocationError('Location permission is required to automatically detect the training site location.');
        } else {
          setLocationError('Unable to retrieve current location. Please enter coordinates manually.');
        }
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleOpenAdd = () => {
    setEditingSite(null);
    setSiteName('');
    setAddress('');
    setLatitude(12.9716);
    setLongitude(77.5946);
    setGeofenceRadius(100);
    setContactPerson('');
    setContactNumber('');
    setStatus('Active');
    setLocationError(null);
    setLocationSuccess(false);
    setShowAddModal(true);
  };

  const handleOpenEdit = (site: ClientSite) => {
    setEditingSite(site);
    setSiteName(site.name);
    setAddress(site.address);
    setLatitude(site.latitude);
    setLongitude(site.longitude);
    setGeofenceRadius(site.geofenceRadius);
    setContactPerson(site.contactPerson || '');
    setContactNumber(site.contactNumber || '');
    setStatus(site.status || 'Active');
    setLocationError(null);
    setLocationSuccess(false);
    setShowAddModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!siteName || latitude === '' || longitude === '') return;

    if (editingSite) {
      updateSite({
        ...editingSite,
        name: siteName,
        address: address || `${siteName}, Bangalore`,
        latitude: Number(latitude),
        longitude: Number(longitude),
        geofenceRadius: Number(geofenceRadius),
        contactPerson,
        contactNumber,
        status
      });
    } else {
      addSite({
        name: siteName,
        address: address || `${siteName}, Bangalore`,
        latitude: Number(latitude),
        longitude: Number(longitude),
        geofenceRadius: Number(geofenceRadius),
        contactPerson,
        contactNumber,
        status
      });
    }

    setShowAddModal(false);
  };

  return (
    <div className="space-y-6 text-slate-700 dark:text-slate-350 transition-colors duration-200">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-wide">Training Sites & Geofence Boundaries</h2>
            <span className="bg-red-500/10 text-[#E50914] text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border border-[#E50914]/20">
              Super Admin
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-450 mt-1 font-medium">
            Manage authorized campus locations, configure GPS geofence radiuses, and test auto-location capture.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="bg-[#E50914] hover:bg-[#b00610] text-white rounded-xl px-4 py-2.5 text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-red-600/20 shrink-0"
        >
          <Plus size={16} /> + ADD TRAINING SITE
        </button>
      </div>

      {/* Sites Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {sites.map(site => {
          const checkinsCount = attendanceRecords.filter(r => r.siteId === site.id).length;
          return (
            <div 
              key={site.id}
              className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-2.5">
                    <div className="p-2 bg-red-500/10 rounded-xl text-[#E50914] border border-[#E50914]/20 shrink-0 mt-0.5">
                      <MapPin size={18} />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">{site.name}</h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-450 mt-0.5 leading-snug">{site.address}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                    site.status === 'Active' 
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                      : 'bg-slate-100 text-slate-500'
                  }`}>
                    {site.status || 'Active'}
                  </span>
                </div>

                {/* Geofence & Coordinates info */}
                <div className="bg-slate-50 dark:bg-zinc-950 p-3 rounded-xl border border-slate-150 dark:border-zinc-850 space-y-2 text-xs">
                  <div className="flex justify-between items-center font-semibold">
                    <span className="text-slate-400 text-[10px] uppercase font-bold flex items-center gap-1">
                      <Radio size={12} className="text-[#E50914]" /> Geofence Radius:
                    </span>
                    <span className="font-bold text-[#E50914]">{site.geofenceRadius} meters</span>
                  </div>

                  <div className="flex justify-between items-center text-[10px] font-mono text-slate-600 dark:text-slate-400 pt-1 border-t border-slate-200/60 dark:border-zinc-800">
                    <span>Lat: {site.latitude}</span>
                    <span>Lng: {site.longitude}</span>
                  </div>
                </div>

                {/* Contact person details */}
                {(site.contactPerson || site.contactNumber) && (
                  <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400 font-semibold pt-1">
                    {site.contactPerson && (
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <User size={12} className="text-slate-400" />
                        <span>{site.contactPerson}</span>
                      </div>
                    )}
                    {site.contactNumber && (
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <Phone size={12} className="text-slate-400" />
                        <span>{site.contactNumber}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Bottom Actions */}
              <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 flex justify-between items-center text-xs">
                <span className="text-[10px] text-slate-400 font-bold">{checkinsCount} Verified check-ins</span>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => handleOpenEdit(site)}
                    className="p-1.5 rounded-lg bg-slate-50 dark:bg-zinc-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 transition"
                    title="Edit Site"
                  >
                    <Edit3 size={13} />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Are you sure you want to delete ${site.name}?`)) {
                        deleteSite(site.id);
                      }
                    }}
                    className="p-1.5 rounded-lg bg-slate-50 dark:bg-zinc-800 hover:bg-rose-50 dark:hover:bg-rose-950 text-slate-400 hover:text-rose-500 transition"
                    title="Delete Site"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {/* ADD / EDIT TRAINING SITE MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 max-w-2xl w-full space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
            
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-zinc-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {editingSite ? 'Edit Training Site' : '+ ADD TRAINING SITE'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Configure GPS location and geofencing radius for trainer check-in validation.</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-lg">&times;</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              
              {/* Site Name & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Site Name *</label>
                  <input
                    type="text"
                    required
                    value={siteName}
                    onChange={(e) => setSiteName(e.target.value)}
                    placeholder="e.g. Bangalore Training Center"
                    className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 font-semibold text-slate-800 dark:text-white outline-none focus:border-[#E50914]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'Active' | 'Inactive')}
                    className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 font-bold text-slate-800 dark:text-white outline-none"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Address */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Address / Location Details *</label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. MG Road, Bangalore, Karnataka - 560001"
                  className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 font-semibold text-slate-800 dark:text-white outline-none focus:border-[#E50914]"
                />
              </div>

              {/* AUTO LOCATION FETCH SECTION */}
              <div className="bg-slate-50 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 space-y-3">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#E50914]">Geofence Coordinates</span>
                    <p className="text-slate-500 text-[11px]">Fetch exact coordinates from your current device GPS.</p>
                  </div>

                  <button
                    type="button"
                    onClick={handleFetchCurrentLocation}
                    disabled={isLocating}
                    className="bg-black dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-100 rounded-xl px-3.5 py-2 font-black text-xs flex items-center gap-1.5 transition shadow-sm disabled:opacity-60"
                  >
                    <Navigation size={14} className={isLocating ? 'animate-spin' : ''} />
                    {isLocating ? 'Detecting GPS...' : 'USE MY CURRENT LOCATION'}
                  </button>
                </div>

                {/* Location Alerts */}
                {locationError && (
                  <div className="bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 p-3 rounded-xl flex items-start gap-2 font-semibold">
                    <AlertCircle size={16} className="shrink-0 mt-0.5 text-amber-500" />
                    <span>{locationError}</span>
                  </div>
                )}

                {locationSuccess && (
                  <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 p-2.5 rounded-xl flex items-center gap-2 font-bold text-[11px]">
                    <Check size={14} /> Coordinates auto-populated from device GPS!
                  </div>
                )}

                {/* Coordinates & Geofence Radius Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Latitude</label>
                    <input
                      type="number"
                      step="0.000001"
                      required
                      value={latitude}
                      onChange={(e) => setLatitude(e.target.value === '' ? '' : parseFloat(e.target.value))}
                      placeholder="12.9716"
                      className="w-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg p-2 font-mono font-bold text-slate-800 dark:text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Longitude</label>
                    <input
                      type="number"
                      step="0.000001"
                      required
                      value={longitude}
                      onChange={(e) => setLongitude(e.target.value === '' ? '' : parseFloat(e.target.value))}
                      placeholder="77.5946"
                      className="w-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg p-2 font-mono font-bold text-slate-800 dark:text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Geofence Radius (m)</label>
                    <input
                      type="number"
                      min={20}
                      max={2000}
                      required
                      value={geofenceRadius}
                      onChange={(e) => setGeofenceRadius(Number(e.target.value))}
                      placeholder="100"
                      className="w-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg p-2 font-mono font-bold text-[#E50914] outline-none"
                    />
                  </div>
                </div>

                {/* Interactive Map Visualizer Preview */}
                <div className="relative w-full h-44 bg-slate-900 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center">
                  {/* Map Grid Pattern */}
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:24px_24px] opacity-40"></div>
                  
                  {/* Geofence Circle representation */}
                  <div 
                    className="absolute rounded-full border-2 border-dashed border-[#E50914] bg-[#E50914]/15 flex items-center justify-center transition-all duration-300"
                    style={{
                      width: `${Math.min(220, Math.max(70, (geofenceRadius / 100) * 80))}px`,
                      height: `${Math.min(220, Math.max(70, (geofenceRadius / 100) * 80))}px`
                    }}
                  >
                    <span className="text-[9px] font-black text-[#E50914] bg-black/80 px-2 py-0.5 rounded-full shadow">
                      {geofenceRadius}m Boundary
                    </span>
                  </div>

                  {/* Center Site Marker */}
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-[#E50914] text-white flex items-center justify-center shadow-lg shadow-red-600/50">
                      <MapPin size={18} />
                    </div>
                    <span className="text-[10px] font-black text-white bg-black/90 px-2 py-0.5 rounded mt-1 shadow">
                      📍 {siteName || 'Training Site'}
                    </span>
                  </div>

                  <div className="absolute bottom-2 left-2 text-[9px] font-mono text-slate-400 bg-black/80 px-2 py-1 rounded">
                    GPS: {latitude || 0}, {longitude || 0}
                  </div>
                </div>

              </div>

              {/* Contact Person & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Site Contact Person</label>
                  <input
                    type="text"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    placeholder="e.g. Prof. Narayana Murthy"
                    className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 font-semibold text-slate-800 dark:text-white outline-none focus:border-[#E50914]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Contact Number</label>
                  <input
                    type="text"
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 font-semibold text-slate-800 dark:text-white outline-none focus:border-[#E50914]"
                  />
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-100 dark:hover:bg-zinc-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#E50914] text-white rounded-xl font-bold hover:bg-[#b00610] transition shadow-md shadow-red-600/20"
                >
                  {editingSite ? 'Save Changes' : 'Create Training Site'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};

export default TrainingSitesManager;
