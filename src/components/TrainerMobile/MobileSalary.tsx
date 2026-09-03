import React, { useState } from 'react';
import { useDatabase } from '../../context/DatabaseContext';
import { FileText, Eye, X, CheckCircle } from 'lucide-react';
import type { Payslip } from '../../types';


const MobileSalary: React.FC = () => {
  const { currentUser, payslips, trainers } = useDatabase();
  const [selectedSlip, setSelectedSlip] = useState<Payslip | null>(null);

  const trainer = trainers.find(t => t.email === currentUser?.email) || trainers[0];
  const trainerSlips = payslips.filter(p => p.trainerId === trainer.id);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Paid':
        return <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Disbursed</span>;
      case 'Approved':
        return <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">Approved</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse">Processing</span>;
    }
  };

  return (
    <div className="space-y-4 pb-8 text-white relative">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-md font-bold tracking-wide">My Settlements</h2>
          <p className="text-[10px] text-slate-500 mt-0.5">Disbursement records & TDS compliance</p>
        </div>
        <span className="font-mono text-[9px] font-black px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
          ID: {trainer.individualId || trainer.id}
        </span>
      </div>

      {/* Contract Terms Banner */}
      <div className="bg-gradient-to-r from-rose-950/30 to-slate-900 border border-rose-900/20 rounded-xl p-4 flex justify-between items-center text-xs">
        <div>
          <span className="text-[9px] font-bold uppercase tracking-wider text-rose-455">Contract Terms</span>
          <p className="text-sm font-black mt-1 text-slate-200">
            {trainer.rate > 0 ? 'Hourly Engagement Contract' : 'Fixed Retainer Contract'}
          </p>
        </div>
        <div className="text-right text-[10px] text-emerald-400 font-bold">
          Active · TDS Verified
        </div>
      </div>

      {/* Payslips List */}
      <div className="space-y-2.5">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">Settlement History</h3>
        
        {trainerSlips.map(slip => (
          <div key={slip.id} className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex justify-between items-center text-xs">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-950 rounded-lg text-rose-400 border border-slate-850">
                <FileText size={16} />
              </div>
              <div>
                <p className="font-bold text-slate-100">{slip.month} Cycle</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-slate-400">{slip.hourlyHours > 0 ? `${slip.hourlyHours} hrs logged` : 'Retainer'}</span>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[8px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                    <span className="font-black">TDS</span> Deducted
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {getStatusBadge(slip.status)}
              <button
                onClick={() => setSelectedSlip(slip)}
                className="p-1 bg-slate-950 border border-slate-800 text-slate-450 hover:text-white rounded"
                title="View Statement"
              >
                <Eye size={14} />
              </button>
            </div>
          </div>
        ))}
        {trainerSlips.length === 0 && (
          <p className="text-xs text-slate-550 text-center py-12">No settlement records generated for your account yet.</p>
        )}
      </div>

      {/* Payslip detail overlay */}
      {selectedSlip && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 w-full max-w-sm space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-850 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-rose-455">Settlement Statement</h3>
              <button onClick={() => setSelectedSlip(null)} className="text-slate-400 hover:text-white"><X size={16} /></button>
            </div>

            <div className="space-y-3.5 text-xs text-slate-350">
              {/* Slip Header */}
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-extrabold text-sm text-slate-100">SPARK EDUTECH</h4>
                  <p className="text-[9px] text-slate-550 mt-0.5">Billing Cycle: {selectedSlip.month}</p>
                  <p className="text-[9px] text-rose-400 font-mono mt-0.5">Trainer ID: {trainer.individualId || trainer.id}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Status</p>
                  <p className="font-bold text-emerald-400">{selectedSlip.status}</p>
                </div>
              </div>

              {/* Ledger Items */}
              <div className="bg-slate-950 border border-slate-850 rounded-xl p-3.5 space-y-2 text-xs">
                {selectedSlip.hourlyHours > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Delivered Sessions</span>
                    <span className="font-semibold text-slate-300">{selectedSlip.hourlyHours} Hours</span>
                  </div>
                )}
                {selectedSlip.fixedSalary > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Contract Engagement</span>
                    <span className="font-semibold text-slate-300">Monthly Retainer Covered</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">Expense Claims</span>
                  <span className="font-semibold text-emerald-400">{selectedSlip.approvedExpenses > 0 ? 'Approved' : 'None'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-850 pb-2">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <span className="px-1.5 py-0.5 rounded text-[8px] bg-rose-500/20 text-rose-400 font-bold border border-rose-500/30">TDS</span>
                    TDS Tax Deductions
                  </span>
                  <span className="font-semibold text-emerald-400">Compliant</span>
                </div>
                
                <div className="flex justify-between pt-1">
                  <span className="text-slate-400 font-black">Disbursement Mode</span>
                  <span className="font-bold text-emerald-400">Direct Bank Transfer</span>
                </div>
              </div>

              {selectedSlip.paymentDate ? (
                <div className="flex items-center gap-1.5 text-[9px] text-slate-500 justify-center pt-2">
                  <CheckCircle size={12} className="text-emerald-500" />
                  <span>Transferred on {selectedSlip.paymentDate}</span>
                </div>
              ) : (
                <p className="text-[9px] text-slate-500 text-center pt-1">Settlement scheduled at cycle cutoff</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileSalary;
