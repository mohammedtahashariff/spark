import React, { useState } from 'react';
import { useDatabase } from '../../context/DatabaseContext';
import { 
  Users, UserCheck, UserX, Clock, ShieldAlert, FileText, 
  AlertTriangle, Eye, Download, Search, CheckCircle, Plus, 
  Calendar, Award, Briefcase, Phone, Mail, FileCheck, Check, X,
  Bell, Upload, ExternalLink, ShieldCheck, Filter
} from 'lucide-react';
import type { Trainer, TrainerDocument } from '../../types';

interface HRDashboardProps {
  onNavigateToTrainers?: (statusFilter?: string) => void;
}

const HRDashboard: React.FC<HRDashboardProps> = ({ onNavigateToTrainers }) => {
  const { 
    trainers, attendanceRecords, addTrainer, updateTrainer, 
    updateTrainerDateOfJoining, updateTrainerDocumentStatus,
    reviewAttendance
  } = useDatabase();

  const [selectedTrainer, setSelectedTrainer] = useState<Trainer | null>(null);
  const [activeTab, setActiveTab] = useState<'roster' | 'documents' | 'missing' | 'exceptions'>('roster');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [docFilterStatus, setDocFilterStatus] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewResumeModal, setViewResumeModal] = useState<Trainer | null>(null);

  // Document review and missing doc state
  const [previewDoc, setPreviewDoc] = useState<{ trainer: Trainer; doc: TrainerDocument } | null>(null);
  const [reminderToast, setReminderToast] = useState<string | null>(null);
  const [uploadDocModalTrainer, setUploadDocModalTrainer] = useState<Trainer | null>(null);
  const [newDocCategory, setNewDocCategory] = useState<string>('Compliance');
  const [newDocName, setNewDocName] = useState<string>('Trainer Master Service Agreement');

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
          onClick={() => setActiveTab('missing')}
          className="bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800/80 rounded-xl p-3.5 shadow-sm hover:border-rose-500/40 cursor-pointer transition"
        >
          <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block truncate">Docs Missing</span>
          <p className="text-xl font-black text-rose-500 mt-1">{missingDocsTrainers.length}</p>
          <span className="text-[8px] text-slate-400 dark:text-slate-500 font-semibold">Incomplete files</span>
        </div>

      </div>

      {/* Sub-Navigation View Switcher */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-200 dark:border-zinc-800 pb-3">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('roster')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-sm ${
              activeTab === 'roster'
                ? 'bg-[#E50914] text-white'
                : 'bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Users size={14} />
            <span>Trainer Roster</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${activeTab === 'roster' ? 'bg-white/25 text-white' : 'bg-slate-100 dark:bg-zinc-800 text-slate-500'}`}>
              {trainers.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('documents')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-sm ${
              activeTab === 'documents'
                ? 'bg-purple-600 text-white'
                : 'bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-slate-300 hover:text-purple-600'
            }`}
          >
            <FileCheck size={14} />
            <span>Document Review</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${activeTab === 'documents' ? 'bg-white/25 text-white' : 'bg-purple-500/15 text-purple-600'}`}>
              {pendingDocsCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('missing')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-sm ${
              activeTab === 'missing'
                ? 'bg-rose-600 text-white'
                : 'bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-slate-300 hover:text-rose-600'
            }`}
          >
            <AlertTriangle size={14} />
            <span>Missing Documents</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${activeTab === 'missing' ? 'bg-white/25 text-white' : 'bg-rose-500/15 text-rose-600'}`}>
              {missingDocsTrainers.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('exceptions')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-sm ${
              activeTab === 'exceptions'
                ? 'bg-amber-600 text-white'
                : 'bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-slate-300 hover:text-amber-600'
            }`}
          >
            <ShieldAlert size={14} />
            <span>Attendance Exceptions</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${activeTab === 'exceptions' ? 'bg-white/25 text-white' : 'bg-amber-500/15 text-amber-600'}`}>
              {attendanceExceptions.length}
            </span>
          </button>
        </div>

        {activeTab === 'roster' && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 bg-[#E50914] hover:bg-[#b00610] text-white rounded-xl px-3.5 py-2 text-xs font-bold shadow-sm transition shrink-0"
          >
            <Plus size={14} /> Onboard Trainer
          </button>
        )}
      </div>

      {reminderToast && (
        <div className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 p-3 rounded-xl text-xs font-bold flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <Bell size={14} className="text-emerald-500 animate-bounce" />
            <span>{reminderToast}</span>
          </div>
          <button onClick={() => setReminderToast(null)} className="text-emerald-700 dark:text-emerald-400 hover:text-emerald-900">&times;</button>
        </div>
      )}

      {/* Main Roster & Trainer Detail View */}
      {activeTab === 'roster' && (
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
      )}

      {/* 4. EMBEDDED DOCUMENT REVIEW SECTION */}
      {activeTab === 'documents' && (
        <div className="bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800/80 rounded-2xl p-6 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 dark:border-zinc-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Document Review & Verification Console</h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                  Compliance Audit
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-450 mt-0.5">
                Verify onboarding contracts, NDAs, identity verification, and tax records submitted by trainers.
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-zinc-950 p-1 rounded-xl border border-slate-200 dark:border-zinc-800 text-xs font-bold">
              {['All', 'Review', 'Approved', 'Rejected'].map(st => (
                <button
                  key={st}
                  onClick={() => setDocFilterStatus(st)}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    docFilterStatus === st
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Documents Table */}
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-zinc-950 border-b border-slate-200 dark:border-zinc-800 text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[9px] font-bold">
                  <th className="p-3.5">Trainer & ID</th>
                  <th className="p-3.5">Document Details</th>
                  <th className="p-3.5">Doc Reference No.</th>
                  <th className="p-3.5">Uploaded Date</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5 text-right">Verification Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 font-semibold">
                {trainers
                  .flatMap(t => (t.documents || []).map(d => ({ trainer: t, doc: d })))
                  .filter(item => {
                    if (docFilterStatus === 'Review') return item.doc.status === 'Review' || item.doc.status === 'Draft';
                    if (docFilterStatus === 'Approved') return item.doc.status === 'Approved' || item.doc.status === 'Issued';
                    if (docFilterStatus === 'Rejected') return item.doc.status === 'Rejected';
                    return true;
                  })
                  .map(({ trainer: tr, doc: d }, idx) => (
                    <tr key={`${tr.id}-${d.documentNumber}-${idx}`} className="hover:bg-slate-50/60 dark:hover:bg-zinc-850/40 transition">
                      <td className="p-3.5">
                        <p className="font-bold text-slate-900 dark:text-white">{tr.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{tr.individualId || tr.id}</p>
                      </td>

                      <td className="p-3.5">
                        <span className="inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-slate-300 mb-0.5">
                          {d.category}
                        </span>
                        <p className="text-xs text-slate-800 dark:text-slate-200 font-bold">{d.name}</p>
                      </td>

                      <td className="p-3.5 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                        {d.documentNumber}
                      </td>

                      <td className="p-3.5 text-slate-500 text-[11px]">
                        {d.uploadedAt || '2026-08-01'}
                      </td>

                      <td className="p-3.5 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                          d.status === 'Approved' || d.status === 'Issued'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : d.status === 'Rejected'
                            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 animate-pulse'
                        }`}>
                          {d.status === 'Draft' ? 'Pending Review' : d.status}
                        </span>
                        {d.rejectionRemarks && (
                          <p className="text-[9px] text-rose-500 italic mt-0.5 max-w-[160px] mx-auto truncate" title={d.rejectionRemarks}>
                            {d.rejectionRemarks}
                          </p>
                        )}
                      </td>

                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setPreviewDoc({ trainer: tr, doc: d })}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition"
                            title="Preview Document"
                          >
                            <Eye size={13} />
                          </button>

                          {d.status !== 'Approved' && (
                            <button
                              onClick={() => {
                                updateTrainerDocumentStatus(tr.id, d.documentNumber, 'Approved');
                                setReminderToast(`Document "${d.name}" verified & approved for ${tr.name}`);
                              }}
                              className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 transition"
                              title="Approve Document"
                            >
                              <Check size={13} />
                            </button>
                          )}

                          {d.status !== 'Rejected' && (
                            <button
                              onClick={() => {
                                const remarks = window.prompt('Provide rejection or re-upload reason for this document:');
                                if (remarks !== null) {
                                  updateTrainerDocumentStatus(tr.id, d.documentNumber, 'Rejected', remarks.trim() || 'Document clarity issue / rejected.');
                                  setReminderToast(`Document "${d.name}" marked as Rejected for ${tr.name}`);
                                }
                              }}
                              className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 hover:bg-rose-100 transition"
                              title="Reject / Request Re-upload"
                            >
                              <X size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. EMBEDDED MISSING DOCUMENTS SECTION */}
      {activeTab === 'missing' && (
        <div className="bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800/80 rounded-2xl p-6 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 dark:border-zinc-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Missing Documents & Compliance Audit</h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                  {missingDocsTrainers.length} Trainers Incomplete
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-450 mt-0.5">
                Personnel files missing mandatory onboarding documentation.
              </p>
            </div>

            <button
              onClick={() => {
                setReminderToast(`Dispatched compliance reminders to ${missingDocsTrainers.length} trainers with incomplete files.`);
              }}
              className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl px-3.5 py-2 text-xs font-bold transition shadow-sm"
            >
              <Bell size={13} /> Notify All Incomplete Trainers
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {missingDocsTrainers.map(tr => {
              const hasOffer = (tr.documents || []).some(d => d.name.toLowerCase().includes('offer'));
              const hasAgreement = (tr.documents || []).some(d => d.name.toLowerCase().includes('agreement'));
              const hasId = (tr.documents || []).some(d => d.name.toLowerCase().includes('id') || d.name.toLowerCase().includes('aadhaar'));
              const hasResume = !!tr.resumeName || !!tr.resumeUrl;

              return (
                <div key={tr.id} className="bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 space-y-3.5 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">{tr.name}</h4>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">{tr.individualId || tr.id} • Joined: {tr.dateOfJoining || '2025-07-15'}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-450 mt-1">{tr.email} • {tr.phone}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-600 border border-amber-500/20">
                      {tr.status}
                    </span>
                  </div>

                  {/* Compliance Checklist */}
                  <div className="grid grid-cols-2 gap-2 text-xs font-semibold pt-2 border-t border-slate-200 dark:border-zinc-850">
                    <div className="flex items-center gap-1.5">
                      {hasOffer ? <CheckCircle size={13} className="text-emerald-500 shrink-0" /> : <X size={13} className="text-rose-500 shrink-0" />}
                      <span className={hasOffer ? 'text-slate-700 dark:text-slate-300 text-[11px]' : 'text-rose-600 dark:text-rose-400 text-[11px] font-bold'}>
                        Offer Letter
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {hasAgreement ? <CheckCircle size={13} className="text-emerald-500 shrink-0" /> : <X size={13} className="text-rose-500 shrink-0" />}
                      <span className={hasAgreement ? 'text-slate-700 dark:text-slate-300 text-[11px]' : 'text-rose-600 dark:text-rose-400 text-[11px] font-bold'}>
                        Service Agreement
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {hasId ? <CheckCircle size={13} className="text-emerald-500 shrink-0" /> : <X size={13} className="text-rose-500 shrink-0" />}
                      <span className={hasId ? 'text-slate-700 dark:text-slate-300 text-[11px]' : 'text-rose-600 dark:text-rose-400 text-[11px] font-bold'}>
                        ID Proof / Aadhaar
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {hasResume ? <CheckCircle size={13} className="text-emerald-500 shrink-0" /> : <X size={13} className="text-rose-500 shrink-0" />}
                      <span className={hasResume ? 'text-slate-700 dark:text-slate-300 text-[11px]' : 'text-rose-600 dark:text-rose-400 text-[11px] font-bold'}>
                        Resume / CV
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-zinc-850">
                    <button
                      onClick={() => setReminderToast(`Dispatched compliance upload reminder email to ${tr.email}`)}
                      className="text-[11px] font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 transition"
                    >
                      <Bell size={12} /> Send Reminder
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setUploadDocModalTrainer(tr);
                          setNewDocName('Trainer Master Service Agreement');
                          setNewDocCategory('Compliance');
                        }}
                        className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition shadow-sm"
                      >
                        <Upload size={11} /> Upload on Behalf
                      </button>

                      <button
                        onClick={() => {
                          setSelectedTrainer(tr);
                          setActiveTab('roster');
                        }}
                        className="px-2.5 py-1 bg-slate-200 dark:bg-zinc-800 hover:bg-slate-300 text-slate-700 dark:text-slate-300 rounded-lg text-[10px] font-bold transition"
                      >
                        Profile →
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 6. EMBEDDED ATTENDANCE EXCEPTIONS SECTION */}
      {activeTab === 'exceptions' && (
        <div className="bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800/80 rounded-2xl p-6 shadow-sm space-y-5">
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-zinc-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Geofence Attendance Exceptions</h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  {attendanceExceptions.length} Awaiting Verification
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-450 mt-0.5">
                Check-ins flagged outside campus geofence perimeters. Review coordinates and override or reject records.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-zinc-950 border-b border-slate-200 dark:border-zinc-800 text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[9px] font-bold">
                  <th className="p-3.5">Trainer</th>
                  <th className="p-3.5">Site Location</th>
                  <th className="p-3.5">Distance Outside Perimeter</th>
                  <th className="p-3.5">Recorded Time & Date</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 font-semibold">
                {attendanceExceptions.map(rec => (
                  <tr key={rec.id} className="hover:bg-slate-50/60 dark:hover:bg-zinc-850/40 transition">
                    <td className="p-3.5">
                      <p className="font-bold text-slate-900 dark:text-white">{rec.trainerName}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{rec.date}</p>
                    </td>

                    <td className="p-3.5 text-slate-700 dark:text-slate-300">
                      {rec.siteName}
                    </td>

                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-500/10 text-rose-600 border border-rose-500/20">
                        {rec.distanceFromSite ? `${rec.distanceFromSite.toFixed(1)}m away` : 'Out of bounds'}
                      </span>
                    </td>

                    <td className="p-3.5 text-slate-500 text-[11px] font-mono">
                      {rec.time} • {rec.date}
                    </td>

                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            reviewAttendance(rec.id, 'Corrected', 'Exception approved by HR compliance override.');
                            setReminderToast(`Check-in for ${rec.trainerName} marked as Verified (Corrected).`);
                          }}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold transition flex items-center gap-1 shadow-sm"
                        >
                          <Check size={12} /> Approve Exception
                        </button>
                        <button
                          onClick={() => {
                            const remarks = window.prompt('Rejection remarks for this check-in:');
                            if (remarks !== null) {
                              reviewAttendance(rec.id, 'Rejected', remarks.trim() || 'Check-in rejected due to unverified location.');
                              setReminderToast(`Check-in for ${rec.trainerName} rejected.`);
                            }
                          }}
                          className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-bold transition flex items-center gap-1 shadow-sm"
                        >
                          <X size={12} /> Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {attendanceExceptions.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      <CheckCircle size={28} className="text-emerald-500 mx-auto mb-1.5" />
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No Pending Attendance Exceptions</p>
                      <p className="text-[10px] text-slate-400">All trainer check-ins verified within geofence boundaries.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

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

      {/* Document Inspection / Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-md" onClick={() => setPreviewDoc(null)}>
          <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 max-w-2xl w-full space-y-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start border-b border-slate-100 dark:border-zinc-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">{previewDoc.doc.name}</h3>
                  <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-slate-300">
                    {previewDoc.doc.category}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                  Ref: {previewDoc.doc.documentNumber} • Trainer: {previewDoc.trainer.name} ({previewDoc.trainer.individualId || previewDoc.trainer.id})
                </p>
              </div>
              <button onClick={() => setPreviewDoc(null)} className="text-slate-400 hover:text-slate-600 font-bold">&times;</button>
            </div>

            {/* Document Preview Sheet */}
            <div className="p-6 bg-slate-50 dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 space-y-4 font-mono text-xs">
              <div className="flex justify-between items-center border-b border-slate-200 dark:border-zinc-800 pb-3">
                <span className="font-bold text-[#E50914]">DEVLUSTRO COMPLIANCE & LEGAL LEDGER</span>
                <span className="text-[10px] text-slate-400">{previewDoc.doc.uploadedAt || '2026-08-01'}</span>
              </div>

              <div className="space-y-2 text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed">
                <p><span className="font-bold">Issued To:</span> {previewDoc.trainer.name}</p>
                <p><span className="font-bold">Email:</span> {previewDoc.trainer.email}</p>
                <p><span className="font-bold">Document Category:</span> {previewDoc.doc.category} Verification</p>
                <p><span className="font-bold">Verification Status:</span> <span className="font-bold text-purple-600 dark:text-purple-400 uppercase">{previewDoc.doc.status}</span></p>
                {previewDoc.doc.rejectionRemarks && (
                  <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 rounded-lg border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 font-sans">
                    <span className="font-bold block text-[10px] uppercase">Rejection / Audit Remarks:</span>
                    {previewDoc.doc.rejectionRemarks}
                  </div>
                )}
                <div className="p-4 bg-white dark:bg-zinc-950 rounded-lg border border-dashed border-slate-300 dark:border-zinc-800 text-center text-slate-400 font-sans mt-3">
                  <FileCheck size={32} className="mx-auto text-emerald-500 mb-1" />
                  <p className="font-bold text-xs text-slate-700 dark:text-slate-300">Digitally Cryptographic Watermark Verified</p>
                  <p className="text-[10px] text-slate-400">DocID: {previewDoc.doc.documentNumber} • Verified by DevLustro HR Portal</p>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="px-4 py-2 rounded-xl text-slate-500 font-bold text-xs"
              >
                Close
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const remarks = window.prompt('Enter reason for document rejection / re-upload:');
                    if (remarks !== null) {
                      updateTrainerDocumentStatus(previewDoc.trainer.id, previewDoc.doc.documentNumber, 'Rejected', remarks.trim() || 'Document clarity issue.');
                      setReminderToast(`Document marked as Rejected.`);
                      setPreviewDoc(null);
                    }
                  }}
                  className="px-4 py-2 bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 hover:bg-rose-100 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                >
                  <X size={14} /> Reject Document
                </button>
                <button
                  type="button"
                  onClick={() => {
                    updateTrainerDocumentStatus(previewDoc.trainer.id, previewDoc.doc.documentNumber, 'Approved');
                    setReminderToast(`Document verified & approved.`);
                    setPreviewDoc(null);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                >
                  <Check size={14} /> Approve Document
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Document on Behalf Modal */}
      {uploadDocModalTrainer && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-zinc-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Upload size={16} className="text-purple-600" />
                  <span>Upload Document on Behalf</span>
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Attaching file for {uploadDocModalTrainer.name} ({uploadDocModalTrainer.individualId || uploadDocModalTrainer.id})</p>
              </div>
              <button onClick={() => setUploadDocModalTrainer(null)} className="text-slate-400 hover:text-slate-600 font-bold">&times;</button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!uploadDocModalTrainer || !newDocName.trim()) return;

                const docNum = `DLT-${newDocCategory.slice(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
                const newDoc: TrainerDocument = {
                  category: newDocCategory,
                  name: newDocName.trim(),
                  documentNumber: docNum,
                  status: 'Approved',
                  uploadedAt: new Date().toISOString().split('T')[0]
                };

                updateTrainer({
                  ...uploadDocModalTrainer,
                  documents: [...(uploadDocModalTrainer.documents || []), newDoc]
                });

                setUploadDocModalTrainer(null);
                setReminderToast(`Document "${newDocName}" registered for ${uploadDocModalTrainer.name}`);
              }}
              className="space-y-3.5 text-xs"
            >
              <div className="space-y-1">
                <label className="text-slate-500 font-bold">Document Category</label>
                <select
                  value={newDocCategory}
                  onChange={(e) => setNewDocCategory(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 text-slate-900 dark:text-white outline-none focus:border-[#E50914]"
                >
                  <option value="Compliance">Compliance & Agreements</option>
                  <option value="Identity">Identity Verification / Aadhaar</option>
                  <option value="Onboarding">Onboarding / Offer Letter</option>
                  <option value="Finance">Finance / PAN / Bank Mandate</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 font-bold">Document Title / Name *</label>
                <input
                  type="text"
                  required
                  value={newDocName}
                  onChange={(e) => setNewDocName(e.target.value)}
                  placeholder="e.g. Master Service Agreement, Aadhaar Card, Offer Letter..."
                  className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 text-slate-900 dark:text-white outline-none focus:border-[#E50914]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 font-bold">File Attachment (PDF / Image)</label>
                <div className="border border-dashed border-slate-300 dark:border-zinc-800 rounded-xl p-3 text-center bg-slate-50 dark:bg-zinc-900 text-slate-400">
                  <FileText size={20} className="mx-auto mb-1 text-slate-500" />
                  <span className="text-[10px] block font-bold">Document Verified & Ready to Attach</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setUploadDocModalTrainer(null)}
                  className="px-4 py-2 rounded-xl text-slate-500 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold transition shadow-md flex items-center gap-1.5"
                >
                  <Upload size={14} /> Upload & Verify
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default HRDashboard;
