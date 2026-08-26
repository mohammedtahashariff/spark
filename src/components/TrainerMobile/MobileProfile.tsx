import React from 'react';
import { useDatabase } from '../../context/DatabaseContext';
import { FileText, CheckCircle, Clock, ShieldCheck, Mail, Phone } from 'lucide-react';


interface MobileProfileProps {
  setActiveTab: (tab: 'dashboard' | 'schedule' | 'attendance' | 'profile' | 'expenses' | 'salary' | 'report') => void;
}

const MobileProfile: React.FC<MobileProfileProps> = ({ setActiveTab }) => {
  const { currentUser, trainers } = useDatabase();
  const trainer = trainers.find(t => t.email === currentUser?.email) || trainers[0];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Approved':
        return <CheckCircle size={12} className="text-emerald-400" />;
      case 'Review':
        return <Clock size={12} className="text-amber-400" />;
      default:
        return <FileText size={12} className="text-slate-500" />;
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
    <div className="space-y-4 pb-8 text-white">
      {/* Profile Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col items-center text-center shadow-lg relative overflow-hidden">
        <div className="absolute top-3 right-3">
          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-500/15 text-rose-455 border border-rose-500/20">
            {trainer.status}
          </span>
        </div>

        <img
          src={currentUser?.avatar || "https://via.placeholder.com/150"}
          alt="Trainer profile"
          className="w-16 h-16 rounded-full border border-slate-700 shadow-md object-cover"
        />

        <h3 className="text-sm font-bold text-white mt-2.5">{trainer.name}</h3>
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Professional Trainer</p>

        {/* Contact details */}
        <div className="mt-3.5 pt-3 border-t border-slate-850 w-full grid grid-cols-2 gap-2 text-left">
          <div className="flex items-center gap-1 text-[9px] text-slate-400 font-semibold min-w-0">
            <Mail size={11} className="text-slate-500 shrink-0" />
            <span className="truncate">{trainer.email}</span>
          </div>
          <div className="flex items-center gap-1 text-[9px] text-slate-400 font-semibold">
            <Phone size={11} className="text-slate-500 shrink-0" />
            <span>{trainer.phone}</span>
          </div>
        </div>
      </div>

      {/* Sub Routing Links */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-2 text-xs">
        <button
          onClick={() => setActiveTab('report')}
          className="w-full py-1.5 flex justify-between items-center text-slate-300 hover:text-white border-b border-slate-850 pb-2"
        >
          <span className="font-semibold">Submit Class Delivery Report</span>
          <span className="text-[10px] text-rose-500 font-bold">Open ➜</span>
        </button>
        <button
          onClick={() => setActiveTab('expenses')}
          className="w-full py-1.5 flex justify-between items-center text-slate-300 hover:text-white border-b border-slate-850 pb-2"
        >
          <span className="font-semibold">Claim Reimbursements</span>
          <span className="text-[10px] text-rose-500 font-bold">Open ➜</span>
        </button>
        <button
          onClick={() => setActiveTab('salary')}
          className="w-full py-1.5 flex justify-between items-center text-slate-300 hover:text-white"
        >
          <span className="font-semibold">Earnings & Payslips</span>
          <span className="text-[10px] text-rose-500 font-bold">Open ➜</span>
        </button>
      </div>

      {/* Skills tags */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-2.5">
        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Expertise & Skills</h4>
        <div className="flex flex-wrap gap-1.5">
          {trainer.skills.map((skill, index) => (
            <span
              key={index}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-0.5 text-[9px] font-bold text-slate-350"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>

      {/* Trainer Digital Document File */}
      <div className="space-y-2.5">
        <h4 className="text-[10px] font-bold text-slate-450 uppercase tracking-wider px-1">Digital Trainer File</h4>
        
        <div className="space-y-2">
          {trainer.documents.map((doc, idx) => (
            <div
              key={idx}
              className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex justify-between items-center hover:border-slate-750 transition"
            >
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-slate-950 rounded-lg text-rose-455 border border-slate-850">
                  <FileText size={14} />
                </div>
                <div>
                  <p className="text-xs font-bold text-white leading-tight">{doc.name}</p>
                  <p className="text-[8px] text-slate-500 mt-1">Ref: {doc.documentNumber} • {doc.uploadedAt}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                <span className={`px-1.5 py-0.5 rounded-[4px] text-[8px] font-bold ${getStatusClass(doc.status)}`}>
                  {doc.status}
                </span>
                {getStatusIcon(doc.status)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Privacy compliance badge */}
      <div className="flex items-center justify-center gap-1 text-[9px] text-slate-650 pt-2 font-bold uppercase tracking-wider">
        <ShieldCheck size={12} className="text-slate-650" />
        <span>Secure Private Storage</span>
      </div>
    </div>
  );
};

export default MobileProfile;
