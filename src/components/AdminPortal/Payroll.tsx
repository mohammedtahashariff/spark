import React, { useState } from 'react';
import { useDatabase } from '../../context/DatabaseContext';
import { Check, Play, FileText, ShieldAlert } from 'lucide-react';


const Payroll: React.FC = () => {
  const { payrollRuns, payslips, trainers, createPayrollRun, approvePayrollRun, payPayrollRun } = useDatabase();
  const [selectedMonth, setSelectedMonth] = useState('2026-08');
  const [activeRunId, setActiveRunId] = useState<string | null>(null);

  const getTrainerIndividualId = (trainerId: string) => {
    return trainers.find(t => t.id === trainerId)?.individualId || trainerId;
  };

  const handleGeneratePayroll = (e: React.FormEvent) => {
    e.preventDefault();
    const run = createPayrollRun(selectedMonth);
    if (run) {
      setActiveRunId(run.id);
    }
  };

  const getRunStatusBadge = (status: string) => {
    switch (status) {
      case 'Paid':
        return <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">Disbursed</span>;
      case 'Approved':
        return <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-blue-500/10 text-blue-650 dark:text-blue-400 border border-blue-500/20">Approved</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 animate-pulse">Draft</span>;
    }
  };

  const activeRun = payrollRuns.find(r => r.id === activeRunId) || payrollRuns[0];
  const activeSlips = activeRun ? payslips.filter(p => p.payrollRunId === activeRun.id) : [];

  return (
    <div className="space-y-5 text-slate-750 dark:text-slate-350 flex flex-col h-full transition-colors duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white tracking-wide">Trainer Payroll Manager</h2>
          <p className="text-xs text-slate-500 dark:text-slate-450 mt-0.5 font-medium">Calculate monthly salaries, approve payouts, and issue secure trainer payslips.</p>
        </div>
        
        {/* Run payroll trigger */}
        <form onSubmit={handleGeneratePayroll} className="flex bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-1.5 gap-2 items-center shrink-0">
          <span className="text-[10px] font-bold text-slate-450 dark:text-zinc-500 uppercase tracking-wider pl-2">Select Cycle:</span>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-850 text-xs font-bold text-slate-800 dark:text-slate-200 rounded-lg p-1 px-2.5 outline-none focus:border-rose-600"
          >
            <option value="2026-08">August 2026</option>
            <option value="2026-09">September 2026</option>
          </select>
          <button
            type="submit"
            className="bg-rose-600 hover:bg-rose-700 text-white rounded-lg px-3 py-1.5 text-xs font-bold transition flex items-center gap-1.5 shadow"
          >
            Generate Run
          </button>
        </form>
      </div>

      {/* Grid: Runs list and details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 flex-grow overflow-hidden">
        
        {/* Left 1 Col: Historic Runs List */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800/80 rounded-2xl p-4 flex flex-col h-full shadow-sm">
          <h3 className="text-xs font-bold text-slate-400 dark:text-slate-555 uppercase tracking-wider mb-3 px-1 font-sans">Calculations snapshots</h3>
          
          <div className="flex-1 overflow-y-auto space-y-2.5 custom-scrollbar pr-1">
            {payrollRuns.map(run => (
              <div
                key={run.id}
                onClick={() => setActiveRunId(run.id)}
                className={`p-3.5 border rounded-xl cursor-pointer transition flex justify-between items-center ${
                  activeRun?.id === run.id
                    ? 'bg-rose-50/40 dark:bg-rose-955/10 border-rose-500 dark:border-rose-600 text-slate-900 dark:text-white'
                    : 'bg-slate-50/50 dark:bg-zinc-950/60 border-slate-150 dark:border-zinc-855 hover:border-slate-350 dark:hover:border-zinc-800 text-slate-600 dark:text-slate-350'
                }`}
              >
                <div>
                  <h4 className={`font-bold text-xs ${activeRun?.id === run.id ? 'text-rose-600 dark:text-rose-455' : 'text-slate-800 dark:text-slate-200'}`}>{run.month} Cycle</h4>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-semibold">Processed: {run.runDate} • {run.payslipsCount} slips</p>
                </div>
                <div className="text-right space-y-1.5 shrink-0 font-medium">
                  <p className="font-black text-slate-800 dark:text-rose-455 text-xs">₹{run.totalAmount.toLocaleString()}</p>
                  {getRunStatusBadge(run.status)}
                </div>
              </div>
            ))}
            {payrollRuns.length === 0 && (
              <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-12 font-medium">No payroll runs initiated.</p>
            )}
          </div>
        </div>

        {/* Right 2 Cols: Selected Run Payslips Details */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800/80 rounded-2xl p-5 shadow-sm flex flex-col h-full justify-between">
          {activeRun ? (
            <div className="space-y-4 h-full flex flex-col justify-between">
              
              <div className="space-y-4 flex-grow overflow-hidden flex flex-col">
                {/* Active Run Header */}
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-zinc-800 pb-3.5 shrink-0">
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-800 dark:text-white">Payroll snapshot: {activeRun.month} Cycle</h3>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-semibold">Created on {activeRun.runDate}</p>
                  </div>

                  <div className="flex gap-2">
                    {activeRun.status === 'Draft' && (
                      <button
                        onClick={() => approvePayrollRun(activeRun.id)}
                        className="bg-rose-600 hover:bg-rose-700 text-white rounded-lg px-3 py-1.5 text-xs font-bold transition flex items-center gap-1 shadow"
                      >
                        <Check size={14} /> Approve Run
                      </button>
                    )}
                    {activeRun.status === 'Approved' && (
                      <button
                        onClick={() => payPayrollRun(activeRun.id)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-3 py-1.5 text-xs font-bold transition flex items-center gap-1 shadow"
                      >
                        <Play size={14} /> Disburse Salaries
                      </button>
                    )}
                  </div>
                </div>

                {/* Payslips Table */}
                <div className="flex-grow overflow-y-auto custom-scrollbar pr-1">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-zinc-950 border-b border-slate-150 dark:border-zinc-850 text-slate-500 dark:text-slate-450 font-bold uppercase tracking-wider text-[9px]">
                        <th className="p-3">Trainer</th>
                        <th className="p-3">Terms</th>
                        <th className="p-3 text-center">Class Hours</th>
                        <th className="p-3 text-right">Expenses (₹)</th>
                        <th className="p-3 text-right">
                          <span className="inline-flex items-center gap-1">
                            <span className="px-1 py-0.5 rounded text-[8px] bg-rose-500/10 text-rose-600 dark:text-rose-400 font-black border border-rose-500/20">TDS</span>
                            Deductions (₹)
                          </span>
                        </th>
                        <th className="p-3 text-right">Net Pay (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                      {activeSlips.map(slip => (
                        <tr key={slip.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-950/20 transition">
                          <td className="p-3">
                            <p className="font-bold text-slate-800 dark:text-slate-200">{slip.trainerName}</p>
                            <span className="font-mono text-[9px] font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-1 rounded">
                              {getTrainerIndividualId(slip.trainerId)}
                            </span>
                          </td>
                          <td className="p-3 text-slate-500 dark:text-slate-400 font-semibold">
                            {slip.hourlyRate > 0 ? 'Hourly Contract' : 'Fixed Retainer'}
                          </td>
                          <td className="p-3 text-center font-semibold text-slate-600 dark:text-slate-350">
                            {slip.hourlyRate > 0 ? `${slip.hourlyHours} hrs` : 'N/A'}
                          </td>
                          <td className="p-3 text-right text-emerald-600 dark:text-emerald-400 font-bold">
                            ₹{slip.approvedExpenses.toLocaleString()}
                          </td>
                          <td className="p-3 text-right text-rose-600 dark:text-rose-500 font-bold">
                            - ₹{slip.deductions.toLocaleString()}
                          </td>
                          <td className="p-3 text-right font-black text-slate-850 dark:text-slate-100">
                            ₹{slip.netSalary.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Compliance note */}
              <div className="flex items-center justify-between border-t border-slate-100 dark:border-zinc-800 pt-3 text-[10px] text-slate-450 dark:text-slate-500 shrink-0 font-semibold">
                <span className="flex items-center gap-1"><FileText size={12} className="text-emerald-500" /> Authorized snapshots locked in history ledger</span>
                <span>Grand Payout: <strong className="text-slate-800 dark:text-white">₹{activeRun.totalAmount.toLocaleString()}</strong></span>
              </div>

            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 dark:text-slate-500">
              <ShieldAlert size={40} className="text-slate-300 dark:text-zinc-800 mb-2" />
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">No Payroll Snapshot Selected</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 max-w-[200px] mt-0.5 font-medium">Select an historical payroll month run or create a new cycle calculations above.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Payroll;
