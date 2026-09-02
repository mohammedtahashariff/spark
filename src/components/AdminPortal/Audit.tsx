import React from 'react';
import { useDatabase } from '../../context/DatabaseContext';
import { ShieldCheck, Info } from 'lucide-react';


const Audit: React.FC = () => {
  const { auditLogs } = useDatabase();

  const getRoleClass = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'bg-red-500/10 text-rose-600 dark:text-red-400 border border-red-500/20';
      case 'md':
      case 'management':
        return 'bg-purple-500/10 text-purple-650 dark:text-purple-400 border border-purple-500/20';
      case 'coordinator':
        return 'bg-cyan-500/10 text-cyan-650 dark:text-cyan-400 border border-cyan-500/20';
      case 'hr':
        return 'bg-indigo-500/10 text-indigo-650 dark:text-indigo-400 border border-indigo-500/20';
      case 'operations':
        return 'bg-blue-500/10 text-blue-650 dark:text-blue-400 border border-blue-500/20';
      case 'finance':
        return 'bg-emerald-500/10 text-emerald-650 dark:text-emerald-400 border border-emerald-500/20';
      case 'trainer':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20';
      default:
        return 'bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-zinc-700';
    }
  };

  return (
    <div className="space-y-5 text-slate-700 dark:text-slate-350 relative h-full flex flex-col transition-colors duration-200">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-100 dark:border-zinc-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white tracking-wide">Security Audit Ledger</h2>
          <p className="text-xs text-slate-550 mt-0.5 font-medium">Immutable record of sensitive operations, logins, overrides, and parameters.</p>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
          <ShieldCheck size={14} /> SYSTEM AUDITABLE
        </div>
      </div>

      {/* Ledger Table */}
      <div className="flex-grow overflow-y-auto">
        {auditLogs.length > 0 ? (
          <div className="bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800/80 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-zinc-950 border-b border-slate-150 dark:border-zinc-800 text-slate-500 dark:text-slate-450 uppercase font-black tracking-wider text-[10px]">
                  <th className="p-4">Timestamp</th>
                  <th className="p-4">Action</th>
                  <th className="p-4">User Details</th>
                  <th className="p-4">Metadata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                {auditLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-950/20 transition">
                    <td className="p-4 text-slate-500 dark:text-slate-400 font-mono text-[10px] whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="p-4 font-bold text-slate-800 dark:text-slate-100">
                      <span className="flex items-center gap-1.5">
                        <Info size={12} className="text-blue-600 dark:text-blue-400 shrink-0" />
                        {log.action}
                      </span>
                    </td>
                    <td className="p-4 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${getRoleClass(log.role)}`}>
                          {log.role.replace('_', ' ')}
                        </span>
                        <span className="font-bold text-slate-700 dark:text-slate-200">{log.userName}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">{log.userEmail}</p>
                    </td>
                    <td className="p-4 space-y-1 text-slate-500 dark:text-slate-450 leading-relaxed max-w-sm font-medium">
                      <p className="font-bold text-slate-800 dark:text-slate-350">"{log.details}"</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">{log.deviceInfo}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-16 font-medium">Audit log is empty.</p>
        )}
      </div>
    </div>
  );
};

export default Audit;
