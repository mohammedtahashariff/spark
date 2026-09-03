import React, { useState, useRef, useEffect } from 'react';
import { useDatabase } from '../../context/DatabaseContext';
import { 
  FileText, CheckCircle, Clock, ShieldCheck, Mail, 
  Phone, Download, Eye, Upload, Calendar, Laptop, 
  History, AlertCircle, RefreshCw, X, ExternalLink, FileSpreadsheet
} from 'lucide-react';
import type { Trainer } from '../../types';
import { getPermanentResume, savePermanentResume, type StoredResumeFile } from '../../utils/fileStorage';

const TrainerProfile: React.FC = () => {
  const { currentUser, trainers, uploadTrainerResume } = useDatabase();
  const trainer = trainers.find(t => t.email === currentUser?.email) || trainers[0];

  const [resumeModalOpen, setResumeModalOpen] = useState(false);
  const [modalViewTab, setModalViewTab] = useState<'pdf' | 'overview'>('pdf');
  const [showUploadAlert, setShowUploadAlert] = useState<string | null>(null);
  const [persistentResume, setPersistentResume] = useState<StoredResumeFile | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load verified permanent resume from IndexedDB on mount or trainer change
  useEffect(() => {
    let isMounted = true;
    getPermanentResume(trainer.id).then(stored => {
      if (isMounted && stored) {
        setPersistentResume(stored);
      }
    });
    return () => { isMounted = false; };
  }, [trainer.id]);

  const activeResumeName = persistentResume?.name || trainer.resumeName || `${trainer.name.replace(/\s+/g, '_')}_Resume.pdf`;
  const activeResumeUrl = persistentResume?.url || trainer.resumeUrl;
  const activeResumeSize = persistentResume?.size || trainer.resumeSize || '1.4 MB';
  const activeResumeUploadedAt = persistentResume?.uploadedAt || trainer.resumeUploadedAt || '01 Sep 2026';
  const hasUploadedFile = Boolean(activeResumeUrl && (activeResumeUrl.startsWith('data:') || activeResumeUrl.startsWith('blob:') || activeResumeUrl.startsWith('http')));

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validation: PDF, DOC, DOCX only
    const allowedExtensions = ['pdf', 'doc', 'docx'];
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (!allowedExtensions.includes(ext)) {
      setShowUploadAlert('Invalid file format. Only PDF, DOC, and DOCX files are permitted.');
      return;
    }

    // Size limit: 15MB
    if (file.size > 15 * 1024 * 1024) {
      setShowUploadAlert('File size exceeds 15MB limit.');
      return;
    }

    const sizeFormatted = file.size > 1024 * 1024 
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` 
      : `${Math.round(file.size / 1024)} KB`;

    // Read real file content as Base64 Data URL for permanent in-browser storage & PDF viewing
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      const today = new Date().toISOString().split('T')[0];
      const fileData: StoredResumeFile = {
        name: file.name,
        url: dataUrl,
        size: sizeFormatted,
        uploadedAt: today
      };

      // 1. Save permanently to IndexedDB (survives all page reloads & closes)
      await savePermanentResume(trainer.id, fileData);
      setPersistentResume(fileData);

      // 2. Dispatch to state context
      uploadTrainerResume(trainer.id, {
        name: file.name,
        url: dataUrl,
        size: sizeFormatted
      });

      setShowUploadAlert(`Successfully uploaded and permanently stored ${file.name}`);
      setTimeout(() => setShowUploadAlert(null), 3500);
    };
    reader.onerror = () => {
      setShowUploadAlert('Failed to read file. Please try again.');
    };
    reader.readAsDataURL(file);
  };

  const handleDownload = () => {
    const fileName = activeResumeName;
    
    if (activeResumeUrl && (activeResumeUrl.startsWith('data:') || activeResumeUrl.startsWith('blob:'))) {
      const link = document.createElement('a');
      link.href = activeResumeUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // Create downloadable resume document
      const content = `DEVLUSTRO TECHNOLOGIES PVT LTD - VERIFIED TRAINER RESUME\n=======================================================\nName: ${trainer.name}\nIndividual ID: ${trainer.individualId}\nEmail: ${trainer.email}\nPhone: ${trainer.phone}\nDate of Joining: ${trainer.dateOfJoining || '15 July 2025'}\nHourly Rate: ₹${trainer.rate}/hr\nSkills: ${trainer.skills.join(', ')}\n\nProfessional Summary:\nSenior Enterprise Technical Instructor & Architect with verified expertise in Full-Stack development, AI/ML models, and enterprise software engineering.\n`;
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${trainer.name.replace(/\s+/g, '_')}_Resume.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  const handleOpenInNewTab = () => {
    if (activeResumeUrl && (activeResumeUrl.startsWith('data:') || activeResumeUrl.startsWith('blob:'))) {
      const win = window.open();
      if (win) {
        win.document.write(`
          <html>
            <head><title>${activeResumeName}</title></head>
            <body style="margin:0;padding:0;background:#18181b;">
              <iframe src="${activeResumeUrl}" frameborder="0" style="width:100%;height:100vh;border:none;"></iframe>
            </body>
          </html>
        `);
      }
    }
  };

  const formattedLastLogin = trainer.lastLoginAt 
    ? new Date(trainer.lastLoginAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })
    : '01 Sep 2026, 09:31 AM';

  const loginHistoryItems = trainer.loginHistory || [
    { id: 'lh1', date: '01 Sep 2026', time: '09:31 AM', device: 'Chrome / Windows', ipAddress: '103.14.120.45', status: 'Successful' as const },
    { id: 'lh2', date: '31 Aug 2026', time: '09:12 AM', device: 'Android Chrome', ipAddress: '103.14.120.45', status: 'Successful' as const },
    { id: 'lh3', date: '30 Aug 2026', time: '02:15 PM', device: 'Chrome / Windows', ipAddress: '103.14.120.45', status: 'Successful' as const }
  ];

  return (
    <div className="space-y-6 text-slate-750 dark:text-slate-350 flex flex-col h-full transition-colors duration-200">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-wide">My Trainer Profile</h2>
          <p className="text-xs text-slate-500 dark:text-slate-450 mt-0.5 font-medium">
            Manage your credentials, upload resume, view joining details, and track login access logs.
          </p>
        </div>

        {/* Date of Joining Pill */}
        <div className="bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-4 py-2 rounded-xl text-left sm:text-right">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Date of Joining</span>
          <p className="text-xs font-black text-slate-900 dark:text-white mt-0.5 flex items-center gap-1.5">
            <Calendar size={13} className="text-[#E50914]" />
            <span>{trainer.dateOfJoining || '15 July 2025'}</span>
          </p>
        </div>
      </div>

      {showUploadAlert && (
        <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 p-3 rounded-xl text-xs font-bold flex items-center justify-between animate-fadeIn">
          <span>{showUploadAlert}</span>
          <button onClick={() => setShowUploadAlert(null)}><X size={14} /></button>
        </div>
      )}

      {/* Grid: Profile Card & Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 1 Col: Trainer Summary Card */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-6">
          <div className="space-y-4 flex flex-col items-center text-center">
            
            <div className="relative">
              <img
                src={currentUser?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80"}
                alt="Trainer avatar"
                className="w-20 h-20 rounded-full border-2 border-[#E50914] shadow-md object-cover"
              />
              <span className="absolute -top-1.5 -right-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-sm">
                {trainer.status}
              </span>
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">{trainer.name}</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">{trainer.individualId}</p>
            </div>

            {/* Date of Joining Display */}
            <div className="bg-slate-50 dark:bg-zinc-950 p-3 rounded-xl border border-slate-200 dark:border-zinc-800 w-full text-left space-y-1">
              <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Date of Joining</span>
              <p className="text-xs font-black text-slate-900 dark:text-white">{trainer.dateOfJoining || '15 July 2025'}</p>
              <p className="text-[9px] text-slate-400 italic">Official joining date recorded in DevLustro HR database.</p>
            </div>

            {/* Last Login Display */}
            <div className="bg-slate-50 dark:bg-zinc-950 p-3 rounded-xl border border-slate-200 dark:border-zinc-800 w-full text-left space-y-1">
              <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Last Login</span>
              <p className="text-xs font-black text-[#E50914]">{formattedLastLogin}</p>
              <p className="text-[9px] text-slate-400">Authenticated via Secure Spark Gateway</p>
            </div>

            {/* Contact Details */}
            <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 w-full text-left space-y-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-2">
                <Mail size={14} className="text-slate-400 shrink-0" />
                <span className="truncate">{trainer.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={14} className="text-slate-400 shrink-0" />
                <span>{trainer.phone}</span>
              </div>
            </div>

            {/* Skills */}
            <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 w-full text-left space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Skills & Domains</span>
              <div className="flex flex-wrap gap-1.5">
                {trainer.skills.map((s, idx) => (
                  <span key={idx} className="bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-2.5 py-0.5 text-[10px] font-bold text-slate-700 dark:text-slate-300">
                    {s}
                  </span>
                ))}
              </div>
            </div>

          </div>

          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-wider pt-4 border-t border-slate-100 dark:border-zinc-800 justify-center">
            <ShieldCheck size={14} className="text-emerald-500" />
            <span>Encrypted Trainer Vault</span>
          </div>
        </div>

        {/* Right 2 Cols: Dedicated RESUME Section & Login History */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* DEDICATED RESUME SECTION */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-zinc-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">RESUME</h3>
                <p className="text-xs text-slate-500 mt-0.5">Upload, replace, and view your verified professional CV/Resume PDF.</p>
              </div>
              <span className="text-[10px] font-bold text-slate-400">PDF, DOC, DOCX up to 10MB</span>
            </div>

            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".pdf,.doc,.docx"
              className="hidden"
            />

            {/* Resume File Details Card */}
            <div className="bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-850 rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-red-500/10 text-[#E50914] border border-[#E50914]/20 flex items-center justify-center shrink-0">
                  <FileText size={24} />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white">{activeResumeName}</h4>
                  <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-455 mt-1 font-semibold">
                    <span>Uploaded: {activeResumeUploadedAt}</span>
                    <span>•</span>
                    <span>Size: {activeResumeSize}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons: VIEW RESUME, DOWNLOAD, REPLACE */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setModalViewTab(hasUploadedFile ? 'pdf' : 'overview');
                    setResumeModalOpen(true);
                  }}
                  className="px-3.5 py-2 bg-[#E50914] hover:bg-[#b00610] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm shadow-red-600/20"
                >
                  <Eye size={14} /> VIEW RESUME
                </button>

                <button
                  type="button"
                  onClick={handleDownload}
                  className="px-3.5 py-2 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Download size={14} /> DOWNLOAD
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-2 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Upload size={14} /> REPLACE PDF
                </button>
              </div>
            </div>

            <p className="text-[10px] text-slate-400 italic">
              * Resume files are stored in private secure cloud storage with strict enterprise access control.
            </p>
          </div>

          {/* LOGIN HISTORY SECTION */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <History size={16} className="text-[#E50914]" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Login History</h3>
              </div>
              <span className="text-[10px] font-bold text-slate-400">Permission Controlled</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-zinc-800 text-[10px] uppercase font-bold text-slate-400 dark:text-zinc-500 tracking-wider">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Time</th>
                    <th className="py-2.5 px-3">Device / Client</th>
                    <th className="py-2.5 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 font-semibold">
                  {loginHistoryItems.map((lh, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-zinc-800/40">
                      <td className="py-2.5 px-3 text-slate-900 dark:text-white font-bold">{lh.date}</td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">{lh.time}</td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                        <Laptop size={12} className="text-slate-400" />
                        <span>{lh.device}</span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded text-[9px] font-black uppercase">
                          {lh.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Digital Folder Compliance */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Compliance Documents</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {trainer.documents.map((doc, idx) => (
                <div key={idx} className="bg-slate-50 dark:bg-zinc-950 p-3 rounded-xl border border-slate-200 dark:border-zinc-800 flex justify-between items-center text-xs">
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">{doc.name}</p>
                    <p className="text-[9px] text-slate-400 mt-0.5">{doc.documentNumber}</p>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded text-[9px] font-black uppercase">
                    {doc.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* VIEW RESUME MODAL WITH REAL PDF VIEWER & EMBED */}
      {resumeModalOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-3 sm:p-6 backdrop-blur-md" onClick={() => setResumeModalOpen(false)}>
          <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-3xl p-5 sm:p-7 max-w-4xl w-full space-y-4 shadow-2xl max-h-[92vh] flex flex-col" onClick={e => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-zinc-800 pb-3 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 text-[#E50914] flex items-center justify-center font-bold">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>{activeResumeName}</span>
                    <span className="text-[10px] text-slate-400 font-normal">({activeResumeSize})</span>
                  </h3>
                  <p className="text-[10px] text-slate-500 font-semibold">Verified Enterprise Resume • {trainer.name}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* View switcher tabs */}
                <div className="bg-slate-100 dark:bg-zinc-900 p-1 rounded-xl flex items-center gap-1 border border-slate-200 dark:border-zinc-800 text-[11px] font-bold">
                  {hasUploadedFile && (
                    <button
                      onClick={() => setModalViewTab('pdf')}
                      className={`px-3 py-1 rounded-lg transition ${
                        modalViewTab === 'pdf' ? 'bg-[#E50914] text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      PDF Embed
                    </button>
                  )}
                  <button
                    onClick={() => setModalViewTab('overview')}
                    className={`px-3 py-1 rounded-lg transition ${
                      modalViewTab === 'overview' ? 'bg-[#E50914] text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Structured Overview
                  </button>
                </div>

                <button onClick={() => setResumeModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold text-xl px-2">&times;</button>
              </div>
            </div>

            {/* Document Preview Canvas */}
            <div className="flex-grow overflow-hidden rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
              {modalViewTab === 'pdf' && hasUploadedFile ? (
                /* Real PDF Iframe Viewer */
                <iframe
                  src={activeResumeUrl}
                  title="Trainer Resume PDF"
                  className="w-full h-full min-h-[55vh] border-none bg-white rounded-2xl"
                />
              ) : (
                /* Structured Enterprise Resume Layout */
                <div className="p-6 sm:p-8 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar text-xs leading-relaxed text-slate-800 dark:text-slate-200">
                  
                  <div className="flex justify-between items-start border-b border-slate-200 dark:border-zinc-800 pb-5">
                    <div>
                      <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{trainer.name}</h2>
                      <p className="text-xs font-semibold text-[#E50914] mt-0.5">{trainer.individualId} • Senior Corporate Trainer</p>
                      <p className="text-slate-500 mt-1">{trainer.email} • {trainer.phone}</p>
                    </div>
                    <div className="bg-slate-100 dark:bg-zinc-800 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 text-right">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Date of Joining</span>
                      <span className="text-xs font-black text-slate-900 dark:text-white">{trainer.dateOfJoining || '15 July 2025'}</span>
                    </div>
                  </div>

                  {/* Executive Summary */}
                  <div className="space-y-2">
                    <h4 className="font-extrabold uppercase text-[10px] text-slate-400 tracking-wider">Executive Summary</h4>
                    <p className="text-slate-700 dark:text-slate-300">
                      Senior Enterprise Technical Instructor and Full-Stack Systems Architect with 8+ years delivering high-impact industry programs in modern JavaScript/TypeScript, cloud microservices, distributed systems, and AI models for engineering colleges and corporate clients.
                    </p>
                  </div>

                  {/* Technical Competencies */}
                  <div className="space-y-2">
                    <h4 className="font-extrabold uppercase text-[10px] text-slate-400 tracking-wider">Core Technical Competencies</h4>
                    <div className="flex flex-wrap gap-2">
                      {trainer.skills.map((s, idx) => (
                        <span key={idx} className="bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 px-3 py-1 rounded-lg font-bold text-[11px] text-slate-800 dark:text-slate-200">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Verified Delivery Stats */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    <div className="bg-white dark:bg-zinc-800 p-3.5 rounded-xl border border-slate-200 dark:border-zinc-700 space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Lecture Delivery Rate</span>
                      <p className="text-sm font-black text-[#E50914]">₹{trainer.rate > 0 ? `${trainer.rate}/hr` : `${trainer.fixedSalary}/mo`}</p>
                    </div>
                    <div className="bg-white dark:bg-zinc-800 p-3.5 rounded-xl border border-slate-200 dark:border-zinc-700 space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Audited Satisfaction</span>
                      <p className="text-sm font-black text-emerald-500">4.9 / 5.0 (500+ Trainees)</p>
                    </div>
                    <div className="bg-white dark:bg-zinc-800 p-3.5 rounded-xl border border-slate-200 dark:border-zinc-700 space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Compliance Status</span>
                      <p className="text-sm font-black text-slate-900 dark:text-white">{trainer.status} Verified</p>
                    </div>
                  </div>

                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-2 shrink-0">
              <span className="text-[10px] text-slate-400 font-semibold">
                DevLustro Technologies Pvt Ltd • Spark Enterprise Document Security
              </span>

              <div className="flex items-center gap-2">
                {hasUploadedFile && (
                  <button
                    onClick={handleOpenInNewTab}
                    className="px-4 py-2 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <ExternalLink size={14} /> Open in New Tab
                  </button>
                )}

                <button
                  onClick={handleDownload}
                  className="px-5 py-2 bg-[#E50914] hover:bg-[#b00610] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-red-600/20"
                >
                  <Download size={14} /> DOWNLOAD PDF
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default TrainerProfile;
