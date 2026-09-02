import React, { useState } from 'react';
import { useDatabase } from '../../context/DatabaseContext';
import { 
  Users, UserCheck, UserX, Clock, ShieldAlert, FileText, 
  AlertTriangle, Eye, Download, Search, CheckCircle, Plus, 
  Calendar, Award, Briefcase, Phone, Mail, FileCheck
} from 'lucide-react';
import type { Trainer } from '../../types';

interface HRDashboardProps {
  onNavigateToTrainers?: (statusFilter?: string) => void;
}

const HRDashboard: React.FC<HRDashboardProps> = ({ onNavigateToTrainers }) => {
  const { 
    trainers, attendanceRecords, addTrainer, updateTrainer, 
    updateTrainerDateOfJoining 
  } = useDatabase();

  const [selectedTrainer, setSelectedTrainer] = useState<Trainer | null>(null);
  const [activeTab, setActiveTab] = useState<'kpis' | 'roster' | 'exceptions' | 'documents'>('kpis');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewResumeModal, setViewResumeModal] = useState<Trainer | null>(null);

  // Form State for Onboarding Trainer
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [rate, setRate] = useState('1000');
  const [fixedSalary, setFixedSalary] = useState('0');
  const [skills, setSkills] = useState('');
  const [doj, setDoj] = useState(new Date().toISOString().split('T')[0]);

  // KPIs calculation
  const totalTrainers = trainers.length;
  const activeTrainers = trainers.filter(t => t.status === 'Active');
  const onboardingTrainers = trainers.filter(t => t.status === 'Onboarding');
  const inactiveTrainers = trainers.filter(t => t.status === 'Suspended');
  
  // New trainers (joined in last 60 days)
  const now = new Date();
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
  const newTrainers = trainers.filter(t => {
    if (!t.dateOfJoining) return false;
    const d = new Date(t.dateOfJoining);
    return !isNaN(d.getTime()) && d >= sixtyDaysAgo;
  });

  const attendanceExceptions = attendanceRecords.filter(r => r.verificationStatus === 'Review');
  
  // Missing / Expiring documents
  const missingDocsTrainers = trainers.filter(t => !t.documents || t.documents.length < 2);
  const pendingDocsCount = trainers.reduce((acc, t) => acc + (t.documents?.filter(d => d.status === 'Review' || d.status === 'Draft').length || 0), 0);

  const handleCreateTrainer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    addTrainer({
      individualId: `TRN-2026-${String(trainers.length + 1).padStart(3, '0')}`,
      name,
      email,
      phone: phone || '+91 98000 00000',
      status: 'Onboarding',
      rate: Number(rate) || 0,
      fixedSalary: Number(fixedSalary) || 0,
      skills: skills.split(',').map(s => s.trim()).filter(Boolean),
      dateOfJoining: doj,
      documents: [
        { category: 'Onboarding', name: 'Offer Letter', status: 'Draft', documentNumber: `DLT-OFF-${Date.now().toString().slice(-4)}`, uploadedAt: doj },
        { category: 'Identity', name: 'Identity Proof / Aadhaar', status: 'Draft', documentNumber: `DLT-ID-${Date.now().toString().slice(-4)}`, uploadedAt: doj }
      ]
    });

    setName('');
    setEmail('');
    setPhone('');
    setSkills('');
    setShowAddModal(false);
  };

  const handleUpdateStatus = (trainerId: string, newStatus: Trainer['status']) => {
    const target = trainers.find(t => t.id === trainerId);
    if (!target) return;
    updateTrainer({ ...target, status: newStatus });
    if (selectedTrainer?.id === trainerId) {
      setSelectedTrainer({ ...selectedTrainer, status: newStatus });
    }
  };

  const filteredTrainers = trainers.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.skills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
    if (statusFilter === 'All') return matchesSearch;
    return matchesSearch && t.status === statusFilter;
  });

  return (
    <div className="space-y-6 text-slate-700 dark:text-slate-350 transition-colors duration-200">
      
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800/80 rounded-2xl p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold text-slate-850 dark:text-white tracking-wide">HR Operations & Trainer Management</h2>
            <span className="bg-[#E50914]/10 text-[#E50914] text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border border-[#E50914]/20">
              HR Module
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-450 mt-1 font-medium">
            Monitor active trainer roster, track date of joining, verify digital compliance folders, and audit attendance exceptions.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="bg-[#E50914] hover:bg-[#b00610] text-white rounded-xl px-4 py-2 text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-red-600/20 shrink-0"
        >
          <Plus size={16} /> Onboard New Trainer
        </button>
      </div>

      {/* HR KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        
        {/* 1. Total Trainers */}
        <div 
          onClick={() => { setStatusFilter('All'); setActiveTab('roster'); }}
          className="bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800/80 rounded-xl p-3.5 shadow-sm hover:border-[#E50914]/40 cursor-pointer transition"
        >
          <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block truncate">Total Trainers</span>
          <p className="text-xl font-black text-slate-850 dark:text-white mt-1">{totalTrainers}</p>
          <span className="text-[8px] text-slate-400 dark:text-slate-500 font-semibold">Registered Roster</span>
        </div>

        {/* 2. ACTIVE TRAINERS (Primary KPI) */}
        <div 
          onClick={() => {
            setStatusFilter('Active');
            setActiveTab('roster');
            if (onNavigateToTrainers) onNavigateToTrainers('Active');
          }}
          className="bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/30 dark:border-emerald-500/20 rounded-xl p-3.5 shadow-sm hover:border-emerald-500 cursor-pointer transition relative group"
        >
          <div className="flex justify-between items-start">
            <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block truncate">Active Trainers</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
          </div>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{activeTrainers.length}</p>
          <span className="text-[8px] text-emerald-600/80 dark:text-emerald-400/80 font-bold group-hover:underline">Click to view active →</span>
        </div>

        {/* 3. New Trainers */}
        <div 
          onClick={() => { setStatusFilter('All'); setActiveTab('roster'); }}
          className="bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800/80 rounded-xl p-3.5 shadow-sm hover:border-blue-500/40 cursor-pointer transition"
        >
          <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block truncate">New Trainers</span>
          <p className="text-xl font-black text-blue-600 dark:text-blue-400 mt-1">{newTrainers.length}</p>
          <span className="text-[8px] text-slate-400 dark:text-slate-500 font-semibold">&lt; 60 days</span>
        </div>

        {/* 4. Onboarding */}
        <div 
          onClick={() => { setStatusFilter('Onboarding'); setActiveTab('roster'); }}
          className="bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800/80 rounded-xl p-3.5 shadow-sm hover:border-amber-500/40 cursor-pointer transition"
        >
          <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block truncate">Onboarding</span>
          <p className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1">{onboardingTrainers.length}</p>
          <span className="text-[8px] text-slate-400 dark:text-slate-500 font-semibold">Docs pending</span>
        </div>

        {/* 5. Inactive / Suspended */}
        <div 
          onClick={() => { setStatusFilter('Suspended'); setActiveTab('roster'); }}
          className="bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800/80 rounded-xl p-3.5 shadow-sm hover:border-red-500/40 cursor-pointer transition"
        >
          <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block truncate">Inactive</span>
          <p className="text-xl font-black text-rose-600 dark:text-rose-400 mt-1">{inactiveTrainers.length}</p>
          <span className="text-[8px] text-slate-400 dark:text-slate-500 font-semibold">Suspended</span>
        </div>

        {/* 6. Attendance Exceptions */}
        <div 
          onClick={() => setActiveTab('exceptions')}
          className="bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800/80 rounded-xl p-3.5 shadow-sm hover:border-amber-500/40 cursor-pointer transition"
        >
          <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block truncate">Exceptions</span>
          <p className="text-xl font-black text-amber-500 mt-1">{attendanceExceptions.length}</p>
          <span className="text-[8px] text-amber-500 font-bold">Requires Review</span>
        </div>

        {/* 7. Documents Pending */}
        <div 
          onClick={() => setActiveTab('documents')}
          className="bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800/80 rounded-xl p-3.5 shadow-sm hover:border-purple-500/40 cursor-pointer transition"
        >
          <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block truncate">Docs Review</span>
          <p className="text-xl font-black text-purple-500 mt-1">{pendingDocsCount}</p>
          <span className="text-[8px] text-slate-400 dark:text-slate-500 font-semibold">In verification</span>
        </div>

        {/* 8. Missing Docs */}
        <div 
          onClick={() => setActiveTab('documents')}
          className="bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800/80 rounded-xl p-3.5 shadow-sm hover:border-rose-500/40 cursor-pointer transition"
        >
          <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block truncate">Docs Missing</span>
          <p className="text-xl font-black text-rose-500 mt-1">{missingDocsTrainers.length}</p>
          <span className="text-[8px] text-slate-400 dark:text-slate-500 font-semibold">Incomplete files</span>
        </div>

      </div>

      {/* Main Roster & Trainer Detail View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Trainer Roster with Search & Filter */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800/80 rounded-2xl p-5 shadow-sm flex flex-col space-y-4">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 dark:border-zinc-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">Trainer Directory</span>
              <span className="bg-slate-100 dark:bg-zinc-800 text-[10px] font-bold px-2 py-0.5 rounded-full text-slate-600 dark:text-slate-300">
                {filteredTrainers.length} Trainers
              </span>
            </div>

            {/* Status Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {['All', 'Active', 'Onboarding', 'Suspended'].map(st => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition ${
                    statusFilter === st 
                      ? 'bg-[#E50914] text-white shadow-sm' 
                      : 'bg-slate-50 dark:bg-zinc-800/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by trainer name, email, or skills (e.g. Python, Full Stack)..."
              className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl py-2 pl-9 pr-3 text-xs text-slate-800 dark:text-white font-medium outline-none focus:border-[#E50914] transition"
            />
            <Search size={14} className="text-slate-400 dark:text-zinc-500 absolute top-3 left-3" />
          </div>

          {/* Trainer List Table */}
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-zinc-800 text-[10px] uppercase font-bold text-slate-400 dark:text-zinc-500 tracking-wider">
                  <th className="py-2.5 px-3">Trainer</th>
                  <th className="py-2.5 px-3">Date of Joining</th>
                  <th className="py-2.5 px-3">Resume</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60 font-semibold">
                {filteredTrainers.map(t => (
                  <tr 
                    key={t.id}
                    onClick={() => setSelectedTrainer(t)}
                    className={`hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 cursor-pointer transition ${
                      selectedTrainer?.id === t.id ? 'bg-red-50/40 dark:bg-red-950/20' : ''
                    }`}
                  >
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-red-600 to-amber-500 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-sm">
                          {t.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 dark:text-slate-100">{t.name}</p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">{t.individualId} • {t.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                        <Calendar size={12} className="text-slate-400" />
                        <span>{t.dateOfJoining || '15 July 2025'}</span>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      {t.resumeUrl || t.resumeName ? (
                        <button
                          onClick={(e) => { e.stopPropagation(); setViewResumeModal(t); }}
                          className="flex items-center gap-1 text-[10px] text-[#E50914] font-bold hover:underline"
                        >
                          <FileText size={12} /> {t.resumeName || 'Resume.pdf'}
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">Not uploaded</span>
                      )}
                    </td>

                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                        t.status === 'Active' 
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          : t.status === 'Onboarding'
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                          : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                      }`}>
                        {t.status}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedTrainer(t); }}
                        className="p-1.5 rounded-lg bg-slate-50 dark:bg-zinc-800 hover:bg-[#E50914] hover:text-white transition text-slate-600 dark:text-slate-400"
                        title="View Full Details"
                      >
                        <Eye size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>

        {/* Right 1 Col: Selected Trainer HR Detail Card */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800/80 rounded-2xl p-5 shadow-sm flex flex-col space-y-4">
          {selectedTrainer ? (
            <div className="space-y-4">
              <div className="flex justify-between items-start border-b border-slate-100 dark:border-zinc-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-850 dark:text-white">{selectedTrainer.name}</h3>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">{selectedTrainer.individualId}</p>
                </div>
                <select
                  value={selectedTrainer.status}
                  onChange={(e) => handleUpdateStatus(selectedTrainer.id, e.target.value as Trainer['status'])}
                  className="bg-slate-50 dark:bg-zinc-950 text-[10px] font-bold border border-slate-200 dark:border-zinc-800 rounded-lg px-2 py-1 outline-none text-slate-800 dark:text-white"
                >
                  <option value="Active">Active</option>
                  <option value="Onboarding">Onboarding</option>
                  <option value="Suspended">Suspended</option>
                </select>
              </div>

              {/* Date of Joining Editor (HR Authorized) */}
              <div className="bg-slate-50 dark:bg-zinc-950 border border-slate-150 dark:border-zinc-850 rounded-xl p-3 space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-extrabold uppercase text-slate-400 dark:text-zinc-500 tracking-wider">Date of Joining (DOJ)</span>
                  <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold">HR Authorized</span>
                </div>
                <input
                  type="date"
                  value={selectedTrainer.dateOfJoining || ''}
                  onChange={(e) => {
                    const newDate = e.target.value;
                    updateTrainerDateOfJoining(selectedTrainer.id, newDate);
                    setSelectedTrainer({ ...selectedTrainer, dateOfJoining: newDate });
                  }}
                  className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg p-2 text-xs font-bold text-slate-800 dark:text-white outline-none focus:border-[#E50914]"
                />
              </div>

              {/* Resume Card */}
              <div className="bg-slate-50 dark:bg-zinc-950 border border-slate-150 dark:border-zinc-855 rounded-xl p-3 space-y-2">
                <span className="text-[10px] font-extrabold uppercase text-slate-400 dark:text-zinc-500 tracking-wider">Professional Resume</span>
                {selectedTrainer.resumeUrl || selectedTrainer.resumeName ? (
                  <div className="flex justify-between items-center bg-white dark:bg-zinc-900 p-2.5 rounded-lg border border-slate-200 dark:border-zinc-800">
                    <div className="flex items-center gap-2">
                      <FileText size={16} className="text-[#E50914]" />
                      <div>
                        <p className="text-xs font-bold text-slate-800 dark:text-white truncate max-w-[140px]">{selectedTrainer.resumeName || 'Resume.pdf'}</p>
                        <p className="text-[9px] text-slate-400">Uploaded {selectedTrainer.resumeUploadedAt || '01 Sep 2026'}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setViewResumeModal(selectedTrainer)}
                        className="p-1 text-[#E50914] hover:bg-red-50 dark:hover:bg-red-950 rounded"
                        title="View Resume"
                      >
                        <Eye size={14} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No resume on file</p>
                )}
              </div>

              {/* Skills & Capabilities */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-extrabold uppercase text-slate-400 dark:text-zinc-500 tracking-wider">Skills & Certifications</span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedTrainer.skills?.map((sk, idx) => (
                    <span key={idx} className="px-2 py-0.5 bg-slate-100 dark:bg-zinc-800 rounded text-[10px] font-bold text-slate-700 dark:text-slate-300">
                      {sk}
                    </span>
                  ))}
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-zinc-800 text-xs">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <Mail size={12} className="text-slate-400" />
                  <span>{selectedTrainer.email}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <Phone size={12} className="text-slate-400" />
                  <span>{selectedTrainer.phone}</span>
                </div>
              </div>

            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center text-slate-400">
              <Users size={32} className="text-slate-300 dark:text-zinc-800 mb-2" />
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Select a Trainer</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Click any row in the roster to view and edit HR credentials.</p>
            </div>
          )}
        </div>

      </div>

      {/* Add Trainer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">Onboard New Trainer (HR Roster)</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">&times;</button>
            </div>

            <form onSubmit={handleCreateTrainer} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-500 font-bold block mb-1">Full Legal Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Mohammed Taha"
                  className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg p-2.5 text-slate-800 dark:text-white outline-none focus:border-[#E50914]"
                />
              </div>

              <div>
                <label className="text-slate-500 font-bold block mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="trainer@spark.com"
                  className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg p-2.5 text-slate-800 dark:text-white outline-none focus:border-[#E50914]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-500 font-bold block mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98450 12345"
                    className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg p-2.5 text-slate-800 dark:text-white outline-none focus:border-[#E50914]"
                  />
                </div>
                <div>
                  <label className="text-slate-500 font-bold block mb-1">Date of Joining *</label>
                  <input
                    type="date"
                    required
                    value={doj}
                    onChange={(e) => setDoj(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg p-2.5 text-slate-800 dark:text-white outline-none focus:border-[#E50914]"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-500 font-bold block mb-1">Skills (comma-separated)</label>
                <input
                  type="text"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  placeholder="Full Stack, Python AI, React, Cloud"
                  className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg p-2.5 text-slate-800 dark:text-white outline-none focus:border-[#E50914]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 font-bold hover:bg-slate-100 dark:hover:bg-zinc-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#E50914] text-white rounded-xl font-bold hover:bg-[#b00610] transition shadow-md"
                >
                  Complete Onboarding
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resume Viewer Modal with Real PDF Embed */}
      {viewResumeModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-3 sm:p-6 backdrop-blur-md" onClick={() => setViewResumeModal(null)}>
          <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-3xl p-5 sm:p-7 max-w-4xl w-full space-y-4 shadow-2xl max-h-[92vh] flex flex-col" onClick={e => e.stopPropagation()}>
            
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-zinc-800 pb-3 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 text-[#E50914] flex items-center justify-center font-bold">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <span>{viewResumeModal.resumeName || 'Resume.pdf'}</span>
                    <span className="text-[10px] text-slate-400 font-normal">({viewResumeModal.resumeSize || '1.4 MB'})</span>
                  </h3>
                  <p className="text-[10px] text-slate-500 font-semibold">HR Document Inspection • {viewResumeModal.name}</p>
                </div>
              </div>
              <button onClick={() => setViewResumeModal(null)} className="text-slate-400 hover:text-slate-600 font-bold text-xl px-2">&times;</button>
            </div>

            {/* Document Preview Shell */}
            <div className="flex-grow overflow-hidden rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
              {viewResumeModal.resumeUrl && (viewResumeModal.resumeUrl.startsWith('data:') || viewResumeModal.resumeUrl.startsWith('blob:')) ? (
                <iframe
                  src={viewResumeModal.resumeUrl}
                  title="Trainer Resume PDF"
                  className="w-full h-full min-h-[55vh] border-none bg-white rounded-2xl"
                />
              ) : (
                <div className="p-6 sm:p-8 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar text-xs leading-relaxed text-slate-800 dark:text-slate-200">
                  <div className="flex justify-between items-start border-b border-slate-200 dark:border-zinc-800 pb-5">
                    <div>
                      <h2 className="text-2xl font-black text-slate-900 dark:text-white">{viewResumeModal.name}</h2>
                      <p className="text-xs font-semibold text-[#E50914] mt-0.5">{viewResumeModal.individualId} • {viewResumeModal.status}</p>
                      <p className="text-slate-500 mt-1">{viewResumeModal.email} • {viewResumeModal.phone}</p>
                    </div>
                    <div className="bg-slate-100 dark:bg-zinc-800 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 text-right">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Date of Joining</span>
                      <span className="text-xs font-black text-slate-900 dark:text-white">{viewResumeModal.dateOfJoining || '15 July 2025'}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-extrabold uppercase text-[10px] text-slate-400 tracking-wider">Professional Summary</h4>
                    <p className="text-slate-700 dark:text-slate-300">
                      Senior Enterprise Technical Instructor with verified industry experience in computer science, software architecture, and technology bootcamps for higher-education and enterprise clients.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-extrabold uppercase text-[10px] text-slate-400 tracking-wider">Core Technical Expertise</h4>
                    <div className="flex flex-wrap gap-2">
                      {viewResumeModal.skills.map((s, i) => (
                        <span key={i} className="bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 px-3 py-1 rounded-lg font-bold text-[11px] text-slate-800 dark:text-slate-200">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-2 shrink-0">
              <span className="text-[10px] text-slate-400 font-semibold">Verified by Spark Enterprise HR</span>
              
              <div className="flex items-center gap-2">
                {viewResumeModal.resumeUrl && (viewResumeModal.resumeUrl.startsWith('data:') || viewResumeModal.resumeUrl.startsWith('blob:')) && (
                  <button 
                    onClick={() => {
                      const win = window.open();
                      if (win && viewResumeModal.resumeUrl) {
                        win.document.write(`<iframe src="${viewResumeModal.resumeUrl}" frameborder="0" style="width:100%;height:100vh;border:none;"></iframe>`);
                      }
                    }}
                    className="px-4 py-2 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                  >
                    Open in New Tab
                  </button>
                )}

                <button 
                  onClick={() => {
                    const fileName = viewResumeModal.resumeName || `${viewResumeModal.name.replace(/\s+/g, '_')}_Resume.pdf`;
                    if (viewResumeModal.resumeUrl && (viewResumeModal.resumeUrl.startsWith('data:') || viewResumeModal.resumeUrl.startsWith('blob:'))) {
                      const link = document.createElement('a');
                      link.href = viewResumeModal.resumeUrl;
                      link.download = fileName;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    } else {
                      const content = `RESUME: ${viewResumeModal.name}\nEmail: ${viewResumeModal.email}\nPhone: ${viewResumeModal.phone}\nDate of Joining: ${viewResumeModal.dateOfJoining || '15 July 2025'}\nSkills: ${viewResumeModal.skills.join(', ')}\n`;
                      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
                      const url = URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = `${viewResumeModal.name.replace(/\s+/g, '_')}_Resume.txt`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }
                  }}
                  className="bg-[#E50914] hover:bg-[#b00610] text-white px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-md shadow-red-600/20"
                >
                  <Download size={14} /> Download Document
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default HRDashboard;
