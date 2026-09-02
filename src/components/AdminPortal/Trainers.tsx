import React, { useState } from 'react';
import { useDatabase } from '../../context/DatabaseContext';
import { 
  Plus, Search, UserCheck, X, FileText, Download, 
  Calendar, Eye, Phone, Mail, Award, CheckCircle, ShieldCheck
} from 'lucide-react';
import type { Trainer } from '../../types';

const Trainers: React.FC = () => {
  const { trainers, addTrainer, updateTrainer, updateTrainerDOJ } = useDatabase();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Onboarding' | 'Suspended'>('All');
  const [selectedTrainer, setSelectedTrainer] = useState<Trainer | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [resumeModalDoc, setResumeModalDoc] = useState<Trainer | null>(null);

  // Form State for Adding
  const [individualId, setIndividualId] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dateOfJoining, setDateOfJoining] = useState('15 July 2025');
  const [rate, setRate] = useState('');
  const [fixedSalary, setFixedSalary] = useState('');
  const [skills, setSkills] = useState('');

  const handleAddTrainer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !phone) return;

    const nextId = individualId.trim() || `TRN-2026-${String(trainers.length + 1).padStart(3, '0')}`;

    addTrainer({
      individualId: nextId,
      name,
      email,
      phone,
      dateOfJoining: dateOfJoining || '15 July 2025',
      resumeUrl: '/resumes/resume.pdf',
      resumeName: `${name.replace(/\s+/g, '_')}_Resume.pdf`,
      resumeUploadedAt: new Date().toISOString().split('T')[0],
      resumeSize: '1.2 MB',
      status: 'Onboarding',
      rate: Number(rate) || 0,
      fixedSalary: Number(fixedSalary) || 0,
      skills: skills.split(',').map(s => s.trim()).filter(Boolean),
      documents: [
        { category: 'Onboarding', name: 'Offer Letter', status: 'Draft', documentNumber: `DLT-OFF-${Date.now().toString().slice(-4)}`, uploadedAt: new Date().toISOString().split('T')[0] },
        { category: 'Onboarding', name: 'Trainer Agreement', status: 'Draft', documentNumber: `DLT-AGR-${Date.now().toString().slice(-4)}`, uploadedAt: new Date().toISOString().split('T')[0] },
        { category: 'Identity & profile', name: 'ID Proof', status: 'Draft', documentNumber: `DLT-ID-${Date.now().toString().slice(-4)}`, uploadedAt: new Date().toISOString().split('T')[0] }
      ]
    });

    // Reset fields
    setIndividualId('');
    setName('');
    setEmail('');
    setPhone('');
    setDateOfJoining('15 July 2025');
    setRate('');
    setFixedSalary('');
    setSkills('');
    setShowAddModal(false);
  };

  const handleUpdateDocumentStatus = (trainerId: string, docNum: string, newStatus: 'Draft' | 'Review' | 'Approved') => {
    const trainer = trainers.find(t => t.id === trainerId);
    if (!trainer) return;

    const updatedDocs = trainer.documents.map(doc => 
      doc.documentNumber === docNum ? { ...doc, status: newStatus } : doc
    );

    const allApproved = updatedDocs.every(d => d.status === 'Approved');
    const newTrainerStatus = allApproved ? 'Active' as const : trainer.status;

    updateTrainer({
      ...trainer,
      status: newTrainerStatus,
      documents: updatedDocs
    });

    if (selectedTrainer && selectedTrainer.id === trainerId) {
      setSelectedTrainer({
        ...selectedTrainer,
        status: newTrainerStatus,
        documents: updatedDocs
      });
    }
  };

  const handleUpdateTrainerStatus = (trainerId: string, newStatus: 'Active' | 'Onboarding' | 'Suspended') => {
    const trainer = trainers.find(t => t.id === trainerId);
    if (!trainer) return;

    updateTrainer({
      ...trainer,
      status: newStatus
    });

    if (selectedTrainer && selectedTrainer.id === trainerId) {
      setSelectedTrainer({
        ...selectedTrainer,
        status: newStatus
      });
    }
  };

  const filteredTrainers = trainers.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.skills.some(s => s.toLowerCase().includes(searchTerm.toLowerCase())) ||
      t.individualId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 text-slate-700 dark:text-slate-350 flex flex-col h-full relative transition-colors duration-200">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-wide">Trainer Directory & Compliance Vault</h2>
          <p className="text-xs text-slate-500 dark:text-slate-450 mt-1 font-medium">
            Manage trainer onboarding lifecycle, verify credentials, update date of joining, and inspect verified resumes.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="bg-[#E50914] hover:bg-[#b00610] text-white rounded-xl px-4 py-2.5 text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-red-600/20 shrink-0"
        >
          <Plus size={16} /> + Onboard Trainer
        </button>
      </div>

      {/* Search & Status Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, skill, or ID..."
            className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl py-2 pl-9 pr-3 text-xs outline-none focus:border-[#E50914] text-slate-900 dark:text-white font-semibold"
          />
          <Search size={14} className="text-slate-400 absolute top-3 left-3" />
        </div>

        {/* Filter pills */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-zinc-950 p-1 rounded-xl border border-slate-200 dark:border-zinc-800 text-xs font-bold">
          {(['All', 'Active', 'Onboarding', 'Suspended'] as const).map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg transition ${
                statusFilter === st 
                  ? 'bg-[#E50914] text-white shadow-sm' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {st} ({st === 'All' ? trainers.length : trainers.filter(t => t.status === st).length})
            </button>
          ))}
        </div>
      </div>

      {/* Main Trainers Table */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm flex flex-col flex-grow">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-zinc-950 border-b border-slate-200 dark:border-zinc-800 text-slate-500 uppercase tracking-wider text-[9px] font-bold">
                <th className="p-4">Trainer & ID</th>
                <th className="p-4">Date of Joining</th>
                <th className="p-4">Skills & Domains</th>
                <th className="p-4">Resume</th>
                <th className="p-4">Commercials</th>
                <th className="p-4 text-center">Lifecycle Status</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 font-semibold">
              {filteredTrainers.map(t => (
                <tr 
                  key={t.id} 
                  onClick={() => setSelectedTrainer(t)}
                  className="hover:bg-slate-50/60 dark:hover:bg-zinc-850/40 transition cursor-pointer"
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 flex items-center justify-center font-bold text-slate-700 dark:text-slate-300">
                        {t.name[0]}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{t.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{t.individualId}</p>
                      </div>
                    </div>
                  </td>

                  {/* Date of Joining (Requirement 7) */}
                  <td className="p-4">
                    <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                      <Calendar size={13} className="text-[#E50914] shrink-0" />
                      <span>{t.dateOfJoining || '15 July 2025'}</span>
                    </div>
                  </td>

                  {/* Skills */}
                  <td className="p-4">
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {t.skills.slice(0, 3).map((s, idx) => (
                        <span key={idx} className="bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded text-[9px] font-bold">
                          {s}
                        </span>
                      ))}
                      {t.skills.length > 3 && (
                        <span className="text-[9px] text-slate-400">+{t.skills.length - 3}</span>
                      )}
                    </div>
                  </td>

                  {/* Resume (Requirement 6) */}
                  <td className="p-4">
                    <button
                      onClick={(e) => { e.stopPropagation(); setResumeModalDoc(t); }}
                      className="flex items-center gap-1.5 px-2.5 py-1 bg-red-500/10 text-[#E50914] hover:bg-red-500/20 border border-[#E50914]/20 rounded-lg text-[10px] font-bold transition"
                    >
                      <FileText size={12} />
                      <span className="truncate max-w-[100px]">{t.resumeName || 'Resume.pdf'}</span>
                    </button>
                  </td>

                  {/* Commercials */}
                  <td className="p-4 font-mono font-bold text-slate-800 dark:text-slate-200">
                    {t.rate > 0 ? `₹${t.rate}/hr` : `₹${t.fixedSalary.toLocaleString()}/mo`}
                  </td>

                  {/* Status */}
                  <td className="p-4 text-center">
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                      t.status === 'Active' 
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' :
                      t.status === 'Onboarding' 
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20' :
                        'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                    }`}>
                      {t.status}
                    </span>
                  </td>

                  {/* Action */}
                  <td className="p-4 text-right">
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelectedTrainer(t); }}
                      className="px-3 py-1 bg-slate-50 dark:bg-zinc-800 hover:bg-[#E50914] hover:text-white border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-slate-300 rounded-lg text-[10px] font-bold transition"
                    >
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredTrainers.length === 0 && (
          <p className="text-xs text-slate-400 text-center py-16 font-medium">No trainers match the selected filter.</p>
        )}
      </div>

      {/* TRAINER MANAGEMENT DRAWER */}
      {selectedTrainer && (
        <div className="fixed inset-0 bg-black/70 z-50 flex justify-end backdrop-blur-sm" onClick={() => setSelectedTrainer(null)}>
          <div className="w-full max-w-lg bg-white dark:bg-zinc-950 border-l border-slate-200 dark:border-zinc-800 h-full p-6 overflow-y-auto custom-scrollbar space-y-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-zinc-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">{selectedTrainer.name}</h3>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">{selectedTrainer.individualId}</p>
              </div>
              <button onClick={() => setSelectedTrainer(null)} className="text-slate-400 hover:text-slate-600 font-bold text-lg">&times;</button>
            </div>

            {/* Lifecycle Status & Date of Joining Editor */}
            <div className="bg-slate-50 dark:bg-zinc-900 p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 space-y-3 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-bold">Status:</span>
                <div className="flex gap-1.5">
                  {(['Active', 'Onboarding', 'Suspended'] as const).map(st => (
                    <button
                      key={st}
                      onClick={() => handleUpdateTrainerStatus(selectedTrainer.id, st)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition ${
                        selectedTrainer.status === st 
                          ? 'bg-[#E50914] text-white shadow-sm' 
                          : 'bg-white dark:bg-zinc-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Edit Date of Joining (Admin / HR) */}
              <div className="space-y-1 pt-2 border-t border-slate-200 dark:border-zinc-800">
                <label className="font-bold text-slate-700 dark:text-slate-300 text-[11px]">Date of Joining (HR Master Field)</label>
                <input
                  type="text"
                  value={selectedTrainer.dateOfJoining || '15 July 2025'}
                  onChange={(e) => {
                    updateTrainerDOJ(selectedTrainer.id, e.target.value);
                    setSelectedTrainer({ ...selectedTrainer, dateOfJoining: e.target.value });
                  }}
                  className="w-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg p-2 font-semibold text-slate-900 dark:text-white outline-none focus:border-[#E50914]"
                />
              </div>
            </div>

            {/* Resume Section */}
            <div className="bg-slate-50 dark:bg-zinc-900 p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Verified Resume</span>
                <span className="text-[10px] text-slate-400">{selectedTrainer.resumeSize || '1.4 MB'}</span>
              </div>
              <div className="flex justify-between items-center bg-white dark:bg-zinc-950 p-3 rounded-xl border border-slate-200 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-[#E50914]" />
                  <span className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[180px]">{selectedTrainer.resumeName || 'Resume.pdf'}</span>
                </div>
                <button
                  onClick={() => setResumeModalDoc(selectedTrainer)}
                  className="px-3 py-1 bg-[#E50914] text-white rounded-lg text-xs font-bold hover:bg-[#b00610] transition shadow-sm"
                >
                  View Preview
                </button>
              </div>
            </div>

            {/* Compliance Documents */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Compliance Documents</h4>
              <div className="space-y-2">
                {selectedTrainer.documents.map(doc => (
                  <div key={doc.documentNumber} className="bg-slate-50 dark:bg-zinc-900 p-3 rounded-xl border border-slate-200 dark:border-zinc-800 flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{doc.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{doc.documentNumber}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <select
                        value={doc.status}
                        onChange={(e) => handleUpdateDocumentStatus(selectedTrainer.id, doc.documentNumber, e.target.value as any)}
                        className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-2 py-1 text-[10px] font-bold outline-none"
                      >
                        <option value="Draft">Draft</option>
                        <option value="Review">Review</option>
                        <option value="Approved">Approved</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Add Trainer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-zinc-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Onboard New Trainer</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">&times;</button>
            </div>

            <form onSubmit={handleAddTrainer} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Full Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Mohammed Taha"
                  className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 font-semibold text-slate-800 dark:text-white outline-none focus:border-[#E50914]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="taha@spark.com"
                    className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 font-semibold text-slate-800 dark:text-white outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Phone *</label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 font-semibold text-slate-800 dark:text-white outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Date of Joining</label>
                  <input
                    type="text"
                    value={dateOfJoining}
                    onChange={(e) => setDateOfJoining(e.target.value)}
                    placeholder="15 July 2025"
                    className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 font-semibold text-slate-800 dark:text-white outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Hourly Rate (₹)</label>
                  <input
                    type="number"
                    value={rate}
                    onChange={(e) => setRate(e.target.value)}
                    placeholder="1500"
                    className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 font-mono font-bold text-slate-800 dark:text-white outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Skills / Domains (comma separated)</label>
                <input
                  type="text"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  placeholder="React, Node.js, Python, TypeScript"
                  className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 font-semibold text-slate-800 dark:text-white outline-none"
                />
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
                  className="px-5 py-2.5 bg-[#E50914] text-white rounded-xl font-bold hover:bg-[#b00610] shadow"
                >
                  Create Trainer Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resume Viewer Modal with Real PDF Embed */}
      {resumeModalDoc && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-3 sm:p-6 backdrop-blur-md" onClick={() => setResumeModalDoc(null)}>
          <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-3xl p-5 sm:p-7 max-w-4xl w-full space-y-4 shadow-2xl max-h-[92vh] flex flex-col" onClick={e => e.stopPropagation()}>
            
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-zinc-800 pb-3 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 text-[#E50914] flex items-center justify-center font-bold">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>{resumeModalDoc.resumeName || 'Resume.pdf'}</span>
                    <span className="text-[10px] text-slate-400 font-normal">({resumeModalDoc.resumeSize || '1.4 MB'})</span>
                  </h3>
                  <p className="text-[10px] text-slate-500 font-semibold">Trainer Credentials Inspection • {resumeModalDoc.name}</p>
                </div>
              </div>
              <button onClick={() => setResumeModalDoc(null)} className="text-slate-400 hover:text-slate-600 font-bold text-xl px-2">&times;</button>
            </div>

            {/* Document Preview Shell */}
            <div className="flex-grow overflow-hidden rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
              {resumeModalDoc.resumeUrl && (resumeModalDoc.resumeUrl.startsWith('data:') || resumeModalDoc.resumeUrl.startsWith('blob:')) ? (
                <iframe
                  src={resumeModalDoc.resumeUrl}
                  title="Trainer Resume PDF"
                  className="w-full h-full min-h-[55vh] border-none bg-white rounded-2xl"
                />
              ) : (
                <div className="p-6 sm:p-8 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar text-xs leading-relaxed text-slate-800 dark:text-slate-200">
                  <div className="flex justify-between items-start border-b border-slate-200 dark:border-zinc-800 pb-5">
                    <div>
                      <h2 className="text-2xl font-black text-slate-900 dark:text-white">{resumeModalDoc.name}</h2>
                      <p className="text-xs font-semibold text-[#E50914] mt-0.5">{resumeModalDoc.individualId} • {resumeModalDoc.status}</p>
                      <p className="text-slate-500 mt-1">{resumeModalDoc.email} • {resumeModalDoc.phone}</p>
                    </div>
                    <div className="bg-slate-100 dark:bg-zinc-800 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 text-right">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Date of Joining</span>
                      <span className="text-xs font-black text-slate-900 dark:text-white">{resumeModalDoc.dateOfJoining || '15 July 2025'}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-extrabold uppercase text-[10px] text-slate-400 tracking-wider">Executive Summary</h4>
                    <p className="text-slate-700 dark:text-slate-300">
                      Senior Enterprise Technical Instructor with verified industry credentials in full-stack architecture, machine learning models, and enterprise software engineering.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-extrabold uppercase text-[10px] text-slate-400 tracking-wider">Core Technical Competencies</h4>
                    <div className="flex flex-wrap gap-2">
                      {resumeModalDoc.skills.map((s, i) => (
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
                {resumeModalDoc.resumeUrl && (resumeModalDoc.resumeUrl.startsWith('data:') || resumeModalDoc.resumeUrl.startsWith('blob:')) && (
                  <button 
                    onClick={() => {
                      const win = window.open();
                      if (win && resumeModalDoc.resumeUrl) {
                        win.document.write(`<iframe src="${resumeModalDoc.resumeUrl}" frameborder="0" style="width:100%;height:100vh;border:none;"></iframe>`);
                      }
                    }}
                    className="px-4 py-2 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                  >
                    Open in New Tab
                  </button>
                )}

                <button 
                  onClick={() => {
                    const fileName = resumeModalDoc.resumeName || `${resumeModalDoc.name.replace(/\s+/g, '_')}_Resume.pdf`;
                    if (resumeModalDoc.resumeUrl && (resumeModalDoc.resumeUrl.startsWith('data:') || resumeModalDoc.resumeUrl.startsWith('blob:'))) {
                      const link = document.createElement('a');
                      link.href = resumeModalDoc.resumeUrl;
                      link.download = fileName;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    } else {
                      const content = `RESUME: ${resumeModalDoc.name}\nEmail: ${resumeModalDoc.email}\nPhone: ${resumeModalDoc.phone}\nDate of Joining: ${resumeModalDoc.dateOfJoining || '15 July 2025'}\nSkills: ${resumeModalDoc.skills.join(', ')}\n`;
                      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
                      const url = URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = `${resumeModalDoc.name.replace(/\s+/g, '_')}_Resume.txt`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }
                  }}
                  className="bg-[#E50914] hover:bg-[#b00610] text-white px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-md shadow-red-600/20"
                >
                  <Download size={14} /> DOWNLOAD RESUME
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default Trainers;
