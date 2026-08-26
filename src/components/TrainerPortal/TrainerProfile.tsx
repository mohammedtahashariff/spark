import React from 'react';
import { useDatabase } from '../../context/DatabaseContext';
import { FileText, CheckCircle, Clock, ShieldCheck, Mail, Phone } from 'lucide-react';

const TrainerProfile: React.FC = () => {
  const { currentUser, trainers } = useDatabase();
  const trainer = trainers.find(t => t.email === currentUser?.email) || trainers[0];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Approved':
        return <CheckCircle size={14} className="text-emerald-400" />;
      case 'Review':
        return <Clock size={14} className="text-amber-400" />;
      default:
        return <FileText size={14} className="text-slate-500" />;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'Approved':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'Review':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      default:
        return 'bg-slate-800 text-slate-400 border border-slate-750';
    }
  };

  return (
    <div className="space-y-6 text-slate-750 dark:text-slate-350 flex flex-col h-full transition-colors duration-200">
      <div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-white tracking-wide">My Trainer Profile</h2>
        <p className="text-xs text-slate-500 dark:text-slate-455 mt-0.5 font-medium">Manage your personal credentials, professional skillsets, and digital folder uploads.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-grow overflow-hidden">
        
        {/* Left 1 Col: Profile details Card */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800/80 rounded-2xl p-5 shadow-sm flex flex-col justify-between items-center text-center">
          <div className="space-y-4 w-full flex flex-col items-center">
            
            <div className="relative">
              <img
                src={currentUser?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80"}
                alt="Trainer profile picture"
                className="w-20 h-20 rounded-full border-2 border-slate-200 dark:border-zinc-700 shadow-md object-cover"
              />
              <span className="absolute -top-1.5 -right-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-rose-500/15 text-rose-600 dark:text-rose-500 border border-rose-500/20 shadow-sm">
                {trainer.status}
              </span>
            </div>

            <div>
              <h3 className="text-md font-bold text-slate-800 dark:text-white leading-tight">{trainer.name}</h3>
              <p className="text-[10px] text-slate-550 dark:text-slate-500 font-bold uppercase tracking-wider mt-1">Professional Education Trainer</p>
            </div>

            {/* Contacts details list */}
            <div className="pt-4 border-t border-slate-105 dark:border-zinc-800 w-full text-left space-y-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-2">
                <Mail size={14} className="text-slate-400 dark:text-slate-500 shrink-0" />
                <span className="truncate">{trainer.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={14} className="text-slate-400 dark:text-slate-500 shrink-0" />
                <span>{trainer.phone}</span>
              </div>
            </div>

            {/* Expertise skill tags */}
            <div className="pt-4 border-t border-slate-105 dark:border-zinc-800 w-full text-left space-y-2 font-semibold">
              <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Expertise & Skills</p>
              <div className="flex flex-wrap gap-1.5">
                {trainer.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="bg-slate-50 dark:bg-zinc-950 border border-slate-150 dark:border-zinc-800 rounded-lg px-2.5 py-0.5 text-[9px] font-bold text-slate-650 dark:text-slate-350"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

          </div>

          <div className="flex items-center gap-1 text-[9px] text-slate-455 dark:text-slate-500 font-bold uppercase tracking-wider pt-6 border-t border-slate-105 dark:border-zinc-800 w-full justify-center">
            <ShieldCheck size={14} className="text-slate-400 dark:text-slate-550" />
            <span>Secure Enterprise Vault</span>
          </div>
        </div>

        {/* Right 2 Cols: Digital Folder compliance list */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800/80 rounded-2xl p-5 shadow-sm flex flex-col h-full">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-4">Digital Compliance Document Folder</h3>
          
          <div className="flex-1 overflow-y-auto space-y-3.5 custom-scrollbar pr-1">
            {trainer.documents.map((doc, idx) => (
              <div
                key={idx}
                className="bg-slate-50 dark:bg-zinc-950 border border-slate-150 dark:border-zinc-855 rounded-2xl p-4 flex justify-between items-center hover:border-slate-300 dark:hover:border-zinc-800 transition shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-white dark:bg-zinc-900 rounded-xl text-rose-500 border border-slate-205 dark:border-zinc-800">
                    <FileText size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">{doc.name}</h4>
                    <p className="text-[9px] text-slate-500 dark:text-slate-450 mt-1 font-semibold">Ref ID: {doc.documentNumber} • Uploaded: {doc.uploadedAt}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${getStatusClass(doc.status)}`}>
                    {doc.status}
                  </span>
                  {getStatusIcon(doc.status)}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default TrainerProfile;
