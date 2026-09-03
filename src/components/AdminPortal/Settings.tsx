import React, { useState } from 'react';
import { useDatabase } from '../../context/DatabaseContext';
import { Save, ShieldCheck, HelpCircle, Eye, EyeOff, Lock } from 'lucide-react';

const SETTINGS_KEY = 'spk_org_settings';

const defaultSettings = {
  geofenceRadius: '200',
  orgName: 'DevLustro technologies pvt ltd',
  invoicePrefix: 'SPK/INV/2026-27/',
  taxIdentifier: 'GSTIN29AAACD9932B1Z3',
};

const Settings: React.FC = () => {
  const { addAuditLog } = useDatabase();
  const stored = (() => {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      return raw ? { ...defaultSettings, ...JSON.parse(raw) } : defaultSettings;
    } catch {
      return defaultSettings;
    }
  })();

  const [geofenceRadius, setGeofenceRadius] = useState(stored.geofenceRadius);
  const [orgName, setOrgName] = useState(stored.orgName);
  const [invoicePrefix, setInvoicePrefix] = useState(stored.invoicePrefix);
  const [taxIdentifier, setTaxIdentifier] = useState(stored.taxIdentifier);
  const [showTaxId, setShowTaxId] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const next = { geofenceRadius, orgName, invoicePrefix, taxIdentifier };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
    addAuditLog(
      'System Settings Update',
      `Updated Spark defaults. Entity: ${orgName}. Geofence: ${geofenceRadius}m. Prefix: ${invoicePrefix}.`
    );
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-5 text-zinc-700 dark:text-zinc-300 max-w-xl">
      <div>
        <h2 className="text-xl font-bold text-black dark:text-white tracking-wide">System Settings</h2>
        <p className="text-xs text-zinc-500 mt-0.5">Organization defaults for Spark, operated by DevLustro technologies pvt ltd.</p>
      </div>

      <form onSubmit={handleSave} className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 space-y-4 shadow-sm text-xs font-semibold">
        <div className="space-y-1.5">
          <label className="text-zinc-500 font-semibold flex items-center gap-1">
            Default Geofence Radius (meters)
            <HelpCircle size={12} />
          </label>
          <input
            type="number"
            value={geofenceRadius}
            onChange={(e) => setGeofenceRadius(e.target.value)}
            className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5 text-zinc-900 dark:text-white outline-none"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-zinc-500 font-semibold">Legal entity</label>
          <input
            type="text"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5 text-zinc-900 dark:text-white outline-none"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-zinc-500 font-semibold">Invoice numbering prefix</label>
          <input
            type="text"
            value={invoicePrefix}
            onChange={(e) => setInvoicePrefix(e.target.value)}
            className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5 text-zinc-900 dark:text-white outline-none font-mono"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-zinc-500 font-semibold flex items-center gap-1.5">
              <Lock size={12} className="text-amber-500" />
              <span>Tax Registration ID (GSTIN)</span>
            </label>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-500/20">
              Secured & Encrypted
            </span>
          </div>
          <div className="relative">
            <input
              type={showTaxId ? 'text' : 'password'}
              value={taxIdentifier}
              onChange={(e) => setTaxIdentifier(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5 pr-10 text-zinc-900 dark:text-white outline-none font-mono tracking-wider"
            />
            <button
              type="button"
              onClick={() => setShowTaxId(prev => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition"
              title={showTaxId ? 'Hide GST Number' : 'Show GST Number'}
            >
              {showTaxId ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <p className="text-[10px] text-zinc-400">
            GSTIN is masked to prevent unauthorized disclosure on shared workstation screens.
          </p>
        </div>

        <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
          <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-bold">
            <ShieldCheck size={14} className="text-emerald-500" />
            <span>Protected Enterprise Setting</span>
          </div>
          <button type="submit" className="bg-[#E50914] hover:bg-[#b00610] text-white rounded-xl px-4 py-2 text-xs font-bold flex items-center gap-1.5 shadow">
            <Save size={14} /> {saved ? 'Saved' : 'Save changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Settings;
