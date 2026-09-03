import React, { useState } from 'react';
import { useDatabase } from '../../context/DatabaseContext';
import { 
  Check, X, CreditCard, Calendar, MapPin, 
  DollarSign, Landmark, CheckCircle, ShieldAlert, 
  ArrowRight, Filter, Receipt
} from 'lucide-react';
import type { ExpenseClaim, ReimbursementPaymentStatus } from '../../types';

const Expenses: React.FC = () => {
  const { expenses, reviewExpenseClaim, markExpensePaid, currentUser } = useDatabase();

  const [filterStatus, setFilterStatus] = useState<string>('All');
  
  // Mark as Paid Modal State (Requirement 16)
  const [payClaimModal, setPayClaimModal] = useState<ExpenseClaim | null>(null);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentRef, setPaymentRef] = useState<string>('PAY-2026-00041');
  const [paymentMethod, setPaymentMethod] = useState<string>('Bank Transfer');

  // Claim Rejection Modal State
  const [rejectClaimModal, setRejectClaimModal] = useState<ExpenseClaim | null>(null);
  const [rejectRemarks, setRejectRemarks] = useState('');

  const canProcessPayment = currentUser?.role === 'finance' || currentUser?.role === 'super_admin' || currentUser?.role === 'management';

  const handleOpenPayModal = (claim: ExpenseClaim) => {
    setPayClaimModal(claim);
    setPaidAmount(claim.approvedAmount || claim.amount);
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaymentRef(`PAY-2026-${String(Math.floor(1000 + Math.random() * 9000))}`);
    setPaymentMethod('Bank Transfer');
  };

  const handleConfirmPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payClaimModal || paidAmount <= 0 || !paymentRef.trim()) return;

    markExpensePaid(payClaimModal.id, {
      paidAmount: Number(paidAmount),
      paymentDate,
      paymentReference: paymentRef.trim(),
      paymentMethod
    });

    setPayClaimModal(null);
  };

  const handleConfirmReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectClaimModal) return;
    const finalRemarks = rejectRemarks.trim() || 'Claim rejected during administrative verification.';
    reviewExpenseClaim(rejectClaimModal.id, 'Rejected', finalRemarks);
    setRejectClaimModal(null);
  };

  const getPaymentStatusBadge = (claim: ExpenseClaim) => {
    if (claim.paymentStatus === 'Paid') {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
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

  const filteredExpenses = expenses.filter(e => {
    if (filterStatus === 'Pending') return e.status === 'Pending';
    if (filterStatus === 'Approved') return e.status === 'Approved' && e.paymentStatus !== 'Paid';
    if (filterStatus === 'Paid') return e.paymentStatus === 'Paid';
    return true;
  });

  return (
    <div className="space-y-6 text-slate-700 dark:text-slate-350 flex flex-col h-full transition-colors duration-200">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-wide">Trainer Reimbursements & Expenses</h2>
            <span className="bg-[#E50914] text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full shadow-sm">
              Finance & Payouts
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-450 mt-1 font-medium">
            Review trainer travel fare, food and accommodation claims, verify receipts, and disburse bank transfers.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-zinc-950 p-1 rounded-xl border border-slate-200 dark:border-zinc-800 text-xs font-bold">
          {['All', 'Pending', 'Approved', 'Paid'].map(st => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-lg transition ${
                filterStatus === st 
                  ? 'bg-[#E50914] text-white shadow-sm' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Main Expenses Table */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm flex flex-col flex-grow">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-zinc-950 border-b border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-slate-450 uppercase tracking-wider text-[9px] font-bold">
                <th className="p-4">Trainer & Date</th>
                <th className="p-4">Category & Purpose</th>
                <th className="p-4">Site / College</th>
                <th className="p-4 text-right">Claim Amount</th>
                <th className="p-4 text-right">Approved Amount</th>
                <th className="p-4 text-center">Payment Status</th>
                <th className="p-4 text-right">Payment Details / Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 font-semibold">
              {filteredExpenses.map(claim => (
                <tr key={claim.id} className="hover:bg-slate-50/60 dark:hover:bg-zinc-850/40 transition">
                  
                  {/* Trainer & Date */}
                  <td className="p-4">
                    <p className="font-bold text-slate-900 dark:text-white">{claim.trainerName}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{claim.date}</p>
                  </td>

                  {/* Category & Purpose */}
                  <td className="p-4">
                    <span className="inline-block px-2 py-0.5 bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-slate-300 rounded text-[10px] font-bold mb-1">
                      {claim.category}
                    </span>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 italic max-w-xs truncate" title={claim.purpose}>
                      "{claim.purpose}"
                    </p>
                  </td>

                  {/* Site */}
                  <td className="p-4">
                    <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                      <MapPin size={12} className="text-slate-400 shrink-0" />
                      <span className="truncate max-w-[160px]">{claim.siteName}</span>
                    </div>
                  </td>

                  {/* Claim Amount */}
                  <td className="p-4 text-right font-mono font-bold text-slate-800 dark:text-slate-200">
                    ₹{claim.amount.toLocaleString()}
                  </td>

                  {/* Approved Amount */}
                  <td className="p-4 text-right font-mono font-black text-[#E50914]">
                    ₹{(claim.approvedAmount !== undefined ? claim.approvedAmount : claim.amount).toLocaleString()}
                  </td>

                  {/* Payment Status (Requirement 15) */}
                  <td className="p-4 text-center">
                    {getPaymentStatusBadge(claim)}
                  </td>

                  {/* Payment Details / Action Controls (Requirement 16) */}
                  <td className="p-4 text-right">
                    {claim.paymentStatus === 'Paid' ? (
                      <div className="space-y-0.5 text-[10px] text-slate-600 dark:text-slate-400">
                        <p className="font-bold text-emerald-600 dark:text-emerald-400">Paid: ₹{claim.paidAmount?.toLocaleString()}</p>
                        <p className="font-mono text-slate-400">{claim.paymentReference}</p>
                        <p className="text-[9px] text-slate-500">{claim.paymentMethod} • {claim.paymentDate}</p>
                      </div>
                    ) : claim.status === 'Approved' ? (
                      canProcessPayment ? (
                        <button
                          onClick={() => handleOpenPayModal(claim)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-3 py-1.5 text-[11px] font-bold transition flex items-center gap-1 shadow-sm ml-auto"
                        >
                          <DollarSign size={13} /> Disburse Payment
                        </button>
                      ) : (
                        <span className="text-[10px] text-amber-500 font-bold">Awaiting Finance Payout</span>
                      )
                    ) : claim.status === 'Pending' ? (
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => reviewExpenseClaim(claim.id, 'Approved')}
                          className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 transition"
                          title="Approve Claim"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          onClick={() => { setRejectClaimModal(claim); setRejectRemarks(''); }}
                          className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 hover:bg-rose-100 transition"
                          title="Reject Claim"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-1 text-right">
                        <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[10px] font-bold border border-rose-500/20 inline-block">
                          Claim Rejected
                        </span>
                        {claim.reviewedBy && (
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                            By: <span className="font-bold text-slate-800 dark:text-slate-200">{claim.reviewedBy}</span>
                          </p>
                        )}
                        {claim.rejectionRemarks && (
                          <div className="text-[10px] text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 p-2 rounded-xl border border-rose-200 dark:border-rose-900/50 max-w-xs ml-auto text-left font-normal mt-1 leading-snug">
                            <span className="font-bold block text-[9px] uppercase tracking-wider text-rose-700 dark:text-rose-300">Reason / Details:</span>
                            {claim.rejectionRemarks}
                          </div>
                        )}
                      </div>
                    )}
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredExpenses.length === 0 && (
          <div className="py-20 text-center text-slate-400">
            <CreditCard size={32} className="text-slate-300 dark:text-zinc-800 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">No Expense Claims Found</p>
            <p className="text-[10px] text-slate-400 mt-0.5">All trainer claims have been verified and processed.</p>
          </div>
        )}
      </div>

      {/* DISBURSE PAYMENT MODAL (Requirement 16) */}
      {payClaimModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-zinc-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Record Reimbursement Payment</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Disburse expense to {payClaimModal.trainerName}</p>
              </div>
              <button onClick={() => setPayClaimModal(null)} className="text-slate-400 hover:text-slate-600 font-bold">&times;</button>
            </div>

            <form onSubmit={handleConfirmPayment} className="space-y-3.5 text-xs">
              
              <div className="bg-slate-50 dark:bg-zinc-900 p-3 rounded-xl border border-slate-200 dark:border-zinc-800 space-y-1 font-semibold">
                <div className="flex justify-between">
                  <span className="text-slate-400">Claim Category:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{payClaimModal.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Claim Amount:</span>
                  <span className="font-mono">₹{payClaimModal.amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 dark:border-zinc-800 pt-1">
                  <span className="text-slate-400">Approved Payout:</span>
                  <span className="font-mono font-bold text-[#E50914]">₹{(payClaimModal.approvedAmount || payClaimModal.amount).toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 font-bold">Paid Amount (₹) *</label>
                <input
                  type="number"
                  required
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg p-2.5 font-mono font-bold text-slate-900 dark:text-white outline-none focus:border-[#E50914]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-500 font-bold">Payment Date *</label>
                  <input
                    type="date"
                    required
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg p-2 text-slate-900 dark:text-white outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-500 font-bold">Payment Method *</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg p-2 text-slate-900 dark:text-white outline-none"
                  >
                    <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
                    <option value="UPI">UPI</option>
                    <option value="Corporate Card">Corporate Card</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 font-bold">Payment Reference / UTR Number *</label>
                <input
                  type="text"
                  required
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  placeholder="PAY-2026-00041"
                  className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg p-2 font-mono text-slate-900 dark:text-white outline-none focus:border-[#E50914]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setPayClaimModal(null)}
                  className="px-4 py-2 rounded-xl text-slate-500 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition shadow-md"
                >
                  Mark as PAID ✓
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* REJECT CLAIM MODAL */}
      {rejectClaimModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-zinc-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <X size={16} className="text-rose-600" />
                  <span>Reject Reimbursement Claim</span>
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Claim ID #{rejectClaimModal.id} filed by {rejectClaimModal.trainerName}</p>
              </div>
              <button onClick={() => setRejectClaimModal(null)} className="text-slate-400 hover:text-slate-600 font-bold">&times;</button>
            </div>

            <form onSubmit={handleConfirmReject} className="space-y-3.5 text-xs">
              <div className="bg-slate-50 dark:bg-zinc-900 p-3 rounded-xl border border-slate-200 dark:border-zinc-800 space-y-1 font-semibold">
                <div className="flex justify-between">
                  <span className="text-slate-400">Claim Category:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{rejectClaimModal.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Claim Amount:</span>
                  <span className="font-mono text-rose-600 font-bold">₹{rejectClaimModal.amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 dark:border-zinc-800 pt-1">
                  <span className="text-slate-400">Purpose:</span>
                  <span className="italic text-slate-700 dark:text-slate-300 max-w-[240px] truncate">"{rejectClaimModal.purpose}"</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 dark:text-slate-400 font-bold">
                  Rejection Reason / Audit Remarks *
                </label>
                <textarea
                  required
                  rows={3}
                  value={rejectRemarks}
                  onChange={(e) => setRejectRemarks(e.target.value)}
                  placeholder="e.g. Unverified fare receipt, outstation transit policy breach, or missing taxi bill..."
                  className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 text-slate-900 dark:text-white outline-none focus:border-[#E50914] resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setRejectClaimModal(null)}
                  className="px-4 py-2 rounded-xl text-slate-500 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition shadow-md flex items-center gap-1.5"
                >
                  <X size={14} /> Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Expenses;
