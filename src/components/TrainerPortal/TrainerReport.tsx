import React, { useState, useEffect } from 'react';
import { useDatabase } from '../../context/DatabaseContext';
import { BookOpen, CheckCircle, Clock, Users, ShieldAlert } from 'lucide-react';


const TrainerReport: React.FC = () => {
  const { currentUser, schedules, trainers, submitClassReport } = useDatabase();
  const todayStr = new Date().toISOString().split('T')[0];

  const trainer = trainers.find(t => t.email === currentUser?.email) || trainers[0];
  
  // Find completed classes that do not have a report filed yet
  const reportableClasses = schedules.filter(
    s => s.trainerId === trainer.id && !s.report
  );

  // Find completed classes that have a report filed
  const completedReports = schedules.filter(
    s => s.trainerId === trainer.id && s.report
  );

  const [selectedScheduleId, setSelectedScheduleId] = useState('');
  
  // Form State
  const [topic, setTopic] = useState('');
  const [hours, setHours] = useState('');
  const [students, setStudents] = useState('');
  const [issues, setIssues] = useState('');
  const [remarks, setRemarks] = useState('');
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (reportableClasses.length > 0 && !selectedScheduleId) {
      setSelectedScheduleId(reportableClasses[0].id);
    }
  }, [reportableClasses, selectedScheduleId]);

  useEffect(() => {
    if (selectedScheduleId) {
      const cls = schedules.find(s => s.id === selectedScheduleId);
      if (cls) {
        setHours(cls.hours.toString());
        setTopic(cls.courseName);
      }
    }
  }, [selectedScheduleId, schedules]);

  const handleSubmitReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedScheduleId) return;

    if (!topic.trim() || !hours || !students) {
      setErrorMsg('Topic, hours, and student count are required.');
      return;
    }

    submitClassReport(selectedScheduleId, {
      scheduleId: selectedScheduleId,
      date: todayStr,
      topicCovered: topic.trim(),
      deliveredHours: Number(hours),
      studentCount: Number(students),
      issues: issues.trim() || 'No issues reported.',
      remarks: remarks.trim()
    });

    setSuccess(true);
    setErrorMsg('');
    setTimeout(() => {
      setSuccess(false);
      setSelectedScheduleId('');
      setTopic('');
      setHours('');
      setStudents('');
      setIssues('');
      setRemarks('');
    }, 2000);
  };

  return (
    <div className="space-y-6 text-slate-700 dark:text-slate-350 flex flex-col h-full transition-colors duration-200">
      <div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-white tracking-wide">Class Delivery Reports</h2>
        <p className="text-xs text-slate-500 dark:text-slate-455 mt-0.5 font-medium">Submit detailed lecture reports containing topic coverage, class duration, student count, and operational issues.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-grow overflow-hidden">
        
        {/* Left 1 Col: Create Report Form */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800/80 rounded-2xl p-5 shadow-sm flex flex-col h-full justify-between">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5 border-b border-slate-100 dark:border-zinc-800 pb-2 font-sans">
              <BookOpen size={16} className="text-rose-500" />
              <span>Submit Training Report</span>
            </h3>

            {reportableClasses.length === 0 && !success ? (
              <div className="flex flex-col items-center justify-center text-center py-20 text-slate-400 dark:text-slate-500 space-y-2">
                <CheckCircle size={28} className="text-emerald-500" />
                <p className="text-xs font-bold text-slate-800 dark:text-slate-300">All Reports Filed</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-450 max-w-[200px] mt-0.5 font-medium">Every completed training session in your schedule already has its report filed.</p>
              </div>
            ) : success ? (
              <div className="bg-slate-50 dark:bg-zinc-950 border border-slate-150 dark:border-zinc-855 rounded-xl p-6 flex flex-col items-center justify-center text-center space-y-4 shadow py-12">
                <div className="w-10 h-10 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-500 border border-emerald-500/20">
                  <CheckCircle size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-white">Report Filed Successfully</h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-450 mt-1 font-semibold">Class hours logged in payroll calculation ledger.</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitReport} className="space-y-3.5 text-xs text-slate-700 dark:text-slate-300">
                {errorMsg && (
                  <div className="bg-rose-500/15 border border-rose-500/30 text-rose-650 dark:text-rose-400 p-2 rounded-lg font-medium">
                    {errorMsg}
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[9px]">Select Completed Class *</label>
                  <select
                    value={selectedScheduleId}
                    onChange={(e) => setSelectedScheduleId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg p-2.5 outline-none focus:border-rose-600 text-slate-850 dark:text-white font-semibold text-xs"
                  >
                    {reportableClasses.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.courseName} ({c.date})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[9px]">Topic Covered *</label>
                  <input
                    type="text"
                    required
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g. Relational databases, SQL Joins"
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg p-2 text-slate-800 dark:text-white outline-none focus:border-rose-600 font-semibold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[9px] flex items-center gap-1">
                      <Clock size={11} /> Duration (Hours) *
                    </label>
                    <input
                      type="number"
                      required
                      value={hours}
                      onChange={(e) => setHours(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg p-2 text-slate-800 dark:text-white outline-none focus:border-rose-600 font-semibold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[9px] flex items-center gap-1">
                      <Users size={11} /> Student Count *
                    </label>
                    <input
                      type="number"
                      required
                      value={students}
                      onChange={(e) => setStudents(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg p-2 text-slate-800 dark:text-white outline-none focus:border-rose-600 font-semibold"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[9px] flex items-center gap-1">
                    <ShieldAlert size={12} className="text-amber-500 shrink-0" />
                    <span>Issues / Anomalies</span>
                  </label>
                  <textarea
                    value={issues}
                    onChange={(e) => setIssues(e.target.value)}
                    placeholder="e.g. Internet drop for 10 minutes (optional)"
                    rows={2}
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg p-2 text-slate-850 dark:text-white outline-none focus:border-rose-600 resize-none font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[9px]">General Remarks</label>
                  <textarea
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Students completed assignments..."
                    rows={2}
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg p-2 text-slate-850 dark:text-white outline-none focus:border-rose-600 resize-none font-semibold"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-rose-600 hover:bg-rose-700 text-white rounded-xl py-2.5 font-bold transition shadow"
                >
                  Submit Class Report
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Right 2 Cols: Submitted Reports Grid */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800/80 rounded-2xl p-5 shadow-sm flex flex-col h-full">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-4">Historical Class Logs Ledger</h3>
          
          <div className="flex-grow overflow-y-auto custom-scrollbar pr-1">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-zinc-950 border-b border-slate-150 dark:border-zinc-800 text-slate-500 dark:text-slate-450 uppercase tracking-wider text-[9px] font-bold">
                  <th className="p-3">Class Date</th>
                  <th className="p-3">Topic Covered</th>
                  <th className="p-3 text-center">Hours</th>
                  <th className="p-3 text-center">Students</th>
                  <th className="p-3">Issues / Anomalies</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                {completedReports.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-950/20 transition">
                    <td className="p-3 font-semibold text-slate-650 dark:text-slate-400">{c.date}</td>
                    <td className="p-3">
                      <p className="font-bold text-slate-800 dark:text-slate-200">{c.report?.topicCovered}</p>
                      <p className="text-[9px] text-slate-500 dark:text-slate-550 mt-0.5 font-semibold">{c.courseName}</p>
                    </td>
                    <td className="p-3 text-center font-bold text-slate-800 dark:text-slate-200">{c.report?.deliveredHours} hrs</td>
                    <td className="p-3 text-center text-slate-650 dark:text-slate-400 font-semibold">{c.report?.studentCount}</td>
                    <td className="p-3 text-slate-600 dark:text-slate-400 leading-normal max-w-[200px] truncate font-medium" title={c.report?.issues}>
                      {c.report?.issues}
                    </td>
                  </tr>
                ))}
                {completedReports.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-slate-400 dark:text-slate-500 font-semibold">No class delivery logs filed in ledger.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

export default TrainerReport;
