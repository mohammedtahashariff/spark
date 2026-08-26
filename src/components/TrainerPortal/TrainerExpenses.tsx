import React, { useState } from 'react';
import { useDatabase } from '../../context/DatabaseContext';
import { Plus, X } from 'lucide-react';


const TrainerExpenses: React.FC = () => {
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
        return <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-455 border border-emerald-500/20">Approved</span>;
      case 'Rejected':
        return <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-rose-500/10 text-rose-455 border border-rose-500/20">Rejected</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-455 border border-amber-500/20 animate-pulse">Pending Review</span>;
    }
  };

  return (
    <div className="space-y-6 text-slate-700 dark:text-slate-350 flex flex-col h-full relative transition-colors duration-200">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white tracking-wide">Expense Reimbursement Claims</h2>
          <p className="text-xs text-slate-500 dark:text-slate-455 mt-0.5 font-medium">Submit corporate expenses incurred during class commutes, client trips, and hospitality.</p>
        </div>

        <button
          onClick={() => { setErrorMsg(''); setShowAdd(true); }}
          className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl px-4 py-2 text-xs font-bold transition flex items-center gap-1.5 shadow"
        >
          <Plus size={16} /> File New Claim
        </button>
      </div>

      {/* Main Ledger Table */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800/80 rounded-2xl overflow-hidden shadow-sm flex-grow overflow-y-auto custom-scrollbar">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-zinc-950 border-b border-slate-150 dark:border-zinc-800 text-slate-500 dark:text-slate-450 uppercase tracking-wider text-[9px] font-bold">
              <th className="p-4">Claim Date</th>
              <th className="p-4">Commute Site / Location</th>
              <th className="p-4">Category</th>
              <th className="p-4">Purpose / Justification</th>
              <th className="p-4 text-right">Amount (₹)</th>
              <th className="p-4 text-center">Audit Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
            {trainerExpenses
              .sort((a, b) => b.date.localeCompare(a.date))
              .map(exp => (
                <tr key={exp.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-950/20 transition">
                  <td className="p-4 font-semibold text-slate-650 dark:text-slate-400">{exp.date}</td>
                  <td className="p-4 font-bold text-slate-800 dark:text-slate-200">{exp.siteName}</td>
                  <td className="p-4">
                    <span className="bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-2.5 py-0.5 rounded text-[9px] font-bold text-rose-600 dark:text-rose-455 tracking-wide uppercase">
                      {exp.category}
                    </span>
                  </td>
                  <td className="p-4 text-slate-600 dark:text-slate-400 italic max-w-xs truncate font-medium" title={exp.purpose}>
                    "{exp.purpose}"
                  </td>
                  <td className="p-4 text-right font-black text-slate-800 dark:text-rose-500">₹{exp.amount.toLocaleString()}</td>
                  <td className="p-4 text-center">{getStatusBadge(exp.status)}</td>
                </tr>
              ))}
            {trainerExpenses.length === 0 && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-slate-400 dark:text-slate-550 font-medium">No expense claims filed in ledger.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Expense Claim Modal Overlay */}
      {showAdd && (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800 rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-zinc-800 pb-2">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">Create Expense Claim</h3>
              <button onClick={() => setShowAdd(false)} className="text-slate-400 dark:text-slate-500 hover:text-slate-950 dark:hover:text-white transition"><X size={18} /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs text-slate-700 dark:text-slate-300">
              {errorMsg && (
                <div className="bg-rose-500/15 border border-rose-500/30 text-rose-650 dark:text-rose-455 p-2 rounded-lg font-medium">
                  {errorMsg}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[9px]">Training Location Site *</label>
                <select
                  required
                  value={siteId}
                  onChange={(e) => setSiteId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg p-2.5 text-slate-800 dark:text-white outline-none focus:border-rose-600 font-semibold"
                >
                  <option value="">Select Location</option>
                  {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[9px]">Category *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg p-2.5 text-slate-800 dark:text-white outline-none focus:border-rose-600 font-semibold"
                  >
                    <option value="Travel">Travel</option>
                    <option value="Food">Food</option>
                    <option value="Accommodation">Accommodation</option>
                    <option value="Local Transport">Local Transport</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[9px]">Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="e.g. 1500"
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg p-2.5 text-slate-800 dark:text-white outline-none focus:border-rose-600 font-semibold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[9px]">Claim Date *</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg p-2.5 text-slate-800 dark:text-white outline-none focus:border-rose-600 font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[9px]">Commute Purpose / Details *</label>
                <textarea
                  required
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="e.g. Flight travel for outstation React training session..."
                  rows={2}
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg p-2.5 text-slate-800 dark:text-white outline-none focus:border-rose-600 resize-none font-semibold"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-rose-600 hover:bg-rose-700 text-white rounded-xl py-2.5 font-bold transition shadow"
              >
                Submit Claim Details
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default TrainerExpenses;
