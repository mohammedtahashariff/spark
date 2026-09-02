import React, { useState } from 'react';
import { useDatabase } from '../../context/DatabaseContext';
import { Plus, X, MapPin, CheckCircle, CreditCard, DollarSign } from 'lucide-react';
import type { ExpenseClaim } from '../../types';

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

  const getPaymentStatusBadge = (claim: ExpenseClaim) => {
    if (claim.paymentStatus === 'Paid') {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1 justify-center">
          <CheckCircle size={10} /> PAID ✓
        </span>
      );
    }
    if (claim.status === 'Approved') {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
          PAYMENT PENDING
        </span>
      );
    }
    if (claim.status === 'Rejected') {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
          REJECTED
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-slate-100 dark:bg-zinc-800 text-slate-500 border border-slate-200 dark:border-zinc-700 animate-pulse">
        PENDING REVIEW
      </span>
    );
  };

  return (
    <div className="space-y-6 text-slate-700 dark:text-slate-350 flex flex-col h-full relative transition-colors duration-200">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-wide">Expense Reimbursement Claims</h2>
            <span className="bg-[#E50914] text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full shadow-sm">
              My Expenses
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-450 mt-1 font-medium">
            File claims for travel fare, campus meals, and accommodation incurred during training deliveries.
          </p>
        </div>

        <button
          onClick={() => { setErrorMsg(''); setShowAdd(true); }}
          className="bg-[#E50914] hover:bg-[#b00610] text-white rounded-xl px-4 py-2.5 text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-red-600/20 shrink-0"
        >
          <Plus size={16} /> File New Claim
        </button>
      </div>

      {/* Main Ledger Table */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm flex-grow overflow-y-auto custom-scrollbar">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-zinc-950 border-b border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-slate-450 uppercase tracking-wider text-[9px] font-bold">
              <th className="p-4">Claim Date</th>
              <th className="p-4">Category</th>
              <th className="p-4">Purpose / Destination</th>
              <th className="p-4 text-right">Claim Amount</th>
              <th className="p-4 text-right">Approved Amount</th>
              <th className="p-4 text-center">Payment Status</th>
              <th className="p-4 text-right">Payment Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 font-semibold">
            {trainerExpenses
              .sort((a, b) => b.date.localeCompare(a.date))
              .map(exp => (
                <tr key={exp.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-850/20 transition">
                  <td className="p-4 text-slate-600 dark:text-slate-400">{exp.date}</td>
                  
                  <td className="p-4">
                    <span className="bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-slate-300 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase">
                      {exp.category}
                    </span>
                  </td>

                  <td className="p-4">
                    <p className="text-slate-900 dark:text-white font-bold leading-snug">{exp.siteName}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-450 italic mt-0.5 truncate max-w-xs" title={exp.purpose}>
                      "{exp.purpose}"
                    </p>
                  </td>

                  <td className="p-4 text-right font-mono font-bold text-slate-800 dark:text-slate-200">
                    ₹{exp.amount.toLocaleString()}
                  </td>

                  <td className="p-4 text-right font-mono font-black text-[#E50914]">
                    ₹{(exp.approvedAmount !== undefined ? exp.approvedAmount : exp.amount).toLocaleString()}
                  </td>

                  <td className="p-4 text-center">
                    {getPaymentStatusBadge(exp)}
                  </td>

                  <td className="p-4 text-right">
                    {exp.paymentStatus === 'Paid' ? (
                      <div className="space-y-0.5 text-[10px] text-slate-600 dark:text-slate-400">
                        <p className="font-bold text-emerald-600 dark:text-emerald-400">Paid on {exp.paymentDate || exp.date}</p>
                        <p className="font-mono text-slate-400">{exp.paymentReference || 'PAY-REF-SETTLED'}</p>
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-400 italic">Payment Pending</span>
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>

        {trainerExpenses.length === 0 && (
          <div className="py-20 text-center text-slate-400">
            <CreditCard size={32} className="text-slate-300 dark:text-zinc-800 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-900 dark:text-white">No Claims Submitted</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Click 'File New Claim' above to submit training commute expenses.</p>
          </div>
        )}
      </div>

      {/* Add Claim Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">File Expense Reimbursement Claim</h3>
              <button onClick={() => setShowAdd(false)} className="text-slate-400 hover:text-slate-600 font-bold">&times;</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              {errorMsg && (
                <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-600 p-2.5 rounded-lg font-bold">
                  {errorMsg}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-slate-500 font-bold">Training Site / Campus *</label>
                <select
                  required
                  value={siteId}
                  onChange={(e) => setSiteId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg p-2.5 font-semibold text-slate-900 dark:text-white outline-none focus:border-[#E50914]"
                >
                  <option value="">Select Training Site</option>
                  {sites.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-500 font-bold">Expense Date *</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg p-2.5 text-slate-900 dark:text-white outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-500 font-bold">Category *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg p-2.5 font-bold text-slate-900 dark:text-white outline-none"
                  >
                    <option value="Travel">Travel / Cab Fare</option>
                    <option value="Food">Food / Meals</option>
                    <option value="Accommodation">Accommodation</option>
                    <option value="Local Transport">Local Transport</option>
                    <option value="Other">Other Operational</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 font-bold">Claim Amount (₹) *</label>
                <input
                  type="number"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 2500"
                  className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg p-2.5 font-mono font-bold text-slate-900 dark:text-white outline-none focus:border-[#E50914]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 font-bold">Purpose / Details *</label>
                <textarea
                  required
                  rows={2}
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="e.g. Uber cab fare to training site for Full Stack bootcamp session"
                  className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg p-2.5 text-slate-900 dark:text-white outline-none focus:border-[#E50914] resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 font-bold hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#E50914] hover:bg-[#b00610] text-white rounded-xl font-bold transition shadow-md"
                >
                  Submit Claim
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default TrainerExpenses;
