import React, { useState } from 'react';
import { useDatabase } from '../../context/DatabaseContext';
import { Plus, MapPin, X } from 'lucide-react';


const MobileExpenses: React.FC = () => {
  const { currentUser, expenses, sites, trainers, submitExpenseClaim } = useDatabase();
  const [showAdd, setShowAdd] = useState(false);

  const trainer = trainers.find(t => t.email === currentUser?.email) || trainers[0];
  const trainerExpenses = expenses.filter(e => e.trainerId === trainer.id);

  // Form State
  const [siteId, setSiteId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState<'Travel' | 'Food' | 'Accommodation' | 'Local Transport' | 'Other'>('Travel');
  const [amount, setAmount] = useState('');
  const [purpose, setPurpose] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!siteId || !amount || !purpose.trim()) {
      setErrorMsg('All fields are required.');
      return;
    }

    const selectedSite = sites.find(s => s.id === siteId);
    if (!selectedSite) return;

    submitExpenseClaim({
      date,
      category,
      amount: Number(amount),
      purpose: purpose.trim(),
      siteId,
      siteName: selectedSite.name
    });

    setSiteId('');
    setAmount('');
    setPurpose('');
    setErrorMsg('');
    setShowAdd(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Approved':
        return <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Approved</span>;
      case 'Rejected':
        return <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">Rejected</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">Pending</span>;
    }
  };

  return (
    <div className="space-y-4 pb-8 text-white relative h-full flex flex-col justify-between">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-md font-bold tracking-wide">Expense Claims</h2>
          <button
            onClick={() => setShowAdd(true)}
            className="bg-rose-600 hover:bg-rose-700 text-white rounded-lg px-2.5 py-1.5 text-xs font-bold transition flex items-center gap-1 shadow shadow-rose-900/10"
          >
            <Plus size={14} /> New Claim
          </button>
        </div>

        {/* Expenses List */}
        <div className="space-y-2.5 overflow-y-auto max-h-[480px] custom-scrollbar pr-1">
          {trainerExpenses.map(exp => (
            <div key={exp.id} className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex justify-between items-center text-xs">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-200">{exp.category}</span>
                  <span className="text-[10px] text-slate-500">• {exp.date}</span>
                </div>
                <p className="text-[10px] text-slate-400 truncate max-w-[200px]" title={exp.purpose}>"{exp.purpose}"</p>
                <div className="flex items-center gap-1 text-[9px] text-slate-500">
                  <MapPin size={10} />
                  <span className="truncate max-w-[150px]">{exp.siteName}</span>
                </div>
              </div>
              <div className="text-right space-y-1 shrink-0">
                <p className="font-black text-rose-400">₹{exp.amount}</p>
                {getStatusBadge(exp.status)}
              </div>
            </div>
          ))}
          {trainerExpenses.length === 0 && (
            <p className="text-xs text-slate-550 text-center py-12">No expense claims filed yet.</p>
          )}
        </div>
      </div>

      {/* Add Claim modal overlay */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 w-full max-w-sm space-y-4 shadow-2xl">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-white">Create Expense Claim</h3>
              <button onClick={() => setShowAdd(false)} className="text-slate-400 hover:text-white"><X size={16} /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs text-slate-300">
              {errorMsg && (
                <div className="bg-rose-500/15 border border-rose-500/30 text-rose-455 p-2 rounded-lg font-medium">
                  {errorMsg}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Training Location</label>
                <select
                  required
                  value={siteId}
                  onChange={(e) => setSiteId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white outline-none focus:border-rose-600 font-semibold"
                >
                  <option value="">Select Location</option>
                  {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Expense Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white outline-none focus:border-rose-600 font-semibold"
                  >
                    <option value="Travel">Travel</option>
                    <option value="Food">Food</option>
                    <option value="Accommodation">Accommodation</option>
                    <option value="Local Transport">Local Transport</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Amount Claimed (₹)</label>
                  <input
                    type="number"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="1500"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white outline-none focus:border-rose-600 font-semibold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Claim Date</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white outline-none focus:border-rose-600 font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Purpose / Details *</label>
                <textarea
                  required
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="e.g. Flight tickets to training site..."
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white outline-none focus:border-rose-600 resize-none font-semibold"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-rose-600 hover:bg-rose-700 text-white rounded-xl py-2.5 font-bold transition shadow-lg shadow-rose-900/10"
              >
                Submit Expense Claim
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileExpenses;
