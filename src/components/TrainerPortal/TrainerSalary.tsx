import React, { useState } from 'react';
import { useDatabase } from '../../context/DatabaseContext';
import { Eye, X, CheckCircle } from 'lucide-react';

import type { Payslip } from '../../types';

const TrainerSalary: React.FC = () => {
  const { currentUser, payslips, trainers } = useDatabase();
  const [selectedSlip, setSelectedSlip] = useState<Payslip | null>(null);

  const trainer = trainers.find(t => t.email === currentUser?.email) || trainers[0];
  const trainerSlips = payslips.filter(p => p.trainerId === trainer.id);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Paid':
        return <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-455 border border-emerald-500/20">Paid</span>;
      case 'Approved':
        return <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-blue-500/10 text-blue-455 border border-blue-500/20">Approved</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-455 border border-amber-500/20 animate-pulse">Processing</span>;
    }
  };

  return (
    <div className="space-y-6 text-slate-750 dark:text-slate-350 flex flex-col h-full relative transition-colors duration-200">
      <div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-white tracking-wide">My Earnings & Payslips</h2>
        <p className="text-xs text-slate-500 dark:text-slate-455 mt-0.5 font-medium">Inspect monthly class settlements, expense reimbursement disbursements, and download payslips.</p>
      </div>

      {/* Contract Terms Banner */}
      <div className="bg-gradient-to-r from-rose-500/5 to-slate-50 dark:to-zinc-900 border border-rose-500/10 dark:border-zinc-800/80 rounded-2xl p-5 flex justify-between items-center text-xs shadow-sm">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-550">Contract Rate Card Terms</span>
          <p className="text-lg font-black mt-1 text-slate-800 dark:text-slate-100">
            {trainer.rate > 0 ? `₹${trainer.rate}/hour (Hourly billing based on class reports)` : `Fixed Retainer: ₹${trainer.fixedSalary.toLocaleString()}/month`}
          </p>
        </div>
        <div className="text-right text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-wider">
          Contract Status: Active
        </div>
      </div>

      {/* Payslips Grid */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800/80 rounded-2xl overflow-hidden shadow-sm flex-grow overflow-y-auto custom-scrollbar">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-zinc-950 border-b border-slate-150 dark:border-zinc-800 text-slate-500 dark:text-slate-450 uppercase tracking-wider text-[9px] font-bold">
              <th className="p-4">Billing Cycle</th>
              <th className="p-4 text-center">Class Hours</th>
              <th className="p-4 text-right">Fixed Pay (₹)</th>
              <th className="p-4 text-right">Expense Reimburse (₹)</th>
              <th className="p-4 text-right">Deductions (₹)</th>
              <th className="p-4 text-right">Net Disbursed (₹)</th>
              <th className="p-4 text-center">Settlement Status</th>
              <th className="p-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
            {trainerSlips.map(slip => (
              <tr key={slip.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-950/20 transition">
                <td className="p-4 font-bold text-slate-800 dark:text-slate-200">{slip.month}</td>
                <td className="p-4 text-center font-semibold text-slate-600 dark:text-slate-400">
                  {slip.hourlyHours > 0 ? `${slip.hourlyHours} hrs` : 'N/A'}
                </td>
                <td className="p-4 text-right font-semibold text-slate-600 dark:text-slate-400">
                  ₹{slip.fixedSalary > 0 ? slip.fixedSalary.toLocaleString() : '0'}
                </td>
                <td className="p-4 text-right text-emerald-600 dark:text-emerald-400 font-semibold">
                  ₹{slip.approvedExpenses.toLocaleString()}
                </td>
                <td className="p-4 text-right text-rose-600 dark:text-rose-500 font-semibold">
                  - ₹{slip.deductions.toLocaleString()}
                </td>
                <td className="p-4 text-right font-black text-slate-800 dark:text-slate-100">
                  ₹{slip.netSalary.toLocaleString()}
                </td>
                <td className="p-4 text-center">{getStatusBadge(slip.status)}</td>
                <td className="p-4 text-center">
                  <button
                    onClick={() => setSelectedSlip(slip)}
                    className="bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-900 text-slate-600 dark:text-slate-350 hover:text-slate-900 dark:hover:text-white p-1.5 rounded transition shadow-sm"
                    title="View Payslip Breakdowns"
                  >
                    <Eye size={12} />
                  </button>
                </td>
              </tr>
            ))}
            {trainerSlips.length === 0 && (
              <tr>
                <td colSpan={8} className="p-6 text-center text-slate-400 dark:text-slate-500 font-semibold">No payslips generated in settlement log.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Payslip Detail Breakdown Modal Overlay */}
      {selectedSlip && (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800 rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-zinc-800 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-500">Salary Settlement Statement</h3>
              <button onClick={() => setSelectedSlip(null)} className="text-slate-400 dark:text-slate-500 hover:text-slate-950 dark:hover:text-white transition"><X size={18} /></button>
            </div>

            <div className="space-y-4 text-xs text-slate-600 dark:text-slate-350">
              <div className="flex justify-between items-start font-semibold">
                <div>
                  <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">SPARK EDUTECH</h4>
                  <p className="text-[9px] text-slate-455 mt-0.5 font-bold">Cycle Statement: {selectedSlip.month}</p>
                </div>
                <div className="text-right">
                  <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold block uppercase tracking-wider">Audit Status</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{selectedSlip.status}</span>
                </div>
              </div>

              {/* Items ledger list */}
              <div className="bg-slate-50 dark:bg-zinc-950 border border-slate-150 dark:border-zinc-855 rounded-xl p-4 space-y-2.5 shadow-inner">
                {selectedSlip.hourlyHours > 0 && (
                  <div className="flex justify-between font-semibold">
                    <span className="text-slate-500 dark:text-slate-455">Hourly Payout ({selectedSlip.hourlyHours} hrs * ₹{selectedSlip.hourlyRate})</span>
                    <span className="font-bold text-slate-800 dark:text-slate-300">₹{selectedSlip.hourlyPay.toLocaleString()}</span>
                  </div>
                )}
                {selectedSlip.fixedSalary > 0 && (
                  <div className="flex justify-between font-semibold">
                    <span className="text-slate-500 dark:text-slate-455">Retainer Fixed Salary</span>
                    <span className="font-bold text-slate-800 dark:text-slate-300">₹{selectedSlip.fixedSalary.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-500 dark:text-slate-455">Travel / Lodging Reimburse</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">₹{selectedSlip.approvedExpenses.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-500 dark:text-slate-455">Incentives / Bonuses</span>
                  <span className="font-bold text-slate-800 dark:text-slate-300">₹{selectedSlip.incentives.toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 dark:border-zinc-800 pb-2 font-semibold">
                  <span className="text-slate-500 dark:text-slate-455">TDS Tax Deductions</span>
                  <span className="font-bold text-rose-650 dark:text-rose-500">- ₹{selectedSlip.deductions.toLocaleString()}</span>
                </div>
                
                <div className="flex justify-between pt-1.5">
                  <span className="text-slate-800 dark:text-slate-300 font-black">Net Salary Deposited</span>
                  <span className="font-black text-rose-600 dark:text-rose-500 text-sm">₹{selectedSlip.netSalary.toLocaleString()}</span>
                </div>
              </div>

              {selectedSlip.paymentDate && (
                <div className="flex items-center justify-center gap-1.5 text-[9px] text-slate-455 dark:text-slate-500 pt-1 font-bold">
                  <CheckCircle size={12} className="text-emerald-500" />
                  <span>Transferred on {selectedSlip.paymentDate}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrainerSalary;
