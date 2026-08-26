import React from 'react';
import { useDatabase } from '../../context/DatabaseContext';
import { Check, X, CreditCard, Calendar, MapPin } from 'lucide-react';


const Expenses: React.FC = () => {
  const { expenses, reviewExpenseClaim } = useDatabase();

  const pendingClaims = expenses.filter(e => e.status === 'Pending');
  const pastClaims = expenses.filter(e => e.status !== 'Pending');

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
    <div className="space-y-6 text-slate-700 dark:text-slate-350 flex flex-col h-full transition-colors duration-200">
      <div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-white tracking-wide">Trainer Expense Claims</h2>
        <p className="text-xs text-slate-500 dark:text-slate-455 mt-0.5 font-medium">Audit trainer mileage, travel fare, and hospitality claims for payroll reimbursement.</p>
      </div>

      {/* Grid: Pending and Past Claims */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 flex-grow overflow-hidden">
        
        {/* Left 2 Cols: Active/Pending Claims Queue */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800/80 rounded-2xl p-5 shadow-sm flex flex-col h-full">
          <h3 className="text-sm font-bold text-slate-850 dark:text-white mb-4 flex items-center gap-2">
            Pending Reimbursements 
            {pendingClaims.length > 0 && (
              <span className="bg-rose-600 text-white text-[10px] font-black rounded-full px-2 py-0.5">{pendingClaims.length}</span>
            )}
          </h3>

          <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-1">
            {pendingClaims.map(claim => (
              <div key={claim.id} className="bg-slate-50 dark:bg-zinc-950 border border-slate-150 dark:border-zinc-855 rounded-2xl p-4 flex flex-col sm:flex-row justify-between gap-4 shadow-sm">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="bg-white dark:bg-zinc-900 border border-slate-250 dark:border-zinc-800 px-2 py-0.5 rounded text-[10px] font-bold text-rose-600 dark:text-rose-455">{claim.category}</span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{claim.trainerName}</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-450 leading-normal">"{claim.purpose}"</p>
                  <div className="flex flex-wrap gap-3 text-[10px] text-slate-400 dark:text-slate-500 font-semibold">
                    <span className="flex items-center gap-1"><Calendar size={12} /> {claim.date}</span>
                    <span className="flex items-center gap-1"><MapPin size={12} /> {claim.siteName}</span>
                  </div>
                </div>

                <div className="text-right flex sm:flex-col justify-between sm:justify-start items-center sm:items-end gap-3 shrink-0">
                  <div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold block uppercase tracking-wider">Amount Claimed</span>
                    <p className="text-lg font-black text-rose-600 dark:text-rose-455">₹{claim.amount.toLocaleString()}</p>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => reviewExpenseClaim(claim.id, 'Approved')}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-500/20 rounded-lg p-1.5 transition shadow-sm"
                      title="Approve Reimbursement"
                    >
                      <Check size={14} />
                    </button>
                    <button
                      onClick={() => reviewExpenseClaim(claim.id, 'Rejected')}
                      className="bg-rose-600 hover:bg-rose-700 text-white border border-rose-500/20 rounded-lg p-1.5 transition shadow-sm"
                      title="Reject Claim"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {pendingClaims.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400 dark:text-slate-500">
                <CreditCard size={32} className="text-slate-300 dark:text-zinc-800 mb-2" />
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">All Claims Processed</p>
                <p className="text-[10px] text-slate-450 dark:text-slate-500 mt-0.5 font-medium">No pending expense claims require attention.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Audit Ledger History */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800/80 rounded-2xl p-5 shadow-sm flex flex-col h-full">
          <h3 className="text-sm font-bold text-slate-850 dark:text-white mb-4">Verification Audit Ledger</h3>
          
          <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-1">
            {pastClaims
              .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
              .map(claim => (
                <div key={claim.id} className="bg-slate-50 dark:bg-zinc-950/60 border border-slate-150 dark:border-zinc-855 rounded-xl p-3 space-y-2 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{claim.trainerName}</p>
                      <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5 font-semibold">{claim.category} • {claim.date}</p>
                    </div>
                    {getStatusBadge(claim.status)}
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 italic leading-snug">"{claim.purpose}"</p>
                  <div className="flex justify-between items-center text-[10px] border-t border-slate-100 dark:border-zinc-800 pt-2 font-semibold">
                    <span className="text-slate-500 dark:text-slate-400">Payout: ₹{claim.amount}</span>
                    {claim.reviewedBy && (
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 truncate max-w-[120px]" title={claim.reviewedBy}>Reviewed by: {claim.reviewedBy.split('@')[0]}</span>
                    )}
                  </div>
                </div>
              ))}
            {pastClaims.length === 0 && (
              <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-12 font-medium">No historical expense logs found.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Expenses;
