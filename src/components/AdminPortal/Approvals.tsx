import React from 'react';
import { useDatabase } from '../../context/DatabaseContext';
import { Check, X } from 'lucide-react';

const Approvals: React.FC = () => {
  const { 
    changeRequests, reviewScheduleChange,
    attendanceRecords, reviewAttendance,
    expenses, reviewExpenseClaim,
    payrollRuns, approvePayrollRun,
    quotations, updateQuotationStatus,
    invoices, issueInvoice,
    trainers, updateTrainerDocumentStatus
  } = useDatabase();

  // 1. Pending schedule requests
  const pendingSchedules = changeRequests.filter(r => r.status === 'Pending');
  
  // 2. Pending attendance exceptions
  const pendingAttendance = attendanceRecords.filter(r => r.verificationStatus === 'Review');
  
  // 3. Pending expenses
  const pendingExpenses = expenses.filter(e => e.status === 'Pending');

  // 4. Pending payroll runs
  const pendingPayroll = payrollRuns.filter(p => p.status === 'Draft');

  // 5. Pending quotations
  const pendingQuotations = quotations.filter(q => q.status === 'Sent');

  // 6. Pending Invoices
  const pendingInvoices = invoices.filter(i => i.status === 'Draft');

  // 7. Pending Trainer Compliance Documents
  const pendingDocs = trainers.flatMap(t => 
    (t.documents || [])
      .filter(d => d.status === 'Review' || d.status === 'Draft')
      .map(d => ({ trainer: t, doc: d }))
  );

  const totalPending = 
    pendingSchedules.length + 
    pendingAttendance.length + 
    pendingExpenses.length + 
    pendingPayroll.length + 
    pendingQuotations.length + 
    pendingInvoices.length +
    pendingDocs.length;

  return (
    <div className="space-y-6 text-slate-700 dark:text-slate-350 transition-colors duration-200">
      <div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-white tracking-wide">Central Approval Hub</h2>
        <p className="text-xs text-slate-550 mt-0.5 font-medium">Review, override, and approve pending operational adjustments, expense claims, and invoice drafts.</p>
      </div>

      {totalPending === 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800 rounded-2xl p-12 text-center max-w-md mx-auto space-y-3 shadow-sm">
          <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-555 border border-emerald-500/20 mx-auto">
            <Check size={24} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">All Tasks Completed</h3>
            <p className="text-xs text-slate-500 dark:text-slate-450 mt-1 font-medium">No items require administrative approval at this time.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* 1. Schedule Adjustments */}
          {pendingSchedules.length > 0 && (
            <div className="bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800 rounded-2xl p-5 space-y-4 shadow-sm">
              <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex justify-between items-center border-b border-slate-100 dark:border-zinc-800 pb-2 font-sans">
                <span>Schedule Adjustments</span>
                <span className="bg-rose-600 text-white text-[9px] font-black rounded-full px-2 py-0.5">{pendingSchedules.length}</span>
              </h3>
              <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                {pendingSchedules.map(req => (
                  <div key={req.id} className="bg-slate-50 dark:bg-zinc-950 border border-slate-150 dark:border-zinc-855 rounded-xl p-3 flex justify-between items-center gap-3 shadow-sm">
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{req.trainerName}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">{req.courseName}</p>
                      <p className="text-[9px] text-slate-400 dark:text-slate-500 font-semibold">{req.requestedDate} • {req.requestedStartTime} - {req.requestedEndTime}</p>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <button
                        onClick={() => reviewScheduleChange(req.id, 'Approved', 'Approved via approval center.')}
                        className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded transition shadow-sm"
                        title="Approve"
                      >
                        <Check size={12} />
                      </button>
                      <button
                        onClick={() => reviewScheduleChange(req.id, 'Rejected', 'Rejected via approval center.')}
                        className="p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded transition shadow-sm"
                        title="Reject"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. Attendance Corrections */}
          {pendingAttendance.length > 0 && (
            <div className="bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800 rounded-2xl p-5 space-y-4 shadow-sm">
              <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex justify-between items-center border-b border-slate-100 dark:border-zinc-800 pb-2 font-sans">
                <span>Attendance Overrides</span>
                <span className="bg-rose-600 text-white text-[9px] font-black rounded-full px-2 py-0.5">{pendingAttendance.length}</span>
              </h3>
              <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                {pendingAttendance.map(rec => (
                  <div key={rec.id} className="bg-slate-50 dark:bg-zinc-950 border border-slate-150 dark:border-zinc-855 rounded-xl p-3 flex justify-between items-center gap-3 shadow-sm">
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{rec.trainerName}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">{rec.siteName}</p>
                      <p className="text-[9px] text-amber-600 dark:text-amber-455 font-bold">Checked: {rec.checkInTime} (Diff: {rec.distanceFromSite}m)</p>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <button
                        onClick={() => reviewAttendance(rec.id, 'Corrected', 'Exception approved via central dashboard.')}
                        className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded transition shadow-sm"
                        title="Approve Exception"
                      >
                        <Check size={12} />
                      </button>
                      <button
                        onClick={() => reviewAttendance(rec.id, 'Rejected', 'Exception rejected.')}
                        className="p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded transition shadow-sm"
                        title="Reject Attendance"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. Expense Claims */}
          {pendingExpenses.length > 0 && (
            <div className="bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800 rounded-2xl p-5 space-y-4 shadow-sm">
              <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex justify-between items-center border-b border-slate-100 dark:border-zinc-800 pb-2 font-sans">
                <span>Reimbursement Claims</span>
                <span className="bg-rose-600 text-white text-[9px] font-black rounded-full px-2 py-0.5">{pendingExpenses.length}</span>
              </h3>
              <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                {pendingExpenses.map(exp => (
                  <div key={exp.id} className="bg-slate-50 dark:bg-zinc-950 border border-slate-150 dark:border-zinc-855 rounded-xl p-3 flex justify-between items-center gap-3 shadow-sm">
                    <div className="space-y-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{exp.trainerName}</p>
                      <p className="text-[9px] text-slate-550 dark:text-slate-400 truncate">"{exp.purpose}"</p>
                      <p className="text-[9px] text-rose-600 dark:text-rose-455 font-bold">₹{exp.amount.toLocaleString()} • {exp.category}</p>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <button
                        onClick={() => reviewExpenseClaim(exp.id, 'Approved')}
                        className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded transition shadow-sm"
                        title="Approve Claim"
                      >
                        <Check size={12} />
                      </button>
                      <button
                        onClick={() => {
                          const remarks = window.prompt('Please provide rejection remarks / reason for this claim:');
                          if (remarks !== null) {
                            reviewExpenseClaim(exp.id, 'Rejected', remarks.trim() || 'Claim rejected via Central Approval Console.');
                          }
                        }}
                        className="p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded transition shadow-sm"
                        title="Reject Claim"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. Payroll runs */}
          {pendingPayroll.length > 0 && (
            <div className="bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800 rounded-2xl p-5 space-y-4 shadow-sm">
              <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex justify-between items-center border-b border-slate-100 dark:border-zinc-800 pb-2 font-sans">
                <span>Salary Calculations Runs</span>
                <span className="bg-rose-600 text-white text-[9px] font-black rounded-full px-2 py-0.5">{pendingPayroll.length}</span>
              </h3>
              <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                {pendingPayroll.map(run => (
                  <div key={run.id} className="bg-slate-50 dark:bg-zinc-950 border border-slate-150 dark:border-zinc-855 rounded-xl p-3 flex justify-between items-center gap-3 shadow-sm">
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{run.month} Cycle Payout</p>
                      <p className="text-[9px] text-slate-500 dark:text-slate-450 font-semibold">{run.payslipsCount} slips • Total: <strong className="text-slate-700 dark:text-white">₹{run.totalAmount.toLocaleString()}</strong></p>
                    </div>
                    <button
                      onClick={() => approvePayrollRun(run.id)}
                      className="bg-rose-600 hover:bg-rose-750 text-white rounded-lg px-2.5 py-1 text-[10px] font-bold transition shrink-0 shadow-sm"
                    >
                      Approve Run
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. Corporate Quotations */}
          {pendingQuotations.length > 0 && (
            <div className="bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800 rounded-2xl p-5 space-y-4 shadow-sm">
              <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex justify-between items-center border-b border-slate-100 dark:border-zinc-800 pb-2 font-sans">
                <span>Pending Quotations</span>
                <span className="bg-rose-600 text-white text-[9px] font-black rounded-full px-2 py-0.5">{pendingQuotations.length}</span>
              </h3>
              <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                {pendingQuotations.map(quot => (
                  <div key={quot.id} className="bg-slate-50 dark:bg-zinc-950 border border-slate-150 dark:border-zinc-855 rounded-xl p-3 flex justify-between items-center gap-3 shadow-sm">
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{quot.customerName}</p>
                      <p className="text-[9px] text-slate-500 dark:text-slate-450 font-semibold">Ref: {quot.quotationNumber} • Total: ₹{quot.totalAmount.toLocaleString()}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateQuotationStatus(quot.id, 'Accepted')}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1 rounded text-[9px] font-bold transition shadow-sm"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => updateQuotationStatus(quot.id, 'Rejected')}
                        className="bg-rose-600 hover:bg-rose-700 text-white px-2 py-1 rounded text-[9px] font-bold transition shadow-sm"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 6. Invoice approval */}
          {pendingInvoices.length > 0 && (
            <div className="bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800 rounded-2xl p-5 space-y-4 shadow-sm">
              <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex justify-between items-center border-b border-slate-100 dark:border-zinc-800 pb-2 font-sans">
                <span>Tax Invoices Drafts</span>
                <span className="bg-rose-600 text-white text-[9px] font-black rounded-full px-2 py-0.5">{pendingInvoices.length}</span>
              </h3>
              <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                {pendingInvoices.map(inv => (
                  <div key={inv.id} className="bg-slate-50 dark:bg-zinc-950 border border-slate-150 dark:border-zinc-855 rounded-xl p-3 flex justify-between items-center gap-3 shadow-sm">
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{inv.customerName}</p>
                      <p className="text-[9px] text-slate-500 dark:text-slate-450 font-semibold">Inv: {inv.invoiceNumber} • ₹{inv.totalAmount.toLocaleString()}</p>
                    </div>
                    <button
                      onClick={() => issueInvoice(inv.id)}
                      className="bg-rose-600 hover:bg-rose-750 text-white rounded-lg px-2.5 py-1 text-[10px] font-bold transition shrink-0 shadow-sm"
                    >
                      Issue Invoice
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 7. Trainer Documents */}
          {pendingDocs.length > 0 && (
            <div className="bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800 rounded-2xl p-5 space-y-4 shadow-sm">
              <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex justify-between items-center border-b border-slate-100 dark:border-zinc-800 pb-2 font-sans">
                <span>Trainer Documents for Verification</span>
                <span className="bg-purple-600 text-white text-[9px] font-black rounded-full px-2 py-0.5">{pendingDocs.length}</span>
              </h3>
              <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                {pendingDocs.map(({ trainer: tr, doc: d }, idx) => (
                  <div key={`${tr.id}-${d.documentNumber}-${idx}`} className="bg-slate-50 dark:bg-zinc-950 border border-slate-150 dark:border-zinc-855 rounded-xl p-3 flex justify-between items-center gap-3 shadow-sm">
                    <div className="space-y-0.5 min-w-0">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{tr.name}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{d.name} ({d.category})</p>
                      <p className="text-[9px] font-mono text-purple-600 dark:text-purple-400">Ref: {d.documentNumber}</p>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <button
                        onClick={() => updateTrainerDocumentStatus(tr.id, d.documentNumber, 'Approved')}
                        className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded transition shadow-sm"
                        title="Approve Document"
                      >
                        <Check size={12} />
                      </button>
                      <button
                        onClick={() => {
                          const remarks = window.prompt('Provide rejection remarks for this document:');
                          if (remarks !== null) {
                            updateTrainerDocumentStatus(tr.id, d.documentNumber, 'Rejected', remarks.trim() || 'Document rejected.');
                          }
                        }}
                        className="p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded transition shadow-sm"
                        title="Reject Document"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
};

export default Approvals;
