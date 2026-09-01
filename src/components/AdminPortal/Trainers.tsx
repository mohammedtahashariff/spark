import React, { useState } from 'react';
import { useDatabase } from '../../context/DatabaseContext';
import { Plus, Search, UserCheck, X } from 'lucide-react';
import type { Trainer } from '../../types';


const Trainers: React.FC = () => {
  const { trainers, addTrainer, updateTrainer } = useDatabase();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTrainer, setSelectedTrainer] = useState<Trainer | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State for Adding
  const [individualId, setIndividualId] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
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

    // If all documents are approved, auto-move trainer status to Active
    const allApproved = updatedDocs.every(d => d.status === 'Approved');
    const newTrainerStatus = allApproved ? 'Active' as const : trainer.status;

    updateTrainer({
      ...trainer,
      status: newTrainerStatus,
      documents: updatedDocs
    });

    // Sync selectedTrainer state if open
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

  const filteredTrainers = trainers.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.skills.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-5 text-slate-700 dark:text-slate-350 relative h-full flex flex-col transition-colors duration-200">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white tracking-wide font-sans">Trainer Profiles (HR Portal)</h2>
          <p className="text-xs text-slate-500 dark:text-slate-450 mt-0.5 font-medium">Manage trainer roster, document verification, and billing rates.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-rose-600 hover:bg-rose-750 text-white rounded-xl px-4 py-2 text-xs font-bold transition flex items-center gap-1.5 shadow"
        >
          <Plus size={16} /> Onboard Trainer
        </button>
      </div>

      {/* Roster & Details panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 flex-1 min-h-0">
        
        {/* Left Column: Trainer List */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800/80 rounded-2xl p-4 flex flex-col min-h-[300px] shadow-sm">
          
          {/* Search bar */}
          <div className="relative mb-4">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-555" />
            <input
              type="text"
              placeholder="Search by name, email, or skill..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 dark:text-white outline-none focus:border-rose-500 dark:focus:border-rose-600 transition"
            />
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto space-y-2.5 custom-scrollbar pr-1">
            {filteredTrainers.map(t => (
              <div
                key={t.id}
                onClick={() => setSelectedTrainer(t)}
                className={`border p-4 rounded-xl cursor-pointer transition flex justify-between items-center ${
                  selectedTrainer?.id === t.id
                    ? 'bg-rose-50/40 dark:bg-rose-950/10 border-rose-500 dark:border-rose-500/50 text-rose-600 dark:text-rose-455 shadow-sm'
                    : 'bg-slate-50/50 dark:bg-zinc-900/40 border-slate-150 dark:border-zinc-800 hover:border-slate-350 dark:hover:border-zinc-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className={`font-bold text-sm ${selectedTrainer?.id === t.id ? 'text-rose-600 dark:text-rose-455' : 'text-slate-800 dark:text-slate-200'}`}>{t.name}</h4>
                    <span className="font-mono text-[9px] font-black px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                      {t.individualId || t.id}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{t.email} • {t.phone}</p>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {t.skills.slice(0, 3).map((s, idx) => (
                      <span key={idx} className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-850 px-2 py-0.5 rounded text-[9px] font-bold text-slate-500 dark:text-slate-400">{s}</span>
                    ))}
                    {t.skills.length > 3 && (
                      <span className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-850 px-2 py-0.5 rounded text-[9px] font-bold text-slate-400 dark:text-slate-500">+{t.skills.length - 3}</span>
                    )}
                  </div>
                </div>
                
                <div className="text-right space-y-1.5 shrink-0">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    t.status === 'Active' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' :
                    t.status === 'Onboarding' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20' :
                    'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                  }`}>
                    {t.status}
                  </span>
                  <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    {t.rate > 0 ? 'Hourly Contract' : 'Fixed Retainer'}
                  </p>
                </div>
              </div>
            ))}
            {filteredTrainers.length === 0 && (
              <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-12 font-medium">No trainers found matching filter.</p>
            )}
          </div>
        </div>

        {/* Right Column: Digital Trainer File & Settings */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800/80 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          {selectedTrainer ? (
            <div className="space-y-5 h-full flex flex-col justify-between">
              
              <div className="space-y-4">
                {/* Trainer Header */}
                <div className="flex justify-between items-start border-b border-slate-100 dark:border-zinc-800 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-md font-bold text-slate-800 dark:text-white leading-tight">{selectedTrainer.name}</h3>
                      <span className="font-mono text-[9px] font-black px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-rose-600 dark:text-rose-400 border border-slate-200 dark:border-zinc-700">
                        {selectedTrainer.individualId || selectedTrainer.id}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 font-semibold">Status Checklist</p>
                  </div>
                  <select
                    value={selectedTrainer.status}
                    onChange={(e) => handleUpdateTrainerStatus(selectedTrainer.id, e.target.value as any)}
                    className="bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-xs font-bold text-slate-850 dark:text-white rounded-lg p-1 px-2 focus:ring-1 focus:ring-rose-500 outline-none"
                  >
                    <option value="Onboarding">Onboarding</option>
                    <option value="Active">Active</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </div>

                {/* Trainer Details */}
                <div className="bg-slate-50 dark:bg-zinc-950 border border-slate-150 dark:border-zinc-850/80 rounded-xl p-3.5 space-y-2 text-xs font-medium">
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Trainer Individual ID</span>
                    <span className="font-mono font-bold text-rose-600 dark:text-rose-400">{selectedTrainer.individualId || selectedTrainer.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Contact Email</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{selectedTrainer.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Contact Phone</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{selectedTrainer.phone}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 dark:border-zinc-800 pt-2 mt-1">
                    <span className="text-slate-500 dark:text-slate-400">Contract Engagement</span>
                    <span className="font-bold text-rose-600 dark:text-rose-400">{selectedTrainer.rate > 0 ? 'Hourly Billing Contract' : 'Fixed Retainer Contract'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Compliance & TDS</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">TDS Applicable</span>
                  </div>
                </div>

                {/* Onboarding Documents Folder */}
                <div className="space-y-2.5">
                  <h4 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Trainer Document Ledger</h4>
                  <div className="space-y-2 max-h-[220px] overflow-y-auto custom-scrollbar pr-1">
                    {selectedTrainer.documents.map((doc, idx) => (
                      <div key={idx} className="bg-slate-50 dark:bg-zinc-950 border border-slate-150 dark:border-zinc-850/80 rounded-xl p-3 flex justify-between items-center shadow-sm">
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{doc.name}</p>
                          <p className="text-[9px] text-slate-400 dark:text-slate-500 font-semibold truncate mt-0.5">ID: {doc.documentNumber}</p>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <select
                            value={doc.status}
                            onChange={(e) => handleUpdateDocumentStatus(selectedTrainer.id, doc.name, e.target.value as any)}
                            className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-[10px] font-bold text-slate-750 dark:text-white rounded p-1 outline-none"
                          >
                            <option value="Pending">Pending</option>
                            <option value="Submitted">Submitted</option>
                            <option value="Verified">Verified</option>
                            <option value="Rejected">Rejected</option>
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 flex gap-2">
                <button
                  onClick={() => handleUpdateTrainerStatus(selectedTrainer.id, 'Active')}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-2.5 font-bold text-xs transition shadow-sm"
                >
                  Approve Clearance
                </button>
                <button
                  onClick={() => handleUpdateTrainerStatus(selectedTrainer.id, 'Suspended')}
                  className="bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400 text-slate-600 dark:text-slate-350 rounded-xl px-4 py-2.5 font-bold text-xs transition"
                >
                  Lock
                </button>
              </div>

            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 dark:text-slate-500">
              <UserCheck size={36} className="text-slate-300 dark:text-zinc-800 mb-2" />
              <p className="text-xs font-bold text-slate-800 dark:text-white">No Trainer Selected</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 max-w-[170px] mt-0.5 font-medium">Select a trainer profile on the left to review documents & details.</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Trainer Modal */}
      {showAddModal && (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800 rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-zinc-800 pb-2">
              <h3 className="text-md font-bold text-slate-800 dark:text-white">Onboard New Trainer</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddTrainer} className="space-y-4 text-xs text-slate-700 dark:text-slate-300">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-500 dark:text-slate-400 font-semibold">Trainer Individual ID</label>
                  <input
                    type="text"
                    value={individualId}
                    onChange={(e) => setIndividualId(e.target.value)}
                    placeholder={`e.g. TRN-2026-${String(trainers.length + 1).padStart(3, '0')}`}
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg p-2.5 text-slate-800 dark:text-white outline-none focus:border-rose-500 font-mono font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 dark:text-slate-400 font-semibold">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. David Miller"
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg p-2.5 text-slate-800 dark:text-white outline-none focus:border-rose-500 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-500 dark:text-slate-400 font-semibold">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="david@spark.com"
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg p-2.5 text-slate-800 dark:text-white outline-none focus:border-rose-500 font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 dark:text-slate-400 font-semibold">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 XXXXX"
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg p-2.5 text-slate-800 dark:text-white outline-none focus:border-rose-500 font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 dark:text-slate-400 font-semibold">Status</label>
                <input
                  type="text"
                  disabled
                  value="Onboarding (Pending Checklist)"
                  className="w-full bg-slate-100 dark:bg-zinc-850 border border-slate-200 dark:border-zinc-800 rounded-lg p-2.5 text-slate-500 dark:text-slate-400 outline-none font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 dark:text-slate-400 font-semibold">Contract Type</label>
                <select
                  value={rate ? 'hourly' : 'fixed'}
                  onChange={(e) => {
                    if (e.target.value === 'hourly') {
                      setRate('500');
                      setFixedSalary('0');
                    } else {
                      setRate('0');
                      setFixedSalary('80000');
                    }
                  }}
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg p-2.5 text-slate-800 dark:text-white outline-none focus:border-rose-500 font-medium text-xs"
                >
                  <option value="hourly">Hourly Engagement Contract</option>
                  <option value="fixed">Fixed Retainer Monthly Contract</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 dark:text-slate-400 font-semibold">Expertise Skills (comma separated)</label>
                <input
                  type="text"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  placeholder="React, NodeJS, PostgreSQL"
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg p-2.5 text-slate-800 dark:text-white outline-none focus:border-rose-500 font-medium"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-rose-600 hover:bg-rose-700 text-white rounded-xl py-3 font-bold transition shadow-md shadow-rose-900/10"
              >
                Initiate Onboarding
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Trainers;
